

"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, deleteDoc, doc, Timestamp, writeBatch, getDocs, updateDoc, limit, runTransaction } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { Task, Preset, PresetTask, UserPresetTask, CustomProfession, UserEvent, ProfileType } from '@/types';
import { useProfile } from './useProfile';
import { startOfDay, endOfDay, isBefore, isAfter, add, set } from 'date-fns';

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

const defaultPreset: Preset = {
    'Morning': { color: "bg-sky-800 text-sky-100", tasks: [] },
    'Work': { color: "bg-blue-800 text-blue-100", tasks: [] },
    'Break': { color: "bg-green-800 text-green-100", tasks: [] },
    'Evening': { color: "bg-orange-800 text-orange-100", tasks: [] },
};


const routineStartTimes: { [key: string]: { hours: number, minutes: number } } = {
    "Artist": { hours: 8, minutes: 0 },
    "Content Creator": { hours: 8, minutes: 0 },
    "Designer": { hours: 8, minutes: 0 },
    "Writer": { hours: 8, minutes: 0 },
    "Educator": { hours: 8, minutes: 0 },
    "Consultant": { hours: 6, minutes: 0 },
    "Manager": { hours: 6, minutes: 0 },
    "Marketer": { hours: 6, minutes: 0 },
    "Entrepreneur": { hours: 6, minutes: 0 },
    "Sales": { hours: 6, minutes: 30 },
    "Software Engineer": { hours: 7, minutes: 0 },
    "IT Professional": { hours: 7, minutes: 0 },
    "Researcher": { hours: 7, minutes: 0 },
    "Student": { hours: 7, minutes: 0 },
    "Freelancer": { hours: 6, minutes: 30 },
    "Healthcare Professional": { hours: 5, minutes: 30 },
    "General": { hours: 7, minutes: 0 },
};


export function useTasks() {
  const { user, isOffline, isSyncEnabled } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || isOffline || !isSyncEnabled) {
      setTasks(isOffline ? [
        { id: 'mock-1', userId: 'mock-user-01', name: 'Finish project proposal (mock)', duration: 60, initialDuration: 60, completed: true, createdAt: new Date().toISOString() },
        { id: 'mock-2', userId: 'mock-user-01', name: 'Review design mockups (mock)', duration: 20, initialDuration: 45, completed: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
      ] : []);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userTasks = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            initialDuration: data.initialDuration || data.duration, // Backwards compatibility
          } as Task
      });
      // Sort tasks by creation date descending
      userTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTasks(userTasks);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching tasks:", error);
        setTasks([]);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isOffline, isSyncEnabled]);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");

    if (isOffline || !isSyncEnabled) {
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
  }, [user, isOffline, isSyncEnabled]);
  
  const clearTasks = useCallback(async () => {
    if (!user) throw new Error("User not authenticated");

    if (isOffline || !isSyncEnabled) {
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

  }, [user, isOffline, isSyncEnabled]);


  return { tasks, loading, addTask, clearTasks };
}

