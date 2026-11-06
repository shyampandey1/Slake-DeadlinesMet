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
          ? "bg-primary text-slate-950 border border-primary/60 shadow-[0_0_20px_rgba(245,197,66,0.35)] scale-105"
          : "bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 backdrop-blur-md",
        className
      )}
      title={isOpen ? "Agent DM Active • Click to Toggle Off" : "Toggle Agent DM (Hands-Free Voice)"}
      aria-label="Toggle Agent DM Voice Control"
    >
      {isOpen ? (
        <>
          {isListening ? (
            <Mic className="h-5 w-5 relative z-10 animate-pulse text-slate-950" />
          ) : (
            <MicOff className="h-5 w-5 relative z-10 text-slate-950" />
          )}
        </>
      ) : (
        <Mic className="h-5 w-5 relative z-10" />
      )}
    </Button>
  );
}
