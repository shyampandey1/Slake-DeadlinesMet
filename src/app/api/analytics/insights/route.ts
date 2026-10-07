import { NextResponse } from 'next/server';
import { z } from 'zod';
import { callTypeSafeSystemOne, TypeSafeQuestion } from '@/lib/jevClient';

export interface InsightsPayload {
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
  dropOffTimestamps?: string[];
  streakDelta?: number;
}

const InsightsPayloadSchema = z.object({
  userId: z.string().default('anonymous'),
  periodDays: z.number().default(7),
  completedTasksCount: z.number().default(0),
  categoryDistribution: z
    .object({
      Productivity: z.number().default(0),
      Hydration: z.number().default(0),
      Fitness: z.number().default(0),
      Meditation: z.number().default(0),
      Hygiene: z.number().default(0),
      Creativity: z.number().default(0),
    })
    .default({
      Productivity: 0,
      Hydration: 0,
      Fitness: 0,
      Meditation: 0,
      Hygiene: 0,
      Creativity: 0,
    }),
  streakCount: z.number().default(0),
  mostProductiveHour: z.string().default('None'),
  totalCoinsEarned: z.number().default(0),
  dropOffTimestamps: z.array(z.string()).optional(),
  streakDelta: z.number().optional(),
});

const InsightsOutputSchema = z.object({
  headline: z.string(),
  productivityScore: z.number().min(0).max(100),
  categoryBreakdownAnalysis: z.array(
    z.object({
      category: z.enum(['Productivity', 'Hydration', 'Fitness', 'Meditation', 'Hygiene', 'Creativity']),
      status: z.enum(['optimal', 'balanced', 'needs_attention']),
      insight: z.string(),
    })
  ),
  tacticalRecommendations: z.array(z.string()).length(3),
  alignmentWithMovers: z.object({
    overallRating: z.enum(['Optimal', 'Strong', 'Developing', 'Foundational']),
    adherenceScore: z.number().min(0).max(100),
    feedback: z.string(),
    pillarBreakdown: z.object({
      meditation: z.string(),
      oxygenationHydration: z.string(),
      visualizationPlanning: z.string(),
      exerciseFitness: z.string(),
      readingScribing: z.string(),
    }),
  }),
  summary: z.string(),
  strengths: z.array(z.string()),
  suggestions: z.array(z.string()),
  focusScore: z.number().min(0).max(100),
  moversEvaluation: z.any().optional(),
});

export type InsightsOutput = z.infer<typeof InsightsOutputSchema>;

/**
 * Normalizes incoming request payloads into standard InsightsPayload
 */
function normalizePayload(body: any): InsightsPayload {
  if (body && typeof body.completedTasksCount === 'number' && body.categoryDistribution) {
    return InsightsPayloadSchema.parse(body);
  }

  const tasks = Array.isArray(body?.tasks) ? body.tasks : [];
  const streak = body?.streak || {};
  const completedTasks = tasks.filter((t: any) => t.completed);
  const completedTasksCount = completedTasks.length;

  const categoryDistribution = {
    Productivity: 0,
    Hydration: 0,
    Fitness: 0,
    Meditation: 0,
    Hygiene: 0,
    Creativity: 0,
  };

  tasks.forEach((t: any) => {
    const cat = t.category || 'Productivity';
    if (cat in categoryDistribution) {
      categoryDistribution[cat as keyof typeof categoryDistribution]++;
    } else {
      categoryDistribution.Productivity++;
    }
  });

  const hourCounts: { [key: number]: number } = {};
  const dropOffTimestamps: string[] = [];

  completedTasks.forEach((t: any) => {
    try {
      if (t.createdAt) {
        const d = new Date(t.createdAt);
        const hour = d.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        if (hour >= 14 && hour <= 16) {
          dropOffTimestamps.push(d.toISOString());
        }
      }
    } catch {}
  });

  let mostProductiveHour = 'None';
  let maxHourCount = 0;
  Object.keys(hourCounts).forEach((h) => {
    const hourNum = parseInt(h, 10);
    if (hourCounts[hourNum] > maxHourCount) {
      maxHourCount = hourCounts[hourNum];
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
      mostProductiveHour = `${displayHour} ${ampm}`;
    }
  });

  return {
    userId: body?.userId || 'user',
    periodDays: typeof body?.periodDays === 'number' ? body.periodDays : 7,
    completedTasksCount,
    categoryDistribution,
    streakCount: streak.currentStreak || body?.streakCount || 0,
    mostProductiveHour: body?.mostProductiveHour || mostProductiveHour,
    totalCoinsEarned: body?.totalCoinsEarned || completedTasksCount * 10,
    dropOffTimestamps: dropOffTimestamps.slice(0, 5),
    streakDelta: streak.currentStreak ? Math.min(7, streak.currentStreak) : 1,
  };
}

