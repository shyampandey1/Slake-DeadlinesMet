"use client";

import { useEffect, useRef, useCallback } from "react";

class BreathingSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

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

  playChime(type: "inhale" | "hold" | "exhale") {
    this.init();
    if (!this.ctx || this.ctx.state === "suspended") return;

    try {
      const time = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = this.ctx.createDelay();
      const feedback = this.ctx.createGain();

      let baseFreq = 440;
      let duration = 1.6;

      if (type === "inhale") {
        // C5 (523.25 Hz) -> Rising, airy tone for inspiration
        baseFreq = 523.25;
        osc1.type = "sine";
        osc2.type = "triangle";

        osc1.frequency.setValueAtTime(baseFreq, time);
        osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, time + 0.8);
        
        osc2.frequency.setValueAtTime(baseFreq * 1.5, time);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.5 * 1.25, time + 0.8);
        duration = 1.4;
      } else if (type === "hold") {
        // G4 (392.00 Hz) -> Perfect fifth stability, bell-like grounding chime
        baseFreq = 392.00;
        osc1.type = "sine";
        osc2.type = "sine";

        osc1.frequency.setValueAtTime(baseFreq, time);
        // Add a higher bell harmonic (octave + major third)
        osc2.frequency.setValueAtTime(baseFreq * 2.5, time);
        duration = 2.0;
      } else if (type === "exhale") {
        // E4 (329.63 Hz) -> Warmer, lower tone descending slowly to simulate relaxation
        baseFreq = 329.63;
        osc1.type = "triangle";
        osc2.type = "sine";

        osc1.frequency.setValueAtTime(baseFreq, time);
        osc1.frequency.linearRampToValueAtTime(baseFreq * 0.85, time + 1.0);

        osc2.frequency.setValueAtTime(baseFreq * 1.33, time); // perfect fourth overtone
        osc2.frequency.linearRampToValueAtTime(baseFreq * 1.33 * 0.85, time + 1.0);
        duration = 1.8;
      }

      // Amplitude Envelope
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.12, time + 0.05); // quick attack
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration); // exponential decay

      // Delay / Echo effect for ambient spaciousness
      delay.delayTime.value = 0.35; // 350ms delay
      feedback.gain.value = 0.3; // 30% feedback

      // Connections: oscs -> gain -> delay feedback loop & master
      osc1.connect(gain);
      osc2.connect(gain);

      // Connect dry signal to master
      gain.connect(this.masterGain!);

      // Connect wet signal through delay feedback loop
      gain.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay); // feedback loop
      delay.connect(this.masterGain!); // delay to master

      osc1.start(time);
      osc2.start(time);
      
      osc1.stop(time + duration + 1.0);
      osc2.stop(time + duration + 1.0);
    } catch (e) {
      // Audio node failure fallback
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
