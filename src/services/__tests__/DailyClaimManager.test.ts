import { describe, it, expect } from 'vitest';
import {
  DailyClaimManager,
  DAILY_REWARD_TIERS,
  CLAIM_COOLDOWN_MS,
  CLAIM_GRACE_PERIOD_MS,
} from '../DailyClaimManager';

describe('DailyClaimManager', () => {
  const BASE_TIME = 1700000000000;

  it('provides correct reward tiers for all 7 days', () => {
    expect(CLAIM_COOLDOWN_MS).toBe(24 * 60 * 60 * 1000);
    expect(CLAIM_GRACE_PERIOD_MS).toBe(36 * 60 * 60 * 1000);
    expect(DAILY_REWARD_TIERS).toHaveLength(7);
    expect(DAILY_REWARD_TIERS[0].reward).toBe(2.00);
    expect(DAILY_REWARD_TIERS[1].reward).toBe(5.00);
    expect(DAILY_REWARD_TIERS[2].reward).toBe(8.00);
    expect(DAILY_REWARD_TIERS[3].reward).toBe(10.00);
    expect(DAILY_REWARD_TIERS[4].reward).toBe(15.00);
    expect(DAILY_REWARD_TIERS[5].reward).toBe(25.00);
    expect(DAILY_REWARD_TIERS[6].reward).toBe(50.00);
    expect(DAILY_REWARD_TIERS[6].mysteryBox).toBe(true);
  });

  it('allows immediate claim for a brand new user', () => {
    const eligibility = DailyClaimManager.checkEligibility(0, 1, BASE_TIME);
    expect(eligibility.status).toBe('READY');
    expect(eligibility.effectiveDay).toBe(1);
    expect(eligibility.timeRemainingMs).toBe(0);

    const claim = DailyClaimManager.processClaim(0, 1, BASE_TIME);
    expect(claim.success).toBe(true);
    expect(claim.rewardAmount).toBe(2.00);
    expect(claim.claimedDay).toBe(1);
    expect(claim.nextStreakDay).toBe(2);
    expect(claim.mysteryBoxAwarded).toBe(false);
  });

  it('rejects claims during the 24-hour cooldown period', () => {
    const lastClaim = BASE_TIME;
    // 12 hours later (inside 24h cooldown)
    const now = lastClaim + 12 * 60 * 60 * 1000;

    const eligibility = DailyClaimManager.checkEligibility(lastClaim, 2, now);
    expect(eligibility.status).toBe('COOLDOWN');
    expect(eligibility.timeRemainingMs).toBe(12 * 60 * 60 * 1000);

    const claim = DailyClaimManager.processClaim(lastClaim, 2, now);
    expect(claim.success).toBe(false);
    expect(claim.error).toContain('cooldown');
  });

  it('preserves and advances streak when claimed within 24h to 36h grace window', () => {
    const lastClaim = BASE_TIME;
    // 25 hours later (past 24h, within 36h)
    const now = lastClaim + 25 * 60 * 60 * 1000;

    const eligibility = DailyClaimManager.checkEligibility(lastClaim, 2, now);
    expect(eligibility.status).toBe('READY');
    expect(eligibility.effectiveDay).toBe(2);

    const claim = DailyClaimManager.processClaim(lastClaim, 2, now);
    expect(claim.success).toBe(true);
    expect(claim.rewardAmount).toBe(5.00);
    expect(claim.claimedDay).toBe(2);
    expect(claim.nextStreakDay).toBe(3);
  });

  it('resets streak to Day 1 when interval exceeds 36-hour grace period', () => {
    const lastClaim = BASE_TIME;
    // 40 hours later (exceeds 36-hour grace period)
    const now = lastClaim + 40 * 60 * 60 * 1000;

    const eligibility = DailyClaimManager.checkEligibility(lastClaim, 5, now);
    expect(eligibility.status).toBe('EXPIRED_RESET');
    expect(eligibility.effectiveDay).toBe(1);

    const claim = DailyClaimManager.processClaim(lastClaim, 5, now);
    expect(claim.success).toBe(true);
    expect(claim.rewardAmount).toBe(2.00); // Resets to Day 1 (+2.00 USDT)
    expect(claim.claimedDay).toBe(1);
    expect(claim.nextStreakDay).toBe(2);
  });

  it('awards Day 7 grand reward + mystery box and wraps back to Day 1', () => {
    const lastClaim = BASE_TIME;
    const now = lastClaim + 25 * 60 * 60 * 1000;

    const claim = DailyClaimManager.processClaim(lastClaim, 7, now);
    expect(claim.success).toBe(true);
    expect(claim.rewardAmount).toBe(50.00);
    expect(claim.mysteryBoxAwarded).toBe(true);
    expect(claim.nextStreakDay).toBe(1); // Cycles back
  });

  it('formats countdown timer accurately', () => {
    expect(DailyClaimManager.formatCountdown(0)).toBe('READY');
    expect(DailyClaimManager.formatCountdown(-500)).toBe('READY');
    // 1 hour, 2 minutes, 3 seconds = 3723000ms
    expect(DailyClaimManager.formatCountdown(3723000)).toBe('01:02:03');
  });
});
