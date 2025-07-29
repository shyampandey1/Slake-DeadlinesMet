
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, Loader2, PartyPopper, ArrowRight } from "lucide-react";
import { generateMotivationalMessage } from "@/ai/flows/generate-motivational-message";
import { useTasks, usePresetTasks } from "@/hooks/useFirestore";
import type { Task } from "@/types";
import { cn } from "@/lib/utils";

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
import { useAudio } from "@/hooks/useAudio";
import CircularProgress from "./CircularProgress";
import MusicPlayer from "./MusicPlayer";

interface TimerDisplayProps {
  taskName: string;
  initialDuration: number; // in minutes
  category?: string;
  color?: string;
}

type FlashState = 'none' | 'three-times' | 'continuous';

export default function TimerDisplay({ taskName, initialDuration, category, color }: TimerDisplayProps) {
  const router = useRouter();
  const { tasks, addTask } = useTasks();
  const { findAndSyncPresetTask } = usePresetTasks();
  const { isAudioEnabled, requestAudioPermission } = useAudio();
  const [timeRemaining, setTimeRemaining] = useState(initialDuration * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showMotivationalDialog, setShowMotivationalDialog] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState("");
  const [suggestedTask, setSuggestedTask] = useState<string | undefined>("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [flashState, setFlashState] = useState<FlashState>('none');
  const [timerTheme, setTimerTheme] = useState({ primary: 'hsl(var(--primary))', background: 'hsl(var(--background))'});

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tickAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (color) {
        // Example color format from hook: 'bg-green-800 text-green-100'
        const bgMatch = color.match(/bg-([a-z]+)-(\d+)/);
        if (bgMatch) {
            const [, colorName, strength] = bgMatch;
            const newPrimaryStrength = Math.min(parseInt(strength) - 200, 900);
            const newBgStrength = Math.max(parseInt(strength) + 100, 50);

            // This is a rough approximation and depends heavily on your tailwind config.
            // Using CSS variables directly might be a better approach if your colors are defined there.
            // For now, we construct dynamic class names and rely on tailwind safelist.
            // A more robust solution involves setting CSS variables dynamically.
            
            // Let's try setting CSS variables instead for better control
            const root = document.documentElement;
            const style = getComputedStyle(root);
            
            // This is an imperfect way to map tailwind color names to HSL values
            // We'll hardcode some mappings for this to work. This is a simplification.
            const colorMap: {[key: string]: string} = {
              'slate': '222.2 47.4%',
              'blue': '221.2 83.2%',
              'green': '142.1 76.2%',
              'orange': '24.6 95%',
              'indigo': '243.1 94.8%',
              'rose': '346.8 77.2%',
            }
            
            if (colorName in colorMap) {
                const baseHsl = colorMap[colorName];
                const primaryLightness = strength === '800' ? '30%' : '40%';
                const bgLightness = strength === '800' ? '15%' : '20%';
                
                setTimerTheme({
                    primary: `hsl(${baseHsl} ${primaryLightness})`,
                    background: `hsl(${baseHsl} ${bgLightness} / 0.4)`,
                })
            }
        }
    }
  }, [color]);


  const playTickSound = useCallback(() => {
    if (tickAudioRef.current && isAudioEnabled) {
        tickAudioRef.current.currentTime = 0;
        tickAudioRef.current.play().catch(e => console.error("Tick sound play failed", e));
    }
  }, [isAudioEnabled]);

  const startTimer = useCallback(() => {
    stopTimer();
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          stopTimer();
          setIsFinished(true);
          setFlashState('none');
          return 0;
        }
        
        if (prev <= 4) {
          setFlashState('continuous');
        } else if (prev <= 11) {
          setFlashState('three-times');
        }

        if (prev <= 11 && prev > 1) { 
            playTickSound();
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer, playTickSound]);

  useEffect(() => {
    requestAudioPermission();
  }, [requestAudioPermission]);

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
    router.push(`/timer?${params.toString()}`);
  }

  const handleSaveTask = async (completed: boolean) => {
    const timeSpentInSeconds = (initialDuration * 60) - timeRemaining;
    const actualDuration = Math.max(1, Math.round(timeSpentInSeconds / 60));

    const newTask: Omit<Task, 'id' | 'createdAt' | 'userId'> = {
      name: taskName,
      duration: actualDuration,
      completed,
    };
    await addTask(newTask);

    if (completed) {
      await findAndSyncPresetTask(taskName, actualDuration);
      setIsLoadingAI(true);
      setShowMotivationalDialog(true);
      try {
        const pastTasks = tasks.slice(0, 5).map(t => ({taskName: t.name, duration: t.duration, completionStatus: t.completed}));
        const result = await generateMotivationalMessage({
          taskName: newTask.name,
          duration: newTask.duration,
          completionStatus: true,
          pastTasks,
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  
  const progress = (timeRemaining / (initialDuration * 60)) * 100;


  return (
    <main
      className={cn(
        "relative flex min-h-screen w-full flex-col items-center justify-center p-4 transition-colors duration-500",
        {
          'animate-flash-three-times': flashState === 'three-times',
          'animate-flash-continuous': flashState === 'continuous',
        }
      )}
      style={{
        '--timer-primary-color': timerTheme.primary,
        '--timer-background-color': timerTheme.background,
         backgroundColor: 'var(--timer-background-color)'
      } as React.CSSProperties}
    >
      <audio ref={tickAudioRef} src="https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8b16498ab.mp3" preload="auto" />
      <div className="flex w-full max-w-4xl flex-col items-center justify-center text-center">
        <h2 className="mb-2 text-xl font-medium tracking-wide text-foreground/80">{category || 'Focus Session'}</h2>
        <h1 className="mb-8 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl font-headline">
          {taskName}
        </h1>
        <div className="mb-12">
          <CircularProgress progress={progress}>
            <div
              className="font-code text-5xl font-bold sm:text-6xl md:text-7xl"
              style={{ color: 'var(--timer-primary-color)' }}
            >
              {formatTime(timeRemaining)}
            </div>
          </CircularProgress>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsPaused(!isPaused)}
            size="lg"
            className={cn("w-32 text-lg")}
            style={{ 
                backgroundColor: isPaused ? 'var(--timer-primary-color)' : 'hsl(var(--accent))',
                color: isPaused ? 'hsl(var(--primary-foreground))' : 'hsl(var(--accent-foreground))'
            }}
          >
            {isPaused ? <Play className="mr-2 h-6 w-6" /> : <Pause className="mr-2 h-6 w-6" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button onClick={handleEndEarly} variant="destructive" size="lg" className="w-32 text-lg">
            <Square className="mr-2 h-5 w-5" />
            End
          </Button>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <MusicPlayer />
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

      <Dialog open={showMotivationalDialog} onOpenChange={setShowMotivationalDialog}>
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
            <Button onClick={() => router.push('/')} className="w-full mt-2">
              Back to Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
