import React, { useState, useEffect } from 'react';
import { WindowFrame } from '@/components/desktop/WindowFrame';
import { PixelIcon } from '@/components/common/PixelIcon';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { useTradingStore } from '@/stores/useTradingStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { fundingRateEngine } from '@/services/FundingRateEngine';
import { TradingPair } from '@/types/market';
import { RetroCandleChart } from '@/components/trading/RetroCandleChart';

export const TurboTradeWindow: React.FC = () => {
  const selectedPair = useMarketDataStore((state) => state.selectedPair);
  const setSelectedPair = useMarketDataStore((state) => state.setSelectedPair);
  const prices = useMarketDataStore((state) => state.prices);
  const priceDirections = useMarketDataStore((state) => state.priceDirections);
  const tickers = useMarketDataStore((state) => state.tickers);
  const connectionStatus = useMarketDataStore((state) => state.connectionStatus);

  const availableMargin = useWalletStore((state) => state.availableMargin);
  const equity = useWalletStore((state) => state.equity);
  const lockedMargin = useWalletStore((state) => state.lockedMargin);
  const positions = useTradingStore((state) => state.positions);
  const tradeHistory = useTradingStore((state) => state.tradeHistory);
  const openPosition = useTradingStore((state) => state.openPosition);
  const closePosition = useTradingStore((state) => state.closePosition);

  const [timeframe, setTimeframe] = useState<string>('1m');
  const [leverage, setLeverage] = useState<number>(20);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [marginMode, setMarginMode] = useState<'isolated' | 'cross'>('isolated');
  const [orderSize, setOrderSize] = useState<string>('5.00');
  const [bottomTab, setBottomTab] = useState<'positions' | 'history'>('positions');
  const [fundingCountdown, setFundingCountdown] = useState<string>('08:00:00');

  const [orderError, setOrderError] = useState<string | null>(null);

  const currentPrice = prices[selectedPair] || 64281.5;
  const currentTicker = tickers[selectedPair];
  const direction = priceDirections[selectedPair];

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

  // Precise mathematical liquidation price calculation from SIMULATION_ENGINE.md
  const mmr = selectedPair === 'BTCUSDT' ? 0.005 : selectedPair === 'ETHUSDT' ? 0.0065 : 0.01;
  const takerFee = 0.0005;
  const estLiqLong = currentPrice * ((1 - 1 / leverage) / (1 - mmr - takerFee));
  const estLiqShort = currentPrice * ((1 + 1 / leverage) / (1 + mmr + takerFee));

  const notional = (Number(orderSize) || 0) * leverage;
  const fee = notional * takerFee;

  const pairLabelMap: Record<TradingPair, string> = {
    BTCUSDT: 'BTC/USDT',
    ETHUSDT: 'ETH/USDT',
    SOLUSDT: 'SOL/USDT',
  };

  return (
    <WindowFrame
      id="turbotrade"
      menuItems={['File', 'Market', 'View', 'Order', 'Tools', 'Help']}
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
      <div className="flex-1 flex flex-col md:flex-row gap-1 h-full min-h-0 text-black font-ui">
        {/* =================================================================== */}
        {/* LEFT PANEL: Market Selector & Live Metrics (20%)                   */}
        {/* =================================================================== */}
        <div className="w-full md:w-[220px] flex flex-col gap-1 flex-shrink-0">
          {/* Pair Selector Strip */}
          <div className="win-inset bg-win-base p-1 flex flex-col gap-1">
            <div className="font-bold text-[10px] text-bevel-dark uppercase">Select Contract:</div>
            <div className="grid grid-cols-3 gap-1">
              {(['BTCUSDT', 'ETHUSDT', 'SOLUSDT'] as const).map((pair) => (
                <button
                  key={pair}
                  onClick={() => setSelectedPair(pair)}
                  className={`py-1 text-[10px] font-bold ${
                    selectedPair === pair
                      ? 'win-btn-pressed bg-win-pressed font-extrabold text-titlebar-navy'
                      : 'win-btn bg-win-base'
                  }`}
                >
                  {pair.replace('USDT', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Live Ticker Card */}
          <div className="win-inset-deep p-2 text-white flex flex-col gap-1.5 crt-grid bg-[#121212]">
            <div className="flex justify-between items-center text-[10px] text-[#C0C0C0]">
              <span className="font-bold font-mono text-white">{pairLabelMap[selectedPair]} PERP</span>
              <span className="win-inset px-1 bg-[#1A1A1A] text-crt-bullish text-[9px] font-mono">
                {connectionStatus === 'CONNECTED' ? 'LIVE ●' : connectionStatus}
              </span>
            </div>

            {/* Dynamic Tick Color Flash Monospace Price Readout */}
            <div
              className={`font-mono text-[22px] font-bold leading-none transition-colors duration-150 ${
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

            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-gray-300 font-medium">24h Change:</span>
              <span
                className={`font-bold ${
                  currentTicker.change24h >= 0 ? 'text-crt-bullish' : 'text-crt-bearish'
                }`}
              >
                {currentTicker.change24h >= 0 ? '+' : ''}
                {currentTicker.change24h.toFixed(2)}%
              </span>
            </div>

            <div className="border-t border-[#333] pt-1 flex flex-col gap-0.5 text-[10px] font-mono text-[#C0C0C0]">
              <div className="flex justify-between">
                <span className="text-[#DDD]">24h High:</span>
                <span className="text-white font-semibold">${currentTicker.high24h.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#DDD]">24h Low:</span>
                <span className="text-white font-semibold">${currentTicker.low24h.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#DDD]">24h Volume:</span>
                <span className="text-white font-semibold">
                  {currentTicker.volume24h.toLocaleString('en-US', { maximumFractionDigits: 1 })}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#2A2A2A] pt-0.5 mt-0.5">
                <span className="text-[#DDD]">Funding Rate:</span>
                <span className="text-crt-amber font-bold">
                  {(currentTicker.fundingRate * 100).toFixed(4)}% in {fundingCountdown}
                </span>
              </div>
            </div>
          </div>

          {/* Account Margin Inset */}
          <div className="win-inset bg-win-base p-1.5 flex flex-col gap-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-[#333] font-semibold">Account Equity:</span>
              <span className="font-mono font-bold text-titlebar-navy">{equity.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#333] font-semibold">Available Margin:</span>
              <span className="font-mono font-bold text-black">{availableMargin.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#333] font-semibold">Position Margin:</span>
              <span className="font-mono font-bold text-crt-amber">{lockedMargin.toFixed(2)} USDT</span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* CENTER PANEL: Interactive Lightweight Candlestick Chart (55%)       */}
        {/* =================================================================== */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          {/* Chart Viewport & Toolbar */}
          <div className="flex-1 win-inset-deep p-1 flex flex-col min-h-[280px] relative overflow-hidden bg-[#121212]">
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

          {/* Bottom Tabs: Open Positions / Order History */}
          <div className="h-[160px] win-inset bg-win-base p-1 flex flex-col flex-shrink-0">
            {/* Tabs Header */}
            <div className="flex items-center space-x-1 border-b border-bevel-shadow pb-1">
              <button
                onClick={() => setBottomTab('positions')}
                className={`px-3 py-0.5 text-[10px] font-bold ${
                  bottomTab === 'positions'
                    ? 'win-btn-pressed bg-win-pressed text-titlebar-navy'
                    : 'win-btn bg-win-base text-black'
                }`}
              >
                Open Positions ({positions.length})
              </button>
              <button
                onClick={() => setBottomTab('history')}
                className={`px-3 py-0.5 text-[10px] font-bold ${
                  bottomTab === 'history'
                    ? 'win-btn-pressed bg-win-pressed text-titlebar-navy'
                    : 'win-btn bg-win-base text-black'
                }`}
              >
                Order History ({tradeHistory.length})
              </button>
            </div>

            {/* Positions Table */}
            {bottomTab === 'positions' ? (
              positions.length === 0 ? (
                <div className="flex-1 p-4 font-mono text-[11px] text-[#666] font-semibold flex items-center justify-center">
                  NO ACTIVE OPEN POSITIONS. SELECT CONTRACT &amp; EXECUTE AN ORDER ON RIGHT PANEL.
                </div>
              ) : (
                <div className="flex-1 overflow-auto mt-1 win-inset-deep bg-[#121212] p-0.5">
                  <table className="w-full text-left font-mono text-[10px] text-white">
                    <thead className="bg-[#262626] text-white border-b border-[#3E3E3E] sticky top-0 font-bold">
                      <tr>
                        <th className="p-1">Pair</th>
                        <th className="p-1">Direction</th>
                        <th className="p-1">Size</th>
                        <th className="p-1">Entry</th>
                        <th className="p-1">Mark</th>
                        <th className="p-1">Liq Price</th>
                        <th className="p-1">Margin</th>
                        <th className="p-1">uPnL (ROE)</th>
                        <th className="p-1 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F1F1F]">
                      {positions.map((pos) => {
                        const mark = prices[pos.pair] || pos.markPrice;
                        const isBullish = pos.unrealizedPnl >= 0;
                        return (
                          <tr key={pos.id} className="hover:bg-[#1A1A1A]">
                            <td className="p-1 font-bold text-white">{pairLabelMap[pos.pair]}</td>
                            <td className="p-1">
                              <span
                                className={`px-1 py-0.2 border font-bold ${
                                  pos.direction === 'LONG'
                                    ? 'bg-[#003311] text-[#00FF66] border-[#00FF66]'
                                    : 'bg-[#330000] text-[#FF4444] border-[#FF4444]'
                                }`}
                              >
                                {pos.direction} {pos.leverage}x
                              </span>
                            </td>
                            <td className="p-1 text-[#E0E0E0]">{pos.quantity.toFixed(4)}</td>
                            <td className="p-1 text-[#E0E0E0]">${pos.entryPrice.toFixed(2)}</td>
                            <td className="p-1 font-bold text-white">${mark.toFixed(2)}</td>
                            <td className="p-1 text-crt-amber font-bold">${pos.liquidationPrice.toFixed(2)}</td>
                            <td className="p-1 text-[#E0E0E0]">{pos.initialMargin.toFixed(2)} USDT</td>
                            <td className={`p-1 font-bold ${isBullish ? 'text-crt-bullish' : 'text-crt-bearish'}`}>
                              {isBullish ? '+' : ''}${pos.unrealizedPnl.toFixed(2)} ({isBullish ? '+' : ''}{pos.roe.toFixed(2)}%)
                            </td>
                            <td className="p-1 text-right">
                              <button
                                onClick={() => closePosition(pos.id, mark)}
                                className="win-btn text-[9px] px-1.5 py-0.5 text-error font-bold active:translate-x-0.5 active:translate-y-0.5"
                              >
                                Close [X]
                              </button>
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
                <div className="flex-1 p-4 font-mono text-[11px] text-[#666] font-semibold flex items-center justify-center">
                  NO PAST ORDERS RECORDED IN THIS SESSION.
                </div>
              ) : (
                <div className="flex-1 overflow-auto mt-1 win-inset-deep bg-[#121212] p-0.5">
                  <table className="w-full text-left font-mono text-[10px] text-white">
                    <thead className="bg-[#262626] text-white border-b border-[#3E3E3E] sticky top-0 font-bold">
                      <tr>
                        <th className="p-1">Time</th>
                        <th className="p-1">Pair</th>
                        <th className="p-1">Side</th>
                        <th className="p-1">Entry</th>
                        <th className="p-1">Exit</th>
                        <th className="p-1">Realized PnL</th>
                        <th className="p-1">ROE %</th>
                        <th className="p-1 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F1F1F]">
                      {tradeHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-[#1A1A1A]">
                          <td className="p-1 text-[#C0C0C0]">{new Date(item.closedAt).toLocaleTimeString()}</td>
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
                          <td className="p-1 text-right">
                            <span
                              className={`px-1 py-0.2 text-[8px] font-bold border ${
                                item.status === 'LIQUIDATED'
                                  ? 'bg-[#440000] text-[#FF6666] border-[#FF3333]'
                                  : 'bg-[#003311] text-[#00FF66] border-[#00FF66]'
                              }`}
                            >
                              {item.status}
                            </span>
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
        {/* RIGHT PANEL: Order Execution Form (25%)                             */}
        {/* =================================================================== */}
        <div className="w-full md:w-[240px] win-outset bg-win-base p-1.5 flex flex-col gap-2 flex-shrink-0">
          {/* Market / Limit Order Toggle */}
          <div className="grid grid-cols-2 gap-1 font-bold text-[10px]">
            <button
              onClick={() => setOrderType('market')}
              className={`py-1 ${
                orderType === 'market' ? 'win-btn-pressed bg-win-pressed' : 'win-btn'
              }`}
            >
              [ Market ]
            </button>
            <button
              onClick={() => setOrderType('limit')}
              className={`py-1 ${
                orderType === 'limit' ? 'win-btn-pressed bg-win-pressed' : 'win-btn'
              }`}
            >
              [ Limit ]
            </button>
          </div>

          {/* Margin Mode Selector */}
          <div className="win-inset bg-surface-low p-1 flex items-center justify-between text-[10px]">
            <span className="font-bold text-bevel-dark">Margin Mode:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => setMarginMode('isolated')}
                className={`px-1.5 py-0.5 font-bold ${
                  marginMode === 'isolated' ? 'win-btn-pressed bg-win-pressed' : 'win-btn'
                }`}
              >
                Isolated
              </button>
              <button
                onClick={() => setMarginMode('cross')}
                className={`px-1.5 py-0.5 font-bold ${
                  marginMode === 'cross' ? 'win-btn-pressed bg-win-pressed' : 'win-btn'
                }`}
              >
                Cross
              </button>
            </div>
          </div>

          {/* Leverage Stepper / Slider */}
          <div className="win-inset bg-surface-low p-1.5 flex flex-col gap-1 text-[10px]">
            <div className="flex justify-between items-center font-bold">
              <span>Leverage:</span>
              <span className="font-mono text-titlebar-navy text-[12px]">
                {leverage}x Multiplier
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="w-full h-3 cursor-ew-resize accent-titlebar-navy"
            />

            <div className="flex justify-between text-[9px] font-mono text-[#333] font-semibold">
              <span>1x</span>
              <span>10x</span>
              <span className="font-bold text-titlebar-navy">20x</span>
              <span>50x</span>
              <span>100x</span>
            </div>

            {leverage >= 20 && (
              <div className="bg-[#FFE5E5] text-crt-bearish text-[8px] font-bold p-1 border border-crt-bearish flex items-center gap-1">
                <PixelIcon name="warning" size={10} />
                <span>Warning: {leverage}x High Liquidation Risk</span>
              </div>
            )}
          </div>

          {/* Order Size Input */}
          <div className="flex flex-col gap-1 text-[10px]">
            <div className="flex justify-between">
              <span className="font-bold text-black">Order Margin:</span>
              <span className="font-mono text-[#222] font-semibold">Avail: ${availableMargin.toFixed(2)} USDT</span>
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
              <span className="font-bold text-[#333] text-[11px]">USDT</span>
            </div>

            {/* Percentage Presets */}
            <div className="grid grid-cols-4 gap-1 text-[10px]">
              {['25%', '50%', '75%', 'MAX'].map((pct) => (
                <button
                  key={pct}
                  onClick={() => {
                    setOrderError(null);
                    if (pct === '25%') setOrderSize((availableMargin * 0.25).toFixed(2));
                    if (pct === '50%') setOrderSize((availableMargin * 0.50).toFixed(2));
                    if (pct === '75%') setOrderSize((availableMargin * 0.75).toFixed(2));
                    if (pct === 'MAX') {
                      // Max available leaving fee buffer
                      const maxMargin = Math.max(0, availableMargin * 0.98);
                      setOrderSize(maxMargin.toFixed(2));
                    }
                  }}
                  className="win-btn py-0.5 text-center font-bold active:translate-x-0.5 active:translate-y-0.5 text-black"
                >
                  {pct}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Pre-trade Calculation Box */}
          <div className="win-inset-deep bg-[#121212] p-2 font-mono text-[10px] text-white flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="text-[#C0C0C0] font-semibold">Notional Value:</span>
              <span className="text-white font-bold">${notional.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#C0C0C0] font-semibold">Est. Liq Price:</span>
              <span className="text-crt-bearish font-bold">${estLiqLong.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#C0C0C0] font-semibold">Taker Fee (0.05%):</span>
              <span className="text-white font-bold">${fee.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#C0C0C0] font-semibold">Slippage Tolerance:</span>
              <span className="text-crt-bullish font-bold">0.05%</span>
            </div>
          </div>

          {/* Order Error Notification */}
          {orderError && (
            <div className="bg-[#FFE5E5] text-crt-bearish text-[8px] font-bold p-1 border border-crt-bearish">
              ⚠ {orderError}
            </div>
          )}

          {/* Execution Action Buttons */}
          <div className="flex flex-col gap-1.5 pt-1">
            <button
              onClick={() => {
                setOrderError(null);
                const margin = parseFloat(orderSize);
                if (isNaN(margin) || margin <= 0) {
                  setOrderError('Enter valid margin amount');
                  return;
                }
                const res = openPosition(
                  {
                    pair: selectedPair,
                    direction: 'LONG',
                    marginMode: marginMode.toUpperCase() as 'ISOLATED' | 'CROSS',
                    leverage,
                    margin,
                    type: orderType.toUpperCase() as 'MARKET' | 'LIMIT',
                  },
                  currentPrice
                );
                if (!res.success) {
                  setOrderError(res.error || 'Order failed');
                }
              }}
              className="win-btn bg-[#008531] text-white font-bold py-2 flex items-center justify-center space-x-1.5 hover:bg-[#009938] active:translate-x-0.5 active:translate-y-0.5 shadow"
            >
              <PixelIcon name="arrow_up" size={14} className="text-crt-bullish" />
              <span className="text-[11px] tracking-wide uppercase">OPEN LONG (BUY)</span>
            </button>

            <button
              onClick={() => {
                setOrderError(null);
                const margin = parseFloat(orderSize);
                if (isNaN(margin) || margin <= 0) {
                  setOrderError('Enter valid margin amount');
                  return;
                }
                const res = openPosition(
                  {
                    pair: selectedPair,
                    direction: 'SHORT',
                    marginMode: marginMode.toUpperCase() as 'ISOLATED' | 'CROSS',
                    leverage,
                    margin,
                    type: orderType.toUpperCase() as 'MARKET' | 'LIMIT',
                  },
                  currentPrice
                );
                if (!res.success) {
                  setOrderError(res.error || 'Order failed');
                }
              }}
              className="win-btn bg-[#BA1A1A] text-white font-bold py-2 flex items-center justify-center space-x-1.5 hover:bg-[#CC2020] active:translate-x-0.5 active:translate-y-0.5 shadow"
            >
              <PixelIcon name="arrow_down" size={14} className="text-white" />
              <span className="text-[11px] tracking-wide uppercase">OPEN SHORT (SELL)</span>
            </button>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
};
