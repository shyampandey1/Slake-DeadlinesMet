import { z } from 'zod';

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
  | '/timer'
  | '/rewards';

export type VoiceIntentAction =
  | 'TASK_CREATE'
  | 'TASK_LOG_QUICK'
  | 'TASK_QUICK_LOG'
  | 'TIMER_START'
  | 'TIMER_PAUSE'
  | 'TIMER_RESUME'
  | 'TIMER_STOP'
  | 'TIMER_EXTEND'
  | 'TIMER_SET_INTERVAL'
  | 'NAVIGATE'
  | 'COOP_ACTION'
  | 'REWARDS_ACTION'
  | 'REDEEM_TRIGGER'
  | 'SENSOR_ENVIRONMENT_TOGGLE'
  | 'MODAL_DISMISS';

export type VoiceAgentState = 'IDLE' | 'LISTENING' | 'THINKING' | 'EXECUTING' | 'SPEAKING';

export const VoiceIntentPayloadSchema = z.object({
  action: z.enum([
    'TASK_CREATE',
    'TASK_LOG_QUICK',
    'TASK_QUICK_LOG',
    'TIMER_START',
    'TIMER_PAUSE',
    'TIMER_RESUME',
    'TIMER_STOP',
    'TIMER_EXTEND',
    'TIMER_SET_INTERVAL',
    'NAVIGATE',
    'COOP_ACTION',
    'REWARDS_ACTION',
    'REDEEM_TRIGGER',
    'SENSOR_ENVIRONMENT_TOGGLE',
    'MODAL_DISMISS',
  ]),
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
      '/timer',
      '/rewards',
    ])
    .optional(),
  extendMinutes: z.number().optional(),
  intervalMinutes: z.number().optional(),
  earnedCoins: z.number().optional(),
  coopAction: z.enum(['invite', 'start_sprint', 'pause_group']).optional(),
  rewardsAction: z.enum(['redeem', 'withdraw', 'pin_certificate', 'check_balance']).optional(),
  sensorType: z.enum(['eye_tracking', 'water_sounds', 'ambient_noise']).optional(),
  sensorState: z.enum(['on', 'off', 'toggle']).optional(),
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
