"use client";

import { encryptText, decryptText } from '@/lib/crypto';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { defaultRoutines, ROUTINE_TEMPLATE_VERSION, profileToRoutineMap, categoryConfig, wrapRoutineWithMOVERS, commonEveningWindDown, commonBedtimeRoutine, computeCategoryTimeRanges, computeActiveCategory, getAvailableCategories as getCats, getAvailableIcons as getIcons } from '@/lib/routines';
import { getLocalDateString } from '@/lib/dailyCoins';
import { format as formatDate, parse, compareDesc } from 'date-fns';

// Re-export for easier access in other components
export const getAvailableCategories = getCats;
export const getAvailableIcons = getIcons;


export function useTasks() {
  const { user, isOffline, isSyncEnabled } = useAuth();
  const { profileData, updateUserProfileData, incrementUserCoins } = useProfile();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const TASKS_CACHE_KEY = 'user_tasks';

  useEffect(() => {
    if (!user || sessionStorage.getItem('SIGNOUT_IN_PROGRESS')) {
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

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      try {
          const userTasks: Task[] = [];
          for (const docSnapshot of querySnapshot.docs) {
            const data = docSnapshot.data();
            let createdAt = new Date().toISOString();
            if (data.createdAt) {
                if (typeof data.createdAt.toDate === 'function') {
                    createdAt = data.createdAt.toDate().toISOString();
                } else if (typeof data.createdAt === 'string') {
                    createdAt = data.createdAt;
                } else if (data.createdAt instanceof Date) {
                    createdAt = data.createdAt.toISOString();
                }
            }
            const decryptedName = await decryptText(data.name, user.uid);
            userTasks.push({ id: docSnapshot.id, ...data, name: decryptedName, createdAt } as Task);
          }
          setTasks(userTasks);
    
          // --- LOGBOOK STREAK SYNC ---
          const activeDates = new Set<string>();
          let totalTasks = 0;
          let totalWaterGlasses = 0;
          userTasks.filter(t => t.completed).forEach(t => {
              if (t.createdAt) {
                  try {
                    activeDates.add(new Date(t.createdAt).toISOString().split('T')[0]);
                  } catch(e) {}
              }
              totalTasks++;
              if (t.name?.toLowerCase().includes('water')) {
                  totalWaterGlasses++;
              }
          });
          const dates = Array.from(activeDates).sort((a,b) => b.localeCompare(a));
          let currentStreak = 0;
          let highestStreak = 0;
          
          const today = new Date().toISOString().split('T')[0];
          const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          
          if (dates.length > 0) {
              highestStreak = 1;
              let tempStreak = 1;
              for (let i = 0; i < dates.length - 1; i++) {
                  const d1 = new Date(dates[i]).getTime();
                  const d2 = new Date(dates[i+1]).getTime();
                  if (!isNaN(d1) && !isNaN(d2)) {
                      const diffTime = d1 - d2;
                      if (Math.abs(diffTime - 86400000) < 3600000) { // accounting for DST
                          tempStreak++;
                          if (tempStreak > highestStreak) highestStreak = tempStreak;
                      } else {
                          tempStreak = 1;
                      }
                  }
              }
          }
          
          if (dates.includes(today) || dates.includes(yesterdayStr)) {
              if (dates.length > 0) {
                  let checkDate = new Date(dates[0]);
                  while (!isNaN(checkDate.getTime())) {
                     const c = checkDate.toISOString().split('T')[0];
                     if (activeDates.has(c)) {
                         currentStreak++;
                         checkDate = new Date(checkDate.getTime() - 86400000);
                     } else {
                         break;
                     }
                  }
              }
          }
    
          let appAge = 0;
          if (userTasks.length > 0) {
              const lastTask = userTasks[userTasks.length - 1];
              if (lastTask && lastTask.createdAt) {
                  const oldestTaskDate = new Date(lastTask.createdAt).getTime();
                  if (!isNaN(oldestTaskDate)) {
                      appAge = Math.floor((new Date().getTime() - oldestTaskDate) / 86400000);
                  }
              }
          }
    
          // Update native profile silently if out of sync
          const profile = profileDataRef.current;
          const pStreak = profile?.streak;
          if (profile && (pStreak?.currentStreak !== currentStreak || pStreak?.highestStreak !== highestStreak || (profile as any)?.totalTasks !== totalTasks || (profile as any)?.totalWaterGlasses !== totalWaterGlasses || (profile as any)?.appAge !== appAge)) {
             updateUserProfileData({ 
                streak: { 
                   ...(pStreak || {}), 
                   currentStreak, 
                   highestStreak, 
                   lastActiveDate: today, 
                   dailyHistory: pStreak?.dailyHistory || [] 
                },
                totalTasks,
                totalWaterGlasses,
                appAge
             } as any);
          }
          // --- END STREAK SYNC ---

          // --- LOGBOOK DAILY COINS SYNC ---
          try {
              const localTodayStr = getLocalDateString();
              
              const dbDailyCoins = userTasks
                .filter(t => t.completed && t.earnedCoins && t.createdAt)
                .reduce((sum, t) => {
                  try {
                    const taskLocalDate = new Date(t.createdAt);
                    if (getLocalDateString(taskLocalDate) === localTodayStr) {
                      return sum + (t.earnedCoins || 0);
                    }
                  } catch (e) {}
                  return sum;
                }, 0);

              const storedCoinsStr = localStorage.getItem('slake_daily_coins_amount');
              const storedDate = localStorage.getItem('slake_daily_coins_date');
              const storedCoins = storedCoinsStr ? parseInt(storedCoinsStr, 10) : 0;
              
              if (storedDate !== localTodayStr || dbDailyCoins > storedCoins) {
                  localStorage.setItem('slake_daily_coins_amount', String(dbDailyCoins));
                  localStorage.setItem('slake_daily_coins_date', localTodayStr);
                  window.dispatchEvent(new Event('slake-daily-coins-updated'));
              }
          } catch (e) {
              console.warn("Failed to sync daily coins in snapshot", e);
          }
          // --- END DAILY COINS SYNC ---
    
           try {
            localStorage.setItem(cacheKey, JSON.stringify(userTasks));
          } catch (error) {
            console.warn("Couldn't access localStorage for tasks");
          }
      } catch (err) {
          console.error("Critical error in onSnapshot processing:", err);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tasks: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isOffline, isSyncEnabled, updateUserProfileData]); 

  // Keep profileDataRef updated for the onSnapshot closure
  const profileDataRef = useRef(profileData);
  useEffect(() => {
    profileDataRef.current = profileData;
  }, [profileData]);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;
    const newTask = {
      ...task,
      createdAt: new Date().toISOString(),
    };

    if (task.completed && task.earnedCoins && task.earnedCoins > 0) {
      const earned = Number(task.earnedCoins) || 0;
      if (earned > 0) {
        await incrementUserCoins(earned);
      }
    }

    const cacheKey = `${TASKS_CACHE_KEY}_${user.uid}`;
    if (isOffline || !isSyncEnabled) {
      setTasks(prev => {
        const updatedTasks = [...prev, { ...newTask, id: `local_${new Date().getTime()}_${Math.random().toString(36).substr(2, 5)}`, userId: user.uid }];
        try {
          localStorage.setItem(cacheKey, JSON.stringify(updatedTasks));
        } catch (error) {
          console.warn("Couldn't access localStorage for tasks");
        }
        return updatedTasks;
      });
      return;
    }

    const encryptedName = await encryptText(task.name, user.uid);
    await addDoc(collection(db, 'users', user.uid, 'tasks'), { ...task, name: encryptedName, createdAt: Timestamp.now()});
  }, [user, isOffline, isSyncEnabled, updateUserProfileData, incrementUserCoins]);

  const clearTasks = async () => {
    if (!user || sessionStorage.getItem('SIGNOUT_IN_PROGRESS')) return; // Added signout check
    
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


  useEffect(() => {
    const syncOfflineTasks = async () => {
      if (!user || sessionStorage.getItem('SIGNOUT_IN_PROGRESS') || !isSyncEnabled || isOffline) return;
      
      const cacheKey = `${TASKS_CACHE_KEY}_${user.uid}`;
      try {
        const cachedTasksStr = localStorage.getItem(cacheKey);
        if (cachedTasksStr) {
          const cachedTasks = JSON.parse(cachedTasksStr) as Task[];
          const tasksToSync = cachedTasks.filter(t => t.id.startsWith('local_'));
          
          if (tasksToSync.length > 0) {
            const batch = writeBatch(db);
            const ref = collection(db, 'users', user.uid, 'tasks');
            
            for (const task of tasksToSync) {
              const docRef = doc(ref);
              const { id, createdAt, ...data } = task as any;
              const encryptedName = await encryptText(data.name, user.uid);
              batch.set(docRef, { ...data, name: encryptedName, createdAt: Timestamp.now() });
            }
            
            await batch.commit();
            
            const cleanTasks = cachedTasks.filter(t => !t.id.startsWith('local_'));
            localStorage.setItem(cacheKey, JSON.stringify(cleanTasks));
          }
        }
      } catch (e) {
        console.warn("Failed to sync offline tasks", e);
      }
    };

    window.addEventListener('app-online-sync', syncOfflineTasks);
    if (!isOffline) {
       syncOfflineTasks();
    }
    
    return () => window.removeEventListener('app-online-sync', syncOfflineTasks);
  }, [user, isOffline, isSyncEnabled]);

  const toggleTaskCompletion = useCallback(async (taskId: string) => {
    if (!user) return;
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const newCompleted = !targetTask.completed;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : undefined } : t));

    try {
      const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
      await updateDoc(taskRef, {
        completed: newCompleted,
        completedAt: newCompleted ? Timestamp.now() : null,
      });
    } catch (err) {
      console.warn('Failed to update task completion in Firestore:', err);
    }
  }, [user, tasks]);

  return { tasks, loading, addTask, clearTasks, toggleTaskCompletion };
}

