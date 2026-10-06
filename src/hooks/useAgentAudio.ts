"use client";

import { useState, useRef, useEffect, useCallback } from 'react';

export interface VoiceOptions {
  voiceProfile?: 'assistant_female' | 'assistant_male' | 'mentor_calm';
  speed?: number;
}

// In-memory global Blob URL cache so repeated phrases play instantly with 0ms roundtrip delay
const blobCache = new Map<string, string>();

// Singleton AudioContext and AnalyserNode manager across hook mounts
let globalAudioCtx: AudioContext | null = null;
let globalAnalyser: AnalyserNode | null = null;

function getSharedAudioContext(): { ctx: AudioContext; analyser: AnalyserNode } | null {
  if (typeof window === 'undefined') return null;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
      globalAudioCtx = new AudioContextClass();
    }

    if (!globalAnalyser) {
      globalAnalyser = globalAudioCtx.createAnalyser();
      globalAnalyser.fftSize = 64; // Yields 32 frequency bins
      globalAnalyser.smoothingTimeConstant = 0.8;
      // Connect analyser to destination so audio output is heard
      globalAnalyser.connect(globalAudioCtx.destination);
    }

    return { ctx: globalAudioCtx, analyser: globalAnalyser };
  } catch (err) {
    console.warn('[useAgentAudio] Failed to initialize Web Audio API context:', err);
    return null;
  }
}

export function useAgentAudio() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [waveformFrequencies, setWaveformFrequencies] = useState<number[]>(() => new Array(16).fill(0));

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  // Resume suspended AudioContext on user interaction
  const ensureAudioContextRunning = useCallback(async () => {
    const shared = getSharedAudioContext();
    if (shared && shared.ctx.state === 'suspended') {
      try {
        await shared.ctx.resume();
      } catch (err) {
        console.warn('[useAgentAudio] Could not resume audio context:', err);
      }
    }
  }, []);

  // Update real-time frequency data loop via requestAnimationFrame
  const startVisualizerLoop = useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

    const updateLoop = () => {
      const shared = getSharedAudioContext();
      if (shared && shared.analyser && isPlayingRef.current) {
        const bufferLength = shared.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        shared.analyser.getByteFrequencyData(dataArray);

        // Subsample down to 16 normalized frequency values (0.0 - 1.0)
        const bins = 16;
        const normalized = new Array<number>(bins);
        const step = Math.max(1, Math.floor(bufferLength / bins));

        for (let i = 0; i < bins; i++) {
          const val = dataArray[i * step] || 0;
          normalized[i] = val / 255;
        }

        setWaveformFrequencies(normalized);
        rafIdRef.current = requestAnimationFrame(updateLoop);
      } else {
        // Smoothly decay to baseline 0
        setWaveformFrequencies((prev) => prev.map((v) => Math.max(0, v * 0.85)));
      }
    };

    rafIdRef.current = requestAnimationFrame(updateLoop);
  }, []);

  const stopPlayback = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (err) {
        // ignore
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setWaveformFrequencies(new Array(16).fill(0));
  }, []);

  // Native SpeechSynthesis fallback with simulated animation
  const fallbackSpeechSynthesis = useCallback(
    (text: string): Promise<void> => {
      return new Promise<void>((resolve) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
          stopPlayback();
          resolve();
          return;
        }

        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.05;
          utterance.pitch = 1.0;

          isPlayingRef.current = true;
          setIsPlaying(true);

          // Simulated rhythmic waveform for speech synthesis
          let tick = 0;
          const simInterval = setInterval(() => {
            if (!isPlayingRef.current) {
              clearInterval(simInterval);
              return;
            }
            tick++;
            setWaveformFrequencies(() =>
              Array.from({ length: 16 }, (_, i) => {
                const wave = Math.sin(tick * 0.3 + i * 0.4);
                return Math.max(0.1, (wave + 1) / 2 * 0.7);
              })
            );
          }, 60);

          utterance.onend = () => {
            clearInterval(simInterval);
            stopPlayback();
            resolve();
          };

          utterance.onerror = () => {
            clearInterval(simInterval);
            stopPlayback();
            resolve();
          };

          window.speechSynthesis.speak(utterance);
        } catch (err) {
          stopPlayback();
          resolve();
        }
      });
    },
    [stopPlayback]
  );

  // Main speak function using neural TTS with resilient fallback
  const speak = useCallback(
    async (text: string, options?: VoiceOptions): Promise<void> => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Abort previous playback
      stopPlayback();
      await ensureAudioContextRunning();

      const profile = options?.voiceProfile || 'assistant_female';
      const speed = options?.speed || 1.05;
      const cacheKey = `${profile}_${speed}_${trimmed.toLowerCase()}`;

      let audioUrl = blobCache.get(cacheKey);

      // If not cached, fetch from server route with a 1500ms timeout race
      if (!audioUrl) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        try {
          const res = await fetch('/api/voice/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: trimmed,
              voiceProfile: profile,
              speed,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            console.warn('[useAgentAudio] Neural TTS API returned status:', res.status);
            return fallbackSpeechSynthesis(trimmed);
          }

          const blob = await res.blob();
          if (blob.size === 0) {
            return fallbackSpeechSynthesis(trimmed);
          }

          audioUrl = URL.createObjectURL(blob);
          blobCache.set(cacheKey, audioUrl);
        } catch (err: any) {
          clearTimeout(timeoutId);
          console.warn('[useAgentAudio] Neural synthesis timed out or failed, falling back:', err?.message);
          return fallbackSpeechSynthesis(trimmed);
        }
      }

      // Stream audio via HTML5 Audio through Web Audio API Analyser
      return new Promise<void>((resolve) => {
        try {
          const audio = new Audio();
          audio.crossOrigin = 'anonymous';
          audio.src = audioUrl!;
          audioRef.current = audio;

          const shared = getSharedAudioContext();
          if (shared && !sourceNodeRef.current) {
            try {
              sourceNodeRef.current = shared.ctx.createMediaElementSource(audio);
              sourceNodeRef.current.connect(shared.analyser);
            } catch (nodeErr) {
              // Node might already be bound or blocked by browser policy
              console.warn('[useAgentAudio] Source node attachment warning:', nodeErr);
            }
          }

          audio.onplay = () => {
            isPlayingRef.current = true;
            setIsPlaying(true);
            startVisualizerLoop();
          };

          audio.onended = () => {
            stopPlayback();
            resolve();
          };

          audio.onerror = () => {
            console.warn('[useAgentAudio] HTML5 audio error, trying fallback');
            stopPlayback();
            fallbackSpeechSynthesis(trimmed).then(resolve);
          };

          audio.play().catch((playErr) => {
            console.warn('[useAgentAudio] Audio play rejected (autoplay policy):', playErr);
            fallbackSpeechSynthesis(trimmed).then(resolve);
          });
        } catch (err) {
          fallbackSpeechSynthesis(trimmed).then(resolve);
        }
      });
    },
    [stopPlayback, ensureAudioContextRunning, startVisualizerLoop, fallbackSpeechSynthesis]
  );

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  return {
    speak,
    stopPlayback,
    isPlaying,
    waveformFrequencies,
    ensureAudioContextRunning,
  };
}
