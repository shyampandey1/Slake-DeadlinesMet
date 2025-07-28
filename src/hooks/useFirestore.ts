
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, deleteDoc, doc, Timestamp, writeBatch, getDocs, updateDoc } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { Task, Preset, PresetTask, UserPresetTask } from '@/types';


const initialPresetTasks: Preset = {
    'Morning Routine': {
        color: "bg-sky-200/80 text-sky-900 hover:bg-sky-200 dark:bg-sky-800/60 dark:text-sky-100 dark:hover:bg-sky-800",
        tasks: [
            { name: 'Plan Day', duration: 15, icon: 'ListChecks' },
            { name: 'Meditate', duration: 10, icon: 'Bed' },
            { name: 'Stretching', duration: 10, icon: 'StretchHorizontal' },
        ]
    },
    'Work & Focus': {
        color: "bg-slate-200/80 text-slate-900 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:bg-slate-800",
        tasks: [
            { name: 'Deep Work', duration: 90, icon: 'BrainCircuit' },
            { name: 'Focus Session', duration: 50, icon: 'BrainCircuit' },
            { name: 'Check Emails', duration: 15, icon: 'Mail' },
            { name: 'Stand-up', duration: 15, icon: 'Users' },
        ]
    },
    'Health & Wellness': {
        color: "bg-blue-200/80 text-blue-900 hover:bg-blue-200 dark:bg-blue-800/60 dark:text-blue-100 dark:hover:bg-blue-800",
        tasks: [
            { name: 'Workout', duration: 45, icon: 'Dumbbell' },
            { name: 'Stretching', duration: 10, icon: 'StretchHorizontal' },
            { name: 'Drink Water', duration: 1, icon: 'Droplets', recurring: true },
        ]
    },
    'Breaks & Meals': {
        color: "bg-amber-200/80 text-amber-900 hover:bg-amber-200 dark:bg-amber-800/60 dark:text-amber-100 dark:hover:bg-amber-800",
        tasks: [
            { name: 'Short Break', duration: 5, icon: 'Coffee', recurring: true },
            { name: 'Walk', duration: 15, icon: 'Footprints' },
            { name: 'Lunch Break', duration: 45, icon: 'Utensils' },
            { name: 'Breathing Practice', duration: 5, icon: 'Wind', recurring: true },
        ]
    },
    'Evening Wind-down': {
        color: "bg-indigo-200/80 text-indigo-900 hover:bg-indigo-200 dark:bg-indigo-800/60 dark:text-indigo-100 dark:hover:bg-indigo-800",
        tasks: [
            { name: 'Read a book', duration: 30, icon: 'BookOpen' },
            { name: 'Journal', duration: 15, icon: 'ListChecks' },
        ]
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
    const [presetTasks, setPresetTasks] = useState<Preset>(initialPresetTasks);
    const [loading, setLoading] = useState(true);

    const isDefaultTask = (task: UserPresetTask) => {
        return !task.id;
    }

    useEffect(() => {
        if (!user) {
            setPresetTasks(initialPresetTasks);
            setLoading(false);
            return;
        }

        if ('isMockUser' in user && user.isMockUser) {
            setPresetTasks(initialPresetTasks);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'userPresetTasks'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userTasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as (UserPresetTask & {category: string})[];
            
            const newPresets: Preset = JSON.parse(JSON.stringify(initialPresetTasks));

            // Clear dynamic tasks before adding them again
            Object.keys(newPresets).forEach(category => {
                newPresets[category].tasks = newPresets[category].tasks.filter(t => !t.id);
            });


            userTasks.forEach(task => {
                if (newPresets[task.category]) {
                    newPresets[task.category].tasks.push(task);
                } else {
                    newPresets[task.category] = { color: "bg-gray-200 text-gray-800", tasks: [task] };
                }
            });

            setPresetTasks(newPresets);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching preset tasks:", error);
            setPresetTasks(initialPresetTasks);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addPresetTask = useCallback(async (task: PresetTask & { category: string }) => {
        if (!user || ('isMockUser' in user && user.isMockUser)) return;

        await addDoc(collection(db, 'userPresetTasks'), {
            ...task,
            userId: user.uid
        });
    }, [user]);
    
    const updatePresetTask = useCallback(async (taskId: string, task: Omit<UserPresetTask, 'id' | 'userId'>) => {
        if (!user || ('isMockUser' in user && user.isMockUser)) return;
        const taskRef = doc(db, 'userPresetTasks', taskId);
        await updateDoc(taskRef, task);
    }, [user]);

    const deletePresetTask = useCallback(async (taskId: string) => {
        if (!user || ('isMockUser' in user && user.isMockUser)) return;
        
        await deleteDoc(doc(db, 'userPresetTasks', taskId));

    }, [user]);

    return { presetTasks, loading, addPresetTask, updatePresetTask, deletePresetTask, isDefaultTask };
}
