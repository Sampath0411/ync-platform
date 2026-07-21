import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { pushAPI } from '@/api/client';
import { getSocket, disconnectSocket } from '@/utils/socket';

export function useSocket() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const socket = getSocket();
      return () => { disconnectSocket(); };
    }
  }, [isAuthenticated]);
}

export function usePushNotifications() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    let swRegistration = null;

    async function registerSW() {
      try {
        swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered');

        // Subscribe to push if VAPID key is available
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (vapidKey) {
          const subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });

          await pushAPI.subscribe({
            endpoint: subscription.endpoint,
            keys: subscription.toJSON().keys,
          });
          console.log('Push subscribed');
        }
      } catch (err) {
        console.error('SW/Push registration error:', err);
      }
    }

    registerSW();

    return () => {
      if (swRegistration) {
        swRegistration.unregister().catch(() => {});
      }
    };
  }, [isAuthenticated]);
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
