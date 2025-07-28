
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  "projectId": "deadlinesmet",
  "appId": "1:248085678271:web:b39ac7355a636cfe91de0a",
  "storageBucket": "deadlinesmet.firebasestorage.app",
  "apiKey": "AIzaSyARe1wX5bw7-zbpFAq77HKNJ3vyG_Jsiew",
  "authDomain": "deadlinesmet.firebaseapp.com",
  "messagingSenderId": "248085678271",
  "measurementId": "G-W18284JYFB"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

export { app, auth, db, analytics };
