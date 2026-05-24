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

const messaging = getMessaging(firebaseApp);

// Handle background (app closed / not focused) push notifications
onBackgroundMessage(messaging, (payload) => {
  const { title, body } = payload.notification ?? {};
  const data = payload.data ?? {};

  self.registration.showNotification(title || 'Follow-up Reminder', {
    body: body || '',
    icon: '/pwa-192x192.svg',
    badge: '/pwa-192x192.svg',
    data,
    tag: data.lead_id ? `lead-${data.lead_id}` : 'crm-notification',
  });
});

// Click on notification → open the app at the lead detail page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const leadId = event.notification.data?.lead_id;
  const url = leadId ? `/leads/${leadId}` : '/';
  event.waitUntil(clients.openWindow(url));
});
