import React, { useState } from 'react';
import { WindowFrame } from '@/components/desktop/WindowFrame';
import { PixelIcon } from '@/components/common/PixelIcon';

export const TurboTradeWindow: React.FC = () => {
  const [activePair, setActivePair] = useState<'BTC/USDT' | 'ETH/USDT' | 'SOL/USDT'>('BTC/USDT');
  const [leverage, setLeverage] = useState<number>(20);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [marginMode, setMarginMode] = useState<'isolated' | 'cross'>('isolated');
  const [orderSize, setOrderSize] = useState<string>('5.00');
  const [bottomTab, setBottomTab] = useState<'positions' | 'history'>('positions');

  const pairPrices: Record<string, { price: string; change: string; isBull: boolean }> = {
    'BTC/USDT': { price: '$64,281.50', change: '+2.45%', isBull: true },
    'ETH/USDT': { price: '$3,495.20', change: '-1.15%', isBull: false },
    'SOL/USDT': { price: '$148.60', change: '+5.82%', isBull: true },
  };

  const currentPriceInfo = pairPrices[activePair];

  return (
    <WindowFrame
      id="turbotrade"
      menuItems={['File', 'Market', 'View', 'Order', 'Tools', 'Help']}
      statusContent={
        <>
          <div className="flex items-center space-x-2">
            <span className="text-crt-bullish font-bold">● WS ENGINE: NORMAL</span>
            <span>|</span>
            <span>LATENCY: 14ms</span>
            <span>|</span>
            <span>FEED: BINANCE-FUTURES</span>
          </div>
          <div className="flex items-center space-x-2 font-mono">
            <span>MEM: 1,420KB / 16MB</span>
            <span className="font-bold text-titlebar-navy">[SECURE 128-BIT SSL]</span>
          </div>
        </>
      }
    >
      <div className="flex-1 flex flex-col md:flex-row gap-1 h-full min-h-0 text-black">
        {/* =================================================================== */}
        {/* LEFT PANEL: Market Selector & 24h Metrics (20%)                     */}
        {/* =================================================================== */}
        <div className="w-full md:w-[220px] flex flex-col gap-1 flex-shrink-0">
          {/* Pair Selector Strip */}
          <div className="win-inset bg-win-base p-1 flex flex-col gap-1">
            <div className="font-bold text-[10px] text-bevel-dark uppercase">Select Contract:</div>
            <div className="grid grid-cols-3 gap-1">
              {(['BTC/USDT', 'ETH/USDT', 'SOL/USDT'] as const).map((pair) => (
                <button
                  key={pair}
                  onClick={() => setActivePair(pair)}
                  className={`py-1 text-[10px] font-bold ${
                    activePair === pair ? 'win-btn-pressed bg-win-pressed' : 'win-btn bg-win-base'
                  }`}
                >
                  {pair.split('/')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Ticker Metrics Card */}
          <div className="win-inset-deep p-2 text-white flex flex-col gap-1.5 crt-grid">
            <div className="flex justify-between items-center text-[10px] text-[#A0A0A0]">
              <span className="font-bold font-mono">{activePair} PERP</span>
              <span className="win-inset px-1 bg-[#1A1A1A] text-crt-bullish text-[9px]">LIVE</span>
            </div>

            <div className="font-mono text-[22px] font-bold leading-none text-crt-bullish crt-glow-green">
              {currentPriceInfo.price}
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-bevel-shadow">24h Change:</span>
              <span
                className={`font-bold ${
                  currentPriceInfo.isBull ? 'text-crt-bullish' : 'text-crt-bearish'
                }`}
              >
                {currentPriceInfo.change}
              </span>
            </div>

            <div className="border-t border-[#333] pt-1 flex flex-col gap-0.5 text-[9px] font-mono text-[#AAA]">
              <div className="flex justify-between">
                <span>24h High:</span>
                <span className="text-white">$65,240.00</span>
              </div>
              <div className="flex justify-between">
                <span>24h Low:</span>
                <span className="text-white">$63,180.50</span>
              </div>
              <div className="flex justify-between">
                <span>Funding Rate:</span>
                <span className="text-crt-amber font-bold">0.0100% in 03:42:15</span>
              </div>
            </div>
          </div>

          {/* Quick Account Summary Inset */}
          <div className="win-inset bg-win-base p-1.5 flex flex-col gap-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-bevel-shadow">Wallet Equity:</span>
              <span className="font-mono font-bold text-titlebar-navy">16.71 USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-bevel-shadow">Available Margin:</span>
              <span className="font-mono font-bold text-black">7.50 USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-bevel-shadow">Position Margin:</span>
              <span className="font-mono font-bold text-crt-amber">2.50 USDT</span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* CENTER PANEL: Candlestick Chart & Open Positions Table (55%)        */}
        {/* =================================================================== */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          {/* Chart Viewport & Toolbar */}
          <div className="flex-1 win-inset-deep p-1 flex flex-col min-h-[260px] relative overflow-hidden crt-grid">
            {/* Chart Toolbar */}
            <div className="flex items-center justify-between pb-1 border-b border-[#2A2A2A] text-[10px] text-white">
              <div className="flex items-center space-x-1">
                <span className="font-bold text-crt-amber font-mono mr-1">{activePair}</span>
                {['1m', '5m', '15m', '1h', '1D'].map((tf, i) => (
                  <button
                    key={tf}
                    className={`px-1.5 py-0.5 text-[9px] font-mono ${
                      i === 0 ? 'bg-[#333] text-crt-bullish font-bold border border-[#555]' : 'hover:bg-[#222]'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              <div className="text-[9px] text-[#888] font-mono">
                INDICATORS: [MA 7, 25, 99] [VOL] [MACD]
              </div>
            </div>

            {/* Simulated CRT Candlestick Canvas Graphic */}
            <div className="flex-1 flex flex-col items-center justify-center relative p-2">
              {/* Retro Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-15 pointer-events-none">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border-r border-b border-[#00FF66]"></div>
                ))}
              </div>

              {/* Watermark in background */}
              <div className="absolute text-center text-[#1A2E22] font-mono text-[32px] font-bold select-none pointer-events-none tracking-widest">
                CRYPTOOS 98 // BINANCE WS
              </div>

              {/* Simulated Candlesticks */}
              <div className="w-full h-40 flex items-end justify-around px-4 z-10">
                {[
                  { h: 60, bull: true },
                  { h: 80, bull: true },
                  { h: 45, bull: false },
                  { h: 70, bull: true },
                  { h: 95, bull: true },
                  { h: 85, bull: false },
                  { h: 110, bull: true },
                  { h: 90, bull: false },
                  { h: 125, bull: true },
                  { h: 140, bull: true },
                  { h: 130, bull: false },
                  { h: 155, bull: true },
                ].map((c, idx) => (
                  <div key={idx} className="flex flex-col items-center w-3">
                    <div
                      className={`w-[1px] h-3 ${c.bull ? 'bg-crt-bullish' : 'bg-crt-bearish'}`}
                    ></div>
                    <div
                      style={{ height: `${c.h}px` }}
                      className={`w-2.5 ${
                        c.bull
                          ? 'bg-crt-bullish border border-[#33FF88]'
                          : 'bg-crt-bearish border border-[#FF6666]'
                      }`}
                    ></div>
                    <div
                      className={`w-[1px] h-3 ${c.bull ? 'bg-crt-bullish' : 'bg-crt-bearish'}`}
                    ></div>
                  </div>
                ))}
              </div>

              {/* Real-time Ticker floating badge */}
              <div className="absolute right-3 top-10 win-inset bg-[#0A120D] text-crt-bullish px-2 py-1 text-[11px] font-mono border border-[#00FF66] shadow-lg">
                LAST: $64,281.50 ▲ +2.45%
              </div>
            </div>

            {/* Chart Sub-status */}
            <div className="flex items-center justify-between text-[9px] font-mono text-[#777] border-t border-[#222] pt-0.5">
              <span>O: 63,950.00 | H: 64,310.00 | L: 63,890.00 | C: 64,281.50</span>
              <span className="text-crt-amber font-bold">EST. LIQ PRICE: $57,315.23</span>
            </div>
          </div>

          {/* Bottom Tabs: Open Positions / Order History */}
          <div className="h-[170px] win-inset bg-win-base p-1 flex flex-col">
            {/* Tabs Header */}
            <div className="flex items-center space-x-1 border-b border-bevel-shadow pb-1">
              <button
                onClick={() => setBottomTab('positions')}
                className={`px-3 py-0.5 text-[10px] font-bold ${
                  bottomTab === 'positions' ? 'win-btn-pressed bg-win-pressed' : 'win-btn bg-win-base'
                }`}
              >
                Open Positions (1)
              </button>
              <button
                onClick={() => setBottomTab('history')}
                className={`px-3 py-0.5 text-[10px] font-bold ${
                  bottomTab === 'history' ? 'win-btn-pressed bg-win-pressed' : 'win-btn bg-win-base'
                }`}
              >
                Order History
              </button>
            </div>

            {/* Tab 1: Positions Table */}
            {bottomTab === 'positions' ? (
              <div className="flex-1 overflow-auto mt-1 win-inset-deep bg-[#121212] p-0.5">
                <table className="w-full text-left font-mono text-[9px] text-white">
                  <thead className="bg-[#222] text-[#AAA] border-b border-[#333]">
                    <tr>
                      <th className="p-1">Pair</th>
                      <th className="p-1">Direction</th>
                      <th className="p-1">Size</th>
                      <th className="p-1">Entry</th>
                      <th className="p-1">Mark</th>
                      <th className="p-1">Liq Price</th>
                      <th className="p-1">Margin</th>
                      <th className="p-1">ROE %</th>
                      <th className="p-1 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F1F]">
                    <tr className="hover:bg-[#1A1A1A]">
                      <td className="p-1 font-bold text-white">BTC/USDT</td>
                      <td className="p-1">
                        <span className="bg-[#003311] text-crt-bullish px-1 py-0.2 border border-crt-bullish font-bold">
                          LONG 20x
                        </span>
                      </td>
                      <td className="p-1">0.0016 BTC</td>
                      <td className="p-1">$60,000.00</td>
                      <td className="p-1 font-bold text-crt-bullish">$64,281.50</td>
                      <td className="p-1 text-crt-amber font-bold">$57,315.23</td>
                      <td className="p-1">5.00 USDT</td>
                      <td className="p-1 font-bold text-crt-bullish">+142.7%</td>
                      <td className="p-1 text-right">
                        <button
                          onClick={() => alert('Position closed at market! Profit realized: +7.13 USDT')}
                          className="win-btn text-[9px] px-1.5 py-0.5 text-error font-bold"
                        >
                          Close [X]
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 p-2 font-mono text-[10px] text-bevel-shadow flex items-center justify-center">
                No past orders recorded in this session.
              </div>
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
              className={`py-1 ${orderType === 'market' ? 'win-btn-pressed bg-win-pressed' : 'win-btn'}`}
            >
              [ Market ]
            </button>
            <button
              onClick={() => setOrderType('limit')}
              className={`py-1 ${orderType === 'limit' ? 'win-btn-pressed bg-win-pressed' : 'win-btn'}`}
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
              <span className="font-mono text-titlebar-navy text-[12px]">{leverage}x Multiplier</span>
            </div>

            {/* Stepped Track */}
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="w-full h-3 cursor-ew-resize accent-titlebar-navy"
            />

            <div className="flex justify-between text-[8px] font-mono text-bevel-shadow">
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
              <span className="font-bold">Order Margin:</span>
              <span className="font-mono text-bevel-shadow">Avail: 7.50 USDT</span>
            </div>

            <div className="win-inset-deep bg-white flex items-center px-1.5 py-0.5">
              <input
                type="text"
                value={orderSize}
                onChange={(e) => setOrderSize(e.target.value)}
                className="w-full bg-transparent font-mono text-[14px] font-bold text-black border-none outline-none p-0"
              />
              <span className="font-bold text-bevel-shadow text-[10px]">USDT</span>
            </div>

            {/* Percentage Presets */}
            <div className="grid grid-cols-4 gap-1 text-[10px]">
              {['25%', '50%', '75%', 'MAX'].map((pct) => (
                <button
                  key={pct}
                  onClick={() => {
                    if (pct === '25%') setOrderSize('1.87');
                    if (pct === '50%') setOrderSize('3.75');
                    if (pct === '75%') setOrderSize('5.62');
                    if (pct === 'MAX') setOrderSize('7.50');
                  }}
                  className="win-btn py-0.5 text-center font-bold active:translate-x-0.5 active:translate-y-0.5"
                >
                  {pct}
                </button>
              ))}
            </div>
          </div>

          {/* Pre-trade Calculation Box */}
          <div className="win-inset-deep p-1.5 font-mono text-[9px] text-white flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-bevel-shadow">Notional Value:</span>
              <span className="text-white">${(Number(orderSize || 0) * leverage).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-bevel-shadow">Est. Liq Price:</span>
              <span className="text-crt-bearish font-bold">$57,315.23</span>
            </div>
            <div className="flex justify-between">
              <span className="text-bevel-shadow">Taker Fee (0.05%):</span>
              <span>${((Number(orderSize || 0) * leverage) * 0.0005).toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-bevel-shadow">Slippage Tolerance:</span>
              <span className="text-crt-bullish">0.05%</span>
            </div>
          </div>

          {/* Execution Action Buttons */}
          <div className="flex flex-col gap-1.5 pt-1">
            <button
              onClick={() => alert(`Order placed: OPEN LONG ${leverage}x on ${activePair} for ${orderSize} USDT!`)}
              className="win-btn bg-[#008531] text-white font-bold py-2 flex items-center justify-center space-x-1.5 hover:bg-[#009938] active:translate-x-0.5 active:translate-y-0.5"
            >
              <PixelIcon name="arrow_up" size={14} className="text-crt-bullish" />
              <span className="text-[11px] tracking-wide uppercase">OPEN LONG (BUY)</span>
            </button>

            <button
              onClick={() => alert(`Order placed: OPEN SHORT ${leverage}x on ${activePair} for ${orderSize} USDT!`)}
              className="win-btn bg-[#BA1A1A] text-white font-bold py-2 flex items-center justify-center space-x-1.5 hover:bg-[#CC2020] active:translate-x-0.5 active:translate-y-0.5"
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
