
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, deleteDoc, doc, Timestamp, writeBatch, getDocs, updateDoc, limit, runTransaction } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { Task, Preset, PresetTask, UserPresetTask, CustomProfession, UserEvent } from '@/types';
import { useProfile } from './useProfile';
import { startOfDay, endOfDay, isBefore, add, set } from 'date-fns';

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
            { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 1 },
            { name: 'Meditate', duration: 10, icon: 'Wind', order: 2 },
            { name: 'Grooming', duration: 20, icon: 'Wrench', order: 3 },
            { name: 'Breakfast', duration: 20, icon: 'Utensils', order: 4 },
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
            { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 },
            { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 },
        ]
    },
    'Recharge': {
        color: "bg-green-800 text-green-100",
        tasks: [
            { name: 'Short Drive', duration: 45, icon: 'Footprints', order: 0 },
            { name: 'Lunch', duration: 45, icon: 'Utensils', order: 1 },
            { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 },
        ]
    },
    'Work Session 2': {
        color: "bg-purple-800 text-purple-100",
        tasks: [
            { name: 'Focus on Secondary Priority Tasks', duration: 150, icon: 'BrainCircuit', order: 0 },
            { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 },
            { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 },
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
            { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 },
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
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Creative Deep Work: Painting/Sketching', duration: 180, icon: 'BrainCircuit', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Digital Illustration & Design', duration: 150, icon: 'BrainCircuit', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
    },
    "Consultant": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Client Project: Strategy & Analysis', duration: 180, icon: 'BrainCircuit', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Client Calls & Presentations', duration: 150, icon: 'Users', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
    },
    "Content Creator": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Scripting & Filming Session', duration: 180, icon: 'BrainCircuit', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Video Editing & Post-Production', duration: 150, icon: 'Wrench', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
    },
    "Designer": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'UI/UX Design: Wireframing & Prototyping', duration: 180, icon: 'BrainCircuit', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'High-Fidelity Mockups & Revisions', duration: 150, icon: 'BrainCircuit', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
    },
    "Educator": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Lesson Planning & Material Creation', duration: 180, icon: 'ListChecks', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Grading & Student Feedback', duration: 150, icon: 'BookOpen', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
    },
    "Entrepreneur": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Business Development & Strategy', duration: 180, icon: 'BrainCircuit', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Networking, Sales & Investor Meetings', duration: 150, icon: 'Users', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
    },
    "Freelancer": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Primary Client Project Deep Work', duration: 180, icon: 'BrainCircuit', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Secondary Projects & Prospecting', duration: 150, icon: 'ShoppingBag', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
    },
    "General": baseRoutine,
    "Healthcare Professional": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Patient Consultations & Rounds', duration: 180, icon: 'Users', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Updating Patient Charts & Research', duration: 150, icon: 'ListChecks', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
    },
    "IT Professional": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'System Architecture & Development', duration: 180, icon: 'BrainCircuit', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Troubleshooting & Support Tickets', duration: 150, icon: 'Wrench', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
    },
    "Manager": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Team Meetings, 1-on-1s & Syncs', duration: 180, icon: 'Users', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Strategic Planning & Reporting', duration: 150, icon: 'ListChecks', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
    },
    "Marketer": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Campaign Strategy & Content Creation', duration: 180, icon: 'BrainCircuit', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Performance Analysis & Optimization', duration: 150, icon: 'Target', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
    },
    "Researcher": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Data Collection & Analysis', duration: 180, icon: 'BrainCircuit', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Literature Review & Writing', duration: 150, icon: 'BookOpen', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
    },
    "Sales": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Lead Prospecting & Cold Outreach', duration: 180, icon: 'Mail', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Client Demos & Follow-ups', duration: 150, icon: 'Users', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
    },
    "Software Engineer": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Coding: Feature Development', duration: 180, icon: 'BrainCircuit', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Bug Fixes & Code Reviews', duration: 150, icon: 'Wrench', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
    },
    "Student": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Core Subject Study Session', duration: 180, icon: 'BrainCircuit', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Assignments & Practice Problems', duration: 150, icon: 'BookOpen', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
    },
    "Writer": {
        ...baseRoutine,
        'Work Session 1': { ...baseRoutine['Work Session 1'], tasks: [{ name: 'Focused Writing Session', duration: 180, icon: 'BookOpen', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
        'Work Session 2': { ...baseRoutine['Work Session 2'], tasks: [{ name: 'Editing, Proofreading & Research', duration: 150, icon: 'Wrench', order: 0 }, { name: 'Short Break', duration: 5, icon: 'Coffee', order: 1 }, { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', order: 2 }] },
    }
};

export function useTasks() {
  const { user, isOffline } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || isOffline) {
      setTasks(isOffline ? [
        { id: 'mock-1', userId: 'mock-user-01', name: 'Finish project proposal (mock)', duration: 60, completed: true, createdAt: new Date().toISOString() },
        { id: 'mock-2', userId: 'mock-user-01', name: 'Review design mockups (mock)', duration: 45, completed: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
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
            createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString()
          } as Task
      });
      userTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTasks(userTasks);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching tasks:", error);
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
        const preset = profilePresets[prof] || baseRoutine;
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
                            id: `event-${event.id}-${index}`
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
                        id: `event-${event.id}-${index}`
                    });
                });
            }
        }
        return newPresetTasks;

    }, [presetTasks, todaysEvents]);

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
                        const baseCategory = baseRoutine[task.category];
                        customPreset[task.category] = {
                            color: baseCategory ? baseCategory.color : "bg-slate-800 text-slate-100",
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
            where('date', '>=', Timestamp.fromDate(todayStart)),
            where('date', '<=', Timestamp.fromDate(todayEnd)),
            orderBy('date')
        );

        const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
            const events = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: (doc.data().date as Timestamp).toDate().toISOString()
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

    const addPresetTask = useCallback(async (task: Omit<PresetTask, 'order'> & { category: string }) => {
        if (!user || isOffline) return;

        const categoryTasks = presetTasks[task.category]?.tasks || [];
        const maxOrder = categoryTasks.reduce((max, t) => Math.max(max, t.order), -1);

        await addDoc(collection(db, 'userPresetTasks'), {
            ...task,
            profession: profile,
            order: maxOrder + 1,
            userId: user.uid
        });
    }, [user, presetTasks, profile, isOffline]);
    
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

    return { presetTasks: processedTasks, loading, addPresetTask, updatePresetTask, deletePresetTask, isDefaultTask, findAndSyncPresetTask, reorderPresetTask, clearAndSetPresetTasks, getAvailableCategories, getAvailableIcons, todaysEvents };
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
        const q = query(collection(db, 'userEvents'), where('userId', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userEvents = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: (data.date as Timestamp).toDate().toISOString(),
                } as UserEvent;
            });
            userEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
            date: Timestamp.fromDate(new Date(event.date)),
        });
    }, [user, isOffline]);

    const deleteEvent = useCallback(async (eventId: string) => {
        if (!user || isOffline) return;
        await deleteDoc(doc(db, 'userEvents', eventId));
    }, [user, isOffline]);

    return { events, loading, addEvent, deleteEvent };
}
