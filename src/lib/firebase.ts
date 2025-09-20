
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "swiftattend-7wu6p.firebaseapp.com",
  projectId: "swiftattend-7wu6p",
  storageBucket: "swiftattend-7wu6p.appspot.com",
  messagingSenderId: "936098307938",
  appId: "1:936098307938:web:0f60a8ad237085fc1f163b"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Enable offline persistence
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled
          // in one tab at a time.
          console.warn('Firestore persistence failed: multiple tabs open.');
        } else if (err.code == 'unimplemented') {
          // The current browser does not support all of the
          // features required to enable persistence
          console.warn('Firestore persistence not available in this browser.');
        }
      });
  } catch (error) {
    console.error("Error enabling Firestore persistence: ", error);
  }
}


export { app, db };
