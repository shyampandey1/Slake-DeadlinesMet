'use server';

/**
 * @fileOverview Suggests a category for a task based on its name using JEV TypeSafe SystemOne.
 */

import { z } from 'zod';
import { callTypeSafeSystemOne, createChoiceQuestion } from '@/lib/jevClient';

const CategorizeTaskInputSchema = z.object({
  taskName: z.string().describe('The name of the task to be categorized.'),
  availableCategories: z.array(z.string()).describe('A list of available category names to choose from.'),
});
export type CategorizeTaskInput = z.infer<typeof CategorizeTaskInputSchema>;

const CategorizeTaskOutputSchema = z.object({
  category: z.string().describe('The most appropriate category for the task from the available list.'),
});
export type CategorizeTaskOutput = z.infer<typeof CategorizeTaskOutputSchema>;

function fallbackCategorize(taskName: string, availableCategories: string[]): string {
  const lower = taskName.toLowerCase();
  if (/water|hydrate|drink|coffee|meal|breakfast|lunch|dinner|snack/i.test(lower)) {
    return availableCategories.find((c) => /break|meal|hydrat/i.test(c)) || availableCategories[0] || 'Work & Focus';
  }
  if (/meditat|breath|workout|exercise|gym|stretch|walk|run|eye|sleep/i.test(lower)) {
    return availableCategories.find((c) => /health|well|fit|meditat/i.test(c)) || availableCategories[0] || 'Work & Focus';
  }
  if (/read|journal|write|evening|wind|reflect/i.test(lower)) {
    return availableCategories.find((c) => /evening|creat|wind/i.test(c)) || availableCategories[0] || 'Work & Focus';
  }
  if (/morning|bed|plan|primer/i.test(lower)) {
    return availableCategories.find((c) => /morning/i.test(c)) || availableCategories[0] || 'Work & Focus';
  }
  return availableCategories.find((c) => /work|focus|prod/i.test(c)) || availableCategories[0] || 'Work & Focus';
}

export async function categorizeTask(input: CategorizeTaskInput): Promise<CategorizeTaskOutput> {
  const { taskName, availableCategories } = input;
  if (!taskName || !taskName.trim() || !availableCategories.length) {
    return { category: 'Work & Focus' };
  }

  try {
    const criteria: Record<string, string> = {};
    for (const cat of availableCategories) {
      criteria[cat] = `Task best fits into the ${cat} discipline`;
    }

    const response = await callTypeSafeSystemOne({
      state: { taskName, availableCategories },
      questions: {
        selectedCategory: createChoiceQuestion(
          criteria,
          'Select the single most appropriate category for the provided task name.'
        ),
      },
    });

    const chosen = response.answers?.selectedCategory?.choice;
    if (chosen && availableCategories.includes(chosen)) {
      return { category: chosen };
    }
    return { category: fallbackCategorize(taskName, availableCategories) };
  } catch (error) {
    return { category: fallbackCategorize(taskName, availableCategories) };
  }
}
