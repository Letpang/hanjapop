import DAILY_CURRICULUM from '../data/dailyCurriculum.js';

/**
 * completedDay까지 완료된 한자 ID 배열 반환 (id null 제외)
 */
export const getClearedHanjaIds = (completedDay) => {
    const ids = new Set();
    const limit = Math.min(completedDay, DAILY_CURRICULUM.length);
    for (let i = 0; i < limit; i++) {
        DAILY_CURRICULUM[i].hanja.forEach(h => { if (h.id) ids.add(h.id); });
    }
    return [...ids];
};

/**
 * 특정 day가 복습 게이트 or 보스전인지
 */
export const isGateDay = (dayIndex) => {
    const entry = DAILY_CURRICULUM[dayIndex];
    return entry ? (!!entry.reviewGate || !!entry.boss) : false;
};

export { DAILY_CURRICULUM };
