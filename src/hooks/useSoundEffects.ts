/**
 * Sound Effects Hook
 * 
 * Provides retro arcade sound effects using Web Audio API
 */

import { useCallback, useRef } from 'react';

type SoundType =
  | 'coin'
  | 'win'
  | 'lose'
  | 'move'
  | 'click'
  | 'powerup'
  | 'achievement'
  | 'gameOver'
  | 'countdown'
  | 'levelUp';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

interface UseSoundEffectsReturn {
  play: (sound: SoundType) => void;
  haptic: (type?: HapticType) => void;
  setVolume: (volume: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

// Oscillator-based sound generation (no external files needed)
function createOscillatorSound(
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'square',
  gain: number = 0.3
): void {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  gainNode.gain.setValueAtTime(gain, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

// Multi-note sound for complex effects
function createMelody(
  audioContext: AudioContext,
  notes: Array<{ freq: number; duration: number; delay: number }>,
  type: OscillatorType = 'square',
  gain: number = 0.2
): void {
  notes.forEach(note => {
    setTimeout(() => {
      createOscillatorSound(audioContext, note.freq, note.duration, type, gain);
    }, note.delay * 1000);
  });
}

export function useSoundEffects(): UseSoundEffectsReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const volumeRef = useRef(0.5);
  const mutedRef = useRef(false);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const play = useCallback((sound: SoundType) => {
    if (mutedRef.current) return;

    const ctx = getAudioContext();
    const vol = volumeRef.current;

    switch (sound) {
      case 'coin':
        // Classic coin collect sound
        createOscillatorSound(ctx, 988, 0.1, 'square', vol * 0.4);
        setTimeout(() => createOscillatorSound(ctx, 1319, 0.2, 'square', vol * 0.3), 100);
        break;

      case 'win':
        // Victory fanfare
        createMelody(ctx, [
          { freq: 523, duration: 0.15, delay: 0 },
          { freq: 659, duration: 0.15, delay: 0.15 },
          { freq: 784, duration: 0.15, delay: 0.3 },
          { freq: 1047, duration: 0.4, delay: 0.45 },
        ], 'square', vol * 0.3);
        break;

      case 'lose':
        // Game over sound
        createMelody(ctx, [
          { freq: 392, duration: 0.2, delay: 0 },
          { freq: 330, duration: 0.2, delay: 0.2 },
          { freq: 262, duration: 0.4, delay: 0.4 },
        ], 'sawtooth', vol * 0.25);
        break;

      case 'move':
        // Quick move/step sound
        createOscillatorSound(ctx, 220, 0.05, 'square', vol * 0.15);
        break;

      case 'click':
        // UI click
        createOscillatorSound(ctx, 660, 0.05, 'square', vol * 0.2);
        break;

      case 'powerup':
        // Power-up collect
        createMelody(ctx, [
          { freq: 440, duration: 0.1, delay: 0 },
          { freq: 554, duration: 0.1, delay: 0.08 },
          { freq: 659, duration: 0.1, delay: 0.16 },
          { freq: 880, duration: 0.15, delay: 0.24 },
        ], 'square', vol * 0.3);
        break;

      case 'achievement':
        // Achievement unlock fanfare
        createMelody(ctx, [
          { freq: 523, duration: 0.1, delay: 0 },
          { freq: 659, duration: 0.1, delay: 0.1 },
          { freq: 784, duration: 0.1, delay: 0.2 },
          { freq: 1047, duration: 0.15, delay: 0.3 },
          { freq: 1319, duration: 0.3, delay: 0.45 },
        ], 'square', vol * 0.35);
        break;

      case 'gameOver':
        // Dramatic game over
        createMelody(ctx, [
          { freq: 294, duration: 0.3, delay: 0 },
          { freq: 262, duration: 0.3, delay: 0.3 },
          { freq: 233, duration: 0.3, delay: 0.6 },
          { freq: 196, duration: 0.5, delay: 0.9 },
        ], 'sawtooth', vol * 0.3);
        break;

      case 'countdown':
        // Countdown beep
        createOscillatorSound(ctx, 440, 0.1, 'sine', vol * 0.4);
        break;

      case 'levelUp':
        // Level up celebration
        createMelody(ctx, [
          { freq: 262, duration: 0.1, delay: 0 },
          { freq: 330, duration: 0.1, delay: 0.1 },
          { freq: 392, duration: 0.1, delay: 0.2 },
          { freq: 523, duration: 0.2, delay: 0.3 },
          { freq: 659, duration: 0.1, delay: 0.5 },
          { freq: 784, duration: 0.3, delay: 0.6 },
        ], 'square', vol * 0.3);
        break;
    }
  }, [getAudioContext]);

  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.max(0, Math.min(1, volume));
  }, []);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
  }, []);

  // Haptic feedback for mobile devices
  const haptic = useCallback((type: HapticType = 'light') => {
    if (!navigator.vibrate) return;

    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(50);
        break;
      case 'success':
        navigator.vibrate([10, 50, 20]);
        break;
      case 'warning':
        navigator.vibrate([30, 30, 30]);
        break;
      case 'error':
        navigator.vibrate([50, 100, 50, 100, 50]);
        break;
    }
  }, []);

  return {
    play,
    haptic,
    setVolume,
    isMuted: mutedRef.current,
    toggleMute,
  };
}

export default useSoundEffects;
