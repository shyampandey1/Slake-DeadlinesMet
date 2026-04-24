"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Pause, Square, Loader2, PartyPopper, ArrowRight, Sun, Moon, Cloud, LucideIcon, CloudSun, CloudMoon, CloudDrizzle, CloudRain, CloudLightning, CloudSnow, Wind, CloudFog, Cloudy } from "lucide-react";
import { generateMotivationalMessage } from "@/ai/flows/generate-motivational-message";
import { categorizeTask } from "@/ai/flows/categorize-task";
import { useTasks, usePresetTasks, getAvailableCategories } from "@/hooks/useFirestore";
import { useProfile } from "@/hooks/useProfile";
import type { Task, UserPresetTask, UserProfile } from "@/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { useCoOpSession } from "@/hooks/useCoOpSession";

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


interface TimerDisplayProps {
  taskName: string;
  initialDuration: number; // in minutes
  category?: string;
  color?: string;
  expectedEndTime?: number;
  coOpSessionId?: string;
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


export default function TimerDisplay({ taskName, initialDuration, category, color, expectedEndTime, coOpSessionId }: TimerDisplayProps) {
  const router = useRouter();
  const { tasks, addTask } = useTasks();
  const { presetTasks } = usePresetTasks();
  const { isUIVisible, showUI } = useTimerUI();
  const { playFinish, playTick } = useAudioSettings();
  const { startTimer, clearTimer, updateTimer, activeTimer, isInitialized } = useActiveTimer();
  const { weatherData, location } = useWeather();
  const { profileData, updateUserProfileData } = useProfile();
  const { session, updateSession } = useCoOpSession(coOpSessionId || activeTimer?.coOpSessionId);
  const [timeRemaining, setTimeRemaining] = useState(initialDuration * 60);
  
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showMotivationalDialog, setShowMotivationalDialog] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState("");
  const [suggestedTask, setSuggestedTask] = useState<string | undefined>("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [flashState, setFlashState] = useState<FlashState>('none');
  const [taskCategory, setTaskCategory] = useState(category);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const [offlineNotificationsEnabled, setOfflineNotificationsEnabled] = useState(false);
  const [peerData, setPeerData] = useState<UserProfile | null>(null);

  // Monitor Co-op Partner Session
  useEffect(() => {
    if (!profileData?.coWorkerId) return;
    const unsub = onSnapshot(doc(db, "users", profileData.coWorkerId), (snap) => {
      if (snap.exists()) {
        setPeerData(snap.data() as UserProfile);
      }
    });
    return () => unsub();
  }, [profileData?.coWorkerId]);

  // Real-time League Status Ping & Active Session Sync
  useEffect(() => {
     if (profileData?.isReformersEnrolled) {
         updateUserProfileData({ 
            currentTaskStatus: taskName, 
            isOnline: true,
            activeSession: {
               taskName,
               expectedEndTime: activeTimer?.expectedEndTime || (Date.now() + timeRemaining * 1000),
               isPaused: isPaused,
               duration: initialDuration,
               coOpSessionId: coOpSessionId || activeTimer?.coOpSessionId
            }
         });
     }
     return () => {
         // Silently clear presence when navigating away
         if (profileData?.isReformersEnrolled) {
             updateUserProfileData({ 
                currentTaskStatus: "Reviewing metrics...", 
                isOnline: false,
                activeSession: null as any 
             });
         }
     };
  }, [taskName, profileData?.isReformersEnrolled, updateUserProfileData, isPaused, initialDuration, activeTimer?.expectedEndTime, coOpSessionId, activeTimer?.coOpSessionId]);

  useEffect(() => {
    const saved = localStorage.getItem('deadlinesmet_offline_notifications');
    setOfflineNotificationsEnabled(saved === 'true');
  }, []);

  const cancelScheduledNotification = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    const notifications = await registration.getNotifications({ tag: 'timer-done' });
    notifications.forEach(n => n.close());
  }, []);

  const showStartNotification = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
    
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification("Timer Started", {
      body: `Focusing on: ${taskName}`,
      icon: "/icon.svg",
      tag: "timer-start",
      silent: true
    });
  }, [taskName]);

  const showCompletionNotification = useCallback(async (isScheduled = false) => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;
    
    const notificationOptions: any = {
      body: `Time's up! You've finished: ${taskName}`,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: "timer-done",
      vibrate: [200, 100, 200],
      data: {
        url: window.location.href.includes('?') ? `${window.location.href}&from_notification=true` : `${window.location.href}?from_notification=true`,
        type: "TIMER",
      },
      requireInteraction: true,
    };

    if (isScheduled) {
      if (offlineNotificationsEnabled && 'showTrigger' in Notification.prototype) {
        const triggerTime = Date.now() + (timeRemainingRef.current * 1000);
        // @ts-ignore
        notificationOptions.showTrigger = new TimestampTrigger(triggerTime);
      } else {
        return; // Browser doesn't support background triggers or they are disabled
      }
    }

    try {
      await registration.showNotification("Session Complete!", notificationOptions);
    } catch (e) {
      console.warn("Failed to show/schedule notification", e);
    }
  }, [taskName, offlineNotificationsEnabled]);

  const userRoutine = useMemo(() => {
    const routine: any[] = [];
    Object.keys(presetTasks).forEach(cat => {
      presetTasks[cat].tasks.forEach(t => {
        routine.push({ ...t, category: cat });
      });
    });
    return routine.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [presetTasks]);

  // Handle initialization and global side effects once
  useEffect(() => {
    setCurrentDate(new Date());
    const dateInterval = setInterval(() => setCurrentDate(new Date()), 1000);
    showStartNotification();
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
  }, [showStartNotification]);

    const hasInitializedRef = useRef(false);

    // Handle initialization and sync with global state
    useEffect(() => {
        // WAIT until the global context is initialized from localStorage before deciding
        if (!isInitialized) return;

        // Reset state when task params change
        if (hasInitializedRef.current && (activeTimer?.taskName === taskName)) return;

        setFlashState('none');
        setTaskCategory(category);
        
        // START our persistent global background timer when the page mounts!
        // But ONLY if one isn't already running for this task or if the task changed
        if (!activeTimer || activeTimer.taskName !== taskName) {
          startTimer({
            taskName,
            initialDuration,
            category,
            color,
            expectedEndTime,
            coOpSessionId
          });
          setTimeRemaining(initialDuration * 60);
          setIsPaused(false);
          showCompletionNotification(true); // Schedule it!
        } else {
          // RESTORE from active timer
          setIsPaused(activeTimer.isPaused);
          if (activeTimer.isPaused && activeTimer.timeLeftWhenPaused) {
            setTimeRemaining(activeTimer.timeLeftWhenPaused);
          } else {
            const diff = Math.max(0, Math.round((activeTimer.expectedEndTime - Date.now()) / 1000));
            setTimeRemaining(diff);
            if (!activeTimer.isPaused) showCompletionNotification(true); // Re-schedule it!
          }
        }
        hasInitializedRef.current = true;
        setSyncComplete(true);
    }, [taskName, initialDuration, category, color, startTimer, isInitialized, expectedEndTime, coOpSessionId]); // Removed activeTimer from deps to prevent re-init loop

    // CO-OP SYNC ENGINE
    useEffect(() => {
        if (session && syncComplete) {
            // Update local state from shared session
            if (session.isPaused !== isPaused) {
                setIsPaused(session.isPaused);
            }
            if (session.status === "running" && session.expectedEndTime) {
                const diff = Math.max(0, Math.round((session.expectedEndTime - Date.now()) / 1000));
                if (Math.abs(diff - timeRemaining) > 2) { // Only sync if drift > 2s
                    setTimeRemaining(diff);
                }
            } else if (session.status === "waiting") {
                if (session.timeLeftWhenPaused !== undefined && session.timeLeftWhenPaused !== null) {
                    setTimeRemaining(session.timeLeftWhenPaused);
                }
            }
        }
    }, [session, syncComplete]);

  const expectedEndTimeRef = useRef<number | null>(null);
  const timeRemainingRef = useRef(timeRemaining);
  const isFinishedRef = useRef(isFinished);
  const showMotivationalDialogRef = useRef(showMotivationalDialog);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    isFinishedRef.current = isFinished;
    showMotivationalDialogRef.current = showMotivationalDialog;
  }, [isFinished, showMotivationalDialog]);

  // Main stable timer engine resilient to background throttling
  useEffect(() => {
    if (!syncComplete) return;

    if (isPaused || isFinished) {
      expectedEndTimeRef.current = null;
      return;
    }

    if (!expectedEndTimeRef.current) {
      expectedEndTimeRef.current = Date.now() + timeRemainingRef.current * 1000;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const difference = Math.max(0, Math.round((expectedEndTimeRef.current! - now) / 1000));

      setTimeRemaining(difference);

      if (difference <= 0) {
        setIsFinished(true);
        setFlashState('none');
        playFinish();
        showCompletionNotification(false); // Immediate one
        clearTimer(); // End background tracking
      } else if (difference <= 10 && difference > 0) {
        // Activate continuous tense flashing in the last 10 seconds
        if (difference <= 10) setFlashState('continuous');
        // Tick each second for the final countdown - ensure it only plays once per second
        if (lastTickRef.current !== difference) {
            lastTickRef.current = difference;
            playTick();
        }
      } else if (difference <= 11 && difference > 10) {
        setFlashState('none');
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPaused, isFinished, playFinish, playTick, showCompletionNotification, syncComplete, clearTimer]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isPaused && !isFinished && expectedEndTimeRef.current) {
        const now = Date.now();
        const difference = Math.max(0, Math.round((expectedEndTimeRef.current - now) / 1000));
        setTimeRemaining(difference);
        if (difference <= 0) {
          setIsFinished(true);
          setFlashState('none');
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
  };

  const handleStartSuggestedTask = () => {
    if (!suggestedTask) return;
    const params = new URLSearchParams({
      task: suggestedTask,
      duration: "25",
    });
    // Explicitly hide the dialog and ensure no more home redirect happens.
    // By setting this to false here, we prevent handleMotivationalDialogChange 
    // from potentially being called by Radix with the home redirect side effect.
    setShowMotivationalDialog(false);
    router.push(`/timer?${params.toString()}`);
  }

  const handleInteraction = () => {
    showUI();
  };

  const handleSaveTask = async (completed: boolean) => {
    setIsFinished(false);
    clearTimer();
    const timeSpentInSeconds = (initialDuration * 60) - timeRemaining;
    const actualDuration = Math.max(1, Math.round(timeSpentInSeconds / 60));

    let finalCategory = taskCategory;
    if (!finalCategory) {
      try {
        const result = await categorizeTask({
          taskName: taskName,
          availableCategories: getAvailableCategories(),
        });
        finalCategory = result.category;
        setTaskCategory(result.category);
      } catch (error) {
        console.error("Failed to categorize task, using default:", error);
        finalCategory = "Work & Focus";
      }
    }

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
           // Optimum coin addition calculation
           const durationRatio = (timeSpentInSeconds / 60) / initialDuration;
           let baseCoins = 50 + (actualDuration * 10);
           
           // Optimum Match Bonus (finished between 80% and 120% of planned time)
           if (durationRatio >= 0.8 && durationRatio <= 1.2) {
               baseCoins += 100;
           }
           
           // Hydration/Health multipliers
           if (taskName.toLowerCase().includes('water')) {
               baseCoins += 50; 
           }
           if (['workout', 'exercise', 'gym'].some(w => taskName.toLowerCase().includes(w))) {
               baseCoins += 150;
           }
           
           earnedCoins = Math.floor(baseCoins);
       }
    }

    const newTask: Omit<Task, 'id' | 'createdAt' | 'userId'> = {
      name: taskName,
      duration: actualDuration,
      initialDuration: initialDuration,
      completed: finalCompleted,
      category: finalCategory,
      earnedCoins: earnedCoins,
      isFalseEntry: isFalse,
    };

    await addTask(newTask);

    if (finalCompleted) {
      setIsLoadingAI(true);
      setShowMotivationalDialog(true);
      // Let's also update profile credits live so it feels immediate
      if (profileData && earnedCoins > 0) {
         updateUserProfileData({ slakeCredits: (profileData.slakeCredits || 0) + earnedCoins });
      }
      try {
        const pastTasks = tasks.slice(0, 5).map(t => ({ taskName: t.name, duration: t.duration, completionStatus: t.completed }));
        const result = await generateMotivationalMessage({
          taskName: newTask.name,
          duration: newTask.duration,
          completionStatus: true,
          userRoutine: userRoutine,
          pastTasks: pastTasks,
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

  const progress = (timeRemaining / (initialDuration * 60)) * 100;
  const timerColor = 'hsl(var(--primary))';

  const hour = currentDate ? currentDate.getHours() : 12;
  const isNight = hour < 6 || hour > 19;
  const WeatherIcon = weatherData ? getWeatherIcon(weatherData.code, isNight) : Cloud;

  const InfoDisplay = () => (
    <div className="flex items-center gap-6 text-foreground/90">
      <div className="flex flex-col items-center">
        <span className="text-3xl font-bold font-headline">{currentDate ? format(currentDate, 'p') : '--:--'}</span>
        <span className="text-xs uppercase tracking-widest opacity-60">{currentDate ? format(currentDate, 'EEEE, MMM d') : '---'}</span>
      </div>
      {weatherData && (
        <div className="flex items-center gap-2 pl-6 border-l border-white/20">
          <WeatherIcon className="h-8 w-8 text-primary" />
          <div className="flex flex-col">
            <span className="text-xl font-bold">{weatherData.temp}°</span>
            <span className="text-[10px] uppercase opacity-60 tracking-tighter">{location}</span>
          </div>
        </div>
      )}
    </div>
  );


  const CoOpDisplay = () => {
    if (!peerData || !peerData.activeSession) return null;
    const p = peerData;
    const s = p.activeSession;
    if (!s) return null;
    const peerTimeLeft = Math.max(0, Math.round((s.expectedEndTime - Date.now()) / 1000));
    const peerProgress = Math.min(100, Math.max(0, (peerTimeLeft / (s.duration * 60)) * 100));

    return (
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed top-24 right-4 w-60 bg-slate-900/80 border border-emerald-500/30 backdrop-blur-xl rounded-2xl p-4 shadow-2xl z-50 overflow-hidden hidden md:block"
      >
        <div className="absolute top-0 right-0 p-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
        </div>
        <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-10 h-10 border-2 border-emerald-500/30">
                <AvatarImage src={p.displayPicture} />
                <AvatarFallback className="bg-emerald-950 text-emerald-400">{p.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Co-Op Partner</p>
                <p className="text-sm font-bold truncate text-white">{p.displayName}</p>
            </div>
        </div>
        <div className="space-y-4">
            <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 flex justify-between">
                    Current Focus 
                    <span className={`text-[9px] ${s.isPaused ? 'text-amber-500' : 'text-emerald-500'}`}>{s.isPaused ? 'PAUSED' : 'LIVE'}</span>
                </p>
                <p className="text-xs font-medium text-slate-200 truncate bg-white/5 p-2 rounded-lg border border-white/5">{s.taskName}</p>
            </div>
            <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-black">
                    <span className="text-emerald-400 font-mono">{formatTime(peerTimeLeft)}</span>
                    <span className="text-slate-500">{100 - Math.round(peerProgress)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${100 - peerProgress}%` }}
                        className={`h-full ${s.isPaused ? 'bg-amber-500' : 'bg-emerald-500'} shadow-[0_0_10px_rgba(16,185,129,0.5)]`}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                    <p className="text-[9px] uppercase text-slate-500 font-bold mb-0.5">Hydration</p>
                    <p className="text-xs font-black text-blue-400">{p.totalWaterGlasses || 0} Glasses</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                    <p className="text-[9px] uppercase text-slate-500 font-bold mb-0.5">Streak</p>
                    <p className="text-xs font-black text-amber-500">{p.streak?.currentStreak || 0} Days</p>
                </div>
            </div>
        </div>
      </motion.div>
    );
  };

  return (
    <main
      onClick={handleInteraction}
      onMouseMove={handleInteraction}
      className={cn(
        "relative flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6 md:p-8 transition-colors duration-500 text-foreground bg-background",
        {
          'animate-flash-breathing': flashState === 'breathing',
          'animate-flash-three-times': flashState === 'three-times',
          'animate-flash-continuous': flashState === 'continuous',
        }
      )}
      style={{
        '--timer-primary-color': timerColor,
        '--flash-color': 'hsl(0 0% 100% / 0.9)',
      } as React.CSSProperties}
    >
      <CoOpDisplay />
      <div className={cn(
        "absolute top-4 transition-opacity duration-300",
        !isUIVisible && "opacity-30"
      )}>
        <InfoDisplay />
      </div>
      <div className="flex w-full max-w-4xl flex-col items-center justify-center text-center">
        <h2 className="mb-2 text-xl font-medium tracking-wide text-foreground/80">{category || 'Focus Session'}</h2>
        <h1 className="mb-8 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl font-headline">
          {taskName}
        </h1>


        <div className="mb-12">
          {!syncComplete ? (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
                <p className="text-xs mt-4 opacity-50 font-code tracking-widest">SYNCING SESSION...</p>
            </div>
          ) : (
            <CircularProgress progress={progress} isUIVisible={isUIVisible}>
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="font-code text-5xl font-bold sm:text-6xl md:text-7xl text-white">
                {formatTime(timeRemaining)}
              </div>
              <div className={cn(
                "flex items-center justify-center gap-2 transition-opacity duration-300",
                isUIVisible ? "opacity-100" : "opacity-0"
              )}>
                <Button
                  onClick={() => {
                    const newPaused = !isPaused;
                    setIsPaused(newPaused);
                    updateTimer({ isPaused: newPaused }, timeRemaining);
                    
                    if (session) {
                        updateSession({ 
                            isPaused: newPaused, 
                            timeLeftWhenPaused: timeRemaining,
                            status: newPaused ? "waiting" : "running",
                            expectedEndTime: newPaused ? null : Date.now() + (timeRemaining * 1000)
                        });
                    }

                    if (newPaused) {
                      cancelScheduledNotification();
                    } else {
                      showCompletionNotification(true); // Re-schedule for new end time
                    }
                  }}
                  size="icon"
                  variant="ghost"
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20"
                >
                  {isPaused ? <Play className="h-6 w-6 text-white" /> : <Pause className="h-6 w-6 text-white" />}
                </Button>
                <Button
                  onClick={handleEndEarly}
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 rounded-full bg-destructive/40 hover:bg-destructive/60"
                >
                  <Square className="h-6 w-6 text-white" />
                </Button>
              </div>
            </div>
          </CircularProgress>
          )}
        </div>
      </div>

      <AlertDialog open={showExitWarning} onOpenChange={setShowExitWarning}>
        <AlertDialogContent>
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
        <AlertDialogContent>
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
        <DialogContent onPointerDownOutside={(e) => { e.preventDefault(); handleMotivationalDialogChange(false); }} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
              <PartyPopper className="text-primary" />
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

          <DialogFooter className="flex flex-col gap-3 sm:flex-col sm:justify-start">
            {!isLoadingAI && suggestedTask && (
              <Button onClick={handleStartSuggestedTask} className="w-full h-12 text-md shadow-lg transition-all active:scale-95">
                Start: {suggestedTask}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              asChild
              className="w-full h-12 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all active:scale-95"
            >
              <Link href="/">Back to Home</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
