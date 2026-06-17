"use client";

import { useEffect, useRef, useCallback } from "react";

class BreathingSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {}

  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85; // elegant volume (further increased for maximum clarity)
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Failed to initialize BreathingSynth AudioContext:", e);
    }
  }

  private getNoiseBuffer(): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    if (!this.ctx) return {} as AudioBuffer;
    const bufferSize = this.ctx.sampleRate * 4; // 4 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  playChime(type: "inhale" | "hold" | "exhale") {
    this.init();
    if (!this.ctx || this.ctx.state === "suspended") return;

    try {
      const time = this.ctx.currentTime;
      const duration = 4.0; // Phase length is 4.0 seconds

      // Tone Oscillators
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const toneGain = this.ctx.createGain();

      // Noise Source (for breath simulation)
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();
      noise.loop = true;
      const noiseFilter = this.ctx.createBiquadFilter();
      const noiseGain = this.ctx.createGain();

      // Master connections
      toneGain.connect(this.masterGain!);
      noiseGain.connect(this.masterGain!);

      if (type === "inhale") {
        // --- INHALE ---
        // Rising pitch: 220Hz (A3) -> 440Hz (A4)
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(220, time);
        osc1.frequency.exponentialRampToValueAtTime(440, time + duration);

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(330, time); // perfect fifth overtone
        osc2.frequency.exponentialRampToValueAtTime(660, time + duration);

        // Tone envelope: quiet to loud (breathing in)
        toneGain.gain.setValueAtTime(0.001, time);
        toneGain.gain.exponentialRampToValueAtTime(0.18, time + duration - 0.1);
        toneGain.gain.setValueAtTime(0.18, time + duration);

        // Filtered air-rush noise (simulating inhaling breath)
        noiseFilter.type = "bandpass";
        noiseFilter.Q.value = 3.0;
        noiseFilter.frequency.setValueAtTime(250, time);
        noiseFilter.frequency.exponentialRampToValueAtTime(950, time + duration);

        // Noise envelope: build up volume
        noiseGain.gain.setValueAtTime(0.001, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.25, time + duration - 0.1);
        noiseGain.gain.setValueAtTime(0.25, time + duration);

        // Connect noise
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);

      } else if (type === "hold") {
        // --- HOLD ---
        // Steady calming major triad chord (grounding stability)
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(440, time); // A4

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(554.37, time); // C#5 (Major third)

        // Steady quiet volume, with a release at the end
        toneGain.gain.setValueAtTime(0.14, time);
        toneGain.gain.setValueAtTime(0.14, time + duration - 0.3);
        toneGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        // No noise/breath sound during hold (holding breath)
        noiseGain.gain.setValueAtTime(0, time);

      } else if (type === "exhale") {
        // --- EXHALE ---
        // Descending pitch: 440Hz (A4) -> 220Hz (A3)
        osc1.type = "triangle";
        osc1.frequency.setValueAtTime(440, time);
        osc1.frequency.linearRampToValueAtTime(220, time + duration);

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(587.33, time); // D5 (Subdominant resolve)
        osc2.frequency.linearRampToValueAtTime(293.66, time + duration);

        // Tone envelope: loud to quiet (breathing out)
        toneGain.gain.setValueAtTime(0.18, time);
        toneGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        // Filtered air-rush noise (simulating exhaling breath)
        noiseFilter.type = "lowpass";
        noiseFilter.Q.value = 1.5;
        noiseFilter.frequency.setValueAtTime(1000, time);
        noiseFilter.frequency.linearRampToValueAtTime(180, time + duration);

        // Noise envelope: fade out
        noiseGain.gain.setValueAtTime(0.25, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        // Connect noise
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
      }

      // Start sound sources
      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + duration);
      osc2.stop(time + duration);

      if (type === "inhale" || type === "exhale") {
        noise.start(time);
        noise.stop(time + duration);
      }
    } catch (e) {
      console.warn("Error playing breathing synth phase:", e);
    }
  }

  stop() {
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) { }
      this.ctx = null;
    }
  }
}

export function useBreathingAudio() {
  const synthRef = useRef<BreathingSynth | null>(null);

  const initBreathingAudio = useCallback(() => {
    if (!synthRef.current) {
      synthRef.current = new BreathingSynth();
    }
    synthRef.current.init();
  }, []);

  const playBreathingChime = useCallback((type: "inhale" | "hold" | "exhale") => {
    if (!synthRef.current) {
      synthRef.current = new BreathingSynth();
    }
    synthRef.current.playChime(type);
  }, []);

  const stopBreathingAudio = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.stop();
      synthRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
      }
    };
  }, []);

  return {
    initBreathingAudio,
    playBreathingChime,
    stopBreathingAudio,
  };
}
