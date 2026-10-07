import { ParsedIntent, VoiceIntentAction } from '../types/voice';

const API_BASE_URL = 'https://dealdlinesmet.vercel.app'; // Production backend or local network fallback

export class JevClient {
  /**
   * Parse user utterance using JEV TypeSafe SystemOne endpoint,
   * with seamless offline local regex dictionary fallback.
   */
  static async parseVoiceIntent(
    transcript: string,
    currentRoute: string = '/timer',
    isTimerRunning: boolean = false
  ): Promise<ParsedIntent> {
    const clean = transcript.trim().toLowerCase();

    // 1. Try local fast pattern matcher first
    const localMatch = this.matchLocalIntent(clean, isTimerRunning);
    if (localMatch && localMatch.confidence >= 0.9) {
      return localMatch;
    }

    // 2. Query cloud JEV endpoint if available
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${API_BASE_URL}/api/voice/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          activeRoute: currentRoute,
          timerRunning: isTimerRunning,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return {
          action: data.action,
          confidence: data.confidence ?? 0.85,
          feedbackSpeech: data.feedbackSpeech || "Processing command",
          actionType: data.actionType,
          parameters: data.parameters,
        };
      }
    } catch (e) {
      // Offline or network error - fall back to local rule parser
    }

    // 3. Fallback to offline rule parser
    return localMatch || {
      action: 'TASK_CREATE',
      confidence: 0.5,
      feedbackSpeech: `Noted: "${transcript}"`,
      parameters: { taskName: transcript },
    };
  }

  private static matchLocalIntent(clean: string, isTimerRunning: boolean): ParsedIntent | null {
    // Timer Controls
    if (clean.includes('pause') && clean.includes('timer')) {
      return { action: 'TIMER_PAUSE', confidence: 1.0, feedbackSpeech: 'Timer paused.' };
    }
    if (clean.includes('resume') || (clean.includes('continue') && clean.includes('timer'))) {
      return { action: 'TIMER_RESUME', confidence: 1.0, feedbackSpeech: 'Resuming focus timer.' };
    }
    if (clean.includes('stop timer') || clean.includes('cancel timer') || clean.includes('reset timer')) {
      return { action: 'TIMER_STOP', confidence: 1.0, feedbackSpeech: 'Focus timer stopped.' };
    }
    if (clean.includes('start timer') || clean.includes('begin focus') || clean.includes('start task')) {
      return { action: 'TIMER_START', confidence: 1.0, feedbackSpeech: 'Focus timer activated.' };
    }

    // Intervals
    const intervalMatch = clean.match(/(?:interval|every)\s*(\d+)\s*(?:min|minute)/);
    if (intervalMatch) {
      const minutes = parseInt(intervalMatch[1], 10);
      return {
        action: 'TIMER_SET_INTERVAL',
        confidence: 0.98,
        feedbackSpeech: `Interval alert set to ${minutes} minutes.`,
        parameters: { intervalMinutes: minutes },
      };
    }

    // Task Completion
    if (clean === 'done' || clean === 'finished' || clean.includes('complete task') || clean.includes('task done')) {
      return { action: 'ROUTINE_COMPLETE_TASK', confidence: 0.98, feedbackSpeech: 'Task completed! Slake Coins awarded.' };
    }

    // Water & Quick Habits
    if (clean.includes('water') || clean.includes('drink') || clean.includes('hydration')) {
      return {
        action: 'TASK_LOG_QUICK',
        actionType: 'WATER_LOG',
        confidence: 0.95,
        feedbackSpeech: 'Logged 1 glass of water. Stay hydrated!',
        parameters: { category: 'Hydration' },
      };
    }

    // Navigation
    if (clean.includes('rewards') || clean.includes('coins')) {
      return { action: 'NAVIGATE', confidence: 0.95, feedbackSpeech: 'Opening Rewards ledger.', parameters: { route: '/rewards' } };
    }
    if (clean.includes('reformer') || clean.includes('co op') || clean.includes('buddy')) {
      return { action: 'NAVIGATE', confidence: 0.95, feedbackSpeech: 'Navigating to Reformers League.', parameters: { route: '/reformers' } };
    }
    if (clean.includes('settings')) {
      return { action: 'NAVIGATE', confidence: 0.95, feedbackSpeech: 'Opening Settings.', parameters: { route: '/settings' } };
    }

    return null;
  }
}
