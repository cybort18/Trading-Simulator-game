import { create } from 'zustand';
import { WindowId, WindowPosition, WindowSize, WindowState } from '@/types/window';

interface WindowStoreState {
  windows: Record<WindowId, WindowState>;
  activeWindowId: WindowId | null;
  maxZIndex: number;
  openWindow: (id: WindowId) => void;
  closeWindow: (id: WindowId) => void;
  minimizeWindow: (id: WindowId) => void;
  maximizeWindow: (id: WindowId) => void;
  focusWindow: (id: WindowId) => void;
  updatePosition: (id: WindowId, position: WindowPosition) => void;
  updateSize: (id: WindowId, size: WindowSize) => void;
}

const INITIAL_WINDOWS: Record<WindowId, WindowState> = {
  welcome: {
    id: 'welcome',
    title: 'System Notice - Welcome New Trader!',
    icon: 'warning',
    isOpen: true,
    isMinimized: false,
    isMaximized: false,
    position: { x: 260, y: 70 },
    size: { width: 520, height: 430 },
    defaultBounds: { x: 260, y: 70, width: 520, height: 430 },
    zIndex: 35,
  },
  turbotrade: {
    id: 'turbotrade',
    title: 'TurboTrade.exe - BTC/USDT [PERPETUAL 50x]',
    icon: 'candlestick',
    isOpen: true,
    isMinimized: false,
    isMaximized: false,
    position: { x: 60, y: 15 },
    size: { width: 920, height: 600 },
    defaultBounds: { x: 60, y: 15, width: 920, height: 600 },
    zIndex: 20,
  },
  degenvault: {
    id: 'degenvault',
    title: 'DegenVault.exe - Virtual Wallet & Profile',
    icon: 'wallet',
    isOpen: true,
    isMinimized: false,
    isMaximized: false,
    position: { x: 380, y: 45 },
    size: { width: 680, height: 570 },
    defaultBounds: { x: 380, y: 45, width: 680, height: 570 },
    zIndex: 22,
  },
  leaderboard: {
    id: 'leaderboard',
    title: 'Leaderboard.exe - Global Ranking & PnL Arena [Season 1]',
    icon: 'trophy',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    position: { x: 180, y: 35 },
    size: { width: 880, height: 560 },
    defaultBounds: { x: 180, y: 35, width: 880, height: 560 },
    zIndex: 21,
  },
  flexcard: {
    id: 'flexcard',
    title: 'Share Flex Card.exe - Export PnL to Socials',
    icon: 'camera',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    position: { x: 280, y: 60 },
    size: { width: 680, height: 520 },
    defaultBounds: { x: 280, y: 60, width: 680, height: 520 },
    zIndex: 36,
  },
};

export const useWindowStore = create<WindowStoreState>((set, get) => ({
  windows: INITIAL_WINDOWS,
  activeWindowId: 'welcome',
  maxZIndex: 36,

  openWindow: (id: WindowId) => {
    const { windows, maxZIndex } = get();
    const target = windows[id];
    if (!target) return;

    const nextZIndex = maxZIndex + 1;
    set({
      windows: {
        ...windows,
        [id]: {
          ...target,
          isOpen: true,
          isMinimized: false,
          zIndex: nextZIndex,
        },
      },
      activeWindowId: id,
      maxZIndex: nextZIndex,
    });
  },

  closeWindow: (id: WindowId) => {
    const { windows, activeWindowId } = get();
    const target = windows[id];
    if (!target) return;

    const updatedWindows = {
      ...windows,
      [id]: {
        ...target,
        isOpen: false,
      },
    };

    let nextActiveId: WindowId | null = null;
    if (activeWindowId === id) {
      // Find the open, non-minimized window with highest zIndex
      const openVisible = Object.values(updatedWindows).filter(
        (w) => w.isOpen && !w.isMinimized && w.id !== id
      );
      if (openVisible.length > 0) {
        openVisible.sort((a, b) => b.zIndex - a.zIndex);
        nextActiveId = openVisible[0].id;
      }
    } else {
      nextActiveId = activeWindowId;
    }

    set({
      windows: updatedWindows,
      activeWindowId: nextActiveId,
    });
  },

  minimizeWindow: (id: WindowId) => {
    const { windows, activeWindowId } = get();
    const target = windows[id];
    if (!target) return;

    const updatedWindows = {
      ...windows,
      [id]: {
        ...target,
        isMinimized: true,
      },
    };

    let nextActiveId: WindowId | null = null;
    if (activeWindowId === id) {
      const openVisible = Object.values(updatedWindows).filter(
        (w) => w.isOpen && !w.isMinimized
      );
      if (openVisible.length > 0) {
        openVisible.sort((a, b) => b.zIndex - a.zIndex);
        nextActiveId = openVisible[0].id;
      }
    } else {
      nextActiveId = activeWindowId;
    }

    set({
      windows: updatedWindows,
      activeWindowId: nextActiveId,
    });
  },

  maximizeWindow: (id: WindowId) => {
    const { windows, maxZIndex } = get();
    const target = windows[id];
    if (!target) return;

    const nextZIndex = maxZIndex + 1;
    const willMaximize = !target.isMaximized;

    set({
      windows: {
        ...windows,
        [id]: {
          ...target,
          isMaximized: willMaximize,
          isMinimized: false,
          zIndex: nextZIndex,
        },
      },
      activeWindowId: id,
      maxZIndex: nextZIndex,
    });
  },

  focusWindow: (id: WindowId) => {
    const { windows, maxZIndex, activeWindowId } = get();
    const target = windows[id];
    if (!target) return;

    if (activeWindowId === id && !target.isMinimized) {
      return; // Already focused
    }

    const nextZIndex = maxZIndex + 1;
    set({
      windows: {
        ...windows,
        [id]: {
          ...target,
          isMinimized: false,
          zIndex: nextZIndex,
        },
      },
      activeWindowId: id,
      maxZIndex: nextZIndex,
    });
  },

  updatePosition: (id: WindowId, position: WindowPosition) => {
    const { windows } = get();
    const target = windows[id];
    if (!target) return;

    // Viewport clamping with SSR/test environment safety
    const innerHeight = typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 800;
    const innerWidth = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1200;
    const taskbarHeight = 36;
    const clampedY = Math.max(0, Math.min(position.y, innerHeight - taskbarHeight - 24));
    const clampedX = Math.max(-target.size.width + 100, Math.min(position.x, innerWidth - 80));

    set({
      windows: {
        ...windows,
        [id]: {
          ...target,
          position: { x: clampedX, y: clampedY },
        },
      },
    });
  },

  updateSize: (id: WindowId, size: WindowSize) => {
    const { windows } = get();
    const target = windows[id];
    if (!target) return;

    const innerHeight = typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 800;
    const innerWidth = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1200;
    const clampedWidth = Math.max(360, Math.min(size.width, innerWidth));
    const clampedHeight = Math.max(220, Math.min(size.height, innerHeight - 36));

    set({
      windows: {
        ...windows,
        [id]: {
          ...target,
          size: { width: clampedWidth, height: clampedHeight },
        },
      },
    });
  },
}));
