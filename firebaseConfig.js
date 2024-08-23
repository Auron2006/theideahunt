// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Import Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAnL2LJhni_OwLEo8avKhGRv6AqEdRsZh0",
  authDomain: "theideahunt-74cd8.firebaseapp.com",
  projectId: "theideahunt-74cd8",
  storageBucket: "theideahunt-74cd8.appspot.com",
  messagingSenderId: "302655072510",
  appId: "1:302655072510:web:b66f02fe0862dbeae89daf",
  measurementId: "G-VW3BXP51Y1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };
