"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { VoiceIntentPayload, VoiceCommandRequest, VoiceAgentState } from '@/types/voice';
import { useTasks } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { useActiveTimer } from '@/hooks/useActiveTimer';
import { useToast } from '@/hooks/use-toast';
import { getLocalDateString, getCachedDailyCoins, setCachedDailyCoins } from '@/lib/dailyCoins';

interface UseVoiceControllerProps {
  onActionComplete?: () => void;
  onStateChange?: (state: VoiceAgentState) => void;
}

export function useVoiceController({ onActionComplete, onStateChange }: UseVoiceControllerProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { addTask } = useTasks();
  const { startTimer, updateTimer, clearTimer, activeTimer } = useActiveTimer();
  const { toast } = useToast();

  const [agentState, setAgentStateInternal] = useState<VoiceAgentState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [detectedIntent, setDetectedIntent] = useState<VoiceIntentPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waveformAmplitudes, setWaveformAmplitudes] = useState<number[]>(new Array(16).fill(0.15));

  // Audio Context & Analyser references
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Speech Recognition reference
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  const setAgentState = useCallback((newState: VoiceAgentState) => {
    setAgentStateInternal(newState);
    onStateChange?.(newState);
  }, [onStateChange]);

  // Haptic pulse helper
  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }, []);

  // Text-To-Speech with state updates
  const speakFeedback = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      setAgentState('SPEAKING');

      utterance.onend = () => {
        setAgentState('IDLE');
      };
      utterance.onerror = () => {
        setAgentState('IDLE');
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setAgentState('IDLE');
    }
  }, [setAgentState]);

  // Audio waveform visualizer using Web Audio API AnalyserNode
  const startAudioVisualizer = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const renderFrame = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Sample 16 discrete bars from frequencies
        const barCount = 16;
        const step = Math.floor(dataArray.length / barCount);
        const newAmplitudes: number[] = [];

        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i * step] || 0;
          // Scale dynamically for green waveform bars
          const normalized = Math.max(0.15, Math.min(1.0, (val / 160) + 0.15));
          newAmplitudes.push(normalized);
        }

        setWaveformAmplitudes(newAmplitudes);
        animationFrameRef.current = requestAnimationFrame(renderFrame);
      };

      renderFrame();
    } catch (err) {
      console.warn('Audio visualizer stream init (non-fatal):', err);
    }
  }, []);

  const stopAudioVisualizer = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setWaveformAmplitudes(new Array(16).fill(0.15));
  }, []);

  // Dispatch intent action
  const executeIntent = useCallback(
    async (intent: VoiceIntentPayload) => {
      setAgentState('EXECUTING');
      // Action Processing Haptic: Crisp success pulse [80]
      triggerHaptic([80]);

      try {
        if (intent.speechFeedback) {
          speakFeedback(intent.speechFeedback);
        }

        switch (intent.action) {
          case 'NAVIGATE': {
            if (intent.targetRoute) {
              router.push(intent.targetRoute);
            }
            break;
          }
          case 'TIMER_START': {
            const duration = intent.durationMinutes || 15;
            startTimer({
              taskName: intent.taskName || 'Focus Session',
              initialDuration: duration,
              category: intent.category || 'Productivity',
            });
            router.push('/');
            break;
          }
          case 'TIMER_PAUSE': {
            updateTimer({ isPaused: true });
            break;
          }
          case 'TIMER_RESUME': {
            updateTimer({ isPaused: false });
            break;
          }
          case 'TIMER_STOP': {
            clearTimer();
            toast({
              title: 'Task Conquered! 🎉',
              description: 'Focus session completed and logged.',
            });
            break;
          }
          case 'TIMER_EXTEND': {
            const extendMins = intent.extendMinutes || 5;
            if (activeTimer) {
              const newInitial = activeTimer.initialDuration + extendMins;
              const newExpected = activeTimer.expectedEndTime + (extendMins * 60 * 1000);
              updateTimer({ initialDuration: newInitial, expectedEndTime: newExpected });
              toast({
                title: 'Timer Extended ⏱️',
                description: `Added ${extendMins} minutes to active session.`,
              });
            }
            break;
          }
          case 'TIMER_SET_INTERVAL': {
            const interval = intent.intervalMinutes || 10;
            toast({
              title: 'Interval Alerts Configured 🔔',
              description: `You will be alerted every ${interval} minutes.`,
            });
            break;
          }
          case 'TASK_LOG_QUICK':
          case 'TASK_QUICK_LOG': {
            if (user?.uid) {
              const cat = intent.category || 'Hydration';
              let earnedCoins = intent.earnedCoins || 15;
              if (cat === 'Productivity') earnedCoins = 50;
              else if (cat === 'Fitness') earnedCoins = 40;
              else if (cat === 'Meditation' || cat === 'Creativity') earnedCoins = 30;

              await addTask({
                name: intent.taskName || 'Quick Habit Log',
                duration: intent.durationMinutes || 1,
                completed: true,
                initialDuration: intent.durationMinutes || 1,
                icon: cat === 'Hydration' ? 'Droplets' : cat === 'Fitness' ? 'Dumbbell' : 'CheckCircle2',
                category: cat,
                earnedCoins,
                order: 0,
              });

              // Optimistic daily coins cache update
              try {
                const todayStr = getLocalDateString();
                const { amount } = getCachedDailyCoins();
                setCachedDailyCoins(amount + earnedCoins, todayStr);
              } catch (e) {}

              toast({
                title: 'Habit Conquered! ✨',
                description: `+${earnedCoins} Slake Coins earned for ${intent.taskName || 'quick log'}!`,
              });
            }
            break;
          }
          case 'TASK_CREATE': {
            if (user?.uid) {
              await addTask({
                name: intent.taskName || 'Custom Task',
                duration: intent.durationMinutes || 15,
                initialDuration: intent.durationMinutes || 15,
                completed: false,
                icon: 'Laptop',
                category: intent.category || 'Productivity',
                order: 0,
              });
              toast({
                title: 'Task Created 📋',
                description: `${intent.taskName} (${intent.durationMinutes}m) added to your routine.`,
              });
            }
            break;
          }
          case 'COOP_ACTION': {
            router.push('/reformers');
            toast({
              title: 'Co-op Reformers Hub',
              description: intent.speechFeedback,
            });
            break;
          }
          case 'REWARDS_ACTION':
          case 'REDEEM_TRIGGER': {
            router.push('/rewards');
            break;
          }
          case 'SENSOR_ENVIRONMENT_TOGGLE': {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('slake-sensor-toggle', { detail: intent }));
            }
            toast({
              title: 'Sensory Environment',
              description: intent.speechFeedback,
            });
            break;
          }
          case 'MODAL_DISMISS':
          default:
            break;
        }

        onActionComplete?.();
      } catch (err: any) {
        console.error('Failed to execute voice intent:', err);
        setError(err.message || 'Execution error');
        setAgentState('IDLE');
      }
    },
    [router, speakFeedback, triggerHaptic, startTimer, updateTimer, clearTimer, activeTimer, addTask, user, toast, onActionComplete, setAgentState]
  );

  // Send completed transcript to API
  const processTranscript = useCallback(
    async (finalTranscript: string) => {
      if (!finalTranscript.trim()) {
        setAgentState('IDLE');
        return;
      }

      setAgentState('THINKING');
      // Thinking State Haptic: Double micro pulse [30, 50, 30]
      triggerHaptic([30, 50, 30]);

      try {
        const payload: VoiceCommandRequest = {
          transcript: finalTranscript,
          currentRoute: pathname,
          activeTimerState: activeTimer
            ? {
                isRunning: !activeTimer.isPaused,
                isPaused: activeTimer.isPaused,
                taskName: activeTimer.taskName,
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
        if ((data.confidence || 0) >= 0.90) {
          await executeIntent(data);
        } else {
          setAgentState('IDLE');
        }
      } catch (err: any) {
        console.error('Voice processing error:', err);
        setError('Could not process speech. Try again.');
        setAgentState('IDLE');
      }
    },
    [pathname, activeTimer, triggerHaptic, executeIntent, setAgentState]
  );

  // Start Speech Recognition with 800ms silence debounce
  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    setDetectedIntent(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setAgentState('LISTENING');
        // Listen Trigger Haptic: Single short pulse [50]
        triggerHaptic([50]);
        startAudioVisualizer();
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        setTranscript(currentTranscript);

        // 800ms silence debounce: trigger processing when speaker pauses
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = setTimeout(() => {
          if (currentTranscript.trim()) {
            recognition.stop();
            processTranscript(currentTranscript);
          }
        }, 800);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setError(event.error);
        }
        setAgentState('IDLE');
        stopAudioVisualizer();
      };

      recognition.onend = () => {
        stopAudioVisualizer();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setError(err.message || 'Error starting microphone.');
      setAgentState('IDLE');
      stopAudioVisualizer();
    }
  }, [triggerHaptic, startAudioVisualizer, stopAudioVisualizer, processTranscript, setAgentState]);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    stopAudioVisualizer();

    if (transcript.trim() && !detectedIntent) {
      processTranscript(transcript);
    } else {
      setAgentState('IDLE');
    }
  }, [transcript, detectedIntent, stopAudioVisualizer, processTranscript, setAgentState]);

  const cancelListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    setAgentState('IDLE');
    setTranscript('');
    setDetectedIntent(null);
    stopAudioVisualizer();
  }, [stopAudioVisualizer, setAgentState]);

  useEffect(() => {
    return () => {
      cancelListening();
    };
  }, [cancelListening]);

  return {
    agentState,
    isListening: agentState === 'LISTENING',
    isThinking: agentState === 'THINKING',
    isExecuting: agentState === 'EXECUTING',
    isSpeaking: agentState === 'SPEAKING',
    transcript,
    waveformAmplitudes,
    detectedIntent,
    startListening,
    stopListening,
    cancelListening,
    executeIntent,
    error,
  };
}
