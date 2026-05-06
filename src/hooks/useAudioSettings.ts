
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Howl } from 'howler';

const AUDIO_ENABLED_KEY = 'timerAudioEnabled';
const SELECTED_SOUND_KEY = 'timerSelectedSound';
const VOLUME_KEY = 'timerVolume';

const finishSounds = [
    { name: 'Premium Chime', src: 'synthesized' },
    { name: 'Vintage Bell', src: 'https://actions.google.com/sounds/v1/alarms/dinner_bell_triangle.ogg' },
    { name: 'Digital Alarm', src: 'synthesized_digital' },
    { name: 'Bugle Chime', src: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg' },
];

const AMBIENT_ENABLED_KEY = 'timerAmbientEnabled';
const SELECTED_AMBIENT_KEY = 'timerSelectedAmbient';
const AMBIENT_VOLUME_KEY = 'timerAmbientVolume';

const SOUNDTRACK_ENABLED_KEY = 'timerSoundtrackEnabled';
const SELECTED_SOUNDTRACK_KEY = 'timerSelectedSoundtrack';
const SOUNDTRACK_VOLUME_KEY = 'timerSoundtrackVolume';

export const ambientSounds = [
    { name: 'Rain', src: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg' },
    { name: 'Forest', src: 'https://actions.google.com/sounds/v1/ambiences/forest_morning_with_birds.ogg' },
    { name: 'Cafe', src: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg' },
];

export const soundtracks = [
    { name: 'Deep Focus (Ocean)', src: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg' },
];


export function useAudioSettings() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState(finishSounds[0].name);
  const [volume, setVolumeState] = useState([1.0]); // higher default for "loud" chime
  
  const [isAmbientEnabled, setIsAmbientEnabled] = useState(false);
  const [selectedAmbient, setSelectedAmbient] = useState(ambientSounds[0].name);
  const [ambientVolume, setAmbientVolumeState] = useState([0.5]);
  
  const [isSoundtrackEnabled, setIsSoundtrackEnabled] = useState(false);
  const [selectedSoundtrack, setSelectedSoundtrack] = useState(soundtracks[0].name);
  const [soundtrackVolume, setSoundtrackVolumeState] = useState([0.3]);

  const soundInstances = useRef<{ [key: string]: Howl }>({});
  const ambientInstances = useRef<{ [key: string]: Howl }>({});
  const soundtrackInstances = useRef<{ [key: string]: Howl }>({});
  
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

  const playSynthesizedDigitalAlarm = useCallback((vol: number) => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playBeep = (time: number) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, time);
        
        const adjustedVol = Math.min(vol * 1.5, 1.0);
        
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(adjustedVol, time + 0.02);
        g.gain.setValueAtTime(adjustedVol, time + 0.15);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
        
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.25);
      };

      for (let i = 0; i < 4; i++) {
          const groupStart = ctx.currentTime + (i * 1.0);
          playBeep(groupStart);
          playBeep(groupStart + 0.25);
          playBeep(groupStart + 0.5);
      }
      
      setTimeout(() => ctx.close(), 4500);
    } catch (e) {
      console.warn("Digital alarm synthesis failed", e);
    }
  }, []);


  useEffect(() => {
    let initialVolume = 1.0;
    let initialSound = 'Digital Alarm';
    let initAmbEnabled = false;
    let initAmbSound = ambientSounds[0].name;
    let initAmbVol = 0.5;
    let initStEnabled = false;
    let initStSound = soundtracks[0].name;
    let initStVol = 0.3;

    try {
      const storedEnabled = localStorage.getItem(AUDIO_ENABLED_KEY);
      if (storedEnabled !== null) setIsAudioEnabled(JSON.parse(storedEnabled));
      
      const storedSound = localStorage.getItem(SELECTED_SOUND_KEY);
      if (storedSound && finishSounds.some(s => s.name === storedSound)) {
          initialSound = storedSound;
      }
      const storedVolume = localStorage.getItem(VOLUME_KEY);
      if (storedVolume !== null) initialVolume = parseFloat(storedVolume);

      const storedAmbEnabled = localStorage.getItem(AMBIENT_ENABLED_KEY);
      if (storedAmbEnabled !== null) initAmbEnabled = JSON.parse(storedAmbEnabled);
      const storedAmbSound = localStorage.getItem(SELECTED_AMBIENT_KEY);
      if (storedAmbSound && ambientSounds.some(s => s.name === storedAmbSound)) initAmbSound = storedAmbSound;
      const storedAmbVol = localStorage.getItem(AMBIENT_VOLUME_KEY);
      if (storedAmbVol !== null) initAmbVol = parseFloat(storedAmbVol);

      const storedStEnabled = localStorage.getItem(SOUNDTRACK_ENABLED_KEY);
      if (storedStEnabled !== null) initStEnabled = JSON.parse(storedStEnabled);
      const storedStSound = localStorage.getItem(SELECTED_SOUNDTRACK_KEY);
      if (storedStSound && soundtracks.some(s => s.name === storedStSound)) initStSound = storedStSound;
      const storedStVol = localStorage.getItem(SOUNDTRACK_VOLUME_KEY);
      if (storedStVol !== null) initStVol = parseFloat(storedStVol);

    } catch (error) {
      console.warn("Could not access localStorage for audio settings.");
    }
    
    setSelectedSound(initialSound);
    setVolumeState([initialVolume]);
    setIsAmbientEnabled(initAmbEnabled);
    setSelectedAmbient(initAmbSound);
    setAmbientVolumeState([initAmbVol]);
    setIsSoundtrackEnabled(initStEnabled);
    setSelectedSoundtrack(initStSound);
    setSoundtrackVolumeState([initStVol]);
    
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

    ambientSounds.forEach(sound => {
      ambientInstances.current[sound.name] = new Howl({
        src: [sound.src],
        html5: true,
        volume: initAmbVol,
        loop: true,
        preload: true,
      });
    });

    soundtracks.forEach(sound => {
      soundtrackInstances.current[sound.name] = new Howl({
        src: [sound.src],
        html5: true,
        volume: initStVol,
        loop: true,
        preload: true,
      });
    });

    setIsInitialized(true);
    
    return () => {
      Object.values(soundInstances.current).forEach(howl => howl.unload());
      Object.values(ambientInstances.current).forEach(howl => howl.unload());
      Object.values(soundtrackInstances.current).forEach(howl => howl.unload());
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

  const setAmbientEnabledCallback = useCallback((enabled: boolean) => {
    setIsAmbientEnabled(enabled);
    try { localStorage.setItem(AMBIENT_ENABLED_KEY, JSON.stringify(enabled)); } catch (e) {}
  }, []);

  const setSelectedAmbientCallback = useCallback((soundName: string) => {
    setSelectedAmbient(soundName);
    try { localStorage.setItem(SELECTED_AMBIENT_KEY, soundName); } catch (e) {}
  }, []);

  const setAmbientVolumeCallback = useCallback((newVolume: number[]) => {
    const vol = newVolume[0];
    setAmbientVolumeState([vol]);
    Object.values(ambientInstances.current).forEach(howl => howl.volume(vol));
    try { localStorage.setItem(AMBIENT_VOLUME_KEY, JSON.stringify(vol)); } catch (e) {}
  }, []);

  const setSoundtrackEnabledCallback = useCallback((enabled: boolean) => {
    setIsSoundtrackEnabled(enabled);
    try { localStorage.setItem(SOUNDTRACK_ENABLED_KEY, JSON.stringify(enabled)); } catch (e) {}
  }, []);

  const setSelectedSoundtrackCallback = useCallback((soundName: string) => {
    setSelectedSoundtrack(soundName);
    try { localStorage.setItem(SELECTED_SOUNDTRACK_KEY, soundName); } catch (e) {}
  }, []);

  const setSoundtrackVolumeCallback = useCallback((newVolume: number[]) => {
    const vol = newVolume[0];
    setSoundtrackVolumeState([vol]);
    Object.values(soundtrackInstances.current).forEach(howl => howl.volume(vol));
    try { localStorage.setItem(SOUNDTRACK_VOLUME_KEY, JSON.stringify(vol)); } catch (e) {}
  }, []);

  
  const playFinish = useCallback(() => {
    if (!isAudioEnabled || !isInitialized) return;
    if (selectedSound === 'Premium Chime') {
      playSynthesizedChime(volume[0]);
    } else if (selectedSound === 'Digital Alarm') {
      playSynthesizedDigitalAlarm(volume[0]);
    } else {
      const sound = soundInstances.current[selectedSound];
      if (sound) {
        sound.play();
      }
    }
  }, [isAudioEnabled, selectedSound, isInitialized, volume, playSynthesizedChime, playSynthesizedDigitalAlarm]);

  const playTick = useCallback(() => {
    if (!isAudioEnabled || !isInitialized) return;
    playSynthesizedTick(volume[0]);
  }, [isAudioEnabled, isInitialized, volume, playSynthesizedTick]);

  const testSound = useCallback(() => {
    if (!isInitialized) return;
    if (selectedSound === 'Premium Chime') {
      playSynthesizedChime(volume[0]);
    } else if (selectedSound === 'Digital Alarm') {
      playSynthesizedDigitalAlarm(volume[0]);
    } else {
      const sound = soundInstances.current[selectedSound];
      if (sound) {
        sound.stop();
        sound.play();
      }
    }
  }, [selectedSound, isInitialized, volume, playSynthesizedChime, playSynthesizedDigitalAlarm]);

  const [isPreviewingAmbient, setIsPreviewingAmbient] = useState(false);
  const [isPreviewingSoundtrack, setIsPreviewingSoundtrack] = useState(false);

  const testAmbient = useCallback(() => {
    if (!isInitialized) return;
    const amb = ambientInstances.current[selectedAmbient];
    if (!amb) return;

    if (amb.playing()) {
      amb.stop();
      setIsPreviewingAmbient(false);
    } else {
      // Stop all others first
      Object.values(ambientInstances.current).forEach(h => h.stop());
      Object.values(soundtrackInstances.current).forEach(h => h.stop());
      setIsPreviewingSoundtrack(false);
      
      amb.play();
      setIsPreviewingAmbient(true);
    }
  }, [selectedAmbient, isInitialized]);

  const testSoundtrack = useCallback(() => {
    if (!isInitialized) return;
    const st = soundtrackInstances.current[selectedSoundtrack];
    if (!st) return;

    if (st.playing()) {
      st.stop();
      setIsPreviewingSoundtrack(false);
    } else {
      // Stop all others first
      Object.values(ambientInstances.current).forEach(h => h.stop());
      Object.values(soundtrackInstances.current).forEach(h => h.stop());
      setIsPreviewingAmbient(false);

      st.play();
      setIsPreviewingSoundtrack(true);
    }
  }, [selectedSoundtrack, isInitialized]);
  const controlBackgroundAudio = useCallback((isPlaying: boolean) => {
    if (!isInitialized) return;

    if (isPlaying) {
      if (isAmbientEnabled) {
        const amb = ambientInstances.current[selectedAmbient];
        if (amb && !amb.playing()) amb.play();
      }
      if (isSoundtrackEnabled) {
        const st = soundtrackInstances.current[selectedSoundtrack];
        if (st && !st.playing()) st.play();
      }
    } else {
      Object.values(ambientInstances.current).forEach(h => h.pause());
      Object.values(soundtrackInstances.current).forEach(h => h.pause());
    }
  }, [isInitialized, isAmbientEnabled, selectedAmbient, isSoundtrackEnabled, selectedSoundtrack]);

  // If settings change while we expect it to be playing, we should update what's playing,
  // but it's simpler to just let the timer re-trigger controlBackgroundAudio(true) if it's active.


  return { 
    isAudioEnabled, 
    setAudioEnabled: setAudioEnabledCallback,
    sounds: finishSounds,
    selectedSound,
    setSelectedSound: setSelectedSoundCallback,
    volume,
    setVolume: setVolumeCallback,
    
    isAmbientEnabled,
    setAmbientEnabled: setAmbientEnabledCallback,
    ambientSounds,
    selectedAmbient,
    setSelectedAmbient: setSelectedAmbientCallback,
    ambientVolume,
    setAmbientVolume: setAmbientVolumeCallback,

    isSoundtrackEnabled,
    setSoundtrackEnabled: setSoundtrackEnabledCallback,
    soundtracks,
    selectedSoundtrack,
    setSelectedSoundtrack: setSelectedSoundtrackCallback,
    soundtrackVolume,
    setSoundtrackVolume: setSoundtrackVolumeCallback,

    playFinish, 
    playTick,
    testSound,
    testAmbient,
    testSoundtrack,
    isPreviewingAmbient,
    isPreviewingSoundtrack,
    controlBackgroundAudio
  };
}
