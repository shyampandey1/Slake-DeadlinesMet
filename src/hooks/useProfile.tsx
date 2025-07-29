
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
import { doc, getDoc, setDoc, onSnapshot, updateDoc, arrayUnion, collection, query, where, getDocs, writeBatch, runTransaction } from "firebase/firestore";
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
  const { user, isOffline } = useAuth();
  const [profile, setProfileState] = useState<ProfileType>("General");
  const [customProfessions, setCustomProfessionsState] = useState<CustomProfession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || isOffline) {
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

  }, [user, isOffline]);

  const setProfile = useCallback(async (newProfile: ProfileType) => {
    setProfileState(newProfile);
    if (user && !isOffline) {
        try {
            const profileRef = doc(db, 'userProfiles', user.uid);
            await setDoc(profileRef, { profile: newProfile }, { merge: true });
        } catch (error) {
            console.error("Failed to set profile: ", error);
        }
    }
  }, [user, isOffline]);

  const addCustomProfession = useCallback(async (profession: CustomProfession, tasks: (PresetTask & { category: string })[]) => {
    if (!user || isOffline) return;

    const profileRef = doc(db, 'userProfiles', user.uid);
    const tasksCollectionRef = collection(db, 'userPresetTasks');

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Get the current user profile
            const profileDoc = await transaction.get(profileRef);
            let currentCustomProfessions: CustomProfession[] = [];

            if (profileDoc.exists()) {
                currentCustomProfessions = profileDoc.data().customProfessions || [];
            }
            
            // 2. Add the new profession if it doesn't exist
            if (!currentCustomProfessions.some(p => p.name === profession.name)) {
                currentCustomProfessions.push(profession);
            }

            // 3. Update the profile with the new profession list and set the active profile
            transaction.set(profileRef, {
                profile: profession.name,
                customProfessions: currentCustomProfessions
            }, { merge: true });
            
            // 4. Delete old tasks for this profession
            const q = query(tasksCollectionRef, where('userId', '==', user.uid), where('profession', '==', profession.name));
            const oldTasksSnapshot = await getDocs(q); // Use getDocs, not inside transaction
            oldTasksSnapshot.forEach(doc => {
                transaction.delete(doc.ref);
            });

            // 5. Add new tasks
            const tasksByCategory: { [key: string]: (PresetTask & { category: string })[] } = {};
            tasks.forEach(task => {
                if (!tasksByCategory[task.category]) {
                    tasksByCategory[task.category] = [];
                }
                tasksByCategory[task.category].push(task);
            });

            Object.values(tasksByCategory).forEach(categoryTasks => {
                categoryTasks.forEach((task, index) => {
                    const newDocRef = doc(tasksCollectionRef);
                    transaction.set(newDocRef, {
                        name: task.name,
                        duration: task.duration,
                        icon: task.icon,
                        category: task.category,
                        order: index,
                        userId: user.uid,
                        profession: profession.name,
                    });
                });
            });
        });

        // Manually set the profile state after transaction to trigger UI update
        setProfileState(profession.name);

    } catch (error) {
        console.error("Failed to add custom profession and tasks: ", error);
        throw error; // Re-throw to be caught by the calling function
    }
  }, [user, isOffline]);


  return (
    <ProfileContext.Provider value={{ profile, setProfile, loading, customProfessions, addCustomProfession }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
