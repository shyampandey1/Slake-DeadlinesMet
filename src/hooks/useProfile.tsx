
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

export const professions: { [group: string]: (Profession & { activeColor: string })[] } = {
    "Creative": [
        { name: "Artist", icon: "Palette", color: "text-rose-400 border-rose-500/80 hover:bg-rose-800 hover:text-white", activeColor: "bg-rose-800 text-rose-100 border-rose-500/80" },
        { name: "Content Creator", icon: "Camera", color: "text-orange-400 border-orange-500/80 hover:bg-orange-800 hover:text-white", activeColor: "bg-orange-800 text-orange-100 border-orange-500/80" },
        { name: "Designer", icon: "PenTool", color: "text-purple-400 border-purple-500/80 hover:bg-purple-800 hover:text-white", activeColor: "bg-purple-800 text-purple-100 border-purple-500/80" },
        { name: "Writer", icon: "PenSquare", color: "text-blue-400 border-blue-500/80 hover:bg-blue-800 hover:text-white", activeColor: "bg-blue-800 text-blue-100 border-blue-500/80" },
    ],
    "Business & Management": [
        { name: "Consultant", icon: "Briefcase", color: "text-cyan-400 border-cyan-500/80 hover:bg-cyan-800 hover:text-white", activeColor: "bg-cyan-800 text-cyan-100 border-cyan-500/80" },
        { name: "Entrepreneur", icon: "Lightbulb", color: "text-amber-400 border-amber-500/80 hover:bg-amber-800 hover:text-white", activeColor: "bg-amber-800 text-amber-100 border-amber-500/80" },
        { name: "Manager", icon: "Users", color: "text-lime-400 border-lime-500/80 hover:bg-lime-800 hover:text-white", activeColor: "bg-lime-800 text-lime-100 border-lime-500/80" },
        { name: "Marketer", icon: "Megaphone", color: "text-red-400 border-red-500/80 hover:bg-red-800 hover:text-white", activeColor: "bg-red-800 text-red-100 border-red-500/80" },
    ],
    "Technical & Health": [
        { name: "Analyst", icon: "BarChart", color: "text-emerald-400 border-emerald-500/80 hover:bg-emerald-800 hover:text-white", activeColor: "bg-emerald-800 text-emerald-100 border-emerald-500/80" },
        { name: "Healthcare Professional", icon: "Stethoscope", color: "text-teal-400 border-teal-500/80 hover:bg-teal-800 hover:text-white", activeColor: "bg-teal-800 text-teal-100 border-teal-500/80" },
        { name: "IT Professional", icon: "Laptop", color: "text-indigo-400 border-indigo-500/80 hover:bg-indigo-800 hover:text-white", activeColor: "bg-indigo-800 text-indigo-100 border-indigo-500/80" },
        { name: "Software Engineer", icon: "Code", color: "text-fuchsia-400 border-fuchsia-500/80 hover:bg-fuchsia-800 hover:text-white", activeColor: "bg-fuchsia-800 text-fuchsia-100 border-fuchsia-500/80" },
        { name: "Researcher", icon: "FlaskConical", color: "text-sky-400 border-sky-500/80 hover:bg-sky-800 hover:text-white", activeColor: "bg-sky-800 text-sky-100 border-sky-500/80" },
    ],
    "General & Freelance": [
        { name: "Educator", icon: "School", color: "text-yellow-400 border-yellow-500/80 hover:bg-yellow-800 hover:text-white", activeColor: "bg-yellow-800 text-yellow-100 border-yellow-500/80" },
        { name: "Freelancer", icon: "Network", color: "text-pink-400 border-pink-500/80 hover:bg-pink-800 hover:text-white", activeColor: "bg-pink-800 text-pink-100 border-pink-500/80" },
        { name: "Student", icon: "GraduationCap", color: "text-stone-400 border-stone-500/80 hover:bg-stone-800 hover:text-white", activeColor: "bg-stone-800 text-stone-100 border-stone-500/80" },
        { name: "Sales", icon: "TrendingUp", color: "text-green-400 border-green-500/80 hover:bg-green-800 hover:text-white", activeColor: "bg-green-800 text-green-100 border-green-500/80" },
        { name: "Medical Representative", icon: "Truck", color: "text-slate-400 border-slate-500/80 hover:bg-slate-800 hover:text-white", activeColor: "bg-slate-800 text-slate-100 border-slate-500/80" },
        { name: "Delivery Agent", icon: "Package", color: "text-gray-400 border-gray-500/80 hover:bg-gray-800 hover:text-white", activeColor: "bg-gray-800 text-gray-100 border-gray-500/80" },
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
  updateUserProfileData: (data: Partial<UserProfile>) => Promise<void>;
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
  updateUserProfileData: async () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isOffline, isSyncEnabled } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const profile = profileData?.profile || "General";
  const daysOff = profileData?.daysOff || [];
  const customProfessions = profileData?.customProfessions || [];
  
  const initializeUserTasks = useCallback(async (uid: string, prof: ProfileType) => {
    if (!prof || !isSyncEnabled || isOffline) return;

    try {
        const userRef = doc(db, 'users', uid);
        
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            let userData = userDoc.data() as UserProfile | undefined;

            if (!userData) {
                // If the user document itself doesn't exist, create it.
                userData = { userId: uid, profile: prof, routineVersions: {} };
                transaction.set(userRef, userData);
            }

            const currentVersion = userData.routineVersions?.[prof] || 0;
            const routineKey = profileToRoutineMap[prof];
            if (!routineKey) return; 

            const tasksCollectionRef = collection(db, 'users', uid, 'userPresetTasks');
            
            // If the version is outdated, we clear existing tasks and reset to the new template
            if (Number(currentVersion) < ROUTINE_TEMPLATE_VERSION) {
                console.log(`Updating ${prof} routine from v${currentVersion} to v${ROUTINE_TEMPLATE_VERSION}`);
                
                const tasksQuery = query(tasksCollectionRef, where('profession', '==', prof));
                const tasksSnapshot = await getDocs(tasksQuery);
                
                // Delete existing tasks for this profession
                tasksSnapshot.forEach(doc => transaction.delete(doc.ref));

                // Add new tasks from the template
                const defaultTasks = defaultRoutines.routines[routineKey] || [];
                let order = 0;
                defaultTasks.forEach(task => {
                    const newTaskRef = doc(collection(db, 'users', uid, 'userPresetTasks'));
                    transaction.set(newTaskRef, { ...task, userId: uid, profession: prof, order: order++ });
                });
                
                const updatedVersions = { ...(userData?.routineVersions || {}), [prof]: ROUTINE_TEMPLATE_VERSION };
                transaction.set(userRef, { routineVersions: updatedVersions }, { merge: true });
            }
        });
    } catch (error) {
        console.error(`Transaction to initialize/update tasks for ${prof} failed: `, error);
    }
  }, [isSyncEnabled, isOffline]);


  useEffect(() => {
    if (!user || sessionStorage.getItem('SIGNOUT_IN_PROGRESS')) {
        setLoading(false);
        return;
    }

    if (isOffline || !isSyncEnabled) {
        setLoading(true);
        try {
            const storedProfile = localStorage.getItem(`user-profile_${user.uid}`);
            if (storedProfile) {
                setProfileData(JSON.parse(storedProfile));
            } else {
                const defaultProfile: UserProfile = { userId: user.uid, profile: 'General', daysOff: [], customProfessions: [], routineVersions: {}};
                setProfileData(defaultProfile);
                localStorage.setItem(`user-profile_${user.uid}`, JSON.stringify(defaultProfile));
            }
        } catch (e) {
            console.warn("Could not access localStorage for profile");
            setProfileData({ userId: user.uid, profile: 'General', daysOff: [], customProfessions: [], routineVersions: {}});
        }
        setLoading(false);
        return;
    }

    setLoading(true);
    const profileRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(profileRef, async (docSnap) => {
        let dataToSet: UserProfile;
        if (docSnap.exists()) {
            dataToSet = docSnap.data() as UserProfile;
        } else {
            dataToSet = { 
                userId: user.uid, 
                profile: "General", 
                daysOff: [] as Day[], 
                customProfessions: [], 
                routineVersions: {},
                displayName: user.displayName || undefined,
                email: user.email || undefined,
                displayPicture: 'photoURL' in user ? user.photoURL || undefined : undefined,
                createdAt: new Date().toISOString()
            };
            await setDoc(profileRef, dataToSet); // This creates the user doc if it doesn't exist
        }

        setProfileData(dataToSet);

        try {
            localStorage.setItem(`user-profile_${user.uid}`, JSON.stringify(dataToSet));
        } catch (e) {
            console.warn("Could not write profile to localStorage");
        }
        
        if (dataToSet.profile) {
            await initializeUserTasks(user.uid, dataToSet.profile);
        }
        setLoading(false);

    }, (error) => {
        console.error("Error fetching profile:", error);
        setLoading(false);
    });
    
    return () => unsubscribe();

  }, [user, isOffline, isSyncEnabled, initializeUserTasks]);


    const setProfile = useCallback(async (newProfile: ProfileType) => {
    if (!user) return;
    if (profile === newProfile) return;
    
    // Immediate local state update for UI responsiveness
    setProfileData(prev => {
        const base = prev || { userId: user.uid, daysOff: [], customProfessions: [], routineVersions: {} };
        const updated = { ...base, profile: newProfile };
        
        try {
            localStorage.setItem(`user-profile_${user.uid}`, JSON.stringify(updated));
        } catch(e) { console.warn("Could not access localStorage for profile"); }
        
        return updated;
    });

    if (user && !isOffline && isSyncEnabled) {
        try {
            const profileRef = doc(db, 'users', user.uid);
            await updateDoc(profileRef, { profile: newProfile });
            await initializeUserTasks(user.uid, newProfile);
        } catch (error) {
            console.error("Failed to set profile: ", error);
        }
    }
  }, [user, isOffline, isSyncEnabled, profile, profileData, initializeUserTasks]);
  
  const setDaysOff = useCallback(async (newDaysOff: Day[]) => {
     if (!user) return;
    const updatedData: UserProfile = { ...(profileData || { userId: user.uid, profile: 'General', customProfessions: [], routineVersions: {} }), daysOff: newDaysOff };
    setProfileData(updatedData);

     try {
        localStorage.setItem(`user-profile_${user.uid}`, JSON.stringify(updatedData));
    } catch(e) { console.warn("Could not access localStorage for profile"); }

    if (user && !isOffline && isSyncEnabled) {
        try {
            const profileRef = doc(db, 'users', user.uid);
            await updateDoc(profileRef, { daysOff: newDaysOff });
        } catch (error) {
            console.error("Failed to set day off: ", error);
        }
    }
  }, [user, isOffline, isSyncEnabled, profileData]);

  const deleteCustomProfession = useCallback(async (professionName: string) => {
    if (!user || isOffline || !isSyncEnabled) return;

    try {
        const profileRef = doc(db, 'users', user.uid);
        const tasksCollectionRef = collection(db, 'users', user.uid, 'userPresetTasks');
        
        await runTransaction(db, async (transaction) => {
            const profileDoc = await transaction.get(profileRef);

            if (profileDoc.exists()) {
                const currentData = profileDoc.data() as UserProfile;
                const newCustomProfessions = (currentData.customProfessions || []).filter(
                    (p: CustomProfession) => p.name !== professionName
                );
                
                const updatePayload: Partial<UserProfile> = { customProfessions: newCustomProfessions };
                if (currentData.profile === professionName) {
                    updatePayload.profile = "General";
                    setProfileData(prev => ({...prev!, profile: 'General'}));
                }
                transaction.update(profileRef, updatePayload);
            }
            
            const tasksQuery = query(tasksCollectionRef, where('profession', '==', professionName));
            const tasksSnapshot = await getDocs(tasksQuery);
            tasksSnapshot.forEach(doc => transaction.delete(doc.ref));
        });
    } catch (error) {
        console.error(`Failed to delete profession ${professionName}:`, error);
        throw error;
    }

  }, [user, isOffline, isSyncEnabled]);


  const updateUserProfileData = useCallback(async (data: Partial<UserProfile>) => {
    if (!user) return;
    setProfileData(prev => {
        const updated = prev ? { ...prev, ...data } : null;
        try { if(updated) localStorage.setItem(`user-profile_${user.uid}`, JSON.stringify(updated)); } catch(e) {}
        return updated;
    });
    if (!isOffline && isSyncEnabled) {
      try {
        const profileRef = doc(db, 'users', user.uid);
        await updateDoc(profileRef, data);
      } catch (error) { console.error("Failed to update profile data", error); }
    }
  }, [user, isOffline, isSyncEnabled]);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, daysOff, setDaysOff, loading, customProfessions, deleteCustomProfession, profileData, updateUserProfileData }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
