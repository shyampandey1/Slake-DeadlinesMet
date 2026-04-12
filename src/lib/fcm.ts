import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { app, db } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";

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
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "YOUR_VAPID_KEY", 
      });

      if (token) {
        // Save the token to Firestore
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { fcmToken: token });
        console.log("FCM Token registered:", token);
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
