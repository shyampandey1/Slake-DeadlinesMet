import { NextResponse } from 'next/server';
import { VoiceIntentPayloadSchema, VoiceIntentPayload, VoiceCategory, VoiceRoute, JEV_VOICE_DATASET } from '@/types/voice';
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
 * Helper to convert a string to title case while keeping minor English words lowercase
 */
function toTitleCase(str: string): string {
  const minor = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'of', 'in']);
  const words = str.split(/\s+/).filter(Boolean);
  return words.map((w, idx) => {
    const lower = w.toLowerCase();
    if (idx !== 0 && minor.has(lower)) {
      return lower;
    }
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(' ');
}

/**
 * Parses transcripts against JEV Voice Dataset and canonical dictionary
 */
function parseVoiceCommand(transcript: string, currentRoute: string = '/'): VoiceIntentPayload {
  const norm = normalizeSpeech(transcript);
  const extracted = extractDuration(norm);
  const hasDuration = extracted.durationSeconds !== undefined || extracted.durationMinutes !== undefined;

  // 1. Direct utterance match against JEV_VOICE_DATASET
  for (const record of JEV_VOICE_DATASET) {
    // If the command is a quick-log, ensure the user didn't specify a duration or use an imperative verb
    if (record.intent === 'TASK_LOG_QUICK') {
      if (hasDuration) continue;
      if (/^(?:drink|make|do|start|begin|take|perform|set)\b/i.test(norm)) continue;
    }

    const matchedUtterance = record.utterances.some(u => {
      const nu = normalizeSpeech(u);
      return norm === nu || norm.startsWith(nu) || norm.endsWith(nu);
    });

    if (matchedUtterance) {
      let finalMinutes = record.durationMinutes || extracted.durationMinutes;
      let finalSeconds = extracted.durationSeconds || (finalMinutes ? finalMinutes * 60 : undefined);

      let taskName: string | undefined = undefined;
      if (record.intent === 'TASK_CREATE' || record.intent === 'TIMER_START') {
        const first = record.utterances[0] || '';
        taskName = first
          .replace(/^(?:start|begin|do|run)\s+/i, '')
          .replace(/\s+(?:timer|session|break|exercise|sprint|block|review)$/i, '')
          .trim();
        taskName = toTitleCase(taskName);
      } else if (record.intent === 'TASK_LOG_QUICK') {
        taskName = toTitleCase(record.utterances[0]);
      }

      let speechFeedback = record.speechFeedback;
      if (hasDuration && (record.intent === 'TASK_CREATE' || record.intent === 'TIMER_START')) {
        const durLabel = (finalSeconds && finalSeconds < 60)
          ? `${finalSeconds} seconds`
          : finalMinutes === 1 ? '1 minute' : `${finalMinutes} minutes`;
        speechFeedback = `Starting ${durLabel} ${taskName || 'timer'}.`;
      }

      return {
        action: record.intent as any,
        actionType: record.actionType,
        targetRoute: record.targetRoute as any,
        taskName,
        category: record.category as any,
        durationMinutes: finalMinutes,
        durationSeconds: finalSeconds,
        coinsAwarded: record.coinsAwarded,
        earnedCoins: record.coinsAwarded,
        extendMinutes: record.actionType === 'EXTEND' ? record.durationMinutes : undefined,
        intervalMinutes: record.actionType === 'SET_INTERVAL' ? record.durationMinutes : undefined,
        speechFeedback,
        confidence: 0.99,
      };
    }
  }

  // 2. Direct match against canonical voice command dictionary (with regex patterns)
  for (const cmd of VOICE_COMMAND_DICTIONARY) {
    if (cmd.action === 'TASK_LOG_QUICK') {
      if (hasDuration) continue;
      if (/^(?:drink|make|do|start|begin|take|perform|set)\b/i.test(norm)) continue;
    }

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
      let durationMinutes = extracted.durationMinutes || cmd.durationMinutes;
      let durationSeconds = extracted.durationSeconds || cmd.durationSeconds;

      if (!durationMinutes && matchedGroup) {
        const val = parseFloat(matchedGroup);
        if (!isNaN(val)) {
          durationMinutes = val;
          durationSeconds = val * 60;
        }
      }

      let feedback = cmd.speechFeedback;
      if (cmd.taskName && (cmd.action === 'TIMER_START' || cmd.action === 'TASK_CREATE')) {
        const durLabel = (durationSeconds && durationSeconds < 60)
          ? `${durationSeconds} seconds`
          : durationMinutes === 1 ? '1 minute' : `${durationMinutes} minutes`;
        feedback = `Starting ${durLabel} for ${cmd.taskName}. Let's make it count!`;
      }

      return {
        action: cmd.action,
        actionType: cmd.actionType,
        taskName: cmd.taskName,
        category: cmd.category,
        targetRoute: cmd.targetRoute,
        durationMinutes,
        durationSeconds,
        extendMinutes: cmd.extendMinutes,
        intervalMinutes: cmd.intervalMinutes,
        earnedCoins: cmd.earnedCoins || cmd.coinsAwarded,
        coinsAwarded: cmd.coinsAwarded || cmd.earnedCoins,
        coopAction: cmd.coopAction,
        rewardsAction: cmd.rewardsAction,
        sensorType: cmd.sensorType,
        sensorState: cmd.sensorState,
        speechFeedback: feedback,
        confidence: 0.95,
      };
    }
  }

  // 3. Fallback Dynamic Task Matching (e.g. "drink a glass of water", "code for 20 minutes", "read 15 minutes")
  let category: VoiceCategory = 'Productivity';
  if (/drink|water|hydrate/i.test(norm)) category = 'Hydration';
  else if (/breath|oxygen|meditat|mindful|calm|zen/i.test(norm)) category = 'Meditation';
  else if (/stretch|workout|run|squat|pushup|gym|exercise|fitness/i.test(norm)) category = 'Fitness';
  else if (/bed|clean|tidy|hygiene|wash|shower/i.test(norm)) category = 'Hygiene';
  else if (/read|book|journal|write|draw|paint|scribe/i.test(norm)) category = 'Creativity';

  // Category defaults when no duration was explicitly spoken
  const CATEGORY_DEFAULTS: Record<VoiceCategory, { minutes: number; coins: number }> = {
    Hydration: { minutes: 2, coins: 15 },
    Meditation: { minutes: 10, coins: 30 },
    Fitness: { minutes: 20, coins: 40 },
    Hygiene: { minutes: 5, coins: 15 },
    Creativity: { minutes: 15, coins: 30 },
    Productivity: { minutes: 25, coins: 50 },
  };

  const defaultMeta = CATEGORY_DEFAULTS[category];
  const finalMinutes = extracted.durationMinutes !== undefined ? extracted.durationMinutes : defaultMeta.minutes;
  const finalSeconds = extracted.durationSeconds !== undefined ? extracted.durationSeconds : (finalMinutes * 60);

  // Clean task name: strip command verbs and explicit durations while preserving natural task names
  let cleanTask = norm
    .replace(/\b(?:start|begin|do|run|set|session|timer|countdown)\b/gi, ' ')
    .replace(/\b(?:for|in)\s+\d+(?:\.\d+)?\s*(?:sec|second|seconds|min|minute|minutes|hour|hours|hr|hrs)\b/gi, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*(?:sec|second|seconds|min|minute|minutes|hour|hours|hr|hrs)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If input was a bare hydration phrase, ensure a polished, complete name
  if (/^(?:glass\s+of\s+water|water|hydrate)$/i.test(cleanTask)) {
    cleanTask = 'Drink a glass of water';
  }

  const finalName = cleanTask
    ? toTitleCase(cleanTask)
    : (category === 'Hydration' ? 'Drink a Glass of Water' : 'Focus Session');

  const durLabel = finalSeconds < 60
    ? `${finalSeconds}s`
    : `${finalMinutes}m`;

  // Concise (< 6 words) confirmation
  const shortTitle = finalName.split(/\s+/).slice(0, 3).join(' ');
  const speechFeedback = `Starting ${durLabel} ${shortTitle}.`;

  return {
    action: 'TIMER_START',
    actionType: 'START',
    taskName: finalName,
    durationMinutes: finalMinutes,
    durationSeconds: finalSeconds,
    coinsAwarded: defaultMeta.coins,
    earnedCoins: defaultMeta.coins,
    category,
    speechFeedback,
    confidence: 0.85,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const transcript = (body?.transcript || '').trim();
    const matchedDomain = body?.matchedDomain as string | undefined;
    const currentRoute = body?.currentRoute || '/';
    const activeTimerState = body?.activeTimerState;

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    // 1. Check local canonical dictionary and deterministic slot parser
    const localResult = parseVoiceCommand(transcript, currentRoute);

    // 2. Tier 3: JEV TypeSafe Parametric Extraction constrained by matchedDomain
    try {
      if ((localResult.confidence && localResult.confidence < 0.90) || matchedDomain) {
        const state = {
          transcript,
          matchedDomain: matchedDomain || 'GENERAL',
          currentRoute,
          activeTimer: activeTimerState,
        };

        const domainCriteriaMap: Record<string, Record<string, string>> = {
          TIMER: {
            TIMER_START: 'Begin a countdown or focus session',
            TIMER_PAUSE: 'Pause the running timer',
            TIMER_RESUME: 'Resume a paused timer',
            TIMER_STOP: 'Stop or finish the active timer',
            TIMER_RESTART: 'Restart the active timer',
            TIMER_EXTEND: 'Add minutes to the active timer',
            TIMER_REDUCE: 'Subtract minutes from the active timer',
            TIMER_SET_INTERVAL: 'Configure recurring milestone alert intervals',
            TIMER_SKIP: 'Skip to the next task in routine',
          },
          NAVIGATION: {
            NAVIGATE: 'Navigate to a screen or route in the app',
          },
          ROUTINE: {
            TIMER_START: 'Start a routine task timer immediately',
            TASK_CREATE: 'Schedule or start a routine task',
            TASK_LOG_QUICK: 'Log a completed habit in past tense',
            ROUTINE_CONTROL: 'Switch routine wrapper or template',
            ROUTINE_COMPLETE_TASK: 'Mark active routine task as completed',
          },
          COOP: {
            COOP_ACTION: 'Manage co-op partner or group sprint session',
          },
          SENSORS: {
            SENSOR_TOGGLE: 'Toggle eye tracking, gaze control, audio, or haptics',
          },
          REWARDS: {
            REWARDS_ACTION: 'Check coin balance, redeem payout, or pin certificate',
          },
          ANALYTICS: {
            ANALYTICS_ACTION: 'Analyze weekly performance or check MOVERS score',
          },
        };

        const constrainedCriteria =
          (matchedDomain && domainCriteriaMap[matchedDomain]) || {
            TIMER_START: 'Start a countdown or focus session for a task',
            TIMER_PAUSE: 'Pause the running timer',
            TIMER_RESUME: 'Resume a paused timer',
            TIMER_STOP: 'Stop, end, or finish the active timer',
            TIMER_RESTART: 'Restart the current active timer',
            TIMER_EXTEND: 'Add more minutes to the current timer',
            TIMER_REDUCE: 'Subtract minutes from the current timer',
            TIMER_SET_INTERVAL: 'Configure recurring milestone alert intervals',
            TIMER_SKIP: 'Skip to the next task in routine',
            TASK_LOG_QUICK: 'Log an already completed habit',
            TASK_CREATE: 'Create or start a new routine task',
            NAVIGATE: 'Transition to a different screen in the app',
            ROUTINE_CONTROL: 'Apply routine templates or change wrapper',
            COOP_ACTION: 'Manage co-op sessions or group timers',
            SENSOR_TOGGLE: 'Toggle sensors, gaze control, haptics, or soundscapes',
            REWARDS_ACTION: 'Access rewards, cash redemption, or certificates',
            ANALYTICS_ACTION: 'View analytics or generate JEV insights',
            SYSTEM_CONTROL: 'Dismiss HUD, toggle dark mode, or scroll',
          };

        const questions: Record<string, TypeSafeQuestion> = {
          intentAction: {
            type: 'choice',
            instructions: `Classify the primary voice intent constrained to domain ${matchedDomain || 'ALL'}.`,
            criteria: constrainedCriteria,
          },
          targetRouteSlot: {
            type: 'choice',
            instructions: 'Select the target route if this command navigates or opens a view.',
            criteria: {
              '/': 'Home dashboard',
              '/routine': 'Daily routine planner',
              '/reformers': 'Reformers League & Co-Op hub',
              '/rewards': 'Achievement Center & Slake Coins',
              '/logbook': 'Task Log Book & Analytics',
              '/presets': 'Preset routine templates',
              '/settings': 'Application settings',
              '/timer': 'Active fullscreen timer',
            },
          },
        };

        const jevResponse = await callTypeSafeSystemOne({ state, questions });
        const chosenAction = jevResponse.answers?.intentAction?.choice as any;
        const chosenRoute = jevResponse.answers?.targetRouteSlot?.choice as VoiceRoute | undefined;

        if (chosenAction && localResult.confidence && localResult.confidence < 0.90) {
          localResult.action = chosenAction;
          if (chosenAction === 'NAVIGATE' && chosenRoute && !localResult.targetRoute) {
            localResult.targetRoute = chosenRoute;
            localResult.speechFeedback = `Opening ${chosenRoute.replace('/', '') || 'home'}.`;
          }
        }
      }
    } catch (jevErr) {
      console.warn('[JEV Voice Intent] Upstream JEV TypeSafe fallback:', jevErr);
    }

    // Ensure speechFeedback is concise (< 6 words) when generated dynamically
    const words = (localResult.speechFeedback || '').trim().split(/\s+/);
    if (words.length > 6) {
      localResult.speechFeedback = words.slice(0, 6).join(' ').replace(/[,.!?;:]*$/, '.');
    }

    return NextResponse.json(VoiceIntentPayloadSchema.parse(localResult));
  } catch (error: any) {
    console.error('Voice Intent API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal voice parser error' }, { status: 500 });
  }
}
