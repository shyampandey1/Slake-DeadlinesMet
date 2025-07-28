
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, Loader2, PartyPopper } from "lucide-react";
import { generateMotivationalMessage } from "@/ai/flows/generate-motivational-message";
import { useTasks } from "@/hooks/useFirestore";
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
import InfoDisplay from "./InfoDisplay";
import MusicPlayer from "./MusicPlayer";

interface TimerDisplayProps {
  taskName: string;
  initialDuration: number; // in minutes
}

export default function TimerDisplay({ taskName, initialDuration }: TimerDisplayProps) {
  const router = useRouter();
  const { tasks, addTask } = useTasks();
  const [timeRemaining, setTimeRemaining] = useState(initialDuration * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showMotivationalDialog, setShowMotivationalDialog] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isEndingSoon, setIsEndingSoon] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tickAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const playTickSound = useCallback(() => {
    if (tickAudioRef.current) {
        tickAudioRef.current.currentTime = 0;
        tickAudioRef.current.play().catch(e => console.error("Tick sound play failed", e));
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          stopTimer();
          setIsFinished(true);
          return 0;
        }
        if (prev <= 11) { // Start flashing and ticking at 10 seconds
            setIsEndingSoon(true);
            playTickSound();
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer, playTickSound]);

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
  
  const handleEndEarly = () => {
    stopTimer();
    setIsPaused(true);
    setIsFinished(true);
  };

  const handleSaveTask = async (completed: boolean) => {
    const newTask: Omit<Task, 'id' | 'createdAt' | 'userId'> = {
      name: taskName,
      duration: initialDuration,
      completed,
    };
    await addTask(newTask);

    if (completed) {
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

  return (
    <main className={cn(
        "relative flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 transition-colors duration-500",
        isEndingSoon && "animate-flash"
    )}>
      <audio ref={tickAudioRef} src="https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8b16498ab.mp3" preload="auto" />
      <InfoDisplay />
      <div className="flex w-full max-w-4xl flex-col items-center justify-center text-center">
        <p className="mb-4 text-lg text-muted-foreground md:text-xl font-headline">FOCUSING ON:</p>
        <h1 className="mb-8 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl font-headline">
          {taskName}
        </h1>
        <div className="mb-12 font-code text-7xl font-bold text-primary sm:text-8xl md:text-9xl">
          {formatTime(timeRemaining)}
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsPaused(!isPaused)}
            variant="outline"
            size="lg"
            className="w-32 text-lg"
          >
            {isPaused ? <Play className="mr-2" /> : <Pause className="mr-2" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button onClick={handleEndEarly} variant="destructive" size="lg" className="w-32 text-lg">
            <Square className="mr-2" />
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
                    <p className="text-lg text-foreground">{motivationalMessage}</p>
                )}
                </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => router.push('/')} className="w-full">
              Back to Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
