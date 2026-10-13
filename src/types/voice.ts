import { z } from 'zod';

export type VoiceCategory =
  | 'Productivity'
  | 'Hydration'
  | 'Fitness'
  | 'Meditation'
  | 'Hygiene'
  | 'Creativity';

export type VoiceRoute =
  | '/'
  | '/routine'
  | '/reformers'
  | '/settings'
  | '/logbook'
  | '/history'
  | '/analytics'
  | '/timer'
  | '/rewards'
  | '/presets'
  | '/privacy'
  | 'WINDOW_BACK';

export type VoiceIntentAction =
  | 'TASK_CREATE'
  | 'TASK_LOG_QUICK'
  | 'TASK_QUICK_LOG'
  | 'TIMER_START'
  | 'TIMER_PAUSE'
  | 'TIMER_RESUME'
  | 'TIMER_STOP'
  | 'TIMER_RESTART'
  | 'TIMER_EXTEND'
  | 'TIMER_REDUCE'
  | 'TIMER_SET_INTERVAL'
  | 'TIMER_SKIP'
  | 'NAVIGATE'
  | 'ROUTINE_CONTROL'
  | 'COOP_ACTION'
  | 'SENSOR_TOGGLE'
  | 'SENSOR_ENVIRONMENT_TOGGLE'
  | 'REWARDS_ACTION'
  | 'REDEEM_TRIGGER'
  | 'ANALYTICS_ACTION'
  | 'SYSTEM_CONTROL'
  | 'MODAL_DISMISS'
  | 'ROUTINE_COMPLETE_TASK';

export type VoiceAgentState = 'IDLE' | 'LISTENING' | 'THINKING' | 'EXECUTING' | 'SPEAKING';

export interface JevVoiceRecord {
  utterances: string[];
  intent: string;
  taskName?: string;
  category?: 'Productivity' | 'Hydration' | 'Fitness' | 'Meditation' | 'Hygiene' | 'Creativity';
  durationMinutes?: number;
  targetRoute?: string;
  actionType?: string;
  coinsAwarded?: number;
  speechFeedback: string;
}

