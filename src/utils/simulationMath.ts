/**
 * Financial Mathematics & Simulation Engine Core Library
 * Strictly implements perpetual futures math from SIMULATION_ENGINE.md
 * 
 * Features:
 * - Deterministic pure functions
 * - Micro-precision floating point calculations
 * - Safeguards against division by zero and invalid inputs
 */

export const MAINTENANCE_MARGIN_RATES: Record<string, number> = {
  BTCUSDT: 0.0050, // 0.50%
  ETHUSDT: 0.0065, // 0.65%
  SOLUSDT: 0.0100, // 1.00%
};

export const DEFAULT_MMR = 0.0050;
export const DEFAULT_TAKER_FEE_RATE = 0.0005; // 0.05%
export const DEFAULT_MAKER_FEE_RATE = 0.0002; // 0.02%
export const DEFAULT_FUNDING_RATE = 0.0001;   // 0.01% per 8h

export type PositionDirection = 'LONG' | 'SHORT';
export type MarginMode = 'ISOLATED' | 'CROSS';

export interface LiquidationParams {
  direction: PositionDirection;
  entryPrice: number;
  initialMargin: number;
  quantity: number;
  leverage: number;
  mmr: number;
  takerFeeRate: number;
  marginMode: MarginMode;
  totalEquity?: number;
}

/**
 * 1. Calculate Notional Value (Gross dollar exposure)
 * Formula: V = margin * leverage
 */
export function calculateNotionalValue(margin: number, leverage: number): number {
  if (margin <= 0 || leverage <= 0) return 0;
  return margin * leverage;
}

/**
 * 2. Calculate Contract Quantity in base asset units (BTC, ETH, SOL)
 * Formula: Q = (margin * leverage) / entryPrice
 */
export function calculateQuantity(margin: number, leverage: number, entryPrice: number): number {
  if (margin <= 0 || leverage <= 0 || entryPrice <= 0) return 0;
  return (margin * leverage) / entryPrice;
}

/**
 * 3. Calculate Unrealized PnL based on Mark Price
 * Long:  Q * (markPrice - entryPrice)
 * Short: Q * (entryPrice - markPrice)
 */
export function calculateUnrealizedPnl(
  direction: PositionDirection,
  entryPrice: number,
  markPrice: number,
  quantity: number
): number {
  if (quantity <= 0 || entryPrice <= 0 || markPrice <= 0) return 0;
  if (direction === 'LONG') {
    return quantity * (markPrice - entryPrice);
  } else {
    return quantity * (entryPrice - markPrice);
  }
}

/**
 * 4. Calculate Return on Equity (ROE %)
 * Formula: (unrealizedPnl / initialMargin) * 100
 */
export function calculateRoe(unrealizedPnl: number, initialMargin: number): number {
  if (initialMargin <= 0) return 0;
  return (unrealizedPnl / initialMargin) * 100;
}

/**
 * 5. Calculate Maintenance Margin (Minimum mandatory capital buffer)
 * Formula: (quantity * markPrice) * mmr
 */
export function calculateMaintenanceMargin(
  quantity: number,
  markPrice: number,
  mmr: number = DEFAULT_MMR
): number {
  if (quantity <= 0 || markPrice <= 0 || mmr < 0) return 0;
  return quantity * markPrice * mmr;
}

/**
 * 6. Calculate Exact Liquidation Price (Pliq)
 * 
 * Isolated Margin:
 * - Long:  Pliq = (P_entry * Q - IM) / (Q * (1 - MMR - F_taker))
 *          or P_entry * (1 - 1/L) / (1 - MMR - F_taker)
 * - Short: Pliq = (P_entry * Q + IM) / (Q * (1 + MMR + F_taker))
 *          or P_entry * (1 + 1/L) / (1 + MMR + F_taker)
 * 
 * Cross Margin:
 * - Long:  Pliq = (P_entry * Q - TotalEquity) / (Q * (1 - MMR - F_taker))
 * - Short: Pliq = (P_entry * Q + TotalEquity) / (Q * (1 + MMR + F_taker))
 */
export function calculateLiquidationPrice(params: LiquidationParams): number {
  const {
    direction,
    entryPrice,
    initialMargin,
    quantity,
    leverage,
    mmr,
    takerFeeRate,
    marginMode,
    totalEquity,
  } = params;

  if (entryPrice <= 0 || initialMargin <= 0) return 0;

  const effectiveQuantity = quantity > 0 ? quantity : calculateQuantity(initialMargin, leverage, entryPrice);
  if (effectiveQuantity <= 0) return 0;

  if (marginMode === 'CROSS') {
    const equity = totalEquity !== undefined ? totalEquity : initialMargin;
    if (direction === 'LONG') {
      const denom = effectiveQuantity * (1 - mmr - takerFeeRate);
      if (denom <= 0) return 0;
      const num = entryPrice * effectiveQuantity - equity;
      return Math.max(0, num / denom);
    } else {
      const denom = effectiveQuantity * (1 + mmr + takerFeeRate);
      if (denom <= 0) return 0;
      const num = entryPrice * effectiveQuantity + equity;
      return num / denom;
    }
  }

  // ISOLATED MARGIN MODE
  if (direction === 'LONG') {
    const denom = effectiveQuantity * (1 - mmr - takerFeeRate);
    if (denom <= 0) return 0;
    const num = entryPrice * effectiveQuantity - initialMargin;
    const liqPrice = num / denom;
    return Math.max(0, liqPrice);
  } else {
    const denom = effectiveQuantity * (1 + mmr + takerFeeRate);
    if (denom <= 0) return 0;
    const num = entryPrice * effectiveQuantity + initialMargin;
    return num / denom;
  }
}

