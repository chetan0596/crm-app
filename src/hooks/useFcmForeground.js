import { useEffect } from 'react';

/**
 * Listen for Firebase Cloud Messaging notifications while the app
 * is in the foreground. Displays a browser notification when a
 * message arrives.
 *
 * Firebase is dynamically imported so the SDK stays out of the
 * initial bundle for anonymous visitors (e.g. the landing page).
 */
export default function useFcmForeground() {
  useEffect(() => {
    if (!localStorage.getItem('auth_token')) return;

    let unsubscribe;
    (async () => {
      const [{ messaging }, { onMessage }] = await Promise.all([
        import('../firebase'),
        import('firebase/messaging'),
      ]);
      if (!messaging) return;

      unsubscribe = onMessage(messaging, (payload) => {
        const { title, body } = payload.notification ?? {};
        const data = payload.data ?? {};

        // Show a browser notification even when the app is focused.
        // The Notification API is available because the user already
        // granted permission during FCM token registration.
        if (Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title || 'CRM Notification', {
              body: body || '',
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              tag: data.lead_id ? `lead-${data.lead_id}` : 'crm-notification',
              data,
            });
          });
        }
      });
    })();

    return () => unsubscribe?.();
  }, []);
}
