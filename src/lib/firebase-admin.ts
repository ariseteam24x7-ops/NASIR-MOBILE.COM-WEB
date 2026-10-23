import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let adminAuthInstance: any = null;

// Safely load config without throwing ERR_IMPORT_ATTRIBUTE_MISSING
let firebaseConfig: any = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'magnificent-container-rvxch',
};

try {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const possiblePaths = [
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
    path.resolve(currentDir, '../../firebase-applet-config.json'),
    path.resolve(currentDir, '../firebase-applet-config.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      firebaseConfig = JSON.parse(raw);
      break;
    }
  }
} catch (_err) {
  // Safe fallback to default projectId
}

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
