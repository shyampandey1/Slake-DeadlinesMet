"use client";

import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

export function useFCM() {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const requestPermissionAndGetToken = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const messaging = getMessaging(app);
          const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
          });

          if (token) {
            setFcmToken(token);
            // Save token to user's firestore document
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              fcmTokens: arrayUnion(token)
            });
            console.log("FCM Token generated and saved.");
          }
        } else {
          console.log("Notification permission not granted.");
        }
      } catch (error) {
        console.error("An error occurred while retrieving token. ", error);
      }
    };

    requestPermissionAndGetToken();
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const messaging = getMessaging(app);
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('Message received. ', payload);
          // Do not trigger system push if app is open
        });
        return () => unsubscribe();
      } catch (e) {
        console.warn("FCM messaging error in foreground", e);
      }
    }
  }, []);

  return { fcmToken };
}
