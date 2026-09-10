import { describe, it, expect, vi } from 'vitest';
import { soundFXService } from '../SoundFXService';

describe('SoundFXService (Procedural Web Audio Engine)', () => {
  it('initializes with default or persisted mute setting', () => {
    expect(typeof soundFXService.getIsMuted()).toBe('boolean');
  });

  it('toggles mute setting and notifies subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = soundFXService.subscribeMute(listener);

    const initialMuted = soundFXService.getIsMuted();
    soundFXService.toggleMute();

    expect(soundFXService.getIsMuted()).toBe(!initialMuted);
    expect(listener).toHaveBeenCalledWith(!initialMuted);

    // Toggle back
    soundFXService.toggleMute();
    expect(soundFXService.getIsMuted()).toBe(initialMuted);

    unsubscribe();
  });

  it('executes audio trigger methods safely without throwing in headless environments', () => {
    expect(() => soundFXService.playKeyClick()).not.toThrow();
    expect(() => soundFXService.playOrderExecuted()).not.toThrow();
    expect(() => soundFXService.playClaimReward()).not.toThrow();
    expect(() => soundFXService.playLeverageWarning()).not.toThrow();
    expect(() => soundFXService.playLiquidationCrash()).not.toThrow();
  });
});
