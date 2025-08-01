
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
import CircularProgress from "./CircularProgress";
import InfoDisplay from "./InfoDisplay";
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
  const { findAndSyncPresetTask } = usePresetTasks();
  const { isUIVisible, showUI } = useTimerUI();
  const { playSound } = useAudioSettings();
  const [timeRemaining, setTimeRemaining] = useState(initialDuration * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showMotivationalDialog, setShowMotivationalDialog] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState("");
  const [suggestedTask, setSuggestedTask] = useState<string | undefined>("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [flashState, setFlashState] = useState<FlashState>('none');


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
  }, [stopTimer, playSound]);

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

  // Extract HSL values from the color prop
  const timerColor = color ? `hsl(var(--${color.replace('bg-', '')}))` : 'hsl(var(--primary))';


  return (
    <main
      onClick={handleInteraction}
      onMouseMove={handleInteraction}
      className={cn(
        "relative flex min-h-screen w-full flex-col items-center justify-center p-4 transition-colors duration-500 text-white",
        {
          'animate-flash-breathing': flashState === 'breathing',
          'animate-flash-three-times': flashState === 'three-times',
          'animate-flash-continuous': flashState === 'continuous',
        },
        color ? `timer-theme-${color.replace('bg-', '')}` : ''
      )}
      style={{
        backgroundColor: '#0a0a0a',
        '--timer-primary-color': 'lightgray',
        '--timer-background-color': '#0a0a0a',
        '--flash-color': 'hsl(0 0% 100% / 0.1)',
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
          </CircularProgress>
        </div>
        <div className="flex items-center gap-4">
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
