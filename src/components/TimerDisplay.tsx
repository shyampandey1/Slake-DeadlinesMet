"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Pause, Square, Loader2, PartyPopper, ArrowRight, Sun, Moon, Cloud, LucideIcon, CloudSun, CloudMoon, CloudDrizzle, CloudRain, CloudLightning, CloudSnow, Wind, CloudFog, Cloudy, Volume2, Bell, Clock } from "lucide-react";
import { generateMotivationalMessage } from "@/ai/flows/generate-motivational-message";
import { categorizeTask } from "@/ai/flows/categorize-task";
import { useTasks, getAvailableCategories } from "@/hooks/useFirestore";
import { useRoutineStore } from "@/hooks/useRoutineStore";
import { useProfile } from "@/hooks/useProfile";
import type { Task, UserPresetTask, UserProfile } from "@/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { useCoOpSession } from "@/hooks/useCoOpSession";
import { useAuth } from "@/hooks/useAuth";
import { defaultRoutines, categoryConfig } from "@/lib/routines";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CircularProgress from "./CircularProgress";
import { useTimerUI } from "@/hooks/useTimerUI";
import { useAudioSettings } from "@/hooks/useAudioSettings";
import { useWeather } from "@/hooks/useWeather";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { getTaskCategoryDetails } from "@/lib/categorization";
import { useToast } from "@/hooks/use-toast";
import { SkipForward } from "lucide-react";
import { useHydrationAudio } from "@/hooks/useHydrationAudio";
import { useBreathingAudio } from "@/hooks/useBreathingAudio";
import { useEyeExerciseAudio } from "@/hooks/useEyeExerciseAudio";
import HydrationBackground from "./HydrationBackground";
import DwellButton from "./DwellButton";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Music, Settings2 } from "lucide-react";
import { ambientSounds, soundtracks } from "@/hooks/useAudioSettings";


interface TimerDisplayProps {
  taskName: string;
  initialDuration: number; // in minutes
  category?: string;
  color?: string;
  expectedEndTime?: number;
  coOpSessionId?: string;
  forceRestart?: boolean;
}

type FlashState = 'none' | 'breathing' | 'three-times' | 'continuous';

const getWeatherIcon = (code: number, isNight: boolean): LucideIcon => {
  if (code >= 200 && code < 300) return CloudLightning;
  if (code >= 300 && code < 400) return CloudDrizzle;
  if (code >= 500 && code < 600) return CloudRain;
  if (code >= 600 && code < 700) return CloudSnow;
  if (code >= 700 && code < 800) return CloudFog;
  if (code === 800) return isNight ? Moon : Sun;
  if (code === 801) return isNight ? CloudMoon : CloudSun;
  if (code === 802) return Cloud;
  if (code > 802) return Cloudy;
  return Cloud;
};


