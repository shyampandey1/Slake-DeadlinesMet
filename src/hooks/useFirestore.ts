
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
import type { Task, UserPresetTask, Preset, ProfileType, UserEvent, Day, UserProfile } from '@/types';
import { useProfile } from './useProfile';
import { add, set, startOfDay, endOfDay, getDay, isToday, format as formatDate, parseISO } from 'date-fns';

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
const ROUTINE_TEMPLATE_VERSION = 17;

// All default routines for professions
const defaultRoutines: { version: number, routines: { [key in ProfileType]: Omit<UserPresetTask, "id" | "order">[] } } = {
    version: ROUTINE_TEMPLATE_VERSION,
    routines: {
        "Artist": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Morning Idea Dump / Journaling", duration: 15, icon: "PenTool", category: "Morning Routine" },
            { name: "Light Stretching or Mobility", duration: 15, icon: "StretchHorizontal", category: "Morning Routine" },
            { name: "Uninterrupted Deep Creative Work", duration: 120, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch", duration: 45, icon: "Utensils", category: "Breaks & Meals" },
            { name: "Inspiration & Research Block", duration: 60, icon: "Eye", category: "Work & Focus" },
            { name: "Skill Practice / Tutorial", duration: 30, icon: "BookOpen", category: "Work & Focus" },
            { name: "Admin & Client Communication", duration: 45, icon: "Mail", category: "Work & Focus" },
            { name: "Main Exercise / Workout", duration: 45, icon: "Dumbbell", category: "Health & Wellness" },
            { name: "Dinner", duration: 30, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
            { name: "Social Time or Relaxing Hobby", duration: 60, icon: "Users", category: "Evening Wind-down" },
            { name: "Final Idea Capture", duration: 5, icon: "PenTool", category: "Bedtime Routine" },
            { name: "Digital Detox", duration: 30, icon: "Smartphone", category: "Bedtime Routine" },
            { name: "Read Fiction or Listen to Calming Music", duration: 20, icon: "BookOpen", category: "Bedtime Routine" },
            { name: "Bedtime", duration: 0, icon: "Bed", category: "Bedtime Routine" },
        ],
        "Consultant": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Review Day's Top 3 Priorities", duration: 10, icon: "ListChecks", category: "Morning Routine" },
            { name: "Workout/Exercise", duration: 30, icon: "Dumbbell", category: "Morning Routine" },
            { name: "Strategic Thinking / 'No-Meeting' Block", duration: 60, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Tackle Most Important Task", duration: 90, icon: "Target", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch & Quick Walk", duration: 45, icon: "Footprints", category: "Breaks & Meals" },
            { name: "Meetings & Collaborative Tasks", duration: 120, icon: "Users", category: "Work & Focus" },
            { name: "Scan & Reply to Emails", duration: 30, icon: "Mail", category: "Work & Focus" },
            { name: "End-of-Day Review & Shutdown Ritual", duration: 15, icon: "Wrench", category: "Evening Wind-down" },
            { name: "Hobby / Leisure (Video Games, etc.)", duration: 60, icon: "Gamepad2", category: "Evening Wind-down" },
            { name: "Dinner with Family/Friends", duration: 45, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
            { name: "Prepare for the Next Day", duration: 10, icon: "ShoppingBag", category: "Bedtime Routine" },
            { name: "Light Reading (non-work related)", duration: 20, icon: "BookOpen", category: "Bedtime Routine" },
            { name: "Meditation or Breathing for Stress Release", duration: 10, icon: "Wind", category: "Bedtime Routine" },
            { name: "Bedtime", duration: 0, icon: "Bed", category: "Bedtime Routine" },
        ],
        "Content Creator": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Review Analytics & Comments", duration: 20, icon: "ListChecks", category: "Morning Routine" },
            { name: "Scripting & Content Planning", duration: 60, icon: "PenTool", category: "Morning Routine" },
            { name: "Filming / Recording Session", duration: 120, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch & Mental Break", duration: 30, icon: "Utensils", category: "Breaks & Meals" },
            { name: "Editing & Post-Production", duration: 90, icon: "Eye", category: "Work & Focus" },
            { name: "Community Engagement", duration: 45, icon: "Mail", category: "Work & Focus" },
            { name: "Thumbnail Design & Uploads", duration: 30, icon: "BookOpen", category: "Work & Focus" },
            { name: "Workout / Physical Activity", duration: 45, icon: "Dumbbell", category: "Health & Wellness" },
            { name: "Dinner", duration: 30, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
            { name: "Relax & Consume Content", duration: 60, icon: "Users", category: "Evening Wind-down" },
            { name: "Tidy Up Workspace", duration: 10, icon: "Wrench", category: "Bedtime Routine" },
            { name: "Journal / Unwind", duration: 15, icon: "PenTool", category: "Bedtime Routine" },
            { name: "Read / Disconnect", duration: 20, icon: "BookOpen", category: "Bedtime Routine" },
            { name: "Bedtime", duration: 0, icon: "Bed", category: "Bedtime Routine" },
        ],
        "Designer": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Moodboarding & Inspiration", duration: 20, icon: "Eye", category: "Morning Routine" },
            { name: "Sketching & Wireframing", duration: 45, icon: "PenTool", category: "Morning Routine" },
            { name: "Focused Design Session", duration: 120, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch & Walk", duration: 45, icon: "Footprints", category: "Breaks & Meals" },
            { name: "Feedback & Iteration", duration: 60, icon: "Users", category: "Work & Focus" },
            { name: "Prototyping & Testing", duration: 90, icon: "Smartphone", category: "Work & Focus" },
            { name: "Client/Team Communication", duration: 30, icon: "Mail", category: "Work & Focus" },
            { name: "Exercise or Outdoor Time", duration: 45, icon: "Dumbbell", category: "Health & Wellness" },
            { name: "Dinner", duration: 30, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
            { name: "Personal Creative Project", duration: 60, icon: "Wand2", category: "Evening Wind-down" },
            { name: "Organize Files & Prep for Tomorrow", duration: 15, icon: "Wrench", category: "Bedtime Routine" },
            { name: "Read a Book", duration: 20, icon: "BookOpen", category: "Bedtime Routine" },
            { name: "Bedtime", duration: 0, icon: "Bed", category: "Bedtime Routine" },
        ],
        "Educator": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Review Lesson Plan", duration: 20, icon: "ListChecks", category: "Morning Routine" },
            { name: "Prepare Materials", duration: 25, icon: "ShoppingBag", category: "Morning Routine" },
            { name: "Teaching Block 1", duration: 90, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Grading & Feedback", duration: 60, icon: "PenTool", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch", duration: 45, icon: "Utensils", category: "Breaks & Meals" },
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
        "Entrepreneur": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Set Daily MIT (Most Important Task)", duration: 15, icon: "Target", category: "Morning Routine" },
            { name: "High-Intensity Workout", duration: 30, icon: "Dumbbell", category: "Morning Routine" },
            { name: "Deep Work on MIT", duration: 120, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch", duration: 30, icon: "Utensils", category: "Breaks & Meals" },
            { name: "Networking & Outreach", duration: 60, icon: "Users", category: "Work & Focus" },
            { name: "Product Development", duration: 90, icon: "Wrench", category: "Work & Focus" },
            { name: "Financial Review", duration: 30, icon: "ListChecks", category: "Work & Focus" },
            { name: "Walk to Decompress", duration: 30, icon: "Footprints", category: "Health & Wellness" },
            { name: "Dinner (Screen-free)", duration: 45, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
            { name: "Learn a New Skill", duration: 45, icon: "BookOpen", category: "Evening Wind-down" },
            { name: "End of Day Shutdown", duration: 15, icon: "Wrench", category: "Bedtime Routine" },
            { name: "Journal & Reflect", duration: 15, icon: "PenTool", category: "Bedtime Routine" },
            { name: "Bedtime", duration: 0, icon: "Bed", category: "Bedtime Routine" },
        ],
        "Freelancer": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Prioritize Client Work", duration: 20, icon: "ListChecks", category: "Morning Routine" },
            { name: "Morning Walk", duration: 20, icon: "Footprints", category: "Morning Routine" },
            { name: "Client Project A - Deep Work", duration: 120, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Client Communication", duration: 30, icon: "Mail", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch", duration: 45, icon: "Utensils", category: "Breaks & Meals" },
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
        "Healthcare Professional": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Gentle Movement & Mental Prep", duration: 15, icon: "StretchHorizontal", category: "Morning Routine" },
            { name: "Commute & Pre-Shift Huddle", duration: 30, icon: "Car", category: "Work & Focus" },
            { name: "Patient Rounds & Care", duration: 120, icon: "Users", category: "Work & Focus" },
            { name: "Drink water & have a snack", duration: 10, icon: "Apple", category: "Breaks & Meals" },
            { name: "Charting & Patient Notes", duration: 60, icon: "PenTool", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch", duration: 30, icon: "Utensils", category: "Breaks & Meals" },
            { name: "Mindful Commute (calm music)", duration: 20, icon: "Car", category: "Evening Wind-down" },
            { name: "Dinner & Connect with Family", duration: 60, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
            { name: "Warm shower to signal 'end of day'", duration: 15, icon: "ShowerHead", category: "Bedtime Routine" },
            { name: "Digital Detox & Light Reading", duration: 30, icon: "BookOpen", category: "Bedtime Routine" },
            { name: "Bedtime", duration: 0, icon: "Bed", category: "Bedtime Routine" }
        ],
        "Day Off": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Recovery" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Recovery" },
            { name: "Gentle Stretching or a walk", duration: 20, icon: "Footprints", category: "Morning Recovery" },
            { name: "Enjoy a leisurely breakfast", duration: 30, icon: "Coffee", category: "Morning Recovery" },
            { name: "Lunch", duration: 60, icon: "Utensils", category: "Afternoon Recharge" },
            { name: "Run errands & appointments", duration: 90, icon: "ShoppingBag", category: "Afternoon Recharge" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Afternoon Recharge" },
            { name: "Dedicate time to a hobby you love", duration: 60, icon: "Gamepad2", category: "Afternoon Recharge" },
            { name: "Connect with friends or family", duration: 60, icon: "Users", category: "Afternoon Recharge" },
            { name: "Mindful Dinner", duration: 30, icon: "Utensils", category: "Evening Reset" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Reset" },
            { name: "Relaxing entertainment", duration: 60, icon: "Tv", category: "Evening Reset" },
            { name: "Consistent bedtime routine", duration: 30, icon: "Bed", category: "Evening Reset" },
        ],
        "IT Professional": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Meditation for Focus", duration: 10, icon: "Wind", category: "Morning Routine" },
            { name: "Review Tech News / Documentation", duration: 20, icon: "FileCode", category: "Morning Routine" },
            { name: "Breakfast (no screens)", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Short Break", duration: 10, icon: "Coffee", category: "Breaks & Meals" },
            { name: "Deep Work Coding / Analysis Session 1", duration: 50, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Short Break", duration: 10, icon: "Coffee", category: "Breaks & Meals" },
            { name: "Deep Work Coding / Analysis Session 2", duration: 50, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Short Break", duration: 10, icon: "Coffee", category: "Breaks & Meals" },
            { name: "Deep Work Coding / Analysis Session 3", duration: 50, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Hourly 20-20-20 Eye Strain Break", duration: 1, icon: "Eye", category: "Work & Focus" },
            { name: "Screen-Free Lunch & Walk", duration: 45, icon: "Footprints", category: "Breaks & Meals" },
            { name: "Code Reviews / Meetings", duration: 60, icon: "Users", category: "Work & Focus" },
            { name: "Writing Documentation", duration: 30, icon: "PenSquare", category: "Work & Focus" },
            { name: "Strength Training or Cardio", duration: 45, icon: "Dumbbell", category: "Health & Wellness" },
            { name: "Analog Hobby (puzzles, music, etc.)", duration: 60, icon: "Puzzle", category: "Evening Wind-down" },
            { name: "Mindful Dinner", duration: 30, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Personal Project / Learning", duration: 45, icon: "Lightbulb", category: "Evening Wind-down" },
            { name: "Strict Screen Cutoff", duration: 60, icon: "Smartphone", category: "Bedtime Routine" },
            { name: "Stretching to relieve desk posture", duration: 10, icon: "StretchHorizontal", category: "Bedtime Routine" },
            { name: "Read a physical book", duration: 20, icon: "BookOpen", category: "Bedtime Routine" },
        ],
        "Manager": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Review Team's Priorities", duration: 20, icon: "ListChecks", category: "Morning Routine" },
            { name: "Morning Walk", duration: 20, icon: "Footprints", category: "Morning Routine" },
            { name: "One-on-One Meetings", duration: 90, icon: "Users", category: "Work & Focus" },
            { name: "Strategic Planning", duration: 60, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch & Networking", duration: 60, icon: "Utensils", category: "Breaks & Meals" },
            { name: "Team Sync & Collaboration", duration: 90, icon: "Users", category: "Work & Focus" },
            { name: "Email & Communication", duration: 45, icon: "Mail", category: "Work & Focus" },
            { name: "Gym Session", duration: 60, icon: "Dumbbell", category: "Health & Wellness" },
            { name: "Family Dinner", duration: 60, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
            { name: "Unwind with a Book/Podcast", duration: 45, icon: "BookOpen", category: "Evening Wind-down" },
            { name: "Prepare for Tomorrow", duration: 15, icon: "Wrench", category: "Bedtime Routine" },
            { name: "Meditate", duration: 10, icon: "Wind", category: "Bedtime Routine" },
            { name: "Bedtime", duration: 0, icon: "Bed", category: "Bedtime Routine" },
        ],
        "Marketer": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Check Campaign Performance", duration: 30, icon: "ListChecks", category: "Morning Routine" },
            { name: "Content Creation/Briefing", duration: 60, icon: "PenTool", category: "Morning Routine" },
            { name: "Analytics Deep Dive", duration: 90, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "A/B Test planning", duration: 45, icon: "Wand2", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch & Learn", duration: 45, icon: "Utensils", category: "Breaks & Meals" },
            { name: "Collaborate with Sales/Product", duration: 60, icon: "Users", category: "Work & Focus" },
            { name: "Social Media Management", duration: 45, icon: "Mail", category: "Work & Focus" },
            { name: "Yoga or Stretching", duration: 30, icon: "StretchHorizontal", category: "Health & Wellness" },
            { name: "Dinner", duration: 45, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
            { name: "Relaxing Hobby", duration: 60, icon: "Gamepad2", category: "Evening Wind-down" },
            { name: "Plan social media for tomorrow", duration: 20, icon: "PenTool", category: "Bedtime Routine" },
            { name: "Read", duration: 20, icon: "BookOpen", category: "Bedtime Routine" },
            { name: "Bedtime", duration: 0, icon: "Bed", category: "Bedtime Routine" },
        ],
        "Researcher": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Review Literature", duration: 45, icon: "BookOpen", category: "Morning Routine" },
            { name: "Formulate Hypothesis", duration: 30, icon: "Wand2", category: "Morning Routine" },
            { name: "Data Collection / Experiment", duration: 120, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Data Analysis", duration: 90, icon: "ListChecks", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch", duration: 45, icon: "Utensils", category: "Breaks & Meals" },
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
        "Sales": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Review CRM & Plan Calls", duration: 30, icon: "ListChecks", category: "Morning Routine" },
            { name: "Role-play & Script Practice", duration: 15, icon: "Users", category: "Morning Routine" },
            { name: "Prospecting & Outreach Block", duration: 90, icon: "Mail", category: "Work & Focus" },
            { name: "Client Demos & Meetings", duration: 120, icon: "Users", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch", duration: 45, icon: "Utensils", category: "Breaks & Meals" },
            { name: "Follow-ups & Nurturing", duration: 60, icon: "PenTool", category: "Work & Focus" },
            { name: "Pipeline Management", duration: 30, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "High-Energy Workout", duration: 45, icon: "Dumbbell", category: "Health & Wellness" },
            { name: "Dinner", duration: 45, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
            { name: "Relax with Entertainment", duration: 60, icon: "Gamepad2", category: "Evening Wind-down" },
            { name: "Set goals for tomorrow", duration: 10, icon: "Target", category: "Bedtime Routine" },
            { name: "Read sales book/blog", duration: 20, icon: "BookOpen", category: "Bedtime Routine" },
            { name: "Bedtime", duration: 0, icon: "Bed", category: "Bedtime Routine" },
        ],
        "Software Engineer": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Review PRs & Team Updates", duration: 30, icon: "ListChecks", category: "Morning Routine" },
            { name: "Plan coding session", duration: 15, icon: "PenTool", category: "Morning Routine" },
            { name: "Coding Focus Session 1", duration: 120, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch & Walk away from screen", duration: 45, icon: "Footprints", category: "Breaks & Meals" },
            { name: "System Design & Architecture", duration: 60, icon: "Wrench", category: "Work & Focus" },
            { name: "Coding Focus Session 2", duration: 120, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Meetings & Collaboration", duration: 45, icon: "Users", category: "Work & Focus" },
            { name: "Workout/Exercise", duration: 45, icon: "Dumbbell", category: "Health & Wellness" },
            { name: "Dinner", duration: 45, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
            { name: "Side Project or Learning", duration: 60, icon: "Wrench", category: "Evening Wind-down" },
            { name: "Push code & clean up", duration: 15, icon: "Wrench", category: "Bedtime Routine" },
            { name: "No screens before bed", duration: 30, icon: "Smartphone", category: "Bedtime Routine" },
            { name: "Bedtime", duration: 0, icon: "Bed", category: "Bedtime Routine" },
        ],
        "Student": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 15, icon: "Utensils", category: "Morning Routine" },
            { name: "Review class schedule & assignments", duration: 20, icon: "ListChecks", category: "Morning Routine" },
            { name: "Attend Class / Lecture", duration: 90, icon: "Users", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch", duration: 60, icon: "Utensils", category: "Breaks & Meals" },
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
        "Writer": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Free writing / Journaling", duration: 25, icon: "PenTool", category: "Morning Routine" },
            { name: "Read to inspire", duration: 20, icon: "BookOpen", category: "Morning Routine" },
            { name: "Writing Session 1 (New Draft)", duration: 120, icon: "BrainCircuit", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch & Walk", duration: 45, icon: "Footprints", category: "Breaks & Meals" },
            { name: "Research & Outlining", duration: 60, icon: "ListChecks", category: "Work & Focus" },
            { name: "Editing & Rewriting", duration: 90, icon: "PenTool", category: "Work & Focus" },
            { name: "Submissions & Admin", duration: 30, icon: "Mail", category: "Work & Focus" },
            { name: "Exercise", duration: 45, icon: "Dumbbell", category: "Health & Wellness" },
            { name: "Dinner", duration: 45, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
            { name: "Relaxing activity", duration: 60, icon: "Gamepad2", category: "Evening Wind-down" },
            { name: "Set up for tomorrow's writing", duration: 10, icon: "Wrench", category: "Bedtime Routine" },
            { name: "Read for pleasure", duration: 30, icon: "BookOpen", category: "Bedtime Routine" },
            { name: "Bedtime", duration: 0, icon: "Bed", category: "Bedtime Routine" },
        ],
        "Medical Representative": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Review Target List & Plan Route", duration: 30, icon: "ListChecks", category: "Morning Routine" },
            { name: "Prepare Materials & Samples", duration: 15, icon: "ShoppingBag", category: "Morning Routine" },
            { name: "First Block of Client Visits", duration: 180, icon: "Car", category: "Work & Focus" },
            { name: "Update CRM & Log Visits", duration: 30, icon: "PenTool", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch", duration: 45, icon: "Utensils", category: "Breaks & Meals" },
            { name: "Second Block of Client Visits", duration: 120, icon: "Car", category: "Work & Focus" },
            { name: "Follow-up Emails & Calls", duration: 45, icon: "Mail", category: "Work & Focus" },
            { name: "Unwind After a Day of Driving", duration: 30, icon: "Wind", category: "Health & Wellness" },
            { name: "Dinner", duration: 45, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
            { name: "Plan Tomorrow's Route", duration: 20, icon: "ListChecks", category: "Evening Wind-down" },
            { name: "Relax", duration: 60, icon: "Tv", category: "Bedtime Routine" },
            { name: "Bedtime", duration: 0, icon: "Bed", category: "Bedtime Routine" },
        ],
        "Delivery Agent": [
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Routine" },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: "Breakfast", duration: 20, icon: "Utensils", category: "Morning Routine" },
            { name: "Vehicle Check & Load-out", duration: 20, icon: "Wrench", category: "Morning Routine" },
            { name: "Review Delivery Route", duration: 15, icon: "ListChecks", category: "Morning Routine" },
            { name: "Morning Delivery Block", duration: 240, icon: "Truck", category: "Work & Focus" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
            { name: "Lunch", duration: 45, icon: "Utensils", category: "Breaks & Meals" },
            { name: "Afternoon Delivery Block", duration: 180, icon: "Truck", category: "Work & Focus" },
            { name: "End of Day Unload & Debrief", duration: 30, icon: "PenTool", category: "Work & Focus" },
            { name: "Light Stretch", duration: 15, icon: "StretchHorizontal", category: "Health & Wellness" },
            { name: "Dinner", duration: 45, icon: "Utensils", category: "Evening Wind-down" },
            { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
            { name: "Relax & Unwind", duration: 90, icon: "Tv", category: "Evening Wind-down" },
            { name: "Bedtime", duration: 0, icon: "Bed", category: "Bedtime Routine" },
        ],
        "General": [
            { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', category: 'Morning Routine' },
            { name: "Freshen Up & Get Ready", duration: 15, icon: "ShowerHead", category: "Morning Routine" },
            { name: 'Breakfast', duration: 20, icon: 'Utensils', category: 'Morning Routine' },
            { name: 'Plan Day', duration: 15, icon: 'ListChecks', category: 'Morning Routine' },
            { name: 'Deep Work', duration: 90, icon: 'BrainCircuit', category: 'Work & Focus' },
            { name: 'Check Emails', duration: 15, icon: 'Mail', category: 'Work & Focus' },
            { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', category: 'Work & Focus' },
            { name: 'Lunch', duration: 45, icon: 'Utensils', category: 'Breaks & Meals' },
            { name: 'Workout', duration: 45, icon: 'Dumbbell', category: 'Health & Wellness' },
            { name: 'Dinner', duration: 30, icon: 'Utensils', category: 'Evening Wind-down' },
            { name: 'Drink a glass of water', duration: 1, icon: 'Droplets', category: 'Evening Wind-down' },
            { name: 'Read a Book', duration: 30, icon: 'BookOpen', category: 'Evening Wind-down' },
            { name: 'Wind Down', duration: 15, icon: 'Bed', category: 'Bedtime Routine' }
        ]
    }
};

const profileToRoutineMap: { [key: string]: keyof typeof defaultRoutines.routines } = {
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
    'Work & Focus': { color: 'bg-blue-800 text-blue-100', order: 2 },
    'Breaks & Meals': { color: 'bg-orange-800 text-orange-100', order: 3 },
    'Health & Wellness': { color: 'bg-green-800 text-green-100', order: 4 },
    'Evening Wind-down': { color: 'bg-amber-800 text-amber-100', order: 5 },
    'Bedtime Routine': { color: 'bg-purple-800 text-purple-100', order: 6 },
    'Afternoon Routine': { color: 'bg-blue-800 text-blue-100', order: 2 },
    'Pre-Shift Routine': { color: 'bg-sky-800 text-sky-100', order: 1 },
    'During Shift': { color: 'bg-blue-800 text-blue-100', order: 2 },
    'Post-Shift Decompression': { color: 'bg-purple-800 text-purple-100', order: 3 },
    'Morning Recovery': { color: 'bg-sky-800 text-sky-100', order: 1 },
    'Afternoon Recharge': { color: 'bg-green-800 text-green-100', order: 2 },
    'Evening Reset': { color: 'bg-amber-800 text-amber-100', order: 3 },
    'Default': { color: 'bg-slate-800 text-slate-100', order: 7 },
};

const getAvailableCategories = () => Object.keys(categoryConfig);
const getAvailableIcons = () => ["ListChecks", "Bed", "StretchHorizontal", "Dumbbell", "BrainCircuit", "Mail", "Users", "Coffee", "Footprints", "Wind", "Droplets", "BookOpen", "Utensils", "Target", "Wrench", "ShoppingBag", "Gamepad2", "Eye", "PenTool", "Smartphone", "Car", "Tv", "Apple", "ShowerHead", "Truck", "FileCode", "PenSquare", "Puzzle", "Lightbulb"];


// Hook for managing preset tasks and routines
export function usePresetTasks() {
  const { user, isOffline, isSyncEnabled } = useAuth();
  const { profile, daysOff, loading: profileLoading, profileData } = useProfile();
  const [presetTasks, setPresetTasks] = useState<Preset>({});
  const [loading, setLoading] = useState(true);
  const PRESET_TASKS_CACHE_KEY_PREFIX = 'user_preset_tasks_';

  const isDefaultTask = (task: UserPresetTask) => {
    // A task is default if it's from a built-in profession profile
    return !!profileToRoutineMap[task.profession || profile];
  };
  
  const getEffectiveProfile = useCallback(() => {
    const dayMap: { [key in Day]: number } = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    const today = getDay(new Date()); // Sunday = 0, ...
    
    for (const dayOff of daysOff) {
        if (dayMap[dayOff] === today) {
            return 'Day Off';
        }
    }
    return profile;
  }, [profile, daysOff]);
  
const initializeUserTasks = useCallback(async (uid: string, prof: ProfileType) => {
    const tasksForProfessionQuery = query(
        collection(db, 'userPresetTasks'),
        where('userId', '==', uid),
        where('profession', '==', prof)
    );
    const existingTasksSnapshot = await getDocs(tasksForProfessionQuery);

    if (!existingTasksSnapshot.empty) {
        return; // Tasks already exist, do nothing.
    }
    
    await runTransaction(db, async (transaction) => {
        const profileRef = doc(db, 'userProfiles', uid);
        const profileDoc = await transaction.get(profileRef);

        const routineKey = profileToRoutineMap[prof] || 'General';
        const defaultTasks = defaultRoutines.routines[routineKey] || [];
        let order = 0;
        defaultTasks.forEach(task => {
            const newTaskRef = doc(collection(db, "userPresetTasks"));
            transaction.set(newTaskRef, { ...task, userId: uid, profession: prof, order: order++ });
        });

        const currentData = (profileDoc.data() as UserProfile) || {};
        const newRoutineVersions = { ...(currentData.routineVersions || {}), [prof]: ROUTINE_TEMPLATE_VERSION };
        
        if (profileDoc.exists()) {
            transaction.update(profileRef, { routineVersions: newRoutineVersions });
        } else {
            transaction.set(profileRef, { profile: prof, daysOff: [], customProfessions: [], routineVersions: newRoutineVersions }, { merge: true });
        }
    });
}, []);

  const effectiveProfile = useMemo(() => {
    return getEffectiveProfile();
  }, [getEffectiveProfile]);

  useEffect(() => {
    if (profileLoading || !user) {
        return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | null = null;
    
    const loadData = async () => {
        if (!mounted || !effectiveProfile) return;

        setLoading(true);
        setPresetTasks({});

        if (isOffline || !isSyncEnabled) {
            const routineKey = profileToRoutineMap[effectiveProfile] || 'General';
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

            if (mounted) {
                setPresetTasks(newPreset);
                setLoading(false);
            }
            return;
        }

        const userRoutineVersion = profileData?.routineVersions?.[effectiveProfile] || 0;
        if (userRoutineVersion < ROUTINE_TEMPLATE_VERSION) {
            await initializeUserTasks(user.uid, effectiveProfile);
        }

        if (!mounted) return;
        
        const q = query(
            collection(db, 'userPresetTasks'),
            where('userId', '==', user.uid),
            where('profession', '==', effectiveProfile),
            orderBy('order', 'asc')
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
            if (!mounted) return;
            const newPreset = snapshot.docs.reduce((acc: Preset, doc) => {
                const task = { id: doc.id, ...doc.data() } as UserPresetTask;
                const category = task.category || 'Default';
                if (!acc[category]) {
                    acc[category] = { color: categoryConfig[category]?.color || categoryConfig['Default'].color, tasks: [] };
                }
                acc[category].tasks.push(task);
                return acc;
            }, {});

            const sortedPreset: Preset = {};
            Object.keys(newPreset).sort((a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99))
                .forEach(key => { sortedPreset[key] = newPreset[key]; });
            
            if (mounted) {
                setPresetTasks(sortedPreset);
                setLoading(false);
            }
        }, (error) => {
            if (mounted) {
                console.error("Error fetching preset tasks: ", error);
                setLoading(false);
            }
        });
    };

    loadData();

    return () => {
        mounted = false;
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [user, effectiveProfile, isOffline, profileLoading, isSyncEnabled, profileData, initializeUserTasks]);
  
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

  const categoryTimeRanges = useMemo(() => {
    const ranges: { [category: string]: { start: Date, end: Date } } = {};
    if (Object.keys(presetTasks).length === 0) return ranges;

    const today = new Date();
    
    const timeBlocks = {
        'Morning Routine': { start: 7, end: 9 },
        'Work & Focus': { start: 9, end: 17 },
        'Breaks & Meals': { start: 9, end: 14 }, // Widened to include pre-work coffee and lunch
        'Health & Wellness': {start: 17, end: 21 },
        'Evening Wind-down': { start: 17, end: 21 },
        'Evening Reset': { start: 17, end: 21 },
        'Bedtime Routine': { start: 21, end: 24 },
        'Morning Recovery': { start: 8, end: 12 },
        'Afternoon Recharge': { start: 12, end: 17 },
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
