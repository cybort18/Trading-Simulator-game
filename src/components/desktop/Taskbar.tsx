import React, { useState, useEffect } from 'react';
import { useWindowStore } from '@/stores/useWindowStore';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { WindowId } from '@/types/window';
import { PixelIcon } from '@/components/common/PixelIcon';

export const Taskbar: React.FC = () => {
  const windows = useWindowStore((state) => state.windows);
  const activeWindowId = useWindowStore((state) => state.activeWindowId);
  const openWindow = useWindowStore((state) => state.openWindow);
  const focusWindow = useWindowStore((state) => state.focusWindow);
  const minimizeWindow = useWindowStore((state) => state.minimizeWindow);

  const connectionStatus = useMarketDataStore((state) => state.connectionStatus);
  const pingLatency = useMarketDataStore((state) => state.pingLatency);

  const [isStartOpen, setIsStartOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Digital clock updating every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTabClick = (id: WindowId) => {
    const target = windows[id];
    if (!target) return;

    if (activeWindowId === id && !target.isMinimized) {
      minimizeWindow(id);
    } else {
      openWindow(id);
      focusWindow(id);
    }
  };

  const handleStartAppClick = (id: WindowId) => {
    openWindow(id);
    focusWindow(id);
    setIsStartOpen(false);
  };

  // Close start menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#start-menu') && !target.closest('#start-button')) {
        setIsStartOpen(false);
      }
    };
    if (isStartOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isStartOpen]);

  return (
    <>
      {/* =================================================================== */}
      {/* CLASSIC WINDOWS 98 START MENU POPUP                                 */}
      {/* =================================================================== */}
      {isStartOpen && (
        <div
          id="start-menu"
          className="fixed bottom-[36px] left-0 w-[240px] window-outer-frame bg-win-base z-50 shadow-2xl flex select-none font-ui"
        >
          {/* Vertical Blue Banner */}
          <div className="w-8 bg-titlebar-navy flex flex-col justify-end items-center pb-3 text-white">
            <span
              className="font-headline font-bold text-[14px] tracking-widest uppercase rotate-[-90deg] whitespace-nowrap"
              style={{ transformOrigin: 'center center' }}
            >
              CryptoOS 98
            </span>
          </div>

          {/* Menu Items */}
          <div className="flex-1 flex flex-col p-1 text-black text-[11px]">
            <button
              onClick={() => handleStartAppClick('turbotrade')}
              className="flex items-center space-x-2 px-2 py-1.5 hover:bg-titlebar-navy hover:text-white transition-none text-left"
            >
              <PixelIcon name="candlestick" size={18} className="text-[#008531]" />
              <div className="flex flex-col">
                <span className="font-bold">TurboTrade.exe</span>
                <span className="text-[9px] opacity-75">Futures Trading Terminal</span>
              </div>
            </button>

            <button
              onClick={() => handleStartAppClick('degenvault')}
              className="flex items-center space-x-2 px-2 py-1.5 hover:bg-titlebar-navy hover:text-white transition-none text-left"
            >
              <PixelIcon name="wallet" size={18} className="text-titlebar-navy" />
              <div className="flex flex-col">
                <span className="font-bold">DegenVault.exe</span>
                <span className="text-[9px] opacity-75">Wallet & Daily Claims</span>
              </div>
            </button>

            <button
              onClick={() => handleStartAppClick('leaderboard')}
              className="flex items-center space-x-2 px-2 py-1.5 hover:bg-titlebar-navy hover:text-white transition-none text-left"
            >
              <PixelIcon name="trophy" size={18} className="text-crt-amber" />
              <div className="flex flex-col">
                <span className="font-bold">Leaderboard.exe</span>
                <span className="text-[9px] opacity-75">Global PnL Arena</span>
              </div>
            </button>

            <button
              onClick={() => handleStartAppClick('flexcard')}
              className="flex items-center space-x-2 px-2 py-1.5 hover:bg-titlebar-navy hover:text-white transition-none text-left"
            >
              <PixelIcon name="camera" size={18} className="text-[#666]" />
              <div className="flex flex-col">
                <span className="font-bold">ShareFlexCard.exe</span>
                <span className="text-[9px] opacity-75">Export Brag Card</span>
              </div>
            </button>

            <div className="h-[1px] bg-bevel-shadow my-1"></div>

            <button
              onClick={() => handleStartAppClick('welcome')}
              className="flex items-center space-x-2 px-2 py-1.5 hover:bg-titlebar-navy hover:text-white transition-none text-left"
            >
              <PixelIcon name="warning" size={18} className="text-crt-amber" />
              <span>System Onboarding Notice</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Reset entire system state and restart with 10.00 USDT?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="flex items-center space-x-2 px-2 py-1.5 hover:bg-error hover:text-white transition-none text-left"
            >
              <PixelIcon name="trash" size={18} className="text-error" />
              <span>Restart / Wipe System State</span>
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* FIXED 36PX TASKBAR                                                  */}
      {/* =================================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 h-taskbar-height bg-win-base border-t-2 border-bevel-highlight border-b border-bevel-dark flex items-center justify-between px-1 z-50 select-none font-ui text-[11px]">
        {/* Left Section: Start Button + Window Tabs */}
        <div className="flex items-center space-x-1 overflow-hidden">
          {/* Classic Start Button */}
          <button
            id="start-button"
            onClick={() => setIsStartOpen(!isStartOpen)}
            className={`px-2 py-1 flex items-center space-x-1.5 font-bold text-black ${
              isStartOpen ? 'win-btn-pressed bg-win-pressed' : 'win-btn bg-win-base'
            }`}
          >
            {/* 4-Color Windows-esque Flag Pixel Glyph */}
            <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5 rotate-[-5deg]">
              <div className="bg-[#FF3333]"></div>
              <div className="bg-[#008531]"></div>
              <div className="bg-[#000080]"></div>
              <div className="bg-[#FFAA00]"></div>
            </div>
            <span className="tracking-wide">Start</span>
          </button>

          {/* Divider */}
          <div className="h-5 w-[2px] bg-bevel-shadow mx-1 border-r border-bevel-highlight"></div>

          {/* Opened Window Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto">
            {(Object.keys(windows) as WindowId[])
              .filter((id) => windows[id].isOpen)
              .map((id) => {
                const w = windows[id];
                const isTabActive = activeWindowId === id && !w.isMinimized;

                return (
                  <button
                    key={id}
                    onClick={() => handleTabClick(id)}
                    className={`px-2 py-1 flex items-center space-x-1.5 max-w-[180px] text-black ${
                      isTabActive
                        ? 'win-btn-pressed bg-win-pressed font-bold'
                        : 'win-btn bg-win-base font-normal'
                    }`}
                  >
                    <PixelIcon name={w.icon} size={13} className="flex-shrink-0" />
                    <span className="truncate text-[10px] leading-none">{w.title.split(' - ')[0]}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Right Section: System Tray */}
        <div className="win-inset px-2 py-0.5 bg-win-base flex items-center space-x-2.5 font-mono text-[10px] flex-shrink-0">
          {/* WS Live Indicator */}
          <div className="flex items-center space-x-1 font-bold">
            <span className="text-bevel-dark">WS</span>
            {connectionStatus === 'CONNECTED' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-crt-bullish animate-pulse"></span>
                <span className="text-[#008531]">LIVE</span>
                <span className="text-[9px] text-[#555]">[{pingLatency}ms]</span>
              </>
            ) : connectionStatus === 'RECONNECTING' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-crt-amber animate-ping"></span>
                <span className="text-crt-amber">RECONNECTING...</span>
              </>
            ) : connectionStatus === 'CONNECTING' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-crt-amber animate-pulse"></span>
                <span className="text-crt-amber">CONNECTING</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-crt-bearish"></span>
                <span className="text-crt-bearish">OFFLINE</span>
              </>
            )}
          </div>

          {/* Quick Balance */}
          <div className="border-l border-bevel-shadow pl-2 flex items-center space-x-1 font-bold">
            <span className="text-bevel-shadow font-normal">BAL:</span>
            <span className="text-titlebar-navy">16.71</span>
            <span className="text-[8px] text-bevel-shadow">USDT</span>
          </div>

          {/* Audio Speaker Icon Toggle */}
          <div
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="border-l border-bevel-shadow pl-2 flex items-center cursor-pointer text-black"
            title={soundEnabled ? 'Audio On' : 'Audio Muted'}
          >
            <PixelIcon name={soundEnabled ? 'volume_on' : 'volume_off'} size={14} />
          </div>

          {/* Digital 24H Clock */}
          <div className="border-l border-bevel-shadow pl-2 text-black font-bold font-mono">
            {timeStr || '12:00'}
          </div>
        </div>
      </nav>
    </>
  );
};
