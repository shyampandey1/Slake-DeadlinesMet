import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(req: Request) {
  try {
    const { token, title, body, tag } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const message = {
      token: token,
      notification: {
        title: title || "New Nudge!",
        body: body || "You have a new activity.",
      },
      android: {
        priority: 'high' as const,
        notification: {
          tag: tag || 'nudge',
        }
      },
      data: {
        tag: tag || 'nudge',
      }
    };

    const response = await admin.messaging().send(message);
    
    return NextResponse.json({ success: true, messageId: response });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
