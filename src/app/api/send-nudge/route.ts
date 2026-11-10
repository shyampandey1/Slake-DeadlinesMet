import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

function initAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
}

export async function POST(req: Request) {
  try {
    initAdmin();
    const { token, title, body, tag, url } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const launchUrl = url || "/timer?task=Test%20Focus%20Session&duration=15&category=Deep%20Focus&autoStart=true";

    const message: any = {
      token: token,
      notification: {
        title: title || "⏰ Scheduled Task: Test Routine",
        body: body || "Ready for your focus session? Tap to launch your timer and start now!",
      },
      android: {
        priority: 'high' as const,
        notification: {
          tag: tag || 'routine-nudge',
          icon: '/icon.svg',
        }
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          title: title || "⏰ Scheduled Task: Test Routine",
          body: body || "Ready for your focus session? Tap to launch your timer and start now!",
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: tag || 'routine-nudge',
          vibrate: [200, 100, 200],
          requireInteraction: true,
        },
        fcmOptions: {
          link: launchUrl,
        },
      },
      data: {
        url: launchUrl,
        type: 'ROUTINE_TASK',
        tag: tag || 'routine-nudge',
      }
    };

    const response = await admin.messaging().send(message);
    
    return NextResponse.json({ success: true, messageId: response });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
