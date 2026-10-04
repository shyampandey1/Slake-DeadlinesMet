import { NextResponse } from 'next/server';
import { evaluateRoutineBalanceWithJev } from '@/lib/jevClient';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const tasks = Array.isArray(body?.tasks) ? body.tasks : [];

    const evaluation = await evaluateRoutineBalanceWithJev(tasks);

    return NextResponse.json({
      success: true,
      evaluation: evaluation.answers,
      usage: evaluation.usage,
    });
  } catch (error: any) {
    console.error('Routine Evaluation Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to evaluate routine balance' },
      { status: 500 }
    );
  }
}
