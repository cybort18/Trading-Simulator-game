import React, { useEffect } from 'react';
import { DesktopCanvas } from '@/components/desktop/DesktopCanvas';
import { BinanceWsService } from '@/services/BinanceWsService';

export const App: React.FC = () => {
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
