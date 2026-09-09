import { describe, it, expect, beforeEach } from 'vitest';
import { liquidationEngine } from '../LiquidationEngine';
import { useTradingStore } from '@/stores/useTradingStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { TradingPair } from '@/types/market';

describe('LiquidationEngine', () => {
  beforeEach(() => {
    useWalletStore.getState().resetWallet(100.00);
    useTradingStore.setState({
      positions: [],
      tradeHistory: [],
      latestLiquidation: null,
      isLiquidationModalOpen: false,
    });
  });

  it('triggers liquidation for an isolated long position when mark price drops to liquidation price', () => {
    // Open 20x Long on BTC at $60,000. Liq price is ~$57,315.23
    const res = useTradingStore.getState().openPosition(
      {
        pair: 'BTCUSDT',
        direction: 'LONG',
        leverage: 20,
        margin: 10.0,
        type: 'LIMIT',
        limitPrice: 60000.0,
      },
      60000.0
    );

    expect(res.success).toBe(true);
    const position = res.position!;
    expect(useTradingStore.getState().positions.length).toBe(1);

    // 1. Safe mark price: $59,000 (above liq price ~$57,315)
    let tickers: Record<TradingPair, { price: number }> = {
      BTCUSDT: { price: 59000.0 },
      ETHUSDT: { price: 3000.0 },
      SOLUSDT: { price: 150.0 },
    };
    let liquidated = liquidationEngine.evaluateTicks(tickers);
    expect(liquidated.length).toBe(0);
    expect(useTradingStore.getState().positions.length).toBe(1);

    // 2. Flash crash: Mark price drops to $57,300 (breaches liq price)
    tickers = {
      BTCUSDT: { price: 57300.0 },
      ETHUSDT: { price: 3000.0 },
      SOLUSDT: { price: 150.0 },
    };
    liquidated = liquidationEngine.evaluateTicks(tickers);
    expect(liquidated.length).toBe(1);
    expect(liquidated[0]).toBe(position.id);
    expect(useTradingStore.getState().positions.length).toBe(0);
    expect(useTradingStore.getState().tradeHistory[0].status).toBe('LIQUIDATED');
  });

  it('triggers liquidation for an isolated short position when mark price spikes above liquidation price', () => {
    // Open 20x Short on ETH at $3,000
    const res = useTradingStore.getState().openPosition(
      {
        pair: 'ETHUSDT',
        direction: 'SHORT',
        leverage: 20,
        margin: 10.0,
        type: 'LIMIT',
        limitPrice: 3000.0,
      },
      3000.0
    );

    expect(res.success).toBe(true);
    const position = res.position!;
    // Short liq price is higher than entry price
    expect(position.liquidationPrice).toBeGreaterThan(3000.0);

    // Safe price
    let tickers: Record<TradingPair, { price: number }> = {
      BTCUSDT: { price: 60000.0 },
      ETHUSDT: { price: 3050.0 },
      SOLUSDT: { price: 150.0 },
    };
    let liquidated = liquidationEngine.evaluateTicks(tickers);
    expect(liquidated.length).toBe(0);

    // Price spikes above liquidation price
    tickers = {
      BTCUSDT: { price: 60000.0 },
      ETHUSDT: { price: position.liquidationPrice + 5.0 },
      SOLUSDT: { price: 150.0 },
    };
    liquidated = liquidationEngine.evaluateTicks(tickers);
    expect(liquidated.length).toBe(1);
    expect(useTradingStore.getState().positions.length).toBe(0);
    expect(useTradingStore.getState().isLiquidationModalOpen).toBe(true);
  });

  it('triggers portfolio liquidation for multi-position cross margin when aggregated equity is depleted', () => {
    // Start with limited wallet balance (10 USDT)
    useWalletStore.getState().resetWallet(10.00);

    // Open Cross Long on BTC (margin 4 USDT)
    const pos1 = useTradingStore.getState().openPosition(
      {
        pair: 'BTCUSDT',
        direction: 'LONG',
        marginMode: 'CROSS',
        leverage: 20,
        margin: 4.0,
        type: 'LIMIT',
        limitPrice: 60000.0,
      },
      60000.0
    );
    expect(pos1.success).toBe(true);

    // Open Cross Long on ETH (margin 4 USDT)
    const pos2 = useTradingStore.getState().openPosition(
      {
        pair: 'ETHUSDT',
        direction: 'LONG',
        marginMode: 'CROSS',
        leverage: 20,
        margin: 4.0,
        type: 'LIMIT',
        limitPrice: 3000.0,
      },
      3000.0
    );
    expect(pos2.success).toBe(true);
    expect(useTradingStore.getState().positions.length).toBe(2);

    // Severe adverse market movement on both assets that wipes combined cross equity
    const tickers: Record<TradingPair, { price: number }> = {
      BTCUSDT: { price: 55000.0 }, // severe loss
      ETHUSDT: { price: 2700.0 },  // severe loss
      SOLUSDT: { price: 150.0 },
    };

    const liquidated = liquidationEngine.evaluateTicks(tickers);
    // Both cross positions liquidated together due to aggregate equity depletion
    expect(liquidated.length).toBe(2);
    expect(useTradingStore.getState().positions.length).toBe(0);
  });
});

