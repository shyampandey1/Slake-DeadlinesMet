"use client";

import { useEffect, useRef } from "react";

interface HydrationBackgroundProps {
  progress: number; // 0 to 100
}

export default function HydrationBackground({ progress }: HydrationBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(progress);

  // Keep progress value fresh without triggering re-runs of the main canvas effect
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let offset = 0;
    let currentY: number | null = null;

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const render = () => {
      if (!ctx || !canvas) return;

      // Draw absolute background color first (so we blend on top of it)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Water height based on progress (100% is top/full, 0% is bottom/empty)
      const cleanProgress = Math.max(0, Math.min(100, progressRef.current));
      
      // Target height calculation
      const targetY = canvas.height * (1 - cleanProgress / 100);

      // Smooth interpolation (lerp) on every animation frame for fluid transitions
      if (currentY === null) {
        currentY = targetY;
      } else {
        // Easing interpolation: glide smoothly towards target height
        currentY += (targetY - currentY) * 0.04;
      }

      // Helper to draw a sine wave layer
      const drawWave = (waveOffset: number, amplitude: number, frequency: number, color: string) => {
        ctx.beginPath();
        ctx.fillStyle = color;

        // Start from bottom-left corner
        ctx.moveTo(0, canvas.height);

        // Map sine wave path across the width
        for (let x = 0; x <= canvas.width; x += 15) {
          const y = currentY! + Math.sin(x * frequency + waveOffset) * amplitude;
          ctx.lineTo(x, y);
        }

        // Connect to bottom-right corner and close
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();
      };

      // Draw two overlapping wave layers with different frequencies and speeds
      // Layer 1: Back, slower deep blue wave
      drawWave(offset * 0.7, 16, 0.004, "rgba(29, 78, 216, 0.25)"); // Blue 700 tone
      
      // Layer 2: Front, faster sky/dodger blue wave
      drawWave(-offset, 24, 0.006, "rgba(96, 165, 250, 0.18)"); // Blue 400 tone

      // Increment wave offset
      offset += 0.025;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []); // Run animation effect once on mount

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-1000"
    />
  );
}
