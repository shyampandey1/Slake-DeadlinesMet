
"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  progress: number;
  children: React.ReactNode;
  isUIVisible: boolean;
}

const CircularProgress = ({ progress, children, isUIVisible }: CircularProgressProps) => {
    const radius = 95;
    const stroke = 5;
    const center = radius + stroke;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // Calculate the position for the moving dot
    const progressAngle = (progress / 100) * 360;
    const angleInRadians = ((progressAngle - 90) * Math.PI) / 180;
    const dotX = center + normalizedRadius * Math.cos(angleInRadians);
    const dotY = center + normalizedRadius * Math.sin(angleInRadians);

    return (
        <div className="relative w-80 h-80 sm:w-[400px] sm:h-[400px]">
            <svg
                height="100%"
                width="100%"
                viewBox="0 0 200 200"
            >
                <circle
                    stroke="hsl(var(--muted))"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={center}
                    cy={center}
                />
                <circle
                    className="transform -rotate-90 origin-center"
                    stroke="var(--timer-primary-color, hsl(var(--primary)))"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ 
                        strokeDashoffset,
                        transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' 
                    }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={center}
                    cy={center}
                />
                {/* The moving dot */}
                <circle
                    fill="var(--timer-primary-color, hsl(var(--primary)))"
                    r="8"
                    cx={dotX}
                    cy={dotY}
                    style={{
                      transition: 'all 1s linear, fill 0.5s ease'
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <div className={cn(
                    "flex flex-col items-center justify-center gap-4 transition-transform duration-300 ease-in-out",
                    isUIVisible ? "-translate-y-5" : "translate-y-0"
                 )}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default CircularProgress;
