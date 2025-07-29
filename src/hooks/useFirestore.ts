
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

const baseRoutine: Preset = {
    'Morning': {
        color: "bg-sky-800 text-sky-100",
        tasks: [
            { name: 'Freshen Up', duration: 25, icon: 'Droplets', order: 0 },
            { name: 'Meditate', duration: 10, icon: 'Wind', order: 1 },
            { name: 'Breakfast', duration: 20, icon: 'Utensils', order: 2 },
        ]
    },
    'Strategy': {
        color: "bg-blue-800 text-blue-100",
        tasks: [
            { name: 'Plan & Prioritize Tasks', duration: 30, icon: 'ListChecks', order: 0 },
        ]
    },
    'Work Session 1': {
        color: "bg-indigo-800 text-indigo-100",
        tasks: [
            { name: 'Focus on Top Priority Tasks', duration: 180, icon: 'BrainCircuit', order: 0 },
        ]
    },
    'Recharge': {
        color: "bg-green-800 text-green-100",
        tasks: [
            { name: 'Short Drive', duration: 45, icon: 'Footprints', order: 0 },
            { name: 'Lunch', duration: 45, icon: 'Utensils', order: 1 },
        ]
    },
    'Work Session 2': {
        color: "bg-purple-800 text-purple-100",
        tasks: [
            { name: 'Focus on Secondary Priority Tasks', duration: 150, icon: 'BrainCircuit', order: 0 },
        ]
    },
    'Wrap-up': {
        color: "bg-amber-800 text-amber-100",
        tasks: [
            { name: 'Review & Analysis', duration: 30, icon: 'Target', order: 0 },
            { name: 'Client App Refinements', duration: 30, icon: 'Wrench', order: 1 },
        ]
    },
    'Evening': {
        color: "bg-orange-800 text-orange-100",
        tasks: [
            { name: 'Disconnect & Decompress', duration: 45, icon: 'Coffee', order: 0 },
            { name: 'Hobby/Leisure', duration: 45, icon: 'Dumbbell', order: 1 },
        ]
    },
    'Night': {
        color: "bg-rose-800 text-rose-100",
        tasks: [
            { name: 'Dinner', duration: 45, icon: 'Utensils', order: 0 },
            { name: 'Family/Social Time', duration: 60, icon: 'Users', order: 1 },
        ]
    },
    'Shutdown Ritual': {
        color: "bg-slate-800 text-slate-100",
        tasks: [
            { name: 'Digital Detox & Reading', duration: 30, icon: 'BookOpen', order: 0 },
            { name: 'Tidy & Prep for Tomorrow', duration: 15, icon: 'ListChecks', order: 1 },
        ]
    }
};

const profilePresets: { [key: string]: Preset } = {
    "Artist": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Creative Deep Work: Painting/Sketching', duration: 180, icon: 'BrainCircuit', order: 0 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Digital Illustration & Design', duration: 150, icon: 'BrainCircuit', order: 0 }] },
    },
    "Consultant": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Client Project: Strategy & Analysis', duration: 180, icon: 'BrainCircuit', order: 0 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Client Calls & Presentations', duration: 150, icon: 'Users', order: 0 }] },
    },
    "Content Creator": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Scripting & Filming Session', duration: 180, icon: 'BrainCircuit', order: 0 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Video Editing & Post-Production', duration: 150, icon: 'Wrench', order: 0 }] },
    },
    "Designer": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'UI/UX Design: Wireframing & Prototyping', duration: 180, icon: 'BrainCircuit', order: 0 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'High-Fidelity Mockups & Revisions', duration: 150, icon: 'BrainCircuit', order: 0 }] },
    },
    "Educator": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Lesson Planning & Material Creation', duration: 180, icon: 'ListChecks', order: 0 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Grading & Student Feedback', duration: 150, icon: 'BookOpen', order: 0 }] },
    },
    "Entrepreneur": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Business Development & Strategy', duration: 180, icon: 'BrainCircuit', order: 0 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Networking, Sales & Investor Meetings', duration: 150, icon: 'Users', order: 0 }] },
    },
    "Freelancer": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Primary Client Project Deep Work', duration: 180, icon: 'BrainCircuit', order: 0 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Secondary Projects & Prospecting', duration: 150, icon: 'ShoppingBag', order: 0 }] },
    },
    "General": baseRoutine,
    "Healthcare Professional": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Patient Consultations & Rounds', duration: 180, icon: 'Users', order: 0 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Updating Patient Charts & Research', duration: 150, icon: 'ListChecks', order: 0 }] },
    },
    "IT Professional": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'System Architecture & Development', duration: 180, icon: 'BrainCircuit', order: 0 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Troubleshooting & Support Tickets', duration: 150, icon: 'Wrench', order: 0 }] },
    },
    "Manager": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Team Meetings, 1-on-1s & Syncs', duration: 180, icon: 'Users', order: 0 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Strategic Planning & Reporting', duration: 150, icon: 'ListChecks', order: 0 }] },
    },
    "Marketer": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Campaign Strategy & Content Creation', duration: 180, icon: 'BrainCircuit', order: 0 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Performance Analysis & Optimization', duration: 150, icon: 'Target', order: 0 }] },
    },
    "Researcher": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Data Collection & Analysis', duration: 180, icon: 'BrainCircuit', order: 0 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Literature Review & Writing', duration: 150, icon: 'BookOpen', order: 0 }] },
    },
    "Sales": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Lead Prospecting & Cold Outreach', duration: 180, icon: 'Mail', order: 0 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Client Demos & Follow-ups', duration: 150, icon: 'Users', order: 0 }] },
    },
    "Software Engineer": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Coding: Feature Development', duration: 180, icon: 'BrainCircuit', order: 0 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Bug Fixes & Code Reviews', duration: 150, icon: 'Wrench', order: 0 }] },
    },
    "Student": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Core Subject Study Session', duration: 180, icon: 'BrainCircuit', order: 0 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Assignments & Practice Problems', duration: 150, icon: 'BookOpen', order: 0 }] },
    },
    "Writer": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Focused Writing Session', duration: 180, icon: 'BookOpen', order: 0 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Editing, Proofreading & Research', duration: 150, icon: 'Wrench', order: 0 }] },
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
                
                const q = query(
                    collection(db, 'userPresetTasks'),
                    where('userId', '==', user.uid),
                    where('category', '==', category),
                    orderBy('order')
                );
                
                const categoryTasksSnapshot = await getDocs(q);
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

    