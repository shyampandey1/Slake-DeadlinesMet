"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { VoiceIntentPayload, VoiceCommandRequest } from '@/types/voice';
import { useAuth } from '@/hooks/useAuth';
import { usePresetTasks } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/use-toast';

export interface UseVoiceControllerReturn {
  isListening: boolean;
  transcript: string;
  waveformAmplitudes: number[];
  detectedIntent: VoiceIntentPayload | null;
  isProcessing: boolean;
  startListening: () => void;
  stopListening: () => void;
  cancelListening: () => void;
  executeIntent: (intent: VoiceIntentPayload) => Promise<void>;
  error: string | null;
}

export function useVoiceController(onActionComplete?: () => void): UseVoiceControllerReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [waveformAmplitudes, setWaveformAmplitudes] = useState<number[]>(new Array(16).fill(0.1));
  const [detectedIntent, setDetectedIntent] = useState<VoiceIntentPayload | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { addTask } = usePresetTasks(user?.uid);
  const { toast } = useToast();

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Vocalize speech feedback
  const speakFeedback = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Execute a parsed intent payload
  const executeIntent = useCallback(
    async (intent: VoiceIntentPayload) => {
      setIsProcessing(true);
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
            const params = new URLSearchParams({
              task: intent.taskName || 'Focus Session',
              duration: String(intent.durationMinutes || 15),
              category: intent.category || 'Productivity',
            });
            router.push(`/timer?${params.toString()}`);
            break;
          }
          case 'TIMER_PAUSE':
          case 'TIMER_RESUME':
          case 'TIMER_STOP':
          case 'TIMER_EXTEND':
          case 'TIMER_SET_INTERVAL': {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('slake-timer-voice-command', { detail: intent })
              );
            }
            break;
          }
          case 'TASK_QUICK_LOG': {
            if (user?.uid) {
              await addTask({
                name: intent.taskName || 'Quick Habit',
                duration: intent.durationMinutes || 1,
                icon: intent.category === 'Hydration' ? 'Droplets' : 'CheckCircle2',
                category: intent.category || 'Hydration',
                order: 0,
              });
              toast({
                title: 'Quick Habit Logged! ✨',
                description: `${intent.taskName} marked complete.`,
              });
            }
            break;
          }
          case 'TASK_CREATE': {
            if (user?.uid) {
              await addTask({
                name: intent.taskName || 'Custom Task',
                duration: intent.durationMinutes || 15,
                icon: 'Laptop',
                category: intent.category || 'Productivity',
                order: 0,
              });
              toast({
                title: 'Task Created',
                description: `${intent.taskName} (${intent.durationMinutes}m) added to your routine.`,
              });
            }
            break;
          }
          case 'REDEEM_TRIGGER': {
            router.push('/rewards');
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
      } finally {
        setIsProcessing(false);
      }
    },
    [router, speakFeedback, addTask, user, toast, onActionComplete]
  );

  // Send completed transcript to API
  const processTranscript = useCallback(
    async (finalTranscript: string) => {
      if (!finalTranscript.trim()) return;
      setIsProcessing(true);

      try {
        const payload: VoiceCommandRequest = {
          transcript: finalTranscript,
          currentRoute: pathname,
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
      } catch (err: any) {
        console.error('Voice processing error:', err);
        setError('Could not process speech. Try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [pathname]
  );

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
          // Normalize to [0.1, 1.0]
          const normalized = Math.max(0.15, Math.min(1.0, val / 180));
          newAmplitudes.push(normalized);
        }

        setWaveformAmplitudes(newAmplitudes);
        animationFrameRef.current = requestAnimationFrame(renderFrame);
      };

      renderFrame();
    } catch (err) {
      console.warn('Audio visualizer media device error (non-fatal):', err);
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
    setWaveformAmplitudes(new Array(16).fill(0.1));
  }, []);

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
        setIsListening(true);
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
        setIsListening(false);
        stopAudioVisualizer();
      };

      recognition.onend = () => {
        setIsListening(false);
        stopAudioVisualizer();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setError(err.message || 'Error starting microphone.');
      setIsListening(false);
      stopAudioVisualizer();
    }
  }, [startAudioVisualizer, stopAudioVisualizer, processTranscript]);

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
    setIsListening(false);
    stopAudioVisualizer();

    if (transcript.trim() && !detectedIntent) {
      processTranscript(transcript);
    }
  }, [transcript, detectedIntent, stopAudioVisualizer, processTranscript]);

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
    setIsListening(false);
    setTranscript('');
    setDetectedIntent(null);
    stopAudioVisualizer();
  }, [stopAudioVisualizer]);

  useEffect(() => {
    return () => {
      cancelListening();
    };
  }, [cancelListening]);

  return {
    isListening,
    transcript,
    waveformAmplitudes,
    detectedIntent,
    isProcessing,
    startListening,
    stopListening,
    cancelListening,
    executeIntent,
    error,
  };
}
