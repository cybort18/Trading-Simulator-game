import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStateStorage } from '@/utils/safeStorage';
import {
  Position,
  TradeHistoryItem,
  OpenOrderParams,
} from '@/types/trading';
import {
  calculateNotionalValue,
  calculateQuantity,
  calculateUnrealizedPnl,
  calculateRoe,
  calculateLiquidationPrice,
  calculateFee,
  calculateSlippagePrice,
  MAINTENANCE_MARGIN_RATES,
  DEFAULT_MMR,
  DEFAULT_TAKER_FEE_RATE,
} from '@/utils/simulationMath';
import { useWalletStore } from './useWalletStore';
import { useMarketDataStore } from './useMarketDataStore';

export interface LiquidationEvent {
  id: string;
  position: Position;
  liquidationPrice: number;
  wipedMargin: number;
  timestamp: number;
}

export interface TradingStoreState {
  positions: Position[];
  tradeHistory: TradeHistoryItem[];
  latestLiquidation: LiquidationEvent | null;
  isLiquidationModalOpen: boolean;

  // Actions
  openPosition: (params: OpenOrderParams, executionPrice?: number) => { success: boolean; error?: string; position?: Position };
  closePosition: (positionId: string, exitPrice?: number) => { success: boolean; error?: string; netRealizedPnl?: number; roe?: number };
  forceLiquidatePosition: (positionId: string, triggerPrice: number) => void;
  updatePricesAndPnL: (markPrices: Record<string, number>) => void;
  closeLiquidationModal: () => void;
  clearTradeHistory: () => void;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'pos_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
}

