import { NextRequest, NextResponse } from 'next/server';
import {
  callTypeSafeSystemOne,
  createChoiceQuestion,
  createNoulQuestion,
} from '@/lib/jevClient';

export interface AdaptivePacingPayload {
  blinkRatePerMinute: number;
  baselineBlinkRate?: number;
  gazeAwayCount: number;
  manualPauseCount: number;
  elapsedMinutes: number;
  taskName?: string;
  category?: string;
}

export type PacingAction =
  | 'CONTINUE'
  | 'TRIGGER_EYE_BREAK'
  | 'TRIGGER_BREATHING_RESET'
  | 'SPLIT_TASK';

export interface AdaptivePacingResponse {
  recommendedAction: PacingAction;
  agentSpeechPrompt: string;
  resetDurationSeconds: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AdaptivePacingPayload;
    const {
      blinkRatePerMinute,
      baselineBlinkRate = 18,
      gazeAwayCount,
      manualPauseCount,
      elapsedMinutes,
      taskName = 'Deep Work Session',
      category = 'Productivity',
    } = body;

    const state = {
      taskName,
      category,
      elapsedMinutes,
      blinkRatePerMinute,
      baselineBlinkRate,
      blinkDropPercentage:
        baselineBlinkRate > 0
          ? Math.round(((baselineBlinkRate - blinkRatePerMinute) / baselineBlinkRate) * 100)
          : 0,
      gazeAwayCountIn2Minutes: gazeAwayCount,
      manualPauseCount,
    };

    // Default intelligent decision fallback
    let recommendedAction: PacingAction = 'CONTINUE';
    let agentSpeechPrompt =
      'Focus metrics look stable. Keep up the high-performance rhythm.';
    let resetDurationSeconds = 120; // 2-minute micro reset

    if (gazeAwayCount >= 6) {
      recommendedAction = 'TRIGGER_EYE_BREAK';
      agentSpeechPrompt =
        'I noticed your gaze drifting away from the screen. Let’s do a quick two-minute 20-20-20 eye refresh to restore your focus.';
    } else if (
      baselineBlinkRate > 0 &&
      blinkRatePerMinute < baselineBlinkRate * 0.6 &&
      elapsedMinutes >= 20
    ) {
      recommendedAction = 'TRIGGER_BREATHING_RESET';
      agentSpeechPrompt =
        'Your blink frequency has slowed down during this deep work sprint. Take two minutes for box breathing to re-oxygenate your mind.';
    }

    try {
      const jevResult = await callTypeSafeSystemOne({
        model: 'jev-latest',
        state,
        questions: {
          recommendedAction: createChoiceQuestion(
            {
              CONTINUE: 'Maintain focus sprint, fatigue metrics within acceptable tolerance.',
              TRIGGER_EYE_BREAK:
                'Blink rate dropped critically or excessive gaze drift, initiate 20-20-20 eye exercise reset.',
              TRIGGER_BREATHING_RESET:
                'Elevated strain and frequent pauses detected, initiate 4-4-4 diaphragmatic breathing reset.',
              SPLIT_TASK:
                'Long duration fatigue plateau, split remaining task into smaller intervals.',
            },
            'Evaluate sensor fatigue telemetry and decide the most appropriate pacing intervention.'
          ),
          agentSpeechPrompt: createNoulQuestion(
            'Empathetic, clear, 1-2 sentence spoken guidance from Agent DM informing the reformer why the reset was triggered and encouraging a brief micro-rest.'
          ),
        },
      });

      if (jevResult && jevResult.answers) {
        const actionAnswer = jevResult.answers.recommendedAction as string;
        if (
          actionAnswer === 'CONTINUE' ||
          actionAnswer === 'TRIGGER_EYE_BREAK' ||
          actionAnswer === 'TRIGGER_BREATHING_RESET' ||
          actionAnswer === 'SPLIT_TASK'
        ) {
          recommendedAction = actionAnswer;
        }

        if (jevResult.answers.agentSpeechPrompt) {
          agentSpeechPrompt = String(jevResult.answers.agentSpeechPrompt);
        }
      }
    } catch (jevErr) {
      console.warn('[AdaptivePacing] JEV SystemOne fallback active:', jevErr);
    }

    const response: AdaptivePacingResponse = {
      recommendedAction,
      agentSpeechPrompt,
      resetDurationSeconds,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
