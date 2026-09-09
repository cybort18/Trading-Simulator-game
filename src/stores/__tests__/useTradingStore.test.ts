import { describe, it, expect, beforeEach } from 'vitest';
import { useTradingStore } from '../useTradingStore';
import { useWalletStore } from '../useWalletStore';

describe('useTradingStore', () => {
  beforeEach(() => {
    useWalletStore.getState().resetWallet(10.00);
    useTradingStore.setState({
      positions: [],
      tradeHistory: [],
      latestLiquidation: null,
      isLiquidationModalOpen: false,
    });
  });

  it('successfully opens an isolated long position and locks wallet margin', () => {
    const res = useTradingStore.getState().openPosition(
      {
        pair: 'BTCUSDT',
        direction: 'LONG',
        marginMode: 'ISOLATED',
        leverage: 20,
        margin: 5.00,
        type: 'LIMIT',
        limitPrice: 60000.0,
      },
      60000.0
    );

    expect(res.success).toBe(true);
    expect(res.position).toBeDefined();

    const position = res.position!;
    expect(position.pair).toBe('BTCUSDT');
    expect(position.direction).toBe('LONG');
    expect(position.leverage).toBe(20);
    expect(position.entryPrice).toBe(60000.0);
    expect(position.initialMargin).toBe(5.00);
    expect(position.quantity).toBeCloseTo(0.00166667, 7);
    expect(position.liquidationPrice).toBeCloseTo(57315.23, 1);

    // Verify wallet margin was locked and taker fee deducted
    const wallet = useWalletStore.getState();
    expect(wallet.lockedMargin).toBe(5.00);
    // Opening fee: 100 * 0.0005 = 0.05. Remaining available: 10.00 - 5.00 - 0.05 = 4.95
    expect(wallet.availableMargin).toBeCloseTo(4.95, 2);
    expect(wallet.equity).toBeCloseTo(9.95, 2);
  });

  it('rejects order when margin + fee exceeds available margin', () => {
    const res = useTradingStore.getState().openPosition(
      {
        pair: 'BTCUSDT',
        direction: 'LONG',
        marginMode: 'ISOLATED',
        leverage: 20,
        margin: 15.00,
      },
      60000.0
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain('Insufficient available balance');
    expect(useTradingStore.getState().positions.length).toBe(0);
  });

  it('updates prices, uPnL, and ROE in real-time', () => {
    const res = useTradingStore.getState().openPosition(
      {
        pair: 'BTCUSDT',
        direction: 'LONG',
        leverage: 20,
        margin: 5.00,
        type: 'LIMIT',
        limitPrice: 60000.0,
      },
      60000.0
    );

    expect(res.success).toBe(true);

    // Mark price rises to $63,000 (+5%)
    useTradingStore.getState().updatePricesAndPnL({
      BTCUSDT: 63000.0,
    });

    const updated = useTradingStore.getState().positions[0];
    expect(updated.markPrice).toBe(63000.0);
    expect(updated.unrealizedPnl).toBeCloseTo(5.00, 2);
    expect(updated.roe).toBeCloseTo(100.0, 2);

    // Wallet equity reflects floating uPnL: 4.95 (free) + 5.00 (locked) + 5.00 (uPnL) = 14.95
    expect(useWalletStore.getState().equity).toBeCloseTo(14.95, 2);
  });

  it('closes a profitable position, releasing margin and crediting realized PnL', () => {
    useTradingStore.getState().openPosition(
      {
        pair: 'BTCUSDT',
        direction: 'LONG',
        leverage: 20,
        margin: 5.00,
        type: 'LIMIT',
        limitPrice: 60000.0,
      },
      60000.0
    );

    const posId = useTradingStore.getState().positions[0].id;
    const closeRes = useTradingStore.getState().closePosition(posId, 63000.0);

    expect(closeRes.success).toBe(true);
    expect(useTradingStore.getState().positions.length).toBe(0);
    expect(useTradingStore.getState().tradeHistory.length).toBe(1);

    const history = useTradingStore.getState().tradeHistory[0];
    expect(history.status).toBe('CLOSED');
    expect(history.realizedPnl).toBeGreaterThan(4.8); // 5.00 uPnL minus closing fee & slippage

    const wallet = useWalletStore.getState();
    expect(wallet.lockedMargin).toBe(0);
    expect(wallet.availableMargin).toBeGreaterThan(14.5);
    expect(wallet.winCount).toBe(1);
  });

  it('force-liquidates position and marks trade history as LIQUIDATED', () => {
    useTradingStore.getState().openPosition(
      {
        pair: 'BTCUSDT',
        direction: 'LONG',
        leverage: 20,
        margin: 5.00,
        type: 'LIMIT',
        limitPrice: 60000.0,
      },
      60000.0
    );

    const pos = useTradingStore.getState().positions[0];
    useTradingStore.getState().forceLiquidatePosition(pos.id, 57315.23);

    expect(useTradingStore.getState().positions.length).toBe(0);
    expect(useTradingStore.getState().tradeHistory.length).toBe(1);

    const history = useTradingStore.getState().tradeHistory[0];
    expect(history.status).toBe('LIQUIDATED');
    expect(history.realizedPnl).toBe(-5.00);
    expect(history.roe).toBe(-100.0);

    // Modal state triggered
    expect(useTradingStore.getState().isLiquidationModalOpen).toBe(true);
    expect(useTradingStore.getState().latestLiquidation).not.toBeNull();
    expect(useTradingStore.getState().latestLiquidation?.wipedMargin).toBe(5.00);

    // Initial margin was wiped
    const wallet = useWalletStore.getState();
    expect(wallet.lockedMargin).toBe(0);
    expect(wallet.availableMargin).toBeCloseTo(4.95, 2);
    expect(wallet.lossCount).toBe(1);
  });
});
