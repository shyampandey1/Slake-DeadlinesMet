
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Howl } from 'howler';

const AUDIO_ENABLED_KEY = 'timerAudioEnabled';
const SELECTED_SOUND_KEY = 'timerSelectedSound';
const VOLUME_KEY = 'timerVolume';

const sounds = [
    { name: 'Beep', src: 'https://cdn.pixabay.com/audio/2021/08/04/audio_c668156e54.mp3' },
    { name: 'Alert', src: 'https://cdn.pixabay.com/audio/2022/11/17/audio_8b3834bdef.mp3' },
    { name: 'Chime', src: 'https://cdn.pixabay.com/audio/2022/01/18/audio_22b27a36c1.mp3' },
    { name: 'Bell', src: 'https://cdn.pixabay.com/audio/2022/04/06/audio_108c3d6438.mp3' },
    { name: 'Calm', src: 'https://cdn.pixabay.com/audio/2022/05/29/audio_a7568558a2.mp3' },
];

export function useAudioSettings() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState(sounds[0].name);
  const [volume, setVolumeState] = useState(0.5);
  const soundInstances = useRef<{ [key: string]: Howl }>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Load settings and initialize sounds on mount (client-side only)
  useEffect(() => {
    let initialVolume = 0.5;
    try {
      const storedEnabled = localStorage.getItem(AUDIO_ENABLED_KEY);
      if (storedEnabled !== null) setIsAudioEnabled(JSON.parse(storedEnabled));
      
      const storedSound = localStorage.getItem(SELECTED_SOUND_KEY);
      if (storedSound && sounds.some(s => s.name === storedSound)) setSelectedSound(storedSound);

      const storedVolume = localStorage.getItem(VOLUME_KEY);
      if (storedVolume !== null) initialVolume = parseFloat(storedVolume);

    } catch (error) {
      console.warn("localStorage not available, using default audio settings.");
    }
    
    setVolumeState(initialVolume);

    // Initialize all sound instances
    sounds.forEach(s => {
      soundInstances.current[s.name] = new Howl({
        src: [s.src],
        html5: true,
        volume: initialVolume,
      });
    });
    
    setIsInitialized(true);
    
    // Cleanup on unmount
    return () => {
      Object.values(soundInstances.current).forEach(howl => howl.unload());
      soundInstances.current = {};
    };
  }, []);

  const setAudioEnabledCallback = useCallback((enabled: boolean) => {
    setIsAudioEnabled(enabled);
    try {
      localStorage.setItem(AUDIO_ENABLED_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.warn("localStorage not available for audio settings.");
    }
  }, []);

  const setSelectedSoundCallback = useCallback((soundName: string) => {
    setSelectedSound(soundName);
    try {
      localStorage.setItem(SELECTED_SOUND_KEY, soundName);
    } catch (error) {
      console.warn("localStorage not available for audio settings.");
    }
  }, []);

  const setVolumeCallback = useCallback((newVolume: number[]) => {
    const vol = newVolume[0];
    setVolumeState(vol);
    
    // Update volume for all existing Howl instances
    Object.values(soundInstances.current).forEach(howl => {
      howl.volume(vol);
    });

    try {
      localStorage.setItem(VOLUME_KEY, JSON.stringify(vol));
    } catch (error) {
      console.warn("localStorage not available for audio settings.");
    }
  }, []);
  
  const playSound = useCallback(() => {
    if (!isAudioEnabled || !isInitialized) return;
    const sound = soundInstances.current[selectedSound];
    if (sound) {
      sound.play();
    }
  }, [isAudioEnabled, selectedSound, isInitialized]);

  const testSound = useCallback(() => {
    if (!isInitialized) return;
    const sound = soundInstances.current[selectedSound];
    if (sound) {
      if (sound.playing()) {
        sound.stop();
      }
      sound.volume(volume); // Ensure volume is set before playing
      sound.play();
    }
  }, [selectedSound, isInitialized, volume]);

  return { 
    isAudioEnabled, 
    setAudioEnabled: setAudioEnabledCallback,
    sounds,
    selectedSound,
    setSelectedSound: setSelectedSoundCallback,
    volume,
    setVolume: setVolumeCallback,
    playSound, 
    testSound 
  };
}
