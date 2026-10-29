/**
 * Firebase Auth and Firestore Initialization
 * Gracefully detects Firebase config and provides Google Sign-In support.
 */
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth, User } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isFirebaseConfigured = false;

// Attempt to load firebase-applet-config.json if available
try {
  // @ts-ignore
  const configModule = await import('../../firebase-applet-config.json', { with: { type: 'json' } }).catch(() => null);
  if (configModule?.default?.apiKey) {
    const config = configModule.default;
    app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app, config.firestoreDatabaseId);
    isFirebaseConfigured = true;
  }
} catch {
  // Firebase config not yet provisioned; app operates in local/demo mode
  isFirebaseConfigured = false;
}

export { auth, db, isFirebaseConfigured };

export const signInWithGoogle = async (): Promise<User | null> => {
  if (!auth) {
    throw new Error('Firebase Authentication is not yet configured in this environment. You can use PocketPilot AI in full Demo & Local Persistence mode.');
  }
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const logoutUser = async (): Promise<void> => {
  if (auth) {
    await signOut(auth);
  }
};
