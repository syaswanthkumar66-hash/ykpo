import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';

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
    const subStr = JSON.stringify(subscription);
    const subsRef = collection(db, 'push_subscriptions');
    const q = query(subsRef, where('endpoint', '==', subscription.endpoint));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Save new subscription
      await addDoc(subsRef, {
        endpoint: subscription.endpoint,
        subscription: subStr,
        email: email || null,
        userAgent: navigator.userAgent,
        createdAt: new Date().toISOString()
      });
    } else {
      // Update existing subscription with the current email
      if (email) {
        querySnapshot.forEach(async (document) => {
          await updateDoc(document.ref, { 
            email: email,
            subscription: subStr // Update the subscription key just in case it refreshed
          });
        });
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
    const q = query(collection(db, 'push_subscriptions'), where('email', '==', email));
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map(doc => {
      const subData = doc.data();
      if (subData.subscription) {
        const subObj = typeof subData.subscription === 'string' ? JSON.parse(subData.subscription) : subData.subscription;
        return fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subObj, title, body, url })
        }).catch(err => console.error("Error pushing to sub", err));
      }
    });
    await Promise.all(promises);
  } catch (e) {
    console.error("Failed to broadcast push to user", e);
  }
}

export async function broadcastNotification(title: string, body: string, url: string = '/') {
  try {
    const snapshot = await getDocs(collection(db, 'push_subscriptions'));
    const promises = snapshot.docs.map(doc => {
      const subData = doc.data();
      if (subData.subscription) {
        const subObj = typeof subData.subscription === 'string' ? JSON.parse(subData.subscription) : subData.subscription;
        return fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subObj, title, body, url })
        }).catch(err => console.error("Error pushing to sub", err));
      }
    });
    await Promise.all(promises);
  } catch (e) {
    console.error("Failed to broadcast push to all users", e);
  }
}
