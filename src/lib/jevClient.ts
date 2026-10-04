import { z } from 'zod';

export const JEV_API_KEY =
  process.env.JEV_API_KEY ||
  'apikey_210288a56a7ed0ab447aa1785bf5325a7936_eb450e49c35123befac0b51dffca0cd7d4f6fdbe34828be6ca7070d96a5a6637';

export const JEV_API_BASE_URL =
  process.env.JEV_API_BASE_URL || 'https://api.typesafe.ai/v1';

export const JEV_MODEL = 'jev-latest';

const TIMEOUT_MS = 20_000; // 20-second threshold to prevent hanging requests inside Vercel serverless functions

export type TypeSafeChoiceQuestion = {
  type: 'choice';
  instructions?: string;
  criteria: Record<string, string>;
};

export type TypeSafeScoreQuestion = {
  type: 'score';
  instructions?: string;
  criteria: string[];
};

export type TypeSafeNoulQuestion = {
  type: 'noul';
  instructions?: string;
  criteria?: { true?: string; false?: string };
};

export type TypeSafeQuestion =
  | TypeSafeChoiceQuestion
  | TypeSafeScoreQuestion
  | TypeSafeNoulQuestion;

export interface TypeSafeSystemOneRequest {
  model?: string;
  state: any;
  questions: Record<string, TypeSafeQuestion>;
}

export interface TypeSafeTokenUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface TypeSafeSystemOneResponse {
  model: string;
  answers: Record<string, any>;
  usage: TypeSafeTokenUsage;
}

/**
 * Core client communicating directly with TypeSafe AI System One (/v1/systemone).
 * Executes strongly-typed decision inference and tracks billable token usage.
 */
