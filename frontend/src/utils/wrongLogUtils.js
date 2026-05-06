const WORD_WRONG_KEY = 'word_wrong_log';
const SENTENCE_WRONG_KEY = 'sentence_wrong_log';
const MAX_ENTRIES = 300;

export const logWordWrong = (word, reading, meaning) => {
    if (!word || !meaning) return;
    const log = JSON.parse(localStorage.getItem(WORD_WRONG_KEY) || '[]');
    const filtered = log.filter(e => e.word !== word);
    filtered.unshift({ word, reading: reading || '', meaning, date: new Date().toISOString() });
    localStorage.setItem(WORD_WRONG_KEY, JSON.stringify(filtered.slice(0, MAX_ENTRIES)));
};

export const logSentenceWrong = (sentence, answer, wrongAnswer) => {
    if (!sentence || !answer) return;
    const log = JSON.parse(localStorage.getItem(SENTENCE_WRONG_KEY) || '[]');
    const filtered = log.filter(e => e.sentence !== sentence);
    filtered.unshift({ sentence, answer, wrongAnswer: wrongAnswer || '', date: new Date().toISOString() });
    localStorage.setItem(SENTENCE_WRONG_KEY, JSON.stringify(filtered.slice(0, MAX_ENTRIES)));
};

export const getWordWrongLog = () => JSON.parse(localStorage.getItem(WORD_WRONG_KEY) || '[]');
export const getSentenceWrongLog = () => JSON.parse(localStorage.getItem(SENTENCE_WRONG_KEY) || '[]');

export const removeWordWrongs = (words) => {
    const wordSet = new Set(words.map(w => w.word));
    const log = JSON.parse(localStorage.getItem(WORD_WRONG_KEY) || '[]');
    localStorage.setItem(WORD_WRONG_KEY, JSON.stringify(log.filter(e => !wordSet.has(e.word))));
};
