"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, Loader2, PartyPopper, Music, Music4 } from "lucide-react";
import { generateMotivationalMessage } from "@/ai/flows/generate-motivational-message";
import useLocalStorage from "@/hooks/useLocalStorage";
import type { Task } from "@/types";

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
import type { GetMusicForTaskOutput } from "@/ai/flows/get-music-vibe";
import WeatherDisplay from "./WeatherDisplay";

interface TimerDisplayProps {
  taskName: string;
  initialDuration: number; // in minutes
  musicInfo: GetMusicForTaskOutput | null;
}

export default function TimerDisplay({ taskName, initialDuration, musicInfo }: TimerDisplayProps) {
  const router = useRouter();
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", []);
  const [timeRemaining, setTimeRemaining] = useState(initialDuration * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showMotivationalDialog, setShowMotivationalDialog] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (musicInfo?.trackUrl) {
        audioRef.current = new Audio(musicInfo.trackUrl);
        audioRef.current.loop = true;
    }
  }, [musicInfo]);

  useEffect(() => {
    if (audioRef.current) {
        if (isMusicPlaying && !isPaused) {
            audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        } else {
            audioRef.current.pause();
        }
    }
  }, [isMusicPlaying, isPaused]);
  
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioRef.current) {
        audioRef.current.pause();
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    if(audioRef.current && isMusicPlaying){
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          stopTimer();
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer, isMusicPlaying]);

  useEffect(() => {
    if (!isPaused) {
      startTimer();
    } else {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        if (audioRef.current) {
            audioRef.current.pause();
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
    const newTask: Task = {
      id: new Date().toISOString(),
      name: taskName,
      duration: initialDuration,
      completed,
      createdAt: Date.now(),
    };
    setTasks([...tasks, newTask]);

    if (completed) {
      setIsLoadingAI(true);
      setShowMotivationalDialog(true);
      try {
        const pastTasks = tasks.slice(0, 5); // Use recent 5 tasks for context
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

  const toggleMusic = () => {
    setIsMusicPlaying(!isMusicPlaying);
  };


  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 transition-colors duration-500">
       <div className="absolute top-4 right-4">
        <WeatherDisplay />
      </div>
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
        {musicInfo && (
            <div className="mt-8">
                <Button onClick={toggleMusic} variant="ghost" size="sm">
                    {isMusicPlaying ? <Music className="mr-2" /> : <Music4 className="mr-2" />}
                    {isMusicPlaying ? "Mute" : "Unmute"}: <span className="ml-2 font-semibold">{musicInfo.trackName}</span><span className="ml-2 text-muted-foreground">({musicInfo.vibe})</span>
                </Button>
            </div>
        )}
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
