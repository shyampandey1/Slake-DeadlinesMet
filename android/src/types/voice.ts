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

export type ParsedIntent = {
  action: VoiceIntentAction;
  confidence: number;
  feedbackSpeech: string;
  actionType?: string;
  parameters?: {
    taskName?: string;
    durationMinutes?: number;
    intervalMinutes?: number;
    route?: string;
    targetUserId?: string;
    coinsAmount?: number;
    category?: string;
  };
};
