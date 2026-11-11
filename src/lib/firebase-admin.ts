import * as admin from 'firebase-admin';

export interface FirebaseAdminInitStatus {
  ok: boolean;
  mode?: 'already_initialized' | 'service_account_json' | 'split_env';
  error?: string;
}

function normalizePrivateKey(rawKey: string | undefined): string | undefined {
  if (!rawKey) return undefined;
  let cleaned = rawKey.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.replace(/\\n/g, '\n');
}

function parseServiceAccountJson(raw: string): admin.ServiceAccount | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let jsonStr = trimmed;
  if (!trimmed.startsWith('{')) {
    try {
      jsonStr = Buffer.from(trimmed, 'base64').toString('utf8');
    } catch {
      return null;
    }
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.private_key === 'string') {
        parsed.private_key = normalizePrivateKey(parsed.private_key);
      }
      return parsed as admin.ServiceAccount;
    }
    return null;
  } catch {
    return null;
  }
}

export function ensureFirebaseAdmin(): FirebaseAdminInitStatus {
  if (admin.apps.length > 0) {
    return { ok: true, mode: 'already_initialized' };
  }

  // 1. Try single-JSON FIREBASE_SERVICE_ACCOUNT_KEY (raw JSON or base64)
  const rawServiceAccount =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT;
  if (rawServiceAccount && rawServiceAccount.trim()) {
    const parsed = parseServiceAccountJson(rawServiceAccount);
    if (!parsed) {
      return {
        ok: false,
        error:
          'FIREBASE_SERVICE_ACCOUNT_KEY is present but is not valid JSON or base64 JSON.',
      };
    }
    const projectId = (parsed as any).project_id || parsed.projectId;
    const clientEmail = (parsed as any).client_email || parsed.clientEmail;
    const privateKey = (parsed as any).private_key || parsed.privateKey;
    if (!projectId || !clientEmail || !privateKey) {
      return {
        ok: false,
        error:
          'FIREBASE_SERVICE_ACCOUNT_KEY is missing project_id, client_email, or private_key.',
      };
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });
      return { ok: true, mode: 'service_account_json' };
    } catch (err: any) {
      return {
        ok: false,
        error: `Firebase Admin init failed (service_account_json): ${err?.message || String(err)}`,
      };
    }
  }

  // 2. Try split environment variables
  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  const missing: string[] = [];
  if (!process.env.FIREBASE_PROJECT_ID?.trim() && !projectId) {
    missing.push('FIREBASE_PROJECT_ID');
  }
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');

  if (missing.length > 0) {
    return {
      ok: false,
      error: `Missing server Firebase Admin credentials: ${missing.join(', ')} (or set FIREBASE_SERVICE_ACCOUNT_KEY).`,
    };
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId!,
        clientEmail: clientEmail!,
        privateKey: privateKey!,
      }),
    });
    return { ok: true, mode: 'split_env' };
  } catch (err: any) {
    return {
      ok: false,
      error: `Firebase Admin init failed (split_env): ${err?.message || String(err)}`,
    };
  }
}

export { admin };
