import { NextRequest, NextResponse } from 'next/server';
import {
  callTypeSafeSystemOne,
  createChoiceQuestion,
  createScoreQuestion,
  createNoulQuestion,
} from '@/lib/jevClient';

export interface AuditRedemptionRequestBody {
  userId: string;
  userName: string;
  userEmail: string;
  upiId: string;
  rewardName: string;
  amount: number;
  creditsRedeemed: number;
  recentTasks?: Array<{
    name: string;
    duration: number;
    completed: boolean;
    earnedCoins?: number;
    isVerifiedForCoins?: boolean;
    createdAt?: string;
  }>;
  telemetry?: {
    verifiedRatio?: number;
    avgDurationMinutes?: number;
    gazeEngagementPercentage?: number;
    dailyCoinVelocity?: number;
  };
}

export type AuditVerdict =
  | 'AUTO_APPROVED'
  | 'MANUAL_REVIEW_FLAGGED'
  | 'REJECTED_FARMING';

export interface AuditRedemptionResponse {
  trustScore: number;
  auditVerdict: AuditVerdict;
  auditReasoning: string;
  status:
    | 'approved_ready_for_payout'
    | 'pending_manual_audit'
    | 'rejected_farming';
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AuditRedemptionRequestBody;
    const {
      userId,
      userName,
      userEmail,
      upiId,
      rewardName,
      amount,
      creditsRedeemed,
      recentTasks = [],
      telemetry,
    } = body;

    if (!userId || !upiId || !creditsRedeemed) {
      return NextResponse.json(
        { error: 'userId, upiId, and creditsRedeemed are required' },
        { status: 400 }
      );
    }

    // 1. Analyze user's last 30 completed task logs
    const completedTasks = recentTasks.filter((t) => t.completed).slice(0, 30);
    const verifiedTasksCount = completedTasks.filter(
      (t) => t.isVerifiedForCoins !== false
    ).length;
    const verifiedRatio =
      completedTasks.length > 0
        ? Number((verifiedTasksCount / completedTasks.length).toFixed(2))
        : (telemetry?.verifiedRatio ?? 1.0);

    const totalDuration = completedTasks.reduce(
      (sum, t) => sum + (Number(t.duration) || 0),
      0
    );
    const avgDurationMinutes =
      completedTasks.length > 0
        ? Math.round(totalDuration / completedTasks.length)
        : (telemetry?.avgDurationMinutes ?? 22);

    const dailyCoinVelocity =
      telemetry?.dailyCoinVelocity ??
      completedTasks.reduce((sum, t) => sum + (Number(t.earnedCoins) || 0), 0);

    const gazeEngagementPercentage =
      telemetry?.gazeEngagementPercentage ?? 88;

    const state = {
      user: { userId, userName, userEmail },
      payout: { amount, creditsRedeemed, upiId, rewardName },
      telemetry: {
        last30TasksEvaluated: completedTasks.length,
        verifiedRatio,
        avgDurationMinutes,
        dailyCoinVelocity,
        gazeEngagementPercentage,
      },
    };

    // Baseline deterministic decision rules
    let trustScore = 85;
    let auditVerdict: AuditVerdict = 'AUTO_APPROVED';
    let auditReasoning =
      'Consistent focus sprints, healthy task duration average, and verified lifestyle habit pillars.';

    if (verifiedRatio < 0.4 || avgDurationMinutes < 2 || dailyCoinVelocity > 10000) {
      trustScore = 32;
      auditVerdict = 'REJECTED_FARMING';
      auditReasoning =
        'High concentration of unverified custom tasks, abnormally low task durations, or excessive coin velocity detected.';
    } else if (verifiedRatio < 0.7 || avgDurationMinutes < 8 || gazeEngagementPercentage < 40) {
      trustScore = 65;
      auditVerdict = 'MANUAL_REVIEW_FLAGGED';
      auditReasoning =
        'Borderline focus duration metrics or elevated rapid completion rate. Flagged for standard manual audit.';
    }

    // JEV TypeSafe SystemOne Inference
    try {
      const jevResult = await callTypeSafeSystemOne({
        model: 'jev-latest',
        state,
        questions: {
          trustScore: createScoreQuestion(
            [
              'Evaluate user completion integrity on a scale of 0 to 100 based on verified habit ratio, average duration, gaze engagement, and coin velocity.',
            ],
            'Score 0-100 where >= 80 is legitimate authentic effort and < 40 is automated or spam coin farming.'
          ),
          auditVerdict: createChoiceQuestion(
            {
              AUTO_APPROVED:
                'Authentic consistent human habit execution with high verified task ratio and steady engagement.',
              MANUAL_REVIEW_FLAGGED:
                'Unusual coin velocity or borderline task metrics requiring manual administrator verification.',
              REJECTED_FARMING:
                'Obvious low-effort coin farming, keyboard mash, rapid aborts, or spam tasks detected.',
            },
            'Select the final payout audit verdict based on behavioral integrity.'
          ),
          auditReasoning: createNoulQuestion(
            'Concise explanation of completion authenticity justifying the verdict (1-2 sentences).'
          ),
        },
      });

      if (jevResult && jevResult.answers) {
        if (typeof jevResult.answers.trustScore === 'number') {
          trustScore = Math.min(100, Math.max(0, Math.round(jevResult.answers.trustScore)));
        }
        const verdictAnswer = jevResult.answers.auditVerdict as string;
        if (
          verdictAnswer === 'AUTO_APPROVED' ||
          verdictAnswer === 'MANUAL_REVIEW_FLAGGED' ||
          verdictAnswer === 'REJECTED_FARMING'
        ) {
          auditVerdict = verdictAnswer;
        }
        if (jevResult.answers.auditReasoning) {
          auditReasoning = String(jevResult.answers.auditReasoning);
        }
      }
    } catch (jevErr) {
      console.warn('[AuditRedemption] JEV SystemOne fallback active:', jevErr);
    }

    let status: AuditRedemptionResponse['status'];
    if (auditVerdict === 'AUTO_APPROVED' && trustScore >= 80) {
      status = 'approved_ready_for_payout';
    } else if (auditVerdict === 'REJECTED_FARMING' || trustScore < 40) {
      status = 'rejected_farming';
    } else {
      status = 'pending_manual_audit';
    }

    const response: AuditRedemptionResponse = {
      trustScore,
      auditVerdict,
      auditReasoning,
      status,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
