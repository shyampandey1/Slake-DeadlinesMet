"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Pause, Square, Loader2, PartyPopper, ArrowRight, Sun, Moon, Cloud, LucideIcon, CloudSun, CloudMoon, CloudDrizzle, CloudRain, CloudLightning, CloudSnow, Wind, CloudFog, Cloudy } from "lucide-react";
import { generateMotivationalMessage } from "@/ai/flows/generate-motivational-message";
import { categorizeTask } from "@/ai/flows/categorize-task";
import { useTasks, usePresetTasks, getAvailableCategories } from "@/hooks/useFirestore";
import { useProfile } from "@/hooks/useProfile";
import type { Task, UserPresetTask } from "@/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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


export default function TimerDisplay({ taskName, initialDuration, category, color }: TimerDisplayProps) {
  const router = useRouter();
  const { tasks, addTask } = useTasks();
  const { presetTasks } = usePresetTasks();
  const { isUIVisible, showUI } = useTimerUI();
  const { playFinish, playTick } = useAudioSettings();
  const { startTimer, clearTimer, updateTimer, activeTimer, isInitialized } = useActiveTimer();
  const { weatherData, location } = useWeather();
  const { profileData, updateUserProfileData } = useProfile();
  const [timeRemaining, setTimeRemaining] = useState(initialDuration * 60);
  
  // Real-time League Status Ping
  useEffect(() => {
     if (profileData?.isReformersEnrolled) {
         updateUserProfileData({ currentTaskStatus: taskName, isOnline: true });
     }
     return () => {
         // Silently clear presence when navigating away
         if (profileData?.isReformersEnrolled) {
             updateUserProfileData({ currentTaskStatus: "Reviewing metrics...", isOnline: false });
         }
     };
  }, [taskName, profileData?.isReformersEnrolled, updateUserProfileData]);
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
    }, [taskName, initialDuration, category, color, startTimer, isInitialized]); // Removed activeTimer from deps to prevent re-init loop

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

    const newTask: Omit<Task, 'id' | 'createdAt' | 'userId'> = {
      name: taskName,
      duration: actualDuration,
      initialDuration: initialDuration,
      completed,
      category: finalCategory,
    };

    await addTask(newTask);

    if (completed) {
      setIsLoadingAI(true);
      setShowMotivationalDialog(true);
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
    <div className="flex items-center gap-6 text-white/90">
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


  return (
    <main
      onClick={handleInteraction}
      onMouseMove={handleInteraction}
      className={cn(
        "relative flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6 md:p-8 transition-colors duration-500 text-white",
        {
          'animate-flash-breathing': flashState === 'breathing',
          'animate-flash-three-times': flashState === 'three-times',
          'animate-flash-continuous': flashState === 'continuous',
        }
      )}
      style={{
        backgroundColor: 'hsl(20 14% 4%)',
        '--timer-primary-color': timerColor,
        '--timer-background-color': 'hsl(20 14% 4%)',
        '--flash-color': 'hsl(0 0% 100% / 0.9)',
      } as React.CSSProperties}
    >
      <div className={cn(
        "absolute top-4 transition-opacity duration-300",
        !isUIVisible && "opacity-30"
      )}>
        <InfoDisplay />
      </div>
      <div className="flex w-full max-w-4xl flex-col items-center justify-center text-center">
        <h2 className="mb-2 text-xl font-medium tracking-wide text-white/80">{category || 'Focus Session'}</h2>
        <h1 className="mb-8 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl font-headline">
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
                onClick={() => { setShowExitWarning(false); clearTimer(); router.push("/"); }}
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
