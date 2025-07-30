
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

const initializeSounds = () => {
    if (typeof window !== 'undefined') {
        sounds.forEach(s => {
            if (!soundInstances[s.name]) {
                soundInstances[s.name] = new Howl({
                    src: [s.src],
                    html5: true,
                });
            }
        });
    }
}

// Initialize sounds on script load
initializeSounds();


export function useAudioSettings() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState(sounds[0].name);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    try {
      const storedEnabled = localStorage.getItem(AUDIO_ENABLED_KEY);
      if (storedEnabled !== null) setIsAudioEnabled(JSON.parse(storedEnabled));
      
      const storedSound = localStorage.getItem(SELECTED_SOUND_KEY);
      if (storedSound && sounds.some(s => s.name === storedSound)) setSelectedSound(storedSound);

      const storedVolume = localStorage.getItem(VOLUME_KEY);
      if (storedVolume !== null) setVolume(JSON.parse(storedVolume));

    } catch (error) {
        console.warn("localStorage not available for audio settings.");
    }
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

  const handleSetVolume = useCallback((newVolume: number[]) => {
      const vol = newVolume[0];
      setVolume(vol);
      try {
        localStorage.setItem(VOLUME_KEY, JSON.stringify(vol));
        Object.values(soundInstances).forEach(howl => howl.volume(vol));
      } catch (error) {
        console.warn("localStorage not available for audio settings.");
      }
  }, []);
  
  const playSound = useCallback(() => {
    const sound = soundInstances[selectedSound];
    if (isAudioEnabled && sound && !sound.playing()) {
        sound.volume(volume);
        sound.play();
    }
  }, [isAudioEnabled, selectedSound, volume]);

  const testSound = useCallback(() => {
    const sound = soundInstances[selectedSound];
    if (sound) {
        if (sound.playing()) {
            sound.stop();
        }
        sound.volume(volume);
        sound.play();
    }
  }, [selectedSound, volume]);

  return { 
      isAudioEnabled, 
      setAudioEnabled,
      sounds,
      selectedSound,
      setSelectedSound: handleSetSound,
      volume,
      setVolume: handleSetVolume,
      playSound, 
      testSound 
    };
}
