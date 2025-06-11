
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB9Hsn1jppK9WRIBrTgDmrhTWWcTNegME4",
  authDomain: "styleapp-nst.firebaseapp.com",
  projectId: "styleapp-nst",
  storageBucket: "styleapp-nst.firebasestorage.app",
  messagingSenderId: "97849692448",
  appId: "1:97849692448:web:935f6004d10d439c8e4745",
  measurementId: "G-8R05GCRDS5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