// Hook for managing preset tasks and routines
export function usePresetTasks() {
  const { user, isOffline, isSyncEnabled } = useAuth();
  const { profile, loading: profileLoading, daysOff } = useProfile();
  const [presetTasks, setPresetTasks] = useState<Preset>({});
  const [loading, setLoading] = useState(true);

  const getPresetCacheKey = useCallback((profileName: string) => {
    return `preset_tasks_${user?.uid}_${profileName}_v${ROUTINE_TEMPLATE_VERSION}`;
  }, [user]);

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
    return !task.id || task.id.startsWith('local_def_');
  };

  useEffect(() => {
    if (profileLoading || !user || sessionStorage.getItem('SIGNOUT_IN_PROGRESS')) {
      setLoading(false);
      return;
    }
    
    const cacheKey = getPresetCacheKey(effectiveProfile);
    if (isOffline || !isSyncEnabled) {
        try {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                const parsedData = JSON.parse(cachedData) as Preset;
                // Deduplicate tasks by ID just in case the cache is corrupted
                for (const cat in parsedData) {
                    const uniqueTasks: UserPresetTask[] = [];
                    const seenIds = new Set<string>();
                    for (const task of parsedData[cat].tasks) {
                        if (task.name.startsWith("Drink a glass of water") && (task.duration !== 1 || task.name !== "Drink a glass of water")) {
                            task.duration = 1;
                            task.name = "Drink a glass of water";
                        }
                        if (task.name === "Eye strain exercise" && task.duration !== 2) {
                            task.duration = 2;
                        }
                        const isBreathingName = (name: string) => {
                            const n = name.toLowerCase();
                            return n.includes("breath") || n.includes("oxygen");
                        };
                        if (isBreathingName(task.name) && task.duration !== 3) {
                            task.duration = 3;
                        }

                        if (task.id && !seenIds.has(task.id)) {
                            uniqueTasks.push(task);
                            seenIds.add(task.id);
                        } else if (!task.id) {
                            // Fallback for tasks with no ID
                            const newId = `local_gen_${Math.random().toString(36).substr(2, 5)}`;
                            uniqueTasks.push({ ...task, id: newId });
                        }
                    }
                    parsedData[cat].tasks = uniqueTasks;
                }
                if (!parsedData['Evening Wind-down'] || parsedData['Evening Wind-down'].tasks.length === 0) {
                    parsedData['Evening Wind-down'] = {
                        color: categoryConfig['Evening Wind-down']?.color || 'bg-indigo-800 text-white',
                        tasks: [
                            ...commonEveningWindDown.map((t, idx) => ({
                                ...t,
                                id: `local_def_ewd_${idx}`,
                                order: 900 + idx,
                                profession: effectiveProfile,
                            })),
                            {
                                name: 'Drink a glass of water',
                                duration: 1,
                                icon: 'Droplets',
                                category: 'Evening Wind-down',
                                id: 'local_def_ewd_water',
                                order: 905,
                                profession: effectiveProfile,
                            },
                        ] as UserPresetTask[],
                    };
                }
                if (!parsedData['Bedtime Routine'] || parsedData['Bedtime Routine'].tasks.length === 0) {
                    parsedData['Bedtime Routine'] = {
                        color: categoryConfig['Bedtime Routine']?.color || 'bg-slate-800 text-white',
                        tasks: commonBedtimeRoutine.map((t, idx) => ({
                            ...t,
                            id: `local_def_btr_${idx}`,
                            order: 950 + idx,
                            profession: effectiveProfile,
                        })) as UserPresetTask[],
                    };
                }
                const sortedCached: Preset = {};
                Object.keys(parsedData)
                    .sort((a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99))
                    .forEach(key => { sortedCached[key] = parsedData[key]; });
                setPresetTasks(sortedCached);
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

        unsubscribe = onSnapshot(q, async (snapshot) => {
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
                const decryptedDocs = await Promise.all(snapshot.docs.map(async docSnapshot => {
                    const task = { id: docSnapshot.id, ...docSnapshot.data() } as UserPresetTask;
                    task.name = await decryptText(task.name, user.uid);
                    return task;
                }));

                const newPreset = decryptedDocs.reduce((acc: Preset, task) => {
                    const category = task.category || 'Default';
                    if (!acc[category]) {
                        acc[category] = { color: categoryConfig[category]?.color || categoryConfig['Default'].color, tasks: [] };
                    }

                    // Automatic migration for legacy water/eye tasks
                    if (task.name.startsWith("Drink a glass of water") && (task.duration !== 1 || task.name !== "Drink a glass of water")) {
                        task.duration = 1;
                        task.name = "Drink a glass of water";
                        updateDoc(doc(db, 'users', user.uid, 'userPresetTasks', task.id!), { duration: 1, name: "Drink a glass of water" }).catch(console.error);
                    }
                    if (task.name === "Eye strain exercise" && task.duration !== 2) {
                        task.duration = 2;
                        updateDoc(doc(db, 'users', user.uid, 'userPresetTasks', task.id!), { duration: 2 }).catch(console.error);
                    }
                    const isBreathingName = (name: string) => {
                        const n = name.toLowerCase();
                        return n.includes("breath") || n.includes("oxygen");
                    };
                    if (isBreathingName(task.name) && task.duration !== 3) {
                        task.duration = 3;
                        updateDoc(doc(db, 'users', user.uid, 'userPresetTasks', task.id!), { duration: 3 }).catch(console.error);
                    }

                    acc[category].tasks.push(task);
                    return acc;
                }, {});

                // Ensure 7-9 PM Evening Wind-down and 10 PM-12 AM Bedtime Routine blocks are present for all users
                if (!newPreset['Evening Wind-down'] || newPreset['Evening Wind-down'].tasks.length === 0) {
                    newPreset['Evening Wind-down'] = {
                        color: categoryConfig['Evening Wind-down']?.color || 'bg-indigo-800 text-white',
                        tasks: [
                            ...commonEveningWindDown.map((t, idx) => ({
                                ...t,
                                id: `local_def_ewd_${idx}`,
                                order: 900 + idx,
                                profession: effectiveProfile,
                            })),
                            {
                                name: 'Drink a glass of water',
                                duration: 1,
                                icon: 'Droplets',
                                category: 'Evening Wind-down',
                                id: 'local_def_ewd_water',
                                order: 905,
                                profession: effectiveProfile,
                            },
                        ] as UserPresetTask[],
                    };
                }
                if (!newPreset['Bedtime Routine'] || newPreset['Bedtime Routine'].tasks.length === 0) {
                    newPreset['Bedtime Routine'] = {
                        color: categoryConfig['Bedtime Routine']?.color || 'bg-slate-800 text-white',
                        tasks: commonBedtimeRoutine.map((t, idx) => ({
                            ...t,
                            id: `local_def_btr_${idx}`,
                            order: 950 + idx,
                            profession: effectiveProfile,
                        })) as UserPresetTask[],
                    };
                }

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
    
    const tempId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newTask: any = {
        ...rest,
        category,
        profession: effectiveProfile,
        order: newOrder,
        id: tempId
    };

    // Optimistically update the UI so it appears immediately!
    setPresetTasks(prev => {
        const newPreset = { ...prev };
        if (!newPreset[category]) {
            newPreset[category] = { color: categoryConfig[category]?.color || categoryConfig['Default'].color, tasks: [] };
        } else {
            // Prevent shallow mutation array issue (React StrictMode calls this twice)
            newPreset[category] = { ...newPreset[category], tasks: [...newPreset[category].tasks] };
        }
        newPreset[category].tasks.push(newTask as UserPresetTask);
        
        const sortedPreset: Preset = {};
        Object.keys(newPreset).sort((a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99))
            .forEach(key => { sortedPreset[key] = newPreset[key]; });
        
        try {
            localStorage.setItem(getPresetCacheKey(effectiveProfile), JSON.stringify(sortedPreset));
        } catch (e) {
            console.warn("Could not cache preset tasks");
        }
        return sortedPreset;
    });

    if (isOffline || !isSyncEnabled) {
        return;
    }

    let isUsingDefaults = false;
    const flatExistingTasks: (Omit<UserPresetTask, 'id' | 'order'> & { category: string })[] = [];
    
    for (const cat in presetTasks) {
        if (presetTasks[cat].tasks) {
            for (const task of presetTasks[cat].tasks) {
                if (task.id?.startsWith('local_def_')) {
                    isUsingDefaults = true;
                }
                const { id, order, profession: prof, ...restTask } = task as any;
                flatExistingTasks.push({ ...restTask, category: cat });
            }
        }
    }

    if (isUsingDefaults) {
        const { id, order, profession: prof, ...newRestTask } = newTask;
        flatExistingTasks.push({ ...newRestTask, category } as any);
        await clearAndSetPresetTasks(effectiveProfile, flatExistingTasks);
        return;
    }

    // Strip temp ID and encrypt name before sending to Firebase
    const { id, ...firebaseTask } = newTask;
    const encryptedName = await encryptText(firebaseTask.name, user.uid);
    await addDoc(collection(db, 'users', user.uid, 'userPresetTasks'), { ...firebaseTask, name: encryptedName });
  };

  const updatePresetTask = async (taskId: string, taskData: Partial<Omit<UserPresetTask, 'id' | 'order'>> & { category: string }) => {
    if (!user) return;

    // Optimistic UI update
    setPresetTasks(prev => {
        const newPreset = { ...prev };
        let found = false;
        for (const cat in newPreset) {
            const taskIndex = newPreset[cat].tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                // Defensive copy to prevent mutating prev state directly
                newPreset[cat] = { ...newPreset[cat], tasks: [...newPreset[cat].tasks] };
                const task = newPreset[cat].tasks[taskIndex];
                const updatedTask = { ...task, ...taskData };
                
                if (taskData.category && taskData.category !== cat) {
                    newPreset[cat].tasks.splice(taskIndex, 1);
                    if (newPreset[cat].tasks.length === 0) delete newPreset[cat];
                    
                    const newCat = taskData.category;
                    if (!newPreset[newCat]) {
                        newPreset[newCat] = { color: categoryConfig[newCat]?.color || categoryConfig['Default'].color, tasks: [] };
                    } else {
                        newPreset[newCat] = { ...newPreset[newCat], tasks: [...newPreset[newCat].tasks] };
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
                localStorage.setItem(getPresetCacheKey(effectiveProfile), JSON.stringify(sortedPreset));
            } catch (e) {
                console.warn("Could not cache preset tasks");
            }
            return sortedPreset;
        }
        return prev;
    });

    if (isOffline || !isSyncEnabled) {
        return;
    }

    const payload = { ...taskData };
    if (payload.name) {
      payload.name = await encryptText(payload.name, user.uid);
    }
    await updateDoc(doc(db, 'users', user.uid, 'userPresetTasks', taskId), payload);
  };

  const deletePresetTask = async (taskId: string) => {
    if (!user) return;

    // Optimistic UI update
    setPresetTasks(prev => {
        const newPreset = { ...prev };
        let found = false;
        for (const cat in newPreset) {
            const taskIndex = newPreset[cat].tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                newPreset[cat] = { ...newPreset[cat], tasks: [...newPreset[cat].tasks] };
                newPreset[cat].tasks.splice(taskIndex, 1);
                if (newPreset[cat].tasks.length === 0) delete newPreset[cat];
                found = true;
                break;
            }
        }
        if (found) {
            try {
                localStorage.setItem(getPresetCacheKey(effectiveProfile), JSON.stringify(newPreset));
            } catch (e) {
                console.warn("Could not cache preset tasks");
            }
            return newPreset;
        }
        return prev;
    });

    if (isOffline || !isSyncEnabled) {
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
              acc[category].tasks.push({ ...task, id: `local_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 4)}`, order: index, profession: currentProfile } as UserPresetTask);
              return acc;
          }, {});

          const sortedPreset: Preset = {};
          Object.keys(newPreset).sort((a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99))
              .forEach(key => { sortedPreset[key] = newPreset[key]; });

          setPresetTasks(sortedPreset);
          try {
              localStorage.setItem(getPresetCacheKey(effectiveProfile), JSON.stringify(sortedPreset));
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

  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTick(t => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const categoryTimeRanges = useMemo(() => {
    void clockTick;
    return computeCategoryTimeRanges(presetTasks, new Date());
  }, [presetTasks, clockTick]);

  const activeCategory = useMemo(() => {
    void clockTick;
    return computeActiveCategory(presetTasks, categoryTimeRanges, undefined, new Date());
  }, [categoryTimeRanges, presetTasks, clockTick]);

  useEffect(() => {
    const syncOfflinePresets = async () => {
      if (!user || sessionStorage.getItem('SIGNOUT_IN_PROGRESS') || !isSyncEnabled || isOffline) return;
      try {
        const cacheKey = getPresetCacheKey(effectiveProfile);
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData) as Preset;
          const tasksToSync: any[] = [];
          
          Object.keys(parsedData).forEach(cat => {
            parsedData[cat].tasks.forEach(task => {
              if (task.id && task.id.startsWith('local_')) {
                tasksToSync.push({ ...task, category: cat, profession: effectiveProfile });
              }
            });
          });

          if (tasksToSync.length > 0) {
            const batch = writeBatch(db);
            const ref = collection(db, 'users', user.uid, 'userPresetTasks');
            tasksToSync.forEach(task => {
              const docRef = doc(ref);
              const { id, ...data } = task;
              batch.set(docRef, data);
            });
            await batch.commit();

            // Clean local IDs from storage
            const newPreset = { ...parsedData };
            Object.keys(newPreset).forEach(cat => {
              newPreset[cat].tasks = newPreset[cat].tasks.filter(t => !t.id || !t.id.startsWith('local_'));
              if(newPreset[cat].tasks.length === 0) delete newPreset[cat];
            });
            localStorage.setItem(cacheKey, JSON.stringify(newPreset));
          }
        }
      } catch (e) {
        console.warn("Failed to sync offline presets", e);
      }
    };
    window.addEventListener('app-online-sync', syncOfflinePresets);
    if (!isOffline) syncOfflinePresets();
    return () => window.removeEventListener('app-online-sync', syncOfflinePresets);
  }, [user, isOffline, isSyncEnabled, effectiveProfile, getPresetCacheKey]);

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
    if (!user || sessionStorage.getItem('SIGNOUT_IN_PROGRESS')) {
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

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const userEvents = await Promise.all(snapshot.docs.map(async doc => {
        const data = doc.data();
        const eventDate = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
        const decryptedName = await decryptText(data.name, user.uid);
        return { id: doc.id, ...data, name: decryptedName, date: eventDate } as UserEvent;
      }));
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
      const newEvent = { ...newEventData, id: `local_ev_${new Date().getTime()}_${Math.random().toString(36).substr(2, 5)}` };
      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
       try {
        localStorage.setItem(`${EVENTS_CACHE_KEY}_${user.uid}`, JSON.stringify(updatedEvents));
      } catch (error) {
        console.warn("Couldn't access localStorage for events");
      }
      return;
    }

    const encryptedName = await encryptText(eventData.name, user.uid);
    const finalEventData = { ...newEventData, name: encryptedName };
    await addDoc(collection(db, 'users', user.uid, 'userEvents'), finalEventData);
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

  useEffect(() => {
    const syncOfflineEvents = async () => {
      if (!user || sessionStorage.getItem('SIGNOUT_IN_PROGRESS') || !isSyncEnabled || isOffline) return;
      try {
        const cacheKey = `${EVENTS_CACHE_KEY}_${user.uid}`;
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const cachedEvents = JSON.parse(cachedStr) as UserEvent[];
          const eventsToSync = cachedEvents.filter(e => e.id.startsWith('local_'));
          
          if (eventsToSync.length > 0) {
            const batch = writeBatch(db);
            const ref = collection(db, 'users', user.uid, 'userEvents');
            for (const ev of eventsToSync) {
              const docRef = doc(ref);
              const { id, ...data } = ev as any;
              const encryptedName = await encryptText(data.name, user.uid);
              batch.set(docRef, { ...data, name: encryptedName });
            }
            await batch.commit();
            
            const cleanEvents = cachedEvents.filter(e => !e.id.startsWith('local_'));
            localStorage.setItem(cacheKey, JSON.stringify(cleanEvents));
          }
        }
      } catch (e) {
        console.warn("Failed to sync offline events", e);
      }
    };
    window.addEventListener('app-online-sync', syncOfflineEvents);
    if (!isOffline) syncOfflineEvents();
    return () => window.removeEventListener('app-online-sync', syncOfflineEvents);
  }, [user, isOffline, isSyncEnabled]);

  return { events, loading, addEvent, deleteEvent };
}
