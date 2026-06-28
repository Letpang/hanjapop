import { speakKorean } from '../../../utils/speakUtils.js';

let stopActiveCardSound = null;

export const playCardSound = (item, onEnd) => {
  if (!item) return () => {};
  stopActiveCardSound?.();

  let stopped = false;
  let audio = null;
  let stopTTS = null;

  const finish = () => {
    if (stopped) return;
    stopped = true;
    stopActiveCardSound = null;
    onEnd?.();
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.currentTime = 0;
    }
    stopTTS?.();
    if (stopActiveCardSound === stop) stopActiveCardSound = null;
  };

  stopActiveCardSound = stop;

  const playTTS = () => {
    if (stopped) return;
    const text = item.meaning && item.sound ? `${item.meaning} ${item.sound}` : (item.sound || '');
    if (text) stopTTS = speakKorean(text, finish);
    else finish();
  };

  if (item.id <= 370) {
    const audioId = String(item.id).padStart(item.id < 51 ? 2 : 3, '0');
    audio = new Audio(`/assets/audio/card_${audioId}.mp3`);
    let done = false;
    const fallback = () => {
      if (stopped || done) return;
      done = true;
      playTTS();
    };
    audio.onended = () => { done = true; finish(); };
    audio.onerror = fallback;
    audio.play().catch(fallback);
  } else {
    playTTS();
  }

  return stop;
};
