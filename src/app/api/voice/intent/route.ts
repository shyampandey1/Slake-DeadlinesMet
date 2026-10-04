import { NextResponse } from 'next/server';
import { VoiceIntentPayloadSchema, VoiceIntentPayload, VoiceCategory, VoiceRoute } from '@/types/voice';
import { callTypeSafeSystemOne, TypeSafeQuestion } from '@/lib/jevClient';
import { VOICE_COMMAND_DICTIONARY } from '@/config/voiceCommandDictionary';

/**
 * Parses transcripts against canonical dictionary and deterministic NLP
 */
function parseVoiceCommand(transcript: string, currentRoute: string = '/'): VoiceIntentPayload {
  const lower = transcript.toLowerCase().trim();

  // 1. Direct match against canonical voice command dictionary
  for (const cmd of VOICE_COMMAND_DICTIONARY) {
    // Check direct phrase matches
    if (cmd.phrases.some(p => lower === p || lower.startsWith(p) || lower.endsWith(p))) {
      return {
        action: cmd.action,
        taskName: cmd.category ? cmd.phrases[0] : undefined,
        durationMinutes: cmd.durationMinutes,
        extendMinutes: cmd.extendMinutes,
        intervalMinutes: cmd.intervalMinutes,
        category: cmd.category,
        targetRoute: cmd.targetRoute,
        earnedCoins: cmd.earnedCoins,
        coopAction: cmd.coopAction,
        rewardsAction: cmd.rewardsAction,
        sensorType: cmd.sensorType,
        sensorState: cmd.sensorState,
        speechFeedback: cmd.speechFeedback,
        confidence: 0.98,
      };
    }

    // Check regex patterns
    for (const pat of cmd.patterns) {
      const match = lower.match(pat);
      if (match) {
        let duration = cmd.durationMinutes;
        let extend = cmd.extendMinutes;
        let interval = cmd.intervalMinutes;

        if (match[1] && !isNaN(parseInt(match[1], 10))) {
          const num = parseInt(match[1], 10);
          if (cmd.action === 'TIMER_EXTEND') extend = num;
          else if (cmd.action === 'TIMER_SET_INTERVAL') interval = num;
          else duration = num;
        }

        return {
          action: cmd.action,
          taskName: cmd.category ? cmd.phrases[0] : undefined,
          durationMinutes: duration,
          extendMinutes: extend,
          intervalMinutes: interval,
          category: cmd.category,
          targetRoute: cmd.targetRoute,
          earnedCoins: cmd.earnedCoins,
          coopAction: cmd.coopAction,
          rewardsAction: cmd.rewardsAction,
          sensorType: cmd.sensorType,
          sensorState: cmd.sensorState,
          speechFeedback: cmd.speechFeedback,
          confidence: 0.95,
        };
      }
    }
  }

  // 2. Fallback pattern matching for dynamic task names and durations
  const durationMatch = lower.match(/(\d+)\s*(?:min|minute|minutes|m|mi)/i);
  const duration = durationMatch ? parseInt(durationMatch[1], 10) : 15;

  let taskName = transcript;
  taskName = taskName
    .replace(/^(?:set\s+a\s+timer\s+(?:of|for)?|start\s+(?:a)?\s*timer\s+(?:of|for)?|start\s+a\s+|start\s+|create\s+task\s+|create\s+)/i, '')
    .replace(/(?:in|for)?\s*\d+\s*(?:min|minute|minutes|m|mi)/i, '')
    .trim();

  if (!taskName) {
    taskName = 'Focus Session';
  } else {
    taskName = taskName.charAt(0).toUpperCase() + taskName.slice(1);
  }

  // Categorize task dynamically
  let category: VoiceCategory = 'Productivity';
  const nameLower = taskName.toLowerCase();
  if (nameLower.includes('water') || nameLower.includes('hydrate') || nameLower.includes('drink')) {
    category = 'Hydration';
  } else if (nameLower.includes('meditat') || nameLower.includes('breath') || nameLower.includes('mindful') || nameLower.includes('relax')) {
    category = 'Meditation';
  } else if (nameLower.includes('exercise') || nameLower.includes('workout') || nameLower.includes('run') || nameLower.includes('fitness') || nameLower.includes('gym') || nameLower.includes('stretch')) {
    category = 'Fitness';
  } else if (nameLower.includes('draw') || nameLower.includes('write') || nameLower.includes('design') || nameLower.includes('art') || nameLower.includes('read') || nameLower.includes('journal')) {
    category = 'Creativity';
  } else if (nameLower.includes('brush') || nameLower.includes('shower') || nameLower.includes('bath') || nameLower.includes('bed') || nameLower.includes('table') || nameLower.includes('clean') || nameLower.includes('dinner') || nameLower.includes('lunch') || nameLower.includes('breakfast')) {
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
    confidence: 0.90,
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

    // 1. Check local canonical dictionary and fast deterministic parser
    const localResult = parseVoiceCommand(transcript, currentRoute);

    // 2. Validate against JEV TypeSafe Decision Engine if ambiguity exists
    try {
      if (localResult.confidence && localResult.confidence < 0.95) {
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
              TASK_LOG_QUICK: 'User logged a quick micro habit like drinking water or making bed',
              TASK_CREATE: 'User wants to schedule or add a new task to their routine',
              NAVIGATE: 'User wants to transition to a different screen or page in the app',
              COOP_ACTION: 'User wants to manage co-op cluster sessions or invite peers',
              REWARDS_ACTION: 'User wants to access rewards, cash redemption, or check coins',
              SENSOR_ENVIRONMENT_TOGGLE: 'User wants to toggle sensors, dwell gaze, or ambient sounds',
              MODAL_DISMISS: 'User wants to close, cancel, or dismiss the voice HUD',
            },
          },
        };

        const jevResponse = await callTypeSafeSystemOne({ state, questions });
        const chosenAction = jevResponse.answers?.intentAction?.choice as any;

        if (chosenAction) {
          localResult.action = chosenAction;
        }
      }
    } catch (jevErr) {
      console.warn('[JEV Voice Intent] Upstream JEV TypeSafe fallback:', jevErr);
    }

    return NextResponse.json(VoiceIntentPayloadSchema.parse(localResult));
  } catch (error: any) {
    console.error('Voice Intent API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal voice parser error' }, { status: 500 });
  }
}
