import React, { useState } from 'react';
import { WindowFrame } from '@/components/desktop/WindowFrame';
import confetti from 'canvas-confetti';

export const ShareFlexCardModal: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [showEntry, setShowEntry] = useState(true);
  const [includeQr, setIncludeQr] = useState(true);
  const [watermark, setWatermark] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      '🚀 Just made +67.1% ROI (20x Long) on BTC/USDT Perpetual in CryptoOS 98!\nPlay the retro crypto futures simulator: #CryptoOS98 #BinanceFutures #DegenTrading'
    );
    setCopied(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareX = () => {
    const text = encodeURIComponent(
      '🚀 Just locked in +67.1% ROI on BTC/USDT (20x Long) on CryptoOS 98 - the Retro 90s Crypto Futures Trading Simulator! 💻\n\nTrade live Binance perps with zero real risk: #CryptoOS98 #BinanceFutures #DegenTrading'
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

        {/* The Retro Cyber CRT Flex Card */}
        <div className="win-inset-deep bg-[#0A0E17] text-white crt-grid p-3 relative flex flex-col gap-2 border border-[#1A3328] shadow-inner">
          {/* Card Top Strip */}
          <div className="flex justify-between items-center border-b border-[#1F4037] pb-1">
            <div className="flex items-center space-x-1.5 font-mono text-[9px] text-crt-bullish">
              <span className="w-2 h-2 bg-crt-bullish rounded-full animate-pulse"></span>
              <span className="font-bold tracking-wider">CRYPTO-OS 98 // DEGEN FUTURES TERMINAL</span>
            </div>
            <div className="font-mono text-[8px] text-[#52B788] bg-[#0D2818] px-1.5 py-0.2 border border-[#1E5128]">
              NODE: #NODE-7729 (US-EAST)
            </div>
          </div>

          {/* Profile & Badge Row */}
          <div className="flex items-center justify-between mt-0.5">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 win-outset bg-[#1e293b] flex items-center justify-center border border-crt-bullish">
                <span className="text-[20px]">😎</span>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-white text-[13px] font-headline">
                    SatoshiDegen_98
                  </span>
                  <span className="win-outset bg-crt-amber text-black px-1 text-[8px] font-bold">
                    YOU
                  </span>
                </div>
                <div className="text-[9px] text-[#74C69D] font-mono flex items-center space-x-1">
                  <span>Novice Liquidator</span>
                  <span className="text-[#52B788]">|</span>
                  <span className="text-crt-amber font-bold">Season 1: #142 / 4,921</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="bg-[#008531] text-white text-[8px] px-1.5 py-0.5 font-bold tracking-wider uppercase border border-crt-bullish">
                PROFIT SECURED 🚀
              </span>
              <span className="text-[8px] text-[#74C69D] font-mono mt-0.5">LEVERAGE: 20x ISOLATED</span>
            </div>
          </div>

          {/* Big Neon ROE % Readout */}
          <div className="my-0.5 bg-[#06140D] p-2 border border-[#1E5128] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-[#74C69D] uppercase">Unrealized PnL</span>
              <div className="font-mono text-[28px] leading-none text-crt-bullish font-bold tracking-tight crt-glow-green">
                +67.1% <span className="text-[16px]">ROI</span>
              </div>
            </div>
            <div className="text-right flex flex-col justify-end">
              <span className="text-[9px] font-mono text-[#74C69D]">Net Realized Gain</span>
              <span className="font-mono text-[18px] leading-none text-crt-bullish font-bold">
                +$6.71 USDT
              </span>
            </div>
          </div>

          {/* Contract Details Grid */}
          {showEntry && (
            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono bg-[#071310] p-1.5 border border-[#1B3A2F]">
              <div className="flex flex-col gap-0.5">
                <div>
                  <span className="text-[#52B788]">CONTRACT:</span>{' '}
                  <span className="text-white font-bold">BTC/USDT PERPETUAL</span>
                </div>
                <div>
                  <span className="text-[#52B788]">POSITION:</span>{' '}
                  <span className="text-crt-bullish font-bold">LONG (20.0x)</span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 text-right">
                <div>
                  <span className="text-[#52B788]">ENTRY:</span>{' '}
                  <span className="text-white">$60,000.00</span>
                </div>
                <div>
                  <span className="text-[#52B788]">MARK PRICE:</span>{' '}
                  <span className="text-crt-amber font-bold">$64,281.50</span>
                </div>
              </div>
            </div>
          )}

          {/* Card Footer Stamp */}
          <div className="flex items-center justify-between pt-1 border-t border-[#1F4037] text-[8px] font-mono text-[#74C69D]">
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
                  <span>VERIFY ON DEGENCHAIN</span>
                  <span className="text-white font-bold">TX: 0x98...c0ffee</span>
                </div>
              </div>
            )}

            <div className="text-center border border-[#1E5128] px-2 py-0.5 bg-[#0B2014] text-crt-bullish font-bold tracking-wider">
              ★ 100% VIRTUAL GAINS CERTIFIED ★
            </div>

            {watermark && (
              <div className="text-right text-[#52B788] leading-tight">
                <div>1998-10-24 14:45 UTC</div>
                <div>VERIFIED PnL ENGINE</div>
              </div>
            )}
          </div>
        </div>

        {/* Options Strip */}
        <div className="win-inset bg-surface-low p-2 flex items-center justify-between text-[10px]">
          <div className="flex items-center space-x-2">
            <span className="font-bold">Card Theme:</span>
            <div className="win-inset bg-white px-2 py-0.5 text-[#008531] font-bold">
              ● Cyber CRT Green (Default)
            </div>
          </div>

          <div className="flex items-center space-x-3 text-[10px]">
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showEntry}
                onChange={(e) => setShowEntry(e.target.checked)}
                className="w-3 h-3 win-inset"
              />
              <span>Show Entry/Exit</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={includeQr}
                onChange={(e) => setIncludeQr(e.target.checked)}
                className="w-3 h-3 win-inset"
              />
              <span>Include Stamp</span>
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
              className="win-btn px-2.5 py-1 flex items-center space-x-1 active:translate-x-0.5 active:translate-y-0.5"
            >
              <span>{copied ? 'Copied ✓' : 'Copy Text / Card'}</span>
              <span>📋</span>
            </button>
            <button
              onClick={() => alert('Saved image: CryptoOS98_BTCUSDT_FlexCard.png')}
              className="win-btn px-2.5 py-1 flex items-center space-x-1 active:translate-x-0.5 active:translate-y-0.5"
            >
              <span>Save .PNG</span>
              <span>💾</span>
            </button>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleShareX}
              className="win-btn bg-titlebar-navy text-white px-3 py-1 flex items-center space-x-1 active:translate-x-0.5 active:translate-y-0.5"
            >
              <span>𝕏 Share on X / Twitter</span>
              <span>↗</span>
            </button>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
};
