
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Mic, MicOff, Loader2, Sparkles, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { processVoiceInput, ProcessVoiceInputOutput } from "@/ai/flows/process-voice-input";
import { getAvailableCategories, getAvailableIcons } from "@/hooks/useFirestore";
import { Badge } from "@/components/ui/badge";
import { usePresetTasks } from "@/hooks/useFirestore";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

export default function VoiceInput({ className }: { className?: string }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<ProcessVoiceInputOutput["tasks"]>([]);
  const { addPresetTask } = usePresetTasks();
  const { profile } = useProfile();
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = "en-US";
        recognitionInstance.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };
        recognitionInstance.onend = () => setIsListening(false);
        setRecognition(recognitionInstance);
      }
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognition) return alert("Speech recognition not supported.");
    if (isListening) {
      recognition.stop();
      handleProcessInput(transcript);
    } else {
      setTranscript("");
      recognition.start();
      setIsListening(true);
    }
  }, [recognition, isListening, transcript]);

  const handleProcessInput = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const result = await processVoiceInput({
        transcript: text,
        availableIcons: getAvailableIcons(),
        availableCategories: getAvailableCategories(),
      });
      if (result.tasks?.length > 0) {
        setSuggestedTasks(result.tasks);
        setIsDialogOpen(true);
      }
    } catch (error) { console.error(error); } finally { setIsProcessing(false); }
  };

  const handleAddTask = async (task: any) => {
    await addPresetTask({ name: task.name, duration: task.duration, icon: task.icon, category: task.category }, profile);
    setSuggestedTasks(prev => prev.filter(t => t !== task));
    if (suggestedTasks.length <= 1) setIsDialogOpen(false);
  };

  const addAllTasks = async () => {
    for (const task of suggestedTasks) await addPresetTask({ name: task.name, duration: task.duration, icon: task.icon, category: task.category }, profile);
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant={isListening ? "destructive" : "outline"}
          size="icon"
          className={cn("rounded-full w-12 h-12 shadow-lg", isListening && "animate-pulse scale-110", !isListening && "border-primary/50")}
          onClick={toggleListening}
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="animate-spin" /> : isListening ? <MicOff /> : <Mic />}
        </Button>
        {isListening && (
           <div className="bg-background/80 border border-primary/20 px-4 py-2 rounded-2xl shadow-xl max-w-[200px] truncate">
             <p className="text-xs font-bold text-primary animate-pulse">Listening...</p>
             <p className="text-sm truncate opacity-70 italic">{transcript || "Speak now..."}</p>
           </div>
        )}
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl"><Sparkles className="text-amber-500" /> Voice Tasks Detected</DialogTitle>
            <DialogDescription>Add summarized tasks to your routine.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4 max-h-[400px] overflow-y-auto">
            {suggestedTasks.map((task, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-card/50 border border-white/10 rounded-xl">
                <div className="flex-1"><h4 className="font-bold">{task.name}</h4><div className="flex items-center gap-2 mt-1"><Badge variant="secondary">{task.category}</Badge><span className="text-xs">{task.duration}m</span></div></div>
                <Button size="sm" variant="ghost" className="rounded-full" onClick={() => handleAddTask(task)}><Plus className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <DialogFooter className="flex sm:justify-between gap-2">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Discard</Button>
            <Button onClick={addAllTasks} className="gap-2"><Check className="h-4 w-4" /> Add All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
