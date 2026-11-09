import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { app, db } from "./firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";

export const requestFirebaseNotificationPermission = async (userId: string) => {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return null;
    }

    const supported = await isSupported();
    if (!supported) {
      console.warn("FCM is not supported in this browser.");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      return await syncFcmToken(userId);
    }
    return null;
  } catch (error) {
    console.error("Error setting up FCM:", error);
    return null;
  }
};

export const syncFcmToken = async (userId: string): Promise<string | null> => {
  try {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
      return null;
    }

    const supported = await isSupported();
    if (!supported) return null;

    const messaging = getMessaging(app);
    let swRegistration: ServiceWorkerRegistration | undefined;
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.ready;
      } catch (e) {
        console.warn("Could not retrieve ready service worker registration", e);
      }
    }

    const tokenOptions: { vapidKey?: string; serviceWorkerRegistration?: ServiceWorkerRegistration } = {};
    if (process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY.trim()) {
      tokenOptions.vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY.trim();
    }
    if (swRegistration) {
      tokenOptions.serviceWorkerRegistration = swRegistration;
    }

    const token = await getToken(messaging, tokenOptions);

    if (token) {
      // Save token to Firestore in both fcmTokens (array) and fcmToken (legacy string)
      const userRef = doc(db, "users", userId);
      await setDoc(
        userRef,
        {
          fcmToken: token,
          fcmTokens: arrayUnion(token),
        },
        { merge: true }
      );
      return token;
    }
    return null;
  } catch (error) {
    console.error("Error syncing FCM token:", error);
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
