/**
 * Firebase SDK initialization for Clinic Hub.
 *
 * Architecture notes:
 * - `app` / `auth` / `db`: Primary Firebase instance used for all client operations.
 * - `secondaryApp` / `secondaryAuth`: A second Firebase app instance used exclusively
 *   by Admin to create doctor accounts without signing out of their own session.
 *   Firebase's `createUserWithEmailAndPassword` auto-signs-in the new user — the
 *   secondary instance isolates this side effect.
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// ── Runtime environment validation ──────────────────────────────────────────
// Fails fast in development/CI if any required variable is missing,
// preventing silent undefined values reaching the Firebase SDK.
const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

for (const key of REQUIRED_ENV_VARS) {
  if (!import.meta.env[key]) {
    throw new Error(
      `[Clinic Hub] Missing required environment variable: ${key}\n` +
      `Ensure your .env.local file is present and contains all VITE_FIREBASE_* keys.`
    );
  }
}

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ── Primary app instance ─────────────────────────────────────────────────────
export const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

/**
 * Firestore with persistent multi-tab offline cache.
 * This allows the app to function even with intermittent connectivity,
 * which is critical in clinic environments.
 */
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// ── Secondary app instance (Admin use only) ──────────────────────────────────
const secondaryApp: FirebaseApp = initializeApp(firebaseConfig, 'secondary');
export const secondaryAuth = getAuth(secondaryApp);
