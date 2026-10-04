"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DwellButtonProps extends ButtonProps {
  onDwellTrigger: () => void;
  dwellDuration?: number; // in milliseconds, default 1500ms (1.5s)
  isDwellEnabled?: boolean;
}

export const DwellButton: React.FC<DwellButtonProps> = ({
  onDwellTrigger,
  dwellDuration = 1500,
  isDwellEnabled = true,
  onClick,
  className,
  children,
  ...props
}) => {
  const [isDwelling, setIsDwelling] = useState(false);
  const [dwellProgress, setDwellProgress] = useState(0); // 0 to 1
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const cancelDwell = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    startTimeRef.current = null;
    setIsDwelling(false);
    setDwellProgress(0);
  }, []);

  const handleDwellComplete = useCallback(() => {
    cancelDwell();
    try {
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(50);
      }
    } catch {}
    onDwellTrigger();
  }, [cancelDwell, onDwellTrigger]);

  const startDwell = useCallback(() => {
    if (!isDwellEnabled || props.disabled) return;
    setIsDwelling(true);
    startTimeRef.current = performance.now();

    const step = (now: number) => {
      if (!startTimeRef.current) return;
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / dwellDuration);
      setDwellProgress(progress);

      if (progress >= 1) {
        handleDwellComplete();
      } else {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  }, [isDwellEnabled, props.disabled, dwellDuration, handleDwellComplete]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - dwellProgress);

  return (
    <div className="relative inline-flex items-center justify-center">
      <Button
        {...props}
        className={cn("relative overflow-visible z-10", className)}
        onClick={(e) => {
          cancelDwell();
          if (onClick) onClick(e);
          else onDwellTrigger();
        }}
        onMouseEnter={startDwell}
        onMouseLeave={cancelDwell}
        onFocus={startDwell}
        onBlur={cancelDwell}
      >
        {children}
      </Button>

      {/* 1.5-Second Radial Dwell Progress Ring */}
      {isDwellEnabled && (
        <svg
          className={cn(
            "absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] pointer-events-none z-20 transition-opacity duration-200",
            isDwelling ? "opacity-100" : "opacity-0"
          )}
          viewBox="0 0 52 52"
        >
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="3"
          />
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 26 26)"
            style={{
              filter: "drop-shadow(0 0 4px rgba(16, 185, 129, 0.7))",
            }}
          />
        </svg>
      )}
    </div>
  );
};

export default DwellButton;
