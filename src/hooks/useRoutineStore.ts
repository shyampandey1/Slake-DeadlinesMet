"use client";

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useProfile } from './useProfile';
import { useAuth } from './useAuth';
import { usePresetTasks } from './useFirestore';
import {
  wrapRoutineWithMOVERS,
  categoryConfig,
  computeCategoryTimeRanges,
  computeActiveCategory,
} from '@/lib/routines';
import type { Preset, UserPresetTask } from '@/types';
import type {
  CustomRoutineProfile,
  DMRoutineFileFormat,
  DMRoutineTaskBlock,
} from '@/types/routineTuner';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';

const LOCAL_STORAGE_CUSTOM_ROUTINES_KEY = 'slake_custom_routines_v1';
const LOCAL_STORAGE_ACTIVE_PROFILE_KEY = 'slake_active_routine_profile_id';

/**
 * Converts a CustomRoutineProfile's task blocks into DeadlinesMet's categorized Preset structure.
 */
function convertCustomProfileToPreset(profile: CustomRoutineProfile): Preset {
  const newPreset: Preset = {};

  (profile.tasks || []).forEach((task, index) => {
    const category = task.category || 'Tuned Routine';
    if (!newPreset[category]) {
      newPreset[category] = {
        color:
          categoryConfig[category]?.color ||
          categoryConfig['Default']?.color ||
          'bg-slate-800 text-white',
        tasks: [],
      };
    }

    const presetTask: UserPresetTask = {
      id: task.id || `custom_${index}`,
      name: task.title,
      duration: task.durationMinutes,
      icon: task.icon || 'Sparkles',
      category: category,
      order: index,
      profession: profile.name,
      isVerifiedForCoins: true,
      startTime: task.startTime,
    };

    newPreset[category].tasks.push(presetTask);
  });

  // Helper to extract first task's start time in minutes from midnight
  const getCatStartMins = (catName: string): number => {
    const cat = newPreset[catName];
    if (cat && cat.tasks && cat.tasks.length > 0) {
      const firstTask = cat.tasks.find((t) => t.startTime);
      if (firstTask && firstTask.startTime) {
        const [h, m] = firstTask.startTime.split(':').map((v) => parseInt(v, 10));
        return (h || 0) * 60 + (m || 0);
      }
    }
    return (categoryConfig[catName]?.order ?? 99) * 10;
  };

  // Sort categories strictly by chronological start time so blocks never jump around
  const sortedPreset: Preset = {};
  Object.keys(newPreset)
    .sort((a, b) => getCatStartMins(a) - getCatStartMins(b))
    .forEach((key) => {
      sortedPreset[key] = newPreset[key];
    });

  return sortedPreset;
}

