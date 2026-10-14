"use client";

import { pipeline, env } from '@huggingface/transformers';

// Configure @huggingface/transformers to cache weights in browser IndexedDB and never look for local filesystem models
if (typeof window !== 'undefined') {
  env.useBrowserCache = true;
  env.allowLocalModels = false;
}

export type EmbeddingVector = number[];

const PRIMARY_WEBGPU_MODEL = 'google/embeddinggemma-300m';
const FALLBACK_WASM_MODEL = 'Xenova/all-MiniLM-L6-v2';

class ClientEmbedderSingleton {
  private static instance: ClientEmbedderSingleton | null = null;
  private extractorPromise: Promise<any> | null = null;
  private activeBackend: 'webgpu' | 'wasm' | 'lexical-hybrid' = 'lexical-hybrid';
  private vectorCache = new Map<string, EmbeddingVector>();

  private constructor() {}

  public static getInstance(): ClientEmbedderSingleton {
    if (!ClientEmbedderSingleton.instance) {
      ClientEmbedderSingleton.instance = new ClientEmbedderSingleton();
    }
    return ClientEmbedderSingleton.instance;
  }

  public getBackend(): string {
    return this.activeBackend;
  }

  private async hasWebGPU(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
      return false;
    }
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      return Boolean(adapter);
    } catch {
      return false;
    }
  }

  /**
   * Lazy-loads google/embeddinggemma-300m on WebGPU (q8) with automatic fallback to WASM (Xenova/all-MiniLM-L6-v2).
   */
  public async getExtractor(): Promise<any> {
    if (this.extractorPromise) {
      return this.extractorPromise;
    }

    this.extractorPromise = (async () => {
      const webgpuSupported = await this.hasWebGPU();

      if (webgpuSupported) {
        try {
          const extractor = await pipeline('feature-extraction', PRIMARY_WEBGPU_MODEL, {
            device: 'webgpu',
            dtype: 'q8',
          });
          this.activeBackend = 'webgpu';
          return extractor;
        } catch (webgpuErr) {
          console.warn(
            `[ClientEmbedder] WebGPU load for ${PRIMARY_WEBGPU_MODEL} fell back to WASM (${FALLBACK_WASM_MODEL}):`,
            webgpuErr
          );
        }
      }

      try {
        const wasmExtractor = await pipeline('feature-extraction', FALLBACK_WASM_MODEL, {
          device: 'wasm',
          dtype: 'q8',
        });
        this.activeBackend = 'wasm';
        return wasmExtractor;
      } catch (wasmErr) {
        console.warn('[ClientEmbedder] WASM model load failed, using deterministic semantic projection:', wasmErr);
        this.activeBackend = 'lexical-hybrid';
        return null;
      }
    })();

    return this.extractorPromise;
  }

  /**
   * Computes a mean-pooled and L2-normalized vector from a raw @huggingface/transformers Tensor output.
   */
  public meanPoolAndNormalize(tensorOutput: any): EmbeddingVector {
    if (!tensorOutput || !tensorOutput.data) {
      return [];
    }

    const data = Array.from(tensorOutput.data as Float32Array | number[]);
    const dims: number[] = tensorOutput.dims || [];

    // Shape [1, seq_len, hidden_dim] -> mean pool across seq_len
    if (dims.length === 3) {
      const seqLen = dims[1] || 1;
      const hiddenDim = dims[2] || data.length;
      const pooled = new Array<number>(hiddenDim).fill(0);

      for (let s = 0; s < seqLen; s++) {
        const offset = s * hiddenDim;
        for (let d = 0; d < hiddenDim; d++) {
          pooled[d] += data[offset + d] || 0;
        }
      }

      for (let d = 0; d < hiddenDim; d++) {
        pooled[d] /= seqLen;
      }

      return normalizeVector(pooled);
    }

    // Shape [1, hidden_dim] or [hidden_dim] -> already pooled, just L2 normalize
    return normalizeVector(data);
  }

  /**
   * Generates a normalized embedding vector for input text, caching results in memory.
   */
  public async embed(text: string): Promise<EmbeddingVector> {
    const clean = text.toLowerCase().trim();
    if (!clean) return new Array(128).fill(0);

    const cacheKey = `${this.activeBackend}:${clean}`;
    const cached = this.vectorCache.get(cacheKey);
    if (cached) return cached;

    try {
      const extractor = await this.getExtractor();
      if (extractor) {
        const output = await extractor(clean, { pooling: 'mean', normalize: true });
        const vec = this.meanPoolAndNormalize(output);
        if (vec.length > 0) {
          this.vectorCache.set(`${this.activeBackend}:${clean}`, vec);
          return vec;
        }
      }
    } catch (err) {
      console.warn('[ClientEmbedder] Neural extraction error, falling back to deterministic vector:', err);
    }

    const fallbackVec = computeDeterministicSemanticVector(clean);
    this.vectorCache.set(cacheKey, fallbackVec);
    return fallbackVec;
  }
}

/**
 * L2-normalizes a numeric vector so dot product equals cosine similarity.
 */
