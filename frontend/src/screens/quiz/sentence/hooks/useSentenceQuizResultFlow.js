import { useCallback } from 'react';

export const useSentenceQuizResultFlow = ({
    clearCountRef,
    completingRef,
    dailyMapNode,
    missionDone,
    missionXpGrantedRef,
    onBack,
    onStageClear,
    scoreRef,
    setCompleting,
    setGameState,
    setResultStats,
    setShowExitModal,
    shownWordsRef,
    stageClearArgsRef,
    stageClearDeliveredRef,
    totalAnsweredRef,
}) => {
    const endQuiz = useCallback(() => {
        if (completingRef.current) return;
        const finalStats = { correct: scoreRef.current, total: totalAnsweredRef.current, shownWords: [...shownWordsRef.current] };
        const passedMission = finalStats.total > 0 && finalStats.correct / finalStats.total >= 0.7;
        const isFirstClear = clearCountRef.current === 0;
        if (passedMission) clearCountRef.current += 1;
        missionXpGrantedRef.current = (passedMission && isFirstClear && !missionDone) ? 30 : 0;
        stageClearArgsRef.current = [finalStats.correct, finalStats.total, finalStats.shownWords];
        if (!dailyMapNode) {
            onStageClear?.(...stageClearArgsRef.current);
            stageClearDeliveredRef.current = true;
            stageClearArgsRef.current = null;
        }
        setResultStats(finalStats);
        completingRef.current = true;
        setCompleting(true);
        setGameState('result');
    }, [
        clearCountRef,
        completingRef,
        dailyMapNode,
        missionDone,
        missionXpGrantedRef,
        onStageClear,
        scoreRef,
        setCompleting,
        setGameState,
        setResultStats,
        shownWordsRef,
        stageClearArgsRef,
        stageClearDeliveredRef,
        totalAnsweredRef,
    ]);

    const deliverStageClear = useCallback(() => {
        if (stageClearArgsRef.current && !stageClearDeliveredRef.current) {
            onStageClear?.(...stageClearArgsRef.current);
            stageClearDeliveredRef.current = true;
            stageClearArgsRef.current = null;
        }
    }, [onStageClear, stageClearArgsRef, stageClearDeliveredRef]);

    const handleExitConfirm = useCallback(() => {
        setShowExitModal(false);
        onBack();
    }, [onBack, setShowExitModal]);

    const handleResultBack = useCallback(() => {
        deliverStageClear();
        onBack();
    }, [deliverStageClear, onBack]);

    return {
        deliverStageClear,
        endQuiz,
        handleExitConfirm,
        handleResultBack,
    };
};
