import React, { useState, Suspense } from 'react';
import { useWindowStore } from '@/stores/useWindowStore';
import { WindowId } from '@/types/window';
import { PixelIcon } from '@/components/common/PixelIcon';
import { TurboTradeWindow } from '@/components/windows/TurboTradeWindow';
import { DegenVaultWindow } from '@/components/windows/DegenVaultWindow';
import { WelcomeModal } from '@/components/windows/WelcomeModal';
import { LiquidationModal } from '@/components/modals/LiquidationModal';
import { ResolutionGuard } from '@/components/common/ResolutionGuard';
import { RetroErrorBoundary } from '@/components/common/RetroErrorBoundary';
import { Taskbar } from '@/components/desktop/Taskbar';
import { soundFXService } from '@/services/SoundFXService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSecurityStore } from '@/stores/useSecurityStore';

// Lazy-loaded auxiliary windows & modals for optimal First Contentful Paint (FCP)
const ShareFlexCardModal = React.lazy(() =>
  import('@/components/windows/ShareFlexCardModal').then((m) => ({ default: m.ShareFlexCardModal }))
);
const ConnectWalletModal = React.lazy(() =>
  import('@/components/modals/ConnectWalletModal').then((m) => ({ default: m.ConnectWalletModal }))
);
const LeaderboardWindow = React.lazy(() =>
  import('@/components/windows/LeaderboardWindow').then((m) => ({ default: m.LeaderboardWindow }))
);
const BSODModal = React.lazy(() =>
  import('@/components/modals/BSODModal').then((m) => ({ default: m.BSODModal }))
);

interface DesktopIconConfig {
  id: WindowId | 'recycle_bin' | 'connect_wallet';
  label: string;
  icon: string;
  color: string;
}

const DESKTOP_ICONS: DesktopIconConfig[] = [
  { id: 'turbotrade', label: 'TurboTrade.exe', icon: 'candlestick', color: 'text-titlebar-navy' },
  { id: 'degenvault', label: 'DegenVault.exe', icon: 'wallet', color: 'text-titlebar-navy' },
  { id: 'leaderboard', label: 'Leaderboard.exe', icon: 'trophy', color: 'text-crt-amber' },
  { id: 'connect_wallet', label: 'ConnectWallet.exe', icon: 'zap', color: 'text-[#000080]' },
  { id: 'flexcard', label: 'ShareFlexCard.exe', icon: 'camera', color: 'text-[#555]' },
  { id: 'recycle_bin', label: 'Recycle Bin', icon: 'trash', color: 'text-[#666]' },
];

export const DesktopCanvas: React.FC = () => {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const openWindow = useWindowStore((state) => state.openWindow);
  const focusWindow = useWindowStore((state) => state.focusWindow);

  const isLeaderboardOpen = useWindowStore((state) => state.windows.leaderboard?.isOpen ?? false);
  const isFlexCardOpen = useWindowStore((state) => state.windows.flexcard?.isOpen ?? false);
  const isConnectModalOpen = useAuthStore((state) => state.isConnectModalOpen);
  const openConnectModal = useAuthStore((state) => state.openConnectModal);
  const isBSODActive = useSecurityStore((state) => state.isBSODActive);

  const handleIconClick = (e: React.MouseEvent, id: WindowId | 'recycle_bin' | 'connect_wallet') => {
    e.stopPropagation();
    setSelectedIcon(id);
  };

  const handleIconDoubleClick = (id: WindowId | 'recycle_bin' | 'connect_wallet') => {
    if (id === 'recycle_bin') {
      alert('Recycle Bin: 0 liquidated accounts in trash.');
      return;
    }
    if (id === 'connect_wallet') {
      openConnectModal();
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

      {isLeaderboardOpen && (
        <RetroErrorBoundary name="Leaderboard.exe">
          <Suspense fallback={null}>
            <LeaderboardWindow />
          </Suspense>
        </RetroErrorBoundary>
      )}

      <RetroErrorBoundary name="WelcomeModal">
        <WelcomeModal />
      </RetroErrorBoundary>

      {isFlexCardOpen && (
        <RetroErrorBoundary name="ShareFlexCard.exe">
          <Suspense fallback={null}>
            <ShareFlexCardModal />
          </Suspense>
        </RetroErrorBoundary>
      )}

      <RetroErrorBoundary name="LiquidationModal">
        <LiquidationModal />
      </RetroErrorBoundary>

      {isConnectModalOpen && (
        <RetroErrorBoundary name="ConnectWalletModal">
          <Suspense fallback={null}>
            <ConnectWalletModal />
          </Suspense>
        </RetroErrorBoundary>
      )}

      {/* Retro BSOD Anti-Tamper Crash Shield */}
      {isBSODActive && (
        <Suspense fallback={null}>
          <BSODModal />
        </Suspense>
      )}

      {/* Mobile/Tablet DOS Resolution Warning Guard */}
      <ResolutionGuard />

      {/* =================================================================== */}
      {/* FIXED RETRO TASKBAR & SYSTEM TRAY                                   */}
      {/* =================================================================== */}
      <Taskbar />
    </div>
  );
};
