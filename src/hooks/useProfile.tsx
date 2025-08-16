

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
import { ROUTINE_TEMPLATE_VERSION, defaultRoutines, profileToRoutineMap } from './useFirestore';


export type Profession = {
    name: ProfileType;
    icon: string;
    color: string;
}

export const professions: { [group: string]: Profession[] } = {
    "Creative": [
        { name: "Artist", icon: "Palette", color: "text-rose-800" },
        { name: "Content Creator", icon: "Camera", color: "text-orange-800" },
        { name: "Designer", icon: "PenTool", color: "text-purple-800" },
        { name: "Writer", icon: "PenLine", color: "text-blue-800" },
    ],
    "Business & Management": [
        { name: "Consultant", icon: "Briefcase", color: "text-cyan-800" },
        { name: "Entrepreneur", icon: "Lightbulb", color: "text-amber-800" },
        { name: "Manager", icon: "Users", color: "text-lime-800" },
        { name: "Marketer", icon: "Megaphone", color: "text-red-800" },
        { name: "Sales", icon: "TrendingUp", color: "text-green-800" },
        { name: "Medical Representative", icon: "Briefcase", color: "text-stone-800" }
    ],
    "Technical & Health": [
        { name: "Analyst", icon: "BarChart", color: "text-emerald-800" },
        { name: "Healthcare Professional", icon: "Stethoscope", color: "text-teal-800" },
        { name: "IT Professional", icon: "Laptop", color: "text-indigo-800" },
        { name: "Software Engineer", icon: "Code", color: "text-fuchsia-800" },
        { name: "Researcher", icon: "FlaskConical", color: "text-sky-800" },
    ],
    "General & Freelance": [
        { name: "Educator", icon: "School", color: "text-yellow-800" },
        { name: "Freelancer", icon: "Network", color: "text-rose-800" },
        { name: "Student", icon: "GraduationCap", color: "text-stone-800" },
        { name: "General", icon: "User", color: "text-gray-800" },
        { name: "Delivery Agent", icon: "Truck", color: "text-slate-800" },
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

  const initializeUserTasks = useCallback(async (uid: string, prof: ProfileType, userProfile: UserProfile) => {
    if (!prof || !isSyncEnabled) return;

    try {
        const currentVersion = userProfile?.routineVersions?.[prof] || 0;
        if (currentVersion >= ROUTINE_TEMPLATE_VERSION) {
            return; // Already up to date
        }

        await runTransaction(db, async (transaction) => {
            // Delete old tasks for this profession
            const tasksToDeleteQuery = query(
                collection(db, 'userPresetTasks'),
                where('userId', '==', uid),
                where('profession', '==', prof)
            );
            // We must get docs outside transaction for reads
            const tasksToDeleteSnapshot = await getDocs(tasksToDeleteQuery);
            tasksToDeleteSnapshot.forEach(doc => transaction.delete(doc.ref));

            // Add new tasks from the template
            const routineKey = profileToRoutineMap[prof] || 'General';
            const defaultTasks = defaultRoutines.routines[routineKey] || [];
            let order = 0;
            defaultTasks.forEach(task => {
                const newTaskRef = doc(collection(db, "userPresetTasks"));
                transaction.set(newTaskRef, { ...task, userId: uid, profession: prof, order: order++ });
            });

            // Update the version number in the user's profile
            const profileRef = doc(db, 'userProfiles', uid);
            const routineVersions = { ...(userProfile.routineVersions || {}), [prof]: ROUTINE_TEMPLATE_VERSION };
            transaction.set(profileRef, { routineVersions }, { merge: true });
        });
    } catch (error) {
        console.error(`Transaction to initialize/update tasks for ${prof} failed: `, error);
    }
  }, [isSyncEnabled]);


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
             if (!dataToSet.routineVersions) {
                dataToSet.routineVersions = {};
            }
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


  // Effect to initialize routines for all professions once
  useEffect(() => {
    if (user && profileData && !loading) {
      const allProfessionKeys = Object.keys(profileToRoutineMap) as ProfileType[];
      const promises = allProfessionKeys.map(prof => initializeUserTasks(user.uid, prof, profileData));
      
      Promise.all(promises).then(() => {
          // Optional: do something after all initializations are checked/done
      }).catch(err => {
          console.error("Error initializing all profession routines", err);
      });
    }
  }, [user, profileData, loading, initializeUserTasks]);


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
