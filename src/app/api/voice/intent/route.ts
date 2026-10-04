import { NextResponse } from 'next/server';
import { VoiceIntentPayloadSchema, type VoiceIntentPayload, type VoiceCategory, type VoiceRoute } from '@/types/voice';
import { callTypeSafeSystemOne, type TypeSafeQuestion } from '@/lib/jevClient';

/**
 * Natural language rule-based extractor to accurately parse duration and intent details.
 */
function parseVoiceCommandLocally(transcript: string, currentRoute?: string): VoiceIntentPayload | null {
  const lower = transcript.toLowerCase().trim();

  // 1. MODAL DISMISS
  if (/^(dismiss|close|cancel|nevermind|exit)$/i.test(lower)) {
    return {
      action: 'MODAL_DISMISS',
      speechFeedback: 'Dismissed.',
      confidence: 0.98,
    };
  }

  // 2. NAVIGATION
  if (lower.includes('routine')) {
    return { action: 'NAVIGATE', targetRoute: '/routine', speechFeedback: 'Navigating to Routine.', confidence: 0.95 };
  }
  if (lower.includes('reformer') || lower.includes('league')) {
    return { action: 'NAVIGATE', targetRoute: '/reformers', speechFeedback: 'Navigating to Reformers League.', confidence: 0.95 };
  }
  if (lower.includes('logbook') || lower.includes('history') || lower.includes('accomplishment')) {
    return { action: 'NAVIGATE', targetRoute: '/logbook', speechFeedback: 'Opening Log Book.', confidence: 0.95 };
  }
  if (lower.includes('setting')) {
    return { action: 'NAVIGATE', targetRoute: '/settings', speechFeedback: 'Opening Settings.', confidence: 0.95 };
  }
  if (lower.includes('reward') || lower.includes('redeem')) {
    return { action: 'REDEEM_TRIGGER', targetRoute: '/rewards', speechFeedback: 'Opening Rewards and Redemption.', confidence: 0.95 };
  }
  if (lower.includes('home') || lower.includes('dashboard')) {
    return { action: 'NAVIGATE', targetRoute: '/', speechFeedback: 'Taking you Home.', confidence: 0.95 };
  }

  // 3. TIMER CONTROL
  if (/^(pause|hold on|pause timer|pause session)/i.test(lower)) {
    return { action: 'TIMER_PAUSE', speechFeedback: 'Timer paused.', confidence: 0.95 };
  }
  if (/^(resume|continue|resume timer|keep going)/i.test(lower)) {
    return { action: 'TIMER_RESUME', speechFeedback: 'Resuming timer.', confidence: 0.95 };
  }
  if (/^(stop|finish|done|end timer|stop timer|complete)/i.test(lower)) {
    return { action: 'TIMER_STOP', speechFeedback: 'Ending focus session.', confidence: 0.95 };
  }

  // 4. TIMER EXTEND
  const extendMatch = lower.match(/(?:extend|add|give me)\s*(?:by)?\s*(\d+)\s*(?:more)?\s*(?:min|minute|minutes|m)?/i);
  if (extendMatch && extendMatch[1]) {
    const mins = parseInt(extendMatch[1], 10);
    return {
      action: 'TIMER_EXTEND',
      extendMinutes: mins,
      speechFeedback: `Extending session by ${mins} minutes.`,
      confidence: 0.95,
    };
  }

  // 5. TIMER SET INTERVAL
  const intervalMatch = lower.match(/(?:interval|alert|milestone|notify every|every)\s*(?:to|every|of)?\s*(\d+)\s*(?:min|minute|minutes|m)/i);
  if (intervalMatch && intervalMatch[1]) {
    const mins = parseInt(intervalMatch[1], 10);
    return {
      action: 'TIMER_SET_INTERVAL',
      intervalMinutes: mins,
      speechFeedback: `Milestone interval alert set to every ${mins} minutes.`,
      confidence: 0.95,
    };
  }

  // 6. QUICK LOG TASK (e.g. "quick log water", "drank a glass of water")
  if (lower.includes('drink') && lower.includes('water') || lower.includes('quick log water') || lower.includes('log water')) {
    return {
      action: 'TASK_QUICK_LOG',
      taskName: 'Drink a glass of water',
      durationMinutes: 1,
      category: 'Hydration',
      speechFeedback: 'Logged 1 glass of water. 15 Slake Coins earned!',
      confidence: 0.95,
    };
  }

  // 7. TIMER START or TASK CREATE with duration extraction
  // Handles examples like "set a timer of dinner in 20 mi", "start 30 min coding session"
  const durationMatch = lower.match(/(\d+)\s*(?:min|minute|minutes|m\b|mi\b)/i);
  const duration = durationMatch ? parseInt(durationMatch[1], 10) : 15;

  let taskName = transcript;
  // Clean prefixes like "set a timer of", "start a timer for", "start", "create task"
  taskName = taskName
    .replace(/^(?:set\s+a\s+timer\s+(?:of|for)?|start\s+(?:a)?\s*timer\s+(?:of|for)?|start\s+a\s+|start\s+|create\s+task\s+|create\s+)/i, '')
    .replace(/(?:in|for)?\s*\d+\s*(?:min|minute|minutes|m\b|mi\b)/i, '')
    .trim();

  if (!taskName) {
    taskName = 'Focus Session';
  } else {
    // Capitalize first letter
    taskName = taskName.charAt(0).toUpperCase() + taskName.slice(1);
  }

  // Categorization
  let category: VoiceCategory = 'Productivity';
  const nameLower = taskName.toLowerCase();
  if (nameLower.includes('water') || nameLower.includes('hydrate') || nameLower.includes('drink')) {
    category = 'Hydration';
  } else if (nameLower.includes('meditat') || nameLower.includes('breath') || nameLower.includes('mindful')) {
    category = 'Meditation';
  } else if (nameLower.includes('exercise') || nameLower.includes('workout') || nameLower.includes('run') || nameLower.includes('fitness') || nameLower.includes('gym')) {
    category = 'Fitness';
  } else if (nameLower.includes('draw') || nameLower.includes('write') || nameLower.includes('design') || nameLower.includes('art')) {
    category = 'Creativity';
  } else if (nameLower.includes('brush') || nameLower.includes('shower') || nameLower.includes('bath') || nameLower.includes('dinner') || nameLower.includes('lunch') || nameLower.includes('breakfast')) {
    category = 'Hygiene';
  }

  const isTimerStart = lower.includes('timer') || lower.includes('start') || lower.includes('focus') || lower.includes('countdown');

  return {
    action: isTimerStart ? 'TIMER_START' : 'TASK_CREATE',
    taskName,
    durationMinutes: duration,
    category,
    speechFeedback: isTimerStart
      ? `Starting ${duration}-minute timer for ${taskName}.`
      : `Created task ${taskName} for ${duration} minutes.`,
    confidence: 0.92,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const transcript = (body?.transcript || '').trim();
    const currentRoute = body?.currentRoute || '/';
    const activeTimerState = body?.activeTimerState;

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    // First attempt quick deterministic classification for ultra-fast response
    const localResult = parseVoiceCommandLocally(transcript, currentRoute);

    // If local result is very confident (or API call fallback), use it or enhance with JEV TypeSafe
    try {
      const state = {
        transcript,
        currentRoute,
        activeTimer: activeTimerState,
      };

      const questions: Record<string, TypeSafeQuestion> = {
        intentAction: {
          type: 'choice',
          instructions: 'Classify the primary voice intent of the user transcript.',
          criteria: {
            TIMER_START: 'User wants to begin a countdown or focus session for a task',
            TIMER_PAUSE: 'User wants to pause their running timer',
            TIMER_RESUME: 'User wants to resume a paused timer',
            TIMER_STOP: 'User wants to stop, end, or finish the active timer',
            TIMER_EXTEND: 'User wants to add more minutes to the current timer',
            TIMER_SET_INTERVAL: 'User wants to configure recurring milestone alert intervals',
            TASK_QUICK_LOG: 'User explicitly logged an immediate habit like drinking water',
            TASK_CREATE: 'User wants to schedule or add a new task to their routine',
            NAVIGATE: 'User wants to transition to a different screen or page in the app',
            REDEEM_TRIGGER: 'User wants to open rewards, certificates, or cash redemption',
            MODAL_DISMISS: 'User wants to close, cancel, or dismiss the voice modal',
          },
        },
      };

      const jevResponse = await callTypeSafeSystemOne({ state, questions });
      const chosenAction = jevResponse.answers?.intentAction?.choice as any;

      if (chosenAction && localResult && chosenAction === localResult.action) {
        return NextResponse.json(VoiceIntentPayloadSchema.parse(localResult));
      }
    } catch (jevErr) {
      console.warn('[JEV Voice Parser] JEV SystemOne fallback to local deterministic NLP:', jevErr);
    }

    // Default to the robust local parser result
    if (localResult) {
      return NextResponse.json(VoiceIntentPayloadSchema.parse(localResult));
    }

    // Fallback default
    const fallback: VoiceIntentPayload = {
      action: 'TIMER_START',
      taskName: transcript,
      durationMinutes: 15,
      category: 'Productivity',
      speechFeedback: `Starting 15-minute timer for ${transcript}.`,
      confidence: 0.8,
    };
    return NextResponse.json(VoiceIntentPayloadSchema.parse(fallback));
  } catch (error: any) {
    console.error('Voice Intent API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal voice parser error' }, { status: 500 });
  }
}
