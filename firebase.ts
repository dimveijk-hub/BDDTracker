import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Web-config van Firebase-project "saleswisetracker". Deze waarden zijn publiek
// (ze staan ook in de productie-bundle); de beveiliging zit in de Firestore Security Rules.
export const firebaseConfig = {
  apiKey: 'AIzaSyAlFinOgnSOt-tNtMUBLWGxGKZ4o2TXTpQ',
  authDomain: 'saleswisetracker.firebaseapp.com',
  projectId: 'saleswisetracker',
  storageBucket: 'saleswisetracker.firebasestorage.app',
  messagingSenderId: '326771959239',
  appId: '1:326771959239:web:8ce864b5eaa78fe1f6e5e2',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
