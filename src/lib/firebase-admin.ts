import * as admin from 'firebase-admin';

export type AdminCredentialMode =
  | 'already_initialized'
  | 'service_account_json'
  | 'split_env';

export interface FirebaseAdminInitStatus {
  ok: boolean;
  mode?: AdminCredentialMode;
  error?: string;
  configuredProjectId?: string;
  configuredClientEmailMasked?: string;
  hadFormattingArtifacts?: boolean;
}

export interface FirebaseAdminVerificationStatus extends FirebaseAdminInitStatus {
  oauthVerified: boolean;
  oauthError?: string;
  diagnosisCode:
    | 'ok'
    | 'missing_env'
    | 'malformed_json'
    | 'malformed_client_email'
    | 'service_account_not_found'
    | 'invalid_private_key'
    | 'invalid_credential';
  expectedFirebaseProjectId: string;
}

interface ParsedCredentialCandidate {
  mode: 'service_account_json' | 'split_env';
  projectId: string;
  clientEmail: string;
  privateKey: string;
  hadFormattingArtifacts: boolean;
}

interface AdminRuntimeMeta {
  mode: 'service_account_json' | 'split_env';
  configuredProjectId: string;
  configuredClientEmailMasked: string;
  clientEmailSyntaxError: string | null;
  hadFormattingArtifacts: boolean;
}

const EXPECTED_FIREBASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || 'dealdlinesmet';

let activeMeta: AdminRuntimeMeta | null = null;
let lastOAuthSuccessAt = 0;

