

import { z } from 'zod';
import { LucideIcon } from 'lucide-react';

export type Task = {
  id: string;
  userId: string;
  name: string;
  duration: number; // in minutes, time spent
  initialDuration: number; // in minutes, original planned duration
  completed: boolean;
  createdAt: any; // Can be a server timestamp
};

export type MockUser = {
  uid: string;
  email: string;
  displayName?: string | null;
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
    profession?: ProfileType;
};

// Represents a task stored in Firestore, which will have an ID.
export type UserPresetTask = PresetTask & {
  id?: string; // Default tasks won't have an ID
  isEvent?: boolean; // Flag to identify calendar events
  category: string;
};


export type Preset = {
    [category: string]: {
        color: string;
        tasks: UserPresetTask[];
    };
};

export type ProfileType = "Artist" | "Consultant" | "Content Creator" | "Designer" | "Educator" | "Entrepreneur" | "Freelancer" | "General" | "Healthcare Professional" | "Day Off" | "IT Professional" | "Manager" | "Marketer" | "Researcher" | "Sales" | "Software Engineer" | "Student" | "Writer" | string;

export type CustomProfession = {
    name: string;
    categoryGroup: string;
}

export type Day = 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export type UserProfile = {
    profile: ProfileType;
    customProfessions?: CustomProfession[];
    daysOff?: Day[];
}

export type UserEvent = {
    id: string;
    userId: string;
    name: string;
    duration: number;
    icon: string;
    date: string; // ISO string
};

    