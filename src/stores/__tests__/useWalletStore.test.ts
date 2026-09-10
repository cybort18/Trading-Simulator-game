import { describe, it, expect, beforeEach } from 'vitest';
import { useWalletStore } from '../useWalletStore';

describe('useWalletStore', () => {
  beforeEach(() => {
    useWalletStore.getState().resetWallet(10.00);
  });

  it('initializes with 10.00 USDT equity and available margin', () => {
    const state = useWalletStore.getState();
    expect(state.equity).toBe(10.00);
    expect(state.availableMargin).toBe(10.00);
    expect(state.lockedMargin).toBe(0.00);
    expect(state.realizedPnl).toBe(0.00);
    expect(state.winCount).toBe(0);
    expect(state.lossCount).toBe(0);
    expect(state.totalTrades).toBe(0);
  });

  it('locks margin successfully if available', () => {
    const success = useWalletStore.getState().lockMargin(5.00);
    expect(success).toBe(true);

    const state = useWalletStore.getState();
    expect(state.availableMargin).toBe(5.00);
    expect(state.lockedMargin).toBe(5.00);
  });

  it('rejects margin lock if requested amount exceeds available margin', () => {
    const success = useWalletStore.getState().lockMargin(15.00);
    expect(success).toBe(false);

    const state = useWalletStore.getState();
    expect(state.availableMargin).toBe(10.00);
    expect(state.lockedMargin).toBe(0.00);
  });

  it('unlocks margin correctly', () => {
    useWalletStore.getState().lockMargin(6.00);
    useWalletStore.getState().unlockMargin(4.00);

    const state = useWalletStore.getState();
    expect(state.lockedMargin).toBe(2.00);
    expect(state.availableMargin).toBe(8.00);
  });

  it('deducts fees from available margin and equity', () => {
    useWalletStore.getState().deductFee(0.05);

    const state = useWalletStore.getState();
    expect(state.availableMargin).toBe(9.95);
    expect(state.equity).toBe(9.95);
  });

  it('records profitable trade result and updates win stats', () => {
    useWalletStore.getState().lockMargin(5.00);
    // Return 5.00 margin + 5.00 PnL
    useWalletStore.getState().recordTradeResult(5.00, 5.00);

    const state = useWalletStore.getState();
    expect(state.lockedMargin).toBe(0.00);
    expect(state.availableMargin).toBe(15.00);
    expect(state.equity).toBe(15.00);
    expect(state.realizedPnl).toBe(5.00);
    expect(state.winCount).toBe(1);
    expect(state.lossCount).toBe(0);
    expect(state.totalTrades).toBe(1);
    expect(state.getWinRate()).toBe(100);
    expect(state.getAllTimeRoi()).toBe(50);
  });

  it('records losing trade result and updates loss stats', () => {
    useWalletStore.getState().lockMargin(5.00);
    // Return 5.00 margin with -5.00 PnL (total loss of margin)
    useWalletStore.getState().recordTradeResult(-5.00, 5.00);

    const state = useWalletStore.getState();
    expect(state.lockedMargin).toBe(0.00);
    expect(state.availableMargin).toBe(5.00);
    expect(state.equity).toBe(5.00);
    expect(state.realizedPnl).toBe(-5.00);
    expect(state.winCount).toBe(0);
    expect(state.lossCount).toBe(1);
    expect(state.totalTrades).toBe(1);
    expect(state.getWinRate()).toBe(0);
  });

  it('manages faucet claim eligibility strictly below 1.00 USDT equity', () => {
    expect(useWalletStore.getState().isFaucetAvailable()).toBe(false);

    // Drain account below 1.00
    useWalletStore.getState().lockMargin(10.00);
    useWalletStore.getState().recordTradeResult(-9.50, 10.00);

    const drained = useWalletStore.getState();
    expect(drained.equity).toBe(0.50);
    expect(useWalletStore.getState().isFaucetAvailable()).toBe(true);

    const claimed = useWalletStore.getState().claimFaucet(10.00);
    expect(claimed).toBe(true);
    expect(useWalletStore.getState().equity).toBe(10.50);
    expect(useWalletStore.getState().isFaucetAvailable()).toBe(false);
  });

  it('claims daily reward, credits wallet, and enforces 24h cooldown', () => {
    const initialEquity = useWalletStore.getState().equity;
    expect(useWalletStore.getState().currentStreakDay).toBe(1);

    // First claim for Day 1 (+2.00 USDT)
    const result = useWalletStore.getState().claimDailyReward();
    expect(result.success).toBe(true);
    expect(result.amount).toBe(2.00);

    const updated = useWalletStore.getState();
    expect(updated.equity).toBe(initialEquity + 2.00);
    expect(updated.availableMargin).toBe(initialEquity + 2.00);
    expect(updated.currentStreakDay).toBe(2);
    expect(updated.lastClaimTimestamp).toBeGreaterThan(0);

    // Immediate second claim should be rejected on cooldown
    const secondClaim = useWalletStore.getState().claimDailyReward();
    expect(secondClaim.success).toBe(false);
    expect(secondClaim.error).toContain('cooldown');
    expect(useWalletStore.getState().getTimeUntilNextDailyClaim()).toBeGreaterThan(0);
  });
});
