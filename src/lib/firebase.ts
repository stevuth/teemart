
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "teemart-marketplace",
  appId: "1:547173440085:web:e122b2c4ecf75d127b92dc",
  storageBucket: "teemart-marketplace.appspot.com",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "teemart-marketplace.firebaseapp.com",
  messagingSenderId: "547173440085",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
