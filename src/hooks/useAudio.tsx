
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useRef,
} from "react";

// A silent, short audio file to unlock the browser's audio context.
const SILENT_AUDIO_SRC = "data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAAgAAANMYXZmNTguNzYuMTAwAGkAAAAAAAAAAAAD6f4/uULdcx42g4eMy4274c3/urcRGTBNOI39tBCsA6/VAix0Bw0D/2A4/vrBPAAAAAEluZm8AAAACAAAADgAAAEwAMEgAAHAAAEwAMAAAAAAAAAABDcmVhdGVkIGJ5IGFuIGF1ZGlvIGxpYnJhcnkuLi4uLi4uLi4uLi4uLi4u";

interface AudioContextType {
  isAudioEnabled: boolean;
  requestAudioPermission: () => void;
}

const AudioContext = createContext<AudioContextType>({
  isAudioEnabled: false,
  requestAudioPermission: () => {
    console.warn("AudioProvider not found");
  },
});

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // This function is called by a user gesture (e.g., clicking a button).
  const requestAudioPermission = useCallback(() => {
    if (isAudioEnabled) return;

    if (!audioRef.current) {
        // Create a single, persistent audio element to interact with.
        audioRef.current = new Audio(SILENT_AUDIO_SRC);
        audioRef.current.volume = 0.01; // Play at a very low, inaudible volume
    }

    // The .play() method returns a Promise.
    // If it resolves, audio is unlocked. If it's rejected, the browser blocked it.
    audioRef.current.play()
      .then(() => {
        // Audio is unlocked!
        setIsAudioEnabled(true);
        // We can pause it immediately; the context is now "unlocked."
        audioRef.current?.pause();
        console.log("Audio permission granted.");
      })
      .catch((error) => {
        console.error("Audio permission failed:", error);
        // Optionally, you could show an error message to the user here.
      });
  }, [isAudioEnabled]);

  return (
    <AudioContext.Provider value={{ isAudioEnabled, requestAudioPermission }}>
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => useContext(AudioContext);
