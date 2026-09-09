import { useTradingStore } from '@/stores/useTradingStore';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { DEFAULT_FUNDING_RATE } from '@/utils/simulationMath';

export interface FundingSettlementRecord {
  id: string;
  timestamp: number;
  positionId: string;
  pair: string;
  direction: 'LONG' | 'SHORT';
  notionalValue: number;
  fundingRate: number;
  paymentAmount: number; // positive = paid by trader, negative = received by trader
}

export class FundingRateEngineService {
  private fundingHistory: FundingSettlementRecord[] = [];

  /**
   * Calculate next funding timestamp in UTC (00:00, 08:00, 16:00 UTC)
   */
  public getNextFundingTimestamp(): number {
    const now = new Date();
    const currentUtcHours = now.getUTCHours();

    let targetUtcHour = 0;
    if (currentUtcHours < 8) {
      targetUtcHour = 8;
    } else if (currentUtcHours < 16) {
      targetUtcHour = 16;
    } else {
      targetUtcHour = 24; // next day 00:00 UTC
    }

    const nextFunding = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      targetUtcHour,
      0,
      0,
      0
    ));

    return nextFunding.getTime();
  }

  /**
   * Get formatted countdown string (HH:MM:SS) until next funding round
   */
  public getTimeUntilNextFunding(): { formatted: string; secondsRemaining: number } {
    const nextTimestamp = this.getNextFundingTimestamp();
    const now = Date.now();
    const diffMs = Math.max(0, nextTimestamp - now);
    const totalSec = Math.floor(diffMs / 1000);

    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      formatted: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
      secondsRemaining: totalSec,
    };
  }

  /**
   * Settle funding fees across all currently open positions
   * Returns list of settlement records
   */
  public settleFundingRound(): FundingSettlementRecord[] {
    const tradingStore = useTradingStore.getState();
    const marketStore = useMarketDataStore.getState();
    const walletStore = useWalletStore.getState();

    const positions = tradingStore.positions;
    if (positions.length === 0) return [];

    const settlements: FundingSettlementRecord[] = [];
    let totalNetPayment = 0; // positive = paid by trader, negative = received by trader

    for (const pos of positions) {
      const ticker = marketStore.tickers[pos.pair];
      const markPrice = ticker?.price && ticker.price > 0 ? ticker.price : pos.markPrice;
      const fundingRate = ticker?.fundingRate !== undefined && ticker.fundingRate !== 0
        ? ticker.fundingRate
        : DEFAULT_FUNDING_RATE;

      const notional = pos.quantity * markPrice;
      const rawPayment = notional * fundingRate;

      // Directional logic:
      // If fundingRate > 0:
      //   LONG pays funding (+payment)
      //   SHORT receives funding (-payment)
      // If fundingRate < 0:
      //   LONG receives funding (-payment)
      //   SHORT pays funding (+payment)
      let paymentAmount = 0;
      if (pos.direction === 'LONG') {
        paymentAmount = rawPayment;
      } else {
        paymentAmount = -rawPayment;
      }

      totalNetPayment += paymentAmount;

      const record: FundingSettlementRecord = {
        id: 'fund_' + Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        positionId: pos.id,
        pair: pos.pair,
        direction: pos.direction,
        notionalValue: notional,
        fundingRate,
        paymentAmount,
      };

      settlements.push(record);
      this.fundingHistory.unshift(record);
    }

    // Apply net funding to wallet
    walletStore.applyFundingPayment(totalNetPayment);

    return settlements;
  }

  public getHistory(): FundingSettlementRecord[] {
    return [...this.fundingHistory];
  }

  public clearHistory(): void {
    this.fundingHistory = [];
  }
}

export const fundingRateEngine = new FundingRateEngineService();
