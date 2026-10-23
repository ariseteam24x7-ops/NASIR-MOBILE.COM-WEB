import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

let adminAuthInstance: any = null;

try {
  if (!getApps().length) {
    initializeApp({
      projectId: firebaseConfig?.projectId || process.env.FIREBASE_PROJECT_ID || 'magnificent-container-rvxch',
    });
  }
  adminAuthInstance = getAuth();
} catch (e) {
  console.warn('Firebase admin initialization note (safe fallback active):', (e as any)?.message || e);
  adminAuthInstance = {
    verifyIdToken: async () => {
      throw new Error('Firebase Auth ID token verification requires configured service credentials');
    },
  };
}

export const adminAuth = adminAuthInstance;
