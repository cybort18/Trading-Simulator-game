/**
 * SoundFXService.ts
 * Procedural Web Audio API sound generator for CryptoOS 98.
 * Provides authentic 90s OS and 8-bit arcade audio feedback without external audio files.
 */

import { safeStateStorage } from '@/utils/safeStorage';

const AUDIO_MUTE_STORAGE_KEY = 'CRYPTOOS_98_AUDIO_MUTED';

class SoundFXService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private listeners: Set<(muted: boolean) => void> = new Set();
  private initialized: boolean = false;

  constructor() {
    // Check persisted mute setting
    const persisted = safeStateStorage.getItem(AUDIO_MUTE_STORAGE_KEY);
    this.isMuted = persisted === 'true';

    // Register user gesture listener for modern browser autoplay policies
    if (typeof window !== 'undefined') {
      const initAudioOnInteraction = () => {
        this.init();
        window.removeEventListener('pointerdown', initAudioOnInteraction);
        window.removeEventListener('keydown', initAudioOnInteraction);
      };
      window.addEventListener('pointerdown', initAudioOnInteraction, { once: true });
      window.addEventListener('keydown', initAudioOnInteraction, { once: true });
    }
  }

  /**
   * Initializes or resumes the Web Audio context.
   */
  public init(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        this.initialized = true;
      }
    } catch {
      // AudioContext unavailable (e.g. Node test environment)
    }

    return this.ctx;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    safeStateStorage.setItem(AUDIO_MUTE_STORAGE_KEY, String(muted));
    this.listeners.forEach((cb) => cb(this.isMuted));
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public subscribeMute(listener: (muted: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 1. Mechanical Micro-Click
   * Triangle/square burst, ~15ms, 1200Hz dropping to 400Hz
   */
  public playKeyClick(): void {
    if (this.isMuted) return;
    const ctx = this.init();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.015);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.015);
    } catch {
      // Safe catch for suspended audio contexts
    }
  }

  /**
   * 2. Order Executed Confirmation Chime
   * Dual-tone mechanical chime: D5 (587Hz) -> A5 (880Hz)
   */
  public playOrderExecuted(): void {
    if (this.isMuted) return;
    const ctx = this.init();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // Tone 1: 587Hz
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, t);
      gain1.gain.setValueAtTime(0.2, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.09);

      // Tone 2: 880Hz (after 70ms)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, t + 0.07);
      gain2.gain.setValueAtTime(0.001, t);
      gain2.gain.setValueAtTime(0.25, t + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(t + 0.07);
      osc2.stop(t + 0.28);
    } catch {
      // Safe catch
    }
  }

  /**
   * 3. 8-Bit Rising Arpeggio / Cash Register Ding
   * C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
   */
  public playClaimReward(): void {
    if (this.isMuted) return;
    const ctx = this.init();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const stepDuration = 0.06;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = t + idx * stepDuration;

        osc.type = idx === notes.length - 1 ? 'triangle' : 'square';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.15, noteStart);
        const duration = idx === notes.length - 1 ? 0.35 : stepDuration;
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + duration);
      });
    } catch {
      // Safe catch
    }
  }

  /**
   * 4. Leverage Warning Beep
   * 440Hz square wave with rapid decay
   */
  public playLeverageWarning(): void {
    if (this.isMuted) return;
    const ctx = this.init();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(440, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {
      // Safe catch
    }
  }

  /**
   * 5. CRT Degauss Sweeping Glass-Crash / Liquidation Implosion
   * Low-frequency sweep + bandpass filtered noise burst
   */
  public playLiquidationCrash(): void {
    if (this.isMuted) return;
    const ctx = this.init();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // Part A: Degauss Sine Sweep (150Hz -> 30Hz)
      const degaussOsc = ctx.createOscillator();
      const degaussGain = ctx.createGain();
      degaussOsc.type = 'sine';
      degaussOsc.frequency.setValueAtTime(150, t);
      degaussOsc.frequency.exponentialRampToValueAtTime(30, t + 0.4);

      degaussGain.gain.setValueAtTime(0.35, t);
      degaussGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      degaussOsc.connect(degaussGain);
      degaussGain.connect(ctx.destination);
      degaussOsc.start(t);
      degaussOsc.stop(t + 0.45);

      // Part B: Static Noise Burst (Glass implosion effect)
      const bufferSize = Math.floor(ctx.sampleRate * 0.4);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2500, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.35);
      filter.Q.setValueAtTime(2, t);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      whiteNoise.start(t);
      whiteNoise.stop(t + 0.35);
    } catch {
      // Safe catch
    }
  }
}

export const soundFXService = new SoundFXService();
