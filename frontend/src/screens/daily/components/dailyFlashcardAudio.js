import { speakKorean } from '../../../utils/speakUtils.js';

let currentCardAudio = null;

export const playCardSound = (item) => {
  if (!item) return;

  if (currentCardAudio) {
    currentCardAudio.pause();
    currentCardAudio.src = '';
    currentCardAudio = null;
  }

  if (window.speechSynthesis) window.speechSynthesis.cancel();

  const playTTS = () => {
    const text = (item.meaning && item.sound) ? `${item.meaning} ${item.sound}` : (item.sound || '');
    if (text) speakKorean(text);
  };

  if (item.id <= 370) {
    const audioId = String(item.id).padStart(item.id < 51 ? 2 : 3, '0');
    const audio = new Audio(`/assets/audio/card_${audioId}.mp3`);
    currentCardAudio = audio;

    let done = false;
    const fallback = () => {
      if (!done) {
        done = true;
        playTTS();
      }
    };

    audio.onerror = fallback;
    audio.onended = () => {
      currentCardAudio = null;
    };
    audio.play().catch(fallback);
  } else {
    playTTS();
  }
};
