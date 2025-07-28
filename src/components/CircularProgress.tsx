
"use client";

import React from 'react';

interface CircularProgressProps {
  progress: number;
  children: React.ReactNode;
}

const CircularProgress = ({ progress, children }: CircularProgressProps) => {
    const radius = 95;
    const stroke = 5;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative w-80 h-80 sm:w-[400px] sm:h-[400px]">
            <svg
                height="100%"
                width="100%"
                viewBox="0 0 200 200"
                className="transform -rotate-90"
            >
                <circle
                    stroke="hsl(var(--muted))"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius + stroke}
                    cy={radius + stroke}
                />
                <circle
                    stroke="hsl(var(--primary))"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ 
                        strokeDashoffset,
                        transition: 'stroke-dashoffset 1s linear' 
                    }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius + stroke}
                    cy={radius + stroke}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                {children}
            </div>
        </div>
    );
};

export default CircularProgress;
