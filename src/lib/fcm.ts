import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { app, db } from "./firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";

export interface FcmSyncResult {
  token: string | null;
  error?: string;
  userFriendlyError?: string;
  vapidKeyPresent: boolean;
}

const inFlightSyncs = new Map<string, Promise<FcmSyncResult>>();

async function requestMessagingTokenWithRecovery(
  messaging: ReturnType<typeof getMessaging>,
  vapidKey: string | undefined,
  swRegistration: ServiceWorkerRegistration | undefined
): Promise<string | null> {
  const tokenOptions: {
    vapidKey?: string;
    serviceWorkerRegistration?: ServiceWorkerRegistration;
  } = {};
  if (vapidKey) tokenOptions.vapidKey = vapidKey;
  if (swRegistration) tokenOptions.serviceWorkerRegistration = swRegistration;

  try {
    return await getToken(messaging, tokenOptions);
  } catch (err: any) {
    const msg = String(err?.message || err || "");
    const code = String(err?.code || "");
    const looksLikeKeyMismatch =
      msg.includes("applicationServerKey") ||
      msg.includes("gcm_sender_id") ||
      code === "messaging/token-subscribe-failed" ||
      err?.name === "InvalidAccessError";

    if (looksLikeKeyMismatch && swRegistration?.pushManager) {
      const existingSub = await swRegistration.pushManager.getSubscription().catch(() => null);
      if (existingSub) {
        await existingSub.unsubscribe().catch(() => {});
        return await getToken(messaging, tokenOptions);
      }
    }
    throw err;
  }
}

async function performFcmSync(userId: string): Promise<FcmSyncResult> {
  const rawVapid = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  const vapidKeyPresent = Boolean(rawVapid);

  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return {
        token: null,
        error: "Notifications API unavailable in this environment.",
        userFriendlyError: "This browser does not support notifications.",
        vapidKeyPresent,
      };
    }

    if (Notification.permission !== "granted") {
      return {
        token: null,
        error: `Browser notification permission is '${Notification.permission}'.`,
        userFriendlyError:
          Notification.permission === "denied"
            ? "Notifications are blocked in your browser settings."
            : "Please allow notifications when prompted.",
        vapidKeyPresent,
      };
    }

    const supported = await isSupported();
    if (!supported) {
      return {
        token: null,
        error:
          "Firebase Messaging is not supported in this browser/context (e.g. non-HTTPS or iOS browser tab outside Home Screen PWA).",
        userFriendlyError:
          "Background notifications require adding this app to your Home Screen or using a supported browser.",
        vapidKeyPresent,
      };
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
          userFriendlyError: "Background alert helper could not start. Try reloading the page.",
          vapidKeyPresent,
        };
      }
    }

    const token = await requestMessagingTokenWithRecovery(messaging, rawVapid, swRegistration);

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
      userFriendlyError: "Could not connect this device to background notifications.",
      vapidKeyPresent,
    };
  } catch (error: any) {
    console.error("Error syncing FCM token:", error);
    const errMsg = error?.code
      ? `${error.code}: ${error.message || "FCM token error"}`
      : error?.message || "Failed to retrieve FCM token.";
    return {
      token: null,
      error: errMsg,
      userFriendlyError: "Could not register this device right now. Please try again in a moment.",
      vapidKeyPresent,
    };
  }
}

export const syncFcmTokenDetailed = async (userId: string): Promise<FcmSyncResult> => {
  const existing = inFlightSyncs.get(userId);
  if (existing) return existing;

  const promise = performFcmSync(userId).finally(() => {
    inFlightSyncs.delete(userId);
  });
  inFlightSyncs.set(userId, promise);
  return promise;
};

export const requestFirebaseNotificationPermission = async (userId: string) => {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return null;
    }

    const supported = await isSupported();
    if (!supported) {
      console.warn("Notifications not supported in this browser.");
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
