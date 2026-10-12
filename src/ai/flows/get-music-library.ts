'use server';

/**
 * @fileOverview Fetches a library of royalty-free music categorized by vibe.
 */

import { z } from 'zod';
import { MusicTrackSchema } from '@/types';

const GetMusicLibraryOutputSchema = z.object({
  tracks: z.array(MusicTrackSchema),
});
export type GetMusicLibraryOutput = z.infer<typeof GetMusicLibraryOutputSchema>;

export async function getMusicLibrary(): Promise<GetMusicLibraryOutput> {
  return {
    tracks: [
      {
        vibe: 'Focus',
        trackName: 'Lofi Study',
        trackUrl: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1811de2363.mp3',
      },
      {
        vibe: 'Relax',
        trackName: 'Ambient Piano',
        trackUrl: 'https://cdn.pixabay.com/audio/2024/05/16/audio_689316d3e3.mp3',
      },
      {
        vibe: 'Boost',
        trackName: 'Uplifting Electronic',
        trackUrl: 'https://cdn.pixabay.com/audio/2023/04/19/audio_444b36d075.mp3',
      },
    ],
  };
}
