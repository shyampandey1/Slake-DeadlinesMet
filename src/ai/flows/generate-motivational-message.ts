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
  prompt: `You are a motivational assistant. Your role is to provide encouraging messages to users upon completing tasks.

  Task Name: {{{taskName}}}
  Duration: {{{duration}}} minutes
  Completion Status: {{#if completionStatus}}Completed successfully{{else}}Not completed{{/if}}

  {{#if pastTasks}}
  Past Tasks:
  {{#each pastTasks}}
  - Task: {{{taskName}}}, Duration: {{{duration}}} minutes, Status: {{#if completionStatus}}Completed{{else}}Not Completed{{/if}}
  {{/each}}
  {{/if}}

  Generate a personalized motivational message based on the task and their past tasks to encourage the user to continue using the app.`,
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
