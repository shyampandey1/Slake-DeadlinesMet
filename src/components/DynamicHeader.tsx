
"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import HamburgerMenu from '@/components/HamburgerMenu';
import { Sun, Moon, Cloud, CloudSun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DynamicHeaderProps {
    currentDate: Date;
}

const Star = ({ style }: { style: React.CSSProperties }) => (
    <circle cx={Math.random() * 100} cy={Math.random() * 45 + 5} r={Math.random() * 0.8 + 0.2} fill="white" style={style} />
);

const MotionCloud = ({ initial, animate, transition, className }: any) => (
    <motion.div
        initial={initial}
        animate={animate}
        transition={transition}
        className={cn("absolute text-white/20", className)}
    >
        <Cloud className="w-full h-full" />
    </motion.div>
);

export default function DynamicHeader({ currentDate }: DynamicHeaderProps) {
    const [stars, setStars] = useState<JSX.Element[]>([]);
    const [weather, setWeather] = useState({ temp: 22, icon: CloudSun });

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
    
    useEffect(() => {
        if (isNight) {
            setWeather({ temp: 18, icon: Moon });
        } else {
            setWeather({ temp: 22, icon: Sun });
        }
    }, [isNight]);
    
    const WeatherIcon = weather.icon;


    return (
        <div className="relative w-full h-64">
             {/* Background with Vectors - This part is NOT blurred */}
            <div className="absolute inset-0 overflow-hidden border-b border-border/20">
                 <div className={cn("absolute inset-0 bg-gradient-to-br transition-all duration-[3000ms] ease-in-out", skyClass)}>
                    <div className="absolute inset-0 opacity-100">
                         {/* Smokey Clouds using Framer Motion */}
                        <MotionCloud
                            className="w-96 h-96 opacity-80"
                            initial={{ x: '-100%', y: '10%' }}
                            animate={{ x: '100%' }}
                            transition={{ ease: 'linear', duration: 180, repeat: Infinity, repeatType: 'reverse' }}
                        />
                         <MotionCloud
                            className="w-80 h-80 opacity-70"
                            initial={{ x: '100%', y: '-10%' }}
                            animate={{ x: '-100%' }}
                            transition={{ ease: 'linear', duration: 200, repeat: Infinity, repeatType: 'reverse' }}
                        />
                         <MotionCloud
                            className="w-[30rem] h-[30rem] opacity-75"
                            initial={{ x: '0%', y: '20%' }}
                            animate={{ x: '80%' }}
                            transition={{ ease: 'linear', duration: 190, repeat: Infinity, repeatType: 'reverse' }}
                        />
                         <MotionCloud
                            className="w-72 h-72 opacity-65"
                            initial={{ x: '50%', y: '-20%' }}
                            animate={{ x: '-50%' }}
                            transition={{ ease: 'linear', duration: 160, repeat: Infinity, repeatType: 'reverse' }}
                        />
                    </div>
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
                    </svg>
                </div>
            </div>

            {/* Header Content with Glass Effect - This part has the blur */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm">
                <div className="container mx-auto flex h-full max-w-4xl flex-col justify-between p-4 sm:p-6 md:p-8 pb-16">
                     <div>
                        <h1 className="text-xl font-bold font-headline text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>DeadlinesMet</h1>
                        <p className="text-sm text-white/90 hidden sm:block max-w-xs" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>Focus on one task at a time. Set your goal and go.</p>
                    </div>
                    <div className="flex w-full items-end justify-between">
                        <div/>
                        <div className="flex flex-col items-end text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                            <p className="font-bold font-headline text-2xl">{format(currentDate, 'p')}</p>
                            <div className="flex items-center justify-end gap-2">
                                <p className="text-xs opacity-90">{format(currentDate, 'EEEE, LLLL d')}</p>
                                <WeatherIcon className="h-4 w-4 text-white/90" />
                                <p className="text-xs opacity-90">{weather.temp}°C</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8">
                    <HamburgerMenu />
                </div>
            </div>
             <style jsx>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.9; }
                }
            `}</style>
        </div>
    );
}
