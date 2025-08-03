
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { db } from '@/lib/firebase';
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    Timestamp, 
    writeBatch,
    doc,
    deleteDoc,
    updateDoc,
    getDocs,
    runTransaction,
    setDoc
} from 'firebase/firestore';
import type { Task, UserPresetTask, Preset, ProfileType, UserEvent } from '@/types';
import { useProfile } from './useProfile';
import { add, set, startOfDay, endOfDay } from 'date-fns';

// Hook for managing user's task history
export function useTasks() {
  const { user, isOffline, isSyncEnabled } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const TASKS_CACHE_KEY = 'user_tasks';

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (isOffline || !isSyncEnabled) {
      try {
        const cachedTasks = localStorage.getItem(TASKS_CACHE_KEY);
        if (cachedTasks) {
          setTasks(JSON.parse(cachedTasks));
        }
      } catch (error) {
        console.warn("Couldn't access localStorage for tasks");
      }
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
      const userTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert timestamp to serializable string
        const createdAt = (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString();
        userTasks.push({ id: doc.id, ...data, createdAt } as Task);
      });
      setTasks(userTasks);
       try {
        localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(userTasks));
      } catch (error) {
        console.warn("Couldn't access localStorage for tasks");
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tasks: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isOffline, isSyncEnabled]);

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;
    const newTask = {
      ...task,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };

    if (isOffline || !isSyncEnabled) {
      const updatedTasks = [...tasks, { ...newTask, id: new Date().toISOString() }];
      setTasks(updatedTasks);
      try {
        localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(updatedTasks));
      } catch (error) {
        console.warn("Couldn't access localStorage for tasks");
      }
      return;
    }

    await addDoc(collection(db, 'tasks'), { ...task, userId: user.uid, createdAt: Timestamp.now()});
  };

  const clearTasks = async () => {
    if (!user) return;
    
    setTasks([]);
    try {
      localStorage.removeItem(TASKS_CACHE_KEY);
    } catch(e) {
      console.warn("Could not clear tasks from localStorage");
    }

    if (isOffline || !isSyncEnabled) {
      return;
    }

    const batch = writeBatch(db);
    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  };


  return { tasks, loading, addTask, clearTasks };
}

