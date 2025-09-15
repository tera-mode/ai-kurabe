import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK initialization
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0 && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      const serviceAccount = JSON.parse(serviceAccountKey);

      return initializeApp({
        credential: cert(serviceAccount),
        projectId: 'ai-kurabe',
      });
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      return null;
    }
  }
  return getApps()[0] || null;
};

// Initialize Firebase Admin
const adminApp = initializeFirebaseAdmin();

// Initialize Firestore Admin (only if adminApp exists)
export const adminDb = adminApp ? getFirestore(adminApp) : null;

export default adminApp;