

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
import { ROUTINE_TEMPLATE_VERSION, profileToRoutineMap, defaultRoutines } from '@/lib/routines';


export type Profession = {
    name: ProfileType;
    icon: string;
    color: string;
}

export const professions: { [group: string]: Profession[] } = {
    "Creative": [
        { name: "Artist", icon: "Palette", color: "text-rose-400 border-rose-500/80 hover:bg-rose-800 hover:text-white" },
        { name: "Content Creator", icon: "Camera", color: "text-orange-400 border-orange-500/80 hover:bg-orange-800 hover:text-white" },
        { name: "Designer", icon: "PenTool", color: "text-purple-400 border-purple-500/80 hover:bg-purple-800 hover:text-white" },
        { name: "Writer", icon: "PenSquare", color: "text-blue-400 border-blue-500/80 hover:bg-blue-800 hover:text-white" },
    ],
    "Business & Management": [
        { name: "Consultant", icon: "Briefcase", color: "text-cyan-400 border-cyan-500/80 hover:bg-cyan-800 hover:text-white" },
        { name: "Entrepreneur", icon: "Lightbulb", color: "text-amber-400 border-amber-500/80 hover:bg-amber-800 hover:text-white" },
        { name: "Manager", icon: "Users", color: "text-lime-400 border-lime-500/80 hover:bg-lime-800 hover:text-white" },
        { name: "Marketer", icon: "Megaphone", color: "text-red-400 border-red-500/80 hover:bg-red-800 hover:text-white" },
    ],
    "Technical & Health": [
        { name: "Analyst", icon: "BarChart", color: "text-emerald-400 border-emerald-500/80 hover:bg-emerald-800 hover:text-white" },
        { name: "Healthcare Professional", icon: "Stethoscope", color: "text-teal-400 border-teal-500/80 hover:bg-teal-800 hover:text-white" },
        { name: "IT Professional", icon: "Laptop", color: "text-indigo-400 border-indigo-500/80 hover:bg-indigo-800 hover:text-white" },
        { name: "Software Engineer", icon: "Code", color: "text-fuchsia-400 border-fuchsia-500/80 hover:bg-fuchsia-800 hover:text-white" },
        { name: "Researcher", icon: "FlaskConical", color: "text-sky-400 border-sky-500/80 hover:bg-sky-800 hover:text-white" },
    ],
    "General & Freelance": [
        { name: "Educator", icon: "School", color: "text-yellow-400 border-yellow-500/80 hover:bg-yellow-800 hover:text-white" },
        { name: "Freelancer", icon: "Network", color: "text-pink-400 border-pink-500/80 hover:bg-pink-800 hover:text-white" },
        { name: "Student", icon: "GraduationCap", color: "text-stone-400 border-stone-500/80 hover:bg-stone-800 hover:text-white" },
        { name: "Sales", icon: "TrendingUp", color: "text-green-400 border-green-500/80 hover:bg-green-800 hover:text-white" },
        { name: "Medical Representative", icon: "Truck", color: "text-slate-400 border-slate-500/80 hover:bg-slate-800 hover:text-white" },
        { name: "Delivery Agent", icon: "Package", color: "text-gray-400 border-gray-500/80 hover:bg-gray-800 hover:text-white" },
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
    if (!prof || !isSyncEnabled || !profileToRoutineMap[prof]) return;
    try {
        const currentVersion = userProfile?.routineVersions?.[prof] || 0;
        if (currentVersion >= ROUTINE_TEMPLATE_VERSION) {
            return;
        }

        const profileRef = doc(db, 'userProfiles', uid);
        await runTransaction(db, async (transaction) => {
            const tasksToDeleteQuery = query(
                collection(db, 'userPresetTasks'),
                where('userId', '==', uid),
                where('profession', '==', prof)
            );
            const tasksToDeleteSnapshot = await getDocs(tasksToDeleteQuery);
            tasksToDeleteSnapshot.forEach(doc => transaction.delete(doc.ref));

            const routineKey = profileToRoutineMap[prof]!;
            const defaultTasks = defaultRoutines.routines[routineKey] || [];
            let order = 0;
            defaultTasks.forEach(task => {
                const newTaskRef = doc(collection(db, "userPresetTasks"));
                transaction.set(newTaskRef, { ...task, userId: uid, profession: prof, order: order++ });
            });
            
            const freshProfile = await transaction.get(profileRef);
            const freshProfileData = freshProfile.data() || {};
            const routineVersions = { ...(freshProfileData.routineVersions || {}), [prof]: ROUTINE_TEMPLATE_VERSION };
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
                    setProfileData(JSON.parse(storedProfile));
                } else {
                    setProfileData({ profile: 'General', daysOff: [], customProfessions: [], routineVersions: {}});
                }
            } catch (e) {
                console.warn("Could not access localStorage for profile");
                setProfileData({ profile: 'General', daysOff: [], customProfessions: [], routineVersions: {}});
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
        
        if (dataToSet.profile) {
            initializeUserTasks(user.uid, dataToSet.profile, dataToSet).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, (error) => {
        console.error("Error fetching profile:", error);
        setLoading(false);
    });
    
    return () => unsubscribe();

  }, [user, isOffline, isSyncEnabled, initializeUserTasks]);


  const setProfile = useCallback(async (newProfile: ProfileType) => {
    if (profile === newProfile) return;
    
    const updatedData = { ...profileData, profile: newProfile } as UserProfile;
    setProfileData(updatedData);

    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem('user-profile', JSON.stringify(updatedData));
        } catch(e) { console.warn("Could not access localStorage for profile"); }
    }

    if (user && !isOffline && isSyncEnabled) {
        try {
            const profileRef = doc(db, 'userProfiles', user.uid);
            await setDoc(profileRef, { profile: newProfile }, { merge: true });
            await initializeUserTasks(user.uid, newProfile, updatedData);
        } catch (error) {
            console.error("Failed to set profile: ", error);
        }
    }
  }, [user, isOffline, isSyncEnabled, profile, profileData, initializeUserTasks]);
  
  const setDaysOff = useCallback(async (newDaysOff: Day[]) => {
    const updatedData = { ...profileData, daysOff: newDaysOff } as UserProfile;
    setProfileData(updatedData);

    if (typeof window !== 'undefined') {
         try {
            localStorage.setItem('user-profile', JSON.stringify(updatedData));
        } catch(e) { console.warn("Could not access localStorage for profile"); }
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
