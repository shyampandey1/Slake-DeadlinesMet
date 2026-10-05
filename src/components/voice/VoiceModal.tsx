"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Edit2, Mic, MicOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVoiceController } from "@/hooks/useVoiceController";
import type { VoiceIntentPayload } from "@/types/voice";

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceModal({ isOpen, onClose }: VoiceModalProps) {
  const {
    isListening,
    transcript,
    waveformAmplitudes,
    detectedIntent,
    isProcessing,
    startListening,
    stopListening,
    cancelListening,
    executeIntent,
    error,
  } = useVoiceController();

  const [isEditing, setIsEditing] = useState(false);
  const [editedTaskName, setEditedTaskName] = useState("");
  const [editedDuration, setEditedDuration] = useState(15);

  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      cancelListening();
      setIsEditing(false);
    }
  }, [isOpen, startListening, cancelListening]);

  useEffect(() => {
    if (detectedIntent) {
      setEditedTaskName(detectedIntent.taskName || transcript || "Focus Session");
      setEditedDuration(detectedIntent.durationMinutes || 15);
    }
  }, [detectedIntent, transcript]);

  const handleConfirm = async () => {
    if (!detectedIntent) return;
    const finalIntent: VoiceIntentPayload = {
      ...detectedIntent,
      taskName: editedTaskName,
      durationMinutes: editedDuration,
    };
    await executeIntent(finalIntent);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative w-full max-w-xl bg-card border-t sm:border border-border rounded-t-[2rem] sm:rounded-3xl shadow-2xl p-6 sm:p-8 z-10 overflow-hidden"
        >
          {/* Top Drag Handle */}
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Body Content */}
          {!detectedIntent ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
              <div className="space-y-1">
                <p className="text-sm font-semibold tracking-wide text-emerald-500 flex items-center justify-center gap-1.5 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isProcessing ? "Analyzing Command..." : "Listening..."}
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-foreground">
                  {transcript || "Speak naturally to control timer, routine, or habits"}
                </h3>
              </div>

              {/* Dynamic Green Audio Waveform Bars */}
              <div className="flex items-center justify-center gap-1.5 h-16 w-full max-w-xs py-2">
                {waveformAmplitudes.map((amp, idx) => (
                  <motion.div
                    key={idx}
                    animate={{
                      height: `${Math.max(8, amp * 56)}px`,
                      opacity: isListening ? 0.7 + amp * 0.3 : 0.3,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="w-1.5 sm:w-2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-full"
                  />
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                {isListening ? (
                  <Button
                    onClick={stopListening}
                    variant="outline"
                    className="rounded-full px-5 border-border bg-card hover:bg-muted text-xs font-bold"
                  >
                    <MicOff className="w-3.5 h-3.5 mr-2 text-red-500" /> Done Speaking
                  </Button>
                ) : (
                  <Button
                    onClick={startListening}
                    className="rounded-full px-6 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20"
                  >
                    <Mic className="w-3.5 h-3.5 mr-2" /> Start Listening
                  </Button>
                )}
              </div>

              {error && (
                <p className="text-xs text-red-500 font-medium bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div>
                <h3 className="text-xl font-black text-foreground">Quick Setup</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Ready to start this task?</p>
              </div>

              {/* Transcript Display Box */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={editedTaskName}
                      onChange={(e) => setEditedTaskName(e.target.value)}
                      placeholder="Task name"
                      className="bg-card border-border font-bold text-foreground"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Duration (mins):</span>
                      <Input
                        type="number"
                        value={editedDuration}
                        onChange={(e) => setEditedDuration(parseInt(e.target.value, 10) || 5)}
                        className="w-24 bg-card border-border font-bold text-foreground"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-sm sm:text-base text-foreground break-words">
                      {editedTaskName || transcript}
                    </p>
                    <p className="text-xs font-bold text-emerald-500">
                      {editedDuration} minutes • {detectedIntent.category || "Productivity"}
                    </p>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Looks Good
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                  className="w-full h-11 border-border bg-card hover:bg-muted text-foreground font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {isEditing ? "Done Adjusting" : "Adjust"}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
