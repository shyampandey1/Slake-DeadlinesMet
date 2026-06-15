"use client";

import { useEffect, useRef, useCallback } from "react";

class HydrationSynth {
  private ctx: AudioContext | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private filter1: BiquadFilterNode | null = null;
  private filter2: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private bubbleInterval: any = null;

  constructor() {}

  start() {
    if (this.ctx) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // Create Brown Noise Buffer (pleasant, warm, low-frequency waterfall/ocean rumble)
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // First-order filter to create pink/brown rolling warm rumble
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Compensate for filter attenuation
      }

      this.noiseSource = this.ctx.createBufferSource();
      this.noiseSource.buffer = noiseBuffer;
      this.noiseSource.loop = true;

      // Bandpass Filter 1 (creates the flowing resonant body)
      this.filter1 = this.ctx.createBiquadFilter();
      this.filter1.type = "bandpass";
      this.filter1.Q.value = 1.8;
      this.filter1.frequency.value = 550;

      // Bandpass Filter 2 (adds higher liquid ripples)
      this.filter2 = this.ctx.createBiquadFilter();
      this.filter2.type = "bandpass";
      this.filter2.Q.value = 2.2;
      this.filter2.frequency.value = 1100;

      // LFO to modulate filter frequency slowly (gives a natural flowing/swirling motion)
      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.value = 0.4; // 0.4 Hz

      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.value = 180; // modulate by +/- 180 Hz

      // Connect LFO modulation
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.filter1.frequency);
      this.lfoGain.connect(this.filter2.frequency);

      // Connect noise source to filters in parallel
      this.noiseSource.connect(this.filter1);
      this.noiseSource.connect(this.filter2);

      // Lowpass Filter to soften the harsh frequencies
      const lpFilter = this.ctx.createBiquadFilter();
      lpFilter.type = "lowpass";
      lpFilter.frequency.value = 1600;

      this.filter1.connect(lpFilter);
      this.filter2.connect(lpFilter);

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.08; // subtle ambient level

      lpFilter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // Play noise and LFO
      this.noiseSource.start(0);
      this.lfo.start(0);

      // Start bubble drip generator
      this.bubbleInterval = setInterval(() => {
        this.playBubble();
      }, 250 + Math.random() * 200);
    } catch (e) {
      console.warn("Failed to start HydrationSynth:", e);
    }
  }

  private playBubble() {
    if (!this.ctx || this.ctx.state === "suspended") return;

    try {
      const time = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Sine wave for clean tone
      osc.type = "sine";
      
      const startFreq = 500 + Math.random() * 500;
      const endFreq = startFreq + 250 + Math.random() * 150;
      const duration = 0.04 + Math.random() * 0.06;

      // Fast rising frequency sweep simulates a bubble rising/dripping
      osc.frequency.setValueAtTime(startFreq, time);
      osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);

      // Amplitude decay envelope (increased initial gain since it routes through masterGain now)
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      // Bandpass filter to isolate the resonance
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(endFreq, time);
      filter.Q.value = 3.0;

      osc.connect(gain);
      gain.connect(filter);
      
      // Connect to masterGain to allow UI control (volume adjustments & mute switches)
      if (this.masterGain) {
        filter.connect(this.masterGain);
      } else {
        filter.connect(this.ctx.destination);
      }

      osc.start(time);
      osc.stop(time + duration);
    } catch (e) {
      // Ignore audio glitches during stop/close
    }
  }

  setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(volume * 0.08, this.ctx.currentTime, 0.1);
    }
  }

  stop() {
    if (this.bubbleInterval) {
      clearInterval(this.bubbleInterval);
      this.bubbleInterval = null;
    }
    
    // Stop and close everything
    try {
      if (this.noiseSource) {
        this.noiseSource.stop();
      }
      if (this.lfo) {
        this.lfo.stop();
      }
      if (this.ctx) {
        this.ctx.close();
      }
    } catch (e) {
      // Already stopped
    } finally {
      this.noiseSource = null;
      this.lfo = null;
      this.ctx = null;
    }
  }
}

export function useHydrationAudio() {
  const synthRef = useRef<HydrationSynth | null>(null);

  const getSynth = useCallback(() => {
    if (!synthRef.current) {
      synthRef.current = new HydrationSynth();
    }
    return synthRef.current;
  }, []);

  const startHydrationAudio = useCallback(() => {
    getSynth().start();
  }, [getSynth]);

  const stopHydrationAudio = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.stop();
      synthRef.current = null;
    }
  }, []);

  const setHydrationVolume = useCallback((vol: number) => {
    if (synthRef.current) {
      synthRef.current.setVolume(vol);
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
    startHydrationAudio,
    stopHydrationAudio,
    setHydrationVolume,
  };
}
