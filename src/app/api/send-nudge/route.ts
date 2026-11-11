import { NextResponse } from 'next/server';
import {
  admin,
  verifyFirebaseAdminAccess,
  classifyFirebaseAdminError,
} from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const verify = await verifyFirebaseAdminAccess();
    if (!verify.ok || !verify.oauthVerified) {
      const classified = classifyFirebaseAdminError(
        verify.oauthError || verify.error || 'Firebase Admin unavailable'
      );
      console.error('[send-nudge] Firebase Admin verification failed:', {
        diagnosisCode: verify.diagnosisCode,
        configuredProjectId: verify.configuredProjectId,
        configuredClientEmailMasked: verify.configuredClientEmailMasked,
        error: verify.oauthError || verify.error,
      });
      return NextResponse.json(
        {
          error: verify.oauthError || verify.error || 'Firebase Admin is not configured.',
          userMessage: classified.userMessage,
          code: verify.diagnosisCode,
        },
        { status: 500 }
      );
    }

    const { token, title, body, tag, url } = await req.json();

    if (!token) {
      return NextResponse.json(
        {
          error: 'Token is required',
          userMessage: 'Your device could not be registered for background alerts yet.',
          code: 'missing_token',
        },
        { status: 400 }
      );
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
    const errCode = error?.code || '';
    if (
      errCode === 'messaging/registration-token-not-registered' ||
      errCode === 'messaging/invalid-registration-token'
    ) {
      return NextResponse.json(
        {
          error: error?.message || 'Expired device token',
          userMessage:
            'Your browser notification link expired. Refresh your notification settings and try again.',
          code: 'token_invalid',
        },
        { status: 400 }
      );
    }

    const classified = classifyFirebaseAdminError(error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to send push notification.',
        userMessage: classified.userMessage,
        code: error?.code || classified.diagnosisCode,
      },
      { status: 500 }
    );
  }
}
