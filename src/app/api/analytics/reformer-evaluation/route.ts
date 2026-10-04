import { NextResponse } from 'next/server';
import { evaluateReformerReadinessWithJev } from '@/lib/jevClient';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      reformerName = 'Reformer',
      streak = 0,
      appAge = 1,
      totalTasks = 0,
      totalWaterGlasses = 0,
      coins = 0,
    } = body;

    const evaluation = await evaluateReformerReadinessWithJev({
      reformerName,
      streak: Number(streak) || 0,
      appAge: Number(appAge) || 1,
      totalTasks: Number(totalTasks) || 0,
      totalWaterGlasses: Number(totalWaterGlasses) || 0,
      coins: Number(coins) || 0,
    });

    return NextResponse.json({
      success: true,
      evaluation: evaluation.answers,
      usage: evaluation.usage,
    });
  } catch (error: any) {
    console.error('Reformer Evaluation Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to evaluate reformer' },
      { status: 500 }
    );
  }
}
