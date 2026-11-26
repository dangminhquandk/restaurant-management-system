import { useCallback, useState } from 'react';

const SOUND_PREF_KEY = 'rms_sound_enabled';

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

function readInitialSoundPref(): boolean {
  try {
    const stored = localStorage.getItem(SOUND_PREF_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

/**
 * Synthesizes a pleasant two-tone hospitality kitchen bell chime using Web Audio API
 * (E5 -> A5 harmonic envelope) with safe fallback in headless/jsdom environments.
 */
export function useSoundAlert() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(readInitialSoundPref);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SOUND_PREF_KEY, String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const playChime = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const playTone = (freq: number, startOffset: number, duration: number, peakGain: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + startOffset);

        gain.gain.setValueAtTime(0.001, now + startOffset);
        gain.gain.exponentialRampToValueAtTime(peakGain, now + startOffset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + startOffset);
        osc.stop(now + startOffset + duration);
      };

      // Two-tone warm bistro chime: E5 (659.25 Hz) -> A5 (880 Hz)
      playTone(659.25, 0, 0.18, 0.22);
      playTone(880, 0.14, 0.28, 0.25);

      window.setTimeout(() => {
        void ctx.close().catch(() => undefined);
      }, 600);
    } catch {
      // Browser autoplay restriction or test environment without Web Audio
    }
  }, [soundEnabled]);

  return {
    soundEnabled,
    toggleSound,
    playChime,
  };
}
