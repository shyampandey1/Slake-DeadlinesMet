
'use server';

/**
 * @fileOverview Generates a motivational message upon task completion using AI, incorporating task history and completion status.
 *
 * - generateMotivationalMessage - A function that generates a motivational message.
 * - GenerateMotivationalMessageInput - The input type for the generateMotivationalMessage function.
 * - GenerateMotivationalMessageOutput - The return type for the generateMotivationalMessage function.
 */

import { z } from 'zod';

const GenerateMotivationalMessageInputSchema = z.object({
  taskName: z.string().describe('The name of the completed task.'),
  duration: z.number().describe('The duration of the task in minutes.'),
  completionStatus: z.boolean().describe('Whether the task was completed successfully.'),
  pastTasks: z.array(
    z.object({
      taskName: z.string(),
      duration: z.number(),
      completionStatus: z.boolean(),
    })
  ).optional().describe('An array of the last 5 completed tasks for context.'),
  userRoutine: z.array(z.object({
    name: z.string(),
    duration: z.number(),
    icon: z.string(),
    category: z.string(),
    order: z.number().optional(),
  })).optional().describe('The user\'s full routine for the day, sorted in order.'),
  currentCategory: z.string().optional().describe('The category of the completed task.'),
  localTime: z.string().optional().describe('The current ISO local time from the client.'),
  localHour: z.number().optional().describe('The current local decimal hour from the client.'),
});
export type GenerateMotivationalMessageInput = z.infer<typeof GenerateMotivationalMessageInputSchema>;

const GenerateMotivationalMessageOutputSchema = z.object({
  message: z.string().describe('The generated motivational message.'),
  suggestedNextTask: z.string().optional().describe('A suggested next task based on the completed task and history.'),
});
export type GenerateMotivationalMessageOutput = z.infer<typeof GenerateMotivationalMessageOutputSchema>;

const motivations = [
  {
    category: 'Wellness: Hydration',
    keywords: ['hydration', 'water', 'drink', 'sip', 'rehydrate', 'droplets'],
    messages: [
      "Clear water leads to a clear mind. You're fueling your focus one sip at a time.",
      "Stay sharp, stay hydrated. Your brain performs best when it's fully fueled.",
      "Hydration is the simplest form of self-care. Excellent work keeping your momentum fluid."
    ]
  },
  {
    category: 'Wellness: Mindfulness',
    keywords: ['breathing', 'meditation', 'mindfulness', 'stillness', 'calm', 'reset', 'peace', 'braincircuit', 'wind', 'stillness'],
    messages: [
      "Stillness is where your best ideas are born. Great job reclaiming your peace.",
      "A calm mind is a powerful mind. That mental reset just unlocked your next level of focus.",
      "You’ve successfully tuned out the noise. Now you can tune into your potential."
    ]
  },
  {
    category: 'Domestic Habits',
    keywords: ['bed', 'table', 'hygiene', 'skincare', 'journaling', 'routine', 'pre-shift', 'domestic', 'utensils', 'coffee', 'showerhead', 'made bed'],
    messages: [
      "Excellence begins with a made bed. You've already won the first battle of the day.",
      "An organized space reflects an organized mind. You are setting the stage for greatness.",
      "Preparation is half the victory. Setting the table is setting your intention for a focused meal."
    ]
  },
  {
    category: 'Professional',
    keywords: ['work', 'deep work', 'session', 'coding', 'script', 'content', 'research', 'writing', 'editing', 'pr reviews', 'analysis', 'deliverables', 'strategy', 'operations', 'networking', 'prospecting', 'pipeline', 'tickets', 'infrastructure', 'monitoring', 'hypothesis', 'experimental', 'grading', 'instruction', 'lesson', 'academics', 'study', 'graduationcap', 'code', 'database', 'server', 'laptop', 'presentation'],
    messages: [
      "Every session brings you one step closer to mastery. Your dedication is building your future.",
      "Focus on the process, and the results will follow. You just made tangible progress today.",
      "Deep work is a superpower. You've successfully defended your time and moved the needle."
    ]
  },
  {
    category: 'Physical Health',
    keywords: ['warm-up', 'workout', 'stretching', 'exercise', 'eye strain', 'walk', 'energy', 'recharge', 'body', 'physical', 'footprints', 'dumbbell', 'eye'],
    messages: [
      "Energy is created, not found. You’ve just recharged your body’s battery for the work ahead.",
      "Rest your eyes to see your vision clearly. Sustainable productivity starts with these small breaks.",
      "Moving your body wakes up your brain. You're working smarter by taking care of your physical self."
    ]
  },
  {
    category: 'Administrative & Reviews',
    keywords: ['admin', 'review', 'reporting', 'log', 'lead management', 'details', 'loops', 'closing', 'evaluation', 'inventory', 'clipboardlist', 'filecode', 'briefcase', 'loops closed'],
    messages: [
      "Loops closed, mind cleared. You've cleared the path for a productive tomorrow.",
      "Managing the details makes the big picture possible. Great job staying on top of the admin.",
      "A review today prevents a crisis tomorrow. Your future self will thank you for this diligence."
    ]
  }
];

