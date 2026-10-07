import { NextResponse } from 'next/server';
import { VoiceIntentPayload, VoiceIntentPayloadSchema, VoiceCategory } from '@/types/voice';
import { VOICE_COMMAND_DICTIONARY } from '@/config/voiceCommandDictionary';
import { callTypeSafeSystemOne, TypeSafeQuestion } from '@/lib/jevClient';

/**
 * Normalizes speech string by removing trailing punctuation and extra spaces
 */
function normalizeSpeech(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts numeric durations in seconds, minutes, or hours from natural language
 */
function extractDuration(text: string): { durationMinutes?: number; durationSeconds?: number } {
  const norm = normalizeSpeech(text);

  // 1. Seconds extraction
  const secMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:sec|second|seconds|s\b)/i);
  if (secMatch) {
    const sec = parseFloat(secMatch[1]);
    return {
      durationSeconds: sec,
      durationMinutes: Math.round((sec / 60) * 100) / 100,
    };
  }

  // 2. Minutes extraction
  const minMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:min|minute|minutes|m\b)/i);
  if (minMatch) {
    const min = parseFloat(minMatch[1]);
    return {
      durationMinutes: min,
      durationSeconds: Math.round(min * 60),
    };
  }

  // 3. Hours extraction
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
 * Parses transcripts against canonical dictionary and deterministic NLP:
 * - Exact regex/dictionary matches return confidence: 0.95–1.0.
 * - Ambiguous commands with partial keyword overlap return confidence: 0.70.
 * - Unrecognized text returns confidence: 0.40.
 */
