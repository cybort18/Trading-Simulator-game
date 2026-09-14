import React, { useEffect } from 'react';
import { DesktopCanvas } from '@/components/desktop/DesktopCanvas';
import { BinanceWsService } from '@/services/BinanceWsService';
import { useLiquidationScanner } from '@/services/LiquidationEngine';
import { useAuthStore } from '@/stores/useAuthStore';

export const App: React.FC = () => {
  // Mount high-frequency reactive liquidation scanner
  useLiquidationScanner();

  useEffect(() => {
    // Mount Binance real-time WebSocket multiplexed streams
    const ws = BinanceWsService.getInstance();
    ws.connect();

    return () => {
      ws.disconnect();
    };
  }, []);

  // Web3 EIP-1193 account & network change watchdog
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ethereum = (window as unknown as { ethereum?: { on?: (event: string, cb: (...args: any[]) => void) => void; removeListener?: (event: string, cb: (...args: any[]) => void) => void } }).ethereum;
    if (!ethereum || typeof ethereum.on !== 'function') return;

    const handleAccountsChanged = (accounts: string[]) => {
      const currentAddress = useAuthStore.getState().walletAddress;
      if (!currentAddress) return;

      if (accounts.length === 0) {
        useAuthStore.getState().disconnectWallet();
      } else if (accounts[0].toLowerCase() !== currentAddress.toLowerCase()) {
        useAuthStore.getState().disconnectWallet();
        useAuthStore.getState().openConnectModal();
      }
    };

    const handleChainChanged = () => {
      console.log('[CryptoOS 98 Web3 Kernel] Network chain changed in wallet extension');
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (typeof ethereum.removeListener === 'function') {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return <DesktopCanvas />;
};

export default App;
