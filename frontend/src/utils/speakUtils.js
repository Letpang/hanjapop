let _koVoice = null;
let _voicesReady = false;

const pickVoice = () => {
    const voices = window.speechSynthesis?.getVoices() || [];
    if (!voices.length) return;
    const ko = voices.filter(v => v.lang.startsWith('ko'));
    _koVoice = ko.find(v => /yuna|siri|sora|hyerim|hyejin|heami/i.test(v.name)) || ko[0] || null;
    _voicesReady = true;
};

if (window.speechSynthesis) {
    pickVoice();
    window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
}

export const speakKorean = (text, onEnd) => {
    if (!text) return () => {};
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    const audioUrl = `/assets/audio/words/word_${encodeURIComponent(text.trim())}.mp3`;
    const audio = new Audio(audioUrl);
    let stopped = false;
    const finish = () => {
        if (stopped) return;
        stopped = true;
        if (onEnd) onEnd();
    };
    if (onEnd) audio.onended = finish;
    audio.play().catch(() => {
        if (stopped) return;
        if (!window.speechSynthesis) { finish(); return; }
        window.speechSynthesis.cancel();
        const doSpeak = () => {
            if (stopped) return;
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = 'ko-KR'; utter.rate = 0.8; utter.pitch = 0.95;
            if (onEnd) utter.onend = finish;
            if (_koVoice) utter.voice = _koVoice;
            window.speechSynthesis.speak(utter);
        };
        if (_voicesReady) {
            doSpeak();
        } else {
            window.speechSynthesis.addEventListener('voiceschanged', () => { pickVoice(); doSpeak(); }, { once: true });
        }
    });
    return () => {
        if (stopped) return;
        stopped = true;
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
        audio.currentTime = 0;
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
};
