import { create } from 'zustand';
import { TradingPair, OrderBookLevel, TapeTrade } from '@/types/market';

interface OrderBookState {
  selectedPair: TradingPair;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  recentTrades: TapeTrade[];
  spread: number;
  spreadPercent: number;
  midPrice: number;
  imbalanceRatio: number; // 0 to 100 percentage representing bid pressure
  precision: number;
  depthLimit: number;
  isAudioEnabled: boolean;
  whaleThresholdUsd: number;
  lastTradePrice: number;
  priceDirection: 'up' | 'down' | 'same';

  // Actions
  setSelectedPair: (pair: TradingPair) => void;
  setPrecision: (precision: number) => void;
  setDepthLimit: (limit: number) => void;
  toggleAudio: () => void;
  setOrderBookData: (rawBids: [string | number, string | number][], rawAsks: [string | number, string | number][]) => void;
  addTrades: (trades: TapeTrade[]) => void;
  clearTrades: () => void;
}

const DEFAULT_PRECISION: Record<TradingPair, number> = {
  BTCUSDT: 1.0,
  ETHUSDT: 0.1,
  SOLUSDT: 0.01,
};

const MAX_TRADES_HISTORY = 60;

export const useOrderBookStore = create<OrderBookState>((set, get) => ({
  selectedPair: 'BTCUSDT',
  bids: [],
  asks: [],
  recentTrades: [],
  spread: 0,
  spreadPercent: 0,
  midPrice: 0,
  imbalanceRatio: 50,
  precision: DEFAULT_PRECISION.BTCUSDT,
  depthLimit: 15,
  isAudioEnabled: false,
  whaleThresholdUsd: 25000,
  lastTradePrice: 0,
  priceDirection: 'same',

  setSelectedPair: (pair: TradingPair) => {
    const { selectedPair } = get();
    if (selectedPair === pair) return;
    set({
      selectedPair: pair,
      precision: DEFAULT_PRECISION[pair] || 1.0,
      bids: [],
      asks: [],
      recentTrades: [],
      spread: 0,
      spreadPercent: 0,
      midPrice: 0,
      imbalanceRatio: 50,
      priceDirection: 'same',
    });
  },

  setPrecision: (precision: number) => set({ precision }),

  setDepthLimit: (depthLimit: number) => set({ depthLimit }),

  toggleAudio: () => set((state) => ({ isAudioEnabled: !state.isAudioEnabled })),

  setOrderBookData: (rawBids, rawAsks) => {
    const { depthLimit, precision } = get();

    // Grouping by precision helper
    const roundToPrecision = (val: number, prec: number) => {
      if (prec <= 0) return val;
      return Math.round(val / prec) * prec;
    };

    // Parse bids (Sort descending: highest bid first)
    const parsedBidsMap = new Map<number, number>();
    for (const [pStr, qStr] of rawBids) {
      const p = parseFloat(String(pStr));
      const q = parseFloat(String(qStr));
      if (Number.isFinite(p) && Number.isFinite(q) && q > 0) {
        const roundedP = roundToPrecision(p, precision);
        parsedBidsMap.set(roundedP, (parsedBidsMap.get(roundedP) || 0) + q);
      }
    }

    // Parse asks (Sort ascending: lowest ask first)
    const parsedAsksMap = new Map<number, number>();
    for (const [pStr, qStr] of rawAsks) {
      const p = parseFloat(String(pStr));
      const q = parseFloat(String(qStr));
      if (Number.isFinite(p) && Number.isFinite(q) && q > 0) {
        const roundedP = roundToPrecision(p, precision);
        parsedAsksMap.set(roundedP, (parsedAsksMap.get(roundedP) || 0) + q);
      }
    }

    const sortedBids = Array.from(parsedBidsMap.entries())
      .map(([price, quantity]) => ({ price, quantity }))
      .sort((a, b) => b.price - a.price)
      .slice(0, depthLimit);

    const sortedAsks = Array.from(parsedAsksMap.entries())
      .map(([price, quantity]) => ({ price, quantity }))
      .sort((a, b) => a.price - b.price)
      .slice(0, depthLimit);

    // Calculate cumulative totals for bids
    let cumulativeBid = 0;
    const bidsWithTotals = sortedBids.map((item) => {
      cumulativeBid += item.quantity;
      return {
        price: item.price,
        quantity: item.quantity,
        total: cumulativeBid,
        depthPercent: 0,
      };
    });

    // Calculate cumulative totals for asks
    let cumulativeAsk = 0;
    const asksWithTotals = sortedAsks.map((item) => {
      cumulativeAsk += item.quantity;
      return {
        price: item.price,
        quantity: item.quantity,
        total: cumulativeAsk,
        depthPercent: 0,
      };
    });

    // Calculate depth percentages based on maximum visible cumulative total
    const maxCumulative = Math.max(cumulativeBid, cumulativeAsk, 1e-6);
    const finalBids: OrderBookLevel[] = bidsWithTotals.map((b) => ({
      ...b,
      depthPercent: Math.min(100, Math.round((b.total / maxCumulative) * 100)),
    }));

    const finalAsks: OrderBookLevel[] = asksWithTotals.map((a) => ({
      ...a,
      depthPercent: Math.min(100, Math.round((a.total / maxCumulative) * 100)),
    }));

    // Calculate spread and mid-price
    let spread = 0;
    let spreadPercent = 0;
    let midPrice = 0;

    const bestBid = finalBids[0]?.price;
    const bestAsk = finalAsks[0]?.price;

    if (bestBid && bestAsk && bestAsk >= bestBid) {
      spread = bestAsk - bestBid;
      midPrice = (bestAsk + bestBid) / 2;
      spreadPercent = midPrice > 0 ? (spread / midPrice) * 100 : 0;
    } else if (bestBid) {
      midPrice = bestBid;
    } else if (bestAsk) {
      midPrice = bestAsk;
    }

    // Calculate imbalance ratio (0 - 100% buy pressure)
    const totalVolume = cumulativeBid + cumulativeAsk;
    const imbalanceRatio = totalVolume > 0 ? Math.round((cumulativeBid / totalVolume) * 100) : 50;

    set({
      bids: finalBids,
      asks: finalAsks,
      spread,
      spreadPercent,
      midPrice,
      imbalanceRatio,
    });
  },

  addTrades: (newTrades: TapeTrade[]) => {
    if (!newTrades || newTrades.length === 0) return;

    const { recentTrades, lastTradePrice } = get();
    const latestTrade = newTrades[0];
    const prevPrice = lastTradePrice || latestTrade.price;
    const dir: 'up' | 'down' | 'same' =
      latestTrade.price > prevPrice ? 'up' : latestTrade.price < prevPrice ? 'down' : 'same';

    // Merge and deduplicate by trade ID, keeping newest first
    const existingIds = new Set(recentTrades.map((t) => t.id));
    const filteredNew = newTrades.filter((t) => !existingIds.has(t.id));
    const combined = [...filteredNew, ...recentTrades].slice(0, MAX_TRADES_HISTORY);

    set({
      recentTrades: combined,
      lastTradePrice: latestTrade.price,
      priceDirection: dir,
    });
  },

  clearTrades: () => set({ recentTrades: [] }),
}));
