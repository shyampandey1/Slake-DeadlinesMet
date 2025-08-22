
"use client";

import * as Tone from 'tone';

let synth: Tone.Synth | null = null;

// Function to initialize the synth, to be called on first user interaction
function initializeSynth() {
  if (!synth) {
    synth = new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0.1,
        release: 0.1
      }
    }).toDestination();
  }
}

// Function to play the click sound
export function playClick() {
  // Tone.js requires a user interaction to start the audio context.
  // We'll start it safely here if it hasn't started.
  if (Tone.context.state !== 'running') {
    Tone.start();
  }

  // Initialize synth on first click
  if (!synth) {
    initializeSynth();
  }

  // Play a C5 note for a very short duration
  if (synth) {
    try {
        synth.triggerAttackRelease("C5", "16n");
    } catch (e) {
        console.warn("Could not play sound", e)
    }
  }
}
