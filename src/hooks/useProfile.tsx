

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
        { name: "Artist", icon: "Palette", color: "bg-rose-800 border-rose-500/80 text-rose-100" },
        { name: "Content Creator", icon: "Camera", color: "bg-orange-800 border-orange-500/80 text-orange-100" },
        { name: "Designer", icon: "PenTool", color: "bg-purple-800 border-purple-500/80 text-purple-100" },
        { name: "Writer", icon: "PenLine", color: "bg-blue-800 border-blue-500/80 text-blue-100" },
    ],
    "Business & Management": [
        { name: "Consultant", icon: "Briefcase", color: "bg-cyan-800 border-cyan-500/80 text-cyan-100" },
        { name: "Entrepreneur", icon: "Lightbulb", color: "bg-amber-800 border-amber-500/80 text-amber-100" },
        { name: "Manager", icon: "Users", color: "bg-lime-800 border-lime-500/80 text-lime-100" },
        { name: "Marketer", icon: "Megaphone", color: "bg-red-800 border-red-500/80 text-red-100" },
        { name: "Sales", icon: "TrendingUp", color: "bg-green-800 border-green-500/80 text-green-100" },
        { name: "Medical Representative", icon: "Briefcase", color: "bg-stone-800 border-stone-500/80 text-stone-100" }
    ],
    "Technical & Health": [
        { name: "Healthcare Professional", icon: "Stethoscope", color: "bg-teal-800 border-teal-500/80 text-teal-100" },
        { name: "IT Professional", icon: "Laptop", color: "bg-indigo-800 border-indigo-500/80 text-indigo-100" },
        { name: "Software Engineer", icon: "Code", color: "bg-fuchsia-800 border-fuchsia-500/80 text-fuchsia-100" },
        { name: "Researcher", icon: "FlaskConical", color: "bg-sky-800 border-sky-500/80 text-sky-100" },
    ],
    "General & Freelance": [
        { name: "Educator", icon: "School", color: "bg-yellow-800 border-yellow-500/80 text-yellow-100" },
        { name: "Freelancer", icon: "Network", color: "bg-rose-800 border-rose-500/80 text-rose-100" },
        { name: "Student", icon: "GraduationCap", color: "bg-stone-800 border-stone-500/80 text-stone-100" },
        { name: "General", icon: "User", color: "bg-gray-800 border-gray-500/80 text-gray-100" },
        { name: "Delivery Agent", icon: "Truck", color: "bg-slate-800 border-slate-500/80 text-slate-100" },
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
