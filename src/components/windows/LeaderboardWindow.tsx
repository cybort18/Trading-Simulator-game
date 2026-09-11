import React, { useState, useMemo } from 'react';
import { WindowFrame } from '@/components/desktop/WindowFrame';
import { useWindowStore } from '@/stores/useWindowStore';
import { useWalletStore } from '@/stores/useWalletStore';

interface Competitor {
  rankNum: number;
  name: string;
  tier: string;
  winRateNum: number;
  roiNum: number;
  pnlNum: number;
  avatar: string;
  badge: string;
}

const CATEGORY_DATA: Record<'roi' | 'gainers' | 'weekly' | 'shame', Competitor[]> = {
  roi: [
    { rankNum: 1, name: 'ChadWhale_69', tier: 'Whale Apex', winRateNum: 84.2, roiNum: 1420.5, pnlNum: 42850.0, avatar: '👑', badge: 'Whale' },
    { rankNum: 2, name: 'GigaTrader_X', tier: 'Liquidator Slayer', winRateNum: 78.0, roiNum: 890.2, pnlNum: 18420.0, avatar: '🥈', badge: 'Slayer' },
    { rankNum: 3, name: 'MoonOrDust', tier: 'Degen Master', winRateNum: 71.4, roiNum: 654.8, pnlNum: 11200.0, avatar: '🥉', badge: 'Degen' },
    { rankNum: 4, name: 'BitLiquidator99', tier: 'Veteran Scalper', winRateNum: 69.2, roiNum: 512.4, pnlNum: 9450.2, avatar: '🎯', badge: 'Scalper' },
    { rankNum: 5, name: '0xNakamotoGhost', tier: 'Algo Trader', winRateNum: 65.8, roiNum: 389.0, pnlNum: 6110.0, avatar: '🤖', badge: 'Algo' },
    { rankNum: 6, name: 'PerpYOLO_King', tier: 'High Roller', winRateNum: 61.0, roiNum: 304.5, pnlNum: 4820.5, avatar: '🎲', badge: 'Roller' },
    { rankNum: 7, name: 'SatoshiSmiles', tier: 'Whale Hunter', winRateNum: 59.5, roiNum: 275.2, pnlNum: 3950.0, avatar: '⚡', badge: 'Hunter' },
  ],
  gainers: [
    { rankNum: 1, name: 'SolanaSpeedrun', tier: '100x Degenerate', winRateNum: 91.0, roiNum: 842.1, pnlNum: 19500.0, avatar: '🚀', badge: 'Fast' },
    { rankNum: 2, name: 'FlashLiquid', tier: 'High Roller', winRateNum: 83.3, roiNum: 620.0, pnlNum: 14200.0, avatar: '⚡', badge: 'Gainer' },
    { rankNum: 3, name: 'AlphaSniper_98', tier: 'Veteran Scalper', winRateNum: 79.5, roiNum: 480.5, pnlNum: 9850.0, avatar: '🎯', badge: 'Sniper' },
    { rankNum: 4, name: 'GigaChadScalp', tier: 'Algo Trader', winRateNum: 75.0, roiNum: 390.2, pnlNum: 7400.0, avatar: '📈', badge: 'Scalp' },
    { rankNum: 5, name: 'TurboCandle', tier: 'Degen Master', winRateNum: 68.2, roiNum: 295.4, pnlNum: 5120.0, avatar: '🕯', badge: 'Candle' },
  ],
  weekly: [
    { rankNum: 1, name: 'SeasonCupLeader', tier: 'Tournament MVP', winRateNum: 88.0, roiNum: 1105.4, pnlNum: 31000.0, avatar: '🏆', badge: 'MVP' },
    { rankNum: 2, name: 'WhaleCatcher', tier: 'Whale Apex', winRateNum: 81.2, roiNum: 740.2, pnlNum: 16500.0, avatar: '🎣', badge: 'Cup' },
    { rankNum: 3, name: 'DegenSprint', tier: 'Liquidator Slayer', winRateNum: 73.5, roiNum: 530.8, pnlNum: 10400.0, avatar: '🥈', badge: 'Sprint' },
    { rankNum: 4, name: 'BullMarketRide', tier: 'Veteran Scalper', winRateNum: 66.7, roiNum: 360.5, pnlNum: 6800.0, avatar: '🐂', badge: 'Rider' },
  ],
  shame: [
    { rankNum: 1, name: 'RektGoblin_420', tier: '100x Liquidated', winRateNum: 8.5, roiNum: -98.9, pnlNum: -24500.0, avatar: '☠', badge: 'Rekt' },
    { rankNum: 2, name: 'DownBadCapital', tier: 'Margin Call Victim', winRateNum: 12.0, roiNum: -94.2, pnlNum: -18200.0, avatar: '📉', badge: 'Wiped' },
    { rankNum: 3, name: 'BuyHighSellLow_Bro', tier: 'Novice Liquidator', winRateNum: 15.4, roiNum: -88.5, pnlNum: -12800.0, avatar: '🤡', badge: 'Exit Liq' },
    { rankNum: 4, name: 'LeverageFiend', tier: 'Cross Margin RIP', winRateNum: 18.2, roiNum: -79.0, pnlNum: -8900.0, avatar: '💸', badge: 'Broke' },
    { rankNum: 5, name: 'NoStopLossKing', tier: 'Hopium Addict', winRateNum: 22.0, roiNum: -71.5, pnlNum: -6400.0, avatar: '🪦', badge: 'Grave' },
  ],
};

