

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, Loader2, PartyPopper, ArrowRight, Sun, Moon, CloudSun } from "lucide-react";
import { generateMotivationalMessage } from "@/ai/flows/generate-motivational-message";
import { useTasks, usePresetTasks } from "@/hooks/useFirestore";
import type { Task } from "@/types";
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


interface TimerDisplayProps {
  taskName: string;
  initialDuration: number; // in minutes
  category?: string;
  color?: string;
}

type FlashState = 'none' | 'breathing' | 'three-times' | 'continuous';

export default function TimerDisplay({ taskName, initialDuration, category, color }: TimerDisplayProps) {
  const router = useRouter();
  const { tasks, addTask } = useTasks();
  const { presetTasks, findAndSyncPresetTask } = usePresetTasks();
  const { isUIVisible, showUI } = useTimerUI();
  const { playSound } = useAudioSettings();
  const [timeRemaining, setTimeRemaining] = useState(initialDuration * 60);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showMotivationalDialog, setShowMotivationalDialog] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState("");
  const [suggestedTask, setSuggestedTask] = useState<string | undefined>("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [flashState, setFlashState] = useState<FlashState>('none');
  const [weather, setWeather] = useState({ temp: 22, icon: CloudSun });


  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const showCompletionNotification = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification('Task Complete!', {
                body: `You've finished your task: ${taskName}`,
                icon: '/icon.svg',
                tag: 'task-completion',
                renotify: true,
            });
        });
    }
  }, [taskName]);

  const showStartNotification = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(`Task Started: ${taskName}`, {
                body: `Timer set for ${initialDuration} minutes.`,
                icon: '/icon.svg',
                silent: true,
            });
        });
    }
  }, [taskName, initialDuration]);
  
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
        
        // Flashing logic
        if (prev > 10) {
            setFlashState('none');
        } else if (prev > 5) {
            setFlashState('breathing');
        } else if (prev > 3) {
            setFlashState('three-times');
        } else {
            setFlashState('continuous');
            playSound();
        }

        return prev - 1;
      });
    }, 1000);
  }, [stopTimer, playSound, showCompletionNotification]);

  useEffect(() => {
    const dateInterval = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(dateInterval);
  }, []);

  useEffect(() => {
    showStartNotification();
  }, [showStartNotification]);


  useEffect(() => {
    const hour = currentDate.getHours();
    const isNight = hour < 6 || hour > 19;
     if (isNight) {
        setWeather({ temp: 18, icon: Moon });
    } else {
        setWeather({ temp: 22, icon: Sun });
    }
  }, [currentDate]);

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
    // Use window.location.href to force a full page reload with the new params
    window.location.href = `/timer?${params.toString()}`;
  }
  
  const handleInteraction = () => {
    showUI();
  };

  const handleSaveTask = async (completed: boolean) => {
    const timeSpentInSeconds = (initialDuration * 60) - timeRemaining;
    const actualDuration = Math.max(1, Math.round(timeSpentInSeconds / 60));

    const newTask: Omit<Task, 'id' | 'createdAt' | 'userId'> = {
      name: taskName,
      duration: actualDuration,
      initialDuration: initialDuration,
      completed,
      category: category,
    };
    await addTask(newTask);

    if (completed) {
      await findAndSyncPresetTask(taskName, actualDuration);
      setIsLoadingAI(true);
      setShowMotivationalDialog(true);
      try {
        const pastTasks = tasks.slice(0, 5).map(t => ({taskName: t.name, duration: t.duration, completionStatus: t.completed}));
        const userRoutine = Object.values(presetTasks).flatMap(category => category.tasks.map(task => ({...task})));
        
        const result = await generateMotivationalMessage({
          taskName: newTask.name,
          duration: newTask.duration,
          completionStatus: true,
          pastTasks,
          userRoutine,
        });
        setMotivationalMessage(result.message);
        setSuggestedTask(result.suggestedNextTask);
      } catch (error) {
        console.error("Failed to generate motivational message:", error);
        setMotivationalMessage("Great job finishing your task! Keep up the momentum!");
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

  // Dynamically set CSS variables for the timer theme
  const timerColor = 'hsl(var(--primary))';
  const WeatherIcon = weather.icon;


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
        backgroundColor: 'hsl(20 14% 4%)', // Always dark background
        '--timer-primary-color': timerColor,
        '--timer-background-color': 'hsl(20 14% 4%)',
        '--flash-color': 'hsl(0 0% 100% / 0.9)',
      } as React.CSSProperties}
    >
        {/* Top Info Bar */}
        <div className={cn(
            "absolute top-4 sm:top-6 md:top-8 w-full max-w-sm mx-auto transition-opacity duration-300",
             isUIVisible ? "opacity-100" : "opacity-0"
        )}>
            <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 flex items-center justify-between text-sm">
                <div className="font-bold font-headline">{format(currentDate, 'p')}</div>
                <div className="flex items-center gap-3 opacity-80">
                    <span>{format(currentDate, 'E, LLL d')}</span>
                    <div className="flex items-center gap-1.5">
                        <WeatherIcon className="h-4 w-4" />
                        <span>{weather.temp}°C</span>
                    </div>
                </div>
            </div>
        </div>


        {/* Center Content */}
        <div className="flex w-full max-w-4xl flex-col items-center justify-center text-center">
            <div className="flex w-full flex-col items-center justify-center text-center transition-opacity duration-300">
                <h2 className="mb-2 text-xl font-medium tracking-wide text-white/80">{category || 'Focus Session'}</h2>
                <h1 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl font-headline">
                {taskName}
                </h1>
            </div>
            <div className="mb-8">
            <CircularProgress progress={progress}>
                <div
                className="font-code text-5xl font-bold sm:text-6xl md:text-7xl text-white"
                >
                {formatTime(timeRemaining)}
                </div>
            </CircularProgress>
            </div>
        </div>

        {/* Bottom Buttons */}
         <div className={cn(
            "absolute bottom-4 sm:bottom-6 md:bottom-8 flex items-center gap-4 transition-opacity duration-300",
            isUIVisible ? "opacity-100" : "opacity-0"
        )}>
            <Button
                onClick={() => setIsPaused(!isPaused)}
                size="lg"
                variant={isPaused ? "default" : "secondary"}
                className={cn("w-32 text-lg")}
            >
                {isPaused ? <Play className="mr-2 h-6 w-6" /> : <Pause className="mr-2 h-6 w-6" />}
                {isPaused ? "Resume" : "Pause"}
            </Button>
            <Button onClick={handleEndEarly} variant="destructive" size="lg" className="w-32 text-lg">
                <Square className="mr-2 h-5 w-5" />
                End
            </Button>
        </div>


      <AlertDialog open={isFinished} onOpenChange={setIsFinished}>
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
                className="bg-muted text-muted-foreground hover:bg-muted/80"
                onClick={() => handleSaveTask(false)}
                >
                No
                </AlertDialogAction>
                <AlertDialogAction
                 onClick={() => handleSaveTask(true)}
                 style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                >
                Yes!
                </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showMotivationalDialog} onOpenChange={handleMotivationalDialogChange}>
        <DialogContent>
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
