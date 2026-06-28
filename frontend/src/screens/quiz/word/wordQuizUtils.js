import HANJA_DATA from '../../../hanja_unified.json';
import { getWordSRSWeightedPool } from '../../../utils/learningPool.js';

export const DEFAULT_QUIZ_COUNT = 6;
export const DEFAULT_CLEAR_XP = 20;

const buildWordPool = () => {
    const pool = [];
    for (const h of HANJA_DATA) {
        if (!h.words || h.words.length === 0) continue;
        for (const w of h.words) {
            if (w.word && w.meaning && w.type !== 'idiom') {
                pool.push({
                    id: w.id,
                    hanja_char: h.hanja,
                    hanja_id: h.id,
                    grade: h.grade,
                    category: h.category || '',
                    word: w.word,
                    reading: w.reading || '',
                    meaning: w.meaning,
                    example: w.example || '',
                });
            }
        }
    }
    return pool;
};

export const WORD_POOL = buildWordPool();
export const ALL_MEANINGS = [...new Set(WORD_POOL.map(w => w.meaning))];
export const CATEGORIES = [...new Set((HANJA_DATA || []).map(h => h.category).filter(Boolean))];

export const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

export const pickDistractors = (correctMeaning, count = 3) => {
    const others = ALL_MEANINGS.filter(m => m !== correctMeaning);
    return shuffle(others).slice(0, count);
};

export const capQuizCount = (items, quizCount) => items.slice(0, quizCount);

export const buildQuizFromPool = (contentPool, wordData, userLevel, seenWordIds = [], quizCount = DEFAULT_QUIZ_COUNT) => {
    if (!contentPool) return [];

    const mainIdSet = toIdSet(contentPool.main?.wordIds);
    const reviewIdSet = toIdSet(contentPool.review?.wordIds);
    const seenSet = toIdSet(seenWordIds);
    const mainWords = WORD_POOL.filter(w => mainIdSet.has(w.id));
    const reviewWords = WORD_POOL.filter(w => reviewIdSet.has(w.id));
    
    if (mainWords.length === 0 && reviewWords.length === 0) return [];

    const allSeen = [...mainWords, ...reviewWords].every(w => seenSet.has(w.id));
    const effectiveSeenSet = allSeen ? new Set() : seenSet;

    const unseen = (pool) => pool.filter(w => !effectiveSeenSet.has(w.id));
    const seen = (pool) => pool.filter(w => effectiveSeenSet.has(w.id));
    const pickFrom = (pool, n) => {
        if (n <= 0 || pool.length === 0) return [];
        return [...shuffle(unseen(pool)), ...shuffle(seen(pool))].slice(0, n);
    };

    const ratio = contentPool.ratio ?? 1.0;
    const targetMain = Math.min(Math.round(quizCount * ratio), mainWords.length);
    const targetReview = Math.min(quizCount - targetMain, reviewWords.length);

    let mainPicked = pickFrom(mainWords, targetMain);
    let reviewPicked = pickFrom(reviewWords, targetReview);

    const usedIds = toIdSet([...mainPicked, ...reviewPicked].map(w => w.id));
    const shortfall = quizCount - mainPicked.length - reviewPicked.length;
    const fillPicked = shortfall > 0 ? pickFrom(mainWords.filter(w => !usedIds.has(w.id)), shortfall) : [];

    return shuffle([...mainPicked, ...reviewPicked, ...fillPicked].slice(0, quizCount))
        .map(item => ({ ...item, choices: shuffle([item.meaning, ...pickDistractors(item.meaning)]) }));
};

export const buildQuizFromWordIds = (wordIds = []) =>
    wordIds.map(id => WORD_POOL.find(w => w.id === id)).filter(Boolean)
        .map(item => ({ ...item, choices: shuffle([item.meaning, ...pickDistractors(item.meaning)]) }));

export const buildQuiz = (filter, filterType, wordData, userLevel, allowedIds = null, quizCount = DEFAULT_QUIZ_COUNT) => {
    let pool;
    if (filterType === 'topic') {
        pool = WORD_POOL.filter(w => w.category === filter);
    } else {
        pool = filter === '전체' ? WORD_POOL : WORD_POOL.filter(w => w.grade === filter);
    }
    if (allowedIds) pool = pool.filter(w => allowedIds.has(w.hanja_id));
    if (pool.length < 4) pool = allowedIds ? WORD_POOL.filter(w => allowedIds.has(w.hanja_id)) : WORD_POOL;
    return capQuizCount(getWordSRSWeightedPool(pool, wordData, userLevel, quizCount), quizCount)
        .map(item => ({ ...item, choices: shuffle([item.meaning, ...pickDistractors(item.meaning)]) }));
};

export const buildWordQuizQuestions = ({
    categoryFilter,
    contentPool,
    gradeFilter,
    onGetNextWordIds,
    quizCount,
    seenWordIds,
    unlockedIds,
    userLevel,
    viewMode,
    wordData,
}) => {
    if (contentPool) {
        const sharedWordIds = onGetNextWordIds?.(quizCount) || [];
        const sharedQuestions = buildQuizFromWordIds(sharedWordIds);
        return sharedQuestions.length > 0
            ? sharedQuestions
            : buildQuizFromPool(contentPool, wordData, userLevel, seenWordIds || [], quizCount);
    }

    const filter = viewMode === 'topic' ? categoryFilter : gradeFilter;
    return buildQuiz(filter, viewMode, wordData, userLevel, unlockedIds, quizCount);
};

export const getWordQuizSeenIds = (questions = []) => [
    ...new Set(questions.map(question => question.id).filter(v => v != null)),
];

export const didPassWordQuiz = ({ correctCount, total }) =>
    total > 0 && correctCount / total >= 0.7;

export const getWordTermSizeClass = (word = '') => {
    const wordLen = word.length;
    if (wordLen <= 2) return 'word-quiz-term--short';
    if (wordLen === 3) return 'word-quiz-term--medium';
    if (wordLen === 4) return 'word-quiz-term--idiom';
    return '';
};
