import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Web3AuthService } from '@/services/Web3AuthService';
import { soundFXService } from '@/services/SoundFXService';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { PixelIcon } from '@/components/common/PixelIcon';

export const ConnectWalletModal: React.FC = () => {
  const isConnectModalOpen = useAuthStore((state) => state.isConnectModalOpen);
  const closeConnectModal = useAuthStore((state) => state.closeConnectModal);
  const openEditProfileModal = useAuthStore((state) => state.openEditProfileModal);
  const isConnected = useAuthStore((state) => state.isConnected);
  const isConnecting = useAuthStore((state) => state.isConnecting);
  const walletAddress = useAuthStore((state) => state.walletAddress);
  const username = useAuthStore((state) => state.username);
  const rankTier = useAuthStore((state) => state.rankTier);
  const xp = useAuthStore((state) => state.xp);
  const error = useAuthStore((state) => state.error);
  const connectWallet = useAuthStore((state) => state.connectWallet);
  const playAsGuest = useAuthStore((state) => state.playAsGuest);
  const disconnectWallet = useAuthStore((state) => state.disconnectWallet);
  const clearError = useAuthStore((state) => state.clearError);

  const [modemLog, setModemLog] = useState<string>('Modem Ready. Awaiting Web3 carrier signal...');
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const handleCloseModal = () => {
    if (isClosing) return;
    soundFXService.playKeyClick();
    setIsClosing(true);
    setTimeout(() => {
      closeConnectModal();
      setIsClosing(false);
    }, 180);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isConnecting) {
      setModemLog('ATDT 1-800-WEB3-DEGEN... Initializing Dial-Up carrier');

      timer = setTimeout(() => {
        setModemLog('Negotiating ECDSA secp256k1 keys with Browser Extension...');
      }, 900);
    } else if (isConnected && walletAddress) {
      setModemLog(`CARRIER 56000/V.90 CONNECTED: ${Web3AuthService.truncateAddress(walletAddress)}`);
    } else {
      setModemLog('Modem Ready. Awaiting Web3 carrier signal...');
    }
    return () => clearTimeout(timer);
  }, [isConnecting, isConnected, walletAddress]);

  if (!isConnectModalOpen) return null;

  const handleConnect = async () => {
    clearError();
    soundFXService.playKeyClick();
    const ok = await connectWallet();
    if (ok) {
      soundFXService.playClaimReward();
      setTimeout(() => {
        handleCloseModal();
      }, 1200);
    } else {
      soundFXService.playLeverageWarning();
    }
  };

  const handleGuest = () => {
    soundFXService.playKeyClick();
    playAsGuest();
    handleCloseModal();
  };

  const handleDisconnect = () => {
    soundFXService.playKeyClick();
    disconnectWallet();
  };

  const palette = walletAddress
    ? Web3AuthService.getAddressPalette(walletAddress)
    : { primary: '#000080', secondary: '#008531', accent: '#FFAA00' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 select-none font-ui p-4">
      {/* Modal Dialog Window */}
      <div className={`w-[460px] max-w-full window-outer-frame bg-win-base shadow-2xl flex flex-col ${isClosing ? 'animate-win-close' : 'animate-win-open'}`}>
        {/* Title Bar */}
        <div className="h-6 bg-titlebar-navy text-white flex items-center justify-between px-1.5 py-0.5 select-none">
          <div className="flex items-center space-x-1.5 min-w-0">
            <PixelIcon name="network" size={14} className="text-white flex-shrink-0" />
            <span className="font-headline font-bold text-[12px] truncate">
              Dial-Up Networking - Web3 Cryptographic Adapter
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleCloseModal}
              className="win-btn px-1.5 h-4 flex items-center justify-center text-black font-bold text-[10px] bg-win-base leading-none hover:bg-error hover:text-white"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Dialog Body */}
        <div className="p-3 flex flex-col gap-3 text-black text-[11px]">
          {/* Header Description & Hardware Icon */}
          <div className="flex items-center space-x-3 bg-white p-2.5 win-inset">
            <div className="w-10 h-10 win-inset bg-[#E0E0E0] flex items-center justify-center flex-shrink-0">
              <PixelIcon
                name={isConnected ? 'check' : isConnecting ? 'radio' : 'network'}
                size={22}
                className={isConnected ? 'text-[#008531]' : isConnecting ? 'text-titlebar-navy animate-pulse' : 'text-[#555]'}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-headline font-bold text-[13px] text-black">
                {isConnected
                  ? 'Cryptographic Session Active'
                  : 'Connect to Web3 Cloud Terminal'}
              </div>
              <div className="text-[10px] text-[#444] font-mono leading-tight">
                Adapter: EIP-1193 / Sign-In with Ethereum (SIWE) • Zero Gas
              </div>
            </div>
          </div>

          {/* Modem Line & Baud Rate Readout Panel */}
          <div className="win-inset-deep bg-black text-crt-bullish p-2.5 font-mono text-[10.5px] flex flex-col gap-1">
            <div className="flex justify-between items-center text-[#888] text-[9.5px] border-b border-[#333] pb-1">
              <span>PORT: COM1 (0x3F8, IRQ4)</span>
              <span>BAUD: 56,000 bps • V.90</span>
            </div>
            <div className="flex items-center space-x-2 py-0.5">
              <span className={`w-2 h-2 ${isConnected ? 'bg-crt-bullish' : isConnecting ? 'bg-crt-amber animate-ping' : 'bg-[#555]'}`}></span>
              <span className="truncate">{modemLog}</span>
            </div>
            <div className="text-[9px] text-[#A0A0A0] flex justify-between pt-1 border-t border-[#222]">
              <span>DB CLOUD: {isSupabaseConfigured ? 'ONLINE (SUPABASE PG)' : 'OFFLINE (LOCAL STORAGE)'}</span>
              <span>STATE: {isConnected ? 'AUTHENTICATED' : 'ANONYMOUS'}</span>
            </div>
          </div>

          {/* Connected Profile Details or Error Message */}
          {error && (
            <div className="bg-[#FFF4E5] border-2 border-[#FFAA00] p-2 flex items-start space-x-2 text-[#805000]">
              <PixelIcon name="warning" size={16} className="text-[#805000] flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-[10px] font-mono">
                <strong className="block text-[11px] font-bold">Authentication Exception:</strong>
                {error}
              </div>
            </div>
          )}

          {isConnected && walletAddress && (
            <div className="win-outset bg-surface-high p-2 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                {/* Deterministic Pixel Blockie */}
                <div
                  className="w-8 h-8 win-inset flex items-center justify-center font-mono font-bold text-white text-[11px]"
                  style={{ backgroundColor: palette.primary, borderColor: palette.accent }}
                >
                  {walletAddress.substring(2, 4).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-[12px] text-black">{username}</span>
                    <span className="bg-[#008531] text-white text-[8px] font-bold px-1 win-outset">
                      VERIFIED
                    </span>
                  </div>
                  <div className="font-mono text-[9px] text-[#333]">
                    Address: {Web3AuthService.truncateAddress(walletAddress)}
                  </div>
                </div>
              </div>

              <div className="text-right font-mono text-[9px]">
                <div className="text-titlebar-navy font-bold">{rankTier}</div>
                <div className="text-[#555]">XP: {xp}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-1 border-t border-bevel-shadow">
            {!isConnected ? (
              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={handleGuest}
                  className="win-btn px-3 py-1 text-[11px] font-bold text-black active:translate-x-0.5 active:translate-y-0.5"
                >
                  Play as Guest
                </button>
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="win-btn bg-titlebar-navy hover:bg-[#0000A0] text-white px-3 py-1 text-[11px] font-bold flex items-center space-x-1 active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
                >
                  <span>{isConnecting ? 'Dialing & Signing...' : 'Connect MetaMask / Web3'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  onClick={handleDisconnect}
                  className="win-btn text-error hover:bg-error hover:text-white px-2.5 py-1 text-[10px] font-bold active:translate-x-0.5 active:translate-y-0.5"
                >
                  Disconnect Wallet
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      soundFXService.playKeyClick();
                      openEditProfileModal();
                    }}
                    className="win-btn bg-win-base text-black px-3 py-1 text-[11px] font-bold flex items-center space-x-1 active:translate-x-0.5 active:translate-y-0.5 hover:bg-surface-high"
                  >
                    <PixelIcon name="user" size={12} className="text-titlebar-navy" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="win-btn bg-win-base text-black px-4 py-1 text-[11px] font-bold active:translate-x-0.5 active:translate-y-0.5"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
