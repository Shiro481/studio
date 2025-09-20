// This file is not used in the local storage version of the app.
// It is kept for potential future re-integration with Firebase.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "swiftattend-7wu6p.firebaseapp.com",
  projectId: "swiftattend-7wu6p",
  storageBucket: "swiftattend-7wu6p.firebasestorage.app",
  messagingSenderId: "936098307938",
  appId: "1:936098307938:web:0f60a8ad237085fc1f163b"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
