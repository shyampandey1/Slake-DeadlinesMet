
"use client";

import { useState, useEffect, useCallback } from 'react';

const AUDIO_ENABLED_KEY = 'timerAudioEnabled';

export function useAudioSettings() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Lazily create the Audio object for the timer playback
    if (typeof window !== 'undefined' && !audio) {
        setAudio(new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_c668156e54.mp3'));
    }

    try {
      const storedValue = localStorage.getItem(AUDIO_ENABLED_KEY);
      if (storedValue !== null) {
        setIsAudioEnabled(JSON.parse(storedValue));
      }
    } catch (error) {
        console.warn("localStorage not available for audio settings.");
    }
  }, [audio]);

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
    // Create a new Audio object on demand to ensure it's triggered by user interaction.
    const testAudio = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_c668156e54.mp3');
    testAudio.play().catch(e => console.error("Audio playback failed:", e));
  }, []);

  return { isAudioEnabled, setAudioEnabled, playSound, testSound, audio };
}
