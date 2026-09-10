/**
 * security.ts
 * CryptoOS 98 Anti-Tamper Protection & Integrity Verification Engine.
 * Generates cryptographic checksums on user financial state and triggers BSOD if tampered.
 */

export const CRYPTOOS_STATE_STORAGE_KEY = 'CRYPTOOS_98_STATE_V1';
const INTEGRITY_SALT = 'CRYPTOOS_98_KERNEL_INTEGRITY_SALT_0x5F3759DF';

/**
 * Pure TypeScript synchronous SHA-256 implementation
 * Guarantees zero latency and sync execution for localStorage adapters and unit tests.
 */
export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let d = candidate * candidate; d < 313; d += candidate) {
        isComposite[d] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return ''; // ASCII check
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const s0 = i < 16 ? w[i] : (w[i] =
        ((w[i - 16] +
          (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
          w[i - 7] +
          (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
          0));
      const s1 =
        rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const ch = (hash[0] & hash[1]) ^ (~hash[0] & hash[2]);
      const temp1 =
        (hash[7] +
          (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
          ((hash[4] & hash[5]) ^ (~hash[4] & hash[6])) +
          k[i] +
          s0) |
        0;
      const temp2 = (s1 + ch) | 0;

      hash = [
        (temp1 + temp2) | 0,
        hash[0],
        hash[1],
        hash[2],
        (hash[3] + temp1) | 0,
        hash[4],
        hash[5],
        hash[6],
      ];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (b * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }
  return result;
}

/**
 * Normalizes state object into a deterministic canon string for checksum generation
 */
export function canonicalizeState(state: Record<string, unknown>): string {
  if (!state || typeof state !== 'object') return '';

  const num = (v: unknown): number => {
    const parsed = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  
  // Extract critical financial fields
  const equity = Number(num(state.equity).toFixed(2));
  const availableMargin = Number(num(state.availableMargin).toFixed(2));
  const lockedMargin = Number(num(state.lockedMargin).toFixed(2));
  const realizedPnl = Number(num(state.realizedPnl).toFixed(2));
  const winCount = Math.floor(num(state.winCount));
  const lossCount = Math.floor(num(state.lossCount));
  const totalTrades = Math.floor(num(state.totalTrades));
  const streakDay = Math.floor(num(state.currentStreakDay) || 1);
  const lastClaim = Math.floor(num(state.lastClaimTimestamp));

  return `EQUITY:${equity}|AVAIL:${availableMargin}|LOCK:${lockedMargin}|PNL:${realizedPnl}|W:${winCount}|L:${lossCount}|TRADES:${totalTrades}|STREAK:${streakDay}|CLAIM:${lastClaim}`;
}

/**
 * Calculates deterministic HMAC/SHA256 signature of canonicalized state
 */
export function generateChecksum(state: Record<string, unknown>, salt: string = INTEGRITY_SALT): string {
  const canon = canonicalizeState(state);
  return sha256(`${canon}::${salt}`);
}

export interface SealedEnvelope<T = unknown> {
  state: T;
  version: number;
  checksum: string;
  sealedAt: number;
}

/**
 * Encapsulates and signs state with cryptographic checksum
 */
export function sealState<T extends Record<string, unknown>>(state: T): string {
  const checksum = generateChecksum(state);
  const envelope: SealedEnvelope<T> = {
    state,
    version: 1,
    checksum,
    sealedAt: Date.now(),
  };
  return JSON.stringify(envelope);
}

export interface UnsealResult<T = unknown> {
  isValid: boolean;
  state: T | null;
  tamperReason?: string;
}

/**
 * Validates integrity of stored envelope; rejects tampered payloads
 */
export function unsealState<T extends Record<string, unknown>>(rawJson: string | null): UnsealResult<T> {
  if (!rawJson) {
    return { isValid: true, state: null };
  }

  try {
    const parsed = JSON.parse(rawJson);

    // If legacy raw object without envelope
    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, state: null, tamperReason: 'CORRUPTED_JSON' };
    }

    // Direct envelope format
    if (parsed.checksum && parsed.state && typeof parsed.state === 'object') {
      const expectedChecksum = generateChecksum(parsed.state as Record<string, unknown>);
      if (parsed.checksum !== expectedChecksum) {
        return {
          isValid: false,
          state: null,
          tamperReason: `ILLEGAL_CHECKSUM_MISMATCH: expected ${expectedChecksum} but found ${parsed.checksum}`,
        };
      }
      return { isValid: true, state: parsed.state as T };
    }

    // Unsigned direct state (e.g. initial dev state or first migration)
    return { isValid: true, state: parsed as T };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { isValid: false, state: null, tamperReason: `PARSE_EXCEPTION: ${errMsg}` };
  }
}
