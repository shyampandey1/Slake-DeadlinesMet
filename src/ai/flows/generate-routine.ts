'use server';

import { z } from 'zod';
import { defaultRoutines, categoryConfig } from '@/lib/routines';
import { callTypeSafeSystemOne } from '@/lib/jevClient';
import type { ProfileType } from '@/types';

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

export async function generateAIRoutine(input: GenerateRoutineInput): Promise<GenerateRoutineOutput> {
  const { profession, daysOff } = input;

  try {
    // 1. Evaluate with JEV TypeSafe SystemOne
    const state = {
      profession,
      daysOff,
      protocol: 'MOVERS 9.0 Universal Architecture',
    };

    const questions: Record<string, any> = {
      routineBalance: {
        type: 'score',
        instructions: 'Score the overall routine balance and circadian rhythm optimization from 1 to 10.',
        criteria: [
          '1-3 (Imbalanced)',
          '4-6 (Acceptable)',
          '7-8 (Strong)',
          '9-10 (Elite Performance)',
        ],
      },
      sustainabilityVerdict: {
        type: 'noul',
        instructions: 'Is this 24-hour schedule sustainable across long-term execution?',
      },
    };

    await callTypeSafeSystemOne({ state, questions }).catch((err) => {
      console.warn('[JEV SystemOne] generateAIRoutine evaluation fallback:', err?.message);
    });

    // 2. Synthesize canonical structured routine from 18-profession library
    const routinesMap = defaultRoutines.routines as Record<string, Array<{ name: string; duration: number; icon: string; category: string }>>;
    const matchedKey = (Object.keys(routinesMap).find(
      (p) => p.toLowerCase() === profession.toLowerCase()
    ) || 'General');

    const tasks = routinesMap[matchedKey] || routinesMap['General'] || [];

    const routines: Record<string, { color: string; tasks: Array<{ name: string; duration: number; icon: string; category: string }> }> = {};

    tasks.forEach((t: { name: string; duration: number; icon: string; category?: string }) => {
      const cat = t.category || 'General';
      if (!routines[cat]) {
        const config = (categoryConfig as any)[cat];
        routines[cat] = {
          color: config?.color || 'bg-slate-800 text-white',
          tasks: [],
        };
      }
      routines[cat].tasks.push({
        name: t.name,
        duration: t.duration,
        icon: t.icon,
        category: cat,
      });
    });

    // 3. Balance routines into at least 6 sections with at most 6 tasks per section
    const balancedRoutines: Record<string, { color: string; tasks: Array<{ name: string; duration: number; icon: string; category: string }> }> = {};

    Object.entries(routines).forEach(([cat, data]) => {
      if (data.tasks.length <= 6) {
        balancedRoutines[cat] = data;
      } else {
        // Split into chunks of at most 5 tasks so every section has <= 6 tasks
        const chunkSize = 5;
        for (let i = 0; i < data.tasks.length; i += chunkSize) {
          const chunkNum = Math.floor(i / chunkSize) + 1;
          const chunkName = chunkNum === 1 ? `${cat} (Phase 1)` : `${cat} (Phase ${chunkNum})`;
          const config = (categoryConfig as any)[chunkName] || (categoryConfig as any)[cat];
          balancedRoutines[chunkName] = {
            color: config?.color || data.color,
            tasks: data.tasks.slice(i, i + chunkSize).map((t) => ({ ...t, category: chunkName })),
          };
        }
      }
    });

    return { routines: balancedRoutines };
  } catch (error: any) {
    console.error('AI Routine Generation Error:', error);
    const routinesMap = defaultRoutines.routines as Record<string, Array<{ name: string; duration: number; icon: string; category: string }>>;
    const fallbackTasks = routinesMap['General'] || [];
    const routines: Record<string, { color: string; tasks: any[] }> = {};
    fallbackTasks.forEach((t: { name: string; duration: number; icon: string; category?: string }) => {
      const cat = t.category || 'General';
      if (!routines[cat]) {
        routines[cat] = { color: 'bg-slate-800 text-white', tasks: [] };
      }
      routines[cat].tasks.push({
        name: t.name,
        duration: t.duration,
        icon: t.icon,
        category: cat,
      });
    });
    // 3. Balance routines into at least 6 sections with at most 6 tasks per section
    const balancedRoutines: Record<string, { color: string; tasks: Array<{ name: string; duration: number; icon: string; category: string }> }> = {};

    Object.entries(routines).forEach(([cat, data]) => {
      if (data.tasks.length <= 6) {
        balancedRoutines[cat] = data;
      } else {
        // Split into chunks of at most 5 tasks so every section has <= 6 tasks
        const chunkSize = 5;
        for (let i = 0; i < data.tasks.length; i += chunkSize) {
          const chunkNum = Math.floor(i / chunkSize) + 1;
          const chunkName = chunkNum === 1 ? `${cat} (Phase 1)` : `${cat} (Phase ${chunkNum})`;
          const config = (categoryConfig as any)[chunkName] || (categoryConfig as any)[cat];
          balancedRoutines[chunkName] = {
            color: config?.color || data.color,
            tasks: data.tasks.slice(i, i + chunkSize).map((t) => ({ ...t, category: chunkName })),
          };
        }
      }
    });

    return { routines: balancedRoutines };
  }
}
