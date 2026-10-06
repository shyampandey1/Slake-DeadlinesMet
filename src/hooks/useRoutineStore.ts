"use client";

import { useMemo } from 'react';
import { useProfile } from './useProfile';
import { usePresetTasks } from './useFirestore';
import { wrapRoutineWithMOVERS } from '@/lib/routines';
import { categoryConfig } from '@/lib/routines';
import type { Preset, UserPresetTask } from '@/types';

export function useRoutineStore() {
    const { profileData, reformerPreference } = useProfile();
    const presetTasksData = usePresetTasks();
    const { presetTasks, loading } = presetTasksData;

    const wrappedPresetTasks = useMemo(() => {
        if (!profileData?.isReformersEnrolled || loading || !presetTasks) {
            return presetTasks || {};
        }

        try {
            // Flatten tasks, wrap with MOVERS, then re-group by category
            const allTasks: any[] = [];
            Object.keys(presetTasks || {}).forEach(cat => {
                const catObj = presetTasks[cat];
                if (catObj && Array.isArray(catObj.tasks)) {
                    catObj.tasks.forEach(task => {
                        allTasks.push({ ...task, category: cat });
                    });
                }
            });

            if (allTasks.length === 0) {
                return presetTasks;
            }

            // Sort by original order to maintain integrity
            allTasks.sort((a, b) => (a.order || 0) - (b.order || 0));

            const wrappedTasks = wrapRoutineWithMOVERS(
                allTasks,
                profileData.profile,
                reformerPreference
            );

            // Re-group into Preset structure
            const newPreset: Preset = {};
            (wrappedTasks || []).forEach((task, index) => {
                const category = task.category || 'Default';
                if (!newPreset[category]) {
                    newPreset[category] = { 
                        color: categoryConfig[category]?.color || categoryConfig['Default']?.color || 'bg-slate-800 text-white', 
                        tasks: [] 
                    };
                }
                const taskWithId = { 
                    ...task, 
                    id: (task as any).id || `movers-${task.name}-${index}`,
                    order: index
                } as UserPresetTask;
                
                newPreset[category].tasks.push(taskWithId);
            });

            // Sort categories by config order
            const sortedPreset: Preset = {};
            Object.keys(newPreset)
                .sort((a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99))
                .forEach(key => {
                    sortedPreset[key] = newPreset[key];
                });

            return sortedPreset;
        } catch (err) {
            console.warn("Failed to wrap routine with MOVERS, falling back to original tasks:", err);
            return presetTasks;
        }
    }, [presetTasks, profileData, reformerPreference, loading]);

    return {
        ...presetTasksData,
        presetTasks: wrappedPresetTasks
    };
}
