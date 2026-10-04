'use server';

import { z } from 'zod';
import { runJevInference, evaluateProductivityInsightsWithJev } from '@/lib/jevClient';

export const ProductivityInsightsInputSchema = z.object({
  tasks: z.array(z.object({
    name: z.string(),
    duration: z.number(),
    completed: z.boolean(),
    category: z.string().optional(),
    createdAt: z.string().optional(),
  })),
  profile: z.string().optional(),
  streak: z.any().optional(),
});

export type ProductivityInsightsInput = z.infer<typeof ProductivityInsightsInputSchema>;

export const ProductivityInsightsOutputSchema = z.object({
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

export type ProductivityInsightsOutput = z.infer<typeof ProductivityInsightsOutputSchema>;

export async function getProductivityInsights(input: ProductivityInsightsInput): Promise<ProductivityInsightsOutput> {
  const tasks = input.tasks || [];
  if (tasks.length === 0) {
    return {
      summary: "You haven't logged any tasks yet! Start your first focus session to receive personalized JEV TypeSafe insights.",
      strengths: ["Clean slate for the week."],
      suggestions: ["Pick one high-priority anchor task to start with.", "Try a 25-minute Pomodoro session with hydration."],
      focusScore: 0,
      moversEvaluation: {
        overallRating: "Foundational",
        adherenceScore: 0,
        feedback: "Start your morning and evening MOVERS routines to build daily momentum.",
      }
    };
  }

  const prompt = `You are the JEV TypeSafe Decision Engine and High-Performance Behavioral Insights Architect.
Analyze the user task log and evaluate MOVERS Protocol adherence (Meditation, Oxygenation/Hydration, Visualization/Planning, Exercise/Fitness, Reading/Scribing):
Task Log: ${JSON.stringify(tasks)}
User Profile: ${input.profile || 'General'}

Provide:
1. summary (2-3 sentences)
2. strengths (2-3 items)
3. suggestions (2-3 items)
4. focusScore (0-100)
5. moversEvaluation (overallRating, adherenceScore: 0-100, feedback)`;

  const catCounts: { [key: string]: number } = {
    Productivity: 0,
    Hydration: 0,
    Fitness: 0,
    Meditation: 0,
    Hygiene: 0,
    Creativity: 0,
  };
  tasks.forEach(t => {
    const c = t.category || 'Productivity';
    if (c in catCounts) {
      catCounts[c]++;
    } else {
      catCounts.Productivity++;
    }
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const streakCount = input.streak?.currentStreak || 0;

  const payload = {
    userId: 'current-user',
    periodDays: 7,
    completedTasksCount: completedCount,
    categoryDistribution: catCounts as any,
    streakCount,
    mostProductiveHour: 'None',
    totalCoinsEarned: completedCount * 10,
  };

  try {
    return await evaluateProductivityInsightsWithJev(payload);
  } catch (error: any) {
    console.warn("JEV TypeSafe Flow Inference Fallback:", error?.message);

    const totalTime = tasks.reduce((acc, t) => acc + (t.duration || 0), 0);
    const completedCount = tasks.filter(t => t.completed).length;
    let focusScore = Math.min(100, Math.round((completedCount / (tasks.length || 1)) * 60 + (totalTime / 120) * 40));

    const catCounts: { [key: string]: number } = {};
    tasks.forEach(t => {
      const c = t.category || "General";
      catCounts[c] = (catCounts[c] || 0) + 1;
    });
    const topCat = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a])[0] || "Productivity";

    const summary = completedCount === tasks.length
      ? "Flawless execution! You completed every task in your active focus schedule."
      : `Solid consistency. You logged ${totalTime} minutes of focus across ${completedCount} completed tasks.`;

    const strengths = [
      `Dedicated significant focus towards ${topCat}.`,
      completedCount > 3 ? "Excellent volume of task completions." : "Good foundational tracking habits."
    ];
    const suggestions = [
      "Sequence your hardest tasks during your peak cognitive window.",
      "Integrate 5-minute hydration and breathwork resets after every 30 minutes of deep focus."
    ];

    return {
      summary,
      strengths,
      suggestions,
      focusScore: isNaN(focusScore) ? 50 : focusScore,
      moversEvaluation: {
        overallRating: completedCount > 4 ? "Strong" : "Developing",
        adherenceScore: Math.min(100, Math.round((completedCount / (tasks.length || 1)) * 90)),
        feedback: "Continue reinforcing morning primer and evening restorer protocols.",
      }
    };
  }
}
