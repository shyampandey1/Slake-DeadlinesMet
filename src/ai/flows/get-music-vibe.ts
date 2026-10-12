'use server';

/**
 * @fileOverview Determines a music vibe based on a task description using JEV TypeSafe SystemOne.
 */

import { z } from 'zod';
import { getMusicLibrary } from './get-music-library';
import { callTypeSafeSystemOne, createChoiceQuestion } from '@/lib/jevClient';

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
  const { tracks } = await getMusicLibrary();
  const availableVibes = [...new Set(tracks.map((t) => t.vibe))];

  let selectedVibe = 'Focus';
  try {
    const criteria: Record<string, string> = {};
    for (const v of availableVibes) {
      criteria[v] = `Acoustic vibe matching ${v} state`;
    }

    const res = await callTypeSafeSystemOne({
      state: { taskName: input.taskName, availableVibes },
      questions: {
        vibe: createChoiceQuestion(criteria, 'Select the optimal background music vibe for this task.'),
      },
    });
    if (res.answers?.vibe?.choice && availableVibes.includes(res.answers.vibe.choice)) {
      selectedVibe = res.answers.vibe.choice;
    }
  } catch {
    const lower = input.taskName.toLowerCase();
    if (/meditat|breath|relax|rest|wind|read/i.test(lower)) selectedVibe = 'Relax';
    else if (/workout|exercise|gym|run|sprint/i.test(lower)) selectedVibe = 'Boost';
  }

  const matchingTrack = tracks.find((t) => t.vibe === selectedVibe) || tracks[0];

  return {
    vibe: selectedVibe,
    trackName: matchingTrack.trackName,
    trackUrl: matchingTrack.trackUrl,
  };
}
