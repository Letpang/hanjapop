import { useCallback, useMemo, useRef } from 'react';
import { buildSessionPlan } from '../../../../utils/learningPool.js';
import { buildMainSentenceQueue } from '../sentenceQuizUtils.js';

export const useSentenceQuizQueues = ({
    activeHanjaSet,
    contentPool,
    currentDayHanjaIds,
    mainSeenHanjaIds,
    masteryData,
    quizCount,
    seenHanjaIds,
    srsData,
    userLevel,
}) => {
    const reviewQueueRef = useRef([]);
    const normalQueueRef = useRef([]);
    const lastHanjaIdRef = useRef(null);

    const sessionPlan = useMemo(() => {
        const base = activeHanjaSet.filter(h => h.words && h.words.length > 0);
        return buildSessionPlan(base, srsData, masteryData, contentPool ? null : currentDayHanjaIds, seenHanjaIds?.length > 0 ? seenHanjaIds : null);
    }, [activeHanjaSet, srsData, masteryData, contentPool, currentDayHanjaIds, seenHanjaIds]);

    const buildMainQueue = useCallback(() => buildMainSentenceQueue({
        activeHanjaSet,
        currentDayHanjaIds,
        mainSeenHanjaIds,
        masteryData,
        quizCount,
        srsData,
        userLevel,
    }), [activeHanjaSet, currentDayHanjaIds, mainSeenHanjaIds, masteryData, quizCount, srsData, userLevel]);

    const initQueues = useCallback((overridePlan) => {
        const plan = overridePlan || sessionPlan;
        reviewQueueRef.current = [...plan.reviewQueue].sort(() => 0.5 - Math.random());
        normalQueueRef.current = [...plan.normalPool].sort(() => 0.5 - Math.random());
        lastHanjaIdRef.current = null;
    }, [sessionPlan]);

    const pickNextFromPool = useCallback(() => {
        if (normalQueueRef.current.length === 0) return null;
        const next = normalQueueRef.current.shift();
        lastHanjaIdRef.current = next?.id ?? null;
        return next;
    }, []);

    const setLastHanjaId = useCallback((hanjaId) => {
        lastHanjaIdRef.current = hanjaId;
    }, []);

    return {
        buildMainQueue,
        initQueues,
        normalQueueRef,
        pickNextFromPool,
        reviewQueueRef,
        sessionPlan,
        setLastHanjaId,
    };
};