export const useTradingStore = create<TradingStoreState>()(
  persist(
    (set, get) => ({
      positions: [],
      tradeHistory: [],
      latestLiquidation: null,
      isLiquidationModalOpen: false,

      openPosition: (params: OpenOrderParams, executionPrice?: number) => {
        const wallet = useWalletStore.getState();
        const {
          pair,
          direction,
          marginMode = 'ISOLATED',
          leverage,
          margin,
          type = 'MARKET',
          limitPrice,
        } = params;

        if (margin <= 0 || leverage <= 0) {
          return { success: false, error: 'Invalid margin or leverage value' };
        }

        // Determine base price
        let markPrice = executionPrice;
        if (!markPrice) {
          const marketData = useMarketDataStore.getState();
          markPrice = marketData.tickers[pair]?.price;
        }

        if (!markPrice || markPrice <= 0) {
          if (type === 'LIMIT' && limitPrice && limitPrice > 0) {
            markPrice = limitPrice;
          } else {
            return { success: false, error: `No live market price available for ${pair}` };
          }
        }

        // Apply slippage for market orders
        const notional = calculateNotionalValue(margin, leverage);
        const fillPrice = type === 'MARKET'
          ? calculateSlippagePrice(markPrice, direction, notional)
          : (limitPrice || markPrice);

        const quantity = calculateQuantity(margin, leverage, fillPrice);
        const openingFee = calculateFee(notional, DEFAULT_TAKER_FEE_RATE);

        // Required upfront = margin + openingFee
        if (wallet.availableMargin < margin + openingFee) {
          return {
            success: false,
            error: `Insufficient available balance: Need $${(margin + openingFee).toFixed(2)} USDT (Margin: $${margin.toFixed(2)}, Fee: $${openingFee.toFixed(2)})`,
          };
        }

        // Deduct opening fee
        wallet.deductFee(openingFee);

        // Lock margin
        const locked = wallet.lockMargin(margin);
        if (!locked) {
          return { success: false, error: 'Failed to lock margin in wallet' };
        }

        const mmr = MAINTENANCE_MARGIN_RATES[pair] ?? DEFAULT_MMR;
        const liquidationPrice = calculateLiquidationPrice({
          direction,
          entryPrice: fillPrice,
          initialMargin: margin,
          quantity,
          leverage,
          mmr,
          takerFeeRate: DEFAULT_TAKER_FEE_RATE,
          marginMode,
          totalEquity: wallet.equity,
        });

        const newPosition: Position = {
          id: generateId(),
          pair,
          direction,
          marginMode,
          leverage,
          entryPrice: fillPrice,
          markPrice,
          quantity,
          initialMargin: margin,
          liquidationPrice,
          unrealizedPnl: 0,
          roe: 0,
          createdAt: Date.now(),
        };

        set((state) => ({
          positions: [newPosition, ...state.positions],
        }));

        return { success: true, position: newPosition };
      },

      closePosition: (positionId: string, exitPrice?: number) => {
        const state = get();
        const position = state.positions.find((p) => p.id === positionId);
        if (!position) {
          return { success: false, error: 'Position not found' };
        }

        const wallet = useWalletStore.getState();

        // Determine mark price
        let markPrice = exitPrice;
        if (!markPrice) {
          const marketData = useMarketDataStore.getState();
          markPrice = marketData.tickers[position.pair]?.price;
        }
        if (!markPrice || markPrice <= 0) {
          markPrice = position.markPrice;
        }

        // Slippage on exit
        const exitDirection = position.direction === 'LONG' ? 'SHORT' : 'LONG';
        const notional = position.quantity * markPrice;
        const actualExitPrice = calculateSlippagePrice(markPrice, exitDirection, notional);

        // Unrealized PnL at exit price
        const grossPnl = calculateUnrealizedPnl(
          position.direction,
          position.entryPrice,
          actualExitPrice,
          position.quantity
        );

        const closingFee = calculateFee(position.quantity * actualExitPrice, DEFAULT_TAKER_FEE_RATE);
        const netRealizedPnl = grossPnl - closingFee;
        const roe = calculateRoe(netRealizedPnl, position.initialMargin);

        // Release margin and register PnL in wallet
        wallet.recordTradeResult(netRealizedPnl, position.initialMargin);

        const historyItem: TradeHistoryItem = {
          id: generateId(),
          positionId: position.id,
          pair: position.pair,
          direction: position.direction,
          leverage: position.leverage,
          entryPrice: position.entryPrice,
          exitPrice: actualExitPrice,
          quantity: position.quantity,
          initialMargin: position.initialMargin,
          realizedPnl: netRealizedPnl,
          roe,
          feesPaid: closingFee,
          status: 'CLOSED',
          openedAt: position.createdAt,
          closedAt: Date.now(),
        };

        set((s) => ({
          positions: s.positions.filter((p) => p.id !== positionId),
          tradeHistory: [historyItem, ...s.tradeHistory],
        }));

        return { success: true, netRealizedPnl, roe };
      },

      forceLiquidatePosition: (positionId: string, triggerPrice: number) => {
        const state = get();
        const position = state.positions.find((p) => p.id === positionId);
        if (!position) return;

        const wallet = useWalletStore.getState();

        // On liquidation, entire initial margin is consumed
        wallet.recordTradeResult(-position.initialMargin, position.initialMargin);

        const historyItem: TradeHistoryItem = {
          id: generateId(),
          positionId: position.id,
          pair: position.pair,
          direction: position.direction,
          leverage: position.leverage,
          entryPrice: position.entryPrice,
          exitPrice: triggerPrice,
          quantity: position.quantity,
          initialMargin: position.initialMargin,
          realizedPnl: -position.initialMargin,
          roe: -100.0,
          feesPaid: calculateFee(position.quantity * triggerPrice, DEFAULT_TAKER_FEE_RATE),
          status: 'LIQUIDATED',
          openedAt: position.createdAt,
          closedAt: Date.now(),
        };

        const liquidationEvent: LiquidationEvent = {
          id: generateId(),
          position,
          liquidationPrice: triggerPrice,
          wipedMargin: position.initialMargin,
          timestamp: Date.now(),
        };

        set((s) => ({
          positions: s.positions.filter((p) => p.id !== positionId),
          tradeHistory: [historyItem, ...s.tradeHistory],
          latestLiquidation: liquidationEvent,
          isLiquidationModalOpen: true,
        }));
      },

      updatePricesAndPnL: (markPrices: Record<string, number>) => {
        const wallet = useWalletStore.getState();
        let totalUnrealizedPnl = 0;

        set((state) => {
          if (state.positions.length === 0) return state;

          const updatedPositions = state.positions.map((pos) => {
            const mark = markPrices[pos.pair];
            if (!mark || mark <= 0) {
              totalUnrealizedPnl += pos.unrealizedPnl;
              return pos;
            }

            const uPnL = calculateUnrealizedPnl(pos.direction, pos.entryPrice, mark, pos.quantity);
            const roe = calculateRoe(uPnL, pos.initialMargin);
            totalUnrealizedPnl += uPnL;

            return {
              ...pos,
              markPrice: mark,
              unrealizedPnl: uPnL,
              roe,
            };
          });

          return { positions: updatedPositions };
        });

        wallet.recalculateEquity(totalUnrealizedPnl);
      },

      closeLiquidationModal: () => {
        set({ isLiquidationModalOpen: false });
      },

      clearTradeHistory: () => {
        set({ tradeHistory: [] });
      },
    }),
    {
      name: 'cryptoos98-trading-storage',
      storage: createJSONStorage(() => safeStateStorage),
      partialize: (state) => ({
        positions: state.positions,
        tradeHistory: state.tradeHistory,
      }),
    }
  )
);