export function usePresetTasks() {
    const { user, isOffline, isSyncEnabled } = useAuth();
    const { profile, customProfessions } = useProfile();
    const [presetTasks, setPresetTasks] = useState<Preset>({});
    const [todaysEvents, setTodaysEvents] = useState<UserEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const isDefaultTask = (task: UserPresetTask) => {
        return !task.id;
    }

    const getAvailableIcons = () => iconNames;
    
    const getAvailableCategories = useCallback(() => {
        return Object.keys(defaultPreset);
    }, []);

    const processedTasks = useMemo(() => {
        const newPresetTasks = JSON.parse(JSON.stringify(presetTasks));
        
        if (todaysEvents.length > 0) {
            let injected = false;
            
            const categoryTimes: { [category: string]: { start: Date, end: Date } } = {};
            let cumulativeTime = set(startOfDay(new Date()), routineStartTimes[profile] || { hours: 7, minutes: 0 });

            for (const category of Object.keys(newPresetTasks)) {
                const totalDuration = (newPresetTasks[category].tasks || []).reduce((acc: number, task: UserPresetTask) => acc + task.duration, 0);
                const startTime = cumulativeTime;
                const endTime = add(startTime, { minutes: totalDuration });
                categoryTimes[category] = { start: startTime, end: endTime };
                cumulativeTime = endTime;
            }

            const now = new Date();
            for (const category of Object.keys(newPresetTasks)) {
                if (categoryTimes[category] && isBefore(now, categoryTimes[category].end) && !injected) {
                    todaysEvents.forEach((event, index) => {
                         newPresetTasks[category].tasks.push({
                            name: event.name,
                            duration: event.duration,
                            icon: event.icon || 'ListChecks',
                            order: newPresetTasks[category].tasks.length,
                            id: `event-${event.id}-${index}`,
                            isEvent: true,
                        });
                    });
                    injected = true;
                    break; 
                }
            }
            
            if (!injected) {
                const fallbackCategory = Object.keys(newPresetTasks).find(c => c.toLowerCase().includes('work')) || Object.keys(newPresetTasks)[1];
                if (fallbackCategory && newPresetTasks[fallbackCategory]) {
                    todaysEvents.forEach((event, index) => {
                        newPresetTasks[fallbackCategory].tasks.push({
                           name: event.name,
                           duration: event.duration,
                           icon: event.icon || 'ListChecks',
                           order: newPresetTasks[fallbackCategory].tasks.length,
                           id: `event-${event.id}-${index}`,
                           isEvent: true,
                       });
                   });
                }
            }
        }
        return newPresetTasks;

    }, [presetTasks, todaysEvents, profile]);
    
    const { categoryTimeRanges, activeCategory } = useMemo(() => {
        const ranges: { [category: string]: { start: Date, end: Date } } = {};
        if (Object.keys(processedTasks).length === 0) {
            return { categoryTimeRanges: ranges, activeCategory: null };
        }
    
        const now = new Date();
        const startTimeConfig = routineStartTimes[profile] || { hours: 7, minutes: 0 };
        let cumulativeTime = set(startOfDay(now), startTimeConfig);
        
        let currentActiveCategory: string | null = null;
        let nextUpcomingCategory: string | null = null;
    
        const categories = Object.keys(processedTasks);
    
        for (const category of categories) {
            const { tasks } = processedTasks[category];
            const totalDuration = tasks.reduce((acc, task) => acc + task.duration, 0);
    
            if (totalDuration > 0) {
                const startTime = cumulativeTime;
                const endTime = add(startTime, { minutes: totalDuration });
    
                ranges[category] = { start: startTime, end: endTime };
    
                if (isAfter(now, startTime) && isBefore(now, endTime)) {
                    currentActiveCategory = category;
                }
    
                if (isAfter(endTime, now) && !nextUpcomingCategory) {
                    if (isAfter(startTime, now)) {
                         nextUpcomingCategory = category;
                    }
                }
    
                cumulativeTime = endTime;
            }
        }
    
        return { 
            categoryTimeRanges: ranges, 
            activeCategory: currentActiveCategory || nextUpcomingCategory || categories[0] 
        };
    }, [processedTasks, profile]);

    useEffect(() => {
        if (!user || isOffline || !isSyncEnabled) {
            setPresetTasks(defaultPreset);
            setTodaysEvents([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const q = query(
            collection(db, 'userPresetTasks'),
            where('userId', '==', user.uid)
        );
        const unsubscribePresets = onSnapshot(q, (snapshot) => {
            const userTasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as (UserPresetTask & {category: string, profession: string})[];
            
            const newPresets: Preset = JSON.parse(JSON.stringify(defaultPreset));
            const userTasksForProfile = userTasks.filter(t => t.profession === profile);

            userTasksForProfile.forEach(task => {
                if (!newPresets[task.category]) {
                    newPresets[task.category] = {
                        color: "bg-gray-800 text-gray-100", // A default color
                        tasks: []
                    };
                }
                newPresets[task.category].tasks.push(task);
            });
            
            Object.keys(newPresets).forEach(category => {
                newPresets[category].tasks.sort((a, b) => a.order - b.order);
            });

            setPresetTasks(newPresets);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching preset tasks:", error);
            setPresetTasks(defaultPreset);
            setLoading(false);
        });

        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());
        const eventsQuery = query(
            collection(db, 'userEvents'),
            where('userId', '==', user.uid),
            where('date', '>=', todayStart.toISOString()),
            where('date', '<=', todayEnd.toISOString())
        );

        const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
            const events = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as UserEvent[];
            setTodaysEvents(events);
        }, (error) => {
            console.error("Error fetching today's events:", error);
        });


        return () => {
            unsubscribePresets();
            unsubscribeEvents();
        };
    }, [user, profile, customProfessions, isOffline, isSyncEnabled]);

    const addPresetTask = useCallback(async (task: Omit<PresetTask, 'order'> & { category: string }, taskProfile: ProfileType) => {
        if (!user || isOffline || !isSyncEnabled) return;
    
        const categoryTasks = presetTasks[task.category]?.tasks || [];
        const maxOrder = categoryTasks.reduce((max, t) => Math.max(max, t.order), -1);
    
        await addDoc(collection(db, 'userPresetTasks'), {
            ...task,
            profession: taskProfile,
            order: maxOrder + 1,
            userId: user.uid
        });
    }, [user, presetTasks, isOffline, isSyncEnabled]);
    
    const updatePresetTask = useCallback(async (taskId: string, task: Omit<UserPresetTask, 'id' | 'userId' | 'order'>) => {
        if (!user || isOffline || !isSyncEnabled) return;
        const taskRef = doc(db, 'userPresetTasks', taskId);
        await updateDoc(taskRef, task);
    }, [user, isOffline, isSyncEnabled]);

    const deletePresetTask = useCallback(async (taskId: string) => {
        if (!user || isOffline || !isSyncEnabled) return;
        
        await deleteDoc(doc(db, 'userPresetTasks', taskId));

    }, [user, isOffline, isSyncEnabled]);

    const reorderPresetTask = useCallback(async (taskId: string, category: string, direction: 'up' | 'down') => {
        if (!user || isOffline || !isSyncEnabled) return;

        const categoryTasks = presetTasks[category]?.tasks;
        if (!categoryTasks) return;

        const taskIndex = categoryTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        const swapIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
        if (swapIndex < 0 || swapIndex >= categoryTasks.length) return;

        const taskToMove = categoryTasks[taskIndex];
        const taskToSwap = categoryTasks[swapIndex];

        if (!taskToMove.id || !taskToSwap.id) {
            console.error("Cannot reorder tasks without IDs.", taskToMove, taskToSwap);
            return;
        }

        const batch = writeBatch(db);
        const taskToMoveRef = doc(db, 'userPresetTasks', taskToMove.id!);
        const taskToSwapRef = doc(db, 'userPresetTasks', taskToSwap.id!);

        batch.update(taskToMoveRef, { order: taskToSwap.order });
        batch.update(taskToSwapRef, { order: taskToMove.order });
        
        await batch.commit();

    }, [user, presetTasks, isOffline, isSyncEnabled]);

    const findAndSyncPresetTask = useCallback(async (taskName: string, newDuration: number) => {
        if (!user || isOffline || !isSyncEnabled) return;

        const q = query(
            collection(db, 'userPresetTasks'),
            where('userId', '==', user.uid),
            where('name', '==', taskName),
            where('profession', '==', profile),
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

    }, [user, profile, isOffline, isSyncEnabled]);

    const clearAndSetPresetTasks = useCallback(async (professionName: string, tasks: (PresetTask & { category: string })[]) => {
        if (!user || isOffline || !isSyncEnabled) return;
    
        const batch = writeBatch(db);
    
        const q = query(
            collection(db, 'userPresetTasks'), 
            where('userId', '==', user.uid),
            where('profession', '==', professionName)
        );
        const snapshot = await getDocs(q);
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
                    profession: professionName,
                });
            });
        });
    
        await batch.commit();

    }, [user, isOffline, isSyncEnabled]);

    return { presetTasks: processedTasks, loading, addPresetTask, updatePresetTask, deletePresetTask, reorderPresetTask, isDefaultTask, findAndSyncPresetTask, clearAndSetPresetTasks, getAvailableCategories, getAvailableIcons, todaysEvents, categoryTimeRanges, activeCategory };
}

export function useCalendarEvents() {
    const { user, isOffline, isSyncEnabled } = useAuth();
    const [events, setEvents] = useState<UserEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || isOffline || !isSyncEnabled) {
            setEvents([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, 'userEvents'), 
            where('userId', '==', user.uid),
            orderBy('date', 'asc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userEvents = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date, 
                } as UserEvent;
            });
            setEvents(userEvents);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching calendar events:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, isOffline, isSyncEnabled]);

    const addEvent = useCallback(async (event: Omit<UserEvent, 'id' | 'userId'>) => {
        if (!user || isOffline || !isSyncEnabled) return;
        await addDoc(collection(db, 'userEvents'), {
            ...event,
            userId: user.uid,
        });
    }, [user, isOffline, isSyncEnabled]);

    const deleteEvent = useCallback(async (eventId: string) => {
        if (!user || isOffline || !isSyncEnabled) return;
        await deleteDoc(doc(db, 'userEvents', eventId));
    }, [user, isOffline, isSyncEnabled]);

    return { events, loading, addEvent, deleteEvent };
}
