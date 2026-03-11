
'use server';
/**
 * @fileOverview Generates a motivational message upon task completion using AI, incorporating task history and completion status.
 *
 * - generateMotivationalMessage - A function that generates a motivational message.
 * - GenerateMotivationalMessageInput - The input type for the generateMotivationalMessage function.
 * - GenerateMotivationalMessageOutput - The return type for the generateMotivationalMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {gemini15Flash} from '@genkit-ai/googleai';

const GenerateMotivationalMessageInputSchema = z.object({
  taskName: z.string().describe('The name of the completed task.'),
  duration: z.number().describe('The duration of the task in minutes.'),
  completionStatus: z.boolean().describe('Whether the task was completed successfully.'),
  pastTasks: z.array(
    z.object({
      taskName: z.string(),
      duration: z.number(),
      completionStatus: z.boolean(),
    })
  ).optional().describe('An array of the last 5 completed tasks for context.'),
  userRoutine: z.array(z.object({
    name: z.string(),
    duration: z.number(),
    icon: z.string(),
    category: z.string(),
    order: z.number().optional(),
  })).optional().describe('The user\'s full routine for the day, sorted in order.'),
});
export type GenerateMotivationalMessageInput = z.infer<typeof GenerateMotivationalMessageInputSchema>;

const GenerateMotivationalMessageOutputSchema = z.object({
  message: z.string().describe('The generated motivational message.'),
  suggestedNextTask: z.string().optional().describe('A suggested next task based on the completed task and history.'),
});
export type GenerateMotivationalMessageOutput = z.infer<typeof GenerateMotivationalMessageOutputSchema>;

export async function generateMotivationalMessage(input: GenerateMotivationalMessageInput): Promise<GenerateMotivationalMessageOutput> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      message: "AI Error: GEMINI_API_KEY is missing in environment. Please check .env.local.",
      suggestedNextTask: undefined
    };
  }

  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `You are an enthusiastic motivational assistant. Let's celebrate. 
      Task: ${input.taskName} 
      Duration: ${input.duration} mins. 
      Generate a short, personal message (2 sentences) and suggest a next task based on their routine or the completed task name.
      User Routine: ${JSON.stringify(input.userRoutine || [])}
      Past Tasks: ${JSON.stringify(input.pastTasks || [])}`,
      output: {
        schema: GenerateMotivationalMessageOutputSchema
      }
    });

    return output!;
  } catch (error: any) {
    console.error("AI Generation Detailed Error:", error);
    return {
      message: `AI Connection Error: ${error.message || 'fetch failed'}. Please ensure you have internet access and the API key is active.`,
      suggestedNextTask: undefined
    };
  }
}
