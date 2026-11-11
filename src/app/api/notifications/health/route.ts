import { NextResponse } from 'next/server';
import {
  admin,
  verifyFirebaseAdminAccess,
  classifyFirebaseAdminError,
} from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const verify = await verifyFirebaseAdminAccess();
  const cronSecretConfigured = Boolean(process.env.CRON_SECRET?.trim());
  const vapidKeyConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim());
  const readyForClosedAppPush =
    verify.ok && verify.oauthVerified && vapidKeyConfigured;

  let userMessage = 'Background alerts are active.';
  if (!vapidKeyConfigured) {
    userMessage = 'Background notifications are not enabled on this server yet.';
  } else if (!verify.ok || !verify.oauthVerified) {
    userMessage = verify.oauthError
      ? classifyFirebaseAdminError(verify.oauthError).userMessage
      : 'Background notifications are temporarily unavailable.';
  }

  const response: Record<string, any> = {
    firebaseAdminConfigured: verify.ok,
    firebaseAdminVerified: verify.oauthVerified,
    adminCredentialMode: verify.mode || null,
    diagnosisCode: verify.diagnosisCode,
    adminError: verify.oauthVerified
      ? null
      : verify.oauthError || verify.error || 'Firebase Admin unavailable',
    expectedFirebaseProjectId: verify.expectedFirebaseProjectId,
    configuredProjectId: verify.configuredProjectId || null,
    configuredClientEmailMasked: verify.configuredClientEmailMasked || null,
    hadFormattingArtifacts: Boolean(verify.hadFormattingArtifacts),
    cronSecretConfigured,
    vapidKeyConfigured,
    readyForClosedAppPush,
    userMessage,
    serverTimeUtc: new Date().toISOString(),
  };

  // Optional verified user diagnostic check (only when Admin OAuth actually works)
  const authHeader = req.headers.get('authorization');
  if (verify.ok && verify.oauthVerified && authHeader?.startsWith('Bearer ')) {
    const idToken = authHeader.slice('Bearer '.length).trim();
    if (idToken) {
      try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        const uid = decoded.uid;
        const userSnap = await admin.firestore().collection('users').doc(uid).get();
        const userData = userSnap.exists ? userSnap.data() || {} : {};
        const tokens = Array.from(
          new Set([
            ...(Array.isArray(userData.fcmTokens) ? userData.fcmTokens : []),
            ...(typeof userData.fcmToken === 'string' && userData.fcmToken
              ? [userData.fcmToken]
              : []),
          ])
        ).filter((t): t is string => typeof t === 'string' && t.trim().length > 0);

        response.userDiagnostics = {
          uid,
          userDocExists: userSnap.exists,
          fcmTokensCount: tokens.length,
          timeZone: userData.timeZone || null,
          region: userData.region || null,
          activeRoutineProfileId: userData.activeRoutineProfileId || 'default',
          notificationSettings: userData.notificationSettings || null,
        };
      } catch (err: any) {
        response.userDiagnosticsError = err?.message || 'Invalid ID token';
      }
    }
  }

  return NextResponse.json(response);
}
