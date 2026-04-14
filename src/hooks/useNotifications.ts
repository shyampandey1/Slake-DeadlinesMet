"use client";

import { useEffect, useState } from 'react';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app, db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

                                                                                                    export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermissionAndToken = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notifications not supported by this browser.');
      return null;
    }

    try {
      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission === 'granted' && user) {
        const supported = await isSupported();
        if (!supported) {
           console.warn('Firebase Messaging not supported');
           return null;
        }

        const messaging = getMessaging(app);
        
        // Let's retrieve the service worker registration
        const registration = await navigator.serviceWorker.ready;

        const currentToken = await getToken(messaging, { 
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, 
          serviceWorkerRegistration: registration 
        });

        if (currentToken) {
          // Save the token to Firestore
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
             await updateDoc(userRef, {
                fcmTokens: arrayUnion(currentToken)
             });
          }
          return currentToken;
        } else {
          console.warn('No registration token available. Request permission to generate one.');
          return null;
        }
      }
    } catch (error) {
      console.error('An error occurred while retrieving token. ', error);
      return null;
    }
  };

  return { permission, requestPermissionAndToken };
}
