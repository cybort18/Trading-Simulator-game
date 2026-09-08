import { create } from 'zustand';
import { TradingPair, TickerData, CandleData, ConnectionStatus } from '@/types/market';

interface MarketDataState {
  selectedPair: TradingPair;
  prices: Record<TradingPair, number>;
  priceDirections: Record<TradingPair, 'up' | 'down' | 'same'>;
  tickers: Record<TradingPair, TickerData>;
  latestCandles: Record<TradingPair, CandleData | null>;
  connectionStatus: ConnectionStatus;
  pingLatency: number;

  setSelectedPair: (pair: TradingPair) => void;
  updateTicker: (pair: TradingPair, data: Partial<TickerData>) => void;
  updateMarkPrice: (
    pair: TradingPair,
    price: number,
    fundingRate?: number,
    nextFundingTime?: number
  ) => void;
  updateLatestCandle: (pair: TradingPair, candle: CandleData) => void;
  setConnectionStatus: (status: ConnectionStatus, latency?: number) => void;
}

const INITIAL_TICKERS: Record<TradingPair, TickerData> = {
  BTCUSDT: {
    symbol: 'BTCUSDT',
    price: 64281.5,
    change24h: 2.45,
    high24h: 65240.0,
    low24h: 63180.5,
    volume24h: 38421.9,
    fundingRate: 0.0001,
    nextFundingTime: Date.now() + 13335000,
  },
  ETHUSDT: {
    symbol: 'ETHUSDT',
    price: 3495.2,
    change24h: -1.15,
    high24h: 3580.0,
    low24h: 3420.0,
    volume24h: 189200.4,
    fundingRate: 0.0001,
    nextFundingTime: Date.now() + 13335000,
  },
  SOLUSDT: {
    symbol: 'SOLUSDT',
    price: 148.6,
    change24h: 5.82,
    high24h: 152.4,
    low24h: 139.8,
    volume24h: 1240500.0,
    fundingRate: 0.00015,
    nextFundingTime: Date.now() + 13335000,
  },
};

export const useMarketDataStore = create<MarketDataState>((set, get) => ({
  selectedPair: 'BTCUSDT',
  prices: {
    BTCUSDT: 64281.5,
    ETHUSDT: 3495.2,
    SOLUSDT: 148.6,
  },
  priceDirections: {
    BTCUSDT: 'same',
    ETHUSDT: 'same',
    SOLUSDT: 'same',
  },
  tickers: INITIAL_TICKERS,
  latestCandles: {
    BTCUSDT: null,
    ETHUSDT: null,
    SOLUSDT: null,
  },
  connectionStatus: 'CONNECTING',
  pingLatency: 14,

  setSelectedPair: (pair: TradingPair) => set({ selectedPair: pair }),

  updateTicker: (pair: TradingPair, data: Partial<TickerData>) => {
    const { tickers, prices, priceDirections } = get();
    const prev = tickers[pair];
    if (!prev) return;

    const newPrice = data.price !== undefined ? data.price : prev.price;
    const oldPrice = prices[pair] || prev.price;
    const dir: 'up' | 'down' | 'same' =
      newPrice > oldPrice ? 'up' : newPrice < oldPrice ? 'down' : priceDirections[pair];

    set({
      prices: { ...prices, [pair]: newPrice },
      priceDirections: { ...priceDirections, [pair]: dir },
      tickers: {
        ...tickers,
        [pair]: {
          ...prev,
          ...data,
          price: newPrice,
        },
      },
    });
  },

  updateMarkPrice: (
    pair: TradingPair,
    price: number,
    fundingRate?: number,
    nextFundingTime?: number
  ) => {
    const { prices, priceDirections, tickers } = get();
    const oldPrice = prices[pair];
    const dir: 'up' | 'down' | 'same' =
      price > oldPrice ? 'up' : price < oldPrice ? 'down' : priceDirections[pair];

    const currentTicker = tickers[pair];

    set({
      prices: { ...prices, [pair]: price },
      priceDirections: { ...priceDirections, [pair]: dir },
      tickers: {
        ...tickers,
        [pair]: {
          ...currentTicker,
          price,
          fundingRate: fundingRate !== undefined ? fundingRate : currentTicker.fundingRate,
          nextFundingTime:
            nextFundingTime !== undefined ? nextFundingTime : currentTicker.nextFundingTime,
        },
      },
    });
  },

  updateLatestCandle: (pair: TradingPair, candle: CandleData) => {
    const { latestCandles } = get();
    set({
      latestCandles: {
        ...latestCandles,
        [pair]: candle,
      },
    });
  },

  setConnectionStatus: (status: ConnectionStatus, latency?: number) => {
    set((state) => ({
      connectionStatus: status,
      pingLatency: latency !== undefined ? latency : state.pingLatency,
    }));
  },
}));
