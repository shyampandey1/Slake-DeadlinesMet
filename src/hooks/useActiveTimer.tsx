
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface ActiveTimer {
    taskName: string;
    expectedEndTime: number;
    initialDuration: number;
    category?: string;
    color?: string;
    isPaused: boolean;
    timeLeftWhenPaused?: number;
}

interface TimerContextType {
    activeTimer: ActiveTimer | null;
    isInitialized: boolean;
    startTimer: (timer: Omit<ActiveTimer, 'expectedEndTime' | 'isPaused'>) => void;
    clearTimer: () => void;
    updateTimer: (updates: Partial<ActiveTimer>, remainingSeconds?: number) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const STORAGE_KEY = 'deadlinesmet_active_timer';

export const TimerProvider = ({ children }: { children: ReactNode }) => {
    const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initial load from storage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Only restore if not expired or if paused
                if (parsed.isPaused || parsed.expectedEndTime > Date.now()) {
                    setActiveTimer(parsed);
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                }
            } catch (e) {
                console.error("Failed to parse stored timer", e);
            }
        }
        setIsInitialized(true);
    }, []);

    const saveTimer = (timer: ActiveTimer | null) => {
        setActiveTimer(timer);
        if (timer) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    const startTimer = useCallback((timerData: Omit<ActiveTimer, 'expectedEndTime' | 'isPaused'>) => {
        const expectedEndTime = Date.now() + (timerData.initialDuration * 60 * 1000);
        const newTimer = { ...timerData, expectedEndTime, isPaused: false };
        saveTimer(newTimer);
    }, []);

    const clearTimer = useCallback(() => {
        saveTimer(null);
    }, []);

    const updateTimer = useCallback((updates: Partial<ActiveTimer>, remainingSeconds?: number) => {
        setActiveTimer(prev => {
            if (!prev) return null;
            
            let updated = { ...prev, ...updates };

            // Handle transition to PAUSED
            if (updates.isPaused === true && !prev.isPaused) {
                updated.timeLeftWhenPaused = remainingSeconds;
            } 
            // Handle transition to ACTIVE (resume)
            else if (updates.isPaused === false && prev.isPaused) {
                const remaining = updated.timeLeftWhenPaused || 0;
                updated.expectedEndTime = Date.now() + (remaining * 1000);
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    return (
        <TimerContext.Provider value={{ activeTimer, isInitialized, startTimer, clearTimer, updateTimer }}>
            {children}
        </TimerContext.Provider>
    );
};

export const useActiveTimer = () => {
    const context = useContext(TimerContext);
    if (context === undefined) {
        throw new Error('useActiveTimer must be used within a TimerProvider');
    }
    return context;
};
