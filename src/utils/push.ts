import { supabase } from '../supabase';

export const webPushPublicKey = process.env.VAPID_PUBLIC_KEY || 'BKBmjGF6XWxFd6UQtsQlUgPs54dERDDqs20oMNjccb5z4irQTxysbZwSW7j3D3aeockUGiqlz6Ert5PagZtcWcs';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function savePushSubscription(subscription: PushSubscription, email?: string) {
  try {
    const rawSubJson = subscription.toJSON ? subscription.toJSON() : JSON.parse(JSON.stringify(subscription));
    const endpoint = subscription.endpoint || rawSubJson.endpoint;

    if (supabase && endpoint) {
      const { data: existing, error: selectErr } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('endpoint', endpoint)
        .maybeSingle();

      if (selectErr) {
        console.warn('Supabase select note:', selectErr.message);
      }

      if (!existing) {
        const { error: insertErr } = await supabase.from('push_subscriptions').insert([{
          endpoint: endpoint,
          subscription: rawSubJson,
          email: email || 'contact@ykyash.in',
          user_agent: navigator.userAgent,
          created_at: new Date().toISOString()
        }]);
        if (insertErr) console.error('Error inserting push subscription:', insertErr);
      } else {
        const { error: updateErr } = await supabase
          .from('push_subscriptions')
          .update({
            email: email || 'contact@ykyash.in',
            subscription: rawSubJson,
            user_agent: navigator.userAgent
          })
          .eq('endpoint', endpoint);
        if (updateErr) console.error('Error updating push subscription:', updateErr);
      }
    }
  } catch (error) {
    console.error('Failed to save push subscription:', error);
  }
}

export async function subscribeToPush(forceRenew: boolean = false): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (subscription && forceRenew) {
      await subscription.unsubscribe();
      subscription = null; // force it to recreate below
    }

    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(webPushPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    return subscription;
  } catch (error) {
    console.error('Service Worker / Push registration failed:', error);
    return null;
  }
}

export async function sendPushNotification(subscription: PushSubscription, title: string, body: string, url: string = '/') {
  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription,
        title,
        body,
        url
      }),
    });
  } catch (err) {
    console.error('Failed to trigger push notification:', err);
  }
}

export async function sendNotificationToUser(email: string, title: string, body: string, url: string = '/') {
  if (!email) return;
  try {
    if (!supabase) return;
    const { data: rows } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('email', email);

    if (rows && rows.length > 0) {
      const promises = rows.map(subRow => {
        const subObj = typeof subRow.subscription === 'string' ? JSON.parse(subRow.subscription) : subRow.subscription;
        return fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subObj, title, body, url })
        }).catch(err => console.error("Error pushing to sub", err));
      });
      await Promise.all(promises);
    }
  } catch (e) {
    console.error("Failed to broadcast push to user", e);
  }
}

export async function broadcastNotification(title: string, body: string, url: string = '/') {
  try {
    if (!supabase) return;
    const { data: rows } = await supabase
      .from('push_subscriptions')
      .select('subscription');

    if (rows && rows.length > 0) {
      const promises = rows.map(subRow => {
        const subObj = typeof subRow.subscription === 'string' ? JSON.parse(subRow.subscription) : subRow.subscription;
        return fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subObj, title, body, url })
        }).catch(err => console.error("Error pushing to sub", err));
      });
      await Promise.all(promises);
    }
  } catch (e) {
    console.error("Failed to broadcast push to all users", e);
  }
}
