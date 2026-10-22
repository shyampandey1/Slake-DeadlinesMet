import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

function initAdmin() {
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
    }
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { id, author, profileName, wakeTime, sleepTime, studyWindow, routineVector, tasksCount, sustainabilityScore, optimizationSummary, dmPayload } = payload;

    if (!id || !author?.uid) {
      return NextResponse.json({ error: 'Invalid payload: id and author.uid are required' }, { status: 400 });
    }

    initAdmin();

    if (admin.apps.length) {
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

    return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
  } catch (error: any) {
    console.error('[API /api/routine/share] Error sharing routine:', error);
    return NextResponse.json({ error: error?.message || 'Failed to share routine' }, { status: 500 });
  }
}