export async function callTypeSafeSystemOne(
  request: TypeSafeSystemOneRequest
): Promise<TypeSafeSystemOneResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const endpoint = `${JEV_API_BASE_URL.replace(/\/+$/, '')}/systemone`;

    const bodyPayload = {
      model: request.model || JEV_MODEL,
      state: request.state,
      questions: request.questions,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${JEV_API_KEY}`,
      },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `TypeSafe JEV API request failed (HTTP ${response.status}): ${errorText || response.statusText}`
      );
    }

    const data: TypeSafeSystemOneResponse = await response.json();
    if (data?.usage) {
      console.log(
        `[JEV TypeSafe] Request processed successfully by model ${data.model}. Usage: ${data.usage.input_tokens} input tokens, ${data.usage.output_tokens} output tokens.`
      );
    }
    return data;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(`JEV TypeSafe request timed out after ${TIMEOUT_MS / 1000} seconds`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Evaluates behavioral analytics, habit momentum, and MOVERS protocol adherence using JEV System One.
 */
export async function evaluateProductivityInsightsWithJev(payload: {
  userId: string;
  periodDays: number;
  completedTasksCount: number;
  categoryDistribution: {
    Productivity: number;
    Hydration: number;
    Fitness: number;
    Meditation: number;
    Hygiene: number;
    Creativity: number;
  };
  streakCount: number;
  mostProductiveHour: string;
  totalCoinsEarned: number;
}) {
  const state = {
    userId: payload.userId,
    periodDays: payload.periodDays,
    completedTasksCount: payload.completedTasksCount,
    categoryDistribution: payload.categoryDistribution,
    streakCount: payload.streakCount,
    mostProductiveHour: payload.mostProductiveHour,
    totalCoinsEarned: payload.totalCoinsEarned,
  };

  const questions: Record<string, TypeSafeQuestion> = {
    focusScore: {
      type: 'score',
      instructions:
        'Score overall focus and habit discipline on a 10-point scale where 10 is peak flow state and consistent daily execution.',
      criteria: [
        '0-10 (Minimal)',
        '11-20 (Very Low)',
        '21-30 (Low)',
        '31-40 (Below Average)',
        '41-50 (Moderate)',
        '51-60 (Steady)',
        '61-70 (High Focus)',
        '71-80 (Very High Focus)',
        '81-90 (Exceptional)',
        '91-100 (Peak Flow State)',
      ],
    },
    moversRating: {
      type: 'choice',
      instructions:
        'Classify overall MOVERS protocol adherence tier (Meditation, Oxygenation/Hydration, Visualization/Planning, Exercise/Fitness, Reading/Scribing).',
      criteria: {
        Optimal: 'Flawless balance across all 5 MOVERS pillars with unbroken streak resilience.',
        Strong: 'Active across 4 pillars with consistent execution and habit momentum.',
        Developing: 'Active in 2-3 pillars, showing momentum but needs broader balance.',
        Foundational: 'Active in 0-1 pillar, initiating basic daily routine habits.',
      },
    },
    moversAdherenceScore: {
      type: 'score',
      instructions:
        'Score MOVERS protocol pillar adherence percentage from 0 to 10 based on pillar distribution and consistency.',
      criteria: [
        '0-10%',
        '11-20%',
        '21-30%',
        '31-40%',
        '41-50%',
        '51-60%',
        '61-70%',
        '71-80%',
        '81-90%',
        '91-100%',
      ],
    },
    topStrength: {
      type: 'choice',
      instructions: 'Select the single most prominent behavioral strength from this performance log.',
      criteria: {
        'Deep Work Dominance': 'Significant volume of high-focus deep work tasks completed.',
        'Hydration Rhythm': 'Consistent hydration and recovery checkpoints maintained.',
        'Mindfulness Anchor': 'Dedicates time to meditation, breathing, or mental decompression.',
        'Streak Momentum': 'Maintains daily consistency with an active streak.',
      },
    },
    tacticalSuggestion: {
      type: 'choice',
      instructions: 'Identify the highest-leverage tactical optimization for the upcoming period.',
      criteria: {
        'Hydration Oxygenation Boost': 'Increase water and breathwork pauses between focus blocks.',
        'Morning Primer Protocol': 'Incorporate morning visualization and priority mapping before checking feeds.',
        'Physical Fitness Integration': 'Add dedicated daily movement or recovery stretching.',
        'Evening Scribing & Reading': 'Schedule 15 minutes of reflective writing or reading to wind down.',
        'Peak Hour Sequencing': 'Shift complex problem-solving into peak velocity hours.',
      },
    },
    secondarySuggestion: {
      type: 'choice',
      instructions: 'Select a complementary tactical suggestion.',
      criteria: {
        'Pillar Diversification': 'Broaden daily routine to touch underrepresented MOVERS pillars.',
        'Peak Window Alignment': 'Align high-intensity tasks with peak focus hours.',
        'Micro Break Rhythm': 'Use Pomodoro resets with deep breathwork to maintain stamina.',
      },
    },
    hydrationAdequacy: {
      type: 'noul',
      instructions: 'Does the user exhibit adequate hydration rhythm based on their logged activities?',
    },
  };

  const response = await callTypeSafeSystemOne({ state, questions });
  const answers = response.answers || {};

  // Extract raw focus score and normalize to 0-100
  const rawFocusScore =
    typeof answers.focusScore?.score === 'number'
      ? Math.round(answers.focusScore.score * 10)
      : Math.min(100, Math.round((payload.completedTasksCount / Math.max(1, payload.periodDays)) * 12 + payload.streakCount * 5));
  const focusScore = Math.max(10, Math.min(100, rawFocusScore));

  // Extract MOVERS adherence
  const rawAdherenceScore =
    typeof answers.moversAdherenceScore?.score === 'number'
      ? Math.round(answers.moversAdherenceScore.score * 10)
      : 50;
  const adherenceScore = Math.max(0, Math.min(100, rawAdherenceScore));

  const overallRating = answers.moversRating?.choice || (adherenceScore >= 80 ? 'Optimal' : adherenceScore >= 60 ? 'Strong' : adherenceScore >= 40 ? 'Developing' : 'Foundational');

  // Build strengths list
  const strengths: string[] = [];
  const primaryStrengthChoice = answers.topStrength?.choice;
  if (primaryStrengthChoice === 'Deep Work Dominance') {
    strengths.push(`Deep Work Dominance: Completed ${payload.categoryDistribution.Productivity} high-impact focus sessions.`);
  } else if (primaryStrengthChoice === 'Hydration Rhythm') {
    strengths.push(`Hydration Rhythm: Logged ${payload.categoryDistribution.Hydration} active hydration checkpoints.`);
  } else if (primaryStrengthChoice === 'Mindfulness Anchor') {
    strengths.push(`Mindfulness Anchor: Prioritized mental clarity with ${payload.categoryDistribution.Meditation} meditation blocks.`);
  } else {
    strengths.push(`Streak Momentum: Sustained an active ${payload.streakCount}-day habit streak.`);
  }

  if (payload.mostProductiveHour !== 'None') {
    strengths.push(`Peak cognitive velocity recorded at ${payload.mostProductiveHour}.`);
  }
  if (payload.streakCount >= 3 && !strengths.some((s) => s.includes('streak'))) {
    strengths.push(`Resilient momentum with a ${payload.streakCount}-day daily logging streak.`);
  }

  // Build suggestions list
  const suggestions: string[] = [];
  const primarySugChoice = answers.tacticalSuggestion?.choice;
  if (primarySugChoice === 'Hydration Oxygenation Boost') {
    suggestions.push('Integrate prompt Hydration & Oxygenation breaks between intense focus blocks.');
  } else if (primarySugChoice === 'Morning Primer Protocol') {
    suggestions.push('Incorporate an intentional morning visualization & planning routine before opening communications.');
  } else if (primarySugChoice === 'Physical Fitness Integration') {
    suggestions.push('Add light physical movement or recovery stretching to maintain stamina throughout the day.');
  } else if (primarySugChoice === 'Evening Scribing & Reading') {
    suggestions.push('Schedule 15 minutes of reflective evening scribing or reading to decompress cognitive load.');
  } else {
    suggestions.push(`Sequence demanding cognitive work to align directly with your peak window (${payload.mostProductiveHour}).`);
  }

  const secondarySugChoice = answers.secondarySuggestion?.choice;
  if (secondarySugChoice === 'Pillar Diversification') {
    suggestions.push('Broaden daily schedule to touch all 5 MOVERS pillars for holistic sustainability.');
  } else if (secondarySugChoice === 'Peak Window Alignment') {
    suggestions.push(`Align high-intensity tasks with peak focus hours (${payload.mostProductiveHour}).`);
  } else {
    suggestions.push('Use 5-minute Pomodoro resets with deep breathwork to maintain stamina.');
  }

  const activePillarsCount = [
    payload.categoryDistribution.Meditation > 0,
    payload.categoryDistribution.Hydration > 0,
    payload.categoryDistribution.Productivity > 0,
    payload.categoryDistribution.Fitness > 0,
    payload.categoryDistribution.Creativity > 0,
  ].filter(Boolean).length;

  const summary =
    payload.completedTasksCount > 0
      ? `You completed ${payload.completedTasksCount} focus sessions across ${payload.periodDays} days with an active ${payload.streakCount}-day streak! Your routine balance is rated as ${overallRating} with a focus score of ${focusScore}/100.`
      : `Ready to start tracking. Complete your first focus session to unlock your personalized productivity insights and daily habit breakdown.`;

  // Category breakdown analysis for all 6 disciplines
  const categoryBreakdownAnalysis = [
    {
      category: 'Productivity' as const,
      status: payload.categoryDistribution.Productivity >= 5 ? ('optimal' as const) : payload.categoryDistribution.Productivity >= 2 ? ('balanced' as const) : ('needs_attention' as const),
      insight: payload.categoryDistribution.Productivity >= 5
        ? 'Deep work momentum is thriving with high task volume and strong task follow-through.'
        : payload.categoryDistribution.Productivity >= 2
        ? 'Moderate focus block frequency maintained. Keep single-tasking during peak hours.'
        : 'Deep work blocks underrepresented. Schedule 1-2 uninterrupted priority sessions.',
    },
    {
      category: 'Hydration' as const,
      status: payload.categoryDistribution.Hydration >= 7 ? ('optimal' as const) : payload.categoryDistribution.Hydration >= 3 ? ('balanced' as const) : ('needs_attention' as const),
      insight: payload.categoryDistribution.Hydration >= 7
        ? 'Superb cellular hydration rhythm sustaining steady cognitive energy.'
        : payload.categoryDistribution.Hydration >= 3
        ? 'Consistent water intervals logged. Aim for an additional glass during afternoon lull.'
        : 'Hydration checkpoints missing. Set automatic hydration breaks between focus sessions.',
    },
    {
      category: 'Fitness' as const,
      status: payload.categoryDistribution.Fitness >= 3 ? ('optimal' as const) : payload.categoryDistribution.Fitness >= 1 ? ('balanced' as const) : ('needs_attention' as const),
      insight: payload.categoryDistribution.Fitness >= 3
        ? 'Physical movement and endurance routines are active and well-balanced.'
        : payload.categoryDistribution.Fitness >= 1
        ? 'Physical activity present. Interleave light stretching before deep work blocks.'
        : 'Physical fitness absent. Integrate a 10-minute morning primer walk or mobility circuit.',
    },
    {
      category: 'Meditation' as const,
      status: payload.categoryDistribution.Meditation >= 3 ? ('optimal' as const) : payload.categoryDistribution.Meditation >= 1 ? ('balanced' as const) : ('needs_attention' as const),
      insight: payload.categoryDistribution.Meditation >= 3
        ? 'Mindfulness and box breathing anchors are actively preventing cognitive fatigue.'
        : payload.categoryDistribution.Meditation >= 1
        ? 'Mindfulness blocks present. Use 3-minute breathwork pauses during task switches.'
        : 'Mental reset habits unscheduled. Add 5 minutes of box breathing to prime deep work.',
    },
    {
      category: 'Hygiene' as const,
      status: payload.categoryDistribution.Hygiene >= 3 ? ('optimal' as const) : payload.categoryDistribution.Hygiene >= 1 ? ('balanced' as const) : ('needs_attention' as const),
      insight: payload.categoryDistribution.Hygiene >= 3
        ? 'Personal recovery, dining rhythm, and domestic setup habits are on track.'
        : payload.categoryDistribution.Hygiene >= 1
        ? 'Baseline domestic hygiene habits observed. Ensure dedicated table/bed prep.'
        : 'Domestic discipline checkpoints unscheduled. Log routine wind-down recovery habits.',
    },
    {
      category: 'Creativity' as const,
      status: payload.categoryDistribution.Creativity >= 2 ? ('optimal' as const) : payload.categoryDistribution.Creativity >= 1 ? ('balanced' as const) : ('needs_attention' as const),
      insight: payload.categoryDistribution.Creativity >= 2
        ? 'Creative synthesis and scribing active, balancing analytical problem solving.'
        : payload.categoryDistribution.Creativity >= 1
        ? 'Creative inspiration blocks present. Dedicate 15 minutes to free writing.'
        : 'Creative reflection missing. Schedule a 10-minute evening scribing session.',
    },
  ];

  // Exactly 3 concrete tactical recommendations
  const allRecs = [...suggestions];
  if (allRecs.length < 3) {
    allRecs.push('Sequence demanding cognitive work to align directly with your peak window.');
  }
  if (allRecs.length < 3) {
    allRecs.push('Maintain balanced pacing by interleaving breathwork pauses with execution.');
  }
  const tacticalRecommendations: [string, string, string] = [
    allRecs[0] || 'Focus on single-tasking without multitasking during core hours.',
    allRecs[1] || 'Maintain an unbroken daily hydration and movement cadence.',
    allRecs[2] || 'Schedule an evening reflection block to consolidate cognitive gains.',
  ];

  const headline = `${overallRating} Velocity (${focusScore}/100) • ${adherenceScore}% MOVERS Balance`;

  const alignmentWithMovers = {
    overallRating: overallRating as 'Optimal' | 'Strong' | 'Developing' | 'Foundational',
    adherenceScore,
    feedback:
      overallRating === 'Optimal'
        ? 'Superb balance across all key areas of your daily routine and focus habits.'
        : `Active in ${activePillarsCount} of 5 daily wellness pillars. Consider balancing your schedule with more hydration, breathwork, and light movement.`,
    pillarBreakdown: {
      meditation: payload.categoryDistribution.Meditation > 0 ? 'Active' : 'Unscheduled',
      oxygenationHydration: payload.categoryDistribution.Hydration > 0 ? 'Active' : 'Unscheduled',
      visualizationPlanning: payload.categoryDistribution.Productivity > 0 ? 'Active' : 'Unscheduled',
      exerciseFitness: payload.categoryDistribution.Fitness > 0 ? 'Active' : 'Unscheduled',
      readingScribing: payload.categoryDistribution.Creativity > 0 ? 'Active' : 'Unscheduled',
    },
  };

  return {
    headline,
    productivityScore: focusScore,
    categoryBreakdownAnalysis,
    tacticalRecommendations,
    alignmentWithMovers,
    // Backward compatibility adapters
    summary,
    strengths: strengths.slice(0, 3),
    suggestions: tacticalRecommendations,
    focusScore,
    moversEvaluation: alignmentWithMovers,
    usage: response.usage,
  };
}

/**
 * Evaluates routine balance and harmony using JEV TypeSafe Decision Engine.
 */
export async function evaluateRoutineBalanceWithJev(tasks: Array<{ name: string; duration: number; category?: string }>) {
  const state = {
    totalTasks: tasks.length,
    totalDurationMinutes: tasks.reduce((acc, t) => acc + (t.duration || 0), 0),
    tasks: tasks.map(t => ({ name: t.name, duration: t.duration, category: t.category })),
  };

  const questions: Record<string, TypeSafeQuestion> = {
    balanceScore: {
      type: 'score',
      instructions: 'Score the overall routine balance between deep focus, breaks, and sustainability on a scale from 0 to 10.',
      criteria: ['0-10%', '11-20%', '21-30%', '31-40%', '41-50%', '51-60%', '61-70%', '71-80%', '81-90%', '91-100%'],
    },
    primaryGap: {
      type: 'choice',
      instructions: 'Identify the primary area for routine balance optimization.',
      criteria: {
        'Hydration Pauses': 'Routine lacks regular hydration and oxygenation pauses.',
        'Movement Breaks': 'Routine lacks physical movement or stretching transitions.',
        'Deep Work Blocks': 'Routine is fragmented with too many small tasks.',
        'Evening Wind-down': 'Routine lacks transition into rest and recovery.',
        'Balanced': 'Routine demonstrates healthy pacing and variety.',
      },
    },
    isSustainable: {
      type: 'noul',
      instructions: 'Is this routine sustainable for daily execution without burnout?',
    },
  };

  const response = await callTypeSafeSystemOne({ state, questions });
  return {
    answers: response.answers,
    usage: response.usage,
  };
}

/**
 * Evaluates Reformers League readiness and honor tier using JEV TypeSafe Decision Engine.
 */
export async function evaluateReformerReadinessWithJev(data: {
  reformerName?: string;
  streak: number;
  appAge: number;
  totalTasks: number;
  totalWaterGlasses: number;
  coins: number;
}) {
  const state = {
    reformerName: data.reformerName || 'Reformer',
    currentStreak: data.streak,
    appAgeDays: data.appAge,
    totalTasksCompleted: data.totalTasks,
    totalHydrationGlasses: data.totalWaterGlasses,
    coins: data.coins,
  };

  const questions: Record<string, TypeSafeQuestion> = {
    readinessTier: {
      type: 'choice',
      instructions: 'Evaluate Reformers League rank and honor tier based on streak, longevity, and consistency.',
      criteria: {
        'Apex Reformer': 'Elite accountability (>10 day streak, >20 days app age, high coin reserve)',
        'Vanguard Reformer': 'Strong and steady performer (5-10 day streak, regular logging)',
        'Ascending Reformer': 'Consistent active member (2-4 day streak)',
        'Cadet Reformer': 'New member initiating habit momentum',
      },
    },
    synergyScore: {
      type: 'score',
      instructions: 'Score accountability and co-reformer synergy compatibility from 0 to 10.',
      criteria: ['0-10%', '11-20%', '21-30%', '31-40%', '41-50%', '51-60%', '61-70%', '71-80%', '81-90%', '91-100%'],
    },
    streakResilience: {
      type: 'noul',
      instructions: 'Is this reformer highly likely to maintain their streak through the upcoming week?',
    },
  };

  const response = await callTypeSafeSystemOne({ state, questions });
  return {
    answers: response.answers,
    usage: response.usage,
  };
}

/**
 * Strongly typed inference wrapper for backward-compatibility.
 */
export async function runJevInference<T>(
  prompt: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const questions: Record<string, TypeSafeQuestion> = {
      decision: {
        type: 'choice',
        instructions: prompt.slice(0, 300),
        criteria: {
          Optimal: 'Optimal high performance',
          Strong: 'Strong performance',
          Developing: 'Developing momentum',
          Foundational: 'Foundational baseline',
        },
      },
      confidenceScore: {
        type: 'score',
        instructions: 'Score the overall decision quality from 0 to 10.',
        criteria: ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '81-90', '91-100'],
      },
    };

    const result = await callTypeSafeSystemOne({
      state: prompt,
      questions,
    });

    // Enforce runtime Zod schema parsing with fallback attempts
    const directParse = schema.safeParse(result);
    if (directParse.success) {
      return directParse.data;
    }

    const answersParse = schema.safeParse(result.answers);
    if (answersParse.success) {
      return answersParse.data;
    }

    return schema.parse(result);
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(`JEV TypeSafe inference timed out after ${TIMEOUT_MS / 1000} seconds`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
