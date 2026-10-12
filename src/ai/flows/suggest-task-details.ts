'use server';

/**
 * @fileOverview Suggests details for a task (icon, category, duration) based on its name using JEV TypeSafe SystemOne.
 */

import { z } from 'zod';
import { callTypeSafeSystemOne, createChoiceQuestion, createScoreQuestion } from '@/lib/jevClient';

const SuggestTaskDetailsInputSchema = z.object({
  taskName: z.string().describe('The name of the task.'),
  availableIcons: z.array(z.string()).describe('A list of available icon names to choose from.'),
  availableCategories: z.array(z.string()).describe('A list of available category names to choose from.'),
});
export type SuggestTaskDetailsInput = z.infer<typeof SuggestTaskDetailsInputSchema>;

const SuggestTaskDetailsOutputSchema = z.object({
  iconName: z.string().describe('The suggested icon name from the available list.'),
  category: z.string().describe('The suggested category from the available list.'),
  duration: z.number().describe('The suggested duration in minutes (e.g., 5, 15, 30, 60).'),
});
export type SuggestTaskDetailsOutput = z.infer<typeof SuggestTaskDetailsOutputSchema>;

export async function suggestTaskDetails(input: SuggestTaskDetailsInput): Promise<SuggestTaskDetailsOutput> {
  const { taskName, availableIcons, availableCategories } = input;
  if (!taskName || !taskName.trim()) {
    return { iconName: 'BrainCircuit', category: 'Work & Focus', duration: 25 };
  }

  const lower = taskName.toLowerCase();
  let defaultIcon = 'BrainCircuit';
  let defaultCategory = availableCategories[0] || 'Work & Focus';
  let defaultDuration = 25;

  if (/water|hydrate|drink/i.test(lower)) {
    defaultIcon = 'Droplets';
    defaultCategory = availableCategories.find((c) => /break|meal|hydrat/i.test(c)) || defaultCategory;
    defaultDuration = 5;
  } else if (/workout|exercise|gym|stretch|run/i.test(lower)) {
    defaultIcon = 'Dumbbell';
    defaultCategory = availableCategories.find((c) => /health|well|fit/i.test(c)) || defaultCategory;
    defaultDuration = 20;
  } else if (/meditat|breath|calm/i.test(lower)) {
    defaultIcon = 'Wind';
    defaultCategory = availableCategories.find((c) => /health|well|meditat/i.test(c)) || defaultCategory;
    defaultDuration = 10;
  } else if (/mail|email|inbox/i.test(lower)) {
    defaultIcon = 'Mail';
    defaultCategory = availableCategories.find((c) => /work|focus/i.test(c)) || defaultCategory;
    defaultDuration = 15;
  } else if (/read|book|study/i.test(lower)) {
    defaultIcon = 'BookOpen';
    defaultCategory = availableCategories.find((c) => /evening|work/i.test(c)) || defaultCategory;
    defaultDuration = 25;
  } else if (/coffee|breakfast|lunch|dinner|meal/i.test(lower)) {
    defaultIcon = 'Coffee';
    defaultCategory = availableCategories.find((c) => /break|meal/i.test(c)) || defaultCategory;
    defaultDuration = 15;
  }

  if (!availableIcons.includes(defaultIcon)) {
    defaultIcon = availableIcons[0] || 'BrainCircuit';
  }

  try {
    const categoryCriteria: Record<string, string> = {};
    for (const c of availableCategories) {
      categoryCriteria[c] = `Fits into ${c}`;
    }

    const res = await callTypeSafeSystemOne({
      state: { taskName, availableCategories },
      questions: {
        category: createChoiceQuestion(categoryCriteria, 'Select the most suitable category for this task.'),
        durationBucket: createScoreQuestion(
          ['5m', '10m', '15m', '20m', '25m', '30m', '45m', '60m'],
          'Score the ideal duration bucket for this task.'
        ),
      },
    });

    const chosenCat = res.answers?.category?.choice;
    if (chosenCat && availableCategories.includes(chosenCat)) {
      defaultCategory = chosenCat;
    }
  } catch {
    // Use deterministic defaults on timeout/offline
  }

  return {
    iconName: defaultIcon,
    category: defaultCategory,
    duration: defaultDuration,
  };
}
