import { NextResponse } from 'next/server';
import { admin, ensureFirebaseAdmin } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const adminStatus = ensureFirebaseAdmin();
  const cronSecretConfigured = Boolean(process.env.CRON_SECRET?.trim());
  const vapidKeyConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim());

  const response: Record<string, any> = {
    firebaseAdminConfigured: adminStatus.ok,
    adminCredentialMode: adminStatus.mode || null,
    adminError: adminStatus.ok ? null : adminStatus.error || 'Firebase Admin unavailable',
    cronSecretConfigured,
    vapidKeyConfigured,
    readyForClosedAppPush: adminStatus.ok && vapidKeyConfigured,
    serverTimeUtc: new Date().toISOString(),
  };

  // Optional verified user diagnostic check
  const authHeader = req.headers.get('authorization');
  if (adminStatus.ok && authHeader?.startsWith('Bearer ')) {
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
            ...(typeof userData.fcmToken === 'string' && userData.fcmToken ? [userData.fcmToken] : []),
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
