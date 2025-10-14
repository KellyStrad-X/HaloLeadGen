import {
  getApps,
  initializeApp,
  cert,
  ServiceAccount,
} from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

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

const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert(getServiceAccount()),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      })
    : getApps()[0];

export const adminStorage = getStorage(app).bucket();
