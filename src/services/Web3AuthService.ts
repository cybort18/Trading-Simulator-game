import { recoverMessageAddress, getAddress } from 'viem';

export interface SiweAuthResult {
  address: string;
  signature: string;
  message: string;
  nonce: string;
}

export class Web3AuthService {
  /**
   * Checks if an EIP-1193 compatible Ethereum provider is injected into the browser.
   */
  public static isWalletAvailable(): boolean {
    return typeof window !== 'undefined' && Boolean((window as unknown as { ethereum?: unknown }).ethereum);
  }

  /**
   * Generates a random cryptographic nonce for SIWE.
   */
  public static generateNonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const buffer = new Uint8Array(16);
      crypto.getRandomValues(buffer);
      for (let i = 0; i < 16; i++) {
        result += chars[buffer[i] % chars.length];
      }
    } else {
      for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    return result;
  }

  /**
   * Extracts hostname/authority from a URI.
   */
  public static getDomainFromUri(uri: string): string {
    try {
      const parsed = new URL(uri);
      return parsed.host;
    } catch {
      return uri.replace(/^https?:\/\//, '').split('/')[0] || 'cryptoos98.finance';
    }
  }

  /**
   * Creates a standardized Sign-In with Ethereum (SIWE / EIP-4361) challenge message.
   * Ensures domain and URI are 100% compliant with EIP-4361 to prevent spoofing alerts in MetaMask/Blockaid.
   */
  public static createSiweMessage(params: {
    address: string;
    nonce: string;
    domain?: string;
    issuedAt?: string;
    chainId?: number;
    uri?: string;
    statement?: string;
  }): string {
    const defaultUri = typeof window !== 'undefined' ? window.location.origin : 'https://cryptoos98.finance';
    const uri = params.uri || defaultUri;

    // In EIP-4361: domain MUST match the authority of the URI
    const defaultDomain = typeof window !== 'undefined' && window.location.host
      ? window.location.host
      : Web3AuthService.getDomainFromUri(uri);

    const domain = params.domain || defaultDomain || 'cryptoos98.finance';
    const issuedAt = params.issuedAt || new Date().toISOString();
    const chainId = params.chainId ?? 1;
    const statement = params.statement || 'Sign-In to CryptoOS 98 Degen Trading Terminal. Zero gas fees required.';
    const formattedAddress = getAddress(params.address);

    return [
      `${domain} wants you to sign in with your Ethereum account:`,
      `${formattedAddress}`,
      ``,
      `${statement}`,
      ``,
      `URI: ${uri}`,
      `Version: 1`,
      `Chain ID: ${chainId}`,
      `Nonce: ${params.nonce}`,
      `Issued At: ${issuedAt}`,
    ].join('\n');
  }

  /**
   * Formats a 0x address into a retro truncated format: e.g. 0x71...c0ff
   */
  public static truncateAddress(address: string | null | undefined): string {
    if (!address) return '0x00...0000';
    try {
      const clean = address.trim();
      if (clean.length < 10) return clean;
      return `${clean.substring(0, 6)}...${clean.substring(clean.length - 4)}`;
    } catch {
      return address;
    }
  }

  /**
   * Generates deterministic retro blockie style colors based on wallet address bytes.
   */
  public static getAddressPalette(address: string): { primary: string; secondary: string; accent: string } {
    const defaultPalette = { primary: '#000080', secondary: '#008531', accent: '#FFAA00' };
    if (!address || address.length < 10) return defaultPalette;

    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = (hash << 5) - hash + address.charCodeAt(i);
      hash |= 0;
    }

    const palettes = [
      { primary: '#000080', secondary: '#008531', accent: '#FFAA00' }, // Navy, Green, Amber
      { primary: '#800080', secondary: '#008080', accent: '#FFD700' }, // Purple, Teal, Gold
      { primary: '#800000', secondary: '#000080', accent: '#00FF66' }, // Maroon, Navy, Neon Green
      { primary: '#008080', secondary: '#800000', accent: '#00E5FF' }, // Teal, Maroon, Cyan
      { primary: '#1B365D', secondary: '#D97706', accent: '#10B981' }, // Deep Blue, Amber, Emerald
    ];

    const idx = Math.abs(hash) % palettes.length;
    return palettes[idx];
  }

  /**
   * Requests connection to the injected wallet and signs the SIWE challenge.
   */
  public static async requestWalletLogin(): Promise<SiweAuthResult> {
    if (!this.isWalletAvailable()) {
      throw new Error('No Web3 wallet extension detected (e.g. MetaMask, Rabby, Coinbase). Please install one to connect.');
    }

    const ethereum = (window as unknown as { ethereum: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;

    // 1. Request user accounts
    const accounts = (await ethereum.request({
      method: 'eth_requestAccounts',
    })) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('No Ethereum accounts authorized by user.');
    }

    const rawAddress = accounts[0];
    const checksumAddress = getAddress(rawAddress);
    const nonce = this.generateNonce();

    // 1b. Dynamically query active chain ID from provider
    let chainId = 1;
    try {
      const hexChainId = (await ethereum.request({ method: 'eth_chainId' })) as string;
      if (hexChainId) {
        chainId = parseInt(hexChainId, 16) || 1;
      }
    } catch {
      chainId = 1;
    }

    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://cryptoos98.finance';
    const currentHost = typeof window !== 'undefined' ? window.location.host : 'cryptoos98.finance';

    const message = this.createSiweMessage({
      address: checksumAddress,
      nonce,
      domain: currentHost,
      uri: currentOrigin,
      chainId,
    });

    // 2. Request cryptographic signature (zero gas)
    const signature = (await ethereum.request({
      method: 'personal_sign',
      params: [message, checksumAddress],
    })) as string;

    if (!signature) {
      throw new Error('Signature was rejected by user.');
    }

    // 3. Cryptographically verify signature locally
    const isValid = await this.verifySignature(checksumAddress, message, signature);
    if (!isValid) {
      throw new Error('Cryptographic signature verification failed.');
    }

    return {
      address: checksumAddress.toLowerCase(),
      signature,
      message,
      nonce,
    };
  }

  /**
   * Cryptographically recovers the address from a signed message and verifies match.
   */
  public static async verifySignature(
    expectedAddress: string,
    message: string,
    signature: string
  ): Promise<boolean> {
    try {
      const recovered = await recoverMessageAddress({
        message,
        signature: signature as `0x${string}`,
      });
      return recovered.toLowerCase() === expectedAddress.toLowerCase();
    } catch (err) {
      console.error('[Web3AuthService] verifySignature error:', err);
      return false;
    }
  }

  /**
   * Subscribes to EIP-1193 provider events (accountsChanged, chainChanged).
   */
  public static subscribeProviderEvents(handlers: {
    onAccountsChanged?: (accounts: string[]) => void;
    onChainChanged?: (chainId: string) => void;
  }): () => void {
    if (typeof window === 'undefined') return () => {};
    const ethereum = (window as unknown as { ethereum?: { on?: (event: string, cb: (...args: any[]) => void) => void; removeListener?: (event: string, cb: (...args: any[]) => void) => void } }).ethereum;
    if (!ethereum || typeof ethereum.on !== 'function') return () => {};

    const handleAccounts = (accounts: string[]) => {
      handlers.onAccountsChanged?.(accounts);
    };

    const handleChain = (chainId: string) => {
      handlers.onChainChanged?.(chainId);
    };

    ethereum.on('accountsChanged', handleAccounts);
    ethereum.on('chainChanged', handleChain);

    return () => {
      if (typeof ethereum.removeListener === 'function') {
        ethereum.removeListener('accountsChanged', handleAccounts);
        ethereum.removeListener('chainChanged', handleChain);
      }
    };
  }
}
