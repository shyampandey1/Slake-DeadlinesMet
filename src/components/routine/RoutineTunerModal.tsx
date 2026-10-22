"use client";

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  RoutineTuningAnswers,
  StudyPreference,
  EveningActivity,
  MoversWrapperMode,
  CustomRoutineProfile,
  DMRoutineTaskBlock,
} from '@/types/routineTuner';
import { computeRoutineVector } from '@/lib/clientEmbedder';
import {
  Sparkles,
  Sun,
  Moon,
  Briefcase,
  Coffee,
  Car,
  BookOpen,
  Dumbbell,
  Users,
  Palette,
  Code,
  Flame,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  BrainCircuit,
  Wind,
  Target,
  PenSquare,
  Droplets,
  Bed,
  Eye,
  Loader2,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';
import { TimePicker12h } from './TimePicker12h';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface RoutineTunerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (profile: CustomRoutineProfile) => Promise<void>;
  defaultUserName?: string;
  initialAnswers?: Partial<RoutineTuningAnswers>;
  existingProfileId?: string;
  currentProfession?: string;
}

const DEFAULT_ANSWERS: RoutineTuningAnswers = {
  profileName: "My Tuned Routine",
  profession: "General",
  wakeUpTime: '06:30',
  sleepTime: '23:00',
  workOrCollegeStart: '09:00',
  workOrCollegeEnd: '17:30',
  commuteDurationMinutes: 30,
  lunchBreakTime: '13:00',
  lunchDurationMinutes: 45,
  studyOrResearchPreference: 'split_blocks',
  studyDurationMinutes: 90,
  eveningCustomization: ['fitness', 'relaxation'],
  moversWrapperMode: 'morning_primer',
};

const COMMUTE_OPTIONS = [
  { label: 'Remote / 0m', value: 0 },
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '45m', value: 45 },
  { label: '60m', value: 60 },
];

const STUDY_PREFERENCES: {
  id: StudyPreference;
  title: string;
  badge: string;
  description: string;
  icon: any;
}[] = [
  {
    id: 'early_morning',
    title: 'Dawn Focus Sprint',
    badge: 'Early Morning',
    description: 'High-leverage research before college/office while willpower is 100%.',
    icon: Sun,
  },
  {
    id: 'late_afternoon',
    title: 'Twilight Sprint',
    badge: 'Late Afternoon',
    description: 'Bridge directly from office hours into study before evening relaxation.',
    icon: Coffee,
  },
  {
    id: 'night_owl',
    title: 'Midnight Deep Dive',
    badge: 'Night Owl',
    description: 'Uninterrupted quiet sessions post-dinner when the world sleeps.',
    icon: Moon,
  },
  {
    id: 'split_blocks',
    title: 'Biphasic Flow',
    badge: 'Split Sessions',
    description: 'Two balanced 45m blocks: morning theory & night application.',
    icon: Sparkles,
  },
];

const EVENING_ACTIVITIES: {
  id: EveningActivity;
  label: string;
  icon: any;
  color: string;
}[] = [
  { id: 'fitness', label: 'Workout & Fitness', icon: Dumbbell, color: 'text-emerald-400 border-emerald-500/30' },
  { id: 'skill_building', label: 'Code & Skill Upskill', icon: Code, color: 'text-blue-400 border-blue-500/30' },
  { id: 'creative_hobby', label: 'Creative Arts & Hobby', icon: Palette, color: 'text-purple-400 border-purple-500/30' },
  { id: 'family_social', label: 'Family & Social', icon: Users, color: 'text-amber-400 border-amber-500/30' },
  { id: 'relaxation', label: 'Mindful Decompression', icon: Sparkles, color: 'text-cyan-400 border-cyan-500/30' },
];

