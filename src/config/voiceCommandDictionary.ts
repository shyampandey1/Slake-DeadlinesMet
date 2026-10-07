import { VoiceIntentAction, VoiceCategory, VoiceRoute } from '@/types/voice';

export interface CommandDefinition {
  action: VoiceIntentAction;
  actionType?: string;
  phrases: string[];
  patterns: RegExp[];
  category?: VoiceCategory;
  taskName?: string;
  targetRoute?: VoiceRoute;
  durationMinutes?: number;
  durationSeconds?: number;
  extendMinutes?: number;
  intervalMinutes?: number;
  earnedCoins?: number;
  coopAction?: 'invite' | 'start_sprint' | 'pause_group';
  rewardsAction?: 'redeem' | 'withdraw' | 'pin_certificate' | 'check_balance';
  sensorType?: 'eye_tracking' | 'water_sounds' | 'ambient_noise' | 'breathing_chimes';
  sensorState?: 'on' | 'off' | 'toggle';
  speechFeedback: string;
  description: string;
}

export const VOICE_COMMAND_DICTIONARY: CommandDefinition[] = [
  // ==========================================
  // 1. NAVIGATION (NAVIGATE)
  // ==========================================
  {
    action: 'NAVIGATE',
    phrases: [
      'go home',
      'take me home',
      'open home',
      'dashboard',
      'homescreen',
    ],
    patterns: [/^(?:go\s+to\s+|open\s+|take\s+me\s+to\s+)?(?:home|dashboard|homescreen)$/i],
    targetRoute: '/',
    speechFeedback: 'Navigating to Homescreen.',
    description: 'Jump to the main dashboard and active countdown.',
  },
  {
    action: 'NAVIGATE',
    phrases: [
      'open routine',
      'show schedule',
      'show routine',
      'go to routine',
      'my routines',
      'routine schedule',
    ],
    patterns: [/(?:open|show|go to|view)\s+(?:my\s+)?(?:routine|schedule)/i],
    targetRoute: '/routine',
    speechFeedback: 'Opening your Routine schedule.',
    description: 'View and adjust daily profession and MOVERS schedule.',
  },
  {
    action: 'NAVIGATE',
    phrases: [
      'go to reformers',
      'open reformer league',
      'show community',
      'show reformers league',
      'open reformers',
      'reformers league',
      'community',
    ],
    patterns: [/(?:open|show|go to|view)\s+(?:the\s+)?(?:reformer(?:s)?(?:\s+league)?|community)/i],
    targetRoute: '/reformers',
    speechFeedback: 'Entering the Reformers League.',
    description: 'Check global leaderboard, co-op peers, and league status.',
  },
  {
    action: 'NAVIGATE',
    phrases: [
      'open rewards',
      'show achievement center',
      'view my coins',
      'check wallet',
      'show rewards',
      'achievement center',
      'achievements',
      'go to rewards',
      'view coins',
    ],
    patterns: [/(?:open|show|go to|view|check)\s+(?:my\s+)?(?:rewards|achievement(?:s)?(?:\s+center)?|coins|wallet|gamification)/i],
    targetRoute: '/rewards',
    speechFeedback: 'Opening Achievement Center and Rewards.',
    description: 'Redeem Slake Coins, certificates, and view badges.',
  },
  {
    action: 'NAVIGATE',
    phrases: [
      'open log book',
      'show analytics',
      'view productivity insights',
      'show task log book',
      'open logbook',
      'go to logbook',
      'history',
      'task history',
      'show history',
      'productivity insights',
    ],
    patterns: [/(?:open|show|go to|view)\s+(?:task\s+)?(?:log\s*book|logbook|history|analytics|productivity\s+insights)/i],
    targetRoute: '/logbook',
    speechFeedback: 'Opening your Task Log Book and Behavioral Insights.',
    description: 'Review completed tasks, performance graphs, and JEV insights.',
  },
  {
    action: 'NAVIGATE',
    phrases: [
      'open settings',
      'go to settings',
      'preferences',
      'app settings',
    ],
    patterns: [/(?:open|show|go to|view)\s+(?:app\s+)?(?:settings|preferences)/i],
    targetRoute: '/settings',
    speechFeedback: 'Opening Settings.',
    description: 'Configure notifications, audio, and profile settings.',
  },

  // ==========================================
  // 2. TIMER CONTROLS (TIMER_*)
  // ==========================================
  {
    action: 'TIMER_START',
    phrases: [
      'start timer',
      'begin task',
      "let's go",
      'lets go',
      'start focus',
      'begin timer',
      'countdown start',
      'start session',
    ],
    patterns: [/^(?:start|begin)\s+(?:the\s+)?(?:timer|focus|countdown|session|task)$/i, /^let'?s\s+go$/i],
    speechFeedback: 'Starting focus timer.',
    description: 'Initiate the running timer for the current task.',
  },
  {
    action: 'TIMER_PAUSE',
    phrases: [
      'pause timer',
      'hold on',
      'wait a second',
      'pause',
      'pause session',
      'freeze timer',
    ],
    patterns: [/^(?:pause|hold\s+on|wait\s+(?:a\s+second|a\s+sec|a\s+moment)|freeze)(?:\s+timer|\s+session)?$/i],
    speechFeedback: 'Timer paused.',
    description: 'Temporarily pause the active countdown.',
  },
  {
    action: 'TIMER_RESUME',
    phrases: [
      'resume timer',
      'unpause',
      'keep going',
      'resume',
      'continue',
    ],
    patterns: [/^(?:resume|continue|unpause|keep\s+going)(?:\s+timer|\s+session)?$/i],
    speechFeedback: 'Resuming timer countdown.',
    description: 'Resume the paused timer.',
  },
  {
    action: 'TIMER_STOP',
    phrases: [
      'stop timer',
      'finish task',
      'task done',
      'wrap it up',
      'end timer',
      'complete task',
    ],
    patterns: [/^(?:stop|finish|end|complete|wrap\s+it\s+up|done)(?:\s+the)?(?:\s+timer|\s+task|\s+session)?$/i],
    speechFeedback: 'Focus session completed. Great discipline!',
    description: 'Finish the active timer and log accomplishments.',
  },
  {
    action: 'TIMER_STOP',
    phrases: [
      'cancel timer',
      'abort task',
      'abort timer',
      'cancel task',
    ],
    patterns: [/^(?:cancel|abort)(?:\s+the)?(?:\s+timer|\s+task|\s+session)?$/i],
    speechFeedback: 'Timer cancelled.',
    description: 'Cancel or abort active timer.',
  },
  {
    action: 'TIMER_EXTEND',
    phrases: [
      'add 5 minutes',
      'add 10 minutes',
      'give me 5 more minutes',
      'give me more time',
      'extend timer',
      'extend 5 minutes',
      'extend 10 minutes',
    ],
    patterns: [/(?:add|extend|give\s+me)\s*(?:by)?\s*(\d+)\s*(?:more)?\s*(?:min|minute|minutes|m)?/i],
    extendMinutes: 5,
    speechFeedback: 'Extending timer.',
    description: 'Add extra minutes to the active focus session.',
  },
  {
    action: 'TIMER_SET_INTERVAL',
    phrases: [
      'set interval 5 minutes',
      'set interval 10 minutes',
      'set interval 15 minutes',
      'remind me every 10 minutes',
      'remind me every 5 minutes',
      'set interval every 10 minutes',
      'notify every 5 minutes',
      'interval alert 15 minutes',
      'set interval',
    ],
    patterns: [/(?:set\s+interval|notify|alert|remind\s+me)\s*(?:every)?\s*(\d+)\s*(?:min|minute|minutes|m)?/i],
    intervalMinutes: 10,
    speechFeedback: 'Milestone interval alert updated.',
    description: 'Configure recurring milestone alert ticks and border flashes.',
  },

  // ==========================================
  // 3. MOVERS PROTOCOL TASK CREATION (TASK_CREATE)
  // ==========================================
  {
    action: 'TIMER_START',
    taskName: 'Meditation',
    phrases: [
      'start meditation',
      'meditate for 10 minutes',
      'start meditation for 10 minutes',
      'meditate 10 minutes',
      '10 minute meditation',
    ],
    patterns: [/(?:start|create)?\s*(?:a\s+)?meditation(?:\s+for|\s+of)?\s*(\d+)?\s*(?:min|minute|minutes)?/i],
    category: 'Meditation',
    durationMinutes: 10,
    earnedCoins: 30,
    speechFeedback: 'Setting up 10-minute Meditation and Centering block (+30 Slake Coins).',
    description: 'M: Meditation & Mindfulness pillar',
  },
  {
    action: 'TIMER_START',
    taskName: 'Deep Breathing',
    phrases: [
      'start deep breathing',
      'oxygenation session',
      'breathe in and out',
      'oxygenation deep breathing 4 minutes',
      'breathing exercise 4 minutes',
      'deep breathing',
      'box breathing',
      'pranayama',
    ],
    patterns: [/(?:start|create)?\s*(?:a\s+)?(?:deep\s+breathing|oxygenation|box\s+breathing|breathwork|pranayama)(?:\s+for|\s+of)?\s*(\d+)?\s*(?:min|minute|minutes)?/i],
    category: 'Meditation',
    durationMinutes: 4,
    earnedCoins: 30,
    speechFeedback: 'Starting 4-minute Oxygenation and Deep Breathing session (+30 Slake Coins).',
    description: 'O: Oxygenation & Breathwork pillar',
  },
  {
    action: 'TIMER_START',
    taskName: 'Visualization',
    phrases: [
      'start visualization',
      'mental rehearsal',
      'visualization session',
      'daily visualization',
      'strategic planning visualization',
    ],
    patterns: [/(?:start|create)?\s*(?:a\s+)?(?:visualization|mental\s+rehearsal)(?:\s+for|\s+of)?\s*(\d+)?\s*(?:min|minute|minutes)?/i],
    category: 'Productivity',
    durationMinutes: 10,
    earnedCoins: 30,
    speechFeedback: 'Preparing 10-minute Mental Rehearsal & Visualization block (+30 Slake Coins).',
    description: 'V: Visualization & Mental Rehearsal pillar',
  },
  {
    action: 'TIMER_START',
    taskName: 'Workout',
    phrases: [
      'start workout',
      'exercise for 20 minutes',
      'morning stretch',
      'morning workout',
      'exercise 20 minutes',
      'gym session',
    ],
    patterns: [/(?:start|create)?\s*(?:a\s+)?(?:workout|exercise|morning\s+stretch|gym)(?:\s+for|\s+of)?\s*(\d+)?\s*(?:min|minute|minutes)?/i],
    category: 'Fitness',
    durationMinutes: 20,
    earnedCoins: 40,
    speechFeedback: 'Starting 20-minute Energizing Exercise & Movement block (+40 Slake Coins).',
    description: 'E: Exercise & Physical Activation pillar',
  },
  {
    action: 'TIMER_START',
    taskName: 'Wisdom Reading',
    phrases: [
      'start reading',
      'wisdom reading',
      'read 15 minutes',
      'reading session',
      'book reading',
    ],
    patterns: [/(?:start|create)?\s*(?:a\s+)?(?:reading|wisdom\s+reading|book)(?:\s+for|\s+of)?\s*(\d+)?\s*(?:min|minute|minutes)?/i],
    category: 'Creativity',
    durationMinutes: 15,
    earnedCoins: 30,
    speechFeedback: 'Starting 15-minute Wisdom Reading block (+30 Slake Coins).',
    description: 'R: Reading Positive Wisdom pillar',
  },
  {
    action: 'TIMER_START',
    taskName: 'Journaling',
    phrases: [
      'start scribing',
      'journal for 10 minutes',
      'log thoughts',
      'journal 10 minutes',
      'scribing 10 minutes',
      'evening reflection journal',
      'write journal',
    ],
    patterns: [/(?:start|create)?\s*(?:a\s+)?(?:journal|scribing|log\s+thoughts|reflection)(?:\s+for|\s+of)?\s*(\d+)?\s*(?:min|minute|minutes)?/i],
    category: 'Creativity',
    durationMinutes: 10,
    earnedCoins: 30,
    speechFeedback: 'Setting up 10-minute Scribing and Journaling block (+30 Slake Coins).',
    description: 'S: Scribing & Daily Progress Tracking pillar',
  },
  {
    action: 'TIMER_START',
    taskName: 'Deep Work',
    phrases: [
      'start deep work',
      'code for 45 minutes',
      'focus block 30 minutes',
      'deep work 45 minutes',
      'coding session 60 minutes',
      'focus work 30 minutes',
    ],
    patterns: [/(?:start|create)?\s*(?:a\s+)?(?:deep\s+work|coding|focus\s+block|study)(?:\s+for|\s+of)?\s*(\d+)?\s*(?:min|minute|minutes)?/i],
    category: 'Productivity',
    durationMinutes: 45,
    earnedCoins: 50,
    speechFeedback: 'Preparing Deep Work session (+50 Slake Coins).',
    description: 'High-cognitive velocity deep work block',
  },
  {
    action: 'TIMER_START',
    taskName: 'Hydration Break',
    phrases: [
      'drink water timer',
      'hydrate now',
      'drink water',
      'hydration break',
      'drink a glass of water',
    ],
    patterns: [/(?:start|create)?\s*(?:a\s+)?(?:drink\s+water|hydrate\s+now|water\s+break)(?:\s+timer)?(?:\s+for|\s+of)?\s*(\d+)?\s*(?:min|minute|minutes)?/i],
    category: 'Hydration',
    durationMinutes: 2,
    earnedCoins: 15,
    speechFeedback: 'Starting 2-minute Hydration & Recovery pause (+15 Slake Coins).',
    description: 'Hydration & physical cell replenishment',
  },
  {
    action: 'TIMER_START',
    taskName: 'Clean Workspace',
    phrases: [
      'clean workspace',
      'tidy desk',
      'clean desk',
      'tidy workspace',
      'organize desk',
    ],
    patterns: [/(?:start|create)?\s*(?:a\s+)?(?:clean\s+workspace|tidy\s+desk|clean\s+desk|tidy\s+workspace)(?:\s+for|\s+of)?\s*(\d+)?\s*(?:min|minute|minutes)?/i],
    category: 'Hygiene',
    durationMinutes: 5,
    earnedCoins: 15,
    speechFeedback: 'Setting up 5-minute Workspace Organization reset (+15 Slake Coins).',
    description: 'Domestic & workspace reset',
  },

  // ==========================================
  // 4. INSTANT QUICK-LOGGING (TASK_LOG_QUICK)
  // ==========================================
  {
    action: 'TASK_LOG_QUICK',
    taskName: 'Drink a Glass of Water',
    phrases: [
      'log water',
      'drank a glass of water',
      'water logged',
      'drank water',
      'water break done',
    ],
    patterns: [/^(?:log\s+water|drank\s+(?:a\s+)?(?:glass\s+of\s+)?water|water\s+logged)$/i],
    category: 'Hydration',
    durationMinutes: 1,
    earnedCoins: 15,
    speechFeedback: 'Water intake logged. +15 Slake Coins earned for cellular hydration!',
    description: 'Quick-log 1 glass of water (+15 SC)',
  },
  {
    action: 'TASK_LOG_QUICK',
    taskName: 'Make Bed',
    phrases: [
      'bed made',
      'made my bed',
      'desk organized',
      'bed is made',
      'tidy workspace done',
    ],
    patterns: [/^(?:bed\s+made|made\s+(?:my\s+)?bed|desk\s+organized)$/i],
    category: 'Hygiene',
    durationMinutes: 5,
    earnedCoins: 15,
    speechFeedback: 'Bed made and workspace organized. +15 Slake Coins earned for domestic discipline!',
    description: 'Habit anchor: Made bed (+15 SC)',
  },
  {
    action: 'TASK_LOG_QUICK',
    taskName: 'Quick Stretch',
    phrases: [
      'quick stretch done',
      'completed 10 pushups',
      'pushups done',
      'stretch completed',
      'workout done',
    ],
    patterns: [/^(?:quick\s+stretch\s+done|completed\s+\d+\s+pushups|pushups\s+done)$/i],
    category: 'Fitness',
    durationMinutes: 5,
    earnedCoins: 40,
    speechFeedback: 'Physical stretch logged. +40 Slake Coins earned for movement!',
    description: 'Movement reset: Quick stretch (+40 SC)',
  },

  // ==========================================
  // 5. COACH CO-OP (COOP_ACTION)
  // ==========================================
  {
    action: 'COOP_ACTION',
    phrases: [
      'invite co reformer',
      'start partner session',
      'invite friend',
      'invite partner',
      'co op invite',
    ],
    patterns: [/(?:invite|add)\s+(?:a\s+)?(?:co\s*reformer|partner|friend|member)/i, /start\s+partner\s+session/i],
    coopAction: 'invite',
    speechFeedback: 'Opening Co-op Reformer invitations.',
    description: 'Generate co-op partner invite code',
  },
  {
    action: 'COOP_ACTION',
    phrases: [
      'coach start group sprint',
      'start class timer',
      'start group sprint',
      'start co op timer',
      'begin group sprint',
    ],
    patterns: [/(?:coach\s+)?(?:start|begin)\s+(?:group\s+sprint|co\s*op\s+timer|class\s+timer|cluster\s+timer)/i],
    coopAction: 'start_sprint',
    speechFeedback: 'Synchronizing and starting group sprint for all connected members.',
    description: 'Coach-led synchronized cluster timer initiation',
  },
  {
    action: 'COOP_ACTION',
    phrases: [
      'coach pause group timer',
      'pause group timer',
      'pause co op',
      'hold group timer',
    ],
    patterns: [/(?:coach\s+)?(?:pause|hold)\s+(?:group\s+timer|co\s*op|cluster\s+session)/i],
    coopAction: 'pause_group',
    speechFeedback: 'Group session paused across the cluster.',
    description: 'Pause synchronized co-op timer',
  },

  // ==========================================
  // 6. REWARDS & PAYOUT (REWARDS_ACTION)
  // ==========================================
  {
    action: 'REWARDS_ACTION',
    phrases: [
      'redeem payout',
      'withdraw cash',
      'claim 10 rupees',
      'withdraw 10 rupees',
      'request payout',
      'cash out',
    ],
    patterns: [/(?:redeem\s+payout|withdraw\s+cash|claim\s+10\s+rupees|withdraw|cash\s+out|claim\s+payout)/i],
    rewardsAction: 'redeem',
    speechFeedback: 'Opening Direct UPI Payout redemption modal.',
    description: 'Direct UPI cash payout redemption flow',
  },
  {
    action: 'REWARDS_ACTION',
    phrases: [
      'pin certificate',
      'feature my certificate',
      'pin certificate to profile',
      'pin my certificate',
      'pin badge',
    ],
    patterns: [/(?:pin\s+certificate|feature\s+(?:my\s+)?certificate|pin\s+my\s+cert|pin\s+to\s+profile)/i],
    rewardsAction: 'pin_certificate',
    speechFeedback: 'Accessing Certificate Showcase to pin credentials to your public profile.',
    description: 'Pin milestone certificates to Reformers showcase',
  },
  {
    action: 'REWARDS_ACTION',
    phrases: [
      'check coin balance',
      'how many coins do I have',
      'how many coins',
      'what is my balance',
      'coin balance',
    ],
    patterns: [/(?:check|view|what\s+is\s+my|how\s+many)?\s*(?:coin\s+balance|coins\s+do\s+i\s+have|coins|slake\s+credits)/i],
    rewardsAction: 'check_balance',
    speechFeedback: 'Checking your Slake Coin balance and daily earnings.',
    description: 'Inspect earned Slake Coins and daily tally',
  },

  // ==========================================
  // 7. SENSORS & ENVIRONMENTS (SENSOR_ENVIRONMENT_TOGGLE)
  // ==========================================
  {
    action: 'SENSOR_ENVIRONMENT_TOGGLE',
    actionType: 'TOGGLE_EYE_TRACKING_ON',
    phrases: [
      'turn on eye tracking',
      'enable gaze control',
      'enable eye tracking',
      'start gaze tracking',
      'turn on gaze control',
    ],
    patterns: [/(?:turn\s+on|enable|start)\s+(?:eye\s+tracking|gaze\s+control|gaze\s+dwell)/i],
    sensorType: 'eye_tracking',
    sensorState: 'on',
    speechFeedback: 'Eye tracking and gaze control activated.',
    description: 'Activate webcam-based gaze tracking',
  },
  {
    action: 'SENSOR_ENVIRONMENT_TOGGLE',
    actionType: 'TOGGLE_EYE_TRACKING_OFF',
    phrases: [
      'turn off eye tracking',
      'disable gaze control',
      'turn off gaze control',
      'disable eye tracking',
      'stop gaze tracking',
    ],
    patterns: [/(?:turn\s+off|disable|stop)\s+(?:eye\s+tracking|gaze\s+control|gaze\s+dwell)/i],
    sensorType: 'eye_tracking',
    sensorState: 'off',
    speechFeedback: 'Eye tracking disabled and camera stream released.',
    description: 'Deactivate webcam gaze tracking and release camera',
  },
  {
    action: 'SENSOR_ENVIRONMENT_TOGGLE',
    actionType: 'AUDIO_WATER_ON',
    phrases: [
      'turn on water sounds',
      'play pouring audio',
      'enable water sounds',
      'water sounds on',
      'soundscape water',
    ],
    patterns: [/(?:turn\s+on|enable|play)\s+(?:water\s+sounds|pouring\s+audio|waterfall|hydration\s+audio)/i],
    sensorType: 'water_sounds',
    sensorState: 'on',
    speechFeedback: 'Procedural hydration pouring soundscape enabled.',
    description: 'Enable procedural Web Audio water soundscape',
  },
  {
    action: 'SENSOR_ENVIRONMENT_TOGGLE',
    actionType: 'AUDIO_MUTE',
    phrases: [
      'mute sounds',
      'silent mode',
      'turn off sounds',
      'disable audio',
      'mute audio',
    ],
    patterns: [/(?:mute|turn\s+off|disable)\s+(?:sound|sounds|audio|soundscape)/i, /^silent\s+mode$/i],
    sensorType: 'ambient_noise',
    sensorState: 'off',
    speechFeedback: 'Ambient audio muted.',
    description: 'Silence background audio synthesis',
  },
  {
    action: 'SENSOR_ENVIRONMENT_TOGGLE',
    actionType: 'AUDIO_BREATHE_ON',
    phrases: [
      'enable breathing chimes',
      'turn on breathing chimes',
      'play breathing chimes',
      'breathing chimes on',
    ],
    patterns: [/(?:turn\s+on|enable|play)\s+(?:breathing\s+chimes|breath\s+chimes)/i],
    sensorType: 'breathing_chimes',
    sensorState: 'on',
    speechFeedback: 'Procedural box breathing harmonic chimes enabled.',
    description: 'Enable procedural harmonic breathing audio',
  },

  // ==========================================
  // 8. MODAL CONTROL (MODAL_DISMISS)
  // ==========================================
  {
    action: 'MODAL_DISMISS',
    phrases: [
      'close this',
      'dismiss popup',
      'cancel',
      'never mind',
      'dismiss',
      'exit',
    ],
    patterns: [/^(?:close\s+this|dismiss(?:\s+popup)?|cancel|never\s+mind|exit|close)$/i],
    speechFeedback: 'Dismissed.',
    description: 'Dismiss floating HUD and cancel prompt.',
  },
];
