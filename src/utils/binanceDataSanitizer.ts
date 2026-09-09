import { CandleData } from '@/types/market';

/**
 * Raw Kline object structure emitted by Binance WebSocket stream (@kline_1m).
 */
export interface BinanceRawKline {
  t: number | string; // Kline start time in ms
  T?: number | string; // Kline close time in ms
  s?: string; // Symbol
  i?: string; // Interval
  f?: number; // First trade ID
  L?: number; // Last trade ID
  o: string | number; // Open price
  c: string | number; // Close price
  h: string | number; // High price
  l: string | number; // Low price
  v: string | number; // Base asset volume
  n?: number; // Number of trades
  x?: boolean; // Is this kline closed?
  q?: string | number; // Quote asset volume
  V?: string | number; // Taker buy base asset volume
  Q?: string | number; // Taker buy quote asset volume
}

/**
 * Sanitizes a single kline payload from Binance WebSocket.
 * - Converts millisecond timestamp `t` to UNIX timestamp in seconds.
 * - Converts string OHLCV values to floating point numbers.
 * - Validates numeric sanity (positive, finite values).
 */
export function sanitizeKlinePayload(raw: BinanceRawKline | null | undefined): CandleData | null {
  if (!raw) return null;

  const rawTime = Number(raw.t);
  if (!Number.isFinite(rawTime) || rawTime <= 0) {
    return null;
  }

  // Binance WS emits millisecond timestamps (e.g. 1725883200000).
  // If timestamp is > 10^11, it is in milliseconds and must be scaled to seconds.
  const timeInSeconds = rawTime > 1e11 ? Math.floor(rawTime / 1000) : Math.floor(rawTime);

  const open = typeof raw.o === 'number' ? raw.o : parseFloat(String(raw.o));
  const high = typeof raw.h === 'number' ? raw.h : parseFloat(String(raw.h));
  const low = typeof raw.l === 'number' ? raw.l : parseFloat(String(raw.l));
  const close = typeof raw.c === 'number' ? raw.c : parseFloat(String(raw.c));
  const volume = raw.v !== undefined
    ? (typeof raw.v === 'number' ? raw.v : parseFloat(String(raw.v)))
    : 0;

  if (
    !Number.isFinite(open) || open <= 0 ||
    !Number.isFinite(high) || high <= 0 ||
    !Number.isFinite(low) || low <= 0 ||
    !Number.isFinite(close) || close <= 0 ||
    !Number.isFinite(volume) || volume < 0
  ) {
    return null;
  }

  return {
    time: timeInSeconds,
    open,
    high,
    low,
    close,
    volume,
  };
}

/**
 * Sanitizes an array of raw klines from Binance REST API (`/fapi/v1/klines`).
 * REST format: [
 *   0: openTime (ms),
 *   1: open (string),
 *   2: high (string),
 *   3: low (string),
 *   4: close (string),
 *   5: volume (string),
 *   ...
 * ]
 *
 * Guarantees:
 * 1. Timestamps are in integer seconds.
 * 2. All OHLCV values are parsed to valid floats.
 * 3. Array is sorted in strictly ascending chronological order.
 * 4. Duplicate timestamps are removed.
 */
export function sanitizeHistoricalKlines(rawRows: (number | string)[][]): CandleData[] {
  if (!Array.isArray(rawRows)) return [];

  const parsed: CandleData[] = [];

  for (const item of rawRows) {
    if (!Array.isArray(item) || item.length < 6) continue;

    const rawTime = Number(item[0]);
    if (!Number.isFinite(rawTime) || rawTime <= 0) continue;

    const timeInSeconds = rawTime > 1e11 ? Math.floor(rawTime / 1000) : Math.floor(rawTime);
    const open = parseFloat(String(item[1]));
    const high = parseFloat(String(item[2]));
    const low = parseFloat(String(item[3]));
    const close = parseFloat(String(item[4]));
    const volume = parseFloat(String(item[5]));

    if (
      !Number.isFinite(open) || open <= 0 ||
      !Number.isFinite(high) || high <= 0 ||
      !Number.isFinite(low) || low <= 0 ||
      !Number.isFinite(close) || close <= 0 ||
      !Number.isFinite(volume) || volume < 0
    ) {
      continue;
    }

    parsed.push({
      time: timeInSeconds,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  // Sort ascending by time
  parsed.sort((a, b) => a.time - b.time);

  // Deduplicate timestamps (Lightweight Charts throws if timestamps are not strictly increasing)
  const deduplicated: CandleData[] = [];
  const seenTimes = new Set<number>();

  for (const candle of parsed) {
    if (!seenTimes.has(candle.time)) {
      seenTimes.add(candle.time);
      deduplicated.push(candle);
    } else {
      // Overwrite previous candle with same timestamp (takes later candle in array)
      const lastIdx = deduplicated.findIndex((c) => c.time === candle.time);
      if (lastIdx >= 0) {
        deduplicated[lastIdx] = candle;
      }
    }
  }

  return deduplicated;
}
