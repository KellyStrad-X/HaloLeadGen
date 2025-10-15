import {
  getApps,
  initializeApp,
  cert,
  ServiceAccount,
  App,
} from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

type FirebaseServiceAccountJson = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function getServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT is not set. Add it to your environment variables.'
    );
  }

  const parsed = JSON.parse(raw) as FirebaseServiceAccountJson;

  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key.replace(/\\n/g, '\n'),
  };
}

// Lazy initialization - only initialize when actually needed
let app: App | null = null;

function getAdminApp(): App {
  if (app) {
    return app;
  }

  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    return app;
  }

  // Initialize now (will throw if FIREBASE_SERVICE_ACCOUNT is missing)
  app = initializeApp({
    credential: cert(getServiceAccount()),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  return app;
}

export function getAdminStorage() {
  return getStorage(getAdminApp()).bucket();
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

// Export as constant for convenience
export const adminAuth = {
  verifyIdToken: async (token: string) => {
    return getAdminAuth().verifyIdToken(token);
  },
};
