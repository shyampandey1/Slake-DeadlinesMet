import { NextResponse } from 'next/server';
import { VoiceIntentPayloadSchema, VoiceIntentPayload, VoiceCategory, VoiceRoute } from '@/types/voice';
import { callTypeSafeSystemOne, TypeSafeQuestion } from '@/lib/jevClient';
import { VOICE_COMMAND_DICTIONARY } from '@/config/voiceCommandDictionary';

/**
 * Normalizes speech input: converts spoken numbers, handles ASR typos, lowercases
 */
function normalizeSpeech(text: string): string {
  let lower = text.toLowerCase().trim();

  // Spoken number normalization
  const numMap: [RegExp, string][] = [
    [/\bhalf\s+a\s+minute\b/gi, '30 seconds'],
    [/\bhalf\s+an\s+hour\b/gi, '30 minutes'],
    [/\ba\s+minute\b/gi, '1 minute'],
    [/\bone\s+minute\b/gi, '1 minute'],
    [/\btwo\s+minutes\b/gi, '2 minutes'],
    [/\bthree\s+minutes\b/gi, '3 minutes'],
    [/\bfour\s+minutes\b/gi, '4 minutes'],
    [/\bfive\s+minutes\b/gi, '5 minutes'],
    [/\bten\s+minutes\b/gi, '10 minutes'],
    [/\bfifteen\s+minutes\b/gi, '15 minutes'],
    [/\btwenty\s+minutes\b/gi, '20 minutes'],
    [/\bthirty\s+seconds\b/gi, '30 seconds'],
    [/\bthirty\s+minutes\b/gi, '30 minutes'],
    [/\bforty\s+five\s+minutes\b/gi, '45 minutes'],
    [/\bsixty\s+minutes\b/gi, '60 minutes'],
    [/\ban\s+hour\b/gi, '60 minutes'],
    [/\bone\s+hour\b/gi, '60 minutes'],
  ];

  for (const [pat, val] of numMap) {
    lower = lower.replace(pat, val);
  }

  // ASR speech recognition phonetic typo fixes
  lower = lower.replace(/\bbreating\b/gi, 'breathing');
  lower = lower.replace(/\bbreth\b/gi, 'breath');
  lower = lower.replace(/\bbrething\b/gi, 'breathing');
  lower = lower.replace(/\boxigen\b/gi, 'oxygen');

  return lower;
}

/**
 * Extracts duration in seconds and minutes from spoken text
 */
function extractDuration(text: string): { durationMinutes?: number; durationSeconds?: number } {
  const norm = normalizeSpeech(text);

  // 1. Seconds extraction: (\d+(?:\.\d+)?)\s*(?:sec|second|seconds|s\b)
  const secMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:sec|second|seconds|s\b)/i);
  if (secMatch) {
    const sec = parseFloat(secMatch[1]);
    return {
      durationSeconds: sec,
      durationMinutes: Math.round((sec / 60) * 100) / 100,
    };
  }

  // 2. Minutes extraction: (\d+(?:\.\d+)?)\s*(?:min|minute|minutes|m\b)
  const minMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:min|minute|minutes|m\b)/i);
  if (minMatch) {
    const min = parseFloat(minMatch[1]);
    return {
      durationMinutes: min,
      durationSeconds: Math.round(min * 60),
    };
  }

  // 3. Hours extraction: (\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs|h\b)
  const hrMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs|h\b)/i);
  if (hrMatch) {
    const hr = parseFloat(hrMatch[1]);
    return {
      durationMinutes: hr * 60,
      durationSeconds: Math.round(hr * 3600),
    };
  }

  return {};
}

/**
 * Parses transcripts against canonical dictionary and deterministic NLP
 */