export function useRoutineStore() {
  const { user } = useAuth();
  const { profileData, reformerPreference } = useProfile();
  const presetTasksData = usePresetTasks();
  const { presetTasks, loading: baseTasksLoading } = presetTasksData;

  const [customProfiles, setCustomProfiles] = useState<CustomRoutineProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [profilesLoading, setProfilesLoading] = useState<boolean>(true);

  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // 1. Load custom profiles from localStorage initially
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_CUSTOM_ROUTINES_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setCustomProfiles(parsed);
        }
      }
      const activeCached = localStorage.getItem(LOCAL_STORAGE_ACTIVE_PROFILE_KEY);
      if (activeCached && activeCached !== 'default') {
        setActiveProfileId(activeCached);
      }
    } catch (e) {
      console.warn('[useRoutineStore] Failed reading localStorage profiles:', e);
    }
  }, []);

  // 2. Synchronize with Firestore (users/{userId}/customRoutines)
  useEffect(() => {
    if (!user || !db) {
      setProfilesLoading(false);
      return;
    }

    const routinesColRef = collection(db, 'users', user.uid, 'customRoutines');
    const unsub = onSnapshot(
      routinesColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: CustomRoutineProfile[] = [];
          snapshot.forEach((docSnap) => {
            loaded.push(docSnap.data() as CustomRoutineProfile);
          });
          // Sort by updatedAt descending
          loaded.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setCustomProfiles(loaded);

          // Update localStorage backup
          try {
            localStorage.setItem(LOCAL_STORAGE_CUSTOM_ROUTINES_KEY, JSON.stringify(loaded));
          } catch (e) {}
        }
        setProfilesLoading(false);
      },
      (err) => {
        console.warn('[useRoutineStore] Firestore custom routines sync warning:', err);
        setProfilesLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  // Save / Overwrite a custom profile
  const saveCustomProfile = useCallback(
    async (profile: CustomRoutineProfile) => {
      setCustomProfiles((prev) => {
        const exists = prev.some((p) => p.id === profile.id);
        const updated = exists
          ? prev.map((p) => (p.id === profile.id ? profile : p))
          : [profile, ...prev];

        try {
          localStorage.setItem(LOCAL_STORAGE_CUSTOM_ROUTINES_KEY, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      // Activate immediately
      setActiveProfileId(profile.id);
      try {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE_KEY, profile.id);
      } catch (e) {}

      // Sync to Firestore
      if (user && db) {
        try {
          const docRef = doc(db, 'users', user.uid, 'customRoutines', profile.id);
          await setDoc(docRef, profile, { merge: true });

          // Also update user's lifestyle vector in Firestore if present
          if (profile.routineVector && profile.routineVector.length > 0) {
            await updateDoc(doc(db, 'users', user.uid), {
              lifestyleVector: profile.routineVector,
            });
          }
        } catch (err) {
          console.warn('[useRoutineStore] Failed to save custom routine to Firestore:', err);
        }
      }
    },
    [user]
  );

  // Set active routine profile ('default' or custom profile ID)
  const setActiveProfile = useCallback((profileId: string | null) => {
    setActiveProfileId(profileId);
    try {
      if (!profileId || profileId === 'default') {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE_KEY, 'default');
      } else {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE_KEY, profileId);
      }
    } catch (e) {}
  }, []);

  // Rename an existing profile
  const renameCustomProfile = useCallback(
    async (profileId: string, newName: string) => {
      const cleanName = newName.trim();
      if (!cleanName) return;

      setCustomProfiles((prev) => {
        const updated = prev.map((p) =>
          p.id === profileId
            ? { ...p, name: cleanName, updatedAt: new Date().toISOString() }
            : p
        );
        try {
          localStorage.setItem(LOCAL_STORAGE_CUSTOM_ROUTINES_KEY, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      if (user && db) {
        try {
          const docRef = doc(db, 'users', user.uid, 'customRoutines', profileId);
          await updateDoc(docRef, { name: cleanName, updatedAt: new Date().toISOString() });
        } catch (e) {
          console.warn('[useRoutineStore] Failed to rename custom routine in Firestore:', e);
        }
      }
    },
    [user]
  );

  // Duplicate an existing profile
  const duplicateCustomProfile = useCallback(
    async (profileId: string) => {
      const target = customProfiles.find((p) => p.id === profileId);
      if (!target) return;

      const newId = `profile_dup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const duplicated: CustomRoutineProfile = {
        ...target,
        id: newId,
        name: `${target.name} (Copy)`,
        updatedAt: new Date().toISOString(),
        tasks: target.tasks.map((t) => ({
          ...t,
          id: `${t.id}_dup_${Math.random().toString(36).substring(2, 5)}`,
        })),
      };

      await saveCustomProfile(duplicated);
    },
    [customProfiles, saveCustomProfile]
  );

  // Delete a custom profile
  const deleteCustomProfile = useCallback(
    async (profileId: string) => {
      setCustomProfiles((prev) => {
        const updated = prev.filter((p) => p.id !== profileId);
        try {
          localStorage.setItem(LOCAL_STORAGE_CUSTOM_ROUTINES_KEY, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      if (activeProfileId === profileId) {
        setActiveProfile(null);
      }

      if (user && db) {
        try {
          const docRef = doc(db, 'users', user.uid, 'customRoutines', profileId);
          await deleteDoc(docRef);
        } catch (e) {
          console.warn('[useRoutineStore] Failed to delete custom routine from Firestore:', e);
        }
      }
    },
    [activeProfileId, setActiveProfile, user]
  );

  // Import a portable DMRoutineFileFormat container into saved custom routines
  const importDMProfile = useCallback(
    async (dmContainer: DMRoutineFileFormat): Promise<CustomRoutineProfile> => {
      const newId = `dm_imp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newProfile: CustomRoutineProfile = {
        id: newId,
        name: dmContainer.profileName,
        updatedAt: new Date().toISOString(),
        tuningAnswers: dmContainer.tuningParameters,
        tasks: dmContainer.tasks,
        routineVector: dmContainer.routineVector,
        sustainabilityScore: 95,
        optimizationSummary: `Imported routine by ${dmContainer.author.displayName || 'Reformer'}`,
      };

      await saveCustomProfile(newProfile);
      return newProfile;
    },
    [saveCustomProfile]
  );

  // 3. Compute the active custom profile
  const activeCustomProfile = useMemo(() => {
    if (!activeProfileId || activeProfileId === 'default') return null;
    return customProfiles.find((p) => p.id === activeProfileId) || null;
  }, [activeProfileId, customProfiles]);

  // 4. Compute default wrapped preset tasks (Standard Profession Routine)
  const defaultWrappedPresetTasks = useMemo(() => {
    if (!profileData?.isReformersEnrolled || baseTasksLoading || !presetTasks) {
      return presetTasks || {};
    }

    try {
      const allTasks: any[] = [];
      Object.keys(presetTasks || {}).forEach((cat) => {
        const catObj = presetTasks[cat];
        if (catObj && Array.isArray(catObj.tasks)) {
          catObj.tasks.forEach((task) => {
            allTasks.push({ ...task, category: cat });
          });
        }
      });

      if (allTasks.length === 0) {
        return presetTasks;
      }

      allTasks.sort((a, b) => (a.order || 0) - (b.order || 0));

      const wrappedTasks = wrapRoutineWithMOVERS(
        allTasks,
        profileData.profile,
        reformerPreference
      );

      const newPreset: Preset = {};
      (wrappedTasks || []).forEach((task, index) => {
        const category = task.category || 'Default';
        if (!newPreset[category]) {
          newPreset[category] = {
            color:
              categoryConfig[category]?.color ||
              categoryConfig['Default']?.color ||
              'bg-slate-800 text-white',
            tasks: [],
          };
        }
        const taskWithId = {
          ...task,
          id: (task as any).id || `movers-${task.name}-${index}`,
          order: index,
        } as UserPresetTask;

        newPreset[category].tasks.push(taskWithId);
      });

      const sortedPreset: Preset = {};
      Object.keys(newPreset)
        .sort((a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99))
        .forEach((key) => {
          sortedPreset[key] = newPreset[key];
        });

      return sortedPreset;
    } catch (err) {
      console.warn('Failed to wrap routine with MOVERS, falling back to original tasks:', err);
      return presetTasks;
    }
  }, [presetTasks, profileData, reformerPreference, baseTasksLoading]);

  // 5. Effective Preset Tasks (custom profile if active, else default)
  const effectivePresetTasks = useMemo(() => {
    if (activeCustomProfile) {
      return convertCustomProfileToPreset(activeCustomProfile);
    }
    return defaultWrappedPresetTasks;
  }, [activeCustomProfile, defaultWrappedPresetTasks]);

  const categoryTimeRanges = useMemo(() => {
    void clockTick;
    return computeCategoryTimeRanges(effectivePresetTasks, new Date());
  }, [effectivePresetTasks, clockTick]);

  const activeCategory = useMemo(() => {
    void clockTick;
    return computeActiveCategory(effectivePresetTasks, categoryTimeRanges, undefined, new Date());
  }, [effectivePresetTasks, categoryTimeRanges, clockTick]);

  return {
    ...presetTasksData,
    presetTasks: effectivePresetTasks,
    categoryTimeRanges,
    activeCategory,
    // Multi-profile state and methods
    customProfiles,
    activeProfileId,
    activeCustomProfile,
    profilesLoading,
    saveCustomProfile,
    setActiveProfile,
    renameCustomProfile,
    duplicateCustomProfile,
    deleteCustomProfile,
    importDMProfile,
  };
}
