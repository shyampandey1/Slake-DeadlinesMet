"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTasks as useFirestoreTasks } from './useFirestore';
import {
  classifyTaskTitleWithEmbeddings,
  TaskClassificationResult,
  LIFESTYLE_PILLARS,
  LIFESTYLE_DEFAULT_DURATIONS,
} from '@/lib/semanticGate';
import { computeClientEmbedding, cosineSimilarity } from '@/lib/clientEmbedder';
import type { Task, LifestyleCategory } from '@/types';

// Re-export the core tasks hook for backwards compatibility and ease of import
export const useTasks = useFirestoreTasks;

export interface UseTaskClassificationOptions {
  debounceMs?: number;
  existingTasks?: { name: string; duration?: number; id?: string }[];
}

/**
 * Live keystroke categorization, de-duplication, and anti-spam hook
 * powered by WebGPU google/embeddinggemma-300m
 */
export function useTaskClassification(
  title: string,
  options: UseTaskClassificationOptions = {}
) {
  const { debounceMs = 15, existingTasks = [] } = options;
  const [classification, setClassification] = useState<TaskClassificationResult>({
    suggestedCategory: 'Productivity',
    suggestedDuration: 45,
    categoryScores: {
      Productivity: 0,
      Hydration: 0,
      Fitness: 0,
      Meditation: 0,
      Hygiene: 0,
      Creativity: 0,
    },
    maxCategorySimilarity: 0,
    isVerifiedForCoins: true,
    duplicateWarning: null,
  });
  const [isClassifying, setIsClassifying] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = title.trim();
    if (!trimmed) {
      setClassification({
        suggestedCategory: 'Productivity',
        suggestedDuration: 45,
        categoryScores: {
          Productivity: 0,
          Hydration: 0,
          Fitness: 0,
          Meditation: 0,
          Hygiene: 0,
          Creativity: 0,
        },
        maxCategorySimilarity: 0,
        isVerifiedForCoins: true,
        duplicateWarning: null,
      });
      setIsClassifying(false);
      return;
    }

    setIsClassifying(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await classifyTaskTitleWithEmbeddings(trimmed, existingTasks);
        setClassification(result);
      } catch (err) {
        console.error('[useTaskClassification] Classification error:', err);
      } finally {
        setIsClassifying(false);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [title, debounceMs, existingTasks]);

  return {
    ...classification,
    isClassifying,
    availableCategories: LIFESTYLE_PILLARS,
    defaultDurations: LIFESTYLE_DEFAULT_DURATIONS,
  };
}
