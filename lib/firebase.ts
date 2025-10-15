import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy initialization to avoid build-time errors
let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let authInstance: Auth | null = null;

function initializeFirebase(): FirebaseApp | null {
  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  // Return existing app if already initialized
  if (app) {
    return app;
  }

  // Check if config is valid before initializing
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('XXXXX')) {
    console.warn('Firebase config not set. Skipping initialization.');
    return null;
  }

  // Initialize Firebase (singleton pattern)
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return app;
}

// Lazy getters for Firebase services
export const db: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    if (!dbInstance) {
      const firebaseApp = initializeFirebase();
      if (!firebaseApp) {
        throw new Error('Firebase not initialized. Check your environment variables.');
      }
      dbInstance = getFirestore(firebaseApp);
    }
    return (dbInstance as any)[prop];
  }
});

export const storage: FirebaseStorage = new Proxy({} as FirebaseStorage, {
  get(_target, prop) {
    if (!storageInstance) {
      const firebaseApp = initializeFirebase();
      if (!firebaseApp) {
        throw new Error('Firebase not initialized. Check your environment variables.');
      }
      storageInstance = getStorage(firebaseApp);
    }
    return (storageInstance as any)[prop];
  }
});

export const auth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    if (!authInstance) {
      const firebaseApp = initializeFirebase();
      if (!firebaseApp) {
        throw new Error('Firebase not initialized. Check your environment variables.');
      }
      authInstance = getAuth(firebaseApp);
    }
    return (authInstance as any)[prop];
  }
});

export default initializeFirebase;
