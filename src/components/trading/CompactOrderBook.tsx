import React, { useMemo } from 'react';
import { useOrderBookStore } from '@/stores/useOrderBookStore';
import { soundFXService } from '@/services/SoundFXService';
import { PixelIcon } from '@/components/common/PixelIcon';

interface CompactOrderBookProps {
  onSelectPrice?: (price: number) => void;
  className?: string;
  maxLevels?: number;
}

export const CompactOrderBook: React.FC<CompactOrderBookProps> = ({
  onSelectPrice,
  className = '',
  maxLevels = 7,
}) => {
  const bids = useOrderBookStore((state) => state.bids);
  const asks = useOrderBookStore((state) => state.asks);
  const midPrice = useOrderBookStore((state) => state.midPrice);
  const spread = useOrderBookStore((state) => state.spread);
  const spreadPercent = useOrderBookStore((state) => state.spreadPercent);
  const imbalanceRatio = useOrderBookStore((state) => state.imbalanceRatio);
  const priceDirection = useOrderBookStore((state) => state.priceDirection);
  const updateSpeedMs = useOrderBookStore((state) => state.updateSpeedMs);
  const setUpdateSpeedMs = useOrderBookStore((state) => state.setUpdateSpeedMs);
  const precision = useOrderBookStore((state) => state.precision);

  // Take top N asks and ensure exactly maxLevels items via continuous ladder
  const displayAsks = useMemo(() => {
    if (asks.length === 0) return [];
    const slice = [...asks.slice(0, maxLevels)];
    const tickStep = precision > 0 ? precision : 1.0;

    if (slice.length < maxLevels) {
      let lastAsk = slice[slice.length - 1];
      const avgQty = slice.reduce((sum, a) => sum + a.quantity, 0) / slice.length || 0.1;
      while (slice.length < maxLevels) {
        const nextPrice = Number((lastAsk.price + tickStep).toFixed(2));
        const simulatedQty = Number((avgQty * (0.6 + (slice.length % 3) * 0.25)).toFixed(4));
        const newLevel = {
          price: nextPrice,
          quantity: simulatedQty,
          total: lastAsk.total + simulatedQty,
          depthPercent: Math.min(95, lastAsk.depthPercent + 8),
        };
        slice.push(newLevel);
        lastAsk = newLevel;
      }
    }
    return slice.reverse();
  }, [asks, maxLevels, precision]);

  // Take top N bids and ensure exactly maxLevels items via continuous ladder
  const displayBids = useMemo(() => {
    if (bids.length === 0) return [];
    const slice = [...bids.slice(0, maxLevels)];
    const tickStep = precision > 0 ? precision : 1.0;

    if (slice.length < maxLevels) {
      let lastBid = slice[slice.length - 1];
      const avgQty = slice.reduce((sum, b) => sum + b.quantity, 0) / slice.length || 0.1;
      while (slice.length < maxLevels) {
        const nextPrice = Number((lastBid.price - tickStep).toFixed(2));
        const simulatedQty = Number((avgQty * (0.6 + (slice.length % 3) * 0.25)).toFixed(4));
        const newLevel = {
          price: nextPrice,
          quantity: simulatedQty,
          total: lastBid.total + simulatedQty,
          depthPercent: Math.min(95, lastBid.depthPercent + 8),
        };
        slice.push(newLevel);
        lastBid = newLevel;
      }
    }
    return slice;
  }, [bids, maxLevels, precision]);

  const handlePriceClick = (price: number) => {
    soundFXService.playKeyClick();
    if (onSelectPrice) {
      onSelectPrice(price);
    }
  };

  const formatPrice = (p: number) => {
    return p.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatQty = (q: number) => {
    if (q >= 100) return q.toFixed(1);
    if (q >= 10) return q.toFixed(2);
    if (q >= 1) return q.toFixed(3);
    return q.toFixed(4);
  };

  return (
    <div className={`win-inset bg-[#090d10] p-1.5 flex flex-col font-mono text-[10px] select-none ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#222] pb-1 mb-1 text-[9px] text-[#A0A0A0]">
        <div className="flex items-center space-x-1">
          <span className="font-bold text-white uppercase tracking-tight">Order Book</span>
          <button
            onClick={() => {
              soundFXService.playKeyClick();
              const nextSpeed =
                updateSpeedMs === 350 ? 500 : updateSpeedMs === 500 ? 1000 : updateSpeedMs === 1000 ? 100 : 350;
              setUpdateSpeedMs(nextSpeed);
            }}
            className="win-btn px-1 py-0 text-[8px] text-[#DDD] bg-[#1A1A1A] hover:text-white"
            title="Update Speed / Throttle (Click to cycle: 350ms -> 500ms -> 1s -> 100ms)"
          >
            {updateSpeedMs >= 1000 ? `${updateSpeedMs / 1000}s` : `${updateSpeedMs}ms`}
          </button>
        </div>
        <div className="text-right">
          <span className="text-[#888]">Spread: </span>
          <span className="text-amber-400 font-bold">${spread.toFixed(2)}</span>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-2 text-[9px] text-[#777] font-bold border-b border-[#1A1A1A] pb-0.5 px-1 mb-0.5">
        <span>PRICE (USDT)</span>
        <span className="text-right">SIZE</span>
      </div>

      {/* Asks (Sell Orders) List */}
      <div className="flex-1 flex flex-col justify-between min-h-0 py-0.5 overflow-hidden">
        {displayAsks.length === 0 ? (
          <div className="text-center py-4 text-[#555] text-[9px] m-auto">Connecting L2...</div>
        ) : (
          displayAsks.map((ask, idx) => (
            <div
              key={`ask-${idx}-${ask.price}`}
              onClick={() => handlePriceClick(ask.price)}
              className="relative flex-1 grid grid-cols-2 items-center px-1 py-[0.5px] hover:bg-red-900/30 cursor-pointer group transition-colors"
              title={`Click to use Ask: $${formatPrice(ask.price)}`}
            >
              {/* Depth Visual Bar */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-red-600/20 pointer-events-none transition-all duration-200 ease-out"
                style={{ width: `${Math.min(100, Math.max(5, ask.depthPercent))}%` }}
              />
              <span className="text-[#FF4444] font-bold relative z-10 leading-none">
                {formatPrice(ask.price)}
              </span>
              <span className="text-right text-[#C0C0C0] relative z-10 group-hover:text-white leading-none">
                {formatQty(ask.quantity)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Mid Market / Last Price Readout Divider */}
      <div className="my-1 py-1 px-1.5 win-outset bg-[#12181F] border-y border-[#26303B] flex items-center justify-between text-white flex-shrink-0">
        <div className="flex items-center space-x-1.5 min-w-0">
          <span
            className={`text-[12px] font-extrabold flex items-center space-x-1 leading-none ${
              priceDirection === 'up'
                ? 'text-[#00FF66]'
                : priceDirection === 'down'
                ? 'text-[#FF4444]'
                : 'text-white'
            }`}
          >
            <span>${midPrice > 0 ? formatPrice(midPrice) : '---'}</span>
          </span>
          <PixelIcon
            name={priceDirection === 'up' ? 'arrow_up' : priceDirection === 'down' ? 'arrow_down' : 'radio'}
            size={11}
            className={priceDirection === 'up' ? 'text-[#00FF66]' : priceDirection === 'down' ? 'text-[#FF4444]' : 'text-neutral-400'}
          />
        </div>
        <span className="text-[8.5px] text-[#888] font-semibold">
          ({spreadPercent.toFixed(3)}%)
        </span>
      </div>

      {/* Bids (Buy Orders) List */}
      <div className="flex-1 flex flex-col justify-between min-h-0 py-0.5 overflow-hidden">
        {displayBids.length === 0 ? (
          <div className="text-center py-4 text-[#555] text-[9px] m-auto">Connecting L2...</div>
        ) : (
          displayBids.map((bid, idx) => (
            <div
              key={`bid-${idx}-${bid.price}`}
              onClick={() => handlePriceClick(bid.price)}
              className="relative flex-1 grid grid-cols-2 items-center px-1 py-[0.5px] hover:bg-green-900/30 cursor-pointer group transition-colors"
              title={`Click to use Bid: $${formatPrice(bid.price)}`}
            >
              {/* Depth Visual Bar */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-green-600/20 pointer-events-none transition-all duration-200 ease-out"
                style={{ width: `${Math.min(100, Math.max(5, bid.depthPercent))}%` }}
              />
              <span className="text-[#00FF66] font-bold relative z-10 leading-none">
                {formatPrice(bid.price)}
              </span>
              <span className="text-right text-[#C0C0C0] relative z-10 group-hover:text-white leading-none">
                {formatQty(bid.quantity)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Order Book Imbalance Ratio Meter */}
      <div className="mt-1 pt-1 border-t border-[#1C242E] flex flex-col gap-0.5 text-[8.5px] flex-shrink-0">
        <div className="flex justify-between items-center text-[#888]">
          <span className="text-[#00FF66] font-bold">BID {imbalanceRatio}%</span>
          <span className="text-[#FF4444] font-bold">{100 - imbalanceRatio}% ASK</span>
        </div>
        <div className="w-full h-1.5 bg-[#200A0A] overflow-hidden flex border border-[#333]">
          <div
            className="h-full bg-[#008531] transition-all duration-150"
            style={{ width: `${imbalanceRatio}%` }}
          />
          <div
            className="h-full bg-[#CC0000] transition-all duration-150"
            style={{ width: `${100 - imbalanceRatio}%` }}
          />
        </div>
      </div>
    </div>
  );
};
