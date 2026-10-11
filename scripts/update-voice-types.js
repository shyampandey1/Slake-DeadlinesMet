const fs = require('fs');

const datasetCode = fs.readFileSync('scripts/formatted-dataset.ts', 'utf8');

const header = `import { z } from 'zod';

export type VoiceCategory =
  | 'Productivity'
  | 'Hydration'
  | 'Fitness'
  | 'Meditation'
  | 'Hygiene'
  | 'Creativity';

export type VoiceRoute =
  | '/'
  | '/routine'
  | '/reformers'
  | '/settings'
  | '/logbook'
  | '/history'
  | '/analytics'
  | '/timer'
  | '/rewards'
  | '/presets'
  | '/privacy'
  | 'WINDOW_BACK';

export type VoiceIntentAction =
  | 'TASK_CREATE'
  | 'TASK_LOG_QUICK'
  | 'TASK_QUICK_LOG'
  | 'TIMER_START'
  | 'TIMER_PAUSE'
  | 'TIMER_RESUME'
  | 'TIMER_STOP'
  | 'TIMER_RESTART'
  | 'TIMER_EXTEND'
  | 'TIMER_REDUCE'
  | 'TIMER_SET_INTERVAL'
  | 'TIMER_SKIP'
  | 'NAVIGATE'
  | 'ROUTINE_CONTROL'
  | 'COOP_ACTION'
  | 'SENSOR_TOGGLE'
  | 'SENSOR_ENVIRONMENT_TOGGLE'
  | 'REWARDS_ACTION'
  | 'REDEEM_TRIGGER'
  | 'ANALYTICS_ACTION'
  | 'SYSTEM_CONTROL'
  | 'MODAL_DISMISS'
  | 'ROUTINE_COMPLETE_TASK';

export type VoiceAgentState = 'IDLE' | 'LISTENING' | 'THINKING' | 'EXECUTING' | 'SPEAKING';

export interface JevVoiceRecord {
  utterances: string[];
  intent: string;
  category?: 'Productivity' | 'Hydration' | 'Fitness' | 'Meditation' | 'Hygiene' | 'Creativity';
  durationMinutes?: number;
  targetRoute?: string;
  actionType?: string;
  coinsAwarded?: number;
  speechFeedback: string;
}

`;

const footer = `
export const VoiceIntentPayloadSchema = z.object({
  action: z.enum([
    'TASK_CREATE',
    'TASK_LOG_QUICK',
    'TASK_QUICK_LOG',
    'TIMER_START',
    'TIMER_PAUSE',
    'TIMER_RESUME',
    'TIMER_STOP',
    'TIMER_RESTART',
    'TIMER_EXTEND',
    'TIMER_REDUCE',
    'TIMER_SET_INTERVAL',
    'TIMER_SKIP',
    'NAVIGATE',
    'ROUTINE_CONTROL',
    'COOP_ACTION',
    'SENSOR_TOGGLE',
    'SENSOR_ENVIRONMENT_TOGGLE',
    'REWARDS_ACTION',
    'REDEEM_TRIGGER',
    'ANALYTICS_ACTION',
    'SYSTEM_CONTROL',
    'MODAL_DISMISS',
    'ROUTINE_COMPLETE_TASK',
  ]),
  actionType: z.string().optional(),
  taskName: z.string().optional(),
  durationMinutes: z.number().optional(),
  durationSeconds: z.number().optional(),
  category: z
    .enum(['Productivity', 'Hydration', 'Fitness', 'Meditation', 'Hygiene', 'Creativity'])
    .optional(),
  targetRoute: z
    .enum([
      '/',
      '/routine',
      '/reformers',
      '/settings',
      '/logbook',
      '/history',
      '/analytics',
      '/timer',
      '/rewards',
      '/presets',
      '/privacy',
      'WINDOW_BACK',
    ])
    .optional(),
  extendMinutes: z.number().optional(),
  intervalMinutes: z.number().optional(),
  earnedCoins: z.number().optional(),
  coinsAwarded: z.number().optional(),
  coopAction: z.enum(['invite', 'start_sprint', 'pause_group']).optional(),
  rewardsAction: z.enum(['redeem', 'withdraw', 'pin_certificate', 'check_balance']).optional(),
  sensorType: z.enum(['eye_tracking', 'water_sounds', 'ambient_noise', 'breathing_chimes', 'haptics']).optional(),
  sensorState: z.enum(['on', 'off', 'toggle', 'calibrate']).optional(),
  speechFeedback: z.string(),
  confidence: z.number().min(0).max(1).optional(),
});

export type VoiceIntentPayload = z.infer<typeof VoiceIntentPayloadSchema>;

export interface VoiceCommandRequest {
  transcript: string;
  currentRoute?: string;
  activeTimerState?: {
    isRunning: boolean;
    isPaused: boolean;
    taskName?: string;
    remainingSeconds?: number;
  };
}
`;

fs.writeFileSync('src/types/voice.ts', header + datasetCode + footer);
console.log('src/types/voice.ts updated successfully!');
