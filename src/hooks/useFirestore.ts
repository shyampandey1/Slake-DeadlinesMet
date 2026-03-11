


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
    runTransaction
} from 'firebase/firestore';
import type { Task, UserPresetTask, Preset, ProfileType, UserEvent } from '@/types';
import { useProfile } from './useProfile';
import { getDay, set, subDays } from 'date-fns';
import { defaultRoutines, ROUTINE_TEMPLATE_VERSION, profileToRoutineMap, categoryConfig, getAvailableCategories as getCats, getAvailableIcons as getIcons } from '@/lib/routines';
import { format as formatDate, parse, compareDesc } from 'date-fns';

// Re-export for easier access in other components
export const getAvailableCategories = getCats;
export const getAvailableIcons = getIcons;


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

    const cacheKey = `${TASKS_CACHE_KEY}_${user.uid}`;
    if (isOffline || !isSyncEnabled) {
      try {
        const cachedTasks = localStorage.getItem(cacheKey);
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
      collection(db, 'users', user.uid, 'tasks'), 
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString();
        userTasks.push({ id: doc.id, ...data, createdAt } as Task);
      });
      setTasks(userTasks);
       try {
        localStorage.setItem(cacheKey, JSON.stringify(userTasks));
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
      createdAt: new Date().toISOString(),
    };

    const cacheKey = `${TASKS_CACHE_KEY}_${user.uid}`;
    if (isOffline || !isSyncEnabled) {
      const updatedTasks = [...tasks, { ...newTask, id: new Date().toISOString(), userId: user.uid }];
      setTasks(updatedTasks);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(updatedTasks));
      } catch (error) {
        console.warn("Couldn't access localStorage for tasks");
      }
      return;
    }

    await addDoc(collection(db, 'users', user.uid, 'tasks'), { ...task, createdAt: Timestamp.now()});
  };

  const clearTasks = async () => {
    if (!user) return;
    
    const cacheKey = `${TASKS_CACHE_KEY}_${user.uid}`;
    setTasks([]);
    try {
      localStorage.removeItem(cacheKey);
    } catch(e) {
      console.warn("Could not clear tasks from localStorage");
    }

    if (isOffline || !isSyncEnabled) {
      return;
    }

    const batch = writeBatch(db);
    const q = query(collection(db, 'users', user.uid, 'tasks'));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  };


  return { tasks, loading, addTask, clearTasks };
}

