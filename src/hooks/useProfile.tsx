
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
import { doc, getDoc, setDoc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import type { ProfileType, CustomProfession, PresetTask } from "@/types";

interface ProfileContextType {
  profile: ProfileType;
  setProfile: (profile: ProfileType) => void;
  customProfessions: CustomProfession[];
  addCustomProfession: (profession: CustomProfession, tasks: (PresetTask & { category: string })[]) => Promise<void>;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: "General",
  setProfile: () => {},
  customProfessions: [],
  addCustomProfession: async () => {},
  loading: true,
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfileState] = useState<ProfileType>("General");
  const [customProfessions, setCustomProfessionsState] = useState<CustomProfession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || ('isMockUser' in user && user.isMockUser)) {
        setProfileState("General");
        setCustomProfessionsState([]);
        setLoading(false);
        return;
    }

    setLoading(true);
    const profileRef = doc(db, 'userProfiles', user.uid);

    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setProfileState(data.profile || "General");
            setCustomProfessionsState(data.customProfessions || []);
        } else {
            // If no profile, set default "General"
            setDoc(profileRef, { profile: "General", customProfessions: [] });
            setProfileState("General");
            setCustomProfessionsState([]);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching profile:", error);
        setLoading(false);
    });
    
    return () => unsubscribe();

  }, [user]);

  const setProfile = useCallback(async (newProfile: ProfileType) => {
    setProfileState(newProfile);
    if (user && !('isMockUser' in user)) {
        const profileRef = doc(db, 'userProfiles', user.uid);
        await updateDoc(profileRef, { profile: newProfile });
    }
  }, [user]);

  const addCustomProfession = useCallback(async (profession: CustomProfession, tasks: (PresetTask & { category: string })[]) => {
    if (user && !('isMockUser' in user)) {
        const profileRef = doc(db, 'userProfiles', user.uid);
        
        // Add the new profession to the list of custom professions
        await updateDoc(profileRef, {
            customProfessions: arrayUnion(profession)
        });

        // Set the new profession as the active profile
        await setProfile(profession.name);

        // Overwrite tasks for that profession name
        const q = query(collection(db, 'userPresetTasks'), where('userId', '==', user.uid), where('profession', '==', profession.name));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        const tasksByCategory: { [key: string]: (PresetTask & { category: string })[] } = {};
        tasks.forEach(task => {
            if (!tasksByCategory[task.category]) {
                tasksByCategory[task.category] = [];
            }
            tasksByCategory[task.category].push(task);
        });
        
        Object.values(tasksByCategory).forEach(categoryTasks => {
            categoryTasks.forEach((task, index) => {
                const newDocRef = doc(collection(db, 'userPresetTasks'));
                batch.set(newDocRef, {
                    ...task,
                    order: index,
                    userId: user.uid,
                    profession: profession.name,
                });
            });
        });

        await batch.commit();
    }
  }, [user, setProfile]);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, loading, customProfessions, addCustomProfession }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
