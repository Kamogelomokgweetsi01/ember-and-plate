
import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';

import { getAuth } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';

import { getFirestore } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAxsC5L1OFxKbKyxhIDU_JE51o9jnFaAw4",
  authDomain: "restaurant-management-4b978.firebaseapp.com",
  projectId: "restaurant-management-4b978",
  storageBucket: "restaurant-management-4b978.firebasestorage.app",
  messagingSenderId: "147223594909",
  appId: "1:147223594909:web:fa99c12bcbdcc4eef2d174",
  measurementId: "G-2LGT0MYSZW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);