import HANJA_DATA from '../../../hanja_unified.json';
import { buildHanjaStage, getSRSWeightedPool } from '../../../utils/learningPool.js';
import { toIdSet } from '../../../utils/setIdUtils.js';

export const DEFAULT_QUIZ_COUNT = 5;
export const DEFAULT_CLEAR_XP = 20;

export const wordReadingMap = {};
HANJA_DATA.forEach(h => {
    (h.words || []).forEach(w => {
        if (w.word && w.reading) wordReadingMap[w.word] = w.reading;
    });
});

export const shuffle = (items) => [...items].sort(() => 0.5 - Math.random());

export const getSentenceCategories = (hanjaData = HANJA_DATA) => [
    ...new Set(hanjaData.map(h => h.category).filter(Boolean)),
];

export const buildSentenceActiveHanjaSet = ({
    contentPool,
    hanjaData = HANJA_DATA,
    selectedCategory,
    selectedGrade,
    unlockedIds,
    viewMode,
}) => {
    if (contentPool) {
        const allIds = toIdSet([
            ...(contentPool.main?.hanjaIds || []),
            ...(contentPool.review?.hanjaIds || []),
        ]);
        return hanjaData.filter(h => allIds.has(h.id));
    }

    const allowedIds = unlockedIds ? toIdSet(unlockedIds) : new Set();
    if (viewMode === 'grade') {
        if (selectedGrade === '전체') return hanjaData.filter(h => allowedIds.has(h.id));
        if (selectedGrade === '기타') {
            return hanjaData.filter(h => (
                !h.grade ||
                h.grade === '' ||
                h.grade === '기타' ||
                h.grade === 'NON'
            ) && allowedIds.has(h.id));
        }
        return hanjaData.filter(h => h.grade === selectedGrade && allowedIds.has(h.id));
    }

    return hanjaData.filter(h => h.category === selectedCategory && allowedIds.has(h.id));
};

export const buildMainSentenceQueue = ({
    activeHanjaSet,
    currentDayHanjaIds,
    mainSeenHanjaIds,
    masteryData,
    quizCount,
    srsData,
    userLevel,
}) => {
    if (!currentDayHanjaIds?.length) return null;

    const seenSet = toIdSet(mainSeenHanjaIds);
    const todaySet = toIdSet(currentDayHanjaIds);
    const srsSeenIds = toIdSet(Object.keys(srsData || {}).map(Number));
    const withWords = activeHanjaSet.filter(h => h.words?.length > 0);
    const todaySlots = Math.max(1, Math.ceil(quizCount * 0.7));
    const reviewSlots = Math.max(0, quizCount - todaySlots);
    const todayHanja = withWords.filter(h => todaySet.has(h.id));
    const unseenToday = shuffle(todayHanja.filter(h => !seenSet.has(h.id)));
    const seenToday = shuffle(todayHanja.filter(h => seenSet.has(h.id)));
    const todayPicked = [...unseenToday, ...seenToday].slice(0, todaySlots);
    const srsHanja = withWords.filter(h => srsSeenIds.has(h.id) && !todaySet.has(h.id));
    const srsPicked = getSRSWeightedPool(srsHanja, srsData, masteryData, userLevel, reviewSlots);

    return [...todayPicked, ...srsPicked];
};

export const buildContentSentencePlan = ({
    activeHanjaSet,
    contentPool,
    masteryData,
    onGetNextWordIds,
    quizCount,
    seenHanjaIds,
    srsData,
}) => {
    const base = activeHanjaSet.filter(h => h.words?.length > 0);
    const fallbackWordIds = [
        ...(contentPool.main?.wordIds || []),
        ...(contentPool.review?.wordIds || []),
    ].slice(0, quizCount);
    let wordIds = onGetNextWordIds?.(quizCount) || fallbackWordIds;
    let wordQueue = buildSentenceQueueFromWordIds(wordIds, base);
    let refillAttempts = 0;

    while (onGetNextWordIds && wordQueue.length < quizCount && refillAttempts < 3) {
        const refillIds = onGetNextWordIds(quizCount - wordQueue.length);
        if (!refillIds.length) break;
        wordIds = [...wordIds, ...refillIds];
        wordQueue = buildSentenceQueueFromWordIds(wordIds, base);
        refillAttempts += 1;
    }

    wordQueue = wordQueue.slice(0, quizCount);
    if (wordQueue.length > 0) {
        return { reviewQueue: wordQueue, normalPool: [] };
    }

    const stage = buildHanjaStage(contentPool, base, srsData, masteryData, seenHanjaIds || [], quizCount);
    return stage.length > 0 ? { reviewQueue: [...stage], normalPool: [] } : null;
};

