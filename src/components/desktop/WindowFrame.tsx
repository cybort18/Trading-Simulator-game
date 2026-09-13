import React, { useRef, useState, useCallback, useEffect } from 'react';
import { WindowId } from '@/types/window';
import { useWindowStore } from '@/stores/useWindowStore';
import { PixelIcon } from '@/components/common/PixelIcon';

import { soundFXService } from '@/services/SoundFXService';

export interface WindowMenuAction {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

export interface WindowMenuCategory {
  name: string;
  items: WindowMenuAction[];
}

export interface WindowFrameProps {
  id: WindowId;
  children: React.ReactNode;
  menuItems?: string[];
  menus?: WindowMenuCategory[];
  statusContent?: React.ReactNode;
  hasHelp?: boolean;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  id,
  children,
  menuItems = ['File', 'Edit', 'View', 'Options', 'Help'],
  menus,
  statusContent,
  hasHelp = true,
}) => {
  const windowState = useWindowStore((state) => state.windows[id]);
  const activeWindowId = useWindowStore((state) => state.activeWindowId);
  const focusWindow = useWindowStore((state) => state.focusWindow);
  const closeWindow = useWindowStore((state) => state.closeWindow);
  const minimizeWindow = useWindowStore((state) => state.minimizeWindow);
  const maximizeWindow = useWindowStore((state) => state.maximizeWindow);
  const updatePosition = useWindowStore((state) => state.updatePosition);

  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });
  const rafRef = useRef<number | null>(null);
  const pendingPosRef = useRef<{ x: number; y: number } | null>(null);

  const isMaximized = windowState?.isMaximized ?? false;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only left click initiates dragging
    if (e.button !== 0 || !windowState) return;
    focusWindow(id);

    if (isMaximized) return; // Cannot drag maximized window

    setIsDragging(true);
    dragOffsetRef.current = {
      offsetX: e.clientX - windowState.position.x,
      offsetY: e.clientY - windowState.position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || isMaximized) return;

      const newX = e.clientX - dragOffsetRef.current.offsetX;
      const newY = e.clientY - dragOffsetRef.current.offsetY;

      // Viewport bounds clamping to keep window titlebar visible
      const viewportWidth = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1200;
      const viewportHeight = typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 800;
      const clampedX = Math.max(0, Math.min(newX, viewportWidth - 80));
      const clampedY = Math.max(0, Math.min(newY, viewportHeight - 60));

      pendingPosRef.current = { x: clampedX, y: clampedY };

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          if (pendingPosRef.current) {
            updatePosition(id, pendingPosRef.current);
            pendingPosRef.current = null;
          }
          rafRef.current = null;
        });
      }
    },
    [isDragging, isMaximized, id, updatePosition]
  );

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (pendingPosRef.current) {
        updatePosition(id, pendingPosRef.current);
        pendingPosRef.current = null;
      }
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture already lost
      }
    }
  };

  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const menuBarRef = useRef<HTMLElement>(null);

  // Close menus on outside click or Esc
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenuIndex(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuIndex(null);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Prevent background drag leaking
  useEffect(() => {
    const handleGlobalUp = () => {
      setIsDragging(false);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    window.addEventListener('pointerup', handleGlobalUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalUp);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  // Safe early return ONLY after all hooks are executed
  if (!windowState || !windowState.isOpen || windowState.isMinimized) {
    return null;
  }

  const isActive = activeWindowId === id;

  const windowStyle: React.CSSProperties = isMaximized
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: 'calc(100vh - 36px)',
        zIndex: windowState.zIndex,
      }
    : {
        position: 'absolute',
        left: `${windowState.position.x}px`,
        top: `${windowState.position.y}px`,
        width: `${windowState.size.width}px`,
        height: `${windowState.size.height}px`,
        maxWidth: '96vw',
        maxHeight: 'calc(100vh - 44px)',
        zIndex: windowState.zIndex,
      };

  return (
    <section
      style={windowStyle}
      onMouseDown={() => focusWindow(id)}
      className={`window-outer-frame select-none flex flex-col shadow-2xl bg-win-base ${
        isActive ? 'ring-1 ring-bevel-dark' : 'opacity-95'
      }`}
    >
      {/* 22px Classic Windows 98 Titlebar */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={() => maximizeWindow(id)}
        className={`h-titlebar-height px-1.5 flex items-center justify-between cursor-move select-none ${
          isActive ? 'titlebar-active' : 'titlebar-inactive'
        }`}
      >
        {/* Left: Window Icon & Title */}
        <div className="flex items-center space-x-1.5 overflow-hidden pr-2">
          <span className="flex-shrink-0">
            <PixelIcon name={windowState.icon} size={14} className={isActive ? 'text-white' : 'text-[#DFDFDF]'} />
          </span>
          <span className={`font-bold text-[11px] leading-tight truncate tracking-wide ${isActive ? 'text-white' : 'text-[#DFDFDF]'}`}>
            {windowState.title}
          </span>
        </div>

        {/* Right: Window Controls [?] [_] [🗖] [✕] */}
        <div className="flex items-center space-x-1 flex-shrink-0" onPointerDown={(e) => e.stopPropagation()}>
          {hasHelp && (
            <button
              onClick={() => alert(`Help for ${windowState.title}\n\nCryptoOS 98 Futures Trading Terminal v1.0`)}
              className="w-[16px] h-[14px] win-btn text-black text-[9px] font-bold flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5"
              title="Help"
            >
              ?
            </button>
          )}
          <button
            onClick={() => minimizeWindow(id)}
            className="w-[16px] h-[14px] win-btn text-black text-[9px] font-bold flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5"
            title="Minimize"
          >
            _
          </button>
          <button
            onClick={() => maximizeWindow(id)}
            className="w-[16px] h-[14px] win-btn text-black text-[9px] font-bold flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? '🗗' : '🗖'}
          </button>
          <button
            onClick={() => closeWindow(id)}
            className="w-[16px] h-[14px] win-btn text-error hover:bg-error hover:text-white text-[9px] font-extrabold flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Classic Menu Bar with Functional Dropdowns */}
      {(() => {
        const effectiveMenus: WindowMenuCategory[] = menus && menus.length > 0
          ? menus
          : (menuItems || []).map((name) => ({
              name,
              items: [
                {
                  label: `${name} Action (Default)`,
                  onClick: () => alert(`${name} clicked in ${windowState?.title}`),
                },
              ],
            }));

        if (effectiveMenus.length === 0) return null;

        return (
          <nav
            ref={menuBarRef}
            className="relative h-menubar-height bg-win-base border-b border-bevel-shadow flex items-center px-1 space-x-1 text-black text-[11px] font-ui select-none z-30 flex-shrink-0"
          >
            {effectiveMenus.map((category, catIdx) => {
              const isOpen = openMenuIndex === catIdx;
              return (
                <div key={catIdx} className="relative">
                  <button
                    onClick={() => {
                      soundFXService.playKeyClick();
                      setOpenMenuIndex(isOpen ? null : catIdx);
                    }}
                    onMouseEnter={() => {
                      if (openMenuIndex !== null && openMenuIndex !== catIdx) {
                        soundFXService.playKeyClick();
                        setOpenMenuIndex(catIdx);
                      }
                    }}
                    className={`px-1.5 py-0.5 transition-none cursor-pointer ${
                      isOpen
                        ? 'bg-titlebar-navy text-white font-semibold'
                        : 'text-black hover:bg-titlebar-navy hover:text-white'
                    }`}
                  >
                    <span className="underline">{category.name.slice(0, 1)}</span>
                    {category.name.slice(1)}
                  </button>

                  {/* Dropdown Popup */}
                  {isOpen && (
                    <div
                      className="absolute top-full left-0 min-w-[190px] window-outer-frame bg-win-base p-0.5 shadow-2xl z-50 flex flex-col font-ui text-[11px] border border-bevel-dark"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {category.items.map((action, actionIdx) => {
                        if (action.divider) {
                          return (
                            <div
                              key={actionIdx}
                              className="h-[1px] bg-bevel-shadow my-1 border-b border-bevel-highlight"
                            />
                          );
                        }
                        return (
                          <button
                            key={actionIdx}
                            disabled={action.disabled}
                            onClick={() => {
                              if (action.disabled) return;
                              soundFXService.playKeyClick();
                              setOpenMenuIndex(null);
                              action.onClick?.();
                            }}
                            className={`w-full px-2 py-1 flex items-center justify-between text-left transition-none ${
                              action.disabled
                                ? 'text-[#888] cursor-not-allowed opacity-60'
                                : action.danger
                                ? 'text-error hover:bg-error hover:text-white cursor-pointer font-semibold'
                                : 'text-black hover:bg-titlebar-navy hover:text-white cursor-pointer'
                            }`}
                          >
                            <span>{action.label}</span>
                            {action.shortcut && (
                              <span className="text-[9px] font-mono opacity-70 ml-3">
                                {action.shortcut}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        );
      })()}

      {/* Main Window Content Viewport */}
      <div className="flex-1 bg-win-base p-1 overflow-auto relative flex flex-col">
        {children}
      </div>

      {/* Recessed Status Bar Footer */}
      {statusContent && (
        <footer className="h-5 bg-win-base border-t border-bevel-highlight flex items-center justify-between px-2 text-[10px] text-black font-ui">
          {statusContent}
        </footer>
      )}
    </section>
  );
};
