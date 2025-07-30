
"use client";

import { useState, useEffect, useCallback } from 'react';
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

let soundInstances: { [key: string]: Howl } = {};

const initializeSounds = (volume: number) => {
    if (typeof window !== 'undefined') { // Ensure this runs only on the client
        sounds.forEach(s => {
            // Unload existing sound if it exists, to prevent memory leaks
            if (soundInstances[s.name]) {
                soundInstances[s.name].unload();
            }
            soundInstances[s.name] = new Howl({
                src: [s.src],
                html5: true, // Improves compatibility
                volume: volume,
            });
        });
    }
}

export function useAudioSettings() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState(sounds[0].name);
  const [volume, setVolumeState] = useState(0.5);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load settings from localStorage only on the client side
    try {
      const storedEnabled = localStorage.getItem(AUDIO_ENABLED_KEY);
      if (storedEnabled !== null) setIsAudioEnabled(JSON.parse(storedEnabled));
      
      const storedSound = localStorage.getItem(SELECTED_SOUND_KEY);
      if (storedSound && sounds.some(s => s.name === storedSound)) setSelectedSound(storedSound);

      const storedVolume = localStorage.getItem(VOLUME_KEY);
      const initialVolume = storedVolume !== null ? parseFloat(storedVolume) : 0.5;
      setVolumeState(initialVolume);
      
      // Initialize sounds with the loaded (or default) volume
      initializeSounds(initialVolume);

    } catch (error) {
        console.warn("localStorage not available, using default audio settings.");
        initializeSounds(0.5); // Fallback initialization
    }
    setIsInitialized(true);
  }, []);

  const setAudioEnabled = useCallback((enabled: boolean) => {
    setIsAudioEnabled(enabled);
     try {
        localStorage.setItem(AUDIO_ENABLED_KEY, JSON.stringify(enabled));
    } catch (error) {
        console.warn("localStorage not available for audio settings.");
    }
  }, []);

  const handleSetSound = useCallback((soundName: string) => {
      setSelectedSound(soundName);
      try {
        localStorage.setItem(SELECTED_SOUND_KEY, soundName);
      } catch (error) {
        console.warn("localStorage not available for audio settings.");
      }
  }, []);

  const setVolume = useCallback((newVolume: number[]) => {
      const vol = newVolume[0];
      setVolumeState(vol);
      
      // Update volume for all existing Howl instances
      Object.values(soundInstances).forEach(howl => {
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
    const sound = soundInstances[selectedSound];
    if (sound) {
        sound.play();
    }
  }, [isAudioEnabled, selectedSound, isInitialized]);

  const testSound = useCallback(() => {
    if (!isInitialized) return;
    const sound = soundInstances[selectedSound];
    if (sound) {
        if (sound.playing()) {
            sound.stop();
        }
        // The volume is already set on the instance, so just play.
        sound.play();
    }
  }, [selectedSound, isInitialized]);

  return { 
      isAudioEnabled, 
      setAudioEnabled,
      sounds,
      selectedSound,
      setSelectedSound: handleSetSound,
      volume,
      setVolume,
      playSound, 
      testSound 
    };
}
