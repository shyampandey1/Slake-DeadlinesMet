
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { gemini15Flash } from '@genkit-ai/googleai';

const ProductivityInsightsInputSchema = z.object({
  tasks: z.array(z.object({
    name: z.string(),
    duration: z.number(),
    completed: z.boolean(),
    category: z.string().optional(),
    createdAt: z.string().optional(),
  })),
  profile: z.string().optional(),
});

export type ProductivityInsightsInput = z.infer<typeof ProductivityInsightsInputSchema>;

const ProductivityInsightsOutputSchema = z.object({
  summary: z.string().describe('A 2-3 sentence summary of recent achievements.'),
  strengths: z.array(z.string()).describe('Top 2-3 productive patterns identified.'),
  suggestions: z.array(z.string()).describe('2-3 actionable tips to improve focus or balance.'),
  focusScore: z.number().min(0).max(100).describe('A score from 0-100 reflecting focus and consistency.'),
});

export type ProductivityInsightsOutput = z.infer<typeof ProductivityInsightsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'productivityInsightsPrompt',
  input: { schema: ProductivityInsightsInputSchema },
  output: { schema: ProductivityInsightsOutputSchema },
  prompt: `You are a world-class productivity coach and high-performance expert.
  Analyze the provided task log for a user with the profile: {{{profile}}}.
  
  Task Log:
  {{#each tasks}}
  - Task: "{{{name}}}", Duration: {{{duration}}}m, Completed: {{{completed}}}, Category: {{{category}}}
  {{/each}}

  Based on this data:
  1. Provide a concise, encouraging 2-3 sentence summary of their recent efforts.
  2. Identify 2-3 clear strengths or positive patterns in their workflow.
  3. Offer 2-3 highly actionable, specific suggestions to improve their focus, routine, or work-life balance.
  4. Calculate a "Focus Score" (0-100) based on task completion rate, total focused time, and category variety.

  Keep your tone professional, motivational, and insight-driven. If there are no tasks, encourage them to start their first session.
  `,
});

export async function getProductivityInsights(input: ProductivityInsightsInput): Promise<ProductivityInsightsOutput> {
  if (input.tasks.length === 0) {
    return {
      summary: "You haven't logged any tasks yet! Start your first focus session to receive personalized insights.",
      strengths: ["Clean slate for the week."],
      suggestions: ["Pick one high-priority task to start with.", "Try a 25-minute Pomodoro session."],
      focusScore: 0
    };
  }

  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `You are a world-class productivity coach. Analyze the user task log:
      
      Task Log: ${JSON.stringify(input.tasks)}
      User Profile: ${input.profile || 'General'}
      
      Provide a summary, strengths, suggestions, and a focus score (0-100).`,
      output: {
        schema: ProductivityInsightsOutputSchema
      }
    });

    return output!;
  } catch (error: any) {
    console.error("AI Insights Error:", error.name, error.message);
    return {
      summary: "We couldn't generate insights right now, but your dedication is noted.",
      strengths: ["Consistency in tracking."],
      suggestions: ["Review your Log Book manually for trends."],
      focusScore: 50
    };
  }
}
