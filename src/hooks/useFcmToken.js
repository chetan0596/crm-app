import { useEffect } from 'react';
import api from '../api';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const FCM_TOKEN_KEY = 'fcm_token_registered';

export default function useFcmToken() {
  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem('auth_token');
    if (!isLoggedIn) return;

    // Only register once per browser session (re-register if token was never sent)
    if (sessionStorage.getItem(FCM_TOKEN_KEY)) return;

    registerFcmToken();
  }, []);
}

async function registerFcmToken() {
  try {
    if (!('Notification' in window)) return;
    if (!('serviceWorker' in navigator)) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Dynamically import firebase to avoid crashing when not installed yet
    const { messaging, getToken, getSwRegistration } = await import('../firebase');

    const registration = await getSwRegistration();

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return;

    // Send token to backend
    await api.post('/notifications/fcm-token', { fcm_token: token });
    sessionStorage.setItem(FCM_TOKEN_KEY, '1');
  } catch (err) {
    console.warn('FCM token registration failed:', err?.message ?? err);
  }
}
