import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "swiftattend-7wu6p",
  appId: "1:936098307938:web:0f60a8ad237085fc1f163b",
  storageBucket: "swiftattend-7wu6p.firebasestorage.app",
  apiKey: "AIzaSyBwL5cb7c_L41aiV3m3UY7ScbSRXDBae_I",
  authDomain: "swiftattend-7wu6p.firebaseapp.com",
  messagingSenderId: "936098307938",
  measurementId: ""
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
