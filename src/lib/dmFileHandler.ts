import {
  DMRoutineFileFormat,
  DMRoutineFileSchema,
  DMRoutineAuthor,
  CustomRoutineProfile,
  DMRoutineTaskBlock,
  RoutineTuningAnswers,
} from '@/types/routineTuner';
import { computeRoutineVector } from '@/lib/clientEmbedder';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  addDoc,
  updateDoc,
} from 'firebase/firestore';

/**
 * Calculates SHA-256 checksum over canonical tasks + tuning parameters using Web Crypto API.
 */
export async function calculateRoutineChecksum(
  tasks: DMRoutineTaskBlock[],
  tuning: RoutineTuningAnswers
): Promise<string> {
  try {
    const canonicalPayload = JSON.stringify({
      tuning: {
        wakeUpTime: tuning.wakeUpTime,
        sleepTime: tuning.sleepTime,
        workOrCollegeStart: tuning.workOrCollegeStart,
        workOrCollegeEnd: tuning.workOrCollegeEnd,
        commuteDurationMinutes: tuning.commuteDurationMinutes,
        lunchBreakTime: tuning.lunchBreakTime,
        lunchDurationMinutes: tuning.lunchDurationMinutes,
        studyOrResearchPreference: tuning.studyOrResearchPreference,
        studyDurationMinutes: tuning.studyDurationMinutes,
        moversWrapperMode: tuning.moversWrapperMode,
      },
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        startTime: t.startTime,
        durationMinutes: t.durationMinutes,
        category: t.category,
        isMoversPillar: t.isMoversPillar,
        moversType: t.moversType,
      })),
    });

    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(canonicalPayload);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback simple hash for non-crypto contexts
    let hash = 0;
    for (let i = 0; i < canonicalPayload.length; i++) {
      hash = (hash << 5) - hash + canonicalPayload.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  } catch (err) {
    console.warn('[DMFileHandler] Checksum computation error, falling back to timestamp hash:', err);
    return `dm_chk_${Date.now().toString(16)}`;
  }
}

/**
 * Serializes active custom routine into .dm container and triggers native browser download.
 */
export async function exportRoutineToDMFile(
  profile: CustomRoutineProfile,
  author: DMRoutineAuthor
): Promise<void> {
  const checksum = await calculateRoutineChecksum(profile.tasks, profile.tuningAnswers);
  
  let vector = profile.routineVector;
  if (!vector || vector.length === 0) {
    vector = await computeRoutineVector(
      profile.tuningAnswers,
      profile.tasks.map((t) => t.title)
    );
  }

  const dmContainer: DMRoutineFileFormat = {
    version: '1.0.0',
    magicHeader: 'DEADLINESMET_ROUTINE_CONTAINER',
    exportedAt: new Date().toISOString(),
    author,
    profileName: profile.name,
    tuningParameters: profile.tuningAnswers,
    tasks: profile.tasks,
    routineVector: vector,
    checksum,
  };

  const jsonString = JSON.stringify(dmContainer, null, 2);
  const blob = new Blob([jsonString], {
    type: 'application/vnd.deadlinesmet.routine+json;charset=utf-8',
  });

  const sanitizedFileName = (profile.name || 'routine')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizedFileName || 'deadlinesmet-routine'}.dm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses and verifies an imported .dm or .json file from local device.
 */
