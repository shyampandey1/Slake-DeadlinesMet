

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

const creativeRoutine: Preset = {
    'Morning': {
        color: "bg-sky-800 text-sky-100",
        tasks: [
            { name: 'Wake up & Hydrate', duration: 1, icon: 'Droplets', order: 0 },
            { name: 'Mindfulness', duration: 15, icon: 'Wind', order: 1 },
            { name: 'Light Movement', duration: 20, icon: 'StretchHorizontal', order: 2 },
            { name: 'Breakfast', duration: 20, icon: 'Utensils', order: 3 },
        ]
    },
    'Deep Creative Session': {
        color: "bg-purple-800 text-purple-100",
        tasks: [
            { name: 'Deep Work on Project', duration: 180, icon: 'BrainCircuit', order: 0 },
        ]
    },
    'Lunch & Recharge': {
        color: "bg-green-800 text-green-100",
        tasks: [
            { name: 'Mindful Meal', duration: 45, icon: 'Utensils', order: 0 },
            { name: 'Short Walk', duration: 15, icon: 'Footprints', order: 1 },
        ]
    },
    'Afternoon Tasks': {
        color: "bg-amber-800 text-amber-100",
        tasks: [
            { name: 'Admin & Emails', duration: 90, icon: 'Mail', order: 0 },
            { name: 'Inspiration Time', duration: 90, icon: 'ShoppingBag', order: 1 },
        ]
    },
    'Evening': {
        color: "bg-orange-800 text-orange-100",
        tasks: [
            { name: 'Exercise/Workout', duration: 45, icon: 'Dumbbell', order: 0 },
            { name: 'Dinner', duration: 30, icon: 'Utensils', order: 1 },
            { name: 'Leisure Time', duration: 90, icon: 'Users', order: 2},
        ]
    },
    'Night Routine': {
        color: "bg-slate-800 text-slate-100",
        tasks: [
            { name: 'Plan Tomorrow', duration: 5, icon: 'ListChecks', order: 0 },
            { name: 'Screen-free Wind-down', duration: 30, icon: 'BookOpen', order: 1 },
            { name: 'Go to Bed', duration: 5, icon: 'Bed', order: 2 },
        ]
    }
};

const businessRoutine: Preset = {
    'Morning Power-Up': {
        color: "bg-sky-800 text-sky-100",
        tasks: [
            { name: 'Wake up & Hydrate', duration: 1, icon: 'Droplets', order: 0 },
            { name: 'Focus Breathing', duration: 5, icon: 'Wind', order: 1 },
            { name: 'Workout', duration: 30, icon: 'Dumbbell', order: 2 },
            { name: 'Plan Priorities', duration: 10, icon: 'ListChecks', order: 3 },
            { name: 'Breakfast', duration: 20, icon: 'Utensils', order: 4 },
        ]
    },
    'Strategic Work': {
        color: "bg-blue-800 text-blue-100",
        tasks: [
            { name: 'Tackle Top Task', duration: 180, icon: 'BrainCircuit', order: 0 },
        ]
    },
    'Lunch': {
        color: "bg-green-800 text-green-100",
        tasks: [
            { name: 'Power Lunch', duration: 60, icon: 'Utensils', order: 0 },
        ]
    },
    'Meetings & Comms': {
        color: "bg-indigo-800 text-indigo-100",
        tasks: [
            { name: 'Meetings & Calls', duration: 120, icon: 'Users', order: 0 },
            { name: 'Email & Messages', duration: 120, icon: 'Mail', order: 1 },
        ]
    },
    'Decompression': {
        color: "bg-purple-800 text-purple-100",
        tasks: [
            { name: 'Work Transition', duration: 30, icon: 'Wind', order: 0 },
            { name: 'Leisure/Hobby', duration: 60, icon: 'ShoppingBag', order: 1 },
        ]
    },
    'Evening': {
        color: "bg-orange-800 text-orange-100",
        tasks: [
            { name: 'Dinner', duration: 45, icon: 'Utensils', order: 0 },
        ]
    },
    'Night Routine': {
        color: "bg-slate-800 text-slate-100",
        tasks: [
            { name: 'Light Reading', duration: 30, icon: 'BookOpen', order: 0 },
            { name: 'Meditation', duration: 10, icon: 'Wind', order: 1 },
            { name: 'Go to Bed', duration: 5, icon: 'Bed', order: 2 },
        ]
    }
};

