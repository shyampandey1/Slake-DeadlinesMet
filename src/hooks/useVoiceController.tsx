"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { VoiceIntentPayload, VoiceCommandRequest, VoiceAgentState } from '@/types/voice';
import { useAgentAudio } from '@/hooks/useAgentAudio';
import { useTasks } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { useActiveTimer } from '@/hooks/useActiveTimer';
import { useToast } from '@/hooks/use-toast';
import { getLocalDateString, getCachedDailyCoins, setCachedDailyCoins } from '@/lib/dailyCoins';

export interface VoiceContextValue {
  // Visibility / HUD toggle state
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  openAgentDM: () => void;
  closeAgentDM: () => void;
  toggleAgentDM: () => void;

  // Agent State
  agentState: VoiceAgentState;
  isListening: boolean;
  isThinking: boolean;
  isExecuting: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  detectedIntent: VoiceIntentPayload | null;
  error: string | null;
  waveformAmplitudes: number[];
  waveformFrequencies: number[];

  // Controller Actions
  startListening: () => void;
  stopListening: () => void;
  cancelListening: () => void;
  executeIntent: (intent: VoiceIntentPayload) => Promise<void>;
  speakFeedback: (text: string) => void;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

export interface VoiceProviderProps {
  children: React.ReactNode;
  onActionComplete?: () => void;
  onStateChange?: (state: VoiceAgentState) => void;
}

export function VoiceProvider({ children, onActionComplete, onStateChange }: VoiceProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { addTask } = useTasks();
  const { startTimer, updateTimer, clearTimer, activeTimer } = useActiveTimer();
  const { toast } = useToast();

  // Agent DM toggle state: default CLOSED (not staying full time active)
  const [isOpen, setIsOpenState] = useState<boolean>(false);
  const isOpenRef = useRef(false);
  const setIsOpen = useCallback((open: boolean) => {
    isOpenRef.current = open;
    setIsOpenState(open);
  }, []);

  const [agentState, setAgentStateInternal] = useState<VoiceAgentState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [detectedIntent, setDetectedIntent] = useState<VoiceIntentPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [waveformAmplitudes] = useState<number[]>(() => new Array(16).fill(0.3));
  // Neural Voice Engine & Audio-reactive Waveform
  const { speak: neuralSpeak, stopPlayback: stopNeuralPlayback, waveformFrequencies, ensureAudioContextRunning } = useAgentAudio();
  const neuralSpeakRef = useRef(neuralSpeak);
  useEffect(() => { neuralSpeakRef.current = neuralSpeak; }, [neuralSpeak]);
  const stopNeuralPlaybackRef = useRef(stopNeuralPlayback);
  useEffect(() => { stopNeuralPlaybackRef.current = stopNeuralPlayback; }, [stopNeuralPlayback]);


  // Mutable refs to keep callback references completely stable
  const addTaskRef = useRef(addTask);
  useEffect(() => { addTaskRef.current = addTask; }, [addTask]);

  const activeTimerRef = useRef(activeTimer);
  useEffect(() => { activeTimerRef.current = activeTimer; }, [activeTimer]);

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);

  const pathnameRef = useRef(pathname);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  const startTimerRef = useRef(startTimer);
  useEffect(() => { startTimerRef.current = startTimer; }, [startTimer]);

  const updateTimerRef = useRef(updateTimer);
  useEffect(() => { updateTimerRef.current = updateTimer; }, [updateTimer]);

  const clearTimerRef = useRef(clearTimer);
  useEffect(() => { clearTimerRef.current = clearTimer; }, [clearTimer]);

  const onActionCompleteRef = useRef(onActionComplete);
  useEffect(() => { onActionCompleteRef.current = onActionComplete; }, [onActionComplete]);

  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

  const transcriptRef = useRef('');
  const setTranscriptState = useCallback((val: string) => {
    transcriptRef.current = val;
    setTranscript(val);
  }, []);

  const setAgentState = useCallback((newState: VoiceAgentState) => {
    setAgentStateInternal(newState);
    onStateChangeRef.current?.(newState);
  }, []);

