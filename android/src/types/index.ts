export type LifestyleCategory =
  | 'Productivity'
  | 'Hydration'
  | 'Fitness'
  | 'Meditation'
  | 'Hygiene'
  | 'Creativity';

export type Task = {
  id: string;
  userId: string;
  name: string;
  duration: number; // in minutes, time spent
  initialDuration: number; // in minutes, original planned duration
  completed: boolean;
  createdAt: any;
  category?: LifestyleCategory;
  earnedCoins?: number;
  isFalseEntry?: boolean;
};

export type StreakData = {
  currentStreak: number;
  highestStreak: number;
  lastActiveDate: string;
  dailyHistory: {
    date: string;
    completionPercentage: number;
    firstTaskCompleted: boolean;
    lastTaskCompleted: boolean;
    perfectDayBadge: boolean;
  }[];
};

export type UserProfile = {
  userId: string;
  profile: string;
  displayName?: string;
  email?: string;
  displayPicture?: string;
  slakeCoins?: number;
  slakeCredits?: number;
  slakeBalance?: number;
  streak?: StreakData;
  region?: string;
  country?: string;
  currency?: string;
  weight?: number;
  height?: number;
  isOnline?: boolean;
  totalTasks?: number;
  totalWaterGlasses?: number;
  coWorkerId?: string;
  pendingCoWorkerId?: string;
  activeSession?: {
    taskName: string;
    expectedEndTime: number;
    isPaused: boolean;
    duration: number;
    category?: string;
    color?: string;
    coOpSessionId?: string;
    timeLeftWhenPaused?: number | null;
  } | null;
};

export type RoutinePreset = {
  id: string;
  name: string;
  durationMinutes: number;
  category: LifestyleCategory;
  iconName: string;
  completed?: boolean;
};

export type RewardItem = {
  id: number;
  name: string;
  desc: string;
  credits: number;
  icon: string;
};

export type CoReformerMember = {
  id: string;
  name: string;
  avatar: string;
  streak: number;
  coins: number;
  city: string;
  routine: string;
  isMe?: boolean;
  isOnline?: boolean;
  currentTask?: string;
};
