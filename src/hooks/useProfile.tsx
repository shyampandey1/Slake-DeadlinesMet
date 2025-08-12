

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
        { name: "Artist", icon: "Palette", color: "bg-rose-100 dark:bg-rose-800 border-rose-500/80 text-rose-800 dark:text-rose-100" },
        { name: "Content Creator", icon: "Camera", color: "bg-orange-100 dark:bg-orange-800 border-orange-500/80 text-orange-800 dark:text-orange-100" },
        { name: "Designer", icon: "PenTool", color: "bg-purple-100 dark:bg-purple-800 border-purple-500/80 text-purple-800 dark:text-purple-100" },
        { name: "Writer", icon: "PenLine", color: "bg-blue-100 dark:bg-blue-800 border-blue-500/80 text-blue-800 dark:text-blue-100" },
    ],
    "Business & Management": [
        { name: "Consultant", icon: "Briefcase", color: "bg-cyan-100 dark:bg-cyan-800 border-cyan-500/80 text-cyan-800 dark:text-cyan-100" },
        { name: "Entrepreneur", icon: "Lightbulb", color: "bg-amber-100 dark:bg-amber-800 border-amber-500/80 text-amber-800 dark:text-amber-100" },
        { name: "Manager", icon: "Users", color: "bg-lime-100 dark:bg-lime-800 border-lime-500/80 text-lime-800 dark:text-lime-100" },
        { name: "Marketer", icon: "Megaphone", color: "bg-red-100 dark:bg-red-800 border-red-500/80 text-red-800 dark:text-red-100" },
        { name: "Sales", icon: "TrendingUp", color: "bg-green-100 dark:bg-green-800 border-green-500/80 text-green-800 dark:text-green-100" },
        { name: "Medical Representative", icon: "Briefcase", color: "bg-stone-100 dark:bg-stone-800 border-stone-500/80 text-stone-800 dark:text-stone-100" }
    ],
    "Technical & Health": [
        { name: "Healthcare Professional", icon: "Stethoscope", color: "bg-teal-100 dark:bg-teal-800 border-teal-500/80 text-teal-800 dark:text-teal-100" },
        { name: "IT Professional", icon: "Laptop", color: "bg-indigo-100 dark:bg-indigo-800 border-indigo-500/80 text-indigo-800 dark:text-indigo-100" },
        { name: "Software Engineer", icon: "Code", color: "bg-fuchsia-100 dark:bg-fuchsia-800 border-fuchsia-500/80 text-fuchsia-800 dark:text-fuchsia-100" },
        { name: "Researcher", icon: "FlaskConical", color: "bg-sky-100 dark:bg-sky-800 border-sky-500/80 text-sky-800 dark:text-sky-100" },
    ],
    "General & Freelance": [
        { name: "Educator", icon: "School", color: "bg-yellow-100 dark:bg-yellow-800 border-yellow-500/80 text-yellow-800 dark:text-yellow-100" },
        { name: "Freelancer", icon: "Network", color: "bg-rose-100 dark:bg-rose-800 border-rose-500/80 text-rose-800 dark:text-rose-100" },
        { name: "Student", icon: "GraduationCap", color: "bg-stone-100 dark:bg-stone-800 border-stone-500/80 text-stone-800 dark:text-stone-100" },
        { name: "General", icon: "User", color: "bg-gray-100 dark:bg-gray-800 border-gray-500/80 text-gray-800 dark:text-gray-100" },
        { name: "Delivery Agent", icon: "Truck", color: "bg-slate-100 dark:bg-slate-800 border-slate-500/80 text-slate-800 dark:text-slate-100" },
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
  profileData: UserProfile | null;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: "General",
  setProfile: () => {},
  daysOff: [],
  setDaysOff: () => {},
  customProfessions: [],
  deleteCustomProfession: async () => {},
  loading: true,
  profileData: null,
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isOffline, isSyncEnabled } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const profile = profileData?.profile || "General";
  const daysOff = profileData?.daysOff || [];
  const customProfessions = profileData?.customProfessions || [];

  useEffect(() => {
    if (!user || isOffline || !isSyncEnabled) {
        if (typeof window !== 'undefined') {
            try {
                const storedProfile = localStorage.getItem('user-profile');
                if (storedProfile) {
                    const parsedProfile: UserProfile = JSON.parse(storedProfile);
                    setProfileData(parsedProfile);
                } else {
                    setProfileData({ profile: 'General', daysOff: [], customProfessions: [], routineVersions: {} });
                }
            } catch (e) {
                console.warn("Could not access localStorage for profile");
                setProfileData({ profile: 'General', daysOff: [], customProfessions: [], routineVersions: {} });
            }
        }
        setLoading(false);
        return;
    }

    setLoading(true);
    const profileRef = doc(db, 'userProfiles', user.uid);

    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
        let dataToSet: UserProfile;
        if (docSnap.exists()) {
            dataToSet = docSnap.data() as UserProfile;
        } else {
            // If no profile, set default "General"
            dataToSet = { profile: "General", daysOff: [] as Day[], customProfessions: [], routineVersions: {} };
            setDoc(profileRef, dataToSet);
        }

        setProfileData(dataToSet);
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('user-profile', JSON.stringify(dataToSet));
            } catch (e) {
                console.warn("Could not write profile to localStorage");
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
    
    const updatedData = { ...profileData, profile: newProfile } as UserProfile;
    setProfileData(updatedData);
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem('user-profile', JSON.stringify(updatedData));
        } catch(e) {
            console.warn("Could not access localStorage for profile");
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
  }, [user, isOffline, isSyncEnabled, profile, profileData]);
  
  const setDaysOff = useCallback(async (newDaysOff: Day[]) => {
    const updatedData = { ...profileData, daysOff: newDaysOff } as UserProfile;
    setProfileData(updatedData);

    if (typeof window !== 'undefined') {
         try {
            localStorage.setItem('user-profile', JSON.stringify(updatedData));
        } catch(e) {
            console.warn("Could not access localStorage for profile");
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
  }, [user, isOffline, isSyncEnabled, profileData]);

  const deleteCustomProfession = useCallback(async (professionName: string) => {
    if (!user || isOffline || !isSyncEnabled) return;

    try {
        await runTransaction(db, async (transaction) => {
            const profileRef = doc(db, 'userProfiles', user.uid);
            const profileDoc = await transaction.get(profileRef);

            if (profileDoc.exists()) {
                const currentData = profileDoc.data() as UserProfile;
                const currentCustomProfessions = (currentData.customProfessions || []).filter(
                    (p: CustomProfession) => p.name !== professionName
                );
                
                transaction.update(profileRef, { customProfessions: currentCustomProfessions });

                if (profile === professionName) {
                    transaction.update(profileRef, { profile: "General" });
                    setProfileData(prev => ({...prev!, profile: 'General'}));
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
    <ProfileContext.Provider value={{ profile, setProfile, daysOff, setDaysOff, loading, customProfessions, deleteCustomProfession, profileData }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
