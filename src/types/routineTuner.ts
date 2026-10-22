import { z } from 'zod';

export type StudyPreference = 'early_morning' | 'late_afternoon' | 'night_owl' | 'split_blocks';

export type EveningActivity =
  | 'fitness'
  | 'family_social'
  | 'creative_hobby'
  | 'skill_building'
  | 'relaxation';

export type MoversWrapperMode = 'morning_primer' | 'evening_restorer' | 'jev_smart_weave';

export type MoversPillarType =
  | 'M'
  | 'O'
  | 'V'
  | 'E'
  | 'R'
  | 'S'
  | 'hydration'
  | 'eye_strain'
  | 'domestic'
  | 'none';

export interface RoutineTuningAnswers {
  profileName: string;
  profession?: string; // Selected profession (e.g. 'Entrepreneur', 'Software Engineer')
  wakeUpTime: string; // HH:mm (24h)
  sleepTime: string; // HH:mm (24h)
  workOrCollegeStart: string; // HH:mm (24h)
  workOrCollegeEnd: string; // HH:mm (24h)
  commuteDurationMinutes: number;
  lunchBreakTime: string; // HH:mm (24h)
  lunchDurationMinutes: number;
  studyOrResearchPreference: StudyPreference;
  studyDurationMinutes: number;
  eveningCustomization: EveningActivity[];
  moversWrapperMode: MoversWrapperMode;
}

export interface DMRoutineTaskBlock {
  id: string;
  title: string;
  startTime: string; // HH:mm (24h)
  durationMinutes: number;
  category: string;
  isMoversPillar: boolean;
  moversType?: MoversPillarType;
  coinsReward: number;
  icon?: string;
}

export interface DMRoutineAuthor {
  uid: string;
  displayName: string;
  profession: string;
}

export interface DMRoutineFileFormat {
  version: '1.0.0';
  magicHeader: 'DEADLINESMET_ROUTINE_CONTAINER';
  exportedAt: string; // ISO 8601 string
  author: DMRoutineAuthor;
  profileName: string;
  tuningParameters: RoutineTuningAnswers;
  tasks: DMRoutineTaskBlock[];
  routineVector: number[]; // Client-side WebGPU embeddinggemma-300m vector fingerprint
  checksum: string; // SHA-256 hash of tasks + tuningParameters
}

export interface CustomRoutineProfile {
  id: string;
  name: string;
  updatedAt: string;
  tuningAnswers: RoutineTuningAnswers;
  tasks: DMRoutineTaskBlock[];
  routineVector?: number[];
  sustainabilityScore?: number;
  optimizationSummary?: string;
  recommendedFocusPeak?: string;
  conflictResolutionNote?: string;
  isShared?: boolean;
}

export interface SharedCommunityRoutine {
  id: string;
  author: DMRoutineAuthor;
  profileName: string;
  wakeTime: string;
  sleepTime: string;
  studyWindow: StudyPreference;
  routineVector: number[];
  tasksCount: number;
  sustainabilityScore?: number;
  optimizationSummary?: string;
  sharedAt: string | number | null;
  dmPayload: DMRoutineFileFormat;
  similarityScore?: number;
}

// ==========================================
// Zod Schemas for Runtime Validation
// ==========================================

export const RoutineTuningAnswersSchema = z.object({
  profileName: z.string().min(1, 'Profile name is required'),
  profession: z.string().optional(),
  wakeUpTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid wake up time (HH:mm)'),
  sleepTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid sleep time (HH:mm)'),
  workOrCollegeStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid work/college start (HH:mm)'),
  workOrCollegeEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid work/college end (HH:mm)'),
  commuteDurationMinutes: z.number().min(0).max(180),
  lunchBreakTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid lunch break time (HH:mm)'),
  lunchDurationMinutes: z.number().min(15).max(180),
  studyOrResearchPreference: z.enum(['early_morning', 'late_afternoon', 'night_owl', 'split_blocks']),
  studyDurationMinutes: z.number().min(0).max(360),
  eveningCustomization: z.array(
    z.enum(['fitness', 'family_social', 'creative_hobby', 'skill_building', 'relaxation'])
  ),
  moversWrapperMode: z.enum(['morning_primer', 'evening_restorer', 'jev_smart_weave']),
});

export const DMRoutineTaskBlockSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  startTime: z.string(),
  durationMinutes: z.number().positive(),
  category: z.string().min(1),
  isMoversPillar: z.boolean(),
  moversType: z.enum(['M', 'O', 'V', 'E', 'R', 'S', 'hydration', 'eye_strain', 'domestic', 'none']).optional(),
  coinsReward: z.number().nonnegative(),
  icon: z.string().optional(),
});

export const DMRoutineAuthorSchema = z.object({
  uid: z.string().min(1),
  displayName: z.string().min(1),
  profession: z.string(),
});

export const DMRoutineFileSchema = z.object({
  version: z.literal('1.0.0'),
  magicHeader: z.literal('DEADLINESMET_ROUTINE_CONTAINER'),
  exportedAt: z.string(),
  author: DMRoutineAuthorSchema,
  profileName: z.string().min(1),
  tuningParameters: RoutineTuningAnswersSchema,
  tasks: z.array(DMRoutineTaskBlockSchema).min(1),
  routineVector: z.array(z.number()),
  checksum: z.string().min(8),
});
