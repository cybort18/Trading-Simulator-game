import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CrosshairMode,
  PriceScaleMode,
  CandlestickSeries,
  IChartApi,
  ISeriesApi,
  Time,
  IPriceLine,
  LineStyle,
  AutoscaleInfo,
} from 'lightweight-charts';
import { TradingPair } from '@/types/market';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { useTradingStore } from '@/stores/useTradingStore';
import { BinanceWsService } from '@/services/BinanceWsService';
import { Position } from '@/types/trading';

interface RetroCandleChartProps {
  pair: TradingPair;
  timeframe: string;
}

export const RetroCandleChart: React.FC<RetroCandleChartProps> = ({ pair, timeframe }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const lastCandleTimeRef = useRef<number | null>(null);
  const formingCandleRef = useRef<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Latest candle update from WebSocket store
  const latestCandle = useMarketDataStore((state) => state.latestCandles[pair]);
  // Open positions from TradingStore to visualize entry, liq, and TP
  const positions = useTradingStore((state) => state.positions);

  const positionsRef = useRef<Position[]>(positions);
  positionsRef.current = positions;

  const pairRef = useRef<TradingPair>(pair);
  pairRef.current = pair;

  // Initialize and hydrate chart on mount or pair/timeframe change
  useEffect(() => {
    if (!chartContainerRef.current) return;

    setIsLoading(true);
    lastCandleTimeRef.current = null;

    // Initialize Lightweight Chart with Retro CRT Palette
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#121212' },
        textColor: '#A0A0A0',
        fontFamily: '"Courier Prime", Consolas, monospace',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: '#1F1F1F', style: 1 },
        horzLines: { color: '#1F1F1F', style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#76D6D5', width: 1, style: 2 },
        horzLine: { color: '#76D6D5', width: 1, style: 2 },
      },
      timeScale: {
        borderColor: '#333333',
        timeVisible: timeframe.toLowerCase() !== '1d',
        secondsVisible: false,
        rightOffset: 6,
        barSpacing: 6,
        minBarSpacing: 2,
      },
      rightPriceScale: {
        borderColor: '#333333',
        autoScale: true,
        mode: PriceScaleMode.Normal,
        scaleMargins: {
          top: 0.12,
          bottom: 0.12,
        },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00FF66',
      downColor: '#FF3333',
      borderVisible: false,
      wickUpColor: '#00FF66',
      wickDownColor: '#FF3333',
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
      priceLineVisible: true,
      priceLineWidth: 1,
      priceLineColor: '#00FF66',
      priceLineStyle: LineStyle.Dotted,
      autoscaleInfoProvider: (original: () => AutoscaleInfo | null) => {
        const res = original();
        if (!res || !res.priceRange) return res;

        const activePositions = positionsRef.current.filter((p) => p.pair === pairRef.current);
        if (activePositions.length === 0) return res;

        let min = res.priceRange.minValue;
        let max = res.priceRange.maxValue;

        for (const pos of activePositions) {
          if (pos.entryPrice > 0) {
            min = Math.min(min, pos.entryPrice);
            max = Math.max(max, pos.entryPrice);
          }
          if (pos.liquidationPrice > 0) {
            min = Math.min(min, pos.liquidationPrice);
            max = Math.max(max, pos.liquidationPrice);
          }
          if (pos.tpPrice && pos.tpPrice > 0) {
            min = Math.min(min, pos.tpPrice);
            max = Math.max(max, pos.tpPrice);
          }
          if (pos.slPrice && pos.slPrice > 0) {
            min = Math.min(min, pos.slPrice);
            max = Math.max(max, pos.slPrice);
          }
        }

        const padding = (max - min) * 0.05;
        return {
          priceRange: {
            minValue: min - padding,
            maxValue: max + padding,
          },
          margins: res.margins,
        };
      },
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    // Responsive resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });

    resizeObserver.observe(chartContainerRef.current);

    // Subscribe to live kline stream for the active timeframe
    const wsService = BinanceWsService.getInstance();
    wsService.subscribeKline(pair, timeframe);

    // Hydrate historical klines (300 candles for deep historical trend analysis)
    let isCancelled = false;
    wsService
      .fetchHistoricalKlines(pair, timeframe, 300)
      .then((data) => {
        if (!isCancelled && seriesRef.current) {
          const formatted = data.map((d) => ({
            time: d.time as Time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          }));
          seriesRef.current.setData(formatted);
          if (formatted.length > 0) {
            const lastCandle = formatted[formatted.length - 1];
            formingCandleRef.current = {
              time: Number(lastCandle.time),
              open: lastCandle.open,
              high: lastCandle.high,
              low: lastCandle.low,
              close: lastCandle.close,
            };
            lastCandleTimeRef.current = Number(lastCandle.time);
            useMarketDataStore.getState().updateTicker(pair, { price: lastCandle.close });

            // Display latest ~65 candles with optimal bar spacing while keeping full 300 candles in scrollable history
            const totalBars = formatted.length;
            const visibleBars = 65;
            chart.timeScale().setVisibleLogicalRange({
              from: Math.max(0, totalBars - visibleBars),
              to: totalBars + 4,
            });
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to hydrate chart historical data:', err);
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
      resizeObserver.disconnect();
      priceLinesRef.current = [];
      if (seriesRef.current) {
        try {
          seriesRef.current.setData([]);
        } catch {
          // Ignore unmount cleanup error
        }
      }
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      formingCandleRef.current = null;
      lastCandleTimeRef.current = null;
    };
  }, [pair, timeframe]);

  // Synchronize active position lines (Entry, Liq, TP, SL) with the candlestick series
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || isLoading) return;

    // Remove existing price lines
    priceLinesRef.current.forEach((line) => {
      try {
        series.removePriceLine(line);
      } catch {
        // Safe catch
      }
    });
    priceLinesRef.current = [];

    // Filter positions for this chart's pair
    const activePositions = positions.filter((p) => p.pair === pair);

    activePositions.forEach((pos) => {
      // 1. Entry Price Line (Cyan #00E5FF)
      try {
        const entryLine = series.createPriceLine({
          price: pos.entryPrice,
          color: '#00E5FF',
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `ENTRY [${pos.direction} ${pos.leverage}x]`,
        });
        priceLinesRef.current.push(entryLine);
      } catch (err) {
        console.warn('Failed to add entry price line:', err);
      }

      // 2. Estimated Liquidation Line (Amber #FFAA00, matching chart indicator)
      if (pos.liquidationPrice > 0) {
        try {
          const liqLine = series.createPriceLine({
            price: pos.liquidationPrice,
            color: '#FFAA00',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `EST. LIQ`,
          });
          priceLinesRef.current.push(liqLine);
        } catch (err) {
          console.warn('Failed to add liq price line:', err);
        }
      }

      // 3. Take Profit (TP) Line (Green #00FF66)
      if (pos.tpPrice && pos.tpPrice > 0) {
        try {
          const tpLine = series.createPriceLine({
            price: pos.tpPrice,
            color: '#00FF66',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `TP TARGET`,
          });
          priceLinesRef.current.push(tpLine);
        } catch (err) {
          console.warn('Failed to add TP price line:', err);
        }
      }

      // 4. Stop Loss (SL) Line (Red #FF3333)
      if (pos.slPrice && pos.slPrice > 0) {
        try {
          const slLine = series.createPriceLine({
            price: pos.slPrice,
            color: '#FF3333',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `STOP LOSS`,
          });
          priceLinesRef.current.push(slLine);
        } catch (err) {
          console.warn('Failed to add SL price line:', err);
        }
      }
    });

    // Force autoscale re-evaluation so all lines (Liq, SL, Entry, TP) fit on the price scale
    try {
      series.applyOptions({});
      series.priceScale().applyOptions({ autoScale: true });
    } catch {
      // Safe catch
    }

    return () => {
      if (seriesRef.current) {
        priceLinesRef.current.forEach((line) => {
          try {
            seriesRef.current?.removePriceLine(line);
          } catch {}
        });
      }
      priceLinesRef.current = [];
    };
  }, [positions, pair, isLoading]);

  // Real-time incremental candle update from WebSocket
  useEffect(() => {
    if (!seriesRef.current || !latestCandle || isLoading) return;

    const normalizedTf = timeframe === '1D' ? '1d' : timeframe.toLowerCase();
    const tfSecondsMap: Record<string, number> = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '1d': 86400,
    };
    const stepSeconds = tfSecondsMap[normalizedTf] || 60;

    // Case 1: Exact dedicated kline match from Binance WebSocket stream
    if (latestCandle.interval && latestCandle.interval.toLowerCase() === normalizedTf) {
      if (lastCandleTimeRef.current !== null && latestCandle.time < lastCandleTimeRef.current) {
        return;
      }

      try {
        seriesRef.current.update({
          time: latestCandle.time as Time,
          open: latestCandle.open,
          high: latestCandle.high,
          low: latestCandle.low,
          close: latestCandle.close,
        });
        formingCandleRef.current = {
          time: latestCandle.time,
          open: latestCandle.open,
          high: latestCandle.high,
          low: latestCandle.low,
          close: latestCandle.close,
        };
        lastCandleTimeRef.current = latestCandle.time;
      } catch (err) {
        console.warn('Dedicated timeframe candle update skipped:', err);
      }
      return;
    }

    // Case 2: Aggregate incremental ticks/1m candles into the active forming candle
    const alignedTime = Math.floor(latestCandle.time / stepSeconds) * stepSeconds;

    if (!formingCandleRef.current) {
      formingCandleRef.current = {
        time: alignedTime,
        open: latestCandle.open,
        high: latestCandle.high,
        low: latestCandle.low,
        close: latestCandle.close,
      };
      try {
        seriesRef.current.update({
          time: alignedTime as Time,
          open: formingCandleRef.current.open,
          high: formingCandleRef.current.high,
          low: formingCandleRef.current.low,
          close: formingCandleRef.current.close,
        });
        lastCandleTimeRef.current = alignedTime;
      } catch (err) {
        console.warn('Forming candle initial update skipped:', err);
      }
      return;
    }

    if (alignedTime === formingCandleRef.current.time) {
      // Same timeframe candle: keep OPEN, expand HIGH/LOW, update CLOSE
      formingCandleRef.current.high = Math.max(formingCandleRef.current.high, latestCandle.high);
      formingCandleRef.current.low = Math.min(formingCandleRef.current.low, latestCandle.low);
      formingCandleRef.current.close = latestCandle.close;

      try {
        seriesRef.current.update({
          time: alignedTime as Time,
          open: formingCandleRef.current.open,
          high: formingCandleRef.current.high,
          low: formingCandleRef.current.low,
          close: formingCandleRef.current.close,
        });
      } catch (err) {
        console.warn('Forming candle update skipped:', err);
      }
    } else if (alignedTime > formingCandleRef.current.time) {
      // New timeframe candle period started!
      formingCandleRef.current = {
        time: alignedTime,
        open: latestCandle.open,
        high: latestCandle.high,
        low: latestCandle.low,
        close: latestCandle.close,
      };

      try {
        seriesRef.current.update({
          time: alignedTime as Time,
          open: formingCandleRef.current.open,
          high: formingCandleRef.current.high,
          low: formingCandleRef.current.low,
          close: formingCandleRef.current.close,
        });
        lastCandleTimeRef.current = alignedTime;
      } catch (err) {
        console.warn('New candle boundary update skipped:', err);
      }
    }
  }, [latestCandle, isLoading, timeframe]);

  return (
    <div className="relative w-full h-full min-h-[220px]">
      {isLoading && (
        <div className="absolute inset-0 bg-[#121212]/90 flex items-center justify-center z-20 font-mono text-[11px] text-crt-bullish">
          <div className="win-inset bg-black p-2 border border-[#333] flex items-center space-x-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-crt-bullish"></span>
            <span>[ HYDRATING {pair} {timeframe.toUpperCase()} BINANCE KLINE STREAM... ]</span>
          </div>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};
