"use client";

import { useEffect, useRef, useCallback } from "react";

class EyeExerciseSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;

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
      console.warn("Failed to initialize EyeExerciseSynth AudioContext:", e);
    }
  }

  playChime(type: string) {
    this.init();
    if (!this.ctx || this.ctx.state === "suspended") return;

    this.stopDrone();

    try {
      const time = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      let panner: StereoPannerNode | null = null;

      if (typeof this.ctx.createStereoPanner === 'function') {
        panner = this.ctx.createStereoPanner();
      }

      let duration = 0.8;
      let baseFreq = 440;

      if (type === "look-up") {
        baseFreq = 659.25; // E5
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, time);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, time + 0.45);
        duration = 0.6;
      } else if (type === "look-down") {
        baseFreq = 329.63; // E4
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, time);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, time + 0.45);
        duration = 0.6;
      } else if (type === "look-left") {
        baseFreq = 440; // A4
        osc.type = "triangle";
        osc.frequency.setValueAtTime(baseFreq, time);
        if (panner) panner.pan.setValueAtTime(-0.85, time);
        duration = 0.5;
      } else if (type === "look-right") {
        baseFreq = 440; // A4
        osc.type = "triangle";
        osc.frequency.setValueAtTime(baseFreq, time);
        if (panner) panner.pan.setValueAtTime(0.85, time);
        duration = 0.5;
      } else if (type === "roll") {
        baseFreq = 392; // G4
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, time);
        for (let i = 0; i < 10; i++) {
          const modTime = time + (i * 0.1);
          const freqOffset = Math.sin(i * 1.2) * 80;
          osc.frequency.setValueAtTime(baseFreq + freqOffset, modTime);
        }
        duration = 1.0;
      } else if (type === "close-eyes") {
        baseFreq = 220; // A3
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, time);
        duration = 1.2;
        this.startDrone();
      } else if (type === "blink") {
        baseFreq = 880; // A5
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, time);
        osc.frequency.setValueAtTime(baseFreq * 1.25, time + 0.12);
        osc.frequency.setValueAtTime(baseFreq, time + 0.24);
        duration = 0.45;
      } else if (type === "focus-near-far") {
        baseFreq = 523.25; // C5
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, time);
        osc.frequency.setValueAtTime(baseFreq * 2.0, time + 0.25);
        duration = 0.85;
      }

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.12, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      if (panner) {
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain!);
      } else {
        osc.connect(gain);
        gain.connect(this.masterGain!);
      }

      osc.start(time);
      osc.stop(time + duration + 0.1);
    } catch (e) {
      console.warn("Chime playback error:", e);
    }
  }

  startDrone() {
    if (!this.ctx || this.ctx.state === "suspended") return;
    try {
      const time = this.ctx.currentTime;
      this.droneOsc = this.ctx.createOscillator();
      this.droneGain = this.ctx.createGain();

      this.droneOsc.type = "triangle";
      this.droneOsc.frequency.setValueAtTime(146.83, time); // D3
      
      this.droneGain.gain.setValueAtTime(0.001, time);
      this.droneGain.gain.linearRampToValueAtTime(0.25, time + 1.0); // louder relaxing drone

      this.droneOsc.connect(this.droneGain);
      this.droneGain.connect(this.masterGain!);

      this.droneOsc.start(time);
    } catch (e) {
      console.warn("Failed to start drone:", e);
    }
  }

  stopDrone() {
    if (this.droneOsc && this.droneGain && this.ctx) {
      try {
        const time = this.ctx.currentTime;
        this.droneGain.gain.cancelScheduledValues(time);
        this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, time);
        this.droneGain.gain.linearRampToValueAtTime(0.001, time + 0.3);
        
        const oscToStop = this.droneOsc;
        setTimeout(() => {
          try {
            oscToStop.stop();
          } catch(e) {}
        }, 350);
      } catch (e) {}
      this.droneOsc = null;
      this.droneGain = null;
    }
  }

  stop() {
    this.stopDrone();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) { }
      this.ctx = null;
    }
  }
}

export function useEyeExerciseAudio() {
  const synthRef = useRef<EyeExerciseSynth | null>(null);

  const initEyeAudio = useCallback(() => {
    if (!synthRef.current) {
      synthRef.current = new EyeExerciseSynth();
    }
    synthRef.current.init();
  }, []);

  const playEyeChime = useCallback((type: string) => {
    if (!synthRef.current) {
      synthRef.current = new EyeExerciseSynth();
    }
    synthRef.current.playChime(type);
  }, []);

  const stopEyeAudio = useCallback(() => {
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
    initEyeAudio,
    playEyeChime,
    stopEyeAudio,
  };
}
