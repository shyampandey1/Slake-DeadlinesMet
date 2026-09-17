import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { app, db } from "./firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

export const requestFirebaseNotificationPermission = async (userId: string) => {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("FCM is not supported in this browser.");
      return null;
    }

    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      let swRegistration: ServiceWorkerRegistration | undefined;
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        try {
          swRegistration = await navigator.serviceWorker.ready;
        } catch (e) {
          console.warn("Could not retrieve ready service worker registration", e);
        }
      }

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (token) {
        // Save token to Firestore in both fcmTokens (array) and fcmToken (legacy string)
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          fcmToken: token,
          fcmTokens: arrayUnion(token),
        });
        console.log("FCM Token registered and synchronized:", token);
        return token;
      }
    }
    return null;
  } catch (error) {
    console.error("Error setting up FCM:", error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    isSupported().then((supported) => {
      if (supported) {
        const messaging = getMessaging(app);
        onMessage(messaging, (payload) => {
          resolve(payload);
        });
      }
    });
  });
