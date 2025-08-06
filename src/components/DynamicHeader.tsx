
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
            <Star key={i} style={{ animation: `twinkle ${Math.random() * 5 + 3}s linear infinite` }} />
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
        skyClass = 'from-indigo-300/70 via-orange-300/70 to-amber-200/70';
        sunMoonY = 60 - progress * 50;
        sunMoonX = progress * 100;
        sunMoonOpacity = 1;
    } else if (timeInMinutes >= dayStart && timeInMinutes < dayEnd) {
        // Daytime
        const progress = (timeInMinutes - dayStart) / (dayEnd - dayStart);
        skyClass = 'from-sky-400/80 to-sky-600/80';
        sunMoonY = 10 + progress * 5; // Slight movement
        sunMoonX = 50; // Centered for simplicity in daytime view
        sunMoonOpacity = 1;
    } else if (timeInMinutes >= sunsetStart && timeInMinutes < sunsetEnd) {
        // Sunset
        const progress = (timeInMinutes - sunsetStart) / (sunsetEnd - sunsetStart);
        skyClass = 'from-amber-300/70 via-orange-400/70 to-indigo-400/70';
        sunMoonY = 15 + progress * 45;
        sunMoonX = 100 - progress * 100;
        sunMoonOpacity = 1;
    } else {
        // Night
        isNight = true;
        skyClass = 'from-indigo-900/80 to-slate-900/80';
        const nightDurationAfterSunset = (24 * 60) - sunsetEnd;
        const nightDurationBeforeSunrise = sunriseStart;
        
        let nightProgress;
        if (timeInMinutes > sunsetEnd) {
            nightProgress = (timeInMinutes - sunsetEnd) / nightDurationAfterSunset;
        } else {
            nightProgress = (timeInMinutes + (24 * 60 - sunsetEnd)) / (nightDurationAfterSunset + nightDurationBeforeSunrise);
        }

        sunMoonY = 60 - Math.sin(nightProgress * Math.PI) * 50;
        sunMoonX = nightProgress * 100;
        sunMoonOpacity = 1;
    }

    return (
        <header className="fixed top-0 left-0 right-0 w-full h-36 z-10">
             {/* Background with Vectors - This part is NOT blurred */}
            <div className="absolute inset-0 overflow-hidden border-b border-border/20">
                 <div className={cn("absolute inset-0 bg-gradient-to-br transition-all duration-[3000ms] ease-in-out", skyClass)}>
                    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" className="absolute inset-0">
                        {/* Sun or Moon */}
                        <g style={{
                            transform: `translate(${sunMoonX}%, ${sunMoonY}%)`,
                            transition: 'transform 3s linear',
                            opacity: sunMoonOpacity,
                        }}>
                            {isNight ? (
                                <Moon className="w-14 h-14 text-white/90" fill="white" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.7))' }}/>
                            ) : (
                                <Sun className="w-16 h-16 text-yellow-300/90" fill="currentColor" style={{ filter: 'drop-shadow(0 0 15px rgba(255, 223, 100, 0.8))' }}/>
                            )}
                        </g>
                        {/* Stars */}
                        {isNight && (
                        <g style={{ opacity: sunMoonOpacity, transition: 'opacity 3s linear' }}>
                                {stars}
                            </g>
                        )}
                        {/* Clouds */}
                        <Cloud className="absolute w-32 h-32 text-white/10" style={{ top: '10%', left: '5%', animation: 'drift 60s linear infinite' }} />
                        <Cloud className="absolute w-24 h-24 text-white/20" style={{ top: '15%', left: '20%', animation: 'drift 35s linear infinite' }} />
                        <Cloud className="absolute w-40 h-40 text-white/15" style={{ top: '20%', left: '80%', animation: 'drift 70s linear infinite reverse' }} />
                        <Cloud className="absolute w-32 h-32 text-white/10" style={{ top: '25%', left: '60%', animation: 'drift 50s linear infinite reverse' }} />
                    </svg>
                </div>
            </div>

            {/* Header Content with Glass Effect - This part has the blur */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm">
                <div className="container mx-auto flex h-full max-w-4xl items-center justify-between p-4 sm:p-6 md:p-8">
                    <div className="flex flex-col gap-1 text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                        <h1 className="text-xl font-bold font-headline">DeadlinesMet</h1>
                        <p className="text-sm opacity-90 max-w-xs">Focus on one task at a time. Set your goal and go.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                            <p className="font-bold font-headline text-2xl">{format(currentDate, 'p')}</p>
                            <p className="text-xs opacity-90">{format(currentDate, 'EEEE, LLLL d')}</p>
                        </div>
                        <HamburgerMenu />
                    </div>
                </div>
            </div>
             <style jsx>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.9; }
                }
                @keyframes drift {
                    from { transform: translateX(-25px); }
                    to { transform: translateX(25px); }
                }
            `}</style>
        </header>
    );
}
