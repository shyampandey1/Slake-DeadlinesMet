
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, deleteDoc, doc, Timestamp, writeBatch, getDocs, updateDoc, limit, runTransaction } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { Task, Preset, PresetTask, UserPresetTask } from '@/types';
import { useProfile } from './useProfile';

const iconMap = {
    ListChecks: "ListChecks",
    Bed: "Bed",
    StretchHorizontal: "StretchHorizontal",
    Dumbbell: "Dumbbell",
    BrainCircuit: "BrainCircuit",
    Mail: "Mail",
    Users: "Users",
    Coffee: "Coffee",
    Footprints: "Footprints",
    Utensils: "Utensils",
    Wind: "Wind",
    Droplets: "Droplets",
    BookOpen: "BookOpen",
    Wrench: "Wrench",
    Target: "Target",
    ShoppingBag: "ShoppingBag",
};
const iconNames = Object.keys(iconMap);

const profilePresets: { [key: string]: Preset } = {
    "Software Engineer": {
        'Morning Foundation': {
            color: "bg-slate-800 text-slate-200",
            tasks: [
                { name: 'Freshen Up & Hydrate', duration: 25, icon: 'Droplets', order: 0 },
                { name: 'Meditation', duration: 10, icon: 'Wind', order: 1 },
                { name: 'Breakfast', duration: 20, icon: 'Utensils', order: 2 },
            ]
        },
        'Daily Strategy': {
            color: "bg-blue-900/80 text-blue-200",
            tasks: [
                { name: 'Plan & Prioritize Tasks', duration: 30, icon: 'ListChecks', order: 0 },
            ]
        },
        'Deep Work': {
            color: "bg-green-900/80 text-green-200",
            tasks: [
                { name: 'Focus on Top Priority Tasks', duration: 180, icon: 'BrainCircuit', order: 0 },
                { name: 'Focus on Secondary Tasks', duration: 150, icon: 'BrainCircuit', order: 1 },
            ]
        },
        'Breaks & Meals': {
            color: "bg-orange-900/80 text-orange-200",
            tasks: [
                { name: 'Short Drive', duration: 45, icon: 'Footprints', order: 0 },
                { name: 'Lunch', duration: 45, icon: 'Utensils', order: 1 },
            ]
        },
        'Afternoon Wrap-up': {
            color: "bg-indigo-900/80 text-indigo-200",
            tasks: [
                { name: 'Progress Review & Analysis', duration: 30, icon: 'Target', order: 0 },
                { name: 'Client App Refinements', duration: 30, icon: 'Wrench', order: 1 },
            ]
        }
    },
    "Student": {
        'Morning Routine': {
            color: "bg-slate-800 text-slate-200",
            tasks: [
                { name: 'Review Notes', duration: 25, icon: 'BookOpen', order: 0 },
                { name: 'Breakfast', duration: 20, icon: 'Utensils', order: 1 },
            ]
        },
        'Study Blocks': {
            color: "bg-blue-900/80 text-blue-200",
            tasks: [
                { name: 'Study Session 1', duration: 90, icon: 'BrainCircuit', order: 0 },
                { name: 'Study Session 2', duration: 90, icon: 'BrainCircuit', order: 1 },
                { name: 'Practice Problems', duration: 60, icon: 'Wrench', order: 2 },
            ]
        },
        'Breaks & Campus Life': {
            color: "bg-green-900/80 text-green-200",
            tasks: [
                { name: 'Lunch with Friends', duration: 60, icon: 'Users', order: 0 },
                { name: 'Walk on Campus', duration: 20, icon: 'Footprints', order: 1 },
            ]
        }
    },
    "General": {
        'Morning Routine': {
            color: "bg-slate-800 text-slate-200",
            tasks: [
                { name: 'Plan Day', duration: 15, icon: 'ListChecks', order: 0 },
                { name: 'Meditate', duration: 10, icon: 'Bed', order: 1 },
            ]
        },
        'Work & Focus': {
            color: "bg-blue-900/80 text-blue-200",
            tasks: [
                { name: 'Focus Session', duration: 50, icon: 'BrainCircuit', order: 1 },
                { name: 'Check Emails', duration: 15, icon: 'Mail', order: 2 },
            ]
        },
        'Health & Wellness': {
            color: "bg-green-900/80 text-green-200",
            tasks: [
                { name: 'Workout', duration: 45, icon: 'Dumbbell', order: 0 },
                { name: 'Drink Water', duration: 1, icon: 'Droplets', recurring: true, order: 2 },
            ]
        },
    }
};

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }
    
    if ('isMockUser' in user && user.isMockUser) {
      const mockTasks: Task[] = [
        { id: 'mock-1', userId: 'mock-user-01', name: 'Finish project proposal (mock)', duration: 60, completed: true, createdAt: new Date().toISOString() },
        { id: 'mock-2', userId: 'mock-user-01', name: 'Review design mockups (mock)', duration: 45, completed: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
      ];
      setTasks(mockTasks);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userTasks = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString()
          } as Task
      });
      setTasks(userTasks);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching tasks:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");

    if ('isMockUser' in user && user.isMockUser) {
        const newTask: Task = {
            id: `mock-${Date.now()}`,
            userId: user.uid,
            createdAt: new Date().toISOString(),
            ...task
        };
        setTasks(prev => [newTask, ...prev]);
        console.log("Mock task added:", newTask);
        return;
    }

    await addDoc(collection(db, 'tasks'), {
      ...task,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
  }, [user]);
  
  const clearTasks = useCallback(async () => {
    if (!user) throw new Error("User not authenticated");

    if ('isMockUser' in user && user.isMockUser) {
        setTasks([]);
        console.log("Mock tasks cleared");
        return;
    }
    
    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();

  }, [user]);


  return { tasks, loading, addTask, clearTasks };
}

