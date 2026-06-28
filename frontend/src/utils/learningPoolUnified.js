import { getSRSWeightedPool, weightedSort, wordItemWeight } from './learningPoolWeights.js';
import { getWordIdsForHanja } from './learningPoolWords.js';
import { toIdSet } from './setIdUtils.js';

export function buildUnifiedPool(todayHanjaIds, hanjaData, srsData, masteryData, pastHanjaIds = [], targetReviewRatio = 0.3, wordData = {}) {
    const todayWordIds = getWordIdsForHanja(todayHanjaIds, hanjaData);

    if (!pastHanjaIds.length || targetReviewRatio <= 0) {
        return {
            main: { hanjaIds: todayHanjaIds, wordIds: todayWordIds },
            review: { hanjaIds: [], wordIds: [] },
            ratio: 1.0,
        };
    }

    const maxHanjaReview = Math.round(todayHanjaIds.length * targetReviewRatio / (1 - targetReviewRatio));
    const pastObjects = pastHanjaIds.map(id => hanjaData.find(h => h.id === id)).filter(Boolean);
    const reviewHanjas = maxHanjaReview > 0 ? getSRSWeightedPool(pastObjects, srsData, masteryData, 1, maxHanjaReview) : [];
    const reviewHanjaIds = reviewHanjas.map(h => h.id);

    const maxWordReview = Math.round(todayWordIds.length * targetReviewRatio / (1 - targetReviewRatio));
    const pastWordObjects = pastHanjaIds.flatMap(id => {
        const h = hanjaData.find(h => h.id === id);
        return (h?.words || []).filter(w => w.id && w.word && w.meaning && w.reading && w.type !== 'idiom');
    });
    const reviewWordIds = maxWordReview > 0
        ? weightedSort(pastWordObjects, w => wordItemWeight(w.id, wordData)).slice(0, maxWordReview).map(w => w.id)
        : [];

    const total = todayHanjaIds.length + reviewHanjaIds.length;
    return {
        main: { hanjaIds: todayHanjaIds, wordIds: todayWordIds },
        review: { hanjaIds: reviewHanjaIds, wordIds: reviewWordIds },
        ratio: total > 0 ? todayHanjaIds.length / total : 1.0,
    };
}

export function buildHanjaStage(contentPool, hanjaData, _srsData, _masteryData, seenHanjaIds = [], count = 15) {
    if (!contentPool || !hanjaData) return [];
    const mainIds = toIdSet(contentPool.main?.hanjaIds);
    const reviewIds = toIdSet(contentPool.review?.hanjaIds);
    const mainHanja = hanjaData.filter(h => mainIds.has(h.id));
    const reviewHanja = hanjaData.filter(h => reviewIds.has(h.id));
    const allHanja = [...mainHanja, ...reviewHanja];
    if (allHanja.length === 0) return [];

    const seenSet = toIdSet(seenHanjaIds);
    const allSeen = allHanja.every(h => seenSet.has(h.id));
    const eff = allSeen ? new Set() : seenSet;

    const sh = (a) => [...a].sort(() => Math.random() - 0.5);
    const pickFrom = (pool, n) => {
        if (n <= 0 || pool.length === 0) return [];
        return [...sh(pool.filter(h => !eff.has(h.id))), ...sh(pool.filter(h => eff.has(h.id)))].slice(0, n);
    };

    const ratio = contentPool.ratio ?? 1.0;
    const targetMain = Math.min(Math.round(count * ratio), mainHanja.length);
    const targetReview = Math.min(count - targetMain, reviewHanja.length);
    const mainPicked = pickFrom(mainHanja, targetMain);
    const reviewPicked = pickFrom(reviewHanja, targetReview);
    const usedIds = toIdSet([...mainPicked, ...reviewPicked].map(h => h.id));
    const shortfall = count - mainPicked.length - reviewPicked.length;
    const fillPicked = shortfall > 0 ? pickFrom(mainHanja.filter(h => !usedIds.has(h.id)), shortfall) : [];
    return [...mainPicked, ...reviewPicked, ...fillPicked];
}

export function buildOopsPool(wrongHanjaIds = [], wrongWordIds = []) {
    return {
        main: { hanjaIds: wrongHanjaIds, wordIds: wrongWordIds },
        review: { hanjaIds: [], wordIds: [] },
        ratio: 1.0,
    };
}
