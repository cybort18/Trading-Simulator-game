import { describe, it, expect, beforeEach } from 'vitest';
import { fundingRateEngine } from '../FundingRateEngine';
import { useTradingStore } from '@/stores/useTradingStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { useMarketDataStore } from '@/stores/useMarketDataStore';

describe('FundingRateEngine', () => {
  beforeEach(() => {
    useWalletStore.getState().resetWallet(100.00);
    useTradingStore.setState({
      positions: [],
      tradeHistory: [],
    });
    fundingRateEngine.clearHistory();
  });

  it('calculates valid next funding timestamp and countdown format', () => {
    const nextTs = fundingRateEngine.getNextFundingTimestamp();
    expect(nextTs).toBeGreaterThan(Date.now());

    const countdown = fundingRateEngine.getTimeUntilNextFunding();
    expect(countdown.secondsRemaining).toBeGreaterThan(0);
    expect(countdown.formatted).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('long position pays positive funding fee, reducing wallet balance', () => {
    // Open 10x Long on BTC with 10.00 USDT margin at $60,000 => Notional $100
    useTradingStore.getState().openPosition(
      {
        pair: 'BTCUSDT',
        direction: 'LONG',
        leverage: 10,
        margin: 10.00,
        type: 'LIMIT',
        limitPrice: 60000.0,
      },
      60000.0
    );

    // Set funding rate to +0.01% (0.0001)
    useMarketDataStore.setState({
      tickers: {
        BTCUSDT: {
          symbol: 'BTCUSDT',
          price: 60000.0,
          change24h: 0,
          high24h: 60000,
          low24h: 60000,
          volume24h: 1000,
          fundingRate: 0.0001, // +0.01%
          nextFundingTime: Date.now() + 3600000,
        },
        ETHUSDT: {
          symbol: 'ETHUSDT',
          price: 3000.0,
          change24h: 0,
          high24h: 3000,
          low24h: 3000,
          volume24h: 1000,
          fundingRate: 0.0001,
          nextFundingTime: Date.now() + 3600000,
        },
        SOLUSDT: {
          symbol: 'SOLUSDT',
          price: 150.0,
          change24h: 0,
          high24h: 150,
          low24h: 150,
          volume24h: 1000,
          fundingRate: 0.0001,
          nextFundingTime: Date.now() + 3600000,
        },
      },
    });

    const initialWalletAvail = useWalletStore.getState().availableMargin;

    // Settle funding: Long pays 100 * 0.0001 = 0.01 USDT
    const settlements = fundingRateEngine.settleFundingRound();
    expect(settlements.length).toBe(1);
    expect(settlements[0].paymentAmount).toBeCloseTo(0.01, 4);

    const postWalletAvail = useWalletStore.getState().availableMargin;
    expect(initialWalletAvail - postWalletAvail).toBeCloseTo(0.01, 4);
  });

  it('short position receives funding payment when rate is positive', () => {
    // Open 10x Short on BTC with 10.00 USDT margin at $60,000 => Notional $100
    useTradingStore.getState().openPosition(
      {
        pair: 'BTCUSDT',
        direction: 'SHORT',
        leverage: 10,
        margin: 10.00,
        type: 'LIMIT',
        limitPrice: 60000.0,
      },
      60000.0
    );

    useMarketDataStore.setState({
      tickers: {
        BTCUSDT: {
          symbol: 'BTCUSDT',
          price: 60000.0,
          change24h: 0,
          high24h: 60000,
          low24h: 60000,
          volume24h: 1000,
          fundingRate: 0.0001, // +0.01%
          nextFundingTime: Date.now() + 3600000,
        },
        ETHUSDT: {
          symbol: 'ETHUSDT',
          price: 3000.0,
          change24h: 0,
          high24h: 3000,
          low24h: 3000,
          volume24h: 1000,
          fundingRate: 0.0001,
          nextFundingTime: Date.now() + 3600000,
        },
        SOLUSDT: {
          symbol: 'SOLUSDT',
          price: 150.0,
          change24h: 0,
          high24h: 150,
          low24h: 150,
          volume24h: 1000,
          fundingRate: 0.0001,
          nextFundingTime: Date.now() + 3600000,
        },
      },
    });

    const initialWalletAvail = useWalletStore.getState().availableMargin;

    // Settle funding: Short receives 100 * 0.0001 = 0.01 USDT
    const settlements = fundingRateEngine.settleFundingRound();
    expect(settlements.length).toBe(1);
    expect(settlements[0].paymentAmount).toBeCloseTo(-0.01, 4);

    const postWalletAvail = useWalletStore.getState().availableMargin;
    expect(postWalletAvail - initialWalletAvail).toBeCloseTo(0.01, 4);
  });
});
