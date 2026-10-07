import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, increment } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profileData: UserProfile | null;
  loading: boolean;
  awardCoins: (amount: number) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profileData: null,
  loading: true,
  awardCoins: async () => {},
  updateUserProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load cached profile on boot for instant offline readiness
  useEffect(() => {
    AsyncStorage.getItem('@cached_user_profile').then((cached) => {
      if (cached) {
        try {
          setProfileData(JSON.parse(cached));
        } catch {}
      }
    });
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Subscribe to user profile document in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const unsubscribeProfile = onSnapshot(
          userRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as UserProfile;
              setProfileData(data);
              AsyncStorage.setItem('@cached_user_profile', JSON.stringify(data));
            } else {
              // Initialize default profile
              const defaultProfile: UserProfile = {
                userId: currentUser.uid,
                displayName: currentUser.displayName || 'Reformer',
                email: currentUser.email || '',
                profile: 'General',
                slakeCoins: 1000,
                slakeCredits: 1000,
                streak: {
                  currentStreak: 1,
                  highestStreak: 1,
                  lastActiveDate: new Date().toISOString(),
                  dailyHistory: [],
                },
                totalTasks: 0,
                totalWaterGlasses: 0,
              };
              setDoc(userRef, defaultProfile, { merge: true });
              setProfileData(defaultProfile);
            }
            setLoading(false);
          },
          (err) => {
            console.warn("Profile snapshot error (using offline cache):", err);
            setLoading(false);
          }
        );

        return () => unsubscribeProfile();
      } else {
        // Automatically sign in anonymously for immediate offline/online access
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.warn("Anonymous sign in error:", e);
          setLoading(false);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const awardCoins = async (amount: number) => {
    if (!user) return;
    // Optimistic local state update
    setProfileData((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        slakeCoins: (prev.slakeCoins || 0) + amount,
        slakeCredits: (prev.slakeCredits || 0) + amount,
      };
      AsyncStorage.setItem('@cached_user_profile', JSON.stringify(updated));
      return updated;
    });

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        slakeCoins: increment(amount),
        slakeCredits: increment(amount),
      });
    } catch (e) {
      console.warn("Firestore award coins sync pending:", e);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    setProfileData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      AsyncStorage.setItem('@cached_user_profile', JSON.stringify(updated));
      return updated;
    });

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, data);
    } catch (e) {
      console.warn("Firestore update profile sync pending:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profileData, loading, awardCoins, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
