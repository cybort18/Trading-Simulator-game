import React, { useState, useRef } from 'react';
import { WindowFrame } from '@/components/desktop/WindowFrame';
import { useTradingStore } from '@/stores/useTradingStore';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { toPng, toBlob } from 'html-to-image';
import confetti from 'canvas-confetti';

type CardTheme = 'green' | 'red' | 'gold';

export const ShareFlexCardModal: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>('green');
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEntry, setShowEntry] = useState(true);
  const [includeQr, setIncludeQr] = useState(true);
  const [watermark, setWatermark] = useState(true);

  const selectedFlexTrade = useTradingStore((state) => state.selectedFlexTrade);
  const positions = useTradingStore((state) => state.positions);
  const tradeHistory = useTradingStore((state) => state.tradeHistory);
  const prices = useMarketDataStore((state) => state.prices);

  // Derive active trade metrics from store or fallback to default viral flex trade
  const trade = selectedFlexTrade || positions[0] || tradeHistory[0] || null;

  const pair = trade ? trade.pair : 'BTCUSDT';
  const pairLabel = pair.replace('USDT', '/USDT');
  const direction = trade ? trade.direction : 'LONG';
  const leverage = trade ? trade.leverage : 20;
  const marginMode = trade && 'marginMode' in trade ? trade.marginMode : 'ISOLATED';

  let entryPrice = 60000.0;
  let exitPrice = 64281.5;
  let roi = 67.1;
  let pnl = 6.71;

  if (trade) {
    entryPrice = trade.entryPrice;
    if ('unrealizedPnl' in trade) {
      // Active Position
      exitPrice = prices[trade.pair] || trade.markPrice;
      roi = trade.roe;
      pnl = trade.unrealizedPnl;
    } else {
      // Closed Trade History Item
      exitPrice = trade.exitPrice;
      roi = trade.roe;
      pnl = trade.realizedPnl;
    }
  }

  const isProfitable = roi >= 0;

  // Theme styling definitions
  const themeStyles = {
    green: {
      bg: 'bg-[#0A0E17]',
      border: 'border-[#1A3328]',
      headerText: 'text-crt-bullish',
      glow: 'crt-glow-green text-crt-bullish',
      badgeBg: 'bg-[#008531] text-white border-crt-bullish',
      accentText: 'text-[#74C69D]',
      subText: 'text-[#52B788]',
      innerBoxBg: 'bg-[#06140D]',
      innerBoxBorder: 'border-[#1E5128]',
    },
    red: {
      bg: 'bg-[#140808]',
      border: 'border-[#4A1818]',
      headerText: 'text-crt-bearish',
      glow: 'crt-glow-red text-crt-bearish',
      badgeBg: 'bg-[#880000] text-white border-crt-bearish',
      accentText: 'text-[#FFA8A8]',
      subText: 'text-[#FF7777]',
      innerBoxBg: 'bg-[#1A0A0A]',
      innerBoxBorder: 'border-[#401515]',
    },
    gold: {
      bg: 'bg-[#141208]',
      border: 'border-[#4A3E15]',
      headerText: 'text-crt-amber',
      glow: 'crt-glow-amber text-crt-amber',
      badgeBg: 'bg-[#B8860B] text-black border-[#FFD700]',
      accentText: 'text-[#FFE599]',
      subText: 'text-[#FFD966]',
      innerBoxBg: 'bg-[#1E190A]',
      innerBoxBorder: 'border-[#55420F]',
    },
  }[selectedTheme];

  const handleCopy = async () => {
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
      // Fallback text copy
      const text = `🚀 CryptoOS 98 Flex Card\nContract: ${pairLabel} PERPETUAL (${direction} ${leverage}x)\n` +
        `ROI: ${roi >= 0 ? '+' : ''}${roi.toFixed(1)}% | Net PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} USDT\n` +
        `Verified on CryptoOS 98 Degen Futures Terminal: #CryptoOS98 #BinanceFutures #DegenTrading`;
      await navigator.clipboard.writeText(text);
    }

    setCopying(false);
    setCopied(true);
    confetti({ particleCount: 60, spread: 65, origin: { y: 0.7 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSavePng = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `CryptoOS98_Trade_${pair}_${direction}_${roi >= 0 ? 'WIN' : 'LOSS'}.png`;
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
    const text = encodeURIComponent(
      `🚀 Just locked in ${roi >= 0 ? '+' : ''}${roi.toFixed(1)}% ROI on ${pairLabel} (${direction} ${leverage}x) on CryptoOS 98!\n\n` +
      `💻 The Retro 90s Crypto Futures Trading Simulator\n` +
      `🔥 Trade live Binance perps with zero real-money risk: #CryptoOS98 #BinanceFutures #DegenTrading`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  return (
    <WindowFrame
      id="flexcard"
      menuItems={['File', 'CardFormat', 'Themes', 'Export', 'Help']}
      statusContent={
        <>
          <div className="flex items-center space-x-2">
            <span className="text-crt-bullish font-bold">● RENDERER: 2D CANVAS ACCELERATED</span>
            <span>|</span>
            <span>DPI: 2X RETINA</span>
          </div>
          <span className="font-bold text-titlebar-navy">READY TO EXPORT</span>
        </>
      }
    >
      <div className="p-2 flex flex-col gap-2 font-ui text-black overflow-y-auto">
        {/* Intro banner */}
        <div className="flex items-center space-x-2.5 bg-surface-low p-1.5 win-inset">
          <div className="w-8 h-8 win-outset bg-win-base flex items-center justify-center">
            <span className="text-[18px]">📷</span>
          </div>
          <div className="flex-1 font-mono text-[10px] leading-tight">
            <div className="font-bold text-black text-[11px]">PnL Braggart Flex Card Wizard</div>
            <div className="text-[#555]">
              Generate high-resolution retro pixel art flex card to share on X, Telegram, or Discord.
            </div>
          </div>
          <div className="win-inset px-2 py-0.5 bg-white text-[9px] font-mono text-[#008531] font-bold">
            READY TO RENDER
          </div>
        </div>

        {/* The Retro Viral CRT Flex Card (Target for html-to-image capture) */}
        <div
          ref={cardRef}
          className={`win-inset-deep ${themeStyles.bg} text-white crt-grid p-3.5 relative flex flex-col gap-2 border ${themeStyles.border} shadow-2xl select-none`}
        >
          {/* Card Top Strip */}
          <div className="flex justify-between items-center border-b border-[#2A2A2A] pb-1">
            <div className={`flex items-center space-x-1.5 font-mono text-[9px] ${themeStyles.headerText}`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              <span className="font-bold tracking-wider">CRYPTO-OS 98 // DEGEN FUTURES TERMINAL</span>
            </div>
            <div className="font-mono text-[8px] bg-black/50 px-1.5 py-0.2 border border-white/20 text-[#A0A0A0]">
              NODE: #NODE-7729 (US-EAST)
            </div>
          </div>

          {/* Profile & Badge Row */}
          <div className="flex items-center justify-between mt-0.5">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 win-outset bg-[#1e293b] flex items-center justify-center border border-white/30">
                <span className="text-[22px]">😎</span>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-white text-[13px] font-headline tracking-wide">
                    SatoshiDegen_98
                  </span>
                  <span className="win-outset bg-crt-amber text-black px-1 text-[8px] font-bold">
                    YOU
                  </span>
                </div>
                <div className={`text-[9px] ${themeStyles.accentText} font-mono flex items-center space-x-1`}>
                  <span>Novice Liquidator</span>
                  <span className="text-white/40">|</span>
                  <span className="text-crt-amber font-bold">Season 1: #142</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className={`text-[8.5px] px-1.5 py-0.5 font-bold tracking-wider uppercase border ${themeStyles.badgeBg}`}>
                {isProfitable ? 'PROFIT SECURED 🚀' : 'REKT IN ACTION ☠'}
              </span>
              <span className={`text-[8.5px] ${themeStyles.accentText} font-mono mt-0.5`}>
                LEVERAGE: {leverage}x {marginMode}
              </span>
            </div>
          </div>

          {/* Big Neon ROE % Readout */}
          <div className={`my-0.5 ${themeStyles.innerBoxBg} p-2.5 border ${themeStyles.innerBoxBorder} flex items-center justify-between`}>
            <div className="flex flex-col">
              <span className={`text-[9px] font-mono ${themeStyles.accentText} uppercase`}>
                {trade && 'unrealizedPnl' in trade ? 'Unrealized PnL' : 'Realized PnL'}
              </span>
              <div className={`font-mono text-[30px] leading-none font-bold tracking-tight ${themeStyles.glow}`}>
                {roi >= 0 ? '+' : ''}{roi.toFixed(1)}% <span className="text-[16px]">ROI</span>
              </div>
            </div>
            <div className="text-right flex flex-col justify-end">
              <span className={`text-[9px] font-mono ${themeStyles.accentText}`}>Net Gain / Loss</span>
              <span className={`font-mono text-[19px] leading-none font-bold ${isProfitable ? 'text-crt-bullish' : 'text-crt-bearish'}`}>
                {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} USDT
              </span>
            </div>
          </div>

          {/* Contract Details Grid */}
          {showEntry && (
            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono bg-black/40 p-1.5 border border-white/10">
              <div className="flex flex-col gap-0.5">
                <div>
                  <span className={themeStyles.subText}>CONTRACT:</span>{' '}
                  <span className="text-white font-bold">{pairLabel} PERPETUAL</span>
                </div>
                <div>
                  <span className={themeStyles.subText}>DIRECTION:</span>{' '}
                  <span className={direction === 'LONG' ? 'text-crt-bullish font-bold' : 'text-crt-bearish font-bold'}>
                    {direction} ({leverage}.0x)
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 text-right">
                <div>
                  <span className={themeStyles.subText}>ENTRY PRICE:</span>{' '}
                  <span className="text-white font-bold">${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className={themeStyles.subText}>EXIT/MARK PRICE:</span>{' '}
                  <span className="text-crt-amber font-bold">${exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          )}

          {/* Card Footer Stamp */}
          <div className="flex items-center justify-between pt-1 border-t border-[#2A2A2A] text-[8px] font-mono text-[#74C69D]">
            {includeQr && (
              <div className="flex items-center space-x-1.5">
                <div className="w-6 h-6 bg-white p-0.5 flex items-center justify-center">
                  <div className="w-full h-full bg-black grid grid-cols-2 gap-0.5 p-0.5">
                    <div className="bg-white"></div>
                    <div className="bg-black"></div>
                    <div className="bg-black"></div>
                    <div className="bg-white"></div>
                  </div>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className={themeStyles.subText}>VERIFY ON DEGENCHAIN</span>
                  <span className="text-white font-bold">TX: 0x98...c0ffee</span>
                </div>
              </div>
            )}

            <div className={`text-center border ${themeStyles.innerBoxBorder} px-2 py-0.5 ${themeStyles.innerBoxBg} ${themeStyles.headerText} font-bold tracking-wider`}>
              ★ 100% VIRTUAL GAINS CERTIFIED ★
            </div>

            {watermark && (
              <div className={`text-right ${themeStyles.subText} leading-tight`}>
                <div>1998-10-24 14:45 UTC</div>
                <div>CRYPTOOS-98 ENGINE</div>
              </div>
            )}
          </div>
        </div>

        {/* Theme Switch & Options Strip */}
        <div className="win-inset bg-surface-low p-2 flex flex-col md:flex-row items-center justify-between gap-2 text-[10px]">
          <div className="flex items-center space-x-1">
            <span className="font-bold mr-1">Theme:</span>
            <button
              onClick={() => setSelectedTheme('green')}
              className={`px-2 py-0.5 text-[9px] font-bold ${
                selectedTheme === 'green' ? 'win-btn-pressed bg-win-pressed text-[#008531]' : 'win-btn'
              }`}
            >
              [ Cyber CRT Green ]
            </button>
            <button
              onClick={() => setSelectedTheme('red')}
              className={`px-2 py-0.5 text-[9px] font-bold ${
                selectedTheme === 'red' ? 'win-btn-pressed bg-win-pressed text-crt-bearish' : 'win-btn'
              }`}
            >
              [ Blood Red ]
            </button>
            <button
              onClick={() => setSelectedTheme('gold')}
              className={`px-2 py-0.5 text-[9px] font-bold ${
                selectedTheme === 'gold' ? 'win-btn-pressed bg-win-pressed text-crt-amber' : 'win-btn'
              }`}
            >
              [ Gold Whale ]
            </button>
          </div>

          <div className="flex items-center space-x-3 text-[10px]">
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showEntry}
                onChange={(e) => setShowEntry(e.target.checked)}
                className="w-3 h-3 win-inset"
              />
              <span>Entry/Exit</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={includeQr}
                onChange={(e) => setIncludeQr(e.target.checked)}
                className="w-3 h-3 win-inset"
              />
              <span>Stamp</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={watermark}
                onChange={(e) => setWatermark(e.target.checked)}
                className="w-3 h-3 win-inset"
              />
              <span>Watermark</span>
            </label>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between pt-1 border-t border-bevel-shadow text-[11px] font-bold">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleCopy}
              disabled={copying}
              className="win-btn px-2.5 py-1 flex items-center space-x-1 active:translate-x-0.5 active:translate-y-0.5"
            >
              <span>{copied ? 'Copied to Clipboard! ✓' : copying ? 'Rendering...' : 'Copy Image 📋'}</span>
            </button>
            <button
              onClick={handleSavePng}
              disabled={saving}
              className="win-btn px-2.5 py-1 flex items-center space-x-1 active:translate-x-0.5 active:translate-y-0.5"
            >
              <span>{saving ? 'Saving...' : 'Save .PNG 💾'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleShareX}
              className="win-btn bg-titlebar-navy text-white px-3 py-1 flex items-center space-x-1 active:translate-x-0.5 active:translate-y-0.5 shadow"
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
