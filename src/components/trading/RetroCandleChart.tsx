import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  IChartApi,
  ISeriesApi,
  Time,
} from 'lightweight-charts';
import { TradingPair } from '@/types/market';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { BinanceWsService } from '@/services/BinanceWsService';

interface RetroCandleChartProps {
  pair: TradingPair;
  timeframe: string;
}

export const RetroCandleChart: React.FC<RetroCandleChartProps> = ({ pair, timeframe }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Latest candle update from WebSocket store
  const latestCandle = useMarketDataStore((state) => state.latestCandles[pair]);

  // Initialize and hydrate chart on mount or pair/timeframe change
  useEffect(() => {
    if (!chartContainerRef.current) return;

    setIsLoading(true);

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
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#333333',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00FF66',
      downColor: '#FF3333',
      borderVisible: false,
      wickUpColor: '#00FF66',
      wickDownColor: '#FF3333',
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

    // Hydrate historical klines
    let isCancelled = false;
    const wsService = BinanceWsService.getInstance();
    wsService
      .fetchHistoricalKlines(pair, timeframe, 100)
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
          chart.timeScale().fitContent();
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
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [pair, timeframe]);

  // Real-time incremental candle update from WebSocket
  useEffect(() => {
    if (!seriesRef.current || !latestCandle) return;

    seriesRef.current.update({
      time: latestCandle.time as Time,
      open: latestCandle.open,
      high: latestCandle.high,
      low: latestCandle.low,
      close: latestCandle.close,
    });
  }, [latestCandle]);

  return (
    <div className="relative w-full h-full min-h-[220px]">
      {isLoading && (
        <div className="absolute inset-0 bg-[#121212]/90 flex items-center justify-center z-20 font-mono text-[11px] text-crt-bullish">
          <div className="win-inset bg-black p-2 border border-[#333] flex items-center space-x-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-crt-bullish"></span>
            <span>[ HYDRATING {pair} 1M BINANCE KLINE STREAM... ]</span>
          </div>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};
