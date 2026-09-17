import React, { useEffect, useState } from 'react';
import { WindowFrame, WindowMenuCategory } from '@/components/desktop/WindowFrame';
import { useWindowStore } from '@/stores/useWindowStore';
import { useOrderBookStore } from '@/stores/useOrderBookStore';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { binanceDepthService } from '@/services/BinanceDepthService';
import { TradingPair } from '@/types/market';
import { PixelIcon } from '@/components/common/PixelIcon';
import { soundFXService } from '@/services/SoundFXService';

type ViewMode = 'split' | 'dom' | 'tape';

export const OrderBookWindow: React.FC = () => {
  const isOpen = useWindowStore((state) => state.windows.orderbook?.isOpen ?? false);
  const closeWindow = useWindowStore((state) => state.closeWindow);

  const selectedPair = useOrderBookStore((state) => state.selectedPair);
  const setSelectedPair = useOrderBookStore((state) => state.setSelectedPair);
  const bids = useOrderBookStore((state) => state.bids);
  const asks = useOrderBookStore((state) => state.asks);
  const recentTrades = useOrderBookStore((state) => state.recentTrades);
  const spread = useOrderBookStore((state) => state.spread);
  const spreadPercent = useOrderBookStore((state) => state.spreadPercent);
  const midPrice = useOrderBookStore((state) => state.midPrice);
  const imbalanceRatio = useOrderBookStore((state) => state.imbalanceRatio);
  const precision = useOrderBookStore((state) => state.precision);
  const setPrecision = useOrderBookStore((state) => state.setPrecision);
  const depthLimit = useOrderBookStore((state) => state.depthLimit);
  const setDepthLimit = useOrderBookStore((state) => state.setDepthLimit);
  const isAudioEnabled = useOrderBookStore((state) => state.isAudioEnabled);
  const toggleAudio = useOrderBookStore((state) => state.toggleAudio);
  const clearTrades = useOrderBookStore((state) => state.clearTrades);
  const priceDirection = useOrderBookStore((state) => state.priceDirection);

  const setGlobalPair = useMarketDataStore((state) => state.setSelectedPair);

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Sync depth stream lifecycle with window open state and selected pair
  useEffect(() => {
    if (isOpen) {
      binanceDepthService.start(selectedPair);
    } else {
      binanceDepthService.stop();
    }
    return () => {
      binanceDepthService.stop();
    };
  }, [isOpen, selectedPair]);

  const handlePairChange = (newPair: TradingPair) => {
    soundFXService.playKeyClick();
    setSelectedPair(newPair);
    setGlobalPair(newPair);
    binanceDepthService.switchPair(newPair);
  };

  const handlePriceClick = (price: number) => {
    soundFXService.playKeyClick();
    navigator.clipboard?.writeText(price.toString());
    setCopyFeedback(`Copied $${price.toFixed(2)}`);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  const windowMenus: WindowMenuCategory[] = [
    {
      name: 'File',
      items: [
        {
          label: 'Clear Trade Tape',
          shortcut: 'Ctrl+L',
          onClick: () => {
            clearTrades();
          },
        },
        { divider: true, label: '-' },
        {
          label: 'Close Window',
          shortcut: 'Alt+F4',
          danger: true,
          onClick: () => closeWindow('orderbook'),
        },
      ],
    },
    {
      name: 'View',
      items: [
        {
          label: viewMode === 'split' ? '✓ Split View (DOM + Tape)' : 'Split View (DOM + Tape)',
          onClick: () => setViewMode('split'),
        },
        {
          label: viewMode === 'dom' ? '✓ Level-2 DOM Only' : 'Level-2 DOM Only',
          onClick: () => setViewMode('dom'),
        },
        {
          label: viewMode === 'tape' ? '✓ Tape Reader Only' : 'Tape Reader Only',
          onClick: () => setViewMode('tape'),
        },
      ],
    },
    {
      name: 'Depth',
      items: [
        {
          label: depthLimit === 10 ? '✓ 10 Levels' : '10 Levels',
          onClick: () => setDepthLimit(10),
        },
        {
          label: depthLimit === 15 ? '✓ 15 Levels' : '15 Levels',
          onClick: () => setDepthLimit(15),
        },
        {
          label: depthLimit === 20 ? '✓ 20 Levels' : '20 Levels',
          onClick: () => setDepthLimit(20),
        },
      ],
    },
    {
      name: 'Audio',
      items: [
        {
          label: isAudioEnabled ? '✓ Tape Ticker Sound: ENABLED' : 'Tape Ticker Sound: DISABLED',
          onClick: () => toggleAudio(),
        },
      ],
    },
  ];

  // Helper to format prices based on pair
  const formatPrice = (p: number) => {
    if (selectedPair === 'SOLUSDT') return p.toFixed(2);
    if (selectedPair === 'ETHUSDT') return p.toFixed(2);
    return p.toFixed(2);
  };

  const formatQty = (q: number) => {
    if (selectedPair === 'SOLUSDT') return q.toFixed(1);
    if (selectedPair === 'ETHUSDT') return q.toFixed(3);
    return q.toFixed(4);
  };

  const availablePrecisions =
    selectedPair === 'BTCUSDT' ? [0.1, 1.0, 10.0] : selectedPair === 'ETHUSDT' ? [0.01, 0.1, 1.0] : [0.001, 0.01, 0.1];

  // Inverted asks so the lowest ask is right above the spread
  const reversedAsks = [...asks].reverse();

  return (
    <WindowFrame
      id="orderbook"
      menus={windowMenus}
      statusContent={
        <div className="flex items-center justify-between w-full font-mono text-[10px] text-black">
          <div className="flex items-center space-x-3">
            <span className="font-bold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-crt-bullish animate-ping"></span>
              <span>L2 FEED: BINANCE 100ms</span>
            </span>
            <span>DEPTH: {depthLimit} ROWS</span>
            <span>TAPE: {recentTrades.length} TRADES</span>
            {copyFeedback && <span className="text-[#008531] font-bold">{copyFeedback}</span>}
          </div>
          <div className="flex items-center space-x-2">
            <span>BUY RATIO:</span>
            <span className={`font-bold ${imbalanceRatio >= 50 ? 'text-[#008531]' : 'text-error'}`}>
              {imbalanceRatio}%
            </span>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-full space-y-1 select-none font-ui text-[11px]">
        {/* =================================================================== */}
        {/* TOP TOOLBAR & CONTROLS                                              */}
        {/* =================================================================== */}
        <div className="win-outset p-1.5 bg-win-base flex flex-wrap items-center justify-between gap-1 flex-shrink-0">
          {/* Pair Selector Tabs */}
          <div className="flex items-center space-x-1">
            <span className="font-bold text-[10px] text-black mr-1">PAIR:</span>
            {(['BTCUSDT', 'ETHUSDT', 'SOLUSDT'] as TradingPair[]).map((pair) => (
              <button
                key={pair}
                onClick={() => handlePairChange(pair)}
                className={`px-2 py-0.5 text-[10px] font-bold ${
                  selectedPair === pair ? 'win-btn-pressed bg-win-pressed text-titlebar-navy' : 'win-btn bg-win-base text-black'
                }`}
              >
                {pair.replace('USDT', '')}/USDT
              </button>
            ))}
          </div>

          {/* Grouping / Precision Selector */}
          <div className="flex items-center space-x-1">
            <span className="font-bold text-[10px] text-black">PRECISION:</span>
            {availablePrecisions.map((prec) => (
              <button
                key={prec}
                onClick={() => {
                  soundFXService.playKeyClick();
                  setPrecision(prec);
                }}
                className={`px-1.5 py-0.5 text-[10px] font-mono ${
                  precision === prec ? 'win-btn-pressed bg-win-pressed font-bold' : 'win-btn bg-win-base'
                }`}
              >
                {prec}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                soundFXService.playKeyClick();
                setViewMode('split');
              }}
              title="Split View"
              className={`px-1.5 py-0.5 text-[10px] ${
                viewMode === 'split' ? 'win-btn-pressed bg-win-pressed font-bold' : 'win-btn bg-win-base'
              }`}
            >
              SPLIT
            </button>
            <button
              onClick={() => {
                soundFXService.playKeyClick();
                setViewMode('dom');
              }}
              title="DOM Only"
              className={`px-1.5 py-0.5 text-[10px] ${
                viewMode === 'dom' ? 'win-btn-pressed bg-win-pressed font-bold' : 'win-btn bg-win-base'
              }`}
            >
              DOM
            </button>
            <button
              onClick={() => {
                soundFXService.playKeyClick();
                setViewMode('tape');
              }}
              title="Tape Reader Only"
              className={`px-1.5 py-0.5 text-[10px] ${
                viewMode === 'tape' ? 'win-btn-pressed bg-win-pressed font-bold' : 'win-btn bg-win-base'
              }`}
            >
              TAPE
            </button>
          </div>

          {/* Audio Ticker Toggle */}
          <button
            onClick={() => {
              toggleAudio();
              soundFXService.playKeyClick();
            }}
            className={`px-2 py-0.5 text-[10px] flex items-center space-x-1 ${
              isAudioEnabled ? 'win-btn-pressed bg-win-pressed text-[#008531] font-bold' : 'win-btn bg-win-base text-black'
            }`}
            title="Audio Ticker Feedback on Executed Trades"
          >
            <PixelIcon name={isAudioEnabled ? 'volume_on' : 'volume_off'} size={12} />
            <span>TAPE SOUND</span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* ORDER BOOK IMBALANCE RATIO BAR                                      */}
        {/* =================================================================== */}
        <div className="win-inset bg-[#0a0e14] p-1 flex items-center space-x-2 text-[10px] font-mono flex-shrink-0">
          <span className="text-[#00FF66] font-bold whitespace-nowrap">
            BID {imbalanceRatio}%
          </span>
          <div className="flex-1 h-2.5 bg-[#220a0a] rounded-none overflow-hidden flex border border-[#333]">
            <div
              className="h-full bg-[#008531] transition-all duration-150"
              style={{ width: `${imbalanceRatio}%` }}
            ></div>
            <div
              className="h-full bg-[#cc0000] transition-all duration-150"
              style={{ width: `${100 - imbalanceRatio}%` }}
            ></div>
          </div>
          <span className="text-[#FF4444] font-bold whitespace-nowrap">
            {100 - imbalanceRatio}% ASK
          </span>
        </div>

        {/* =================================================================== */}
        {/* MAIN WORKSPACE: SPLIT LEVEL-2 DOM & TAPE READER                     */}
        {/* =================================================================== */}
        <div className="flex-1 flex min-h-0 space-x-1">
          {/* =============================================================== */}
          {/* LEFT: LEVEL-2 DEPTH OF MARKET (DOM)                             */}
          {/* =============================================================== */}
          {(viewMode === 'split' || viewMode === 'dom') && (
            <div className="flex-1 flex flex-col win-inset bg-[#090d10] p-1 overflow-hidden font-mono text-[10px]">
              {/* Table Column Headers */}
              <div className="grid grid-cols-3 text-neutral-400 font-bold border-b border-neutral-800 pb-1 px-1 flex-shrink-0">
                <span>PRICE (USDT)</span>
                <span className="text-right">SIZE</span>
                <span className="text-right">TOTAL</span>
              </div>

              {/* Scrollable Book Body */}
              <div className="flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar py-0.5">
                {/* 1. ASKS QUEUE (Sell Orders) */}
                <div className="flex flex-col space-y-0.5 justify-end flex-1">
                  {reversedAsks.map((ask, idx) => (
                    <div
                      key={`ask-${idx}-${ask.price}`}
                      onClick={() => handlePriceClick(ask.price)}
                      className="relative grid grid-cols-3 px-1 py-[1px] hover:bg-red-950/40 cursor-pointer group"
                      title={`Click to copy ask price: $${ask.price}`}
                    >
                      {/* Depth Bar Background */}
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-red-600/15 pointer-events-none transition-all duration-75"
                        style={{ width: `${ask.depthPercent}%` }}
                      ></div>
                      <span className="text-[#FF4444] font-bold relative z-10">
                        {formatPrice(ask.price)}
                      </span>
                      <span className="text-right text-neutral-200 relative z-10">
                        {formatQty(ask.quantity)}
                      </span>
                      <span className="text-right text-neutral-400 relative z-10">
                        {formatQty(ask.total)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 2. SPREAD & MID-MARKET DIVIDER */}
                <div className="my-1 py-1 px-2 win-outset bg-[#141b22] border-y border-[#30363d] flex items-center justify-between text-neutral-100 flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-neutral-400 text-[9px] font-bold">MID:</span>
                    <span
                      className={`text-sm font-extrabold flex items-center space-x-1 ${
                        priceDirection === 'up'
                          ? 'text-[#00FF66]'
                          : priceDirection === 'down'
                          ? 'text-[#FF4444]'
                          : 'text-neutral-100'
                      }`}
                    >
                      <span>${midPrice > 0 ? formatPrice(midPrice) : '---'}</span>
                      <PixelIcon
                        name={priceDirection === 'up' ? 'arrow_up' : priceDirection === 'down' ? 'arrow_down' : 'radio'}
                        size={12}
                      />
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] text-neutral-400 font-bold">SPREAD:</span>
                    <span className="text-amber-400 font-bold">
                      ${spread.toFixed(2)} ({spreadPercent.toFixed(4)}%)
                    </span>
                  </div>
                </div>

                {/* 3. BIDS QUEUE (Buy Orders) */}
                <div className="flex flex-col space-y-0.5 justify-start flex-1">
                  {bids.map((bid, idx) => (
                    <div
                      key={`bid-${idx}-${bid.price}`}
                      onClick={() => handlePriceClick(bid.price)}
                      className="relative grid grid-cols-3 px-1 py-[1px] hover:bg-emerald-950/40 cursor-pointer group"
                      title={`Click to copy bid price: $${bid.price}`}
                    >
                      {/* Depth Bar Background */}
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-emerald-600/15 pointer-events-none transition-all duration-75"
                        style={{ width: `${bid.depthPercent}%` }}
                      ></div>
                      <span className="text-[#00FF66] font-bold relative z-10">
                        {formatPrice(bid.price)}
                      </span>
                      <span className="text-right text-neutral-200 relative z-10">
                        {formatQty(bid.quantity)}
                      </span>
                      <span className="text-right text-neutral-400 relative z-10">
                        {formatQty(bid.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* RIGHT: TIME & SALES (TAPE READER)                               */}
          {/* =============================================================== */}
          {(viewMode === 'split' || viewMode === 'tape') && (
            <div className="w-[320px] flex-shrink-0 flex flex-col win-inset bg-[#090d10] p-1 overflow-hidden font-mono text-[10px]">
              {/* Tape Column Headers */}
              <div className="grid grid-cols-4 text-neutral-400 font-bold border-b border-neutral-800 pb-1 px-1 flex-shrink-0">
                <span>TIME</span>
                <span className="text-right">PRICE</span>
                <span className="text-right">QTY</span>
                <span className="text-right">VAL ($)</span>
              </div>

              {/* Scrolling Tape Stream */}
              <div className="flex-1 overflow-y-auto no-scrollbar py-0.5 space-y-0.5">
                {recentTrades.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-neutral-500 italic text-[10px]">
                    Waiting for executed trades stream...
                  </div>
                ) : (
                  recentTrades.map((trade, idx) => {
                    const isSell = trade.isBuyerMaker; // Maker was buyer => taker sold into bid
                    const date = new Date(trade.time);
                    const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(
                      date.getMinutes()
                    ).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;

                    return (
                      <div
                        key={trade.id}
                        className={`grid grid-cols-4 px-1 py-[1px] items-center hover:bg-neutral-800/40 transition-colors ${
                          idx === 0 ? 'bg-neutral-800/30' : ''
                        }`}
                      >
                        <span className="text-neutral-400 text-[9px]">{timeStr}</span>
                        <span
                          className={`text-right font-bold ${
                            isSell ? 'text-[#FF4444]' : 'text-[#00FF66]'
                          }`}
                        >
                          {formatPrice(trade.price)}
                        </span>
                        <span className="text-right text-neutral-200">
                          {formatQty(trade.quantity)}
                        </span>
                        <div className="text-right flex items-center justify-end space-x-1">
                          <span
                            className={`font-semibold ${
                              trade.isWhale ? 'text-amber-300 font-bold' : 'text-neutral-400'
                            }`}
                          >
                            ${Math.round(trade.valueUsd).toLocaleString()}
                          </span>
                          {trade.isWhale && (
                            <span
                              className="px-1 py-0 text-[8px] bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-none font-bold animate-pulse"
                              title="Whale Order (> $25,000 USD)"
                            >
                              WHALE
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </WindowFrame>
  );
};
