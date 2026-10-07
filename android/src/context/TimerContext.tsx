import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { HapticService } from '../services/hapticService';
import { audioService } from '../services/audioService';
import { NotificationService } from '../services/notificationService';

interface TimerContextType {
  timeLeft: number;
  duration: number;
  isRunning: boolean;
  isPaused: boolean;
  activeTaskName: string;
  focusInterval: number;
  isIntervalFlashing: boolean;
  soundEnabled: boolean;
  isCoOpActive: boolean;
  startTimer: (taskName: string, durationMinutes: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  setFocusInterval: (minutes: number) => void;
  toggleSound: () => void;
}

const TimerContext = createContext<TimerContextType>({
  timeLeft: 25 * 60,
  duration: 25 * 60,
  isRunning: false,
  isPaused: false,
  activeTaskName: 'Deep Work Sprint',
  focusInterval: 5,
  isIntervalFlashing: false,
  soundEnabled: true,
  isCoOpActive: false,
  startTimer: () => {},
  pauseTimer: () => {},
  resumeTimer: () => {},
  stopTimer: () => {},
  setFocusInterval: () => {},
  toggleSound: () => {},
});

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profileData } = useAuth();
  const [duration, setDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTaskName, setActiveTaskName] = useState('Deep Work Sprint');
  const [focusInterval, setFocusIntervalState] = useState(5);
  const [isIntervalFlashing, setIsIntervalFlashing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCoOpActive, setIsCoOpActive] = useState(false);

  const targetEndTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastIntervalChimeSecondRef = useRef<number>(-1);

  // Co-Op Session Id determined by paired buddy
  const coWorkerId = profileData?.coWorkerId;
  const coOpSessionId = coWorkerId && user
    ? [user.uid, coWorkerId].sort().join('_')
    : null;

  // 1. Co-Op Session Listener
  useEffect(() => {
    if (!coOpSessionId) {
      setIsCoOpActive(false);
      return;
    }

    const sessionRef = doc(db, 'active_sessions', coOpSessionId);
    const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.isRunning) {
          setIsCoOpActive(true);
          setActiveTaskName(data.taskName || 'Co-Op Focus Session');
          setDuration(data.duration || 25 * 60);
          setIsPaused(data.isPaused || false);

          if (!data.isPaused && data.expectedEndTime) {
            targetEndTimeRef.current = data.expectedEndTime;
            const remaining = Math.max(0, Math.floor((data.expectedEndTime - Date.now()) / 1000));
            setTimeLeft(remaining);
            setIsRunning(true);
          } else if (data.isPaused && data.timeLeftWhenPaused !== undefined) {
            setTimeLeft(data.timeLeftWhenPaused);
            setIsRunning(true);
          }
        } else if (data && !data.isRunning && isRunning) {
          // Co-op stopped by buddy
          setIsRunning(false);
          setIsPaused(false);
          targetEndTimeRef.current = null;
        }
      }
    });

    return () => unsubscribe();
  }, [coOpSessionId]);

  // 2. High-precision native delta timer tick
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        if (!targetEndTimeRef.current) return;
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((targetEndTimeRef.current - now) / 1000));
        setTimeLeft(remaining);

        // Check focus interval marker (e.g. every 5 minutes elapsed)
        const elapsed = duration - remaining;
        const intervalSeconds = focusInterval * 60;
        if (
          intervalSeconds > 0 &&
          elapsed > 0 &&
          elapsed % intervalSeconds === 0 &&
          lastIntervalChimeSecondRef.current !== elapsed
        ) {
          lastIntervalChimeSecondRef.current = elapsed;
          audioService.playIntervalChime();
          HapticService.medium();
          setIsIntervalFlashing(true);
          NotificationService.sendIntervalAlert(focusInterval);
          setTimeout(() => setIsIntervalFlashing(false), 3000);
        }

        // Completion
        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current!);
          setIsRunning(false);
          setIsPaused(false);
          targetEndTimeRef.current = null;
          audioService.playCompletionCelebration();
          HapticService.success();
          NotificationService.sendTimerCompletionNotification(activeTaskName);
        }
      }, 500);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRunning, isPaused, duration, focusInterval, activeTaskName]);

  const startTimer = useCallback(
    (taskName: string, durationMinutes: number) => {
      const totalSeconds = durationMinutes * 60;
      const targetEnd = Date.now() + totalSeconds * 1000;
      targetEndTimeRef.current = targetEnd;

      setActiveTaskName(taskName);
      setDuration(totalSeconds);
      setTimeLeft(totalSeconds);
      setIsRunning(true);
      setIsPaused(false);
      lastIntervalChimeSecondRef.current = -1;

      HapticService.medium();

      // Broadcast to Co-Op session if connected
      if (coOpSessionId) {
        setDoc(
          doc(db, 'active_sessions', coOpSessionId),
          {
            taskName,
            duration: totalSeconds,
            expectedEndTime: targetEnd,
            isRunning: true,
            isPaused: false,
            updatedAt: Date.now(),
            startedBy: user?.uid,
          },
          { merge: true }
        ).catch((err) => console.warn("Co-Op sync pending:", err));
      }
    },
    [coOpSessionId, user]
  );

  const pauseTimer = useCallback(() => {
    if (!isRunning || isPaused) return;
    setIsPaused(true);
    HapticService.light();

    if (coOpSessionId) {
      updateDoc(doc(db, 'active_sessions', coOpSessionId), {
        isPaused: true,
        timeLeftWhenPaused: timeLeft,
      }).catch((err) => console.warn("Co-Op pause sync pending:", err));
    }
  }, [isRunning, isPaused, coOpSessionId, timeLeft]);

  const resumeTimer = useCallback(() => {
    if (!isRunning || !isPaused) return;
    const targetEnd = Date.now() + timeLeft * 1000;
    targetEndTimeRef.current = targetEnd;
    setIsPaused(false);
    HapticService.light();

    if (coOpSessionId) {
      updateDoc(doc(db, 'active_sessions', coOpSessionId), {
        isPaused: false,
        expectedEndTime: targetEnd,
      }).catch((err) => console.warn("Co-Op resume sync pending:", err));
    }
  }, [isRunning, isPaused, timeLeft, coOpSessionId]);

  const stopTimer = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(duration);
    targetEndTimeRef.current = null;
    HapticService.heavy();

    if (coOpSessionId) {
      updateDoc(doc(db, 'active_sessions', coOpSessionId), {
        isRunning: false,
        isPaused: false,
      }).catch((err) => console.warn("Co-Op stop sync pending:", err));
    }
  }, [duration, coOpSessionId]);

  const setFocusInterval = useCallback((minutes: number) => {
    setFocusIntervalState(minutes);
    HapticService.light();
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      audioService.setSoundEnabled(next);
      HapticService.light();
      return next;
    });
  }, []);

  return (
    <TimerContext.Provider
      value={{
        timeLeft,
        duration,
        isRunning,
        isPaused,
        activeTaskName,
        focusInterval,
        isIntervalFlashing,
        soundEnabled,
        isCoOpActive,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        setFocusInterval,
        toggleSound,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext);
