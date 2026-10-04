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
  | 'TASK_QUICK_LOG'
  | 'TIMER_START'
  | 'TIMER_PAUSE'
  | 'TIMER_RESUME'
  | 'TIMER_STOP'
  | 'TIMER_EXTEND'
  | 'TIMER_SET_INTERVAL'
  | 'NAVIGATE'
  | 'REDEEM_TRIGGER'
  | 'MODAL_DISMISS';

export const VoiceIntentPayloadSchema = z.object({
  action: z.enum([
    'TASK_CREATE',
    'TASK_QUICK_LOG',
    'TIMER_START',
    'TIMER_PAUSE',
    'TIMER_RESUME',
    'TIMER_STOP',
    'TIMER_EXTEND',
    'TIMER_SET_INTERVAL',
    'NAVIGATE',
    'REDEEM_TRIGGER',
    'MODAL_DISMISS',
  ]),
  taskName: z.string().optional(),
  durationMinutes: z.number().optional(),
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
