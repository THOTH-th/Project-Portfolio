import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

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
export const FIREBASE_ENABLED =
  firebaseConfig.apiKey.length > 0 &&
  !firebaseConfig.apiKey.startsWith("YOUR_");

let app: FirebaseApp | undefined;
let firestore: Firestore | undefined;

/** Lazily initialise Firestore in the browser (never on the server). */
export function getDb(): Firestore | undefined {
  if (!FIREBASE_ENABLED || typeof window === "undefined") return undefined;
  if (!firestore) {
    try {
      app = getApps()[0] ?? initializeApp(firebaseConfig);
      firestore = getFirestore(app);
    } catch {
      return undefined;
    }
  }
  return firestore;
}
