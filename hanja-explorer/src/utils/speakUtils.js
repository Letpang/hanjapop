export const speakKorean = (text, onEnd) => {
    if (!text) return;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    const audioUrl = `/assets/audio/words/word_${encodeURIComponent(text.trim())}.mp3`;
    const audio = new Audio(audioUrl);
    if (onEnd) audio.onended = onEnd;
    audio.play().catch(() => {
        if (!window.speechSynthesis) { if (onEnd) onEnd(); return; }
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'ko-KR'; utter.rate = 0.8; utter.pitch = 0.95;
        if (onEnd) utter.onend = onEnd;
        const voices = window.speechSynthesis.getVoices();
        const ko = voices.filter(v => v.lang.startsWith('ko') || v.lang.includes('ko-KR'));
        if (ko.length > 0) {
            utter.voice = ko.find(v => /yuna|siri|sora|hyerim|hyejin|heami/i.test(v.name)) || ko[0];
        }
        window.speechSynthesis.speak(utter);
    });
};
