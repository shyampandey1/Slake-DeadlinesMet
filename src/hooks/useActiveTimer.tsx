
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useProfile } from './useProfile';
import { useAuth } from './useAuth';

interface ActiveTimer {
    taskName: string;
    expectedEndTime: number;
    initialDuration: number;
    category?: string;
    color?: string;
    isPaused: boolean;
    timeLeftWhenPaused?: number;
    coOpSessionId?: string;
}

interface TimerContextType {
    activeTimer: ActiveTimer | null;
    isInitialized: boolean;
    startTimer: (timer: Omit<ActiveTimer, 'expectedEndTime' | 'isPaused'> & { expectedEndTime?: number; coOpSessionId?: string }) => void;
    clearTimer: () => void;
    updateTimer: (updates: Partial<ActiveTimer>, remainingSeconds?: number) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const STORAGE_KEY = 'deadlinesmet_active_timer';

export const TimerProvider = ({ children }: { children: ReactNode }) => {
    const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const { profileData, updateUserProfileData } = useProfile();
    const { user } = useAuth();
    
    // Use a ref to track the last synced Firestore state to avoid loops
    const lastSyncedFirestore = useRef<string | null>(null);

    // Initial load from storage (as fallback/immediate load)
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && stored !== 'undefined' && stored !== 'null') {
            try {
                const parsed = JSON.parse(stored);
                if (parsed && (parsed.isPaused || parsed.expectedEndTime > Date.now())) {
                    setActiveTimer(parsed);
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                }
            } catch (e) {
                console.error("Failed to parse stored timer", e);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        setIsInitialized(true);
    }, []);

    // Sync from Firestore (for other devices)
    useEffect(() => {
        if (!profileData?.activeSession) {
            // If Firestore has no session but we have one, it might mean it was cleared on another device
            if (activeTimer && isInitialized) {
                // Wait a bit to ensure it's not just a loading delay
                const checkClear = setTimeout(() => {
                    if (!profileData?.activeSession) {
                        setActiveTimer(null);
                        localStorage.removeItem(STORAGE_KEY);
                    }
                }, 2000);
                return () => clearTimeout(checkClear);
            }
            return;
        }

        const session = profileData.activeSession;
        const sessionString = JSON.stringify(session);

        // If this session is different from what we last saw from Firestore
        if (sessionString !== lastSyncedFirestore.current) {
            lastSyncedFirestore.current = sessionString;

            // Only update if it's actually different from our current local state
            const isDifferent = !activeTimer || 
                activeTimer.taskName !== session.taskName ||
                Math.abs(activeTimer.expectedEndTime - session.expectedEndTime) > 2000 || // 2s tolerance
                activeTimer.isPaused !== session.isPaused;

            if (isDifferent) {
                const now = Date.now();
                const expectedEndTime = session.expectedEndTime || now;
                const newTimer: ActiveTimer = {
                    taskName: session.taskName || 'Untitled Task',
                    expectedEndTime: expectedEndTime,
                    initialDuration: session.duration || 25,
                    category: session.category,
                    color: session.color,
                    isPaused: !!session.isPaused,
                    coOpSessionId: session.coOpSessionId,
                    timeLeftWhenPaused: session.isPaused ? Math.max(0, (expectedEndTime - now) / 1000) : undefined
                };
                
                setActiveTimer(newTimer);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newTimer));
            }
        }
    }, [profileData?.activeSession, activeTimer, isInitialized]);

    const saveTimer = useCallback((timer: ActiveTimer | null) => {
        setActiveTimer(timer);
        if (timer) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
            } catch (e) {
                console.warn("Failed to save timer to localStorage", e);
            }
            
            // Sync to Firestore immediately
            if (user) {
                updateUserProfileData({
                    activeSession: {
                        taskName: timer.taskName,
                        expectedEndTime: timer.expectedEndTime,
                        isPaused: timer.isPaused,
                        duration: timer.initialDuration,
                        category: timer.category,
                        color: timer.color,
                        coOpSessionId: timer.coOpSessionId
                    }
                }).catch(console.error);
            }
        } else {
            localStorage.removeItem(STORAGE_KEY);
            if (user) {
                updateUserProfileData({ activeSession: null as any }).catch(console.error);
            }
        }
    }, [user, updateUserProfileData]);

    // Auto-persist changes to localStorage
    useEffect(() => {
        if (isInitialized) {
            if (activeTimer) {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeTimer));
                } catch (e) {
                    console.warn("Failed to sync timer to localStorage", e);
                }
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, [activeTimer, isInitialized]);

    const startTimer = useCallback((timerData: Omit<ActiveTimer, 'expectedEndTime' | 'isPaused'> & { expectedEndTime?: number; coOpSessionId?: string }) => {
        const expectedEndTime = timerData.expectedEndTime || Date.now() + (timerData.initialDuration * 60 * 1000);
        const newTimer = { ...timerData, expectedEndTime, isPaused: false };
        saveTimer(newTimer);
    }, [saveTimer]);

    const clearTimer = useCallback(() => {
        saveTimer(null);
    }, [saveTimer]);

    const updateTimer = useCallback((updates: Partial<ActiveTimer>, remainingSeconds?: number) => {
        setActiveTimer(prev => {
            if (!prev) return null;
            
            let updated = { ...prev, ...updates };

            if (updates.isPaused === true && !prev.isPaused) {
                updated.timeLeftWhenPaused = remainingSeconds;
            } 
            else if (updates.isPaused === false && prev.isPaused) {
                const remaining = updated.timeLeftWhenPaused || 0;
                updated.expectedEndTime = Date.now() + (remaining * 1000);
            }

            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {
                console.warn("Failed to sync timer to localStorage", e);
            }
            
            // Sync to Firestore
            if (user) {
                updateUserProfileData({
                    activeSession: {
                        taskName: updated.taskName,
                        expectedEndTime: updated.expectedEndTime,
                        isPaused: updated.isPaused,
                        duration: updated.initialDuration,
                        category: updated.category,
                        color: updated.color,
                        coOpSessionId: updated.coOpSessionId
                    }
                }).catch(console.error);
            }
            return updated;
        });
    }, [user, updateUserProfileData]);

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
