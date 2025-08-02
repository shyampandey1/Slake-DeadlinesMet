

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
    'Morning Routine': "bg-sky-800 text-sky-100",
    'Primary Work Session': "bg-blue-800 text-blue-100",
    'Lunch Break': "bg-green-800 text-green-100",
    'Afternoon Session': "bg-orange-800 text-orange-100",
    'Post-Work Decompression': "bg-purple-800 text-purple-100",
    'Evening Routine': 'bg-rose-800 text-rose-100',
    'Bedtime Routine': "bg-indigo-800 text-indigo-100",
    'On the Road (AM)': 'bg-blue-800 text-blue-100',
    'Lunch Break (Mobile)': "bg-green-800 text-green-100",
    'On the Road (PM)': 'bg-orange-800 text-orange-100',
    'Post-Work Admin': 'bg-purple-800 text-purple-100',
    'Pre-Shift Routine': 'bg-sky-800 text-sky-100',
    'During Shift (First Half)': 'bg-blue-800 text-blue-100',
    'Mid-Shift Break': 'bg-green-800 text-green-100',
    'During Shift (Second Half)': 'bg-orange-800 text-orange-100',
    'Evening Recovery Routine': 'bg-rose-800 text-rose-100',
};


const creativeRoutine: (Omit<UserPresetTask, "id" | "order"> & { category: string })[] = [
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
    { name: "Morning Idea Dump / Journaling", duration: 15, icon: "BookOpen", category: "Morning Routine" },
    { name: "Light Stretching or Mobility", duration: 15, icon: "StretchHorizontal", category: "Morning Routine" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Primary Work Session" },
    { name: "Uninterrupted Deep Creative Work", duration: 120, icon: "BrainCircuit", category: "Primary Work Session" },
    { name: "Inspiration & Research Block", duration: 60, icon: "Lightbulb", category: "Primary Work Session" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Lunch Break" },
    { name: "Mindful Meal (away from desk)", duration: 30, icon: "Utensils", category: "Lunch Break" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Afternoon Session" },
    { name: "Skill Practice / Tutorial", duration: 30, icon: "Wrench", category: "Afternoon Session" },
    { name: "Admin & Client Communication", duration: 45, icon: "Mail", category: "Afternoon Session" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Post-Work Decompression" },
    { name: "Main Exercise / Workout", duration: 45, icon: "Dumbbell", category: "Post-Work Decompression" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Routine" },
    { name: "Mindful Dinner", duration: 30, icon: "Utensils", category: "Evening Routine" },
    { name: "Social Time or Relaxing Hobby", duration: 60, icon: "Users", category: "Evening Routine" },
    { name: "Drink a small glass of water", duration: 1, icon: "Droplets", category: "Bedtime Routine" },
    { name: "Final Idea Capture", duration: 5, icon: "BookOpen", category: "Bedtime Routine" },
    { name: "Digital Detox (no screens)", duration: 30, icon: "Wind", category: "Bedtime Routine" },
    { name: "Read or Listen to Music", duration: 20, icon: "BookOpen", category: "Bedtime Routine" },
];
const businessRoutine: (Omit<UserPresetTask, "id" | "order"> & { category: string })[] = [
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
    { name: "Review Day's Top 3 Priorities", duration: 10, icon: "ListChecks", category: "Morning Routine" },
    { name: "Workout/Exercise", duration: 30, icon: "Dumbbell", category: "Morning Routine" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Primary Work Session" },
    { name: "Strategic Thinking / 'No-Meeting' Block", duration: 60, icon: "BrainCircuit", category: "Primary Work Session" },
    { name: "Tackle Most Important Task", duration: 90, icon: "Target", category: "Primary Work Session" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Lunch Break" },
    { name: "Power Lunch / Quick Walk", duration: 45, icon: "Utensils", category: "Lunch Break" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Afternoon Session" },
    { name: "Meetings & Collaborative Tasks", duration: 120, icon: "Users", category: "Afternoon Session" },
    { name: "Scan & Reply to Emails", duration: 30, icon: "Mail", category: "Afternoon Session" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Post-Work Decompression" },
    { name: "End-of-Day Review & Shutdown Ritual", duration: 15, icon: "ListChecks", category: "Post-Work Decompression" },
    { name: "Hobby / Leisure", duration: 60, icon: "GamePad", category: "Post-Work Decompression" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Routine" },
    { name: "Dinner with Family/Friends", duration: 45, icon: "Utensils", category: "Evening Routine" },
    { name: "Drink a small glass of water", duration: 1, icon: "Droplets", category: "Bedtime Routine" },
    { name: "Prepare for the Next Day", duration: 10, icon: "ShoppingBag", category: "Bedtime Routine" },
    { name: "Light Reading (non-work related)", duration: 20, icon: "BookOpen", category: "Bedtime Routine" },
    { name: "Meditation or Breathing", duration: 10, icon: "Wind", category: "Bedtime Routine" },
];
const technicalRoutine: (Omit<UserPresetTask, "id" | "order"> & { category: string })[] = [
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
    { name: "Meditation for Focus", duration: 10, icon: "Wind", category: "Morning Routine" },
    { name: "Review Tech News / Documentation", duration: 20, icon: "BookOpen", category: "Morning Routine" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Primary Work Session" },
    { name: "Deep Work Coding / Analysis Session", duration: 50, icon: "BrainCircuit", category: "Primary Work Session" },
    { name: "10 min break", duration: 10, icon: "Coffee", category: "Primary Work Session" },
    { name: "Problem Decomposition / Planning", duration: 15, icon: "ListChecks", category: "Primary Work Session" },
    { name: "Hourly 20-20-20 Eye Strain Break", duration: 1, icon: "Eye", category: "Primary Work Session" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Lunch Break" },
    { name: "Screen-Free Lunch & Walk", duration: 45, icon: "Utensils", category: "Lunch Break" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Afternoon Session" },
    { name: "Code Reviews / Meetings", duration: 60, icon: "Users", category: "Afternoon Session" },
    { name: "Writing Documentation", duration: 30, icon: "PenTool", category: "Afternoon Session" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Post-Work Decompression" },
    { name: "Strength Training or Cardio", duration: 45, icon: "Dumbbell", category: "Post-Work Decompression" },
    { name: "Personal Project / Learning", duration: 60, icon: "Lightbulb", category: "Post-Work Decompression" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Routine" },
    { name: "Mindful Dinner", duration: 30, icon: "Utensils", category: "Evening Routine" },
    { name: "Analog Hobby", duration: 45, icon: "Wrench", category: "Evening Routine" },
    { name: "Drink a small glass of water", duration: 1, icon: "Droplets", category: "Bedtime Routine" },
    { name: "Strict Screen Cutoff", duration: 60, icon: "Smartphone", category: "Bedtime Routine" },
    { name: "Stretching", duration: 10, icon: "StretchHorizontal", category: "Bedtime Routine" },
    { name: "Read a physical book", duration: 20, icon: "BookOpen", category: "Bedtime Routine" },
];
const onTheGoRoutine: (Omit<UserPresetTask, "id" | "order"> & { category: string })[] = [
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
    { name: "Morning Route & Schedule Review", duration: 15, icon: "ListChecks", category: "Morning Routine" },
    { name: "High-Energy Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "On the Road (AM)" },
    { name: "Use travel time for calls or podcasts", duration: 60, icon: "Car", category: "On the Road (AM)" },
    { name: "In-Car Mental Reset", duration: 5, icon: "Wind", category: "On the Road (AM)" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Lunch Break (Mobile)" },
    { name: "Eat a packed, healthy lunch", duration: 20, icon: "Utensils", category: "Lunch Break (Mobile)" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "On the Road (PM)" },
    { name: "High-Energy Snack Break", duration: 5, icon: "Coffee", category: "On the Road (PM)" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Post-Work Admin" },
    { name: "Logging Reports & Admin on Mobile", duration: 20, icon: "Smartphone", category: "Post-Work Admin" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Routine" },
    { name: "Dinner", duration: 30, icon: "Utensils", category: "Evening Routine" },
    { name: "Relaxing entertainment", duration: 60, icon: "Tv", category: "Evening Routine" },
    { name: "Drink a small glass of water", duration: 1, icon: "Droplets", category: "Bedtime Routine" },
    { name: "End-of-Day Bag / Vehicle Restock & Prep", duration: 10, icon: "ShoppingBag", category: "Bedtime Routine" },
    { name: "Stretching or Foam Rolling", duration: 15, icon: "StretchHorizontal", category: "Bedtime Routine" },
    { name: "Warm shower", duration: 15, icon: "ShowerHead", category: "Bedtime Routine" },
];
const healthcareRoutine: (Omit<UserPresetTask, "id" | "order"> & { category: string })[] = [
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Pre-Shift Routine" },
    { name: "Pre-Shift Mental Preparation", duration: 5, icon: "BrainCircuit", category: "Pre-Shift Routine" },
    { name: "High-protein, slow-release energy meal", duration: 20, icon: "Utensils", category: "Pre-Shift Routine" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "During Shift (First Half)" },
    { name: "During-Shift Micro-Reset", duration: 1, icon: "Wind", category: "During Shift (First Half)" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Mid-Shift Break" },
    { name: "Eat small, healthy snack/meal", duration: 15, icon: "Apple", category: "Mid-Shift Break" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "During Shift (Second Half)" },
    { name: "Stay vigilant and support team", duration: 240, icon: "Users", category: "During Shift (Second Half)" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Post-Work Decompression" },
    { name: "Mindful Commute", duration: 20, icon: "Car", category: "Post-Work Decompression" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Recovery Routine" },
    { name: "Recovery Meal (dinner)", duration: 30, icon: "Utensils", category: "Evening Recovery Routine" },
    { name: "Connect with family/partner", duration: 30, icon: "Users", category: "Evening Recovery Routine" },
    { name: "Drink a small glass of water", duration: 1, icon: "Droplets", category: "Bedtime Routine" },
    { name: "Journaling to unload stress", duration: 10, icon: "BookOpen", category: "Bedtime Routine" },
    { name: "Guided Meditation or Yoga Nidra", duration: 15, icon: "Wind", category: "Bedtime Routine" },
    { name: "Ensure sleep environment is perfect", duration: 5, icon: "Bed", category: "Bedtime Routine" },
];
const generalRoutine: (Omit<UserPresetTask, "id" | "order"> & { category: string })[] = [];


const profilePresets: { [key: string]: (Omit<UserPresetTask, "id" | "order"> & { category: string })[] } = {
    "Artist": creativeRoutine,
    "Designer": creativeRoutine,
    "Writer": creativeRoutine,
    "Content Creator": creativeRoutine,
    "Manager": businessRoutine,
    "Consultant": businessRoutine,
    "Marketer": businessRoutine,
    "Entrepreneur": businessRoutine,
    "Software Engineer": technicalRoutine,
    "IT Professional": technicalRoutine,
    "Researcher": technicalRoutine,
    "Sales": onTheGoRoutine,
    "Medical Rep": onTheGoRoutine,
    "Delivery Agent": onTheGoRoutine,
    "Healthcare Professional": healthcareRoutine,
    "Student": technicalRoutine,
    "Educator": businessRoutine,
    "Freelancer": creativeRoutine,
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
        
        const allTasks = Object.values(newPresetTasks).flatMap((cat: any) => cat.tasks);
        const hasEvents = allTasks.some((task: any) => task.isEvent);

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
        const creativeProfiles = ["Artist", "Designer", "Writer", "Content Creator", "Freelancer"];
        const businessProfiles = ["Manager", "Consultant", "Marketer", "Entrepreneur", "Educator"];
        const technicalProfiles = ["Software Engineer", "IT Professional", "Researcher", "Student"];
        const onTheGoProfiles = ["Sales", "Medical Rep", "Delivery Agent"];
        const healthcareProfiles = ["Healthcare Professional"];

        let startHour = 7; // Default start time
        if (creativeProfiles.includes(profile)) startHour = 9;
        else if (businessProfiles.includes(profile)) startHour = 6;
        else if (onTheGoProfiles.includes(profile)) startHour = 6;
        else if (healthcareProfiles.includes(profile)) startHour = 5;
        
        let routineStartTime = set(startOfDay(now), { hours: startHour, minutes: 30 });
        
        const categories = Object.keys(processedTasks);
        const bedtimeCategoryName = categories.find(c => c.toLowerCase().includes('bedtime'));
        
        if (bedtimeCategoryName) {
            const bedtimeTasks = processedTasks[bedtimeCategoryName].tasks || [];
            const bedtimeDuration = bedtimeTasks.reduce((acc: number, task: UserPresetTask) => acc + task.duration, 0);
            const bedtimeStartTime = set(now, { hours: 22, minutes: 0, seconds: 0, milliseconds: 0 }); // 10 PM
            const bedtimeEndTime = add(bedtimeStartTime, { minutes: bedtimeDuration });
            ranges[bedtimeCategoryName] = { start: bedtimeStartTime, end: bedtimeEndTime };

            const totalDayDuration = categories
                .filter(c => c !== bedtimeCategoryName)
                .reduce((total, category) => {
                    const { tasks } = processedTasks[category];
                    return total + (tasks || []).reduce((acc: number, task: UserPresetTask) => acc + task.duration, 0);
                }, 0);

            routineStartTime = add(bedtimeStartTime, { minutes: -totalDayDuration });
        }


        let cumulativeTime = routineStartTime;
        let currentActiveCategory: string | null = null;
        let nextUpcomingCategory: string | null = null;
    
        for (const category of categories) {
             if (category === bedtimeCategoryName) continue; // Skip bedtime as it's already calculated

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
    
        if (bedtimeCategoryName && isAfter(now, ranges[bedtimeCategoryName].start) && isBefore(now, ranges[bedtimeCategoryName].end)) {
            currentActiveCategory = bedtimeCategoryName;
        }

        return { 
            categoryTimeRanges: ranges, 
            activeCategory: currentActiveCategory || nextUpcomingCategory || categories[0] 
        };
    }, [processedTasks, profile]);

    useEffect(() => {
        const setupDefaultPreset = () => {
            const newPresets: Preset = {};
            const defaultTasks = profilePresets[profile as keyof typeof profilePresets] || generalRoutine;
            
            // Populate tasks and categories from default routine
            defaultTasks.forEach((task, index) => {
                if (!newPresets[task.category]) {
                    newPresets[task.category] = {
                        color: categoryColors[task.category] || "bg-gray-800 text-gray-100",
                        tasks: [],
                    };
                }
                const taskWithOrder = { ...task, order: index };
                newPresets[task.category].tasks.push(taskWithOrder as UserPresetTask);
            });
            
            setPresetTasks(newPresets);
            setLoading(false);
        }

        if (!user || isOffline || !isSyncEnabled) {
            setupDefaultPreset();
            setTodaysEvents([]);
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
                setupDefaultPreset();
            } else {
                const userTasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as (UserPresetTask & {category: string, profession: string})[];
                const newPresets: Preset = {};
                
                userTasks.forEach(task => {
                    // Only create a category if it has tasks
                    if (!newPresets[task.category]) {
                        newPresets[task.category] = {
                            color: categoryColors[task.category] || "bg-gray-800 text-gray-100",
                            tasks: []
                        };
                    }
                    newPresets[task.category].tasks.push(task);
                });
                
                // Sort tasks within each category
                Object.keys(newPresets).forEach(category => {
                    newPresets[category].tasks.sort((a, b) => a.order - b.order);
                });

                setPresetTasks(newPresets);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching preset tasks:", error);
            setupDefaultPreset(); // Fallback to default
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
