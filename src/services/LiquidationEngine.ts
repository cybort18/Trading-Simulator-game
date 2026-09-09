import { useEffect } from 'react';
import { useTradingStore } from '@/stores/useTradingStore';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { TradingPair } from '@/types/market';
import { Position } from '@/types/trading';

export class LiquidationEngineService {
  private isRunning: boolean = false;
  private unsubscribeMarket: (() => void) | null = null;
  private onLiquidationCallback?: (liquidatedPositions: Position[]) => void;

  /**
   * Start reactive high-frequency scanner loop
   */
  public start(onLiquidation?: (liquidatedPositions: Position[]) => void): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.onLiquidationCallback = onLiquidation;

    // Subscribe to real-time market data ticks
    this.unsubscribeMarket = useMarketDataStore.subscribe((marketState) => {
      this.evaluateTicks(marketState.tickers);
    });

    // Run initial scan
    const currentTickers = useMarketDataStore.getState().tickers;
    this.evaluateTicks(currentTickers);
  }

  /**
   * Stop scanner loop
   */
  public stop(): void {
    if (!this.isRunning) return;
    if (this.unsubscribeMarket) {
      this.unsubscribeMarket();
      this.unsubscribeMarket = null;
    }
    this.isRunning = false;
  }

  /**
   * Evaluate tick updates against all active positions
   * Returns list of position IDs that were liquidated in this tick
   */
  public evaluateTicks(tickers: Record<TradingPair, { price: number } | undefined>): string[] {
    const tradingStore = useTradingStore.getState();
    const positions = tradingStore.positions;
    if (positions.length === 0) return [];

    // 1. Build price map
    const priceMap: Record<string, number> = {};
    for (const [pair, ticker] of Object.entries(tickers)) {
      if (ticker?.price && ticker.price > 0) {
        priceMap[pair] = ticker.price;
      }
    }

    // 2. Batch update uPnL and ROE for all open positions
    tradingStore.updatePricesAndPnL(priceMap);

    // 3. Scan for liquidation conditions
    const liquidatedIds: string[] = [];
    const liquidatedPositions: Position[] = [];

    // Re-fetch latest positions after update
    const currentPositions = useTradingStore.getState().positions;

    for (const position of currentPositions) {
      const currentPrice = priceMap[position.pair];
      if (!currentPrice || currentPrice <= 0) continue;

      let isLiquidated = false;

      // LONG: liquidated if Mark Price plunges down to or below Liquidation Price
      if (position.direction === 'LONG' && currentPrice <= position.liquidationPrice) {
        isLiquidated = true;
      }
      // SHORT: liquidated if Mark Price spikes up to or above Liquidation Price
      else if (position.direction === 'SHORT' && currentPrice >= position.liquidationPrice) {
        isLiquidated = true;
      }

      if (isLiquidated) {
        liquidatedIds.push(position.id);
        liquidatedPositions.push(position);
        tradingStore.forceLiquidatePosition(position.id, currentPrice);
      }
    }

    // 4. Trigger callback if any positions were liquidated
    if (liquidatedPositions.length > 0 && this.onLiquidationCallback) {
      this.onLiquidationCallback(liquidatedPositions);
    }

    return liquidatedIds;
  }

  public getStatus(): boolean {
    return this.isRunning;
  }
}

// Singleton export
export const liquidationEngine = new LiquidationEngineService();

/**
 * React Hook to attach the liquidation scanner to component lifecycle
 */
export function useLiquidationScanner(): void {
  useEffect(() => {
    liquidationEngine.start();
    return () => {
      liquidationEngine.stop();
    };
  }, []);
}
