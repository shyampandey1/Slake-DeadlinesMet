import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { app, db } from "./firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";

export interface FcmSyncResult {
  token: string | null;
  error?: string;
  vapidKeyPresent: boolean;
}

export const syncFcmTokenDetailed = async (userId: string): Promise<FcmSyncResult> => {
  const rawVapid = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  const vapidKeyPresent = Boolean(rawVapid);

  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return { token: null, error: "Notifications API unavailable in this environment.", vapidKeyPresent };
    }

    if (Notification.permission !== "granted") {
      return { token: null, error: `Browser notification permission is '${Notification.permission}'.`, vapidKeyPresent };
    }

    const supported = await isSupported();
    if (!supported) {
      return { token: null, error: "Firebase Messaging is not supported in this browser/context (e.g. non-HTTPS or iOS browser tab outside Home Screen PWA).", vapidKeyPresent };
    }

    const messaging = getMessaging(app);
    let swRegistration: ServiceWorkerRegistration | undefined;
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("/sw.js").catch(() => {});
        swRegistration = await navigator.serviceWorker.ready;
      } catch (e: any) {
        return {
          token: null,
          error: `Service Worker unavailable: ${e?.message || String(e)}`,
          vapidKeyPresent,
        };
      }
    }

    const tokenOptions: { vapidKey?: string; serviceWorkerRegistration?: ServiceWorkerRegistration } = {};
    if (rawVapid) {
      tokenOptions.vapidKey = rawVapid;
    }
    if (swRegistration) {
      tokenOptions.serviceWorkerRegistration = swRegistration;
    }

    const token = await getToken(messaging, tokenOptions);

    if (token) {
      let timeZone: string | undefined;
      try {
        timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {}

      const userRef = doc(db, "users", userId);
      await setDoc(
        userRef,
        {
          userId,
          fcmToken: token,
          fcmTokens: arrayUnion(token),
          ...(timeZone ? { timeZone } : {}),
        },
        { merge: true }
      );
      return { token, vapidKeyPresent };
    }

    return {
      token: null,
      error: vapidKeyPresent
        ? "FCM returned an empty token."
        : "NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing in build environment; push registration returned empty.",
      vapidKeyPresent,
    };
  } catch (error: any) {
    console.error("Error syncing FCM token:", error);
    const errMsg = error?.code
      ? `${error.code}: ${error.message || "FCM token error"}`
      : error?.message || "Failed to retrieve FCM token.";
    return { token: null, error: errMsg, vapidKeyPresent };
  }
};

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
  const result = await syncFcmTokenDetailed(userId);
  return result.token;
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
