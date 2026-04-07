
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Howl } from 'howler';

const AUDIO_ENABLED_KEY = 'timerAudioEnabled';
const SELECTED_SOUND_KEY = 'timerSelectedSound';
const VOLUME_KEY = 'timerVolume';

const finishSounds = [
    { name: 'Vintage Bell', src: 'https://actions.google.com/sounds/v1/alarms/dinner_bell_triangle.ogg' },
    { name: 'Digital Alarm', src: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg' },
    { name: 'Bugle Chime', src: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg' },
    { name: 'Beep', src: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' }
];

const TICK_SOUND_URL = 'https://actions.google.com/sounds/v1/tools/ratchet_turn.ogg';

export function useAudioSettings() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState(finishSounds[0].name);
  const [volume, setVolumeState] = useState([0.6]); // slightly higher default
  const soundInstances = useRef<{ [key: string]: Howl }>({});
  const tickInstance = useRef<Howl | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let initialVolume = 0.6;
    let initialSound = finishSounds[0].name;

    try {
      const storedEnabled = localStorage.getItem(AUDIO_ENABLED_KEY);
      if (storedEnabled !== null) setIsAudioEnabled(JSON.parse(storedEnabled));
      
      const storedSound = localStorage.getItem(SELECTED_SOUND_KEY);
      if (storedSound && finishSounds.some(s => s.name === storedSound)) initialSound = storedSound;

      const storedVolume = localStorage.getItem(VOLUME_KEY);
      if (storedVolume !== null) initialVolume = parseFloat(storedVolume);
    } catch (error) {
      console.warn("Could not access localStorage for audio settings.");
    }
    
    setSelectedSound(initialSound);
    setVolumeState([initialVolume]);
    
    // Initialize Finish Sounds
    finishSounds.forEach(sound => {
      soundInstances.current[sound.name] = new Howl({
        src: [sound.src],
        html5: true,
        volume: initialVolume,
        preload: true,
      });
    });

    // Initialize Tick Sound
    tickInstance.current = new Howl({
        src: [TICK_SOUND_URL],
        html5: true, 
        volume: initialVolume * 0.4, // Make the tick quieter
        preload: true,
    });

    setIsInitialized(true);
    
    return () => {
      Object.values(soundInstances.current).forEach(howl => howl.unload());
      if (tickInstance.current) tickInstance.current.unload();
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
    if (tickInstance.current) tickInstance.current.volume(vol * 0.4);
    try {
      localStorage.setItem(VOLUME_KEY, JSON.stringify(vol));
    } catch (error) {
      console.warn("Could not access localStorage for audio settings.");
    }
  }, []);
  
  const playFinish = useCallback(() => {
    if (!isAudioEnabled || !isInitialized) return;
    const sound = soundInstances.current[selectedSound];
    if (sound) {
      sound.play();
    }
  }, [isAudioEnabled, selectedSound, isInitialized]);

  const playTick = useCallback(() => {
    if (!isAudioEnabled || !isInitialized || !tickInstance.current) return;
    // Don't overlap ticks heavily
    if (!tickInstance.current.playing()) {
        tickInstance.current.play();
    }
  }, [isAudioEnabled, isInitialized]);

  const testSound = useCallback(() => {
    if (!isInitialized) return;
    const sound = soundInstances.current[selectedSound];
    if (sound) {
      sound.stop();
      sound.play();
    }
  }, [selectedSound, isInitialized]);

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
