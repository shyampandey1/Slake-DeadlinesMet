
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

const baseRoutine = {
    'Morning Rituals': {
        color: "bg-slate-800 text-slate-100",
        tasks: [
            { name: 'Freshen Up & Hydrate', duration: 15, icon: 'Droplets', order: 0 },
            { name: 'Meditation', duration: 10, icon: 'Wind', order: 1 },
            { name: 'Juice & Dry Fruits', duration: 10, icon: 'Utensils', order: 2 },
        ]
    },
    'Health & Wellness': {
        color: "bg-green-800 text-green-100",
        tasks: [
            { name: 'Workout', duration: 45, icon: 'Dumbbell', order: 0 },
            { name: 'Grooming', duration: 20, icon: 'Droplets', order: 1 },
            { name: 'Breakfast', duration: 20, icon: 'Utensils', order: 2 },
        ]
    },
    'Daily Strategy': {
        color: "bg-blue-800 text-blue-100",
        tasks: [
            { name: 'Plan & Prioritize Tasks', duration: 30, icon: 'ListChecks', order: 0 },
        ]
    },
    'Work & Focus': {
        color: "bg-indigo-800 text-indigo-100",
        tasks: [
            { name: 'Deep Work Session', duration: 180, icon: 'BrainCircuit', order: 0 },
        ]
    },
    'Breaks & Meals': {
        color: "bg-orange-800 text-orange-100",
        tasks: [
            { name: 'Relax & Recharge', duration: 30, icon: 'Coffee', order: 0 },
            { name: 'Lunch', duration: 45, icon: 'Utensils', order: 1 },
        ]
    },
    'Evening Wind-down': {
        color: "bg-rose-800 text-rose-100",
        tasks: [
            { name: 'Work Progress Check', duration: 20, icon: 'Target', order: 0 },
            { name: 'Breathing Exercise', duration: 5, icon: 'Wind', order: 1 },
            { name: 'Short Nap / Meditation', duration: 20, icon: 'Bed', order: 2 },
        ]
    }
};