export function normalizeVector(vec: number[]): EmbeddingVector {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return vec;
  const out = new Array<number>(vec.length);
  for (let i = 0; i < vec.length; i++) {
    out[i] = vec[i] / norm;
  }
  return out;
}

/**
 * Computes cosine similarity between two vectors in [-1, 1].
 */
export function cosineSimilarity(vecA: ArrayLike<number>, vecB: ArrayLike<number>): number {
  const len = Math.min(vecA.length, vecB.length);
  if (len === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

/**
 * Deterministic semantic concept & character n-gram projection used as zero-latency fallback
 * if WebGPU/WASM weights are unavailable or restricted by offline environment.
 */
const DOMAIN_CONCEPT_CLUSTERS: string[][] = [
  ['start', 'begin', 'launch', 'run', 'timer', 'clock', 'countdown', 'session', 'minutes', 'seconds', 'hour'],
  ['pause', 'hold', 'freeze', 'wait', 'resume', 'continue', 'unpause', 'stop', 'end', 'finish', 'cancel', 'abort', 'reset', 'restart', 'skip', 'next'],
  ['add', 'extend', 'more', 'extra', 'reduce', 'subtract', 'remove', 'interval', 'alert', 'chime', 'every'],
  ['go', 'open', 'show', 'view', 'navigate', 'home', 'dashboard', 'routine', 'schedule', 'reformers', 'league', 'rewards', 'coins', 'wallet', 'achievements', 'log', 'book', 'analytics', 'history', 'presets', 'templates', 'settings', 'privacy', 'back'],
  ['meditation', 'meditate', 'mindfulness', 'zen', 'breath', 'breathing', 'oxygenation', 'pranayama', 'inhale', 'exhale', 'visualization', 'visualize'],
  ['workout', 'exercise', 'fitness', 'gym', 'stretch', 'pushups', 'squats', 'cardio', 'movement', 'walk', 'run'],
  ['read', 'reading', 'book', 'scribe', 'scribing', 'journal', 'journaling', 'write', 'writing', 'sketch', 'brainstorm'],
  ['deep', 'work', 'sprint', 'coding', 'code', 'focus', 'pomodoro', 'study', 'email', 'inbox', 'mail'],
  ['water', 'drink', 'hydrate', 'hydration', 'glass', 'logged', 'drank', 'bed', 'made', 'clean', 'desk', 'workspace', 'tidy', 'meal', 'breakfast', 'lunch', 'dinner', 'eye', 'strain', 'vision'],
  ['primer', 'morning', 'restorer', 'evening', 'day', 'off', 'recovery'],
  ['coop', 'co-op', 'partner', 'peer', 'reformer', 'invite', 'coach', 'group', 'cluster', 'join', 'sync', 'nudge'],
  ['sensor', 'eye', 'tracking', 'gaze', 'dwell', 'hands-free', 'hands', 'free', 'audio', 'sound', 'sounds', 'mute', 'unmute', 'silence', 'haptics', 'vibration', 'vibrate'],
  ['balance', 'redeem', 'payout', 'cash', 'upi', 'certificate', 'pin', 'download', 'export', 'leaderboard', 'rank', 'standings'],
  ['analyze', 'week', 'insights', 'movers', 'score', 'streak', 'velocity', 'report', 'breakdown'],
];

export function computeDeterministicSemanticVector(text: string): EmbeddingVector {
  const dim = 128;
  const vec = new Array<number>(dim).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  // 1. Project onto semantic concept dimensions (0..DOMAIN_CONCEPT_CLUSTERS.length - 1)
  for (let c = 0; c < DOMAIN_CONCEPT_CLUSTERS.length; c++) {
    const cluster = DOMAIN_CONCEPT_CLUSTERS[c];
    for (const token of tokens) {
      if (cluster.includes(token)) {
        vec[c] += 2.5;
      } else if (cluster.some((w) => w.length >= 4 && (token.startsWith(w.slice(0, 4)) || w.startsWith(token.slice(0, 4))))) {
        vec[c] += 1.4;
      }
    }
  }

  // 2. Project token & character trigram hashes into remaining dimensions (32..127)
  for (const token of tokens) {
    let h = 2166136261;
    for (let i = 0; i < token.length; i++) {
      h ^= token.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const idx = 32 + (Math.abs(h) % (dim - 32));
    vec[idx] += 1.0;

    // Project character trigrams for robust subword/fuzzy spelling resilience
    if (token.length >= 3) {
      for (let i = 0; i <= token.length - 3; i++) {
        const tri = token.slice(i, i + 3);
        let th = 2166136261;
        for (let j = 0; j < 3; j++) {
          th ^= tri.charCodeAt(j);
          th = Math.imul(th, 16777619);
        }
        const tidx = 32 + (Math.abs(th) % (dim - 32));
        vec[tidx] += 0.45;
      }
    }
  }

  return normalizeVector(vec);
}

export const clientEmbedder = ClientEmbedderSingleton.getInstance();

export async function embedText(text: string): Promise<EmbeddingVector> {
  return clientEmbedder.embed(text);
}
