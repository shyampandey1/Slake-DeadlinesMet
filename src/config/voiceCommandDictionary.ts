import { VoiceIntentAction, VoiceCategory, VoiceRoute } from '@/types/voice';

export interface CommandDefinition {
  action: VoiceIntentAction;
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
  sensorType?: 'eye_tracking' | 'water_sounds' | 'ambient_noise';
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
    phrases: ['go home', 'open home', 'take me home', 'dashboard', 'homescreen'],
    patterns: [/^(?:go\s+to\s+|open\s+|take\s+me\s+to\s+)?(?:home|dashboard|homescreen)$/i],
    targetRoute: '/',
    speechFeedback: 'Navigating to Homescreen.',
    description: 'Jump to the main dashboard and active countdown.'
  },
  {
    action: 'NAVIGATE',
    phrases: ['open routine', 'show routine', 'go to routine', 'my routines', 'routine schedule'],
    patterns: [/(?:open|show|go to|view)\s+(?:my\s+)?routine/i],
    targetRoute: '/routine',
    speechFeedback: 'Opening your Routine schedule.',
    description: 'View and adjust daily profession and MOVERS schedule.'
  },
  {
    action: 'NAVIGATE',
    phrases: ['show reformers league', 'open reformers', 'go to reformers', 'reformers league', 'community'],
    patterns: [/(?:open|show|go to|view)\s+(?:the\s+)?reformer(?:s)?(?:\s+league)?/i],
    targetRoute: '/reformers',
    speechFeedback: 'Entering the Reformers League.',
    description: 'Check global leaderboard, co-op peers, and league status.'
  },
  {
    action: 'NAVIGATE',
    phrases: ['open rewards', 'show rewards', 'achievement center', 'achievements', 'go to rewards'],
    patterns: [/(?:open|show|go to|view)\s+(?:my\s+)?(?:rewards|achievement(?:s)?(?:\s+center)?|gamification)/i],
    targetRoute: '/rewards',
    speechFeedback: 'Opening Achievement Center and Rewards.',
    description: 'Redeem Slake Coins, certificates, and view badges.'
  },
  {
    action: 'NAVIGATE',
    phrases: ['show task log book', 'open logbook', 'go to logbook', 'history', 'task history', 'show history'],
    patterns: [/(?:open|show|go to|view)\s+(?:task\s+)?(?:log\s*book|logbook|history)/i],
    targetRoute: '/logbook',
    speechFeedback: 'Opening your Task Log Book and Behavioral Insights.',
    description: 'Review completed tasks, performance graphs, and JEV insights.'
  },
  {
    action: 'NAVIGATE',
    phrases: ['open settings', 'go to settings', 'preferences', 'app settings'],
    patterns: [/(?:open|show|go to|view)\s+(?:app\s+)?(?:settings|preferences)/i],
    targetRoute: '/settings',
    speechFeedback: 'Opening Settings.',
    description: 'Configure notifications, audio, and profile settings.'
  },

  // ==========================================
  // 2. TIMER CONTROLS (TIMER_*)
  // ==========================================
  {
    action: 'TIMER_START',
    phrases: ['start timer', 'start focus', 'begin timer', 'countdown start', 'start session'],
    patterns: [/^(?:start|begin)\s+(?:the\s+)?(?:timer|focus|countdown|session)$/i],
    speechFeedback: 'Starting focus timer.',
    description: 'Initiate the running timer for the current task.'
  },
  {
    action: 'TIMER_PAUSE',
    phrases: ['pause', 'pause timer', 'hold on', 'pause session', 'freeze timer'],
    patterns: [/^(?:pause|hold\s+on|freeze)(?:\s+timer|\s+session)?$/i],
    speechFeedback: 'Timer paused.',
    description: 'Temporarily pause the active countdown.'
  },
  {
    action: 'TIMER_RESUME',
    phrases: ['resume', 'continue', 'resume timer', 'unpause', 'keep going'],
    patterns: [/^(?:resume|continue|unpause|keep\s+going)(?:\s+timer|\s+session)?$/i],
    speechFeedback: 'Resuming timer countdown.',
    description: 'Resume the paused timer.'
  },
  {
    action: 'TIMER_STOP',
    phrases: ['finish task', 'stop timer', 'end timer', 'complete task', 'task done'],
    patterns: [/^(?:stop|finish|end|complete|done)(?:\s+the)?(?:\s+timer|\s+task|\s+session)?$/i],
    speechFeedback: 'Focus session completed. Great discipline!',
    description: 'Finish the active timer and log accomplishments.'
  },
  {
    action: 'TIMER_EXTEND',
    phrases: ['add 5 minutes', 'add 10 minutes', 'extend 5 minutes', 'give me more time', 'extend timer'],
    patterns: [/(?:add|extend|give\s+me)\s*(?:by)?\s*(\d+)\s*(?:more)?\s*(?:min|minute|minutes|m)?/i],
    extendMinutes: 5,
    speechFeedback: 'Extending timer.',
    description: 'Add extra minutes to the active focus session.'
  },
  {
    action: 'TIMER_SET_INTERVAL',
    phrases: ['set interval every 10 minutes', 'notify every 5 minutes', 'interval alert 15 minutes', 'set interval'],
    patterns: [/(?:set\s+interval|notify|alert)\s*(?:every)?\s*(\d+)\s*(?:min|minute|minutes|m)?/i],
    intervalMinutes: 10,
    speechFeedback: 'Milestone interval alert updated.',
    description: 'Configure recurring milestone alert ticks and border flashes.'
  },

  // ==========================================
  // 3. MOVERS PROTOCOL TASK CREATION (TASK_CREATE)
  // ==========================================
  {
    action: 'TIMER_START',
    taskName: 'Meditation',
    phrases: ['start meditation for 10 minutes', 'meditate 10 minutes', '10 minute meditation'],
    patterns: [/(?:start|create)?\s*(?:a\s+)?meditation(?:\s+for|\s+of)?\s*(\d+)?\s*(?:min|minute|minutes)?/i],
    category: 'Meditation',
    durationMinutes: 10,
    speechFeedback: 'Setting up 10-minute Meditation and Centering block.',
    description: 'M: Meditation & Mindfulness pillar'
  },
  {
    action: 'TIMER_START',
    phrases: [
      'deep breathing in 30 seconds',
      'deep breathing 30 seconds',
      'deep breathing 1 minute',
      'deep breating 1 minute',
      'deep breathing for 1 minute',
      'oxygenation deep breathing 4 minutes',
      'breathing exercise 4 minutes',
      'deep breathing',
      'deep breating',
      'breathwork',
      'box breathing',
      'pranayama'
    ],
    patterns: [
      /(?:start|begin|do)?\s*(?:an\s+)?(?:oxygenation|deep\s+breathing|deep\s+breating|breathing|breating|breathwork|box\s+breathing)(?:\s+in|\s+for|\s+of)?\s*(\d+(?:\.\d+)?|\bhalf\b)?\s*(?:sec|second|seconds|s|min|minute|minutes|m)?/i,
      /(\d+(?:\.\d+)?)\s*(?:sec|second|seconds|s|min|minute|minutes|m)?\s*(?:of\s+)?(?:deep\s+breathing|deep\s+breating|breathing|breating|breathwork)/i
    ],
    taskName: 'Deep Breathing',
    category: 'Meditation',
    durationMinutes: 1,
    durationSeconds: 60,
    speechFeedback: 'Starting Deep Breathing exercise in full screen.',
    description: 'O: Oxygenation & Breathwork protocol'
  },
  {
    action: 'TIMER_START',
    taskName: 'Goal Visualization',
    phrases: ['goal visualization 10 minutes', 'visualize goals', 'mental rehearsal 10 minutes'],
    patterns: [/(?:start|create)?\s*(?:a\s+)?(?:goal\s+)?visualization(?:\s+for|\s+of)?\s*(\d+)?\s*(?:min|minute|minutes)?/i],
    category: 'Productivity',
    durationMinutes: 10,
    speechFeedback: 'Setting up 10-minute Goal Visualization session.',
    description: 'V: Visualization & Mental Clarity pillar'
  },
  {
    action: 'TIMER_START',
    taskName: 'Workout',
    phrases: ['workout 20 minutes', 'exercise 20 minutes', 'morning workout', 'fitness session'],
    patterns: [/(?:start|create)?\s*(?:a\s+)?(?:workout|exercise|fitness|gym)(?:\s+for|\s+of)?\s*(\d+)?\s*(?:min|minute|minutes)?/i],
    category: 'Fitness',
    durationMinutes: 20,
    speechFeedback: 'Starting 20-minute Physical Activation Workout.',
    description: 'E: Exercise & Movement pillar'
  },
  {
    action: 'TIMER_START',
    taskName: 'Positive Reading',
    phrases: ['read positive 15 minutes', 'reading positive books', 'positive reading 15 minutes'],
    patterns: [/(?:start|create)?\s*(?:a\s+)?(?:read\s+positive|positive\s+reading|reading)(?:\s+for|\s+of)?\s*(\d+)?\s*(?:min|minute|minutes)?/i],
    category: 'Creativity',
    durationMinutes: 15,
    speechFeedback: 'Starting 15-minute Positive Reading block.',
    description: 'R: Reading Positive Wisdom pillar'
  },
  {
    action: 'TIMER_START',
    taskName: 'Journaling',
    phrases: ['journal 10 minutes', 'scribing 10 minutes', 'evening reflection journal', 'write journal'],
    patterns: [/(?:start|create)?\s*(?:a\s+)?(?:journal|scribing|reflection)(?:\s+for|\s+of)?\s*(\d+)?\s*(?:min|minute|minutes)?/i],
    category: 'Creativity',
    durationMinutes: 10,
    speechFeedback: 'Setting up 10-minute Scribing and Journaling block.',
    description: 'S: Scribing & Daily Progress Tracking pillar'
  },
  {
    action: 'TIMER_START',
    taskName: 'Deep Work',
    phrases: ['deep work 45 minutes', 'coding session 60 minutes', 'focus work 30 minutes'],
    patterns: [/(?:start|create)?\s*(?:a\s+)?(?:deep\s+work|coding|focus\s+work|study)(?:\s+for|\s+of)?\s*(\d+)?\s*(?:min|minute|minutes)?/i],
    category: 'Productivity',
    durationMinutes: 45,
    speechFeedback: 'Preparing Deep Work session.',
    description: 'High-cognitive velocity deep work block'
  },
  {
    action: 'TIMER_START',
    taskName: 'Hydration Break',
    phrases: ['drink water timer', 'hydration timer 5 minutes', 'water break timer'],
    patterns: [/(?:start|create)?\s*(?:a\s+)?(?:drink\s+water|hydration|water\s+break)(?:\s+timer)?(?:\s+for|\s+of)?\s*(\d+)?\s*(?:min|minute|minutes)?/i],
    category: 'Hydration',
    durationMinutes: 5,
    speechFeedback: 'Starting 5-minute Hydration & Recovery pause.',
    description: 'Hydration & physical cell replenishment'
  },

  {
    action: 'TIMER_START',
    taskName: 'Drink a Glass of Water',
    phrases: [
      'drink a glass of water in 1 minute',
      'drink a glass of water in one minute',
      'drink a glass of water',
      'drink water in 1 minute',
      'drink water in one minute',
      'drink water',
      'drink glass of water',
      'glass of water'
    ],
    patterns: [
      /(?:start|begin|do)?\s*(?:a\s+)?drink\s+(?:a\s+)?(?:glass\s+of\s+)?(?:water|hydration)(?:\s+in|\s+for|\s+of)?\s*(\d+(?:\.\d+)?|half)?\s*(?:sec|second|seconds|s|min|minute|minutes|m)?/i,
      /(\d+(?:\.\d+)?)\s*(?:sec|second|seconds|s|min|minute|minutes|m)?\s*(?:to\s+)?(?:drink\s+(?:a\s+)?(?:glass\s+of\s+)?water)/i
    ],
    category: 'Hydration',
    durationMinutes: 1,
    durationSeconds: 60,
    speechFeedback: 'Starting 1-minute timer to drink a glass of water in full screen.',
    description: 'Hydration & physical cell replenishment timer'
  },
  {
    action: 'TIMER_START',
    taskName: 'Make Bed',
    phrases: [
      'make bed in 2 minutes',
      'make my bed in 2 minutes',
      'make bed',
      'make my bed'
    ],
    patterns: [
      /(?:start|begin|do)?\s*(?:make|set)\s+(?:the\s+|my\s+)?bed(?:\s+in|\s+for|\s+of)?\s*(\d+(?:\.\d+)?|half)?\s*(?:sec|second|seconds|s|min|minute|minutes|m)?/i
    ],
    category: 'Hygiene',
    durationMinutes: 2,
    durationSeconds: 120,
    speechFeedback: 'Starting 2-minute timer for Make Bed in full screen.',
    description: 'Domestic setup step: Make bed'
  },
  {
    action: 'TIMER_START',
    taskName: 'Quick Stretch',
    phrases: [
      'quick stretch 5 minutes',
      'stretch for 5 minutes',
      'quick stretch',
      'do a stretch'
    ],
    patterns: [
      /(?:start|begin|do)?\s*(?:a\s+)?(?:quick\s+)?stretch(?:ing)?(?:\s+in|\s+for|\s+of)?\s*(\d+(?:\.\d+)?|half)?\s*(?:sec|second|seconds|s|min|minute|minutes|m)?/i
    ],
    category: 'Fitness',
    durationMinutes: 5,
    durationSeconds: 300,
    speechFeedback: 'Starting 5-minute Quick Stretch session in full screen.',
    description: 'Movement reset: Quick stretch'
  },

  // ==========================================
  // 4. QUICK LOGGING (TASK_LOG_QUICK - EXPLICIT PAST TENSE ONLY)
  // ==========================================
  {
    action: 'TASK_LOG_QUICK',
    phrases: ['log water', 'drank water', 'already drank water', 'water logged', 'drank a glass of water'],
    patterns: [
      /^(?:i\s+)?(?:already\s+)?(?:drank|logged)\s+(?:a\s+)?(?:glass\s+of\s+)?(?:water|hydration)$/i,
      /^(?:water|hydration)\s+(?:logged|done|checked|finished)$/i
    ],
    category: 'Hydration',
    durationMinutes: 1,
    earnedCoins: 15,
    speechFeedback: 'Logged 1 glass of water. +15 Slake Coins added to your balance!',
    description: 'Quick log 1 glass of water (+15 SC)'
  },
  {
    action: 'TASK_LOG_QUICK',
    phrases: ['bed made', 'already made bed', 'log bed made', 'made my bed'],
    patterns: [
      /^(?:i\s+)?(?:already\s+)?made\s+(?:my\s+)?bed$/i,
      /^(?:bed\s+made|bed\s+done|log\s+bed)$/i
    ],
    category: 'Hygiene',
    durationMinutes: 2,
    earnedCoins: 15,
    speechFeedback: 'Bed made and room prepared! +15 Slake Coins earned.',
    description: 'Domestic setup step: Bed made (+15 SC)'
  },
  {
    action: 'TASK_LOG_QUICK',
    phrases: ['quick stretch done', 'stretching done', 'did my stretch', 'stretch completed'],
    patterns: [
      /^(?:i\s+)?(?:already\s+)?(?:completed|finished|did)\s+(?:my\s+)?(?:quick\s+)?stretch$/i,
      /^(?:quick\s+stretch|stretching|stretch)\s+(?:done|completed|logged)$/i
    ],
    category: 'Fitness',
    durationMinutes: 5,
    earnedCoins: 40,
    speechFeedback: 'Physical stretch logged. +40 Slake Coins earned for movement!',
    description: 'Movement reset: Quick stretch (+40 SC)'
  },

  // ==========================================
  // 5. COACH CO-OP (COOP_ACTION)
  // ==========================================
  {
    action: 'COOP_ACTION',
    phrases: ['invite co reformer', 'invite friend', 'invite partner', 'co op invite'],
    patterns: [/(?:invite|add)\s+(?:a\s+)?(?:co\s*reformer|partner|friend|member)/i],
    coopAction: 'invite',
    speechFeedback: 'Opening Co-op Reformer invitations.',
    description: 'Generate co-op partner invite code'
  },
  {
    action: 'COOP_ACTION',
    phrases: ['start group sprint', 'start co op timer', 'begin group sprint'],
    patterns: [/(?:start|begin)\s+(?:group\s+sprint|co\s*op\s+timer|cluster\s+timer)/i],
    coopAction: 'start_sprint',
    speechFeedback: 'Synchronizing and starting group sprint for all connected members.',
    description: 'Coach-led synchronized cluster timer initiation'
  },
  {
    action: 'COOP_ACTION',
    phrases: ['pause group timer', 'pause co op', 'hold group timer'],
    patterns: [/(?:pause|hold)\s+(?:group\s+timer|co\s*op|cluster\s+session)/i],
    coopAction: 'pause_group',
    speechFeedback: 'Group session paused across the cluster.',
    description: 'Pause synchronized co-op timer'
  },

  // ==========================================
  // 6. REWARDS & PAYOUT (REWARDS_ACTION)
  // ==========================================
  {
    action: 'REWARDS_ACTION',
    phrases: ['redeem payout', 'withdraw 10 rupees', 'request payout', 'cash out'],
    patterns: [/(?:redeem\s+payout|withdraw|cash\s+out|claim\s+payout)/i],
    rewardsAction: 'redeem',
    speechFeedback: 'Opening Direct UPI Payout redemption modal.',
    description: 'Direct UPI cash payout redemption flow'
  },
  {
    action: 'REWARDS_ACTION',
    phrases: ['pin certificate to profile', 'pin my certificate', 'pin badge'],
    patterns: [/(?:pin\s+certificate|pin\s+my\s+cert|pin\s+to\s+profile)/i],
    rewardsAction: 'pin_certificate',
    speechFeedback: 'Accessing Certificate Showcase to pin credentials to your public profile.',
    description: 'Pin milestone certificates to Reformers showcase'
  },
  {
    action: 'REWARDS_ACTION',
    phrases: ['check coin balance', 'how many coins', 'what is my balance', 'coin balance'],
    patterns: [/(?:check|view|what\s+is\s+my)?\s*(?:coin\s+balance|coins|slake\s+credits)/i],
    rewardsAction: 'check_balance',
    speechFeedback: 'Checking your Slake Coin balance and daily earnings.',
    description: 'Inspect earned Slake Coins and daily tally'
  },

  // ==========================================
  // 7. SENSORS & ENVIRONMENTS (SENSOR_ENVIRONMENT_TOGGLE)
  // ==========================================
  {
    action: 'SENSOR_ENVIRONMENT_TOGGLE',
    phrases: ['turn on eye tracking', 'turn off eye tracking', 'enable gaze dwell', 'disable gaze dwell'],
    patterns: [/(?:turn\s+on|turn\s+off|enable|disable|toggle)\s+(?:eye\s+tracking|gaze|dwell)/i],
    sensorType: 'eye_tracking',
    speechFeedback: 'Toggling gaze and cursor dwell mode.',
    description: 'Toggle hands-free 1.5s gaze/cursor dwell navigation'
  },
  {
    action: 'SENSOR_ENVIRONMENT_TOGGLE',
    phrases: ['enable water sounds', 'turn on water sounds', 'water sounds on', 'soundscape water'],
    patterns: [/(?:turn\s+on|enable|play)\s+(?:water\s+sounds|waterfall|hydration\s+audio)/i],
    sensorType: 'water_sounds',
    sensorState: 'on',
    speechFeedback: 'Procedural hydration pouring soundscape enabled.',
    description: 'Enable procedural Web Audio water soundscape'
  },
  {
    action: 'SENSOR_ENVIRONMENT_TOGGLE',
    phrases: ['mute sounds', 'turn off sounds', 'disable audio', 'silent mode'],
    patterns: [/(?:mute|turn\s+off|disable)\s+(?:sound|sounds|audio|soundscape)/i],
    sensorType: 'ambient_noise',
    sensorState: 'off',
    speechFeedback: 'Ambient audio muted.',
    description: 'Silence background audio synthesis'
  },

  // ==========================================
  // 8. MODAL CONTROL (MODAL_DISMISS)
  // ==========================================
  {
    action: 'MODAL_DISMISS',
    phrases: ['dismiss', 'close this', 'cancel', 'never mind', 'exit'],
    patterns: [/^(?:dismiss|close\s+this|cancel|never\s+mind|exit|close)$/i],
    speechFeedback: 'Dismissed.',
    description: 'Close active modal or HUD'
  }
];

export const getFewShotExamples = () => {
  return VOICE_COMMAND_DICTIONARY.map(cmd => ({
    sampleInput: cmd.phrases[0],
    action: cmd.action,
    description: cmd.description,
    speechFeedback: cmd.speechFeedback
  }));
};
