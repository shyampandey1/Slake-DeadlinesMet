"use client";

import React from 'react'; // This line is required to fix the build error
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import HamburgerMenu from '@/components/HamburgerMenu';
import { useWeather } from '@/hooks/useWeather';
import { LucideIcon, Sun, Moon, Cloud, CloudSun, CloudMoon, CloudDrizzle, CloudRain, CloudLightning, CloudSnow, CloudFog, Cloudy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useActiveTimer } from '@/hooks/useActiveTimer';
import Link from 'next/link';
import { Play, Pause, Phone, Users } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

interface DynamicHeaderProps {
    currentDate: Date;
}

const Star = ({ cx, cy, r, style }: { cx: number; cy: number; r: number; style: React.CSSProperties }) => (
    <circle cx={cx} cy={cy} r={r} fill="white" style={style} />
);

const MotionCloud = ({ initial, animate, transition, className }: any) => (
    <motion.div
        initial={initial}
        animate={animate}
        transition={transition}
        className={cn("absolute text-white/40", className)}
    >
        <Cloud className="w-full h-full" />
    </motion.div>
);

const getWeatherIcon = (code: number, isNight: boolean): LucideIcon => {
    if (code >= 200 && code < 300) return CloudLightning;
    if (code >= 300 && code < 400) return CloudDrizzle;
    if (code >= 500 && code < 600) return CloudRain;
    if (code >= 600 && code < 700) return CloudSnow;
    if (code >= 700 && code < 800) return CloudFog;
    if (code === 800) return isNight ? Moon : Sun;
    if (code === 801) return isNight ? CloudMoon : CloudSun;
    if (code === 802) return Cloud;
    if (code > 802) return Cloudy;
    return Cloud;
};

// New component to only re-render the clock
function LiveClock() {
    const [time, setTime] = useState(new Date());
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const timerId = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timerId);
    }, []);

    if (!isClient) {
        return <p className="font-bold font-headline text-2xl">&nbsp;</p>;
    }

    return <p className="font-bold font-headline text-2xl">{format(time, 'p')}</p>;
}