function parseVoiceCommand(transcript: string, currentRoute: string = '/'): VoiceIntentPayload {
  const norm = normalizeSpeech(transcript);

  // 1. Direct match against canonical voice command dictionary
  for (const cmd of VOICE_COMMAND_DICTIONARY) {
    const isPhraseMatch = cmd.phrases.some(p => {
      const np = normalizeSpeech(p);
      return norm === np || norm.startsWith(np) || norm.endsWith(np);
    });

    let isPatternMatch = false;
    let matchedGroup: string | undefined;

    for (const pat of cmd.patterns) {
      const match = norm.match(pat);
      if (match) {
        isPatternMatch = true;
        matchedGroup = match[1];
        break;
      }
    }

    if (isPhraseMatch || isPatternMatch) {
      let durationMinutes = cmd.durationMinutes;
      let durationSeconds = cmd.durationSeconds;
      let extendMinutes = cmd.extendMinutes;
      let intervalMinutes = cmd.intervalMinutes;

      // Extract duration from user utterance if present
      const extracted = extractDuration(norm);
      if (extracted.durationSeconds !== undefined) {
        durationSeconds = extracted.durationSeconds;
        durationMinutes = extracted.durationMinutes;
      }

      if (cmd.action === 'TIMER_EXTEND' && matchedGroup && !isNaN(parseInt(matchedGroup, 10))) {
        extendMinutes = parseInt(matchedGroup, 10);
      } else if (cmd.action === 'TIMER_SET_INTERVAL' && matchedGroup && !isNaN(parseInt(matchedGroup, 10))) {
        intervalMinutes = parseInt(matchedGroup, 10);
      }

      const taskName = cmd.taskName || (cmd.category ? cmd.phrases[0] : undefined);
      let feedback = cmd.speechFeedback;

      if (cmd.action === 'TIMER_START' && taskName) {
        if (durationSeconds && durationSeconds < 60) {
          feedback = `Starting ${durationSeconds}-second ${taskName} exercise in full screen.`;
        } else if (durationMinutes && durationMinutes === 1) {
          feedback = `Starting 1-minute ${taskName} exercise in full screen.`;
        } else if (durationMinutes) {
          feedback = `Starting ${durationMinutes}-minute ${taskName} session in full screen.`;
        }
      }

      return {
        action: cmd.action,
        taskName,
        durationMinutes,
        durationSeconds,
        extendMinutes,
        intervalMinutes,
        category: cmd.category,
        targetRoute: cmd.targetRoute,
        earnedCoins: cmd.earnedCoins,
        coopAction: cmd.coopAction,
        rewardsAction: cmd.rewardsAction,
        sensorType: cmd.sensorType,
        sensorState: cmd.sensorState,
        speechFeedback: feedback,
        confidence: 0.98,
      };
    }
  }

  // 2. High-precision dynamic task and timer handler
  const { durationMinutes, durationSeconds } = extractDuration(norm);

  // Check if breathing or oxygenation task
  if (norm.includes('breath') || norm.includes('oxygen') || norm.includes('pranayama')) {
    const finalSeconds = durationSeconds || 60;
    const finalMinutes = durationMinutes || (finalSeconds / 60);
    const durLabel = finalSeconds < 60 ? `${finalSeconds} seconds` : finalMinutes === 1 ? '1 minute' : `${finalMinutes} minutes`;
    return {
      action: 'TIMER_START',
      taskName: 'Deep Breathing',
      durationMinutes: finalMinutes,
      durationSeconds: finalSeconds,
      category: 'Meditation',
      speechFeedback: `Starting ${durLabel} Deep Breathing exercise in full screen.`,
      confidence: 0.98,
    };
  }

  // Clean task name
  let cleanTask = norm
    .replace(/^(?:start\s+(?:a\s+)?|set\s+(?:a\s+)?timer\s+(?:for|of)?|begin\s+(?:a\s+)?|do\s+(?:some\s+)?|create\s+(?:a\s+)?task\s+(?:for|of)?|create\s+)/i, '')
    .replace(/(?:in|for|of)?\s*\d+(?:\.\d+)?\s*(?:sec|second|seconds|s|min|minute|minutes|m|hour|hours|hr|hrs)\b/gi, '')
    .replace(/\b(?:timer|session|exercise|countdown)\b/gi, '')
    .trim();

  let category: VoiceCategory = 'Productivity';
  if (norm.includes('meditat') || norm.includes('mindful') || norm.includes('relax')) {
    category = 'Meditation';
    if (!cleanTask) cleanTask = 'Meditation';
  } else if (norm.includes('water') || norm.includes('hydrate') || norm.includes('drink')) {
    category = 'Hydration';
    if (!cleanTask) cleanTask = 'Hydration Break';
  } else if (norm.includes('exercise') || norm.includes('workout') || norm.includes('run') || norm.includes('fitness') || norm.includes('gym') || norm.includes('stretch')) {
    category = 'Fitness';
    if (!cleanTask) cleanTask = 'Workout';
  } else if (norm.includes('draw') || norm.includes('write') || norm.includes('design') || norm.includes('art') || norm.includes('read') || norm.includes('journal')) {
    category = 'Creativity';
    if (!cleanTask) cleanTask = 'Creative Focus';
  } else if (norm.includes('brush') || norm.includes('shower') || norm.includes('bath') || norm.includes('bed') || norm.includes('clean')) {
    category = 'Hygiene';
    if (!cleanTask) cleanTask = 'Hygiene';
  }

  const finalName = cleanTask
    ? cleanTask.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Focus Session';

  const finalMinutes = durationMinutes || 15;
  const finalSeconds = durationSeconds || (finalMinutes * 60);
  const durLabel = finalSeconds < 60 ? `${finalSeconds} seconds` : finalMinutes === 1 ? '1 minute' : `${finalMinutes} minutes`;

  return {
    action: 'TIMER_START',
    taskName: finalName,
    durationMinutes: finalMinutes,
    durationSeconds: finalSeconds,
    category,
    speechFeedback: `Starting ${durLabel} timer for ${finalName} in full screen.`,
    confidence: 0.95,
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
      if (localResult.confidence && localResult.confidence < 0.90) {
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
