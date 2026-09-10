import React, { useState } from 'react';
import { useWindowStore } from '@/stores/useWindowStore';
import { WindowId } from '@/types/window';
import { PixelIcon } from '@/components/common/PixelIcon';
import { TurboTradeWindow } from '@/components/windows/TurboTradeWindow';
import { DegenVaultWindow } from '@/components/windows/DegenVaultWindow';
import { LeaderboardWindow } from '@/components/windows/LeaderboardWindow';
import { WelcomeModal } from '@/components/windows/WelcomeModal';
import { ShareFlexCardModal } from '@/components/windows/ShareFlexCardModal';
import { LiquidationModal } from '@/components/modals/LiquidationModal';
import { BSODModal } from '@/components/modals/BSODModal';
import { ResolutionGuard } from '@/components/common/ResolutionGuard';
import { RetroErrorBoundary } from '@/components/common/RetroErrorBoundary';
import { Taskbar } from '@/components/desktop/Taskbar';
import { soundFXService } from '@/services/SoundFXService';

interface DesktopIconConfig {
  id: WindowId | 'recycle_bin';
  label: string;
  icon: string;
  color: string;
}

const DESKTOP_ICONS: DesktopIconConfig[] = [
  { id: 'turbotrade', label: 'TurboTrade.exe', icon: 'candlestick', color: 'text-titlebar-navy' },
  { id: 'degenvault', label: 'DegenVault.exe', icon: 'wallet', color: 'text-titlebar-navy' },
  { id: 'leaderboard', label: 'Leaderboard.exe', icon: 'trophy', color: 'text-crt-amber' },
  { id: 'flexcard', label: 'ShareFlexCard.exe', icon: 'camera', color: 'text-[#555]' },
  { id: 'recycle_bin', label: 'Recycle Bin', icon: 'trash', color: 'text-[#666]' },
];

export const DesktopCanvas: React.FC = () => {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const openWindow = useWindowStore((state) => state.openWindow);
  const focusWindow = useWindowStore((state) => state.focusWindow);

  const handleIconClick = (e: React.MouseEvent, id: WindowId | 'recycle_bin') => {
    e.stopPropagation();
    setSelectedIcon(id);
  };

  const handleIconDoubleClick = (id: WindowId | 'recycle_bin') => {
    if (id === 'recycle_bin') {
      alert('Recycle Bin: 0 liquidated accounts in trash.');
      return;
    }
    openWindow(id);
    focusWindow(id);
  };

  return (
    <div
      onMouseDown={() => setSelectedIcon(null)}
      onClickCapture={(e) => {
        const target = e.target as HTMLElement | null;
        if (target && target.closest('button, .win-btn, .win-outset, input[type="range"]')) {
          soundFXService.playKeyClick();
        }
      }}
      className="relative w-screen h-screen bg-desktop-teal overflow-hidden select-none font-ui"
    >
      {/* =================================================================== */}
      {/* DESKTOP ICONS GRID (Left Dock)                                      */}
      {/* =================================================================== */}
      <div className="absolute left-3 top-3 flex flex-col gap-4 z-10 w-24">
        {DESKTOP_ICONS.map((item) => {
          const isSelected = selectedIcon === item.id;

          return (
            <div
              key={item.id}
              onClick={(e) => handleIconClick(e, item.id)}
              onDoubleClick={() => handleIconDoubleClick(item.id)}
              className="flex flex-col items-center group cursor-pointer w-20 py-1"
            >
              {/* 3D Outset Icon Box */}
              <div
                className={`w-10 h-10 flex items-center justify-center mb-1 ${
                  isSelected
                    ? 'win-inset bg-titlebar-navy outline outline-1 outline-dotted outline-white'
                    : 'win-outset bg-win-base group-hover:brightness-110'
                }`}
              >
                <PixelIcon
                  name={item.icon}
                  size={24}
                  className={isSelected ? 'text-white' : item.color}
                />
              </div>

              {/* Icon Label */}
              <span
                className={`text-[10px] text-center px-1 leading-tight tracking-normal ${
                  isSelected
                    ? 'bg-titlebar-navy text-white border border-dotted border-white'
                    : 'text-white drop-shadow-[1px_1px_1px_#000]'
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* FLOATING RETRO APPLICATION WINDOWS WITH FAULT ISOLATION */}
      <RetroErrorBoundary name="TurboTrade.exe">
        <TurboTradeWindow />
      </RetroErrorBoundary>

      <RetroErrorBoundary name="DegenVault.exe">
        <DegenVaultWindow />
      </RetroErrorBoundary>

      <RetroErrorBoundary name="Leaderboard.exe">
        <LeaderboardWindow />
      </RetroErrorBoundary>

      <RetroErrorBoundary name="WelcomeModal">
        <WelcomeModal />
      </RetroErrorBoundary>

      <RetroErrorBoundary name="ShareFlexCard.exe">
        <ShareFlexCardModal />
      </RetroErrorBoundary>

      <RetroErrorBoundary name="LiquidationModal">
        <LiquidationModal />
      </RetroErrorBoundary>

      {/* Retro BSOD Anti-Tamper Crash Shield */}
      <BSODModal />

      {/* Mobile/Tablet DOS Resolution Warning Guard */}
      <ResolutionGuard />

      {/* =================================================================== */}
      {/* FIXED RETRO TASKBAR & SYSTEM TRAY                                   */}
      {/* =================================================================== */}
      <Taskbar />
    </div>
  );
};
