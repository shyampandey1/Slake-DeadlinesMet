"use client";

import { useEffect, useRef, useState } from "react";

interface HydrationBackgroundProps {
  progress: number; // 0 to 100
}

interface Drop {
  id: number;
  x: number; // percentage (0 - 100)
  speed: number;
  size: number;
  opacity: number;
  offsetY: number;
}

export default function HydrationBackground({ progress }: HydrationBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(progress);
  const [drops, setDrops] = useState<Drop[]>([]);

  // Generate randomized vector fluid drops
  useEffect(() => {
    const generatedDrops: Drop[] = Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      x: (i * 7.1) + (Math.random() * 4 - 2),
      speed: 0.8 + Math.random() * 1.4,
      size: 14 + Math.random() * 16,
      opacity: 0.35 + Math.random() * 0.45,
      offsetY: Math.random() * 80,
    }));
    setDrops(generatedDrops);
  }, []);

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

  const cleanProgress = Math.max(0, Math.min(100, progress));
  const waterTopPct = (1 - cleanProgress / 100) * 100;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      {/* Canvas Waves */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-1000"
      />

      {/* Vector Container with Animated Fluid Drops that lower dynamically alongside progress */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {drops.map((drop) => {
          const topPosition = Math.max(8, (waterTopPct * 0.85) - 30 + drop.offsetY);
          return (
            <div
              key={drop.id}
              className="absolute transition-all duration-700 ease-out"
              style={{
                left: `${drop.x}%`,
                top: `${topPosition}%`,
                opacity: drop.opacity,
                transform: `scale(${drop.size / 24})`,
              }}
            >
              <svg
                width="24"
                height="32"
                viewBox="0 0 24 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="animate-bounce duration-[2500ms]"
                style={{
                  filter: "drop-shadow(0 4px 12px rgba(56, 189, 248, 0.5))",
                }}
              >
                <path
                  d="M12 0C12 0 0 14.5 0 21C0 27.075 5.373 32 12 32C18.627 32 24 27.075 24 21C24 14.5 12 0 12 0Z"
                  fill="url(#waterDropGrad)"
                />
                <ellipse cx="8" cy="19" rx="3" ry="5" fill="white" fillOpacity="0.4" />
                <defs>
                  <linearGradient id="waterDropGrad" x1="12" y1="0" x2="12" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38bdf8" />
                    <stop offset="1" stopColor="#0284c7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}
