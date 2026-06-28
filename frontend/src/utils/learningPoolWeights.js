import { getSRSStatus } from '../hooks/srsUtils.js';

export function getPrimaryGrades(userLevel) {
    if (userLevel <= 2) return ['8급'];
    if (userLevel <= 4) return ['8급', '7급Ⅱ', '7급'];
    if (userLevel <= 6) return ['7급Ⅱ', '7급', '6급Ⅱ'];
    if (userLevel <= 8) return ['7급', '6급Ⅱ', '6급'];
    return ['6급Ⅱ', '6급', '기타'];
}

export function isReview(hanjaId, srsData, masteryData) {
    const card = srsData?.[String(hanjaId)];
    const mastery = masteryData?.[String(hanjaId)];
    const status = getSRSStatus(card);
    return status === 'overdue' || status === 'due' || (mastery?.wrongCount ?? 0) >= 1;
}

export function itemWeight(hanjaId, srsData, masteryData) {
    const card = srsData?.[String(hanjaId)];
    const mastery = masteryData?.[String(hanjaId)];
    const status = getSRSStatus(card);
    if (status === 'overdue') return 5;
    if (status === 'due') return 4;
    if ((mastery?.wrongCount ?? 0) >= 2) return 4;
    if ((mastery?.wrongCount ?? 0) >= 1) return 3;
    if (status === 'new') return 3;
    if (status === 'mastered') return 1;
    return 2;
}

export function wordItemWeight(wordId, wordData) {
    const card = wordData?.[String(wordId)];
    const status = getSRSStatus(card);
    if (status === 'overdue') return 5;
    if (status === 'due') return 4;
    if ((card?.wrongCount ?? 0) >= 2) return 4;
    if ((card?.wrongCount ?? 0) >= 1) return 3;
    if (status === 'new') return 3;
    if (status === 'mastered') return 1;
    return 2;
}

export function weightedSort(items, getWeight) {
    return items
        .map(item => ({ item, score: Math.pow(Math.random(), 1 / Math.max(getWeight(item), 0.01)) }))
        .sort((a, b) => b.score - a.score)
        .map(x => x.item);
}

export function getSRSWeightedPool(pool, srsData = {}, masteryData = {}, userLevel = 1, count = null, priorityIds = null) {
    if (!pool || pool.length === 0) return [];
    const primary = getPrimaryGrades(userLevel);
    const getWeight = (h) => itemWeight(h.id, srsData, masteryData) * (primary.includes(h.grade) ? 3.5 : 1.0);

    if (priorityIds && priorityIds.length > 0) {
        const prioritySet = toIdSet(priorityIds);
        const todayNew = pool.filter(h => prioritySet.has(h.id) && getSRSStatus(srsData?.[String(h.id)]) === 'new');
        const rest = pool.filter(h => !todayNew.includes(h));
        const combined = [...todayNew.sort(() => Math.random() - 0.5), ...weightedSort(rest, getWeight)];
        return count != null ? combined.slice(0, count) : combined;
    }

    const sorted = weightedSort(pool, getWeight);
    return count != null ? sorted.slice(0, count) : sorted;
}

export function getWordSRSWeightedPool(wordPool, wordData = {}, userLevel = 1, count, priorityIds = null) {
    if (!wordPool || wordPool.length === 0) return [];
    const primary = getPrimaryGrades(userLevel);
    const prioritySet = priorityIds ? toIdSet(priorityIds) : null;
    const getWeight = (w) => {
        const srsWeight = wordItemWeight(w.id, wordData);
        const gradeBoost = primary.includes(w.grade) ? 3.5 : 1.0;
        const todayBoost = (prioritySet && prioritySet.has(w.hanja_id)) ? 2.0 : 1.0;
        return srsWeight * gradeBoost * todayBoost;
    };
    const sorted = weightedSort(wordPool, getWeight);
    return sorted.slice(0, Math.min(count, wordPool.length));
}
