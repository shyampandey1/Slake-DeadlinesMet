import { NextRequest, NextResponse } from 'next/server';
import {
  callTypeSafeSystemOne,
  createNoulQuestion,
} from '@/lib/jevClient';

export interface RetrievedLogPayload {
  id: string;
  timestamp: string;
  category: string;
  title: string;
  notes?: string;
  duration: number;
  coins: number;
  similarity?: number;
}

export interface RagQueryRequestBody {
  query: string;
  retrievedLogs: RetrievedLogPayload[];
  userProfile?: {
    displayName?: string;
    profile?: string;
  };
}

export interface RagQueryResponse {
  directAnswer: string;
  behavioralCorrelation: string;
  actionableAdjustment: string;
  speechSummary: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RagQueryRequestBody;
    const { query: userQuery, retrievedLogs = [], userProfile } = body;

    if (!userQuery) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const state = {
      userQuery,
      reformerProfile: userProfile?.profile || 'General',
      retrievedLogsCount: retrievedLogs.length,
      logsSummary: retrievedLogs.slice(0, 10).map((l) => ({
        date: l.timestamp.split('T')[0],
        category: l.category,
        task: l.title,
        minutes: l.duration,
        earnedCoins: l.coins,
        notes: l.notes || '',
      })),
    };

    let directAnswer = `Based on your recent ${retrievedLogs.length} matching focus sessions, you maintained disciplined execution across ${Array.from(new Set(retrievedLogs.map(l => l.category))).join(', ') || 'routine pillars'}.`;
    let behavioralCorrelation = `Your performance peaks during morning sprints with higher completion velocity when hydration checks precede deep work.`;
    let actionableAdjustment = `Lock in a 45-minute deep work block before 11 AM and log 2 glasses of water to protect your cognitive stamina.`;

    try {
      const jevResult = await callTypeSafeSystemOne({
        model: 'jev-latest',
        state,
        questions: {
          directAnswer: createNoulQuestion(
            'Direct, concise answer answering the user\'s inquiry based on their retrieved task logs (1-2 sentences).'
          ),
          behavioralCorrelation: createNoulQuestion(
            'Identify behavioral habit patterns, focus dips, or correlations across these logs (1-2 sentences).'
          ),
          actionableAdjustment: createNoulQuestion(
            'Provide 1 specific high-leverage routine adjustment the user should implement today (1 actionable sentence).'
          ),
        },
      });

      if (jevResult && jevResult.answers) {
        if (jevResult.answers.directAnswer) {
          directAnswer = String(jevResult.answers.directAnswer);
        }
        if (jevResult.answers.behavioralCorrelation) {
          behavioralCorrelation = String(jevResult.answers.behavioralCorrelation);
        }
        if (jevResult.answers.actionableAdjustment) {
          actionableAdjustment = String(jevResult.answers.actionableAdjustment);
        }
      }
    } catch (jevErr) {
      console.warn('[RagQueryRoute] JEV SystemOne fallback active:', jevErr);
    }

    const speechSummary = `${directAnswer} ${behavioralCorrelation} ${actionableAdjustment}`;

    const response: RagQueryResponse = {
      directAnswer,
      behavioralCorrelation,
      actionableAdjustment,
      speechSummary,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
