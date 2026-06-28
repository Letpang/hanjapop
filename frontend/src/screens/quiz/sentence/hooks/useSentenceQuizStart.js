import { useCallback } from 'react';
import { buildContentSentencePlan } from '../sentenceQuizUtils.js';

export const useSentenceQuizStart = ({
    activeHanjaSet,
    buildMainQueue,
    clearCountRef,
    completingRef,
    contentPool,
    currentDayHanjaIds,
    initQueues,
    lastSimpleHanjaIdRef,
    lastWordIdRef,
    masteryData,
    onGetNextWordIds,
    onStageClear,
    quizCount,
    scoreRef,
    seenHanjaIds,
    sessionPlan,
    setCombo,
    setCompleting,
    setCurrentAnswered,
    setCurrentQuiz,
    setGameState,
    setPlannedQuizTotal,
    setResultStats,
    setScore,
    setStarted,
    setTotalAnswered,
    shownSimpleHanjaRef,
    shownWordsRef,
    srsData,
    stageClearArgsRef,
    stageClearDeliveredRef,
    totalAnsweredRef,
}) => useCallback((overridePlan) => {
    if (stageClearArgsRef.current && !stageClearDeliveredRef.current) {
        onStageClear?.(...stageClearArgsRef.current);
        stageClearDeliveredRef.current = true;
        stageClearArgsRef.current = null;
    }

    let plan = overridePlan;
    if (!plan) {
        if (contentPool) {
            plan = buildContentSentencePlan({
                activeHanjaSet,
                contentPool,
                masteryData,
                onGetNextWordIds,
                quizCount,
                seenHanjaIds,
                srsData,
            });
        } else if (currentDayHanjaIds?.length > 0) {
            const queue = buildMainQueue();
            if (queue?.length > 0) plan = { reviewQueue: queue, normalPool: [] };
        }
    }

    const effectivePlan = plan || sessionPlan;
    const plannedCount = (effectivePlan.reviewQueue?.length || 0) + (effectivePlan.normalPool?.length || 0);
    setPlannedQuizTotal(plannedCount > 0 ? Math.min(quizCount, plannedCount) : quizCount);
    initQueues(effectivePlan);
    shownWordsRef.current = [];
    shownSimpleHanjaRef.current = [];
    lastWordIdRef.current = null;
    lastSimpleHanjaIdRef.current = null;
    stageClearDeliveredRef.current = false;
    completingRef.current = false;
    clearCountRef.current = 0;
    setCompleting(false);
    setScore(0);
    scoreRef.current = 0;
    setTotalAnswered(0);
    totalAnsweredRef.current = 0;
    setResultStats(null);
    setCombo(0);
    setCurrentAnswered(false);
    setCurrentQuiz(null);
    setStarted(true);
    setGameState('playing');
}, [
    activeHanjaSet,
    buildMainQueue,
    clearCountRef,
    completingRef,
    contentPool,
    currentDayHanjaIds,
    initQueues,
    lastSimpleHanjaIdRef,
    lastWordIdRef,
    masteryData,
    onGetNextWordIds,
    onStageClear,
    quizCount,
    scoreRef,
    seenHanjaIds,
    sessionPlan,
    setCombo,
    setCompleting,
    setCurrentAnswered,
    setCurrentQuiz,
    setGameState,
    setPlannedQuizTotal,
    setResultStats,
    setScore,
    setStarted,
    setTotalAnswered,
    shownSimpleHanjaRef,
    shownWordsRef,
    srsData,
    stageClearArgsRef,
    stageClearDeliveredRef,
    totalAnsweredRef,
]);
