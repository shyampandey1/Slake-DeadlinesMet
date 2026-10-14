"use client";

import {
  embedText,
  cosineSimilarity,
  computeDeterministicSemanticVector,
  EmbeddingVector,
  clientEmbedder,
} from './clientEmbedder';
import { JEV_VOICE_DATASET, VoiceIntentPayload, VoiceCategory } from '@/types/voice';
import {
  sanitizeSpeechTranscript,
  normalizeVoiceSpeech,
  extractVoiceDuration,
  toTitleCaseLocal,
  computeLevenshteinDistance,
  computeDiceCoefficient,
  extractTaskQueryFromSpeech,
  computeTokenSimilarity,
  computeFuzzyTokenAlignment,
  TASK_STOP_WORDS,
} from '@/config/voiceCommandDictionary';

export type SemanticDomain =
  | 'TIMER'
  | 'NAVIGATION'
  | 'ROUTINE'
  | 'COOP'
  | 'SENSORS'
  | 'REWARDS'
  | 'ANALYTICS'
  | 'OUT_OF_DOMAIN';

export const DOMAIN_ANCHOR_PHRASES: Record<Exclude<SemanticDomain, 'OUT_OF_DOMAIN'>, string[]> = {
  TIMER: [
    'start timer',
    'pause the clock',
    'resume',
    'stop timer',
    'finish task',
    'add 5 minutes',
    'set interval 10 minutes',
    'cancel timer',
    'skip task',
  ],
  NAVIGATION: [
    'go home',
    'open routine',
    'show reformers league',
    'open rewards',
    'show task log book',
    'open settings',
    'go back',
    'open presets',
  ],
  ROUTINE: [
    'start meditation',
    'oxygenation deep breathing',
    'start visualization',
    'start workout',
    'start reading',
    'start scribing',
    'deep work sprint',
    'drink a glass of water',
    'drink water timer',
    'hydrate with water',
    'eye strain exercise',
    'rest my eyes',
    'clean workspace',
    'log water',
    'bed made',
    'switch to morning primer',
    'switch to evening restorer',
    'day off',
  ],
  COOP: [
    'invite co reformer',
    'start partner session',
    'coach start group sprint',
    'coach pause group timer',
    'join co op session',
  ],
  SENSORS: [
    'turn on eye tracking',
    'disable gaze control',
    'turn on water sounds',
    'mute audio',
    'enable breathing chimes',
    'toggle haptics',
  ],
  REWARDS: [
    'check coin balance',
    'redeem payout',
    'pin certificate to profile',
    'show leaderboard',
    'download certificate',
    'view leaderboard',
  ],
  ANALYTICS: [
    'generate ai insights',
    'analyze my productivity',
    'evaluate routine',
    'check reformer readiness',
    'analyze my week',
    'check movers score',
    'show focus score',
    'view streak history',
  ],
};

export const SEMANTIC_GATE_THRESHOLD = 0.65;
export const SEMANTIC_INTENT_THRESHOLD = 0.72;

interface CachedAnchor {
  domain: Exclude<SemanticDomain, 'OUT_OF_DOMAIN'>;
  phrase: string;
  vector: EmbeddingVector;
  deterministicVector: EmbeddingVector;
}

interface IndexedIntentExemplar {
  phrase: string;
  normalizedPhrase: string;
  tokens: string[];
  intent: string;
  actionType?: string;
  taskName?: string;
  category?: VoiceCategory;
  durationMinutes?: number;
  targetRoute?: string;
  coinsAwarded?: number;
  speechFeedback: string;
  domain: Exclude<SemanticDomain, 'OUT_OF_DOMAIN'>;
  vector: EmbeddingVector;
  deterministicVector: EmbeddingVector;
}

let cachedAnchors: CachedAnchor[] | null = null;
let anchorInitPromise: Promise<CachedAnchor[]> | null = null;

let cachedIntentExemplars: IndexedIntentExemplar[] | null = null;
let intentInitPromise: Promise<IndexedIntentExemplar[]> | null = null;

function mapIntentToDomain(intent: string): Exclude<SemanticDomain, 'OUT_OF_DOMAIN'> {
  switch (intent) {
    case 'NAVIGATE':
      return 'NAVIGATION';
    case 'TIMER_START':
    case 'TIMER_PAUSE':
    case 'TIMER_RESUME':
    case 'TIMER_STOP':
    case 'TIMER_RESTART':
    case 'TIMER_EXTEND':
    case 'TIMER_REDUCE':
    case 'TIMER_SET_INTERVAL':
    case 'TIMER_SKIP':
      return 'TIMER';
    case 'COOP_ACTION':
      return 'COOP';
    case 'SENSOR_TOGGLE':
    case 'SENSOR_ENVIRONMENT_TOGGLE':
      return 'SENSORS';
    case 'REWARDS_ACTION':
    case 'REDEEM_TRIGGER':
      return 'REWARDS';
    case 'ANALYTICS_ACTION':
      return 'ANALYTICS';
    default:
      return 'ROUTINE';
  }
}

