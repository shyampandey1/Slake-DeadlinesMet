import { NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ProductivityInsightsOutputSchema = z.object({
  summary: z.string().describe('A 2-3 sentence summary of recent achievements based on raw metrics.'),
  strengths: z.array(z.string()).describe('Top 2-3 productive patterns identified (specifically mentioning most productive hour or categories).'),
  suggestions: z.array(z.string()).describe('2-3 actionable, highly tactical, specific tips to improve focus or balance (no generic motivational text).'),
  focusScore: z.number().min(0).max(100).describe('A score from 0-100 reflecting focus and consistency.'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tasks = [], profile = 'General', streak = {} } = body;
    
    if (tasks.length === 0) {
      return NextResponse.json({
        summary: "You haven't logged any tasks yet! Start your first focus session to receive personalized insights.",
        strengths: ["Clean slate for the week."],
        suggestions: ["Pick one high-priority task to start with.", "Try a 25-minute Pomodoro session."],
        focusScore: 0
      });
    }

    // Last 7 days filtering for tasks
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentTasks = tasks.filter((t: any) => {
      if (!t.createdAt) return false;
      return new Date(t.createdAt) >= sevenDaysAgo;
    });

    const completedTasks = recentTasks.filter((t: any) => t.completed);
    const completedTasksCount = completedTasks.length;
    const totalTasksCount = recentTasks.length;

    // 1. Completion velocity: completed tasks per day over active days in past 7 days
    const activeDates = new Set(completedTasks.map((t: any) => {
      try {
        return new Date(t.createdAt).toDateString();
      } catch (e) {
        return '';
      }
    }).filter(Boolean));
    const activeDaysCount = activeDates.size;
    const completionVelocity = activeDaysCount > 0 ? (completedTasksCount / activeDaysCount).toFixed(1) : '0';

    // 2. Drop-off rate: tasks started but not completed
    const dropOffRate = totalTasksCount > 0 ? (((recentTasks.filter((t: any) => !t.completed).length) / totalTasksCount) * 100).toFixed(0) : '0';

    // 3. Most productive hour
    const hourCounts: { [key: number]: number } = {};
    completedTasks.forEach((t: any) => {
      try {
        const hour = new Date(t.createdAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      } catch (e) {}
    });
    let mostProductiveHour = 'None';
    let maxHourCount = 0;
    Object.keys(hourCounts).forEach((h) => {
      const hourNum = parseInt(h, 10);
      if (hourCounts[hourNum] > maxHourCount) {
        maxHourCount = hourCounts[hourNum];
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
        mostProductiveHour = `${displayHour} ${ampm}`;
      }
    });

    // 4. Category distribution
    const categoryDistribution: { [key: string]: number } = {};
    completedTasks.forEach((t: any) => {
      const cat = t.category || 'Uncategorized';
      categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
    });

    // 5. Streak count
    const streakCount = streak.currentStreak || 0;

    // Call Genkit to generate dynamic insights
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `You are a world-class productivity coach and high-performance expert.
      Analyze the user's productivity data over the last 7 days to provide tactical, data-driven feedback.
      
      User Profile: ${profile}
      Raw Metrics:
      - Completed Tasks Count: ${completedTasksCount}
      - Total Logged Tasks (Last 7 Days): ${totalTasksCount}
      - Completion Velocity: ${completionVelocity} tasks completed per active day
      - Task Drop-Off Rate: ${dropOffRate}%
      - Most Productive Hour: ${mostProductiveHour}
      - Daily Streak: ${streakCount} days
      - Category Distribution: ${JSON.stringify(categoryDistribution)}
      
      Please generate the feedback following these guidelines:
      1. Summary: Encourage the user with a 2-3 sentence overview referencing their velocity, streak, and top categories.
      2. Strengths: Identify 2-3 strengths, citing their most productive hour or categories.
      3. Suggestions: Offer 2-3 highly tactical and actionable suggestions to reduce their drop-off rate or optimize their routine. Avoid generic motivational talk. Keep it context-aware and specific.
      4. Focus Score: Compute a score (0-100) based on raw metrics, where streakCount, completion velocity, and a low drop-off rate boost the score.`,
      output: {
        schema: ProductivityInsightsOutputSchema,
      },
    });

    return NextResponse.json(response.output);
  } catch (error: any) {
    console.error('API Insights Error:', error);
    // Computation fallback in case of LLM failure
    try {
      const body = await req.json().catch(() => ({}));
      const { tasks = [] } = body;
      const totalTime = tasks.reduce((acc: number, t: any) => acc + (t.duration || 0), 0);
      const completedCount = tasks.filter((t: any) => t.completed).length;
      let focusScore = Math.min(100, Math.round((completedCount / (tasks.length || 1)) * 60 + (totalTime / 120) * 40));
      return NextResponse.json({
        summary: `Strong effort. You logged ${totalTime} minutes of focus and completed ${completedCount} tasks.`,
        strengths: ["Excellent volume of task completions.", "Good foundational tracking habits."],
        suggestions: ["Try to sequence your hardest tasks during your peak energy hours.", "Ensure you are taking 5-minute breaks after every 30 minutes of deep focus."],
        focusScore: isNaN(focusScore) ? 0 : focusScore
      });
    } catch (innerErr) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}
