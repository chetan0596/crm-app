import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// Required by VitePWA injectManifest — do not remove
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Initialize Firebase inside the service worker using Vite env vars
const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

let messaging = null;
try {
  messaging = getMessaging(firebaseApp);
} catch {
  // In dev (vite-plugin-pwa dev-sw) the messaging-sw service may not be
  // registered yet when this module executes. Skip background push there;
  // production sw.js is bundled by injectManifest and registers correctly.
}

// Handle background (app closed / not focused) push notifications
if (messaging) onBackgroundMessage(messaging, (payload) => {
  const { title, body } = payload.notification ?? {};
  const data = payload.data ?? {};

  self.registration.showNotification(title || 'Follow-up Reminder', {
    body: body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data,
    tag: data.lead_id ? `lead-${data.lead_id}` : 'crm-notification',
  });
});

// Click on notification → open the app at the lead detail page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const leadId = event.notification.data?.lead_id;
  const url = leadId ? `/leads/${leadId}` : '/';
  event.waitUntil(self.clients.openWindow(url));
});
