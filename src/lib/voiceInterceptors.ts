"use client";

export interface VoiceInterceptorContext {
  activeTimer?: {
    taskName?: string;
    remainingSeconds?: number;
    initialDuration?: number;
    isPaused?: boolean;
    expectedEndTime?: number;
    timeLeftWhenPaused?: number;
  } | null;
  tasks?: Array<{
    name: string;
    duration?: number;
    completed?: boolean;
  }>;
  streak?: number;
  coins?: number;
}

export interface VoiceInterceptorResult {
  intercepted: boolean;
  speechResponse?: string;
  interceptorType?:
    | 'WEATHER'
    | 'TIME'
    | 'IDENTITY'
    | 'TIMER_CHECK'
    | 'NEXT_TASK'
    | 'DAILY_PROGRESS'
    | 'COIN_BALANCE';
}

const WEATHER_REGEX = /\b(?:weather|temperature|how\s+hot|how\s+cold|outside\s+temp|degrees)\b/i;
const TIME_REGEX = /\b(?:what\s+time\s+is\s+it|current\s+time|tell\s+me\s+the\s+time|what\s+is\s+the\s+time)\b/i;
const IDENTITY_REGEX = /\b(?:who\s+are\s+you|your\s+name|what\s+can\s+you\s+do|what\s+are\s+you)\b/i;
const TIMER_CHECK_REGEX = /\b(?:how\s+much\s+time\s+is\s+left|time\s+remaining|check\s+clock|minutes\s+left)\b/i;
const NEXT_TASK_REGEX = /\b(?:what\s+is\s+my\s+next\s+task|what's\s+next|whats\s+next|upcoming\s+task|next\s+on\s+schedule)\b/i;
const PROGRESS_STREAK_REGEX = /\b(?:how\s+many\s+tasks\s+completed|my\s+progress\s+today|what\s+is\s+my\s+streak|current\s+streak)\b/i;
const COIN_BALANCE_REGEX = /\b(?:how\s+many\s+coins|my\s+coin\s+balance|slake\s+coins\s+today)\b/i;

/**
 * Zero-mutation conversational interceptors for common read-only queries.
 * Evaluates contextual live store and DOM data at Tier 1 before embedding computation.
 */
export function evaluateVoiceInterceptors(
  transcript: string,
  context?: VoiceInterceptorContext
): VoiceInterceptorResult {
  const clean = transcript.trim();
  if (!clean) {
    return { intercepted: false };
  }

  // 1. Remaining Timer Check (/how much time is left|time remaining|check clock|minutes left/i)
  if (TIMER_CHECK_REGEX.test(clean)) {
    const timer = context?.activeTimer;
    if (!timer || !timer.taskName) {
      return {
        intercepted: true,
        interceptorType: 'TIMER_CHECK',
        speechResponse: 'No timer is currently running.',
      };
    }

    let remainingMinutes = 0;
    if (timer.isPaused && typeof timer.timeLeftWhenPaused === 'number') {
      remainingMinutes = Math.max(0, Math.ceil(timer.timeLeftWhenPaused / 60));
    } else if (timer.expectedEndTime) {
      const diffMs = timer.expectedEndTime - Date.now();
      remainingMinutes = Math.max(0, Math.ceil(diffMs / 60000));
    } else if (typeof timer.remainingSeconds === 'number') {
      remainingMinutes = Math.max(0, Math.ceil(timer.remainingSeconds / 60));
    } else if (timer.initialDuration) {
      remainingMinutes = timer.initialDuration;
    }

    const taskTitle = timer.taskName;
    const timePhrase = remainingMinutes > 1
      ? `${remainingMinutes} minutes`
      : remainingMinutes === 1
      ? '1 minute'
      : 'less than a minute';

    return {
      intercepted: true,
      interceptorType: 'TIMER_CHECK',
      speechResponse: `You have ${timePhrase} left on ${taskTitle}.`,
    };
  }

  // 2. Next Scheduled Task Query (/what is my next task|what's next|upcoming task|next on schedule/i)
  if (NEXT_TASK_REGEX.test(clean)) {
    const tasks = context?.tasks || [];
    const nextTask = tasks.find((t) => !t.completed);

    if (!nextTask) {
      return {
        intercepted: true,
        interceptorType: 'NEXT_TASK',
        speechResponse: 'All scheduled tasks are complete.',
      };
    }

    const duration = nextTask.duration || 15;
    return {
      intercepted: true,
      interceptorType: 'NEXT_TASK',
      speechResponse: `Up next is ${nextTask.name} for ${duration} minutes.`,
    };
  }

  // 3. Daily Progress & Streak Check (/how many tasks completed|my progress today|what is my streak|current streak/i)
  if (PROGRESS_STREAK_REGEX.test(clean)) {
    const tasks = context?.tasks || [];
    const completedCount = tasks.filter((t) => t.completed).length;
    const streakDays = Math.max(0, context?.streak || 0);

    return {
      intercepted: true,
      interceptorType: 'DAILY_PROGRESS',
      speechResponse: `You've completed ${completedCount} tasks today with a ${streakDays}-day streak.`,
    };
  }

  // 4. Slake Coin Balance Readout (/how many coins|my coin balance|slake coins today/i)
  if (COIN_BALANCE_REGEX.test(clean)) {
    const coins = Math.max(0, context?.coins || 0);
    return {
      intercepted: true,
      interceptorType: 'COIN_BALANCE',
      speechResponse: `You have ${coins} Slake Coins in your wallet.`,
    };
  }

  // 5. Weather Interceptor (/weather|temperature|how hot/i)
  if (WEATHER_REGEX.test(clean)) {
    let tempText = 'unavailable';
    if (typeof document !== 'undefined') {
      const weatherNode = document.querySelector('[data-weather-indicator]');
      if (weatherNode && weatherNode.textContent) {
        tempText = weatherNode.textContent.trim();
      }
    }
    return {
      intercepted: true,
      interceptorType: 'WEATHER',
      speechResponse: `The weather is currently ${tempText}.`,
    };
  }

  // 6. Time Interceptor (/what time is it|current time/i)
  if (TIME_REGEX.test(clean)) {
    const formattedTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return {
      intercepted: true,
      interceptorType: 'TIME',
      speechResponse: `The current time is ${formattedTime}.`,
    };
  }

  // 7. Identity Interceptor (/who are you|your name|what can you do/i)
  if (IDENTITY_REGEX.test(clean)) {
    return {
      intercepted: true,
      interceptorType: 'IDENTITY',
      speechResponse: 'I am Agent DM, your focus and routine companion.',
    };
  }

  return { intercepted: false };
}