/**
 * Deterministic calculation fallback adhering strictly to InsightsOutputSchema
 */
function generateDeterministicInsights(payload: InsightsPayload): InsightsOutput {
  const {
    completedTasksCount,
    categoryDistribution,
    streakCount,
    mostProductiveHour,
    periodDays,
  } = payload;

  const taskScore = Math.min(40, (completedTasksCount / Math.max(1, periodDays)) * 8);
  const streakScore = Math.min(30, streakCount * 6);
  const activePillars = Object.values(categoryDistribution).filter((v) => v > 0).length;
  const diversityScore = Math.min(30, activePillars * 5);
  const rawFocusScore = Math.round(taskScore + streakScore + diversityScore);
  const productivityScore = Math.max(10, Math.min(100, isNaN(rawFocusScore) ? 50 : rawFocusScore));

  const sortedCategories = Object.entries(categoryDistribution).sort(([, a], [, b]) => b - a);
  const topCategory = sortedCategories[0]?.[1] > 0 ? sortedCategories[0][0] : 'Productivity';

  const moversPillars = [
    categoryDistribution.Meditation > 0,
    categoryDistribution.Hydration > 0,
    categoryDistribution.Productivity > 0,
    categoryDistribution.Fitness > 0,
    categoryDistribution.Creativity > 0,
  ];
  const moversCount = moversPillars.filter(Boolean).length;
  const adherenceScore = Math.round((moversCount / 5) * 100);

  let overallRating: 'Optimal' | 'Strong' | 'Developing' | 'Foundational' = 'Developing';
  if (adherenceScore >= 80) overallRating = 'Optimal';
  else if (adherenceScore >= 60) overallRating = 'Strong';
  else if (adherenceScore >= 40) overallRating = 'Developing';
  else overallRating = 'Foundational';

  const strengths: string[] = [];
  if (mostProductiveHour !== 'None') {
    strengths.push(`Peak cognitive velocity recorded at ${mostProductiveHour}.`);
  }
  strengths.push(
    `High discipline in ${topCategory} (${categoryDistribution[topCategory as keyof typeof categoryDistribution]} tasks logged).`
  );
  strengths.push(
    streakCount >= 3
      ? `Consistent habit momentum with a ${streakCount}-day active streak.`
      : `Completed ${completedTasksCount} focus sessions across ${periodDays} days.`
  );

  const tacticalRecommendations: [string, string, string] = [
    categoryDistribution.Hydration < 7
      ? 'Integrate prompt 2-minute Hydration breaks between high-intensity focus sessions.'
      : 'Maintain steady cellular hydration throughout deep work blocks.',
    categoryDistribution.Meditation < 3
      ? 'Schedule a 5-minute box breathing or mindfulness reset before your peak focus window.'
      : 'Continue using breathwork to clear mental clutter before task switching.',
    categoryDistribution.Fitness < 3
      ? 'Incorporate 15 minutes of physical movement or mobility stretching to prevent cognitive fatigue.'
      : `Sequence demanding problem-solving to align directly with your peak window (${mostProductiveHour}).`,
  ];

  const categoryBreakdownAnalysis: InsightsOutput['categoryBreakdownAnalysis'] = [
    {
      category: 'Productivity',
      status: categoryDistribution.Productivity >= 5 ? 'optimal' : categoryDistribution.Productivity >= 2 ? 'balanced' : 'needs_attention',
      insight: categoryDistribution.Productivity >= 5 ? 'High cognitive velocity and strong focus session execution.' : 'Deep work volume could be enhanced with an extra focus block.',
    },
    {
      category: 'Hydration',
      status: categoryDistribution.Hydration >= 7 ? 'optimal' : categoryDistribution.Hydration >= 3 ? 'balanced' : 'needs_attention',
      insight: categoryDistribution.Hydration >= 7 ? 'Optimal hydration intervals logged throughout the day.' : 'Hydration reminders needed between demanding sessions.',
    },
    {
      category: 'Fitness',
      status: categoryDistribution.Fitness >= 3 ? 'optimal' : categoryDistribution.Fitness >= 1 ? 'balanced' : 'needs_attention',
      insight: categoryDistribution.Fitness >= 3 ? 'Physical stamina and exercise routines are active.' : 'Incorporate light movement or recovery stretching.',
    },
    {
      category: 'Meditation',
      status: categoryDistribution.Meditation >= 3 ? 'optimal' : categoryDistribution.Meditation >= 1 ? 'balanced' : 'needs_attention',
      insight: categoryDistribution.Meditation >= 3 ? 'Mental decompression and box breathing anchors maintained.' : 'Add a 3-minute breathwork reset before peak focus.',
    },
    {
      category: 'Hygiene',
      status: categoryDistribution.Hygiene >= 3 ? 'optimal' : categoryDistribution.Hygiene >= 1 ? 'balanced' : 'needs_attention',
      insight: categoryDistribution.Hygiene >= 3 ? 'Healthy personal recovery and domestic setup rhythm.' : 'Maintain regular table and sleep environment preparation.',
    },
    {
      category: 'Creativity',
      status: categoryDistribution.Creativity >= 2 ? 'optimal' : categoryDistribution.Creativity >= 1 ? 'balanced' : 'needs_attention',
      insight: categoryDistribution.Creativity >= 2 ? 'Creative synthesis active alongside analytical tasks.' : 'Dedicate 15 minutes to reflective scribing.',
    },
  ];

  const alignmentWithMovers = {
    overallRating,
    adherenceScore,
    feedback: adherenceScore >= 80
      ? 'Superb integration across all key MOVERS protocol pillars.'
      : `Active in ${moversCount} of 5 MOVERS protocol pillars. Focus on expanding hydration, breathing, and movement routines.`,
    pillarBreakdown: {
      meditation: categoryDistribution.Meditation > 0 ? 'Active' : 'Unscheduled',
      oxygenationHydration: categoryDistribution.Hydration > 0 ? 'Active' : 'Unscheduled',
      visualizationPlanning: categoryDistribution.Productivity > 0 ? 'Active' : 'Unscheduled',
      exerciseFitness: categoryDistribution.Fitness > 0 ? 'Active' : 'Unscheduled',
      readingScribing: categoryDistribution.Creativity > 0 ? 'Active' : 'Unscheduled',
    },
  };

  const headline = `${overallRating} Discipline (${productivityScore}/100) • ${adherenceScore}% MOVERS Balance`;
  const summary = `Maintained steady execution over the last ${periodDays} days with ${completedTasksCount} tasks completed and a ${streakCount}-day streak.`;

  return {
    headline,
    productivityScore,
    categoryBreakdownAnalysis,
    tacticalRecommendations,
    alignmentWithMovers,
    summary,
    strengths: strengths.slice(0, 3),
    suggestions: tacticalRecommendations,
    focusScore: productivityScore,
    moversEvaluation: alignmentWithMovers,
  };
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const payload = normalizePayload(rawBody);

    if (payload.completedTasksCount === 0 && Object.values(payload.categoryDistribution).every((v) => v === 0)) {
      return NextResponse.json({
        headline: 'Foundational Tracking • Ready to Ignite',
        productivityScore: 0,
        categoryBreakdownAnalysis: [
          { category: 'Productivity', status: 'needs_attention', insight: 'Schedule your first deep work session.' },
          { category: 'Hydration', status: 'needs_attention', insight: 'Log 8 glasses of water daily.' },
          { category: 'Fitness', status: 'needs_attention', insight: 'Add a 15-minute movement routine.' },
          { category: 'Meditation', status: 'needs_attention', insight: 'Add a 5-minute breathing reset.' },
          { category: 'Hygiene', status: 'needs_attention', insight: 'Complete bed making and desk setup.' },
          { category: 'Creativity', status: 'needs_attention', insight: 'Incorporate reflective scribing.' },
        ],
        tacticalRecommendations: [
          'Pick one high-priority anchor task to start today.',
          'Start a 25-minute Pomodoro session with hydration.',
          'Complete 4-minute box breathing to center mental focus.',
        ],
        alignmentWithMovers: {
          overallRating: 'Foundational',
          adherenceScore: 0,
          feedback: 'Initialize your morning and evening MOVERS routines to build daily adherence.',
          pillarBreakdown: {
            meditation: 'Unscheduled',
            oxygenationHydration: 'Unscheduled',
            visualizationPlanning: 'Unscheduled',
            exerciseFitness: 'Unscheduled',
            readingScribing: 'Unscheduled',
          },
        },
        summary: "You haven't logged any tasks yet! Complete your first focus session to receive personalized insights.",
        strengths: ['Clean slate for the week ahead.'],
        suggestions: [
          'Pick one high-priority anchor task to start with.',
          'Try a 25-minute Pomodoro session with hydration.',
          'Complete 4-minute box breathing.',
        ],
        focusScore: 0,
        moversEvaluation: {
          overallRating: 'Foundational',
          adherenceScore: 0,
          feedback: 'Initialize your morning and evening MOVERS routines to build daily adherence.',
        },
      });
    }

    try {
      // 1. Inject full 7-day completion payload into JEV SystemOne using dynamic score & noul primitives
      const state = {
        userId: payload.userId,
        periodDays: payload.periodDays,
        completedTasksCount: payload.completedTasksCount,
        categoryDistribution: payload.categoryDistribution,
        streakCount: payload.streakCount,
        mostProductiveHour: payload.mostProductiveHour,
        totalCoinsEarned: payload.totalCoinsEarned,
        dropOffTimestamps: payload.dropOffTimestamps,
        streakDelta: payload.streakDelta,
      };

      const questions: Record<string, TypeSafeQuestion> = {
        productivityScore: {
          type: 'score',
          instructions:
            'Score the user’s weekly productivity velocity from 0 to 10 based on task completions, streak compounding, and circadian rhythm alignment.',
          criteria: [
            '0-2 (Dormant)',
            '3-5 (Steady)',
            '6-8 (High Flow Velocity)',
            '9-10 (Elite Performance)',
          ],
        },
        moversAdherenceScore: {
          type: 'score',
          instructions:
            'Score MOVERS protocol balance across all 5 core pillars from 0 to 10.',
          criteria: [
            '0-3 (Narrow Focus)',
            '4-6 (Moderate Balance)',
            '7-8 (Strong Synergy)',
            '9-10 (Comprehensive Mastery)',
          ],
        },
        isHydrationOptimal: {
          type: 'noul',
          instructions: 'Does the user maintain optimal cellular hydration rhythm based on their logged activity?',
        },
        isCircadianAligned: {
          type: 'noul',
          instructions: 'Are core tasks concentrated during the user peak productive hour?',
        },
        needsPhysicalIntervention: {
          type: 'noul',
          instructions: 'Does the routine lack sufficient physical fitness or movement recovery?',
        },
      };

      const jevResponse = await callTypeSafeSystemOne({ state, questions });
      const answers = jevResponse.answers || {};

      const rawProdScore =
        typeof answers.productivityScore?.score === 'number'
          ? Math.round(answers.productivityScore.score * 10)
          : null;

      const rawAdherenceScore =
        typeof answers.moversAdherenceScore?.score === 'number'
          ? Math.round(answers.moversAdherenceScore.score * 10)
          : null;

      // Deterministic baseline for fallback field enrichment
      const baseline = generateDeterministicInsights(payload);

      const productivityScore = rawProdScore !== null ? Math.max(10, Math.min(100, rawProdScore)) : baseline.productivityScore;
      const adherenceScore = rawAdherenceScore !== null ? Math.max(0, Math.min(100, rawAdherenceScore)) : baseline.alignmentWithMovers.adherenceScore;

      let overallRating: 'Optimal' | 'Strong' | 'Developing' | 'Foundational' = 'Developing';
      if (adherenceScore >= 80) overallRating = 'Optimal';
      else if (adherenceScore >= 60) overallRating = 'Strong';
      else if (adherenceScore >= 40) overallRating = 'Developing';
      else overallRating = 'Foundational';

      const headline = `${overallRating} Discipline (${productivityScore}/100) • ${adherenceScore}% MOVERS Balance`;

      const result: InsightsOutput = {
        headline,
        productivityScore,
        categoryBreakdownAnalysis: baseline.categoryBreakdownAnalysis,
        tacticalRecommendations: baseline.tacticalRecommendations,
        alignmentWithMovers: {
          overallRating,
          adherenceScore,
          feedback: baseline.alignmentWithMovers.feedback,
          pillarBreakdown: baseline.alignmentWithMovers.pillarBreakdown,
        },
        summary: `JEV SystemOne evaluated ${payload.completedTasksCount} focus sessions across ${payload.periodDays} days with ${adherenceScore}% MOVERS adherence. Velocity score: ${productivityScore}/100.`,
        strengths: baseline.strengths,
        suggestions: baseline.tacticalRecommendations,
        focusScore: productivityScore,
        moversEvaluation: {
          overallRating,
          adherenceScore,
          feedback: baseline.alignmentWithMovers.feedback,
        },
      };

      return NextResponse.json(InsightsOutputSchema.parse(result));
    } catch (inferenceError: any) {
      console.warn('[JEV TypeSafe Insights] Inference fallback to deterministic:', inferenceError?.message);
      const fallbackResult = generateDeterministicInsights(payload);
      return NextResponse.json(InsightsOutputSchema.parse(fallbackResult));
    }
  } catch (error: any) {
    console.error('API Insights Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