export function usePresetTasks() {
    const { user } = useAuth();
    const { profile } = useProfile();
    const [presetTasks, setPresetTasks] = useState<Preset>({});
    const [loading, setLoading] = useState(true);

    const isDefaultTask = (task: UserPresetTask) => {
        return !task.id;
    }

    const getAvailableIcons = () => iconNames;
    const getAvailableCategories = () => {
        const basePreset = profilePresets[profile] || profilePresets["General"];
        return Object.keys(basePreset);
    };

    useEffect(() => {
        if (!user) {
            const initialTasks = profilePresets[profile] || profilePresets["General"];
            setPresetTasks(initialTasks);
            setLoading(false);
            return;
        }

        if ('isMockUser' in user && user.isMockUser) {
            const initialTasks = profilePresets[profile] || profilePresets["General"];
            setPresetTasks(initialTasks);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'userPresetTasks'),
            where('userId', '==', user.uid),
            orderBy('order', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userTasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as (UserPresetTask & {category: string})[];
            
            const basePreset = profilePresets[profile] || profilePresets["General"];
            const newPresets: Preset = JSON.parse(JSON.stringify(basePreset));

            // If profile is custom, we don't start with base tasks
            if (profile === 'Custom') {
                Object.keys(newPresets).forEach(category => {
                    newPresets[category].tasks = [];
                });
            }

            userTasks.forEach(task => {
                if (newPresets[task.category]) {
                    // Avoid duplicating default tasks that now have an ID
                    const existingIndex = newPresets[task.category].tasks.findIndex(t => t.name === task.name && !t.id);
                    if (existingIndex !== -1) {
                        newPresets[task.category].tasks.splice(existingIndex, 1);
                    }
                    newPresets[task.category].tasks.push(task);
                } else {
                   // For custom-generated categories
                   if (profile === 'Custom') {
                        newPresets[task.category] = {
                            color: "bg-gray-800 text-gray-200", // A default color
                            tasks: [task]
                        };
                   }
                }
            });
            
            Object.keys(newPresets).forEach(category => {
                newPresets[category].tasks.sort((a, b) => a.order - b.order);
            });

            setPresetTasks(newPresets);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching preset tasks:", error);
            const initialTasks = profilePresets[profile] || profilePresets["General"];
            setPresetTasks(initialTasks);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, profile]);

    const addPresetTask = useCallback(async (task: PresetTask & { category: string }) => {
        if (!user || ('isMockUser' in user && user.isMockUser)) return;

        const categoryTasks = presetTasks[task.category]?.tasks || [];
        const maxOrder = categoryTasks.reduce((max, t) => Math.max(max, t.order), -1);

        await addDoc(collection(db, 'userPresetTasks'), {
            ...task,
            order: maxOrder + 1,
            userId: user.uid
        });
    }, [user, presetTasks]);
    
    const updatePresetTask = useCallback(async (taskId: string, task: Omit<UserPresetTask, 'id' | 'userId' | 'order'>) => {
        if (!user || ('isMockUser' in user && user.isMockUser)) return;
        const taskRef = doc(db, 'userPresetTasks', taskId);
        await updateDoc(taskRef, task);
    }, [user]);

    const deletePresetTask = useCallback(async (taskId: string) => {
        if (!user || ('isMockUser' in user && user.isMockUser)) return;
        
        await deleteDoc(doc(db, 'userPresetTasks', taskId));

    }, [user]);

    const findAndSyncPresetTask = useCallback(async (taskName: string, newDuration: number) => {
        if (!user || ('isMockUser' in user && user.isMockUser)) return;

        const q = query(
            collection(db, 'userPresetTasks'),
            where('userId', '==', user.uid),
            where('name', '==', taskName),
            limit(1)
        );

        try {
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const taskDoc = snapshot.docs[0];
                const taskRef = doc(db, 'userPresetTasks', taskDoc.id);
                await updateDoc(taskRef, { duration: newDuration });
                console.log(`Synced preset task '${taskName}' to duration ${newDuration}.`);
            }
        } catch (error) {
            console.error(`Failed to sync preset task '${taskName}':`, error);
        }

    }, [user]);

    const reorderPresetTask = useCallback(async (taskId: string, direction: 'up' | 'down') => {
        if (!user || ('isMockUser' in user && user.isMockUser)) return;
        
        try {
            await runTransaction(db, async (transaction) => {
                const taskRef = doc(db, 'userPresetTasks', taskId);
                const taskDoc = await transaction.get(taskRef);

                if (!taskDoc.exists()) {
                    throw "Task does not exist!";
                }

                const taskData = taskDoc.data() as UserPresetTask & { category: string };
                const { category, order } = taskData;
                
                const categoryTasksQuery = query(
                    collection(db, 'userPresetTasks'),
                    where('userId', '==', user.uid),
                    where('category', '==', category),
                    orderBy('order')
                );
                
                const categoryTasksSnapshot = await getDocs(categoryTasksQuery);
                const categoryTasks = categoryTasksSnapshot.docs.map(d => ({...d.data(), id: d.id} as UserPresetTask & {id: string}));

                const taskIndex = categoryTasks.findIndex(t => t.id === taskId);

                if (direction === 'up' && taskIndex > 0) {
                    const otherTask = categoryTasks[taskIndex - 1];
                    const otherTaskRef = doc(db, 'userPresetTasks', otherTask.id);
                    transaction.update(taskRef, { order: otherTask.order });
                    transaction.update(otherTaskRef, { order: order });
                } else if (direction === 'down' && taskIndex < categoryTasks.length - 1) {
                    const otherTask = categoryTasks[taskIndex + 1];
                    const otherTaskRef = doc(db, 'userPresetTasks', otherTask.id);
                    transaction.update(taskRef, { order: otherTask.order });
                    transaction.update(otherTaskRef, { order: order });
                }
            });
        } catch (error) {
            console.error("Failed to reorder task:", error);
        }

    }, [user]);

    const clearAndSetPresetTasks = useCallback(async (tasks: (PresetTask & { category: string })[]) => {
        if (!user || ('isMockUser' in user && user.isMockUser)) return;
    
        const batch = writeBatch(db);
    
        // 1. Delete all existing user preset tasks
        const q = query(collection(db, 'userPresetTasks'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
    
        // 2. Add the new tasks
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
                });
            });
        });
    
        // 3. Commit the batch
        await batch.commit();

    }, [user]);

    return { presetTasks, loading, addPresetTask, updatePresetTask, deletePresetTask, isDefaultTask, findAndSyncPresetTask, reorderPresetTask, clearAndSetPresetTasks, getAvailableCategories, getAvailableIcons };
}
