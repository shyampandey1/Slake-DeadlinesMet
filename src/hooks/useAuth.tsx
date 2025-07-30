
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

interface AuthContextType {
  user: User | MockUser | null;
  loading: boolean;
  isOffline: boolean;
  setIsOffline: (isOffline: boolean) => void;
  setMockUser: (user: MockUser | null) => void;
  signInWithGoogle: () => Promise<void>;
  mockLogin: (email: string, pass: string) => MockUser | null;
  updateUserDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isOffline: false,
  setIsOffline: () => {},
  setMockUser: () => {},
  signInWithGoogle: async () => {},
  mockLogin: () => null,
  updateUserDisplayName: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | MockUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  
  const setMockUser = useCallback((mockUser: MockUser | null) => {
    if (mockUser) {
        setIsOffline(true);
    }
    setUser(mockUser);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        setIsOffline(false);
    } catch(error) {
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

  useEffect(() => {
    // Ensure analytics is initialized
    analytics.then(instance => {
      if (instance) {
        console.log("Firebase Analytics initialized");
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if(firebaseUser) {
            setUser(firebaseUser);
            setIsOffline(false);
        }
        setLoading(false);
    }, (error) => {
        console.error("Auth state error:", error);
        setIsOffline(true);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isOffline, setIsOffline, setMockUser, signInWithGoogle, mockLogin, updateUserDisplayName }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
