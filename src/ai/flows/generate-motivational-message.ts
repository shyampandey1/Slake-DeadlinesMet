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
  ).optional().describe('An array of past tasks with their duration and completion status.'),
});
export type GenerateMotivationalMessageInput = z.infer<typeof GenerateMotivationalMessageInputSchema>;

const GenerateMotivationalMessageOutputSchema = z.object({
  message: z.string().describe('The generated motivational message.'),
});
export type GenerateMotivationalMessageOutput = z.infer<typeof GenerateMotivationalMessageOutputSchema>;

export async function generateMotivationalMessage(input: GenerateMotivationalMessageInput): Promise<GenerateMotivationalMessageOutput> {
  return generateMotivationalMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMotivationalMessagePrompt',
  input: {schema: GenerateMotivationalMessageInputSchema},
  output: {schema: GenerateMotivationalMessageOutputSchema},
  prompt: `You are a motivational assistant. Your role is to provide encouraging messages to users upon completing tasks. Your tone should be enthusiastic and personal.

  The user has just finished the following task:
  - Task Name: {{{taskName}}}
  - Duration: {{{duration}}} minutes
  - Completion Status: {{#if completionStatus}}Completed successfully! Great work!{{else}}Not completed. That's okay, sometimes things don't go as planned.{{/if}}

  {{#if pastTasks}}
  Here are some of their recent tasks:
  {{#each pastTasks}}
  - Task: {{{taskName}}}, Duration: {{{duration}}} minutes, Status: {{#if completionStatus}}Completed{{else}}Not Completed{{/if}}
  {{/each}}
  {{/if}}

  Based on the task they just finished and their recent history, generate a short (2-3 sentences), personalized, and uplifting motivational message. If they completed the task, celebrate their success. If not, encourage them to try again and not give up. The goal is to make them feel good about their effort and motivated to start their next task.`,
});

const generateMotivationalMessageFlow = ai.defineFlow(
  {
    name: 'generateMotivationalMessageFlow',
    inputSchema: GenerateMotivationalMessageInputSchema,
    outputSchema: GenerateMotivationalMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
