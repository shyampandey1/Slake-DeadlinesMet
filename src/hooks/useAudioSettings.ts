
"use client";

import { useState, useEffect, useCallback } from 'react';

const AUDIO_ENABLED_KEY = 'timerAudioEnabled';

export function useAudioSettings() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const storedValue = localStorage.getItem(AUDIO_ENABLED_KEY);
      if (storedValue !== null) {
        setIsAudioEnabled(JSON.parse(storedValue));
      }
    } catch (error) {
        // If localStorage is not available, proceed with default
        console.warn("localStorage not available for audio settings.");
    }
    
    // Use a free, reliable audio source.
    const audioInstance = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_c668156e54.mp3');
    setAudio(audioInstance);

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
    if (isAudioEnabled && audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [isAudioEnabled, audio]);

  const testSound = useCallback(() => {
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [audio]);

  return { isAudioEnabled, setAudioEnabled, playSound, testSound };
}
