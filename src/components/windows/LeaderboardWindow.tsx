import React, { useState } from 'react';
import { WindowFrame } from '@/components/desktop/WindowFrame';
import { useWindowStore } from '@/stores/useWindowStore';

export const LeaderboardWindow: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'roi' | 'gainers' | 'weekly' | 'shame'>('roi');
  const openWindow = useWindowStore((state) => state.openWindow);

  return (
    <WindowFrame
      id="leaderboard"
      menuItems={['File', 'Filter', 'Seasons', 'Prizes', 'Help']}
      statusContent={
        <>
          <div className="flex items-center space-x-2">
            <span className="text-crt-bullish font-bold">● LAST SYNC: 14:45:12 UTC</span>
            <span>|</span>
            <span>NODE: #NODE-7729</span>
            <span>|</span>
            <span>LATENCY: 12ms</span>
          </div>
          <div className="font-bold text-titlebar-navy font-mono">TOTAL TRADERS: 4,921 ACTIVE</div>
        </>
      }
    >
      <div className="flex flex-col gap-1.5 p-1 text-black font-ui h-full overflow-hidden">
        {/* Controls / Filter Bar */}
        <div className="win-inset bg-surface-high px-2 py-1 flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveFilter('roi')}
              className={`px-2 py-0.5 text-[10px] font-bold ${
                activeFilter === 'roi' ? 'win-btn-pressed bg-win-pressed' : 'win-btn bg-win-base'
              }`}
            >
              <span className="text-crt-amber">⚡</span> All-Time ROI
            </button>
            <button
              onClick={() => setActiveFilter('gainers')}
              className={`px-2 py-0.5 text-[10px] font-bold ${
                activeFilter === 'gainers' ? 'win-btn-pressed bg-win-pressed' : 'win-btn bg-win-base'
              }`}
            >
              <span className="text-[#008531]">▲</span> 24H Top Gainers
            </button>
            <button
              onClick={() => setActiveFilter('weekly')}
              className={`px-2 py-0.5 text-[10px] font-bold ${
                activeFilter === 'weekly' ? 'win-btn-pressed bg-win-pressed' : 'win-btn bg-win-base'
              }`}
            >
              <span className="text-titlebar-navy">🏆</span> Weekly PnL Cup
            </button>
            <button
              onClick={() => setActiveFilter('shame')}
              className={`px-2 py-0.5 text-[10px] font-bold ${
                activeFilter === 'shame' ? 'win-btn-pressed bg-win-pressed' : 'win-btn bg-win-base'
              }`}
            >
              <span className="text-crt-bearish">☠</span> Most Liquidated
            </button>
          </div>

          <div className="flex items-center space-x-1 font-mono text-[10px]">
            <span className="text-black font-bold">Season:</span>
            <span className="win-inset bg-white px-1.5 py-0.2 font-bold text-black">
              Season 01 (Ends in 3d 14h)
            </span>
          </div>
        </div>

        {/* Top 3 Podium Showcase */}
        <div className="grid grid-cols-3 gap-1.5 flex-shrink-0">
          {/* #2 Silver */}
          <div className="win-inset bg-win-base p-1.5 flex items-center space-x-2">
            <div className="w-9 h-9 win-outset bg-surface-high flex flex-col items-center justify-center font-bold text-[11px]">
              <span className="text-[#333] font-bold">#2</span>
              <span className="text-[12px] leading-none">🥈</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[11px] truncate text-black">GigaTrader_X</span>
                <span className="win-inset bg-white px-1 text-[8px] text-titlebar-navy font-mono font-bold">Slayer</span>
              </div>
              <div className="font-mono text-[13px] font-bold text-[#008531]">+890.2% ROI</div>
              <div className="text-[10px] font-mono text-[#333] font-semibold">Profit: +$18,420.00</div>
            </div>
          </div>

          {/* #1 Gold */}
          <div className="win-inset bg-win-base p-1.5 flex items-center space-x-2 border-2 border-crt-amber shadow-sm">
            <div className="w-10 h-10 win-outset bg-[#FFF5D6] flex flex-col items-center justify-center font-bold text-[12px] border border-crt-amber">
              <span className="text-crt-amber font-extrabold">#1</span>
              <span className="text-[14px] leading-none">👑</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-[12px] truncate text-black">ChadWhale_69</span>
                <span className="win-outset bg-crt-amber text-black px-1 text-[8px] font-bold">Whale</span>
              </div>
              <div className="font-mono text-[14px] font-bold text-[#008531]">+1,420.5% ROI</div>
              <div className="text-[10px] font-mono text-black font-bold">Profit: +$42,850.00</div>
            </div>
          </div>

          {/* #3 Bronze */}
          <div className="win-inset bg-win-base p-1.5 flex items-center space-x-2">
            <div className="w-9 h-9 win-outset bg-surface-high flex flex-col items-center justify-center font-bold text-[11px]">
              <span className="text-[#995522] font-bold">#3</span>
              <span className="text-[12px] leading-none">🥉</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[11px] truncate text-black">MoonOrDust</span>
                <span className="win-inset bg-white px-1 text-[8px] text-[#333] font-mono font-bold">Degen</span>
              </div>
              <div className="font-mono text-[13px] font-bold text-[#008531]">+654.8% ROI</div>
              <div className="text-[10px] font-mono text-[#333] font-semibold">Profit: +$11,200.00</div>
            </div>
          </div>
        </div>

        {/* Data Grid Table */}
        <div className="flex-1 win-inset-deep bg-white flex flex-col overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 bg-win-base text-black font-bold text-[11px] border-b-2 border-bevel-dark select-none">
            <div className="col-span-1 win-btn py-1 px-1 text-center">Rank</div>
            <div className="col-span-3 win-btn py-1 px-2 text-left">Trader Handle</div>
            <div className="col-span-2 win-btn py-1 px-1 text-left">Tier</div>
            <div className="col-span-2 win-btn py-1 px-1 text-right">Win Rate</div>
            <div className="col-span-2 win-btn py-1 px-1 text-right">7D ROI</div>
            <div className="col-span-2 win-btn py-1 px-2 text-right">Net PnL</div>
          </div>

          {/* Body Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E0E0E0] font-mono text-[10px]">
            {[
              { rank: '#1', name: 'ChadWhale_69', tier: 'Whale Apex', winRate: '84.2%', roi: '+1,420.5%', pnl: '+$42,850.00', icon: '🥇' },
              { rank: '#2', name: 'GigaTrader_X', tier: 'Liquidator Slayer', winRate: '78.0%', roi: '+890.2%', pnl: '+$18,420.00', icon: '🥈' },
              { rank: '#3', name: 'MoonOrDust', tier: 'Degen Master', winRate: '71.4%', roi: '+654.8%', pnl: '+$11,200.00', icon: '🥉' },
              { rank: '#4', name: 'BitLiquidator99', tier: 'Veteran Scalper', winRate: '69.2%', roi: '+512.4%', pnl: '+$9,450.20', icon: '' },
              { rank: '#5', name: '0xNakamotoGhost', tier: 'Algo Trader', winRate: '65.8%', roi: '+389.0%', pnl: '+$6,110.00', icon: '' },
              { rank: '#6', name: 'PerpYOLO_King', tier: 'High Roller', winRate: '61.0%', roi: '+304.5%', pnl: '+$4,820.50', icon: '' },
            ].map((row, idx) => (
              <div
                key={idx}
                className={`grid grid-cols-12 px-1 py-1 items-center hover:bg-[#F0F4FF] ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-[#F9F9F9]'
                }`}
              >
                <div className="col-span-1 text-center font-bold text-black">
                  {row.rank} {row.icon}
                </div>
                <div className="col-span-3 font-bold text-black truncate">{row.name}</div>
                <div className="col-span-2 text-[10px] text-[#333] font-medium">{row.tier}</div>
                <div className="col-span-2 text-right font-bold text-black">{row.winRate}</div>
                <div className="col-span-2 text-right font-bold text-[#008531]">{row.roi}</div>
                <div className="col-span-2 text-right font-bold text-[#008531] pr-1">{row.pnl}</div>
              </div>
            ))}
          </div>

          {/* Sticky User Row (YOU) */}
          <div className="grid grid-cols-12 px-2 py-1 items-center bg-titlebar-navy text-white font-mono text-[10px] border-t-2 border-bevel-highlight">
            <div className="col-span-1 text-center font-bold text-crt-amber">#142</div>
            <div className="col-span-3 font-bold flex items-center gap-1">
              <span>SatoshiDegen_98</span>
              <span className="win-outset bg-crt-amber text-black px-1 text-[8px] font-bold">YOU</span>
            </div>
            <div className="col-span-2 text-[10px] text-[#EEE] font-medium">Novice Liquidator</div>
            <div className="col-span-2 text-right font-bold">62.5%</div>
            <div className="col-span-2 text-right font-bold text-crt-bullish">+67.1%</div>
            <div className="col-span-2 text-right font-bold text-crt-bullish">+$6.71 USDT</div>
          </div>
        </div>

        {/* Prize Pool Banner & Action Strip */}
        <div className="win-inset bg-win-base p-1.5 flex items-center justify-between gap-2 flex-shrink-0 text-[10px]">
          <div className="flex items-center space-x-1.5">
            <span className="text-[16px]">🎁</span>
            <div>
              <span className="font-bold text-black">SEASON 1 POOL: </span>
              <span className="font-mono font-bold text-[#008531]">50,000 VIRTUAL USDT</span> +{' '}
              <span className="font-bold text-titlebar-navy">"Golden Windows 98" NFT Trophy</span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => alert('Rankings refreshed from network.')}
              className="win-btn px-2 py-0.5 text-[10px] font-bold"
            >
              Refresh ⟳
            </button>
            <button
              onClick={() => openWindow('flexcard')}
              className="win-btn bg-titlebar-navy text-white px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5"
            >
              <span>Share Flex Card</span>
              <span>↗</span>
            </button>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
};
