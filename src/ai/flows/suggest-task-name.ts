'use server';
/**
 * @fileOverview Suggests task names based on user input.
 *
 * - suggestTaskName - A function that suggests task names.
 * - SuggestTaskNameInput - The input type for the suggestTaskName function.
 * - SuggestTaskNameOutput - The return type for the suggestTaskName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTaskNameInputSchema = z.object({
  taskPrompt: z.string().describe('The partial or full task name typed by the user.'),
});
export type SuggestTaskNameInput = z.infer<typeof SuggestTaskNameInputSchema>;

const SuggestTaskNameOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of suggested task name completions or corrections.'),
});
export type SuggestTaskNameOutput = z.infer<typeof SuggestTaskNameOutputSchema>;

export async function suggestTaskName(input: SuggestTaskNameInput): Promise<SuggestTaskNameOutput> {
  return suggestTaskNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskNamePrompt',
  input: {schema: SuggestTaskNameInputSchema},
  output: {schema: SuggestTaskNameOutputSchema},
  prompt: `You are an expert at refining and completing task descriptions for a productivity app.
  Based on the user's input, provide up to 3 concise, action-oriented suggestions to complete or correct their task name.
  The suggestions should be clear and easy to understand.

  User Input: {{{taskPrompt}}}

  Example 1:
  User Input: "book flight"
  Suggestions: ["Book flight to New York", "Book flight for conference", "Book return flight"]

  Example 2:
  User Input: "email jo"
  Suggestions: ["Email John about project", "Email Joanna for feedback", "Email boss about report"]

  Example 3:
  User Input: "clean"
  Suggestions: ["Clean the kitchen", "Clean out the garage", "Clean up desktop files"]

  Provide your suggestions as a list of strings in the 'suggestions' field.
  `,
});

const suggestTaskNameFlow = ai.defineFlow(
  {
    name: 'suggestTaskNameFlow',
    inputSchema: SuggestTaskNameInputSchema,
    outputSchema: SuggestTaskNameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
