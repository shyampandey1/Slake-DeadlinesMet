

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
import type { ProfileType, CustomProfession, UserProfile, Day } from "@/types";

export type Profession = {
    name: ProfileType;
    icon: string;
    color: string;
}

export const professions: { [group: string]: Profession[] } = {
    "Creative": [
        { name: "Artist", icon: "Palette", color: "border-rose-500/80 text-rose-400" },
        { name: "Content Creator", icon: "Camera", color: "border-orange-500/80 text-orange-400" },
        { name: "Designer", icon: "PenTool", color: "border-purple-500/80 text-purple-400" },
        { name: "Writer", icon: "PenLine", color: "border-blue-500/80 text-blue-400" },
    ],
    "Business & Management": [
        { name: "Consultant", icon: "Briefcase", color: "border-cyan-500/80 text-cyan-400" },
        { name: "Entrepreneur", icon: "Lightbulb", color: "border-amber-500/80 text-amber-400" },
        { name: "Manager", icon: "Users", color: "border-lime-500/80 text-lime-400" },
        { name: "Marketer", icon: "Megaphone", color: "border-red-500/80 text-red-400" },
        { name: "Sales", icon: "TrendingUp", color: "border-green-500/80 text-green-400" },
        { name: "Medical Representative", icon: "Briefcase", color: "border-stone-500/80 text-stone-400" }
    ],
    "Technical & Health": [
        { name: "Healthcare Professional", icon: "Stethoscope", color: "border-teal-500/80 text-teal-400" },
        { name: "IT Professional", icon: "Laptop", color: "border-indigo-500/80 text-indigo-400" },
        { name: "Software Engineer", icon: "Code", color: "border-fuchsia-500/80 text-fuchsia-400" },
        { name: "Researcher", icon: "FlaskConical", color: "border-sky-500/80 text-sky-400" },
    ],
    "General & Freelance": [
        { name: "Educator", icon: "School", color: "border-yellow-500/80 text-yellow-400" },
        { name: "Freelancer", icon: "Network", color: "border-rose-500/80 text-rose-400" },
        { name: "Student", icon: "GraduationCap", color: "border-stone-500/80 text-stone-400" },
        { name: "General", icon: "User", color: "border-gray-500/80 text-gray-400" },
        { name: "Delivery Agent", icon: "Truck", color: "border-gray-500/80 text-gray-400" },
    ]
};


interface ProfileContextType {
  profile: ProfileType;
  setProfile: (profile: ProfileType) => void;
  daysOff: Day[];
  setDaysOff: (daysOff: Day[]) => void;
  customProfessions: CustomProfession[];
  deleteCustomProfession: (professionName: string) => Promise<void>;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: "General",
  setProfile: () => {},
  daysOff: [],
  setDaysOff: () => {},
  customProfessions: [],
  deleteCustomProfession: async () => {},
  loading: true,
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isOffline, isSyncEnabled } = useAuth();
  const [profile, setProfileState] = useState<ProfileType>("General");
  const [daysOff, setDaysOffState] = useState<Day[]>([]);
  const [customProfessions, setCustomProfessionsState] = useState<CustomProfession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || isOffline || !isSyncEnabled) {
        // Try to load from localStorage first for offline/guest mode
        if (typeof window !== 'undefined') {
            try {
                const storedProfile = localStorage.getItem('user-profile');
                if (storedProfile) {
                    const parsedProfile: UserProfile = JSON.parse(storedProfile);
                    setProfileState(parsedProfile.profile || 'General');
                    setDaysOffState(parsedProfile.daysOff || []);
                }
            } catch (e) {
                console.warn("Could not access localStorage for profile")
            }
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
            const fetchedDaysOff = data.daysOff || [];
            setProfileState(fetchedProfile);
            setDaysOffState(fetchedDaysOff);
            setCustomProfessionsState(data.customProfessions || []);
             if (typeof window !== 'undefined') {
                 try {
                    localStorage.setItem('user-profile', JSON.stringify({ profile: fetchedProfile, daysOff: fetchedDaysOff }));
                 } catch (e) {
                    console.warn("Could not access localStorage for profile")
                 }
             }
        } else {
            // If no profile, set default "General"
            const defaultProfile = { profile: "General", daysOff: [] as Day[], customProfessions: [] };
            setDoc(profileRef, defaultProfile);
            setProfileState("General");
            setDaysOffState([]);
            setCustomProfessionsState([]);
             if (typeof window !== 'undefined') {
                 try {
                    localStorage.setItem('user-profile', JSON.stringify(defaultProfile));
                 } catch (e) {
                    console.warn("Could not access localStorage for profile")
                 }
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
    if (typeof window !== 'undefined') {
        try {
            const storedData = localStorage.getItem('user-profile');
            const currentData = storedData ? JSON.parse(storedData) : {};
            localStorage.setItem('user-profile', JSON.stringify({ ...currentData, profile: newProfile }));
        } catch(e) {
            console.warn("Could not access localStorage for profile")
        }
    }

    if (user && !isOffline && isSyncEnabled) {
        try {
            const profileRef = doc(db, 'userProfiles', user.uid);
            await setDoc(profileRef, { profile: newProfile }, { merge: true });
        } catch (error) {
            console.error("Failed to set profile: ", error);
        }
    }
  }, [user, isOffline, isSyncEnabled, profile]);
  
  const setDaysOff = useCallback(async (newDaysOff: Day[]) => {
    setDaysOffState(newDaysOff);
    if (typeof window !== 'undefined') {
         try {
            const storedData = localStorage.getItem('user-profile');
            const currentData = storedData ? JSON.parse(storedData) : {};
            localStorage.setItem('user-profile', JSON.stringify({ ...currentData, daysOff: newDaysOff }));
        } catch(e) {
            console.warn("Could not access localStorage for profile")
        }
    }

    if (user && !isOffline && isSyncEnabled) {
        try {
            const profileRef = doc(db, 'userProfiles', user.uid);
            await setDoc(profileRef, { daysOff: newDaysOff }, { merge: true });
        } catch (error) {
            console.error("Failed to set day off: ", error);
        }
    }
  }, [user, isOffline, isSyncEnabled]);

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
    <ProfileContext.Provider value={{ profile, setProfile, daysOff, setDaysOff, loading, customProfessions, deleteCustomProfession }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