function formatTo12h(timeStr: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12.toString().padStart(2, '0')}:${mStr || '00'} ${period}`;
}

export function RoutineTunerModal({
  isOpen,
  onClose,
  onSaveProfile,
  defaultUserName = 'Reformer',
  initialAnswers,
  existingProfileId,
  currentProfession = 'General',
}: RoutineTunerModalProps) {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [previewTasks, setPreviewTasks] = useState<DMRoutineTaskBlock[]>([]);
  const [sustainabilityScore, setSustainabilityScore] = useState<number>(94);
  const [optimizationSummary, setOptimizationSummary] = useState<string>('');

  const [answers, setAnswers] = useState<RoutineTuningAnswers>(() => ({
    ...DEFAULT_ANSWERS,
    profileName: initialAnswers?.profileName || `${defaultUserName}'s Routine`,
    profession: initialAnswers?.profession || currentProfession || 'General',
    ...initialAnswers,
  }));

  // Calculate sleeping duration for preview in step 1
  const sleepDurationHours = useMemo(() => {
    const [wH, wM] = answers.wakeUpTime.split(':').map(Number);
    const [sH, sM] = answers.sleepTime.split(':').map(Number);
    let diff = (wH * 60 + wM) - (sH * 60 + sM);
    if (diff <= 0) diff += 1440;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  }, [answers.wakeUpTime, answers.sleepTime]);

  const updateAnswer = <K extends keyof RoutineTuningAnswers>(
    key: K,
    value: RoutineTuningAnswers[K]
  ) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const toggleEveningActivity = (activity: EveningActivity) => {
    setAnswers((prev) => {
      const exists = prev.eveningCustomization.includes(activity);
      const updated = exists
        ? prev.eveningCustomization.filter((a) => a !== activity)
        : [...prev.eveningCustomization, activity];
      return { ...prev, eveningCustomization: updated };
    });
  };

  // When reaching step 5, fetch or synthesize instant preview
  const handleNextStep = async () => {
    if (step === 4) {
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/routine/tune', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answers),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.tasks)) {
          setPreviewTasks(data.tasks);
          setSustainabilityScore(data.sustainabilityScore || 92);
          setOptimizationSummary(data.optimizationSummary || '');
        }
      } catch (err) {
        console.warn('Preview synthesis error:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
    setStep((s) => Math.min(5, s + 1));
  };

  const handlePrevStep = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const handleFinalSave = async () => {
    setIsSubmitting(true);
    try {
      // 1. Synthesize final schedule if not cached
      let finalTasks = previewTasks;
      let finalScore = sustainabilityScore;
      let finalSummary = optimizationSummary;

      if (!finalTasks || finalTasks.length === 0) {
        const res = await fetch('/api/routine/tune', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answers),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.tasks)) {
          finalTasks = data.tasks;
          finalScore = data.sustainabilityScore || 92;
          finalSummary = data.optimizationSummary || '';
        }
      }

      // 2. Compute client-side WebGPU embeddinggemma-300m vector
      const vector = await computeRoutineVector(
        answers,
        (finalTasks || []).map((t) => t.title)
      );

      const profileId = existingProfileId || `profile_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const newProfile: CustomRoutineProfile = {
        id: profileId,
        name: answers.profileName.trim() || 'My Tuned Routine',
        updatedAt: new Date().toISOString(),
        tuningAnswers: answers,
        tasks: finalTasks,
        routineVector: vector,
        sustainabilityScore: finalScore,
        optimizationSummary: finalSummary,
      };

      await onSaveProfile(newProfile);
      onClose();
    } catch (err) {
      console.error('Failed to save tuned profile:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert time HH:mm to percentage for 24-hr visual timeline bar
  const timeToPercent = (timeStr: string) => {
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    return (((h * 60 + m) % 1440) / 1440) * 100;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="fixed inset-x-0 bottom-0 top-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:inset-auto z-50 flex flex-col w-full sm:w-[95vw] sm:max-w-2xl h-[92dvh] max-h-[92dvh] sm:h-[85dvh] sm:max-h-[820px] bg-background/95 backdrop-blur-2xl border-t sm:border border-border/70 p-0 overflow-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl">
        {/* Mobile bottom-sheet grab handle */}
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Wizard Header & Progress Bar */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-border/40 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center justify-between mb-3 pr-8">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold font-headline leading-tight">
                  Interactive Routine Tuner
                </DialogTitle>
                <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground">
                  Step {step} of 5 • Tailoring {answers.profession || currentProfession || 'Reformer'} MOVERS
                </DialogDescription>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              {step === 1 && 'Anchors'}
              {step === 2 && 'Work & Commute'}
              {step === 3 && 'Study & Evening'}
              {step === 4 && 'MOVERS Protocol'}
              {step === 5 && 'Preview & Save'}
            </span>
          </div>

          {/* Animated 5-Step Bar */}
          <div className="w-full h-1.5 bg-muted/60 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Steps Form (Scrollable body with touch containment and bottom breathing room) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-4 sm:p-6 space-y-6 pb-12">
          <AnimatePresence mode="wait">
            {/* STEP 1: Morning & Night Anchors */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/50">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-1">
                    <Sun className="w-4 h-4 text-amber-400" />
                    Waking & Sleeping Anchors
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Your circadian anchor points lock in your peak biological focus zones.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Wake Up Time */}
                  <div className="space-y-2 p-4 rounded-2xl bg-card border border-border/60">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="wakeUpTime" className="text-sm font-semibold flex items-center gap-1.5">
                        <Sun className="w-4 h-4 text-amber-400" />
                        Time Leaving Bed
                      </Label>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        {formatTo12h(answers.wakeUpTime)}
                      </span>
                    </div>
                    <TimePicker12h
                      id="wakeUpTime"
                      value={answers.wakeUpTime}
                      onChange={(val) => updateAnswer('wakeUpTime', val)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Hydration #1 and domestic bed setup trigger on wake.
                    </p>
                  </div>

                  {/* Sleep Time */}
                  <div className="space-y-2 p-4 rounded-2xl bg-card border border-border/60">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sleepTime" className="text-sm font-semibold flex items-center gap-1.5">
                        <Moon className="w-4 h-4 text-indigo-400" />
                        Target Sleep Time
                      </Label>
                      <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                        {formatTo12h(answers.sleepTime)}
                      </span>
                    </div>
                    <TimePicker12h
                      id="sleepTime"
                      value={answers.sleepTime}
                      onChange={(val) => updateAnswer('sleepTime', val)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Bedtime routine and reading wind down 45m before sleep.
                    </p>
                  </div>
                </div>

                {/* Sleep Budget Callout */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
                  <span className="flex items-center gap-2 text-indigo-300 font-medium">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Calculated Rest Window:
                  </span>
                  <span className="font-bold text-indigo-200 font-mono text-sm">{sleepDurationHours}</span>
                </div>
              </motion.div>
            )}

            {/* STEP 2: College / Office & Lunch Block */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/50">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-1">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    College or Office Hours & Commute
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Non-negotiable obligations are cordoned off with zero overlapping tasks.
                  </p>
                </div>

                {/* Work Hours Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 rounded-2xl bg-card border border-border/60">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="workStart" className="text-sm font-semibold flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-blue-400" />
                        Work / College Start
                      </Label>
                      <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                        {formatTo12h(answers.workOrCollegeStart)}
                      </span>
                    </div>
                    <TimePicker12h
                      id="workStart"
                      value={answers.workOrCollegeStart}
                      onChange={(val) => updateAnswer('workOrCollegeStart', val)}
                    />
                  </div>
                  <div className="space-y-2 p-4 rounded-2xl bg-card border border-border/60">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="workEnd" className="text-sm font-semibold flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-blue-400" />
                        Work / College End
                      </Label>
                      <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                        {formatTo12h(answers.workOrCollegeEnd)}
                      </span>
                    </div>
                    <TimePicker12h
                      id="workEnd"
                      value={answers.workOrCollegeEnd}
                      onChange={(val) => updateAnswer('workOrCollegeEnd', val)}
                    />
                  </div>
                </div>

                {/* Commute Chips */}
                <div className="space-y-2.5">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-amber-400" />
                    Commute Duration (One-way)
                  </Label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {COMMUTE_OPTIONS.map((c) => (
                      <Button
                        key={c.value}
                        type="button"
                        variant={answers.commuteDurationMinutes === c.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateAnswer('commuteDurationMinutes', c.value)}
                        className={cn(
                          'h-10 text-xs font-semibold rounded-xl transition-all',
                          answers.commuteDurationMinutes === c.value
                            ? 'bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-md shadow-amber-500/20'
                            : 'hover:border-amber-500/50'
                        )}
                      >
                        {c.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Lunch Break */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 rounded-2xl bg-card border border-border/60">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="lunchTime" className="text-sm font-semibold flex items-center gap-1.5">
                        <Coffee className="w-4 h-4 text-emerald-400" />
                        Average Lunch Time
                      </Label>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        {formatTo12h(answers.lunchBreakTime)}
                      </span>
                    </div>
                    <TimePicker12h
                      id="lunchTime"
                      value={answers.lunchBreakTime}
                      onChange={(val) => updateAnswer('lunchBreakTime', val)}
                    />
                  </div>
                  <div className="space-y-2 p-4 rounded-2xl bg-card border border-border/60">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Lunch Duration</Label>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {answers.lunchDurationMinutes} mins
                      </span>
                    </div>
                    <Slider
                      value={[answers.lunchDurationMinutes]}
                      onValueChange={([val]) => updateAnswer('lunchDurationMinutes', val)}
                      min={20}
                      max={90}
                      step={5}
                      className="py-4"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Study / Research & Evening Blocks */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/50">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    Deep Research Window & Evening Customization
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Slot your intellectual study sprint when your cognitive clarity is at peak.
                  </p>
                </div>

                {/* Study Window Preference Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STUDY_PREFERENCES.map((pref) => {
                    const IconComp = pref.icon;
                    const isSelected = answers.studyOrResearchPreference === pref.id;
                    return (
                      <div
                        key={pref.id}
                        onClick={() => updateAnswer('studyOrResearchPreference', pref.id)}
                        className={cn(
                          'p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2',
                          isSelected
                            ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                            : 'border-border/60 hover:border-purple-500/40 bg-card/50'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 font-bold text-sm text-foreground">
                            <IconComp className="w-4 h-4 text-purple-400" />
                            {pref.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                            {pref.badge}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {pref.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Study Duration Slider */}
                <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Total Study / Research Target</Label>
                    <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                      {answers.studyDurationMinutes} minutes
                    </span>
                  </div>
                  <Slider
                    value={[answers.studyDurationMinutes]}
                    onValueChange={([val]) => updateAnswer('studyDurationMinutes', val)}
                    min={30}
                    max={180}
                    step={15}
                    className="py-3"
                  />
                </div>

                {/* Evening Multi-select Chips */}
                <div className="space-y-2.5">
                  <Label className="text-sm font-semibold">
                    Evening Customization (Select all that apply)
                  </Label>
                  <div className="flex flex-wrap gap-2.5">
                    {EVENING_ACTIVITIES.map((act) => {
                      const IconComp = act.icon;
                      const isSelected = answers.eveningCustomization.includes(act.id);
                      return (
                        <Button
                          key={act.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleEveningActivity(act.id)}
                          className={cn(
                            'rounded-xl text-xs font-medium gap-2 border transition-all h-9',
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20 font-bold'
                              : 'hover:border-purple-500/40'
                          )}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          {act.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Reformers MOVERS Protocol Injection */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/50">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-1">
                    <Flame className="w-4 h-4 text-emerald-400" />
                    Reformers MOVERS Protocol Auto-Injector
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Choose how the 6 MOVERS pillars + 8 Hydration checks + 3 Eye-Strain breaks are structured.
                  </p>
                </div>

                {/* 3 Modes Selector Cards */}
                <div className="space-y-3">
                  {/* Mode 1: Morning Primer */}
                  <div
                    onClick={() => updateAnswer('moversWrapperMode', 'morning_primer')}
                    className={cn(
                      'p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-2',
                      answers.moversWrapperMode === 'morning_primer'
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                        : 'border-border/60 hover:border-emerald-500/40 bg-card/40'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm flex items-center gap-2 text-foreground">
                        🌅 The Morning Primer
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                        Front-Loaded
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Injects <strong>Meditation (M)</strong>, <strong>Oxygenation (O)</strong>,{' '}
                      <strong>Visualization (V)</strong>, and <strong>Exercise (E)</strong> before work. Concludes day with{' '}
                      <strong>Reading (R)</strong> & <strong>Scribing (S)</strong>.
                    </p>
                  </div>

                  {/* Mode 2: Evening Restorer */}
                  <div
                    onClick={() => updateAnswer('moversWrapperMode', 'evening_restorer')}
                    className={cn(
                      'p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-2',
                      answers.moversWrapperMode === 'evening_restorer'
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                        : 'border-border/60 hover:border-indigo-500/40 bg-card/40'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm flex items-center gap-2 text-foreground">
                        🌙 The Evening Restorer
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                        Back-Loaded Recovery
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Quick kinetic stretch & bed setup on waking; consolidates{' '}
                      <strong>M + O + V + R + S</strong> in a soothing evening block before sleep.
                    </p>
                  </div>

                  {/* Mode 3: JEV Smart Weave */}
                  <div
                    onClick={() => updateAnswer('moversWrapperMode', 'jev_smart_weave')}
                    className={cn(
                      'p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-2',
                      answers.moversWrapperMode === 'jev_smart_weave'
                        ? 'border-teal-500 bg-teal-500/10 shadow-lg shadow-teal-500/10'
                        : 'border-border/60 hover:border-teal-500/40 bg-card/40'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm flex items-center gap-2 text-foreground">
                        ⚡ JEV TypeSafe Smart Weave
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold">
                        Dynamic Micro-Gaps
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Dynamically slots MOVERS pillars into your natural open micro-gaps throughout the day to prevent
                      cognitive fatigue and screen burnout.
                    </p>
                  </div>
                </div>

                {/* Built-in Protocol Checklist */}
                <div className="p-4 rounded-2xl bg-card/60 border border-border/50">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                    Guaranteed Injected Protocols:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <span className="flex items-center gap-1.5 text-foreground/90">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 6 MOVERS Pillars
                    </span>
                    <span className="flex items-center gap-1.5 text-foreground/90">
                      <Droplets className="w-3.5 h-3.5 text-blue-400" /> 8 Hydration Checks
                    </span>
                    <span className="flex items-center gap-1.5 text-foreground/90">
                      <Eye className="w-3.5 h-3.5 text-amber-400" /> 3 Eye-Strain Breaks
                    </span>
                    <span className="flex items-center gap-1.5 text-foreground/90">
                      <Bed className="w-3.5 h-3.5 text-purple-400" /> Domestic Bed Setup
                    </span>
                    <span className="flex items-center gap-1.5 text-foreground/90">
                      <Car className="w-3.5 h-3.5 text-emerald-400" /> Commute Isolator
                    </span>
                    <span className="flex items-center gap-1.5 text-foreground/90">
                      <Target className="w-3.5 h-3.5 text-cyan-400" /> Zero Overlap Engine
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Profile Naming & Instant 24h Timeline Preview */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="profileName" className="text-sm font-semibold">
                    Routine Profile Name
                  </Label>
                  <Input
                    id="profileName"
                    value={answers.profileName}
                    onChange={(e) => updateAnswer('profileName', e.target.value)}
                    placeholder="e.g., Shyam's Deep Research Routine"
                    className="text-base h-11 bg-background/50 border-border/80 focus:border-emerald-500"
                  />
                  <p className="text-xs text-muted-foreground">
                    You can switch seamlessly between named profiles anytime on the Routine page.
                  </p>
                </div>

                {/* Sustainability Score & JEV Summary */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Schedule Sustainability Score
                    </span>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {optimizationSummary ||
                        'Zero overlapping blocks, spaced hydration, and protected recovery periods.'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-400 font-headline">
                      {sustainabilityScore}
                    </span>
                    <span className="text-xs text-muted-foreground block">/ 100</span>
                  </div>
                </div>

                {/* 24-Hour Visual Timeline Bar */}
                <div className="space-y-2 p-4 rounded-2xl bg-card border border-border/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      24-Hour Schedule Distribution
                    </span>
                    <span className="font-mono text-muted-foreground">00:00 → 24:00</span>
                  </div>

                  {/* Multi-segmented Timeline Bar */}
                  <div className="w-full h-8 bg-muted/60 rounded-xl overflow-hidden relative flex border border-border/40">
                    {/* Sleep Morning Segment */}
                    <div
                      className="h-full bg-indigo-900/70 border-r border-indigo-700/50"
                      style={{ width: `${timeToPercent(answers.wakeUpTime)}%` }}
                      title="Sleep Anchor"
                    />
                    {/* Active Daytime Segment */}
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 flex-1 relative"
                      title="Active Schedule Window"
                    />
                    {/* Sleep Night Segment */}
                    <div
                      className="h-full bg-indigo-900/70 border-l border-indigo-700/50"
                      style={{ width: `${100 - timeToPercent(answers.sleepTime)}%` }}
                      title="Night Rest Anchor"
                    />
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 pt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> MOVERS
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Work/College
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Study
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-800 inline-block" /> Rest/Sleep
                    </span>
                  </div>
                </div>

                {/* 4 Clean Quadrants of the Day */}
                <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Structured 4-Quadrant Schedule:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                      <span className="font-semibold text-emerald-300">🌅 Morning Protocol</span>
                      <span className="font-mono text-muted-foreground">{formatTo12h(answers.wakeUpTime)} → {formatTo12h(answers.workOrCollegeStart)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                      <span className="font-semibold text-blue-300">💼 Afternoon Execution</span>
                      <span className="font-mono text-muted-foreground">{formatTo12h(answers.workOrCollegeStart)} → {formatTo12h(answers.workOrCollegeEnd)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                      <span className="font-semibold text-purple-300">🌆 Evening Recharge</span>
                      <span className="font-mono text-muted-foreground">{formatTo12h(answers.workOrCollegeEnd)} → Night</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                      <span className="font-semibold text-indigo-300">🌙 Night Restoration</span>
                      <span className="font-mono text-muted-foreground">Wind-down → {formatTo12h(answers.sleepTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Task Count Summary */}
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40 text-xs flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Total Chronological Tasks ({answers.profession || currentProfession || 'Reformer'}):
                  </span>
                  <span className="font-bold text-foreground font-mono">
                    {previewTasks.length > 0 ? previewTasks.length : '30+'} Tasks
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Wizard Footer Controls (Locked Sticky Bottom on Mobile with Safe Area Padding) */}
        <div className="shrink-0 p-3.5 sm:p-5 border-t border-border/40 bg-card/95 backdrop-blur flex items-center justify-between gap-3 z-30 pb-[max(1.25rem,env(safe-area-inset-bottom,20px))] sm:pb-4">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={isSubmitting}
              className="gap-1.5 rounded-xl h-11 sm:h-12 px-4 font-semibold text-xs sm:text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl h-11 sm:h-12 px-4 text-xs sm:text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          )}

          {step < 5 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={isSubmitting}
              className="gap-2 rounded-xl h-11 sm:h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 ml-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Synthesizing...
                </>
              ) : (
                <>
                  Next Step <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinalSave}
              disabled={isSubmitting}
              className="gap-2 rounded-xl h-11 sm:h-12 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 ml-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving & Vectorizing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Activate Tuned Routine
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
