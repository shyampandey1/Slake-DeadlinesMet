"use client";

import { useEffect, useState } from 'react';
import { getMessaging, onMessage, isSupported } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { syncFcmToken } from '@/lib/fcm';
import { useAuth } from '@/hooks/useAuth';

export function useFCM() {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (!user || 'isMockUser' in user) return;

    const init = async () => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission === 'granted') {
        const token = await syncFcmToken(user.uid);
        if (token) setFcmToken(token);
      }
    };

    init().catch(() => {});
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    let unsubscribe: (() => void) | undefined;

    isSupported()
      .then((supported) => {
        if (!supported) return;
        const messaging = getMessaging(app);
        unsubscribe = onMessage(messaging, () => {
          // App is open; NotificationScheduler handles active foreground alerts
        });
      })
      .catch((e) => {
        console.warn("FCM messaging error in foreground", e);
      });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return { fcmToken };
}
