import { describe, it, expect, beforeEach } from 'vitest';
import { getAddress } from 'viem';
import { Web3AuthService } from '../Web3AuthService';
import { useAuthStore } from '@/stores/useAuthStore';

describe('Web3AuthService & SIWE Authentication', () => {
  const sampleAddress = getAddress('0x71c8F7e41c48d20A51f28b7e283f15A20C2619e6');

  beforeEach(() => {
    useAuthStore.getState().disconnectWallet();
  });

  it('generates cryptographic nonces of appropriate length and character set', () => {
    const nonce1 = Web3AuthService.generateNonce();
    const nonce2 = Web3AuthService.generateNonce();

    expect(nonce1).toBeDefined();
    expect(nonce1.length).toBe(16);
    expect(nonce2).toBeDefined();
    expect(nonce2.length).toBe(16);
    expect(nonce1).not.toBe(nonce2);
  });

  it('constructs a standardized EIP-4361 SIWE challenge string', () => {
    const nonce = 'A1B2C3D4E5F6G7H8';
    const issuedAt = '2026-09-13T12:00:00.000Z';
    const message = Web3AuthService.createSiweMessage({
      address: sampleAddress,
      nonce,
      issuedAt,
      chainId: 1,
      uri: 'https://cryptoos98.finance',
    });

    expect(message).toContain('cryptoos98.finance wants you to sign in with your Ethereum account:');
    expect(message).toContain(sampleAddress);
    expect(message).toContain('Nonce: A1B2C3D4E5F6G7H8');
    expect(message).toContain('Chain ID: 1');
    expect(message).toContain('Issued At: 2026-09-13T12:00:00.000Z');
    expect(message).toContain('Sign-In to CryptoOS 98 Degen Trading Terminal. Zero gas fees required.');
  });

  it('formats and truncates 0x Ethereum addresses for retro Windows 98 chrome', () => {
    expect(Web3AuthService.truncateAddress(sampleAddress)).toBe('0x71c8...19e6');
    expect(Web3AuthService.truncateAddress(null)).toBe('0x00...0000');
    expect(Web3AuthService.truncateAddress('short')).toBe('short');
  });

  it('generates deterministic retro blockie palettes from wallet address', () => {
    const palette1 = Web3AuthService.getAddressPalette(sampleAddress);
    const palette2 = Web3AuthService.getAddressPalette(sampleAddress);

    expect(palette1).toEqual(palette2);
    expect(palette1.primary).toBeDefined();
    expect(palette1.secondary).toBeDefined();
    expect(palette1.accent).toBeDefined();
  });

  it('initializes auth state in anonymous guest mode with starter defaults', () => {
    const state = useAuthStore.getState();
    expect(state.isGuest).toBe(true);
    expect(state.isConnected).toBe(false);
    expect(state.walletAddress).toBeNull();
    expect(state.username).toBe('Guest_Degen');
    expect(state.rankTier).toBe('Novice Liquidator');
  });

  it('correctly switches to guest and resets wallet connection', () => {
    useAuthStore.setState({
      isConnected: true,
      isGuest: false,
      walletAddress: sampleAddress.toLowerCase(),
      username: 'ChadTrader_98',
    });

    expect(useAuthStore.getState().isConnected).toBe(true);
    expect(useAuthStore.getState().walletAddress).toBe(sampleAddress.toLowerCase());

    useAuthStore.getState().disconnectWallet();

    const afterDisconnect = useAuthStore.getState();
    expect(afterDisconnect.isGuest).toBe(true);
    expect(afterDisconnect.isConnected).toBe(false);
    expect(afterDisconnect.walletAddress).toBeNull();
    expect(afterDisconnect.username).toBe('Guest_Degen');
  });

  it('toggles connect wallet modal open and close states', () => {
    expect(useAuthStore.getState().isConnectModalOpen).toBe(false);
    useAuthStore.getState().openConnectModal();
    expect(useAuthStore.getState().isConnectModalOpen).toBe(true);
    useAuthStore.getState().closeConnectModal();
    expect(useAuthStore.getState().isConnectModalOpen).toBe(false);
  });
});
