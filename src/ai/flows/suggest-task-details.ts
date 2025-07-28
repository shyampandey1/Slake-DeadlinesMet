'use server';
/**
 * @fileOverview Suggests details for a task (icon, category, duration) based on its name.
 *
 * - suggestTaskDetails - A function that suggests details for a task.
 * - SuggestTaskDetailsInput - The input type for the function.
 * - SuggestTaskDetailsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTaskDetailsInputSchema = z.object({
  taskName: z.string().describe('The name of the task.'),
  availableIcons: z.array(z.string()).describe('A list of available icon names to choose from.'),
  availableCategories: z.array(z.string()).describe('A list of available category names to choose from.'),
});
export type SuggestTaskDetailsInput = z.infer<typeof SuggestTaskDetailsInputSchema>;

const SuggestTaskDetailsOutputSchema = z.object({
  iconName: z.string().describe('The suggested icon name from the available list.'),
  category: z.string().describe('The suggested category from the available list.'),
  duration: z.number().describe('The suggested duration in minutes (e.g., 5, 15, 30, 60).'),
});
export type SuggestTaskDetailsOutput = z.infer<typeof SuggestTaskDetailsOutputSchema>;

export async function suggestTaskDetails(input: SuggestTaskDetailsInput): Promise<SuggestTaskDetailsOutput> {
  return suggestTaskDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskDetailsPrompt',
  input: {schema: SuggestTaskDetailsInputSchema},
  output: {schema: SuggestTaskDetailsOutputSchema},
  prompt: `You are an expert at categorizing tasks and assigning visual identifiers and estimating time.
  Based on the task name provided by the user, select the most appropriate icon, category, and a sensible duration in minutes.

  Task Name: {{{taskName}}}

  Available Icons:
  {{#each availableIcons}}
  - {{{this}}}
  {{/each}}

  Available Categories:
  {{#each availableCategories}}
  - {{{this}}}
  {{/each}}
  
  Your response should only contain the single best suggestion for each field.
  - iconName: The best icon from the provided list.
  - category: The best category from the provided list.
  - duration: A reasonable time in minutes for the task. Default to 25 if unsure.

  Example 1:
  Task Name: "Read a chapter of a book"
  Expected output: { "iconName": "BookOpen", "category": "Evening Wind-down", "duration": 30 }
  
  Example 2:
  Task Name: "Morning run"
  Expected output: { "iconName": "Footprints", "category": "Health & Wellness", "duration": 30 }

  Example 3:
  Task Name: "Reply to important emails"
  Expected output: { "iconName": "Mail", "category": "Work & Focus", "duration": 25 }
  `,
});

const suggestTaskDetailsFlow = ai.defineFlow(
  {
    name: 'suggestTaskDetailsFlow',
    inputSchema: SuggestTaskDetailsInputSchema,
    outputSchema: SuggestTaskDetailsOutputSchema,
  },
  async input => {
    if (!input.taskName.trim()) {
        return { iconName: 'BrainCircuit', category: 'Work & Focus', duration: 25 };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
