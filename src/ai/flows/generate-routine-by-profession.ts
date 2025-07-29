'use server';
/**
 * @fileOverview Generates a structured daily routine based on a user's profession.
 *
 * - generateRoutineByProfession - A function that takes a profession and returns a structured list of tasks.
 * - GenerateRoutineByProfessionInput - The input type for the function.
 * - GenerateRoutineByProfessionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRoutineByProfessionInputSchema = z.object({
  profession: z.string().describe("The user's profession (e.g., 'Doctor', 'Artist', 'Teacher')."),
  availableIcons: z.array(z.string()).describe('A list of available icon names to choose from.'),
  availableCategories: z.array(z.string()).describe('A list of available category names to choose from.'),
});
export type GenerateRoutineByProfessionInput = z.infer<typeof GenerateRoutineByProfessionInputSchema>;

const OrganizedTaskSchema = z.object({
    name: z.string().describe('The name of the task.'),
    duration: z.number().describe('The estimated duration of the task in minutes.'),
    icon: z.string().describe('The suggested icon name from the available list.'),
    category: z.string().describe('The suggested category from the available list (e.g., "Morning Routine", "Work & Focus").'),
});

const GenerateRoutineByProfessionOutputSchema = z.object({
  tasks: z.array(OrganizedTaskSchema).describe('An array of structured tasks generated for the specified profession.'),
});
export type GenerateRoutineByProfessionOutput = z.infer<typeof GenerateRoutineByProfessionOutputSchema>;


export async function generateRoutineByProfession(input: GenerateRoutineByProfessionInput): Promise<GenerateRoutineByProfessionOutput> {
  return generateRoutineByProfessionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRoutineByProfessionPrompt',
  input: {schema: GenerateRoutineByProfessionInputSchema},
  output: {schema: GenerateRoutineByProfessionOutputSchema},
  prompt: `You are an expert productivity coach who creates tailored daily routines for various professions.

  Profession: {{{profession}}}

  Your task is to generate a comprehensive and structured daily routine for this profession. The routine should be broken down into logical categories and individual tasks with realistic durations.

  1.  **Analyze the Profession**: Consider the typical daily activities, responsibilities, and work patterns of a {{{profession}}}.
  2.  **Structure the Routine**: Create a full-day schedule, starting from the morning and ending in the evening.
  3.  **Define Tasks**: For each part of the day, define specific, actionable tasks.
  4.  **Estimate Durations**: Assign a reasonable duration in minutes for each task.
  5.  **Categorize**: Assign each task to the most appropriate category from the provided list.
  6.  **Assign Icons**: Assign the most relevant icon from the provided list to each task.

  Available Icons:
  {{#each availableIcons}}
  - {{{this}}}
  {{/each}}

  Available Categories:
  {{#each availableCategories}}
  - {{{this}}}
  {{/each}}

  Example for "Graphic Designer":
  {
    "tasks": [
      { "name": "Review Design Briefs", "duration": 30, "icon": "ListChecks", "category": "Daily Strategy" },
      { "name": "Creative Deep Work", "duration": 180, "icon": "BrainCircuit", "category": "Deep Work" },
      { "name": "Client Feedback & Revisions", "duration": 60, "icon": "Mail", "category": "Work & Focus" },
      { "name": "Inspiration & Moodboarding", "duration": 45, "icon": "ShoppingBag", "category": "Work & Focus" },
      { "name": "Lunch & Walk", "duration": 60, "icon": "Utensils", "category": "Breaks & Meals" }
    ]
  }

  Generate a structured routine for the "{{{profession}}}" profession now. Ensure the entire day is reasonably accounted for.
  `,
});

const generateRoutineByProfessionFlow = ai.defineFlow(
  {
    name: 'generateRoutineByProfessionFlow',
    inputSchema: GenerateRoutineByProfessionInputSchema,
    outputSchema: GenerateRoutineByProfessionOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      return output!;
    } catch(e) {
      console.error("AI call for profession-based routine generation failed", e);
      return { tasks: [] };
    }
  }
);
