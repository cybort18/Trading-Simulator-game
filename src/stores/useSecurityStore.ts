import { create } from 'zustand';
import { safeStateStorage } from '@/utils/safeStorage';
import { CRYPTOOS_STATE_STORAGE_KEY, sealState } from '@/utils/security';

export interface SecurityState {
  isBSODActive: boolean;
  violationReason: string | null;
  triggerBSOD: (reason: string) => void;
  recoverFromBSOD: () => void;
}

export const useSecurityStore = create<SecurityState>((set) => ({
  isBSODActive: false,
  violationReason: null,

  triggerBSOD: (reason: string) => {
    console.error(`[CryptoOS 98 Security Kernel] BSOD TRIGGERED: ${reason}`);
    set({ isBSODActive: true, violationReason: reason });
  },

  recoverFromBSOD: () => {
    // Reset to pristine 10.00 USDT starting state
    const cleanDefaultState = {
      equity: 10.00,
      availableMargin: 10.00,
      lockedMargin: 0.00,
      realizedPnl: 0.00,
      winCount: 0,
      lossCount: 0,
      totalTrades: 0,
      initialBalance: 10.00,
      currentStreakDay: 1,
      lastClaimTimestamp: 0,
    };

    const sealed = sealState(cleanDefaultState);
    safeStateStorage.setItem(CRYPTOOS_STATE_STORAGE_KEY, sealed);

    set({ isBSODActive: false, violationReason: null });

    // Force refresh or store update if in browser
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  },
}));
