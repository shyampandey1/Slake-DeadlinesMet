
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, Loader2, Sparkles, Plus, Check, X, AlertCircle, Clock } from "lucide-react";
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
import { getAvailableCategories, getAvailableIcons, usePresetTasks } from "@/hooks/useFirestore";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export default function VoiceInput({ className }: { className?: string }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<ProcessVoiceInputOutput["tasks"]>([]);
  const { addPresetTask } = usePresetTasks();
  const { profile } = useProfile();
  const [recognition, setRecognition] = useState<any>(null);
  const transcriptRef = useRef("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = "en-US";

        recognitionInstance.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognitionInstance.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
          transcriptRef.current = currentTranscript;
        };

        recognitionInstance.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setError(`Error: ${event.error}`);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
          if (transcriptRef.current.trim()) {
            handleProcessInput(transcriptRef.current);
          }
        };

        setRecognition(recognitionInstance);
      } else {
        setError("Speech recognition is not supported in this browser.");
      }
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognition) {
       setError("Speech recognition not supported.");
       return;
    }
    
    if (isListening) {
      recognition.stop();
    } else {
      setTranscript("");
      transcriptRef.current = "";
      setError(null);
      try {
        recognition.start();
      } catch (e) {
        console.error("Failed to start recognition:", e);
        setError("Failed to start microphone. Please check permissions.");
      }
    }
  }, [recognition, isListening]);

  const handleProcessInput = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const result = await processVoiceInput({
        transcript: text,
        availableIcons: getAvailableIcons(),
        availableCategories: getAvailableCategories(),
      });
      if (result.tasks && result.tasks.length > 0) {
        setSuggestedTasks(result.tasks);
        setIsConfirmDialogOpen(true);
      } else {
        setError(`No tasks found in: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}". Try speaking more clearly.`);
      }
    } catch (error) {
      console.error(error);
      setError("Failed to process your request. Please try again.");
    } finally {
      setIsProcessing(false);
      transcriptRef.current = "";
    }
  };

  const handleAddTask = async (task: any) => {
    await addPresetTask({ name: task.name, duration: task.duration, icon: task.icon, category: task.category }, profile);
    setSuggestedTasks(prev => prev.filter(t => t !== task));
    if (suggestedTasks.length <= 1) setIsConfirmDialogOpen(false);
  };

  const addAllTasks = async () => {
    for (const task of suggestedTasks) {
      await addPresetTask({ name: task.name, duration: task.duration, icon: task.icon, category: task.category }, profile);
    }
    setIsConfirmDialogOpen(false);
  };

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant={isListening ? "destructive" : "outline"}
          size="icon"
          className={cn(
            "rounded-full w-12 h-12 shadow-lg transition-all duration-300", 
            isListening && "animate-pulse scale-110", 
            !isListening && "border-primary/50 hover:border-primary"
          )}
          onClick={toggleListening}
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="animate-spin" /> : isListening ? <MicOff /> : <Mic />}
        </Button>
      </div>

      {/* Live Caption Overlay */}
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-0 bottom-8 z-50 flex justify-center px-4"
          >
            <div className="bg-card/90 backdrop-blur-xl border border-primary/20 p-6 rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [8, 16, 8] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                        className="w-1 bg-primary rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Listening Live</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => recognition?.stop()}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="min-h-[60px] max-h-[120px] overflow-y-auto">
                <p className={cn("text-lg font-medium leading-relaxed", !transcript && "text-muted-foreground italic")}>
                  {transcript || "Start speaking to see captions..."}
                </p>
              </div>
              
              <p className="text-[10px] text-muted-foreground text-center animate-pulse">
                Click the mic or stop icon when finished
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-20 right-4 z-50"
          >
             <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg backdrop-blur-md">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{error}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full ml-2" onClick={() => setError(null)}>
                  <X className="h-3 w-3" />
                </Button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md overflow-hidden p-0 rounded-3xl border-none bg-card/95 backdrop-blur-2xl shadow-2xl">
          <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl font-headline">
                <Sparkles className="text-amber-500 fill-amber-500/20" /> 
                Tasks Identified
              </DialogTitle>
              <DialogDescription className="text-base">
                I've analyzed your input and found {suggestedTasks.length} task{suggestedTasks.length > 1 ? 's' : ''}.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide">
            {suggestedTasks.map((task, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group flex items-center justify-between p-4 bg-background/40 hover:bg-background/60 border border-white/5 hover:border-primary/20 rounded-2xl transition-all duration-300 shadow-sm"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{task.name}</h4>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary-foreground/90 border-none px-2 py-0 text-[10px] uppercase">
                      {task.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                       <Clock className="h-3 w-3" />
                       {task.duration}m
                    </div>
                  </div>
                </div>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="rounded-full h-10 w-10 shadow-sm hover:scale-110 active:scale-95 transition-all" 
                  onClick={() => handleAddTask(task)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </motion.div>
            ))}
          </div>
          
          <DialogFooter className="p-6 pt-2 flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto rounded-xl"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Discard All
            </Button>
            <Button 
              onClick={addAllTasks} 
              className="w-full sm:flex-1 rounded-xl shadow-lg shadow-primary/20 gap-2 font-bold"
            >
              <Check className="h-5 w-5" /> Add All Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
