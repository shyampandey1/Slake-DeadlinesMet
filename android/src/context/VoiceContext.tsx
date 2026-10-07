import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { VoiceAgentState, ParsedIntent } from '../types/voice';
import { JevClient } from '../services/jevClient';
import { HapticService } from '../services/hapticService';
import { audioService } from '../services/audioService';
import { useTimer } from './TimerContext';
import { useTasks } from './TaskContext';

interface VoiceContextType {
  agentState: VoiceAgentState;
  transcript: string;
  feedbackText: string;
  waveformLevels: number[];
  isListening: boolean;
  startVoiceListening: () => void;
  stopVoiceListening: () => void;
  submitVoiceCommand: (text: string) => Promise<void>;
  cancelVoiceInteraction: () => void;
}

const VoiceContext = createContext<VoiceContextType>({
  agentState: 'IDLE',
  transcript: '',
  feedbackText: '',
  waveformLevels: [0.1, 0.1, 0.1, 0.1, 0.1],
  isListening: false,
  startVoiceListening: () => {},
  stopVoiceListening: () => {},
  submitVoiceCommand: async () => {},
  cancelVoiceInteraction: () => {},
});

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agentState, setAgentStateInternal] = useState<VoiceAgentState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [waveformLevels, setWaveformLevels] = useState<number[]>([0.15, 0.2, 0.15, 0.25, 0.15]);

  const { isRunning, startTimer, pauseTimer, resumeTimer, stopTimer, setFocusInterval } = useTimer();
  const { addTask, quickLogHabit, toggleTaskCompletion, tasks } = useTasks();

  const animIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const setAgentState = useCallback((state: VoiceAgentState) => {
    setAgentStateInternal(state);
    if (state === 'LISTENING') {
      HapticService.listening();
    } else if (state === 'THINKING') {
      HapticService.thinking();
    } else if (state === 'EXECUTING' || state === 'SPEAKING') {
      HapticService.executing();
    }
  }, []);

  // Animate dynamic waveform bars during LISTENING or SPEAKING
  useEffect(() => {
    if (agentState === 'LISTENING' || agentState === 'SPEAKING') {
      animIntervalRef.current = setInterval(() => {
        setWaveformLevels([
          0.2 + Math.random() * 0.7,
          0.3 + Math.random() * 0.7,
          0.2 + Math.random() * 0.8,
          0.3 + Math.random() * 0.7,
          0.2 + Math.random() * 0.6,
        ]);
      }, 100);
    } else {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
      setWaveformLevels([0.15, 0.2, 0.15, 0.2, 0.15]);
    }

    return () => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    };
  }, [agentState]);

  const submitVoiceCommand = useCallback(
    async (text: string) => {
      if (!text || !text.trim()) {
        setAgentState('IDLE');
        return;
      }

      setTranscript(text);
      setAgentState('THINKING');

      const parsed: ParsedIntent = await JevClient.parseVoiceIntent(text, '/timer', isRunning);

      setAgentState('EXECUTING');
      setFeedbackText(parsed.feedbackSpeech);

      // Execute intent on native core stores
      switch (parsed.action) {
        case 'TIMER_START':
          startTimer(parsed.parameters?.taskName || 'Focus Sprint', parsed.parameters?.durationMinutes || 25);
          break;
        case 'TIMER_PAUSE':
          pauseTimer();
          break;
        case 'TIMER_RESUME':
          resumeTimer();
          break;
        case 'TIMER_STOP':
          stopTimer();
          break;
        case 'TIMER_SET_INTERVAL':
          if (parsed.parameters?.intervalMinutes) {
            setFocusInterval(parsed.parameters.intervalMinutes);
          }
          break;
        case 'ROUTINE_COMPLETE_TASK': {
          const active = tasks.find((t) => !t.completed);
          if (active) {
            await toggleTaskCompletion(active.id);
          }
          stopTimer();
          break;
        }
        case 'TASK_LOG_QUICK':
          await quickLogHabit('Hydration', '1 Glass of Water (Logged via Agent DM)');
          break;
        case 'TASK_CREATE':
          await addTask(parsed.parameters?.taskName || text, 25, 'Productivity');
          break;
        default:
          break;
      }

      setAgentState('SPEAKING');
      audioService.speak(parsed.feedbackSpeech, () => {
        setTimeout(() => {
          setAgentState('IDLE');
          setFeedbackText('');
          setTranscript('');
        }, 1500);
      });
    },
    [isRunning, startTimer, pauseTimer, resumeTimer, stopTimer, setFocusInterval, addTask, quickLogHabit, toggleTaskCompletion, tasks, setAgentState]
  );

  const startVoiceListening = useCallback(() => {
    setTranscript('');
    setFeedbackText('Listening for command...');
    setAgentState('LISTENING');
  }, [setAgentState]);

  const stopVoiceListening = useCallback(() => {
    if (transcript) {
      submitVoiceCommand(transcript);
    } else {
      setAgentState('IDLE');
    }
  }, [transcript, submitVoiceCommand, setAgentState]);

  const cancelVoiceInteraction = useCallback(() => {
    audioService.stopSpeaking();
    setAgentState('IDLE');
    setTranscript('');
    setFeedbackText('');
  }, [setAgentState]);

  return (
    <VoiceContext.Provider
      value={{
        agentState,
        transcript,
        feedbackText,
        waveformLevels,
        isListening: agentState === 'LISTENING',
        startVoiceListening,
        stopVoiceListening,
        submitVoiceCommand,
        cancelVoiceInteraction,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => useContext(VoiceContext);