function stripWrappingQuotesAndTrailingPunctuation(raw: string | undefined): {
  value: string | undefined;
  cleaned: boolean;
} {
  if (!raw) return { value: undefined, cleaned: false };
  const original = raw;
  let val = raw.trim();

  // Strip trailing JSON property commas/semicolons if accidentally pasted from JSON
  val = val.replace(/[,;]+$/, '').trim();

  if (
    (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
    (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
  ) {
    val = val.slice(1, -1).trim();
  }

  return {
    value: val || undefined,
    cleaned: val !== original.trim(),
  };
}

function normalizePrivateKey(rawKey: string | undefined): {
  value: string | undefined;
  cleaned: boolean;
} {
  const { value, cleaned } = stripWrappingQuotesAndTrailingPunctuation(rawKey);
  if (!value) return { value: undefined, cleaned };
  const normalized = value.replace(/\\n/g, '\n');
  return {
    value: normalized,
    cleaned: cleaned || normalized !== value,
  };
}

export function maskEmail(email: string | undefined): string | undefined {
  if (!email) return undefined;
  const atIdx = email.indexOf('@');
  if (atIdx <= 0) return '***';
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1);
  const visiblePrefix = local.slice(0, Math.min(6, local.length));
  return `${visiblePrefix}***@${domain}`;
}

/**
 * Robustly repairs malformed or corrupted Firebase service account client_emails.
 * Handles common environment variable corruptions such as:
 * - Google's authentic client_x509_cert_url containing url-encoded client_email
 * - Accidental protocols in email (e.g. 'firebase-adminsdk-xxx@https://...' or '@://gserviceaccount.com')
 * - URL-encoded '%40' instead of '@'
 * - Missing domain prefix or missing project_id (e.g. '@gserviceaccount.com')
 */
export function repairServiceAccountEmail(
  rawEmail: string | undefined,
  projectId: string | undefined,
  certUrl?: string | undefined
): { email: string | undefined; repaired: boolean; method?: string } {
  const targetPid = (projectId || EXPECTED_FIREBASE_PROJECT_ID || 'dealdlinesmet').trim();

  // 1. Check Google's authentic client_x509_cert_url (canonical source directly from Google Cloud key)
  if (certUrl && typeof certUrl === 'string') {
    const match = certUrl.match(/\/x509\/([^/?#]+)/);
    if (match) {
      try {
        const certEmail = decodeURIComponent(match[1]).trim();
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(certEmail) && !certEmail.includes('://')) {
          return { email: certEmail, repaired: certEmail !== rawEmail, method: 'from_cert_url' };
        }
      } catch {}
    }
  }

  if (!rawEmail) return { email: undefined, repaired: false };
  let clean = rawEmail.trim();

  // Handle URL-encoded @ (%40)
  if (clean.includes('%40') && !clean.includes('@')) {
    try {
      clean = decodeURIComponent(clean).trim();
    } catch {}
  }

  // 2. Detect and repair malformed client_email containing :// or protocol
  if (clean.includes('://') || clean.includes('http:') || clean.includes('https:')) {
    const atIdx = clean.indexOf('@');
    if (atIdx > 0) {
      const local = clean.slice(0, atIdx).trim().replace(/^https?:\/\//i, '');
      let domain = clean.slice(atIdx + 1).trim().replace(/^https?:\/\//i, '').replace(/^:\/\//, '');
      if (!domain || domain === 'gserviceaccount.com' || domain.includes('://') || !domain.includes('.')) {
        domain = `${targetPid}.iam.gserviceaccount.com`;
      }
      return { email: `${local}@${domain}`, repaired: true, method: 'sanitized_protocol' };
    }
  }

  // 3. If missing @ but starts with service account prefix
  if (!clean.includes('@') && clean.startsWith('firebase-adminsdk-')) {
    return { email: `${clean}@${targetPid}.iam.gserviceaccount.com`, repaired: true, method: 'reconstructed_prefix' };
  }

  // 4. If domain is missing project/iam (e.g. firebase-adminsdk-xxx@gserviceaccount.com or missing dot)
  const atIdx = clean.indexOf('@');
  if (atIdx > 0) {
    const local = clean.slice(0, atIdx).trim();
    const domain = clean.slice(atIdx + 1).trim();
    if (domain === 'gserviceaccount.com' || !domain.includes(targetPid) || domain.includes('://') || !domain.includes('.')) {
      return { email: `${local}@${targetPid}.iam.gserviceaccount.com`, repaired: true, method: 'reconstructed_domain' };
    }
  }

  return { email: clean, repaired: false };
}

function parseServiceAccountJson(raw: string): {
  parsed: admin.ServiceAccount | null;
  hadArtifacts: boolean;
} {
  const outer = stripWrappingQuotesAndTrailingPunctuation(raw);
  const trimmed = outer.value;
  if (!trimmed) return { parsed: null, hadArtifacts: outer.cleaned };

  let jsonStr = trimmed;
  if (!trimmed.startsWith('{')) {
    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf8').trim();
      if (decoded.startsWith('{') || decoded.startsWith('"')) {
        jsonStr = decoded;
      }
    } catch {
      return { parsed: null, hadArtifacts: outer.cleaned };
    }
  }

  try {
    let parsed: any = JSON.parse(jsonStr);
    // Handle double-encoded JSON strings (e.g. "\"{\\\"type\\\":...}\"")
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    if (parsed && typeof parsed === 'object') {
      const pid = stripWrappingQuotesAndTrailingPunctuation(
        parsed.project_id || parsed.projectId
      );
      const email = stripWrappingQuotesAndTrailingPunctuation(
        parsed.client_email || parsed.clientEmail
      );
      const key = normalizePrivateKey(parsed.private_key || parsed.privateKey);
      const certUrl = stripWrappingQuotesAndTrailingPunctuation(
        parsed.client_x509_cert_url || (parsed as any).clientX509CertUrl
      ).value;

      if (pid.value) parsed.project_id = pid.value;
      if (email.value) parsed.client_email = email.value;
      if (key.value) parsed.private_key = key.value;

      const effectivePid = pid.value || EXPECTED_FIREBASE_PROJECT_ID;
      const repaired = repairServiceAccountEmail(parsed.client_email, effectivePid, certUrl);
      if (repaired.email) {
        parsed.client_email = repaired.email;
      }

      return {
        parsed: parsed as admin.ServiceAccount,
        hadArtifacts: outer.cleaned || pid.cleaned || email.cleaned || key.cleaned || repaired.repaired,
      };
    }
    return { parsed: null, hadArtifacts: outer.cleaned };
  } catch {
    return { parsed: null, hadArtifacts: outer.cleaned };
  }
}

function getCredentialCandidates(): {
  candidates: ParsedCredentialCandidate[];
  configError?: string;
} {
  const candidates: ParsedCredentialCandidate[] = [];
  let jsonParseError: string | undefined;

  const rawServiceAccount =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT;

  if (rawServiceAccount && rawServiceAccount.trim()) {
    const { parsed, hadArtifacts } = parseServiceAccountJson(rawServiceAccount);
    if (!parsed) {
      jsonParseError =
        'FIREBASE_SERVICE_ACCOUNT_KEY is present but is not valid JSON or base64 JSON.';
    } else {
      let projectId = (parsed as any).project_id || parsed.projectId || EXPECTED_FIREBASE_PROJECT_ID;
      let clientEmail = (parsed as any).client_email || parsed.clientEmail;
      const privateKey = (parsed as any).private_key || parsed.privateKey;
      const certUrl = (parsed as any).client_x509_cert_url || (parsed as any).clientX509CertUrl;

      const repaired = repairServiceAccountEmail(clientEmail, projectId, certUrl);
      if (repaired.email) {
        clientEmail = repaired.email;
      }

      if (!projectId || !clientEmail || !privateKey) {
        jsonParseError =
          'FIREBASE_SERVICE_ACCOUNT_KEY is missing project_id, client_email, or private_key.';
      } else {
        candidates.push({
          mode: 'service_account_json',
          projectId,
          clientEmail,
          privateKey,
          hadFormattingArtifacts: hadArtifacts || repaired.repaired,
        });

        // If email was repaired, also ensure the canonical format is registered as an alternate
        if (repaired.repaired && repaired.email) {
          const canonicalEmail = `${clientEmail.split('@')[0]}@${projectId}.iam.gserviceaccount.com`;
          if (canonicalEmail !== clientEmail) {
            candidates.push({
              mode: 'service_account_json',
              projectId,
              clientEmail: canonicalEmail,
              privateKey,
              hadFormattingArtifacts: true,
            });
          }
        }
      }
    }
  }

  const pid = stripWrappingQuotesAndTrailingPunctuation(
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
  const email = stripWrappingQuotesAndTrailingPunctuation(
    process.env.FIREBASE_CLIENT_EMAIL
  );
  const pk = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (pid.value && email.value && pk.value) {
    const repaired = repairServiceAccountEmail(email.value, pid.value, undefined);
    candidates.push({
      mode: 'split_env',
      projectId: pid.value,
      clientEmail: repaired.email || email.value,
      privateKey: pk.value,
      hadFormattingArtifacts: pid.cleaned || email.cleaned || pk.cleaned || repaired.repaired,
    });
  } else if (candidates.length === 0) {
    const missing: string[] = [];
    if (!pid.value) missing.push('FIREBASE_PROJECT_ID');
    if (!email.value) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!pk.value) missing.push('FIREBASE_PRIVATE_KEY');
    return {
      candidates: [],
      configError:
        jsonParseError ||
        `Missing server Firebase Admin credentials: ${missing.join(', ')} (or set FIREBASE_SERVICE_ACCOUNT_KEY).`,
    };
  }

  return { candidates, configError: jsonParseError };
}

function initializeFromCandidate(
  candidate: ParsedCredentialCandidate
): FirebaseAdminInitStatus {
  try {
    const repaired = repairServiceAccountEmail(
      candidate.clientEmail,
      candidate.projectId
    );
    const effectiveEmail = repaired.email || candidate.clientEmail;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: candidate.projectId,
        clientEmail: effectiveEmail,
        privateKey: candidate.privateKey,
      }),
    });
    activeMeta = {
      mode: candidate.mode,
      configuredProjectId: candidate.projectId,
      configuredClientEmailMasked: maskEmail(effectiveEmail) || '***',
      clientEmailSyntaxError: validateServiceAccountEmailSyntax(effectiveEmail),
      hadFormattingArtifacts: candidate.hadFormattingArtifacts || repaired.repaired,
    };
    return {
      ok: true,
      mode: candidate.mode,
      configuredProjectId: activeMeta.configuredProjectId,
      configuredClientEmailMasked: activeMeta.configuredClientEmailMasked,
      hadFormattingArtifacts: activeMeta.hadFormattingArtifacts,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: `Firebase Admin init failed (${candidate.mode}): ${err?.message || String(err)}`,
    };
  }
}

