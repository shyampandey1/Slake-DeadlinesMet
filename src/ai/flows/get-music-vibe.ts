
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
import { getMusicLibrary } from './get-music-library';
import type { MusicTrack } from '@/types';

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
    const { tracks } = await getMusicLibrary();
    const availableVibes = [...new Set(tracks.map(t => t.vibe))];

    const vibeChoicePrompt = ai.definePrompt({
        name: 'vibeChoicePrompt',
        input: { schema: z.object({ taskName: z.string(), availableVibes: z.array(z.string()) }) },
        output: { schema: z.object({ vibe: z.string() }) },
        prompt: `Based on the task name, choose the best music vibe from the list.
        Task: {{{taskName}}}
        Available Vibes: {{{availableVibes}}}`,
    });

    const { output } = await vibeChoicePrompt({ taskName: input.taskName, availableVibes });
    const selectedVibe = output?.vibe || 'Focus';

    // Find a track that matches the selected vibe
    const matchingTrack = tracks.find(t => t.vibe === selectedVibe) || tracks.find(t => t.vibe === 'Focus')!;
    
    return {
        vibe: selectedVibe,
        trackName: matchingTrack.trackName,
        trackUrl: matchingTrack.trackUrl
    };
  }
);