export default function TimerDisplay({ taskName, initialDuration, category, color, expectedEndTime, coOpSessionId, forceRestart }: TimerDisplayProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { tasks, addTask } = useTasks();
  const { presetTasks } = useRoutineStore();
  const { isUIVisible, showUI } = useTimerUI();
  const { 
    playFinish, playTick, controlBackgroundAudio,
    isAmbientEnabled, setAmbientEnabled, selectedAmbient, setSelectedAmbient, ambientVolume, setAmbientVolume,
    isSoundtrackEnabled, setSoundtrackEnabled, selectedSoundtrack, setSelectedSoundtrack, soundtrackVolume, setSoundtrackVolume
  } = useAudioSettings();
  const { startTimer, clearTimer, updateTimer, activeTimer, isInitialized, focusInterval: contextFocusInterval } = useActiveTimer();
  const { weatherData, location } = useWeather();
  const { profileData, updateUserProfileData } = useProfile();
  const { user } = useAuth();
  const resolvedCoOpSessionId = forceRestart
    ? coOpSessionId
    : (coOpSessionId || (activeTimer?.taskName === taskName ? activeTimer?.coOpSessionId : undefined));
  const { session, updateSession } = useCoOpSession(resolvedCoOpSessionId, false);

  // Check if this task is a breathing/oxygenation task
  const isBreathingTask = taskName.toLowerCase().includes("breath") || taskName.toLowerCase().includes("oxygen") || taskName.toLowerCase().includes("pranayama");
  const effectiveDuration = (initialDuration && initialDuration > 0) ? initialDuration : (isBreathingTask ? 3 : 15);

  const [timeRemaining, setTimeRemaining] = useState(Math.round(effectiveDuration * 60));
  
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showMotivationalDialog, setShowMotivationalDialog] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState("");
  const [suggestedTask, setSuggestedTask] = useState<string | undefined>("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [flashState, setFlashState] = useState<FlashState>('none');
  const [focusInterval, setFocusInterval] = useState<number | null>(contextFocusInterval || null);

  useEffect(() => {
    if (contextFocusInterval && contextFocusInterval > 0) {
      setFocusInterval(contextFocusInterval);
    }
  }, [contextFocusInterval]);

  useEffect(() => {
    const handleIntervalEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      if (detail.interval) {
        setFocusInterval(detail.interval);
      }
    };
    window.addEventListener('slake-focus-interval-changed', handleIntervalEvent);
    return () => window.removeEventListener('slake-focus-interval-changed', handleIntervalEvent);
  }, []);
  const [customIntervalInput, setCustomIntervalInput] = useState<string>("");
  const [taskCategory, setTaskCategory] = useState(category);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const [offlineNotificationsEnabled, setOfflineNotificationsEnabled] = useState(false);
  const [peerData, setPeerData] = useState<UserProfile | null>(null);

  const userRoutine = useMemo(() => {
    const routine: any[] = [];
    Object.keys(presetTasks).forEach(cat => {
      presetTasks[cat].tasks.forEach(t => {
        routine.push({ ...t, category: cat });
      });
    });
    return routine.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [presetTasks]);

  // Task-Specific Environment Detection
  const isHydrationTask = taskCategory === "Hydration" || taskName.toLowerCase().includes("water") || taskName.toLowerCase().includes("drink") || taskName.toLowerCase().includes("hydrate");
  // isBreathingTask is defined at the top of the function
  const isEyeExerciseTask = taskCategory === "Eye Care" || taskName.toLowerCase().includes("eye") || taskName.toLowerCase().includes("gaze") || taskName.toLowerCase().includes("vision");

  // Audio Hooks
  const { startHydrationAudio, stopHydrationAudio, setHydrationVolume } = useHydrationAudio();
  const { initBreathingAudio, playBreathingChime, stopBreathingAudio } = useBreathingAudio();
  const { initEyeAudio, playEyeChime, stopEyeAudio } = useEyeExerciseAudio();

  // Breathing & Eye Exercise States
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [eyePhase, setEyePhase] = useState<'look-up' | 'look-down' | 'look-left' | 'look-right' | 'roll' | 'blink' | 'focus-near-far' | 'close-eyes'>('look-up');

  // Haptics Helper
  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch (err) {
        console.warn("Haptic feedback failed:", err);
      }
    }
  }, []);

  const ensureAudioInitialized = useCallback(() => {
    if (isHydrationTask && isAmbientEnabled) {
      startHydrationAudio();
    }
    if (isBreathingTask) {
      initBreathingAudio();
    }
    if (isEyeExerciseTask) {
      initEyeAudio();
    }
  }, [isHydrationTask, isBreathingTask, isEyeExerciseTask, isAmbientEnabled, startHydrationAudio, initBreathingAudio, initEyeAudio]);

  // Move refs to the top to avoid ReferenceErrors in effects
  const expectedEndTimeRef = useRef<number | null>(null);
  const timeRemainingRef = useRef(timeRemaining);
  const isFinishedRef = useRef(isFinished);
  const showMotivationalDialogRef = useRef(showMotivationalDialog);
  const lastTickRef = useRef<number | null>(null);
  const lastIntervalTriggerRef = useRef<number | null>(null);

  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    isFinishedRef.current = isFinished;
    showMotivationalDialogRef.current = showMotivationalDialog;
  }, [isFinished, showMotivationalDialog]);

  // Control Background Audio
  useEffect(() => {
    if (syncComplete) {
      controlBackgroundAudio(!isPaused && !isFinished);
    }
  }, [isPaused, isFinished, syncComplete, controlBackgroundAudio]);

  useEffect(() => {
    return () => {
      controlBackgroundAudio(false);
    };
  }, [controlBackgroundAudio]);

  // Monitor Co-op Partner Session
  useEffect(() => {
    if (!profileData?.coWorkerId || !db) return;
    try {
        const unsub = onSnapshot(doc(db, "users", profileData.coWorkerId), (snap) => {
          if (snap.exists()) {
            setPeerData(snap.data() as UserProfile);
          }
        }, (error) => {
            console.error("Failed to sync coworker presence:", error);
        });
        return () => unsub();
    } catch (e) {
        console.warn("Could not establish coworker presence listener", e);
    }
  }, [profileData?.coWorkerId]);

  // Real-time Presence
  useEffect(() => {
     updateUserProfileData({ 
        currentTaskStatus: taskName, 
        isOnline: true
     });
     return () => {
         // Silently clear presence when navigating away
         updateUserProfileData({ 
            currentTaskStatus: "Reviewing metrics...", 
            isOnline: false
         });
     };
  }, [taskName, updateUserProfileData]);

  useEffect(() => {
    const saved = localStorage.getItem('deadlinesmet_offline_notifications');
    setOfflineNotificationsEnabled(saved === 'true');
  }, []);

  const handleSkipTask = useCallback(() => {
    const currentIndex = userRoutine.findIndex(t => t.name.toLowerCase() === taskName.toLowerCase());
    const nextTask = currentIndex !== -1 && currentIndex < userRoutine.length - 1 ? userRoutine[currentIndex + 1] : null;
    
    clearTimer();
    setFlashState('none');
    if (session) {
      updateSession({ status: "finished" });
    }
    updateUserProfileData({
      currentTaskStatus: "Idle",
      activeSession: null
    });

    if (nextTask) {
      toast({
        title: "Task Skipped ⏭️",
        description: `Moving to next task: ${nextTask.name}`,
      });
      const params = new URLSearchParams({
        task: nextTask.name,
        duration: String(nextTask.duration),
      });
      if (nextTask.category) params.set("category", nextTask.category);
      
      let colorVal = undefined;
      if (nextTask.category && presetTasks[nextTask.category]?.color) {
        const colorClassMatch = presetTasks[nextTask.category].color.match(/bg-[a-z]+-\d+/);
        if (colorClassMatch && colorClassMatch[0]) {
          colorVal = colorClassMatch[0];
        }
      }
      if (colorVal) params.set("color", colorVal);
      
      router.push(`/timer?${params.toString()}`);
    } else {
      toast({
        title: "No more tasks 🏁",
        description: "Returning to home screen.",
      });
      router.push("/");
    }
  }, [taskName, userRoutine, session, updateSession, clearTimer, router, toast, presetTasks]);

  // Sync Hydration Audio with play state and volume settings
  useEffect(() => {
    if (syncComplete && isHydrationTask) {
      if (!isPaused && !isFinished && isAmbientEnabled) {
        startHydrationAudio();
        const diff = timeRemainingRef.current;
        const fadeFactor = Math.min(1.0, diff / 15.0);
        setHydrationVolume(fadeFactor * ambientVolume[0]);
      } else {
        stopHydrationAudio();
      }
    }
    return () => {
      stopHydrationAudio();
    };
  }, [isPaused, isFinished, syncComplete, isHydrationTask, isAmbientEnabled, ambientVolume, startHydrationAudio, stopHydrationAudio, setHydrationVolume]);

  // Sync Breathing Audio & State Machine
  useEffect(() => {
    if (syncComplete && isBreathingTask) {
      if (!isPaused && !isFinished) {
        initBreathingAudio();
      } else {
        stopBreathingAudio();
      }
    }
    return () => {
      stopBreathingAudio();
    };
  }, [isPaused, isFinished, syncComplete, isBreathingTask, initBreathingAudio, stopBreathingAudio]);

  // Breathing Phase Pacer (ticks every 4 seconds)
  useEffect(() => {
    if (!isBreathingTask || isPaused || isFinished || timeRemainingRef.current <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setBreathingPhase((prev) => {
        if (prev === 'inhale') return 'hold';
        if (prev === 'hold') return 'exhale';
        return 'inhale';
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isBreathingTask, isPaused, isFinished]);

  // Handle Breathing Audio & Haptics Transitions
  useEffect(() => {
    if (!isBreathingTask || isPaused || isFinished) {
      return;
    }

    // Play breathing audio chimes
    playBreathingChime(breathingPhase);

    // Trigger native hardware haptic patterns
    if (breathingPhase === 'inhale') {
      triggerHaptic(150); // Single medium pulse (150ms) for inhalation
    } else if (breathingPhase === 'hold') {
      triggerHaptic([80, 100, 80]); // Double quick pulse for holding
    } else if (breathingPhase === 'exhale') {
      triggerHaptic(350); // Single longer pulse (350ms) for exhalation
    }
  }, [isBreathingTask, isPaused, isFinished, breathingPhase, playBreathingChime, triggerHaptic]);

  // Sync Eye Exercise Audio
  useEffect(() => {
    if (syncComplete && isEyeExerciseTask) {
      if (!isPaused && !isFinished) {
        initEyeAudio();
      } else {
        stopEyeAudio();
      }
    }
    return () => {
      stopEyeAudio();
    };
  }, [isPaused, isFinished, syncComplete, isEyeExerciseTask, initEyeAudio, stopEyeAudio]);

  // Eye Exercise Phase Pacer
  useEffect(() => {
    if (!isEyeExerciseTask || isPaused || isFinished || timeRemainingRef.current <= 0) {
      return;
    }

    const phases: ('look-up' | 'look-down' | 'look-left' | 'look-right' | 'roll' | 'blink' | 'focus-near-far' | 'close-eyes')[] = [
      'look-up', 'look-down', 'look-left', 'look-right', 'roll', 'blink', 'focus-near-far', 'close-eyes'
    ];

    const getPhaseDuration = (phase: string) => {
      return phase === 'close-eyes' ? 12000 : 6000;
    };

    let timerId: any = null;

    const runPacer = (currentPhase: typeof eyePhase) => {
      const duration = getPhaseDuration(currentPhase);
      
      timerId = setTimeout(() => {
        setEyePhase((prev) => {
          const currentIndex = phases.indexOf(prev);
          const nextIndex = (currentIndex + 1) % phases.length;
          const nextPhase = phases[nextIndex];
          runPacer(nextPhase);
          return nextPhase;
        });
      }, duration);
    };

    runPacer(eyePhase);

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isEyeExerciseTask, isPaused, isFinished, eyePhase]);

  // Handle Eye Exercise Audio & Haptics Transitions
  useEffect(() => {
    if (!isEyeExerciseTask || isPaused || isFinished) {
      return;
    }

    // Play synthesized stereo-panned sound cue or drone
    playEyeChime(eyePhase);

    // Trigger physical haptic guidance patterns
    if (eyePhase === 'look-up') {
      triggerHaptic(100); // 1 short pulse
    } else if (eyePhase === 'look-down') {
      triggerHaptic([100, 100, 100]); // 3 short pulses
    } else if (eyePhase === 'look-left') {
      triggerHaptic(180); // 1 medium pulse
    } else if (eyePhase === 'look-right') {
      triggerHaptic([180, 100, 180]); // 2 medium pulses
    } else if (eyePhase === 'roll') {
      triggerHaptic(500); // 1 long sweeping vibration
    } else if (eyePhase === 'blink') {
      triggerHaptic([50, 50, 50, 50, 50, 50]); // rapid flutter
    } else if (eyePhase === 'focus-near-far') {
      triggerHaptic([100, 300, 100]); // alternating focus pulses
    } else if (eyePhase === 'close-eyes') {
      triggerHaptic([300, 150, 300]); // double grounding pulse
    }
  }, [isEyeExerciseTask, isPaused, isFinished, eyePhase, playEyeChime, triggerHaptic]);

  const cancelScheduledNotification = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CANCEL_TIMER' });
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications({ tag: 'timer-done' });
      notifications.forEach(n => n.close());
    } catch (e) {}
  }, []);

  const showCompletionNotification = useCallback(async (isScheduled = false) => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;

    const notificationOptions: any = {
      body: `Time's up! You've finished: ${taskName}`,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: "timer-done",
      vibrate: [300, 100, 300],
      data: {
        url: window.location.href.includes('?') ? `${window.location.href}&from_notification=true` : `${window.location.href}?from_notification=true`,
        type: "TIMER",
      },
      requireInteraction: true,
    };

    if (isScheduled) {
      const triggerTime = Date.now() + (timeRemainingRef.current * 1000);
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SCHEDULE_TIMER',
          taskName: taskName,
          endTime: triggerTime
        });
      }

      const isTriggerSupported = typeof window !== 'undefined' && 'Notification' in window && 'showTrigger' in Notification.prototype;
      if (offlineNotificationsEnabled && isTriggerSupported && typeof (window as any).TimestampTrigger !== 'undefined') {
        try {
          // @ts-ignore
          notificationOptions.showTrigger = new (window as any).TimestampTrigger(triggerTime);
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification("Session Complete!", notificationOptions);
        } catch (e) {
          console.warn("Native TimestampTrigger failed", e);
        }
      }
      return;
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification("Session Complete!", notificationOptions);
        return;
      }
    } catch (e) {
      console.warn("Service worker showNotification fallback", e);
    }

    try {
      new Notification("Session Complete!", notificationOptions);
    } catch (fallbackErr) {
      console.warn("Notification constructor fallback failed", fallbackErr);
    }
  }, [taskName, offlineNotificationsEnabled]);

  // Handle initialization and global side effects once
  useEffect(() => {
    setCurrentDate(new Date());
    const dateInterval = setInterval(() => setCurrentDate(new Date()), 1000);

    if (document.body) document.body.style.overflow = 'hidden';

    let wakeLock: any = null;
    let fallbackVideo: HTMLVideoElement | null = null;
    
    const requestWakeLock = async () => {
      try {
        if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    };

    requestWakeLock();

    // Universal Fallback: A silent tiny mp4 video loops constantly to prevent sleep (mimics NoSleep.js)
    try {
      if (typeof document !== 'undefined') {
        fallbackVideo = document.createElement('video');
        fallbackVideo.setAttribute('playsinline', '');
        fallbackVideo.setAttribute('muted', '');
        fallbackVideo.muted = true;
        fallbackVideo.loop = true;
        fallbackVideo.src = "data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGp21kYXQAAAKzBgX//5xwFf//eAwwAAAAHAAA/xAAAAAAAP8QAAAAAAAx3QAAAAAx3QAAAAEAAABCAAEA4AAAAIIfgIggFBAgIQQB//8ABgAAAAIAAIAAAAAAGgP/LAAAAAABAAAAbEAAAACCA4CEICQgJCEEAf//AAYAAAACAAACAAAAABoD/ywAAAAAAQAAAGxAAAAAggOAhCAkICQhBAH//wAGAAAAAgAAAwAAAAAaA/8sAAAAAAEAAABsQAAAAIIDgIQgJCAkIQQB//8ABgAAAAIAAAQAAAAAGgP/LAAAAAABAAAAbEAAAACCA4CEICQgJCEEAf//AAYAAAACAAAFAAAAABoD/ywAAAAAAQAAAGxAAAAAggOAhCAkICQhBAH//wAGAAAAAgAABgAAAAAaA/8sAAAAAAEAAABsQAAAAIIDgIQgJCAkIQQB//8ABgAAAAIAAAcAAAAAGgP/LAAAAAABAAAAbEAAAACCA4CEICQgJCEEAf//AAYAAAACAAAIAAAAABoD/ywAAAAAAQAAAGxAAAAAggOAhCAkICQhBAH//wAGAAAAAgAACQAAAAAaA/8sAAAAAAEAAABsQAAAAIIDgIQgJCAkIQQB//8ABgAAAAIAAAoAAAAAGgP/LAAAAAABAAAAbEAAAACCA4CEICQgJCEEAf//AAYAAAACAAALAAAAABoD/ywAAAAAAQAAAGxAAAAAggOAhCAkICQhBAH//wAGAAAAAgAADDkAAAAAGgP/LAAAAAABAAAAbEAAAACCA4CEICQgJCEEAf//AAYAAAACAAANAAAAABoD/ywAAAAAAQAAAGxAAAAAggOAhCAkICQhBAH//wAGAAAAAgAADgAAAAAaA/8sAAAAAAEAAABsQAAAAIIDgIQgJCAkIQQB//8ABgAAAAIAAA8AAAAAGgP/LAAAAAABAAAAbEAAAABAAG1vb3YAAABsbXZoZAAAAAD2O+m99jvpvQAAA+gAAAAZAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAABidHJhawAAAFx0a2hkAAAAAfY76b32O+m9AAAAAQAAAAAAAABsAAAAAAAAAAAAAAAAAQAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAeZWR0cwAAABxlbHN0AAAAAAAAAAEAAAAsAAAAAQABAAAAAABsbWRpYQAAACBtZGhkAAAAAPY76b32O+m9AAAAHAAAAAAAABcQAAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAASeG1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAALZzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAEAAQASAAAAASBBAP7/gAAAAAAAAAAAAAAAB2F2Y0MBAMAg/++ECAgIAABABAAAOAAAAAAAR+PMAAH2oQAAAAAhzdHRzAAAAAAAAAAEAAAANAAAAAQAAABxzdHNjAAAAAAAAAAEAAAABAAANAAAAAQAAADRzdHN6AAAAAAAAAAAAAAANAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAEAAAABQHN0Y28AAAAAAAAAAQAAACg=";
        
        const playFallback = () => {
          if (fallbackVideo && fallbackVideo.paused) {
            fallbackVideo.play().catch(e => console.warn('Silent video wake lock blocked:', e));
          }
        };

        playFallback();
        // Bind to interactions to ensure it plays if autoplay was blocked
        document.addEventListener('touchstart', playFallback, { once: true });
        document.addEventListener('click', playFallback, { once: true });
        document.addEventListener('mousemove', playFallback, { once: true });
      }
    } catch(e) {
      console.warn("Fallback video setup failed", e);
    }

    const handleVisibilityChangeForWakeLock = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
        if (fallbackVideo && fallbackVideo.paused) {
          fallbackVideo.play().catch(e => console.warn('Silent video wake lock play failed visually:', e));
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChangeForWakeLock);

    return () => {
      clearInterval(dateInterval);
      if (document.body) document.body.style.overflow = 'auto';
      if (wakeLock !== null && typeof wakeLock.release === 'function') {
        wakeLock.release().catch(() => { });
      }
      if (fallbackVideo) {
        fallbackVideo.pause();
        fallbackVideo.src = '';
      }
      document.removeEventListener('visibilitychange', handleVisibilityChangeForWakeLock);
    };
  }, []);

    const hasInitializedRef = useRef(false);
    const lastInitKeyRef = useRef<string | null>(null);
    const lastSyncedSessionSnapshotRef = useRef<string | null>(null);

    // Handle initialization and sync with global state
    useEffect(() => {
        // WAIT until the global context is initialized from localStorage before deciding
        if (!isInitialized) return;

        try {
            const targetCoOpSessionId = resolvedCoOpSessionId || undefined;
            const currentInitKey = `${taskName}_${effectiveDuration}_${targetCoOpSessionId || ''}_${expectedEndTime || ''}`;

            // Avoid re-initializing if we already initialized this exact task session
            if (hasInitializedRef.current && lastInitKeyRef.current === currentInitKey) {
                setSyncComplete(true);
                return;
            }

            setFlashState('none');
            setTaskCategory(category);
            
            // START our persistent global background timer when the page mounts!
            // But ONLY if one isn't already running for this task or if the task changed
            const activeCoOpSessionId = activeTimer?.coOpSessionId || undefined;
            const isExpired = activeTimer && (
              activeTimer.isPaused 
                ? (activeTimer.timeLeftWhenPaused !== undefined && activeTimer.timeLeftWhenPaused <= 0)
                : (activeTimer.expectedEndTime && activeTimer.expectedEndTime <= Date.now())
            );

            if (forceRestart || !activeTimer || activeTimer.taskName !== taskName || activeCoOpSessionId !== targetCoOpSessionId || isExpired) {
              const seconds = Math.round(effectiveDuration * 60);
              const computedEndTime = (expectedEndTime && expectedEndTime > Date.now())
                ? expectedEndTime
                : (Date.now() + seconds * 1000);
              const initialRemaining = Math.max(1, Math.round((computedEndTime - Date.now()) / 1000));

              timeRemainingRef.current = initialRemaining;
              expectedEndTimeRef.current = computedEndTime;

              startTimer({
                taskName,
                initialDuration: effectiveDuration,
                category,
                color,
                expectedEndTime: computedEndTime,
                coOpSessionId: targetCoOpSessionId
              });
              setTimeRemaining(initialRemaining);
              setIsPaused(false);
              setIsFinished(false);
              showCompletionNotification(true); // Schedule it!

              updateUserProfileData({
                currentTaskStatus: taskName,
                isOnline: true,
                activeSession: {
                  taskName,
                  duration: effectiveDuration,
                  expectedEndTime: computedEndTime,
                  isPaused: false,
                  category: category || "",
                  color: color || "",
                  coOpSessionId: targetCoOpSessionId || "",
                  timeLeftWhenPaused: null
                }
              });

              if (targetCoOpSessionId) {
                updateSession({
                  status: "running",
                  isPaused: false,
                  startTime: Date.now(),
                  expectedEndTime: computedEndTime,
                  timeLeftWhenPaused: null
                });
              }
            } else {
              // RESTORE from active timer
              setIsPaused(activeTimer.isPaused);
              setIsFinished(false);
              let rem = Math.round(effectiveDuration * 60);
              if (activeTimer.isPaused && activeTimer.timeLeftWhenPaused !== undefined) {
                rem = activeTimer.timeLeftWhenPaused;
                timeRemainingRef.current = rem;
                expectedEndTimeRef.current = null;
                setTimeRemaining(rem);
              } else if (activeTimer.expectedEndTime) {
                const diff = Math.max(0, Math.round((activeTimer.expectedEndTime - Date.now()) / 1000));
                rem = diff;
                timeRemainingRef.current = diff;
                expectedEndTimeRef.current = activeTimer.isPaused ? null : activeTimer.expectedEndTime;
                setTimeRemaining(diff);
                if (!activeTimer.isPaused) showCompletionNotification(true); // Re-schedule it!
              }

              updateUserProfileData({
                currentTaskStatus: taskName,
                isOnline: true,
                activeSession: {
                  taskName,
                  duration: effectiveDuration,
                  expectedEndTime: activeTimer.expectedEndTime || (Date.now() + rem * 1000),
                  isPaused: activeTimer.isPaused,
                  category: category || "",
                  color: color || "",
                  coOpSessionId: targetCoOpSessionId || "",
                  timeLeftWhenPaused: activeTimer.isPaused ? rem : null
                }
              });
            }
            hasInitializedRef.current = true;
            lastInitKeyRef.current = currentInitKey;
            setSyncComplete(true);
        } catch (e) {
            console.error("Timer initialization failed:", e);
            setSyncComplete(true); // Allow UI to show even if recovery happened
        }
    }, [taskName, effectiveDuration, category, color, startTimer, isInitialized, expectedEndTime, resolvedCoOpSessionId, forceRestart]);

    // CO-OP SYNC ENGINE
    useEffect(() => {
        if (!session || !resolvedCoOpSessionId || session.id !== resolvedCoOpSessionId || session.taskName !== taskName || !syncComplete || !user) return;

        // Auto-start session if it is still waiting while local timer is running
        if (session.status === "waiting" && !isPaused && session.createdBy === user.uid) {
            const currentExpected = expectedEndTimeRef.current || (Date.now() + timeRemainingRef.current * 1000);
            updateSession({
                status: "running",
                isPaused: false,
                expectedEndTime: currentExpected,
                startTime: Date.now()
            });
            return;
        }

        const snapshotKey = `${session.id}_${session.status}_${session.isPaused}_${session.expectedEndTime}_${session.timeLeftWhenPaused}_${session.lastActionBy}_${session.lastActionAt?.toMillis?.() || session.lastActionAt?.seconds || ''}`;
        if (lastSyncedSessionSnapshotRef.current === snapshotKey) return;
        lastSyncedSessionSnapshotRef.current = snapshotKey;

        // ONLY sync if the change did NOT originate from this user's current device action
        if (!session.lastActionBy || session.lastActionBy !== user.uid) {
            // Update local state from shared session
            if (session.isPaused !== isPaused) {
                setIsPaused(session.isPaused);
                updateTimer({ isPaused: session.isPaused }, session.timeLeftWhenPaused || undefined);

                updateUserProfileData({
                    activeSession: {
                        taskName,
                        duration: effectiveDuration,
                        expectedEndTime: session.expectedEndTime || (Date.now() + (session.timeLeftWhenPaused || timeRemainingRef.current) * 1000),
                        isPaused: session.isPaused,
                        category: category || "",
                        color: color || "",
                        coOpSessionId: session.id,
                        timeLeftWhenPaused: session.isPaused ? (session.timeLeftWhenPaused || timeRemainingRef.current) : null
                    }
                });
            }

            if (session.status === "running" && session.expectedEndTime && session.expectedEndTime > Date.now()) {
                const diff = Math.max(0, Math.round((session.expectedEndTime - Date.now()) / 1000));
                if (Math.abs(diff - timeRemainingRef.current) > 1) { // Drift correction
                    timeRemainingRef.current = diff;
                    setTimeRemaining(diff);
                    updateTimer({ isPaused: false, expectedEndTime: session.expectedEndTime }, diff);
                }
                expectedEndTimeRef.current = session.expectedEndTime;
            } else if (session.status === "waiting" && session.isPaused) {
                if (session.timeLeftWhenPaused !== undefined && session.timeLeftWhenPaused !== null && session.timeLeftWhenPaused > 0) {
                    timeRemainingRef.current = session.timeLeftWhenPaused;
                    setTimeRemaining(session.timeLeftWhenPaused);
                    updateTimer({ isPaused: true, timeLeftWhenPaused: session.timeLeftWhenPaused }, session.timeLeftWhenPaused);
                }
                expectedEndTimeRef.current = null;
            } else if (session.status === "finished" && !isFinishedRef.current) {
                setIsFinished(true);
                setFlashState('none');
                expectedEndTimeRef.current = null;
                clearTimer();
                updateUserProfileData({
                    currentTaskStatus: "Idle",
                    activeSession: null
                });
            }
        }
    }, [session, resolvedCoOpSessionId, syncComplete, user, isPaused, updateTimer, clearTimer, taskName, effectiveDuration, category, color, updateUserProfileData, updateSession]);

  // Main stable timer engine resilient to background throttling
  useEffect(() => {
    if (!syncComplete) return;

    if (isPaused || isFinished || timeRemainingRef.current <= 0) {
      expectedEndTimeRef.current = null;
      return;
    }

    if (!expectedEndTimeRef.current || expectedEndTimeRef.current <= Date.now()) {
      expectedEndTimeRef.current = Date.now() + timeRemainingRef.current * 1000;
    }

    const interval = setInterval(() => {
      if (!expectedEndTimeRef.current) return;
      const now = Date.now();
      const difference = Math.max(0, Math.round((expectedEndTimeRef.current - now) / 1000));

      timeRemainingRef.current = difference;
      setTimeRemaining(difference);

      if (isHydrationTask) {
        try {
          const fadeFactor = Math.min(1.0, difference / 15.0);
          setHydrationVolume(fadeFactor);
        } catch {}
      }

      // Task 3: Interval Alerts - wrap checks within steady interval loops
      if (focusInterval && difference > 0 && expectedEndTimeRef.current) {
        const elapsedSeconds = Math.round(effectiveDuration * 60) - difference;
        const intervalSeconds = focusInterval * 60;
        const currentIntervalIndex = Math.floor(elapsedSeconds / intervalSeconds);
        
        // Trigger exact once when the interval milestone passes
        if (currentIntervalIndex > 0 && currentIntervalIndex !== lastIntervalTriggerRef.current && elapsedSeconds >= currentIntervalIndex * intervalSeconds) {
            lastIntervalTriggerRef.current = currentIntervalIndex;
            playTick(); // Play a distinct chime
            triggerHaptic([100]); // Interval reminder vibration
            setFlashState('three-times');
            setTimeout(() => setFlashState('none'), 3000);
        }
      }

      if (difference <= 0) {
        setIsFinished(true);
        setFlashState('continuous');
        playFinish();
        triggerHaptic([300, 100, 300]); // Expiration Burst vibration
        showCompletionNotification(false); // Immediate one
        clearTimer(); // End background tracking
        if (session) {
          updateSession({ status: "finished" });
        }
        updateUserProfileData({
          currentTaskStatus: "Idle",
          activeSession: null
        });
      } else if (difference <= 10 && difference > 0) {
        // Activate continuous tense flashing in the last 10 seconds
        if (difference <= 10) setFlashState('continuous');
        // Tick each second for the final countdown - ensure it only plays once per second
        if (lastTickRef.current !== difference) {
            lastTickRef.current = difference;
            playTick();
            
            // Rhythmic heartbeat [100, 400, 100, 400] when exactly 10 seconds remain
            if (difference === 10) {
              triggerHaptic([100, 400, 100, 400]);
            } else if (difference < 10) {
              triggerHaptic([100]);
            }
        }
      } else if (difference <= 11 && difference > 10) {
        setFlashState('none');
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPaused, isFinished, playFinish, playTick, showCompletionNotification, syncComplete, clearTimer, taskName, effectiveDuration]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isPaused && !isFinished && expectedEndTimeRef.current) {
        const now = Date.now();
        const difference = Math.max(0, Math.round((expectedEndTimeRef.current - now) / 1000));
        setTimeRemaining(difference);
        if (difference <= 0) {
          setIsFinished(true);
          setFlashState('continuous');
          playFinish();
          showCompletionNotification(false);
          clearTimer();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isPaused, isFinished, playFinish, showCompletionNotification, clearTimer]);

  useEffect(() => {
    // Disable scrolling on the body when the timer is active
    if (document.body) document.body.style.overflow = 'hidden';

    // Re-enable scrolling when the component unmounts
    return () => {
      if (document.body) document.body.style.overflow = 'auto';
    };
  }, []);

  const handleEndEarly = () => {
    setIsPaused(true);
    setIsFinished(true);
    if (session) {
      updateSession({ status: "finished", isPaused: true });
    }
    updateUserProfileData({
      currentTaskStatus: "Idle",
      activeSession: null
    });
  };

  const handleStartSuggestedTask = () => {
    if (!suggestedTask) return;
    
    // 1. Find the task in the user's routine to get its actual duration and category/color
    let matchedTask: any = userRoutine.find(
      (t) => t.name.toLowerCase() === suggestedTask.toLowerCase()
    );

    let durationVal = "25";
    let categoryVal = category; // default to current category if any
    let colorVal = color; // default to current color if any

    // 2. Secondary fallback: Search in all default routines if not found in local userRoutine
    if (!matchedTask) {
      for (const profile in defaultRoutines.routines) {
        const taskList = defaultRoutines.routines[profile as any];
        const found = taskList.find(
          (t) => t.name.toLowerCase() === suggestedTask.toLowerCase()
        );
        if (found) {
          matchedTask = found;
          break;
        }
      }
    }

    if (matchedTask) {
      durationVal = String(matchedTask.duration);
      categoryVal = matchedTask.category || category;
      
      // Resolve color class from presetTasks if available, else try categoryConfig fallback
      if (matchedTask.category) {
        let colorAssigned = false;
        if (presetTasks[matchedTask.category]) {
          const categoryData = presetTasks[matchedTask.category];
          if (categoryData && categoryData.color) {
            const colorClassMatch = categoryData.color.match(/bg-[a-z]+-\d+/);
            if (colorClassMatch && colorClassMatch[0]) {
              colorVal = colorClassMatch[0];
              colorAssigned = true;
            }
          }
        }
        if (!colorAssigned && categoryConfig[matchedTask.category]) {
          const colorClassMatch = categoryConfig[matchedTask.category].color.match(/bg-[a-z]+-\d+/);
          if (colorClassMatch && colorClassMatch[0]) {
            colorVal = colorClassMatch[0];
          }
        }
      }
    } else {
      // 3. Intelligent fallback for common wellness / hydration tasks
      const nameLower = suggestedTask.toLowerCase();
      if (nameLower.includes("glass of water") || nameLower === "drink a glass of water") {
        durationVal = "1";
        categoryVal = "Hydration";
      } else if (nameLower.includes("water") || nameLower.includes("hydration") || nameLower.includes("hydrate") || nameLower.includes("drink")) {
        durationVal = "5";
        categoryVal = "Hydration";
      } else if (nameLower.includes("stretch") || nameLower.includes("breathe") || nameLower.includes("meditat") || nameLower.includes("eye")) {
        durationVal = "5";
        categoryVal = "Health & Wellness";
      }
    }

    const params = new URLSearchParams({
      task: suggestedTask,
      duration: durationVal,
    });
    
    if (categoryVal) {
      params.set("category", categoryVal);
    }
    if (colorVal) {
      params.set("color", colorVal);
    }

    // Explicitly hide the dialog and ensure no more home redirect happens.
    // By setting this to false here, we prevent handleMotivationalDialogChange 
    // from potentially being called by Radix with the home redirect side effect.
    setShowMotivationalDialog(false);
    router.push(`/timer?${params.toString()}`);
  }

  const handleInteraction = () => {
    showUI();
    ensureAudioInitialized();
  };

  const handleSaveTask = async (completed: boolean) => {
    setIsFinished(false);
    clearTimer();
    setFlashState('none');
    if (session) {
      updateSession({ status: "finished" });
    }
    updateUserProfileData({
      currentTaskStatus: "Idle",
      activeSession: null
    });
    const timeSpentInSeconds = Math.round(effectiveDuration * 60) - timeRemaining;
    const actualDuration = Math.max(1, Math.round(timeSpentInSeconds / 60));

    const finalCategory = getTaskCategoryDetails(taskName, profileData?.profile || "General").mainCategory;

    let finalCompleted = completed;
    let earnedCoins = 0;
    let isFalse = false;

    if (completed) {
       // False entry logic
       if (timeSpentInSeconds < 10) {
           isFalse = true;
           finalCompleted = false;
           alert("False Entry Detected: Completion time was unnaturally fast. No rewards added.");
       } else {
           // Task 3: Granular lifestyle disciplines scoring matrix
           let baseCoins = 15; // default fallback
           const catLower = (finalCategory || '').toLowerCase();
           if (catLower === 'productivity') {
               baseCoins = 50;
           } else if (catLower === 'fitness') {
               baseCoins = 40;
           } else if (catLower === 'meditation') {
               baseCoins = 30;
           } else if (catLower === 'creativity') {
               baseCoins = 30;
           } else if (catLower === 'hydration') {
               baseCoins = 15;
           } else if (catLower === 'hygiene') {
               baseCoins = 15;
           }
           earnedCoins = baseCoins;
       }
    }

    const newTask: Omit<Task, 'id' | 'createdAt' | 'userId'> = {
      name: taskName,
      duration: actualDuration,
      initialDuration: effectiveDuration,
      completed: finalCompleted,
      category: finalCategory,
      earnedCoins: earnedCoins,
      isFalseEntry: isFalse,
    };

    if (finalCompleted && earnedCoins > 0) {
       // Optimistic daily coins cache write
       try {
           const { getLocalDateString, getCachedDailyCoins, setCachedDailyCoins } = require('@/lib/dailyCoins');
           const todayStr = getLocalDateString();
           const { amount: cachedAmount } = getCachedDailyCoins();
           setCachedDailyCoins(cachedAmount + earnedCoins, todayStr);
       } catch (e) {
           console.warn("Failed to write daily coins optimistically", e);
       }
    }

    try {
        await addTask(newTask);
    } catch (e) {
        console.error("Failed to save task to history:", e);
    }

    if (finalCompleted) {
      setIsLoadingAI(true);
      setShowMotivationalDialog(true);
      
      // In-App Reward dynamic toast
      toast({
        title: "Task Conquered! 🎉",
        description: `+${earnedCoins} Slake Coins Rewarded for this task!`,
        className: "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-bold rounded-2xl border-none shadow-2xl shadow-orange-500/20",
      });

      // Let's also update profile credits live so it feels immediate
      if (profileData && earnedCoins > 0) {
         updateUserProfileData({ slakeCredits: (profileData.slakeCredits || 0) + earnedCoins });
      }
      try {
        const pastTasks = tasks.slice(0, 5).map(t => ({ taskName: t.name, duration: t.duration, completionStatus: t.completed }));
        const now = new Date();
        const localHour = now.getHours() + now.getMinutes() / 60;
        const result = await generateMotivationalMessage({
          taskName: newTask.name,
          duration: newTask.duration,
          completionStatus: true,
          userRoutine: userRoutine,
          pastTasks: pastTasks,
          currentCategory: newTask.category,
          localTime: now.toISOString(),
          localHour: localHour,
        });
        setMotivationalMessage(result.message);
        setSuggestedTask(result.suggestedNextTask);
      } catch (error: any) {
        console.warn("AI generation error (likely quota limit):", error.message);
        // Silently fallback to a simple success state
        setMotivationalMessage("Great job finishing your task! Keep up the momentum!");
        setSuggestedTask(undefined);
      } finally {
        setIsLoadingAI(false);
      }
    } else {
      router.push("/");
    }
  };

  const handleMotivationalDialogChange = (open: boolean) => {
    setShowMotivationalDialog(open);
    if (!open) {
      router.push('/');
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const totalSeconds = Math.round(effectiveDuration * 60);
  const progress = totalSeconds > 0 ? (timeRemaining / totalSeconds) * 100 : 0;
  const timerColor = 'hsl(var(--primary))';

  const hour = currentDate ? currentDate.getHours() : 12;
  const isNight = hour < 6 || hour > 19;
  const WeatherIcon = weatherData ? getWeatherIcon(weatherData.code, isNight) : Cloud;

  const InfoDisplay = () => (
    <div className="flex items-center gap-3 sm:gap-6 text-foreground/90 scale-90 sm:scale-100 origin-top">
      <div className="flex flex-col items-center">
        <span className="text-2xl sm:text-3xl font-bold font-headline">{currentDate ? format(currentDate, 'p') : '--:--'}</span>
        <span className="text-xs sm:text-sm uppercase tracking-widest opacity-60">{currentDate ? format(currentDate, 'EEEE, MMM d') : '---'}</span>
      </div>
      {weatherData && (
        <div className="flex items-center gap-2 pl-3 sm:pl-6 border-l border-white/20">
          <WeatherIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <div className="flex flex-col">
            <span className="text-xl font-bold">{weatherData.temp}°</span>
            <span className="text-[10px] sm:text-xs uppercase opacity-70 tracking-tighter max-w-[80px] sm:max-w-none truncate">{location}</span>
          </div>
        </div>
      )}
    </div>
  );


  const CoOpDisplay = () => {
    if (!peerData) return null;
    return null; // For now, hidden but kept for logic
  };

  const isContinuousFlashing = flashState === 'continuous' || (isFinished && timeRemaining <= 0 && !showMotivationalDialog);

  return (
    <main
      onClick={handleInteraction}
      onMouseMove={handleInteraction}
      className={cn(
        "dark relative flex min-h-screen w-full flex-col items-center justify-start p-4 sm:p-6 md:p-8 transition-all duration-300 ease-in-out text-white bg-[#0c0d0e] overflow-hidden",
        flashState === "three-times" && "border-emerald-500/80 ring-4 ring-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.35)]"
      )}
      style={{
        '--timer-primary-color': timerColor,
        '--flash-color': isContinuousFlashing 
          ? 'hsl(0 0% 100% / 0.95)' 
          : 'hsl(var(--primary) / 0.45)',
      } as React.CSSProperties}
    >
      {/* Elegant ambient alert vignette / full bright breathing overlay */}
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-1000 ease-in-out opacity-0 z-0",
          {
            "animate-flash-continuous": isContinuousFlashing,
            "animate-flash-three-times": flashState === 'three-times',
            "animate-flash-breathing": flashState === 'breathing',
          }
        )}
        style={{
          background: isContinuousFlashing
            ? "radial-gradient(circle, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.9) 70%, #ffffff 100%)"
            : "radial-gradient(circle, hsl(var(--background) / 0.15) 0%, var(--flash-color) 70%, var(--flash-color) 100%)",
        }}
      />
      <CoOpDisplay />
      <div className={cn(
        "w-full max-w-4xl flex justify-center py-2 sm:py-4 transition-opacity duration-300 z-10",
        !isUIVisible && "opacity-30"
      )}>
        <InfoDisplay />
      </div>
      <div className="flex-1 flex w-full max-w-4xl flex-col items-center justify-center text-center py-2 sm:py-6">
        <h2 className="mb-2 text-sm sm:text-xl font-medium tracking-wide text-foreground/80 uppercase tracking-[0.2em] opacity-50"
            style={{ textShadow: isContinuousFlashing ? '0 2px 10px rgba(0,0,0,0.6)' : undefined }}>
          {category || 'Focus Session'}
        </h2>
        <h1 className={cn(
            "mb-8 font-bold tracking-tight text-foreground font-headline transition-all duration-300 px-4",
            taskName.length > 20 ? "text-3xl sm:text-5xl md:text-6xl" : "text-4xl sm:text-6xl md:text-7xl lg:text-8xl"
        )}
            style={{ textShadow: isContinuousFlashing ? '0 4px 20px rgba(0,0,0,0.8)' : undefined }}>
          {taskName}
        </h1>

        <div className="mb-12 flex flex-col items-center justify-center w-full">
          {!syncComplete ? (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
                <p className="text-xs mt-4 opacity-50 font-code tracking-widest">SYNCING SESSION...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full max-w-4xl px-4">
              {/* Floating Ambient Mindfulness Telemetry Capsule (Breathing & Eye Exercise) */}
              {isBreathingTask && (
                <div className="mb-6 inline-flex items-center gap-3 px-5 py-2 rounded-full border border-primary/25 bg-black/40 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-700 animate-in fade-in zoom-in-95">
                  <span className="relative flex h-2 w-2">
                    <span className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      breathingPhase === 'inhale' ? "bg-amber-400" : breathingPhase === 'hold' ? "bg-emerald-400" : "bg-sky-400"
                    )} />
                    <span className={cn(
                      "relative inline-flex rounded-full h-2 w-2",
                      breathingPhase === 'inhale' ? "bg-amber-400" : breathingPhase === 'hold' ? "bg-emerald-400" : "bg-sky-400"
                    )} />
                  </span>
                  <span className="font-bold tracking-[0.25em] uppercase font-mono text-xs text-primary">
                    {breathingPhase === "inhale" && "INHALE"}
                    {breathingPhase === "hold" && "HOLD"}
                    {breathingPhase === "exhale" && "EXHALE"}
                  </span>
                  <span className="text-primary/30">•</span>
                  <span className="text-xs font-medium text-foreground/90 tracking-wide">
                    {breathingPhase === 'inhale' && "Inhale slowly and deeply..."}
                    {breathingPhase === 'hold' && "Hold and find stillness..."}
                    {breathingPhase === 'exhale' && "Release all tension..."}
                  </span>
                </div>
              )}

              {isEyeExerciseTask && (
                <div className="mb-6 inline-flex items-center gap-3 px-5 py-2 rounded-full border border-amber-500/30 bg-black/50 backdrop-blur-xl shadow-[0_4px_30px_rgba(245,158,11,0.15)] transition-all duration-700 animate-in fade-in zoom-in-95">
                  <span className="relative flex h-2 w-2">
                    <span className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      eyePhase === 'close-eyes' ? "bg-emerald-400" : eyePhase === 'blink' ? "bg-sky-400" : "bg-amber-400"
                    )} />
                    <span className={cn(
                      "relative inline-flex rounded-full h-2 w-2",
                      eyePhase === 'close-eyes' ? "bg-emerald-400" : eyePhase === 'blink' ? "bg-sky-400" : "bg-amber-400"
                    )} />
                  </span>
                  <span className="font-bold tracking-[0.22em] uppercase font-mono text-xs text-amber-400">
                    {eyePhase === "look-up" && "LOOK UP"}
                    {eyePhase === "look-down" && "LOOK DOWN"}
                    {eyePhase === "look-left" && "LOOK LEFT"}
                    {eyePhase === "look-right" && "LOOK RIGHT"}
                    {eyePhase === "roll" && "ROLL EYES"}
                    {eyePhase === "blink" && "RAPID BLINK"}
                    {eyePhase === "focus-near-far" && "NEAR & FAR"}
                    {eyePhase === "close-eyes" && "REST & RECHARGE"}
                  </span>
                  <span className="text-amber-400/30">•</span>
                  <span className="text-xs font-medium text-amber-100/90 tracking-wide">
                    {eyePhase === "look-up" && "Gently elevate your gaze without straining..."}
                    {eyePhase === "look-down" && "Direct your line of sight comfortably down..."}
                    {eyePhase === "look-left" && "Sweep eyes left, relaxing the optic nerve..."}
                    {eyePhase === "look-right" && "Sweep eyes right, extending peripheral ease..."}
                    {eyePhase === "roll" && "Follow the smooth luminous orbit 360°..."}
                    {eyePhase === "blink" && "Rapid soft blinks to replenish natural tears..."}
                    {eyePhase === "focus-near-far" && "Shift focus between close detail and the horizon..."}
                    {eyePhase === "close-eyes" && "Close your eyelids and surrender all tension..."}
                  </span>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 w-full">
              {/* Specialized Task HUD Panel (Breathing Mandala or Sacred Eye Sanctuary) */}
              {(isBreathingTask || isEyeExerciseTask) && (
                <div className={cn(
                  "w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-[360px] lg:h-[360px] rounded-[2.5rem]",
                  "border border-amber-500/25 bg-gradient-to-b from-amber-500/[0.07] via-slate-950/80 to-black/90 backdrop-blur-2xl shadow-[0_12px_45px_rgba(0,0,0,0.6),0_0_40px_rgba(245,158,11,0.08)] flex flex-col items-center justify-center p-6 relative overflow-hidden transition-all duration-700"
                )}>
                  {/* Atmospheric Sacred Golden Halo Glow */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(245, 158, 11, 0.18) 0%, rgba(245, 158, 11, 0.04) 50%, transparent 75%)',
                      opacity: (isBreathingTask && breathingPhase === 'hold') || (isEyeExerciseTask && eyePhase === 'close-eyes') ? 1.0 : 0.7,
                      transform: (isBreathingTask && breathingPhase === 'hold') || (isEyeExerciseTask && eyePhase === 'focus-near-far') ? 'scale(1.25)' : 'scale(1.0)',
                      transition: 'all 3000ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />

                  {/* Concentric sacred geometry celestial rings */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div className="w-[85%] h-[85%] rounded-full border border-amber-400/30 border-dashed animate-[spin_60s_linear_infinite]" />
                    <div className="absolute w-[68%] h-[68%] rounded-full border border-amber-300/20" />
                    <div className="absolute w-[50%] h-[50%] rounded-full border border-amber-400/15 border-dotted animate-[spin_40s_linear_infinite_reverse]" />
                  </div>
                  
                  {isBreathingTask && (
                    <>
                      {/* Modern Flower Mandala Breathing Graphic with 100% Unobstructed Stage */}
                      <div className="relative w-full h-full flex items-center justify-center z-0 overflow-visible">
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                          {Array.from({ length: 12 }).map((_, i) => {
                            let translateY = 12;
                            let scale = 0.85;
                            let opacity = 0.18;
                            let rotateExtra = 0;

                            if (breathingPhase === 'inhale') {
                              translateY = 44;
                              scale = 1.35;
                              opacity = 0.7;
                              rotateExtra = 30;
                            } else if (breathingPhase === 'hold') {
                              translateY = 50;
                              scale = 1.45;
                              opacity = 0.9;
                              rotateExtra = 45;
                            } else if (breathingPhase === 'exhale') {
                              translateY = 12;
                              scale = 0.85;
                              opacity = 0.18;
                              rotateExtra = 0;
                            }

                            const angle = i * (360 / 12) + rotateExtra;

                            return (
                              <div
                                key={i}
                                className="absolute w-16 h-16 rounded-full"
                                style={{
                                  transform: `rotate(${angle}deg) translateY(-${translateY}px) scale(${scale})`,
                                  background: 'radial-gradient(circle at center, rgba(245, 222, 190, 0.35) 0%, rgba(245, 158, 11, 0.12) 60%, rgba(245, 158, 11, 0.02) 100%)',
                                  border: '1px solid rgba(245, 222, 190, 0.25)',
                                  mixBlendMode: 'screen',
                                  opacity: opacity,
                                  boxShadow: breathingPhase === 'hold' ? '0 0 20px rgba(245, 222, 190, 0.3)' : 'none',
                                  transition: 'all 4000ms cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Subtle Bottom Rhythm Indicator Dock */}
                      <div className="absolute bottom-5 inset-x-0 flex justify-center z-10 pointer-events-none">
                        <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/40 border border-primary/20 backdrop-blur-md text-[10px] font-mono tracking-widest text-primary/70 uppercase">
                          <span className={cn("w-1.5 h-1.5 rounded-full transition-colors duration-500", breathingPhase === 'inhale' ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" : "bg-white/20")} />
                          <span>IN</span>
                          <span className="text-white/20">•</span>
                          <span className={cn("w-1.5 h-1.5 rounded-full transition-colors duration-500", breathingPhase === 'hold' ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-white/20")} />
                          <span>HOLD</span>
                          <span className="text-white/20">•</span>
                          <span className={cn("w-1.5 h-1.5 rounded-full transition-colors duration-500", breathingPhase === 'exhale' ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" : "bg-white/20")} />
                          <span>OUT</span>
                        </div>
                      </div>
                    </>
                  )}

                  {isEyeExerciseTask && (
                    <>
                      {/* Ethereal Sacred Eye Sanctuary Graphic with 100% Optical Harmonics */}
                      <div className="relative w-full h-full flex items-center justify-center z-0 overflow-visible">
                        {/* Golden Harmonic Aura Flower behind eye */}
                        <div className="absolute w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center opacity-40 pointer-events-none">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-14 h-14 rounded-full"
                              style={{
                                transform: `rotate(${i * 45}deg) translateY(-26px) scale(${eyePhase === 'close-eyes' ? 1.25 : 0.95})`,
                                background: 'radial-gradient(circle at center, rgba(245, 222, 190, 0.28) 0%, rgba(245, 158, 11, 0.08) 70%, transparent 100%)',
                                border: '1px solid rgba(245, 222, 190, 0.2)',
                                mixBlendMode: 'screen',
                                transition: 'all 2000ms cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                            />
                          ))}
                        </div>

                        {/* Central Sacred Geometric Ocular Eye Shell */}
                        <div className="relative w-52 h-36 flex items-center justify-center">
                          {/* Outer Almond Vesica Piscis Aura Ring with Warm Glow */}
                          <div 
                            className={cn(
                              "absolute w-48 h-28 rounded-[50%/35%] border border-amber-300/40 bg-gradient-to-b from-amber-500/10 via-slate-950/70 to-black/90",
                              "shadow-[0_0_35px_rgba(245,158,11,0.22),inset_0_0_20px_rgba(245,158,11,0.12)] flex items-center justify-center overflow-hidden transition-all duration-700"
                            )}
                          >
                            {/* Inner Iris Guide Crosshair lines */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
                              <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-amber-300 to-transparent" />
                            </div>

                            {/* Eyelids Smooth Dynamic Curtains with Golden Crest Border */}
                            <div 
                              style={{
                                height: eyePhase === 'close-eyes' ? '51%' : eyePhase === 'blink' ? '30%' : '0%',
                                transition: 'height 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                              className="absolute top-0 left-0 right-0 bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/70 border-b-2 border-amber-400/60 z-30 shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                            />
                            <div 
                              style={{
                                height: eyePhase === 'close-eyes' ? '51%' : eyePhase === 'blink' ? '30%' : '0%',
                                transition: 'height 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-900 to-amber-950/70 border-t-2 border-amber-400/60 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.8)]"
                            />

                            {/* Iris & Pupil Core System */}
                            <div
                              style={{
                                transform: 
                                  eyePhase === 'look-up'
                                    ? 'translateY(-18px)'
                                    : eyePhase === 'look-down'
                                    ? 'translateY(18px)'
                                    : eyePhase === 'look-left'
                                    ? 'translateX(-28px)'
                                    : eyePhase === 'look-right'
                                    ? 'translateX(28px)'
                                    : 'translate(0, 0)',
                                scale: eyePhase === 'focus-near-far' ? 1.25 : 1.0,
                                transition: 'all 0.65s cubic-bezier(0.34, 1.4, 0.64, 1)',
                              }}
                              className={cn(
                                "w-20 h-20 rounded-full flex items-center justify-center relative z-10 transition-transform",
                                eyePhase === 'roll' && "animate-[spin_4s_linear_infinite]"
                              )}
                            >
                              {/* Outer Luminous Iris Petals / Sacred Crown */}
                              <div className="absolute inset-0 rounded-full border border-amber-300/60 bg-gradient-to-br from-amber-400/30 via-amber-600/20 to-black shadow-[0_0_25px_rgba(245,158,11,0.4)]" />
                              <div className="absolute inset-1.5 rounded-full border border-amber-200/30 border-dashed animate-[spin_20s_linear_infinite]" />

                              {/* Concentric Golden Radiance Rays */}
                              {Array.from({ length: 12 }).map((_, rIdx) => (
                                <div
                                  key={rIdx}
                                  className="absolute w-[1px] h-3 bg-gradient-to-t from-amber-300/60 to-transparent"
                                  style={{
                                    transform: `rotate(${rIdx * 30}deg) translateY(-8px)`,
                                  }}
                                />
                              ))}

                              {/* Pupil Orb with Specular Star Reflection */}
                              <div 
                                style={{
                                  scale: eyePhase === 'focus-near-far' ? 0.65 : eyePhase === 'close-eyes' ? 0.8 : 1.0,
                                  transition: 'scale 0.5s ease-in-out',
                                }}
                                className="w-8 h-8 rounded-full bg-gradient-to-b from-slate-950 to-black border-2 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.7),inset_0_0_8px_rgba(0,0,0,0.9)] relative flex items-center justify-center"
                              >
                                {/* Crystalline Specular Light Reflections */}
                                <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#ffffff] absolute top-[20%] left-[25%]" />
                                <div className="w-1 h-1 rounded-full bg-amber-200 opacity-80 absolute bottom-[25%] right-[25%]" />
                              </div>
                            </div>
                          </div>

                          {/* Outer Orbital Guidance Particle Track */}
                          <div 
                            className={cn(
                              "absolute w-52 h-32 rounded-[50%/35%] border border-amber-400/25 pointer-events-none transition-all duration-700",
                              eyePhase === 'roll' && "border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse"
                            )}
                          />
                        </div>
                      </div>

                      {/* Subtle Bottom Eye Rhythm Stage Dock */}
                      <div className="absolute bottom-5 inset-x-0 flex justify-center z-20 pointer-events-none">
                        <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/60 border border-amber-500/30 backdrop-blur-md text-[10px] font-mono tracking-wider text-amber-300/80 uppercase shadow-lg">
                          {[
                            { id: 'look-up', label: 'UP' },
                            { id: 'look-down', label: 'DOWN' },
                            { id: 'look-left', label: 'LEFT' },
                            { id: 'look-right', label: 'RIGHT' },
                            { id: 'roll', label: 'ROLL' },
                            { id: 'blink', label: 'BLINK' },
                            { id: 'focus-near-far', label: 'FOCUS' },
                            { id: 'close-eyes', label: 'REST' },
                          ].map((step, sIdx) => {
                            const isCurrent = eyePhase === step.id;
                            return (
                              <React.Fragment key={step.id}>
                                {sIdx > 0 && <span className="text-white/15 text-[8px]">•</span>}
                                <span className={cn(
                                  "transition-all duration-300 text-[9px]",
                                  isCurrent 
                                    ? "text-amber-300 font-bold drop-shadow-[0_0_6px_rgba(245,158,11,0.8)] scale-105" 
                                    : "text-white/30"
                                )}>
                                  {step.label}
                                </span>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}


              {/* Minimal Clean Timer Dial */}
              <CircularProgress progress={progress} isUIVisible={isUIVisible}>
                <div className="relative flex flex-col items-center justify-center gap-4 transition-all duration-300">
                  <div className={cn(
                    "font-code font-bold text-white transition-all duration-300 tracking-tight leading-none",
                    timeRemaining >= 3600
                      ? "text-3xl sm:text-4xl md:text-5xl"
                      : "text-4xl sm:text-5xl md:text-6xl"
                  )}
                       style={{ textShadow: '0 4px 24px rgba(0,0,0,0.95)' }}>
                    {formatTime(timeRemaining)}
                  </div>
                  <div className={cn(
                    "flex items-center justify-center gap-4 transition-opacity duration-300",
                    isUIVisible ? "opacity-100" : "opacity-0"
                  )}>
                    {/* Skip Action with 1.5s Gaze/Cursor Dwell */}
                    <DwellButton
                      onDwellTrigger={handleSkipTask}
                      size="icon"
                      variant="ghost"
                      title="Skip Task (Dwell 1.5s or Click)"
                      className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-transform"
                    >
                      <SkipForward className="h-5 w-5 text-white" />
                    </DwellButton>

                    {/* Pause / Resume Action with 1.5s Gaze/Cursor Dwell */}
                    <DwellButton
                      onDwellTrigger={() => {
                        const newPaused = !isPaused;
                        setIsPaused(newPaused);
                        updateTimer({ isPaused: newPaused }, timeRemaining);
                        ensureAudioInitialized();

                        const currentCoOpId = session?.id || coOpSessionId || activeTimer?.coOpSessionId || "";
                        const newEndTime = newPaused ? (Date.now() + timeRemaining * 1000) : (Date.now() + timeRemaining * 1000);

                        if (newPaused) {
                            expectedEndTimeRef.current = null;
                        } else {
                            expectedEndTimeRef.current = newEndTime;
                        }

                        updateUserProfileData({
                            activeSession: {
                                taskName,
                                duration: effectiveDuration,
                                expectedEndTime: newEndTime,
                                isPaused: newPaused,
                                category: category || "",
                                color: color || "",
                                coOpSessionId: currentCoOpId,
                                timeLeftWhenPaused: newPaused ? timeRemaining : null
                            }
                        });
                        
                        if (session) {
                            updateSession({ 
                                isPaused: newPaused, 
                                timeLeftWhenPaused: newPaused ? timeRemaining : null,
                                status: newPaused ? "waiting" : "running",
                                expectedEndTime: newPaused ? null : newEndTime
                            });
                        }

                        if (newPaused) {
                          cancelScheduledNotification();
                        } else {
                          showCompletionNotification(true);
                        }
                      }}
                      size="icon"
                      variant="ghost"
                      title={isPaused ? "Resume (Dwell 1.5s or Click)" : "Pause (Dwell 1.5s or Click)"}
                      className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-transform"
                    >
                      {isPaused ? <Play className="h-6 w-6 text-white" /> : <Pause className="h-6 w-6 text-white" />}
                    </DwellButton>

                    {/* Stop / End Early Action with 1.5s Gaze/Cursor Dwell */}
                    <DwellButton
                      onDwellTrigger={handleEndEarly}
                      variant="ghost"
                      size="icon"
                      title="End Task (Dwell 1.5s or Click)"
                      className="w-12 h-12 rounded-full bg-destructive/40 hover:bg-destructive/60 active:scale-95 transition-transform"
                    >
                      <Square className="h-6 w-6 text-white" />
                    </DwellButton>
                  </div>
                </div>
              </CircularProgress>
              </div>
            </div>
          )}
        </div>

        {/* Live Soundscape Controls */}
        <div className={cn(
          "fixed bottom-24 right-8 z-50 transition-all duration-300",
          !isUIVisible && "opacity-0 pointer-events-none translate-y-4"
        )}>
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-full bg-background/50 backdrop-blur-md border-primary/20 shadow-lg hover:scale-110 transition-transform"
              >
                <Music className="h-6 w-6 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] border-l-primary/10 bg-background/95 backdrop-blur-xl">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 font-headline text-2xl">
                  <Settings2 className="h-6 w-6 text-primary" />
                  Live Customization
                </SheetTitle>
                <SheetDescription>
                  Adjust your focus environment and interval alerts in real-time.
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-8 space-y-8">
                {/* Interval Alerts */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-medium flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      Focus Interval Alerts
                    </Label>
                  </div>
                  <div className="space-y-3 pl-4 border-l-2 border-primary/20 py-2">
                    <Label className="text-xs uppercase tracking-widest opacity-60">Notify me every:</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button variant={focusInterval === null ? "default" : "outline"} size="sm" onClick={() => setFocusInterval(null)}>Off</Button>
                      <Button variant={focusInterval === 5 ? "default" : "outline"} size="sm" onClick={() => setFocusInterval(5)}>5m</Button>
                      <Button variant={focusInterval === 10 ? "default" : "outline"} size="sm" onClick={() => setFocusInterval(10)}>10m</Button>
                      <Button variant={focusInterval === 15 ? "default" : "outline"} size="sm" onClick={() => setFocusInterval(15)}>15m</Button>
                      <Button variant={focusInterval === 30 ? "default" : "outline"} size="sm" onClick={() => setFocusInterval(30)}>30m</Button>
                    </div>
                  </div>
                </div>

                {/* Ambient Noise */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="live-ambient-switch" className="text-lg font-medium flex items-center gap-2">
                      <Cloud className="h-5 w-5 text-primary" />
                      Ambient Noise
                    </Label>
                    <Switch
                      id="live-ambient-switch"
                      checked={isAmbientEnabled}
                      onCheckedChange={setAmbientEnabled}
                    />
                  </div>
                  {isAmbientEnabled && (
                    <div className="space-y-6 pl-4 border-l-2 border-primary/20 py-2">
                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-widest opacity-60">Soundscape</Label>
                        <RadioGroup value={selectedAmbient} onValueChange={setSelectedAmbient} className="grid grid-cols-2 gap-2">
                          {ambientSounds.map((sound) => (
                            <Label key={sound.name} htmlFor={`live-amb-${sound.name}`} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-accent data-[state=checked]:border-primary text-xs">
                              <RadioGroupItem value={sound.name} id={`live-amb-${sound.name}`}/>
                              {sound.name}
                            </Label>
                          ))}
                        </RadioGroup>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-widest opacity-60">Volume</Label>
                        <Slider
                          value={ambientVolume}
                          onValueChange={setAmbientVolume}
                          max={1}
                          step={0.1}
                          className="py-2"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Soundtrack */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="live-soundtrack-switch" className="text-lg font-medium flex items-center gap-2">
                      <Volume2 className="h-5 w-5 text-primary" />
                      Focus Soundtrack
                    </Label>
                    <Switch
                      id="live-soundtrack-switch"
                      checked={isSoundtrackEnabled}
                      onCheckedChange={setSoundtrackEnabled}
                    />
                  </div>
                  {isSoundtrackEnabled && (
                    <div className="space-y-6 pl-4 border-l-2 border-primary/20 py-2">
                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-widest opacity-60">Track</Label>
                        <RadioGroup value={selectedSoundtrack} onValueChange={setSelectedSoundtrack} className="grid grid-cols-1 gap-2">
                          {soundtracks.map((sound) => (
                            <Label key={sound.name} htmlFor={`live-st-${sound.name}`} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-accent data-[state=checked]:border-primary text-xs">
                              <RadioGroupItem value={sound.name} id={`live-st-${sound.name}`}/>
                              {sound.name}
                            </Label>
                          ))}
                        </RadioGroup>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-widest opacity-60">Volume</Label>
                        <Slider
                          value={soundtrackVolume}
                          onValueChange={setSoundtrackVolume}
                          max={1}
                          step={0.1}
                          className="py-2"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <AlertDialog open={showExitWarning} onOpenChange={setShowExitWarning}>
        <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-2xl">End task early?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave? Your timer will be stopped. Would you like to save your progress so far?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
              <AlertDialogCancel onClick={() => setShowExitWarning(false)}>
                Keep going
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => { 
                    setShowExitWarning(false); 
                    if (session) updateSession({ status: "finished" });
                    clearTimer(); 
                    updateUserProfileData({
                        currentTaskStatus: "Idle",
                        activeSession: null
                    });
                    router.push("/"); 
                }}
              >
                Exit without saving
              </AlertDialogAction>
              <AlertDialogAction
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => { setShowExitWarning(false); handleSaveTask(false); }}
              >
                Save progress & Exit
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isFinished}>
        <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-2xl">Session Over!</AlertDialogTitle>
            <AlertDialogDescription>
              Did you complete your task, "{taskName}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleSaveTask(false)}
              >
                No
              </AlertDialogAction>
              <AlertDialogAction
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleSaveTask(true)}
              >
                Yes!
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showMotivationalDialog} onOpenChange={handleMotivationalDialogChange}>
        <DialogContent 
          onOpenAutoFocus={(e) => e.preventDefault()} 
          onCloseAutoFocus={(e) => e.preventDefault()} 
          onPointerDownOutside={(e) => { e.preventDefault(); handleMotivationalDialogChange(false); }} 
          className="w-[92vw] sm:max-w-md overflow-hidden bg-background/90 backdrop-blur-md border border-amber-500/20 shadow-2xl"
        >
          {showMotivationalDialog && <CoinParticles />}
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline text-2xl text-amber-500">
              <PartyPopper className="text-amber-500 animate-bounce" />
              Task Completed!
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 min-h-[100px] flex flex-col justify-center">
            {isLoadingAI ? (
              <div className="flex flex-col items-center justify-center gap-4 py-4 text-muted-foreground animate-pulse">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <p className="font-medium">Updating Log Book</p>
                </div>
                <p className="text-xs opacity-70">Synthesizing your achievement...</p>
              </div>
            ) : (
              <p className="text-lg text-foreground leading-relaxed">
                {motivationalMessage || "Great job finishing your task! Keep up the momentum!"}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-6">
            {!isLoadingAI && suggestedTask && (
              <Button onClick={handleStartSuggestedTask} className="w-full h-12 text-md shadow-lg transition-all active:scale-95 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-none text-white">
                Start: {suggestedTask}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setShowMotivationalDialog(false);
                router.push('/');
              }}
              className="w-full h-12 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all active:scale-95"
            >
              Back to Home
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dynamic Hydration Water-Level Background Simulation */}
      {isHydrationTask && <HydrationBackground progress={progress} />}
    </main>
  );
}

// Premium dynamic floating gold coins particle animation
function CoinParticles({ count = 16 }: { count?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100; // %
        const duration = Math.random() * 2 + 2.5; // seconds
        const delay = Math.random() * 1.5; // seconds
        const size = Math.random() * 20 + 12; // px
        return (
          <div
            key={i}
            className="absolute bottom-[-50px] text-amber-400 select-none animate-coin-float"
            style={{
              left: `${left}%`,
              fontSize: `${size}px`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
              filter: 'drop-shadow(0 2px 8px rgba(245, 158, 11, 0.6))',
            }}
          >
            🪙
          </div>
        );
      })}
      <style jsx global>{`
        @keyframes coin-float {
          0% {
            transform: translateY(0) rotate(0deg) scale(0.6);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateY(-450px) rotate(360deg) scale(1.3);
            opacity: 0;
          }
        }
        .animate-coin-float {
          animation-name: coin-float;
          animation-timing-function: cubic-bezier(0.1, 0.8, 0.2, 1);
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}
