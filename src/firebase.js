import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };

// Register the Vite-built service worker for FCM.
// In dev, VitePWA serves it at /dev-sw.js as a module.
// In prod, it's bundled to /sw.js as a classic script.
export async function getSwRegistration() {
  if (!('serviceWorker' in navigator)) return undefined;

  const swUrl = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';
  const swType = import.meta.env.DEV ? 'module' : 'classic';

  return navigator.serviceWorker.register(swUrl, {
    scope: '/',
    type: swType,
  });
}
