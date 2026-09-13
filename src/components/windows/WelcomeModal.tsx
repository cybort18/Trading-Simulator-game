import React, { useState } from 'react';
import { useWindowStore } from '@/stores/useWindowStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { PixelIcon } from '@/components/common/PixelIcon';
import { safeStateStorage } from '@/utils/safeStorage';
import { soundFXService } from '@/services/SoundFXService';
import { Web3AuthService } from '@/services/Web3AuthService';

export const WelcomeModal: React.FC = () => {
  const windowState = useWindowStore((state) => state.windows.welcome);
  const closeWindow = useWindowStore((state) => state.closeWindow);
  const openWindow = useWindowStore((state) => state.openWindow);
  const focusWindow = useWindowStore((state) => state.focusWindow);

  const isConnected = useAuthStore((state) => state.isConnected);
  const walletAddress = useAuthStore((state) => state.walletAddress);
  const openConnectModal = useAuthStore((state) => state.openConnectModal);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const [targetApp, setTargetApp] = useState<'turbotrade' | 'degenvault' | 'clean'>('turbotrade');

  if (!windowState || !windowState.isOpen) {
    return null;
  }

  const handleNext = () => {
    soundFXService.playKeyClick();
    setCurrentStep((prev) => Math.min(4, prev + 1));
  };

  const handleBack = () => {
    soundFXService.playKeyClick();
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinish = () => {
    soundFXService.playKeyClick();
    if (dontShowAgain) {
      safeStateStorage.setItem('CRYPTOOS_98_HIDE_WELCOME', 'true');
    }
    closeWindow('welcome');

    if (targetApp === 'turbotrade') {
      openWindow('turbotrade');
      focusWindow('turbotrade');
    } else if (targetApp === 'degenvault') {
      openWindow('degenvault');
      focusWindow('degenvault');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 select-none font-ui">
      {/* 90s Setup Wizard Frame */}
      <div className="w-[660px] max-w-[96vw] window-outer-frame bg-win-base flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Title Bar */}
        <div className="h-6 bg-titlebar-navy text-white flex items-center justify-between px-2 py-0.5 select-none">
          <div className="flex items-center space-x-1.5 overflow-hidden">
            <span className="text-[14px]">🖥️</span>
            <span className="font-headline font-bold text-[12px] truncate tracking-wide text-white">
              CryptoOS 98 - Getting Started Setup Wizard
            </span>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={handleFinish}
              className="win-btn px-1.5 h-4 flex items-center justify-center text-black font-bold text-[10px] bg-win-base leading-none hover:bg-error hover:text-white"
              title="Cancel / Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Wizard Main Body: Left Sidebar + Step Content */}
        <div className="flex flex-1 min-h-[380px] bg-win-base p-1 gap-1">
          {/* Left Wizard Graphic Banner */}
          <div className="w-[180px] bg-gradient-to-b from-titlebar-navy via-[#000055] to-[#101030] p-3 text-white flex flex-col justify-between win-inset border border-bevel-shadow flex-shrink-0">
            <div>
              <div className="flex items-center space-x-1 mb-2 text-crt-amber font-mono font-bold text-[13px]">
                <span>⚡</span>
                <span>SETUP WIZARD</span>
              </div>
              <div className="text-[10px] text-[#A0C0FF] font-mono leading-tight mb-4">
                CryptoOS 98
                <br />
                Futures Simulator v4.10
              </div>

              {/* Steps Progress List */}
              <div className="flex flex-col gap-2 font-ui text-[11px]">
                {[
                  { step: 1, label: '1. Overview' },
                  { step: 2, label: '2. Trading & Apps' },
                  { step: 3, label: '3. Web3 Login & Gas' },
                  { step: 4, label: '4. Start Trading' },
                ].map((item) => {
                  const isActive = currentStep === item.step;
                  const isDone = currentStep > item.step;

                  return (
                    <div
                      key={item.step}
                      className={`px-1.5 py-1 flex items-center space-x-1.5 ${
                        isActive
                          ? 'bg-[#FFCC00] text-black font-bold win-outset shadow'
                          : isDone
                          ? 'text-[#00FF66] font-semibold'
                          : 'text-[#8888AA]'
                      }`}
                    >
                      <span className="font-mono text-[9px]">
                        {isDone ? '✓' : isActive ? '▶' : '○'}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Telemetry Stamp */}
            <div className="font-mono text-[9px] text-[#667799] border-t border-[#334466] pt-2">
              <div>MEM: 640 KB OK</div>
              <div>COM1: 56K V.90</div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 win-inset bg-surface-high p-3 flex flex-col justify-between text-black overflow-y-auto">
            {/* STEP 1: WELCOME & OVERVIEW */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-3">
                <div className="border-b border-bevel-shadow pb-1.5">
                  <h2 className="font-headline font-bold text-[15px] text-black">
                    Welcome to CryptoOS 98
                  </h2>
                  <p className="text-[11px] text-[#333] mt-0.5 leading-normal">
                    A high-leverage crypto futures trading simulator wrapped in authentic 1998 Windows skeuomorphism.
                  </p>
                </div>

                {/* 3 Value Proposition Cards */}
                <div className="flex flex-col gap-2">
                  <div className="win-outset bg-white p-2 flex items-start space-x-2.5">
                    <span className="text-[20px] flex-shrink-0">💰</span>
                    <div>
                      <strong className="block text-[11px] text-black font-bold">
                        10.00 USDT Virtual Starter Pack
                      </strong>
                      <span className="text-[10px] text-[#444] leading-snug">
                        Every player begins with $10.00 virtual USDT. Test your discipline and margin management with <strong>zero risk to real funds</strong>.
                      </span>
                    </div>
                  </div>

                  <div className="win-outset bg-white p-2 flex items-start space-x-2.5">
                    <span className="text-[20px] flex-shrink-0">📡</span>
                    <div>
                      <strong className="block text-[11px] text-black font-bold">
                        Real-Time Binance Market Feeds
                      </strong>
                      <span className="text-[10px] text-[#444] leading-snug">
                        Live real-time tick streams for BTC/USDT, ETH/USDT, and SOL/USDT with responsive candlestick charts and funding rates.
                      </span>
                    </div>
                  </div>

                  <div className="win-outset bg-white p-2 flex items-start space-x-2.5">
                    <span className="text-[20px] flex-shrink-0">🏆</span>
                    <div>
                      <strong className="block text-[11px] text-black font-bold">
                        Multiplayer Cloud Leaderboard
                      </strong>
                      <span className="text-[10px] text-[#444] leading-snug">
                        Compete on the global leaderboard powered by Supabase. Climb the ranks from <em>Novice Liquidator</em> to <em>Apex Whale</em>!
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: TRADING MECHANICS & APPS */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-2.5">
                <div className="border-b border-bevel-shadow pb-1">
                  <h2 className="font-headline font-bold text-[14px] text-black">
                    System Applications & Trading Flow
                  </h2>
                  <p className="text-[10.5px] text-[#333]">
                    Explore the built-in desktop programs available on your computer:
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {/* TurboTrade Card */}
                  <div className="win-outset bg-white p-2 flex flex-col justify-between">
                    <div className="flex items-center space-x-1.5 font-bold text-titlebar-navy mb-1">
                      <PixelIcon name="candlestick" size={16} className="text-[#008531]" />
                      <span>TurboTrade.exe</span>
                    </div>
                    <p className="text-[#333] leading-tight">
                      Open <strong>Long</strong> (buy) if you expect prices to pump, or <strong>Short</strong> (sell) if you expect a dump. Adjust leverage from 1x to 100x.
                    </p>
                    <span className="text-[9px] text-[#777] mt-1 font-mono">Watch liquidation price!</span>
                  </div>

                  {/* DegenVault Card */}
                  <div className="win-outset bg-white p-2 flex flex-col justify-between">
                    <div className="flex items-center space-x-1.5 font-bold text-titlebar-navy mb-1">
                      <PixelIcon name="wallet" size={16} className="text-titlebar-navy" />
                      <span>DegenVault.exe</span>
                    </div>
                    <p className="text-[#333] leading-tight">
                      Virtual financial ledger. Claim your <strong>7-Day Login Streak Rewards</strong> and use the <strong>Emergency Faucet (+10 USDT)</strong> if you get rekt.
                    </p>
                    <span className="text-[9px] text-[#777] mt-1 font-mono">Bailout when balance &lt; $1</span>
                  </div>

                  {/* Leaderboard Card */}
                  <div className="win-outset bg-white p-2 flex flex-col justify-between">
                    <div className="flex items-center space-x-1.5 font-bold text-titlebar-navy mb-1">
                      <PixelIcon name="trophy" size={16} className="text-crt-amber" />
                      <span>Leaderboard.exe</span>
                    </div>
                    <p className="text-[#333] leading-tight">
                      Global arena tracking top traders by Net PnL, Win Rate %, and All-Time ROI %. Syncs in real time via Supabase PostgreSQL.
                    </p>
                    <span className="text-[9px] text-[#777] mt-1 font-mono">Realtime rank updates</span>
                  </div>

                  {/* ShareFlexCard Card */}
                  <div className="win-outset bg-white p-2 flex flex-col justify-between">
                    <div className="flex items-center space-x-1.5 font-bold text-titlebar-navy mb-1">
                      <PixelIcon name="camera" size={16} className="text-[#555]" />
                      <span>ShareFlexCard.exe</span>
                    </div>
                    <p className="text-[#333] leading-tight">
                      Export authentic retro 90s flex cards of your biggest winning trades (or liquidation slips) to brag on social media.
                    </p>
                    <span className="text-[9px] text-[#777] mt-1 font-mono">PNG export with 1-click</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: WEB3 WALLET AUTHENTICATION & ZERO GAS */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-2.5">
                <div className="border-b border-bevel-shadow pb-1">
                  <h2 className="font-headline font-bold text-[14px] text-black">
                    Why Web3 Wallet? (Zero Crypto & Zero Gas)
                  </h2>
                  <p className="text-[10.5px] text-[#333]">
                    Understanding cryptographic authentication in CryptoOS 98:
                  </p>
                </div>

                {/* Zero Gas Callout Box */}
                <div className="bg-[#E6F4EA] border-2 border-[#008531] p-2 flex items-start space-x-2 win-inset">
                  <span className="text-[20px] leading-none">🛡️</span>
                  <div className="text-[10.5px] text-[#006622] leading-snug">
                    <strong className="block text-[11.5px] font-bold">
                      Zero Cryptocurrency Needed &amp; 100% Free:
                    </strong>
                    You <strong>never</strong> need to hold ETH or pay gas fees. We use your wallet purely as a secure, decentralized cryptographic identity passport!
                  </div>
                </div>

                {/* Explanation Details */}
                <div className="flex flex-col gap-1.5 text-[10px] text-[#222]">
                  <div className="flex items-start space-x-1.5">
                    <span className="text-titlebar-navy font-bold font-mono">1.</span>
                    <span>
                      <strong>Passwordless Login (SIWE):</strong> Instead of email and passwords that can get leaked, you sign a <em>Sign-In with Ethereum</em> message with one click.
                    </span>
                  </div>

                  <div className="flex items-start space-x-1.5">
                    <span className="text-titlebar-navy font-bold font-mono">2.</span>
                    <span>
                      <strong>Permanent Cloud Save:</strong> When connected, your trading history, wallet balance, and leaderboard rankings are saved directly into the <strong>Supabase cloud database</strong>.
                    </span>
                  </div>

                  <div className="flex items-start space-x-1.5">
                    <span className="text-titlebar-navy font-bold font-mono">3.</span>
                    <span>
                      <strong>Play as Guest Fallback:</strong> Don't have a wallet installed? You can play immediately in anonymous <strong>Guest Sandbox Mode</strong>. When you decide to connect a wallet later, your progress automatically migrates over!
                    </span>
                  </div>
                </div>

                {/* Current Status Preview */}
                <div className="win-inset-deep bg-black text-white p-2 font-mono text-[10px] flex justify-between items-center">
                  <span>YOUR STATUS:</span>
                  {isConnected && walletAddress ? (
                    <span className="text-crt-bullish font-bold">
                      CONNECTED ({Web3AuthService.truncateAddress(walletAddress)})
                    </span>
                  ) : (
                    <span className="text-crt-amber font-bold">
                      GUEST MODE (10.00 USDT STARTER)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: READY TO TRADE / LAUNCH DESKTOP */}
            {currentStep === 4 && (
              <div className="flex flex-col gap-2.5">
                <div className="border-b border-bevel-shadow pb-1">
                  <h2 className="font-headline font-bold text-[14px] text-black">
                    Ready to Enter the Arena!
                  </h2>
                  <p className="text-[10.5px] text-[#333]">
                    Configure your workspace launch settings:
                  </p>
                </div>

                {/* Authentication Action Strip */}
                <div className="win-outset bg-white p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[20px]">
                      {isConnected ? '✅' : '👤'}
                    </span>
                    <div className="text-[10.5px]">
                      <strong className="block text-black">
                        {isConnected ? 'Wallet Connected & Synced' : 'Currently in Guest Sandbox'}
                      </strong>
                      <span className="text-[#555] text-[9.5px]">
                        {isConnected
                          ? `Bound to ${Web3AuthService.truncateAddress(walletAddress)}`
                          : 'You can trade right away with starter 10.00 USDT'}
                      </span>
                    </div>
                  </div>

                  {!isConnected ? (
                    <button
                      onClick={() => openConnectModal()}
                      className="win-btn bg-titlebar-navy text-white px-2.5 py-1 text-[10px] font-bold active:translate-x-0.5 active:translate-y-0.5"
                    >
                      Connect Wallet
                    </button>
                  ) : (
                    <span className="win-outset bg-[#008531] text-white text-[9px] font-bold px-2 py-0.5">
                      VERIFIED
                    </span>
                  )}
                </div>

                {/* Initial Window Launch Selector */}
                <div className="win-inset bg-surface-low p-2 flex flex-col gap-1 text-[10.5px]">
                  <span className="font-bold text-black border-b border-bevel-shadow pb-0.5">
                    Select initial window to open on launch:
                  </span>
                  <label className="flex items-center space-x-2 cursor-pointer pt-0.5">
                    <input
                      type="radio"
                      name="targetApp"
                      checked={targetApp === 'turbotrade'}
                      onChange={() => setTargetApp('turbotrade')}
                      className="accent-titlebar-navy"
                    />
                    <span>
                      <strong>TurboTrade.exe</strong> (Recommended: Live BTC/USDT chart &amp; order form)
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="targetApp"
                      checked={targetApp === 'degenvault'}
                      onChange={() => setTargetApp('degenvault')}
                      className="accent-titlebar-navy"
                    />
                    <span>
                      <strong>DegenVault.exe</strong> (Wallet ledger &amp; claim daily reward streak)
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="targetApp"
                      checked={targetApp === 'clean'}
                      onChange={() => setTargetApp('clean')}
                      className="accent-titlebar-navy"
                    />
                    <span>
                      <strong>Clean Desktop</strong> (Open apps anytime from desktop icons)
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Checkbox: Do not show on startup */}
            <div className="pt-2 border-t border-bevel-shadow flex items-center justify-between">
              <label className="flex items-center space-x-1.5 text-[10px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-3.5 h-3.5 win-inset accent-titlebar-navy"
                />
                <span>Do not show this Setup Wizard on system startup</span>
              </label>
              <span className="font-mono text-[9px] text-[#777]">
                Step {currentStep} of 4
              </span>
            </div>
          </div>
        </div>

        {/* Wizard Footer Navigation Controls */}
        <div className="p-2 border-t-2 border-bevel-shadow bg-win-base flex items-center justify-between">
          <button
            onClick={() => alert('CryptoOS 98 Help: You can reopen this wizard anytime from the Start Menu > "System Onboarding Notice".')}
            className="win-btn px-3 py-1 text-[11px] font-bold active:translate-x-0.5 active:translate-y-0.5"
          >
            Help
          </button>

          <div className="flex items-center space-x-2">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="win-btn px-3 py-1 text-[11px] font-bold active:translate-x-0.5 active:translate-y-0.5"
              >
                &lt; Back
              </button>
            )}

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="win-btn bg-win-base text-black px-4 py-1 text-[11px] font-bold active:translate-x-0.5 active:translate-y-0.5"
              >
                Next &gt;
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="win-btn bg-[#008531] text-white px-4 py-1 text-[11px] font-bold flex items-center space-x-1 active:translate-x-0.5 active:translate-y-0.5 shadow-md"
              >
                <div className="border border-dotted border-white px-2 py-0.5 flex items-center space-x-1">
                  <span>⚡</span>
                  <span className="font-bold uppercase tracking-wider">
                    FINISH &amp; START
                  </span>
                </div>
              </button>
            )}

            <button
              onClick={handleFinish}
              className="win-btn px-3 py-1 text-[11px] font-bold active:translate-x-0.5 active:translate-y-0.5"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