const technicalRoutine: Preset = {
    'Morning': {
        color: "bg-sky-800 text-sky-100",
        tasks: [
            { name: 'Wake up & Hydrate', duration: 1, icon: 'Droplets', order: 0 },
            { name: 'Meditation', duration: 10, icon: 'Wind', order: 1 },
            { name: 'Light Exercise', duration: 20, icon: 'StretchHorizontal', order: 2 },
            { name: 'Breakfast', duration: 20, icon: 'Utensils', order: 3 },
        ]
    },
    'Deep Focus Block': {
        color: "bg-indigo-800 text-indigo-100",
        tasks: [
            { name: 'Coding/Problem-Solving', duration: 240, icon: 'BrainCircuit', order: 0 },
        ]
    },
    'Lunch': {
        color: "bg-green-800 text-green-100",
        tasks: [
            { name: 'Screen-Free Lunch & Walk', duration: 60, icon: 'Utensils', order: 0 },
        ]
    },
    'Afternoon Tasks': {
        color: "bg-blue-800 text-blue-100",
        tasks: [
            { name: 'Code Reviews, Meetings, Docs', duration: 180, icon: 'ListChecks', order: 0 },
        ]
    },
    'Evening': {
        color: "bg-orange-800 text-orange-100",
        tasks: [
            { name: 'Workout', duration: 45, icon: 'Dumbbell', order: 0 },
            { name: 'Leisure/Personal Project', duration: 90, icon: 'ShoppingBag', order: 1 },
            { name: 'Dinner', duration: 30, icon: 'Utensils', order: 2},
        ]
    },
    'Night Routine': {
        color: "bg-slate-800 text-slate-100",
        tasks: [
            { name: 'Plan Tomorrow', duration: 5, icon: 'Target', order: 0 },
            { name: 'Read a Book', duration: 30, icon: 'BookOpen', order: 1 },
            { name: 'Go to Bed', duration: 5, icon: 'Bed', order: 2 },
        ]
    }
};

const onTheGoRoutine: Preset = {
    'Morning Prep': {
        color: "bg-sky-800 text-sky-100",
        tasks: [
            { name: 'Wake up & Hydrate', duration: 1, icon: 'Droplets', order: 0 },
            { name: 'Quick Workout', duration: 20, icon: 'Dumbbell', order: 1 },
            { name: 'Breakfast', duration: 20, icon: 'Utensils', order: 2 },
            { name: 'Review Day', duration: 15, icon: 'ListChecks', order: 3 },
        ]
    },
    'On The Road': {
        color: "bg-blue-800 text-blue-100",
        tasks: [
            { name: 'Travel Time', duration: 60, icon: 'Footprints', order: 0 },
            { name: 'Reset Break', duration: 5, icon: 'Wind', order: 1 },
        ]
    },
    'Afternoon Appointments': {
        color: "bg-indigo-800 text-indigo-100",
        tasks: [
            { name: 'Client Meetings', duration: 180, icon: 'Users', order: 0 },
            { name: 'Lunch', duration: 20, icon: 'Utensils', order: 1 },
        ]
    },
    'Wrap Up': {
        color: "bg-amber-800 text-amber-100",
        tasks: [
            { name: 'Log Reports', duration: 30, icon: 'Mail', order: 0 },
        ]
    },
    'Evening Wind-down': {
        color: "bg-orange-800 text-orange-100",
        tasks: [
            { name: 'Dinner', duration: 30, icon: 'Utensils', order: 0 },
            { name: 'Relax', duration: 60, icon: 'ShoppingBag', order: 1 },
            { name: 'Stretching', duration: 15, icon: 'StretchHorizontal', order: 2},
        ]
    },
    'Night Routine': {
        color: "bg-slate-800 text-slate-100",
        tasks: [
            { name: 'Prepare for Next Day', duration: 15, icon: 'Wrench', order: 0 },
            { name: 'Go to Bed', duration: 5, icon: 'Bed', order: 1 },
        ]
    }
};

