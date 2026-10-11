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

      let duration = 1.4;
      let baseFreq = 432; // Healing A 432Hz tuning reference

      if (type === "look-up") {
        baseFreq = 576; // D5 - gentle ascending harmonic
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, time);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, time + 0.6);
        duration = 1.2;
      } else if (type === "look-down") {
        baseFreq = 384; // G4 - grounding descending tone
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, time);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, time + 0.6);
        duration = 1.2;
      } else if (type === "look-left") {
        baseFreq = 432; // A4
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, time);
        if (panner) panner.pan.setValueAtTime(-0.85, time);
        duration = 1.1;
      } else if (type === "look-right") {
        baseFreq = 432; // A4
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, time);
        if (panner) panner.pan.setValueAtTime(0.85, time);
        duration = 1.1;
      } else if (type === "roll") {
        baseFreq = 432;
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, time);
        // Circular swirling stereo pan & subtle pitch glide
        if (panner) {
          panner.pan.setValueAtTime(-0.8, time);
          panner.pan.linearRampToValueAtTime(0.8, time + 0.7);
          panner.pan.linearRampToValueAtTime(-0.8, time + 1.4);
        }
        duration = 1.6;
      } else if (type === "close-eyes") {
        baseFreq = 216; // Deep soothing sub-harmonic
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, time);
        duration = 2.0;
        this.startDrone();
      } else if (type === "blink") {
        baseFreq = 648; // Crisp delicate water-droplet chime
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, time);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.1, time + 0.08);
        duration = 0.55;
      } else if (type === "focus-near-far") {
        baseFreq = 324;
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, time);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, time + 0.5);
        osc.frequency.exponentialRampToValueAtTime(baseFreq, time + 1.2);
        duration = 1.5;
      }

      // Add harmonic overtone oscillator for authentic singing bowl / crystal chime shimmer
      const overtone = this.ctx.createOscillator();
      const overtoneGain = this.ctx.createGain();
      overtone.type = "sine";
      overtone.frequency.setValueAtTime(baseFreq * 2.01, time); // warm natural detuned octave

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.25, time + 0.05); // soft velvet attack
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration); // long acoustic decay

      overtoneGain.gain.setValueAtTime(0.001, time);
      overtoneGain.gain.exponentialRampToValueAtTime(0.08, time + 0.03);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, time + (duration * 0.7));

      if (panner) {
        osc.connect(gain);
        overtone.connect(overtoneGain);
        gain.connect(panner);
        overtoneGain.connect(panner);
        panner.connect(this.masterGain!);
      } else {
        osc.connect(gain);
        overtone.connect(overtoneGain);
        gain.connect(this.masterGain!);
        overtoneGain.connect(this.masterGain!);
      }

      osc.start(time);
      overtone.start(time);
      osc.stop(time + duration + 0.15);
      overtone.stop(time + duration + 0.15);
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

      this.droneOsc.type = "sine";
      this.droneOsc.frequency.setValueAtTime(144, time); // 144Hz warm restorative alpha frequency
      
      this.droneGain.gain.setValueAtTime(0.001, time);
      this.droneGain.gain.linearRampToValueAtTime(0.18, time + 1.2);

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
