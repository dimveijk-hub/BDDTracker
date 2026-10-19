import * as firestoreApi from './firestore';
import * as demoApi from './demo';

/**
 * Data-API van de app. Standaard Firebase; met `VITE_DEMO_MODE=true`
 * (zie `npm run dev:demo`) een in-memory demo zonder netwerk.
 */
export const api: typeof firestoreApi = import.meta.env.VITE_DEMO_MODE === 'true' ? demoApi : firestoreApi;
