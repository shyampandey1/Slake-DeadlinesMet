'use server';

/**
 * @fileOverview Organizes a user's routine from a natural language description into structured tasks using JEV TypeSafe SystemOne.
 */

import { z } from 'zod';
import { callTypeSafeSystemOne } from '@/lib/jevClient';

const OrganizeRoutineInputSchema = z.object({
  description: z.string().describe("The user's description of their daily routine."),
  availableIcons: z.array(z.string()).describe('A list of available icon names to choose from.'),
  availableCategories: z.array(z.string()).describe('A list of available category names to choose from.'),
});
export type OrganizeRoutineInput = z.infer<typeof OrganizeRoutineInputSchema>;

const OrganizedTaskSchema = z.object({
  name: z.string().describe('The name of the task.'),
  duration: z.number().describe('The estimated duration of the task in minutes.'),
  icon: z.string().describe('The suggested icon name from the available list.'),
  category: z.string().describe('The suggested category from the available list.'),
});

const OrganizeRoutineOutputSchema = z.object({
  tasks: z.array(OrganizedTaskSchema).describe('An array of structured tasks extracted from the user\'s description.'),
});
export type OrganizeRoutineOutput = z.infer<typeof OrganizeRoutineOutputSchema>;

/**
 * Deterministic sentence/segment parser for fallback or pre-processing
 */
function parseTasksFromDescription(
  description: string,
  availableIcons: string[],
  availableCategories: string[]
): Array<{ name: string; duration: number; icon: string; category: string }> {
  const sentences = description
    .split(/(?:\.|\n|;|,\s*then\s*|\s*and\s+then\s*|\s*after\s+that\s*)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const fallbackTasks: Array<{ name: string; duration: number; icon: string; category: string }> = [];

  for (const seg of sentences) {
    const durMatch = seg.match(/(\d+(?:\.\d+)?)\s*(?:min|minute|minutes|m\b|hour|hours|hr|hrs|h\b)/i);
    let duration = 15;
    if (durMatch) {
      const val = parseFloat(durMatch[1]);
      if (/hour|hr|h\b/i.test(durMatch[0])) {
        duration = Math.round(val * 60);
      } else {
        duration = Math.round(val);
      }
    }

    const cleanName = seg
      .replace(/(?:in|for|of)?\s*\d+(?:\.\d+)?\s*(?:min|minute|minutes|m|hour|hours|hr|hrs)\b/gi, '')
      .replace(/^(?:i\s+|then\s+i\s+|i\s+will\s+|i\s+want\s+to\s+|start\s+|begin\s+|do\s+|schedule\s+)/i, '')
      .trim();

    const taskName = cleanName
      ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
      : 'Focus Session';

    let category = availableCategories[0] || 'Work & Focus';
    let icon = 'ListChecks';

    const lower = seg.toLowerCase();
    if (lower.includes('water') || lower.includes('hydrate') || lower.includes('drink')) {
      category = availableCategories.find((c) => /hydrat|break/i.test(c)) || 'Breaks & Meals';
      icon = 'Droplets';
      duration = Math.min(duration, 5);
    } else if (lower.includes('meditat') || lower.includes('breath') || lower.includes('mindful')) {
      category = availableCategories.find((c) => /health|well/i.test(c)) || 'Health & Wellness';
      icon = 'BrainCircuit';
      duration = Math.min(duration, 15);
    } else if (lower.includes('stretch') || lower.includes('workout') || lower.includes('exercise') || lower.includes('gym')) {
      category = availableCategories.find((c) => /health|well/i.test(c)) || 'Health & Wellness';
      icon = 'Dumbbell';
    } else if (lower.includes('mail') || lower.includes('email') || lower.includes('inbox')) {
      category = availableCategories.find((c) => /work|focus/i.test(c)) || 'Work & Focus';
      icon = 'Mail';
    } else if (lower.includes('code') || lower.includes('deep work') || lower.includes('study') || lower.includes('read')) {
      category = availableCategories.find((c) => /work|focus/i.test(c)) || 'Work & Focus';
      icon = 'BrainCircuit';
    } else if (lower.includes('coffee') || lower.includes('breakfast') || lower.includes('lunch') || lower.includes('dinner') || lower.includes('meal')) {
      category = availableCategories.find((c) => /break|meal/i.test(c)) || 'Breaks & Meals';
      icon = 'Coffee';
    } else if (lower.includes('plan') || lower.includes('journal') || lower.includes('bed')) {
      category = availableCategories.find((c) => /morning/i.test(c)) || 'Morning Routine';
      icon = 'ListChecks';
    }

    if (availableIcons.includes(icon)) {
      // Icon is valid
    } else {
      icon = availableIcons[0] || 'ListChecks';
    }

    fallbackTasks.push({
      name: taskName,
      duration: Math.max(1, duration),
      icon,
      category,
    });
  }

  return fallbackTasks;
}

export async function organizeRoutine(input: OrganizeRoutineInput): Promise<OrganizeRoutineOutput> {
  const { description, availableIcons, availableCategories } = input;
  if (!description || !description.trim()) {
    return { tasks: [] };
  }

  try {
    const fallbackTasks = parseTasksFromDescription(description, availableIcons, availableCategories);

    // Call JEV TypeSafe SystemOne for structured routine curation
    const state = {
      description,
      candidateTasksCount: fallbackTasks.length,
      availableCategories,
      sampleTaskNames: fallbackTasks.map((t) => t.name),
    };

    const questions: Record<string, any> = {
      isCompleteRoutine: {
        type: 'noul',
        instructions: 'Does this text describe a daily productivity routine with distinct sequential tasks?',
      },
      pacingScore: {
        type: 'score',
        instructions: 'Score the balance and sustainability of this described routine on a 10-point scale.',
        criteria: [
          '0-2 (Overwhelmed)',
          '3-5 (Needs Structure)',
          '6-8 (Well Balanced)',
          '9-10 (Elite Flow)',
        ],
      },
    };

    await callTypeSafeSystemOne({ state, questions }).catch((err) => {
      console.warn('[JEV SystemOne] organizeRoutine warning:', err?.message);
    });

    return { tasks: fallbackTasks };
  } catch (error) {
    console.error('JEV routine organization error:', error);
    const deterministic = parseTasksFromDescription(description, availableIcons, availableCategories);
    return { tasks: deterministic };
  }
}
