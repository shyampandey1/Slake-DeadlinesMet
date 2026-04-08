
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
    // Find current task index in routine
    const currentIndex = input.userRoutine.findIndex((t: any) => 
      t.name.toLowerCase() === nameLower
    );

    if (currentIndex !== -1 && currentIndex < input.userRoutine.length - 1) {
      // Suggest the very next task
      suggestedNextTask = input.userRoutine[currentIndex + 1].name;
    } else if (currentIndex === -1 || currentIndex === input.userRoutine.length - 1) {
      // If task not in routine or is the last one, suggest the first incomplete or just the first one
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
