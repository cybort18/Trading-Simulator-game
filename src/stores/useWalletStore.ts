import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStateStorage } from '@/utils/safeStorage';

export interface WalletState {
  equity: number;
  availableMargin: number;
  lockedMargin: number;
  realizedPnl: number;
  winCount: number;
  lossCount: number;
  totalTrades: number;
  initialBalance: number;

  // Actions
  lockMargin: (amount: number) => boolean;
  unlockMargin: (amount: number) => void;
  deductFee: (fee: number) => void;
  recordTradeResult: (pnl: number, returnedMargin: number) => void;
  applyFundingPayment: (payment: number) => void;
  recalculateEquity: (totalUnrealizedPnl: number) => void;
  claimFaucet: (amount?: number) => boolean;
  resetWallet: (amount?: number) => void;

  // Computed getters
  getWinRate: () => number;
  getAllTimeRoi: () => number;
  isFaucetAvailable: () => boolean;
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

      lockMargin: (amount: number) => {
        const state = get();
        if (amount <= 0 || state.availableMargin < amount) {
          return false;
        }
        set({
          availableMargin: Math.max(0, state.availableMargin - amount),
          lockedMargin: state.lockedMargin + amount,
        });
        return true;
      },

      unlockMargin: (amount: number) => {
        const state = get();
        const unlockAmount = Math.min(state.lockedMargin, Math.max(0, amount));
        set({
          lockedMargin: Math.max(0, state.lockedMargin - unlockAmount),
          availableMargin: state.availableMargin + unlockAmount,
        });
      },

      deductFee: (fee: number) => {
        if (fee <= 0) return;
        set((state) => {
          const newAvail = Math.max(0, state.availableMargin - fee);
          const newEquity = Math.max(0, state.equity - fee);
          return {
            availableMargin: newAvail,
            equity: newEquity,
          };
        });
      },

      recordTradeResult: (pnl: number, returnedMargin: number) => {
        set((state) => {
          // Release locked margin
          const newLocked = Math.max(0, state.lockedMargin - returnedMargin);
          // Credit returned margin + pnl into available margin
          const netReturn = returnedMargin + pnl;
          const newAvail = Math.max(0, state.availableMargin + netReturn);
          const newRealizedPnl = state.realizedPnl + pnl;
          const newTotalTrades = state.totalTrades + 1;
          const newWinCount = pnl > 0 ? state.winCount + 1 : state.winCount;
          const newLossCount = pnl < 0 ? state.lossCount + 1 : state.lossCount;

          return {
            lockedMargin: newLocked,
            availableMargin: newAvail,
            equity: newAvail + newLocked,
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
          const newAvail = Math.max(0, state.availableMargin - payment);
          const newEquity = Math.max(0, state.equity - payment);
          return {
            availableMargin: newAvail,
            equity: newEquity,
          };
        });
      },

      recalculateEquity: (totalUnrealizedPnl: number) => {
        set((state) => ({
          equity: Math.max(0, state.availableMargin + state.lockedMargin + totalUnrealizedPnl),
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
      name: 'cryptoos98-wallet-storage',
      storage: createJSONStorage(() => safeStateStorage),
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
      }),
    }
  )
);
