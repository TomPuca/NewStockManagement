import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";

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

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Force Google to show the account chooser page every time,
// allowing the user to switch accounts if they logged in with the wrong email.
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Persist the auth session in localStorage so the user stays logged in
// even after closing or refreshing the browser tab.
setPersistence(auth, browserLocalPersistence);
