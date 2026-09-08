import React, { useState } from 'react';
import { WindowFrame } from '@/components/desktop/WindowFrame';
import { PixelIcon } from '@/components/common/PixelIcon';
import confetti from 'canvas-confetti';

export const DegenVaultWindow: React.FC = () => {
  const [day2Claimed, setDay2Claimed] = useState(false);
  const [equity, setEquity] = useState(16.71);
  const [availMargin, setAvailMargin] = useState(7.50);

  const handleClaim = () => {
    if (day2Claimed) return;
    setDay2Claimed(true);
    setEquity((prev) => prev + 5.0);
    setAvailMargin((prev) => prev + 5.0);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleFaucet = () => {
    setEquity((prev) => prev + 10.0);
    setAvailMargin((prev) => prev + 10.0);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  return (
    <WindowFrame
      id="degenvault"
      menuItems={['File', 'Account', 'Rewards', 'Security', 'Help']}
      statusContent={
        <>
          <div className="flex items-center space-x-2">
            <span className="text-crt-bullish font-bold">● VAULT STATUS: SYNCED</span>
            <span>|</span>
            <span>BLOCK: #849,201</span>
          </div>
          <div className="font-mono text-black">DEGEN-NET ENCRYPTED (SSL v3.0)</div>
        </>
      }
    >
      <div className="flex flex-col gap-2 p-1 text-black font-ui overflow-y-auto">
        {/* =================================================================== */}
        {/* SECTION 1: TRADER PROFILE                                           */}
        {/* =================================================================== */}
        <div className="win-outset bg-surface-high p-2 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            {/* Retro Pixel Avatar */}
            <div className="w-12 h-12 win-inset-deep p-0.5 flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-[#1e293b] flex flex-col items-center justify-center">
                <span className="text-[26px]">😎</span>
              </div>
            </div>

            {/* Profile Data */}
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-headline text-[15px] font-bold text-black tracking-tight">
                  SatoshiDegen_98
                </span>
                <span className="bg-titlebar-navy text-white text-[9px] font-bold px-1.5 py-0.2 win-outset">
                  ONLINE
                </span>
              </div>
              <div className="flex items-center space-x-2 font-mono text-[10px] text-bevel-shadow">
                <span>Node: <strong className="text-black">#NODE-7729</strong></span>
                <span>•</span>
                <span>Build: <strong className="text-black">v4.10.1998</strong></span>
              </div>
            </div>
          </div>

          {/* Rank Badge & XP Track */}
          <div className="flex flex-col items-end min-w-[200px]">
            <div className="flex items-center space-x-1.5 mb-0.5">
              <span className="text-[10px] text-bevel-shadow font-bold">RANK:</span>
              <span className="bg-crt-amber text-black px-1.5 py-0.5 font-bold text-[10px] win-outset uppercase">
                Novice Liquidator
              </span>
            </div>
            <div className="w-full text-right font-mono text-[9px] text-bevel-shadow mb-0.5">
              XP: 3,450 / 5,000 → <span className="text-titlebar-navy font-bold">Degenerate Trader</span>
            </div>
            {/* Progress Track */}
            <div className="w-full h-3 win-inset bg-white p-0.5 flex">
              <div className="h-full bg-titlebar-navy" style={{ width: '69%' }}></div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* SECTION 2: VIRTUAL FINANCIAL LEDGER (INSET)                         */}
        {/* =================================================================== */}
        <div className="win-inset-deep p-2.5 text-white flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-[#333] pb-1">
            <div className="flex items-center space-x-1.5 text-crt-bullish">
              <PixelIcon name="wallet" size={14} />
              <span className="font-headline font-bold text-[12px] uppercase tracking-wider">
                Virtual Financial Ledger
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#888]">[PORTFOLIO_ID: DEGEN_0x98]</span>
          </div>

          {/* Top 3 Metrics Cards */}
          <div className="grid grid-cols-3 gap-2 py-0.5">
            <div className="win-inset bg-[#181818] p-1.5 border border-[#262626]">
              <span className="block font-mono text-[9px] text-[#888]">TOTAL EQUITY</span>
              <span className="font-mono text-[18px] font-bold text-crt-bullish">
                ${equity.toFixed(2)}
              </span>
              <span className="block font-mono text-[8px] text-crt-bullish">USDT Reserve</span>
            </div>

            <div className="win-inset bg-[#181818] p-1.5 border border-[#262626]">
              <span className="block font-mono text-[9px] text-[#888]">AVAILABLE MARGIN</span>
              <span className="font-mono text-[18px] font-bold text-white">
                ${availMargin.toFixed(2)}
              </span>
              <span className="block font-mono text-[8px] text-[#888]">Free for orders</span>
            </div>

            <div className="win-inset bg-[#181818] p-1.5 border border-[#262626]">
              <span className="block font-mono text-[9px] text-[#888]">LOCKED MARGIN</span>
              <span className="font-mono text-[18px] font-bold text-crt-amber">
                $2.50
              </span>
              <span className="block font-mono text-[8px] text-crt-amber">BTC Perp 20x</span>
            </div>
          </div>

          {/* Performance Breakdown Row */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#333] font-mono text-[10px]">
            <div className="flex justify-between items-center bg-[#181818] px-2 py-1 border border-[#262626]">
              <span className="text-[#888]">All-Time ROI:</span>
              <span className="text-crt-bullish font-bold">+67.1% ▲</span>
            </div>
            <div className="flex justify-between items-center bg-[#181818] px-2 py-1 border border-[#262626]">
              <span className="text-[#888]">Win Rate:</span>
              <span className="text-[#76D6D5] font-bold">62.5% (5/8)</span>
            </div>
            <div className="flex justify-between items-center bg-[#181818] px-2 py-1 border border-[#262626]">
              <span className="text-[#888]">Total Trades:</span>
              <span className="text-white font-bold">8 Executed</span>
            </div>
          </div>

          {/* Quick Actions Strip */}
          <div className="flex items-center justify-between pt-1 border-t border-[#262626]">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleFaucet}
                className="win-btn text-black text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5"
              >
                <span>💧</span>
                <span>Virtual Faucet (+10 USDT)</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Reset wallet to default 10.00 USDT?')) {
                    setEquity(10.0);
                    setAvailMargin(10.0);
                    setDay2Claimed(false);
                  }
                }}
                className="win-btn text-error text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5"
              >
                <span>🔄</span>
                <span>Reset Wallet</span>
              </button>
            </div>
            <span className="font-mono text-[8px] text-[#888]">SIMULATED FUNDS • ZERO REAL RISK</span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* SECTION 3: 7-DAY TIERED DAILY REWARD STREAK                         */}
        {/* =================================================================== */}
        <div className="win-outset bg-win-base p-2 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 font-bold text-[11px]">
              <PixelIcon name="gift" size={14} className="text-titlebar-navy" />
              <span className="uppercase tracking-wide">7-Day Daily Login Reward Streak</span>
            </div>
            <span className="bg-titlebar-navy text-white text-[9px] font-bold px-1.5 py-0.5 win-outset">
              STREAK: {day2Claimed ? '2 DAYS' : '1 DAY'}
            </span>
          </div>

          {/* 7-Day Slot Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day 1: Claimed */}
            <div className="win-inset bg-surface-high p-1 flex flex-col items-center text-center opacity-85">
              <span className="font-mono text-[8px] text-bevel-shadow">DAY 1</span>
              <PixelIcon name="check" size={16} className="text-crt-bullish my-0.5" />
              <span className="font-mono font-bold text-[9px] text-[#006622]">+2 USDT</span>
              <span className="font-mono text-[7px] text-[#006622] font-bold">Claimed ✓</span>
            </div>

            {/* Day 2: Active or Claimed */}
            <div
              className={`p-1 flex flex-col items-center text-center relative ${
                day2Claimed
                  ? 'win-inset bg-surface-high opacity-85'
                  : 'win-outset bg-[#FFFDE6] border-2 border-crt-amber shadow-md animate-pulse'
              }`}
            >
              <span className="font-mono text-[8px] text-titlebar-navy font-bold">DAY 2</span>
              <PixelIcon
                name={day2Claimed ? 'check' : 'gift'}
                size={16}
                className={day2Claimed ? 'text-crt-bullish my-0.5' : 'text-crt-amber my-0.5'}
              />
              <span className="font-mono font-bold text-[10px] text-black">+5 USDT</span>
              <span
                className={`font-mono text-[7px] font-bold px-1 ${
                  day2Claimed ? 'text-[#006622]' : 'bg-crt-amber text-black'
                }`}
              >
                {day2Claimed ? 'Claimed ✓' : 'READY!'}
              </span>
            </div>

            {/* Day 3: Locked */}
            <div className="win-inset bg-surface-high p-1 flex flex-col items-center text-center text-bevel-shadow">
              <span className="font-mono text-[8px]">DAY 3</span>
              <PixelIcon name="lock" size={16} className="text-bevel-shadow my-0.5" />
              <span className="font-mono font-bold text-[9px]">+8 USDT</span>
              <span className="font-mono text-[7px]">Locked</span>
            </div>

            {/* Day 4: Locked */}
            <div className="win-inset bg-surface-high p-1 flex flex-col items-center text-center text-bevel-shadow">
              <span className="font-mono text-[8px]">DAY 4</span>
              <PixelIcon name="lock" size={16} className="text-bevel-shadow my-0.5" />
              <span className="font-mono font-bold text-[9px]">+10 USDT</span>
              <span className="font-mono text-[7px]">Locked</span>
            </div>

            {/* Day 5: Locked */}
            <div className="win-inset bg-surface-high p-1 flex flex-col items-center text-center text-bevel-shadow">
              <span className="font-mono text-[8px]">DAY 5</span>
              <PixelIcon name="lock" size={16} className="text-bevel-shadow my-0.5" />
              <span className="font-mono font-bold text-[9px]">+15 USDT</span>
              <span className="font-mono text-[7px]">Locked</span>
            </div>

            {/* Day 6: Locked */}
            <div className="win-inset bg-surface-high p-1 flex flex-col items-center text-center text-bevel-shadow">
              <span className="font-mono text-[8px]">DAY 6</span>
              <PixelIcon name="lock" size={16} className="text-bevel-shadow my-0.5" />
              <span className="font-mono font-bold text-[9px]">+25 USDT</span>
              <span className="font-mono text-[7px]">Locked</span>
            </div>

            {/* Day 7: Locked + Mystery Box */}
            <div className="win-inset bg-surface-high p-1 flex flex-col items-center text-center text-bevel-shadow">
              <span className="font-mono text-[8px] text-titlebar-navy font-bold">DAY 7</span>
              <PixelIcon name="gift" size={16} className="text-titlebar-navy my-0.5" />
              <span className="font-mono font-bold text-[8px] text-black">+50 USDT</span>
              <span className="font-mono text-[7px] text-titlebar-navy font-bold">+MYSTERY</span>
            </div>
          </div>

          {/* Prominent Claim Button */}
          <div className="pt-1">
            <button
              onClick={handleClaim}
              disabled={day2Claimed}
              className={`w-full py-2 px-3 flex items-center justify-center space-x-2 ${
                day2Claimed
                  ? 'win-inset bg-win-base text-bevel-shadow cursor-not-allowed'
                  : 'win-btn bg-[#008531] hover:bg-[#009938] text-white active:translate-x-0.5 active:translate-y-0.5 shadow-md'
              }`}
            >
              <div className="border border-dotted border-white w-full py-0.5 flex items-center justify-center space-x-2">
                <PixelIcon name="sparkles" size={14} className="text-crt-bullish animate-bounce" />
                <span className="font-headline font-bold text-[12px] uppercase tracking-wider">
                  {day2Claimed
                    ? 'TODAY’S REWARD CLAIMED (NEXT UNLOCK IN 23:45)'
                    : '[ CLAIM DAILY REWARD: +5.00 USDT ]'}
                </span>
                <PixelIcon name="sparkles" size={14} className="text-crt-bullish animate-bounce" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
};