/**
 * 7. Calculate Trading Fee
 * Formula: notionalValue * feeRate
 */
export function calculateFee(notionalValue: number, feeRate: number = DEFAULT_TAKER_FEE_RATE): number {
  if (notionalValue <= 0 || feeRate <= 0) return 0;
  return notionalValue * feeRate;
}

/**
 * 8. Calculate Slippage Execution Price
 * Formula: slippageRate = 0.0005 * sqrt(orderSizeUsdt / 100), clamped at minimum 0.05% (0.0005)
 * Long fills at:  markPrice * (1 + slippageRate)
 * Short fills at: markPrice * (1 - slippageRate)
 */
export function calculateSlippagePrice(
  markPrice: number,
  direction: PositionDirection,
  orderSizeUsdt: number
): number {
  if (markPrice <= 0) return 0;
  if (orderSizeUsdt <= 0) return markPrice;

  const baseSlippage = 0.0005 * Math.sqrt(orderSizeUsdt / 100);
  const slippageRate = Math.max(0.0005, baseSlippage);

  if (direction === 'LONG') {
    return markPrice * (1 + slippageRate);
  } else {
    return markPrice * (1 - slippageRate);
  }
}

/**
 * Helper: Round float to given decimal places
 */
export function roundToDecimals(val: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Normalizes currency values (USDT) to 2 decimal places with EPSILON protection.
 * Automatically eliminates micro-dust artifacts (e.g. 0.000000001 or 4.950000000000001).
 * Clamps dust values with magnitude < 0.0001 to 0.
 */
export function roundCurrency(val: number): number {
  if (Math.abs(val) < 0.0001) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Normalizes crypto contract quantities to standard asset decimals (default 6).
 */
export function roundQuantity(val: number, decimals: number = 6): number {
  if (Math.abs(val) < 1e-9) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

export interface CrossMarginRiskEvaluation {
  isLiquidated: boolean;
  totalCrossEquity: number;
  totalRequiredMaintenanceMargin: number;
  marginRatio: number;
}

/**
 * Evaluates portfolio-level Cross Margin risk across multiple open cross positions.
 * Strictly adheres to SIMULATION_ENGINE.md Section 4:
 * Total Account Equity = Available Margin + Sum(Initial Margin) + Sum(uPnL)
 * Liquidation triggers when: Total Account Equity <= Sum(Maintenance Margin)
 */
export function evaluateCrossMarginPortfolio(params: {
  crossPositions: Array<{
    direction: PositionDirection;
    entryPrice: number;
    quantity: number;
    initialMargin: number;
    pair: string;
  }>;
  markPrices: Record<string, number>;
  walletAvailableBalance: number;
}): CrossMarginRiskEvaluation {
  const { crossPositions, markPrices, walletAvailableBalance } = params;

  if (crossPositions.length === 0) {
    return {
      isLiquidated: false,
      totalCrossEquity: walletAvailableBalance,
      totalRequiredMaintenanceMargin: 0,
      marginRatio: 0,
    };
  }

  let totalInitialMargin = 0;
  let totalUpnl = 0;
  let totalMaintenanceMargin = 0;

  for (const pos of crossPositions) {
    const markPrice = markPrices[pos.pair] || pos.entryPrice;
    const upnl = calculateUnrealizedPnl(pos.direction, pos.entryPrice, markPrice, pos.quantity);
    const mmr = MAINTENANCE_MARGIN_RATES[pos.pair] ?? DEFAULT_MMR;
    const mm = calculateMaintenanceMargin(pos.quantity, markPrice, mmr);

    totalInitialMargin += pos.initialMargin;
    totalUpnl += upnl;
    totalMaintenanceMargin += mm;
  }

  const totalCrossEquity = walletAvailableBalance + totalInitialMargin + totalUpnl;
  const isLiquidated = totalCrossEquity <= totalMaintenanceMargin;
  const marginRatio = totalCrossEquity > 0
    ? (totalMaintenanceMargin / totalCrossEquity) * 100
    : 100;

  return {
    isLiquidated,
    totalCrossEquity: roundCurrency(totalCrossEquity),
    totalRequiredMaintenanceMargin: roundCurrency(totalMaintenanceMargin),
    marginRatio: roundToDecimals(marginRatio, 2),
  };
}

