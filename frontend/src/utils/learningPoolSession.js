import { getSRSStatus } from '../hooks/srsUtils.js';
import { isReview, itemWeight, weightedSort } from './learningPoolWeights.js';
import { toIdSet } from './setIdUtils.js';

export function buildSessionPlan(pool, srsData = {}, masteryData = {}, priorityIds = null, seenIds = null) {
    if (!pool || pool.length === 0) return { reviewQueue: [], normalPool: [] };

    const prioritySet = priorityIds ? toIdSet(priorityIds) : null;
    const seenSet = seenIds ? toIdSet(seenIds) : null;

    const isTodayNew = (h) =>
        prioritySet &&
        prioritySet.has(h.id) &&
        getSRSStatus(srsData?.[String(h.id)]) === 'new';

    const todayItems = pool.filter(h => isTodayNew(h));
    const reviewItems = pool.filter(h => isReview(h.id, srsData, masteryData) && !isTodayNew(h));
    const normalItems = pool.filter(h => !isReview(h.id, srsData, masteryData) && !isTodayNew(h));

    const sortedReview = weightedSort(reviewItems, h => itemWeight(h.id, srsData, masteryData));
    const reviewQueue = [...todayItems.sort(() => Math.random() - 0.5), ...sortedReview];

    const unseenNormal = seenSet ? normalItems.filter(h => !seenSet.has(h.id)) : normalItems;
    const seenNormal = seenSet ? normalItems.filter(h => seenSet.has(h.id)) : [];
    const basePool = normalItems.length > 0
        ? [...unseenNormal, ...seenNormal]
        : pool;

    return {
        reviewQueue,
        normalPool: basePool,
    };
}
