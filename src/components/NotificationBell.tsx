"use client";

import { useEffect, useState } from "react";
import { Bell, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getLocalDateString, getCachedDailyCoins } from "@/lib/dailyCoins";

export default function NotificationBell() {
    const [dailyCoins, setDailyCoins] = useState(0);
    const [hasNewEarnings, setHasNewEarnings] = useState(false);
    const [shake, setShake] = useState(false);

    useEffect(() => {
        const updateCoins = () => {
            const todayStr = getLocalDateString();
            const { amount, date } = getCachedDailyCoins();
            if (date === todayStr) {
                setDailyCoins(amount);
                if (amount > 0) {
                    setHasNewEarnings(true);
                    setShake(true);
                    const t = setTimeout(() => setShake(false), 1000);
                    return () => clearTimeout(t);
                }
            } else {
                setDailyCoins(0);
                setHasNewEarnings(false);
            }
        };

        updateCoins();

        // Listen for optimistic updates and snapshot events in real-time
        window.addEventListener('slake-daily-coins-updated', updateCoins);
        
        // Setup clock sync to ensure automatic midnight resets
        const interval = setInterval(updateCoins, 30000); // Check every 30 seconds

        return () => {
            window.removeEventListener('slake-daily-coins-updated', updateCoins);
            clearInterval(interval);
        };
    }, []);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className={`relative p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer flex items-center justify-center backdrop-blur-md outline-none ${shake ? 'animate-bell-shake' : ''} hover:scale-105 active:scale-95`}
                >
                    <Bell className="w-5 h-5 text-white" />
                    {hasNewEarnings && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-slate-900 animate-pulse shadow-[0_0_8px_#f59e0b]" />
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-slate-950/90 border border-white/10 text-white rounded-2xl shadow-2xl backdrop-blur-xl z-50">
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <h4 className="font-bold text-sm tracking-tight flex items-center gap-1.5 font-headline">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            Daily Rewards
                        </h4>
                        {dailyCoins > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                                Active Today
                            </span>
                        )}
                    </div>
                    <div className="py-1">
                        {dailyCoins > 0 ? (
                            <div className="flex items-start gap-3 bg-white/5 border border-white/5 p-3 rounded-xl">
                                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 text-lg">
                                    🪙
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold leading-relaxed text-white">
                                        Great job! You've earned {dailyCoins} Slake Coins today.
                                    </p>
                                    <p className="text-[11px] text-white/50">
                                        Keep completing tasks to secure more discipline coins!
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-white/60 space-y-2">
                                <p className="text-sm font-medium">No rewards earned today yet.</p>
                                <p className="text-xs text-white/45">
                                    Conquer deep focus, hydration, fitness, or meditation blocks to secure Slake Coins.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
            <style jsx global>{`
                @keyframes bell-shake {
                    0%, 100% { transform: rotate(0deg); }
                    15% { transform: rotate(10deg); }
                    30% { transform: rotate(-10deg); }
                    45% { transform: rotate(5deg); }
                    60% { transform: rotate(-5deg); }
                    75% { transform: rotate(2deg); }
                    90% { transform: rotate(-2deg); }
                }
                .animate-bell-shake {
                    animation: bell-shake 0.8s ease-in-out;
                }
            `}</style>
        </Popover>
    );
}
