import { createHash } from 'node:crypto';

/**
 * Computes SHA-256 hash of a string or buffer.
 */
export function computeSha256(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Computes SHA-256 of any JSON-serializable object with deterministic key sorting.
 */
export function computePayloadHash(payload: any): string {
  const jsonStr = JSON.stringify(payload, Object.keys(payload || {}).sort());
  return computeSha256(jsonStr);
}
