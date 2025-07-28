'use server';
/**
 * @fileOverview Fetches a library of royalty-free music categorized by vibe.
 *
 * - getMusicLibrary - A function that returns a library of music tracks.
 * - GetMusicLibraryOutput - The return type for the getMusicLibrary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { MusicTrackSchema } from '@/types';

const GetMusicLibraryOutputSchema = z.object({
    tracks: z.array(MusicTrackSchema),
});
export type GetMusicLibraryOutput = z.infer<typeof GetMusicLibraryOutputSchema>;

export async function getMusicLibrary(): Promise<GetMusicLibraryOutput> {
  return getMusicLibraryFlow();
}

const prompt = ai.definePrompt({
  name: 'getMusicLibraryPrompt',
  output: {schema: GetMusicLibraryOutputSchema},
  prompt: `You are a DJ who curates playlists for productivity. Your task is to provide a list of 3 royalty-free music tracks for a focus application. Each track must have a different vibe: "Focus", "Relax", and "Boost".

Provide a specific, publicly-accessible, royalty-free music track URL for each vibe. The tracks should be ambient or instrumental and suitable for working.

Please find tracks from royalty-free sources like Pixabay Music, Free Music Archive, or similar sites that provide direct download/streaming links. Ensure the URLs are direct links to the audio files (e.g., .mp3, .wav).

Return the data as a list of tracks, each with its vibe, trackName, and trackUrl.
`,
});

const getMusicLibraryFlow = ai.defineFlow(
  {
    name: 'getMusicLibraryFlow',
    outputSchema: GetMusicLibraryOutputSchema,
  },
  async () => {
    const {output} = await prompt({});
    return output!;
  }
);
