

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
    category?: string;
    earnedCoins?: number;
    isFalseEntry?: boolean;
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

export type ProfileType =
    | "Artist"
    | "Consultant"
    | "Content Creator"
    | "Designer"
    | "Educator"
    | "Entrepreneur"
    | "Freelancer"
    | "General"
    | "Healthcare Professional"
    | "Day Off"
    | "Day Off - Analyst"
    | "Day Off - Healthcare"
    | "Admin Day - On The Go"
    | "IT Professional"
    | "Manager"
    | "Marketer"
    | "Researcher"
    | "Sales"
    | "Software Engineer"
    | "Student"
    | "Writer"
    | "Medical Representative"
    | "Delivery Agent"
    | "Analyst"
    | string;

export type CustomProfession = {
    name: string;
    categoryGroup: string;
}

export type Day = 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export type StreakData = {
    currentStreak: number;
    highestStreak: number;
    lastActiveDate: string; // ISO string
    dailyHistory: {
        date: string; // ISO string YYYY-MM-DD
        completionPercentage: number;
        firstTaskCompleted: boolean;
        lastTaskCompleted: boolean;
        perfectDayBadge: boolean;
    }[];
};

export type UserProfile = {
    userId: string;
    profile: ProfileType;
    displayName?: string;
    email?: string;
    displayPicture?: string;
    customProfessions?: CustomProfession[];
    daysOff?: Day[];
    routineVersions?: { [key: string]: number };
    slakeCredits?: number;
    streak?: StreakData;
    phone?: string;
    instagramLink?: string;
    // Regional Data
    region?: string;
    country?: string;
    currency?: string; // e.g., 'INR', 'USD'
    // Biometric Data
    weight?: number; // in kg
    height?: number; // in cm
    bmi?: number;
    averageBP?: string; // e.g., '120/80'
    googleFitConnected?: boolean;
    // Reformers League
    bio?: string;
    isReformersEnrolled?: boolean;
    googleSyncPermissions?: {
        meta: boolean;
        linkedin: boolean;
        whatsapp: boolean;
    };
    socialUrls?: {
        meta?: string;
        linkedin?: string;
        whatsapp?: string;
    };
    currentTaskStatus?: string;
    isOnline?: boolean;
    isPrivateProfile?: boolean;
    pinnedCertificates?: string[];
    pinnedCertificateIds?: string[];
    slakeBalance?: number;
    gender?: "Male" | "Female" | "Prefer not to share" | string;
    createdAt?: any;
    appAge?: number;
    totalTasks?: number;
    totalWaterGlasses?: number;
    reformersStatus?: 'pending' | 'approved' | null;
    isReformersAdmin?: boolean;
    followersCount?: number;
    followingCount?: number;
    // Co-working & Live Sync
    coWorkerId?: string;
    pendingCoWorkerId?: string;
    reformerPreference?: 'morning_primer' | 'evening_restorer';
    activeSession?: {
        taskName: string;
        expectedEndTime: number;
        isPaused: boolean;
        duration: number;
        coOpSessionId?: string;
    };
    notificationSettings?: {
        streakExpiryWarning: boolean;
        hydrationReminders: boolean;
        dailySummary: boolean;
    };
    fcmTokens?: string[];
};

export type UserEvent = {
    id: string;
    userId: string;
    name: string;
    duration: number;
    icon: string;
    date: string; // ISO string
};
