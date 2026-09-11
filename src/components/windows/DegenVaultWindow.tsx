import React, { useState, useEffect } from 'react';
import { WindowFrame } from '@/components/desktop/WindowFrame';
import { PixelIcon } from '@/components/common/PixelIcon';
import { useWalletStore, DAILY_REWARD_TIERS } from '@/stores/useWalletStore';
import confetti from 'canvas-confetti';
import { soundFXService } from '@/services/SoundFXService';

function getRankAndXp(totalTrades: number, realizedPnl: number, winRate: number) {
  const xp = totalTrades * 120 + Math.max(0, Math.floor(realizedPnl * 10)) + Math.floor(winRate * 5);

  if (xp >= 5000 || totalTrades >= 25) {
    return {
      rank: 'Legendary Whale',
      currentXp: Math.min(10000, xp),
      targetXp: 10000,
      progressPct: Math.min(100, Math.round((xp / 10000) * 100)),
      nextRank: 'MAX RANK (APEX WHALE)',
      badgeClass: 'bg-[#FFD700] text-black win-outset font-black',
    };
  } else if (xp >= 2500 || totalTrades >= 12) {
    return {
      rank: 'Veteran Scalper',
      currentXp: xp,
      targetXp: 5000,
      progressPct: Math.min(100, Math.max(10, Math.round(((xp - 2500) / 2500) * 100))),
      nextRank: 'Legendary Whale',
      badgeClass: 'bg-[#9370DB] text-white win-outset font-bold',
    };
  } else if (xp >= 1000 || totalTrades >= 4) {
    return {
      rank: 'Degenerate Trader',
      currentXp: xp,
      targetXp: 2500,
      progressPct: Math.min(100, Math.max(10, Math.round(((xp - 1000) / 1500) * 100))),
      nextRank: 'Veteran Scalper',
      badgeClass: 'bg-titlebar-navy text-white win-outset font-bold',
    };
  } else {
    return {
      rank: 'Novice Liquidator',
      currentXp: xp,
      targetXp: 1000,
      progressPct: Math.min(100, Math.max(8, Math.round((xp / 1000) * 100))),
      nextRank: 'Degenerate Trader',
      badgeClass: 'bg-crt-amber text-black win-outset font-bold',
    };
  }
}

