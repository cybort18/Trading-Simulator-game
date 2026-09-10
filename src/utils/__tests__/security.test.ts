import { describe, it, expect } from 'vitest';
import {
  sha256,
  canonicalizeState,
  generateChecksum,
  sealState,
  unsealState,
  CRYPTOOS_STATE_STORAGE_KEY,
} from '../security';

describe('Security & Anti-Tamper Checksum Engine', () => {
  it('computes deterministic SHA-256 hashes', () => {
    const hash1 = sha256('CryptoOS98');
    const hash2 = sha256('CryptoOS98');
    const hash3 = sha256('CryptoOS99');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toHaveLength(64);
  });

  it('canonicalizes financial state deterministically', () => {
    const stateA = {
      equity: 10.00,
      availableMargin: 10.00,
      lockedMargin: 0.00,
      realizedPnl: 0.00,
      winCount: 0,
      lossCount: 0,
      totalTrades: 0,
      currentStreakDay: 1,
      lastClaimTimestamp: 1700000000,
    };

    const stateB = { ...stateA };
    expect(canonicalizeState(stateA)).toBe(canonicalizeState(stateB));

    const stateModified = { ...stateA, equity: 999999.00 };
    expect(canonicalizeState(stateA)).not.toBe(canonicalizeState(stateModified));
  });

  it('seals state with a cryptographic checksum envelope', () => {
    expect(CRYPTOOS_STATE_STORAGE_KEY).toBe('CRYPTOOS_98_STATE_V1');

    const originalState = {
      equity: 50.00,
      availableMargin: 25.00,
      lockedMargin: 25.00,
      realizedPnl: 10.00,
      winCount: 3,
      lossCount: 1,
      totalTrades: 4,
      currentStreakDay: 2,
      lastClaimTimestamp: 1700000000,
    };

    const directChecksum = generateChecksum(originalState);
    expect(directChecksum).toBeDefined();

    const sealedJson = sealState(originalState);
    expect(sealedJson).toBeDefined();

    const parsed = JSON.parse(sealedJson);
    expect(parsed.checksum).toBe(directChecksum);
    expect(parsed.version).toBe(1);
    expect(parsed.state.equity).toBe(50.00);

    const unsealed = unsealState(sealedJson);
    expect(unsealed.isValid).toBe(true);
    expect(unsealed.state?.equity).toBe(50.00);
  });

  it('detects and flags illegal equity tampering in storage payload', () => {
    const honestState = {
      equity: 10.00,
      availableMargin: 10.00,
      lockedMargin: 0.00,
      realizedPnl: 0.00,
      winCount: 0,
      lossCount: 0,
      totalTrades: 0,
      currentStreakDay: 1,
      lastClaimTimestamp: 0,
    };

    const sealedJson = sealState(honestState);
    const envelope = JSON.parse(sealedJson);

    // Attacker hacks localStorage to give themselves 1,000,000 USDT without valid signature
    envelope.state.equity = 1000000.00;
    envelope.state.availableMargin = 1000000.00;
    const tamperedJson = JSON.stringify(envelope);

    const unsealed = unsealState(tamperedJson);
    expect(unsealed.isValid).toBe(false);
    expect(unsealed.state).toBeNull();
    expect(unsealed.tamperReason).toContain('ILLEGAL_CHECKSUM_MISMATCH');
  });

  it('handles null, undefined, or empty payload gracefully', () => {
    expect(unsealState(null).isValid).toBe(true);
    expect(unsealState(null).state).toBeNull();
  });
});