export async function importRoutineFromDMFile(
  fileOrText: File | string
): Promise<DMRoutineFileFormat> {
  let text = '';
  if (typeof fileOrText === 'string') {
    text = fileOrText;
  } else {
    text = await fileOrText.text();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (parseErr) {
    throw new Error('Invalid file format: Unable to parse file as JSON');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid file content: Root must be a valid JSON object');
  }

  const record = parsed as Record<string, unknown>;

  if (record.magicHeader !== 'DEADLINESMET_ROUTINE_CONTAINER') {
    throw new Error(
      "Invalid routine file: Missing or invalid magicHeader. File must be a valid DeadlinesMet '.dm' container."
    );
  }

  const validationResult = DMRoutineFileSchema.safeParse(parsed);
  if (!validationResult.success) {
    const errorDetails = validationResult.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new Error(`Routine validation failed: ${errorDetails}`);
  }

  const routine = validationResult.data;

  // If vector is missing or empty, recalculate using client WebGPU embedder
  if (!routine.routineVector || routine.routineVector.length === 0) {
    routine.routineVector = await computeRoutineVector(
      routine.tuningParameters,
      routine.tasks.map((t) => t.title)
    );
  }

  return routine;
}

/**
 * Publishes custom routine to Firestore collection `shared_routines/{routineId}`
 * so other Reformers can discover, match, and Co-Op sync.
 */
export async function shareRoutineToCommunity(
  profile: CustomRoutineProfile,
  author: DMRoutineAuthor
): Promise<string> {
  if (!db) throw new Error('Firestore is not initialized');

  const checksum = await calculateRoutineChecksum(profile.tasks, profile.tuningAnswers);
  let vector = profile.routineVector;
  if (!vector || vector.length === 0) {
    vector = await computeRoutineVector(
      profile.tuningAnswers,
      profile.tasks.map((t) => t.title)
    );
  }

  const dmContainer: DMRoutineFileFormat = {
    version: '1.0.0',
    magicHeader: 'DEADLINESMET_ROUTINE_CONTAINER',
    exportedAt: new Date().toISOString(),
    author,
    profileName: profile.name,
    tuningParameters: profile.tuningAnswers,
    tasks: profile.tasks,
    routineVector: vector,
    checksum,
  };

  const payload = {
    id: profile.id,
    author,
    profileName: profile.name,
    wakeTime: profile.tuningAnswers.wakeUpTime,
    sleepTime: profile.tuningAnswers.sleepTime,
    studyWindow: profile.tuningAnswers.studyOrResearchPreference,
    routineVector: vector,
    tasksCount: profile.tasks.length,
    sustainabilityScore: profile.sustainabilityScore || 90,
    optimizationSummary: profile.optimizationSummary || 'Community shared schedule',
    dmPayload: dmContainer,
  };

  try {
    const sharedDocRef = doc(db, 'shared_routines', profile.id);
    await setDoc(
      sharedDocRef,
      {
        ...payload,
        sharedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (clientErr: any) {
    console.warn('[DMFileHandler] Client setDoc failed, attempting server API fallback:', clientErr);
    // Server API route fallback using admin SDK
    const res = await fetch('/api/routine/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error || clientErr?.message || 'Permission denied sharing routine');
    }
  }

  return profile.id;
}

/**
 * Sends a Co-Op partner invitation to routine author initialized strictly in `status: 'IDLE'`.
 * Guarantees zero unprompted timer launches until both participants explicitly click start.
 */
export async function sendCoOpInviteForRoutine(
  targetAuthorUid: string,
  targetAuthorName: string,
  routineTitle: string,
  currentUser: { uid: string; displayName?: string | null }
): Promise<{ sessionId: string }> {
  if (!db) throw new Error('Firestore is not initialized');
  if (targetAuthorUid === currentUser.uid) {
    throw new Error('You cannot initiate a Co-Op session with yourself.');
  }

  const sid = `coop_routine_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Initialize session in coop_sessions collection strictly with status: 'IDLE'
  await setDoc(doc(db, 'coop_sessions', sid), {
    id: sid,
    taskName: routineTitle,
    initialDuration: 25,
    startTime: null,
    expectedEndTime: null,
    isPaused: false,
    timeLeftWhenPaused: null,
    status: 'IDLE',
    participants: [currentUser.uid, targetAuthorUid],
    createdBy: currentUser.uid,
    lastActionBy: currentUser.uid,
    lastActionAt: serverTimestamp(),
  });

  // 2. Set pendingCoWorkerId on user profile to signal active connection request
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), {
      pendingCoWorkerId: targetAuthorUid,
    });
  } catch (e) {
    console.warn('[DMFileHandler] Note: pendingCoWorkerId update skipped or failed:', e);
  }

  // 3. Send message notification to target creator
  try {
    await addDoc(collection(db, 'messages'), {
      senderId: currentUser.uid,
      receiverId: targetAuthorUid,
      text: `🤝 I applied your routine "${routineTitle}" and want to Co-Op focus with you!`,
      coOpSessionId: sid,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.warn('[DMFileHandler] Message notification skipped:', e);
  }

  return { sessionId: sid };
}
