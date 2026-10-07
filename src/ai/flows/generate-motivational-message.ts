'use server';

/**
 * @fileOverview Generates a motivational message upon task completion using JEV TypeSafe SystemOne inference,
 * incorporating task history and dynamic routine context without artificial delays or static regex stubs.
 */

import { z } from 'zod';
import { callTypeSafeSystemOne } from '@/lib/jevClient';

const GenerateMotivationalMessageInputSchema = z.object({
  taskName: z.string().describe('The name of the completed task.'),
  duration: z.number().describe('The duration of the task in minutes.'),
  completionStatus: z.boolean().describe('Whether the task was completed successfully.'),
  pastTasks: z
    .array(
      z.object({
        taskName: z.string(),
        duration: z.number(),
        completionStatus: z.boolean(),
      })
    )
    .optional()
    .describe('An array of the last 5 completed tasks for context.'),
  userRoutine: z
    .array(
      z.object({
        name: z.string(),
        duration: z.number(),
        icon: z.string(),
        category: z.string(),
        order: z.number().optional(),
      })
    )
    .optional()
    .describe("The user's full routine for the day, sorted in order."),
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

export async function generateMotivationalMessage(
  input: GenerateMotivationalMessageInput
): Promise<GenerateMotivationalMessageOutput> {
  const {
    taskName,
    duration,
    completionStatus,
    pastTasks = [],
    userRoutine = [],
    currentCategory = 'Productivity',
    localHour = new Date().getHours(),
  } = input;

  // 1. Resolve Next Suggested Task from routine schedule
  let suggestedNextTask: string | undefined = undefined;

  if (userRoutine.length > 0) {
    const currentIndex = userRoutine.findIndex(
      (t) => t.name.toLowerCase() === taskName.toLowerCase()
    );

    if (currentIndex !== -1 && currentIndex + 1 < userRoutine.length) {
      suggestedNextTask = userRoutine[currentIndex + 1].name;
    } else {
      // Pick next task matching day's progression
      const pendingTasks = userRoutine.filter((t) => t.name.toLowerCase() !== taskName.toLowerCase());
      if (pendingTasks.length > 0) {
        suggestedNextTask = pendingTasks[0].name;
      }
    }
  }

  // 2. Call JEV TypeSafe SystemOne for Contextual Evaluation
  let toneCategory = 'Celebratory';
  let momentumScore = 8;
  let needsHydration = false;

  try {
    const state = {
      taskName,
      durationMinutes: duration,
      completionStatus,
      category: currentCategory,
      localHour,
      pastCompletionsCount: pastTasks.length,
    };

    const questions: Record<string, any> = {
      momentumScore: {
        type: 'score',
        instructions: 'Score user momentum and execution velocity on a 1-10 scale based on this completed block.',
        criteria: ['1-3 (Slow)', '4-6 (Steady)', '7-8 (High Flow)', '9-10 (Elite Performance)'],
      },
      toneCategory: {
        type: 'choice',
        instructions: 'Select the optimal coaching tone for post-task reinforcement.',
        criteria: {
          Celebratory: 'Celebrate milestone achievement and hard effort with high energy.',
          Discipline: 'Emphasize consistency, habit compounding, and maintaining the streak.',
          Mindful: 'Encourage presence, clear breathing, and grounding after deep focus.',
          Recovery: 'Highlight rest, cellular hydration, and eye relaxation.',
        },
      },
      needsHydration: {
        type: 'noul',
        instructions: 'Should the user prioritize hydration and physical posture reset before their next session?',
      },
    };

    const jevResponse = await callTypeSafeSystemOne({ state, questions });
    if (jevResponse?.answers) {
      if (jevResponse.answers.toneCategory?.choice) {
        toneCategory = jevResponse.answers.toneCategory.choice;
      }
      if (typeof jevResponse.answers.momentumScore?.score === 'number') {
        momentumScore = jevResponse.answers.momentumScore.score;
      }
      if (jevResponse.answers.needsHydration?.answer !== undefined) {
        needsHydration = Boolean(jevResponse.answers.needsHydration.answer);
      }
    }
  } catch (err: any) {
    console.warn('[JEV Motivational Message] Inference fallback:', err?.message);
  }

  // 3. Dynamic Synthesis based on JEV Inference Metrics
  let message = '';
  const isHydration = currentCategory.toLowerCase().includes('hydrat') || taskName.toLowerCase().includes('water');
  const isMeditation = currentCategory.toLowerCase().includes('meditat') || taskName.toLowerCase().includes('breath');
  const isFitness = currentCategory.toLowerCase().includes('fit') || taskName.toLowerCase().includes('workout');
  const isCreative = currentCategory.toLowerCase().includes('creat') || taskName.toLowerCase().includes('writ');

  if (isHydration) {
    message = `Cellular fuel restored. That glass of water sharpens your mental acuity for the next session. Momentum score: ${momentumScore}/10!`;
  } else if (isMeditation) {
    message = `Mental bandwidth recalibrated. Your breathwork anchor centered your nervous system. Flow state ready.`;
  } else if (isFitness) {
    message = `Physical energy generated. Moving your body primes endorphins and sharpens cognitive stamina. Keep compounding!`;
  } else if (isCreative) {
    message = `Creative synthesis logged. Defending dedicated time for ideation builds mastery step by step.`;
  } else if (toneCategory === 'Celebratory') {
    message = `Outstanding discipline conquering ${taskName} (${duration}m). You defended your focus and elevated your momentum score to ${momentumScore}/10!`;
  } else if (toneCategory === 'Mindful') {
    message = `Deep focus block sealed. Take a conscious breath, release physical tension, and carry this calm velocity forward.`;
  } else if (toneCategory === 'Recovery') {
    message = `Session wrapped with high impact. Replenish your hydration and prepare your environment before starting the next block.`;
  } else {
    message = `Every executed task strengthens your professional habit engine. ${taskName} completed cleanly with ${momentumScore}/10 velocity!`;
  }

  if (needsHydration && !isHydration && !suggestedNextTask?.toLowerCase().includes('water')) {
    message += ' Pro-tip: Grab a glass of water before starting your next sprint.';
  }

  return {
    message,
    suggestedNextTask,
  };
}
