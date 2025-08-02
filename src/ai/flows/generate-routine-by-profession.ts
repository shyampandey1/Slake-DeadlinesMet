
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
  prompt: `You are an expert productivity coach who creates tailored daily routines for various professions based on a specific knowledge base.

Your task is to generate a comprehensive and structured daily routine for the given profession: **{{{profession}}}**

First, determine which of the following professional archetypes the "{{{profession}}}" fits into:
1.  **Creative Professional**: Artist, Content Creator, Designer, Writer
2.  **Business Professional**: Consultant, Manager, Marketer, Entrepreneur, Sales
3.  **Technical Professional**: Software Engineer, IT Pro, Researcher
4.  **On-The-Go Professional**: Sales, Medical Rep, Delivery Agent (if profession implies high mobility)
5.  **Healthcare Professional**: Doctor, Nurse, etc. (if profession implies shift-based work)

Once you've identified the archetype, generate a schedule based *only* on the corresponding template below. Ensure every task, including hydration, is included.

**Available Task Icons:**
{{#each availableIcons}}
- {{{this}}}
{{/each}}

**Available Task Categories:**
{{#each availableCategories}}
- {{{this}}}
{{/each}}

**Available Profession Category Groups:**
{{#each availableCategoryGroups}}
- {{{this}}}
{{/each}}

---

**1. Creative Professional Template**
- **Morning:** Wake up & drink a glass of water (1 min, Droplets), Mindfulness: Meditation or Journaling (15 min, BrainCircuit), Light Movement: Stretching or Yoga (20 min, StretchHorizontal), Breakfast (20 min, Utensils). Assign to "Morning" category.
- **Work:** Deep Creative Session (180 min, BrainCircuit), Hourly Water Break (1 min, Droplets). Assign to "Work" category.
- **Break:** Lunch (60 min, Utensils), Start with water (1 min, Droplets). Assign to "Break" category.
- **Work:** Admin tasks (90 min, Mail), Inspiration gathering (90 min, BookOpen), Drink water before starting (1 min, Droplets). Assign to "Work" category.
- **Evening:** Drink a glass of water (1 min, Droplets), Exercise/Workout (45 min, Dumbbell), Dinner (30 min, Utensils), Leisure & Social Time (60 min, Users), Plan tomorrow's task (5 min, ListChecks), Screen-free wind-down (30 min, BookOpen), Bedtime (Bed). Assign to "Evening" category.

**2. Business Professional Template**
- **Morning:** Wake up & drink a glass of water (1 min, Droplets), Breathing Exercise (5 min, Wind), Workout/Exercise (30 min, Dumbbell), Plan day's top 3 priorities (10 min, ListChecks), Breakfast (20 min, Utensils). Assign to "Morning" category.
- **Work:** Most important strategic task (180 min, Target), Hourly break & water (5 min, Coffee). Assign to "Work" category.
- **Break:** Lunch (60 min, Utensils), Start with water (1 min, Droplets). Assign to "Break" category.
- **Work:** Meetings & collaboration (120 min, Users), Pomodoro for emails (120 min, Mail), Drink water hourly (1 min, Droplets). Assign to "Work" category.
- **Evening:** Decompression & water (1 min, Droplets), Leisure/Hobby (60 min, ShoppingBag), Dinner (45 min, Utensils), Light reading (30 min, BookOpen), Meditation (10 min, BrainCircuit), Bedtime (Bed). Assign to "Evening" category.

**3. Technical Professional Template**
- **Morning:** Wake up & drink water (1 min, Droplets), Meditation (10 min, BrainCircuit), Light Exercise (20 min, StretchHorizontal), Breakfast (20 min, Utensils). Assign to "Morning" category.
- **Work:** Deep Focus Block (240 min, BrainCircuit), 20-20-20 rule & water break (1 min, Droplets). Assign to "Work" category.
- **Break:** Lunch & walk (60 min, Utensils), Start with water (1 min, Droplets). Assign to "Break" category.
- **Work:** Code reviews, meetings, docs (180 min, ListChecks), Drink water hourly (1 min, Droplets). Assign to "Work" category.
- **Evening:** Rehydrate with water (1 min, Droplets), Workout (45 min, Dumbbell), Leisure/Personal Project (90 min, Wrench), Dinner (30 min, Utensils), Plan tomorrow (5 min, ListChecks), Read physical book (30 min, BookOpen), Bedtime (Bed). Assign to "Evening" category.

**4. On-The-Go Professional Template**
- **Morning:** Wake up & water (1 min, Droplets), Quick HIIT/run (20 min, Footprints), High-protein Breakfast (20 min, Utensils), Review route/appointments (15 min, ListChecks). Assign to "Morning" category.
- **Work:** Travel & Calls/Podcasts (60 min, Mail), Hydrate every 2 hours (1 min, Droplets), Breathing exercises between appointments (5 min, Wind). Assign to "Work" category.
- **Break:** Packed Lunch & water (30 min, Utensils). Assign to "Break" category.
- **Evening:** Log reports & plan tomorrow (30 min, ListChecks), Drink water (1 min, Droplets), Dinner (30 min, Utensils), Relaxing activity (60 min, ShoppingBag), Stretching (15 min, StretchHorizontal), Prepare for next day, Bedtime (Bed). Assign to "Evening" category.

**5. Healthcare Professional Template**
- **Morning:** Pre-Shift: Wake up & water (1 min, Droplets), Quick snack, Deep breathing (5 min, Wind). Assign to "Morning" category.
- **Work:** During Shift: Hydrate every 2-3 hours (1 min, Droplets), Eat small high-energy snacks/meals (15 min, Utensils), Micro-breaks with water (1 min, Coffee). Repeat as needed. Assign to "Work" category.
- **Evening:** Post-Shift: Immediately rehydrate (1 min, Droplets), Decompression on commute. Drink water before dinner (1 min, Droplets), Dinner (30 min, Utensils), Connect with family (30 min, Users), Relaxing hobby (45 min, ShoppingBag), Warm shower, Read book (15 min, BookOpen), Bedtime (Bed). Assign to "Evening" category.

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
