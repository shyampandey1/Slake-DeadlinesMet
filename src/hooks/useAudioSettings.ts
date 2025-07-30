
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Howl } from 'howler';

const AUDIO_ENABLED_KEY = 'timerAudioEnabled';

// Define the sound instance outside the hook so it's only created once.
let sound: Howl | null = null;
if (typeof window !== 'undefined') {
  sound = new Howl({
    src: ['https://cdn.pixabay.com/audio/2021/08/04/audio_c668156e54.mp3'],
    html5: true, // Helps with compatibility and autoplay policies
  });
}

export function useAudioSettings() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  useEffect(() => {
    try {
      const storedValue = localStorage.getItem(AUDIO_ENABLED_KEY);
      if (storedValue !== null) {
        setIsAudioEnabled(JSON.parse(storedValue));
      }
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
  
  const playSound = useCallback(() => {
    if (isAudioEnabled && sound && !sound.playing()) {
        sound.play();
    }
  }, [isAudioEnabled]);

  const testSound = useCallback(() => {
    if (sound) {
        sound.play();
    }
  }, []);

  return { isAudioEnabled, setAudioEnabled, playSound, testSound };
}