/**
 * Computes token Jaccard + stem + fuzzy alignment score in [0, 1] to reinforce EmbeddingGemma cosine similarity.
 */
function computeLexicalOverlap(queryTokens: string[], targetTokens: string[]): number {
  return computeFuzzyTokenAlignment(queryTokens, targetTokens);
}

/**
 * Pre-computes and caches vector embeddings for all 7 core application domains.
 */
export async function ensureDomainAnchorsInitialized(): Promise<CachedAnchor[]> {
  if (cachedAnchors) return cachedAnchors;
  if (anchorInitPromise) return anchorInitPromise;

  anchorInitPromise = (async () => {
    const entries: CachedAnchor[] = [];
    const domains = Object.keys(DOMAIN_ANCHOR_PHRASES) as Array<Exclude<SemanticDomain, 'OUT_OF_DOMAIN'>>;

    for (const domain of domains) {
      const phrases = DOMAIN_ANCHOR_PHRASES[domain];
      for (const phrase of phrases) {
        const [vector, deterministicVector] = await Promise.all([
          embedText(phrase),
          Promise.resolve(computeDeterministicSemanticVector(phrase)),
        ]);
        entries.push({
          domain,
          phrase,
          vector,
          deterministicVector,
        });
      }
    }

    cachedAnchors = entries;
    return entries;
  })();

  return anchorInitPromise;
}

/**
 * Pre-computes and caches EmbeddingGemma vector embeddings across the full JEV_VOICE_DATASET
 * for fine-grained natural language search and semantic intent generation.
 */
export async function ensureIntentEmbeddingsInitialized(): Promise<IndexedIntentExemplar[]> {
  if (cachedIntentExemplars) return cachedIntentExemplars;
  if (intentInitPromise) return intentInitPromise;

  intentInitPromise = (async () => {
    const exemplars: IndexedIntentExemplar[] = [];

    for (const record of JEV_VOICE_DATASET) {
      const domain = mapIntentToDomain(record.intent);
      const defaultTaskName =
        record.taskName ||
        (record.intent === 'TASK_CREATE' || record.intent === 'TASK_LOG_QUICK'
          ? toTitleCaseLocal(
              (record.utterances[0] || '')
                .replace(/^(?:start|begin|do|run)\s+/i, '')
                .replace(/\s+(?:timer|session|break|exercise|sprint|block|review)$/i, '')
                .trim()
            )
          : undefined);

      for (const utterance of record.utterances) {
        const normalizedPhrase = normalizeVoiceSpeech(utterance);
        const tokens = normalizedPhrase.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
        const [vector, deterministicVector] = await Promise.all([
          embedText(normalizedPhrase),
          Promise.resolve(computeDeterministicSemanticVector(normalizedPhrase)),
        ]);

        exemplars.push({
          phrase: utterance,
          normalizedPhrase,
          tokens,
          intent: record.intent,
          actionType: record.actionType,
          taskName: defaultTaskName,
          category: record.category as VoiceCategory | undefined,
          durationMinutes: record.durationMinutes,
          targetRoute: record.targetRoute,
          coinsAwarded: record.coinsAwarded,
          speechFeedback: record.speechFeedback,
          domain,
          vector,
          deterministicVector,
        });
      }
    }

    cachedIntentExemplars = exemplars;
    return exemplars;
  })();

  return intentInitPromise;
}

export interface SemanticGateResult {
  passed: boolean;
  domain: SemanticDomain;
  maxSimilarity: number;
  matchedAnchorPhrase: string | null;
  resolvedIntent?: VoiceIntentPayload | null;
  backend?: string;
}

export interface SemanticSearchMatch {
  label: string;
  phrase: string;
  similarity: number;
  domain: SemanticDomain;
  intent: VoiceIntentPayload;
}

/**
 * Evaluates an incoming voice transcript against the 7 in-domain anchor clusters
 * AND the EmbeddingGemma Intent Exemplar Index.
 */
