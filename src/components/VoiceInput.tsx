"use client";

import React from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVoiceController } from "@/hooks/useVoiceController";

export default function VoiceInput({ className }: { className?: string }) {
  const { isOpen, isListening, toggleAgentDM } = useVoiceController();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleAgentDM}
      className={cn(
        "relative h-11 w-11 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm group",
        isOpen
          ? "bg-emerald-500 text-slate-950 border border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-105"
          : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30",
        className
      )}
      title={isOpen ? "Agent DM Active • Click to Toggle Off" : "Toggle Agent DM (Hands-Free Voice)"}
      aria-label="Toggle Agent DM Voice Control"
    >
      {isOpen ? (
        <>
          <span className="absolute -inset-1 rounded-full bg-emerald-400/40 animate-ping opacity-75" />
          {isListening ? (
            <Mic className="h-5 w-5 relative z-10 animate-pulse text-slate-950" />
          ) : (
            <MicOff className="h-5 w-5 relative z-10 text-slate-950" />
          )}
        </>
      ) : (
        <>
          <span className="absolute -inset-0.5 rounded-full bg-emerald-500/20 animate-ping opacity-75 group-hover:opacity-100" />
          <Mic className="h-5 w-5 relative z-10" />
        </>
      )}
    </Button>
  );
}
