
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
    category: z.string().describe('The suggested category from the available list (e.g., "Morning", "Work", "Evening").'),
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

  **Available Icons:** {{#each availableIcons}}{{{this}}}, {{/each}}
  **Available Categories:** {{#each availableCategories}}{{{this}}}, {{/each}}
  **Available Category Groups:** {{#each availableCategoryGroups}}{{{this}}}, {{/each}}

  **Knowledge Base:**

  -   **Creative Professional (Artist, Content Creator, Designer, Writer):** Schedule Focus - protect creative time and maintain flexibility. Morning (Flexible Start, e.g., 8:00 AM): Wake up & drink a glass of water (1 min, Droplets, Morning); Mindfulness: Meditation or Journaling (15 min, BrainCircuit, Morning); Light Movement: Stretching or Yoga (20 min, StretchHorizontal, Morning); Breakfast (20 min, Utensils, Morning). Deep Creative Session (180 min, BrainCircuit, Work): Uninterrupted work on primary project; Hourly: Take a 1 min break to drink a glass of water (1 min, Droplets, Work). Lunch (60 min, Utensils, Break): Start with a glass of water; Mindful meal away from the workspace; Short walk. Afternoon (180 min, Work): Drink a glass of water before starting (1 min, Droplets, Work); Session 1 (90 min, Mail, Work) for Admin tasks (emails, planning); Session 2 (90 min, BookOpen, Work) for Inspiration gathering (reading, video games). Evening (Post 6:00 PM): Drink a glass of water (1 min, Droplets, Evening); Exercise/Workout (45 min, Dumbbell, Evening); Dinner (30 min, Utensils, Evening); Leisure & Social Time (60 min, Users, Evening). Night Routine (Post 9:00 PM): Drink a small glass of water (1 min, Droplets, Evening); Plan tomorrow's top creative task (5 min, ListChecks, Evening); Screen-free wind-down (30 min, BookOpen, Evening); Bedtime (0 min, Bed, Evening).
  -   **Business Professional (Consultant, Manager, Marketer, Entrepreneur):** Schedule Focus - structured time management and stress reduction. Morning (6:00 AM - 9:00 AM): Wake up & drink a glass of water (1 min, Droplets, Morning); Breathing Exercise for focus (5 min, Wind, Morning); Workout/Exercise (30 min, Dumbbell, Morning); Plan day's top 3 priorities (10 min, ListChecks, Morning); Breakfast (20 min, Utensils, Morning). Work Block 1 (180 min, Target, Work): Tackle most important task; Hourly: 5 min break to stand/stretch and drink a glass of water (5 min, Coffee, Work). Lunch (60 min, Utensils, Break): Start with a glass of water; Power lunch. Work Block 2 (240 min, Users, Work): Meetings and collaborative tasks; Hourly: Drink a glass of water (1 min, Droplets, Work); Use Pomodoro Technique (120 min, Mail, Work). Decompression (120 min, ShoppingBag, Evening): Start by drinking a glass of water (1 min, Droplets, Evening); Transition from work (podcast/music); Leisure (video games/hobby, 60 min). Evening (7:00 PM onwards): Drink a glass of water before dinner (1 min, Droplets, Evening); Dinner (45 min, Utensils, Evening); No-work-email policy. Night Routine (Post 10:00 PM): Drink a small glass of water (1 min, Droplets, Evening); Light reading (30 min, BookOpen, Evening); Meditation for stress release (10 min, BrainCircuit, Evening); Bedtime (0 min, Bed, Evening).
  -   **Technical Professional (Software Engineer, IT Pro, Researcher):** Schedule Focus - optimize deep focus, prevent burnout, manage screen time. Morning (7:00 AM - 9:00 AM): Wake up & drink a glass of water (1 min, Droplets, Morning); Meditation (10 min, BrainCircuit, Morning); Light Exercise (20 min, StretchHorizontal, Morning); Breakfast (20 min, Utensils, Morning), no screens. Deep Focus Block 1 (240 min, BrainCircuit, Work): 4-hour session for coding/research; Hourly: Use 20-20-20 rule, stand, and drink a glass of water (1 min, Droplets, Work). Lunch (60 min, Utensils, Break): Start with a glass of water; Screen-free lunch and walk outside. Afternoon Block (180 min, ListChecks, Work): Lighter tasks (reviews, meetings); Hourly: Drink a glass of water (1 min, Droplets, Work); Use Pomodoro. Evening (Post 5:00 PM): Rehydrate with a glass of water (1 min, Droplets, Evening); Workout (45 min, Dumbbell, Evening); Leisure (video games, project, social, 90 min, Wrench, Evening); Dinner (30 min, Utensils, Evening). Night Routine (Post 9:30 PM): Drink a small glass of water (1 min, Droplets, Evening); Plan tomorrow's task (5 min, ListChecks, Evening); Read physical book (30 min, BookOpen, Evening); Bedtime (0 min, Bed, Evening).
  -   **On-The-Go Professional (Sales, Medical Rep, Delivery Agent):** Schedule Focus - energy management, mobile productivity, healthy habits on the road. Morning (6:30 AM): Wake up & drink a glass of water (1 min, Droplets, Morning); Quick HIIT workout (20 min, Footprints, Morning); High-protein Breakfast (20 min, Utensils, Morning); Review route/appointments (15 min, ListChecks, Morning). On The Road (AM/PM): Start travel with a glass of water (1 min, Droplets, Work); Hydration Rule: Drink one glass every 2 hours (1 min, Droplets, Work); Use travel time for calls/podcasts (60 min, Mail, Work); Use breaks for breathing exercises (5 min, Wind, Work). Lunch: Drink a glass of water before eating (1 min, Droplets, Break); Pack healthy lunch (30 min, Utensils, Break). End of Field Work (e.g., 5:00 PM): Drink a glass of water (1 min, Droplets, Evening); Log reports and plan tomorrow (30 min, ListChecks, Evening). Evening Wind-down (Post 6:00 PM): Drink a glass of water before dinner (1 min, Droplets, Evening); Dinner (30 min, Utensils, Evening); Relaxing activity (show, video games) (60 min, ShoppingBag, Evening); Stretching (15 min, StretchHorizontal, Evening). Night Routine: Drink a small glass of water (1 min, Droplets, Evening); Prepare for next day (15 min, ListChecks, Evening); Bedtime (0 min, Bed, Evening).
  -   **Healthcare Professional (Shift-Based):** Schedule Focus - energy management for 12-hour shift and recovery. Pre-Shift (5:30 AM): Wake up & drink a glass of water (1 min, Droplets, Morning); Quick snack (10 min, Utensils, Morning); 5 min deep breathing (5 min, Wind, Morning). During Shift (7 AM - 7 PM): Hydration: Drink a glass of water every 2-3 hours (1 min, Droplets, Work); Eat small, high-energy snacks (15 min, Utensils, Work); Use micro-breaks for rest and sips of water (1 min, Coffee, Work). Post-Shift (7:30 PM): Immediately drink a full glass of water to rehydrate (1 min, Droplets, Evening); Decompress on commute (calm music/podcast) (20 min, Wind, Evening). Evening (8:30 PM onwards): Drink a glass of water before dinner (1 min, Droplets, Evening); Dinner (30 min, Utensils, Evening); Connect with family (30 min, Users, Evening); Light leisure (no intense games) (45 min, ShoppingBag, Evening). Night Routine (10:00 PM): Drink a small glass of water (1 min, Droplets, Evening); Warm shower (15 min, Droplets, Evening); Avoid screens. Read a book (15 min, BookOpen, Evening); Ensure dark room for quality sleep; Bedtime (0 min, Bed, Evening).
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
