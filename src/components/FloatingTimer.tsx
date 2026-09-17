"use client";

import React, { useState, useEffect, useRef } from "react";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { usePathname, useRouter } from "next/navigation";
import { Play, Pause, X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FloatingTimer() {
  const { activeTimer, updateTimer, clearTimer } = useActiveTimer();
  const pathname = usePathname();
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Position state for reliable dragging without library constraints
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialPosX: number; initialPosY: number }>({
    startX: 0,
    startY: 0,
    initialPosX: 16,
    initialPosY: 80,
  });
  const widgetRef = useRef<HTMLDivElement>(null);

  const isTimerPage = pathname?.startsWith("/timer");

  // Initialize position on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Default: bottom left, safely above bottom nav
      const defaultY = Math.max(100, window.innerHeight - 130);
      setPosition({ x: 16, y: defaultY });
    }
  }, []);

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only primary button
    if (e.button !== 0) return;

    isDraggingRef.current = false;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: position ? position.x : 16,
      initialPosY: position ? position.y : 100,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaY = moveEvent.clientY - dragStartRef.current.startY;

      // Mark as dragging once user moves more than 4 pixels
      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        isDraggingRef.current = true;
      }

      if (isDraggingRef.current) {
        const elWidth = widgetRef.current?.offsetWidth || 300;
        const elHeight = widgetRef.current?.offsetHeight || 60;
        const maxX = Math.max(16, window.innerWidth - elWidth - 16);
        const maxY = Math.max(16, window.innerHeight - elHeight - 16);

        const newX = Math.min(Math.max(12, dragStartRef.current.initialPosX + deltaX), maxX);
        const newY = Math.min(Math.max(12, dragStartRef.current.initialPosY + deltaY), maxY);

        setPosition({ x: newX, y: newY });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      // Keep isDraggingRef true momentarily so click event is ignored
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 100);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  // Keep timeRemaining in sync with the activeTimer
  useEffect(() => {
    if (!activeTimer) return;

    const calculateTimeRemaining = () => {
      if (activeTimer.isPaused) {
        return activeTimer.timeLeftWhenPaused !== undefined
          ? Math.max(0, Math.round(activeTimer.timeLeftWhenPaused))
          : activeTimer.initialDuration * 60;
      }
      const diff = Math.max(
        0,
        Math.round((activeTimer.expectedEndTime - Date.now()) / 1000)
      );
      return diff;
    };

    setTimeRemaining(calculateTimeRemaining());

    if (activeTimer.isPaused) return;

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        const dedupeKey = `notified_floating_${activeTimer.expectedEndTime}`;
        if (sessionStorage.getItem(dedupeKey) !== "true") {
          sessionStorage.setItem(dedupeKey, "true");
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            const taskTitle = activeTimer.taskName;
            if ("serviceWorker" in navigator) {
              navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification("Session Complete!", {
                  body: `Time's up! You've finished: ${taskTitle}`,
                  icon: "/icon.svg",
                  badge: "/icon.svg",
                  tag: "timer-done",
                  vibrate: [300, 100, 300],
                  data: { url: "/timer?from_notification=true", type: "TIMER" },
                  requireInteraction: true,
                });
              }).catch(() => {});
            }
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  if (isTimerPage || !activeTimer || timeRemaining <= 0) {
    return null;
  }

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handlePillClick = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const params = new URLSearchParams({
      task: activeTimer.taskName,
      duration: activeTimer.initialDuration.toString(),
    });
    if (activeTimer.category) params.set("category", activeTimer.category);
    if (activeTimer.color) params.set("color", activeTimer.color);
    if (activeTimer.coOpSessionId) params.set("coOpSessionId", activeTimer.coOpSessionId);
    if (activeTimer.expectedEndTime) params.set("expectedEndTime", activeTimer.expectedEndTime.toString());

    router.push(`/timer?${params.toString()}`);
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPaused = !activeTimer.isPaused;
    updateTimer({ isPaused: newPaused }, timeRemaining);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Stop the active focus session?")) {
      clearTimer();
    }
  };

  return (
    <div
      ref={widgetRef}
      onPointerDown={handlePointerDown}
      onClick={handlePillClick}
      style={{
        position: "fixed",
        left: position ? `${position.x}px` : "16px",
        top: position ? `${position.y}px` : "auto",
        bottom: position ? "auto" : "80px",
        touchAction: "none",
        userSelect: "none",
        zIndex: 9999,
      }}
      className={cn(
        "cursor-grab active:cursor-grabbing select-none",
        "w-auto max-w-[calc(100vw-32px)] sm:max-w-md",
        "bg-slate-950/95 backdrop-blur-2xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.6)]",
        "rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-white transition-shadow hover:border-white/30 active:scale-[0.99]"
      )}
    >
      {/* Drag Handle Indicator */}
      <div 
        className="text-white/40 hover:text-white/90 transition-colors flex items-center shrink-0 pr-0.5 -ml-1 cursor-grab active:cursor-grabbing" 
        title="Drag to move notification anywhere"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Active Breathing Pulse indicator & Task Title */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1 pointer-events-none">
        <div className="relative flex items-center justify-center shrink-0">
          <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-primary opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-black uppercase tracking-widest text-primary/90 leading-none mb-0.5">
            Active Focus
          </span>
          <span className="text-xs font-bold truncate max-w-[120px] sm:max-w-[180px] text-white/95">
            {activeTimer.taskName}
          </span>
        </div>
      </div>

      {/* Live Timer Counter and Control Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-xs sm:text-sm font-black bg-white/10 border border-white/10 px-2 py-0.5 rounded-lg text-primary shadow-inner tracking-tight pointer-events-none">
          {formatTime(timeRemaining)}
        </span>

        <div className="flex items-center gap-1 border-l border-white/15 pl-2">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handlePlayPause}
            className={cn(
              "p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer",
              activeTimer.isPaused && "text-emerald-400 hover:text-emerald-300"
            )}
            title={activeTimer.isPaused ? "Resume Timer" : "Pause Timer"}
          >
            {activeTimer.isPaused ? (
              <Play className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Pause className="h-3.5 w-3.5 fill-current" />
            )}
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleClose}
            className="p-1.5 rounded-full text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
            title="Stop Session"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
