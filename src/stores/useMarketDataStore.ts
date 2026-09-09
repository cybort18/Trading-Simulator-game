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
    price: 79540.0,
    change24h: 1.45,
    high24h: 79760.0,
    low24h: 78450.0,
    volume24h: 42150.0,
    fundingRate: 0.0001,
    nextFundingTime: Date.now() + 13335000,
  },
  ETHUSDT: {
    symbol: 'ETHUSDT',
    price: 2505.0,
    change24h: -0.85,
    high24h: 2540.0,
    low24h: 2480.0,
    volume24h: 195200.0,
    fundingRate: 0.0001,
    nextFundingTime: Date.now() + 13335000,
  },
  SOLUSDT: {
    symbol: 'SOLUSDT',
    price: 104.5,
    change24h: 3.20,
    high24h: 108.0,
    low24h: 101.5,
    volume24h: 1450000.0,
    fundingRate: 0.00015,
    nextFundingTime: Date.now() + 13335000,
  },
};

export const useMarketDataStore = create<MarketDataState>((set, get) => ({
  selectedPair: 'BTCUSDT',
  prices: {
    BTCUSDT: 79540.0,
    ETHUSDT: 2505.0,
    SOLUSDT: 104.5,
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
    const { latestCandles, prices, priceDirections, tickers } = get();
    const prevTicker = tickers[pair];
    const oldPrice = prices[pair] || candle.close;
    const dir: 'up' | 'down' | 'same' =
      candle.close > oldPrice ? 'up' : candle.close < oldPrice ? 'down' : priceDirections[pair];

    set({
      latestCandles: {
        ...latestCandles,
        [pair]: candle,
      },
      prices: {
        ...prices,
        [pair]: candle.close,
      },
      priceDirections: {
        ...priceDirections,
        [pair]: dir,
      },
      tickers: {
        ...tickers,
        [pair]: {
          ...prevTicker,
          price: candle.close,
          high24h: Math.max(prevTicker?.high24h || 0, candle.high),
          low24h: Math.min(prevTicker?.low24h || candle.low, candle.low),
        },
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
