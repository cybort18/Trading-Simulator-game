import { useEffect } from 'react';
import { useTradingStore } from '@/stores/useTradingStore';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { TradingPair } from '@/types/market';
import { Position } from '@/types/trading';
import { evaluateCrossMarginPortfolio } from '@/utils/simulationMath';
import { soundFXService } from '@/services/SoundFXService';

export class LiquidationEngineService {
  private isRunning: boolean = false;
  private unsubscribeMarket: (() => void) | null = null;
  private onLiquidationCallback?: (liquidatedPositions: Position[]) => void;

  // Throttle control for React UI updates during high-frequency WS tick storms
  private lastUiUpdateTime: number = 0;
  private throttleIntervalMs: number = 100; // Cap UI re-renders to max ~10 FPS
  private pendingPriceMap: Record<string, number> = {};
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Start reactive high-frequency scanner loop
   */
  public start(onLiquidation?: (liquidatedPositions: Position[]) => void): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.onLiquidationCallback = onLiquidation;

    // Subscribe to real-time market data ticks from Binance WS
    this.unsubscribeMarket = useMarketDataStore.subscribe((marketState) => {
      this.handleTick(marketState.tickers);
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
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    this.isRunning = false;
  }

  /**
   * High-frequency tick handler:
   * - Performs ZERO-DELAY instant liquidation check
   * - Throttles React state dispatching to avoid frame drops during tick storms
   */
  public handleTick(tickers: Record<TradingPair, { price: number } | undefined>): void {
    const now = Date.now();

    // 1. Build price map
    const priceMap: Record<string, number> = {};
    for (const [pair, ticker] of Object.entries(tickers)) {
      if (ticker?.price && ticker.price > 0) {
        priceMap[pair] = ticker.price;
        this.pendingPriceMap[pair] = ticker.price;
      }
    }

    // 2. Immediate zero-delay liquidation scan
    const liquidatedIds = this.scanLiquidationBreaches(priceMap);

    // 3. Throttle React store UI PnL update (unless liquidation occurred, in which case flush immediately)
    if (liquidatedIds.length > 0 || now - this.lastUiUpdateTime >= this.throttleIntervalMs) {
      this.flushUiUpdate();
    } else if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => {
        this.flushUiUpdate();
      }, this.throttleIntervalMs);
    }
  }

  /**
   * Flushes batched price & PnL updates to Zustand store
   */
  public flushUiUpdate(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    this.lastUiUpdateTime = Date.now();

    if (Object.keys(this.pendingPriceMap).length > 0) {
      useTradingStore.getState().updatePricesAndPnL(this.pendingPriceMap);
      this.pendingPriceMap = {};
    }
  }

  /**
   * Evaluates tick updates synchronously (used in tests and direct checks)
   */
  public evaluateTicks(tickers: Record<TradingPair, { price: number } | undefined>): string[] {
    const priceMap: Record<string, number> = {};
    for (const [pair, ticker] of Object.entries(tickers)) {
      if (ticker?.price && ticker.price > 0) {
        priceMap[pair] = ticker.price;
      }
    }

    // Update store immediately in synchronous evaluateTicks
    useTradingStore.getState().updatePricesAndPnL(priceMap);

    return this.scanLiquidationBreaches(priceMap);
  }

  /**
   * Internal scanner evaluating both Isolated and Cross margin positions
   */
  private scanLiquidationBreaches(priceMap: Record<string, number>): string[] {
    const tradingStore = useTradingStore.getState();
    const positions = tradingStore.positions;
    if (positions.length === 0) return [];

    const liquidatedIds: string[] = [];
    const liquidatedPositions: Position[] = [];

    const isolatedPositions: Position[] = [];
    const crossPositions: Position[] = [];

    for (const pos of positions) {
      if (pos.marginMode === 'CROSS') {
        crossPositions.push(pos);
      } else {
        isolatedPositions.push(pos);
      }
    }

    // A. Evaluate Isolated Margin Positions
    for (const position of isolatedPositions) {
      const currentPrice = priceMap[position.pair];
      if (!currentPrice || currentPrice <= 0) continue;

      let isLiquidated = false;
      if (position.direction === 'LONG' && currentPrice <= position.liquidationPrice) {
        isLiquidated = true;
      } else if (position.direction === 'SHORT' && currentPrice >= position.liquidationPrice) {
        isLiquidated = true;
      }

      if (isLiquidated) {
        liquidatedIds.push(position.id);
        liquidatedPositions.push(position);
        tradingStore.forceLiquidatePosition(position.id, currentPrice);
      }
    }

    // B. Evaluate Cross Margin Positions (Portfolio Aggregation)
    if (crossPositions.length > 0) {
      const wallet = useWalletStore.getState();
      const crossEval = evaluateCrossMarginPortfolio({
        crossPositions,
        markPrices: priceMap,
        walletAvailableBalance: wallet.availableMargin,
      });

      if (crossEval.isLiquidated) {
        // Portfolio total equity <= sum(maintenance margin) -> Liquidate all cross positions
        for (const pos of crossPositions) {
          const triggerPrice = priceMap[pos.pair] || pos.markPrice;
          liquidatedIds.push(pos.id);
          liquidatedPositions.push(pos);
          tradingStore.forceLiquidatePosition(pos.id, triggerPrice);
        }
      } else {
        // Check if any individual cross position breaches its calculated liquidation price
        for (const pos of crossPositions) {
          const currentPrice = priceMap[pos.pair];
          if (!currentPrice || currentPrice <= 0) continue;

          let isLiquidated = false;
          if (pos.direction === 'LONG' && currentPrice <= pos.liquidationPrice) {
            isLiquidated = true;
          } else if (pos.direction === 'SHORT' && currentPrice >= pos.liquidationPrice) {
            isLiquidated = true;
          }

          if (isLiquidated) {
            liquidatedIds.push(pos.id);
            liquidatedPositions.push(pos);
            tradingStore.forceLiquidatePosition(pos.id, currentPrice);
          }
        }
      }
    }

    // Trigger callback if positions were liquidated
    if (liquidatedPositions.length > 0) {
      soundFXService.playLiquidationCrash();
      if (this.onLiquidationCallback) {
        this.onLiquidationCallback(liquidatedPositions);
      }
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
