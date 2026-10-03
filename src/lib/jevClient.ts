import { z } from 'zod';

export const JEV_API_KEY =
  process.env.JEV_API_KEY ||
  'apikey_210288a56a7ed0ab447aa1785bf5325a7936_eb450e49c35123befac0b51dffca0cd7d4f6fdbe34828be6ca7070d96a5a6637';

export const JEV_API_BASE_URL =
  process.env.JEV_API_BASE_URL || 'https://api.jevtypesafe.com/v1';

const TIMEOUT_MS = 20_000; // 20-second threshold to prevent hanging requests inside Vercel serverless functions

/**
 * Strongly typed inference wrapper for JEV TypeSafe Decision Engine.
 * Enforces runtime parsing and compile-time type guarantees using Zod schemas.
 */
export async function runJevInference<T>(
  prompt: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const endpoint = `${JEV_API_BASE_URL.replace(/\/+$/, '')}/inference`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${JEV_API_KEY}`,
        'x-api-key': JEV_API_KEY,
      },
      body: JSON.stringify({
        prompt,
        schema: (schema as any).description || 'Structured output',
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `JEV TypeSafe API request failed (HTTP ${response.status}): ${errorText || response.statusText}`
      );
    }

    const json = await response.json();
    const rawResult =
      json && typeof json === 'object' && ('output' in json || 'result' in json || 'data' in json)
        ? (json.output ?? json.result ?? json.data)
        : json;

    const parsedData = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;

    // Enforce runtime parsing and compile-time type guarantees
    return schema.parse(parsedData);
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(`JEV TypeSafe request timed out after ${TIMEOUT_MS / 1000} seconds`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
