

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

const categoryColors: { [key: string]: string } = {
    'Morning': "bg-sky-800 text-sky-100",
    'Work': "bg-blue-800 text-blue-100",
    'Break': "bg-green-800 text-green-100",
    'Evening': "bg-orange-800 text-orange-100",
};

const creativeRoutine: PresetTask[] = [
    { name: "Wake up & hydrate", duration: 1, icon: "Droplets", category: "Morning", order: 0 },
    { name: "Mindfulness/Journaling", duration: 15, icon: "BrainCircuit", category: "Morning", order: 1 },
    { name: "Light Movement/Yoga", duration: 20, icon: "StretchHorizontal", category: "Morning", order: 2 },
    { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning", order: 3 },
    { name: "Deep Creative Session", duration: 180, icon: "BrainCircuit", category: "Work", order: 0 },
    { name: "Hourly Water Break", duration: 1, icon: "Droplets", category: "Work", order: 1 },
    { name: "Hydrate before Lunch", duration: 1, icon: "Droplets", category: "Break", order: 0 },
    { name: "Lunch & Mindful Walk", duration: 60, icon: "Utensils", category: "Break", order: 1 },
    { name: "Hydrate before Work", duration: 1, icon: "Droplets", category: "Work", order: 2 },
    { name: "Admin & Emails", duration: 90, icon: "Mail", category: "Work", order: 3 },
    { name: "Inspiration Gathering", duration: 90, icon: "BookOpen", category: "Work", order: 4 },
    { name: "Hydrate", duration: 1, icon: "Droplets", category: "Evening", order: 0 },
    { name: "Exercise/Workout", duration: 45, icon: "Dumbbell", category: "Evening", order: 1 },
    { name: "Dinner", duration: 30, icon: "Utensils", category: "Evening", order: 2 },
    { name: "Leisure & Social Time", duration: 60, icon: "Users", category: "Evening", order: 3 },
    { name: "Plan Tomorrow's Task", duration: 5, icon: "ListChecks", category: "Evening", order: 4 },
    { name: "Screen-free Wind-down", duration: 30, icon: "BookOpen", category: "Evening", order: 5 },
    { name: "Bedtime", duration: 0, icon: "Bed", category: "Evening", order: 6 },
];

const businessRoutine: PresetTask[] = [
    { name: "Wake up & hydrate", duration: 1, icon: "Droplets", category: "Morning", order: 0 },
    { name: "Breathing Exercise", duration: 5, icon: "Wind", category: "Morning", order: 1 },
    { name: "Workout", duration: 30, icon: "Dumbbell", category: "Morning", order: 2 },
    { name: "Plan Top 3 Priorities", duration: 10, icon: "ListChecks", category: "Morning", order: 3 },
    { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning", order: 4 },
    { name: "Most Important Task", duration: 180, icon: "Target", category: "Work", order: 0 },
    { name: "Stretch & Hydrate Break", duration: 5, icon: "Coffee", category: "Work", order: 1 },
    { name: "Hydrate before Lunch", duration: 1, icon: "Droplets", category: "Break", order: 0 },
    { name: "Lunch", duration: 60, icon: "Utensils", category: "Break", order: 1 },
    { name: "Meetings & Collaboration", duration: 120, icon: "Users", category: "Work", order: 2 },
    { name: "Email Pomodoro", duration: 120, icon: "Mail", category: "Work", order: 3 },
    { name: "Hydrate", duration: 1, icon: "Droplets", category: "Work", order: 4 },
    { name: "Decompression & Hydrate", duration: 1, icon: "Droplets", category: "Evening", order: 0 },
    { name: "Leisure/Hobby", duration: 60, icon: "ShoppingBag", category: "Evening", order: 1 },
    { name: "Dinner", duration: 45, icon: "Utensils", category: "Evening", order: 2 },
    { name: "Light Reading", duration: 30, icon: "BookOpen", category: "Evening", order: 3 },
    { name: "Meditation", duration: 10, icon: "BrainCircuit", category: "Evening", order: 4 },
    { name: "Bedtime", duration: 0, icon: "Bed", category: "Evening", order: 5 },
];

const technicalRoutine: PresetTask[] = [
    { name: "Wake up & hydrate", duration: 1, icon: "Droplets", category: "Morning", order: 0 },
    { name: "Meditation", duration: 10, icon: "BrainCircuit", category: "Morning", order: 1 },
    { name: "Light Exercise", duration: 20, icon: "StretchHorizontal", category: "Morning", order: 2 },
    { name: "Breakfast (no screens)", duration: 20, icon: "Utensils", category: "Morning", order: 3 },
    { name: "Deep Focus Block", duration: 240, icon: "BrainCircuit", category: "Work", order: 0 },
    { name: "20-20-20 & Hydrate", duration: 1, icon: "Droplets", category: "Work", order: 1 },
    { name: "Hydrate before Lunch", duration: 1, icon: "Droplets", category: "Break", order: 0 },
    { name: "Lunch & Walk", duration: 60, icon: "Utensils", category: "Break", order: 1 },
    { name: "Reviews, Meetings, Docs", duration: 180, icon: "ListChecks", category: "Work", order: 2 },
    { name: "Hydrate", duration: 1, icon: "Droplets", category: "Work", order: 3 },
    { name: "Rehydrate", duration: 1, icon: "Droplets", category: "Evening", order: 0 },
    { name: "Workout", duration: 45, icon: "Dumbbell", category: "Evening", order: 1 },
    { name: "Leisure/Personal Project", duration: 90, icon: "Wrench", category: "Evening", order: 2 },
    { name: "Dinner", duration: 30, icon: "Utensils", category: "Evening", order: 3 },
    { name: "Plan Tomorrow", duration: 5, icon: "ListChecks", category: "Evening", order: 4 },
    { name: "Read Physical Book", duration: 30, icon: "BookOpen", category: "Evening", order: 5 },
    { name: "Bedtime", duration: 0, icon: "Bed", category: "Evening", order: 6 },
];

const onTheGoRoutine: PresetTask[] = [
    { name: "Wake up & hydrate", duration: 1, icon: "Droplets", category: "Morning", order: 0 },
    { name: "Quick HIIT/Run", duration: 20, icon: "Footprints", category: "Morning", order: 1 },
    { name: "High-protein Breakfast", duration: 20, icon: "Utensils", category: "Morning", order: 2 },
    { name: "Review Route/Appointments", duration: 15, icon: "ListChecks", category: "Morning", order: 3 },
    { name: "Travel & Calls/Podcasts", duration: 60, icon: "Mail", category: "Work", order: 0 },
    { name: "Hydrate (every 2h)", duration: 1, icon: "Droplets", category: "Work", order: 1 },
    { name: "Breathing Exercises", duration: 5, icon: "Wind", category: "Work", order: 2 },
    { name: "Packed Lunch & Hydrate", duration: 30, icon: "Utensils", category: "Break", order: 0 },
    { name: "Log Reports & Plan", duration: 30, icon: "ListChecks", category: "Evening", order: 0 },
    { name: "Hydrate", duration: 1, icon: "Droplets", category: "Evening", order: 1 },
    { name: "Dinner", duration: 30, icon: "Utensils", category: "Evening", order: 2 },
    { name: "Relaxing Activity", duration: 60, icon: "ShoppingBag", category: "Evening", order: 3 },
    { name: "Stretching", duration: 15, icon: "StretchHorizontal", category: "Evening", order: 4 },
    { name: "Bedtime", duration: 0, icon: "Bed", category: "Evening", order: 5 },
];

const healthcareRoutine: PresetTask[] = [
    { name: "Pre-Shift Hydrate", duration: 1, icon: "Droplets", category: "Morning", order: 0 },
    { name: "Quick Snack", duration: 10, icon: "Utensils", category: "Morning", order: 1 },
    { name: "Deep Breathing", duration: 5, icon: "Wind", category: "Morning", order: 2 },
    { name: "Shift Hydration", duration: 1, icon: "Droplets", category: "Work", order: 0 },
    { name: "High-energy Snack", duration: 15, icon: "Utensils", category: "Work", order: 1 },
    { name: "Micro-break & Water", duration: 1, icon: "Coffee", category: "Work", order: 2 },
    { name: "Post-Shift Rehydrate", duration: 1, icon: "Droplets", category: "Evening", order: 0 },
    { name: "Decompression", duration: 20, icon: "Wind", category: "Evening", order: 1 },
    { name: "Hydrate before Dinner", duration: 1, icon: "Droplets", category: "Evening", order: 2 },
    { name: "Dinner", duration: 30, icon: "Utensils", category: "Evening", order: 3 },
    { name: "Connect with Family", duration: 30, icon: "Users", category: "Evening", order: 4 },
    { name: "Relaxing Hobby", duration: 45, icon: "ShoppingBag", category: "Evening", order: 5 },
    { name: "Warm Shower", duration: 15, icon: "Droplets", category: "Evening", order: 6 },
    { name: "Read Book", duration: 15, icon: "BookOpen", category: "Evening", order: 7 },
    { name: "Bedtime", duration: 0, icon: "Bed", category: "Evening", order: 8 },
];

const generalRoutine = businessRoutine; // Default to business routine for General/Freelance etc.

const profilePresets: { [key: string]: PresetTask[] } = {
    "Artist": creativeRoutine,
    "Content Creator": creativeRoutine,
    "Designer": creativeRoutine,
    "Writer": creativeRoutine,
    "Consultant": businessRoutine,
    "Manager": businessRoutine,
    "Marketer": businessRoutine,
    "Entrepreneur": businessRoutine,
    "Sales": onTheGoRoutine,
    "Software Engineer": technicalRoutine,
    "IT Professional": technicalRoutine,
    "Researcher": technicalRoutine,
    "Healthcare Professional": healthcareRoutine,
    "Student": technicalRoutine,
    "Educator": businessRoutine,
    "Freelancer": generalRoutine,
    "General": generalRoutine,
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
        return Object.keys(categoryColors);
    }, []);

    const processedTasks = useMemo(() => {
        const newPresetTasks = JSON.parse(JSON.stringify(presetTasks));
        
        const allTasks = Object.values(newPresetTasks).flatMap(cat => cat.tasks);
        const hasEvents = allTasks.some(task => task.isEvent);

        if (todaysEvents.length > 0 && !hasEvents) {
            let injected = false;

            for (const category of Object.keys(newPresetTasks)) {
                if (newPresetTasks[category] && newPresetTasks[category].tasks.length > 0 && !injected) {
                    const eventTasks: UserPresetTask[] = todaysEvents.map((event, index) => ({
                        name: event.name,
                        duration: event.duration,
                        icon: event.icon || 'ListChecks',
                        order: newPresetTasks[category].tasks.length + index,
                        id: `event-${event.id}-${index}`,
                        isEvent: true,
                    }));
                    newPresetTasks[category].tasks.push(...eventTasks);
                    injected = true;
                    break;
                }
            }
            
            if (!injected) {
                const fallbackCategory = Object.keys(newPresetTasks).find(c => c.toLowerCase().includes('work')) || Object.keys(newPresetTasks)[0];
                 if (fallbackCategory && newPresetTasks[fallbackCategory]) {
                    if(!newPresetTasks[fallbackCategory].tasks) newPresetTasks[fallbackCategory].tasks = []
                    const eventTasks: UserPresetTask[] = todaysEvents.map((event, index) => ({
                        name: event.name,
                        duration: event.duration,
                        icon: event.icon || 'ListChecks',
                        order: newPresetTasks[fallbackCategory].tasks.length + index,
                        id: `event-${event.id}-${index}`,
                        isEvent: true,
                    }));
                    newPresetTasks[fallbackCategory].tasks.push(...eventTasks);
                }
            }
        }
        return newPresetTasks;

    }, [presetTasks, todaysEvents]);
    
    const { categoryTimeRanges, activeCategory } = useMemo(() => {
        const ranges: { [category: string]: { start: Date, end: Date } } = {};
        if (Object.keys(processedTasks).length === 0) {
            return { categoryTimeRanges: ranges, activeCategory: null };
        }
    
        const now = new Date();
        const routineStartTime = set(startOfDay(now), { hours: 7, minutes: 0 });
        let cumulativeTime = routineStartTime;
        
        let currentActiveCategory: string | null = null;
        let nextUpcomingCategory: string | null = null;
    
        const categories = Object.keys(processedTasks);
    
        for (const category of categories) {
            const { tasks } = processedTasks[category];
            const totalDuration = (tasks || []).reduce((acc: number, task: UserPresetTask) => acc + task.duration, 0);
    
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
            const defaultTasks = profilePresets[profile] || generalRoutine;
            const newPresets: Preset = {};
            defaultTasks.forEach(task => {
                if (!newPresets[task.category]) {
                    newPresets[task.category] = { color: categoryColors[task.category], tasks: [] };
                }
                newPresets[task.category].tasks.push(task as UserPresetTask);
            });
            setPresetTasks(newPresets);
            setTodaysEvents([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const q = query(
            collection(db, 'userPresetTasks'),
            where('userId', '==', user.uid),
            where('profession', '==', profile)
        );

        const unsubscribePresets = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                const defaultTasks = profilePresets[profile] || generalRoutine;
                const newPresets: Preset = {};
                defaultTasks.forEach(task => {
                    if (!newPresets[task.category]) {
                        newPresets[task.category] = { color: categoryColors[task.category], tasks: [] };
                    }
                    newPresets[task.category].tasks.push(task as UserPresetTask);
                });
                setPresetTasks(newPresets);
            } else {
                const userTasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as (UserPresetTask & {category: string, profession: string})[];
                const newPresets: Preset = {};
                
                userTasks.forEach(task => {
                    if (!newPresets[task.category]) {
                        newPresets[task.category] = {
                            color: categoryColors[task.category] || "bg-gray-800 text-gray-100",
                            tasks: []
                        };
                    }
                    newPresets[task.category].tasks.push(task);
                });
                
                Object.keys(newPresets).forEach(category => {
                    newPresets[category].tasks.sort((a, b) => a.order - b.order);
                });
                setPresetTasks(newPresets);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching preset tasks:", error);
            setPresetTasks({});
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

    const addPresetTask = useCallback(async (task: Omit<PresetTask, 'order'> & { category: string }, profession?: ProfileType) => {
        const targetProfession = profession || profile;
        if (!user || isOffline || !isSyncEnabled) return;
    
        const categoryTasks = presetTasks[task.category]?.tasks || [];
        const maxOrder = categoryTasks.reduce((max, t) => Math.max(max, t.order), -1);
    
        await addDoc(collection(db, 'userPresetTasks'), {
            ...task,
            profession: targetProfession,
            order: maxOrder + 1,
            userId: user.uid
        });
    }, [user, presetTasks, isOffline, isSyncEnabled, profile]);
    
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

        const categoryTasks = presetTasks[category]?.tasks.filter(t => !t.isEvent);
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
        const taskToMoveRef = doc(db, 'userPresetTasks', taskToMove.id);
        const taskToSwapRef = doc(db, 'userPresetTasks', taskToSwap.id);

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
