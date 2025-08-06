
"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import HamburgerMenu from '@/components/HamburgerMenu';
import { Sun, Moon, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DynamicHeaderProps {
    currentDate: Date;
}

const Star = ({ style }: { style: React.CSSProperties }) => (
    <circle cx={Math.random() * 100} cy={Math.random() * 50 + 5} r={Math.random() * 0.5 + 0.2} fill="white" style={style} />
);

export default function DynamicHeader({ currentDate }: DynamicHeaderProps) {
    const [stars, setStars] = useState<JSX.Element[]>([]);

    useEffect(() => {
        // Generate stars only once
        const generatedStars = Array.from({ length: 50 }, (_, i) => (
            <Star key={i} style={{ animation: `twinkle ${Math.random() * 5 + 2}s linear infinite` }} />
        ));
        setStars(generatedStars);
    }, []);

    const hour = currentDate.getHours();
    const minute = currentDate.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    // Time ranges in minutes from midnight
    const sunriseStart = 5 * 60; // 5 AM
    const sunriseEnd = 8 * 60; // 8 AM
    const dayStart = 8 * 60;
    const dayEnd = 17 * 60; // 5 PM
    const sunsetStart = 17 * 60;
    const sunsetEnd = 20 * 60; // 8 PM
    
    let skyClass = '';
    let sunMoonY = 50; // Position percentage from top
    let sunMoonX = 50; // Position percentage from left
    let sunMoonOpacity = 0;
    let isNight = false;

    if (timeInMinutes >= sunriseStart && timeInMinutes < sunriseEnd) {
        // Sunrise
        const progress = (timeInMinutes - sunriseStart) / (sunriseEnd - sunriseStart);
        skyClass = 'from-indigo-300 via-orange-300 to-amber-200';
        sunMoonY = 60 - progress * 50;
        sunMoonX = progress * 100;
        sunMoonOpacity = 1;
    } else if (timeInMinutes >= dayStart && timeInMinutes < dayEnd) {
        // Daytime
        const progress = (timeInMinutes - dayStart) / (dayEnd - dayStart);
        skyClass = 'from-sky-300 to-sky-500';
        sunMoonY = 10 + progress * 5; // Slight movement
        sunMoonX = 50; // Centered for simplicity in daytime view
        sunMoonOpacity = 1;
    } else if (timeInMinutes >= sunsetStart && timeInMinutes < sunsetEnd) {
        // Sunset
        const progress = (timeInMinutes - sunsetStart) / (sunsetEnd - sunsetStart);
        skyClass = 'from-amber-300 via-orange-400 to-indigo-400';
        sunMoonY = 15 + progress * 45;
        sunMoonX = 100 - progress * 100;
        sunMoonOpacity = 1;
    } else {
        // Night
        isNight = true;
        skyClass = 'from-indigo-800 to-slate-900';
        const nightProgress = timeInMinutes > sunsetEnd 
            ? (timeInMinutes - sunsetEnd) / ((24 * 60) - sunsetEnd)
            : timeInMinutes / sunriseStart;

        sunMoonY = 60 - nightProgress * 50;
        sunMoonX = nightProgress * 100;
        sunMoonOpacity = 1;
    }

    return (
        <header className="relative w-full h-48 overflow-hidden border-b border-border/20 shadow-lg">
            <div className={cn("absolute inset-0 bg-gradient-to-br transition-all duration-1000", skyClass)}>
                 <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" className="absolute inset-0">
                    {/* Sun or Moon */}
                     <g style={{
                        transform: `translate(${sunMoonX}%, ${sunMoonY}%)`,
                        transition: 'transform 1s linear',
                        opacity: sunMoonOpacity,
                    }}>
                        {isNight ? (
                            <Moon className="w-16 h-16 text-white/90" fill="white" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.7))' }}/>
                        ) : (
                            <Sun className="w-20 h-20 text-yellow-300/90" fill="currentColor" style={{ filter: 'drop-shadow(0 0 15px rgba(255, 223, 100, 0.8))' }}/>
                        )}
                    </g>
                     {/* Stars */}
                    {isNight && (
                       <g style={{ opacity: sunMoonOpacity, transition: 'opacity 1s linear' }}>
                            {stars}
                        </g>
                    )}
                     {/* Clouds */}
                    <Cloud className="absolute w-24 h-24 text-white/30" style={{ top: '15%', left: '10%', animation: 'drift 25s linear infinite' }} />
                    <Cloud className="absolute w-32 h-32 text-white/20" style={{ top: '30%', left: '70%', animation: 'drift 35s linear infinite reverse' }} />
                 </svg>
            </div>

            {/* Header Content */}
            <div className="absolute inset-0 bg-black/10">
                <div className="container mx-auto flex h-full max-w-4xl items-start justify-between p-4 pt-6 sm:p-6 md:p-8">
                    <div className="flex flex-col gap-2 text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                        <h1 className="text-2xl font-bold font-headline">DeadlinesMet</h1>
                        <p className="text-sm opacity-90">Focus on one task at a time. Set your goal and go.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                            <p className="font-bold font-headline text-2xl">{format(currentDate, 'p')}</p>
                            <p className="text-xs opacity-90">{format(currentDate, 'EEEE, LLLL d')}</p>
                        </div>
                        <HamburgerMenu />
                    </div>
                </div>
            </div>
             <style jsx>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                @keyframes drift {
                    from { transform: translateX(-20px); }
                    to { transform: translateX(20px); }
                }
            `}</style>
        </header>
    );
}