  // Speech Recognition lifecycle tracking refs
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isStartingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Haptic pulse helper
  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }, []);

  // Neural Text-To-Speech with state updates & haptics
  const speakFeedback = useCallback(async (text: string) => {
    if (!text || !text.trim()) {
      setAgentState('IDLE');
      return;
    }

    setAgentState('SPEAKING');
    triggerHaptic([80]);

    try {
      await neuralSpeakRef.current(text, {
        voiceProfile: 'assistant_female',
        speed: 1.05,
      });
    } catch (err) {
      console.warn('[Agent DM] Speech playback error:', err);
    } finally {
      setAgentState('IDLE');
    }
  }, [setAgentState, triggerHaptic]);

  // Dispatch intent action
  const executeIntent = useCallback(
    async (intent: VoiceIntentPayload) => {
      setAgentState('EXECUTING');
      triggerHaptic([80]);

      try {
        if (intent.speechFeedback) {
          speakFeedback(intent.speechFeedback);
        }

        switch (intent.action) {
          case 'NAVIGATE': {
            if (intent.targetRoute) {
              routerRef.current.push(intent.targetRoute);
            }
            break;
          }
          case 'TIMER_START':
          case 'TASK_CREATE': {
            const durationMins = intent.durationMinutes || (intent.durationSeconds ? intent.durationSeconds / 60 : 15);
            const durationSecs = intent.durationSeconds || Math.round(durationMins * 60);
            const taskName = intent.taskName || 'Focus Session';
            const category = (intent.category as any) || 'Productivity';
            const expectedEndTime = Date.now() + (durationSecs * 1000);

            // 1. Add to routine in background if user is logged in
            const curUser = userRef.current;
            if (curUser?.uid) {
              addTaskRef.current({
                name: taskName,
                duration: Math.max(1, Math.round(durationMins)),
                initialDuration: Math.max(1, Math.round(durationMins)),
                completed: false,
                category: category,
              }).catch(() => {});
            }

            // 2. Start active background timer
            startTimerRef.current({
              taskName,
              initialDuration: durationMins,
              category,
              expectedEndTime,
            });

            // 3. Immediately close the Agent DM HUD so fullscreen is unobstructed
            setIsOpen(false);

            // 4. Navigate directly to fullscreen timer
            const params = new URLSearchParams();
            params.set('task', taskName);
            params.set('duration', durationMins.toString());
            if (intent.durationSeconds) {
              params.set('seconds', intent.durationSeconds.toString());
            }
            params.set('category', category);
            params.set('expectedEndTime', expectedEndTime.toString());
            params.set('forceRestart', 'true');

            routerRef.current.push(`/timer?${params.toString()}`);

            const durDisplay = durationSecs < 60 ? `${durationSecs}s` : durationMins === 1 ? '1m' : `${durationMins}m`;
            toastRef.current({
              title: 'Focus Session Started ⏱️',
              description: `${taskName} (${durDisplay}) started in full screen.`,
            });
            break;
          }
          case 'TIMER_PAUSE': {
            updateTimerRef.current({ isPaused: true });
            break;
          }
          case 'TIMER_RESUME': {
            updateTimerRef.current({ isPaused: false });
            break;
          }
          case 'TIMER_STOP': {
            clearTimerRef.current();
            toastRef.current({
              title: 'Task Conquered! 🎉',
              description: 'Focus session completed and logged.',
            });
            break;
          }
          case 'TIMER_EXTEND': {
            const extendMins = intent.extendMinutes || 5;
            const curTimer = activeTimerRef.current;
            if (curTimer) {
              const newInitial = curTimer.initialDuration + extendMins;
              const newExpected = curTimer.expectedEndTime + (extendMins * 60 * 1000);
              updateTimerRef.current({ initialDuration: newInitial, expectedEndTime: newExpected });
              toastRef.current({
                title: 'Timer Extended ⏱️',
                description: `Added ${extendMins} minutes to active session.`,
              });
            }
            break;
          }
          case 'TIMER_SET_INTERVAL': {
            const interval = intent.intervalMinutes || 10;
            toastRef.current({
              title: 'Interval Alerts Configured 🔔',
              description: `You will be alerted every ${interval} minutes.`,
            });
            break;
          }
          case 'TASK_LOG_QUICK':
          case 'TASK_QUICK_LOG': {
            const curUser = userRef.current;
            if (curUser?.uid) {
              const cat = intent.category || 'Hydration';
              let earnedCoins = intent.earnedCoins || 15;
              if (cat === 'Productivity') earnedCoins = 50;
              else if (cat === 'Fitness') earnedCoins = 40;
              else if (cat === 'Meditation' || cat === 'Creativity') earnedCoins = 30;

              await addTaskRef.current({
                name: intent.taskName || 'Quick Habit Log',
                duration: intent.durationMinutes || 1,
                completed: true,
                initialDuration: intent.durationMinutes || 1,
                category: cat as any,
                earnedCoins,
              });

              try {
                const todayStr = getLocalDateString();
                const { amount } = getCachedDailyCoins();
                setCachedDailyCoins(amount + earnedCoins, todayStr);
              } catch (e) {}

              toastRef.current({
                title: 'Habit Conquered! ✨',
                description: `+${earnedCoins} Slake Coins earned for ${intent.taskName || 'quick log'}!`,
              });
            }
            break;
          }
// Handled above by unified TIMER_START / TASK_CREATE full screen launcher
          case 'COOP_ACTION': {
            routerRef.current.push('/reformers');
            toastRef.current({
              title: 'Co-op Reformers Hub',
              description: intent.speechFeedback,
            });
            break;
          }
          case 'REWARDS_ACTION':
          case 'REDEEM_TRIGGER': {
            routerRef.current.push('/rewards');
            break;
          }
          case 'SENSOR_ENVIRONMENT_TOGGLE': {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('slake-sensor-toggle', { detail: intent }));
            }
            toastRef.current({
              title: 'Sensory Environment',
              description: intent.speechFeedback,
            });
            break;
          }
          case 'MODAL_DISMISS': {
            // Dismiss and close Agent DM
            setIsOpen(false);
            break;
          }
          default:
            break;
        }

        onActionCompleteRef.current?.();
      } catch (err: any) {
        console.error('[Agent DM] Failed to execute voice intent:', err);
        setError(err.message || 'Execution error');
        setAgentState('IDLE');
      }
    },
    [speakFeedback, triggerHaptic, setAgentState, setIsOpen]
  );

  // Send completed transcript to API
  const processTranscript = useCallback(
    async (finalTranscript: string) => {
      const clean = finalTranscript.trim();
      if (!clean) {
        setAgentState('IDLE');
        setIsProcessing(false);
        isProcessingRef.current = false;
        return;
      }

      setAgentState('THINKING');
      setIsProcessing(true);
      isProcessingRef.current = true;
      triggerHaptic([30, 50, 30]);

      try {
        const curTimer = activeTimerRef.current;
        const payload: VoiceCommandRequest = {
          transcript: clean,
          currentRoute: pathnameRef.current,
          activeTimerState: curTimer
            ? {
                isRunning: !curTimer.isPaused,
                isPaused: curTimer.isPaused,
                taskName: curTimer.taskName,
              }
            : undefined,
        };

        const res = await fetch('/api/voice/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Failed to parse voice command (${res.status})`);
        }

        const data: VoiceIntentPayload = await res.json();
        setDetectedIntent(data);

        // Automatically execute high confidence matches
        if ((data.confidence || 0) >= 0.85) {
          await executeIntent(data);
        } else {
          setAgentState('IDLE');
        }
      } catch (err: any) {
        console.error('[Agent DM] Voice processing error:', err);
        setError('Could not process speech. Try again.');
        setAgentState('IDLE');
      } finally {
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    },
    [triggerHaptic, executeIntent, setAgentState]
  );

  // Stop listening gracefully and finalize transcript
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    isListeningRef.current = false;
    isStartingRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const currentText = transcriptRef.current.trim();
    if (currentText) {
      processTranscript(currentText);
    } else {
      setAgentState('IDLE');
    }
  }, [processTranscript, setAgentState]);

  // Start Speech Recognition with full state guarding
  const startListening = useCallback(() => {
    // Guard against duplicate start calls
    if (isStartingRef.current || isListeningRef.current) {
      return;
    }

    setError(null);
    setTranscriptState('');
    setDetectedIntent(null);
    isProcessingRef.current = false;

    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const msg = 'Speech recognition is not supported in this browser. Please use Chrome or Edge.';
      setError(msg);
      toastRef.current({
        variant: 'destructive',
        title: 'Voice Control Unavailable',
        description: msg,
      });
      return;
    }

    stopNeuralPlaybackRef.current?.();
    ensureAudioContextRunning();
    try {
      // Abort any old recognition instance cleanly
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }

      isStartingRef.current = true;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isStartingRef.current = false;
        isListeningRef.current = true;
        setAgentState('LISTENING');
        triggerHaptic([50]);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.results.length - 1; i >= event.resultIndex && i >= 0; i--) {
          // get the most up to date interim / final
        }
        let full = '';
        for (let i = 0; i < event.results.length; i++) {
          full += event.results[i][0].transcript;
        }

        setTranscriptState(full);

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        // Auto-finalize after 1200ms of silence once speech has been heard
        if (full.trim()) {
          silenceTimerRef.current = setTimeout(() => {
            if (isListeningRef.current && full.trim()) {
              isProcessingRef.current = true;
              stopListening();
            }
          }, 1200);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[Agent DM] Speech recognition event error:', event.error);
        isStartingRef.current = false;

        // 'no-speech' is normal silence timeout, not an unrecoverable failure
        if (event.error === 'no-speech') {
          return;
        }

        // 'aborted' is triggered when stop/cancel was called
        if (event.error === 'aborted') {
          return;
        }

        isListeningRef.current = false;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Microphone permission was denied. Please allow microphone access.');
        } else if (event.error === 'network') {
          setError('Network issue with speech recognition service.');
        } else {
          setError(`Voice recognition error: ${event.error}`);
        }
        setAgentState('IDLE');
      };

      recognition.onend = () => {
        isStartingRef.current = false;
        if (isListeningRef.current && !isProcessingRef.current) {
          // If ended naturally and we have text, process it
          if (transcriptRef.current.trim()) {
            isListeningRef.current = false;
            processTranscript(transcriptRef.current);
          } else {
            isListeningRef.current = false;
            setAgentState('IDLE');
          }
        } else {
          isListeningRef.current = false;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('[Agent DM] Error starting speech recognition:', err);
      isStartingRef.current = false;
      isListeningRef.current = false;
      setError(err.message || 'Error starting microphone.');
      setAgentState('IDLE');
    }
  }, [triggerHaptic, processTranscript, stopListening, setAgentState, setTranscriptState]);

  // Cancel listening and reset transcript
  const cancelListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    isListeningRef.current = false;
    isStartingRef.current = false;
    isProcessingRef.current = false;

    stopNeuralPlaybackRef.current?.();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    setTranscriptState('');
    setDetectedIntent(null);
    setAgentState('IDLE');
  }, [setAgentState, setTranscriptState]);

  // High-level toggle methods
  const openAgentDM = useCallback(() => {
    setIsOpen(true);
    // Short tick to allow UI to mount before mic stream initialization
    setTimeout(() => {
      startListening();
    }, 100);
  }, [setIsOpen, startListening]);

  const closeAgentDM = useCallback(() => {
    cancelListening();
    setIsOpen(false);
  }, [cancelListening, setIsOpen]);

  const toggleAgentDM = useCallback(() => {
    if (isOpenRef.current) {
      closeAgentDM();
    } else {
      openAgentDM();
    }
  }, [openAgentDM, closeAgentDM]);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const value: VoiceContextValue = {
    isOpen,
    setIsOpen,
    openAgentDM,
    closeAgentDM,
    toggleAgentDM,
    agentState,
    isListening: agentState === 'LISTENING',
    isThinking: agentState === 'THINKING',
    isExecuting: agentState === 'EXECUTING',
    isSpeaking: agentState === 'SPEAKING',
    isProcessing,
    transcript,
    detectedIntent,
    error,
    waveformAmplitudes,
    waveformFrequencies,
    startListening,
    stopListening,
    cancelListening,
    executeIntent,
    speakFeedback,
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

// Hook consumers
export function useVoiceController(props?: { onActionComplete?: () => void; onStateChange?: (state: VoiceAgentState) => void } | (() => void)) {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoiceController must be used within a VoiceProvider');
  }
  return context;
}

export function useVoiceContext() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoiceContext must be used within a VoiceProvider');
  }
  return context;
}
