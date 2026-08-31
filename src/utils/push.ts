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

// Lightweight AES-like obfuscation / encryption for client-side cookies
const COOKIE_NAME = 'yk_push_token_v1';

function encryptCookie(text: string): string {
  try {
    const enc = encodeURIComponent(text);
    return btoa(enc.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ ((i % 5) + 13))).join(''));
  } catch {
    return btoa(text);
  }
}

function decryptCookie(enc: string): string {
  try {
    const raw = atob(enc);
    const dec = raw.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ ((i % 5) + 13))).join('');
    return decodeURIComponent(dec);
  } catch {
    try { return atob(enc); } catch { return ''; }
  }
}

export function setEncryptedPushCookie(endpoint: string, data?: any) {
  try {
    const payload = JSON.stringify({
      endpoint,
      savedAt: Date.now(),
      data: data || null
    });
    const encrypted = encryptCookie(payload);
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(encrypted)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
  } catch (err) {
    console.warn('Could not set encrypted cookie:', err);
  }
}

export function getEncryptedPushCookie(): { endpoint: string; savedAt: number } | null {
  try {
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
      c = c.trim();
      if (c.startsWith(`${COOKIE_NAME}=`)) {
        const val = decodeURIComponent(c.substring(COOKIE_NAME.length + 1));
        const decrypted = decryptCookie(val);
        return JSON.parse(decrypted);
      }
    }
  } catch (err) {
    console.warn('Could not read encrypted cookie:', err);
  }
  return null;
}

/**
 * Automatically checks if this device is already subscribed and saved in Supabase
 */
export async function checkDeviceSubscriptionStatus(): Promise<{ isSubscribed: boolean; isSavedInSupabase: boolean; endpoint?: string }> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { isSubscribed: false, isSavedInSupabase: false };
    }

    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) {
      return { isSubscribed: false, isSavedInSupabase: false };
    }

    const sub = await reg.pushManager.getSubscription();
    if (!sub) {
      return { isSubscribed: false, isSavedInSupabase: false };
    }

    const cookieData = getEncryptedPushCookie();
    const hasCookieMatch = Boolean(cookieData && cookieData.endpoint === sub.endpoint);

    // Verify against Supabase
    let isSavedInSupabase = hasCookieMatch;
    if (supabase) {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('endpoint', sub.endpoint)
        .maybeSingle();

      if (data?.id) {
        isSavedInSupabase = true;
        // ensure cookie is saved with encryption
        setEncryptedPushCookie(sub.endpoint, { id: data.id });
      } else if (!isSavedInSupabase) {
        // Auto-heal: If browser has subscription but Supabase missed it, save it now!
        await savePushSubscription(sub, 'contact@ykyash.in');
        isSavedInSupabase = true;
      }
    }

    return {
      isSubscribed: true,
      isSavedInSupabase,
      endpoint: sub.endpoint
    };
  } catch (err) {
    console.error('Error checking device subscription:', err);
    return { isSubscribed: false, isSavedInSupabase: false };
  }
}

export async function savePushSubscription(subscription: PushSubscription, email?: string) {
  try {
    const rawSubJson = subscription.toJSON ? subscription.toJSON() : JSON.parse(JSON.stringify(subscription));
    const endpoint = subscription.endpoint || rawSubJson.endpoint;

    // Save into encrypted cookie immediately
    if (endpoint) {
      setEncryptedPushCookie(endpoint, rawSubJson);
    }

    // 1. Primary: Save via Serverless Backend API
    try {
      await fetch('/api/push/save-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: rawSubJson,
          email: email || 'contact@ykyash.in',
          userAgent: navigator.userAgent
        })
      });
    } catch (apiErr) {
      console.warn('Server push save note:', apiErr);
    }

    // 2. Secondary: Direct Supabase Client Upsert
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
