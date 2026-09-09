import React, { useEffect } from 'react';
import { DesktopCanvas } from '@/components/desktop/DesktopCanvas';
import { BinanceWsService } from '@/services/BinanceWsService';
import { useLiquidationScanner } from '@/services/LiquidationEngine';

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

  return <DesktopCanvas />;
};

export default App;
