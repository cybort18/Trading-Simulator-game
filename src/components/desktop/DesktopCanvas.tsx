import React, { Suspense } from 'react';
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
const EditProfileModal = React.lazy(() =>
  import('@/components/modals/EditProfileModal').then((m) => ({ default: m.EditProfileModal }))
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
  { id: 'leaderboard', label: 'Leaderboard.exe', icon: 'trophy', color: 'text-[#b45309]' },
  { id: 'connect_wallet', label: 'ConnectWallet.exe', icon: 'wallet', color: 'text-[#000080]' },
  { id: 'flexcard', label: 'ShareFlexCard.exe', icon: 'camera', color: 'text-[#444]' },
  { id: 'recycle_bin', label: 'Recycle Bin', icon: 'trash', color: 'text-[#555]' },
];

export const DesktopCanvas: React.FC = () => {
  const openWindow = useWindowStore((state) => state.openWindow);
  const focusWindow = useWindowStore((state) => state.focusWindow);

  const isLeaderboardOpen = useWindowStore((state) => state.windows.leaderboard?.isOpen ?? false);
  const isOrderBookOpen = useWindowStore((state) => state.windows.orderbook?.isOpen ?? false);
  const isFlexCardOpen = useWindowStore((state) => state.windows.flexcard?.isOpen ?? false);
  const isConnectModalOpen = useAuthStore((state) => state.isConnectModalOpen);
  const isEditProfileOpen = useAuthStore((state) => state.isEditProfileOpen);
  const openConnectModal = useAuthStore((state) => state.openConnectModal);
  const isConnected = useAuthStore((state) => state.isConnected);
  const walletAddress = useAuthStore((state) => state.walletAddress);
  const username = useAuthStore((state) => state.username);
  const isBSODActive = useSecurityStore((state) => state.isBSODActive);

  const palette = walletAddress
    ? Web3AuthService.getAddressPalette(walletAddress)
    : { primary: '#000080', secondary: '#008531', accent: '#FFAA00' };

  const handleLaunchApp = (id: WindowId | 'recycle_bin' | 'connect_wallet') => {
    soundFXService.playKeyClick();
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
      onClickCapture={(e) => {
        const target = e.target as HTMLElement | null;
        if (target && target.closest('button, .win-btn, .win-outset, input[type="range"]')) {
          soundFXService.playKeyClick();
        }
      }}
      className="relative w-screen h-screen bg-desktop-teal overflow-hidden select-none font-ui"
    >
      {/* =================================================================== */}
      {/* TOP-RIGHT WALLET ACTION BUTTON (Authentic Retro Windows 98 Style)  */}
      {/* =================================================================== */}
      <div className="fixed top-2.5 right-3 z-40 flex items-center select-none font-ui">
        <button
          onClick={(e) => {
            e.stopPropagation();
            soundFXService.playKeyClick();
            openConnectModal();
          }}
          className="win-btn win-outset px-2.5 py-1.5 flex items-center space-x-2 bg-win-base hover:bg-[#d8d8d8] active:win-inset active:translate-x-0.5 active:translate-y-0.5 shadow-md cursor-pointer transition-colors"
          title={
            isConnected && walletAddress
              ? `Connected: ${walletAddress}\nClick to view profile or disconnect.`
              : 'Connect Web3 Wallet (Guest Mode)'
          }
        >
          {isConnected && walletAddress ? (
            <>
              {/* Deterministic Pixel Blockie */}
              <div
                className="w-4 h-4 win-inset flex items-center justify-center font-mono font-bold text-white text-[9px] shadow-sm flex-shrink-0"
                style={{ backgroundColor: palette.primary }}
              >
                {walletAddress.substring(2, 4).toUpperCase()}
              </div>

              {/* Username / Truncated Address */}
              <span className="font-bold text-[11px] text-black tracking-tight">
                {username || Web3AuthService.truncateAddress(walletAddress)}
              </span>

              {/* Clean Online Status Tag */}
              <span className="text-[9px] font-mono px-1.5 py-0.5 win-inset bg-[#e6f4ea] text-[#006622] font-bold">
                ONLINE
              </span>
            </>
          ) : (
            <>
              {/* Clean Lucide Vector Icon */}
              <PixelIcon name="wallet" size={15} className="text-titlebar-navy flex-shrink-0" />

              {/* High-Contrast Crisp Black Label */}
              <span className="font-bold text-[11px] text-black tracking-tight">
                Connect Wallet
              </span>

              {/* Clean Sunken Bevel Guest Status Pill */}
              <span className="text-[9px] font-mono px-1.5 py-0.5 win-inset bg-[#d0d0d0] text-[#444444] font-semibold">
                Guest
              </span>
            </>
          )}
        </button>
      </div>

      {/* =================================================================== */}
      {/* DESKTOP ICONS GRID (Left Dock with Single-Click Launch & Tactile Press) */}
      {/* =================================================================== */}
      <div className="absolute left-3 top-3 flex flex-col gap-3.5 z-10 w-24">
        {DESKTOP_ICONS.map((item) => (
          <button
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              handleLaunchApp(item.id);
            }}
            className="flex flex-col items-center group cursor-pointer w-20 py-1 focus:outline-none select-none transition-transform active:translate-x-0.5 active:translate-y-0.5 active:scale-95"
            title={`Launch ${item.label}`}
          >
            {/* 3D Outset Icon Box with Tactile Bevel Press on Click */}
            <div className="w-10 h-10 flex items-center justify-center mb-1 win-outset bg-win-base group-hover:bg-[#dcdcdc] group-active:win-inset group-active:bg-[#b0b0b0] shadow-sm transition-colors">
              <PixelIcon
                name={item.icon}
                size={22}
                className={`${item.color} group-hover:scale-105 group-active:scale-95 transition-transform`}
              />
            </div>

            {/* Clean Icon Label - Crisp drop-shadow, no dotted selection box */}
            <span className="text-[11px] text-center px-1 leading-tight tracking-normal text-white font-medium drop-shadow-[1px_1px_2px_#000000] group-hover:text-amber-200 transition-colors">
              {item.label}
            </span>
          </button>
        ))}
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

      {isEditProfileOpen && (
        <RetroErrorBoundary name="EditProfileModal">
          <Suspense fallback={null}>
            <EditProfileModal />
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