function formatCountdown(ms: number): string {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const DegenVaultWindow: React.FC = () => {
  const equity = useWalletStore((state) => state.equity);
  const availMargin = useWalletStore((state) => state.availableMargin);
  const lockedMargin = useWalletStore((state) => state.lockedMargin);
  const winCount = useWalletStore((state) => state.winCount);
  const totalTrades = useWalletStore((state) => state.totalTrades);
  const realizedPnl = useWalletStore((state) => state.realizedPnl);
  const winRate = useWalletStore((state) => state.getWinRate());
  const allTimeRoi = useWalletStore((state) => state.getAllTimeRoi());
  const isFaucetAvailable = useWalletStore((state) => state.isFaucetAvailable());
  const claimFaucet = useWalletStore((state) => state.claimFaucet);
  const resetWallet = useWalletStore((state) => state.resetWallet);
  const currentStreakDay = useWalletStore((state) => state.currentStreakDay || 1);
  const claimDailyReward = useWalletStore((state) => state.claimDailyReward);
  const getTimeUntilNextDailyClaim = useWalletStore((state) => state.getTimeUntilNextDailyClaim);

  const [remainingMs, setRemainingMs] = useState<number>(0);
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      setRemainingMs(getTimeUntilNextDailyClaim());
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [getTimeUntilNextDailyClaim]);

  const profileRank = getRankAndXp(totalTrades, realizedPnl, winRate);
  const activeDayTier = DAILY_REWARD_TIERS[currentStreakDay - 1] || DAILY_REWARD_TIERS[0];
  const canClaim = remainingMs === 0;

  const handleClaim = () => {
    if (!canClaim) return;
    const res = claimDailyReward();
    if (res.success) {
      soundFXService.playClaimReward();
      setClaimFeedback(`Claimed +${res.amount?.toFixed(2)} USDT!`);
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });
      setTimeout(() => setClaimFeedback(null), 3000);
    } else if (res.error) {
      setClaimFeedback(res.error);
      setTimeout(() => setClaimFeedback(null), 3000);
    }
  };

  const handleFaucet = () => {
    if (!isFaucetAvailable) return;
    claimFaucet(10.0);
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
        {/* SECTION 1: TRADER PROFILE & AVATAR RANK                             */}
        {/* =================================================================== */}
        <div className="win-outset bg-surface-high p-2 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            {/* Retro Pixel Avatar */}
            <div className="w-12 h-12 win-inset-deep p-0.5 flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-[#1e293b] flex flex-col items-center justify-center border border-titlebar-navy">
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
              <div className="flex items-center space-x-2 font-mono text-[10px] text-[#333] font-semibold">
                <span>Node: <strong className="text-black">#NODE-7729</strong></span>
                <span>•</span>
                <span>Build: <strong className="text-black">v4.10.1998</strong></span>
              </div>
            </div>
          </div>

          {/* Rank Badge & XP Track */}
          <div className="flex flex-col items-end min-w-[210px]">
            <div className="flex items-center space-x-1.5 mb-0.5">
              <span className="text-[10px] text-black font-bold">RANK:</span>
              <span className={`px-1.5 py-0.5 text-[10px] uppercase ${profileRank.badgeClass}`}>
                {profileRank.rank}
              </span>
            </div>
            <div className="w-full text-right font-mono text-[9px] text-[#222] font-semibold mb-0.5">
              XP: {profileRank.currentXp} / {profileRank.targetXp} →{' '}
              <span className="text-titlebar-navy font-bold">{profileRank.nextRank}</span>
            </div>
            {/* Progress Track */}
            <div className="w-full h-3 win-inset bg-white p-0.5 flex">
              <div
                className="h-full bg-titlebar-navy transition-all duration-300"
                style={{ width: `${profileRank.progressPct}%` }}
              ></div>
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
            <div className="win-inset-deep bg-[#181818] p-2 border border-[#333]">
              <span className="block font-mono text-[10px] font-semibold text-[#D0D0D0]">TOTAL NET WORTH / EQUITY</span>
              <span className="font-mono text-[18px] font-bold text-crt-bullish">
                ${equity.toFixed(2)}
              </span>
              <span className="block font-mono text-[9px] text-crt-bullish font-semibold">USDT Reserve</span>
            </div>

            <div className="win-inset-deep bg-[#181818] p-2 border border-[#333]">
              <span className="block font-mono text-[10px] font-semibold text-[#D0D0D0]">AVAILABLE MARGIN</span>
              <span className="font-mono text-[18px] font-bold text-white">
                ${availMargin.toFixed(2)}
              </span>
              <span className="block font-mono text-[9px] text-[#D0D0D0]">Free for orders</span>
            </div>

            <div className="win-inset-deep bg-[#181818] p-2 border border-[#333]">
              <span className="block font-mono text-[10px] font-semibold text-[#D0D0D0]">LOCKED MARGIN</span>
              <span className="font-mono text-[18px] font-bold text-crt-amber">
                ${lockedMargin.toFixed(2)}
              </span>
              <span className="block font-mono text-[9px] text-crt-amber font-semibold">Active Positions</span>
            </div>
          </div>

          {/* Performance Breakdown Row */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#333] font-mono text-[10px]">
            <div className="flex justify-between items-center bg-[#181818] px-2 py-1.5 border border-[#262626]">
              <span className="text-[#D0D0D0] font-semibold">All-Time ROI:</span>
              <span className={`font-bold ${allTimeRoi >= 0 ? 'text-crt-bullish' : 'text-crt-bearish'}`}>
                {allTimeRoi >= 0 ? '+' : ''}{allTimeRoi.toFixed(1)}% {allTimeRoi >= 0 ? '▲' : '▼'}
              </span>
            </div>
            <div className="flex justify-between items-center bg-[#181818] px-2 py-1.5 border border-[#262626]">
              <span className="text-[#D0D0D0] font-semibold">Win Rate:</span>
              <span className="text-[#76D6D5] font-bold">{winRate.toFixed(1)}% ({winCount}/{totalTrades})</span>
            </div>
            <div className="flex justify-between items-center bg-[#181818] px-2 py-1.5 border border-[#262626]">
              <span className="text-[#D0D0D0] font-semibold">Total Trades:</span>
              <span className="text-white font-bold">{totalTrades} Executed</span>
            </div>
          </div>

          {/* Quick Actions Strip */}
          <div className="flex items-center justify-between pt-1 border-t border-[#262626]">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleFaucet}
                disabled={!isFaucetAvailable}
                title={isFaucetAvailable ? 'Emergency Faucet Ready (+10 USDT)' : 'Faucet only unlocks when balance drops below $1.00 USDT'}
                className={`win-btn text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 ${
                  isFaucetAvailable
                    ? 'bg-crt-amber text-black animate-pulse cursor-pointer'
                    : 'text-[#888] cursor-not-allowed opacity-60'
                }`}
              >
                <span>💧</span>
                <span>Virtual Faucet (+10 USDT)</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Reset wallet to default 10.00 USDT?')) {
                    resetWallet(10.0);
                  }
                }}
                className="win-btn text-error text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5"
              >
                <span>🔄</span>
                <span>Reset Wallet</span>
              </button>
            </div>
            <span className="font-mono text-[9px] text-[#C0C0C0]">SIMULATED FUNDS • ZERO REAL RISK</span>
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
              STREAK: DAY {currentStreakDay} / 7
            </span>
          </div>

          {/* 7-Day Slot Grid */}
          <div className="grid grid-cols-7 gap-1">
            {DAILY_REWARD_TIERS.map((tier) => {
              const isClaimed = tier.day < currentStreakDay;
              const isCurrent = tier.day === currentStreakDay;
              const isReady = isCurrent && canClaim;

              if (isClaimed) {
                return (
                  <div key={tier.day} className="win-inset bg-[#E8E8E8] p-1 flex flex-col items-center text-center">
                    <span className="font-mono text-[8px] text-[#333] font-bold">DAY {tier.day}</span>
                    <PixelIcon name="check" size={16} className="text-crt-bullish my-0.5" />
                    <span className="font-mono font-bold text-[9px] text-[#006622]">{tier.label.split(' ')[0]} {tier.label.split(' ')[1]}</span>
                    <span className="font-mono text-[7px] text-[#006622] font-bold">Claimed ✓</span>
                  </div>
                );
              }

              if (isCurrent) {
                return (
                  <div
                    key={tier.day}
                    className={`p-1 flex flex-col items-center text-center relative ${
                      isReady
                        ? 'win-outset bg-[#FFFDE6] border-2 border-[#FFAA00] shadow-[0_0_8px_rgba(255,170,0,0.6)] animate-pulse'
                        : 'win-outset bg-white border border-[#FFAA00]'
                    }`}
                  >
                    <span className="font-mono text-[8px] text-titlebar-navy font-bold">DAY {tier.day}</span>
                    <PixelIcon
                      name="gift"
                      size={16}
                      className={isReady ? 'text-crt-amber my-0.5 animate-bounce' : 'text-titlebar-navy my-0.5'}
                    />
                    <span className="font-mono font-bold text-[10px] text-black">{tier.label.split(' ')[0]} {tier.label.split(' ')[1]}</span>
                    <span
                      className={`font-mono text-[7px] font-bold px-1 ${
                        isReady ? 'bg-crt-amber text-black' : 'bg-surface-low text-black'
                      }`}
                    >
                      {isReady ? 'READY!' : formatCountdown(remainingMs)}
                    </span>
                  </div>
                );
              }

              return (
                <div key={tier.day} className="win-inset bg-[#DFDFDF] p-1 flex flex-col items-center text-center text-[#222]">
                  <span className="font-mono text-[8px] font-bold text-black">DAY {tier.day}</span>
                  <PixelIcon name="lock" size={16} className="text-[#333] my-0.5" />
                  <span className="font-mono font-bold text-[9px] text-black">{tier.label.split(' ')[0]} {tier.label.split(' ')[1]}</span>
                  <span className="font-mono text-[7px] text-[#444] font-bold">
                    {tier.day === 7 ? '+MYSTERY' : 'Locked'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Feedback banner */}
          {claimFeedback && (
            <div className="bg-[#E6FFE6] border border-[#008531] text-[#006622] text-[10px] font-bold px-2 py-1 text-center font-mono">
              ✓ {claimFeedback}
            </div>
          )}

          {/* Prominent Claim Button */}
          <div className="pt-1">
            <button
              onClick={handleClaim}
              disabled={!canClaim}
              className={`w-full py-2 px-3 flex items-center justify-center space-x-2 ${
                !canClaim
                  ? 'win-inset bg-win-base text-[#555] font-bold cursor-not-allowed'
                  : 'win-btn bg-[#008531] hover:bg-[#009938] text-white active:translate-x-0.5 active:translate-y-0.5 shadow-md font-bold'
              }`}
            >
              <div className={`w-full py-1 flex items-center justify-center space-x-2 ${
                canClaim ? 'border border-dotted border-white text-white' : 'border border-dotted border-[#888] text-[#555]'
              }`}>
                <PixelIcon name="sparkles" size={14} className={canClaim ? 'text-crt-bullish animate-bounce' : 'text-[#777]'} />
                <span className="font-headline font-bold text-[12px] uppercase tracking-wider">
                  {canClaim
                    ? `[ CLAIM DAY ${currentStreakDay} REWARD: +${activeDayTier.reward.toFixed(2)} USDT ]`
                    : `TODAY'S REWARD CLAIMED (NEXT UNLOCK IN ${formatCountdown(remainingMs)})`}
                </span>
                <PixelIcon name="sparkles" size={14} className={canClaim ? 'text-crt-bullish animate-bounce' : 'text-[#777]'} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
};
