import { TradingPair } from './market';
import { PositionDirection, MarginMode } from '../utils/simulationMath';

export type OrderType = 'MARKET' | 'LIMIT';
export type PositionStatus = 'OPEN' | 'CLOSED' | 'LIQUIDATED';

export interface Position {
  id: string;
  pair: TradingPair;
  direction: PositionDirection;
  marginMode: MarginMode;
  leverage: number;
  entryPrice: number;
  markPrice: number;
  quantity: number;
  initialMargin: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  roe: number;
  createdAt: number;
}

export interface TradeHistoryItem {
  id: string;
  positionId: string;
  pair: TradingPair;
  direction: PositionDirection;
  leverage: number;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  initialMargin: number;
  realizedPnl: number;
  roe: number;
  feesPaid: number;
  status: 'CLOSED' | 'LIQUIDATED';
  openedAt: number;
  closedAt: number;
}

export interface OpenOrderParams {
  pair: TradingPair;
  direction: PositionDirection;
  marginMode?: MarginMode;
  leverage: number;
  margin: number;
  type?: OrderType;
  limitPrice?: number;
}
