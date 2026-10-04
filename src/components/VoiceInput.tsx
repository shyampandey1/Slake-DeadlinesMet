"use client";

import React, { useState } from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VoiceModal } from "@/components/voice/VoiceModal";

export default function VoiceInput({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className={cn(
          "relative h-11 w-11 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm group",
          className
        )}
        title="Voice Control (Hands-Free)"
      >
        <span className="absolute -inset-0.5 rounded-full bg-emerald-500/20 animate-ping opacity-75 group-hover:opacity-100" />
        <Mic className="h-5 w-5 relative z-10" />
      </Button>

      <VoiceModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
