'use server';
/**
 * @fileOverview Suggests an icon for a task based on its name.
 *
 * - suggestTaskIcon - A function that suggests an icon for a task.
 * - SuggestTaskIconInput - The input type for the suggestTaskIcon function.
 * - SuggestTaskIconOutput - The return type for the suggestTaskIcon function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTaskIconInputSchema = z.object({
  taskName: z.string().describe('The name of the task.'),
  availableIcons: z.array(z.string()).describe('A list of available icon names to choose from.'),
});
export type SuggestTaskIconInput = z.infer<typeof SuggestTaskIconInputSchema>;

const SuggestTaskIconOutputSchema = z.object({
  iconName: z.string().describe('The suggested icon name from the available list.'),
});
export type SuggestTaskIconOutput = z.infer<typeof SuggestTaskIconOutputSchema>;

export async function suggestTaskIcon(input: SuggestTaskIconInput): Promise<SuggestTaskIconOutput> {
  return suggestTaskIconFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskIconPrompt',
  input: {schema: SuggestTaskIconInputSchema},
  output: {schema: SuggestTaskIconOutputSchema},
  prompt: `You are an expert at categorizing tasks and assigning visual identifiers.
  Based on the task name provided by the user, select the most appropriate icon from the list of available icons.

  Task Name: {{{taskName}}}

  Available Icons:
  {{#each availableIcons}}
  - {{{this}}}
  {{/each}}

  Your response should only contain the name of the single best icon from the provided list. Do not select an icon that is not in the list.
  For example, if the task is "Read a chapter of a book", a good suggestion would be "BookOpen".
  If the task is "Morning run", a good suggestion would be "Footprints".
  If the task is "Reply to emails", a good suggestion would be "Mail".`,
});

const suggestTaskIconFlow = ai.defineFlow(
  {
    name: 'suggestTaskIconFlow',
    inputSchema: SuggestTaskIconInputSchema,
    outputSchema: SuggestTaskIconOutputSchema,
  },
  async input => {
    if (!input.taskName.trim()) {
        // Return a default or random icon if the task name is empty
        return { iconName: 'BrainCircuit' };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
