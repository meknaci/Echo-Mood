// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAsOrFwpDfGR31shiXzKlapzIVE-UX1F-U",
  authDomain: "moodmap-aca4d.firebaseapp.com",
  projectId: "moodmap-aca4d",
  storageBucket: "moodmap-aca4d.appspot.com",
  messagingSenderId: "439481209607",
  appId: "1:439481209607:web:02a37490503ce118d7eba2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();





