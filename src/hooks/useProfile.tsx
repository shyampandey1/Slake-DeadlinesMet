

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "./useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection, query, where, getDocs, writeBatch, runTransaction } from "firebase/firestore";
import type { ProfileType, CustomProfession, UserProfile } from "@/types";

interface ProfileContextType {
  profile: ProfileType;
  setProfile: (profile: ProfileType) => void;
  dayOff: UserProfile['dayOff'];
  setDayOff: (dayOff: UserProfile['dayOff']) => void;
  customProfessions: CustomProfession[];
  deleteCustomProfession: (professionName: string) => Promise<void>;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: "General",
  setProfile: () => {},
  dayOff: 'None',
  setDayOff: () => {},
  customProfessions: [],
  deleteCustomProfession: async () => {},
  loading: true,
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isOffline, isSyncEnabled } = useAuth();
  const [profile, setProfileState] = useState<ProfileType>("General");
  const [dayOff, setDayOffState] = useState<UserProfile['dayOff']>('None');
  const [customProfessions, setCustomProfessionsState] = useState<CustomProfession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || isOffline || !isSyncEnabled) {
        // Try to load from localStorage first for offline/guest mode
        try {
            const storedProfile = localStorage.getItem('user-profile');
            if (storedProfile) {
                const parsedProfile: UserProfile = JSON.parse(storedProfile);
                setProfileState(parsedProfile.profile || 'General');
                setDayOffState(parsedProfile.dayOff || 'None');
            }
        } catch (e) {
            console.warn("Could not access localStorage for profile")
        }
        setCustomProfessionsState([]); // No custom professions in offline mode
        setLoading(false);
        return;
    }

    setLoading(true);
    const profileRef = doc(db, 'userProfiles', user.uid);

    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const fetchedProfile = data.profile || "General";
            const fetchedDayOff = data.dayOff || "None";
            setProfileState(fetchedProfile);
            setDayOffState(fetchedDayOff);
            setCustomProfessionsState(data.customProfessions || []);
             try {
                localStorage.setItem('user-profile', JSON.stringify({ profile: fetchedProfile, dayOff: fetchedDayOff }));
             } catch (e) {
                console.warn("Could not access localStorage for profile")
             }
        } else {
            // If no profile, set default "General"
            const defaultProfile = { profile: "General", dayOff: "None" as const, customProfessions: [] };
            setDoc(profileRef, defaultProfile);
            setProfileState("General");
            setDayOffState("None");
            setCustomProfessionsState([]);
             try {
                localStorage.setItem('user-profile', JSON.stringify(defaultProfile));
             } catch (e) {
                console.warn("Could not access localStorage for profile")
             }
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching profile:", error);
        setLoading(false);
    });
    
    return () => unsubscribe();

  }, [user, isOffline, isSyncEnabled]);

  const setProfile = useCallback(async (newProfile: ProfileType) => {
    if (profile === newProfile) return;
    
    setProfileState(newProfile);
    try {
        localStorage.setItem('user-profile', JSON.stringify({ profile: newProfile, dayOff }));
    } catch(e) {
        console.warn("Could not access localStorage for profile")
    }

    if (user && !isOffline && isSyncEnabled) {
        try {
            const profileRef = doc(db, 'userProfiles', user.uid);
            await setDoc(profileRef, { profile: newProfile }, { merge: true });
        } catch (error) {
            console.error("Failed to set profile: ", error);
        }
    }
  }, [user, isOffline, isSyncEnabled, profile, dayOff]);
  
  const setDayOff = useCallback(async (newDayOff: UserProfile['dayOff']) => {
    if (dayOff === newDayOff) return;

    setDayOffState(newDayOff);
     try {
        localStorage.setItem('user-profile', JSON.stringify({ profile, dayOff: newDayOff }));
    } catch(e) {
        console.warn("Could not access localStorage for profile")
    }

    if (user && !isOffline && isSyncEnabled) {
        try {
            const profileRef = doc(db, 'userProfiles', user.uid);
            await setDoc(profileRef, { dayOff: newDayOff }, { merge: true });
        } catch (error) {
            console.error("Failed to set day off: ", error);
        }
    }
  }, [user, isOffline, isSyncEnabled, dayOff, profile]);

  const deleteCustomProfession = useCallback(async (professionName: string) => {
    if (!user || isOffline || isSyncEnabled) return;

    try {
        await runTransaction(db, async (transaction) => {
            const profileRef = doc(db, 'userProfiles', user.uid);
            const profileDoc = await transaction.get(profileRef);

            if (profileDoc.exists()) {
                const currentCustomProfessions = (profileDoc.data().customProfessions || []).filter(
                    (p: CustomProfession) => p.name !== professionName
                );
                
                transaction.update(profileRef, { customProfessions: currentCustomProfessions });

                if (profile === professionName) {
                    transaction.update(profileRef, { profile: "General" });
                    setProfileState("General");
                }
            }
            
            const tasksQuery = query(
                collection(db, 'userPresetTasks'),
                where('userId', '==', user.uid),
                where('profession', '==', professionName)
            );
            const tasksSnapshot = await getDocs(tasksQuery);
            tasksSnapshot.forEach(doc => transaction.delete(doc.ref));
        });
    } catch (error) {
        console.error(`Failed to delete profession ${professionName}:`, error);
        throw error;
    }

  }, [user, isOffline, profile, isSyncEnabled]);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, dayOff, setDayOff, loading, customProfessions, deleteCustomProfession }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
