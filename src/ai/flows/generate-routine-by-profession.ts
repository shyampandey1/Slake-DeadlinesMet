
'use server';
/**
 * @fileOverview Generates a structured daily routine based on a user's profession.
 *
 * - generateRoutineByProfession - A function that takes a profession and returns a structured list of tasks.
 * - GenerateRoutineByProfessionInput - The input type for the function.
 * - GenerateRoutineByProfessionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRoutineByProfessionInputSchema = z.object({
  profession: z.string().describe("The user's profession (e.g., 'Doctor', 'Artist', 'Teacher')."),
  availableIcons: z.array(z.string()).describe('A list of available icon names to choose from.'),
  availableCategories: z.array(z.string()).describe('A list of available category names to choose from.'),
  availableCategoryGroups: z.array(z.string()).describe('A list of available profession category groups to choose from.'),
});
export type GenerateRoutineByProfessionInput = z.infer<typeof GenerateRoutineByProfessionInputSchema>;

const OrganizedTaskSchema = z.object({
    name: z.string().describe('The name of the task.'),
    duration: z.number().describe('The estimated duration of the task in minutes.'),
    icon: z.string().describe('The suggested icon name from the available list.'),
    category: z.string().describe('The suggested category from the available list (e.g., "Morning", "Work", "Evening", "Night").'),
});

const GenerateRoutineByProfessionOutputSchema = z.object({
  tasks: z.array(OrganizedTaskSchema).describe('An array of structured tasks generated for the specified profession.'),
  categoryGroup: z.string().describe('The most relevant category group for the profession from the available list.'),
});
export type GenerateRoutineByProfessionOutput = z.infer<typeof GenerateRoutineByProfessionOutputSchema>;


export async function generateRoutineByProfession(input: GenerateRoutineByProfessionInput): Promise<GenerateRoutineByProfessionOutput> {
  return generateRoutineByProfessionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRoutineByProfessionPrompt',
  input: {schema: GenerateRoutineByProfessionInputSchema},
  output: {schema: GenerateRoutineByProfessionOutputSchema},
  prompt: `You are an expert productivity coach. Your task is to generate a tailored daily schedule for a user based on their profession: **{{{profession}}}**.

  First, identify the professional archetype for the given profession from the knowledge base below. Then, generate a structured list of tasks based *only* on the corresponding template.
  Parse durations like "1.5h" as 90 minutes, "3-4 hours" as 180 minutes, and "Screen-free wind-down" as 30 minutes. The final bedtime task should have a duration of 0.

  **Available Icons:** {{#each availableIcons}}{{{this}}}, {{/each}}
  **Available Categories:** {{#each availableCategories}}{{{this}}}, {{/each}}
  **Available Category Groups:** {{#each availableCategoryGroups}}{{{this}}}, {{/each}}

  **Knowledge Base:**
  Creative Professional (Artist, Content Creator, Designer, Writer): Schedule Focus - protect creative time and maintain flexibility. Morning (Flexible Start, e.g., 8:00 AM): Wake up & drink a glass of water (1 min); Mindfulness: Meditation or Journaling (15 min); Light Movement: Stretching or Yoga (20 min); Breakfast (20 min). Deep Creative Session (180 min): Uninterrupted work on primary project; Hourly: Take a 1 min break to drink a glass of water. Lunch (60 min): Start with a glass of water; Mindful meal away from the workspace; Short walk. Afternoon (180 min): Drink a glass of water before starting; Session 1 (90 min) for Admin tasks (emails, planning); Session 2 (90 min) for Inspiration gathering (reading, video games). Evening (Post 6:00 PM): Drink a glass of water (1 min); Exercise/Workout (45 min); Dinner (30 min); Leisure & Social Time (60 min). Night: Drink a small glass of water (1 min); Plan tomorrow's top creative task (5 min); Screen-free wind-down (30 min); Bedtime (0 min). || Business Professional (Consultant, Manager, Marketer, Entrepreneur): Schedule Focus - structured time management and stress reduction. Morning (6:00 AM - 9:00 AM): Wake up & drink a glass of water (1 min); Breathing Exercise for focus (5 min); Workout/Exercise (30 min); Plan day's top 3 priorities (10 min); Breakfast (20 min). Work Block 1 (180 min): Tackle most important task; Hourly: 5 min break to stand/stretch and drink a glass of water. Lunch (60 min): Start with a glass of water; Power lunch. Work Block 2 (240 min): Meetings and collaborative tasks; Hourly: Drink a glass of water; Use Pomodoro Technique for smaller tasks. Decompression (120 min): Start by drinking a glass of water; Transition from work (podcast/music); Leisure (video games/hobby, 60 min). Evening (7:00 PM onwards): Drink a glass of water before dinner; Dinner (45 min); No-work-email policy. Night: Drink a small glass of water (1 min); Light reading (30 min); Meditation for stress release (10 min); Bedtime (0 min). || Technical Professional (Software Engineer, IT Pro, Researcher): Schedule Focus - optimize deep focus, prevent burnout, manage screen time. Morning (7:00 AM - 9:00 AM): Wake up & drink a glass of water (1 min); Meditation (10 min); Light Exercise (20 min); Breakfast (20 min), no screens. Deep Focus Block 1 (240 min): 4-hour session for coding/research; Hourly: Use 20-20-20 rule, stand, and drink a glass of water. Lunch (60 min): Start with a glass of water; Screen-free lunch and walk outside. Afternoon Block (180 min): Lighter tasks (reviews, meetings); Hourly: Drink a glass of water; Use Pomodoro. Evening (Post 5:00 PM): Rehydrate with a glass of water (1 min); Workout (45 min); Leisure (video games, project, social, 90 min); Dinner (30 min). Night: Drink a small glass of water (1 min); Plan tomorrow's task (5 min); Read physical book (30 min); Bedtime (0 min). || On-The-Go Professional (Sales, Medical Rep, Delivery Agent): Schedule Focus - energy management, mobile productivity, healthy habits on the road. Morning (6:30 AM): Wake up & drink a glass of water (1 min); Quick HIIT workout (20 min); High-protein Breakfast (20 min); Review route/appointments (15 min). On The Road (AM/PM): Start travel with a glass of water (1 min); Hydration Rule: Drink one glass every 2 hours; Use travel time for calls/podcasts (60 min); Use breaks for breathing exercises (5 min). Lunch (30 min): Drink a glass of water before eating; Pack healthy lunch. End of Field Work (e.g., 5:00 PM): Drink a glass of water (1 min); Log reports and plan tomorrow (30 min). Evening (Post 6:00 PM): Drink a glass of water before dinner; Dinner (30 min); Relaxing activity (show, video games) (60 min); Stretching (15 min). Night: Drink a small glass of water (1 min); Prepare for next day (15 min); Bedtime (0 min). || Healthcare Professional (Shift-Based): Schedule Focus - energy management for 12-hour shift and recovery. Pre-Shift (5:30 AM): Wake up & drink a glass of water (1 min); Quick snack (10 min); 5 min deep breathing. During Shift (7 AM - 7 PM): Hydration: Drink a glass of water every 2-3 hours (1 min); Eat small, high-energy snacks (15 min); Use micro-breaks for rest and sips of water (1 min). Post-Shift (7:30 PM): Immediately drink a full glass of water to rehydrate (1 min); Decompress on commute (calm music/podcast) (20 min). Evening (8:30 PM onwards): Drink a glass of water before dinner; Dinner (30 min); Connect with family (30 min); Light leisure (no intense games) (45 min). Night: Drink a small glass of water (1 min); Warm shower (15 min); Avoid screens. Read a book (15 min); Ensure dark room for quality sleep; Bedtime (0 min).
  ---
  Finally, classify the "{{{profession}}}" into the single most relevant category group from the available list.
  
  Generate the structured routine and classify the "{{{profession}}}" profession now. Ensure the entire day is reasonably accounted for.
  `,
});

const generateRoutineByProfessionFlow = ai.defineFlow(
  {
    name: 'generateRoutineByProfessionFlow',
    inputSchema: GenerateRoutineByProfessionInputSchema,
    outputSchema: GenerateRoutineByProfessionOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output || !output.tasks || output.tasks.length === 0) {
        console.error("AI call for profession-based routine generation returned empty tasks.");
        return { tasks: [], categoryGroup: 'General & Freelance' };
      }
      return output;
    } catch(e) {
      console.error("AI call for profession-based routine generation failed", e);
      return { tasks: [], categoryGroup: 'General & Freelance' };
    }
  }
);
