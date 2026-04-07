
'use server';


/**
 * @fileOverview Suggests a category for a task based on its name.
 *
 * - categorizeTask - A function that suggests a category for a task.
 * - CategorizeTaskInput - The input type for the function.
 * - CategorizeTaskOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeTaskInputSchema = z.object({
  taskName: z.string().describe('The name of the task to be categorized.'),
  availableCategories: z.array(z.string()).describe('A list of available category names to choose from.'),
});
export type CategorizeTaskInput = z.infer<typeof CategorizeTaskInputSchema>;

const CategorizeTaskOutputSchema = z.object({
  category: z.string().describe('The most appropriate category for the task from the available list.'),
});
export type CategorizeTaskOutput = z.infer<typeof CategorizeTaskOutputSchema>;

export async function categorizeTask(input: CategorizeTaskInput): Promise<CategorizeTaskOutput> {
  return categorizeTaskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeTaskPrompt',
  input: {schema: CategorizeTaskInputSchema},
  output: {schema: CategorizeTaskOutputSchema},
  prompt: `You are an expert at categorizing tasks. Based on the task name provided by the user, select the single most appropriate category from the available list.

  Task Name: {{{taskName}}}

  Available Categories:
  {{#each availableCategories}}
  - {{{this}}}
  {{/each}}
  
  Your response must only contain the single best category. If no category seems to fit well, default to 'Work & Focus'.

  Example 1:
  Task Name: "Read a chapter of a book"
  Expected output: { "category": "Evening Wind-down" }
  
  Example 2:
  Task Name: "Morning run"
  Expected output: { "category": "Health & Wellness" }

  Example 3:
  Task Name: "Deploy the new feature"
  Expected output: { "category": "Work & Focus" }
  `,
});

const categorizeTaskFlow = ai.defineFlow(
  {
    name: 'categorizeTaskFlow',
    inputSchema: CategorizeTaskInputSchema,
    outputSchema: CategorizeTaskOutputSchema,
  },
  async input => {
    if (!input.taskName.trim()) {
        return { category: 'Work & Focus' };
    }
    try {
      const {output} = await prompt(input);
      // Ensure the returned category is one of the available ones
      if (output && input.availableCategories.includes(output.category)) {
        return output;
      }
      return { category: 'Work & Focus' };
    } catch(e) {
      console.error("AI call for task categorization failed, returning default", e);
      // Fallback in case of quota errors or other failures
      return { category: 'Work & Focus' };
    }
  }
);
