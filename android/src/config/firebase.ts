import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDzkJ_Y0y2BKRIHxUeslXLblxO-0wjMCx0",
  authDomain: "dealdlinesmet.firebaseapp.com",
  projectId: "dealdlinesmet",
  storageBucket: "dealdlinesmet.firebasestorage.app",
  messagingSenderId: "703127832822",
  appId: "1:703127832822:web:5138c41dff450efca084d7",
  measurementId: "G-ZSSHQ37TH2"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
