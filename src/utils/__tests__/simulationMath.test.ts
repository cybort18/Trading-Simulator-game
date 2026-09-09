import { describe, it, expect } from 'vitest';
import {
  calculateNotionalValue,
  calculateQuantity,
  calculateUnrealizedPnl,
  calculateRoe,
  calculateMaintenanceMargin,
  calculateLiquidationPrice,
  calculateFee,
  calculateSlippagePrice,
  roundToDecimals,
  MAINTENANCE_MARGIN_RATES,
  DEFAULT_TAKER_FEE_RATE,
  DEFAULT_MAKER_FEE_RATE,
} from '../simulationMath';

describe('Financial Mathematics & Simulation Engine Core', () => {
  describe('SIMULATION_ENGINE.md Section 6 Worked Example (20x Long BTC)', () => {
    // Step 1: Initial Parameters
    const entryPrice = 60000.0;
    const initialMargin = 5.0;
    const leverage = 20;
    const mmr = MAINTENANCE_MARGIN_RATES.BTCUSDT; // 0.0050 (0.5%)
    const takerFeeRate = DEFAULT_TAKER_FEE_RATE; // 0.0005 (0.05%)

    it('Step 2: calculates correct notional exposure and sizing', () => {
      const notionalValue = calculateNotionalValue(initialMargin, leverage);
      expect(notionalValue).toBe(100.0);

      const quantity = calculateQuantity(initialMargin, leverage, entryPrice);
      // Q = 100 / 60000 = 0.0016666666666666668 BTC
      expect(quantity).toBeCloseTo(0.00166667, 7);

      const openingFee = calculateFee(notionalValue, takerFeeRate);
      expect(openingFee).toBe(0.05);

      // Remaining available balance after locking margin and paying fee from 10.00 USDT account
      const startingBalance = 10.0;
      const remainingAvailable = startingBalance - initialMargin - openingFee;
      expect(remainingAvailable).toBeCloseTo(4.95, 2);
    });

    it('Step 3: calculates exact isolated long liquidation price (~$57,315.23)', () => {
      const quantity = calculateQuantity(initialMargin, leverage, entryPrice);
      const liqPrice = calculateLiquidationPrice({
        direction: 'LONG',
        entryPrice,
        initialMargin,
        quantity,
        leverage,
        mmr,
        takerFeeRate,
        marginMode: 'ISOLATED',
      });

      // Pliq = 60000 * (1 - 1/20) / (1 - 0.0050 - 0.0005) = 60000 * 0.95 / 0.9945 = 57315.2337858
      expect(liqPrice).toBeCloseTo(57315.23, 1);
      expect(Math.abs(liqPrice - 57315.23)).toBeLessThan(0.5);
    });

    it('Step 4A: simulates bullish outcome (BTC rises to $63,000.00)', () => {
      const quantity = calculateQuantity(initialMargin, leverage, entryPrice);
      const markPrice = 63000.0;

      const uPnL = calculateUnrealizedPnl('LONG', entryPrice, markPrice, quantity);
      expect(uPnL).toBeCloseTo(5.0, 4);

      const roe = calculateRoe(uPnL, initialMargin);
      expect(roe).toBeCloseTo(100.0, 2);

      const closingFee = calculateFee(quantity * markPrice, takerFeeRate);
      expect(closingFee).toBeCloseTo(0.0525, 4);

      const realizedGain = uPnL - closingFee;
      expect(realizedGain).toBeCloseTo(4.9475, 4);
    });

    it('Step 4B: simulates liquidation event (BTC plunges to $57,315.23)', () => {
      const quantity = calculateQuantity(initialMargin, leverage, entryPrice);
      const markPrice = 57315.2338;

      const uPnL = calculateUnrealizedPnl('LONG', entryPrice, markPrice, quantity);
      expect(uPnL).toBeCloseTo(-4.4746, 3);

      const mm = calculateMaintenanceMargin(quantity, markPrice, mmr);
      expect(mm).toBeCloseTo(0.4776, 3);

      const closingFee = calculateFee(quantity * markPrice, takerFeeRate);
      expect(closingFee).toBeCloseTo(0.0478, 3);

      // Remaining collateral = initialMargin + uPnL - closingFee
      const remainingCollateral = initialMargin + uPnL - closingFee;
      expect(remainingCollateral).toBeCloseTo(mm, 2);
    });
  });

  describe('Short Positions', () => {
    const entryPrice = 60000.0;
    const initialMargin = 10.0;
    const leverage = 20;
    const mmr = MAINTENANCE_MARGIN_RATES.BTCUSDT;
    const takerFeeRate = DEFAULT_TAKER_FEE_RATE;
    const quantity = calculateQuantity(initialMargin, leverage, entryPrice);

    it('calculates profit when mark price falls', () => {
      const markPrice = 57000.0; // 5% drop
      const uPnL = calculateUnrealizedPnl('SHORT', entryPrice, markPrice, quantity);
      // Profit = (200 / 60000) * (60000 - 57000) = (1/300) * 3000 = +10.0 USDT
      expect(uPnL).toBeCloseTo(10.0, 4);

      const roe = calculateRoe(uPnL, initialMargin);
      expect(roe).toBeCloseTo(100.0, 2);
    });

    it('calculates loss when mark price rises', () => {
      const markPrice = 61500.0;
      const uPnL = calculateUnrealizedPnl('SHORT', entryPrice, markPrice, quantity);
      expect(uPnL).toBeCloseTo(-5.0, 4);

      const roe = calculateRoe(uPnL, initialMargin);
      expect(roe).toBeCloseTo(-50.0, 2);
    });

    it('calculates isolated short liquidation price correctly', () => {
      const liqPrice = calculateLiquidationPrice({
        direction: 'SHORT',
        entryPrice,
        initialMargin,
        quantity,
        leverage,
        mmr,
        takerFeeRate,
        marginMode: 'ISOLATED',
      });

      // Pliq = 60000 * (1 + 1/20) / (1 + 0.0050 + 0.0005) = 60000 * 1.05 / 1.0055 = 62655.3953
      expect(liqPrice).toBeCloseTo(62655.4, 1);
    });
  });

  describe('Leverage Multipliers (1x to 100x)', () => {
    const entryPrice = 60000.0;
    const initialMargin = 10.0;
    const mmr = 0.0050;
    const takerFee = 0.0005;

    it('1x leverage isolated long has 0 or unreachable liquidation price', () => {
      const quantity = calculateQuantity(initialMargin, 1, entryPrice);
      const liqPrice = calculateLiquidationPrice({
        direction: 'LONG',
        entryPrice,
        initialMargin,
        quantity,
        leverage: 1,
        mmr,
        takerFeeRate: takerFee,
        marginMode: 'ISOLATED',
      });
      // 1 - 1/1 = 0 => liqPrice = 0
      expect(liqPrice).toBe(0);
    });

    it('10x leverage isolated long liquidation is at ~10% below entry', () => {
      const quantity = calculateQuantity(initialMargin, 10, entryPrice);
      const liqPrice = calculateLiquidationPrice({
        direction: 'LONG',
        entryPrice,
        initialMargin,
        quantity,
        leverage: 10,
        mmr,
        takerFeeRate: takerFee,
        marginMode: 'ISOLATED',
      });
      // 60000 * (1 - 0.1) / 0.9945 = 54000 / 0.9945 = 54298.64
      expect(liqPrice).toBeCloseTo(54298.64, 1);
    });

    it('50x leverage isolated long liquidation price is very close to entry (~2% drop)', () => {
      const quantity = calculateQuantity(initialMargin, 50, entryPrice);
      const liqPrice = calculateLiquidationPrice({
        direction: 'LONG',
        entryPrice,
        initialMargin,
        quantity,
        leverage: 50,
        mmr,
        takerFeeRate: takerFee,
        marginMode: 'ISOLATED',
      });
      // 60000 * (1 - 1/50) / 0.9945 = 58800 / 0.9945 = 59125.19
      expect(liqPrice).toBeCloseTo(59125.19, 1);
    });

    it('100x leverage isolated long liquidation price is within <1% drop', () => {
      const quantity = calculateQuantity(initialMargin, 100, entryPrice);
      const liqPrice = calculateLiquidationPrice({
        direction: 'LONG',
        entryPrice,
        initialMargin,
        quantity,
        leverage: 100,
        mmr,
        takerFeeRate: takerFee,
        marginMode: 'ISOLATED',
      });
      // 60000 * (1 - 0.01) / 0.9945 = 60000 * 0.99 / 0.9945 = 59,728.51
      expect(liqPrice).toBeCloseTo(59728.51, 1);
    });
  });

  describe('Cross Margin Mode', () => {
    const entryPrice = 60000.0;
    const initialMargin = 10.0;
    const leverage = 20;
    const mmr = 0.0050;
    const takerFee = 0.0005;
    const quantity = calculateQuantity(initialMargin, leverage, entryPrice);

    it('cross long with large account equity buffers liquidation price down to 0', () => {
      const totalEquity = 500.0; // Large equity buffer
      const liqPrice = calculateLiquidationPrice({
        direction: 'LONG',
        entryPrice,
        initialMargin,
        quantity,
        leverage,
        mmr,
        takerFeeRate: takerFee,
        marginMode: 'CROSS',
        totalEquity,
      });
      // (60000 * 0.003333 - 500) < 0 => clamped to 0
      expect(liqPrice).toBe(0);
    });

    it('cross long with total equity matching initial margin matches isolated price', () => {
      const liqPriceCross = calculateLiquidationPrice({
        direction: 'LONG',
        entryPrice,
        initialMargin,
        quantity,
        leverage,
        mmr,
        takerFeeRate: takerFee,
        marginMode: 'CROSS',
        totalEquity: initialMargin,
      });

      const liqPriceIsolated = calculateLiquidationPrice({
        direction: 'LONG',
        entryPrice,
        initialMargin,
        quantity,
        leverage,
        mmr,
        takerFeeRate: takerFee,
        marginMode: 'ISOLATED',
      });

      expect(liqPriceCross).toBeCloseTo(liqPriceIsolated, 2);
    });
  });

  describe('Fees and Slippage Modeling', () => {
    it('calculates taker and maker fees accurately', () => {
      const notional = 1000.0;
      expect(calculateFee(notional, DEFAULT_TAKER_FEE_RATE)).toBe(0.5);
      expect(calculateFee(notional, DEFAULT_MAKER_FEE_RATE)).toBe(0.2);
    });

    it('clamps slippage to minimum 0.05% for small order sizes (<= 100 USDT)', () => {
      const markPrice = 60000.0;
      const longFill50 = calculateSlippagePrice(markPrice, 'LONG', 50);
      const longFill100 = calculateSlippagePrice(markPrice, 'LONG', 100);

      // Both should be 60000 * (1 + 0.0005) = 60030
      expect(longFill50).toBe(60030);
      expect(longFill100).toBe(60030);

      const shortFill100 = calculateSlippagePrice(markPrice, 'SHORT', 100);
      expect(shortFill100).toBe(59970);
    });

    it('increases slippage for larger order sizes', () => {
      const markPrice = 60000.0;
      // 400 USDT order -> sqrt(400/100) = 2 -> slippageRate = 0.0005 * 2 = 0.0010 (0.10%)
      const longFill400 = calculateSlippagePrice(markPrice, 'LONG', 400);
      expect(longFill400).toBe(60000 * (1 + 0.001));

      // 10000 USDT order -> sqrt(10000/100) = 10 -> slippageRate = 0.0005 * 10 = 0.0050 (0.50%)
      const longFill10000 = calculateSlippagePrice(markPrice, 'LONG', 10000);
      expect(longFill10000).toBe(60000 * (1 + 0.005));
    });
  });

  describe('Robustness and Edge Cases', () => {
    it('handles zero or negative inputs safely without throwing or returning NaN', () => {
      expect(calculateNotionalValue(0, 20)).toBe(0);
      expect(calculateNotionalValue(-5, 20)).toBe(0);
      expect(calculateQuantity(0, 20, 60000)).toBe(0);
      expect(calculateQuantity(10, 0, 60000)).toBe(0);
      expect(calculateQuantity(10, 20, 0)).toBe(0);
      expect(calculateUnrealizedPnl('LONG', 0, 60000, 1)).toBe(0);
      expect(calculateRoe(5, 0)).toBe(0);
      expect(calculateMaintenanceMargin(0, 60000, 0.005)).toBe(0);
      expect(calculateFee(0, 0.0005)).toBe(0);
      expect(calculateSlippagePrice(0, 'LONG', 100)).toBe(0);
    });

    it('roundToDecimals formats correctly', () => {
      expect(roundToDecimals(57315.2337858, 2)).toBe(57315.23);
      expect(roundToDecimals(0.00166667, 4)).toBe(0.0017);
      expect(roundToDecimals(100.0, 2)).toBe(100);
    });
  });
});
