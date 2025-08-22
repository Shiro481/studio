import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "swiftattend-7wu6p.firebaseapp.com",
  projectId: "swiftattend-7wu6p",
  storageBucket: "swiftattend-7wu6p.firebasestorage.app",
  messagingSenderId: "936098307938",
  appId: "1:936098307938:web:0f60a8ad237085fc1f163b",
  measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
