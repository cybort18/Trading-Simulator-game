import React, { useEffect } from 'react';
import { useSecurityStore } from '@/stores/useSecurityStore';

export const BSODModal: React.FC = () => {
  const isBSODActive = useSecurityStore((state) => state.isBSODActive);
  const violationReason = useSecurityStore((state) => state.violationReason);
  const recoverFromBSOD = useSecurityStore((state) => state.recoverFromBSOD);

  useEffect(() => {
    if (!isBSODActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Any keypress triggers recovery
      e.preventDefault();
      recoverFromBSOD();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBSODActive, recoverFromBSOD]);

  if (!isBSODActive) return null;

  return (
    <div
      onClick={recoverFromBSOD}
      className="fixed inset-0 z-[99999] bg-[#0000AA] text-white font-mono flex flex-col items-center justify-center p-6 cursor-pointer select-none overflow-auto"
      style={{ fontFamily: '"Fixedsys", "Courier New", monospace' }}
    >
      <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-6">
        {/* Classic Windows Title Badge */}
        <div className="bg-[#A8A8A8] text-[#0000AA] px-4 py-0.5 font-bold tracking-widest text-sm inline-block shadow">
          Windows
        </div>

        {/* Fatal Exception Notification */}
        <div className="text-left w-full space-y-4 text-xs md:text-sm leading-relaxed">
          <p className="font-bold text-[#FFFF55]">
            A fatal exception 0E has occurred at 0028:C0011E36 in VXD CRYPTO(01) + 00010E36.
          </p>
          <p>
            The current system integrity verification was terminated due to an unauthorized state modification.
          </p>

          <div className="bg-[#000088] border border-[#5555FF] p-3 text-left space-y-1 my-2">
            <div className="text-[#FFFF55] font-bold">FAULT AUDIT DETAILS:</div>
            <div className="text-[#FF5555] font-bold text-[11px] break-all">
              {violationReason || 'Data integrity check failed: Illegal equity tampering detected.'}
            </div>
            <div className="text-[#AAAAAA] text-[10px]">
              SECURITY HASH: 0x5F3759DF-TAMPER-FAULT-VXD-KERNEL
            </div>
          </div>

          <p className="pt-2">
            * Press any key or click anywhere to restore default state (10.00 USDT).
            <br />
            * Press CTRL+ALT+DEL to restart your browser workstation. Any unsaved fraudulent balances will be wiped.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              recoverFromBSOD();
            }}
            className="bg-[#A8A8A8] text-black font-bold px-6 py-1.5 border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] active:border-t-[#555] active:border-l-[#555] active:border-r-white active:border-b-white hover:bg-white"
          >
            [ REINITIALIZE CRYPTOOS KERNEL (10.00 USDT) ]
          </button>
        </div>
      </div>
    </div>
  );
};
