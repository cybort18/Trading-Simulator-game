export type TradingPair = 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT';

export interface TickerData {
  symbol: TradingPair;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  fundingRate: number;
  nextFundingTime: number;
}

export interface CandleData {
  time: number; // Unix timestamp in seconds for lightweight-charts
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  interval?: string;
}

export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'OFFLINE';

export interface OrderBookLevel {
  price: number;
  quantity: number;
  total: number;
  depthPercent: number;
}

export interface TapeTrade {
  id: string;
  price: number;
  quantity: number;
  time: number;
  isBuyerMaker: boolean;
  isWhale: boolean;
  valueUsd: number;
}

export interface OrderBookSnapshot {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadPercent: number;
  midPrice: number;
  bidDepthTotal: number;
  askDepthTotal: number;
  imbalanceRatio: number;
}
