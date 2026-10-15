"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTaskClassification } from '@/hooks/useTasks';
import type { LifestyleCategory, UserPresetTask } from '@/types';
import {
  Sparkles,
  AlertTriangle,
  Coins,
  Clock,
  Merge,
  ShieldAlert,
  CheckCircle2,
  Brain,
  Droplets,
  Dumbbell,
  Wind,
  Sparkle,
  Palette,
} from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (
    task: {
      name: string;
      duration: number;
      category: LifestyleCategory;
      isVerifiedForCoins?: boolean;
      icon?: string;
    },
    mergeTaskId?: string
  ) => void;
  existingRoutineTasks?: { name: string; duration?: number; id?: string }[];
}

const CATEGORY_ICONS: Record<LifestyleCategory, React.ComponentType<{ className?: string }>> = {
  Productivity: Brain,
  Hydration: Droplets,
  Fitness: Dumbbell,
  Meditation: Wind,
  Hygiene: Sparkle,
  Creativity: Palette,
};

const CATEGORY_COLORS: Record<LifestyleCategory, { bg: string; border: string; text: string }> = {
  Productivity: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  Hydration: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  Fitness: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  Meditation: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  Hygiene: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  Creativity: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400' },
};

export default function AddTaskModal({
  isOpen,
  onClose,
  onSaveTask,
  existingRoutineTasks = [],
}: AddTaskModalProps) {
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LifestyleCategory>('Productivity');
  const [duration, setDuration] = useState<number>(45);
  const [isManualCategoryOverride, setIsManualCategoryOverride] = useState(false);
  const [isManualDurationOverride, setIsManualDurationOverride] = useState(false);

  const {
    suggestedCategory,
    suggestedDuration,
    categoryScores,
    maxCategorySimilarity,
    isVerifiedForCoins,
    duplicateWarning,
    availableCategories,
    isClassifying,
  } = useTaskClassification(taskTitle, {
    debounceMs: 15,
    existingTasks: existingRoutineTasks,
  });

  // Automatically pre-select category and optimal duration unless overridden by user
  useEffect(() => {
    if (!isManualCategoryOverride && suggestedCategory) {
      setSelectedCategory(suggestedCategory);
    }
  }, [suggestedCategory, isManualCategoryOverride]);

  useEffect(() => {
    if (!isManualDurationOverride && suggestedDuration) {
      setDuration(suggestedDuration);
    }
  }, [suggestedDuration, isManualDurationOverride]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setTaskTitle('');
      setSelectedCategory('Productivity');
      setDuration(45);
      setIsManualCategoryOverride(false);
      setIsManualDurationOverride(false);
    }
  }, [isOpen]);

  const handleCategoryClick = (category: LifestyleCategory) => {
    setIsManualCategoryOverride(true);
    setSelectedCategory(category);
  };

  const handleMergeDuplicate = () => {
    if (!duplicateWarning) return;
    const existingDuration = duplicateWarning.existingDuration || 20;
    const boostedDuration = existingDuration + duration;

    onSaveTask(
      {
        name: duplicateWarning.existingTaskName,
        duration: boostedDuration,
        category: selectedCategory,
        isVerifiedForCoins: true,
      },
      duplicateWarning.existingTaskId
    );
    onClose();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!taskTitle.trim()) return;

    onSaveTask({
      name: taskTitle.trim(),
      duration: Math.max(1, duration),
      category: selectedCategory,
      isVerifiedForCoins,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-neutral-950 border border-neutral-800 text-neutral-100 shadow-2xl p-6 sm:rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-neutral-100">
                Create Intelligent Task
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400">
                Real-time WebGPU categorizer & routine de-duplicator
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Task Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Task Title
            </label>
            <Input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Drink H2O, Backend API Sprint, 4-4-4 Pranayama..."
              autoFocus
              className="bg-neutral-900 border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus-visible:ring-amber-500"
            />
          </div>

          {/* Anti-Spam / Gibberish Coin Shield Badge */}
          {taskTitle.trim().length >= 3 && !isVerifiedForCoins && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="font-semibold">Custom Unverified Task (Timer Active • 0 Slake Coins)</p>
                <p className="text-[11px] text-amber-400/80 mt-0.5">
                  Semantic similarity to core lifestyle anchors is below 0.45. You can still focus and run the timer, but coin rewards are reserved for verified habit pillars.
                </p>
              </div>
            </div>
          )}

          {/* Semantic Routine De-Duplication Warning */}
          {duplicateWarning && (
            <div className="p-3 rounded-xl bg-orange-950/40 border border-orange-800/60 text-orange-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-orange-300">
                    Similar task &apos;{duplicateWarning.existingTaskName}&apos; is already scheduled.
                  </p>
                  <p className="text-[11px] text-orange-400/80 mt-0.5">
                    Match confidence: {Math.round(duplicateWarning.similarity * 100)}%. Merge or boost duration instead?
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleMergeDuplicate}
                size="sm"
                variant="outline"
                className="w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border-orange-500/30 flex items-center justify-center gap-1.5 text-xs h-8"
              >
                <Merge className="w-3.5 h-3.5" />
                Merge & Boost &apos;{duplicateWarning.existingTaskName}&apos; (+{duration}m)
              </Button>
            </div>
          )}

          {/* 6 Lifestyle Categories with Live Embedding Highlight */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Pillar Category
              </label>
              {taskTitle.trim() && (
                <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Auto-categorized by WebGPU
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {availableCategories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const isAutoSuggested = suggestedCategory === cat && !isManualCategoryOverride;
                const Icon = CATEGORY_ICONS[cat];
                const color = CATEGORY_COLORS[cat];
                const score = categoryScores[cat] || 0;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className={`relative p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between h-16 ${
                      isSelected
                        ? `${color.bg} ${color.border} ring-1 ring-amber-500/50`
                        : 'bg-neutral-900/60 border-neutral-800/80 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon className={`w-4 h-4 ${isSelected ? color.text : 'text-neutral-400'}`} />
                      {isAutoSuggested && taskTitle.trim() && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-neutral-200 truncate">{cat}</div>
                      <div className="text-[10px] text-neutral-500">
                        {score > 0 ? `${Math.round(score * 100)}% match` : `${CATEGORY_COLORS[cat] ? 'Ready' : ''}`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                Duration (minutes)
              </label>
              <span className="text-xs font-mono font-bold text-amber-400">{duration} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={300}
                value={duration}
                onChange={(e) => {
                  setIsManualDurationOverride(true);
                  setDuration(parseInt(e.target.value) || 1);
                }}
                className="bg-neutral-900 border-neutral-800 text-neutral-100"
              />
              <div className="flex gap-1">
                {[2, 10, 20, 45].map((presetDur) => (
                  <Button
                    key={presetDur}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsManualDurationOverride(true);
                      setDuration(presetDur);
                    }}
                    className={`text-xs px-2.5 h-9 ${
                      duration === presetDur
                        ? 'border-amber-500/60 text-amber-400 bg-amber-500/10'
                        : 'border-neutral-800 text-neutral-400 bg-neutral-900'
                    }`}
                  >
                    {presetDur}m
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!taskTitle.trim()}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-neutral-950 font-bold px-5"
            >
              Add Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
