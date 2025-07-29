
'use server';
/**
 * @fileOverview Organizes a user's routine from a natural language description into structured tasks.
 *
 * - organizeRoutine - A function that takes a text description and returns a list of structured tasks.
 * - OrganizeRoutineInput - The input type for the organizeRoutine function.
 * - OrganizeRoutineOutput - The return type for the organizeRoutine function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { UserPresetTask } from '@/types';

const OrganizeRoutineInputSchema = z.object({
  description: z.string().describe('The user\'s description of their daily routine.'),
  availableIcons: z.array(z.string()).describe('A list of available icon names to choose from.'),
  availableCategories: z.array(z.string()).describe('A list of available category names to choose from.'),
});
export type OrganizeRoutineInput = z.infer<typeof OrganizeRoutineInputSchema>;

const OrganizedTaskSchema = z.object({
    name: z.string().describe('The name of the task.'),
    duration: z.number().describe('The estimated duration of the task in minutes.'),
    icon: z.string().describe('The suggested icon name from the available list.'),
    category: z.string().describe('The suggested category from the available list (e.g., "Morning Routine", "Work & Focus").'),
});

const OrganizeRoutineOutputSchema = z.object({
  tasks: z.array(OrganizedTaskSchema).describe('An array of structured tasks extracted from the user\'s description.'),
});
export type OrganizeRoutineOutput = z.infer<typeof OrganizeRoutineOutputSchema>;


export async function organizeRoutine(input: OrganizeRoutineInput): Promise<OrganizeRoutineOutput> {
  return organizeRoutineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'organizeRoutinePrompt',
  input: {schema: OrganizeRoutineInputSchema},
  output: {schema: OrganizeRoutineOutputSchema},
  prompt: `You are an expert at parsing a user's description of their daily routine and converting it into a structured list of tasks with estimated durations, appropriate categories, and icons.

  User's Routine Description:
  "{{{description}}}"

  Your task is to analyze the description and extract each distinct activity. For each activity:
  1.  Give it a concise name.
  2.  Estimate a reasonable duration in minutes.
  3.  Assign it to the most logical category from the available list.
  4.  Assign it the most appropriate icon from the available list.

  Available Icons:
  {{#each availableIcons}}
  - {{{this}}}
  {{/each}}

  Available Categories:
  {{#each availableCategories}}
  - {{{this}}}
  {{/each}}

  Example Input:
  "I wake up and plan my day for about 15 minutes. Then I do a 90-minute deep work session. After that, I check my emails for 15 mins. I take a short 5-minute coffee break."

  Example Output:
  {
    "tasks": [
      { "name": "Plan Day", "duration": 15, "icon": "ListChecks", "category": "Morning Routine" },
      { "name": "Deep Work", "duration": 90, "icon": "BrainCircuit", "category": "Work & Focus" },
      { "name": "Check Emails", "duration": 15, "icon": "Mail", "category": "Work & Focus" },
      { "name": "Short Break", "duration": 5, "icon": "Coffee", "category": "Breaks & Meals" }
    ]
  }

  Generate the structured list of tasks based on the user's routine description provided.
  `,
});

const organizeRoutineFlow = ai.defineFlow(
  {
    name: 'organizeRoutineFlow',
    inputSchema: OrganizeRoutineInputSchema,
    outputSchema: OrganizeRoutineOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      return output!;
    } catch(e) {
      console.error("AI call for routine organization failed", e);
      // Return an empty list of tasks in case of failure
      return { tasks: [] };
    }
  }
);
