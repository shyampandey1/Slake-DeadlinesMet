import * as Tone from 'tone';

let synth: Tone.Synth | null = null;

// Function to initialize the synth on the first user interaction
function initializeSynth() {
  if (!synth) {
    synth = new Tone.Synth().toDestination();
  }
}

// Function to play the click sound
export function playClick() {
  // Ensure Tone.js context is started by a user gesture
  Tone.start();
  
  if (!synth) {
    initializeSynth();
  }
  
  // Play a C4 note for a very short duration
  synth?.triggerAttackRelease("C5", "16n");
}
