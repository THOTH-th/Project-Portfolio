import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

/**
 * Public Firebase web config. These values are safe to ship in client code —
 * access is governed by Firestore security rules, not by hiding this config.
 */
const firebaseConfig = {
  apiKey: "AIzaSyCFz8r9LfXMQaqxVR_Ldoh50Sfwjke0Z-8",
  authDomain: "thoth-portfolio.firebaseapp.com",
  projectId: "thoth-portfolio",
  storageBucket: "thoth-portfolio.firebasestorage.app",
  messagingSenderId: "898020611129",
  appId: "1:898020611129:web:a4381a26bbf06d01b3a9e8",
};

/** Firestore is used only when a real apiKey is configured. */
export const FIREBASE_ENABLED = false;

let app: FirebaseApp | undefined;
let firestore: Firestore | undefined;
let auth: Auth | undefined;

function getApp(): FirebaseApp {
  app = getApps()[0] ?? initializeApp(firebaseConfig);
  return app;
}

/** Lazily initialise Firestore in the browser (never on the server). */
export function getDb(): Firestore | undefined {
  if (!FIREBASE_ENABLED || typeof window === "undefined") return undefined;
  if (!firestore) {
    try {
      firestore = getFirestore(getApp());
    } catch {
      return undefined;
    }
  }
  return firestore;
}

/** Lazily initialise Firebase Auth in the browser (never on the server). */
export function getAuthInstance(): Auth | undefined {
  if (!FIREBASE_ENABLED || typeof window === "undefined") return undefined;
  if (!auth) {
    try {
      auth = getAuth(getApp());
    } catch {
      return undefined;
    }
  }
  return auth;
}