const profilePresets: { [key: string]: Preset } = {
    "Artist": {
        ...baseRoutine,
        'Work & Focus': {
            ...baseRoutine['Work & Focus'],
            tasks: [
                { name: 'Creative Deep Work', duration: 180, icon: 'BrainCircuit', order: 0 },
                { name: 'Inspiration & Moodboarding', duration: 60, icon: 'ShoppingBag', order: 1 },
            ]
        }
    },
    "Consultant": {
        ...baseRoutine,
        'Work & Focus': {
            ...baseRoutine['Work & Focus'],
            tasks: [
                { name: 'Client Project Work', duration: 120, icon: 'BrainCircuit', order: 0 },
                { name: 'Client Calls & Meetings', duration: 60, icon: 'Users', order: 1 },
            ]
        }
    },
    "Content Creator": {
         ...baseRoutine,
        'Work & Focus': {
            ...baseRoutine['Work & Focus'],
            tasks: [
                { name: 'Filming / Recording', duration: 120, icon: 'BrainCircuit', order: 0 },
                { name: 'Editing Session', duration: 180, icon: 'Wrench', order: 1 },
            ]
        }
    },
    "Designer": {
        ...baseRoutine,
        'Work & Focus': {
            ...baseRoutine['Work & Focus'],
            tasks: [
                { name: 'UI/UX Design Session', duration: 180, icon: 'BrainCircuit', order: 0 },
                { name: 'Handle Client Revisions', duration: 60, icon: 'Wrench', order: 1 },
            ]
        }
    },
    "Educator": {
        ...baseRoutine,
        'Work & Focus': {
            ...baseRoutine['Work & Focus'],
            tasks: [
                { name: 'Lesson Planning', duration: 90, icon: 'ListChecks', order: 0 },
                { name: 'Grading Papers', duration: 90, icon: 'BookOpen', order: 1 },
            ]
        }
    },
    "Entrepreneur": {
        ...baseRoutine,
        'Work & Focus': {
            ...baseRoutine['Work & Focus'],
            tasks: [
                { name: 'Business Strategy & Growth', duration: 120, icon: 'BrainCircuit', order: 0 },
                { name: 'Networking & Emails', duration: 60, icon: 'Mail', order: 1 },
            ]
        }
    },
    "Freelancer": {
        ...baseRoutine,
        'Work & Focus': {
            ...baseRoutine['Work & Focus'],
            tasks: [
                { name: 'Client Project Deep Work', duration: 180, icon: 'BrainCircuit', order: 0 },
                { name: 'Search for New Projects', duration: 60, icon: 'ShoppingBag', order: 1 },
            ]
        }
    },
    "General": baseRoutine,
    "Healthcare Professional": {
        ...baseRoutine,
        'Work & Focus': {
            ...baseRoutine['Work & Focus'],
            tasks: [
                { name: 'Patient Consultations', duration: 180, icon: 'Users', order: 0 },
                { name: 'Update Patient Charts', duration: 60, icon: 'ListChecks', order: 1 },
            ]
        }
    },
    "IT Professional": {
        ...baseRoutine,
        'Work & Focus': {
            ...baseRoutine['Work & Focus'],
            tasks: [
                { name: 'System Development', duration: 180, icon: 'BrainCircuit', order: 0 },
                { name: 'Handle Support Tickets', duration: 60, icon: 'Mail', order: 1 },
            ]
        }
    },
    "Manager": {
        ...baseRoutine,
        'Work & Focus': {
            ...baseRoutine['Work & Focus'],
            tasks: [
                { name: 'Team Meetings & 1-on-1s', duration: 120, icon: 'Users', order: 0 },
                { name: 'Strategic Planning', duration: 60, icon: 'ListChecks', order: 1 },
            ]
        }
    },
    "Marketer": {
        ...baseRoutine,
        'Work & Focus': {
            ...baseRoutine['Work & Focus'],
            tasks: [
                { name: 'Campaign Strategy & Creation', duration: 180, icon: 'BrainCircuit', order: 0 },
                { name: 'Analyze Performance Metrics', duration: 60, icon: 'Target', order: 1 },
            ]
        }
    },
    "Researcher": {
        ...baseRoutine,
        'Work & Focus': {
            ...baseRoutine['Work & Focus'],
            tasks: [
                { name: 'Data Analysis', duration: 180, icon: 'BrainCircuit', order: 0 },
                { name: 'Literature Review', duration: 60, icon: 'BookOpen', order: 1 },
            ]
        }
    },
    "Sales": {
        ...baseRoutine,
        'Work & Focus': {
            ...baseRoutine['Work & Focus'],
            tasks: [
                { name: 'Lead Prospecting & Outreach', duration: 180, icon: 'Mail', order: 0 },
                { name: 'Client Demos & Calls', duration: 120, icon: 'Users', order: 1 },
            ]
        }
    },
    "Software Engineer": {
        ...baseRoutine,
        'Work & Focus': {
            ...baseRoutine['Work & Focus'],
            tasks: [
                { name: 'Coding: Top Priority Task', duration: 180, icon: 'BrainCircuit', order: 0 },
                { name: 'Code Reviews', duration: 60, icon: 'Wrench', order: 1 },
            ]
        }
    },
    "Student": {
        ...baseRoutine,
        'Work & Focus': {
            ...baseRoutine['Work & Focus'],
            tasks: [
                { name: 'Study Session', duration: 120, icon: 'BrainCircuit', order: 0 },
                { name: 'Review Lecture Notes', duration: 60, icon: 'BookOpen', order: 1 },
            ]
        }
    },
    "Writer": {
        ...baseRoutine,
        'Work & Focus': {
            ...baseRoutine['Work & Focus'],
            tasks: [
                { name: 'Writing Session', duration: 180, icon: 'BookOpen', order: 0 },
                { name: 'Editing & Proofreading', duration: 60, icon: 'Wrench', order: 1 },
            ]
        }
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
                            color: "bg-gray-800 text-gray-100", // A default color
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
