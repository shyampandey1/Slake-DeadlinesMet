
"use client";

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import HamburgerMenu from '@/components/HamburgerMenu';
import { Sun, Moon, Cloud, LucideIcon, CloudSun, CloudMoon, CloudDrizzle, CloudRain, CloudLightning, CloudSnow, Wind, CloudFog, Cloudy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useWeather } from '@/hooks/useWeather';

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


export default function DynamicHeader({ currentDate }: DynamicHeaderProps) {
    const { weatherData } = useWeather();
    const [stars, setStars] = useState<JSX.Element[]>([]);
    const svgContainerRef = useRef<SVGSVGElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });


    useEffect(() => {
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
                resizeObserver.unobserve(svgContainerRef.current);
            }
        };
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

    // Is it a clear sunny day?
    const isSunnyDay = weatherData?.code === 800 && !isNight;

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
        skyClass = isSunnyDay ? 'from-amber-300/80 to-orange-400/80' : 'from-sky-400/80 to-sky-600/80';
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
       
        if (dimensions.width > 0 && dimensions.height > 0 && isNight) {
            const generatedStars = Array.from({ length: 50 }, (_, i) => {
                const cx = Math.random() * dimensions.width;
                const cy = Math.random() * dimensions.height * 0.5; // Only top half
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
    }, [dimensions, isNight]);
    
    const WeatherIcon = weatherData ? getWeatherIcon(weatherData.code, isNight) : Cloud;


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
                    <svg ref={svgContainerRef} width="100%" height="100%" preserveAspectRatio="none" className="absolute inset-0">
                        {/* Sun or Moon */}
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
                        {/* Stars */}
                        {isNight && (
                            <g style={{ opacity: 1, transition: 'opacity 3s linear' }}>
                                {stars}
                            </g>
                        )}
                    </svg>
                </div>
            </div>

            {/* Header Content with Glass Effect - This part has the blur */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm">
                <div className="container mx-auto flex h-full max-w-4xl flex-col justify-between p-4 sm:p-6 md:p-8 pb-16">
                     <div className="flex justify-between items-start text-white">
                        <div>
                           <h1 className="text-xl font-bold font-headline text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>DeadlinesMet</h1>
                           <p className="text-sm text-white/90 hidden sm:block max-w-xs" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>Focus on one task at a time. Set your goal and go.</p>
                           <div className="flex flex-col items-start mt-2 text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                                <p className="font-bold font-headline text-2xl">{format(currentDate, 'p')}</p>
                                <div className="flex items-center justify-start gap-2">
                                    <p className="text-xs opacity-90">{format(currentDate, 'EEEE, LLLL d')}</p>
                                    {weatherData && (
                                        <div className="flex items-center gap-1.5 pl-2 border-l border-white/30">
                                            <WeatherIcon className="h-4 w-4" />
                                            <span className="text-xs">{weatherData.temp}°</span>
                                        </div>
                                    )}
                                </div>
                            </div>
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
            `}</style>
        </div>
    );
}
