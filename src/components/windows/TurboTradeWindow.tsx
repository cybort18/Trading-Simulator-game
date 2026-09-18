import React, { useState, useEffect } from 'react';
import { WindowFrame, WindowMenuCategory } from '@/components/desktop/WindowFrame';
import { PixelIcon } from '@/components/common/PixelIcon';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { useTradingStore } from '@/stores/useTradingStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { useWindowStore } from '@/stores/useWindowStore';
import { fundingRateEngine } from '@/services/FundingRateEngine';
import { TradingPair } from '@/types/market';
import { RetroCandleChart } from '@/components/trading/RetroCandleChart';
import { CompactOrderBook } from '@/components/trading/CompactOrderBook';
import { binanceDepthService } from '@/services/BinanceDepthService';
import {
  calculateLiquidationPrice,
  calculateQuantity,
  calculateUnrealizedPnl,
  calculateRoe,
  DEFAULT_MMR,
  DEFAULT_TAKER_FEE_RATE,
  MAINTENANCE_MARGIN_RATES,
} from '@/utils/simulationMath';
import { soundFXService } from '@/services/SoundFXService';
import { liquidationEngine } from '@/services/LiquidationEngine';
import { Position } from '@/types/trading';

const LEVERAGE_SNAPS = [1, 5, 10, 20, 50, 100];

