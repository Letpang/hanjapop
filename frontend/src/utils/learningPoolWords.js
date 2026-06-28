import { toIdSet } from './setIdUtils.js';

export function getWordIdsForHanja(hanjaIds, hanjaData) {
    return hanjaIds.flatMap(id => {
        const h = hanjaData.find(h => h.id === id);
        return (h?.words || []).filter(w => w.id && w.word && w.meaning && w.reading && w.type !== 'idiom').map(w => w.id);
    });
}

export function allocateTodayWords(hanjaData, currentDayHanjaIds, wordQuizSlots = 7) {
    const todaySet = toIdSet(currentDayHanjaIds);
    const allTodayWords = [];
    hanjaData.forEach(h => {
        if (!todaySet.has(h.id)) return;
        (h.words || []).forEach(w => {
            if (w.word && w.meaning && w.reading && w.type !== 'idiom') {
                allTodayWords.push({
                    hanja_char: h.hanja,
                    hanja_id: h.id,
                    grade: h.grade,
                    category: h.category || '',
                    word: w.word,
                    reading: w.reading,
                    meaning: w.meaning,
                    example: w.example || '',
                });
            }
        });
    });
    const shuffled = [...allTodayWords].sort(() => Math.random() - 0.5);
    return {
        wordQuizWords: shuffled.slice(0, wordQuizSlots),
        sentenceQuizWords: shuffled.slice(wordQuizSlots),
    };
}

export function expandWrongToTen(wrongIds, hanjaData, target = 10) {
    if (!wrongIds || wrongIds.length === 0) return [];
    if (wrongIds.length >= target) return wrongIds.slice(0, target);

    const seenIds = toIdSet(wrongIds);
    const candidates = [];

    wrongIds.forEach(id => {
        const h = hanjaData.find(h => h.id === id);
        if (!h) return;
        (h.words || []).forEach(w => {
            if (!w.word) return;
            [...w.word].forEach(char => {
                const related = hanjaData.find(rh => rh.hanja === char && !seenIds.has(rh.id));
                if (related) {
                    seenIds.add(related.id);
                    candidates.push(related.id);
                }
            });
        });
    });

    const shuffled = candidates.sort(() => Math.random() - 0.5);
    const extra = shuffled.slice(0, target - wrongIds.length);
    return [...wrongIds, ...extra];
}
