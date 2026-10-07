"use client";

import { encryptText, decryptText } from '@/lib/crypto';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from './useAuth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

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
    const { user } = useAuth();

    // Use a ref to track the last synced Firestore state to avoid loops
    const lastSyncedFirestore = useRef<string | null>(null);
    const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const localWriteTimestampRef = useRef<number>(0);

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

    const activeTimerRef = useRef(activeTimer);
    useEffect(() => {
        activeTimerRef.current = activeTimer;
    }, [activeTimer]);

    // Sync from Firestore (for other devices)
    useEffect(() => {
        if (!user) return;

        const unsubscribe = onSnapshot(doc(db, 'active_sessions', user.uid), (docSnap) => {
            if (clearTimeoutRef.current) {
                clearTimeout(clearTimeoutRef.current);
                clearTimeoutRef.current = null;
            }

            // Ignore incoming snapshots that arrive immediately after a local timer write
            if (Date.now() - localWriteTimestampRef.current < 3000) {
                return;
            }

            if (!docSnap.exists()) {
                // If Firestore has no session but we have one
                if (activeTimerRef.current && isInitialized) {
                    clearTimeoutRef.current = setTimeout(() => {
                        if (Date.now() - localWriteTimestampRef.current >= 3000) {
                            setActiveTimer(null);
                            localStorage.removeItem(STORAGE_KEY);
                        }
                    }, 2000);
                }
                return;
            }

            const data = docSnap.data();
            const sessionString = JSON.stringify(data);

            if (sessionString !== lastSyncedFirestore.current) {
                lastSyncedFirestore.current = sessionString;

                // Client-side timers must calculate remaining time dynamically against the synchronized server timestamps
                const now = Date.now();
                const startedAt = data.startedAt?.toMillis() || now;
                const status = data.status || 'running';
                const durationMillis = data.durationMillis || 25 * 60 * 1000;
                const pausedAtMillis = data.pausedAtMillis || null;
                const isPaused = status === 'paused';

                let expectedEndTime = startedAt + durationMillis;
                let timeLeftWhenPaused = undefined;

                if (isPaused && pausedAtMillis) {
                    timeLeftWhenPaused = Math.max(0, (expectedEndTime - pausedAtMillis) / 1000);
                    expectedEndTime = now + (timeLeftWhenPaused * 1000); // Shift expected end time if it resumes now
                }

                // Do not restore an already-expired remote session
                if (!isPaused && expectedEndTime <= now) {
                    return;
                }

                decryptText(data.currentTaskId, user.uid).then(decryptedName => {
                    if (Date.now() - localWriteTimestampRef.current < 3000) return;

                    const newTimer: ActiveTimer = {
                        taskName: decryptedName || 'Untitled Task',
                        expectedEndTime: expectedEndTime,
                        initialDuration: Math.round(durationMillis / 60000),
                        category: data.category,
                        color: data.color,
                        isPaused: isPaused,
                        coOpSessionId: data.coOpSessionId,
                        timeLeftWhenPaused: timeLeftWhenPaused
                    };

                    setActiveTimer(newTimer);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTimer));
                }).catch(() => {});
            }
        }, (error) => {
            console.warn('active_sessions snapshot error:', error);
        });

        return () => {
            if (clearTimeoutRef.current) {
                clearTimeout(clearTimeoutRef.current);
            }
            unsubscribe();
        };
    }, [user, isInitialized]);

    const saveTimer = useCallback((timer: ActiveTimer | null) => {
        localWriteTimestampRef.current = Date.now();
        if (clearTimeoutRef.current) {
            clearTimeout(clearTimeoutRef.current);
            clearTimeoutRef.current = null;
        }
        setActiveTimer(timer);
        if (timer) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
            } catch (e) {
                console.warn("Failed to save timer to localStorage", e);
            }

            // Sync to Firestore immediately
            if (user) {
                const now = Date.now();
                const durationMillis = timer.initialDuration * 60 * 1000;
                // Reverse engineering startedAt from expectedEndTime
                const startedAtMillis = timer.isPaused
                    ? now - (durationMillis - (timer.timeLeftWhenPaused || 0) * 1000)
                    : timer.expectedEndTime - durationMillis;

                encryptText(timer.taskName, user.uid).then(encryptedName => {
                    const payload = {
                        currentTaskId: encryptedName,
                        status: timer.isPaused ? 'paused' : 'running',
                        startedAt: new Date(startedAtMillis), // Firestore handles JS Dates natively when setting docs
                        durationMillis: durationMillis,
                        pausedAtMillis: timer.isPaused ? now : null,
                        category: timer.category || null,
                        color: timer.color || null,
                        coOpSessionId: timer.coOpSessionId || null
                    };

                    setDoc(doc(db, 'active_sessions', user.uid), payload).catch(console.error);
                }).catch(() => {});
            }
        } else {
            localStorage.removeItem(STORAGE_KEY);
            if (user) {
                deleteDoc(doc(db, 'active_sessions', user.uid)).catch(console.error);
            }
        }
    }, [user]);

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
        localWriteTimestampRef.current = Date.now();
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
                const now = Date.now();
                const durationMillis = updated.initialDuration * 60 * 1000;
                const startedAtMillis = updated.isPaused
                    ? now - (durationMillis - (updated.timeLeftWhenPaused || 0) * 1000)
                    : updated.expectedEndTime - durationMillis;

                encryptText(updated.taskName, user.uid).then(encryptedName => {
                    const payload = {
                        currentTaskId: encryptedName,
                        status: updated.isPaused ? 'paused' : 'running',
                        startedAt: new Date(startedAtMillis),
                        durationMillis: durationMillis,
                        pausedAtMillis: updated.isPaused ? now : null,
                        category: updated.category || null,
                        color: updated.color || null,
                        coOpSessionId: updated.coOpSessionId || null
                    };

                    setDoc(doc(db, 'active_sessions', user.uid), payload).catch(console.error);
                }).catch(() => {});
            }
            return updated;
        });
    }, [user]);

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
