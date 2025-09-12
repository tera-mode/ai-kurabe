import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK initialization
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    try {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (!serviceAccountKey) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
      }

      const serviceAccount = JSON.parse(serviceAccountKey);

      return initializeApp({
        credential: cert(serviceAccount),
        projectId: 'ai-kurabe',
      });
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }
  return getApps()[0];
};

// Initialize Firebase Admin
const adminApp = initializeFirebaseAdmin();

// Initialize Firestore Admin
export const adminDb = getFirestore(adminApp);

export default adminApp;