export function classifyFirebaseAdminError(err: any): {
  diagnosisCode: FirebaseAdminVerificationStatus['diagnosisCode'];
  error: string;
  userMessage: string;
} {
  const msg = String(err?.message || err || '');
  const lower = msg.toLowerCase();
  const userMessage =
    'Background reminders are temporarily unavailable right now. In-app alerts still work normally.';

  if (lower.includes('malformed') && lower.includes('client_email')) {
    return { diagnosisCode: 'malformed_client_email', error: msg, userMessage };
  }
  if (lower.includes('account not found') || lower.includes('invalid_grant')) {
    return { diagnosisCode: 'service_account_not_found', error: msg, userMessage };
  }
  if (
    lower.includes('private key') ||
    lower.includes('pem') ||
    lower.includes('decoder routines') ||
    lower.includes('asn1')
  ) {
    return { diagnosisCode: 'invalid_private_key', error: msg, userMessage };
  }
  return { diagnosisCode: 'invalid_credential', error: msg, userMessage };
}

function validateServiceAccountEmailSyntax(clientEmail: string | undefined): string | null {
  if (!clientEmail) return 'Missing client_email.';
  if (
    clientEmail.includes('://') ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)
  ) {
    return `Service account client_email is malformed (${maskEmail(clientEmail)}); expected *@${EXPECTED_FIREBASE_PROJECT_ID}.iam.gserviceaccount.com.`;
  }
  return null;
}

