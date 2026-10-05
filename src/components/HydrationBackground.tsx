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

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Water height based on progress (100% is top/full, 0% is bottom/empty)
      const cleanProgress = Math.max(0, Math.min(100, progressRef.current));
      const targetY = canvas.height * (1 - cleanProgress / 100);

      if (currentY === null) {
        currentY = targetY;
      } else {
        currentY += (targetY - currentY) * 0.04;
      }

      // Draw two overlapping wave layers
      const drawWave = (waveOffset: number, amplitude: number, frequency: number, color: string) => {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.moveTo(0, canvas.height);

        for (let x = 0; x <= canvas.width; x += 15) {
          const y = currentY! + Math.sin(x * frequency + waveOffset) * amplitude;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();
      };

      drawWave(offset * 0.7, 18, 0.004, "rgba(29, 78, 216, 0.28)");
      drawWave(-offset, 24, 0.006, "rgba(56, 189, 248, 0.22)");

      offset += 0.025;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      {/* Dynamic Ambient Fluid Waves */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-1000"
      />
    </div>
  );
}