// All default routines for professions
const defaultRoutines: { [key in ProfileType]: Omit<UserPresetTask, "id" | "order">[] } = {
    // For the Creative Professional (Artist, Designer, Writer)
    "Creative": [
        // Morning Routine (7:00 AM - 9:00 AM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
        { name: "Morning Idea Dump / Journaling", duration: 15, icon: "PenTool", category: "Morning Routine" },
        { name: "Light Stretching or Mobility", duration: 15, icon: "StretchHorizontal", category: "Morning Routine" },
        // Primary Work Session (9:00 AM - 1:00 PM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
        { name: "Uninterrupted Deep Creative Work", duration: 120, icon: "BrainCircuit", category: "Work & Focus" },
        { name: "Inspiration & Research Block", duration: 60, icon: "Eye", category: "Work & Focus" },
        // Lunch Break (1:00 PM - 2:00 PM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Breaks & Meals" },
        { name: "Mindful Meal (away from desk)", duration: 30, icon: "Utensils", category: "Breaks & Meals" },
        // Afternoon Session (2:00 PM - 5:00 PM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
        { name: "Skill Practice / Tutorial", duration: 30, icon: "BookOpen", category: "Work & Focus" },
        { name: "Admin & Client Communication", duration: 45, icon: "Mail", category: "Work & Focus" },
        // Post-Work Decompression (5:00 PM - 7:00 PM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Health & Wellness" },
        { name: "Main Exercise / Workout", duration: 45, icon: "Dumbbell", category: "Health & Wellness" },
        // Evening Routine (7:00 PM - 9:00 PM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
        { name: "Mindful Dinner", duration: 30, icon: "Utensils", category: "Evening Wind-down" },
        { name: "Social Time or Relaxing Hobby", duration: 60, icon: "Users", category: "Evening Wind-down" },
        // Bedtime Routine (9:00 PM onwards)
        { name: "Drink a small glass of water", duration: 1, icon: "Droplets", category: "Bedtime Routine" },
        { name: "Final Idea Capture", duration: 5, icon: "PenTool", category: "Bedtime Routine" },
        { name: "Digital Detox", duration: 30, icon: "Smartphone", category: "Bedtime Routine" },
        { name: "Read Fiction or Listen to Calming Music", duration: 20, icon: "BookOpen", category: "Bedtime Routine" },
    ],

    // For the Business Professional (Manager, Consultant, Marketer)
    "Business": [
        // Morning Routine (6:30 AM - 8:30 AM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
        { name: "Review Day's Top 3 Priorities", duration: 10, icon: "ListChecks", category: "Morning Routine" },
        { name: "Workout/Exercise", duration: 30, icon: "Dumbbell", category: "Morning Routine" },
        // Primary Work Session (8:30 AM - 12:30 PM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
        { name: "Strategic Thinking / 'No-Meeting' Block", duration: 60, icon: "BrainCircuit", category: "Work & Focus" },
        { name: "Tackle Most Important Task", duration: 90, icon: "Target", category: "Work & Focus" },
        // Lunch Break (12:30 PM - 1:30 PM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Breaks & Meals" },
        { name: "Power Lunch / Quick Walk", duration: 45, icon: "Footprints", category: "Breaks & Meals" },
        // Afternoon Session (1:30 PM - 5:00 PM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
        { name: "Meetings & Collaborative Tasks", duration: 120, icon: "Users", category: "Work & Focus" },
        { name: "Scan & Reply to Emails", duration: 30, icon: "Mail", category: "Work & Focus" },
        // Post-Work Decompression (5:00 PM - 7:00 PM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
        { name: "End-of-Day Review & Shutdown Ritual", duration: 15, icon: "Wrench", category: "Evening Wind-down" },
        { name: "Hobby / Leisure (Video Games, etc.)", duration: 60, icon: "Gamepad", category: "Evening Wind-down" },
        // Evening Routine (7:00 PM - 9:00 PM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
        { name: "Dinner with Family/Friends", duration: 45, icon: "Utensils", category: "Evening Wind-down" },
        // Bedtime Routine (9:00 PM onwards)
        { name: "Drink a small glass of water", duration: 1, icon: "Droplets", category: "Bedtime Routine" },
        { name: "Prepare for the Next Day", duration: 10, icon: "ShoppingBag", category: "Bedtime Routine" },
        { name: "Light Reading (non-work related)", duration: 20, icon: "BookOpen", category: "Bedtime Routine" },
        { name: "Meditation or Breathing for Stress Release", duration: 10, icon: "Wind", category: "Bedtime Routine" },
    ],

    // For the Technical Professional (Software Engineer, IT Pro, Researcher)
    "Technical": [
        // Morning Routine (7:00 AM - 9:00 AM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
        { name: "Meditation for Focus", duration: 10, icon: "BrainCircuit", category: "Morning Routine" },
        { name: "Review Tech News / Documentation", duration: 20, icon: "BookOpen", category: "Morning Routine" },
        // Primary Work Session (9:00 AM - 1:00 PM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
        { name: "Deep Work Coding / Analysis Session", duration: 50, icon: "BrainCircuit", category: "Work & Focus" },
        { name: "Break", duration: 10, icon: "Coffee", category: "Work & Focus" },
        { name: "Problem Decomposition / Planning", duration: 15, icon: "Wrench", category: "Work & Focus" },
        { name: "Hourly 20-20-20 Eye Strain Break", duration: 1, icon: "Eye", category: "Work & Focus" },
        // Lunch Break (1:00 PM - 2:00 PM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Breaks & Meals" },
        { name: "Screen-Free Lunch & Walk", duration: 45, icon: "Footprints", category: "Breaks & Meals" },
        // Afternoon Session (2:00 PM - 5:00 PM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
        { name: "Code Reviews / Meetings", duration: 60, icon: "Users", category: "Work & Focus" },
        { name: "Writing Documentation", duration: 30, icon: "PenTool", category: "Work & Focus" },
        // Post-Work Decompression (5:00 PM - 7:00 PM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Health & Wellness" },
        { name: "Strength Training or Cardio", duration: 45, icon: "Dumbbell", category: "Health & Wellness" },
        { name: "Personal Project / Learning", duration: 60, icon: "BrainCircuit", category: "Health & Wellness" },
        // Evening Routine (7:00 PM - 9:00 PM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
        { name: "Mindful Dinner", duration: 30, icon: "Utensils", category: "Evening Wind-down" },
        { name: "Analog Hobby (puzzles, etc.)", duration: 45, icon: "Wrench", category: "Evening Wind-down" },
        // Bedtime Routine (9:00 PM onwards)
        { name: "Drink a small glass of water", duration: 1, icon: "Droplets", category: "Bedtime Routine" },
        { name: "Strict Screen Cutoff", duration: 60, icon: "Smartphone", category: "Bedtime Routine" },
        { name: "Stretching to relieve desk posture", duration: 10, icon: "StretchHorizontal", category: "Bedtime Routine" },
        { name: "Read a physical book", duration: 20, icon: "BookOpen", category: "Bedtime Routine" },
    ],

    "On-The-Go": [
        // Morning Routine (6:30 AM - 8:00 AM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
        { name: "Morning Route & Schedule Review", duration: 15, icon: "ListChecks", category: "Morning Routine" },
        { name: "High-Energy Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
        // On the Road (AM)
        { name: "Drink a glass of water (before leaving)", duration: 1, icon: "Droplets", category: "Work & Focus" },
        { name: "Use travel time for calls or podcasts", duration: 60, icon: "Car", category: "Work & Focus" },
        { name: "In-Car Mental Reset (Between appointments)", duration: 5, icon: "Wind", category: "Work & Focus" },
        // Lunch Break (Mobile)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Breaks & Meals" },
        { name: "Eat a packed, healthy lunch", duration: 20, icon: "Utensils", category: "Breaks & Meals" },
        // On the Road (PM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
        { name: "High-Energy Snack Break", duration: 5, icon: "Apple", category: "Work & Focus" },
        // Post-Work Admin (5:00 PM onwards)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
        { name: "Logging Reports & Admin on Mobile", duration: 20, icon: "Smartphone", category: "Evening Wind-down" },
        // Evening Routine (7:00 PM - 9:00 PM)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
        { name: "Dinner", duration: 30, icon: "Utensils", category: "Evening Wind-down" },
        { name: "Relaxing entertainment (TV show, etc.)", duration: 60, icon: "Tv", category: "Evening Wind-down" },
        // Bedtime Routine (9:00 PM onwards)
        { name: "Drink a small glass of water", duration: 1, icon: "Droplets", category: "Bedtime Routine" },
        { name: "End-of-Day Bag / Vehicle Restock & Prep", duration: 10, icon: "ShoppingBag", category: "Bedtime Routine" },
        { name: "Stretching or Foam Rolling", duration: 15, icon: "StretchHorizontal", category: "Bedtime Routine" },
        { name: "Warm shower to relax muscles", duration: 15, icon: "ShowerHead", category: "Bedtime Routine" },
    ],

    "Healthcare": [
        // Pre-Shift Routine
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
        { name: "Pre-Shift Mental Preparation", duration: 5, icon: "BrainCircuit", category: "Morning Routine" },
        { name: "Eat a high-protein, slow-release energy meal", duration: 20, icon: "Utensils", category: "Morning Routine" },
        // During Shift (First Half)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
        { name: "During-Shift Micro-Reset (Deep breaths)", duration: 1, icon: "Wind", category: "Work & Focus" },
        // Mid-Shift Break
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Breaks & Meals" },
        { name: "Eat small, healthy snack/meal", duration: 15, icon: "Apple", category: "Breaks & Meals" },
        // During Shift (Second Half)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
        { name: "Stay vigilant and support team", duration: 240, icon: "Users", category: "Work & Focus" },
        // Post-Shift Decompression
        { name: "Drink a glass of water (immediately after shift)", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
        { name: "Mindful Commute (calming music, no news)", duration: 20, icon: "Car", category: "Evening Wind-down" },
        // Evening Recovery Routine (Post-Shift onwards)
        { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
        { name: "Recovery Meal (dinner)", duration: 30, icon: "Utensils", category: "Evening Wind-down" },
        { name: "Connect with family/partner", duration: 30, icon: "Users", category: "Evening Wind-down" },
        // Bedtime Routine (Pre-Sleep)
        { name: "Drink a small glass of water", duration: 1, icon: "Droplets", category: "Bedtime Routine" },
        { name: "Journaling to unload stress", duration: 10, icon: "PenTool", category: "Bedtime Routine" },
        { name: "Guided Meditation or Yoga Nidra", duration: 15, icon: "Wind", category: "Bedtime Routine" },
        { name: "Ensure sleep environment is perfect", duration: 5, icon: "Bed", category: "Bedtime Routine" },
    ],
    // Default/General profile
    "General": [
        { name: 'Plan Day', duration: 15, icon: 'ListChecks', category: 'Morning Routine' },
        { name: 'Deep Work', duration: 90, icon: 'BrainCircuit', category: 'Work & Focus' },
        { name: 'Check Emails', duration: 15, icon: 'Mail', category: 'Work & Focus' },
        { name: 'Lunch Break', duration: 45, icon: 'Utensils', category: 'Breaks & Meals' },
        { name: 'Workout', duration: 45, icon: 'Dumbbell', category: 'Health & Wellness' },
        { name: 'Read a Book', duration: 30, icon: 'BookOpen', category: 'Evening Wind-down' },
        { name: 'Wind Down', duration: 15, icon: 'Bed', category: 'Bedtime Routine' }
    ]
};

const profileToRoutineMap: { [key: string]: keyof typeof defaultRoutines } = {
    "Artist": "Creative",
    "Designer": "Creative",
    "Writer": "Creative",
    "Content Creator": "Creative",
    "Manager": "Business",
    "Consultant": "Business",
    "Marketer": "Business",
    "Entrepreneur": "Business",
    "Software Engineer": "Technical",
    "IT Professional": "Technical",
    "Researcher": "Technical",
    "Sales": "On-The-Go",
    "Medical Rep": "On-The-Go",
    "Delivery Agent": "On-The-Go",
    "Healthcare Professional": "Healthcare",
    "General": "General",
    "Student": "Technical",
    "Educator": "Business",
    "Freelancer": "Creative"
};

const categoryConfig: { [key: string]: { color: string, order: number } } = {
    'Morning Routine': { color: 'bg-sky-800 text-sky-100', order: 1 },
    'Work & Focus': { color: 'bg-blue-800 text-blue-100', order: 2 },
    'Breaks & Meals': { color: 'bg-orange-800 text-orange-100', order: 3 },
    'Health & Wellness': { color: 'bg-green-800 text-green-100', order: 4 },
    'Evening Wind-down': { color: 'bg-indigo-800 text-indigo-100', order: 5 },
    'Bedtime Routine': { color: 'bg-purple-800 text-purple-100', order: 6 },
    'Default': { color: 'bg-slate-800 text-slate-100', order: 7 },
};

const getAvailableCategories = () => Object.keys(categoryConfig);
const getAvailableIcons = () => ["ListChecks", "Bed", "StretchHorizontal", "Dumbbell", "BrainCircuit", "Mail", "Users", "Coffee", "Footprints", "Wind", "Droplets", "BookOpen", "Utensils", "Target", "Wrench", "ShoppingBag"];


// Hook for managing preset tasks and routines
export function usePresetTasks() {
  const { user, isOffline, isSyncEnabled } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [presetTasks, setPresetTasks] = useState<Preset>({});
  const [loading, setLoading] = useState(true);
  const PRESET_TASKS_CACHE_KEY_PREFIX = 'user_preset_tasks_';

  const isDefaultTask = (task: UserPresetTask) => {
    // Tasks without an ID are considered default template tasks.
    // Tasks with an ID but belonging to a default profession are user-added to a default routine.
    return !task.id || Object.keys(profileToRoutineMap).includes(profile);
  };
  
  const loadDefaultTasks = useCallback((prof: ProfileType) => {
    const routineKey = profileToRoutineMap[prof] || 'General';
    const defaultTasks = defaultRoutines[routineKey];
    
    let order = 0;
    const tasksWithOrder = defaultTasks.map(task => ({
        ...task,
        order: order++,
    }));

    const newPreset: Preset = {};
    tasksWithOrder.forEach(task => {
        const category = task.category || 'Default';
        if (!newPreset[category]) {
            newPreset[category] = { color: categoryConfig[category]?.color || categoryConfig['Default'].color, tasks: [] };
        }
        newPreset[category].tasks.push(task);
    });

    // Sort categories
    const sortedPreset: Preset = {};
    Object.keys(newPreset).sort((a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99))
      .forEach(key => {
        sortedPreset[key] = newPreset[key];
        // Sort tasks within category
        sortedPreset[key].tasks.sort((a, b) => a.order - b.order);
      });
      
    setPresetTasks(sortedPreset);

  }, []);

  useEffect(() => {
    setLoading(profileLoading);
    if (profileLoading) return;
    
    const cacheKey = `${PRESET_TASKS_CACHE_KEY_PREFIX}${profile}`;

    if (!user || isOffline || !isSyncEnabled) {
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          setPresetTasks(JSON.parse(cachedData));
        } else {
          loadDefaultTasks(profile);
        }
      } catch(e) {
        console.warn("Couldn't access localStorage for preset tasks, loading defaults");
        loadDefaultTasks(profile);
      }
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const q = query(
      collection(db, 'userPresetTasks'),
      where('userId', '==', user.uid),
      where('profession', '==', profile),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        loadDefaultTasks(profile);
      } else {
        const newPreset: Preset = {};
        snapshot.docs.forEach(doc => {
          const task = { id: doc.id, ...doc.data() } as UserPresetTask;
          const category = task.category || 'Default';
          if (!newPreset[category]) {
            newPreset[category] = { color: categoryConfig[category]?.color || categoryConfig['Default'].color, tasks: [] };
          }
          newPreset[category].tasks.push(task);
        });
        
        const sortedPreset: Preset = {};
        Object.keys(newPreset).sort((a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99))
          .forEach(key => {
            sortedPreset[key] = newPreset[key];
          });
        setPresetTasks(sortedPreset);
        try {
            localStorage.setItem(cacheKey, JSON.stringify(sortedPreset));
        } catch(e) {
            console.warn("Couldn't access localStorage to cache preset tasks");
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching preset tasks: ", error);
      loadDefaultTasks(profile); // Fallback to defaults
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, profile, isOffline, profileLoading, loadDefaultTasks, isSyncEnabled]);


  const addPresetTask = async (taskData: Omit<UserPresetTask, 'id' | 'order'> & { category: string }, currentProfile: ProfileType) => {
    if (!user || isOffline || !isSyncEnabled) return;
    
    const { category, ...rest } = taskData;
    const tasksInCategory = presetTasks[category]?.tasks || [];
    const newOrder = tasksInCategory.length > 0 ? Math.max(...tasksInCategory.map(t => t.order)) + 1 : 0;
    
    const newTask = {
        ...rest,
        category,
        userId: user.uid,
        profession: currentProfile,
        order: newOrder
    };

    await addDoc(collection(db, 'userPresetTasks'), newTask);
  };
  
  const reorderPresetTask = async (taskId: string, category: string, direction: 'up' | 'down') => {
    if (!user || isOffline || !isSyncEnabled) return;
    
    const tasks = presetTasks[category].tasks;
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const otherTaskIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
    if (otherTaskIndex < 0 || otherTaskIndex >= tasks.length) return;

    const task1 = tasks[taskIndex];
    const task2 = tasks[otherTaskIndex];

    const batch = writeBatch(db);
    const task1Ref = doc(db, 'userPresetTasks', task1.id!);
    const task2Ref = doc(db, 'userPresetTasks', task2.id!);

    batch.update(task1Ref, { order: task2.order });
    batch.update(task2Ref, { order: task1.order });

    await batch.commit();
  };

  const updatePresetTask = async (taskId: string, taskData: Partial<Omit<UserPresetTask, 'id' | 'order'>> & { category: string }) => {
    if (!user || isOffline || !isSyncEnabled) return;
    await updateDoc(doc(db, 'userPresetTasks', taskId), taskData);
  };

  const deletePresetTask = async (taskId: string) => {
    if (!user || isOffline || !isSyncEnabled) return;
    await deleteDoc(doc(db, 'userPresetTasks', taskId));
  };
  
  const clearAndSetPresetTasks = async (currentProfile: ProfileType, tasks: (Omit<UserPresetTask, 'id' | 'order'> & { category: string })[]) => {
      if (!user || isOffline || !isSyncEnabled) return;

      await runTransaction(db, async (transaction) => {
          // 1. Delete all existing tasks for the current profile
          const currentTasksQuery = query(collection(db, 'userPresetTasks'), where('userId', '==', user.uid), where('profession', '==', currentProfile));
          const currentTasksSnapshot = await getDocs(currentTasksQuery);
          currentTasksSnapshot.forEach(doc => transaction.delete(doc.ref));

          // 2. Add all the new tasks
          let order = 0;
          tasks.forEach(task => {
              const { category, ...rest } = task;
              const newTask = {
                  ...rest,
                  category,
                  userId: user.uid,
                  profession: currentProfile,
                  order: order++,
              };
              const newTaskRef = doc(collection(db, 'userPresetTasks'));
              transaction.set(newTaskRef, newTask);
          });
      });
  };

  const findAndSyncPresetTask = async (taskName: string, actualDuration: number) => {
     if (!user || isOffline || !isSyncEnabled) return;
     
     const q = query(
        collection(db, 'userPresetTasks'), 
        where('userId', '==', user.uid),
        where('profession', '==', profile),
        where('name', '==', taskName)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const taskDoc = querySnapshot.docs[0];
        const taskData = taskDoc.data() as UserPresetTask;
        const newDuration = Math.round((taskData.duration + actualDuration) / 2);

        await updateDoc(taskDoc.ref, { duration: newDuration });
    }
  };

  const profileStartTimes: { [key in ProfileType | 'default']: { hours: number; minutes: number } } = {
      "Creative": { hours: 9, minutes: 0 },
      "Business": { hours: 8, minutes: 30 },
      "Technical": { hours: 9, minutes: 0 },
      "On-The-Go": { hours: 8, minutes: 0 },
      "Healthcare": { hours: 6, minutes: 0 },
      "General": { hours: 9, minutes: 0 },
      "default": { hours: 9, minutes: 0 },
  };

  const categoryTimeRanges = useMemo(() => {
    const ranges: { [category: string]: { start: Date, end: Date } } = {};
    if (Object.keys(presetTasks).length === 0) return ranges;

    const routineKey = profileToRoutineMap[profile] || 'General';
    const startTime = profileStartTimes[routineKey] || profileStartTimes['default'];
    let currentTime = set(new Date(), startTime);

    const bedtimeAnchor = set(new Date(), { hours: 22, minutes: 0 }); // 10 PM

    const categories = Object.keys(presetTasks).sort((a,b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99));

    const bedtimeTasks = presetTasks["Bedtime Routine"]?.tasks || [];
    const bedtimeDuration = bedtimeTasks.reduce((acc, task) => acc + task.duration, 0);
    const bedtimeStartTime = add(bedtimeAnchor, { minutes: -bedtimeDuration });

    categories.forEach(category => {
        const tasks = presetTasks[category].tasks;
        if (tasks.length === 0) return;
        
        let categoryStartTime;

        if (category === "Bedtime Routine") {
            categoryStartTime = bedtimeAnchor;
        } else {
            // Find the correct start time, respecting the bedtime anchor
            const lastCategoryEndTime = Object.values(ranges).reduce((latest, range) => {
                return range.end > latest ? range.end : latest;
            }, new Date(0));
            
            categoryStartTime = lastCategoryEndTime.getTime() === new Date(0).getTime() ? currentTime : lastCategoryEndTime;
        }
        
        let categoryEndTime = categoryStartTime;
        tasks.forEach(task => {
            categoryEndTime = add(categoryEndTime, { minutes: task.duration });
        });

        ranges[category] = { start: categoryStartTime, end: categoryEndTime };
    });

    return ranges;
  }, [presetTasks, profile]);


  const activeCategory = useMemo(() => {
      const now = new Date();
      for (const category in categoryTimeRanges) {
          const { start, end } = categoryTimeRanges[category];
          if (now >= start && now < end) {
              return category;
          }
      }
      return null;
  }, [categoryTimeRanges]);

  return { 
    presetTasks, 
    loading, 
    addPresetTask, 
    updatePresetTask,
    deletePresetTask,
    reorderPresetTask,
    clearAndSetPresetTasks,
    findAndSyncPresetTask,
    isDefaultTask,
    getAvailableCategories,
    getAvailableIcons,
    categoryTimeRanges,
    activeCategory
  };
}


// Hook for managing calendar events
export function useCalendarEvents() {
  const { user, isOffline, isSyncEnabled } = useAuth();
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const EVENTS_CACHE_KEY = 'user_events';

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (isOffline || !isSyncEnabled) {
      try {
        const cachedEvents = localStorage.getItem(EVENTS_CACHE_KEY);
        if (cachedEvents) {
          setEvents(JSON.parse(cachedEvents));
        }
      } catch (error) {
        console.warn("Couldn't access localStorage for events");
      }
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
      const userEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserEvent));
      setEvents(userEvents);
      try {
        localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(userEvents));
      } catch (error) {
        console.warn("Couldn't access localStorage for events");
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isOffline, isSyncEnabled]);

  const addEvent = async (eventData: Omit<UserEvent, 'id' | 'userId'>) => {
    if (!user) return;
    const newEvent = { ...eventData, userId: user.uid };
    
    if (isOffline || !isSyncEnabled) {
      const updatedEvents = [...events, { ...newEvent, id: new Date().toISOString() }];
      setEvents(updatedEvents);
       try {
        localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(updatedEvents));
      } catch (error) {
        console.warn("Couldn't access localStorage for events");
      }
      return;
    }

    await addDoc(collection(db, 'userEvents'), newEvent);
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) return;
    
    if (isOffline || !isSyncEnabled) {
        const updatedEvents = events.filter(e => e.id !== eventId);
        setEvents(updatedEvents);
         try {
            localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(updatedEvents));
        } catch (error) {
            console.warn("Couldn't access localStorage for events");
        }
        return;
    }
    
    await deleteDoc(doc(db, 'userEvents', eventId));
  };

  return { events, loading, addEvent, deleteEvent };
}