export function ensureFirebaseAdmin(): FirebaseAdminInitStatus {
  if (admin.apps.length > 0) {
    return {
      ok: true,
      mode: activeMeta?.mode || 'already_initialized',
      configuredProjectId: activeMeta?.configuredProjectId,
      configuredClientEmailMasked: activeMeta?.configuredClientEmailMasked,
      hadFormattingArtifacts: activeMeta?.hadFormattingArtifacts,
    };
  }

  const { candidates, configError } = getCredentialCandidates();
  if (candidates.length === 0) {
    return {
      ok: false,
      error: configError || 'Firebase Admin credentials are not configured.',
    };
  }

  let lastInitErr: FirebaseAdminInitStatus | null = null;
  for (const candidate of candidates) {
    const res = initializeFromCandidate(candidate);
    if (res.ok) return res;
    lastInitErr = res;
  }

  return (
    lastInitErr || {
      ok: false,
      error: configError || 'Firebase Admin initialization failed.',
    }
  );
}

export async function verifyFirebaseAdminAccess(): Promise<FirebaseAdminVerificationStatus> {
  const initStatus = ensureFirebaseAdmin();
  if (!initStatus.ok) {
    const isJsonErr = Boolean(
      initStatus.error?.includes('not valid JSON') ||
        initStatus.error?.includes('missing project_id')
    );
    return {
      ...initStatus,
      oauthVerified: false,
      oauthError: initStatus.error,
      diagnosisCode: isJsonErr ? 'malformed_json' : 'missing_env',
      expectedFirebaseProjectId: EXPECTED_FIREBASE_PROJECT_ID,
    };
  }

  // Return cached verified state briefly to avoid excessive OAuth roundtrips
  if (lastOAuthSuccessAt > 0 && Date.now() - lastOAuthSuccessAt < 60_000) {
    return {
      ...initStatus,
      oauthVerified: true,
      diagnosisCode: 'ok',
      expectedFirebaseProjectId: EXPECTED_FIREBASE_PROJECT_ID,
    };
  }

  const testCurrentApp = async (): Promise<{
    verified: boolean;
    error?: string;
    diagnosisCode: FirebaseAdminVerificationStatus['diagnosisCode'];
  }> => {
    // If activeMeta reported a syntax error, attempt one last repair
    if (activeMeta?.clientEmailSyntaxError) {
      const repaired = repairServiceAccountEmail(
        activeMeta.configuredClientEmailMasked,
        activeMeta.configuredProjectId
      );
      if (repaired.email && !repaired.email.includes('://')) {
        activeMeta.clientEmailSyntaxError = null;
      }
    }

    const emailSyntaxErr = activeMeta?.clientEmailSyntaxError || null;
    if (emailSyntaxErr) {
      return {
        verified: false,
        error: emailSyntaxErr,
        diagnosisCode: 'malformed_client_email',
      };
    }

    try {
      const appInstance = admin.app();
      const cred = appInstance.options.credential;
      if (!cred || typeof cred.getAccessToken !== 'function') {
        return {
          verified: false,
          error: 'Credential object missing getAccessToken()',
          diagnosisCode: 'invalid_credential',
        };
      }
      const tokenObj = await cred.getAccessToken();
      if (!tokenObj?.access_token) {
        return {
          verified: false,
          error: 'OAuth2 access token response was empty.',
          diagnosisCode: 'invalid_credential',
        };
      }
      return { verified: true, diagnosisCode: 'ok' };
    } catch (err: any) {
      const classified = classifyFirebaseAdminError(err);
      return {
        verified: false,
        error: classified.error,
        diagnosisCode: classified.diagnosisCode,
      };
    }
  };

  let check = await testCurrentApp();
  if (check.verified) {
    lastOAuthSuccessAt = Date.now();
    return {
      ...initStatus,
      oauthVerified: true,
      diagnosisCode: 'ok',
      expectedFirebaseProjectId: EXPECTED_FIREBASE_PROJECT_ID,
    };
  }

  // If primary candidate failed OAuth, test alternate configured credential candidate
  const { candidates } = getCredentialCandidates();
  const currentMode = activeMeta?.mode;
  const alternates = candidates.filter((c) => c.mode !== currentMode || c.clientEmail !== activeMeta?.configuredClientEmailMasked);

  for (const alt of alternates) {
    try {
      await Promise.all(admin.apps.map((a) => (a ? a.delete().catch(() => {}) : Promise.resolve())));
      activeMeta = null;
      lastOAuthSuccessAt = 0;

      const altInit = initializeFromCandidate(alt);
      if (altInit.ok) {
        const altCheck = await testCurrentApp();
        if (altCheck.verified) {
          lastOAuthSuccessAt = Date.now();
          return {
            ...altInit,
            oauthVerified: true,
            diagnosisCode: 'ok',
            expectedFirebaseProjectId: EXPECTED_FIREBASE_PROJECT_ID,
          };
        }
        check = altCheck;
      }
    } catch {
      // Ignore fallback cleanup errors and return primary error details
    }
  }

  lastOAuthSuccessAt = 0;
  return {
    ...initStatus,
    mode: activeMeta?.mode || initStatus.mode,
    configuredProjectId: activeMeta?.configuredProjectId || initStatus.configuredProjectId,
    configuredClientEmailMasked:
      activeMeta?.configuredClientEmailMasked || initStatus.configuredClientEmailMasked,
    hadFormattingArtifacts:
      activeMeta?.hadFormattingArtifacts ?? initStatus.hadFormattingArtifacts,
    oauthVerified: false,
    oauthError: check.error || 'Firebase Admin OAuth2 verification failed.',
    diagnosisCode: check.diagnosisCode,
    expectedFirebaseProjectId: EXPECTED_FIREBASE_PROJECT_ID,
  };
}

export { admin };
