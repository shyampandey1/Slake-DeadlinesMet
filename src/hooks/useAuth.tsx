
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, analytics } from "@/lib/firebase";
import { MockUser } from "@/types";
import { mockLogin } from "@/lib/mockAuth";

interface AuthContextType {
  user: User | MockUser | null;
  loading: boolean;
  setMockUser: (user: MockUser | null) => void;
  signInWithGoogle: () => Promise<void>;
  mockLogin: (email: string, pass: string) => MockUser | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setMockUser: () => {},
  signInWithGoogle: async () => {},
  mockLogin: () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | MockUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const setMockUser = useCallback((mockUser: MockUser | null) => {
    setUser(mockUser);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch(error) {
        console.error("Google sign-in error", error);
        throw error;
    }
  }, []);

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
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setMockUser, signInWithGoogle, mockLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
