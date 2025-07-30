
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
import { doc, getDoc, setDoc, onSnapshot, updateDoc, arrayUnion, collection, query, where, getDocs, writeBatch, runTransaction, addDoc, serverTimestamp } from "firebase/firestore";
import type { ProfileType, CustomProfession, PresetTask } from "@/types";

interface ProfileContextType {
  profile: ProfileType;
  setProfile: (profile: ProfileType) => void;
  customProfessions: CustomProfession[];
  addCustomProfession: (profession: CustomProfession, tasks: (PresetTask & { category: string })[]) => Promise<void>;
  addTasksToCurrentProfile: (tasks: (Omit<PresetTask, 'order'> & { category: string })[]) => Promise<void>;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: "General",
  setProfile: () => {},
  customProfessions: [],
  addCustomProfession: async () => {},
  addTasksToCurrentProfile: async () => {},
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
            const profileDoc = await transaction.get(profileRef);
            let currentCustomProfessions: CustomProfession[] = [];

            if (profileDoc.exists()) {
                currentCustomProfessions = profileDoc.data().customProfessions || [];
            }
            
            if (!currentCustomProfessions.some(p => p.name === profession.name)) {
                currentCustomProfessions.push(profession);
            }

            transaction.set(profileRef, {
                profile: profession.name,
                customProfessions: currentCustomProfessions
            }, { merge: true });
            
            const q = query(tasksCollectionRef, where('userId', '==', user.uid), where('profession', '==', profession.name));
            const oldTasksSnapshot = await getDocs(q); 
            oldTasksSnapshot.forEach(doc => {
                transaction.delete(doc.ref);
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

        setProfileState(profession.name);

    } catch (error) {
        console.error("Failed to add custom profession and tasks: ", error);
        throw error;
    }
  }, [user, isOffline]);

  const addTasksToCurrentProfile = useCallback(async (tasks: (Omit<PresetTask, 'order'> & { category: string })[]) => {
    if (!user || isOffline) return;

    try {
        const batch = writeBatch(db);
        const tasksCollectionRef = collection(db, 'userPresetTasks');

        for (const task of tasks) {
            const q = query(tasksCollectionRef, where('userId', '==', user.uid), where('profession', '==', profile), where('category', '==', task.category));
            const snapshot = await getDocs(q);
            const maxOrder = snapshot.docs.reduce((max, doc) => Math.max(max, doc.data().order), -1);

            const newDocRef = doc(tasksCollectionRef);
            batch.set(newDocRef, {
                ...task,
                order: maxOrder + 1,
                userId: user.uid,
                profession: profile,
            });
        }
        await batch.commit();

    } catch(error) {
        console.error("Failed to add tasks to current profile", error);
        throw error;
    }
  }, [user, profile, isOffline]);


  return (
    <ProfileContext.Provider value={{ profile, setProfile, loading, customProfessions, addCustomProfession, addTasksToCurrentProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
