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
}

export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'OFFLINE';
