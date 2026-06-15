
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, updateProfile } from "firebase/auth";
import { auth, analytics } from "@/lib/firebase";
import { MockUser } from "@/types";
import { mockLogin } from "@/lib/mockAuth";

const SYNC_ENABLED_KEY = 'firebaseSyncEnabled';

interface AuthContextType {
  user: User | MockUser | null;
  loading: boolean;
  isOffline: boolean;
  setIsOffline: (isOffline: boolean) => void;
  isSyncEnabled: boolean;
  setIsSyncEnabled: (enabled: boolean) => void;
  setMockUser: (user: MockUser | null) => void;
  signInWithGoogle: () => Promise<void>;
  mockLogin: (email: string, pass: string) => MockUser | null;
  updateUserDisplayName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isOffline: false,
  setIsOffline: () => { },
  isSyncEnabled: true,
  setIsSyncEnabled: () => { },
  setMockUser: () => { },
  signInWithGoogle: async () => { },
  mockLogin: () => null,
  updateUserDisplayName: async () => { },
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | MockUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncEnabled, setSyncEnabled] = useState(true);

  useEffect(() => {
    try {
      const storedSync = localStorage.getItem(SYNC_ENABLED_KEY);
      if (storedSync !== null) {
        setSyncEnabled(JSON.parse(storedSync));
      }
    } catch (e) {
      console.warn("Could not access localStorage for sync setting")
    }
  }, []);

  const setIsSyncEnabled = (enabled: boolean) => {
    setSyncEnabled(enabled);
    try {
      localStorage.setItem(SYNC_ENABLED_KEY, JSON.stringify(enabled));
    } catch (e) {
      console.warn("Could not access localStorage for sync setting")
    }
  }

  const setMockUser = useCallback((mockUser: MockUser | null) => {
    if (mockUser) {
      setIsOffline(true);
    }
    setUser(mockUser);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      await signInWithPopup(auth, provider);
      setIsOffline(false);
    } catch (error) {
      console.error("Google sign-in error", error);
      throw error;
    }
  }, []);

  const updateUserDisplayName = useCallback(async (name: string) => {
    if (user) {
      if ('isMockUser' in user && user.isMockUser) {
        setUser({ ...user, displayName: name });
      } else if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
        setUser({ ...auth.currentUser, displayName: name } as User); // Force refresh of user state
      } else {
        throw new Error("No user is currently signed in.");
      }
    }
  }, [user]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      // Set a flag in session storage to tell other hooks to stop fetching
      sessionStorage.setItem('SIGNOUT_IN_PROGRESS', 'true');

      if (user && 'isMockUser' in user) {
        setUser(null);
        setIsOffline(false);
      } else {
        await auth.signOut();
      }
    } catch (error) {
      console.error("Sign out error", error);
    } finally {
      sessionStorage.removeItem('SIGNOUT_IN_PROGRESS');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let unsubscribe: () => void;
    try {
      // Ensure analytics is initialized
      analytics.then(instance => {
        if (instance) {
          console.log("Firebase Analytics initialized");
        }
      });

      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          setIsOffline(false);
        } else {
          setUser(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Auth state error:", error);
        setIsOffline(true);
        setLoading(false);
      });
    } catch (error: any) {
      console.warn("Firebase auth initialization failed:", error.message);
      if (error.code === 'auth/unauthorized-domain') {
        const mockUser = mockLogin("user@test.com", "password123");
        if (mockUser) {
          setMockUser(mockUser);
        }
      }
      setIsOffline(true);
      setLoading(false);
    }

    const handleOnline = () => {
      setIsOffline(false);
      window.dispatchEvent(new Event('app-online-sync'));
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
       setIsOffline(true);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setMockUser]);

  return (
    <AuthContext.Provider value={{ user, loading, isOffline, setIsOffline, isSyncEnabled, setIsSyncEnabled, setMockUser, signInWithGoogle, mockLogin, updateUserDisplayName, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