export default function DynamicHeader({ currentDate }: DynamicHeaderProps) {
    const { weatherData } = useWeather();
    const { activeTimer } = useActiveTimer();
    const { profileData } = useProfile();
    const [stars, setStars] = useState<React.ReactElement[]>([]);
    const svgContainerRef = useRef<SVGSVGElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            }
        });

        if (svgContainerRef.current) {
            resizeObserver.observe(svgContainerRef.current);
        }

        return () => {
            if (svgContainerRef.current) {
                try {
                  resizeObserver.unobserve(svgContainerRef.current);
                } catch (e) {
                  // This can happen if the component unmounts before the cleanup function runs
                }
            }
        };
    }, [isClient]);

    const hour = currentDate.getHours();
    const minute = currentDate.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    const sunriseStart = 5 * 60;
    const sunriseEnd = 8 * 60;
    const dayStart = 8 * 60;
    const dayEnd = 17 * 60;
    const sunsetStart = 17 * 60;
    const sunsetEnd = 20 * 60;
    
    let skyClass = '';
    let sunMoonY = 50;
    let sunMoonX = 50;
    let sunMoonOpacity = 0;
    let isNight = false;

    const isSunnyDay = weatherData?.code === 800 && !isNight;

    if (timeInMinutes >= sunriseStart && timeInMinutes < sunriseEnd) {
        const progress = (timeInMinutes - sunriseStart) / (sunriseEnd - sunriseStart);
        skyClass = 'from-indigo-300/70 via-orange-300/70 to-amber-200/70';
        sunMoonY = 60 - progress * 50;
        sunMoonX = progress * 100;
        sunMoonOpacity = 1;
    } else if (timeInMinutes >= dayStart && timeInMinutes < dayEnd) {
        const progress = (timeInMinutes - dayStart) / (dayEnd - dayStart);
        skyClass = isSunnyDay ? 'from-amber-300/80 to-orange-400/80' : 'from-sky-400/80 to-sky-600/80';
        sunMoonY = 10 + progress * 5;
        sunMoonX = 50;
        sunMoonOpacity = 1;
    } else if (timeInMinutes >= sunsetStart && timeInMinutes < sunsetEnd) {
        const progress = (timeInMinutes - sunsetStart) / (sunsetEnd - sunsetStart);
        skyClass = 'from-amber-300/70 via-orange-400/70 to-indigo-400/70';
        sunMoonY = 15 + progress * 45;
        sunMoonX = 100 - progress * 100;
        sunMoonOpacity = 1;
    } else {
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
        if (isClient && dimensions.width > 0 && dimensions.height > 0 && isNight) {
            const generatedStars = Array.from({ length: 50 }, (_, i) => {
                const cx = Math.random() * dimensions.width;
                const cy = Math.random() * dimensions.height * 0.5;
                const r = Math.random() * 0.8 + 0.3;
                return (
                    <Star
                        key={i}
                        cx={cx}
                        cy={cy}
                        r={r}
                        style={{ animation: `twinkle ${Math.random() * 5 + 3}s linear infinite` }}
                    />
                );
            });
            setStars(generatedStars);
        } else {
            setStars([]);
        }
    }, [isClient, dimensions, isNight]);
    
    const WeatherIcon = weatherData ? getWeatherIcon(weatherData.code, isNight) : Cloud;

    return (
        <div className="relative w-full h-[22rem] sm:h-[24rem] md:h-[26rem] lg:h-[30rem] min-h-[320px]">
             {activeTimer && activeTimer.taskName && (
                <Link 
                    href={`/timer?task=${encodeURIComponent(activeTimer.taskName)}&duration=${activeTimer.initialDuration}&category=${activeTimer.category || ''}`} 
                    className="absolute top-0 left-0 right-0 z-50 bg-primary/20 backdrop-blur-xl border-b border-primary/30 p-2 flex items-center justify-between animate-in slide-in-from-top duration-500 overflow-hidden"
                >
                    <div className="flex items-center gap-3 pl-4 flex-1 min-w-0 mr-4">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                        <span className="text-xs font-bold text-white/90 truncate">Running: {activeTimer.taskName}</span>
                    </div>
                    <div className="flex items-center gap-2 pr-4 shrink-0">
                        <span className="text-xs font-code text-primary font-bold">
                            {activeTimer.isPaused ? 'PAUSED' : 'ACTIVE'}
                        </span>
                    </div>
                </Link>
             )}
             <div className="absolute inset-0 overflow-hidden border-b border-border/20">
                 {isClient ? (
                     <div className={cn("absolute inset-0 bg-gradient-to-br transition-all duration-3000 ease-in-out", skyClass)}>
                         {/* Stars and Clouds ... */}
                         <div className="absolute inset-0 opacity-100">
                             <MotionCloud
                                 className="w-96 h-96 opacity-60"
                                 initial={{ x: '-100%', y: '10%' }}
                                 animate={{ x: '100%' }}
                                 transition={{ ease: 'linear', duration: 180, repeat: Infinity, repeatType: 'reverse' }}
                             />
                             <MotionCloud
                                 className="w-80 h-80 opacity-50"
                                 initial={{ x: '100%', y: '-10%' }}
                                 animate={{ x: '-100%' }}
                                 transition={{ ease: 'linear', duration: 200, repeat: Infinity, repeatType: 'reverse' }}
                             />
                         </div>
                         <svg ref={svgContainerRef} width="100%" height="100%" preserveAspectRatio="none" className="absolute inset-0">
                             <g style={{
                                 transform: `translate(${sunMoonX}%, ${sunMoonY}%)`,
                                 transition: 'transform 3s linear',
                                 opacity: sunMoonOpacity,
                             }}>
                                 {isNight ? (
                                     <Moon className="w-24 h-24 text-white/90" fill="white" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.7))' }}/>
                                 ) : (
                                     <Sun className="w-32 h-32 text-amber-300" fill="currentColor" style={{ filter: 'drop-shadow(0 0 25px rgba(252, 211, 77, 0.9))' }}/>
                                 )}
                             </g>
                             {isNight && (
                                 <g style={{ opacity: 1, transition: 'opacity 3s linear' }}>
                                     {stars}
                                 </g>
                             )}
                         </svg>
                     </div>
                 ) : (
                     <div className="absolute inset-0 bg-slate-900" />
                 )}
            </div>

            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[4px]">
                <div className="container mx-auto flex h-full max-w-4xl flex-col justify-start gap-y-6 sm:gap-y-8 p-8 sm:p-10 md:p-12 pb-24 sm:pb-32 lg:pb-40">
                     <div className="flex justify-between items-start text-white">
                         <div className="space-y-1">
                            <h1 className="text-2xl font-bold font-headline text-white tracking-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>DeadlinesMet</h1>
                            <p className="text-sm text-white/80 hidden sm:block max-w-xs leading-relaxed" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Focus on one task at a time. Set your goal and go.</p>
                         </div>
                         <HamburgerMenu white />
                    </div>

                    <div className="flex flex-col items-start text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <LiveClock />
                            {profileData?.coWorkerId && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-1.5 px-2 py-0.5 bg-[#10b981]/20 border border-[#10b981]/30 rounded-full backdrop-blur-md"
                                >
                                    <Users className="w-3 h-3 text-[#10b981]" />
                                    <span className="text-[9px] font-black uppercase tracking-wider text-[#10b981]">Co-Reformer Active</span>
                                </motion.div>
                            )}
                            {weatherData && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 group hover:bg-white/20 transition-all duration-300">
                                    <WeatherIcon className="h-4 w-4 text-white/90" />
                                    <div className="flex flex-col items-start leading-none gap-0.5">
                                        <span className="text-sm font-bold">{weatherData.temp}°</span>
                                        {weatherData.name && <span className="text-[10px] font-medium opacity-70 uppercase tracking-tighter">{weatherData.name}</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                        {isClient && <p className="text-sm opacity-90 font-medium tracking-wide">{format(currentDate, 'EEEE, LLLL d')}</p>}
                    </div>
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
