

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
import type { Task, UserPresetTask, Preset, ProfileType, UserEvent, UserProfile } from '@/types';
import { useProfile } from './useProfile';
import { add, set, startOfDay, endOfDay, getDay, isToday, format as formatDate, parse, compareDesc, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, isWithinInterval } from 'date-fns';

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

// Version for the default routines data structure
export const ROUTINE_TEMPLATE_VERSION = 24;

const creativeProfessionalRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
    { name: "Morning Idea Dump / Journaling", duration: 15, icon: "BookOpen", category: "Morning Routine" },
    { name: "Light Stretching or Mobility", duration: 15, icon: "StretchHorizontal", category: "Morning Routine" },
    { name: "Mindful Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Primary Work Session" },
    { name: "Uninterrupted Deep Creative Work", duration: 120, icon: "BrainCircuit", category: "Primary Work Session" },
    { name: "Inspiration & Research Block", duration: 60, icon: "Lightbulb", category: "Primary Work Session" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Lunch Break" },
    { name: "Mindful Meal (away from desk)", duration: 30, icon: "Utensils", category: "Lunch Break" },
    { name: "Short Walk", duration: 15, icon: "Footprints", category: "Lunch Break" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Afternoon Session" },
    { name: "Skill Practice / Tutorial", duration: 45, icon: "Wrench", category: "Afternoon Session" },
    { name: "Admin & Client Communication", duration: 60, icon: "Mail", category: "Afternoon Session" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Post-Work Decompression" },
    { name: "Main Exercise / Workout", duration: 45, icon: "Dumbbell", category: "Post-Work Decompression" },
    { name: "Relaxing Hobby", duration: 60, icon: "Gamepad2", category: "Post-Work Decompression" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Routine" },
    { name: "Mindful Dinner", duration: 30, icon: "Utensils", category: "Evening Routine" },
    { name: "Social Time with Family/Friends", duration: 60, icon: "Users", category: "Evening Routine" },
    { name: "Drink a small glass of water", duration: 1, icon: "Droplets", category: "Bedtime Routine" },
    { name: "Final Idea Capture (on paper)", duration: 5, icon: "PenSquare", category: "Bedtime Routine" },
    { name: "Digital Detox (no screens)", duration: 30, icon: "Smartphone", category: "Bedtime Routine" },
    { name: "Read Fiction or Listen to Calming Music", duration: 20, icon: "Headphones", category: "Bedtime Routine" },
];

const businessProfessionalRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
    { name: "Workout/Exercise", duration: 30, icon: "Dumbbell", category: "Morning Routine" },
    { name: "Review Day's Top 3 Priorities", duration: 10, icon: "ListChecks", category: "Morning Routine" },
    { name: "Breakfast & Scan News", duration: 20, icon: "Utensils", category: "Morning Routine" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Primary Work Session" },
    { name: "Tackle Most Important Task", duration: 90, icon: "Target", category: "Primary Work Session" },
    { name: "Strategic Thinking / \"No-Meeting\" Block", duration: 60, icon: "BrainCircuit", category: "Primary Work Session" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Lunch Break" },
    { name: "Power Lunch / Quick Walk", duration: 45, icon: "Footprints", category: "Lunch Break" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Afternoon Session" },
    { name: "Meetings & Collaborative Tasks", duration: 120, icon: "Users", category: "Afternoon Session" },
    { name: "Scan & Reply to Emails", duration: 30, icon: "Mail", category: "Afternoon Session" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Post-Work Decompression" },
    { name: "End-of-Day Review & Shutdown Ritual", duration: 15, icon: "Power", category: "Post-Work Decompression" },
    { name: "Hobby / Leisure", duration: 60, icon: "Gamepad2", category: "Post-Work Decompression" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Routine" },
    { name: "Dinner with Family/Friends (no work talk)", duration: 45, icon: "Utensils", category: "Evening Routine" },
    { name: "Drink a small glass of water", duration: 1, icon: "Droplets", category: "Bedtime Routine" },
    { name: "Prepare for the Next Day", duration: 10, icon: "ShoppingBag", category: "Bedtime Routine" },
    { name: "Light Reading (non-work related)", duration: 20, icon: "BookOpen", category: "Bedtime Routine" },
    { name: "Meditation for Stress Release", duration: 10, icon: "Wind", category: "Bedtime Routine" },
];

const technicalProfessionalRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
    { name: "Meditation for Focus", duration: 10, icon: "Wind", category: "Morning Routine" },
    { name: "Review Tech News / Documentation", duration: 20, icon: "FileCode", category: "Morning Routine" },
    { name: "Breakfast (no screens)", duration: 20, icon: "Utensils", category: "Morning Routine" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Primary Work Session" },
    { name: "Deep Work Coding / Analysis Session", duration: 50, icon: "BrainCircuit", category: "Primary Work Session" },
    { name: "Short Break", duration: 10, icon: "Coffee", category: "Primary Work Session" },
    { name: "Deep Work Coding / Analysis Session", duration: 50, icon: "BrainCircuit", category: "Primary Work Session" },
    { name: "CRITICAL: Hourly Eye Strain Break", duration: 1, icon: "Eye", category: "Primary Work Session" },
    { name: "Short Break", duration: 10, icon: "Coffee", category: "Primary Work Session" },
    { name: "Deep Work Coding / Analysis Session", duration: 50, icon: "BrainCircuit", category: "Primary Work Session" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Lunch Break" },
    { name: "Screen-Free Lunch & Walk", duration: 45, icon: "Footprints", category: "Lunch Break" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Afternoon Session" },
    { name: "Code Reviews / Meetings", duration: 60, icon: "Users", category: "Afternoon Session" },
    { name: "Writing Documentation", duration: 30, icon: "PenSquare", category: "Afternoon Session" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Post-Work Decompression" },
    { name: "Strength Training or Cardio", duration: 45, icon: "Dumbbell", category: "Post-Work Decompression" },
    { name: "Analog Hobby", duration: 60, icon: "Puzzle", category: "Post-Work Decompression" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Routine" },
    { name: "Mindful Dinner", duration: 30, icon: "Utensils", category: "Evening Routine" },
    { name: "Personal Project / Learning", duration: 45, icon: "Lightbulb", category: "Evening Routine" },
    { name: "Drink a small glass of water", duration: 1, icon: "Droplets", category: "Bedtime Routine" },
    { name: "Strict Screen Cutoff", duration: 60, icon: "Smartphone", category: "Bedtime Routine" },
    { name: "Stretching for desk posture", duration: 10, icon: "StretchHorizontal", category: "Bedtime Routine" },
    { name: "Read a physical book", duration: 20, icon: "BookOpen", category: "Bedtime Routine" },
];

const onTheGoRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Prep" },
    { name: "Route & Schedule Review", duration: 15, icon: "Map", category: "Morning Prep" },
    { name: "High-Energy Breakfast", duration: 20, icon: "Utensils", category: "Morning Prep" },
    { name: "Drink water before leaving", duration: 1, icon: "Droplets", category: "On the Road" },
    { name: "In-Car Mental Reset", duration: 5, icon: "Wind", category: "On the Road" },
    { name: "Packed Lunch Break", duration: 20, icon: "Utensils", category: "On the Road" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Post-Work Admin" },
    { name: "Log Reports & Admin on Mobile", duration: 20, icon: "Smartphone", category: "Post-Work Admin" },
    { name: "Restock & Prep for Tomorrow", duration: 10, icon: "ShoppingBag", category: "Post-Work Admin" },
    { name: "Dinner", duration: 30, icon: "Utensils", category: "Evening & Bedtime" },
    { name: "Stretching for physical tension", duration: 15, icon: "StretchHorizontal", category: "Evening & Bedtime" },
    { name: "Warm shower to relax", duration: 15, icon: "ShowerHead", category: "Evening & Bedtime" },
];

const healthcareRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Pre-Shift Routine" },
    { name: "High-Energy Meal", duration: 30, icon: "Utensils", category: "Pre-Shift Routine" },
    { name: "Gentle Movement & Mental Prep", duration: 15, icon: "BrainCircuit", category: "Pre-Shift Routine" },
    { name: "Drink water frequently", duration: 1, icon: "Droplets", category: "During Shift" },
    { name: "During-Shift Micro-Reset", duration: 1, icon: "Wind", category: "During Shift" },
    { name: "Eat small, healthy snacks", duration: 10, icon: "Apple", category: "During Shift" },
    { name: "Rehydrate immediately with water", duration: 1, icon: "Droplets", category: "Post-Shift Decompression" },
    { name: "Mindful Commute", duration: 20, icon: "Headphones", category: "Post-Shift Decompression" },
    { name: "Recovery Meal & Connect with Family", duration: 45, icon: "Utensils", category: "Post-Shift Decompression" },
    { name: "Warm shower to signal 'end of day'", duration: 15, icon: "ShowerHead", category: "Post-Shift Decompression" },
];

const dayOffRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Recovery" },
    { name: "Gentle Stretching or a walk", duration: 20, icon: "Footprints", category: "Morning Recovery" },
    { name: "Leisurely Breakfast", duration: 30, icon: "Coffee", category: "Morning Recovery" },
    { name: "Run errands, appointments, groceries", duration: 90, icon: "ShoppingCart", category: "Afternoon Life Admin & Recharge" },
    { name: "Dedicate time to a relaxing hobby", duration: 60, icon: "Gamepad2", category: "Afternoon Life Admin & Recharge" },
    { name: "Connect with friends or family", duration: 60, icon: "Users", category: "Afternoon Life Admin & Recharge" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening & Bedtime Reset" },
    { name: "Mindful Dinner", duration: 30, icon: "Utensils", category: "Evening & Bedtime Reset" },
    { name: "Relaxing entertainment", duration: 60, icon: "Tv", category: "Evening & Bedtime Reset" },
    { name: "Consistent bedtime routine", duration: 30, icon: "Bed", category: "Evening & Bedtime Reset" },
];

const dayOffRoutineHealthcare: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Recovery" },
    { name: "Gentle Stretching or a walk", duration: 20, icon: "Footprints", category: "Morning Recovery" },
    { name: "Leisurely Breakfast", duration: 30, icon: "Coffee", category: "Morning Recovery" },
    { name: "Run errands, appointments, groceries", duration: 90, icon: "ShoppingCart", category: "Afternoon Life Admin & Recharge" },
    { name: "Dedicate time to a relaxing hobby", duration: 60, icon: "Gamepad2", category: "Afternoon Life Admin & Recharge" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening & Bedtime Reset" },
    { name: "Mindful Dinner", duration: 30, icon: "Utensils", category: "Evening & Bedtime Reset" },
    { name: "Journaling to unload stress", duration: 10, icon: "BookOpen", category: "Evening & Bedtime Reset" },
    { name: "Consistent bedtime routine", duration: 30, icon: "Bed", category: "Evening & Bedtime Reset" },
];

const analystRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
    { name: "Meditation for Focus", duration: 10, icon: "Wind", category: "Morning Routine" },
    { name: "Breakfast (no screens)", duration: 20, icon: "Utensils", category: "Morning Routine" },
    { name: "Commute to Office", duration: 30, icon: "Car", category: "Morning Routine" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Primary Work Session" },
    { name: "Team Stand-up & Daily Sync", duration: 15, icon: "Users", category: "Primary Work Session" },
    { name: "Deep Work: Data Querying & Analysis", duration: 120, icon: "BrainCircuit", category: "Primary Work Session" },
    { name: "Coffee Break & Stretch", duration: 15, icon: "Coffee", category: "Primary Work Session" },
    { name: "Continue Deep Work", duration: 120, icon: "Target", category: "Primary Work Session" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Lunch Break" },
    { name: "Lunch with Colleagues", duration: 45, icon: "Utensils", category: "Lunch Break" },
    { name: "Short Walk", duration: 15, icon: "Footprints", category: "Lunch Break" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Afternoon Session" },
    { name: "Stakeholder Meetings", duration: 60, icon: "Presentation", category: "Afternoon Session" },
    { name: "Building Reports & Visualizations", duration: 60, icon: "BarChart", category: "Afternoon Session" },
    { name: "Plan Tomorrow's Priorities", duration: 15, icon: "ListChecks", category: "Afternoon Session" },
    { name: "Commute from Office", duration: 30, icon: "Car", category: "Post-Work Decompression" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Post-Work Decompression" },
    { name: "Strength Training or Cardio", duration: 45, icon: "Dumbbell", category: "Post-Work Decompression" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Routine" },
    { name: "Mindful Dinner", duration: 30, icon: "Utensils", category: "Evening Routine" },
    { name: "Strict Screen Cutoff", duration: 30, icon: "Smartphone", category: "Evening Routine" },
    { name: "Read a physical book", duration: 20, icon: "BookOpen", category: "Evening Routine" },
];


export const defaultRoutines: { version: number, routines: { [key in ProfileType]: Omit<UserPresetTask, "id" | "order">[] } } = {
    version: ROUTINE_TEMPLATE_VERSION,
    routines: {
        "Analyst": analystRoutine,
        "Artist": creativeProfessionalRoutine,
        "Consultant": businessProfessionalRoutine,
        "Content Creator": creativeProfessionalRoutine,
        "Designer": creativeProfessionalRoutine,
        "Educator": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Review Lesson Plan", duration: 20, icon: "ListChecks", category: "Morning Routine" },
            { name: "Prepare Materials", duration: 25, icon: "ShoppingBag", category: "Morning Routine" },
            { name: "Teaching Block 1", duration: 90, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Grading & Feedback", duration: 60, icon: "PenTool", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch", duration: 25, icon: "Utensils", category: "Breaks & Meals" },
            { name: "Short Walk", duration: 5, icon: "Footprints", category: "Breaks & Meals" },
            { name: "Teaching Block 2", duration: 90, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Parent Communication", duration: 30, icon: "Mail", category: "Work & Focus" },
            { name: "De-stress Activity (Walk, etc.)", duration: 30, icon: "Footprints", category: "Health & Wellness" },
            { name: "Dinner", duration: 45, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
            { name: "Personal Time / Hobby", duration: 60, icon: "Gamepad2", category: "Evening Wind-down" },
            { name: "Plan Tomorrow's Top 3", duration: 15, icon: "Wrench", category: "Bedtime Routine" },
            { name: "Read for Pleasure", duration: 20, icon: "BookOpen", category: "Bedtime Routine" },
            { name: "Bedtime", duration: 0, icon: "Bed", category: "Bedtime Routine" },
        ],
        "Entrepreneur": businessProfessionalRoutine,
        "Freelancer": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Prioritize Client Work", duration: 20, icon: "ListChecks", category: "Morning Routine" },
            { name: "Morning Walk", duration: 20, icon: "Footprints", category: "Morning Routine" },
            { name: "Client Project A - Deep Work", duration: 120, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Client Communication", duration: 30, icon: "Mail", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch", duration: 25, icon: "Utensils", category: "Breaks & Meals" },
            { name: "Short Walk", duration: 5, icon: "Footprints", category: "Breaks & Meals" },
            { name: "Client Project B - Focused Work", duration: 90, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Business Admin & Invoicing", duration: 30, icon: "PenTool", category: "Work & Focus" },
            { name: "Workout or Hobby", duration: 60, icon: "Dumbbell", category: "Health & Wellness" },
            { name: "Dinner", duration: 45, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
            { name: "Skill Development", duration: 45, icon: "BookOpen", category: "Evening Wind-down" },
            { name: "Tidy Workspace", duration: 10, icon: "Wrench", category: "Bedtime Routine" },
            { name: "Disconnect from Work", duration: 30, icon: "Smartphone", category: "Bedtime Routine" },
            { name: "Bedtime", duration: 0, icon: "Bed", category: "Bedtime Routine" },
        ],
        "Healthcare Professional": healthcareRoutine,
        "Day Off - Analyst": dayOffRoutine,
        "Day Off - Healthcare": dayOffRoutineHealthcare,
        "Admin Day - On The Go": businessProfessionalRoutine,
        "Day Off": dayOffRoutine,
        "IT Professional": technicalProfessionalRoutine,
        "Manager": businessProfessionalRoutine,
        "Marketer": businessProfessionalRoutine,
        "Researcher": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Review Literature", duration: 45, icon: "BookOpen", category: "Morning Routine" },
            { name: "Formulate Hypothesis", duration: 30, icon: "Wand2", category: "Morning Routine" },
            { name: "Data Collection / Experiment", duration: 120, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Data Analysis", duration: 90, icon: "ListChecks", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch", duration: 25, icon: "Utensils", category: "Breaks & Meals" },
            { name: "Short Walk", duration: 5, icon: "Footprints", category: "Breaks & Meals" },
            { name: "Writing & Documentation", duration: 90, icon: "PenTool", category: "Work & Focus" },
            { name: "Collaborator Meetings", duration: 30, icon: "Users", category: "Work & Focus" },
            { name: "Walk to clear head", duration: 30, icon: "Footprints", category: "Health & Wellness" },
            { name: "Dinner", duration: 45, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
            { name: "Unrelated Reading/Learning", duration: 60, icon: "BookOpen", category: "Evening Wind-down" },
            { name: "Lab Cleanup / Prep for Tomorrow", duration: 15, icon: "Wrench", category: "Bedtime Routine" },
            { name: "Relax", duration: 30, icon: "Wind", category: "Bedtime Routine" },
            { name: "Bedtime", duration: 0, icon: "Bed", category: "Bedtime Routine" },
        ],
        "Sales": onTheGoRoutine,
        "Software Engineer": technicalProfessionalRoutine,
        "Student": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 15, icon: "Utensils", category: "Morning Routine" },
            { name: "Review class schedule & assignments", duration: 20, icon: "ListChecks", category: "Morning Routine" },
            { name: "Attend Class / Lecture", duration: 90, icon: "Users", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch", duration: 25, icon: "Utensils", category: "Breaks & Meals" },
            { name: "Short Walk", duration: 5, icon: "Footprints", category: "Breaks & Meals" },
            { name: "Library Study Session 1", duration: 120, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Work on Assignments/Projects", duration: 90, icon: "PenTool", category: "Work & Focus" },
            { name: "Library Study Session 2", duration: 120, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Sports or Gym", duration: 60, icon: "Dumbbell", category: "Health & Wellness" },
            { name: "Dinner", duration: 45, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
            { name: "Socializing or Club Activities", duration: 90, icon: "Users", category: "Evening Wind-down" },
            { name: "Pack bag for tomorrow", duration: 10, icon: "ShoppingBag", category: "Bedtime Routine" },
            { name: "Light reading for fun", duration: 20, icon: "BookOpen", category: "Bedtime Routine" },
            { name: "Bedtime", duration: 0, icon: "Bed", category: "Bedtime Routine" },
        ],
        "Writer": creativeProfessionalRoutine,
        "Medical Representative": onTheGoRoutine,
        "Delivery Agent": onTheGoRoutine,
        "General": [
            { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', category: 'Morning Routine' },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: 'Breakfast', duration: 20, icon: 'Utensils', category: 'Morning Routine' },
            { name: 'Plan Day', duration: 15, icon: 'ListChecks', category: 'Morning Routine' },
            { name: 'Deep Work', duration: 90, icon: 'BrainCircuit', category: 'Work & Focus' },
            { name: 'Check Emails', duration: 15, icon: 'Mail', category: 'Work & Focus' },
            { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', category: 'Work & Focus' },
            { name: 'Lunch', duration: 25, icon: 'Utensils', category: 'Breaks & Meals' },
            { name: 'Short Walk', duration: 5, icon: 'Footprints', category: 'Breaks & Meals' },
            { name: 'Workout', duration: 45, icon: 'Dumbbell', category: 'Health & Wellness' },
            { name: 'Dinner', duration: 30, icon: 'Utensils', category: 'Evening Wind-down' },
            { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', category: 'Evening Wind-down' },
            { name: 'Read a Book', duration: 30, icon: 'BookOpen', category: 'Evening Wind-down' },
            { name: 'Wind Down', duration: 15, icon: 'Bed', category: 'Bedtime Routine' }
        ]
    }
};

export const profileToRoutineMap: { [key: string]: keyof typeof defaultRoutines.routines } = {
    "Analyst": "Analyst",
    "Artist": "Artist",
    "Consultant": "Consultant",
    "Content Creator": "Content Creator",
    "Designer": "Designer",
    "Educator": "Educator",
    "Entrepreneur": "Entrepreneur",
    "Freelancer": "Freelancer",
    "General": "General",
    "Healthcare Professional": "Healthcare Professional",
    "Day Off": "Day Off",
    "Day Off - Analyst": "Day Off - Analyst",
    "Day Off - Healthcare": "Day Off - Healthcare",
    "Admin Day - On The Go": "Admin Day - On The Go",
    "IT Professional": "IT Professional",
    "Manager": "Manager",
    "Marketer": "Marketer",
    "Researcher": "Researcher",
    "Sales": "Sales",
    "Software Engineer": "Software Engineer",
    "Student": "Student",
    "Writer": "Writer",
    "Medical Representative": "Medical Representative",
    "Delivery Agent": "Delivery Agent"
};

const categoryConfig: { [key: string]: { color: string, order: number } } = {
    'Morning Routine': { color: 'bg-sky-800 text-sky-100', order: 1 },
    'Primary Work Session': { color: 'bg-blue-800 text-blue-100', order: 2 },
    'Lunch Break': { color: 'bg-orange-800 text-orange-100', order: 3 },
    'Afternoon Session': { color: 'bg-indigo-800 text-indigo-100', order: 4 },
    'Post-Work Decompression': { color: 'bg-rose-800 text-rose-100', order: 5 },
    'Evening Routine': { color: 'bg-purple-800 text-purple-100', order: 6 },
    'Bedtime Routine': { color: 'bg-slate-800 text-slate-100', order: 7 },
    'Work & Focus': { color: 'bg-blue-800 text-blue-100', order: 2 },
    'Breaks & Meals': { color: 'bg-orange-800 text-orange-100', order: 3 },
    'Health & Wellness': { color: 'bg-green-800 text-green-100', order: 4 },
    'Evening Wind-down': { color: 'bg-amber-800 text-amber-100', order: 5 },
    // On-the-go
    'Morning Prep': { color: 'bg-sky-800 text-sky-100', order: 1 },
    'On the Road': { color: 'bg-blue-800 text-blue-100', order: 2 },
    'Post-Work Admin': { color: 'bg-indigo-800 text-indigo-100', order: 3 },
    'Evening & Bedtime': { color: 'bg-purple-800 text-purple-100', order: 4 },
    // Healthcare
    'Pre-Shift Routine': { color: 'bg-sky-800 text-sky-100', order: 1 },
    'During Shift': { color: 'bg-blue-800 text-blue-100', order: 2 },
    // Day Off
    'Morning Recovery': { color: 'bg-sky-800 text-sky-100', order: 1 },
    'Afternoon Life Admin & Recharge': { color: 'bg-green-800 text-green-100', order: 2 },
    'Evening & Bedtime Reset': { color: 'bg-amber-800 text-amber-100', order: 3 },
    'Default': { color: 'bg-slate-800 text-slate-100', order: 99 },
};

export const getAvailableCategories = () => Object.keys(categoryConfig);
export const getAvailableIcons = () => ["ListChecks", "Bed", "StretchHorizontal", "Dumbbell", "BrainCircuit", "Mail", "Users", "Coffee", "Footprints", "Wind", "Droplets", "BookOpen", "Utensils", "Target", "Wrench", "ShoppingBag", "Gamepad2", "Eye", "PenTool", "Smartphone", "Car", "Tv", "Apple", "ShowerHead", "Truck", "FileCode", "PenSquare", "Puzzle", "Lightbulb", "Presentation", "BarChart", "ShoppingCart", "Headphones", "Power", "Map", "Wand2"];


// Hook for managing preset tasks and routines
export function usePresetTasks() {
  const { user, isOffline, isSyncEnabled } = useAuth();
  const { profile, loading: profileLoading, profileData, getEffectiveProfile } = useProfile();
  const [presetTasks, setPresetTasks] = useState<Preset>({});
  const [loading, setLoading] = useState(true);

  const isDefaultTask = (task: UserPresetTask) => {
    // A task is default if it's from a built-in profession profile
    return !!profileToRoutineMap[task.profession || profile];
  };
  
  const effectiveProfile = useMemo(() => {
    return getEffectiveProfile();
  }, [getEffectiveProfile]);

  useEffect(() => {
    if (profileLoading) {
      return;
    }

    if (isOffline) {
        const routineKey = 'General';
        const defaultTasks = defaultRoutines.routines[routineKey] || [];
        let order = 0;
        const tasksWithOrder = defaultTasks.map(task => ({ ...task, order: order++ }));
        
        const newPreset = tasksWithOrder.reduce((acc: Preset, task) => {
            const category = task.category || 'Default';
            if (!acc[category]) {
                acc[category] = { color: categoryConfig[category]?.color || categoryConfig['Default'].color, tasks: [] };
            }
            acc[category].tasks.push(task as UserPresetTask);
            return acc;
        }, {});
        setPresetTasks(newPreset);
        setLoading(false);
        return;
    }
    
    if (!user || !effectiveProfile) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    let unsubscribe: (() => void) | null = null;
    
    // Always load from cache first for speed
    const cacheKey = `preset_tasks_${user.uid}_${effectiveProfile}`;
    try {
        const cachedTasks = localStorage.getItem(cacheKey);
        if (cachedTasks) {
            setPresetTasks(JSON.parse(cachedTasks));
            setLoading(false); // We have data, so stop initial loading indicator
        }
    } catch (error) {
        console.warn("Couldn't access localStorage for preset tasks");
    }

    if (isSyncEnabled) {
        const q = query(
            collection(db, 'userPresetTasks'),
            where('userId', '==', user.uid),
            where('profession', '==', effectiveProfile),
            orderBy('order', 'asc')
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
            const seenTaskSignatures = new Set<string>();
            
            const newPreset = snapshot.docs.reduce((acc: Preset, doc) => {
                const task = { id: doc.id, ...doc.data() } as UserPresetTask;
                const category = task.category || 'Default';
                const signature = `${task.name.trim()}-${category}`;

                if (seenTaskSignatures.has(signature)) {
                    return acc; // Skip duplicate
                }
                seenTaskSignatures.add(signature);
                
                if (!acc[category]) {
                    acc[category] = { color: categoryConfig[category]?.color || categoryConfig['Default'].color, tasks: [] };
                }
                acc[category].tasks.push(task);
                return acc;
            }, {});

            const sortedPreset: Preset = {};
            Object.keys(newPreset).sort((a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99))
                .forEach(key => { sortedPreset[key] = newPreset[key]; });
            
            setPresetTasks(sortedPreset);
            setLoading(false);

            try {
                localStorage.setItem(cacheKey, JSON.stringify(sortedPreset));
            } catch (error) {
                console.warn("Could not cache preset tasks");
            }

        }, (error) => {
            console.error("Error fetching preset tasks: ", error);
            setLoading(false);
        });
    } else {
        setLoading(false);
    }

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [user, effectiveProfile, isOffline, profileLoading, isSyncEnabled]);
  
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
     return;
  };

  const categoryTimeRanges = useMemo(() => {
    const ranges: { [category: string]: { start: Date, end: Date } } = {};
    if (Object.keys(presetTasks).length === 0) return ranges;

    const today = new Date();
    
    const timeBlocks = {
        'Morning Routine': { start: 6, end: 9 },
        'Primary Work Session': { start: 9, end: 13 },
        'Lunch Break': { start: 13, end: 14 },
        'Afternoon Session': { start: 14, end: 17 },
        'Post-Work Decompression': { start: 17, end: 19 },
        'Evening Routine': { start: 19, end: 21 },
        'Bedtime Routine': { start: 21, end: 24 },
        'Work & Focus': { start: 9, end: 17 }, // Generic fallback
        'Breaks & Meals': { start: 12, end: 14 }, // Generic fallback
        'Health & Wellness': {start: 17, end: 19 }, // Generic fallback
        'Evening Wind-down': { start: 19, end: 21 }, // Generic fallback
    };
    
    Object.keys(presetTasks).forEach(category => {
        const categoryLookup = category as keyof typeof timeBlocks;
        if (timeBlocks[categoryLookup]) {
            const block = timeBlocks[categoryLookup];
            ranges[category] = {
                start: set(today, { hours: block.start, minutes: 0, seconds: 0, milliseconds: 0 }),
                end: set(today, { hours: block.end, minutes: 0, seconds: 0, milliseconds: 0 }),
            };
        }
    });

    return ranges;
  }, [presetTasks]);


  const activeCategory = useMemo(() => {
      const now = new Date();
      const matchingCategories = Object.entries(categoryTimeRanges)
          .filter(([, range]) => now >= range.start && now < range.end)
          .map(([category]) => category);
      
      if (matchingCategories.length === 0) return null;
      if (matchingCategories.length === 1) return matchingCategories[0];
      
      const availableMatchingCategories = matchingCategories.filter(category => presetTasks[category]);
      
      if (availableMatchingCategories.length > 0) {
          const preference = ['Health & Wellness', 'Evening Wind-down', 'Evening Reset', 'Breaks & Meals', 'Work & Focus'];
          for (const preferred of preference) {
              if (availableMatchingCategories.includes(preferred)) {
                  return preferred;
              }
          }
          return availableMatchingCategories[0];
      }
      
      return matchingCategories[0];
  }, [categoryTimeRanges, presetTasks]);

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
      const userEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        const eventDate = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
        return { id: doc.id, ...data, date: eventDate } as UserEvent
      });
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
