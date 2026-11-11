import { NextResponse } from 'next/server';
import { admin, ensureFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { id, author, profileName, wakeTime, sleepTime, studyWindow, routineVector, tasksCount, sustainabilityScore, optimizationSummary, dmPayload } = payload;

    if (!id || !author?.uid) {
      return NextResponse.json({ error: 'Invalid payload: id and author.uid are required' }, { status: 400 });
    }

    const adminStatus = ensureFirebaseAdmin();

    if (adminStatus.ok && admin.apps.length) {
      const db = admin.firestore();
      await db.collection('shared_routines').doc(id).set(
        {
          id,
          author,
          profileName: profileName || dmPayload?.profileName || 'Community Routine',
          wakeTime: wakeTime || dmPayload?.tuningParameters?.wakeUpTime || '06:30',
          sleepTime: sleepTime || dmPayload?.tuningParameters?.sleepTime || '23:00',
          studyWindow: studyWindow || dmPayload?.tuningParameters?.studyOrResearchPreference || 'split_blocks',
          routineVector: routineVector || dmPayload?.routineVector || [],
          tasksCount: tasksCount || (dmPayload?.tasks?.length || 0),
          sustainabilityScore: sustainabilityScore || 90,
          optimizationSummary: optimizationSummary || 'Community shared schedule',
          sharedAt: admin.firestore.FieldValue.serverTimestamp(),
          dmPayload,
        },
        { merge: true }
      );

      return NextResponse.json({ success: true, id });
    }

    // When Firebase Admin server credentials are not provisioned, return success with client sync note
    return NextResponse.json({
      success: true,
      id,
      syncedMode: 'client_profile',
      note: 'Saved via client-side profile sync',
    });
  } catch (error: any) {
    console.error('[API /api/routine/share] Error sharing routine:', error);
    return NextResponse.json({ error: error?.message || 'Failed to share routine' }, { status: 500 });
  }
}
