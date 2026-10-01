import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Default provisioned Firebase project configuration
const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'cogent-etching-7xfhk',
  appId: '1:683926366454:web:fea4a2e8be3d191ed824d7',
  apiKey: 'AIzaSyAmsg8ulcL92mHMPGsWMV-ghgHFO9scYHw',
  authDomain: 'cogent-etching-7xfhk.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-aitradingagent-d2b99654-3c49-4b3c-a074-591fdd10f8ea',
  storageBucket: 'cogent-etching-7xfhk.firebasestorage.app',
  messagingSenderId: '683926366454',
};

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || DEFAULT_FIREBASE_CONFIG.appId,
};

const firestoreDatabaseId =
  (import.meta.env.VITE_FIRESTORE_DATABASE_ID as string) || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId;

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider configured for popups
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with custom databaseId if configured
export const db = firestoreDatabaseId
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app);

// Test Firestore connection on boot (Skill constraint)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network unavailable.');
    }
  }
}
testConnection();
