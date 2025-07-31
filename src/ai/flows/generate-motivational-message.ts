
'use server';
/**
 * @fileOverview Generates a motivational message upon task completion using AI, incorporating task history and completion status.
 *
 * - generateMotivationalMessage - A function that generates a motivational message.
 * - GenerateMotivationalMessageInput - The input type for the generateMotivationalMessage function.
 * - GenerateMotivationalMessageOutput - The return type for the generateMotivationalMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  ).optional().describe('An array of past tasks with their duration and completion status.'),
});
export type GenerateMotivationalMessageInput = z.infer<typeof GenerateMotivationalMessageInputSchema>;

const GenerateMotivationalMessageOutputSchema = z.object({
  message: z.string().describe('The generated motivational message.'),
  suggestedNextTask: z.string().optional().describe('A suggested next task based on the completed task and history.'),
});
export type GenerateMotivationalMessageOutput = z.infer<typeof GenerateMotivationalMessageOutputSchema>;

export async function generateMotivationalMessage(input: GenerateMotivationalMessageInput): Promise<GenerateMotivationalMessageOutput> {
  return generateMotivationalMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMotivationalMessagePrompt',
  input: {schema: GenerateMotivationalMessageInputSchema},
  output: {schema: GenerateMotivationalMessageOutputSchema},
  prompt: `You are an enthusiastic and personal motivational assistant. Your primary role is to provide uplifting and encouraging messages to users after they complete a task. You should also suggest a relevant and logical next task to help them maintain momentum.

  **User's Task Information:**
  - **Task Name:** {{{taskName}}}
  - **Duration:** {{{duration}}} minutes
  - **Completion Status:** {{#if completionStatus}}Successfully Completed! Fantastic effort!{{else}}Not completed. That's completely okay, what matters is the effort.{{/if}}

  {{#if pastTasks}}
  **User's Recent Activity (for context):**
  {{#each pastTasks}}
  - **Task:** {{{taskName}}}, **Duration:** {{{duration}}} minutes, **Status:** {{#if completionStatus}}Completed{{else}}Not Completed{{/if}}
  {{/each}}
  {{/if}}

  **Your Task:**

  1.  **Generate a Motivational Message:**
      - Write a short (2-3 sentences), personalized, and genuinely uplifting message.
      - If the task was completed, celebrate their achievement and acknowledge their hard work.
      - If the task was not completed, be gentle and encouraging. Frame it as a learning opportunity and praise their dedication for the time they did put in. Avoid sounding disappointed.
      - Your tone should be positive and empowering, making the user feel good about their progress.

  2.  **Suggest a Next Task:**
      - Based on the completed task and the user's recent history, suggest a single, logical next action.
      - The suggestion should flow naturally. For example:
        - After 'Plan Day', suggest 'Focus Session' or 'Check Emails'.
        - After a long 'Focus Session', suggest 'Short Break' or 'Go for a walk'.
        - After 'Workout', suggest 'Hydrate' or 'Healthy Meal'.
        - After 'Read a Book', suggest 'Journal' or 'Wind down'.
      - If no logical task comes to mind, you can suggest a generic but useful task like 'Quick 5-min Stretch' or 'Review Today\'s Goals'.
      
  **Example Output (for a completed "Plan Day" task):**
  {
    "message": "Excellent work planning out your day! Setting a clear path is the first step to a huge success. You're setting yourself up for a win!",
    "suggestedNextTask": "Focus Session"
  }
  
  Now, generate the response for the user's task.`,
});

const generateMotivationalMessageFlow = ai.defineFlow(
  {
    name: 'generateMotivationalMessageFlow',
    inputSchema: GenerateMotivationalMessageInputSchema,
    outputSchema: GenerateMotivationalMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
