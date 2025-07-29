
import { z } from 'zod';
import { LucideIcon } from 'lucide-react';

export type Task = {
  id: string;
  userId: string;
  name: string;
  duration: number; // in minutes
  completed: boolean;
  createdAt: any; // Can be a server timestamp
};

export type MockUser = {
  uid: string;
  email: string;
  isMockUser: true;
}

export const MusicTrackSchema = z.object({
  vibe: z.string().describe('The vibe or category of the music (e.g., Focus, Relax, Boost).'),
  trackName: z.string().describe('The name of the music track.'),
  trackUrl: z.string().describe('A URL to a royalty-free music track that fits the vibe.'),
});
export type MusicTrack = z.infer<typeof MusicTrackSchema>;

export type PresetTask = {
    name: string;
    duration: number;
    icon: string;
    order: number;
    recurring?: boolean;
};

// Represents a task stored in Firestore, which will have an ID.
export type UserPresetTask = PresetTask & {
  id?: string; // Default tasks won't have an ID
};


export type Preset = {
    [category: string]: {
        color: string;
        tasks: UserPresetTask[];
    };
};
