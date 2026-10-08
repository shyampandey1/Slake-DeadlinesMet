import { VoiceIntentAction, VoiceCategory, VoiceRoute, JEV_VOICE_DATASET, JevVoiceRecord } from '@/types/voice';

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
  coinsAwarded?: number;
  coopAction?: 'invite' | 'start_sprint' | 'pause_group';
  rewardsAction?: 'redeem' | 'withdraw' | 'pin_certificate' | 'check_balance';
  sensorType?: 'eye_tracking' | 'water_sounds' | 'ambient_noise';
  sensorState?: 'on' | 'off' | 'toggle';
  speechFeedback: string;
  description: string;
}

// Convert dataset entries from JEV_VOICE_DATASET into structured CommandDefinitions
function buildDatasetCommandDefinitions(): CommandDefinition[] {
  return JEV_VOICE_DATASET.map((item: JevVoiceRecord) => {
    let taskName: string | undefined = undefined;
    if (item.intent === 'TASK_CREATE') {
      const first = item.utterances[0] || '';
      taskName = first
        .replace(/^(?:start|begin|do|run)\s+/i, '')
        .replace(/\s+(?:timer|session|break|exercise|sprint|block|review)$/i, '')
        .trim();
      taskName = taskName.charAt(0).toUpperCase() + taskName.slice(1);
    }

    let coopAction: 'invite' | 'start_sprint' | 'pause_group' | undefined;
    if (item.actionType === 'INVITE_PARTNER') coopAction = 'invite';
    if (item.actionType === 'BROADCAST_START') coopAction = 'start_sprint';
    if (item.actionType === 'BROADCAST_PAUSE') coopAction = 'pause_group';

    let rewardsAction: 'redeem' | 'withdraw' | 'pin_certificate' | 'check_balance' | undefined;
    if (item.actionType === 'REDEEM_UPI') rewardsAction = 'redeem';
    if (item.actionType === 'PIN_CERTIFICATE') rewardsAction = 'pin_certificate';
    if (item.actionType === 'CHECK_BALANCE') rewardsAction = 'check_balance';

    let sensorType: 'eye_tracking' | 'water_sounds' | 'ambient_noise' | undefined;
    let sensorState: 'on' | 'off' | 'toggle' | undefined;
    if (item.actionType?.includes('EYE_TRACKING')) {
      sensorType = 'eye_tracking';
      sensorState = item.actionType.endsWith('ON') ? 'on' : 'off';
    } else if (item.actionType === 'AUDIO_WATER_ON') {
      sensorType = 'water_sounds';
      sensorState = 'on';
    } else if (item.actionType === 'AUDIO_BREATHE_ON') {
      sensorType = 'ambient_noise';
      sensorState = 'on';
    } else if (item.actionType === 'AUDIO_MUTE') {
      sensorType = 'ambient_noise';
      sensorState = 'off';
    }

    const durationSeconds = item.durationMinutes ? item.durationMinutes * 60 : undefined;

    return {
      action: item.intent as VoiceIntentAction,
      actionType: item.actionType,
      phrases: item.utterances,
      patterns: item.utterances.map(u => {
        const escaped = u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`^${escaped}$`, 'i');
      }),
      category: item.category as VoiceCategory | undefined,
      taskName,
      targetRoute: item.targetRoute as VoiceRoute | undefined,
      durationMinutes: item.durationMinutes,
      durationSeconds,
      extendMinutes: item.actionType === 'EXTEND' ? item.durationMinutes : undefined,
      intervalMinutes: item.actionType === 'SET_INTERVAL' ? item.durationMinutes : undefined,
      coinsAwarded: item.coinsAwarded,
      earnedCoins: item.coinsAwarded,
      coopAction,
      rewardsAction,
      sensorType,
      sensorState,
      speechFeedback: item.speechFeedback,
      description: `JEV Dataset intent: ${item.intent} (${item.actionType || 'standard'})`
    };
  });
}

const DATASET_COMMANDS = buildDatasetCommandDefinitions();

