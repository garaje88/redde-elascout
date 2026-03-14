import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function initFirebase() {
  if (getApps().length > 0) {
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID is required in .env");
  }

  if (clientEmail && privateKey) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } else {
    initializeApp({ projectId });
  }

  console.log(`[firebase] Initialized with project: ${projectId}`);
}

initFirebase();

export const db = getFirestore();
export const adminAuth = getAuth();
