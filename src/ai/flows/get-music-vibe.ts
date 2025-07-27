'use server';
/**
 * @fileOverview Determines a music vibe based on a task description and suggests a royalty-free track.
 *
 * - getMusicForTask - A function that suggests a music genre and track for a task.
 * - GetMusicForTaskInput - The input type for the getMusicForTask function.
 * - GetMusicForTaskOutput - The return type for the getMusicForTask function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetMusicForTaskInputSchema = z.object({
  taskName: z.string().describe('The name of the task the user is working on.'),
});
export type GetMusicForTaskInput = z.infer<typeof GetMusicForTaskInputSchema>;

const GetMusicForTaskOutputSchema = z.object({
  vibe: z.string().describe('A music genre or vibe suitable for the task.'),
  trackUrl: z.string().url().describe('A URL to a royalty-free music track that fits the vibe.'),
  trackName: z.string().describe('The name of the music track.'),
});
export type GetMusicForTaskOutput = z.infer<typeof GetMusicForTaskOutputSchema>;

export async function getMusicForTask(input: GetMusicForTaskInput): Promise<GetMusicForTaskOutput> {
  return getMusicForTaskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getMusicForTaskPrompt',
  input: {schema: GetMusicForTaskInputSchema},
  output: {schema: GetMusicForTaskOutputSchema},
  prompt: `You are a DJ who curates playlists for productivity. Based on the user's task, suggest a music vibe/genre and a specific, publicly-accessible, royalty-free music track URL that would be perfect for focus.

For example:
- Task: "Write a novel" -> Vibe: "Lofi Beats", find a suitable track URL.
- Task: "Workout session" -> Vibe: "High-Energy Electronic", find a suitable track URL.
- Task: "Prepare a business presentation" -> Vibe: "Minimalist Ambient", find a suitable track URL.
- Task: "Design a brochure" -> Vibe: "Chill Cafe Sounds", find a suitable track URL.

Please find tracks from royalty-free sources like Pixabay Music, Free Music Archive, or similar sites that provide direct download/streaming links.

User's Task: {{{taskName}}}
`,
});

const getMusicForTaskFlow = ai.defineFlow(
  {
    name: 'getMusicForTaskFlow',
    inputSchema: GetMusicForTaskInputSchema,
    outputSchema: GetMusicForTaskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
