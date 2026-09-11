import React, { useState } from 'react';
import { useWindowStore } from '@/stores/useWindowStore';
import { PixelIcon } from '@/components/common/PixelIcon';
import { safeStateStorage } from '@/utils/safeStorage';

export const WelcomeModal: React.FC = () => {
  const windowState = useWindowStore((state) => state.windows.welcome);
  const closeWindow = useWindowStore((state) => state.closeWindow);
  const openWindow = useWindowStore((state) => state.openWindow);
  const focusWindow = useWindowStore((state) => state.focusWindow);

  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!windowState || !windowState.isOpen) {
    return null;
  }

  const handleStartTrading = () => {
    if (dontShowAgain) {
      safeStateStorage.setItem('CRYPTOOS_98_HIDE_WELCOME', 'true');
    }
    closeWindow('welcome');
    openWindow('turbotrade');
    focusWindow('turbotrade');
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4 select-none">
      <div className="w-[500px] max-w-[95vw] window-outer-frame bg-win-base flex flex-col shadow-2xl">
        {/* Titlebar */}
        <div className="h-titlebar-height titlebar-active px-1.5 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 overflow-hidden">
            <PixelIcon name="warning" size={14} className="text-crt-amber flex-shrink-0" />
            <span className="font-bold text-[11px] truncate tracking-wide text-white">
              System Notice - Welcome New Trader!
            </span>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={() => alert('CryptoOS 98 Futures Trading Simulation Manual')}
              className="w-[16px] h-[14px] win-btn bg-win-base text-black text-[9px] font-bold flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5"
            >
              ?
            </button>
            <button
              onClick={() => closeWindow('welcome')}
              className="w-[16px] h-[14px] win-btn bg-win-base text-black hover:bg-[#BA1A1A] hover:text-white text-[9px] font-bold flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-3 flex flex-col gap-2.5 bg-win-base font-ui text-black">
          {/* Header Warning Strip */}
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 win-inset-deep flex items-center justify-center flex-shrink-0">
              <span className="text-[24px]">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className="font-headline font-bold text-[14px] text-black leading-tight">
                Welcome to CryptoOS 98 Terminal
              </h3>
              <p className="text-[11px] text-[#333] leading-snug mt-0.5">
                The crypto futures market is extremely volatile. Test your strategy and discipline with zero risk to real capital.
              </p>
            </div>
          </div>

          {/* Starter Pack Highlight Well */}
          <div className="win-inset-deep p-2 flex items-center justify-between text-white crt-grid">
            <div className="flex items-center space-x-2">
              <span className="text-[20px]">💰</span>
              <div>
                <div className="font-mono text-[9px] text-[#888] uppercase">
                  Virtual Balance Initialized
                </div>
                <div className="font-mono text-[11px] text-white">
                  Starter Pack:{' '}
                  <span className="text-crt-bullish font-bold text-[13px] crt-glow-green">
                    10.00 USDT
                  </span>{' '}
                  has been credited to your virtual wallet.
                </div>
              </div>
            </div>
            <span className="win-outset bg-titlebar-navy text-white text-[8px] font-bold px-1.5 py-0.5">
              READY
            </span>
          </div>

          {/* Quick Rules Inset */}
          <div className="win-inset bg-surface-low p-2 flex flex-col gap-1 text-[10px]">
            <div className="font-bold text-black border-b border-bevel-shadow pb-0.5 flex items-center justify-between">
              <span>Quick Rules - Fundamental Trading Guidelines:</span>
              <span className="font-mono text-[8px] text-bevel-shadow">v1.0-DOC</span>
            </div>
            <div className="flex flex-col gap-1 text-[#222] pl-1 pt-0.5">
              <div className="flex items-start space-x-1.5">
                <strong className="text-titlebar-navy font-mono">1.</strong>
                <span>
                  <strong>Enter Positions:</strong> Open a <strong>Long</strong> (Buy) order if you expect prices to rise, or <strong>Short</strong> (Sell) if you anticipate a decline.
                </span>
              </div>
              <div className="flex items-start space-x-1.5">
                <strong className="text-titlebar-navy font-mono">2.</strong>
                <span>
                  <strong>Liquidation Risk:</strong> Monitor your Liquidation Price closely. High leverage compresses your margin buffer rapidly.
                </span>
              </div>
              <div className="flex items-start space-x-1.5">
                <strong className="text-titlebar-navy font-mono">3.</strong>
                <span>
                  <strong>Climb the Leaderboard:</strong> Maximize your net ROI and win rate to ascend the global weekly rankings.
                </span>
              </div>
            </div>
          </div>

          {/* Checkbox & Encryption Strip */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center space-x-1.5 text-[10px] cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 win-inset accent-titlebar-navy"
              />
              <span>Do not show this tip on system startup</span>
            </label>
            <span className="font-mono text-[9px] text-bevel-shadow">SSL v3.0 ENCRYPTED</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-bevel-shadow flex items-center justify-end space-x-2">
            <button
              onClick={() => alert('Manual: CryptoOS 98 allows you to paper-trade Perpetual Contracts with 1x-100x leverage on Binance data.')}
              className="win-btn px-3 py-1 text-[11px] font-bold"
            >
              [ View Manual ]
            </button>
            <button
              onClick={handleStartTrading}
              className="win-btn bg-[#008531] text-white px-4 py-1 flex items-center space-x-1 active:translate-x-0.5 active:translate-y-0.5 shadow-md"
            >
              <div className="border border-dotted border-white px-2 py-0.5 flex items-center space-x-1">
                <span className="text-[12px]">⚡</span>
                <span className="font-bold text-[11px] tracking-wider uppercase">
                  START TRADING
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
