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
  roundCurrency,
  roundQuantity,
  roundToDecimals,
  MAINTENANCE_MARGIN_RATES,
  DEFAULT_MMR,
  DEFAULT_TAKER_FEE_RATE,
} from '@/utils/simulationMath';
import { useWalletStore } from './useWalletStore';
import { useMarketDataStore } from './useMarketDataStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

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
  selectedFlexTrade: Position | TradeHistoryItem | null;

  // Actions
  openPosition: (params: OpenOrderParams, executionPrice?: number) => { success: boolean; error?: string; position?: Position };
  closePosition: (positionId: string, exitPrice?: number) => { success: boolean; error?: string; netRealizedPnl?: number; roe?: number };
  forceLiquidatePosition: (positionId: string, triggerPrice: number) => void;
  updatePricesAndPnL: (markPrices: Record<string, number>) => void;
  closeLiquidationModal: () => void;
  clearTradeHistory: () => void;
  setSelectedFlexTrade: (trade: Position | TradeHistoryItem | null) => void;
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
      selectedFlexTrade: null,

      setSelectedFlexTrade: (trade: Position | TradeHistoryItem | null) => {
        set({ selectedFlexTrade: trade });
      },

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

        if (
          !Number.isFinite(margin) ||
          !Number.isFinite(leverage) ||
          margin <= 0 ||
          leverage <= 0 ||
          isNaN(margin) ||
          isNaN(leverage)
        ) {
          return { success: false, error: 'Invalid margin or leverage value' };
        }

        const normalizedMargin = roundCurrency(margin);
        if (normalizedMargin <= 0) {
          return { success: false, error: 'Margin amount must be greater than zero' };
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
        const notional = calculateNotionalValue(normalizedMargin, leverage);
        const rawFillPrice = type === 'MARKET'
          ? calculateSlippagePrice(markPrice, direction, notional)
          : (limitPrice || markPrice);
        const fillPrice = roundToDecimals(rawFillPrice, 2);

        const quantity = roundQuantity(calculateQuantity(normalizedMargin, leverage, fillPrice));
        const openingFee = roundCurrency(calculateFee(notional, DEFAULT_TAKER_FEE_RATE));

        // Required upfront = normalizedMargin + openingFee
        if (wallet.availableMargin < normalizedMargin + openingFee) {
          return {
            success: false,
            error: `Insufficient available balance: Need $${(normalizedMargin + openingFee).toFixed(2)} USDT (Margin: $${normalizedMargin.toFixed(2)}, Fee: $${openingFee.toFixed(2)})`,
          };
        }

        // Deduct opening fee
        wallet.deductFee(openingFee);

        // Lock margin
        const locked = wallet.lockMargin(normalizedMargin);
        if (!locked) {
          return { success: false, error: 'Failed to lock margin in wallet' };
        }

        const mmr = MAINTENANCE_MARGIN_RATES[pair] ?? DEFAULT_MMR;
        const rawLiq = calculateLiquidationPrice({
          direction,
          entryPrice: fillPrice,
          initialMargin: normalizedMargin,
          quantity,
          leverage,
          mmr,
          takerFeeRate: DEFAULT_TAKER_FEE_RATE,
          marginMode,
          totalEquity: wallet.equity,
        });
        const liquidationPrice = roundToDecimals(rawLiq, 2);

        const newPosition: Position = {
          id: generateId(),
          pair,
          direction,
          marginMode,
          leverage,
          entryPrice: fillPrice,
          markPrice: roundToDecimals(markPrice, 2),
          quantity,
          initialMargin: normalizedMargin,
          liquidationPrice,
          unrealizedPnl: 0,
          roe: 0,
          createdAt: Date.now(),
        };

        set((state) => ({
          positions: [newPosition, ...state.positions],
        }));

        // If Web3 cloud session is active, synchronize asynchronously with Postgres RPC
        try {
          const rawAuth = localStorage.getItem('cryptoos98-auth-storage');
          if (rawAuth && isSupabaseConfigured && supabase) {
            const parsed = JSON.parse(rawAuth);
            const address = parsed.state?.walletAddress;
            if (address && parsed.state?.isConnected) {
              const client = supabase;
              (async () => {
                try {
                  const { data, error } = await client.rpc('rpc_open_position', {
                    p_wallet_address: address,
                    p_pair: pair,
                    p_direction: direction,
                    p_margin_mode: marginMode,
                    p_leverage: leverage,
                    p_margin: normalizedMargin,
                    p_entry_price: fillPrice,
                  });

                  if (error) {
                    console.error('[useTradingStore] Cloud RPC open position error:', error.message);
                  } else if (data?.position) {
                    // Reconcile local position with database UUID and exact liquidation price
                    set((s) => ({
                      positions: s.positions.map((p) =>
                        p.id === newPosition.id
                          ? {
                              ...p,
                              id: data.position.id,
                              liquidationPrice: Number(data.position.liquidation_price),
                            }
                          : p
                      ),
                    }));
                    if (data.wallet) {
                      useWalletStore.getState().setCloudWalletState({
                        equity: Number(data.wallet.equity),
                        availableMargin: Number(data.wallet.available_margin),
                        lockedMargin: Number(data.wallet.locked_margin),
                      });
                    }
                  }
                } catch (rpcErr) {
                  console.warn('[useTradingStore] Cloud RPC open error:', rpcErr);
                }
              })();
            }
          }
        } catch {
          // Fallback gracefully
        }

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
        const actualExitPrice = roundToDecimals(calculateSlippagePrice(markPrice, exitDirection, notional), 2);

        // Unrealized PnL at exit price
        const grossPnl = calculateUnrealizedPnl(
          position.direction,
          position.entryPrice,
          actualExitPrice,
          position.quantity
        );

        const closingFee = roundCurrency(calculateFee(position.quantity * actualExitPrice, DEFAULT_TAKER_FEE_RATE));
        const netRealizedPnl = roundCurrency(grossPnl - closingFee);
        const roe = roundToDecimals(calculateRoe(netRealizedPnl, position.initialMargin), 2);

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

        // If Web3 cloud session is active, synchronize asynchronously with Postgres RPC
        try {
          const rawAuth = localStorage.getItem('cryptoos98-auth-storage');
          if (rawAuth && isSupabaseConfigured && supabase) {
            const parsed = JSON.parse(rawAuth);
            const address = parsed.state?.walletAddress;
            if (address && parsed.state?.isConnected) {
              const client = supabase;
              (async () => {
                try {
                  const { data, error } = await client.rpc('rpc_close_position', {
                    p_wallet_address: address,
                    p_position_id: position.id,
                    p_exit_price: actualExitPrice,
                    p_close_reason: 'MANUAL_CLOSE',
                  });

                  if (error) {
                    console.error('[useTradingStore] Cloud RPC close position error:', error.message);
                  } else if (data?.wallet) {
                    useWalletStore.getState().setCloudWalletState({
                      equity: Number(data.wallet.equity),
                      availableMargin: Number(data.wallet.available_margin),
                      lockedMargin: Number(data.wallet.locked_margin),
                      realizedPnl: Number(data.wallet.total_realized_pnl),
                      winCount: Number(data.wallet.win_count),
                      lossCount: Number(data.wallet.loss_count),
                      totalTrades: Number(data.wallet.total_trades),
                    });
                  }
                } catch (rpcErr) {
                  console.warn('[useTradingStore] Cloud RPC close error:', rpcErr);
                }
              })();
            }
          }
        } catch {
          // Fallback gracefully
        }

        return { success: true, netRealizedPnl, roe };
      },

      forceLiquidatePosition: (positionId: string, triggerPrice: number) => {
        const state = get();
        const position = state.positions.find((p) => p.id === positionId);
        if (!position) return;

        const wallet = useWalletStore.getState();

        // On liquidation, entire initial margin is consumed
        wallet.recordTradeResult(-position.initialMargin, position.initialMargin);

        const trigger = roundToDecimals(triggerPrice, 2);
        const feesPaid = roundCurrency(calculateFee(position.quantity * trigger, DEFAULT_TAKER_FEE_RATE));

        const historyItem: TradeHistoryItem = {
          id: generateId(),
          positionId: position.id,
          pair: position.pair,
          direction: position.direction,
          leverage: position.leverage,
          entryPrice: position.entryPrice,
          exitPrice: trigger,
          quantity: position.quantity,
          initialMargin: position.initialMargin,
          realizedPnl: -position.initialMargin,
          roe: -100.0,
          feesPaid,
          status: 'LIQUIDATED',
          openedAt: position.createdAt,
          closedAt: Date.now(),
        };

        const liquidationEvent: LiquidationEvent = {
          id: generateId(),
          position,
          liquidationPrice: trigger,
          wipedMargin: position.initialMargin,
          timestamp: Date.now(),
        };

        set((s) => ({
          positions: s.positions.filter((p) => p.id !== positionId),
          tradeHistory: [historyItem, ...s.tradeHistory],
          latestLiquidation: liquidationEvent,
          isLiquidationModalOpen: true,
        }));

        // If Web3 cloud session is active, synchronize liquidation with Postgres RPC
        try {
          const rawAuth = localStorage.getItem('cryptoos98-auth-storage');
          if (rawAuth && isSupabaseConfigured && supabase) {
            const parsed = JSON.parse(rawAuth);
            const address = parsed.state?.walletAddress;
            if (address && parsed.state?.isConnected) {
              const client = supabase;
              (async () => {
                try {
                  await client.rpc('rpc_close_position', {
                    p_wallet_address: address,
                    p_position_id: position.id,
                    p_exit_price: trigger,
                    p_close_reason: 'LIQUIDATED',
                  });
                } catch {
                  // Fallback gracefully
                }
              })();
            }
          }
        } catch {}
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

            const roundedMark = roundToDecimals(mark, 2);
            const rawPnl = calculateUnrealizedPnl(pos.direction, pos.entryPrice, roundedMark, pos.quantity);
            const uPnL = roundCurrency(rawPnl);
            const roe = roundToDecimals(calculateRoe(uPnL, pos.initialMargin), 2);
            totalUnrealizedPnl += uPnL;

            return {
              ...pos,
              markPrice: roundedMark,
              unrealizedPnl: uPnL,
              roe,
            };
          });

          return { positions: updatedPositions };
        });

        wallet.recalculateEquity(roundCurrency(totalUnrealizedPnl));
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
