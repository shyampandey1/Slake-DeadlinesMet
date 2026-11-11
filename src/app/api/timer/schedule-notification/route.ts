import { NextResponse } from 'next/server';
import { admin, ensureFirebaseAdmin } from '@/lib/firebase-admin';
import { encryptText } from '@/lib/crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, taskName, endTime, clear, totalDurationMs } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const adminStatus = ensureFirebaseAdmin();
    if (!adminStatus.ok) {
      return NextResponse.json(
        { error: adminStatus.error || 'Firebase admin not configured' },
        { status: 500 }
      );
    }

    const db = admin.firestore();
    const sessionRef = db.collection('active_sessions').doc(userId);

    if (clear) {
      await sessionRef.delete().catch(() => {});
      return NextResponse.json({ success: true, cleared: true });
    }

    if (!taskName || !endTime) {
      return NextResponse.json(
        { error: 'taskName and endTime are required' },
        { status: 400 }
      );
    }

    const nowMs = Date.now();
    const remainingMillis = Math.max(1000, Number(endTime) - nowMs);
    const durationMillis =
      typeof totalDurationMs === 'number' && totalDurationMs > 0
        ? totalDurationMs
        : remainingMillis;
    const startedAt = new Date(Number(endTime) - durationMillis);
    const encryptedName = await encryptText(taskName, userId);

    await sessionRef.set(
      {
        currentTaskId: encryptedName,
        status: 'running',
        startedAt: admin.firestore.Timestamp.fromDate(startedAt),
        durationMillis,
        expectedEndTime: Number(endTime),
        pausedAtMillis: null,
        notified: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, scheduledEndTime: endTime });
  } catch (error: any) {
    console.error('Error in schedule-notification route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
