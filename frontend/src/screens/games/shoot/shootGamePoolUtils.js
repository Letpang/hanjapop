import { buildHanjaStage, getSRSWeightedPool } from '../../../utils/learningPool.js';
import { toIdSet } from '../../../utils/setIdUtils.js';

export const buildShootGamePoolData = ({
    contentPool,
    hanjaData,
    selectedCategory,
    selectedGrade,
    unlockedIds,
    viewMode,
}) => {
    let pool = [];
    if (contentPool) {
        const allIds = toIdSet([
            ...(contentPool.main?.hanjaIds || []),
            ...(contentPool.review?.hanjaIds || []),
        ]);
        const wordIds = toIdSet([
            ...(contentPool.main?.wordIds || []),
            ...(contentPool.review?.wordIds || []),
        ]);
        if (wordIds.size > 0) {
            hanjaData.forEach(h => {
                if (h.words && h.words.some(w => wordIds.has(w.id))) {
                    allIds.add(h.id);
                }
            });
        }
        pool = hanjaData.filter(h => allIds.has(h.id));

        if (pool.length === 0) {
            pool = hanjaData.filter(h => h.grade === '8급');
        }
    } else if (viewMode === 'grade') {
        if (selectedGrade === '전체') pool = hanjaData;
        else pool = hanjaData.filter(h => h.grade === selectedGrade);
        const unlockedSet = toIdSet(unlockedIds);
        const locked = pool.filter(h => unlockedSet.has(h.id));
        pool = locked.length > 0 ? locked : pool;
    } else {
        const full = hanjaData.filter(h => h.category === selectedCategory);
        const unlockedSet = toIdSet(unlockedIds);
        const locked = full.filter(h => unlockedSet.has(h.id));
        pool = locked.length > 0 ? locked : full;
    }
    const relevantWords = pool.filter(h => h.words && h.words.length > 0);
    return { chars: pool, words: relevantWords };
};

export const buildShootFlatWordPool = ({ contentPool, gameWords }) => {
    const contentWordIds = toIdSet([
        ...(contentPool?.main?.wordIds || []),
        ...(contentPool?.review?.wordIds || []),
    ]);
    const shouldLimitToContentWords = contentWordIds.size > 0;

    return gameWords.flatMap(h =>
        (h.words || [])
            .filter(w => (!shouldLimitToContentWords || contentWordIds.has(w.id)) && w.word && w.meaning && w.reading)
            .map(w => ({
                id: h.id,
                wordId: w.id,
                hanja: w.word,
                meaning: w.meaning,
                sound: w.reading,
                category: h.category,
            }))
    );
};

export const orderShootWordQueue = ({
    contentPool,
    currentDayHanjaIds,
    lastSpawnedWord,
    pool,
}) => {
    if (!pool || pool.length === 0) return [];

    let ordered;
    if (!contentPool && currentDayHanjaIds?.length > 0) {
        const todaySet = toIdSet(currentDayHanjaIds);
        const todayWords = pool.filter(w => todaySet.has(w.id)).sort(() => Math.random() - 0.5);
        const otherWords = pool.filter(w => !todaySet.has(w.id)).sort(() => Math.random() - 0.5);
        ordered = [...todayWords, ...otherWords];
    } else {
        ordered = [...pool].sort(() => Math.random() - 0.5);
    }

    if (ordered.length > 1 && ordered[0]?.hanja === lastSpawnedWord) {
        ordered = [...ordered.slice(1), ordered[0]];
    }

    return ordered;
};

export const buildShootHanjaStage = ({
    contentPool,
    currentDayHanjaIds,
    effectiveDiff,
    gameChars,
    masteryData,
    seenHanjaIds,
    srsData,
    userLevel,
}) => {
    let stage;
    if (contentPool) {
        stage = buildHanjaStage(contentPool, gameChars, srsData, masteryData, seenHanjaIds || [], effectiveDiff.killsPerWave);
    } else {
        stage = getSRSWeightedPool(
            gameChars,
            srsData,
            masteryData,
            userLevel,
            effectiveDiff.killsPerWave,
            currentDayHanjaIds?.length > 0 ? currentDayHanjaIds : null
        );
    }

    if (stage.length === 0) {
        stage = [...gameChars].sort(() => Math.random() - 0.5).slice(0, effectiveDiff.killsPerWave);
    }

    return stage;
};

export const getShootWordChance = ({ contentPool, totalHanja, totalWords }) => {
    const baseWordChance = totalWords / Math.max(totalWords + totalHanja, 1);
    return totalWords > 0
        ? Math.min(0.75, contentPool ? Math.max(0.45, baseWordChance) : baseWordChance)
        : 0;
};

export const getShootContentKey = (contentPool) => {
    const normalizeIds = (ids) => [...(ids || [])].map(Number).sort((a, b) => a - b);
    return JSON.stringify({
        mainHanja: normalizeIds(contentPool?.main?.hanjaIds),
        reviewHanja: normalizeIds(contentPool?.review?.hanjaIds),
        mainWords: normalizeIds(contentPool?.main?.wordIds),
        reviewWords: normalizeIds(contentPool?.review?.wordIds),
    });
};