export const JEV_VOICE_DATASET: JevVoiceRecord[] = [
  {
    "intent": "NAVIGATE",
    "targetRoute": "/",
    "actionType": "NAVIGATE",
    "coinsAwarded": 0,
    "speechFeedback": "Opening home dashboard.",
    "utterances": [
      "go home",
      "take me home",
      "dashboard",
      "back to dashboard",
      "main screen",
      "head home"
    ]
  },
  {
    "intent": "NAVIGATE",
    "targetRoute": "/routine",
    "actionType": "NAVIGATE",
    "coinsAwarded": 0,
    "speechFeedback": "Opening your routine.",
    "utterances": [
      "open routine",
      "show my routine",
      "today's schedule",
      "check daily tasks",
      "view routine"
    ]
  },
  {
    "intent": "NAVIGATE",
    "targetRoute": "/reformers",
    "actionType": "NAVIGATE",
    "coinsAwarded": 0,
    "speechFeedback": "Opening Reformers League.",
    "utterances": [
      "go to reformers",
      "open reformer league",
      "show reformers",
      "the league",
      "community page"
    ]
  },
  {
    "intent": "NAVIGATE",
    "targetRoute": "/rewards",
    "actionType": "NAVIGATE",
    "coinsAwarded": 0,
    "speechFeedback": "Opening Achievement Center.",
    "utterances": [
      "open rewards",
      "show achievement center",
      "view my coins",
      "check wallet",
      "open achievements"
    ]
  },
  {
    "intent": "NAVIGATE",
    "targetRoute": "/analytics",
    "actionType": "NAVIGATE",
    "coinsAwarded": 0,
    "speechFeedback": "Opening Task Log Book.",
    "utterances": [
      "open log book",
      "show task log",
      "task analytics",
      "view history",
      "productivity records"
    ]
  },
  {
    "intent": "NAVIGATE",
    "targetRoute": "/presets",
    "actionType": "NAVIGATE",
    "coinsAwarded": 0,
    "speechFeedback": "Opening preset catalog.",
    "utterances": [
      "open presets",
      "view routine templates",
      "task presets",
      "show preset catalog"
    ]
  },
  {
    "intent": "NAVIGATE",
    "targetRoute": "/settings",
    "actionType": "NAVIGATE",
    "coinsAwarded": 0,
    "speechFeedback": "Opening settings.",
    "utterances": [
      "open settings",
      "preferences",
      "system settings",
      "app configuration"
    ]
  },
  {
    "intent": "NAVIGATE",
    "targetRoute": "/privacy",
    "actionType": "NAVIGATE",
    "coinsAwarded": 0,
    "speechFeedback": "Opening privacy policy.",
    "utterances": [
      "show privacy policy",
      "open privacy"
    ]
  },
  {
    "intent": "NAVIGATE",
    "targetRoute": "/timer",
    "actionType": "NAVIGATE",
    "coinsAwarded": 0,
    "speechFeedback": "Opening active timer.",
    "utterances": [
      "go to active timer",
      "open timer screen",
      "view current clock",
      "fullscreen timer"
    ]
  },
  {
    "intent": "NAVIGATE",
    "targetRoute": "WINDOW_BACK",
    "actionType": "NAVIGATE",
    "coinsAwarded": 0,
    "speechFeedback": "Going back.",
    "utterances": [
      "go back",
      "previous screen"
    ]
  },
  {
    "intent": "TIMER_START",
    "actionType": "START",
    "coinsAwarded": 0,
    "speechFeedback": "Timer started.",
    "utterances": [
      "start timer",
      "begin task",
      "start the clock",
      "let's go",
      "run timer",
      "start focus"
    ]
  },
  {
    "intent": "TIMER_PAUSE",
    "actionType": "PAUSE",
    "coinsAwarded": 0,
    "speechFeedback": "Timer paused.",
    "utterances": [
      "pause timer",
      "pause the clock",
      "hold on",
      "wait a second",
      "take a pause",
      "freeze clock"
    ]
  },
  {
    "intent": "TIMER_RESUME",
    "actionType": "RESUME",
    "coinsAwarded": 0,
    "speechFeedback": "Resuming timer.",
    "utterances": [
      "resume timer",
      "unpause",
      "keep going",
      "continue session",
      "back to work"
    ]
  },
  {
    "intent": "TIMER_STOP",
    "actionType": "COMPLETE",
    "coinsAwarded": 0,
    "speechFeedback": "Task complete. Great work!",
    "utterances": [
      "stop timer",
      "end task",
      "finish task",
      "mark complete",
      "wrap it up",
      "task done"
    ]
  },
  {
    "intent": "TIMER_STOP",
    "actionType": "ABORT",
    "coinsAwarded": 0,
    "speechFeedback": "Timer reset.",
    "utterances": [
      "cancel timer",
      "abort task",
      "reset timer",
      "discard clock",
      "stop without saving"
    ]
  },
  {
    "intent": "TIMER_RESTART",
    "actionType": "RESTART",
    "coinsAwarded": 0,
    "speechFeedback": "Restarting current timer.",
    "utterances": [
      "restart timer",
      "start task over"
    ]
  },
  {
    "intent": "TIMER_EXTEND",
    "durationMinutes": 1,
    "actionType": "EXTEND",
    "coinsAwarded": 0,
    "speechFeedback": "Added 1 minute.",
    "utterances": [
      "add 1 minute"
    ]
  },
  {
    "intent": "TIMER_EXTEND",
    "durationMinutes": 5,
    "actionType": "EXTEND",
    "coinsAwarded": 0,
    "speechFeedback": "Added 5 minutes.",
    "utterances": [
      "add 5 minutes",
      "give me 5 more minutes",
      "extend by 5"
    ]
  },
  {
    "intent": "TIMER_EXTEND",
    "durationMinutes": 10,
    "actionType": "EXTEND",
    "coinsAwarded": 0,
    "speechFeedback": "Added 10 minutes.",
    "utterances": [
      "add 10 minutes",
      "give me 10 more minutes",
      "extend timer by 10"
    ]
  },
  {
    "intent": "TIMER_EXTEND",
    "durationMinutes": 15,
    "actionType": "EXTEND",
    "coinsAwarded": 0,
    "speechFeedback": "Added 15 minutes.",
    "utterances": [
      "add 15 minutes"
    ]
  },
  {
    "intent": "TIMER_REDUCE",
    "durationMinutes": 5,
    "actionType": "REDUCE",
    "coinsAwarded": 0,
    "speechFeedback": "Reduced by 5 minutes.",
    "utterances": [
      "subtract 5 minutes"
    ]
  },
  {
    "intent": "TIMER_SET_INTERVAL",
    "durationMinutes": 5,
    "actionType": "SET_INTERVAL",
    "coinsAwarded": 0,
    "speechFeedback": "Interval set: 5 minutes.",
    "utterances": [
      "set interval 5 minutes",
      "remind me every 5 minutes"
    ]
  },
  {
    "intent": "TIMER_SET_INTERVAL",
    "durationMinutes": 10,
    "actionType": "SET_INTERVAL",
    "coinsAwarded": 0,
    "speechFeedback": "Interval set: 10 minutes.",
    "utterances": [
      "set interval 10 minutes",
      "remind me every 10 minutes"
    ]
  },
  {
    "intent": "TIMER_SET_INTERVAL",
    "durationMinutes": 15,
    "actionType": "SET_INTERVAL",
    "coinsAwarded": 0,
    "speechFeedback": "Interval set: 15 minutes.",
    "utterances": [
      "set interval 15 minutes"
    ]
  },
  {
    "intent": "TIMER_SET_INTERVAL",
    "durationMinutes": 0,
    "actionType": "SET_INTERVAL",
    "coinsAwarded": 0,
    "speechFeedback": "Interval reminders disabled.",
    "utterances": [
      "turn off interval alerts"
    ]
  },
  {
    "intent": "TIMER_SKIP",
    "actionType": "SKIP",
    "coinsAwarded": 0,
    "speechFeedback": "Skipping to next task.",
    "utterances": [
      "skip to next task",
      "next task in routine"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Meditation",
    "category": "Meditation",
    "durationMinutes": 10,
    "coinsAwarded": 30,
    "speechFeedback": "Starting 10-minute meditation.",
    "utterances": [
      "start meditation",
      "meditate 10 minutes",
      "begin mindfulness",
      "10 minute meditation",
      "calm my mind",
      "mindfulness meditation"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Meditation",
    "category": "Meditation",
    "durationMinutes": 5,
    "coinsAwarded": 30,
    "speechFeedback": "Starting 5-minute meditation.",
    "utterances": [
      "start 5 minute meditation",
      "quick mental reset",
      "5 minute mindfulness"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Deep Breathing",
    "category": "Meditation",
    "durationMinutes": 4,
    "coinsAwarded": 30,
    "speechFeedback": "Starting 4-minute oxygenation.",
    "utterances": [
      "start deep breathing",
      "deep breathing",
      "oxygenation session",
      "box breathing 4 minutes",
      "pranayama flow",
      "breathing exercise"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Deep Breathing",
    "category": "Meditation",
    "durationMinutes": 2,
    "coinsAwarded": 30,
    "speechFeedback": "Starting 2-minute breathing.",
    "utterances": [
      "start 2 minute breathing",
      "quick breathing exercise"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Visualization",
    "category": "Productivity",
    "durationMinutes": 10,
    "coinsAwarded": 30,
    "speechFeedback": "Starting visualization session.",
    "utterances": [
      "start visualization",
      "10 minute vision review",
      "mental rehearsal",
      "visualize goals"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Morning Workout",
    "category": "Fitness",
    "durationMinutes": 20,
    "coinsAwarded": 40,
    "speechFeedback": "Starting 20-minute workout.",
    "utterances": [
      "start workout",
      "exercise for 20 minutes",
      "morning workout",
      "morning warm-up workout"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Workout Session",
    "category": "Fitness",
    "durationMinutes": 30,
    "coinsAwarded": 40,
    "speechFeedback": "Starting 30-minute workout.",
    "utterances": [
      "start 30 minute workout"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Mobility & Stretch",
    "category": "Fitness",
    "durationMinutes": 10,
    "coinsAwarded": 40,
    "speechFeedback": "Starting 10-minute stretch.",
    "utterances": [
      "start 10 minute stretch",
      "mobility routine",
      "stretch break"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Reading a Book",
    "category": "Creativity",
    "durationMinutes": 15,
    "coinsAwarded": 30,
    "speechFeedback": "Starting 15-minute reading.",
    "utterances": [
      "start reading",
      "read a book",
      "read positive 15 minutes",
      "wisdom reading"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Reading a Book",
    "category": "Creativity",
    "durationMinutes": 20,
    "coinsAwarded": 30,
    "speechFeedback": "Starting 20-minute reading.",
    "utterances": [
      "start 20 minute reading"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Scribing & Journaling",
    "category": "Creativity",
    "durationMinutes": 10,
    "coinsAwarded": 30,
    "speechFeedback": "Starting scribing session.",
    "utterances": [
      "start scribing",
      "journal for 10 minutes",
      "evening intention journaling",
      "write in journal"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Scribing & Journaling",
    "category": "Creativity",
    "durationMinutes": 5,
    "coinsAwarded": 30,
    "speechFeedback": "Starting 5-minute scribing.",
    "utterances": [
      "start 5 minute journaling"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Deep Work Sprint",
    "category": "Productivity",
    "durationMinutes": 45,
    "coinsAwarded": 50,
    "speechFeedback": "Starting deep work sprint.",
    "utterances": [
      "start deep work",
      "code for 45 minutes",
      "focus block 45 minutes",
      "deep work sprint"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Focus Session",
    "category": "Productivity",
    "durationMinutes": 30,
    "coinsAwarded": 50,
    "speechFeedback": "Starting 30-minute focus.",
    "utterances": [
      "start 30 minute focus"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Deep Work Sprint",
    "category": "Productivity",
    "durationMinutes": 60,
    "coinsAwarded": 50,
    "speechFeedback": "Starting 60-minute sprint.",
    "utterances": [
      "start 60 minute sprint"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Drink a Glass of Water",
    "category": "Hydration",
    "durationMinutes": 1,
    "coinsAwarded": 30,
    "speechFeedback": "Starting 1-minute water break.",
    "utterances": [
      "drink a glass of water",
      "drink glass of water",
      "drink water",
      "drink water timer",
      "drink some water",
      "have a glass of water",
      "get a glass of water",
      "hydrate",
      "water break",
      "hydration break",
      "time to drink water"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Clean Workspace",
    "category": "Hygiene",
    "durationMinutes": 5,
    "coinsAwarded": 25,
    "speechFeedback": "Starting workspace hygiene.",
    "utterances": [
      "clean workspace",
      "make my bed",
      "set the bed",
      "set work table"
    ]
  },
  {
    "intent": "TASK_CREATE",
    "taskName": "Eye Strain Exercise",
    "category": "Hygiene",
    "durationMinutes": 2,
    "coinsAwarded": 35,
    "speechFeedback": "Starting 2-minute eye exercise.",
    "utterances": [
      "take eye strain break",
      "eye strain exercise",
      "20-20-20 eye rest",
      "rest my eyes",
      "eye exercise"
    ]
  },
  {
    "intent": "TASK_LOG_QUICK",
    "taskName": "Drink a Glass of Water",
    "category": "Hydration",
    "actionType": "LOG_QUICK",
    "coinsAwarded": 25,
    "speechFeedback": "Water logged. Plus 25 coins!",
    "utterances": [
      "log water",
      "drank a glass of water",
      "finished my water",
      "water logged"
    ]
  },
  {
    "intent": "TASK_LOG_QUICK",
    "taskName": "Set the Bed",
    "category": "Hygiene",
    "actionType": "LOG_QUICK",
    "coinsAwarded": 25,
    "speechFeedback": "Bed logged. Plus 25 coins!",
    "utterances": [
      "bed made",
      "made my bed"
    ]
  },
  {
    "intent": "TASK_LOG_QUICK",
    "taskName": "Clean Workspace",
    "category": "Hygiene",
    "actionType": "LOG_QUICK",
    "coinsAwarded": 25,
    "speechFeedback": "Workspace logged. Plus 25!",
    "utterances": [
      "desk cleaned",
      "table organized"
    ]
  },
  {
    "intent": "TASK_LOG_QUICK",
    "taskName": "Eye Strain Exercise",
    "category": "Hygiene",
    "actionType": "LOG_QUICK",
    "coinsAwarded": 35,
    "speechFeedback": "Eye rest logged. Plus 35!",
    "utterances": [
      "eye exercise done"
    ]
  },
  {
    "intent": "TASK_LOG_QUICK",
    "taskName": "Quick Stretch",
    "category": "Fitness",
    "actionType": "LOG_QUICK",
    "coinsAwarded": 40,
    "speechFeedback": "Fitness logged. Plus 40!",
    "utterances": [
      "quick stretch done",
      "completed 10 pushups",
      "completed 10 squats"
    ]
  },
  {
    "intent": "TASK_LOG_QUICK",
    "taskName": "Meditation",
    "category": "Meditation",
    "actionType": "LOG_QUICK",
    "coinsAwarded": 30,
    "speechFeedback": "Meditation logged. Plus 30!",
    "utterances": [
      "quick meditation done"
    ]
  },
  {
    "intent": "TASK_LOG_QUICK",
    "taskName": "Reading a Book",
    "category": "Creativity",
    "actionType": "LOG_QUICK",
    "coinsAwarded": 30,
    "speechFeedback": "Reading logged. Plus 30!",
    "utterances": [
      "read 5 pages"
    ]
  },
  {
    "intent": "TASK_LOG_QUICK",
    "taskName": "Scribing & Journaling",
    "category": "Creativity",
    "actionType": "LOG_QUICK",
    "coinsAwarded": 30,
    "speechFeedback": "Scribing logged. Plus 30!",
    "utterances": [
      "quick scribing done"
    ]
  },
  {
    "intent": "ROUTINE_CONTROL",
    "actionType": "WRAPPER_CHANGE",
    "coinsAwarded": 0,
    "speechFeedback": "Morning Primer active.",
    "utterances": [
      "switch to morning primer",
      "enable morning primer"
    ]
  },
  {
    "intent": "ROUTINE_CONTROL",
    "actionType": "WRAPPER_CHANGE",
    "coinsAwarded": 0,
    "speechFeedback": "Evening Restorer active.",
    "utterances": [
      "switch to evening restorer",
      "enable evening restorer"
    ]
  },
  {
    "intent": "ROUTINE_CONTROL",
    "actionType": "TEMPLATE_CHANGE",
    "coinsAwarded": 0,
    "speechFeedback": "Software Engineer routine applied.",
    "utterances": [
      "apply software engineer routine"
    ]
  },
  {
    "intent": "ROUTINE_CONTROL",
    "actionType": "TEMPLATE_CHANGE",
    "coinsAwarded": 0,
    "speechFeedback": "Entrepreneur routine applied.",
    "utterances": [
      "apply entrepreneur routine"
    ]
  },
  {
    "intent": "ROUTINE_CONTROL",
    "actionType": "TEMPLATE_CHANGE",
    "coinsAwarded": 0,
    "speechFeedback": "Student routine applied.",
    "utterances": [
      "apply student routine"
    ]
  },
  {
    "intent": "ROUTINE_CONTROL",
    "actionType": "TEMPLATE_CHANGE",
    "coinsAwarded": 0,
    "speechFeedback": "Designer routine applied.",
    "utterances": [
      "apply designer routine"
    ]
  },
  {
    "intent": "ROUTINE_CONTROL",
    "actionType": "TEMPLATE_CHANGE",
    "coinsAwarded": 0,
    "speechFeedback": "Healthcare routine applied.",
    "utterances": [
      "apply healthcare routine"
    ]
  },
  {
    "intent": "ROUTINE_CONTROL",
    "actionType": "REST_MODE_TOGGLE",
    "coinsAwarded": 0,
    "speechFeedback": "Rest day routine applied.",
    "utterances": [
      "set today as day off"
    ]
  },
  {
    "intent": "ROUTINE_CONTROL",
    "actionType": "REST_MODE_TOGGLE",
    "coinsAwarded": 0,
    "speechFeedback": "Workday routine restored.",
    "utterances": [
      "resume workday routine"
    ]
  },
  {
    "intent": "ROUTINE_CONTROL",
    "actionType": "AI_REORGANIZE",
    "coinsAwarded": 0,
    "speechFeedback": "Optimizing routine order.",
    "utterances": [
      "reorder routine"
    ]
  },
  {
    "intent": "ROUTINE_CONTROL",
    "actionType": "RESET_DAILY",
    "coinsAwarded": 0,
    "speechFeedback": "Daily routine reset.",
    "utterances": [
      "clear completed tasks"
    ]
  },
  {
    "intent": "COOP_ACTION",
    "actionType": "INVITE_PARTNER",
    "coinsAwarded": 0,
    "speechFeedback": "Partner invite sent.",
    "utterances": [
      "invite co reformer"
    ]
  },
  {
    "intent": "COOP_ACTION",
    "actionType": "START_DUET",
    "coinsAwarded": 0,
    "speechFeedback": "Partner invite sent.",
    "utterances": [
      "start partner session"
    ]
  },
  {
    "intent": "COOP_ACTION",
    "actionType": "ACCEPT_INVITE",
    "coinsAwarded": 0,
    "speechFeedback": "Connected to co-op session.",
    "utterances": [
      "accept co op invite"
    ]
  },
  {
    "intent": "COOP_ACTION",
    "actionType": "LEAVE_SESSION",
    "coinsAwarded": 0,
    "speechFeedback": "Left co-op session.",
    "utterances": [
      "leave co op session"
    ]
  },
  {
    "intent": "COOP_ACTION",
    "actionType": "BROADCAST_START",
    "coinsAwarded": 0,
    "speechFeedback": "Group sprint started.",
    "utterances": [
      "coach start group sprint",
      "start class timer"
    ]
  },
  {
    "intent": "COOP_ACTION",
    "actionType": "BROADCAST_PAUSE",
    "coinsAwarded": 0,
    "speechFeedback": "Group timer paused.",
    "utterances": [
      "coach pause group timer"
    ]
  },
  {
    "intent": "COOP_ACTION",
    "actionType": "BROADCAST_STOP",
    "coinsAwarded": 0,
    "speechFeedback": "Group session finished.",
    "utterances": [
      "coach stop group timer"
    ]
  },
  {
    "intent": "COOP_ACTION",
    "durationMinutes": 10,
    "actionType": "BROADCAST_DURATION",
    "coinsAwarded": 0,
    "speechFeedback": "Group timer set: 10 mins.",
    "utterances": [
      "coach set group time 10 minutes"
    ]
  },
  {
    "intent": "COOP_ACTION",
    "durationMinutes": 20,
    "actionType": "BROADCAST_DURATION",
    "coinsAwarded": 0,
    "speechFeedback": "Group timer set: 20 mins.",
    "utterances": [
      "coach set group time 20 minutes"
    ]
  },
  {
    "intent": "SENSOR_TOGGLE",
    "actionType": "TOGGLE_EYE_TRACKING_ON",
    "coinsAwarded": 0,
    "speechFeedback": "Gaze tracking enabled.",
    "utterances": [
      "turn on eye tracking",
      "enable gaze control"
    ]
  },
  {
    "intent": "SENSOR_TOGGLE",
    "actionType": "TOGGLE_EYE_TRACKING_OFF",
    "coinsAwarded": 0,
    "speechFeedback": "Gaze tracking disabled.",
    "utterances": [
      "turn off eye tracking",
      "disable gaze control"
    ]
  },
  {
    "intent": "SENSOR_TOGGLE",
    "actionType": "GAZE_CALIBRATE",
    "coinsAwarded": 0,
    "speechFeedback": "Calibrating gaze sensor.",
    "utterances": [
      "calibrate eye tracking"
    ]
  },
  {
    "intent": "SENSOR_TOGGLE",
    "actionType": "AUDIO_WATER_ON",
    "coinsAwarded": 0,
    "speechFeedback": "Water soundscape on.",
    "utterances": [
      "turn on water sounds"
    ]
  },
  {
    "intent": "SENSOR_TOGGLE",
    "actionType": "AUDIO_WATER_OFF",
    "coinsAwarded": 0,
    "speechFeedback": "Water soundscape off.",
    "utterances": [
      "turn off water sounds"
    ]
  },
  {
    "intent": "SENSOR_TOGGLE",
    "actionType": "AUDIO_BREATHE_ON",
    "coinsAwarded": 0,
    "speechFeedback": "Breathing chimes active.",
    "utterances": [
      "turn on breathing chimes"
    ]
  },
  {
    "intent": "SENSOR_TOGGLE",
    "actionType": "AUDIO_BREATHE_OFF",
    "coinsAwarded": 0,
    "speechFeedback": "Breathing audio muted.",
    "utterances": [
      "turn off breathing chimes"
    ]
  },
  {
    "intent": "SENSOR_TOGGLE",
    "actionType": "MUTE_ALL",
    "coinsAwarded": 0,
    "speechFeedback": "App audio muted.",
    "utterances": [
      "mute all audio"
    ]
  },
  {
    "intent": "SENSOR_TOGGLE",
    "actionType": "UNMUTE_ALL",
    "coinsAwarded": 0,
    "speechFeedback": "App audio unmuted.",
    "utterances": [
      "unmute audio"
    ]
  },
  {
    "intent": "SENSOR_TOGGLE",
    "actionType": "HAPTICS_ON",
    "coinsAwarded": 0,
    "speechFeedback": "Haptics enabled.",
    "utterances": [
      "turn on haptics"
    ]
  },
  {
    "intent": "SENSOR_TOGGLE",
    "actionType": "HAPTICS_OFF",
    "coinsAwarded": 0,
    "speechFeedback": "Haptics disabled.",
    "utterances": [
      "turn off haptics"
    ]
  },
  {
    "intent": "REWARDS_ACTION",
    "actionType": "CHECK_BALANCE",
    "coinsAwarded": 0,
    "speechFeedback": "Checking your coin balance.",
    "utterances": [
      "check coin balance",
      "how many coins do I have"
    ]
  },
  {
    "intent": "REWARDS_ACTION",
    "actionType": "REDEEM_UPI",
    "coinsAwarded": 0,
    "speechFeedback": "Opening payout window.",
    "utterances": [
      "redeem payout",
      "withdraw cash",
      "claim direct payout"
    ]
  },
  {
    "intent": "REWARDS_ACTION",
    "actionType": "PIN_CERTIFICATE",
    "coinsAwarded": 0,
    "speechFeedback": "Certificate pinned to profile.",
    "utterances": [
      "pin certificate to profile"
    ]
  },
  {
    "intent": "REWARDS_ACTION",
    "actionType": "UNPIN_CERTIFICATE",
    "coinsAwarded": 0,
    "speechFeedback": "Certificate unpinned.",
    "utterances": [
      "unpin certificate"
    ]
  },
  {
    "intent": "REWARDS_ACTION",
    "actionType": "SHOW_LEADERBOARD",
    "coinsAwarded": 0,
    "speechFeedback": "Showing top reformers.",
    "utterances": [
      "show leaderboard"
    ]
  },
  {
    "intent": "REWARDS_ACTION",
    "actionType": "SHOW_CERTIFICATES",
    "coinsAwarded": 0,
    "speechFeedback": "Displaying your certificates.",
    "utterances": [
      "show certificates"
    ]
  },
  {
    "intent": "ANALYTICS_ACTION",
    "actionType": "GENERATE_INSIGHTS",
    "coinsAwarded": 0,
    "speechFeedback": "Analyzing your productivity.",
    "utterances": [
      "generate AI insights",
      "analyze my productivity"
    ]
  },
  {
    "intent": "ANALYTICS_ACTION",
    "actionType": "EVALUATE_ROUTINE",
    "coinsAwarded": 0,
    "speechFeedback": "Evaluating routine balance.",
    "utterances": [
      "evaluate my routine"
    ]
  },
  {
    "intent": "ANALYTICS_ACTION",
    "actionType": "EVALUATE_READINESS",
    "coinsAwarded": 0,
    "speechFeedback": "Evaluating league readiness.",
    "utterances": [
      "check reformer readiness"
    ]
  },
  {
    "intent": "ANALYTICS_ACTION",
    "category": "Productivity",
    "actionType": "FILTER_CATEGORY",
    "coinsAwarded": 0,
    "speechFeedback": "Showing productivity logs.",
    "utterances": [
      "show productivity category"
    ]
  },
  {
    "intent": "ANALYTICS_ACTION",
    "category": "Hydration",
    "actionType": "FILTER_CATEGORY",
    "coinsAwarded": 0,
    "speechFeedback": "Showing hydration records.",
    "utterances": [
      "show hydration records"
    ]
  },
  {
    "intent": "ANALYTICS_ACTION",
    "category": "Fitness",
    "actionType": "FILTER_CATEGORY",
    "coinsAwarded": 0,
    "speechFeedback": "Showing fitness logs.",
    "utterances": [
      "show fitness logs"
    ]
  },
  {
    "intent": "ANALYTICS_ACTION",
    "category": "Meditation",
    "actionType": "FILTER_CATEGORY",
    "coinsAwarded": 0,
    "speechFeedback": "Showing meditation logs.",
    "utterances": [
      "show meditation records"
    ]
  },
  {
    "intent": "SYSTEM_CONTROL",
    "actionType": "DISMISS",
    "coinsAwarded": 0,
    "speechFeedback": "Dismissed.",
    "utterances": [
      "close this",
      "dismiss popup",
      "cancel"
    ]
  },
  {
    "intent": "SYSTEM_CONTROL",
    "actionType": "VOICE_FEMALE",
    "coinsAwarded": 0,
    "speechFeedback": "Switched to female voice.",
    "utterances": [
      "switch to female voice"
    ]
  },
  {
    "intent": "SYSTEM_CONTROL",
    "actionType": "VOICE_MALE",
    "coinsAwarded": 0,
    "speechFeedback": "Switched to male voice.",
    "utterances": [
      "switch to male voice"
    ]
  },
  {
    "intent": "SYSTEM_CONTROL",
    "actionType": "VOICE_SPEED_FAST",
    "coinsAwarded": 0,
    "speechFeedback": "Speaking faster now.",
    "utterances": [
      "talk faster"
    ]
  },
  {
    "intent": "SYSTEM_CONTROL",
    "actionType": "VOICE_SPEED_NORMAL",
    "coinsAwarded": 0,
    "speechFeedback": "Speech speed reset.",
    "utterances": [
      "normal voice speed"
    ]
  },
  {
    "intent": "SYSTEM_CONTROL",
    "actionType": "VOICE_ABORT",
    "coinsAwarded": 0,
    "speechFeedback": "",
    "utterances": [
      "stop talking"
    ]
  },
  {
    "intent": "SYSTEM_CONTROL",
    "actionType": "THEME_TOGGLE",
    "coinsAwarded": 0,
    "speechFeedback": "Theme updated.",
    "utterances": [
      "toggle dark mode"
    ]
  },
  {
    "intent": "SYSTEM_CONTROL",
    "actionType": "SCROLL_DOWN",
    "coinsAwarded": 0,
    "speechFeedback": "Scrolling down.",
    "utterances": [
      "scroll down"
    ]
  },
  {
    "intent": "SYSTEM_CONTROL",
    "actionType": "SCROLL_UP",
    "coinsAwarded": 0,
    "speechFeedback": "Scrolling to top.",
    "utterances": [
      "scroll up"
    ]
  }
];

export const VoiceIntentPayloadSchema = z.object({
  action: z.enum([
    'TASK_CREATE',
    'TASK_LOG_QUICK',
    'TASK_QUICK_LOG',
    'TIMER_START',
    'TIMER_PAUSE',
    'TIMER_RESUME',
    'TIMER_STOP',
    'TIMER_RESTART',
    'TIMER_EXTEND',
    'TIMER_REDUCE',
    'TIMER_SET_INTERVAL',
    'TIMER_SKIP',
    'NAVIGATE',
    'ROUTINE_CONTROL',
    'COOP_ACTION',
    'SENSOR_TOGGLE',
    'SENSOR_ENVIRONMENT_TOGGLE',
    'REWARDS_ACTION',
    'REDEEM_TRIGGER',
    'ANALYTICS_ACTION',
    'SYSTEM_CONTROL',
    'MODAL_DISMISS',
    'ROUTINE_COMPLETE_TASK',
  ]),
  actionType: z.string().optional(),
  taskName: z.string().optional(),
  durationMinutes: z.number().optional(),
  durationSeconds: z.number().optional(),
  category: z
    .enum(['Productivity', 'Hydration', 'Fitness', 'Meditation', 'Hygiene', 'Creativity'])
    .optional(),
  targetRoute: z
    .enum([
      '/',
      '/routine',
      '/reformers',
      '/settings',
      '/logbook',
      '/history',
      '/analytics',
      '/timer',
      '/rewards',
      '/presets',
      '/privacy',
      'WINDOW_BACK',
    ])
    .optional(),
  extendMinutes: z.number().optional(),
  intervalMinutes: z.number().optional(),
  earnedCoins: z.number().optional(),
  coinsAwarded: z.number().optional(),
  coopAction: z.enum(['invite', 'start_sprint', 'pause_group']).optional(),
  rewardsAction: z.enum(['redeem', 'withdraw', 'pin_certificate', 'check_balance']).optional(),
  sensorType: z.enum(['eye_tracking', 'water_sounds', 'ambient_noise', 'breathing_chimes', 'haptics']).optional(),
  sensorState: z.enum(['on', 'off', 'toggle', 'calibrate']).optional(),
  speechFeedback: z.string(),
  confidence: z.number().min(0).max(1).optional(),
});

export type VoiceIntentPayload = z.infer<typeof VoiceIntentPayloadSchema>;

export interface VoiceCommandRequest {
  transcript: string;
  matchedDomain?: string;
  currentRoute?: string;
  activeTimerState?: {
    isRunning: boolean;
    isPaused: boolean;
    taskName?: string;
    remainingSeconds?: number;
  };
}
