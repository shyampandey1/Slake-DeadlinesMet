
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { gemini15Flash } from '@genkit-ai/googleai';

const GenerateRoutineInputSchema = z.object({
  profession: z.string().describe('The name of the profession.'),
  daysOff: z.array(z.string()).describe('Days of the week that are off.'),
});

export type GenerateRoutineInput = z.infer<typeof GenerateRoutineInputSchema>;

const TaskSchema = z.object({
  name: z.string(),
  duration: z.number(),
  icon: z.string(),
  category: z.string(),
});

const GenerateRoutineOutputSchema = z.object({
  routines: z.record(z.object({
    color: z.string(),
    tasks: z.array(TaskSchema),
  })),
});

export type GenerateRoutineOutput = z.infer<typeof GenerateRoutineOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateRoutinePrompt',
  input: { schema: GenerateRoutineInputSchema },
  output: { schema: GenerateRoutineOutputSchema },
  prompt: `You are a productivity architect. Generate a high-performance daily routine for a {{{profession}}}. 
  The user has these days off: {{{daysOff}}}.
  
  The routine should be divided into logical categories like "Morning Kickstart", "Deep Work", "Recovery", etc.
  
  For each task, provide:
  - name: Descriptive title.
  - duration: Minutes (sensible for the task).
  - icon: A valid Lucide icon name (e.g., Coffee, Laptop, BookOpen, BrainCircuit, Dumbbell, Utensils).
  - category: The category it belongs to.

  Categories should have a 'color' field which is a Tailwind CSS class for the background (e.g., 'bg-blue-600/20', 'bg-orange-600/20').
  
  Return a structured routine that is realistic, balanced, and optimized for a {{{profession}}}.
  `,
});

export async function generateAIRoutine(input: GenerateRoutineInput): Promise<GenerateRoutineOutput> {
  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `You are a productivity architect. Generate a high-performance daily routine for a ${input.profession}.
      Days off: ${JSON.stringify(input.daysOff)}
      
      Generate structured categories and tasks with icons and durations.`,
      output: {
        schema: GenerateRoutineOutputSchema
      }
    });

    return output!;
  } catch (error: any) {
    console.error("AI Routine Generation Error:", error.name, error.message);
    throw new Error("Failed to generate AI routine");
  }
}