// Extended regex patterns & flexible fallback commands
const FLEXIBLE_COMMANDS: CommandDefinition[] = [
  // 1. Navigation flexible patterns
  {
    action: 'NAVIGATE',
    phrases: ['go home', 'open home', 'take me home', 'dashboard', 'main screen', 'back to dashboard'],
    patterns: [/^(?:go\s+to\s+|open\s+|take\s+me\s+to\s+)?(?:home|dashboard|homescreen|main\s+screen)$/i],
    targetRoute: '/',
    speechFeedback: 'Opening dashboard.',
    description: 'Jump to the main dashboard'
  },
  {
    action: 'NAVIGATE',
    phrases: ['open routine', 'show my routine', "today's schedule", 'check routine', 'view routine'],
    patterns: [/(?:open|show|go to|view|check)\s+(?:my\s+)?(?:routine|schedule|today'?s\s+schedule)/i],
    targetRoute: '/routine',
    speechFeedback: 'Here is your routine.',
    description: 'View daily routine schedule'
  },
  {
    action: 'NAVIGATE',
    phrases: ['go to reformers', 'open reformer league', 'show reformers', 'the league', 'community page'],
    patterns: [/(?:open|show|go to|view)\s+(?:the\s+)?(?:reformer(?:s)?(?:\s+league)?|community(?:\s+page)?)/i],
    targetRoute: '/reformers',
    speechFeedback: 'Opening Reformers League.',
    description: 'Enter Reformers League'
  },
  {
    action: 'NAVIGATE',
    phrases: ['open rewards', 'show achievement center', 'view my coins', 'check wallet', 'open achievements'],
    patterns: [/(?:open|show|go to|view|check)\s+(?:my\s+)?(?:rewards|achievement(?:s)?(?:\s+center)?|wallet|coins)/i],
    targetRoute: '/rewards',
    speechFeedback: 'Opening Achievement Center.',
    description: 'Achievement and rewards center'
  },
  {
    action: 'NAVIGATE',
    phrases: ['open log book', 'show task log', 'view insights', 'task analytics', 'open history'],
    patterns: [/(?:open|show|go to|view)\s+(?:my\s+)?(?:log\s*book|task\s*log|history|insights|analytics)/i],
    targetRoute: '/analytics',
    speechFeedback: 'Opening Task Log Book.',
    description: 'Analytics & task log book'
  },
  {
    action: 'NAVIGATE',
    phrases: ['open settings', 'preferences', 'system settings', 'app config'],
    patterns: [/(?:open|show|go to)\s+(?:settings|preferences|system\s+settings|app\s+config)/i],
    targetRoute: '/settings',
    speechFeedback: 'Opening settings.',
    description: 'App settings and preferences'
  },

  // 2. Active Timer flexible patterns
  {
    action: 'TIMER_START',
    actionType: 'START',
    phrases: ['start timer', 'begin task', 'start the clock', "let's go", 'run timer', 'start now'],
    patterns: [/^(?:start|run|begin)\s+(?:the\s+)?(?:timer|clock|now|task)$/i, /^let'?s\s+go$/i],
    speechFeedback: 'Timer started.',
    description: 'Start active countdown timer'
  },
  {
    action: 'TIMER_PAUSE',
    actionType: 'PAUSE',
    phrases: ['pause timer', 'pause the clock', 'hold on', 'wait a sec', 'take a pause', 'freeze timer'],
    patterns: [/^(?:pause|hold\s+on|wait\s+a\s+sec|take\s+a\s+pause|freeze\s+timer)/i],
    speechFeedback: 'Timer paused.',
    description: 'Pause active timer'
  },
  {
    action: 'TIMER_RESUME',
    actionType: 'RESUME',
    phrases: ['resume timer', 'unpause', 'keep going', 'continue session', 'back to work'],
    patterns: [/^(?:resume|unpause|keep\s+going|continue|back\s+to\s+work)/i],
    speechFeedback: 'Resuming timer.',
    description: 'Resume active timer'
  },
  {
    action: 'TIMER_STOP',
    actionType: 'COMPLETE',
    phrases: ['stop timer', 'end task', 'finish task', 'mark complete', 'wrap it up', 'task done'],
    patterns: [/^(?:stop\s+timer|end\s+task|finish\s+task|mark\s+complete|wrap\s+it\s+up|task\s+done)$/i],
    speechFeedback: 'Task completed. Great work!',
    description: 'Complete active task'
  },
  {
    action: 'TIMER_STOP',
    actionType: 'ABORT',
    phrases: ['cancel timer', 'abort task', 'reset timer', 'discard clock', 'stop without saving'],
    patterns: [/^(?:cancel\s+timer|abort\s+task|reset\s+timer|discard\s+clock|stop\s+without\s+saving)$/i],
    speechFeedback: 'Timer reset.',
    description: 'Abort / reset active timer'
  },
  {
    action: 'TIMER_EXTEND',
    actionType: 'EXTEND',
    phrases: ['add 5 minutes', 'give me 5 more minutes', 'extend by 5', '5 more minutes'],
    patterns: [/(?:add|give\s+me|extend(?:\s+timer)?(?:\s+by)?)\s*5(?:\s+more)?\s*min/i],
    durationMinutes: 5,
    extendMinutes: 5,
    speechFeedback: 'Added 5 minutes.',
    description: 'Extend timer by 5 minutes'
  },
  {
    action: 'TIMER_EXTEND',
    actionType: 'EXTEND',
    phrases: ['add 10 minutes', 'give me 10 more minutes', 'extend timer by 10', '10 more minutes'],
    patterns: [/(?:add|give\s+me|extend(?:\s+timer)?(?:\s+by)?)\s*10(?:\s+more)?\s*min/i],
    durationMinutes: 10,
    extendMinutes: 10,
    speechFeedback: 'Added 10 minutes.',
    description: 'Extend timer by 10 minutes'
  },
  {
    action: 'TIMER_SET_INTERVAL',
    actionType: 'SET_INTERVAL',
    phrases: ['remind me every 5 minutes', 'set interval 5 minutes', 'alert every 5 mins', '5 minute chimes'],
    patterns: [/(?:remind\s+me\s+every|set\s+interval(?:\s+to)?|alert\s+every)\s*5\s*min/i],
    durationMinutes: 5,
    intervalMinutes: 5,
    speechFeedback: 'Interval set to 5 minutes.',
    description: 'Set 5 minute interval alerts'
  },
  {
    action: 'TIMER_SET_INTERVAL',
    actionType: 'SET_INTERVAL',
    phrases: ['remind me every 10 minutes', 'set interval 10 minutes', 'alert every 10 mins', '10 minute interval'],
    patterns: [/(?:remind\s+me\s+every|set\s+interval(?:\s+to)?|alert\s+every)\s*10\s*min/i],
    durationMinutes: 10,
    intervalMinutes: 10,
    speechFeedback: 'Interval set to 10 minutes.',
    description: 'Set 10 minute interval alerts'
  },

  // Dynamic regex patterns for MOVERS Task Creation with variable durations
  {
    action: 'TASK_CREATE',
    taskName: 'Deep Breathing',
    phrases: ['start deep breathing', 'deep breathing 1 minute', 'deep breathing in 30 seconds', 'box breathing 4 minutes', 'breathe in and out'],
    patterns: [
      /(?:start|begin|do)?\s*(?:deep\s+)?breath(?:ing|e)?(?:\s+session|\s+exercise)?(?:\s+in|\s+for|\s+of)?\s*(\d+(?:\.\d+)?| half )?\s*(?:sec|second|seconds|s|min|minute|minutes|m)?/i,
      /(\d+(?:\.\d+)?)\s*(?:sec|second|seconds|s|min|minute|minutes|m)?\s*(?:of\s+)?(?:deep\s+)?breath(?:ing|e)?/i,
      /box\s+breathing\s*(\d+)?/i,
      /oxygenation\s+session/i
    ],
    category: 'Meditation',
    durationMinutes: 4,
    coinsAwarded: 30,
    speechFeedback: 'Starting deep breathing oxygenation in full screen.',
    description: 'Deep breathing oxygenation timer'
  },
  {
    action: 'TASK_CREATE',
    taskName: 'Meditation',
    phrases: ['start meditation', 'meditate for 10 minutes', 'begin mindfulness', '10 minute meditation'],
    patterns: [
      /(?:start|begin|do)?\s*meditat(?:ion|e)(?:\s+in|\s+for|\s+of)?\s*(\d+(?:\.\d+)?| half )?\s*(?:sec|second|seconds|s|min|minute|minutes|m)?/i,
      /(\d+(?:\.\d+)?)\s*(?:sec|second|seconds|s|min|minute|minutes|m)?\s*(?:of\s+)?meditat(?:ion|e)/i,
      /begin\s+mindfulness/i
    ],
    category: 'Meditation',
    durationMinutes: 10,
    coinsAwarded: 30,
    speechFeedback: 'Starting 10-minute meditation.',
    description: 'Mindfulness meditation session'
  },
  {
    action: 'TASK_CREATE',
    taskName: 'Visualization',
    phrases: ['start visualization', '10 minutes vision review', 'mental rehearsal', 'visualize goals'],
    patterns: [
      /(?:start|begin|do)?\s*visualiz(?:ation|e)(?:\s+in|\s+for|\s+of)?\s*(\d+(?:\.\d+)?| half )?\s*(?:sec|second|seconds|s|min|minute|minutes|m)?/i,
      /vision\s+review/i,
      /mental\s+rehearsal/i
    ],
    category: 'Productivity',
    durationMinutes: 10,
    coinsAwarded: 30,
    speechFeedback: 'Starting visualization block.',
    description: 'Mental rehearsal visualization'
  },
  {
    action: 'TASK_CREATE',
    taskName: 'Workout',
    phrases: ['start workout', 'exercise for 20 minutes', 'morning physical warmup', 'start gym session'],
    patterns: [
      /(?:start|begin|do)?\s*(?:workout|exercise|gym|physical\s+warmup)(?:\s+in|\s+for|\s+of)?\s*(\d+(?:\.\d+)?| half )?\s*(?:sec|second|seconds|s|min|minute|minutes|m)?/i,
      /(\d+(?:\.\d+)?)\s*(?:sec|second|seconds|s|min|minute|minutes|m)?\s*(?:of\s+)?(?:workout|exercise)/i
    ],
    category: 'Fitness',
    durationMinutes: 20,
    coinsAwarded: 40,
    speechFeedback: 'Starting 20-minute workout.',
    description: 'Physical workout and movement'
  },
  {
    action: 'TASK_CREATE',
    taskName: 'Reading',
    phrases: ['start reading', 'read positive 15 minutes', 'wisdom reading', 'book time'],
    patterns: [
      /(?:start|begin|do)?\s*(?:reading|read\s+book|wisdom\s+reading|read\s+positive)(?:\s+in|\s+for|\s+of)?\s*(\d+(?:\.\d+)?| half )?\s*(?:sec|second|seconds|s|min|minute|minutes|m)?/i,
      /book\s+time/i
    ],
    category: 'Creativity',
    durationMinutes: 15,
    coinsAwarded: 30,
    speechFeedback: 'Starting reading session.',
    description: 'Wisdom & positive reading'
  },
  {
    action: 'TASK_CREATE',
    taskName: 'Scribing',
    phrases: ['start scribing', 'journal for 10 minutes', 'write diary', 'evening intention journaling'],
    patterns: [
      /(?:start|begin|do)?\s*(?:scribing|journaling|journal|write\s+diary)(?:\s+in|\s+for|\s+of)?\s*(\d+(?:\.\d+)?| half )?\s*(?:sec|second|seconds|s|min|minute|minutes|m)?/i
    ],
    category: 'Creativity',
    durationMinutes: 10,
    coinsAwarded: 30,
    speechFeedback: 'Starting scribing session.',
    description: 'Daily intention scribing & journaling'
  },
  {
    action: 'TASK_CREATE',
    taskName: 'Deep Work',
    phrases: ['start deep work', 'code for 45 minutes', 'focus block 30 minutes', 'engineering sprint'],
    patterns: [
      /(?:start|begin|do)?\s*(?:deep\s+work|coding|focus\s+block|engineering\s+sprint)(?:\s+in|\s+for|\s+of)?\s*(\d+(?:\.\d+)?| half )?\s*(?:sec|second|seconds|s|min|minute|minutes|m)?/i
    ],
    category: 'Productivity',
    durationMinutes: 45,
    coinsAwarded: 50,
    speechFeedback: 'Starting deep work sprint.',
    description: 'Deep work focus sprint'
  },
  {
    action: 'TASK_CREATE',
    taskName: 'Drink Water',
    phrases: ['drink water timer', 'drink a glass of water', 'hydrate 2 minutes', 'water break'],
    patterns: [
      /(?:start|begin|do)?\s*(?:drink\s+water|hydrate|water\s+break)(?:\s+timer|\s+in|\s+for|\s+of)?\s*(\d+(?:\.\d+)?| half )?\s*(?:sec|second|seconds|s|min|minute|minutes|m)?/i
    ],
    category: 'Hydration',
    durationMinutes: 2,
    coinsAwarded: 15,
    speechFeedback: 'Starting hydration break.',
    description: 'Hydration break timer'
  },
  {
    action: 'TASK_CREATE',
    taskName: 'Clean Workspace',
    phrases: ['clean workspace', 'make my bed', 'set work table', 'desk tidy 5 minutes'],
    patterns: [
      /(?:start|begin|do)?\s*(?:clean\s+workspace|tidy\s+desk|make\s+bed|set\s+work\s+table)(?:\s+in|\s+for|\s+of)?\s*(\d+(?:\.\d+)?| half )?\s*(?:sec|second|seconds|s|min|minute|minutes|m)?/i
    ],
    category: 'Hygiene',
    durationMinutes: 5,
    coinsAwarded: 15,
    speechFeedback: 'Starting workspace hygiene.',
    description: 'Workspace hygiene & environment setup'
  },

  // 4. One-shot quick logging (Explicit past-tense only)
  {
    action: 'TASK_LOG_QUICK',
    phrases: ['log water', 'drank a glass of water', 'finished my water', 'water logged'],
    patterns: [
      /^(?:i\s+)?(?:already\s+)?(?:drank|logged|finished)\s+(?:a\s+)?(?:glass\s+of\s+)?(?:water|hydration)$/i,
      /^(?:water|hydration)\s+(?:logged|done|checked|finished)$/i
    ],
    category: 'Hydration',
    coinsAwarded: 15,
    earnedCoins: 15,
    speechFeedback: 'Logged. Plus 15 coins!',
    description: 'Instant water logging'
  },
  {
    action: 'TASK_LOG_QUICK',
    phrases: ['bed made', 'made my bed', 'table cleaned', 'desk organized'],
    patterns: [
      /^(?:i\s+)?(?:already\s+)?(?:made\s+(?:my\s+)?bed|table\s+cleaned|desk\s+organized)$/i,
      /^(?:bed\s+made|bed\s+done)$/i
    ],
    category: 'Hygiene',
    coinsAwarded: 15,
    earnedCoins: 15,
    speechFeedback: 'Logged. Plus 15 coins!',
    description: 'Instant domestic hygiene logging'
  },
  {
    action: 'TASK_LOG_QUICK',
    phrases: ['quick stretch done', 'finished pushups', 'completed 10 squats'],
    patterns: [
      /^(?:i\s+)?(?:already\s+)?(?:quick\s+stretch\s+done|finished\s+pushups|completed\s+10\s+squats)$/i,
      /^(?:stretch|pushups|squats)\s+(?:done|completed|logged)$/i
    ],
    category: 'Fitness',
    coinsAwarded: 40,
    earnedCoins: 40,
    speechFeedback: 'Fitness logged. Plus 40 coins!',
    description: 'Instant fitness logging'
  },

  // 5. Co-op sync
  {
    action: 'COOP_ACTION',
    actionType: 'INVITE_PARTNER',
    phrases: ['invite co reformer', 'start partner session', 'invite duet partner', 'co op with partner'],
    patterns: [/(?:invite|start)\s+(?:co\s*reformer|partner\s+session|duet\s+partner|co\s*op\s+with\s+partner)/i],
    coopAction: 'invite',
    speechFeedback: 'Invitation sent.',
    description: 'Invite co-reformer duet partner'
  },
  {
    action: 'COOP_ACTION',
    actionType: 'BROADCAST_START',
    phrases: ['coach start group sprint', 'start class timer', 'run co op timer for all', 'start group test'],
    patterns: [/(?:coach\s+)?(?:start\s+group\s+sprint|start\s+class\s+timer|run\s+co\s*op\s+timer\s+for\s+all|start\s+group\s+test)/i],
    coopAction: 'start_sprint',
    speechFeedback: 'Group sprint started.',
    description: 'Broadcast start group sprint'
  },
  {
    action: 'COOP_ACTION',
    actionType: 'BROADCAST_PAUSE',
    phrases: ['coach pause group timer', 'pause class session', 'pause group clock'],
    patterns: [/(?:coach\s+)?(?:pause\s+group\s+timer|pause\s+class\s+session|pause\s+group\s+clock)/i],
    coopAction: 'pause_group',
    speechFeedback: 'Group timer paused.',
    description: 'Broadcast pause group sprint'
  },

  // 6. Rewards, Payouts & Certificates
  {
    action: 'REWARDS_ACTION',
    actionType: 'REDEEM_UPI',
    phrases: ['redeem payout', 'withdraw cash', 'claim direct payout', 'cash out my coins', 'claim 10 rupees'],
    patterns: [/(?:redeem\s+payout|withdraw\s+cash|claim\s+direct\s+payout|cash\s+out\s+my\s+coins|claim\s+10\s+rupees)/i],
    rewardsAction: 'redeem',
    speechFeedback: 'Opening payout window.',
    description: 'Redeem direct cash payout'
  },
  {
    action: 'REWARDS_ACTION',
    actionType: 'PIN_CERTIFICATE',
    phrases: ['pin certificate', 'feature my certificate', 'pin to profile', 'pin achievement'],
    patterns: [/(?:pin\s+certificate|feature\s+my\s+certificate|pin\s+to\s+profile|pin\s+achievement)/i],
    rewardsAction: 'pin_certificate',
    speechFeedback: 'Certificate pinned to profile.',
    description: 'Pin certificate to profile'
  },
  {
    action: 'REWARDS_ACTION',
    actionType: 'CHECK_BALANCE',
    phrases: ['check coin balance', 'how many coins do I have', 'my wallet balance', 'check balance'],
    patterns: [/(?:check\s+coin\s+balance|how\s+many\s+coins\s+do\s+i\s+have|my\s+wallet\s+balance|check\s+balance)/i],
    rewardsAction: 'check_balance',
    speechFeedback: 'Checking your coin balance.',
    description: 'Check coin balance'
  },

  // 7. Sensors & Multimodal Toggles
  {
    action: 'SENSOR_ENVIRONMENT_TOGGLE',
    actionType: 'TOGGLE_EYE_TRACKING_ON',
    phrases: ['turn on eye tracking', 'enable gaze control', 'hands free mode on', 'start eye sensor'],
    patterns: [/(?:turn\s+on\s+eye\s+tracking|enable\s+gaze\s+control|hands\s+free\s+mode\s+on|start\s+eye\s+sensor)/i],
    sensorType: 'eye_tracking',
    sensorState: 'on',
    speechFeedback: 'Gaze control active.',
    description: 'Turn on eye tracking'
  },
  {
    action: 'SENSOR_ENVIRONMENT_TOGGLE',
    actionType: 'TOGGLE_EYE_TRACKING_OFF',
    phrases: ['turn off eye tracking', 'disable gaze control', 'exit hands free'],
    patterns: [/(?:turn\s+off\s+eye\s+tracking|disable\s+gaze\s+control|exit\s+hands\s+free)/i],
    sensorType: 'eye_tracking',
    sensorState: 'off',
    speechFeedback: 'Gaze control disabled.',
    description: 'Turn off eye tracking'
  },
  {
    action: 'SENSOR_ENVIRONMENT_TOGGLE',
    actionType: 'AUDIO_WATER_ON',
    phrases: ['turn on water sounds', 'play pouring audio', 'enable ambient sound'],
    patterns: [/(?:turn\s+on\s+water\s+sounds|play\s+pouring\s+audio|enable\s+ambient\s+sound)/i],
    sensorType: 'water_sounds',
    sensorState: 'on',
    speechFeedback: 'Water sounds enabled.',
    description: 'Turn on water soundscape'
  },
  {
    action: 'SENSOR_ENVIRONMENT_TOGGLE',
    actionType: 'AUDIO_MUTE',
    phrases: ['mute sounds', 'turn off audio', 'silent mode'],
    patterns: [/(?:mute\s+sounds|turn\s+off\s+audio|silent\s+mode)/i],
    sensorType: 'ambient_noise',
    sensorState: 'off',
    speechFeedback: 'Audio muted.',
    description: 'Mute sounds'
  },
  {
    action: 'SENSOR_ENVIRONMENT_TOGGLE',
    actionType: 'AUDIO_BREATHE_ON',
    phrases: ['enable breathing chimes', 'turn on breathing sounds', 'play chimes'],
    patterns: [/(?:enable\s+breathing\s+chimes|turn\s+on\s+breathing\s+sounds|play\s+chimes)/i],
    sensorType: 'ambient_noise',
    sensorState: 'on',
    speechFeedback: 'Breathing chimes active.',
    description: 'Enable breathing chimes'
  },

  // 8. Dismissal & System Controls
  {
    action: 'MODAL_DISMISS',
    actionType: 'DISMISS',
    phrases: ['close this', 'dismiss popup', 'dismiss modal', 'cancel', 'never mind', 'go back'],
    patterns: [/^(?:close\s+this|dismiss\s+popup|dismiss\s+modal|cancel|never\s+mind|go\s+back|dismiss|close)$/i],
    speechFeedback: 'Dismissed.',
    description: 'Dismiss HUD or modal'
  }
];

export const VOICE_COMMAND_DICTIONARY: CommandDefinition[] = [
  ...DATASET_COMMANDS,
  ...FLEXIBLE_COMMANDS
];

export const getFewShotExamples = () => {
  return JEV_VOICE_DATASET.map(cmd => ({
    sampleInput: cmd.utterances[0],
    action: cmd.intent,
    speechFeedback: cmd.speechFeedback
  }));
};
