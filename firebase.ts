import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const PRODUCTION_PROJECT_ID = 'saleswisetracker';

// Web-config van het Firebase-project. Standaard productie ("saleswisetracker"); een test-project kan via
// `.env.staging.local` + `npm run dev:staging` / `build:staging` (zie TESTING.md). Deze waarden zijn publiek
// (ze staan ook in de productie-bundle); de beveiliging zit in de Firestore Security Rules.
const env = import.meta.env;
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? 'AIzaSyAlFinOgnSOt-tNtMUBLWGxGKZ4o2TXTpQ',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? 'saleswisetracker.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? PRODUCTION_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? 'saleswisetracker.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '326771959239',
  appId: env.VITE_FIREBASE_APP_ID ?? '1:326771959239:web:8ce864b5eaa78fe1f6e5e2',
};

/** True als de app naar een ander project dan productie wijst (toont een "test"-label in de UI). */
export const isTestEnvironment = firebaseConfig.projectId !== PRODUCTION_PROJECT_ID;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
