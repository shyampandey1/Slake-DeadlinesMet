import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runJevInference, evaluateProductivityInsightsWithJev } from '@/lib/jevClient';

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
}

const InsightsPayloadSchema = z.object({
  userId: z.string().default('anonymous'),
  periodDays: z.number().default(7),
  completedTasksCount: z.number().default(0),
  categoryDistribution: z.object({
    Productivity: z.number().default(0),
    Hydration: z.number().default(0),
    Fitness: z.number().default(0),
    Meditation: z.number().default(0),
    Hygiene: z.number().default(0),
    Creativity: z.number().default(0),
  }).default({
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
});

const InsightsOutputSchema = z.object({
  summary: z.string().describe('A 2-3 sentence summary of recent achievements based on raw metrics and MOVERS protocol.'),
  strengths: z.array(z.string()).describe('Top 2-3 productive patterns identified (specifically mentioning most productive hour or categories).'),
  suggestions: z.array(z.string()).describe('2-3 actionable, highly tactical, specific tips to improve focus or balance (no generic motivational text).'),
  focusScore: z.number().min(0).max(100).describe('A score from 0-100 reflecting focus and consistency.'),
  moversEvaluation: z.object({
    overallRating: z.string().describe('Rating of MOVERS protocol execution (e.g. Optimal, Strong, Developing, Foundational)'),
    adherenceScore: z.number().min(0).max(100).describe('Adherence score to MOVERS pillars'),
    feedback: z.string().describe('Targeted feedback for MOVERS protocol adherence and lifestyle optimization'),
    pillarBreakdown: z.object({
      meditation: z.string(),
      oxygenationHydration: z.string(),
      visualizationPlanning: z.string(),
      exerciseFitness: z.string(),
      readingScribing: z.string(),
    }).optional(),
  }).optional(),
});

export type InsightsOutput = z.infer<typeof InsightsOutputSchema>;

/**
 * Normalizes legacy request payloads ({ tasks, profile, streak }) into standard InsightsPayload format.
 */
function normalizePayload(body: any): InsightsPayload {
  if (body && typeof body.completedTasksCount === 'number' && body.categoryDistribution) {
    return InsightsPayloadSchema.parse(body);
  }

  // Handle legacy payload format
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

  // Calculate most productive hour
  const hourCounts: { [key: number]: number } = {};
  completedTasks.forEach((t: any) => {
    try {
      if (t.createdAt) {
        const hour = new Date(t.createdAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
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
    totalCoinsEarned: body?.totalCoinsEarned || (completedTasksCount * 10),
  };
}

/**
 * Deterministic fallback generator adhering strictly to InsightsOutputSchema.
 */
function generateDeterministicInsights(payload: InsightsPayload): InsightsOutput {
  const {
    completedTasksCount,
    categoryDistribution,
    streakCount,
    mostProductiveHour,
    periodDays,
  } = payload;

  const totalLogged = Object.values(categoryDistribution).reduce((a, b) => a + b, 0);

  // Focus score calculation
  const taskScore = Math.min(40, (completedTasksCount / Math.max(1, periodDays)) * 8);
  const streakScore = Math.min(30, streakCount * 6);
  const activePillars = Object.values(categoryDistribution).filter((v) => v > 0).length;
  const diversityScore = Math.min(30, activePillars * 5);
  const rawFocusScore = Math.round(taskScore + streakScore + diversityScore);
  const focusScore = Math.max(10, Math.min(100, isNaN(rawFocusScore) ? 50 : rawFocusScore));

  // Determine top categories
  const sortedCategories = Object.entries(categoryDistribution).sort(([, a], [, b]) => b - a);
  const topCategory = sortedCategories[0]?.[1] > 0 ? sortedCategories[0][0] : 'Productivity';

  // MOVERS protocol adherence calculation
  // M: Meditation, O: Hydration, V: Productivity, E: Fitness, R/S: Creativity
  const moversPillars = [
    categoryDistribution.Meditation > 0,
    categoryDistribution.Hydration > 0,
    categoryDistribution.Productivity > 0,
    categoryDistribution.Fitness > 0,
    categoryDistribution.Creativity > 0,
  ];
  const moversCount = moversPillars.filter(Boolean).length;
  const adherenceScore = Math.round((moversCount / 5) * 100);

  let overallRating = 'Developing';
  if (adherenceScore >= 80) overallRating = 'Optimal';
  else if (adherenceScore >= 60) overallRating = 'Strong';
  else if (adherenceScore >= 40) overallRating = 'Developing';
  else overallRating = 'Foundational';

  const strengths: string[] = [];
  if (mostProductiveHour !== 'None') {
    strengths.push(`Peak cognitive velocity recorded at ${mostProductiveHour}.`);
  }
  if (topCategory) {
    strengths.push(`High discipline in ${topCategory} (${categoryDistribution[topCategory as keyof typeof categoryDistribution]} tasks logged).`);
  }
  if (streakCount >= 3) {
    strengths.push(`Consistent habit momentum with a ${streakCount}-day active streak.`);
  } else {
    strengths.push(`Completed ${completedTasksCount} focus sessions across ${periodDays} days.`);
  }

  const suggestions: string[] = [];
  if (categoryDistribution.Hydration === 0) {
    suggestions.push('Integrate prompt Hydration & Oxygenation breaks between intense focus blocks.');
  }
  if (categoryDistribution.Meditation === 0) {
    suggestions.push('Add a 5-minute mindfulness or breathing reset before peak working hours to clear cognitive load.');
  }
  if (categoryDistribution.Fitness === 0) {
    suggestions.push('Incorporate light physical movement or recovery stretching to maintain stamina.');
  }
  if (suggestions.length < 2) {
    suggestions.push('Sequence demanding cognitive work to align directly with your peak window.');
    suggestions.push('Maintain balanced pacing by interleaving creative ideation with execution.');
  }

  const summary = completedTasksCount > 0
    ? `Maintained steady execution over the last ${periodDays} days with ${completedTasksCount} tasks completed and a ${streakCount}-day streak. Your routine shows strong affinity for ${topCategory}.`
    : `Ready to initiate high-performance tracking for the upcoming ${periodDays}-day cycle. Schedule your primary anchor habits to jumpstart momentum.`;

  return {
    summary,
    strengths: strengths.slice(0, 3),
    suggestions: suggestions.slice(0, 3),
    focusScore,
    moversEvaluation: {
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
    },
  };
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const payload = normalizePayload(rawBody);

    if (payload.completedTasksCount === 0 && Object.values(payload.categoryDistribution).every((v) => v === 0)) {
      return NextResponse.json({
        summary: "You haven't logged any tasks yet! Start your first focus session to receive personalized JEV TypeSafe insights.",
        strengths: ["Clean slate for the week ahead."],
        suggestions: ["Pick one high-priority anchor task to start with.", "Try a 25-minute Pomodoro session with hydration."],
        focusScore: 0,
        moversEvaluation: {
          overallRating: "Foundational",
          adherenceScore: 0,
          feedback: "Initialize your morning and evening MOVERS routines to build daily adherence.",
        }
      });
    }

    const prompt = `You are the JEV TypeSafe Decision Engine and High-Performance Behavioral Insights Architect for DeadlinesMet.
Analyze the user's behavioral metrics and evaluate their adherence to the MOVERS Protocol (Meditation, Oxygenation/Hydration, Visualization/Planning, Exercise/Fitness, Reading/Scribing/Creativity).

Input Metrics:
- User ID: ${payload.userId}
- Evaluation Period: Last ${payload.periodDays} days
- Completed Tasks: ${payload.completedTasksCount}
- Daily Streak: ${payload.streakCount} days
- Most Productive Hour: ${payload.mostProductiveHour}
- Total Coins Earned: ${payload.totalCoinsEarned}
- Category Distribution:
  * Productivity (Deep Work / Visualization / Planning): ${payload.categoryDistribution.Productivity}
  * Hydration & Oxygenation: ${payload.categoryDistribution.Hydration}
  * Fitness & Exercise: ${payload.categoryDistribution.Fitness}
  * Meditation & Mindfulness: ${payload.categoryDistribution.Meditation}
  * Hygiene & Recovery: ${payload.categoryDistribution.Hygiene}
  * Creativity & Reading/Scribing: ${payload.categoryDistribution.Creativity}

Guidelines:
1. Provide a concise, high-impact summary (2-3 sentences) evaluating their productivity velocity, consistency, and MOVERS balance.
2. Identify 2-3 specific strengths, noting their peak hour (${payload.mostProductiveHour}) and dominant categories.
3. Provide 2-3 actionable, tactical suggestions to optimize underrepresented MOVERS pillars or maintain habit momentum.
4. Calculate a focusScore between 0 and 100 based on completion count, streak resilience, and category diversity.
5. Include a moversEvaluation rating the user's protocol integration (overallRating: Optimal, Strong, Developing, or Foundational; adherenceScore: 0-100; feedback: tactical guidance).`;

    try {
      const inferenceResult = await evaluateProductivityInsightsWithJev(payload);
      return NextResponse.json(inferenceResult);
    } catch (inferenceError: any) {
      console.warn('[JEV TypeSafe] Inference fallback triggered:', inferenceError?.message);
      const fallbackResult = generateDeterministicInsights(payload);
      return NextResponse.json(fallbackResult);
    }
  } catch (error: any) {
    console.error('API Insights Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
