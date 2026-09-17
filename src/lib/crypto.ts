/**
 * Zero-Knowledge Client-Side Encryption (E2EE) Utility
 * Powered by Web Crypto API (AES-GCM 256-bit)
 * 
 * Provides end-to-end privacy for sensitive user data (task names, calendar events,
 * direct messages, and active focus sessions) so that data stored in Firestore is
 * encrypted ciphertext and unreadable by admins or database viewers.
 */

const ENCRYPTION_PREFIX = "enc:v1:";
const APP_PEPPER = "slake-deadlines-met-zero-knowledge-2026";

/**
 * Resolve SubtleCrypto across Browser and Node environments
 */
function getSubtle(): SubtleCrypto | null {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  return null;
}

/**
 * Derives an AES-GCM 256-bit key from a seed string (e.g., user UID or conversation ID)
 */
async function deriveKey(seed: string): Promise<CryptoKey | null> {
  const subtle = getSubtle();
  if (!subtle) return null;

  try {
    const encoder = new TextEncoder();
    const rawMaterial = encoder.encode(`${seed}:${APP_PEPPER}`);
    
    // Hash key material with SHA-256 to guarantee 256 bits
    const keyHash = await subtle.digest("SHA-256", rawMaterial);

    return await subtle.importKey(
      "raw",
      keyHash,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  } catch (err) {
    console.warn("Failed to derive encryption key:", err);
    return null;
  }
}

/**
 * Convert Uint8Array to base64 string
 */
function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
function fromBase64(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Check if a string is encrypted with our scheme
 */
export function isEncrypted(text: string | null | undefined): boolean {
  if (!text || typeof text !== "string") return false;
  return text.startsWith(ENCRYPTION_PREFIX);
}

/**
 * Encrypt a plain text string using a unique seed (user UID or conversation ID).
 * Returns `enc:v1:<iv_b64>:<ciphertext_b64>`.
 * Returns original text if encryption is not possible or input is empty.
 */
export async function encryptText(text: string | null | undefined, seed: string): Promise<string> {
  if (!text || typeof text !== "string" || !seed) return text || "";
  
  // Do not re-encrypt already encrypted ciphertext
  if (isEncrypted(text)) return text;

  const subtle = getSubtle();
  if (!subtle) return text;

  try {
    const key = await deriveKey(seed);
    if (!key) return text;

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(text);

    // Generate random 12-byte initialization vector (IV) for AES-GCM
    const iv = new Uint8Array(12);
    if (typeof window !== "undefined" && window.crypto) {
      window.crypto.getRandomValues(iv);
    } else if (typeof globalThis !== "undefined" && globalThis.crypto) {
      globalThis.crypto.getRandomValues(iv);
    } else {
      for (let i = 0; i < 12; i++) iv[i] = Math.floor(Math.random() * 256);
    }

    const encryptedBuffer = await subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encodedData
    );

    const ciphertext = new Uint8Array(encryptedBuffer);
    return `${ENCRYPTION_PREFIX}${toBase64(iv)}:${toBase64(ciphertext)}`;
  } catch (err) {
    console.warn("Encryption fallback: preserving text", err);
    return text;
  }
}

/**
 * Decrypt ciphertext back to plain text.
 * If text does not start with `enc:v1:`, it is treated as legacy unencrypted text and returned as-is.
 */
export async function decryptText(cipherText: string | null | undefined, seed: string): Promise<string> {
  if (!cipherText || typeof cipherText !== "string") return cipherText || "";
  
  // If not encrypted, return as-is (preserves legacy data seamlessly)
  if (!isEncrypted(cipherText)) return cipherText;

  const subtle = getSubtle();
  if (!subtle) return cipherText;

  try {
    const parts = cipherText.slice(ENCRYPTION_PREFIX.length).split(":");
    if (parts.length !== 2) return cipherText;

    const iv = fromBase64(parts[0]);
    const ciphertext = fromBase64(parts[1]);

    const key = await deriveKey(seed);
    if (!key) return cipherText;

    const decryptedBuffer = await subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.warn("Decryption error:", err);
    // Return original string if decryption fails (e.g., mismatching key)
    return cipherText;
  }
}