function parseVoiceCommand(transcript: string, currentRoute: string = '/'): VoiceIntentPayload {
  const norm = normalizeSpeech(transcript);
  const extracted = extractDuration(norm);
  const hasDuration = extracted.durationSeconds !== undefined || extracted.durationMinutes !== undefined;

  // 1. Check exact phrase and pattern match against canonical dictionary
  for (const cmd of VOICE_COMMAND_DICTIONARY) {
    if (cmd.action === 'TASK_LOG_QUICK') {
      if (hasDuration) continue;
      if (/^(?:drink|make|do|start|begin|take|perform|set)\b/i.test(norm)) continue;
    }

    const exactPhraseMatch = cmd.phrases.some((p) => {
      const np = normalizeSpeech(p);
      return norm === np;
    });

    const isSubPhraseMatch = !exactPhraseMatch && cmd.phrases.some((p) => {
      const np = normalizeSpeech(p);
      return norm.startsWith(np) || norm.endsWith(np);
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

    if (exactPhraseMatch || isSubPhraseMatch || isPatternMatch) {
      let durationMinutes = cmd.durationMinutes;
      let durationSeconds = cmd.durationSeconds;
      let extendMinutes = cmd.extendMinutes;
      let intervalMinutes = cmd.intervalMinutes;

      if (hasDuration) {
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
        actionType: cmd.actionType,
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
        confidence: exactPhraseMatch ? 1.0 : isPatternMatch ? 0.98 : 0.95,
      };
    }
  }

  // 2. High-precision dynamic task and timer handler
  const { durationMinutes, durationSeconds } = extracted;

  // Breathing or Oxygenation Task
  if (norm.includes('breath') || norm.includes('oxygen') || norm.includes('pranayama')) {
    const finalSeconds = durationSeconds || 60;
    const finalMinutes = durationMinutes || finalSeconds / 60;
    const durLabel = finalSeconds < 60 ? `${finalSeconds} seconds` : finalMinutes === 1 ? '1 minute' : `${finalMinutes} minutes`;
    return {
      action: 'TIMER_START',
      taskName: 'Deep Breathing',
      durationMinutes: finalMinutes,
      durationSeconds: finalSeconds,
      category: 'Meditation',
      speechFeedback: `Starting ${durLabel} Deep Breathing exercise in full screen.`,
      confidence: 0.95,
    };
  }

  // Hydration Task
  if (norm.includes('water') || norm.includes('hydrate') || norm.includes('drink')) {
    const finalSeconds = durationSeconds || 60;
    const finalMinutes = durationMinutes || finalSeconds / 60;
    const durLabel = finalSeconds < 60 ? `${finalSeconds} seconds` : finalMinutes === 1 ? '1 minute' : `${finalMinutes} minutes`;
    return {
      action: 'TIMER_START',
      taskName: 'Drink a Glass of Water',
      durationMinutes: finalMinutes,
      durationSeconds: finalSeconds,
      category: 'Hydration',
      speechFeedback: `Starting ${durLabel} timer to drink a glass of water in full screen.`,
      confidence: 0.95,
    };
  }

  // Check for partial keyword overlaps with conversational intent (confidence 0.70)
  const isConversationalTask =
    norm.includes('work') ||
    norm.includes('focus') ||
    norm.includes('meditat') ||
    norm.includes('stretch') ||
    norm.includes('exercise') ||
    norm.includes('read') ||
    norm.includes('journal') ||
    norm.includes('write') ||
    norm.includes('clean') ||
    norm.includes('timer');

  if (isConversationalTask) {
    let cleanTask = norm
      .replace(/^(?:start\s+(?:a\s+)?|set\s+(?:a\s+)?timer\s+(?:for|of)?|begin\s+(?:a\s+)?|do\s+(?:some\s+)?|create\s+(?:a\s+)?task\s+(?:for|of)?|create\s+|i\s+need\s+to\s+|can\s+we\s+|how\s+about\s+|let's\s+)/i, '')
      .replace(/(?:in|for|of)?\s*\d+(?:\.\d+)?\s*(?:sec|second|seconds|s|min|minute|minutes|m|hour|hours|hr|hrs)\b/gi, '')
      .replace(/\b(?:timer|session|exercise|countdown)\b/gi, '')
      .trim();

    let category: VoiceCategory = 'Productivity';
    if (norm.includes('meditat') || norm.includes('mindful') || norm.includes('relax')) {
      category = 'Meditation';
      if (!cleanTask) cleanTask = 'Meditation';
    } else if (norm.includes('exercise') || norm.includes('workout') || norm.includes('stretch')) {
      category = 'Fitness';
      if (!cleanTask) cleanTask = 'Workout';
    } else if (norm.includes('draw') || norm.includes('write') || norm.includes('read') || norm.includes('journal')) {
      category = 'Creativity';
      if (!cleanTask) cleanTask = 'Creative Focus';
    } else if (norm.includes('clean') || norm.includes('desk') || norm.includes('bed')) {
      category = 'Hygiene';
      if (!cleanTask) cleanTask = 'Clean Workspace';
    }

    const finalName = cleanTask
      ? cleanTask.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'Focus Session';

    const finalMinutes = durationMinutes || 15;
    const finalSeconds = durationSeconds || finalMinutes * 60;
    const durLabel = finalSeconds < 60 ? `${finalSeconds} seconds` : finalMinutes === 1 ? '1 minute' : `${finalMinutes} minutes`;

    return {
      action: 'TIMER_START',
      taskName: finalName,
      durationMinutes: finalMinutes,
      durationSeconds: finalSeconds,
      category,
      speechFeedback: `Starting ${durLabel} timer for ${finalName}.`,
      confidence: 0.70, // Ambiguous with partial keyword overlap
    };
  }

  // 3. Unrecognized input (confidence 0.40)
  return {
    action: 'MODAL_DISMISS',
    speechFeedback: "I didn't quite catch that. Try asking to start a timer, log water, or show routine.",
    confidence: 0.40,
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

    // 1. Run canonical fast parser
    const localResult = parseVoiceCommand(transcript, currentRoute);

    // 2. Fallback to JEV TypeSafe SystemOne if confidence is below 0.85
    if (localResult.confidence !== undefined && localResult.confidence < 0.85) {
      try {
        const canonicalFewShots = VOICE_COMMAND_DICTIONARY.slice(0, 15).map((c) => ({
          phrase: c.phrases[0],
          action: c.action,
          category: c.category || 'Productivity',
        }));

        const state = {
          transcript,
          currentRoute,
          activeTimer: activeTimerState,
          canonicalFewShots,
        };

        const questions: Record<string, TypeSafeQuestion> = {
          intentAction: {
            type: 'choice',
            instructions:
              'Classify the primary voice intent into one of the canonical DeadlinesMet actions.',
            criteria: {
              TIMER_START: 'User wants to begin a countdown or start a focus task session',
              TIMER_PAUSE: 'User wants to pause their running timer',
              TIMER_RESUME: 'User wants to resume a paused timer',
              TIMER_STOP: 'User wants to stop, end, or finish the active timer',
              TIMER_EXTEND: 'User wants to add more minutes to the current timer',
              TIMER_SET_INTERVAL: 'User wants to configure recurring milestone alert intervals',
              TASK_LOG_QUICK: 'User explicitly stated an action is already completed (past tense)',
              TASK_CREATE: 'User wants to schedule or add a new task to their routine',
              NAVIGATE: 'User wants to navigate to a screen (routine, reformers, rewards, logbook, settings)',
              COOP_ACTION: 'User wants to manage co-op cluster sessions, invite peers, or control group timer',
              REWARDS_ACTION: 'User wants to access rewards, cash-out redemption, or check coins',
              SENSOR_ENVIRONMENT_TOGGLE: 'User wants to toggle eye tracking, gaze dwell, or procedural audio',
              MODAL_DISMISS: 'User wants to close, cancel, dismiss the HUD or uttered unrelated speech',
            },
          },
          targetCategory: {
            type: 'choice',
            instructions: 'Select the most relevant lifestyle category for the user utterance.',
            criteria: {
              Productivity: 'Deep work, coding, analysis, planning, writing',
              Hydration: 'Water, drinking, tea, fluids',
              Fitness: 'Workouts, exercise, stretching, movement',
              Meditation: 'Breathing, mindfulness, relaxation, centering',
              Hygiene: 'Cleaning, making bed, domestic resets',
              Creativity: 'Art, design, content creation, journaling',
            },
          },
          isAffirmativeExecution: {
            type: 'noul',
            instructions: 'Should the voice controller execute an affirmative UI state transition for this phrase?',
          },
        };

        const jevResponse = await callTypeSafeSystemOne({ state, questions });
        const answers = jevResponse.answers || {};
        const chosenAction = answers.intentAction?.choice as any;
        const chosenCategory = answers.targetCategory?.choice as any;

        if (chosenAction && chosenAction !== 'MODAL_DISMISS') {
          localResult.action = chosenAction;
          localResult.confidence = 0.92;

          if (chosenCategory) {
            localResult.category = chosenCategory;
          }

          if (chosenAction === 'NAVIGATE') {
            const norm = transcript.toLowerCase();
            if (norm.includes('reform')) localResult.targetRoute = '/reformers';
            else if (norm.includes('reward') || norm.includes('coin')) localResult.targetRoute = '/rewards';
            else if (norm.includes('log') || norm.includes('insight') || norm.includes('history')) localResult.targetRoute = '/logbook';
            else if (norm.includes('routin') || norm.includes('sched')) localResult.targetRoute = '/routine';
            else if (norm.includes('setting')) localResult.targetRoute = '/settings';
            else localResult.targetRoute = '/';
            localResult.speechFeedback = `Navigating to ${localResult.targetRoute}.`;
          } else if (chosenAction === 'TIMER_START') {
            localResult.taskName = localResult.taskName || 'Focus Session';
            localResult.speechFeedback = `Starting ${localResult.durationMinutes || 15}-minute ${localResult.taskName} session.`;
          } else if (chosenAction === 'TIMER_PAUSE') {
            localResult.speechFeedback = 'Timer paused.';
          } else if (chosenAction === 'TIMER_RESUME') {
            localResult.speechFeedback = 'Resuming timer.';
          } else if (chosenAction === 'TIMER_STOP') {
            localResult.speechFeedback = 'Task finished. Great work!';
          }
        }
      } catch (jevErr: any) {
        console.warn('[JEV Voice Intent] Upstream JEV TypeSafe fallback:', jevErr?.message);
      }
    }

    return NextResponse.json(VoiceIntentPayloadSchema.parse(localResult));
  } catch (error: any) {
    console.error('Voice Intent API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal voice parser error' }, { status: 500 });
  }
}
