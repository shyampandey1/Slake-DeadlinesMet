
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, deleteDoc, doc, Timestamp, writeBatch, getDocs, updateDoc, limit, runTransaction } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { Task, Preset, PresetTask, UserPresetTask } from '@/types';


const initialPresetTasks: Preset = {
    'Morning Routine': {
        color: "bg-blue-900/80 text-blue-100",
        tasks: [
            { name: 'Plan Day', duration: 15, icon: 'ListChecks', order: 0 },
            { name: 'Meditate', duration: 10, icon: 'Bed', order: 1 },
            { name: 'Stretching', duration: 10, icon: 'StretchHorizontal', order: 2 },
        ]
    },
    'Work & Focus': {
        color: "bg-indigo-900/80 text-indigo-100",
        tasks: [
            { name: 'Deep Work', duration: 90, icon: 'BrainCircuit', order: 0 },
            { name: 'Focus Session', duration: 50, icon: 'BrainCircuit', order: 1 },
            { name: 'Check Emails', duration: 15, icon: 'Mail', order: 2 },
            { name: 'Stand-up', duration: 15, icon: 'Users', order: 3 },
        ]
    },
    'Health & Wellness': {
        color: "bg-green-900/80 text-green-100",
        tasks: [
            { name: 'Workout', duration: 45, icon: 'Dumbbell', order: 0 },
            { name: 'Stretching', duration: 10, icon: 'StretchHorizontal', order: 1 },
            { name: 'Drink Water', duration: 1, icon: 'Droplets', recurring: true, order: 2 },
        ]
    },
    'Breaks & Meals': {
        color: "bg-amber-800 text-amber-100",
        tasks: [
            { name: 'Short Break', duration: 5, icon: 'Coffee', recurring: true, order: 0 },
            { name: 'Walk', duration: 15, icon: 'Footprints', order: 1 },
            { name: 'Lunch Break', duration: 45, icon: 'Utensils', order: 2 },
            { name: 'Breathing Practice', duration: 5, icon: 'Wind', recurring: true, order: 3 },
        ]
    },
    'Evening Wind-down': {
        color: "bg-sky-900/80 text-sky-100",
        tasks: [
            { name: 'Read a book', duration: 30, icon: 'BookOpen', order: 0 },
            { name: 'Journal', duration: 15, icon: 'ListChecks', order: 1 },
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
            where('userId', '==', user.uid),
            orderBy('order', 'asc')
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
                    // This case is for user-created categories, which we are not supporting via the UI yet.
                    // If a task belongs to a category not in initialPresetTasks, it won't be displayed.
                }
            });
            
             // Ensure tasks within each category are sorted by the order property
            Object.keys(newPresets).forEach(category => {
                newPresets[category].tasks.sort((a, b) => a.order - b.order);
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

    return { presetTasks, loading, addPresetTask, updatePresetTask, deletePresetTask, isDefaultTask, findAndSyncPresetTask, reorderPresetTask };
}
