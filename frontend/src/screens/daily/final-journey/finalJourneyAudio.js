import { SK } from '../../../constants/storageKeys.js';

const FANFARE_NOTES = [523.25, 659.25, 783.99, 1046.5];

export const playFinalFanfare = () => {
  try {
    if (localStorage.getItem(SK.SFX_ON) === 'false') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const context = new AudioCtx();
    const start = context.currentTime + 0.04;

    FANFARE_NOTES.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index === 3 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start + index * 0.13);
      gain.gain.exponentialRampToValueAtTime(0.12, start + index * 0.13 + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.13 + 0.55);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start + index * 0.13);
      oscillator.stop(start + index * 0.13 + 0.6);
    });

    window.setTimeout(() => context.close().catch(() => {}), 1800);
  } catch {
    // 브라우저 자동 재생 제한 시 시각 효과만 유지한다.
  }
};
