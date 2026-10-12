'use server';

/**
 * @fileOverview Extracts structured tasks from spoken text using JEV TypeSafe SystemOne.
 */

import { z } from 'zod';
import { organizeRoutine } from './organize-routine';

const VoiceInputTaskSchema = z.object({
  name: z.string().describe('The name of the task.'),
  category: z.string().describe('The suggested category from the provided list.'),
  duration: z.number().describe('The suggested duration in minutes.'),
  icon: z.string().describe('The suggested icon name from the provided list.'),
});

const ProcessVoiceInputInputSchema = z.object({
  transcript: z.string().describe('The transcribed text from the user voice input.'),
  availableIcons: z.array(z.string()).describe('A list of available icon names to choose from.'),
  availableCategories: z.array(z.string()).describe('A list of available category names to choose from.'),
});

const ProcessVoiceInputOutputSchema = z.object({
  tasks: z.array(VoiceInputTaskSchema).describe('The list of tasks extracted and summarized from the input.'),
});

export type ProcessVoiceInputOutput = z.infer<typeof ProcessVoiceInputOutputSchema>;

export async function processVoiceInput(
  input: z.infer<typeof ProcessVoiceInputInputSchema>
): Promise<ProcessVoiceInputOutput> {
  if (!input.transcript || !input.transcript.trim()) {
    return { tasks: [] };
  }

  return organizeRoutine({
    description: input.transcript,
    availableIcons: input.availableIcons,
    availableCategories: input.availableCategories,
  });
}
