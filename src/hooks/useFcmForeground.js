import { useEffect } from 'react';
import { onMessage } from 'firebase/messaging';
import { messaging } from '../firebase';

/**
 * Listen for Firebase Cloud Messaging notifications while the app
 * is in the foreground. Displays a browser notification when a
 * message arrives.
 */
export default function useFcmForeground() {
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      const { title, body } = payload.notification ?? {};
      const data = payload.data ?? {};

      // Show a browser notification even when the app is focused.
      // The Notification API is available because the user already
      // granted permission during FCM token registration.
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title || 'CRM Notification', {
            body: body || '',
            icon: '/pwa-192x192.svg',
            badge: '/pwa-192x192.svg',
            tag: data.lead_id ? `lead-${data.lead_id}` : 'crm-notification',
            data,
          });
        });
      }
    });

    return () => unsubscribe?.();
  }, []);
}
