
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, analytics } from "@/lib/firebase";
import { MockUser } from "@/types";

interface AuthContextType {
  user: User | MockUser | null;
  loading: boolean;
  setMockUser: (user: MockUser | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setMockUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | MockUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const setMockUser = useCallback((mockUser: MockUser | null) => {
    setUser(mockUser);
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
    <AuthContext.Provider value={{ user, loading, setMockUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
