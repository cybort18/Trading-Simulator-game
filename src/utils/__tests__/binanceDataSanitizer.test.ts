import { describe, it, expect } from 'vitest';
import {
  sanitizeKlinePayload,
  sanitizeHistoricalKlines,
  BinanceRawKline,
} from '../binanceDataSanitizer';

describe('Binance Data Sanitizer', () => {
  describe('sanitizeKlinePayload', () => {
    it('converts millisecond timestamp to seconds and string OHLCV to floats', () => {
      const raw: BinanceRawKline = {
        t: 1725883200000, // ms
        T: 1725883259999,
        s: 'BTCUSDT',
        i: '1m',
        o: '64120.50',
        c: '64180.25',
        h: '64200.00',
        l: '64100.10',
        v: '12.450',
      };

      const result = sanitizeKlinePayload(raw);
      expect(result).not.toBeNull();
      expect(result?.time).toBe(1725883200);
      expect(result?.open).toBe(64120.5);
      expect(result?.close).toBe(64180.25);
      expect(result?.high).toBe(64200.0);
      expect(result?.low).toBe(64100.1);
      expect(result?.volume).toBe(12.45);
    });

    it('handles numeric inputs directly without re-stringifying', () => {
      const raw: BinanceRawKline = {
        t: 1725883200, // already in seconds
        o: 64000,
        c: 64100,
        h: 64150,
        l: 63950,
        v: 5,
      };

      const result = sanitizeKlinePayload(raw);
      expect(result).not.toBeNull();
      expect(result?.time).toBe(1725883200);
      expect(result?.open).toBe(64000);
      expect(result?.close).toBe(64100);
    });

    it('returns null on corrupted, NaN or missing required candle data', () => {
      expect(sanitizeKlinePayload(null)).toBeNull();
      expect(sanitizeKlinePayload(undefined)).toBeNull();

      // Missing or invalid time
      expect(sanitizeKlinePayload({ t: 'invalid', o: '100', c: '100', h: '100', l: '100', v: '1' })).toBeNull();
      expect(sanitizeKlinePayload({ t: -10, o: '100', c: '100', h: '100', l: '100', v: '1' })).toBeNull();

      // Non-positive or NaN price
      expect(sanitizeKlinePayload({ t: 1725883200000, o: 'NaN', c: '100', h: '100', l: '100', v: '1' })).toBeNull();
      expect(sanitizeKlinePayload({ t: 1725883200000, o: '0', c: '100', h: '100', l: '100', v: '1' })).toBeNull();
      expect(sanitizeKlinePayload({ t: 1725883200000, o: '-50', c: '100', h: '100', l: '100', v: '1' })).toBeNull();
    });
  });

  describe('sanitizeHistoricalKlines', () => {
    it('parses raw array format from Binance REST endpoint correctly', () => {
      const rawRESTData: (number | string)[][] = [
        [1725883200000, '64100.00', '64200.00', '64050.00', '64180.00', '10.5', 1725883259999],
        [1725883260000, '64180.00', '64250.00', '64150.00', '64220.00', '8.2', 1725883319999],
      ];

      const candles = sanitizeHistoricalKlines(rawRESTData);
      expect(candles).toHaveLength(2);
      expect(candles[0].time).toBe(1725883200);
      expect(candles[0].open).toBe(64100);
      expect(candles[0].high).toBe(64200);
      expect(candles[0].low).toBe(64050);
      expect(candles[0].close).toBe(64180);
      expect(candles[0].volume).toBe(10.5);

      expect(candles[1].time).toBe(1725883260);
      expect(candles[1].close).toBe(64220);
    });

    it('sorts out-of-order data ascendingly by timestamp', () => {
      const rawOutOfOrder: (number | string)[][] = [
        [1725883320000, '64220', '64300', '64200', '64280', '15'],
        [1725883200000, '64100', '64200', '64050', '64180', '10'],
        [1725883260000, '64180', '64250', '64150', '64220', '8'],
      ];

      const candles = sanitizeHistoricalKlines(rawOutOfOrder);
      expect(candles).toHaveLength(3);
      expect(candles[0].time).toBe(1725883200);
      expect(candles[1].time).toBe(1725883260);
      expect(candles[2].time).toBe(1725883320);
    });

    it('deduplicates duplicate timestamps to prevent Lightweight Charts crash', () => {
      const rawWithDuplicates: (number | string)[][] = [
        [1725883200000, '64100', '64200', '64050', '64180', '10'],
        [1725883200000, '64100', '64210', '64050', '64195', '12'], // duplicate time with updated close
        [1725883260000, '64195', '64250', '64150', '64220', '8'],
      ];

      const candles = sanitizeHistoricalKlines(rawWithDuplicates);
      expect(candles).toHaveLength(2);
      expect(candles[0].time).toBe(1725883200);
      expect(candles[0].close).toBe(64195);
      expect(candles[1].time).toBe(1725883260);
    });

    it('filters out invalid or incomplete rows', () => {
      const dirtyData: any[] = [
        [],
        ['invalid_time', '100', '200', '50', '150', '1'],
        [1725883200000, 'NaN', '200', '50', '150', '1'],
        [1725883200000, '100', '200', '50', '150', '1'], // valid
      ];

      const candles = sanitizeHistoricalKlines(dirtyData);
      expect(candles).toHaveLength(1);
      expect(candles[0].time).toBe(1725883200);
      expect(candles[0].open).toBe(100);
    });
  });
});
