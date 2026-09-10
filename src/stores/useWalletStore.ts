import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { roundCurrency } from '@/utils/simulationMath';
import { createTamperProtectedStorage } from '@/utils/tamperProtectedStorage';
import { CRYPTOOS_STATE_STORAGE_KEY } from '@/utils/security';
import {
  DailyClaimManager,
  DAILY_REWARD_TIERS,
  type DailyRewardTier,
} from '@/services/DailyClaimManager';

export { DAILY_REWARD_TIERS, type DailyRewardTier };

export interface WalletState {
  equity: number;
  availableMargin: number;
  lockedMargin: number;
  realizedPnl: number;
  winCount: number;
  lossCount: number;
  totalTrades: number;
  initialBalance: number;
  currentStreakDay: number;
  lastClaimTimestamp: number;

  // Actions
  lockMargin: (amount: number) => boolean;
  unlockMargin: (amount: number) => void;
  deductFee: (fee: number) => void;
  recordTradeResult: (pnl: number, returnedMargin: number) => void;
  applyFundingPayment: (payment: number) => void;
  recalculateEquity: (totalUnrealizedPnl: number) => void;
  claimFaucet: (amount?: number) => boolean;
  claimDailyReward: () => { success: boolean; amount?: number; error?: string };
  resetWallet: (amount?: number) => void;

  // Computed getters
  getWinRate: () => number;
  getAllTimeRoi: () => number;
  isFaucetAvailable: () => boolean;
  getTimeUntilNextDailyClaim: () => number;
}

const DEFAULT_STARTING_BALANCE = 10.00;

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      equity: DEFAULT_STARTING_BALANCE,
      availableMargin: DEFAULT_STARTING_BALANCE,
      lockedMargin: 0.00,
      realizedPnl: 0.00,
      winCount: 0,
      lossCount: 0,
      totalTrades: 0,
      initialBalance: DEFAULT_STARTING_BALANCE,
      currentStreakDay: 1,
      lastClaimTimestamp: 0,

      lockMargin: (amount: number) => {
        const state = get();
        if (amount <= 0 || state.availableMargin < amount) {
          return false;
        }
        set({
          availableMargin: roundCurrency(Math.max(0, state.availableMargin - amount)),
          lockedMargin: roundCurrency(state.lockedMargin + amount),
        });
        return true;
      },

      unlockMargin: (amount: number) => {
        const state = get();
        const unlockAmount = Math.min(state.lockedMargin, Math.max(0, amount));
        set({
          lockedMargin: roundCurrency(Math.max(0, state.lockedMargin - unlockAmount)),
          availableMargin: roundCurrency(state.availableMargin + unlockAmount),
        });
      },

      deductFee: (fee: number) => {
        if (fee <= 0) return;
        set((state) => {
          const newAvail = roundCurrency(Math.max(0, state.availableMargin - fee));
          const newEquity = roundCurrency(Math.max(0, state.equity - fee));
          return {
            availableMargin: newAvail,
            equity: newEquity,
          };
        });
      },

      recordTradeResult: (pnl: number, returnedMargin: number) => {
        set((state) => {
          // Release locked margin
          const newLocked = roundCurrency(Math.max(0, state.lockedMargin - returnedMargin));
          // Credit returned margin + pnl into available margin
          const netReturn = returnedMargin + pnl;
          const newAvail = roundCurrency(Math.max(0, state.availableMargin + netReturn));
          const newRealizedPnl = roundCurrency(state.realizedPnl + pnl);
          const newTotalTrades = state.totalTrades + 1;
          const newWinCount = pnl > 0 ? state.winCount + 1 : state.winCount;
          const newLossCount = pnl < 0 ? state.lossCount + 1 : state.lossCount;

          return {
            lockedMargin: newLocked,
            availableMargin: newAvail,
            equity: roundCurrency(newAvail + newLocked),
            realizedPnl: newRealizedPnl,
            totalTrades: newTotalTrades,
            winCount: newWinCount,
            lossCount: newLossCount,
          };
        });
      },

      applyFundingPayment: (payment: number) => {
        // Positive payment = trader pays funding (deduction)
        // Negative payment = trader receives funding (credit)
        set((state) => {
          const newAvail = roundCurrency(Math.max(0, state.availableMargin - payment));
          const newEquity = roundCurrency(Math.max(0, state.equity - payment));
          return {
            availableMargin: newAvail,
            equity: newEquity,
          };
        });
      },

      recalculateEquity: (totalUnrealizedPnl: number) => {
        set((state) => ({
          equity: roundCurrency(Math.max(0, state.availableMargin + state.lockedMargin + totalUnrealizedPnl)),
        }));
      },

      claimFaucet: (amount: number = 10.00) => {
        const state = get();
        if (state.equity < 1.00) {
          set({
            equity: state.equity + amount,
            availableMargin: state.availableMargin + amount,
          });
          return true;
        }
        return false;
      },

      claimDailyReward: () => {
        const state = get();
        const now = Date.now();
        const res = DailyClaimManager.processClaim(state.lastClaimTimestamp, state.currentStreakDay, now);

        if (!res.success) {
          return { success: false, error: res.error };
        }

        set({
          availableMargin: roundCurrency(state.availableMargin + res.rewardAmount),
          equity: roundCurrency(state.equity + res.rewardAmount),
          currentStreakDay: res.nextStreakDay,
          lastClaimTimestamp: now,
        });

        return { success: true, amount: res.rewardAmount };
      },

      getTimeUntilNextDailyClaim: () => {
        const { lastClaimTimestamp, currentStreakDay } = get();
        const eligibility = DailyClaimManager.checkEligibility(lastClaimTimestamp, currentStreakDay);
        return eligibility.timeRemainingMs;
      },

      resetWallet: (amount: number = DEFAULT_STARTING_BALANCE) => {
        set({
          equity: amount,
          availableMargin: amount,
          lockedMargin: 0.00,
          realizedPnl: 0.00,
          winCount: 0,
          lossCount: 0,
          totalTrades: 0,
          initialBalance: amount,
          currentStreakDay: 1,
          lastClaimTimestamp: 0,
        });
      },

      getWinRate: () => {
        const { totalTrades, winCount } = get();
        if (totalTrades === 0) return 0;
        return (winCount / totalTrades) * 100;
      },

      getAllTimeRoi: () => {
        const { equity, initialBalance } = get();
        if (initialBalance <= 0) return 0;
        return ((equity - initialBalance) / initialBalance) * 100;
      },

      isFaucetAvailable: () => {
        return get().equity < 1.00;
      },
    }),
    {
      name: CRYPTOOS_STATE_STORAGE_KEY,
      storage: createJSONStorage(() => createTamperProtectedStorage(CRYPTOOS_STATE_STORAGE_KEY)),
      // Persist numerical state
      partialize: (state) => ({
        equity: state.equity,
        availableMargin: state.availableMargin,
        lockedMargin: state.lockedMargin,
        realizedPnl: state.realizedPnl,
        winCount: state.winCount,
        lossCount: state.lossCount,
        totalTrades: state.totalTrades,
        initialBalance: state.initialBalance,
        currentStreakDay: state.currentStreakDay,
        lastClaimTimestamp: state.lastClaimTimestamp,
      }),
    }
  )
);