type SortKey = 'rank' | 'name' | 'tier' | 'winRate' | 'roi' | 'pnl';

export const LeaderboardWindow: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'roi' | 'gainers' | 'weekly' | 'shame'>('roi');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const openWindow = useWindowStore((state) => state.openWindow);
  const focusWindow = useWindowStore((state) => state.focusWindow);

  const winRate = useWalletStore((state) => state.getWinRate());
  const allTimeRoi = useWalletStore((state) => state.getAllTimeRoi());
  const realizedPnl = useWalletStore((state) => state.realizedPnl);
  const totalTrades = useWalletStore((state) => state.totalTrades);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'rank' || key === 'name');
    }
  };

  const sortedData = useMemo(() => {
    const raw = [...CATEGORY_DATA[activeFilter]];
    return raw.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'rank':
          comparison = a.rankNum - b.rankNum;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'tier':
          comparison = a.tier.localeCompare(b.tier);
          break;
        case 'winRate':
          comparison = a.winRateNum - b.winRateNum;
          break;
        case 'roi':
          comparison = a.roiNum - b.roiNum;
          break;
        case 'pnl':
          comparison = a.pnlNum - b.pnlNum;
          break;
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [activeFilter, sortKey, sortAsc]);

  const top1 = CATEGORY_DATA[activeFilter][0] || sortedData[0];
  const top2 = CATEGORY_DATA[activeFilter][1] || sortedData[1];
  const top3 = CATEGORY_DATA[activeFilter][2] || sortedData[2];

  const userRankDisplay = totalTrades === 0 ? '#---' : allTimeRoi > 100 ? '#48' : '#142';
  const userTier = totalTrades === 0 ? 'Novice Unranked' : totalTrades > 15 ? 'Veteran Scalper' : 'Novice Liquidator';

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
            <span>CATEGORY: {activeFilter.toUpperCase()}</span>
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
                activeFilter === 'roi' ? 'win-btn-pressed bg-win-pressed font-extrabold text-titlebar-navy' : 'win-btn bg-win-base'
              }`}
            >
              <span className="text-crt-amber">⚡</span> All-Time ROI
            </button>
            <button
              onClick={() => setActiveFilter('gainers')}
              className={`px-2 py-0.5 text-[10px] font-bold ${
                activeFilter === 'gainers' ? 'win-btn-pressed bg-win-pressed font-extrabold text-titlebar-navy' : 'win-btn bg-win-base'
              }`}
            >
              <span className="text-[#008531]">▲</span> 24H Top Gainers
            </button>
            <button
              onClick={() => setActiveFilter('weekly')}
              className={`px-2 py-0.5 text-[10px] font-bold ${
                activeFilter === 'weekly' ? 'win-btn-pressed bg-win-pressed font-extrabold text-titlebar-navy' : 'win-btn bg-win-base'
              }`}
            >
              <span className="text-titlebar-navy">🏆</span> Weekly PnL Cup
            </button>
            <button
              onClick={() => setActiveFilter('shame')}
              className={`px-2 py-0.5 text-[10px] font-bold ${
                activeFilter === 'shame' ? 'win-btn-pressed bg-win-pressed font-extrabold text-crt-bearish' : 'win-btn bg-win-base'
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
          {top2 && (
            <div className="win-outset bg-surface-high p-1.5 flex items-center space-x-2 border border-[#A0A0A0]">
              <div className="w-9 h-9 win-inset bg-[#E0E0E0] flex flex-col items-center justify-center font-bold text-[11px]">
                <span className="text-[#333] font-bold">#2</span>
                <span className="text-[12px] leading-none">{top2.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[11px] truncate text-black">{top2.name}</span>
                  <span className="win-outset bg-[#D0D0D0] px-1 text-[8px] text-black font-mono font-bold">{top2.badge}</span>
                </div>
                <div className={`font-mono text-[13px] font-bold ${top2.roiNum >= 0 ? 'text-[#008531]' : 'text-crt-bearish'}`}>
                  {top2.roiNum >= 0 ? '+' : ''}{top2.roiNum.toFixed(1)}% ROI
                </div>
                <div className="text-[10px] font-mono text-[#222] font-semibold">
                  PnL: {top2.pnlNum >= 0 ? '+' : ''}${top2.pnlNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}

          {/* #1 Gold */}
          {top1 && (
            <div className="win-outset bg-[#FFF5D6] p-1.5 flex items-center space-x-2 border-2 border-crt-amber shadow-sm">
              <div className="w-10 h-10 win-inset bg-[#FFE8A0] flex flex-col items-center justify-center font-bold text-[12px] border border-crt-amber">
                <span className="text-crt-amber font-extrabold">#1</span>
                <span className="text-[14px] leading-none">{top1.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-[12px] truncate text-black">{top1.name}</span>
                  <span className="win-outset bg-crt-amber text-black px-1.5 text-[8px] font-bold">{top1.badge}</span>
                </div>
                <div className={`font-mono text-[14px] font-bold ${top1.roiNum >= 0 ? 'text-[#008531]' : 'text-crt-bearish'}`}>
                  {top1.roiNum >= 0 ? '+' : ''}{top1.roiNum.toFixed(1)}% ROI
                </div>
                <div className="text-[10px] font-mono text-black font-bold">
                  PnL: {top1.pnlNum >= 0 ? '+' : ''}${top1.pnlNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}

          {/* #3 Bronze */}
          {top3 && (
            <div className="win-outset bg-surface-high p-1.5 flex items-center space-x-2 border border-[#C8A165]">
              <div className="w-9 h-9 win-inset bg-[#EAD8C0] flex flex-col items-center justify-center font-bold text-[11px]">
                <span className="text-[#995522] font-bold">#3</span>
                <span className="text-[12px] leading-none">{top3.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[11px] truncate text-black">{top3.name}</span>
                  <span className="win-outset bg-[#C8A165] px-1 text-[8px] text-black font-mono font-bold">{top3.badge}</span>
                </div>
                <div className={`font-mono text-[13px] font-bold ${top3.roiNum >= 0 ? 'text-[#008531]' : 'text-crt-bearish'}`}>
                  {top3.roiNum >= 0 ? '+' : ''}{top3.roiNum.toFixed(1)}% ROI
                </div>
                <div className="text-[10px] font-mono text-[#222] font-semibold">
                  PnL: {top3.pnlNum >= 0 ? '+' : ''}${top3.pnlNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Grid Table */}
        <div className="flex-1 win-inset-deep bg-white flex flex-col overflow-hidden">
          {/* Sortable Header */}
          <div className="grid grid-cols-12 bg-win-base text-black font-bold text-[10.5px] border-b-2 border-bevel-dark select-none">
            <button
              onClick={() => handleSort('rank')}
              className="col-span-1 win-btn py-1 px-1 text-center font-bold active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-0.5"
            >
              <span>Rank</span>
              {sortKey === 'rank' && <span>{sortAsc ? '▲' : '▼'}</span>}
            </button>
            <button
              onClick={() => handleSort('name')}
              className="col-span-3 win-btn py-1 px-2 text-left font-bold active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-0.5"
            >
              <span>Trader Handle</span>
              {sortKey === 'name' && <span>{sortAsc ? '▲' : '▼'}</span>}
            </button>
            <button
              onClick={() => handleSort('tier')}
              className="col-span-2 win-btn py-1 px-1 text-left font-bold active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-0.5"
            >
              <span>Tier</span>
              {sortKey === 'tier' && <span>{sortAsc ? '▲' : '▼'}</span>}
            </button>
            <button
              onClick={() => handleSort('winRate')}
              className="col-span-2 win-btn py-1 px-1 text-right font-bold active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-end gap-0.5"
            >
              <span>Win Rate</span>
              {sortKey === 'winRate' && <span>{sortAsc ? '▲' : '▼'}</span>}
            </button>
            <button
              onClick={() => handleSort('roi')}
              className="col-span-2 win-btn py-1 px-1 text-right font-bold active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-end gap-0.5"
            >
              <span>7D ROI</span>
              {sortKey === 'roi' && <span>{sortAsc ? '▲' : '▼'}</span>}
            </button>
            <button
              onClick={() => handleSort('pnl')}
              className="col-span-2 win-btn py-1 px-2 text-right font-bold active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-end gap-0.5"
            >
              <span>Net PnL</span>
              {sortKey === 'pnl' && <span>{sortAsc ? '▲' : '▼'}</span>}
            </button>
          </div>

          {/* Body Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E0E0E0] font-mono text-[10px]">
            {sortedData.map((row, index) => (
              <div
                key={row.name}
                className={`grid grid-cols-12 px-1 py-1 items-center hover:bg-[#E8F0FE] transition-colors ${
                  index % 2 === 1 ? 'bg-[#F7F7F7]' : 'bg-white'
                }`}
              >
                <div className="col-span-1 text-center font-bold text-black">
                  #{row.rankNum} {row.avatar}
                </div>
                <div className="col-span-3 font-bold text-black truncate flex items-center gap-1">
                  <span>{row.name}</span>
                </div>
                <div className="col-span-2 text-[10px] text-[#333] font-medium">{row.tier}</div>
                <div className="col-span-2 text-right font-bold text-black">{row.winRateNum.toFixed(1)}%</div>
                <div className={`col-span-2 text-right font-bold ${row.roiNum >= 0 ? 'text-[#008531]' : 'text-crt-bearish'}`}>
                  {row.roiNum >= 0 ? '+' : ''}{row.roiNum.toFixed(1)}%
                </div>
                <div className={`col-span-2 text-right font-bold pr-1 ${row.pnlNum >= 0 ? 'text-[#008531]' : 'text-crt-bearish'}`}>
                  {row.pnlNum >= 0 ? '+' : ''}${row.pnlNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>

          {/* Sticky User Row (YOU) with Real Reactive Data */}
          <div className="grid grid-cols-12 px-2 py-1 items-center bg-titlebar-navy text-white font-mono text-[10px] border-t-2 border-bevel-highlight select-none shadow-md">
            <div className="col-span-1 text-center font-bold text-crt-amber">{userRankDisplay}</div>
            <div className="col-span-3 font-bold flex items-center gap-1">
              <span>SatoshiDegen_98</span>
              <span className="win-outset bg-crt-amber text-black px-1 text-[8px] font-bold">YOU</span>
            </div>
            <div className="col-span-2 text-[10px] text-[#EEE] font-medium">{userTier}</div>
            <div className="col-span-2 text-right font-bold">{winRate.toFixed(1)}%</div>
            <div className={`col-span-2 text-right font-bold ${allTimeRoi >= 0 ? 'text-crt-bullish' : 'text-crt-bearish'}`}>
              {allTimeRoi >= 0 ? '+' : ''}{allTimeRoi.toFixed(1)}%
            </div>
            <div className={`col-span-2 text-right font-bold ${realizedPnl >= 0 ? 'text-crt-bullish' : 'text-crt-bearish'}`}>
              {realizedPnl >= 0 ? '+' : ''}${realizedPnl.toFixed(2)} USDT
            </div>
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
              onClick={() => {
                openWindow('flexcard');
                focusWindow('flexcard');
              }}
              className="win-btn bg-titlebar-navy text-white px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 shadow"
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