const healthcareRoutine: Preset = {
    'Pre-Shift': {
        color: "bg-sky-800 text-sky-100",
        tasks: [
            { name: 'Wake up & Hydrate', duration: 1, icon: 'Droplets', order: 0 },
            { name: 'Energy Snack', duration: 10, icon: 'Utensils', order: 1 },
            { name: 'Deep Breathing', duration: 5, icon: 'Wind', order: 2 },
        ]
    },
    'Shift AM': {
        color: "bg-indigo-800 text-indigo-100",
        tasks: [
            { name: 'Patient Care', duration: 240, icon: 'Users', order: 0 },
        ]
    },
    'Mid-Shift Break': {
        color: "bg-green-800 text-green-100",
        tasks: [
            { name: 'High-Energy Meal', duration: 30, icon: 'Utensils', order: 0 },
        ]
    },
    'Shift PM': {
        color: "bg-purple-800 text-purple-100",
        tasks: [
            { name: 'Patient Care & Charting', duration: 240, icon: 'ListChecks', order: 0 },
        ]
    },
    'Post-Shift': {
        color: "bg-orange-800 text-orange-100",
        tasks: [
            { name: 'Decompression Commute', duration: 30, icon: 'Footprints', order: 0 },
            { name: 'Dinner', duration: 30, icon: 'Utensils', order: 1 },
        ]
    },
    'Evening Recovery': {
        color: "bg-slate-800 text-slate-100",
        tasks: [
            { name: 'Gentle Stretching', duration: 15, icon: 'StretchHorizontal', order: 0 },
            { name: 'Connect', duration: 45, icon: 'Users', order: 1 },
            { name: 'Relaxing Hobby', duration: 30, icon: 'BookOpen', order: 2 },
            { name: 'Bedtime', duration: 15, icon: 'Bed', order: 3 },
        ]
    }
};


const profilePresets: { [key: string]: Preset } = {
    // Creative
    "Artist": creativeRoutine,
    "Content Creator": creativeRoutine,
    "Designer": creativeRoutine,
    "Writer": creativeRoutine,
    // Business
    "Consultant": businessRoutine,
    "Manager": businessRoutine,
    "Marketer": businessRoutine,
    "Entrepreneur": businessRoutine,
    "Sales": businessRoutine,
    // Technical
    "Software Engineer": technicalRoutine,
    "IT Professional": technicalRoutine,
    "Researcher": technicalRoutine,
    "Student": technicalRoutine,
    // On-The-Go
    "Freelancer": onTheGoRoutine,
    // Healthcare
    "Healthcare Professional": healthcareRoutine,
    // General
    "General": businessRoutine,
    "Educator": creativeRoutine,
};

const routineStartTimes: { [key: string]: { hours: number, minutes: number } } = {
    // Creative
    "Artist": { hours: 8, minutes: 0 },
    "Content Creator": { hours: 8, minutes: 0 },
    "Designer": { hours: 8, minutes: 0 },
    "Writer": { hours: 8, minutes: 0 },
    "Educator": { hours: 8, minutes: 0 },
    // Business
    "Consultant": { hours: 6, minutes: 0 },
    "Manager": { hours: 6, minutes: 0 },
    "Marketer": { hours: 6, minutes: 0 },
    "Entrepreneur": { hours: 6, minutes: 0 },
    "Sales": { hours: 6, minutes: 0 },
    // Technical
    "Software Engineer": { hours: 7, minutes: 0 },
    "IT Professional": { hours: 7, minutes: 0 },
    "Researcher": { hours: 7, minutes: 0 },
    "Student": { hours: 7, minutes: 0 },
    // On-The-Go
    "Freelancer": { hours: 6, minutes: 30 },
    // Healthcare
    "Healthcare Professional": { hours: 5, minutes: 30 },
    // General
    "General": { hours: 7, minutes: 0 },
};


