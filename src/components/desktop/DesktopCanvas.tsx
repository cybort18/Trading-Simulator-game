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
import { Web3AuthService } from '@/services/Web3AuthService';

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
const OrderBookWindow = React.lazy(() =>
  import('@/components/windows/OrderBookWindow').then((m) => ({ default: m.OrderBookWindow }))
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
  { id: 'orderbook', label: 'OrderBook.exe', icon: 'layers', color: 'text-[#008531]' },
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
  const isOrderBookOpen = useWindowStore((state) => state.windows.orderbook?.isOpen ?? false);
  const isFlexCardOpen = useWindowStore((state) => state.windows.flexcard?.isOpen ?? false);
  const isConnectModalOpen = useAuthStore((state) => state.isConnectModalOpen);
  const openConnectModal = useAuthStore((state) => state.openConnectModal);
  const isConnected = useAuthStore((state) => state.isConnected);
  const walletAddress = useAuthStore((state) => state.walletAddress);
  const username = useAuthStore((state) => state.username);
  const isBSODActive = useSecurityStore((state) => state.isBSODActive);

  const palette = walletAddress
    ? Web3AuthService.getAddressPalette(walletAddress)
    : { primary: '#000080', secondary: '#008531', accent: '#FFAA00' };

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
      {/* TOP-RIGHT FLOATING WALLET ACTION CHIP (High Visibility Header)     */}
      {/* =================================================================== */}
      <div className="fixed top-2.5 right-3 z-40 flex items-center space-x-2 select-none font-ui">
        <button
          onClick={(e) => {
            e.stopPropagation();
            soundFXService.playKeyClick();
            openConnectModal();
          }}
          className={`win-btn win-outset px-2.5 py-1.5 flex items-center space-x-2 shadow-xl cursor-pointer group active:translate-x-0.5 active:translate-y-0.5 ${
            isConnected
              ? 'bg-win-base hover:bg-win-pressed'
              : 'bg-win-base hover:bg-[#D5D5D5] border-2 border-bevel-highlight ring-1 ring-bevel-dark'
          }`}
          title={
            isConnected && walletAddress
              ? `Connected: ${walletAddress}\nClick to view profile or disconnect.`
              : 'Guest Mode: Progress is not saved to cloud.\nClick to connect Web3 wallet!'
          }
        >
          {isConnected && walletAddress ? (
            <>
              {/* Connected Blockie Pixel Box */}
              <div
                className="w-5 h-5 win-inset flex items-center justify-center font-mono font-bold text-white text-[9px] shadow-sm flex-shrink-0"
                style={{ backgroundColor: palette.primary, borderColor: palette.accent }}
              >
                {walletAddress.substring(2, 4).toUpperCase()}
              </div>

              {/* Username / Truncated Address */}
              <div className="flex flex-col text-left leading-tight">
                <span className="font-bold text-[11px] text-black group-hover:text-titlebar-navy">
                  {username || Web3AuthService.truncateAddress(walletAddress)}
                </span>
                <span className="text-[9px] text-[#555] font-mono">
                  {Web3AuthService.truncateAddress(walletAddress)}
                </span>
              </div>

              {/* Verified Online Status Chip */}
              <div className="win-inset bg-[#0a1a0e] px-1.5 py-0.5 flex items-center space-x-1 font-mono text-[9px]">
                <span className="w-2 h-2 rounded-full bg-crt-bullish animate-pulse"></span>
                <span className="text-[#00FF66] font-bold">ONLINE</span>
              </div>
            </>
          ) : (
            <>
              {/* Disconnected / Guest Icon */}
              <div className="w-5 h-5 win-inset bg-titlebar-navy flex items-center justify-center text-white text-[10px] font-bold shadow-sm flex-shrink-0">
                ⚡
              </div>

              {/* Call-to-Action Text */}
              <div className="flex flex-col text-left leading-tight">
                <span className="font-bold text-[11px] text-black group-hover:text-titlebar-navy flex items-center space-x-1">
                  <span>Connect Wallet</span>
                  <span className="text-[9px] text-titlebar-navy">►</span>
                </span>
                <span className="text-[9px] text-crt-amber font-bold font-mono">
                  SAVE PROGRESS
                </span>
              </div>

              {/* Guest Indicator Chip */}
              <div className="win-inset bg-[#1a140a] px-1.5 py-0.5 flex items-center space-x-1 font-mono text-[9px]">
                <span className="w-2 h-2 rounded-full bg-crt-amber animate-pulse"></span>
                <span className="text-amber-400 font-bold">GUEST</span>
              </div>
            </>
          )}
        </button>
      </div>

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

      {isOrderBookOpen && (
        <RetroErrorBoundary name="OrderBook.exe">
          <Suspense fallback={null}>
            <OrderBookWindow />
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
