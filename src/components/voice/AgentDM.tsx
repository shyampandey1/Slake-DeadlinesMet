"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Sparkles, Volume2, CheckCircle2, ChevronDown, X, Clock, Droplets, Dumbbell, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceController } from "@/hooks/useVoiceController";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function AgentDM() {
  const [modalOpen, setModalOpen] = useState(false);

  const {
    isOpen,
    closeAgentDM,
    agentState,
    isListening,
    isThinking,
    isExecuting,
    isSpeaking,
    transcript,
    detectedIntent,
    startListening,
    stopListening,
    cancelListening,
    waveformFrequencies,
    error,
  } = useVoiceController();

  // If user taps the mic or HUD pill while speaking, interrupt and transition to LISTENING
  const handlePillClick = () => {
    if (isSpeaking) {
      cancelListening();
      startListening();
    } else if (isListening) {
      stopListening();
    } else if (agentState === 'IDLE') {
      startListening();
    } else {
      setModalOpen(true);
    }
  };

  const quickActions = [
    { label: "Log Water (+15 SC)", icon: Droplets, phrase: "log water" },
    { label: "Bed Made (+15 SC)", icon: CheckCircle2, phrase: "bed made" },
    { label: "Quick Stretch (+40 SC)", icon: Dumbbell, phrase: "quick stretch done" },
    { label: "Meditation 10m", icon: BrainCircuit, phrase: "start meditation for 10 minutes" },
    { label: "Deep Work 45m", icon: Clock, phrase: "deep work 45 minutes" },
  ];

  // Derive audio-reactive frequencies (16 equalizer bars)
  const activeFrequencies =
    waveformFrequencies && waveformFrequencies.length === 16
      ? waveformFrequencies
      : new Array(16).fill(0);

  return (
    <>
      {/* Viewport Floating HUD Capsule (Rendered conditionally when toggled on) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="agent-dm-floating-hud"
            initial={{ y: -60, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 select-none cursor-pointer flex flex-col items-center gap-1.5"
            onClick={handlePillClick}
          >
            <div
              className={cn(
                "backdrop-blur-xl bg-slate-950/90 border border-emerald-500/30 shadow-2xl rounded-full px-4 py-2 flex items-center gap-3 transition-all duration-300",
                "hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]",
                isListening && "border-emerald-500/70 shadow-[0_0_30px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/30",
                isThinking && "border-blue-500/70 shadow-[0_0_30px_rgba(59,130,246,0.4)] ring-2 ring-blue-500/30",
                isSpeaking && "border-emerald-400/80 shadow-[0_0_35px_rgba(16,185,129,0.45)] ring-2 ring-emerald-400/40",
                isExecuting && "border-emerald-400/90 shadow-[0_0_30px_rgba(52,211,153,0.45)]"
              )}
            >
              {/* Status Indicator Icon */}
              <div className="relative flex items-center justify-center">
                {agentState === 'IDLE' && (
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                )}

                {agentState === 'LISTENING' && (
                  <motion.div
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ repeat: Infinity, duration: 1.1 }}
                    className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]"
                  />
                )}

                {agentState === 'THINKING' && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full shadow-[0_0_10px_#3b82f6]"
                  />
                )}

                {agentState === 'EXECUTING' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                )}

                {agentState === 'SPEAKING' && (
                  <Volume2 className="w-4 h-4 text-emerald-300 animate-pulse" />
                )}
              </div>

              {/* Central Label & Dynamic Waveform Equalizer */}
              <div className="flex items-center gap-2">
                {agentState === 'IDLE' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent font-headline">
                      Agent DM
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      • Click to Speak
                    </span>
                  </div>
                )}

                {agentState === 'LISTENING' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-300 font-mono tracking-wide">
                      {transcript ? (
                        <span className="truncate max-w-[120px] sm:max-w-[180px] inline-block font-sans text-white">
                          "{transcript}"
                        </span>
                      ) : (
                        "Listening..."
                      )}
                    </span>
                    {/* Listening Rhythm Bars */}
                    <div className="flex items-center gap-[2.5px] h-5 px-1">
                      {[0.4, 0.8, 0.6, 1.0, 0.7, 0.9, 0.5, 0.85, 0.45, 0.75, 1.0, 0.65, 0.9, 0.5, 0.8, 0.35].map((baseHeight, idx) => (
                        <motion.div
                          key={idx}
                          className="w-[2.5px] bg-emerald-400 rounded-full"
                          animate={{
                            height: ['4px', String(Math.max(6, baseHeight * 18)) + 'px', '4px'],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.6 + (idx % 4) * 0.12,
                            delay: idx * 0.04,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {agentState === 'THINKING' && (
                  <span className="text-xs font-bold text-blue-300 font-mono tracking-wide animate-pulse">
                    Parsing Intent...
                  </span>
                )}

                {agentState === 'EXECUTING' && (
                  <span className="text-xs font-bold text-emerald-300 font-mono tracking-wide">
                    Executing...
                  </span>
                )}

                {agentState === 'SPEAKING' && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-emerald-300 font-mono tracking-wide">
                      Agent DM
                    </span>
                    {/* Real-time Audio-Reactive Frequency Equalizer Bars */}
                    <div className="flex items-center gap-[2.5px] h-5 px-1">
                      {activeFrequencies.map((freq, idx) => {
                        const barHeight = Math.max(4, Math.min(22, Math.round(freq * 22)));
                        return (
                          <div
                            key={idx}
                            style={{ height: barHeight + 'px' }}
                            className="w-[2.5px] bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-full transition-[height] duration-75 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: Modal expansion & Close button */}
              <div className="flex items-center gap-0.5 ml-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalOpen(true);
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Expand Agent DM Commands"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeAgentDM();
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                  title="Close Agent DM"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Speaking Caption subtitle under HUD pill */}
            {isSpeaking && detectedIntent?.speechFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-3 py-1 bg-slate-950/80 border border-emerald-500/20 backdrop-blur-md rounded-full shadow-lg max-w-[280px] sm:max-w-[360px] text-center"
              >
                <span className="text-[11px] text-emerald-200 font-medium truncate inline-block w-full">
                  "{detectedIntent.speechFeedback}"
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Interactive Command Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-slate-950/95 border border-emerald-500/30 text-white p-6 rounded-3xl backdrop-blur-2xl shadow-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline text-lg text-emerald-400">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Agent DM • Voice Intelligence HUD
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Hands-free voice execution powered by Studio-Grade Neural TTS & JEV TypeSafe Decision Engine.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Live Transcript / Speech Feedback */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-mono tracking-wider">
                <span>Active Speech Status</span>
                <span className="text-emerald-400 font-bold">{agentState}</span>
              </div>
              <p className="text-sm font-medium text-slate-200 min-h-[24px] italic">
                {transcript ? '"' + transcript + '"' : detectedIntent?.speechFeedback || "Ready for voice command..."}
              </p>
            </div>

            {/* Quick Action Chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Suggested Commands
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickActions.map((action, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setModalOpen(false);
                      startListening();
                    }}
                    className="justify-start gap-2 h-9 text-xs bg-white/5 border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-slate-200 hover:text-white"
                  >
                    <action.icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Controller Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  if (isListening) stopListening();
                  else startListening();
                }}
                className={cn(
                  "flex-1 font-bold h-11 text-xs gap-2 rounded-xl transition-all",
                  isListening
                    ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40"
                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                )}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" /> Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" /> Speak Command
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="h-11 px-4 text-xs font-bold rounded-xl border-white/10 hover:bg-white/10"
              >
                Close
              </Button>
            </div>

            {error && (
              <p className="text-xs text-red-400 font-medium bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                {error}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
