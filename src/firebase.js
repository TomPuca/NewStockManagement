import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDl0oKQRCOHexa-EloSX_pJFN-lkSqibtc",
  authDomain: "stockrealtime-5c049.firebaseapp.com",
  databaseURL: "https://stockrealtime-5c049.firebaseio.com",
  projectId: "stockrealtime-5c049",
  storageBucket: "stockrealtime-5c049.appspot.com",
  messagingSenderId: "144010414262",
  appId: "1:144010414262:web:322dbb3aa4889756587e17",
  measurementId: "G-J2YJH55K7K",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