export const createSimpleSentenceQuiz = ({
    activeHanjaSet,
    hanjaData = HANJA_DATA,
    lastSimpleHanjaId,
    shownSimpleHanjaIds,
}) => {
    const shownSet = toIdSet(shownSimpleHanjaIds);
    const unseen = activeHanjaSet.filter(h => !shownSet.has(h.id));
    const candidatePool = unseen.length > 0 ? unseen : activeHanjaSet;
    const nonConsecutivePool = candidatePool.filter(h => h.id !== lastSimpleHanjaId);
    const finalPool = nonConsecutivePool.length > 0 ? nonConsecutivePool : candidatePool;
    const randomHanja = finalPool[Math.floor(Math.random() * finalPool.length)];

    if (!randomHanja) return null;

    const correct = randomHanja.meaning + ' ' + randomHanja.sound;
    const distractors = shuffle(hanjaData.filter(h => h.id !== randomHanja.id))
        .slice(0, 3)
        .map(h => h.meaning + ' ' + h.sound);
    const nextShownSimpleHanjaIds = unseen.length === 0
        ? [randomHanja.id]
        : [...(shownSimpleHanjaIds || []), randomHanja.id];

    return {
        lastSimpleHanjaId: randomHanja.id,
        nextShownSimpleHanjaIds,
        options: shuffle([...distractors, correct]),
        quiz: {
            type: 'simple',
            char: randomHanja.hanja,
            answer: correct,
            meaning: randomHanja.meaning,
            sound: randomHanja.sound,
            _hanjaId: randomHanja.id,
        },
    };
};

export const createSentenceWordQuiz = ({
    lastWordId,
    queueItem,
    seenWordIds,
    shownWords,
}) => {
    const hanjaItem = queueItem.hanja || queueItem;
    const forcedWord = queueItem.wordItem || null;
    const validWords = forcedWord ? [forcedWord] : getValidSentenceWords(hanjaItem);
    const seenSet = seenWordIds?.length > 0 ? toIdSet(seenWordIds) : null;
    const shownWordSet = toIdSet(shownWords);
    const sessionUnseenWords = validWords.filter(w => !shownWordSet.has(w.id));
    const sessionPool = sessionUnseenWords.length > 0 ? sessionUnseenWords : validWords;
    const appUnseenWords = seenSet ? sessionPool.filter(w => !seenSet.has(w.id)) : [];
    const preferredPool = appUnseenWords.length > 0 ? appUnseenWords : sessionPool;
    const nonConsecutivePool = preferredPool.filter(w => w.id !== lastWordId);
    const wordPool = nonConsecutivePool.length > 0 ? nonConsecutivePool : preferredPool;
    const hasHanja = (text) => /[一-鿿]/.test(text);
    const shuffledWordPool = shuffle(wordPool);
    let targetWord = null;
    let distractors = [];

    for (const candidate of shuffledWordPool) {
        const candidateDistractors = getReadingDistractors(candidate, hasHanja(candidate.word));
        if (candidateDistractors.length >= 3) {
            targetWord = candidate;
            distractors = candidateDistractors;
            break;
        }
    }

    if (!targetWord) {
        targetWord = shuffledWordPool[0] ?? validWords[0];
        distractors = targetWord ? getReadingDistractors(targetWord, hasHanja(targetWord.word)) : [];
    }

    if (!targetWord || distractors.length < 3) return null;

    const nextShownWords = targetWord.id != null && !shownWordSet.has(targetWord.id)
        ? [...(shownWords || []), targetWord.id]
        : (shownWords || []);

    return {
        lastWordId: targetWord.id ?? lastWordId,
        nextShownWords,
        options: shuffle([...distractors, targetWord.reading]),
        targetWord,
        quiz: {
            type: 'sentence',
            char: hanjaItem.hanja,
            target: targetWord,
            sentence: targetWord.example || `${targetWord.meaning} (${targetWord.word})`,
            _hanjaId: hanjaItem.id,
        },
    };
};

export const getReadingDistractors = (targetWord, targetIsHanja) => {
    const readingsByType = HANJA_DATA.flatMap(h => (h.words || [])
        .filter(w => w.word && w.reading && w.type !== 'idiom' && /[一-鿿]/.test(w.word) === targetIsHanja)
        .map(w => w.reading));
    const fallbackReadings = HANJA_DATA.flatMap(h => (h.words || [])
        .filter(w => w.reading && w.type !== 'idiom')
        .map(w => w.reading));
    const primary = [...new Set(readingsByType.filter(r => r && r !== targetWord.reading))];
    const fallback = [...new Set(fallbackReadings.filter(r => r && r !== targetWord.reading && !primary.includes(r)))];
    return shuffle([...primary, ...fallback]).slice(0, 3);
};

export const getValidSentenceWords = (hanja) =>
    (hanja?.words || []).filter(w => w.id != null && w.word && w.reading && w.meaning && w.type !== 'idiom');

export const buildSentenceQueueFromWordIds = (wordIds, candidateHanja) => {
    const byWordId = new Map();
    (candidateHanja || []).forEach(h => {
        getValidSentenceWords(h).forEach(w => {
            byWordId.set(String(w.id), { hanja: h, wordItem: w });
        });
    });
    return (wordIds || []).map(id => byWordId.get(String(id))).filter(Boolean);
};

export const getSentenceSizeClass = (sentence = '') => {
    const sentenceLength = sentence.replace(/[()\s]/g, '').length;
    if (sentenceLength <= 18) return 'sentence-quiz-prompt--short';
    if (sentenceLength <= 28) return 'sentence-quiz-prompt--medium';
    if (sentenceLength <= 40) return 'sentence-quiz-prompt--long';
    return 'sentence-quiz-prompt--extra-long';
};

export const getSentenceParts = (sentence) => {
    if (!sentence || !sentence.includes('(')) return null;
    const parts = sentence.split('(');
    const before = parts[0];
    const rest = parts[1].split(')');
    const word = rest[0];
    const after = rest[1] || '';
    const particleMatch = after.match(/^([^\s]+)/);
    const particle = particleMatch ? particleMatch[1] : '';
    const remaining = after.substring(particle.length);
    return { before, word, particle, remaining };
};