// Hook for managing preset tasks and routines
export function usePresetTasks() {
  const { user, isOffline, isSyncEnabled } = useAuth();
  const { profile, loading: profileLoading, daysOff } = useProfile();
  const [presetTasks, setPresetTasks] = useState<Preset>({});
  const [loading, setLoading] = useState(true);

  const dayMap: { [key: string]: number } = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
  
  const isDayOff = useCallback(() => {
    const today = getDay(new Date());
    for (const dayOff of daysOff) {
        if (dayMap[dayOff] === today) {
            return true;
        }
    }
    return false;
  }, [daysOff, dayMap]);
  
  const effectiveProfile = useMemo(() => {
    if (isDayOff()) {
        if (profile === 'Analyst') return 'Day Off - Analyst';
        if (profile === 'Healthcare Professional') return 'Day Off - Healthcare';
        return 'Day Off';
    }
    const onTheGoProfiles = ["Sales", "Medical Representative", "Delivery Agent"];
    if (onTheGoProfiles.includes(profile) && getDay(new Date()) === 3) { // Wednesday
        return 'Admin Day - On The Go';
    }
    return profile;
  }, [profile, isDayOff]);


  const isDefaultTask = (task: UserPresetTask) => {
    return !task.id;
  };

  useEffect(() => {
    if (profileLoading || !user) {
      setLoading(false);
      return;
    }
    
    const cacheKey = `preset_tasks_${user.uid}_${effectiveProfile}_v${ROUTINE_TEMPLATE_VERSION}`;
    if (isOffline || !isSyncEnabled) {
        try {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                setPresetTasks(JSON.parse(cachedData));
            } else {
                 const routineKey = profileToRoutineMap[effectiveProfile];
                 const defaultTasks = routineKey ? defaultRoutines.routines[routineKey] || [] : [];
                 const newPreset = defaultTasks.reduce((acc: Preset, task) => {
                    const category = task.category || 'Default';
                    if (!acc[category]) {
                        acc[category] = { color: categoryConfig[category]?.color || categoryConfig['Default'].color, tasks: [] };
                    }
                    acc[category].tasks.push({ ...task, id: `local_def_${Math.random().toString(36).substr(2, 9)}` } as UserPresetTask);
                    return acc;
                }, {});

                const sortedPreset: Preset = {};
                Object.keys(newPreset).sort((a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99))
                    .forEach(key => { sortedPreset[key] = newPreset[key]; });

                setPresetTasks(sortedPreset);
                localStorage.setItem(cacheKey, JSON.stringify(sortedPreset));
            }
        } catch (e) {
            console.warn("Could not handle local preset tasks", e);
        }
        setLoading(false);
        return;
    }
    
    setLoading(true);
    let unsubscribe: (() => void) | null = null;
    
    if (isSyncEnabled) {
        const q = query(
            collection(db, 'users', user.uid, 'userPresetTasks'),
            where('profession', '==', effectiveProfile),
            orderBy('order', 'asc')
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                 const routineKey = profileToRoutineMap[effectiveProfile];
                 const defaultTasks = routineKey ? defaultRoutines.routines[routineKey] || [] : [];
                 const newPreset = defaultTasks.reduce((acc: Preset, task) => {
                    const category = task.category || 'Default';
                    if (!acc[category]) {
                        acc[category] = { color: categoryConfig[category]?.color || categoryConfig['Default'].color, tasks: [] };
                    }
                    acc[category].tasks.push({ ...task, id: `local_def_${Math.random().toString(36).substr(2, 9)}` } as UserPresetTask);
                    return acc;
                }, {});

                const sortedPreset: Preset = {};
                Object.keys(newPreset).sort((a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99))
                    .forEach(key => { sortedPreset[key] = newPreset[key]; });
                
                setPresetTasks(sortedPreset);
            } else {
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
                
                setPresetTasks(sortedPreset);

                try {
                    localStorage.setItem(cacheKey, JSON.stringify(sortedPreset));
                } catch (error) {
                    console.warn("Could not cache preset tasks");
                }
            }
            setLoading(false);

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
    if (!user) return;
    
    const { category, ...rest } = taskData;
    
    // Determine the new order
    let maxOrder = -1;
    for (const cat in presetTasks) {
        if(presetTasks[cat].tasks) {
            for (const task of presetTasks[cat].tasks) {
                if (task.order > maxOrder) {
                    maxOrder = task.order;
                }
            }
        }
    }
    const newOrder = maxOrder + 1;
    
    const newTask = {
        ...rest,
        category,
        profession: currentProfile,
        order: newOrder,
        id: (isOffline || !isSyncEnabled) ? `local_${Date.now()}` : undefined
    };

    if (isOffline || !isSyncEnabled) {
        setPresetTasks(prev => {
            const newPreset = { ...prev };
            if (!newPreset[category]) {
                newPreset[category] = { color: categoryConfig[category]?.color || categoryConfig['Default'].color, tasks: [] };
            }
            newPreset[category].tasks.push(newTask as UserPresetTask);
            
            const sortedPreset: Preset = {};
            Object.keys(newPreset).sort((a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99))
                .forEach(key => { sortedPreset[key] = newPreset[key]; });
            
            try {
                localStorage.setItem(`preset_tasks_${user.uid}_${effectiveProfile}`, JSON.stringify(sortedPreset));
            } catch (e) {
                console.warn("Could not cache preset tasks");
            }
            return sortedPreset;
        });
        return;
    }

    await addDoc(collection(db, 'users', user.uid, 'userPresetTasks'), newTask);
  };

  const updatePresetTask = async (taskId: string, taskData: Partial<Omit<UserPresetTask, 'id' | 'order'>> & { category: string }) => {
    if (!user) return;

    if (isOffline || !isSyncEnabled) {
        setPresetTasks(prev => {
            const newPreset = { ...prev };
            let found = false;
            for (const cat in newPreset) {
                const taskIndex = newPreset[cat].tasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    const task = newPreset[cat].tasks[taskIndex];
                    const updatedTask = { ...task, ...taskData };
                    
                    if (taskData.category && taskData.category !== cat) {
                        newPreset[cat].tasks.splice(taskIndex, 1);
                        if (newPreset[cat].tasks.length === 0) delete newPreset[cat];
                        
                        const newCat = taskData.category;
                        if (!newPreset[newCat]) {
                            newPreset[newCat] = { color: categoryConfig[newCat]?.color || categoryConfig['Default'].color, tasks: [] };
                        }
                        newPreset[newCat].tasks.push(updatedTask as UserPresetTask);
                    } else {
                        newPreset[cat].tasks[taskIndex] = updatedTask as UserPresetTask;
                    }
                    found = true;
                    break;
                }
            }
            
            if (found) {
                const sortedPreset: Preset = {};
                Object.keys(newPreset).sort((a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99))
                    .forEach(key => { sortedPreset[key] = newPreset[key]; });
                
                try {
                    localStorage.setItem(`preset_tasks_${user.uid}_${effectiveProfile}`, JSON.stringify(sortedPreset));
                } catch (e) {
                    console.warn("Could not cache preset tasks");
                }
                return sortedPreset;
            }
            return prev;
        });
        return;
    }

    await updateDoc(doc(db, 'users', user.uid, 'userPresetTasks', taskId), taskData);
  };

  const deletePresetTask = async (taskId: string) => {
    if (!user) return;

    if (isOffline || !isSyncEnabled) {
        setPresetTasks(prev => {
            const newPreset = { ...prev };
            let found = false;
            for (const cat in newPreset) {
                const taskIndex = newPreset[cat].tasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    newPreset[cat].tasks.splice(taskIndex, 1);
                    if (newPreset[cat].tasks.length === 0) delete newPreset[cat];
                    found = true;
                    break;
                }
            }
            if (found) {
                try {
                    localStorage.setItem(`preset_tasks_${user.uid}_${effectiveProfile}`, JSON.stringify(newPreset));
                } catch (e) {
                    console.warn("Could not cache preset tasks");
                }
                return newPreset;
            }
            return prev;
        });
        return;
    }

    await deleteDoc(doc(db, 'users', user.uid, 'userPresetTasks', taskId));
  };
  
  const clearAndSetPresetTasks = async (currentProfile: ProfileType, tasks: (Omit<UserPresetTask, 'id' | 'order'> & { category: string })[]) => {
      if (!user) return;

      if (isOffline || !isSyncEnabled) {
          const newPreset = tasks.reduce((acc: Preset, task, index) => {
              const category = task.category || 'Default';
              if (!acc[category]) {
                  acc[category] = { color: categoryConfig[category]?.color || categoryConfig['Default'].color, tasks: [] };
              }
              acc[category].tasks.push({ ...task, id: `local_${Date.now()}_${index}`, order: index, profession: currentProfile } as UserPresetTask);
              return acc;
          }, {});

          const sortedPreset: Preset = {};
          Object.keys(newPreset).sort((a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99))
              .forEach(key => { sortedPreset[key] = newPreset[key]; });

          setPresetTasks(sortedPreset);
          try {
              localStorage.setItem(`preset_tasks_${user.uid}_${effectiveProfile}`, JSON.stringify(sortedPreset));
          } catch (e) {
              console.warn("Could not cache preset tasks");
          }
          return;
      }

      const tasksCollectionRef = collection(db, 'users', user.uid, 'userPresetTasks');
      
      await runTransaction(db, async (transaction) => {
          const currentTasksQuery = query(tasksCollectionRef, where('profession', '==', currentProfile));
          const currentTasksSnapshot = await getDocs(currentTasksQuery);
          currentTasksSnapshot.forEach(doc => transaction.delete(doc.ref));

          let order = 0;
          tasks.forEach(task => {
              const { category, ...rest } = task;
              const newTask = {
                  ...rest,
                  category,
                  profession: currentProfile,
                  order: order++,
              };
              const newTaskRef = doc(tasksCollectionRef);
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
        'Work & Focus': { start: 9, end: 17 }, 
        'Breaks & Meals': { start: 12, end: 14 }, 
        'Health & Wellness': {start: 17, end: 19 }, 
        'Evening Wind-down': { start: 19, end: 21 },
        // Content Creator / Creative
        'Morning Kickstart': { start: 7, end: 8.5 },
        'Pre-Production': { start: 8.5, end: 10.5 },
        'Production Block': { start: 10.5, end: 13 },
        'Post-Production': { start: 14, end: 17 },
        'Evening & Close': { start: 17, end: 22 },
        // Software Engineer / Tech
        'System Initialization': { start: 8.5, end: 10 },
        'Sync & Sprint': { start: 10, end: 13 },
        'Architecture & Logic': { start: 13, end: 16 },
        'Deployment & Decompression': { start: 16, end: 22 },
        // Entrepreneur / Business
        'Visionary Morning': { start: 6, end: 8 },
        'Strategic Execution': { start: 8, end: 13 },
        'Operations': { start: 13, end: 18 },
        'Networking & Rest': { start: 18, end: 22.5 },
        // Medical Rep
        'Field Prep': { start: 7.5, end: 9 },
        'Clinic Visits': { start: 9, end: 13 },
        'Product Demos & Reporting': { start: 14, end: 17 },
        'Inventory & Relax': { start: 18, end: 22 },
        // Student
        'Learning Ready': { start: 7.5, end: 9 },
        'Academics I': { start: 9, end: 13 },
        'Academics II': { start: 14, end: 17 },
        'Review & Rest': { start: 18, end: 23 },
        // On-The-Go
        'Morning Prep': { start: 6, end: 9 },
        'On the Road': { start: 9, end: 17 },
        'Post-Work Admin': { start: 17, end: 18 },
        'Evening & Bedtime': { start: 18, end: 24 },
        // Healthcare
        'Pre-Shift Routine': { start: 5, end: 7 },
        'During Shift': { start: 7, end: 19 },
        'Post-Shift Decompression': { start: 19, end: 21 },
        // Day Off
        'Morning Recovery': { start: 7, end: 12 },
        'Afternoon Life Admin & Recharge': { start: 12, end: 18 },
        'Evening & Bedtime Reset': { start: 18, end: 24 },
    };
    
    Object.keys(presetTasks).forEach(category => {
        const categoryLookup = category as keyof typeof timeBlocks;
        if (timeBlocks[categoryLookup]) {
            const block = timeBlocks[categoryLookup];
            const startHour = Math.floor(block.start);
            const startMin = Math.round((block.start % 1) * 60);
            const endHour = Math.floor(block.end);
            const endMin = Math.round((block.end % 1) * 60);

            ranges[category] = {
                start: set(today, { hours: startHour, minutes: startMin, seconds: 0, milliseconds: 0 }),
                end: set(today, { hours: endHour, minutes: endMin, seconds: 0, milliseconds: 0 }),
            };
        }
    });

    return ranges;
  }, [presetTasks]);


  const activeCategory = useMemo(() => {
      const now = new Date();
      
      const matchingCategories = Object.entries(categoryTimeRanges)
          .filter(([_, range]) => now >= range.start && now < range.end)
          .map(([category]) => category);
      
      if (matchingCategories.length === 0) return null;
      if (matchingCategories.length === 1) return matchingCategories[0];
      
      const availableMatchingCategories = matchingCategories.filter(category => presetTasks[category]);
      
      if (availableMatchingCategories.length > 0) {
          availableMatchingCategories.sort((a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99));
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
    clearAndSetPresetTasks,
    findAndSyncPresetTask,
    isDefaultTask,
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

    const cacheKey = `${EVENTS_CACHE_KEY}_${user.uid}`;
    if (isOffline || !isSyncEnabled) {
      try {
        const cachedEvents = localStorage.getItem(cacheKey);
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
      collection(db, 'users', user.uid, 'userEvents'),
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
        localStorage.setItem(cacheKey, JSON.stringify(userEvents));
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
    
    const newEventData = { ...eventData, userId: user.uid };

    if (isOffline || !isSyncEnabled) {
      const newEvent = { ...newEventData, id: new Date().toISOString() };
      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
       try {
        localStorage.setItem(`${EVENTS_CACHE_KEY}_${user.uid}`, JSON.stringify(updatedEvents));
      } catch (error) {
        console.warn("Couldn't access localStorage for events");
      }
      return;
    }

    await addDoc(collection(db, 'users', user.uid, 'userEvents'), newEventData);
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) return;
    
    if (isOffline || !isSyncEnabled) {
        const updatedEvents = events.filter(e => e.id !== eventId);
        setEvents(updatedEvents);
         try {
            localStorage.setItem(`${EVENTS_CACHE_KEY}_${user.uid}`, JSON.stringify(updatedEvents));
        } catch (error) {
            console.warn("Couldn't access localStorage for events");
        }
        return;
    }
    
    await deleteDoc(doc(db, 'users', user.uid, 'userEvents', eventId));
  };

  return { events, loading, addEvent, deleteEvent };
}
