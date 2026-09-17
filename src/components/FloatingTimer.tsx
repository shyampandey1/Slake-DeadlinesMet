"use client";

import React, { useState, useEffect } from "react";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { usePathname, useRouter } from "next/navigation";
import { Play, Pause, X, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function FloatingTimer() {
  const { activeTimer, updateTimer, clearTimer } = useActiveTimer();
  const pathname = usePathname();
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState(0);

  const isTimerPage = pathname?.startsWith("/timer");

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

  const handlePillClick = () => {
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
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, x: "-50%", opacity: 0 }}
        animate={{ y: 0, x: "-50%", opacity: 1 }}
        exit={{ y: -50, x: "-50%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={handlePillClick}
        className={cn(
          "fixed top-4 left-1/2 z-[100] cursor-pointer",
          "w-[92%] sm:w-auto min-w-[280px] sm:min-w-[340px] max-w-md",
          "bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.4)]",
          "rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-white transition-all hover:bg-slate-900/90"
        )}
      >
        {/* Active Breathing Pulse indicator */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative flex items-center justify-center shrink-0">
            <span className="absolute inline-flex h-3 w-3 rounded-full bg-primary opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/80 leading-none mb-1">
              Active Focus
            </span>
            <span className="text-xs font-bold truncate pr-2 text-white/95">
              {activeTimer.taskName}
            </span>
          </div>
        </div>

        {/* Live Timer Counter and Control Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-sm font-black bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-primary shadow-inner">
            {formatTime(timeRemaining)}
          </span>

          <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
            <button
              onClick={handlePlayPause}
              className={cn(
                "p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0",
                activeTimer.isPaused && "text-emerald-400 hover:text-emerald-300"
              )}
              title={activeTimer.isPaused ? "Resume Timer" : "Pause Timer"}
            >
              {activeTimer.isPaused ? (
                <Play className="h-4 w-4 fill-current" />
              ) : (
                <Pause className="h-4 w-4 fill-current" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
              title="Stop Session"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
