"use client";

import {
  embedText,
  cosineSimilarity,
  computeDeterministicSemanticVector,
  EmbeddingVector,
} from './clientEmbedder';

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
    'drink water timer',
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
    'download certificate',
    'view leaderboard',
  ],
  ANALYTICS: [
    'analyze my week',
    'check movers score',
    'show focus score',
    'view streak history',
  ],
};

export const SEMANTIC_GATE_THRESHOLD = 0.68;

interface CachedAnchor {
  domain: Exclude<SemanticDomain, 'OUT_OF_DOMAIN'>;
  phrase: string;
  vector: EmbeddingVector;
  deterministicVector: EmbeddingVector;
}

let cachedAnchors: CachedAnchor[] | null = null;
let anchorInitPromise: Promise<CachedAnchor[]> | null = null;

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

export interface SemanticGateResult {
  passed: boolean;
  domain: SemanticDomain;
  maxSimilarity: number;
  matchedAnchorPhrase: string | null;
}

/**
 * Evaluates an incoming voice transcript against the 7 in-domain anchor clusters.
 * Any transcript with maximum cosine similarity < 0.68 is rejected as OUT_OF_DOMAIN.
 */
export async function evaluateSemanticGate(transcript: string): Promise<SemanticGateResult> {
  const clean = transcript.toLowerCase().trim();
  if (!clean) {
    return {
      passed: false,
      domain: 'OUT_OF_DOMAIN',
      maxSimilarity: 0,
      matchedAnchorPhrase: null,
    };
  }

  const anchors = await ensureDomainAnchorsInitialized();
  const queryVector = await embedText(clean);
  const queryDetVector = computeDeterministicSemanticVector(clean);

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

  if (maxSimilarity < SEMANTIC_GATE_THRESHOLD) {
    return {
      passed: false,
      domain: 'OUT_OF_DOMAIN',
      maxSimilarity,
      matchedAnchorPhrase: bestPhrase,
    };
  }

  return {
    passed: true,
    domain: bestDomain,
    maxSimilarity,
    matchedAnchorPhrase: bestPhrase,
  };
}
