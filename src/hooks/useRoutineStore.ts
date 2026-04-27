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
        if (!profileData?.isReformersEnrolled || loading) {
            return presetTasks;
        }

        // Flatten tasks, wrap with MOVERS, then re-group by category
        const allTasks: any[] = [];
        Object.keys(presetTasks).forEach(cat => {
            presetTasks[cat].tasks.forEach(task => {
                allTasks.push({ ...task, category: cat });
            });
        });

        // Sort by original order to maintain integrity
        allTasks.sort((a, b) => (a.order || 0) - (b.order || 0));

        const wrappedTasks = wrapRoutineWithMOVERS(
            allTasks,
            profileData.profile,
            reformerPreference
        );

        // Re-group into Preset structure
        const newPreset: Preset = {};
        wrappedTasks.forEach((task, index) => {
            const category = task.category || 'Default';
            if (!newPreset[category]) {
                newPreset[category] = { 
                    color: categoryConfig[category]?.color || categoryConfig['Default'].color, 
                    tasks: [] 
                };
            }
            // Assign a stable-ish ID for MOVERS tasks if they don't have one
            const taskWithId = { 
                ...task, 
                id: (task as any).id || `movers-${task.name}-${index}`,
                order: index // Update order based on new sequence
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
    }, [presetTasks, profileData, reformerPreference, loading]);

    return {
        ...presetTasksData,
        presetTasks: wrappedPresetTasks,
    };
}
