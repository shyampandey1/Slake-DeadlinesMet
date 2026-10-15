"use client";

import { computeClientEmbedding, cosineSimilarity } from './clientEmbedder';
import type { Task } from '@/types';

export interface VectorLogRecord {
  id: string;
  timestamp: string;
  category: string;
  title: string;
  notes?: string;
  duration: number;
  coins: number;
  vector: number[];
}

export interface SearchResultLogRecord {
  id: string;
  timestamp: string;
  category: string;
  title: string;
  notes?: string;
  duration: number;
  coins: number;
  similarity: number;
}

const DB_NAME = 'deadlinesmet_vector_logs';
const DB_VERSION = 1;
const STORE_NAME = 'logs';

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

export async function openLogVectorDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB cannot be accessed server-side');
  }

  if (dbInstance) return dbInstance;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('category', 'category', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('[logVectorStore] Failed to open IndexedDB:', request.error);
      reject(request.error);
    };
  });

  return dbInitPromise;
}

/**
 * Stores or updates a task log vector record in IndexedDB
 */
export async function saveLogVectorRecord(record: {
  id: string;
  timestamp: string;
  category: string;
  title: string;
  notes?: string;
  duration: number;
  coins: number;
  vector?: number[];
}): Promise<void> {
  try {
    const db = await openLogVectorDB();
    const vec =
      record.vector && record.vector.length > 0
        ? record.vector
        : await computeClientEmbedding(`${record.title}. ${record.category}. ${record.notes || ''}`);

    const item: VectorLogRecord = {
      id: record.id,
      timestamp: record.timestamp,
      category: record.category,
      title: record.title,
      notes: record.notes || '',
      duration: record.duration,
      coins: record.coins,
      vector: vec,
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(item);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch (err) {
    console.warn('[logVectorStore] Error saving log vector:', err);
  }
}

/**
 * Backfills embeddings for historical tasks (up to 50 logs) into IndexedDB
 */
export async function backfillLogEmbeddings(tasks: Task[]): Promise<void> {
  if (!tasks || tasks.length === 0 || typeof window === 'undefined') return;

  try {
    const db = await openLogVectorDB();
    const existingIds = await new Promise<Set<string>>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const keysReq = store.getAllKeys();
      keysReq.onsuccess = () => {
        resolve(new Set((keysReq.result as string[]) || []));
      };
      keysReq.onerror = () => resolve(new Set());
    });

    const recentLogs = tasks.slice(0, 50);
    for (const task of recentLogs) {
      if (!task.id || existingIds.has(task.id)) continue;

      const title = task.name || 'Completed Task';
      const category = task.category || 'Productivity';
      const notes = (task as any).notes || '';
      const textToEmbed = `${title} ${category} ${notes}`.trim();
      const vec = await computeClientEmbedding(textToEmbed);

      await saveLogVectorRecord({
        id: task.id,
        timestamp:
          typeof task.createdAt === 'string'
            ? task.createdAt
            : new Date().toISOString(),
        category,
        title,
        notes,
        duration: task.duration || 15,
        coins: task.earnedCoins || 0,
        vector: vec,
      });
    }
  } catch (err) {
    console.warn('[logVectorStore] Backfill error:', err);
  }
}

/**
 * Queries IndexedDB logs using cosine similarity against the query vector in < 20ms
 */
export async function searchLogsByVector(
  queryVector: number[],
  topK: number = 10
): Promise<SearchResultLogRecord[]> {
  if (!queryVector || queryVector.length === 0) return [];

  try {
    const db = await openLogVectorDB();
    const allRecords = await new Promise<VectorLogRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    const scored: SearchResultLogRecord[] = [];
    for (const record of allRecords) {
      if (!record.vector || record.vector.length === 0) continue;
      const sim = cosineSimilarity(queryVector, record.vector);
      scored.push({
        id: record.id,
        timestamp: record.timestamp,
        category: record.category,
        title: record.title,
        notes: record.notes,
        duration: record.duration,
        coins: record.coins,
        similarity: Number(sim.toFixed(3)),
      });
    }

    return scored.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
  } catch (err) {
    console.warn('[logVectorStore] Search error:', err);
    return [];
  }
}

/**
 * High-level natural language semantic search for the Log Book
 */
export async function searchLogsSemantic(
  queryText: string,
  topK: number = 10
): Promise<SearchResultLogRecord[]> {
  const trimmed = queryText.trim();
  if (!trimmed) return [];

  const queryVec = await computeClientEmbedding(trimmed);
  return searchLogsByVector(queryVec, topK);
}
