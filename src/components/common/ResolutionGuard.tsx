import React, { useState, useEffect } from 'react';
import { soundFXService } from '@/services/SoundFXService';

const RESOLUTION_BYPASS_KEY = 'CRYPTOOS_98_RESOLUTION_BYPASS';

export const ResolutionGuard: React.FC = () => {
  const [isNarrow, setIsNarrow] = useState<boolean>(false);
  const [isBypassed, setIsBypassed] = useState<boolean>(false);
  const [blink, setBlink] = useState<boolean>(true);

  useEffect(() => {
    // Check if user already bypassed warning in this session
    if (typeof window !== 'undefined') {
      const bypassed = window.sessionStorage?.getItem(RESOLUTION_BYPASS_KEY) === 'true';
      if (bypassed) {
        setIsBypassed(true);
      }
    }

    const checkResolution = () => {
      if (typeof window !== 'undefined') {
        setIsNarrow(window.innerWidth < 768);
      }
    };

    checkResolution();
    window.addEventListener('resize', checkResolution);
    return () => window.removeEventListener('resize', checkResolution);
  }, []);

  // Blinking terminal cursor
  useEffect(() => {
    const timer = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(timer);
  }, []);

  const handleBypass = () => {
    soundFXService.playKeyClick();
    setIsBypassed(true);
    try {
      window.sessionStorage?.setItem(RESOLUTION_BYPASS_KEY, 'true');
    } catch {
      // Safe catch
    }
  };

  if (!isNarrow || isBypassed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[99998] bg-black text-[#AAAAAA] font-mono p-6 flex flex-col justify-between select-none overflow-y-auto">
      <div className="space-y-4 max-w-xl mx-auto w-full pt-4 text-xs md:text-sm">
        {/* BIOS Header */}
        <div className="border-b border-[#555555] pb-2 text-white flex justify-between">
          <span>AWARD MODULAR BIOS v4.51PG, An Energy Star Ally</span>
          <span>09/10/98</span>
        </div>

        <div className="text-[#55FF55] font-bold">
          CryptoOS 98 Graphical User Interface &amp; Trading Subsystem
        </div>

        <div className="space-y-1 text-[#CCCCCC]">
          <p>Main Processor: PENTIUM-II (MMX) 450MHz</p>
          <p>Memory Testing: 131072K OK</p>
          <p>Primary Master: QUANTUM FIREBALL CR 8.4GB</p>
          <p>Video Controller: S3 Trio64V+ (2MB VRAM)</p>
        </div>

        {/* Resolution Error Alert Box */}
        <div className="border-2 border-[#AA0000] bg-[#1A0000] p-4 text-[#FF5555] space-y-2 mt-4">
          <div className="font-bold text-white uppercase tracking-wider">
            *** HARDWARE CONFIGURATION WARNING ***
          </div>
          <p className="font-bold">
            Error: Display adapter resolution insufficient (VGA 640x480 or mobile viewport detected).
          </p>
          <p className="text-[#FFAAAA] text-xs">
            Optimal resolution: 1024x768 (SVGA) or higher. High-density order book, real-time candlestick streams, and multi-window multitasking require a wider viewport for optimal trade execution.
          </p>
        </div>

        <div className="space-y-2 text-white pt-2">
          <p className="text-[#FFFF55]">
            RECOMMENDED ACTIONS:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-[#DDDDDD]">
            <li>Rotate your device to Landscape mode.</li>
            <li>Zoom out in your browser settings (75% or 50%).</li>
            <li>Open this trading terminal on a desktop workstation.</li>
          </ul>
        </div>

        <div className="pt-2 text-xs text-[#888888]">
          ROM BIOS POST CHECK COMPLETED.
          <span className="inline-block ml-1">{blink ? '█' : ' '}</span>
        </div>
      </div>

      {/* Bypass Action Button */}
      <div className="max-w-xl mx-auto w-full pt-6 pb-4">
        <button
          onClick={handleBypass}
          className="w-full bg-[#333333] hover:bg-[#555555] active:bg-[#222222] text-white border-2 border-t-[#888888] border-l-[#888888] border-r-black border-b-black font-bold py-2.5 px-4 text-xs tracking-wider uppercase transition-none shadow"
        >
          [ Continue Anyway at Your Own Risk ]
        </button>
        <p className="text-center text-[10px] text-[#666666] pt-1">
          Pressing continue will load the Windows 98 desktop with horizontal pan capability.
        </p>
      </div>
    </div>
  );
};
