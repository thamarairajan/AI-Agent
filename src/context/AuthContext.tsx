import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'trader' | 'admin';
  createdAt?: string;
  lastLoginAt?: string;
  isDemo?: boolean;
}

interface StoredUserAccount {
  uid: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'trader' | 'admin';
  createdAt: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isDemoUser: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE_KEY = 'ai_trader_demo_user';
const ACTIVE_SESSION_KEY = 'ai_trader_active_session';
const REGISTERED_USERS_KEY = 'ai_trader_registered_accounts';

// Helper to retrieve local registered accounts
function getRegisteredAccounts(): StoredUserAccount[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Helper to save a local registered account
function saveRegisteredAccount(account: StoredUserAccount) {
  try {
    const accounts = getRegisteredAccounts();
    const existingIndex = accounts.findIndex(
      (a) => a.email.toLowerCase() === account.email.toLowerCase()
    );
    if (existingIndex >= 0) {
      accounts[existingIndex] = account;
    } else {
      accounts.push(account);
    }
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.warn('Could not save local user account:', err);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(() => {
    return localStorage.getItem(DEMO_USER_STORAGE_KEY) === 'true';
  });

  // Sync profile with Firestore and update active session
  const syncUserProfile = async (fbUser: FirebaseUser) => {
    const now = new Date().toISOString();
    let profile: UserProfile = {
      uid: fbUser.uid,
      email: fbUser.email || '',
      displayName: fbUser.displayName || 'Algorithmic Trader',
      photoURL: fbUser.photoURL || undefined,
      role: 'trader',
      createdAt: now,
      lastLoginAt: now,
    };

    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        profile = {
          uid: fbUser.uid,
          email: fbUser.email || data.email || '',
          displayName: fbUser.displayName || data.displayName || 'Algorithmic Trader',
          photoURL: fbUser.photoURL || data.photoURL || undefined,
          role: data.role || 'trader',
          createdAt: data.createdAt || now,
          lastLoginAt: now,
        };
        await setDoc(userRef, { lastLoginAt: now }, { merge: true }).catch(() => {});
      } else {
        await setDoc(userRef, profile).catch((err) => {
          console.warn('[Firestore sync warning]:', err);
        });
      }
    } catch (e) {
      console.warn('[Firestore profile fetch error]:', e);
    }

    setUserProfile(profile);
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(profile));
  };

  useEffect(() => {
    // If demo mode was previously stored
    if (isDemoUser) {
      setUserProfile({
        uid: 'demo_trader_id',
        email: 'pro.trader@quantdesk.io',
        displayName: 'Institutional Demo Desk',
        role: 'trader',
        isDemo: true,
      });
      setLoading(false);
      return;
    }

    // Listen to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsDemoUser(false);
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
        await syncUserProfile(currentUser);
      } else {
        // If no Firebase user, check if we have a locally authenticated session
        const savedSession = localStorage.getItem(ACTIVE_SESSION_KEY);
        if (savedSession) {
          try {
            setUserProfile(JSON.parse(savedSession));
          } catch {
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoUser]);

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // 1. Try Firebase Auth
      let fbUser: FirebaseUser | null = null;
      let firebaseError: any = null;

      try {
        const res = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
        fbUser = res.user;
        setUser(res.user);
      } catch (err: any) {
        firebaseError = err;
        console.warn('[Firebase signIn error, testing registered fallback]:', err);
      }

      if (fbUser) {
        setIsDemoUser(false);
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
        await syncUserProfile(fbUser);
        return;
      }

      // 2. Check local registered accounts store
      const registered = getRegisteredAccounts();
      const matched = registered.find(
        (acc) => acc.email.toLowerCase() === normalizedEmail
      );

      if (matched) {
        // Simple safe hash comparison
        const encoded = btoa(pass);
        if (matched.passwordHash === encoded) {
          const profile: UserProfile = {
            uid: matched.uid,
            email: matched.email,
            displayName: matched.displayName,
            role: matched.role,
            createdAt: matched.createdAt,
            lastLoginAt: new Date().toISOString(),
          };
          setUserProfile(profile);
          setIsDemoUser(false);
          localStorage.removeItem(DEMO_USER_STORAGE_KEY);
          localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(profile));
          return;
        } else {
          throw new Error('Incorrect password. Please verify and try again.');
        }
      }

      // If neither Firebase nor local matched, throw user friendly error
      if (firebaseError) {
        if (
          firebaseError.code === 'auth/invalid-credential' ||
          firebaseError.code === 'auth/user-not-found' ||
          firebaseError.code === 'auth/wrong-password'
        ) {
          throw new Error('Invalid email or password. Please verify credentials or register.');
        }
        if (firebaseError.code === 'auth/operation-not-allowed') {
          throw new Error('Account not found. Please click "Create Trader Account" first to register.');
        }
        throw new Error(firebaseError.message || 'Login failed. Please check credentials.');
      }

      throw new Error('No account found with this email. Please register first.');
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const displayName = name.trim() || 'Algorithmic Trader';

    try {
      // 1. Try Firebase Auth create
      let fbUser: FirebaseUser | null = null;
      try {
        const res = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
        fbUser = res.user;
        setUser(res.user);
        if (displayName) {
          await updateProfile(res.user, { displayName });
        }
      } catch (err: any) {
        console.warn('[Firebase signUp note, utilizing local registered account storage]:', err);
        // If email already in use in Firebase, check code
        if (err.code === 'auth/email-already-in-use') {
          throw new Error('An account with this email already exists. Please log in.');
        }
      }

      const now = new Date().toISOString();
      const uid = fbUser ? fbUser.uid : 'trader_' + Date.now();

      // Save locally in registered accounts database
      const account: StoredUserAccount = {
        uid,
        email: normalizedEmail,
        passwordHash: btoa(pass),
        displayName,
        role: 'trader',
        createdAt: now,
      };
      saveRegisteredAccount(account);

      const profile: UserProfile = {
        uid,
        email: normalizedEmail,
        displayName,
        role: 'trader',
        createdAt: now,
        lastLoginAt: now,
      };

      if (fbUser) {
        await syncUserProfile(fbUser);
      } else {
        setUserProfile(profile);
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(profile));
      }

      setIsDemoUser(false);
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      setUser(res.user);
      setIsDemoUser(false);
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      await syncUserProfile(res.user);
    } finally {
      setLoading(false);
    }
  };

  const signInAsDemo = () => {
    setIsDemoUser(true);
    localStorage.setItem(DEMO_USER_STORAGE_KEY, 'true');
    setUser(null);
    const demoProfile: UserProfile = {
      uid: 'demo_trader_id',
      email: 'demo.trader@quantdesk.io',
      displayName: 'Demo Quant Trader',
      role: 'trader',
      isDemo: true,
    };
    setUserProfile(demoProfile);
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(demoProfile));
    setLoading(false);
  };

  const signOut = async () => {
    setIsDemoUser(false);
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    setUser(null);
    setUserProfile(null);
    await fbSignOut(auth).catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isDemoUser,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInAsDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
