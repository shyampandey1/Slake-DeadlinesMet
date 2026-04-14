
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, X, Check, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePresetTasks } from "@/hooks/useFirestore";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

const SUGGESTED_CHIPS = [
  { name: 'Quick Water Break', duration: 5, category: 'health', icon: 'droplet' },
  { name: 'Start Deep Work', duration: 60, category: 'work', icon: 'briefcase' },
  { name: '5m Breathing', duration: 5, category: 'health', icon: 'wind' },
];

const SCAN_KEYWORDS = [
  { keyword: 'water', task: { name: 'Water Break', duration: 5, category: 'health', icon: 'droplet' } },
  { keyword: 'coding', task: { name: 'Coding Session', duration: 60, category: 'work', icon: 'code' } },
  { keyword: 'meditation', task: { name: 'Meditation', duration: 10, category: 'health', icon: 'moon' } },
  { keyword: 'meditate', task: { name: 'Meditation', duration: 10, category: 'health', icon: 'moon' } },
  { keyword: 'exercise', task: { name: 'Exercise', duration: 30, category: 'fitness', icon: 'activity' } },
  { keyword: 'meeting', task: { name: 'Meeting', duration: 30, category: 'work', icon: 'users' } },
];

export default function VoiceInput({ className }: { className?: string }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [detectedTask, setDetectedTask] = useState<any | null>(null);
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [setupTask, setSetupTask] = useState<any | null>(null);

  const transcriptRef = useRef("");
  
  const { profile } = useProfile();
  const router = useRouter();

  // Keyword scanning logic
  useEffect(() => {
    if (!transcript) return;
    const lowerTranscript = transcript.toLowerCase();
    
    // Find the first matching keyword
    const match = SCAN_KEYWORDS.find(k => lowerTranscript.includes(k.keyword));
    if (match) {
      setDetectedTask(match.task);
    } else {
      setDetectedTask(null);
    }
  }, [transcript]);

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
          setTranscript("");
          transcriptRef.current = "";
          setDetectedTask(null);
          setShowQuickSetup(false);
        };

        recognitionInstance.onresult = (event: any) => {
          let currentTranscript = "";
          let isFinal = false;
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
            if (event.results[i].isFinal) {
               isFinal = true;
            }
          }
          setTranscript(currentTranscript);
          transcriptRef.current = currentTranscript;
          
          if (isFinal) {
             recognitionInstance.stop();
          }
        };

        recognitionInstance.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setError(`Error: ${event.error}`);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
          // If a keyword was detected, open quick setup
          if (detectedTask && !showQuickSetup) {
             setSetupTask(detectedTask);
             setShowQuickSetup(true);
          } else if (transcriptRef.current.trim() && !detectedTask) {
             // Incomplete voice command fallback -> prefill fields
             setSetupTask({ name: transcriptRef.current.trim().substring(0, 30), duration: 15, category: 'other', icon: 'file' });
             setShowQuickSetup(true);
          }
        };

        setRecognition(recognitionInstance);
      } else {
        setError("Speech recognition is not supported in this browser.");
      }
    }
  }, [detectedTask, showQuickSetup]);

  const toggleListening = useCallback(() => {
    if (!recognition) {
       setError("Speech recognition not supported.");
       return;
    }
    
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }
    }
  }, [recognition, isListening]);

  const startTimerRoute = (task: any) => {
    const params = new URLSearchParams({
      task: task.name,
      duration: task.duration.toString(),
    });
    if (task.category) {
      params.append("category", task.category);
    }
    router.push(`/timer?${params.toString()}`);
  }

  const handleChipClick = (task: any) => {
    if (isListening) recognition.stop();
    // directly start the timer for chip suggestions
    startTimerRoute(task);
  };

  const handleStartTask = () => {
    if (setupTask) {
       startTimerRoute(setupTask);
       setShowQuickSetup(false);
       setSetupTask(null);
       setTranscript("");
    }
  };

  const handleAdjustTask = () => {
    // Closes Quick setup so user can try again or ideally would open full task editor
    setShowQuickSetup(false);
    setSetupTask(null);
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
        >
          {isListening ? <MicOff /> : <Mic />}
        </Button>
      </div>

      {/* Slide-Up Overlay */}
      <AnimatePresence>
        {isListening && !showQuickSetup && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col justify-between max-h-[60vh] h-[50vh] bg-[#0d0d0d]/80 backdrop-blur-xl border-t border-white/10 rounded-t-3xl pb-[env(safe-area-inset-bottom)] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            {/* Top section: Close & Transcript */}
            <div className="flex flex-col items-center flex-1 w-full relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 text-white/50 hover:text-white rounded-full bg-white/5 hover:bg-white/10" 
                onClick={toggleListening}
              >
                <X className="w-5 h-5" />
              </Button>

              <div className="w-full text-center mt-8 mb-4 max-h-[100px] overflow-y-auto px-4">
                <AnimatePresence mode="popLayout">
                  <motion.p 
                    key={transcript}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "text-2xl font-semibold tracking-tight leading-tight",
                      transcript ? "text-white" : "text-white/40 italic"
                    )}
                  >
                    {transcript || "Listening..."}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Dynamic Action Chip */}
              <AnimatePresence>
                {detectedTask && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="mt-2"
                  >
                    <Button 
                      onClick={() => { setSetupTask(detectedTask); setShowQuickSetup(true); }}
                      className="rounded-full bg-[#10b981] hover:bg-[#10b981]/90 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] px-6 py-6 font-bold text-lg gap-2"
                    >
                      <Check className="w-5 h-5" /> Confirm & Start {detectedTask.name}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Section: Visualizer & Suggestions */}
            <div className="w-full flex flex-col items-center gap-6 mt-auto">
              
              {/* Fake Audio Visualizer */}
              <div className="flex items-center gap-1.5 h-16">
                {Array.from({ length: 15 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: isListening ? [10, Math.random() * 40 + 20, 10] : 4 
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.5 + Math.random() * 0.5, 
                      delay: i * 0.05 
                    }}
                    className={cn(
                      "w-1.5 rounded-full",
                      isListening ? "bg-[#10b981]" : "bg-white/20"
                    )}
                  />
                ))}
              </div>

              <div className="w-full overflow-x-auto scrollbar-hide pb-2">
                <div className="flex gap-3 px-1 w-max">
                  {SUGGESTED_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChipClick(chip)}
                      className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 whitespace-nowrap text-sm font-medium transition-colors"
                    >
                      {chip.name}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Setup Modal */}
      <AnimatePresence>
        {showQuickSetup && setupTask && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-[#0d0d0d] border-t border-white/10 rounded-t-3xl pt-6 px-6 pb-12 max-h-[85vh] shadow-[0_-20px_40px_rgba(0,0,0,0.8)]"
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
            
            <h2 className="text-2xl font-bold text-white mb-2">Quick Setup</h2>
            <p className="text-white/60 mb-8">Ready to start this task?</p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
              <h3 className="text-xl font-semibold text-white mb-1">{setupTask.name}</h3>
              <p className="text-[#10b981] font-medium">{setupTask.duration} minutes</p>
            </div>

            <div className="flex flex-col gap-3 mt-auto mb-6">
              <Button 
                onClick={handleStartTask}
                className="w-full bg-[#10b981] hover:bg-[#10b981]/90 text-white rounded-2xl py-6 text-lg font-bold shadow-lg"
              >
                <Check className="w-5 h-5 mr-2" /> Looks Good
              </Button>
              <Button 
                variant="outline"
                onClick={handleAdjustTask}
                className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-2xl py-6 text-lg font-semibold"
              >
                <Edit2 className="w-5 h-5 mr-2" /> Adjust
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