export function useTasks() {
  const { user, isOffline } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || isOffline) {
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
  }, [user, isOffline]);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");

    if (isOffline) {
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
  }, [user, isOffline]);
  
  const clearTasks = useCallback(async () => {
    if (!user) throw new Error("User not authenticated");

    if (isOffline) {
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

  }, [user, isOffline]);


  return { tasks, loading, addTask, clearTasks };
}

export function usePresetTasks() {
    const { user, isOffline } = useAuth();
    const { profile, customProfessions } = useProfile();
    const [presetTasks, setPresetTasks] = useState<Preset>({});
    const [todaysEvents, setTodaysEvents] = useState<UserEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const isDefaultTask = (task: UserPresetTask) => {
        return !task.id;
    }

    const getAvailableIcons = () => iconNames;
    
    const getAvailableCategories = useCallback((prof: string) => {
        const preset = profilePresets[prof] || businessRoutine;
        return Object.keys(preset);
    }, []);

    const processedTasks = useMemo(() => {
        const newPresetTasks = JSON.parse(JSON.stringify(presetTasks));

        if (todaysEvents.length > 0) {
            let cumulativeTime = set(new Date(), { hours: 7, minutes: 0, seconds: 0, milliseconds: 0 });
            let injected = false;
            
            Object.keys(newPresetTasks).forEach(category => {
                const categoryTasks = newPresetTasks[category].tasks.map((task: UserPresetTask) => {
                    const startTime = cumulativeTime;
                    const endTime = add(startTime, { minutes: task.duration });
                    cumulativeTime = endTime;
                    return { ...task, startTime, endTime };
                });
                newPresetTasks[category].tasks = categoryTasks;
            });

            const now = new Date();
            for (const category of Object.keys(newPresetTasks)) {
                const lastTask = newPresetTasks[category].tasks[newPresetTasks[category].tasks.length - 1];
                if (lastTask && isBefore(now, lastTask.endTime) && !injected) {
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
                }
            }
            if (!injected && newPresetTasks['Work Session 1']) {
                 todaysEvents.forEach((event, index) => {
                    newPresetTasks['Work Session 1'].tasks.push({
                        name: event.name,
                        duration: event.duration,
                        icon: event.icon || 'ListChecks',
                        order: newPresetTasks['Work Session 1'].tasks.length,
                        id: `event-${event.id}-${index}`,
                        isEvent: true,
                    });
                });
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
        const startTimeConfig = routineStartTimes[profile] || { hours: 7, minutes: 0 };
        let cumulativeTime = set(now, startTimeConfig);
        
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
        if (!user || isOffline) {
            const initialTasks = profilePresets[profile] || profilePresets["General"];
            setPresetTasks(initialTasks);
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
            
            let newPresets: Preset = {};
            const isCustomProfile = !Object.keys(profilePresets).includes(profile);

            if (isCustomProfile) {
                const customPreset: Preset = {};
                const profileTasks = userTasks.filter(t => t.profession === profile);
                profileTasks.forEach(task => {
                    if (!customPreset[task.category]) {
                        // Creating a default category structure if it doesn't exist.
                        customPreset[task.category] = {
                            color: "bg-slate-800 text-slate-100",
                            tasks: []
                        };
                    }
                    customPreset[task.category].tasks.push(task);
                });
                newPresets = customPreset;
            } else {
                const basePreset = profilePresets[profile] || profilePresets["General"];
                newPresets = JSON.parse(JSON.stringify(basePreset));
                
                const userTasksForProfile = userTasks.filter(t => t.profession === profile);

                const categoriesWithUserTasks = new Set(userTasksForProfile.map(t => t.category));
                categoriesWithUserTasks.forEach(category => {
                    if (newPresets[category]) {
                        newPresets[category].tasks = [];
                    }
                });

                userTasksForProfile.forEach(task => {
                    if (newPresets[task.category]) {
                        newPresets[task.category].tasks.push(task);
                    } else {
                        newPresets[task.category] = {
                            color: "bg-gray-800 text-gray-100",
                            tasks: [task]
                        };
                    }
                });
            }
            
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
    }, [user, profile, customProfessions, isOffline]);

    const addPresetTask = useCallback(async (task: Omit<PresetTask, 'order'> & { category: string }, taskProfile: ProfileType) => {
        if (!user || isOffline) return;
    
        const categoryTasks = presetTasks[task.category]?.tasks || [];
        const maxOrder = categoryTasks.reduce((max, t) => Math.max(max, t.order), -1);
    
        await addDoc(collection(db, 'userPresetTasks'), {
            ...task,
            profession: taskProfile,
            order: maxOrder + 1,
            userId: user.uid
        });
    }, [user, presetTasks, isOffline]);
    
    const updatePresetTask = useCallback(async (taskId: string, task: Omit<UserPresetTask, 'id' | 'userId' | 'order'>) => {
        if (!user || isOffline) return;
        const taskRef = doc(db, 'userPresetTasks', taskId);
        await updateDoc(taskRef, task);
    }, [user, isOffline]);

    const deletePresetTask = useCallback(async (taskId: string) => {
        if (!user || isOffline) return;
        
        await deleteDoc(doc(db, 'userPresetTasks', taskId));

    }, [user, isOffline]);

    const findAndSyncPresetTask = useCallback(async (taskName: string, newDuration: number) => {
        if (!user || isOffline) return;

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

    }, [user, profile, isOffline]);

    const reorderPresetTask = useCallback(async (taskId: string, direction: 'up' | 'down') => {
        if (!user || isOffline) return;
        
        try {
            await runTransaction(db, async (transaction) => {
                const taskRef = doc(db, 'userPresetTasks', taskId);
                const taskDoc = await transaction.get(taskRef);

                if (!taskDoc.exists()) {
                    throw "Task does not exist!";
                }

                const taskData = taskDoc.data() as UserPresetTask & { category: string; profession: string };
                const { category, order, profession } = taskData;
                
                const q = query(
                    collection(db, 'userPresetTasks'),
                    where('userId', '==', user.uid),
                    where('profession', '==', profession)
                );
                
                const allTasksSnapshot = await getDocs(q);
                const allTasks = allTasksSnapshot.docs.map(d => ({...d.data(), id: d.id} as UserPresetTask & {id: string, category: string}));

                const categoryTasks = allTasks.filter(t => t.category === category).sort((a,b) => a.order - b.order);

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

    }, [user, isOffline]);

    const clearAndSetPresetTasks = useCallback(async (professionName: string, tasks: (PresetTask & { category: string })[]) => {
        if (!user || isOffline) return;
    
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

    }, [user, isOffline]);

    return { presetTasks: processedTasks, loading, addPresetTask, updatePresetTask, deletePresetTask, isDefaultTask, findAndSyncPresetTask, reorderPresetTask, clearAndSetPresetTasks, getAvailableCategories, getAvailableIcons, todaysEvents, categoryTimeRanges, activeCategory };
}

export function useCalendarEvents() {
    const { user, isOffline } = useAuth();
    const [events, setEvents] = useState<UserEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || isOffline) {
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
    }, [user, isOffline]);

    const addEvent = useCallback(async (event: Omit<UserEvent, 'id' | 'userId'>) => {
        if (!user || isOffline) return;
        await addDoc(collection(db, 'userEvents'), {
            ...event,
            userId: user.uid,
        });
    }, [user, isOffline]);

    const deleteEvent = useCallback(async (eventId: string) => {
        if (!user || isOffline) return;
        await deleteDoc(doc(db, 'userEvents', eventId));
    }, [user, isOffline]);

    return { events, loading, addEvent, deleteEvent };
}
