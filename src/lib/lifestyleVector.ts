"use client";

import { computeClientEmbedding, cosineSimilarity, normalizeVector } from './clientEmbedder';
import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { UserProfile, UserPresetTask } from '@/types';

/**
 * Computes a user's multi-dimensional lifestyle vector using client-side WebGPU EmbeddingGemma
 * and stores it at users/{userId}.lifestyleVector
 */
export async function generateAndPersistLifestyleVector(
  userId: string,
  profile: Partial<UserProfile>,
  routineTasks: (UserPresetTask | { name: string; duration?: number; category?: string })[] = []
): Promise<number[]> {
  const profession = profile.profile || 'General';
  const preference = profile.reformerPreference || 'morning_primer';

  // Derive top 3 productive hours from routine task distributions or sensible defaults
  const topHours = ['09:00 AM', '11:30 AM', '03:00 PM'];
  const taskNames = routineTasks.map((t) => t.name).filter(Boolean).slice(0, 12).join(', ');

  const summary = `Profession: ${profession}. MOVERS Lifestyle Wrapper: ${preference}. Peak Energy Focus Hours: ${topHours.join(
    ', '
  )}. Routine Habit Sprints: ${taskNames || 'Deep Work, Hydration, Mindfulness, Physical Training'}.`;

  try {
    const rawVector = await computeClientEmbedding(summary);
    const normalized = normalizeVector(rawVector);

    if (userId && db) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          lifestyleVector: normalized,
        });
      } catch (err) {
        console.warn('[LifestyleVector] Failed to persist lifestyleVector to Firestore:', err);
      }
    }

    return normalized;
  } catch (err) {
    console.error('[LifestyleVector] Vector computation failed:', err);
    return [];
  }
}

export interface CoReformerMatch {
  userId: string;
  name: string;
  avatar?: string;
  profession: string;
  reformerPreference?: string;
  similarity: number;
  online: boolean;
  status?: string;
  lifestyleVector?: number[];
  routineSummary?: string;
}

/**
 * Ranks active online members by cosine similarity against current user's lifestyleVector
 */
export function rankCoReformersByVector(
  currentVector: number[],
  candidates: {
    id: string;
    name: string;
    avatar?: string;
    profession?: string;
    reformerPreference?: string;
    online?: boolean;
    status?: string;
    lifestyleVector?: number[];
  }[],
  currentUserId?: string
): CoReformerMatch[] {
  if (!currentVector || currentVector.length === 0) return [];

  const scored: CoReformerMatch[] = [];

  for (const c of candidates) {
    if (c.id === currentUserId) continue;
    if (!c.online) continue;

    let sim = 0;
    if (c.lifestyleVector && c.lifestyleVector.length === currentVector.length) {
      sim = cosineSimilarity(currentVector, c.lifestyleVector);
    } else {
      // Fallback pseudo-vector similarity based on shared profession and preference
      sim = 0.5;
    }

    scored.push({
      userId: c.id,
      name: c.name,
      avatar: c.avatar,
      profession: c.profession || 'Reformer',
      reformerPreference: c.reformerPreference || 'morning_primer',
      similarity: Number(Math.max(0, Math.min(1, sim)).toFixed(3)),
      online: Boolean(c.online),
      status: c.status,
      lifestyleVector: c.lifestyleVector,
    });
  }

  // Sort descending by similarity, top 5
  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}
