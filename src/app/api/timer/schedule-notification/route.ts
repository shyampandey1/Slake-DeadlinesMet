import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { encryptText } from '@/lib/crypto';

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
    const body = await req.json();
    const { userId, taskName, endTime, clear } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    initAdmin();
    if (!admin.apps.length) {
      return NextResponse.json({ error: "Firebase admin not configured" }, { status: 500 });
    }

    const db = admin.firestore();
    const sessionRef = db.collection('active_sessions').doc(userId);

    if (clear) {
      await sessionRef.delete().catch(() => {});
      return NextResponse.json({ success: true, cleared: true });
    }

    if (!taskName || !endTime) {
      return NextResponse.json({ error: "taskName and endTime are required" }, { status: 400 });
    }

    const durationMillis = Math.max(60000, endTime - Date.now());
    const startedAt = new Date(endTime - durationMillis);
    const encryptedName = await encryptText(taskName, userId);

    await sessionRef.set({
      currentTaskId: encryptedName,
      status: 'running',
      startedAt: admin.firestore.Timestamp.fromDate(startedAt),
      durationMillis,
      pausedAtMillis: null,
      notified: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return NextResponse.json({ success: true, scheduledEndTime: endTime });
  } catch (error: any) {
    console.error("Error in schedule-notification route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
