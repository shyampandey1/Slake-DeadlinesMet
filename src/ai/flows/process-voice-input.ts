
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

export async function processVoiceInput(input: z.infer<typeof ProcessVoiceInputInputSchema>): Promise<ProcessVoiceInputOutput> {
  return processVoiceInputFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processVoiceInputPrompt',
  input: {schema: ProcessVoiceInputInputSchema},
  output: {schema: ProcessVoiceInputOutputSchema},
  prompt: `You are an expert at extracting tasks from spoken text. 
  The user will provide a sentence or a list of tasks they want to do.
  Your job is to:
  1. Identify each discrete task mentioned.
  2. For each task, provide a clear, concise name.
  3. Assign a relevant category from the provided "Available Categories" list.
  4. Assign a relevant icon from the provided "Available Icons" list.
  5. Estimate a sensible duration in minutes for the task. Default to 25 if not specified.

  Transcript: {{{transcript}}}

  Available Icons:
  {{#each availableIcons}}
  - {{{this}}}
  {{/each}}

  Available Categories:
  {{#each availableCategories}}
  - {{{this}}}
  {{/each}}
  
  Return a JSON object with an array of tasks.

  Example Input: "I need to check my emails for 20 minutes, then work on the presentation for an hour and finally go for a 30 minute run"
  Expected Output: {
    "tasks": [
      { "name": "Check emails", "category": "Work & Focus", "duration": 20, "icon": "Mail" },
      { "name": "Work on presentation", "category": "Work & Focus", "duration": 60, "icon": "Presentation" },
      { "name": "Morning run", "category": "Health & Wellness", "duration": 30, "icon": "Footprints" }
    ]
  }
  `,
});

const processVoiceInputFlow = ai.defineFlow(
  {
    name: 'processVoiceInputFlow',
    inputSchema: ProcessVoiceInputInputSchema,
    outputSchema: ProcessVoiceInputOutputSchema,
  },
  async input => {
    if (!input.transcript.trim()) {
        return { tasks: [] };
    }
    try {
      const {output} = await prompt(input);
      return output!;
    } catch(e) {
      console.error("AI call for voice input processing failed", e);
      return { tasks: [] };
    }
  }
);
