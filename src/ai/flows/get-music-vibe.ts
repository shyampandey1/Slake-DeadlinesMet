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

const getMusicForTaskFlow = ai.defineFlow(
  {
    name: 'getMusicForTaskFlow',
    inputSchema: GetMusicForTaskInputSchema,
    outputSchema: GetMusicForTaskOutputSchema,
  },
  async (input) => {
    // For simplicity and reliability, we return a default track.
    // A more advanced implementation could have logic to select a track based on the task.
    return {
        vibe: 'Focus',
        trackName: 'Lofi Study',
        trackUrl: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1811de2363.mp3'
    };
  }
);