export async function generateMotivationalMessage(input: GenerateMotivationalMessageInput): Promise<GenerateMotivationalMessageOutput> {
  // 1. Find matching motivation based on task name or routine category
  const nameLower = input.taskName.toLowerCase();
  
  // Try to find a matching category from the knowledge base
  let selectedBucket = motivations.find(m => 
    m.keywords.some(keyword => nameLower.includes(keyword))
  );

  // If no match by keywords, use a default
  const messageList = selectedBucket ? selectedBucket.messages : [
    "Great job finishing your task! Keep up the momentum!",
    "Success is the sum of small efforts repeated day in and day out. Well done!",
    "Every step forward is progress. Keep pushing towards your goals.",
    "One task down, the momentum is real. Excellent work!"
  ];

  const message = messageList[Math.floor(Math.random() * messageList.length)];

  // 2. Suggest next task locally from the routine
  let suggestedNextTask: string | undefined = undefined;
  
  if (input.userRoutine && input.userRoutine.length > 0) {
    // Determine the local time hour of the client
    let localHour = 12;
    if (input.localHour !== undefined) {
      localHour = input.localHour;
    } else {
      const localDate = input.localTime ? new Date(input.localTime) : new Date();
      localHour = localDate.getHours() + localDate.getMinutes() / 60;
    }

    // Define time blocks matching useFirestore.ts categoryTimeRanges
    const timeBlocks: { [key: string]: { start: number; end: number } } = {
        'Morning Routine': { start: 6, end: 9 },
        'Primary Work Session': { start: 9, end: 13 },
        'Lunch Break': { start: 13, end: 14 },
        'Afternoon Session': { start: 14, end: 17 },
        'Post-Work Decompression': { start: 17, end: 19 },
        'Evening Routine': { start: 19, end: 21 },
        'Bedtime Routine': { start: 21, end: 24 }, 
        'Work & Focus': { start: 9, end: 17 }, 
        'Breaks & Meals': { start: 12, end: 14 }, 
        'Health & Wellness': { start: 17, end: 19 }, 
        'Evening Wind-down': { start: 19, end: 21 },
        'Morning Kickstart': { start: 7, end: 8.5 },
        'Pre-Production': { start: 8.5, end: 10.5 },
        'Production Block': { start: 10.5, end: 13 },
        'Post-Production': { start: 14, end: 17 },
        'Evening & Close': { start: 17, end: 22 },
        'System Initialization': { start: 8.5, end: 10 },
        'Sync & Sprint': { start: 10, end: 13 },
        'Architecture & Logic': { start: 13, end: 16 },
        'Deployment & Decompression': { start: 16, end: 22 },
        'Visionary Morning': { start: 6, end: 8 },
        'Strategic Execution': { start: 8, end: 13 },
        'Operations': { start: 13, end: 18 },
        'Networking & Rest': { start: 18, end: 22.5 },
        'Field Prep': { start: 7.5, end: 9 },
        'Clinic Visits': { start: 9, end: 13 },
        'Product Demos & Reporting': { start: 14, end: 17 },
        'Inventory & Relax': { start: 18, end: 22 },
        'Learning Ready': { start: 7.5, end: 9 },
        'Academics I': { start: 9, end: 13 },
        'Academics II': { start: 14, end: 17 },
        'Review & Rest': { start: 18, end: 23 },
        'Morning Prep': { start: 6, end: 9 },
        'On the Road': { start: 9, end: 17 },
        'Post-Work Admin': { start: 17, end: 18 },
        'Evening & Bedtime': { start: 18, end: 24 },
        'Pre-Shift Routine': { start: 5, end: 7 },
        'During Shift': { start: 7, end: 19 },
        'Post-Shift Decompression': { start: 19, end: 21 },
        'Morning Recovery': { start: 7, end: 12 },
        'Afternoon Life Admin & Recharge': { start: 12, end: 18 },
        'Evening & Bedtime Reset': { start: 18, end: 24 },
        'Morning Protocol': { start: 8, end: 9 },
        'MOVERS Protocol': { start: 8, end: 9 },
        'Late Hustle': { start: 20, end: 22 },
        'Entertainment & Gaming': { start: 21, end: 23 },
        'Evening Protocol': { start: 22.5, end: 23.5 },
    };

    // Find all categories matching the current hour
    const activeCategories = Object.entries(timeBlocks)
      .filter(([_, range]) => localHour >= range.start && localHour < range.end)
      .map(([cat]) => cat);

    // Prioritize categories: current task category first, then other active time blocks
    const currentCat = input.currentCategory;
    const prioritizedCats = currentCat 
      ? [currentCat, ...activeCategories.filter(c => c !== currentCat)] 
      : activeCategories;

    // Filter the user routine to find tasks belonging to the active time block categories
    const blockTasks = input.userRoutine.filter((t: any) => prioritizedCats.includes(t.category));

    if (blockTasks.length > 0) {
      // Classify if a task name indicates low energy / wellness / hydration
      const isLowEnergyTask = (name: string): boolean => {
        const lowEnergyKeywords = [
          'water', 'drink', 'hydrate', 'sip', 'stretch', 'eye', 'rest', 'walk', 
          'breathe', 'meditate', 'calm', 'snack', 'coffee', 'tea', 'wash', 
          'break', 'glass', 'exercise', 'posture', 'standing', 'air'
        ];
        const n = name.toLowerCase();
        return lowEnergyKeywords.some(kw => n.includes(kw));
      };

      const completedIsLow = isLowEnergyTask(input.taskName);

      // Smart energy sync selection:
      // If completed was a low-energy task, prioritize recommending a focus task (high energy) next
      // If completed was a focus task, prioritize recommending a quick recovery task (low energy) next
      const targetIsLow = !completedIsLow;
      
      let energyMatchedTask = blockTasks.find((t: any) => 
        isLowEnergyTask(t.name) === targetIsLow && t.name.toLowerCase() !== nameLower
      );

      // If no perfect energy-opposite task exists, just look for any task in block other than completed
      if (!energyMatchedTask) {
        energyMatchedTask = blockTasks.find((t: any) => t.name.toLowerCase() !== nameLower);
      }

      if (energyMatchedTask) {
        suggestedNextTask = energyMatchedTask.name;
      }
    }

    // Fallback: If no block task was selected or all matches are exhausted, fallback to sequential routine
    if (!suggestedNextTask) {
      const currentIndex = input.userRoutine.findIndex((t: any) => 
        t.name.toLowerCase() === nameLower &&
        (!input.currentCategory || t.category === input.currentCategory)
      );

      if (currentIndex !== -1 && currentIndex < input.userRoutine.length - 1) {
        suggestedNextTask = input.userRoutine[currentIndex + 1].name;
      } else {
        // Find next upcoming category based on the closest future start hour
        let upcomingCat: string | undefined = undefined;
        let minDiff = 24;
        for (const [catName, range] of Object.entries(timeBlocks)) {
          let diff = range.start - localHour;
          if (diff < 0) diff += 24; // past midnight wrap
          if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            upcomingCat = catName;
          }
        }

        if (upcomingCat) {
          const upcomingTask = input.userRoutine.find((t: any) => t.category === upcomingCat);
          if (upcomingTask) {
            suggestedNextTask = upcomingTask.name;
          }
        }
      }
    }

    // Ultimate fallback if nothing above resolved
    if (!suggestedNextTask) {
      suggestedNextTask = input.userRoutine[0]?.name;
    }
  }

  // Simulate a small delay to keep the UI feel (the loading state)
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    message,
    suggestedNextTask
  };
}
