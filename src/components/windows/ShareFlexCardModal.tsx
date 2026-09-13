import React, { useState, useRef } from 'react';
import { WindowFrame, WindowMenuCategory } from '@/components/desktop/WindowFrame';
import { useTradingStore } from '@/stores/useTradingStore';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { useWindowStore } from '@/stores/useWindowStore';
import { toPng, toBlob } from 'html-to-image';
import confetti from 'canvas-confetti';
import { soundFXService } from '@/services/SoundFXService';
import { Web3AuthService } from '@/services/Web3AuthService';

export const ShareFlexCardModal: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cardMode, setCardMode] = useState<'trade' | 'account'>('trade');
  const [themeOverride, setThemeOverride] = useState<'auto' | 'green' | 'red' | 'gold'>('auto');

  const username = useAuthStore((state) => state.username);
  const isConnected = useAuthStore((state) => state.isConnected);
  const walletAddress = useAuthStore((state) => state.walletAddress);
  const closeWindow = useWindowStore((state) => state.closeWindow);

  const selectedFlexTrade = useTradingStore((state) => state.selectedFlexTrade);
  const positions = useTradingStore((state) => state.positions);
  const tradeHistory = useTradingStore((state) => state.tradeHistory);
  const prices = useMarketDataStore((state) => state.prices);

  const allTimeRoi = useWalletStore((state) => state.getAllTimeRoi());
  const realizedPnl = useWalletStore((state) => state.realizedPnl);
  const winRate = useWalletStore((state) => state.getWinRate());

  // Derive active trade metrics from store or fallback
  const trade = selectedFlexTrade || positions[0] || tradeHistory[0] || null;

  const pair = trade ? trade.pair : 'BTCUSDT';
  const pairLabel = pair.replace('USDT', '/USDT');
  const direction = trade ? trade.direction : 'LONG';
  const leverage = trade ? trade.leverage : 20;

  let entryPrice = 60000.0;
  let markPrice = 64281.5;
  let roi = 67.1;
  let pnl = 6.71;

  if (cardMode === 'trade') {
    if (trade) {
      entryPrice = trade.entryPrice;
      if ('unrealizedPnl' in trade) {
        // Active Position
        markPrice = prices[trade.pair] || trade.markPrice;
        roi = trade.roe;
        pnl = trade.unrealizedPnl;
      } else {
        // Closed Trade
        markPrice = trade.exitPrice;
        roi = trade.roe;
        pnl = trade.realizedPnl;
      }
    }
  } else {
    // Overall Account Mode
    roi = allTimeRoi;
    pnl = realizedPnl;
  }

  const isProfitable = roi >= 0;

  // Compute active theme: auto follows PnL (green if >= 0, red if < 0)
  const activeTheme =
    themeOverride === 'auto'
      ? isProfitable
        ? 'green'
        : 'red'
      : themeOverride;

  const themeStyles = {
    green: {
      cardBg: 'bg-[#06120A]',
      borderColor: 'border-[#008531]',
      glowColor: 'text-[#00FF66]',
      accentColor: 'text-[#4ade80]',
      badgeBg: 'bg-[#008531] text-white',
      cardTag: 'PROFIT SECURED 🚀',
      innerBg: 'bg-[#0A1A10]',
      gridBorder: 'border-[#143320]',
    },
    red: {
      cardBg: 'bg-[#140606]',
      borderColor: 'border-[#AA1111]',
      glowColor: 'text-[#FF4444]',
      accentColor: 'text-[#f87171]',
      badgeBg: 'bg-[#990000] text-white',
      cardTag: 'REKT IN ACTION ☠',
      innerBg: 'bg-[#1C0A0A]',
      gridBorder: 'border-[#381414]',
    },
    gold: {
      cardBg: 'bg-[#141206]',
      borderColor: 'border-[#B8860B]',
      glowColor: 'text-[#FFD700]',
      accentColor: 'text-[#fde047]',
      badgeBg: 'bg-[#B8860B] text-black font-black',
      cardTag: 'APEX WHALE 👑',
      innerBg: 'bg-[#1E1908]',
      gridBorder: 'border-[#3D3310]',
    },
  }[activeTheme];

  const handleCopy = async () => {
    soundFXService.playKeyClick();
    setCopying(true);
    let success = false;

    if (cardRef.current) {
      try {
        const blob = await toBlob(cardRef.current, { cacheBust: true, pixelRatio: 2 });
        if (blob && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          const clipboardItem = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([clipboardItem]);
          success = true;
        }
      } catch (err) {
        console.warn('Image clipboard write failed, falling back to text:', err);
      }
    }

    if (!success) {
      const text = `🚀 CryptoOS 98 Futures PnL\nTrader: ${username}\nROI: ${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%\nNet PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} USDT\nVerified on CryptoOS 98 Futures Simulator #CryptoOS98`;
      await navigator.clipboard.writeText(text);
    }

    setCopying(false);
    setCopied(true);
    confetti({ particleCount: 60, spread: 65, origin: { y: 0.7 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSavePng = async () => {
    soundFXService.playKeyClick();
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `CryptoOS98_${cardMode === 'trade' ? pair : 'Account'}_${roi >= 0 ? 'WIN' : 'LOSS'}.png`;
      link.href = dataUrl;
      link.click();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (err) {
      console.error('Failed to export PNG:', err);
      alert('Could not export PNG image.');
    } finally {
      setSaving(false);
    }
  };

  const handleShareX = () => {
    soundFXService.playKeyClick();
    const text = encodeURIComponent(
      `🚀 Just locked in ${roi >= 0 ? '+' : ''}${roi.toFixed(1)}% ROI on ${pairLabel} (${direction} ${leverage}x) on CryptoOS 98!\n\n` +
      `💻 90s Retro Crypto Futures Simulator\n` +
      `🔥 Trade live Binance perps with 0 real money risk: #CryptoOS98 #BinanceFutures #DegenTrading`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const flexCardMenus: WindowMenuCategory[] = [
    {
      name: 'File',
      items: [
        {
          label: 'Close FlexCard',
          shortcut: 'Alt+F4',
          onClick: () => closeWindow('flexcard'),
        },
      ],
    },
    {
      name: 'Mode',
      items: [
        {
          label: 'Active Trade / Position Mode',
          onClick: () => setCardMode('trade'),
        },
        {
          label: 'Overall Account PnL Mode',
          onClick: () => setCardMode('account'),
        },
      ],
    },
    {
      name: 'Themes',
      items: [
        { label: 'Auto PnL Color (Recommended)', onClick: () => setThemeOverride('auto') },
        { label: 'Force Green (Bullish)', onClick: () => setThemeOverride('green') },
        { label: 'Force Red (Bearish / Loss)', onClick: () => setThemeOverride('red') },
        { label: 'Force Gold (Whale Apex)', onClick: () => setThemeOverride('gold') },
      ],
    },
    {
      name: 'Export',
      items: [
        { label: 'Copy Image to Clipboard', onClick: handleCopy },
        { label: 'Download PNG Image', onClick: handleSavePng },
        { divider: true, label: '' },
        { label: 'Share to Twitter / X', onClick: handleShareX },
      ],
    },
    {
      name: 'Help',
      items: [
        {
          label: 'About Flex Card',
          onClick: () => {
            alert('ShareFlexCard.exe v1.0\nExchange-Style PnL Brag Card Generator\nCryptoOS 98');
          },
        },
      ],
    },
  ];

  return (
    <WindowFrame
      id="flexcard"
      menus={flexCardMenus}
      statusContent={
        <>
          <div className="flex items-center space-x-2">
            <span className="text-crt-bullish font-bold">● RENDERER: 2D CANVAS ACCELERATED</span>
            <span>|</span>
            <span>FORMAT: EXCHANGE PNL</span>
          </div>
          <span className="font-bold text-titlebar-navy">READY TO EXPORT</span>
        </>
      }
    >
      <div className="p-2 flex flex-col gap-2 font-ui text-black overflow-y-auto">
        {/* Mode Selector & Status Header */}
        <div className="win-inset bg-surface-low px-2 py-1.5 flex items-center justify-between gap-2 flex-wrap text-[10.5px]">
          <div className="flex items-center space-x-1 font-bold">
            <span>Display:</span>
            <button
              onClick={() => setCardMode('trade')}
              className={`px-2 py-0.5 text-[9.5px] font-bold cursor-pointer ${
                cardMode === 'trade'
                  ? 'win-btn-pressed bg-win-pressed text-titlebar-navy font-black'
                  : 'win-btn bg-win-base text-black'
              }`}
            >
              Selected Trade
            </button>
            <button
              onClick={() => setCardMode('account')}
              className={`px-2 py-0.5 text-[9.5px] font-bold cursor-pointer ${
                cardMode === 'account'
                  ? 'win-btn-pressed bg-win-pressed text-titlebar-navy font-black'
                  : 'win-btn bg-win-base text-black'
              }`}
            >
              Account Performance
            </button>
          </div>

          <div className="flex items-center space-x-1.5 font-mono text-[9px] text-[#444]">
            <span>Theme:</span>
            <span className="win-inset bg-white px-1.5 py-0.2 font-bold uppercase text-black">
              {themeOverride === 'auto' ? `Auto (${activeTheme.toUpperCase()})` : activeTheme.toUpperCase()}
            </span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* CLEAN, ICONIC EXCHANGE-STYLE PNL SHARE CARD (CAPTURE TARGET)         */}
        {/* =================================================================== */}
        <div className="flex justify-center p-1">
          <div
            ref={cardRef}
            className={`w-[460px] max-w-full ${themeStyles.cardBg} border-2 ${themeStyles.borderColor} shadow-2xl p-4 flex flex-col gap-3 font-ui text-white select-none relative overflow-hidden`}
          >
            {/* Subtle retro diagonal scanline background overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none opacity-50"></div>

            {/* Top Bar: Exchange Logo & Badge */}
            <div className="flex items-center justify-between border-b border-white/15 pb-2 relative z-10">
              <div className="flex items-center space-x-2">
                <span className="text-[18px]">⚡</span>
                <div>
                  <strong className="block font-headline text-[13px] tracking-wider text-white">
                    CryptoOS 98 Futures
                  </strong>
                  <span className="font-mono text-[8.5px] text-white/60 tracking-tight">
                    DECENTRALIZED PAPER TRADING TERMINAL
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className={`px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase win-outset ${themeStyles.badgeBg}`}>
                  {themeStyles.cardTag}
                </span>
              </div>
            </div>

            {/* Contract & Direction Pill */}
            <div className="flex items-center justify-between relative z-10 pt-0.5">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-black text-[15px] text-white tracking-wide">
                  {cardMode === 'trade' ? `${pairLabel} Perpetual` : 'All-Time Portfolio Performance'}
                </span>
                {cardMode === 'trade' && (
                  <span
                    className={`px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase ${
                      direction === 'LONG'
                        ? 'bg-[#008531] text-white'
                        : 'bg-[#990000] text-white'
                    }`}
                  >
                    {direction} {leverage}X
                  </span>
                )}
              </div>

              <span className="font-mono text-[9px] text-white/50">
                {cardMode === 'trade' ? 'ISOLATED MARGIN' : `WIN RATE: ${winRate.toFixed(1)}%`}
              </span>
            </div>

            {/* HERO METRIC: GIANT ROI READOUT */}
            <div className={`p-3 ${themeStyles.innerBg} border ${themeStyles.gridBorder} flex flex-col justify-center relative z-10`}>
              <div className="flex justify-between items-baseline mb-0.5">
                <span className="font-mono text-[10px] text-white/70 font-semibold tracking-wider uppercase">
                  {cardMode === 'trade' ? 'Rate of Return (ROI)' : 'Overall Account ROI'}
                </span>
                <span className="font-mono text-[9.5px] text-white/50">
                  {isProfitable ? 'NET PROFIT' : 'NET DEFICIT'}
                </span>
              </div>

              <div className={`font-mono text-[42px] font-black leading-none tracking-tight ${themeStyles.glowColor}`}>
                {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
              </div>
            </div>

            {/* Sub-Metrics Row: Net PnL, Entry Price, Mark Price */}
            <div className="grid grid-cols-3 gap-2 font-mono text-[10px] relative z-10">
              <div className={`p-2 ${themeStyles.innerBg} border ${themeStyles.gridBorder} flex flex-col`}>
                <span className="text-white/60 text-[8.5px] uppercase mb-0.5">Net PnL</span>
                <strong className={`text-[13px] font-bold ${isProfitable ? 'text-[#00FF66]' : 'text-[#FF4444]'}`}>
                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                </strong>
                <span className="text-[7.5px] text-white/40">USDT</span>
              </div>

              <div className={`p-2 ${themeStyles.innerBg} border ${themeStyles.gridBorder} flex flex-col`}>
                <span className="text-white/60 text-[8.5px] uppercase mb-0.5">
                  {cardMode === 'trade' ? 'Entry Price' : 'Win Rate'}
                </span>
                <strong className="text-[13px] font-bold text-white">
                  {cardMode === 'trade'
                    ? `$${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`
                    : `${winRate.toFixed(1)}%`}
                </strong>
                <span className="text-[7.5px] text-white/40">
                  {cardMode === 'trade' ? 'USDT' : 'CLOSED TRADES'}
                </span>
              </div>

              <div className={`p-2 ${themeStyles.innerBg} border ${themeStyles.gridBorder} flex flex-col`}>
                <span className="text-white/60 text-[8.5px] uppercase mb-0.5">
                  {cardMode === 'trade' ? 'Mark Price' : 'Total Equity'}
                </span>
                <strong className="text-[13px] font-bold text-crt-amber">
                  {cardMode === 'trade'
                    ? `$${markPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`
                    : '10.00+ USDT'}
                </strong>
                <span className="text-[7.5px] text-white/40">
                  {cardMode === 'trade' ? 'LIVE BINANCE' : 'VIRTUAL'}
                </span>
              </div>
            </div>

            {/* Trader Identity & Footer Stamp */}
            <div className="border-t border-white/15 pt-2 flex items-center justify-between relative z-10 text-[9px] font-mono">
              <div className="flex items-center space-x-1.5">
                <span className="text-[14px]">👤</span>
                <div>
                  <span className="text-white font-bold block leading-tight">
                    {username}
                  </span>
                  <span className="text-white/50 text-[8px]">
                    {isConnected && walletAddress
                      ? Web3AuthService.truncateAddress(walletAddress)
                      : 'Sandbox Guest Account'}
                  </span>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <span className="text-white/70 font-semibold">
                  CryptoOS 98 Terminal
                </span>
                <span className="text-white/40 text-[8px]">
                  Zero Real Financial Risk
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Strip */}
        <div className="flex items-center justify-between pt-1 border-t border-bevel-shadow text-[11px] font-bold">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleCopy}
              disabled={copying}
              className="win-btn px-3 py-1 flex items-center space-x-1 active:translate-x-0.5 active:translate-y-0.5 bg-win-base text-black cursor-pointer shadow"
            >
              <span>{copied ? 'Copied to Clipboard! ✓' : copying ? 'Rendering...' : 'Copy Image 📋'}</span>
            </button>
            <button
              onClick={handleSavePng}
              disabled={saving}
              className="win-btn px-3 py-1 flex items-center space-x-1 active:translate-x-0.5 active:translate-y-0.5 bg-win-base text-black cursor-pointer shadow"
            >
              <span>{saving ? 'Saving...' : 'Save .PNG 💾'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleShareX}
              className="win-btn bg-titlebar-navy text-white px-3.5 py-1 flex items-center space-x-1 active:translate-x-0.5 active:translate-y-0.5 shadow cursor-pointer"
            >
              <span>𝕏 Share on X</span>
              <span>↗</span>
            </button>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
};
