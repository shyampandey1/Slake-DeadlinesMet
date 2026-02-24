"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, Loader2, PartyPopper, ArrowRight, Sun, Moon, Cloud, LucideIcon, CloudSun, CloudMoon, CloudDrizzle, CloudRain, CloudLightning, CloudSnow, Wind, CloudFog, Cloudy } from "lucide-react";
import { generateMotivationalMessage } from "@/ai/flows/generate-motivational-message";
import { categorizeTask } from "@/ai/flows/categorize-task";
import { useTasks, usePresetTasks, getAvailableCategories } from "@/hooks/useFirestore";
import type { Task, UserPresetTask } from "@/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
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
  const { playSound } = useAudioSettings();
  const { weatherData } = useWeather();
  const [timeRemaining, setTimeRemaining] = useState(initialDuration * 60);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showMotivationalDialog, setShowMotivationalDialog] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState("");
  const [suggestedTask, setSuggestedTask] = useState<string | undefined>("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [flashState, setFlashState] = useState<FlashState>('none');
  const [taskCategory, setTaskCategory] = useState(category);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          stopTimer();
          setIsFinished(true);
          setFlashState('none');
          playSound();
          showCompletionNotification();
          return 0;
        }

        if (prev <= 4) {
          setFlashState('continuous');
          playSound();
        } else if (prev <= 11 && prev > 4) {
          setFlashState('none');
        }

        return prev - 1;
      });
    }, 1000);
  }, [stopTimer, playSound, showCompletionNotification]);

  useEffect(() => {
    startTimer();

    const dateInterval = setInterval(() => setCurrentDate(new Date()), 1000);
    showStartNotification();

    document.body.style.overflow = 'hidden';

    return () => {
      stopTimer();
      clearInterval(dateInterval);
      document.body.style.overflow = 'auto';
    };
  }, [startTimer, stopTimer, showStartNotification]);


  useEffect(() => {
    if (!isPaused) {
      startTimer();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return stopTimer;
  }, [isPaused, startTimer, stopTimer]);

  useEffect(() => {
    // Disable scrolling on the body when the timer is active
    document.body.style.overflow = 'hidden';
    // Re-enable scrolling when the component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleEndEarly = () => {
    stopTimer();
    setIsPaused(true);
    setIsFinished(true);
  };

  const handleStartSuggestedTask = () => {
    if (!suggestedTask) return;
    const params = new URLSearchParams({
      task: suggestedTask,
      duration: "25",
    });
    window.location.href = `/timer?${params.toString()}`;
  }

  const handleInteraction = () => {
    showUI();
  };

  const handleSaveTask = async (completed: boolean) => {
    setIsFinished(false);
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
      } catch (error) {
        console.error("Failed to generate motivational message:", error);
        // Fallback for when the AI call fails
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

  const hour = currentDate.getHours();
  const isNight = hour < 6 || hour > 19;
  const WeatherIcon = weatherData ? getWeatherIcon(weatherData.code, isNight) : Cloud;


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
          <CircularProgress progress={progress}>
            <div
              className="font-code text-5xl font-bold sm:text-6xl md:text-7xl text-white"
            >
              {formatTime(timeRemaining)}
            </div>

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
                    onClick={() => setIsPaused(!isPaused)}
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
        </div>


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
          <DialogContent onPointerDownOutside={(e) => { e.preventDefault(); handleMotivationalDialogChange(false); }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
                <PartyPopper className="text-primary" />
                Task Completed!
              </DialogTitle>
              <DialogDescription asChild>
                <div className="pt-4">
                  {isLoadingAI ? (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <p>Generating your motivational message...</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-lg text-foreground">{motivationalMessage}</p>
                      {suggestedTask && (
                        <Button onClick={handleStartSuggestedTask} className="mt-4 w-full">
                          Start: {suggestedTask}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => handleMotivationalDialogChange(false)} className="w-full mt-2">
                Back to Home
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </main>
  );
}
