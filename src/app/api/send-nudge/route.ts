import { NextResponse } from 'next/server';
import { admin, ensureFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const adminStatus = ensureFirebaseAdmin();
    if (!adminStatus.ok) {
      return NextResponse.json(
        { error: adminStatus.error || 'Firebase Admin is not configured on the server.' },
        { status: 500 }
      );
    }

    const { token, title, body, tag, url } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const launchUrl =
      url ||
      '/timer?task=Test%20Focus%20Session&duration=15&category=Deep%20Focus&autoStart=true';
    const notifTitle = title || '⏰ Scheduled Task: Test Routine';
    const notifBody =
      body || 'Ready for your focus session? Tap to launch your timer and start now!';
    const notifTag = tag || 'routine-nudge';

    const message: admin.messaging.Message = {
      token,
      data: {
        title: notifTitle,
        body: notifBody,
        url: launchUrl,
        type: 'ROUTINE_TASK',
        tag: notifTag,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        requireInteraction: 'true',
      },
      android: {
        priority: 'high',
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            alert: {
              title: notifTitle,
              body: notifBody,
            },
            sound: 'default',
          },
        },
      },
      webpush: {
        headers: {
          Urgency: 'high',
          TTL: '900',
        },
        fcmOptions: {
          link: launchUrl,
        },
      },
    };

    const response = await admin.messaging().send(message);

    return NextResponse.json({ success: true, messageId: response });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to send FCM push notification.',
        code: error?.code || undefined,
      },
      { status: 500 }
    );
  }
}
