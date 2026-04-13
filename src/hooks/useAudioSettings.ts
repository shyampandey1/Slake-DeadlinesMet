
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Howl } from 'howler';

const AUDIO_ENABLED_KEY = 'timerAudioEnabled';
const SELECTED_SOUND_KEY = 'timerSelectedSound';
const VOLUME_KEY = 'timerVolume';

const finishSounds = [
    { name: 'Premium Chime', src: 'synthesized' },
    { name: 'Vintage Bell', src: 'https://actions.google.com/sounds/v1/alarms/dinner_bell_triangle.ogg' },
    { name: 'Digital Alarm', src: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg' },
    { name: 'Bugle Chime', src: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg' },
];

export function useAudioSettings() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState(finishSounds[0].name);
  const [volume, setVolumeState] = useState([0.7]); // higher default for "loud" chime
  const soundInstances = useRef<{ [key: string]: Howl }>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Define synthesis functions outside of the return to keep them stable
  const playSynthesizedChime = useCallback((vol: number) => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(vol, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4);
      masterGain.connect(ctx.destination);

      // Create a rich "tin" sound with harmonics
      const frequencies = [880, 1320, 1760, 2200];
      frequencies.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        // Add slight frequency drop for a more natural bell sound
        osc.frequency.exponentialRampToValueAtTime(f * 0.99, ctx.currentTime + 4);
        
        g.gain.setValueAtTime(0.3 / (i + 1), ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4);
        
        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 4);
      });
      
      setTimeout(() => ctx.close(), 5000);
    } catch (e) {
      console.warn("Chime synthesis failed", e);
    }
  }, []);

  const playSynthesizedTick = useCallback((vol: number) => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playClick = (time: number) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000, time);
        osc.frequency.exponentialRampToValueAtTime(500, time + 0.03);
        
        g.gain.setValueAtTime(vol * 0.4, time);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);
        
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.03);
      };

      // "tik-tik" sound (double click)
      playClick(ctx.currentTime);
      playClick(ctx.currentTime + 0.08);
      
      setTimeout(() => ctx.close(), 200);
    } catch (e) {
      console.warn("Tick synthesis failed", e);
    }
  }, []);

  useEffect(() => {
    let initialVolume = 0.7;
    let initialSound = 'Digital Alarm';

    try {
      const storedEnabled = localStorage.getItem(AUDIO_ENABLED_KEY);
      if (storedEnabled !== null) setIsAudioEnabled(JSON.parse(storedEnabled));
      
      const storedSound = localStorage.getItem(SELECTED_SOUND_KEY);
      if (storedSound && finishSounds.some(s => s.name === storedSound)) {
          initialSound = storedSound;
      }

      const storedVolume = localStorage.getItem(VOLUME_KEY);
      if (storedVolume !== null) initialVolume = parseFloat(storedVolume);
    } catch (error) {
      console.warn("Could not access localStorage for audio settings.");
    }
    
    setSelectedSound(initialSound);
    setVolumeState([initialVolume]);
    
    // Initialize Finish Sounds (only those that are URLs)
    finishSounds.forEach(sound => {
      if (sound.src !== 'synthesized') {
        soundInstances.current[sound.name] = new Howl({
          src: [sound.src],
          html5: true,
          volume: initialVolume,
          preload: true,
        });
      }
    });

    setIsInitialized(true);
    
    return () => {
      Object.values(soundInstances.current).forEach(howl => howl.unload());
    };
  }, []);

  const setAudioEnabledCallback = useCallback((enabled: boolean) => {
    setIsAudioEnabled(enabled);
    try {
      localStorage.setItem(AUDIO_ENABLED_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.warn("Could not access localStorage for audio settings.");
    }
  }, []);

  const setSelectedSoundCallback = useCallback((soundName: string) => {
    setSelectedSound(soundName);
    try {
      localStorage.setItem(SELECTED_SOUND_KEY, soundName);
    } catch (error) {
      console.warn("Could not access localStorage for audio settings.");
    }
  }, []);

  const setVolumeCallback = useCallback((newVolume: number[]) => {
    const vol = newVolume[0];
    setVolumeState([vol]);
    Object.values(soundInstances.current).forEach(howl => howl.volume(vol));
    try {
      localStorage.setItem(VOLUME_KEY, JSON.stringify(vol));
    } catch (error) {
      console.warn("Could not access localStorage for audio settings.");
    }
  }, []);
  
  const playFinish = useCallback(() => {
    if (!isAudioEnabled || !isInitialized) return;
    if (selectedSound === 'Premium Chime') {
      playSynthesizedChime(volume[0]);
    } else {
      const sound = soundInstances.current[selectedSound];
      if (sound) {
        sound.play();
      }
    }
  }, [isAudioEnabled, selectedSound, isInitialized, volume, playSynthesizedChime]);

  const playTick = useCallback(() => {
    if (!isAudioEnabled || !isInitialized) return;
    playSynthesizedTick(volume[0]);
  }, [isAudioEnabled, isInitialized, volume, playSynthesizedTick]);

  const testSound = useCallback(() => {
    if (!isInitialized) return;
    if (selectedSound === 'Premium Chime') {
      playSynthesizedChime(volume[0]);
    } else {
      const sound = soundInstances.current[selectedSound];
      if (sound) {
        sound.stop();
        sound.play();
      }
    }
  }, [selectedSound, isInitialized, volume, playSynthesizedChime]);

  return { 
    isAudioEnabled, 
    setAudioEnabled: setAudioEnabledCallback,
    sounds: finishSounds,
    selectedSound,
    setSelectedSound: setSelectedSoundCallback,
    volume,
    setVolume: setVolumeCallback,
    playFinish, 
    playTick,
    testSound 
  };
}