export const TurboTradeWindow: React.FC = () => {
  const selectedPair = useMarketDataStore((state) => state.selectedPair);
  const setSelectedPair = useMarketDataStore((state) => state.setSelectedPair);
  const currentPrice = useMarketDataStore((state) => state.prices[selectedPair] ?? 64281.5);
  const currentTicker = useMarketDataStore((state) => state.tickers[selectedPair]);
  const direction = useMarketDataStore((state) => state.priceDirections[selectedPair]);
  const connectionStatus = useMarketDataStore((state) => state.connectionStatus);

  const availableMargin = useWalletStore((state) => state.availableMargin);
  const equity = useWalletStore((state) => state.equity);
  const lockedMargin = useWalletStore((state) => state.lockedMargin);
  const positions = useTradingStore((state) => state.positions);
  const tradeHistory = useTradingStore((state) => state.tradeHistory);
  const openPosition = useTradingStore((state) => state.openPosition);
  const closePosition = useTradingStore((state) => state.closePosition);
  const setSelectedFlexTrade = useTradingStore((state) => state.setSelectedFlexTrade);
  const openWindow = useWindowStore((state) => state.openWindow);
  const focusWindow = useWindowStore((state) => state.focusWindow);

  const [timeframe, setTimeframe] = useState<string>('1m');
  const [leverage, setLeverage] = useState<number>(20);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPriceInput, setLimitPriceInput] = useState<string>('');
  const [marginMode, setMarginMode] = useState<'isolated' | 'cross'>('isolated');
  const [orderSize, setOrderSize] = useState<string>('5.00');
  const [bottomTab, setBottomTab] = useState<'positions' | 'history'>('positions');
  const [fundingCountdown, setFundingCountdown] = useState<string>('08:00:00');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [orderError, setOrderError] = useState<string | null>(null);

  // TP / SL Modal state
  const [tpSlModalPosition, setTpSlModalPosition] = useState<Position | null>(null);
  const [modalTpPrice, setModalTpPrice] = useState<string>('');
  const [modalSlPrice, setModalSlPrice] = useState<string>('');
  const [tpSlError, setTpSlError] = useState<string | null>(null);

  // Pre-trade TP / SL state
  const [enablePreTradeTpSl, setEnablePreTradeTpSl] = useState<boolean>(false);
  const [preTradeTp, setPreTradeTp] = useState<string>('');
  const [preTradeSl, setPreTradeSl] = useState<string>('');

  // Toast / banner notification for automated TP/SL executions
  const [tpSlToast, setTpSlToast] = useState<{
    message: string;
    type: 'TAKE_PROFIT' | 'STOP_LOSS';
  } | null>(null);


  // Subscribe to automated Take Profit & Stop Loss triggers
  useEffect(() => {
    const unsubscribe = liquidationEngine.subscribeTpSlTrigger((event) => {
      const isTp = event.reason === 'TAKE_PROFIT';
      const msg = isTp
        ? `[TAKE PROFIT HIT] ${event.position.pair} ${event.position.direction} at $${event.triggerPrice.toFixed(2)} (+${event.realizedPnl !== undefined ? event.realizedPnl.toFixed(2) : '0.00'} USDT)!`
        : `[STOP LOSS HIT] ${event.position.pair} ${event.position.direction} at $${event.triggerPrice.toFixed(2)} (${event.realizedPnl !== undefined ? event.realizedPnl.toFixed(2) : '0.00'} USDT)`;
      setTpSlToast({ message: msg, type: event.reason });
      setTimeout(() => {
        setTpSlToast(null);
      }, 7000);
    });
    return () => unsubscribe();
  }, []);

  // Keep limit price input in sync when pair changes if user hasn't typed custom price
  useEffect(() => {
    if (currentPrice > 0) {
      setLimitPriceInput(currentPrice.toFixed(2));
    }
  }, [selectedPair]);

  // Dynamic countdown timer using FundingRateEngine
  useEffect(() => {
    const updateCountdown = () => {
      const countdown = fundingRateEngine.getTimeUntilNextFunding();
      setFundingCountdown(countdown.formatted);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Synchronize real-time Level-2 Binance Depth Stream for integrated Order Book
  useEffect(() => {
    binanceDepthService.start(selectedPair);
    return () => {
      const isStandaloneOpen = useWindowStore.getState().windows.orderbook?.isOpen ?? false;
      if (!isStandaloneOpen) {
        binanceDepthService.stop();
      }
    };
  }, []);

  useEffect(() => {
    binanceDepthService.switchPair(selectedPair);
  }, [selectedPair]);

  const handleOrderBookPriceSelect = (price: number) => {
    soundFXService.playKeyClick();
    setOrderType('limit');
    setLimitPriceInput(price.toFixed(2));
  };

  const mmr = MAINTENANCE_MARGIN_RATES[selectedPair] || DEFAULT_MMR;
  const effectiveEntryPrice = orderType === 'limit' && parseFloat(limitPriceInput) > 0
    ? parseFloat(limitPriceInput)
    : currentPrice;

  const marginAmount = Number(orderSize) || 0;
  const currentMarginPercent =
    availableMargin > 0 && !isNaN(marginAmount)
      ? Math.min(100, Math.max(0, Math.round((marginAmount / availableMargin) * 100)))
      : 0;
  const notional = marginAmount * leverage;
  const fee = notional * DEFAULT_TAKER_FEE_RATE;
  const maxPositionSize = availableMargin * leverage;

  const effectiveMargin = marginAmount > 0 ? marginAmount : 5;
  const effectiveQty = calculateQuantity(effectiveMargin, leverage, effectiveEntryPrice);

  const estLiqLong = calculateLiquidationPrice({
    direction: 'LONG',
    entryPrice: effectiveEntryPrice,
    initialMargin: effectiveMargin,
    quantity: effectiveQty,
    leverage,
    mmr,
    takerFeeRate: DEFAULT_TAKER_FEE_RATE,
    marginMode: marginMode.toUpperCase() as 'ISOLATED' | 'CROSS',
    totalEquity: equity,
  });
  const estLiqShort = calculateLiquidationPrice({
    direction: 'SHORT',
    entryPrice: effectiveEntryPrice,
    initialMargin: effectiveMargin,
    quantity: effectiveQty,
    leverage,
    mmr,
    takerFeeRate: DEFAULT_TAKER_FEE_RATE,
    marginMode: marginMode.toUpperCase() as 'ISOLATED' | 'CROSS',
    totalEquity: equity,
  });

  const pairLabelMap: Record<TradingPair, string> = {
    BTCUSDT: 'BTC/USDT',
    ETHUSDT: 'ETH/USDT',
    SOLUSDT: 'SOL/USDT',
  };

  const turboTradeMenus: WindowMenuCategory[] = [
    {
      name: 'File',
      items: [
        {
          label: 'Reset Window Bounds',
          onClick: () => {
            useWindowStore.getState().updatePosition('turbotrade', { x: 60, y: 15 });
            useWindowStore.getState().updateSize('turbotrade', { width: 920, height: 600 });
          },
        },
        { divider: true, label: '' },
        {
          label: 'Close Terminal',
          shortcut: 'Alt+F4',
          onClick: () => useWindowStore.getState().closeWindow('turbotrade'),
        },
      ],
    },
    {
      name: 'Market',
      items: [
        {
          label: 'BTC/USDT [Perpetual 50x]',
          shortcut: '1',
          onClick: () => setSelectedPair('BTCUSDT'),
        },
        {
          label: 'ETH/USDT [Perpetual 50x]',
          shortcut: '2',
          onClick: () => setSelectedPair('ETHUSDT'),
        },
        {
          label: 'SOL/USDT [Perpetual 50x]',
          shortcut: '3',
          onClick: () => setSelectedPair('SOLUSDT'),
        },
      ],
    },
    {
      name: 'View',
      items: [
        { label: 'Timeframe: 1m (Realtime)', onClick: () => setTimeframe('1m') },
        { label: 'Timeframe: 5m', onClick: () => setTimeframe('5m') },
        { label: 'Timeframe: 15m', onClick: () => setTimeframe('15m') },
        { label: 'Timeframe: 1h', onClick: () => setTimeframe('1h') },
        { label: 'Timeframe: 1D', onClick: () => setTimeframe('1D') },
        { divider: true, label: '' },
        {
          label: 'Audio Sound FX Active',
          onClick: () => {
            soundFXService.playKeyClick();
            alert('Procedural Retro Web Audio: Operational');
          },
        },
      ],
    },
    {
      name: 'Order',
      items: [
        {
          label: 'Quick Market Long (20x)',
          onClick: () => {
            const margin = 5;
            openPosition(
              {
                pair: selectedPair,
                direction: 'LONG',
                marginMode: 'ISOLATED',
                leverage: 20,
                margin,
                type: 'MARKET',
              },
              currentPrice
            );
            soundFXService.playOrderExecuted();
          },
        },
        {
          label: 'Quick Market Short (20x)',
          onClick: () => {
            const margin = 5;
            openPosition(
              {
                pair: selectedPair,
                direction: 'SHORT',
                marginMode: 'ISOLATED',
                leverage: 20,
                margin,
                type: 'MARKET',
              },
              currentPrice
            );
            soundFXService.playOrderExecuted();
          },
        },
        { divider: true, label: '' },
        {
          label: 'Emergency Close All Positions',
          danger: true,
          disabled: positions.length === 0,
          onClick: () => {
            positions.forEach((pos) => {
              const mark = pos.markPrice || (pos.pair === selectedPair ? currentPrice : pos.entryPrice);
              closePosition(pos.id, mark);
            });
            soundFXService.playOrderExecuted();
          },
        },
      ],
    },
    {
      name: 'Tools',
      items: [
        {
          label: 'Open DegenVault (Wallet)',
          onClick: () => {
            openWindow('degenvault');
            focusWindow('degenvault');
          },
        },
        {
          label: 'Open Leaderboard.exe',
          onClick: () => {
            openWindow('leaderboard');
            focusWindow('leaderboard');
          },
        },
        {
          label: 'Open Share Flex Card',
          onClick: () => {
            openWindow('flexcard');
            focusWindow('flexcard');
          },
        },
      ],
    },
    {
      name: 'Help',
      items: [
        {
          label: 'System Setup Wizard',
          onClick: () => {
            openWindow('welcome');
            focusWindow('welcome');
          },
        },
        {
          label: 'Futures Trading Guidelines',
          onClick: () => {
            alert(
              'TurboTrade Guidelines:\n\n1. Long (Buy): Anticipates price increase.\n2. Short (Sell): Anticipates price decline.\n3. Liquidation: Watch liquidation price buffer closely.\n4. Simulated Balance: 100% risk-free.'
            );
          },
        },
        {
          label: 'About TurboTrade.exe',
          onClick: () => {
            alert('TurboTrade.exe v1.0\nHigh-Leverage Futures Trading Terminal\nCryptoOS 98');
          },
        },
      ],
    },
  ];

  return (
    <WindowFrame
      id="turbotrade"
      menus={turboTradeMenus}
      statusContent={
        <>
          <div className="flex items-center space-x-2">
            <span
              className={`font-bold ${
                connectionStatus === 'CONNECTED'
                  ? 'text-crt-bullish'
                  : connectionStatus === 'RECONNECTING'
                  ? 'text-crt-amber animate-pulse'
                  : 'text-crt-bearish'
              }`}
            >
              ● BINANCE WS: {connectionStatus}
            </span>
            <span>|</span>
            <span>STREAM: @ticker/@kline_1m/@markPrice</span>
            <span>|</span>
            <span>PAIR: {pairLabelMap[selectedPair]}</span>
          </div>
          <div className="flex items-center space-x-2 font-mono">
            <span>DATA: HIGH-PRECISION</span>
            <span className="font-bold text-titlebar-navy">[SECURE CHANNEL]</span>
          </div>
        </>
      }
    >
      <div className="flex-1 flex flex-col gap-1 h-full min-h-0 text-black font-ui overflow-hidden">
        {/* =================================================================== */}
        {/* TOP TRADING DECK (Market Info, Chart, Order Book, Order Form)       */}
        {/* =================================================================== */}
        <div className="flex-1 flex flex-col md:flex-row gap-1 min-h-[340px] overflow-hidden">
          {/* =================================================================== */}
          {/* LEFT PANEL: Market Selector, Live Metrics & 24h Range Meter        */}
          {/* =================================================================== */}
          <div className="w-full md:w-[195px] flex flex-col gap-1 flex-shrink-0">
            {/* Pair Selector Strip */}
            <div className="win-inset bg-win-base p-1 flex flex-col gap-1">
              <div className="font-bold text-[10px] text-black uppercase">Select Contract:</div>
              <div className="grid grid-cols-3 gap-1">
                {(['BTCUSDT', 'ETHUSDT', 'SOLUSDT'] as const).map((pair) => (
                  <button
                    key={pair}
                    onClick={() => setSelectedPair(pair)}
                    className={`py-1 text-[10px] font-bold ${
                      selectedPair === pair
                        ? 'win-btn-pressed bg-win-pressed font-extrabold text-titlebar-navy'
                        : 'win-btn bg-win-base text-black'
                    }`}
                  >
                    {pair.replace('USDT', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Real-time Live Ticker Card */}
            <div className="win-inset-deep p-2 text-white flex flex-col gap-1.5 crt-grid bg-[#121212]">
              <div className="flex justify-between items-center text-[10px] text-[#E0E0E0]">
                <span className="font-bold font-mono text-white">{pairLabelMap[selectedPair]} PERP</span>
                <span className="win-inset px-1 bg-[#1A1A1A] text-crt-bullish text-[9px] font-mono font-bold">
                  {connectionStatus === 'CONNECTED' ? 'LIVE ●' : connectionStatus}
                </span>
              </div>

              {/* Dynamic Tick Color Flash Monospace Price Readout */}
              <div
                className={`font-mono text-[20px] font-bold leading-none transition-colors duration-150 ${
                  direction === 'up'
                    ? 'text-crt-bullish crt-glow-green'
                    : direction === 'down'
                    ? 'text-crt-bearish crt-glow-red'
                    : 'text-white'
                }`}
              >
                $
                {currentPrice.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>

              <div className="flex items-center justify-between text-[10.5px] font-mono">
                <span className="text-[#E0E0E0] font-semibold">24h Change:</span>
                <span
                  className={`font-bold ${
                    currentTicker.change24h >= 0 ? 'text-crt-bullish' : 'text-crt-bearish'
                  }`}
                >
                  {currentTicker.change24h >= 0 ? '+' : ''}
                  {currentTicker.change24h.toFixed(2)}%
                </span>
              </div>

              <div className="border-t border-[#333] pt-1 flex flex-col gap-0.5 text-[9.5px] font-mono text-[#D0D0D0]">
                <div className="flex justify-between">
                  <span className="text-[#D0D0D0]">24h High:</span>
                  <span className="text-white font-bold">${currentTicker.high24h.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#D0D0D0]">24h Low:</span>
                  <span className="text-white font-bold">${currentTicker.low24h.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#D0D0D0]">24h Volume:</span>
                  <span className="text-white font-bold">
                    {currentTicker.volume24h.toLocaleString('en-US', { maximumFractionDigits: 1 })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#2A2A2A] pt-0.5 mt-0.5">
                  <span className="text-[#D0D0D0]">Funding Rate:</span>
                  <span className="text-crt-amber font-bold">
                    {(currentTicker.fundingRate * 100).toFixed(4)}% in {fundingCountdown}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Margin Inset */}
            <div className="win-inset bg-win-base p-1.5 flex flex-col gap-1 text-[9.5px]">
              <div className="flex justify-between">
                <span className="text-black font-bold">Account Equity:</span>
                <span className="font-mono font-bold text-titlebar-navy">{equity.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black font-bold">Available Margin:</span>
                <span className="font-mono font-bold text-black">{availableMargin.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black font-bold">Position Margin:</span>
                <span className="font-mono font-bold text-crt-amber">{lockedMargin.toFixed(2)} USDT</span>
              </div>
            </div>

            {/* 24h High/Low Range Meter & Market Statistics (Utilizes empty space) */}
            <div className="win-inset-deep bg-[#121212] p-1.5 flex-1 flex flex-col justify-between text-[9px] font-mono text-[#AAA]">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[#DDD] font-bold border-b border-[#252525] pb-0.5">
                  <span>24H PRICE RANGE</span>
                  <span className="text-[8px] text-crt-bullish">DYNAMIC</span>
                </div>
                <div className="flex justify-between text-[8.5px]">
                  <span className="text-[#FF4444]">${currentTicker.low24h.toFixed(1)}</span>
                  <span className="text-[#00FF66]">${currentTicker.high24h.toFixed(1)}</span>
                </div>
                {/* Visual Position Gauge */}
                {(() => {
                  const range = currentTicker.high24h - currentTicker.low24h;
                  const pos = range > 0 ? Math.max(2, Math.min(98, ((currentPrice - currentTicker.low24h) / range) * 100)) : 50;
                  return (
                    <div className="w-full h-2 bg-[#252525] relative border border-[#333]">
                      <div
                        className="absolute top-0 bottom-0 bg-titlebar-navy"
                        style={{ width: `${pos}%` }}
                      />
                      <div
                        className="absolute top-[-2px] bottom-[-2px] w-1.5 bg-amber-400 border border-black shadow"
                        style={{ left: `calc(${pos}% - 3px)` }}
                        title={`Current: $${currentPrice.toFixed(2)}`}
                      />
                    </div>
                  );
                })()}
              </div>

              <div className="border-t border-[#252525] pt-1 mt-1 flex flex-col gap-0.5 text-[8.5px]">
                <div className="flex justify-between">
                  <span>24h Turnover:</span>
                  <span className="text-white font-bold">
                    ${((currentTicker.volume24h * currentPrice) / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Execution:</span>
                  <span className="text-crt-bullish font-bold">ZERO SLIPPAGE</span>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* CENTER PANEL: Interactive Candlestick Chart (Full Height)          */}
          {/* =================================================================== */}
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            {/* Chart Viewport & Toolbar */}
            <div className="flex-1 win-inset-deep p-1 flex flex-col min-h-[300px] relative overflow-hidden bg-[#121212]">
              {/* Automated TP/SL Execution Toast */}
              {tpSlToast && (
                <div
                  className={`absolute top-9 left-2 right-2 z-30 p-1.5 border font-mono text-[10.5px] font-bold flex items-center justify-between shadow-lg ${
                    tpSlToast.type === 'TAKE_PROFIT'
                      ? 'bg-[#003311] text-[#00FF66] border-[#00FF66]'
                      : 'bg-[#331100] text-[#FFAA00] border-[#FFAA00]'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[12px]">{tpSlToast.type === 'TAKE_PROFIT' ? '🎯' : '🛡'}</span>
                    <span>{tpSlToast.message}</span>
                  </div>
                  <button
                    onClick={() => setTpSlToast(null)}
                    className="win-btn text-[9px] px-1 py-0 font-bold text-black ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Chart Toolbar */}
              <div className="flex items-center justify-between pb-1 border-b border-[#2A2A2A] text-[10px] text-white">
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-crt-amber font-mono mr-1.5">
                    {pairLabelMap[selectedPair]}
                  </span>
                  {['1m', '5m', '15m', '1h', '1D'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-1.5 py-0.5 text-[9px] font-mono ${
                        timeframe === tf
                          ? 'win-btn-pressed bg-[#333] text-crt-bullish font-bold border border-[#555]'
                          : 'win-btn bg-win-base text-black'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="text-[10px] text-[#C0C0C0] font-mono hidden sm:block">
                  BINANCE PERPETUAL • REALTIME 1M WS
                </div>
              </div>

              {/* TradingView Canvas Mount */}
              <div className="flex-1 w-full h-full min-h-[220px] relative">
                <RetroCandleChart pair={selectedPair} timeframe={timeframe} />
              </div>

              {/* Real-time Chart Footer Sub-status */}
              <div className="flex items-center justify-between text-[10px] font-mono text-[#C0C0C0] border-t border-[#222] pt-0.5">
                <span>
                  MARK: $
                  {currentPrice.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-crt-amber font-bold">
                  EST. LONG LIQ: ${estLiqLong.toFixed(2)} | SHORT LIQ: ${estLiqShort.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* COLUMN 3: Real-Time Level-2 Order Book (Gate.io-Style Integration)  */}
          {/* =================================================================== */}
          <div className="w-full md:w-[185px] flex flex-col flex-shrink-0">
            <CompactOrderBook
              onSelectPrice={handleOrderBookPriceSelect}
              className="flex-1 h-full"
            />
          </div>

        {/* =================================================================== */}
        {/* RIGHT PANEL: Order Execution Form (25%)                             */}
        {/* =================================================================== */}
        <div className="w-full md:w-[240px] win-outset bg-win-base p-1.5 flex flex-col gap-2 flex-shrink-0">
          {/* Market / Limit Order Toggle */}
          <div className="grid grid-cols-2 gap-1 font-bold text-[10px]">
            <button
              onClick={() => setOrderType('market')}
              className={`py-1 ${
                orderType === 'market' ? 'win-btn-pressed bg-win-pressed font-extrabold text-titlebar-navy' : 'win-btn'
              }`}
            >
              [ Market ]
            </button>
            <button
              onClick={() => {
                setOrderType('limit');
                if (!limitPriceInput && currentPrice > 0) {
                  setLimitPriceInput(currentPrice.toFixed(2));
                }
              }}
              className={`py-1 ${
                orderType === 'limit' ? 'win-btn-pressed bg-win-pressed font-extrabold text-titlebar-navy' : 'win-btn'
              }`}
            >
              [ Limit ]
            </button>
          </div>

          {/* Dynamic Limit Price Input (Shown only when Limit order is selected) */}
          {orderType === 'limit' && (
            <div className="flex flex-col gap-1 text-[10px] win-inset bg-surface-low p-1.5 border border-titlebar-navy">
              <div className="flex justify-between items-center">
                <span className="font-bold text-titlebar-navy">Limit Order Price:</span>
                <button
                  type="button"
                  onClick={() => setLimitPriceInput(currentPrice.toFixed(2))}
                  className="win-btn px-1 text-[8px] font-bold"
                >
                  Use Mark
                </button>
              </div>
              <div className="win-inset-deep bg-white flex items-center px-1.5 py-0.5">
                <input
                  type="number"
                  step="any"
                  value={limitPriceInput}
                  onChange={(e) => {
                    setLimitPriceInput(e.target.value);
                    setOrderError(null);
                  }}
                  placeholder={currentPrice.toFixed(2)}
                  className="w-full bg-transparent font-mono text-[13px] font-bold text-black border-none outline-none p-0"
                />
                <span className="font-bold text-[#333] text-[10px]">USDT</span>
              </div>
            </div>
          )}

          {/* Margin Mode Selector */}
          <div className="win-inset bg-surface-low p-1 flex items-center justify-between text-[10px]">
            <span className="font-bold text-bevel-dark">Margin Mode:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => setMarginMode('cross')}
                className={`px-1.5 py-0.5 font-bold ${
                  marginMode === 'cross' ? 'win-btn-pressed bg-win-pressed font-extrabold text-titlebar-navy' : 'win-btn'
                }`}
              >
                Cross
              </button>
              <button
                onClick={() => setMarginMode('isolated')}
                className={`px-1.5 py-0.5 font-bold ${
                  marginMode === 'isolated' ? 'win-btn-pressed bg-win-pressed font-extrabold text-titlebar-navy' : 'win-btn'
                }`}
              >
                Isolated
              </button>
            </div>
          </div>

          {/* Leverage Stepper / Slider with Discrete Snap Points */}
          <div className="win-inset bg-surface-low p-1.5 flex flex-col gap-1.5 text-[10px]">
            <div className="flex justify-between items-center font-bold">
              <span>Leverage:</span>
              <span className="font-mono text-titlebar-navy text-[12px] font-extrabold">
                {leverage}x Multiplier
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={leverage}
              onChange={(e) => {
                const val = Number(e.target.value);
                setLeverage(val);
                if (val >= 20) {
                  soundFXService.playLeverageWarning();
                }
              }}
              className="w-full h-3 cursor-ew-resize accent-titlebar-navy"
            />

            {/* Discrete Snap Buttons */}
            <div className="grid grid-cols-6 gap-0.5">
              {LEVERAGE_SNAPS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setLeverage(val);
                    if (val >= 20) {
                      soundFXService.playLeverageWarning();
                    } else {
                      soundFXService.playKeyClick();
                    }
                  }}
                  className={`py-0.5 text-[8.5px] font-bold ${
                    leverage === val
                      ? 'win-btn-pressed bg-win-pressed text-titlebar-navy font-extrabold'
                      : 'win-btn bg-win-base text-black'
                  }`}
                >
                  {val}x
                </button>
              ))}
            </div>

            {leverage >= 20 && (
              <div className="bg-[#FFF3CD] text-[#7A4B00] text-[9px] font-bold p-1 border border-[#FFAA00] flex items-center gap-1.5">
                <PixelIcon name="warning" size={12} className="flex-shrink-0 text-[#7A4B00]" />
                <span>Warning: {leverage}x High Liquidation Risk</span>
              </div>
            )}
          </div>

          {/* Order Margin / Size Slider & Input */}
          <div className="win-inset bg-surface-low p-1.5 flex flex-col gap-1.5 text-[10px]">
            <div className="flex justify-between items-center font-bold">
              <span className="text-black">Order Margin:</span>
              <span className="font-mono text-black font-semibold text-[9.5px]">
                Avail: ${availableMargin.toFixed(2)} USDT
              </span>
            </div>

            <div className="win-inset-deep bg-white flex items-center px-1.5 py-0.5">
              <input
                type="text"
                value={orderSize}
                onChange={(e) => {
                  setOrderSize(e.target.value);
                  setOrderError(null);
                }}
                className="w-full bg-transparent font-mono text-[14px] font-bold text-black border-none outline-none p-0"
              />
              <span className="font-bold text-[#333] text-[11px] ml-1">USDT</span>
            </div>

            {/* Margin Slider */}
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                disabled={availableMargin <= 0}
                value={currentMarginPercent}
                onChange={(e) => {
                  const pct = Number(e.target.value);
                  setOrderError(null);
                  if (pct === 0) {
                    setOrderSize('0.00');
                  } else if (pct === 100) {
                    const maxMargin = Math.max(0, availableMargin * 0.98);
                    setOrderSize(maxMargin.toFixed(2));
                  } else {
                    const margin = (availableMargin * (pct / 100)).toFixed(2);
                    setOrderSize(margin);
                  }
                }}
                className="w-full h-3 cursor-ew-resize accent-titlebar-navy disabled:opacity-50"
              />
              <span className="font-mono text-[10px] font-bold text-titlebar-navy w-9 text-right flex-shrink-0">
                {currentMarginPercent}%
              </span>
            </div>

            {/* Percentage Preset Buttons */}
            <div className="grid grid-cols-4 gap-1 text-[10px]">
              {['25%', '50%', '75%', 'MAX'].map((pct) => {
                const targetPct = pct === '25%' ? 25 : pct === '50%' ? 50 : pct === '75%' ? 75 : 98;
                const isSelected =
                  pct === 'MAX'
                    ? currentMarginPercent >= 97
                    : Math.abs(currentMarginPercent - targetPct) <= 1;

                return (
                  <button
                    key={pct}
                    type="button"
                    disabled={availableMargin <= 0}
                    onClick={() => {
                      setOrderError(null);
                      soundFXService.playKeyClick();
                      if (pct === '25%') setOrderSize((availableMargin * 0.25).toFixed(2));
                      if (pct === '50%') setOrderSize((availableMargin * 0.50).toFixed(2));
                      if (pct === '75%') setOrderSize((availableMargin * 0.75).toFixed(2));
                      if (pct === 'MAX') {
                        // Max available leaving fee buffer
                        const maxMargin = Math.max(0, availableMargin * 0.98);
                        setOrderSize(maxMargin.toFixed(2));
                      }
                    }}
                    className={`py-0.5 text-center font-bold text-[9px] ${
                      isSelected
                        ? 'win-btn-pressed bg-win-pressed text-titlebar-navy font-extrabold'
                        : 'win-btn bg-win-base text-black'
                    }`}
                  >
                    {pct}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pre-trade Take Profit & Stop Loss (Optional) */}
          <div className="win-inset bg-win-base p-1.5 flex flex-col gap-1 text-[10px]">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-1.5 cursor-pointer font-bold text-black select-none">
                <input
                  type="checkbox"
                  checked={enablePreTradeTpSl}
                  onChange={(e) => setEnablePreTradeTpSl(e.target.checked)}
                  className="w-3.5 h-3.5 accent-titlebar-navy cursor-pointer"
                />
                <span>Set TP / SL Targets</span>
              </label>
              {enablePreTradeTpSl && (
                <span className="text-[8.5px] text-[#555] font-mono">[OPTIONAL]</span>
              )}
            </div>

            {enablePreTradeTpSl && (
              <div className="flex flex-col gap-1.5 pt-1 border-t border-[#BBB]">
                {/* Pre-trade TP Input */}
                <div>
                  <div className="flex justify-between items-center text-[9px] text-black font-bold mb-0.5">
                    <span className="text-[#008531]">Take Profit (TP):</span>
                    <div className="flex space-x-1">
                      {[25, 50, 100].map((roe) => (
                        <button
                          key={roe}
                          type="button"
                          onClick={() => {
                            const target = effectiveEntryPrice * (1 + (roe / 100) / leverage);
                            setPreTradeTp(target.toFixed(2));
                          }}
                          className="win-btn text-[8px] px-1 py-0 text-black font-bold"
                        >
                          +{roe}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="win-inset bg-white px-1.5 py-0.5 flex items-center">
                    <span className="text-[#666] font-mono text-[10px] mr-1">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={effectiveEntryPrice ? (effectiveEntryPrice * 1.05).toFixed(2) : '0.00'}
                      value={preTradeTp}
                      onChange={(e) => setPreTradeTp(e.target.value)}
                      className="w-full bg-transparent font-mono text-[11px] font-bold text-black border-none outline-none p-0"
                    />
                  </div>
                </div>

                {/* Pre-trade SL Input */}
                <div>
                  <div className="flex justify-between items-center text-[9px] text-black font-bold mb-0.5">
                    <span className="text-[#BA1A1A]">Stop Loss (SL):</span>
                    <div className="flex space-x-1">
                      {[25, 50].map((roe) => (
                        <button
                          key={roe}
                          type="button"
                          onClick={() => {
                            const target = effectiveEntryPrice * (1 - (roe / 100) / leverage);
                            setPreTradeSl(target.toFixed(2));
                          }}
                          className="win-btn text-[8px] px-1 py-0 text-black font-bold"
                        >
                          -{roe}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="win-inset bg-white px-1.5 py-0.5 flex items-center">
                    <span className="text-[#666] font-mono text-[10px] mr-1">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={effectiveEntryPrice ? (effectiveEntryPrice * 0.95).toFixed(2) : '0.00'}
                      value={preTradeSl}
                      onChange={(e) => setPreTradeSl(e.target.value)}
                      className="w-full bg-transparent font-mono text-[11px] font-bold text-black border-none outline-none p-0"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Pre-trade Calculation Box */}
          <div className="win-inset-deep bg-[#121212] p-2 font-mono text-[9.5px] text-white flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-[#D0D0D0] font-semibold">Margin Cost:</span>
              <span className="text-white font-bold">${marginAmount.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#D0D0D0] font-semibold">Notional Value:</span>
              <span className="text-white font-bold">${notional.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#D0D0D0] font-semibold">Max Position:</span>
              <span className="text-crt-bullish font-bold">${maxPositionSize.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between border-t border-[#333] pt-1">
              <span className="text-[#D0D0D0] font-semibold">Est. Liq (Long):</span>
              <span className="text-crt-bullish font-bold">${estLiqLong.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#D0D0D0] font-semibold">Est. Liq (Short):</span>
              <span className="text-crt-bearish font-bold">${estLiqShort.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-[#333] pt-1">
              <span className="text-[#D0D0D0] font-semibold">Taker Fee (0.05%):</span>
              <span className="text-white font-bold">${fee.toFixed(4)}</span>
            </div>
          </div>

          {/* Order Error Notification */}
          {orderError && (
            <div className="bg-[#FFE5E5] text-[#990000] text-[9px] font-bold p-1 border border-[#FF3333]">
              ⚠ {orderError}
            </div>
          )}

          {/* Execution Action Buttons */}
          <div className="flex flex-col gap-1.5 pt-1">
            <button
              disabled={isSubmitting}
              onClick={() => {
                if (isSubmitting) return;
                setOrderError(null);
                const margin = parseFloat(orderSize);
                if (isNaN(margin) || margin <= 0) {
                  setOrderError('Enter valid margin amount');
                  return;
                }
                const parsedLimit = orderType === 'limit' ? parseFloat(limitPriceInput) : undefined;
                if (orderType === 'limit' && (!parsedLimit || parsedLimit <= 0)) {
                  setOrderError('Enter valid limit price');
                  return;
                }

                const parsedTp = enablePreTradeTpSl && parseFloat(preTradeTp) > 0 ? parseFloat(preTradeTp) : undefined;
                const parsedSl = enablePreTradeTpSl && parseFloat(preTradeSl) > 0 ? parseFloat(preTradeSl) : undefined;

                setIsSubmitting(true);
                try {
                  const res = openPosition(
                    {
                      pair: selectedPair,
                      direction: 'LONG',
                      marginMode: marginMode.toUpperCase() as 'ISOLATED' | 'CROSS',
                      leverage,
                      margin,
                      type: orderType.toUpperCase() as 'MARKET' | 'LIMIT',
                      limitPrice: parsedLimit,
                      tpPrice: parsedTp,
                      slPrice: parsedSl,
                    },
                    orderType === 'limit' ? parsedLimit : currentPrice
                  );
                  if (!res.success) {
                    setOrderError(res.error || 'Order failed');
                  } else {
                    soundFXService.playOrderExecuted();
                  }
                } finally {
                  setTimeout(() => setIsSubmitting(false), 300);
                }
              }}
              className={`win-btn bg-[#008531] text-white font-bold py-2 flex items-center justify-center space-x-1.5 hover:bg-[#009938] active:translate-x-0.5 active:translate-y-0.5 shadow ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <PixelIcon name="arrow_up" size={14} className="text-crt-bullish" />
              <span className="text-[11px] tracking-wide uppercase">
                {isSubmitting ? 'EXECUTING...' : 'OPEN LONG (BUY)'}
              </span>
            </button>

            <button
              disabled={isSubmitting}
              onClick={() => {
                if (isSubmitting) return;
                setOrderError(null);
                const margin = parseFloat(orderSize);
                if (isNaN(margin) || margin <= 0) {
                  setOrderError('Enter valid margin amount');
                  return;
                }
                const parsedLimit = orderType === 'limit' ? parseFloat(limitPriceInput) : undefined;
                if (orderType === 'limit' && (!parsedLimit || parsedLimit <= 0)) {
                  setOrderError('Enter valid limit price');
                  return;
                }

                const parsedTp = enablePreTradeTpSl && parseFloat(preTradeTp) > 0 ? parseFloat(preTradeTp) : undefined;
                const parsedSl = enablePreTradeTpSl && parseFloat(preTradeSl) > 0 ? parseFloat(preTradeSl) : undefined;

                setIsSubmitting(true);
                try {
                  const res = openPosition(
                    {
                      pair: selectedPair,
                      direction: 'SHORT',
                      marginMode: marginMode.toUpperCase() as 'ISOLATED' | 'CROSS',
                      leverage,
                      margin,
                      type: orderType.toUpperCase() as 'MARKET' | 'LIMIT',
                      limitPrice: parsedLimit,
                      tpPrice: parsedTp,
                      slPrice: parsedSl,
                    },
                    orderType === 'limit' ? parsedLimit : currentPrice
                  );
                  if (!res.success) {
                    setOrderError(res.error || 'Order failed');
                  } else {
                    soundFXService.playOrderExecuted();
                  }
                } finally {
                  setTimeout(() => setIsSubmitting(false), 300);
                }
              }}
              className={`win-btn bg-[#BA1A1A] text-white font-bold py-2 flex items-center justify-center space-x-1.5 hover:bg-[#CC2020] active:translate-x-0.5 active:translate-y-0.5 shadow ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <PixelIcon name="arrow_down" size={14} className="text-white" />
              <span className="text-[11px] tracking-wide uppercase">
                {isSubmitting ? 'EXECUTING...' : 'OPEN SHORT (SELL)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* FULL-WIDTH BOTTOM WORKSPACE: Open Positions & Order History         */}
      {/* =================================================================== */}
      <div className="h-[175px] win-inset bg-win-base p-1 flex flex-col flex-shrink-0">
        {/* Tab Navigation Header */}
        <div className="flex items-center justify-between border-b border-[#808080] pb-1 px-1 flex-shrink-0">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setBottomTab('positions')}
              className={`px-3 py-0.5 text-[10px] font-bold ${
                bottomTab === 'positions'
                  ? 'win-btn-pressed bg-win-pressed text-titlebar-navy border-t-2 border-l-2 border-r-2 border-b-0'
                  : 'win-btn text-black'
              }`}
            >
              Open Positions ({positions.length})
            </button>
            <button
              onClick={() => setBottomTab('history')}
              className={`px-3 py-0.5 text-[10px] font-bold ${
                bottomTab === 'history'
                  ? 'win-btn-pressed bg-win-pressed text-titlebar-navy border-t-2 border-l-2 border-r-2 border-b-0'
                  : 'win-btn text-black'
              }`}
            >
              Order History ({tradeHistory.length})
            </button>
          </div>

          <div className="flex items-center space-x-2 text-[9px] font-mono text-[#555]">
            <span>MARGIN CALL SAFETY: REALTIME SCANNER ACTIVE</span>
            <span className="text-crt-bullish font-bold">● ONLINE</span>
          </div>
        </div>

        {/* Tab Content Display Area */}
        {bottomTab === 'positions' ? (
          positions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center font-mono text-[10.5px] text-[#666] py-3">
              <span className="text-[#888] font-bold">NO OPEN PERPETUAL CONTRACTS</span>
              <span className="text-[9px] text-[#555] mt-0.5">
                Select leverage, margin, and order type above to open a position.
              </span>
            </div>
          ) : (
            <div className="flex-1 overflow-auto win-inset-deep bg-[#121212] p-0.5 mt-0.5">
              <table className="w-full text-left font-mono text-[10px] text-white border-collapse min-w-[920px]">
                <thead className="bg-[#202020] text-[#E0E0E0] border-b border-[#404040] sticky top-0 font-bold z-10">
                  <tr>
                    <th className="p-1 pl-1.5">Contract</th>
                    <th className="p-1">Size</th>
                    <th className="p-1">Entry Price</th>
                    <th className="p-1">Mark Price</th>
                    <th className="p-1">Est. Liq Price</th>
                    <th className="p-1">Margin</th>
                    <th className="p-1">TP / SL</th>
                    <th className="p-1">Unrealized PnL</th>
                    <th className="p-1 text-right pr-1.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F1F]">
                  {positions.map((pos) => {
                    const mark = pos.markPrice || (pos.pair === selectedPair ? currentPrice : pos.entryPrice);
                    const isBullish = pos.unrealizedPnl >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-[#1A1A1A] transition-colors">
                        {/* Contract */}
                        <td className="p-1 pl-1.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-crt-amber">{pairLabelMap[pos.pair]}</span>
                            <span
                              className={`px-1 py-0.2 text-[8.5px] font-bold border ${
                                pos.direction === 'LONG'
                                  ? 'bg-[#003311] text-[#00FF66] border-[#00FF66]'
                                  : 'bg-[#330000] text-[#FF4444] border-[#FF4444]'
                              }`}
                            >
                              {pos.direction} {pos.leverage}x
                            </span>
                            <span className="text-[8px] px-1 bg-[#252525] text-[#AAA] border border-[#3A3A3A]">
                              {pos.marginMode}
                            </span>
                          </div>
                        </td>

                        {/* Size */}
                        <td className="p-1 text-[#E0E0E0]">
                          {pos.quantity.toFixed(4)} {pos.pair.replace('USDT', '')}
                        </td>

                        {/* Entry Price */}
                        <td className="p-1 text-[#E0E0E0] font-medium">
                          ${pos.entryPrice.toFixed(2)}
                        </td>

                        {/* Mark Price */}
                        <td className="p-1 font-medium text-white">
                          ${mark.toFixed(2)}
                        </td>

                        {/* Est Liq Price */}
                        <td className="p-1">
                          <span className="font-bold text-crt-bearish">
                            ${pos.liquidationPrice.toFixed(2)}
                          </span>
                        </td>

                        {/* Margin */}
                        <td className="p-1 text-[#E0E0E0]">
                          {pos.initialMargin.toFixed(2)} USDT
                        </td>

                        {/* TP / SL */}
                        <td className="p-1">
                          <div className="flex items-center space-x-1">
                            {pos.tpPrice ? (
                              <span className="text-[8.5px] px-1 bg-[#002B11] text-[#00FF66] border border-[#006622] font-bold">
                                TP ${pos.tpPrice.toFixed(2)}
                              </span>
                            ) : null}
                            {pos.slPrice ? (
                              <span className="text-[8.5px] px-1 bg-[#2B0000] text-[#FF4444] border border-[#660000] font-bold">
                                SL ${pos.slPrice.toFixed(2)}
                              </span>
                            ) : null}
                            {!pos.tpPrice && !pos.slPrice && (
                              <button
                                onClick={() => {
                                  setTpSlModalPosition(pos);
                                  setModalTpPrice('');
                                  setModalSlPrice('');
                                  setTpSlError(null);
                                }}
                                className="text-[8px] text-[#888] hover:text-white underline cursor-pointer"
                              >
                                + Set TP/SL
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Unrealized PnL & ROE */}
                        <td className={`p-1 font-bold ${isBullish ? 'text-crt-bullish' : 'text-crt-bearish'}`}>
                          {isBullish ? '+' : ''}${pos.unrealizedPnl.toFixed(2)} ({isBullish ? '+' : ''}{pos.roe.toFixed(2)}%)
                        </td>

                        {/* Actions */}
                        <td className="p-1 text-right pr-1.5">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => {
                                setTpSlModalPosition(pos);
                                setModalTpPrice(pos.tpPrice ? pos.tpPrice.toFixed(2) : '');
                                setModalSlPrice(pos.slPrice ? pos.slPrice.toFixed(2) : '');
                                setTpSlError(null);
                              }}
                              className="win-btn text-[9px] px-1.5 py-0.5 text-black font-bold active:translate-x-0.5 active:translate-y-0.5 hover:bg-[#E0E0E0]"
                              title="Set Take Profit & Stop Loss"
                            >
                              TP/SL
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFlexTrade(pos);
                                openWindow('flexcard');
                                focusWindow('flexcard');
                              }}
                              className="win-btn text-[9px] px-1.5 py-0.5 text-titlebar-navy font-bold active:translate-x-0.5 active:translate-y-0.5"
                              title="Share PnL Card"
                            >
                              Share ↗
                            </button>
                            <button
                              onClick={() => {
                                closePosition(pos.id, mark);
                                soundFXService.playOrderExecuted();
                              }}
                              className="win-btn text-[9px] px-1.5 py-0.5 text-error font-bold active:translate-x-0.5 active:translate-y-0.5"
                              title="Market Close Position"
                            >
                              Close [X]
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          tradeHistory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center font-mono text-[10.5px] text-[#666] py-3">
              <span className="text-[#888] font-bold">NO PAST ORDERS RECORDED IN THIS SESSION</span>
              <span className="text-[9px] text-[#555] mt-0.5">Closed positions will be archived here.</span>
            </div>
          ) : (
            <div className="flex-1 overflow-auto win-inset-deep bg-[#121212] p-0.5 mt-0.5">
              <table className="w-full text-left font-mono text-[10px] text-white border-collapse min-w-[850px]">
                <thead className="bg-[#202020] text-[#E0E0E0] border-b border-[#404040] sticky top-0 font-bold z-10">
                  <tr>
                    <th className="p-1 pl-1.5">Time</th>
                    <th className="p-1">Pair</th>
                    <th className="p-1">Side</th>
                    <th className="p-1">Entry</th>
                    <th className="p-1">Exit</th>
                    <th className="p-1">Realized PnL</th>
                    <th className="p-1">ROE %</th>
                    <th className="p-1 text-right pr-1.5">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F1F]">
                  {tradeHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-[#1A1A1A] transition-colors">
                      <td className="p-1 pl-1.5 text-[#C0C0C0]">{new Date(item.closedAt).toLocaleTimeString()}</td>
                      <td className="p-1 font-bold text-white">{pairLabelMap[item.pair]}</td>
                      <td className="p-1">
                        <span className={`font-bold ${item.direction === 'LONG' ? 'text-[#00FF66]' : 'text-[#FF4444]'}`}>
                          {item.direction} {item.leverage}x
                        </span>
                      </td>
                      <td className="p-1 text-[#E0E0E0]">${item.entryPrice.toFixed(2)}</td>
                      <td className="p-1 text-[#E0E0E0]">${item.exitPrice.toFixed(2)}</td>
                      <td className={`p-1 font-bold ${item.realizedPnl >= 0 ? 'text-crt-bullish' : 'text-crt-bearish'}`}>
                        {item.realizedPnl >= 0 ? '+' : ''}${item.realizedPnl.toFixed(2)}
                      </td>
                      <td className={`p-1 font-bold ${item.roe >= 0 ? 'text-crt-bullish' : 'text-crt-bearish'}`}>
                        {item.roe >= 0 ? '+' : ''}{item.roe.toFixed(2)}%
                      </td>
                      <td className="p-1 text-right pr-1.5">
                        <div className="flex items-center justify-end space-x-1">
                          <span
                            className={`px-1 py-0.2 text-[8px] font-bold border ${
                              item.status === 'LIQUIDATED'
                                ? 'bg-[#440000] text-[#FF6666] border-[#FF3333]'
                                : 'bg-[#003311] text-[#00FF66] border-[#00FF66]'
                            }`}
                          >
                            {item.status}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedFlexTrade(item);
                              openWindow('flexcard');
                              focusWindow('flexcard');
                            }}
                            className="win-btn text-[8px] px-1 py-0.2 text-titlebar-navy font-bold active:translate-x-0.5 active:translate-y-0.5"
                            title="Share Flex Card"
                          >
                            Share ↗
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>

      {/* =================================================================== */}
      {/* WINDOWS 98 MODAL: Take Profit & Stop Loss Risk Management          */}
      {/* =================================================================== */}
      {tpSlModalPosition && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 font-mono">
          <div className="win-outset bg-win-base p-1 w-full max-w-[420px] shadow-2xl">
            {/* Titlebar */}
            <div className="win-titlebar px-2 py-1 flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 text-white text-[11px] font-bold">
                <PixelIcon name="chart" size={14} className="text-white" />
                <span>POSITION RISK MANAGEMENT: TP / SL</span>
              </div>
              <button
                onClick={() => setTpSlModalPosition(null)}
                className="win-btn px-1 py-0 text-[10px] font-bold text-black active:translate-x-0.5 active:translate-y-0.5"
              >
                ✕
              </button>
            </div>

            <div className="p-2 flex flex-col gap-2.5 text-black">
              {/* Contract & Position Summary */}
              <div className="win-inset-deep bg-[#121212] p-2 text-[10px] text-white flex flex-col gap-1">
                <div className="flex justify-between items-center border-b border-[#333] pb-1">
                  <span className="font-bold text-crt-amber">{pairLabelMap[tpSlModalPosition.pair]}</span>
                  <span
                    className={`px-1 py-0.2 border text-[9px] font-bold ${
                      tpSlModalPosition.direction === 'LONG'
                        ? 'bg-[#003311] text-[#00FF66] border-[#00FF66]'
                        : 'bg-[#330000] text-[#FF3333] border-[#FF3333]'
                    }`}
                  >
                    {tpSlModalPosition.direction} {tpSlModalPosition.leverage}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#AAA]">Entry Price:</span>
                  <span className="text-white font-bold">${tpSlModalPosition.entryPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#AAA]">Current Mark:</span>
                  <span className="text-white font-bold">
                    ${(tpSlModalPosition.markPrice || (tpSlModalPosition.pair === selectedPair ? currentPrice : tpSlModalPosition.entryPrice)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#AAA]">Est. Liquidation:</span>
                  <span className="text-crt-bearish font-bold">${tpSlModalPosition.liquidationPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Take Profit (TP) Section */}
              <div className="win-inset bg-win-base p-2 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#006622]">Take Profit Target (TP):</span>
                  <div className="flex space-x-1">
                    {[10, 25, 50, 100, 200].map((roe) => (
                      <button
                        key={roe}
                        type="button"
                        onClick={() => {
                          const isLong = tpSlModalPosition.direction === 'LONG';
                          const target = isLong
                            ? tpSlModalPosition.entryPrice * (1 + (roe / 100) / tpSlModalPosition.leverage)
                            : tpSlModalPosition.entryPrice * (1 - (roe / 100) / tpSlModalPosition.leverage);
                          setModalTpPrice(target.toFixed(2));
                          setTpSlError(null);
                        }}
                        className="win-btn text-[8.5px] px-1 py-0 font-bold active:translate-x-0.5 active:translate-y-0.5 text-black"
                      >
                        +{roe}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="win-inset bg-white px-2 py-1 flex items-center">
                  <span className="text-[#555] font-mono text-[12px] font-bold mr-1">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 78500.00"
                    value={modalTpPrice}
                    onChange={(e) => {
                      setModalTpPrice(e.target.value);
                      setTpSlError(null);
                    }}
                    className="w-full bg-transparent font-mono text-[13px] font-bold text-black border-none outline-none p-0"
                  />
                </div>

                {/* TP Estimated PnL Preview */}
                {parseFloat(modalTpPrice) > 0 && (
                  <div className="text-[9.5px] text-[#006622] font-bold flex justify-between bg-[#E8F8EE] p-1 border border-[#BBE5C9]">
                    <span>Estimated Profit:</span>
                    <span>
                      {(() => {
                        const target = parseFloat(modalTpPrice);
                        const pnl = calculateUnrealizedPnl(
                          tpSlModalPosition.direction,
                          tpSlModalPosition.entryPrice,
                          target,
                          tpSlModalPosition.quantity
                        );
                        const roe = calculateRoe(pnl, tpSlModalPosition.initialMargin);
                        return `+$${pnl.toFixed(2)} USDT (+${roe.toFixed(2)}% ROE)`;
                      })()}
                    </span>
                  </div>
                )}
              </div>

              {/* Stop Loss (SL) Section */}
              <div className="win-inset bg-win-base p-2 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#BA1A1A]">Stop Loss Target (SL):</span>
                  <div className="flex space-x-1">
                    {[10, 25, 50].map((roe) => (
                      <button
                        key={roe}
                        type="button"
                        onClick={() => {
                          const isLong = tpSlModalPosition.direction === 'LONG';
                          const target = isLong
                            ? tpSlModalPosition.entryPrice * (1 - (roe / 100) / tpSlModalPosition.leverage)
                            : tpSlModalPosition.entryPrice * (1 + (roe / 100) / tpSlModalPosition.leverage);
                          setModalSlPrice(target.toFixed(2));
                          setTpSlError(null);
                        }}
                        className="win-btn text-[8.5px] px-1 py-0 font-bold active:translate-x-0.5 active:translate-y-0.5 text-black"
                      >
                        -{roe}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="win-inset bg-white px-2 py-1 flex items-center">
                  <span className="text-[#555] font-mono text-[12px] font-bold mr-1">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 74000.00"
                    value={modalSlPrice}
                    onChange={(e) => {
                      setModalSlPrice(e.target.value);
                      setTpSlError(null);
                    }}
                    className="w-full bg-transparent font-mono text-[13px] font-bold text-black border-none outline-none p-0"
                  />
                </div>

                {/* SL Estimated PnL Preview */}
                {parseFloat(modalSlPrice) > 0 && (
                  <div className="text-[9.5px] text-[#BA1A1A] font-bold flex justify-between bg-[#FEECEC] p-1 border border-[#F8BDBD]">
                    <span>Estimated Loss:</span>
                    <span>
                      {(() => {
                        const target = parseFloat(modalSlPrice);
                        const pnl = calculateUnrealizedPnl(
                          tpSlModalPosition.direction,
                          tpSlModalPosition.entryPrice,
                          target,
                          tpSlModalPosition.quantity
                        );
                        const roe = calculateRoe(pnl, tpSlModalPosition.initialMargin);
                        return `-$${Math.abs(pnl).toFixed(2)} USDT (${roe.toFixed(2)}% ROE)`;
                      })()}
                    </span>
                  </div>
                )}
              </div>

              {/* Validation Error Message */}
              {tpSlError && (
                <div className="bg-[#FFE5E5] text-[#990000] text-[9.5px] font-bold p-1 border border-[#FF3333]">
                  ⚠ {tpSlError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-1.5 pt-1">
                {(tpSlModalPosition.tpPrice || tpSlModalPosition.slPrice) && (
                  <button
                    type="button"
                    onClick={() => {
                      useTradingStore.getState().setTpSl(tpSlModalPosition.id, undefined, undefined);
                      setTpSlModalPosition(null);
                      soundFXService.playKeyClick();
                    }}
                    className="win-btn px-2 py-1 text-[10px] text-error font-bold active:translate-x-0.5 active:translate-y-0.5 mr-auto"
                  >
                    Clear TP/SL
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTpSlModalPosition(null)}
                  className="win-btn px-3 py-1 text-[10px] text-black font-bold active:translate-x-0.5 active:translate-y-0.5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tp = parseFloat(modalTpPrice);
                    const sl = parseFloat(modalSlPrice);
                    const isLong = tpSlModalPosition.direction === 'LONG';

                    if (modalTpPrice && (isNaN(tp) || tp <= 0)) {
                      setTpSlError('Invalid Take Profit price');
                      return;
                    }
                    if (modalSlPrice && (isNaN(sl) || sl <= 0)) {
                      setTpSlError('Invalid Stop Loss price');
                      return;
                    }

                    if (tp > 0) {
                      if (isLong && tp <= tpSlModalPosition.entryPrice) {
                        setTpSlError('Take Profit for Long must be higher than entry price');
                        return;
                      }
                      if (!isLong && tp >= tpSlModalPosition.entryPrice) {
                        setTpSlError('Take Profit for Short must be lower than entry price');
                        return;
                      }
                    }

                    if (sl > 0) {
                      if (isLong && sl >= tpSlModalPosition.entryPrice) {
                        setTpSlError('Stop Loss for Long must be lower than entry price');
                        return;
                      }
                      if (!isLong && sl <= tpSlModalPosition.entryPrice) {
                        setTpSlError('Stop Loss for Short must be higher than entry price');
                        return;
                      }
                    }

                    useTradingStore.getState().setTpSl(
                      tpSlModalPosition.id,
                      tp > 0 ? tp : undefined,
                      sl > 0 ? sl : undefined
                    );
                    soundFXService.playOrderExecuted();
                    setTpSlModalPosition(null);
                  }}
                  className="win-btn bg-win-base text-titlebar-navy border-2 border-titlebar-navy px-3 py-1 text-[10px] font-bold active:translate-x-0.5 active:translate-y-0.5 shadow"
                >
                  Apply to Chart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </WindowFrame>
  );
};
