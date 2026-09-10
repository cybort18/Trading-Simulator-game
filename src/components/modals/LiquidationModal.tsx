import React, { useEffect } from 'react';
import { useTradingStore } from '@/stores/useTradingStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { PixelIcon } from '@/components/common/PixelIcon';
import { soundFXService } from '@/services/SoundFXService';

export const LiquidationModal: React.FC = () => {
  const isOpen = useTradingStore((state) => state.isLiquidationModalOpen);
  const latestLiq = useTradingStore((state) => state.latestLiquidation);
  const closeModal = useTradingStore((state) => state.closeLiquidationModal);

  const equity = useWalletStore((state) => state.equity);
  const claimFaucet = useWalletStore((state) => state.claimFaucet);
  const isFaucetAvailable = useWalletStore((state) => state.isFaucetAvailable());

  useEffect(() => {
    if (isOpen) {
      soundFXService.playLiquidationCrash();
    }
  }, [isOpen]);

  if (!isOpen || !latestLiq) return null;

  const handleClaimFaucet = () => {
    claimFaucet(10.00);
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      {/* Windows 98 Critical Error Dialog */}
      <div className="w-full max-w-md win-outset bg-win-base font-ui shadow-2xl animate-shake">
        {/* Titlebar with critical red banner */}
        <div className="bg-gradient-to-r from-[#880000] to-[#CC0000] px-2 py-1 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <PixelIcon name="warning" size={16} className="text-white" />
            <span className="text-white font-bold text-xs tracking-wider">
              FATAL ERROR: MARGIN CALL &amp; LIQUIDATION
            </span>
          </div>
          <button
            onClick={closeModal}
            className="win-outset bg-win-base px-1.5 py-0.5 text-xs font-bold active:win-inset leading-none"
          >
            ×
          </button>
        </div>

        {/* Content Box */}
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 win-inset bg-black flex items-center justify-center text-red-500 font-mono font-bold text-xl border-2 border-red-600">
              ☠
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-red-800">
                Position Liquidation Executed
              </h3>
              <p className="text-xs text-black font-medium leading-relaxed">
                The market price reached your liquidation threshold. Your allocated initial margin has been completely absorbed by the exchange liquidation pool.
              </p>
            </div>
          </div>

          {/* Audit Metrics Inset */}
          <div className="win-inset bg-black p-3 font-mono text-xs space-y-1.5 text-crt-green">
            <div className="flex justify-between">
              <span className="text-[#D0D0D0] font-semibold">CONTRACT:</span>
              <span className="font-bold text-white">{latestLiq.position.pair}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#D0D0D0] font-semibold">DIRECTION:</span>
              <span className={`font-bold ${latestLiq.position.direction === 'LONG' ? 'text-[#00FF66]' : 'text-[#FF4444]'}`}>
                {latestLiq.position.direction} ({latestLiq.position.leverage}x)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#D0D0D0] font-semibold">TRIGGER PRICE:</span>
              <span className="text-crt-amber font-bold">${latestLiq.liquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#D0D0D0] font-semibold">WIPED MARGIN:</span>
              <span className="text-[#FF3333] font-bold">-${latestLiq.wipedMargin.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between border-t border-gray-800 pt-1">
              <span className="text-[#D0D0D0] font-semibold">ACCOUNT EQUITY:</span>
              <span className={equity < 1.00 ? 'text-[#FF3333] font-bold' : 'text-white font-bold'}>
                ${equity.toFixed(2)} USDT
              </span>
            </div>
          </div>

          {/* Emergency Faucet Notice if Rekt */}
          {isFaucetAvailable && (
            <div className="win-inset bg-[#FFF9D2] border border-[#CCA000] p-2 text-xs text-[#664D00] flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <div>
                <strong>BANKRUPTCY IMMINENT:</strong> Balance under $1.00 USDT. Claim your emergency bailout package below.
              </div>
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-win-highlight">
            {isFaucetAvailable ? (
              <button
                onClick={handleClaimFaucet}
                className="win-outset bg-[#008080] text-white px-4 py-1.5 text-xs font-bold active:win-inset hover:brightness-110 shadow"
              >
                Claim Bailout (+10 USDT)
              </button>
            ) : null}
            <button
              onClick={closeModal}
              className="win-outset bg-win-base px-4 py-1.5 text-xs font-bold active:win-inset text-black"
            >
              Acknowledge &amp; Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
