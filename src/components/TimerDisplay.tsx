"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Pause, Square, Loader2, PartyPopper, ArrowRight, Sun, Moon, Cloud, LucideIcon, CloudSun, CloudMoon, CloudDrizzle, CloudRain, CloudLightning, CloudSnow, Wind, CloudFog, Cloudy, Volume2 } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";

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
  const { 
    playFinish, playTick, controlBackgroundAudio,
    isAmbientEnabled, setAmbientEnabled, selectedAmbient, setSelectedAmbient, ambientVolume, setAmbientVolume,
    isSoundtrackEnabled, setSoundtrackEnabled, selectedSoundtrack, setSelectedSoundtrack, soundtrackVolume, setSoundtrackVolume
  } = useAudioSettings();
  const { startTimer, clearTimer, updateTimer, activeTimer, isInitialized } = useActiveTimer();
  const { weatherData, location } = useWeather();
  const { profileData, updateUserProfileData } = useProfile();
  const { user } = useAuth();
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

  // Move refs to the top to avoid ReferenceErrors in effects
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

  // Real-time League Status Ping (Presence)
  useEffect(() => {
     if (profileData?.isReformersEnrolled) {
         updateUserProfileData({ 
            currentTaskStatus: taskName, 
            isOnline: true
         });
     }
     return () => {
         // Silently clear presence when navigating away
         if (profileData?.isReformersEnrolled) {
             updateUserProfileData({ 
                currentTaskStatus: "Reviewing metrics...", 
                isOnline: false
             });
         }
     };
  }, [taskName, profileData?.isReformersEnrolled, updateUserProfileData]);

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
      const isTriggerSupported = typeof window !== 'undefined' && 'Notification' in window && 'showTrigger' in Notification.prototype;
      if (offlineNotificationsEnabled && isTriggerSupported && typeof (window as any).TimestampTrigger !== 'undefined') {
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

    // Handle initialization and sync with global state
    useEffect(() => {
        // WAIT until the global context is initialized from localStorage before deciding
        if (!isInitialized) return;

        try {
            // Reset state when task params change
            if (hasInitializedRef.current && (activeTimer?.taskName === taskName)) {
                setSyncComplete(true);
                return;
            }

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
              if (activeTimer.isPaused && activeTimer.timeLeftWhenPaused !== undefined) {
                setTimeRemaining(activeTimer.timeLeftWhenPaused);
              } else if (activeTimer.expectedEndTime) {
                const diff = Math.max(0, Math.round((activeTimer.expectedEndTime - Date.now()) / 1000));
                setTimeRemaining(diff);
                if (!activeTimer.isPaused) showCompletionNotification(true); // Re-schedule it!
              }
            }
            hasInitializedRef.current = true;
            setSyncComplete(true);
        } catch (e) {
            console.error("Timer initialization failed:", e);
            setSyncComplete(true); // Allow UI to show even if recovery happened
        }
    }, [taskName, initialDuration, category, color, startTimer, isInitialized, expectedEndTime, coOpSessionId]); // Removed activeTimer from deps to prevent re-init loop

    // CO-OP SYNC ENGINE
    useEffect(() => {
        if (session && syncComplete && user) {
            // ONLY sync if the change came from someone else to prevent bounces
            if (session.lastActionBy !== user.uid) {
                // Update local state from shared session
                if (session.isPaused !== isPaused) {
                    setIsPaused(session.isPaused);
                }
                if (session.status === "running" && session.expectedEndTime) {
                    const diff = Math.max(0, Math.round((session.expectedEndTime - Date.now()) / 1000));
                    if (Math.abs(diff - timeRemaining) > 2) { // Only sync if drift > 2s
                        setTimeRemaining(diff);
                    }
                    // Crucial: Update the ref used by the local timer engine
                    expectedEndTimeRef.current = session.expectedEndTime;
                } else if (session.status === "waiting") {
                    if (session.timeLeftWhenPaused !== undefined && session.timeLeftWhenPaused !== null) {
                        setTimeRemaining(session.timeLeftWhenPaused);
                    }
                    expectedEndTimeRef.current = null;
                } else if (session.status === "finished" && !isFinishedRef.current) {
                    setIsFinished(true);
                    setFlashState('none');
                    expectedEndTimeRef.current = null;
                    clearTimer();
                }
            }
        }
    }, [session, syncComplete, user?.uid]);

  // Main stable timer engine resilient to background throttling
  useEffect(() => {
    if (!syncComplete) return;

    if (isPaused || isFinished || timeRemainingRef.current <= 0) {
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
    if (session) {
      updateSession({ status: "finished" });
    }
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
      category: finalCategory || "Work & Focus",
      earnedCoins: earnedCoins,
      isFalseEntry: isFalse,
    };

    try {
        await addTask(newTask);
    } catch (e) {
        console.error("Failed to save task to history:", e);
    }

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
        "absolute top-4 sm:top-8 transition-opacity duration-300",
        !isUIVisible && "opacity-30"
      )}>
        <InfoDisplay />
      </div>
      <div className="flex w-full max-w-4xl flex-col items-center justify-center text-center mt-20 sm:mt-0">
        <h2 className="mb-2 text-sm sm:text-xl font-medium tracking-wide text-foreground/80 uppercase tracking-[0.2em] opacity-50">{category || 'Focus Session'}</h2>
        <h1 className={cn(
            "mb-8 font-bold tracking-tight text-foreground font-headline transition-all duration-300 px-4",
            taskName.length > 20 ? "text-3xl sm:text-5xl md:text-6xl" : "text-4xl sm:text-6xl md:text-7xl lg:text-8xl"
        )}>
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
              <div className="font-code text-4xl font-bold sm:text-6xl md:text-7xl text-white">
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
                  Live Soundscape
                </SheetTitle>
                <SheetDescription>
                  Adjust your focus environment in real-time.
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-8 space-y-8">
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
          className="sm:max-w-md"
        >
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
              onClick={() => {
                setShowMotivationalDialog(false);
                router.push('/');
              }}
              className="w-full h-12 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all active:scale-95"
            >
              Back to Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
