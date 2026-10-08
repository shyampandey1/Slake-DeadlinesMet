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
  | '/analytics'
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

export const JEV_VOICE_DATASET: JevVoiceRecord[] = [
  // ==========================================
  // 1. NAVIGATION & APP ROUTING
  // ==========================================
  {
    utterances: ["go home", "take me home", "open home", "dashboard", "back to dashboard", "main screen"],
    intent: "NAVIGATE",
    targetRoute: "/",
    speechFeedback: "Opening dashboard."
  },
  {
    utterances: ["open routine", "show my routine", "today's schedule", "check routine", "view routine"],
    intent: "NAVIGATE",
    targetRoute: "/routine",
    speechFeedback: "Here is your routine."
  },
  {
    utterances: ["go to reformers", "open reformer league", "show reformers", "the league", "community page"],
    intent: "NAVIGATE",
    targetRoute: "/reformers",
    speechFeedback: "Opening Reformers League."
  },
  {
    utterances: ["open rewards", "show achievement center", "view my coins", "check wallet", "open achievements"],
    intent: "NAVIGATE",
    targetRoute: "/rewards",
    speechFeedback: "Opening Achievement Center."
  },
  {
    utterances: ["open log book", "show task log", "view insights", "task analytics", "open history"],
    intent: "NAVIGATE",
    targetRoute: "/analytics",
    speechFeedback: "Opening Task Log Book."
  },
  {
    utterances: ["open settings", "preferences", "system settings", "app config"],
    intent: "NAVIGATE",
    targetRoute: "/settings",
    speechFeedback: "Opening settings."
  },

  // ==========================================
  // 2. ACTIVE TIMER CONTROLS
  // ==========================================
  {
    utterances: ["start timer", "begin task", "start the clock", "let's go", "run timer", "start now"],
    intent: "TIMER_START",
    actionType: "START",
    speechFeedback: "Timer started."
  },
  {
    utterances: ["pause timer", "pause the clock", "hold on", "wait a sec", "take a pause", "freeze timer"],
    intent: "TIMER_PAUSE",
    actionType: "PAUSE",
    speechFeedback: "Timer paused."
  },
  {
    utterances: ["resume timer", "unpause", "keep going", "continue session", "back to work"],
    intent: "TIMER_RESUME",
    actionType: "RESUME",
    speechFeedback: "Resuming timer."
  },
  {
    utterances: ["stop timer", "end task", "finish task", "mark complete", "wrap it up", "task done"],
    intent: "TIMER_STOP",
    actionType: "COMPLETE",
    speechFeedback: "Task completed. Great work!"
  },
  {
    utterances: ["cancel timer", "abort task", "reset timer", "discard clock", "stop without saving"],
    intent: "TIMER_STOP",
    actionType: "ABORT",
    speechFeedback: "Timer reset."
  },
  {
    utterances: ["add 5 minutes", "give me 5 more minutes", "extend by 5", "5 more minutes"],
    intent: "TIMER_EXTEND",
    durationMinutes: 5,
    actionType: "EXTEND",
    speechFeedback: "Added 5 minutes."
  },
  {
    utterances: ["add 10 minutes", "give me 10 more minutes", "extend timer by 10", "10 more minutes"],
    intent: "TIMER_EXTEND",
    durationMinutes: 10,
    actionType: "EXTEND",
    speechFeedback: "Added 10 minutes."
  },
  {
    utterances: ["remind me every 5 minutes", "set interval 5 minutes", "alert every 5 mins", "5 minute chimes"],
    intent: "TIMER_SET_INTERVAL",
    durationMinutes: 5,
    actionType: "SET_INTERVAL",
    speechFeedback: "Interval set to 5 minutes."
  },
  {
    utterances: ["remind me every 10 minutes", "set interval 10 minutes", "alert every 10 mins", "10 minute interval"],
    intent: "TIMER_SET_INTERVAL",
    durationMinutes: 10,
    actionType: "SET_INTERVAL",
    speechFeedback: "Interval set to 10 minutes."
  },

  // ==========================================
  // 3. MOVERS PROTOCOL & TASK CREATION
  // ==========================================
  {
    utterances: ["start meditation", "meditate for 10 minutes", "begin mindfulness", "10 minute meditation"],
    intent: "TASK_CREATE",
    category: "Meditation",
    durationMinutes: 10,
    coinsAwarded: 30,
    speechFeedback: "Starting 10-minute meditation."
  },
  {
    utterances: ["start deep breathing", "oxygenation session", "box breathing 4 minutes", "breathe in and out"],
    intent: "TASK_CREATE",
    category: "Meditation",
    durationMinutes: 4,
    coinsAwarded: 30,
    speechFeedback: "Starting 4-minute oxygenation."
  },
  {
    utterances: ["start visualization", "10 minutes vision review", "mental rehearsal", "visualize goals"],
    intent: "TASK_CREATE",
    category: "Productivity",
    durationMinutes: 10,
    coinsAwarded: 30,
    speechFeedback: "Starting visualization block."
  },
  {
    utterances: ["start workout", "exercise for 20 minutes", "morning physical warmup", "start gym session"],
    intent: "TASK_CREATE",
    category: "Fitness",
    durationMinutes: 20,
    coinsAwarded: 40,
    speechFeedback: "Starting 20-minute workout."
  },
  {
    utterances: ["start reading", "read positive 15 minutes", "wisdom reading", "book time"],
    intent: "TASK_CREATE",
    category: "Creativity",
    durationMinutes: 15,
    coinsAwarded: 30,
    speechFeedback: "Starting reading session."
  },
  {
    utterances: ["start scribing", "journal for 10 minutes", "write diary", "evening intention journaling"],
    intent: "TASK_CREATE",
    category: "Creativity",
    durationMinutes: 10,
    coinsAwarded: 30,
    speechFeedback: "Starting scribing session."
  },
  {
    utterances: ["start deep work", "code for 45 minutes", "focus block 30 minutes", "engineering sprint"],
    intent: "TASK_CREATE",
    category: "Productivity",
    durationMinutes: 45,
    coinsAwarded: 50,
    speechFeedback: "Starting deep work sprint."
  },
  {
    utterances: ["drink water timer", "drink a glass of water", "hydrate 2 minutes", "water break"],
    intent: "TASK_CREATE",
    category: "Hydration",
    durationMinutes: 2,
    coinsAwarded: 15,
    speechFeedback: "Starting hydration break."
  },
  {
    utterances: ["clean workspace", "make my bed", "set work table", "desk tidy 5 minutes"],
    intent: "TASK_CREATE",
    category: "Hygiene",
    durationMinutes: 5,
    coinsAwarded: 15,
    speechFeedback: "Starting workspace hygiene."
  },

  // ==========================================
  // 4. INSTANT ONE-SHOT LOGGING
  // ==========================================
  {
    utterances: ["log water", "drank a glass of water", "finished my water", "water logged"],
    intent: "TASK_LOG_QUICK",
    category: "Hydration",
    coinsAwarded: 15,
    speechFeedback: "Logged. Plus 15 coins!"
  },
  {
    utterances: ["bed made", "made my bed", "table cleaned", "desk organized"],
    intent: "TASK_LOG_QUICK",
    category: "Hygiene",
    coinsAwarded: 15,
    speechFeedback: "Logged. Plus 15 coins!"
  },
  {
    utterances: ["quick stretch done", "finished pushups", "completed 10 squats"],
    intent: "TASK_LOG_QUICK",
    category: "Fitness",
    coinsAwarded: 40,
    speechFeedback: "Fitness logged. Plus 40 coins!"
  },

  // ==========================================
  // 5. COACH-LED CO-OP & DUET SYNC
  // ==========================================
  {
    utterances: ["invite co reformer", "start partner session", "invite duet partner", "co op with partner"],
    intent: "COOP_ACTION",
    actionType: "INVITE_PARTNER",
    speechFeedback: "Invitation sent."
  },
  {
    utterances: ["coach start group sprint", "start class timer", "run co op timer for all", "start group test"],
    intent: "COOP_ACTION",
    actionType: "BROADCAST_START",
    speechFeedback: "Group sprint started."
  },
  {
    utterances: ["coach pause group timer", "pause class session", "pause group clock"],
    intent: "COOP_ACTION",
    actionType: "BROADCAST_PAUSE",
    speechFeedback: "Group timer paused."
  },

  // ==========================================
  // 6. SLAKE COINS, PAYOUTS & CERTIFICATES
  // ==========================================
  {
    utterances: ["redeem payout", "withdraw cash", "claim direct payout", "cash out my coins", "claim 10 rupees"],
    intent: "REWARDS_ACTION",
    actionType: "REDEEM_UPI",
    speechFeedback: "Opening payout window."
  },
  {
    utterances: ["pin certificate", "feature my certificate", "pin to profile", "pin achievement"],
    intent: "REWARDS_ACTION",
    actionType: "PIN_CERTIFICATE",
    speechFeedback: "Certificate pinned to profile."
  },
  {
    utterances: ["check coin balance", "how many coins do I have", "my wallet balance", "check balance"],
    intent: "REWARDS_ACTION",
    actionType: "CHECK_BALANCE",
    speechFeedback: "Checking your coin balance."
  },

  // ==========================================
  // 7. SENSORS & MULTIMODAL TOGGLES
  // ==========================================
  {
    utterances: ["turn on eye tracking", "enable gaze control", "hands free mode on", "start eye sensor"],
    intent: "SENSOR_ENVIRONMENT_TOGGLE",
    actionType: "TOGGLE_EYE_TRACKING_ON",
    speechFeedback: "Gaze control active."
  },
  {
    utterances: ["turn off eye tracking", "disable gaze control", "exit hands free"],
    intent: "SENSOR_ENVIRONMENT_TOGGLE",
    actionType: "TOGGLE_EYE_TRACKING_OFF",
    speechFeedback: "Gaze control disabled."
  },
  {
    utterances: ["turn on water sounds", "play pouring audio", "enable ambient sound"],
    intent: "SENSOR_ENVIRONMENT_TOGGLE",
    actionType: "AUDIO_WATER_ON",
    speechFeedback: "Water sounds enabled."
  },
  {
    utterances: ["mute sounds", "turn off audio", "silent mode"],
    intent: "SENSOR_ENVIRONMENT_TOGGLE",
    actionType: "AUDIO_MUTE",
    speechFeedback: "Audio muted."
  },
  {
    utterances: ["enable breathing chimes", "turn on breathing sounds", "play chimes"],
    intent: "SENSOR_ENVIRONMENT_TOGGLE",
    actionType: "AUDIO_BREATHE_ON",
    speechFeedback: "Breathing chimes active."
  },

  // ==========================================
  // 8. DISMISSAL & SYSTEM CONTROLS
  // ==========================================
  {
    utterances: ["close this", "dismiss popup", "dismiss modal", "cancel", "never mind", "go back"],
    intent: "MODAL_DISMISS",
    actionType: "DISMISS",
    speechFeedback: "Dismissed."
  }
];

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
    ])
    .optional(),
  extendMinutes: z.number().optional(),
  intervalMinutes: z.number().optional(),
  earnedCoins: z.number().optional(),
  coinsAwarded: z.number().optional(),
  coopAction: z.enum(['invite', 'start_sprint', 'pause_group']).optional(),
  rewardsAction: z.enum(['redeem', 'withdraw', 'pin_certificate', 'check_balance']).optional(),
  sensorType: z.enum(['eye_tracking', 'water_sounds', 'ambient_noise', 'breathing_chimes']).optional(),
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