export async function evaluateSemanticGate(
  transcript: string,
  userTasks: Array<{ name: string; duration?: number; category?: string }> = []
): Promise<SemanticGateResult> {
  const sanitized = sanitizeSpeechTranscript(transcript);
  const clean = normalizeVoiceSpeech(sanitized);
  if (!clean) {
    return {
      passed: false,
      domain: 'OUT_OF_DOMAIN',
      maxSimilarity: 0,
      matchedAnchorPhrase: null,
      resolvedIntent: null,
      backend: clientEmbedder.getBackend(),
    };
  }

  const [anchors, exemplars, queryVector] = await Promise.all([
    ensureDomainAnchorsInitialized(),
    ensureIntentEmbeddingsInitialized(),
    embedText(clean),
  ]);
  const queryDetVector = computeDeterministicSemanticVector(clean);
  const queryTokens = clean.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

  let maxSimilarity = -1;
  let bestDomain: Exclude<SemanticDomain, 'OUT_OF_DOMAIN'> = 'TIMER';
  let bestPhrase: string | null = null;

  for (const anchor of anchors) {
    let sim = 0;
    if (queryVector.length === anchor.vector.length) {
      sim = cosineSimilarity(queryVector, anchor.vector);
    }
    const detSim = cosineSimilarity(queryDetVector, anchor.deterministicVector);
    const effectiveSim = Math.max(sim, detSim);

    if (effectiveSim > maxSimilarity) {
      maxSimilarity = effectiveSim;
      bestDomain = anchor.domain;
      bestPhrase = anchor.phrase;
    }
  }

  // Also evaluate against the fine-grained EmbeddingGemma Intent Exemplar Index
  let bestExemplar: IndexedIntentExemplar | null = null;
  let bestExemplarScore = -1;
  const extracted = extractVoiceDuration(clean);
  const hasExplicitDuration =
    extracted.durationSeconds !== undefined || extracted.durationMinutes !== undefined;
  const isImperativeStart = /^(?:drink|make|do|start|begin|take|perform|set|have|get|let'?s)\b/i.test(clean);

  for (const ex of exemplars) {
    // Prevent quick-log past-tense habits from hijacking imperative start commands
    if (ex.intent === 'TASK_LOG_QUICK' && (hasExplicitDuration || isImperativeStart)) {
      continue;
    }

    let neuralSim = 0;
    if (queryVector.length === ex.vector.length) {
      neuralSim = cosineSimilarity(queryVector, ex.vector);
    }
    const detSim = cosineSimilarity(queryDetVector, ex.deterministicVector);
    const lexSim = computeLexicalOverlap(queryTokens, ex.tokens);

    // Hybrid EmbeddingGemma score combining neural cosine similarity, deterministic concept projection, and lexical overlap
    const combinedScore = Math.max(
      neuralSim * 0.72 + lexSim * 0.28,
      detSim * 0.70 + lexSim * 0.30,
      neuralSim,
      detSim * 0.92
    );

    if (combinedScore > bestExemplarScore) {
      bestExemplarScore = combinedScore;
      bestExemplar = ex;
    }
  }

  if (bestExemplar && bestExemplarScore > maxSimilarity) {
    maxSimilarity = bestExemplarScore;
    bestDomain = bestExemplar.domain;
    bestPhrase = bestExemplar.phrase;
  }

  let resolvedIntent: VoiceIntentPayload | null = null;
  if (bestExemplar && bestExemplarScore >= SEMANTIC_INTENT_THRESHOLD) {
    const finalMinutes =
      extracted.durationMinutes !== undefined ? extracted.durationMinutes : bestExemplar.durationMinutes;
    const finalSeconds =
      extracted.durationSeconds !== undefined
        ? extracted.durationSeconds
        : finalMinutes !== undefined
        ? Math.round(finalMinutes * 60)
        : undefined;

    let speechFeedback = bestExemplar.speechFeedback;
    if (
      hasExplicitDuration &&
      bestExemplar.taskName &&
      (bestExemplar.intent === 'TASK_CREATE' || bestExemplar.intent === 'TIMER_START')
    ) {
      const durLabel =
        finalSeconds && finalSeconds < 60
          ? `${finalSeconds} seconds`
          : finalMinutes === 1
          ? '1 minute'
          : `${finalMinutes} minutes`;
      speechFeedback = `Starting ${durLabel} ${bestExemplar.taskName}.`;
    }

    resolvedIntent = {
      action: bestExemplar.intent as any,
      actionType: bestExemplar.actionType,
      targetRoute: bestExemplar.targetRoute as any,
      taskName: bestExemplar.taskName,
      category: bestExemplar.category,
      durationMinutes: finalMinutes,
      durationSeconds: finalSeconds,
      coinsAwarded: bestExemplar.coinsAwarded,
      earnedCoins: bestExemplar.coinsAwarded,
      extendMinutes: bestExemplar.actionType === 'EXTEND' ? finalMinutes : undefined,
      intervalMinutes: bestExemplar.actionType === 'SET_INTERVAL' ? finalMinutes : undefined,
      speechFeedback,
      confidence: Number(Math.min(0.99, Math.max(0.82, bestExemplarScore)).toFixed(2)),
    };
  }

  // Also evaluate against user's personalized routine tasks via EmbeddingGemma
  if (userTasks && userTasks.length > 0) {
    const taskMatches = await searchCommandsAndTasksWithEmbeddingGemma(clean, userTasks, 2);
    if (taskMatches.length > 0 && taskMatches[0].similarity >= 0.52) {
      const top = taskMatches[0];
      const secondSim = taskMatches[1]?.similarity || 0;
      if (top.similarity >= 0.65 || (top.similarity - secondSim) >= 0.10) {
        if (top.similarity > maxSimilarity || !resolvedIntent) {
          maxSimilarity = top.similarity;
          bestDomain = 'TIMER';
          bestPhrase = top.phrase;
          resolvedIntent = top.intent;
        }
      }
    }
  }

  if (maxSimilarity < SEMANTIC_GATE_THRESHOLD) {
    return {
      passed: false,
      domain: 'OUT_OF_DOMAIN',
      maxSimilarity,
      matchedAnchorPhrase: bestPhrase,
      resolvedIntent: null,
      backend: clientEmbedder.getBackend(),
    };
  }

  return {
    passed: true,
    domain: bestDomain,
    maxSimilarity,
    matchedAnchorPhrase: bestPhrase,
    resolvedIntent,
    backend: clientEmbedder.getBackend(),
  };
}

/**
 * Uses EmbeddingGemma (google/embeddinggemma-300m) to perform natural language semantic search
 * across both canonical voice intents AND the user's personalized routine tasks.
 */
export async function searchCommandsAndTasksWithEmbeddingGemma(
  rawQuery: string,
  userTasks: Array<{ name: string; duration?: number; category?: string }> = [],
  topK: number = 5
): Promise<SemanticSearchMatch[]> {
  const sanitized = sanitizeSpeechTranscript(rawQuery);
  const clean = normalizeVoiceSpeech(sanitized);
  if (!clean) return [];

  const [exemplars, queryVector] = await Promise.all([
    ensureIntentEmbeddingsInitialized(),
    embedText(clean),
  ]);
  const queryDetVector = computeDeterministicSemanticVector(clean);
  const queryTokens = clean.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const extracted = extractVoiceDuration(clean);

  const resultsByKey = new Map<string, SemanticSearchMatch>();

  // 1. Score canonical intents
  for (const ex of exemplars) {
    let neuralSim = 0;
    if (queryVector.length === ex.vector.length) {
      neuralSim = cosineSimilarity(queryVector, ex.vector);
    }
    const detSim = cosineSimilarity(queryDetVector, ex.deterministicVector);
    const lexSim = computeLexicalOverlap(queryTokens, ex.tokens);
    const similarity = Math.max(
      neuralSim * 0.72 + lexSim * 0.28,
      detSim * 0.70 + lexSim * 0.30,
      neuralSim
    );

    const durationMinutes =
      extracted.durationMinutes !== undefined ? extracted.durationMinutes : ex.durationMinutes;
    const durationSeconds =
      extracted.durationSeconds !== undefined
        ? extracted.durationSeconds
        : durationMinutes !== undefined
        ? Math.round(durationMinutes * 60)
        : undefined;

    const key = `${ex.intent}:${ex.taskName || ex.targetRoute || ex.actionType || ex.phrase}`;
    const existing = resultsByKey.get(key);
    if (!existing || similarity > existing.similarity) {
      const label = ex.taskName
        ? `${ex.taskName}${durationMinutes ? ` (${durationMinutes}m)` : ''}`
        : toTitleCaseLocal(ex.phrase);

      resultsByKey.set(key, {
        label,
        phrase: ex.phrase,
        similarity,
        domain: ex.domain,
        intent: {
          action: ex.intent as any,
          actionType: ex.actionType,
          targetRoute: ex.targetRoute as any,
          taskName: ex.taskName,
          category: ex.category,
          durationMinutes,
          durationSeconds,
          coinsAwarded: ex.coinsAwarded,
          earnedCoins: ex.coinsAwarded,
          speechFeedback: ex.speechFeedback,
          confidence: Number(Math.min(0.99, Math.max(0.8, similarity)).toFixed(2)),
        },
      });
    }
  }

  // 2. Score user's personalized routine tasks via EmbeddingGemma + Fuzzy/Phonetic alignment
  const cleanCoreTaskQuery = extractTaskQueryFromSpeech(clean);
  const coreQueryVector =
    cleanCoreTaskQuery && cleanCoreTaskQuery !== clean
      ? await embedText(cleanCoreTaskQuery)
      : queryVector;
  const coreQueryDetVector =
    cleanCoreTaskQuery && cleanCoreTaskQuery !== clean
      ? computeDeterministicSemanticVector(cleanCoreTaskQuery)
      : queryDetVector;
  const coreQueryTokens = (cleanCoreTaskQuery || clean)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const seenTaskNames = new Set<string>();
  for (const task of userTasks) {
    if (!task?.name) continue;
    const lowerName = task.name.toLowerCase().trim();
    if (seenTaskNames.has(lowerName)) continue;
    seenTaskNames.add(lowerName);

    const taskNorm = normalizeVoiceSpeech(task.name);
    const taskTokens = taskNorm.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    const [taskVec, taskDetVec] = await Promise.all([
      embedText(taskNorm),
      Promise.resolve(computeDeterministicSemanticVector(taskNorm)),
    ]);

    // Neural cosine similarity against both full query and extracted core query
    let neuralSim = 0;
    if (queryVector.length === taskVec.length) {
      const fullNeural = cosineSimilarity(queryVector, taskVec);
      const coreNeural = cosineSimilarity(coreQueryVector, taskVec);
      neuralSim = Math.max(fullNeural, coreNeural);
    }
    const detSim = Math.max(
      cosineSimilarity(queryDetVector, taskDetVec),
      cosineSimilarity(coreQueryDetVector, taskDetVec)
    );

    // Fuzzy token alignment & Character n-gram Sørensen-Dice similarity
    const lexSim = Math.max(
      computeLexicalOverlap(queryTokens, taskTokens),
      computeLexicalOverlap(coreQueryTokens, taskTokens)
    );
    const diceSim = Math.max(
      computeDiceCoefficient(clean, taskNorm),
      computeDiceCoefficient(cleanCoreTaskQuery || clean, taskNorm)
    );
    const lexicalCombined = Math.max(
      lexSim * 0.65 + diceSim * 0.35,
      diceSim,
      lexSim
    );

    // Composite similarity score combining neural EmbeddingGemma and robust subword/token matching
    const similarity = Math.max(
      neuralSim * 0.40 + lexicalCombined * 0.60,
      detSim * 0.35 + lexicalCombined * 0.65,
      lexicalCombined * 0.88,
      neuralSim
    );

    const durMins =
      extracted.durationMinutes !== undefined ? extracted.durationMinutes : task.duration || 15;
    const durSecs =
      extracted.durationSeconds !== undefined ? extracted.durationSeconds : Math.round(durMins * 60);

    let mappedCat: any = task.category || 'Productivity';
    if (!task.category) {
      if (/water|hydrat/i.test(task.name)) mappedCat = 'Hydration';
      else if (/meditat|breath|oxygen/i.test(task.name)) mappedCat = 'Meditation';
      else if (/workout|warm-up|stretch|exercise|walk|gym/i.test(task.name)) mappedCat = 'Fitness';
      else if (/bed|hygiene|shower|clean|eye/i.test(task.name)) mappedCat = 'Hygiene';
      else if (/read|scrib|journal|sketch|design|write/i.test(task.name)) mappedCat = 'Creativity';
    }

    const key = `TASK_CREATE:${task.name.toLowerCase()}`;
    const existing = resultsByKey.get(key);
    if (!existing || similarity > existing.similarity) {
      const durLabel =
        durSecs < 60
          ? `${durSecs}s`
          : durMins === 1
          ? '1-minute'
          : `${durMins}-minute`;

      resultsByKey.set(key, {
        label: `${task.name} (${durMins}m)`,
        phrase: `start ${task.name.toLowerCase()}`,
        similarity,
        domain: 'TIMER',
        intent: {
          action: 'TIMER_START',
          actionType: 'START',
          taskName: task.name,
          category: mappedCat,
          durationMinutes: durMins,
          durationSeconds: durSecs,
          coinsAwarded: 50,
          earnedCoins: 50,
          speechFeedback: `Starting ${durLabel} ${task.name}.`,
          confidence: Number(Math.min(0.99, Math.max(0.85, similarity)).toFixed(2)),
        },
      });
    }
  }

  return Array.from(resultsByKey.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
