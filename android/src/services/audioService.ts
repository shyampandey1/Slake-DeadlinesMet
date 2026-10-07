import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

class AudioService {
  private chimeSound: Audio.Sound | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    this.initAudioMode();
  }

  private async initAudioMode() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (e) {
      console.warn("Failed to set audio mode:", e);
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled() {
    return this.soundEnabled;
  }

  public async playIntervalChime() {
    if (!this.soundEnabled) return;
    try {
      // Use clean standard chime or audio asset
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
        { shouldPlay: true, volume: 0.8 }
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (err) {
      console.warn("Error playing interval chime:", err);
    }
  }

  public async playCompletionCelebration() {
    if (!this.soundEnabled) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' },
        { shouldPlay: true, volume: 1.0 }
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (err) {
      console.warn("Error playing completion chime:", err);
    }
  }

  public speak(text: string, onDone?: () => void) {
    if (!text || !text.trim()) {
      onDone?.();
      return;
    }
    Speech.stop();
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 1.0,
      onDone,
      onError: () => onDone?.(),
    });
  }

  public stopSpeaking() {
    Speech.stop();
  }
}

export const audioService = new AudioService();
