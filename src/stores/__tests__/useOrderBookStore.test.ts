import { describe, it, expect, beforeEach } from 'vitest';
import { useOrderBookStore } from '../useOrderBookStore';
import { TapeTrade } from '@/types/market';

describe('useOrderBookStore Level-2 DOM & Tape Reader State', () => {
  beforeEach(() => {
    // Reset store before each test
    useOrderBookStore.setState({
      selectedPair: 'BTCUSDT',
      bids: [],
      asks: [],
      recentTrades: [],
      spread: 0,
      spreadPercent: 0,
      midPrice: 0,
      imbalanceRatio: 50,
      precision: 1.0,
      depthLimit: 15,
      isAudioEnabled: false,
      whaleThresholdUsd: 25000,
      lastTradePrice: 0,
      priceDirection: 'same',
    });
  });

  it('correctly processes and sorts raw bids and asks', () => {
    const rawBids: [string, string][] = [
      ['60000.00', '1.5'],
      ['60005.00', '2.0'],
      ['59990.00', '3.0'],
    ];
    const rawAsks: [string, string][] = [
      ['60010.00', '1.0'],
      ['60020.00', '2.5'],
      ['60015.00', '1.2'],
    ];

    useOrderBookStore.getState().setOrderBookData(rawBids, rawAsks);
    const state = useOrderBookStore.getState();

    // Bids should be sorted descending: 60005, 60000, 59990
    expect(state.bids).toHaveLength(3);
    expect(state.bids[0].price).toBe(60005);
    expect(state.bids[0].quantity).toBe(2.0);
    expect(state.bids[1].price).toBe(60000);
    expect(state.bids[2].price).toBe(59990);

    // Cumulative totals for bids:
    // 60005 -> 2.0
    // 60000 -> 3.5
    // 59990 -> 6.5
    expect(state.bids[0].total).toBe(2.0);
    expect(state.bids[1].total).toBe(3.5);
    expect(state.bids[2].total).toBe(6.5);

    // Asks should be sorted ascending: 60010, 60015, 60020
    expect(state.asks).toHaveLength(3);
    expect(state.asks[0].price).toBe(60010);
    expect(state.asks[1].price).toBe(60015);
    expect(state.asks[2].price).toBe(60020);

    // Spread: 60010 - 60005 = 5.00
    expect(state.spread).toBe(5);
    expect(state.midPrice).toBe(60007.5);
    expect(state.spreadPercent).toBeCloseTo((5 / 60007.5) * 100, 4);

    // Imbalance: total bids = 6.5, total asks = 4.7, total = 11.2 -> bids = ~58%
    expect(state.imbalanceRatio).toBe(Math.round((6.5 / 11.2) * 100));
  });

  it('calculates depth percentages bounded between 0 and 100', () => {
    const rawBids: [string, string][] = [
      ['60000.00', '5.0'],
      ['59990.00', '5.0'],
    ];
    const rawAsks: [string, string][] = [
      ['60010.00', '2.0'],
    ];

    useOrderBookStore.getState().setOrderBookData(rawBids, rawAsks);
    const state = useOrderBookStore.getState();

    // Max cumulative total is 10.0 (from bids)
    expect(state.bids[1].total).toBe(10.0);
    expect(state.bids[1].depthPercent).toBe(100);
    expect(state.bids[0].depthPercent).toBe(50);
  });

  it('correctly records, deduplicates, and caps incoming trades on the tape', () => {
    const store = useOrderBookStore.getState();

    const trade1: TapeTrade = {
      id: 'trade-1',
      price: 60000,
      quantity: 0.1,
      time: 1000,
      isBuyerMaker: false, // Buyer took ask
      isWhale: false,
      valueUsd: 6000,
    };

    const trade2: TapeTrade = {
      id: 'trade-2',
      price: 60005,
      quantity: 0.8,
      time: 1001,
      isBuyerMaker: false,
      isWhale: true,
      valueUsd: 48004,
    };

    store.addTrades([trade1]);
    expect(useOrderBookStore.getState().recentTrades).toHaveLength(1);
    expect(useOrderBookStore.getState().lastTradePrice).toBe(60000);

    // Add trade 2 (price went up from 60000 to 60005)
    store.addTrades([trade2]);
    const state = useOrderBookStore.getState();
    expect(state.recentTrades).toHaveLength(2);
    expect(state.recentTrades[0].id).toBe('trade-2');
    expect(state.priceDirection).toBe('up');
    expect(state.lastTradePrice).toBe(60005);

    // Duplicate trade should not be re-added
    store.addTrades([trade2]);
    expect(useOrderBookStore.getState().recentTrades).toHaveLength(2);

    // Clear trades
    store.clearTrades();
    expect(useOrderBookStore.getState().recentTrades).toHaveLength(0);
  });

  it('switches pair and updates precision configuration cleanly', () => {
    const store = useOrderBookStore.getState();
    store.setSelectedPair('ETHUSDT');

    const state = useOrderBookStore.getState();
    expect(state.selectedPair).toBe('ETHUSDT');
    expect(state.precision).toBe(0.1);
    expect(state.bids).toEqual([]);
    expect(state.asks).toEqual([]);
    expect(state.recentTrades).toEqual([]);
  });

  it('toggles audio ticker feedback setting', () => {
    const store = useOrderBookStore.getState();
    expect(store.isAudioEnabled).toBe(false);

    store.toggleAudio();
    expect(useOrderBookStore.getState().isAudioEnabled).toBe(true);

    store.toggleAudio();
    expect(useOrderBookStore.getState().isAudioEnabled).toBe(false);
  });

  it('correctly updates and configures updateSpeedMs throttle', () => {
    const store = useOrderBookStore.getState();
    expect(store.updateSpeedMs).toBe(350);

    store.setUpdateSpeedMs(500);
    expect(useOrderBookStore.getState().updateSpeedMs).toBe(500);

    store.setUpdateSpeedMs(1000);
    expect(useOrderBookStore.getState().updateSpeedMs).toBe(1000);
  });
});
