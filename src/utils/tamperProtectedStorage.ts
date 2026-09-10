import { StateStorage } from 'zustand/middleware';
import { safeStateStorage } from '@/utils/safeStorage';
import { sealState, unsealState } from '@/utils/security';
import { useSecurityStore } from '@/stores/useSecurityStore';

/**
 * Creates a tamper-protected StateStorage adapter for Zustand persist.
 * Automatically signs saved states with a cryptographic checksum and validates
 * integrity on load. Triggers BSOD if an unauthorized modification is detected.
 */
export const createTamperProtectedStorage = (storageKeyOverride?: string): StateStorage => {
  return {
    getItem: (name: string): string | null => {
      const targetKey = storageKeyOverride || name;
      const raw = safeStateStorage.getItem(targetKey);
      if (!raw || typeof raw !== 'string') return null;

      const unsealed = unsealState(raw);
      if (!unsealed.isValid) {
        useSecurityStore.getState().triggerBSOD(
          unsealed.tamperReason || 'Data integrity check failed: Illegal equity tampering detected.'
        );
        return null;
      }

      // If the unsealed state was wrapped in Zustand's standard { state, version } envelope
      if (unsealed.state && typeof unsealed.state === 'object') {
        if ('state' in unsealed.state) {
          return JSON.stringify(unsealed.state);
        }
        return JSON.stringify({ state: unsealed.state, version: 0 });
      }

      return raw;
    },

    setItem: (name: string, value: string): void => {
      const targetKey = storageKeyOverride || name;
      try {
        const parsed = JSON.parse(value);
        const stateToSeal = parsed && typeof parsed === 'object' && 'state' in parsed ? parsed.state : parsed;
        const sealedEnvelope = sealState(stateToSeal);
        safeStateStorage.setItem(targetKey, sealedEnvelope);
      } catch {
        safeStateStorage.setItem(targetKey, value);
      }
    },

    removeItem: (name: string): void => {
      const targetKey = storageKeyOverride || name;
      safeStateStorage.removeItem(targetKey);
    },
  };
};
