/**
 * DailyClaimManager.ts
 * Procedural logic for 7-Day reward claim engine in CryptoOS 98.
 * Enforces 24-hour unlock cooldown and 36-hour grace period streak resets.
 */

export interface DailyRewardTier {
  day: number;
  reward: number;
  label: string;
  mysteryBox?: boolean;
}

export const DAILY_REWARD_TIERS: readonly DailyRewardTier[] = [
  { day: 1, reward: 2.00, label: '+2.00 USDT' },
  { day: 2, reward: 5.00, label: '+5.00 USDT' },
  { day: 3, reward: 8.00, label: '+8.00 USDT' },
  { day: 4, reward: 10.00, label: '+10.00 USDT' },
  { day: 5, reward: 15.00, label: '+15.00 USDT' },
  { day: 6, reward: 25.00, label: '+25.00 USDT' },
  { day: 7, reward: 50.00, label: '+50.00 USDT + Mystery Box', mysteryBox: true },
] as const;

export const CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 Hours
export const CLAIM_GRACE_PERIOD_MS = 36 * 60 * 60 * 1000; // 36 Hours

export type ClaimStatus = 'READY' | 'COOLDOWN' | 'EXPIRED_RESET';

export interface EligibilityResult {
  status: ClaimStatus;
  effectiveDay: number;
  timeRemainingMs: number;
  cooldownProgress: number; // 0 to 1
  tier: DailyRewardTier;
}

export interface ClaimExecutionResult {
  success: boolean;
  rewardAmount: number;
  claimedDay: number;
  nextStreakDay: number;
  mysteryBoxAwarded: boolean;
  error?: string;
}

export class DailyClaimManager {
  /**
   * Determine whether a user can claim today's reward or if they are on cooldown / expired streak.
   */
  public static checkEligibility(
    lastClaimTimestamp: number,
    currentStreakDay: number,
    now: number = Date.now()
  ): EligibilityResult {
    const safeDay = Math.min(Math.max(currentStreakDay || 1, 1), 7);

    // If never claimed before, user is immediately ready for Day 1
    if (!lastClaimTimestamp || lastClaimTimestamp <= 0) {
      return {
        status: 'READY',
        effectiveDay: safeDay,
        timeRemainingMs: 0,
        cooldownProgress: 1,
        tier: DAILY_REWARD_TIERS[safeDay - 1],
      };
    }

    const elapsed = now - lastClaimTimestamp;

    // Case 1: Still within 24-hour cooldown
    if (elapsed < CLAIM_COOLDOWN_MS) {
      const timeRemainingMs = CLAIM_COOLDOWN_MS - elapsed;
      const progress = Math.min(Math.max(elapsed / CLAIM_COOLDOWN_MS, 0), 1);
      return {
        status: 'COOLDOWN',
        effectiveDay: safeDay,
        timeRemainingMs,
        cooldownProgress: progress,
        tier: DAILY_REWARD_TIERS[safeDay - 1],
      };
    }

    // Case 2: Elapsed between 24h and 36h -> Streak preserved, ready to claim
    if (elapsed <= CLAIM_GRACE_PERIOD_MS) {
      return {
        status: 'READY',
        effectiveDay: safeDay,
        timeRemainingMs: 0,
        cooldownProgress: 1,
        tier: DAILY_REWARD_TIERS[safeDay - 1],
      };
    }

    // Case 3: Elapsed > 36 hours -> Streak expired, resets to Day 1
    return {
      status: 'EXPIRED_RESET',
      effectiveDay: 1,
      timeRemainingMs: 0,
      cooldownProgress: 1,
      tier: DAILY_REWARD_TIERS[0],
    };
  }

  /**
   * Execute the reward claim calculation.
   */
  public static processClaim(
    lastClaimTimestamp: number,
    currentStreakDay: number,
    now: number = Date.now()
  ): ClaimExecutionResult {
    const eligibility = this.checkEligibility(lastClaimTimestamp, currentStreakDay, now);

    if (eligibility.status === 'COOLDOWN') {
      const hours = Math.ceil(eligibility.timeRemainingMs / (1000 * 60 * 60));
      return {
        success: false,
        rewardAmount: 0,
        claimedDay: currentStreakDay,
        nextStreakDay: currentStreakDay,
        mysteryBoxAwarded: false,
        error: `Daily reward is on cooldown. Unlock in ~${hours}h.`,
      };
    }

    const dayToClaim = eligibility.effectiveDay;
    const tier = DAILY_REWARD_TIERS[dayToClaim - 1];
    const nextStreakDay = dayToClaim >= 7 ? 1 : dayToClaim + 1;

    return {
      success: true,
      rewardAmount: tier.reward,
      claimedDay: dayToClaim,
      nextStreakDay,
      mysteryBoxAwarded: !!tier.mysteryBox,
    };
  }

  /**
   * Format remaining milliseconds to HH:MM:SS
   */
  public static formatCountdown(ms: number): string {
    if (ms <= 0) return 'READY';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
