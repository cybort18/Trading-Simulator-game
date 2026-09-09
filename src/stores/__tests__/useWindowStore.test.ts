import { describe, it, expect, beforeEach } from 'vitest';
import { useWindowStore } from '../useWindowStore';

describe('useWindowStore Window Lifecycle & Focus Management', () => {
  beforeEach(() => {
    // Reset window store state before each test
    useWindowStore.setState({
      windows: {
        welcome: {
          id: 'welcome',
          title: 'Welcome',
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
          title: 'TurboTrade.exe',
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
          title: 'DegenVault.exe',
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
          title: 'Leaderboard.exe',
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
          title: 'ShareFlexCard.exe',
          icon: 'camera',
          isOpen: false,
          isMinimized: false,
          isMaximized: false,
          position: { x: 280, y: 60 },
          size: { width: 680, height: 520 },
          defaultBounds: { x: 280, y: 60, width: 680, height: 520 },
          zIndex: 36,
        },
      },
      activeWindowId: 'welcome',
      maxZIndex: 36,
    });
  });

  it('gracefully falls back focus to the next open window with highest zIndex when active window is closed', () => {
    const store = useWindowStore.getState();
    expect(store.activeWindowId).toBe('welcome');

    // Welcome has zIndex 35. Other open windows: degenvault (zIndex 22), turbotrade (zIndex 20).
    // When closing 'welcome', focus should fall back to 'degenvault'
    store.closeWindow('welcome');

    const updated = useWindowStore.getState();
    expect(updated.windows.welcome.isOpen).toBe(false);
    expect(updated.activeWindowId).toBe('degenvault');
  });

  it('falls back to turbotrade when degenvault is closed next', () => {
    const store = useWindowStore.getState();
    store.closeWindow('welcome');
    store.closeWindow('degenvault');

    const updated = useWindowStore.getState();
    expect(updated.windows.degenvault.isOpen).toBe(false);
    expect(updated.activeWindowId).toBe('turbotrade');
  });

  it('sets activeWindowId to null when all windows are closed', () => {
    const store = useWindowStore.getState();
    store.closeWindow('welcome');
    store.closeWindow('degenvault');
    store.closeWindow('turbotrade');

    const updated = useWindowStore.getState();
    expect(updated.windows.turbotrade.isOpen).toBe(false);
    expect(updated.activeWindowId).toBeNull();
  });

  it('re-opens a closed window and restores focus on openWindow (icon double-click simulation)', () => {
    const store = useWindowStore.getState();
    // Close turbotrade
    store.closeWindow('turbotrade');
    expect(useWindowStore.getState().windows.turbotrade.isOpen).toBe(false);

    // Double-click desktop icon to open turbotrade
    store.openWindow('turbotrade');

    const updated = useWindowStore.getState();
    expect(updated.windows.turbotrade.isOpen).toBe(true);
    expect(updated.windows.turbotrade.isMinimized).toBe(false);
    expect(updated.activeWindowId).toBe('turbotrade');
    expect(updated.windows.turbotrade.zIndex).toBe(37);
  });

  it('falls back to next open window when active window is minimized', () => {
    const store = useWindowStore.getState();
    expect(store.activeWindowId).toBe('welcome');

    store.minimizeWindow('welcome');

    const updated = useWindowStore.getState();
    expect(updated.windows.welcome.isMinimized).toBe(true);
    expect(updated.activeWindowId).toBe('degenvault');
  });
});
