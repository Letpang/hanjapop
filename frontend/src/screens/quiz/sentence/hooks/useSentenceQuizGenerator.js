import { useCallback } from 'react';
import HANJA_DATA from '../../../../hanja_unified.json';
import {
    createSentenceWordQuiz,
    createSimpleSentenceQuiz,
} from '../sentenceQuizUtils.js';

export const useSentenceQuizGenerator = ({
    activeHanjaSet,
    endQuiz,
    lastSimpleHanjaIdRef,
    lastWordIdRef,
    onWordSeen,
    pickNextFromPool,
    reviewQueueRef,
    seenWordIds,
    sessionPlan,
    setCurrentQuiz,
    setGameState,
    setLastHanjaId,
    setOptions,
    setQuestionKey,
    shownSimpleHanjaRef,
    shownWordsRef,
}) => useCallback(() => {
    if (activeHanjaSet.length === 0) return;
    setQuestionKey(k => k + 1);

    const hasWordPool = sessionPlan.normalPool.length > 0 || reviewQueueRef.current.length > 0;

    if (!hasWordPool) {
        const nextQuiz = createSimpleSentenceQuiz({
            activeHanjaSet,
            hanjaData: HANJA_DATA,
            lastSimpleHanjaId: lastSimpleHanjaIdRef.current,
            shownSimpleHanjaIds: shownSimpleHanjaRef.current,
        });
        if (!nextQuiz) {
            endQuiz();
            return;
        }
        shownSimpleHanjaRef.current = nextQuiz.nextShownSimpleHanjaIds;
        lastSimpleHanjaIdRef.current = nextQuiz.lastSimpleHanjaId;
        setCurrentQuiz(nextQuiz.quiz);
        setOptions(nextQuiz.options);
    } else {
        let selectedHanja;
        if (reviewQueueRef.current.length > 0) {
            selectedHanja = reviewQueueRef.current.shift();
            setLastHanjaId(selectedHanja?.id ?? null);
        } else {
            selectedHanja = pickNextFromPool();
        }
        if (!selectedHanja) {
            endQuiz();
            return;
        }
        const nextQuiz = createSentenceWordQuiz({
            lastWordId: lastWordIdRef.current,
            queueItem: selectedHanja,
            seenWordIds,
            shownWords: shownWordsRef.current,
        });
        if (!nextQuiz) {
            endQuiz();
            return;
        }
        shownWordsRef.current = nextQuiz.nextShownWords;
        lastWordIdRef.current = nextQuiz.lastWordId;
        if (nextQuiz.targetWord?.id != null) {
            onWordSeen?.(nextQuiz.targetWord.id);
        }
        setCurrentQuiz(nextQuiz.quiz);
        setOptions(nextQuiz.options);
    }
    setGameState('playing');
}, [
    activeHanjaSet,
    endQuiz,
    lastSimpleHanjaIdRef,
    lastWordIdRef,
    onWordSeen,
    pickNextFromPool,
    reviewQueueRef,
    seenWordIds,
    sessionPlan,
    setCurrentQuiz,
    setGameState,
    setLastHanjaId,
    setOptions,
    setQuestionKey,
    shownSimpleHanjaRef,
    shownWordsRef,
]);
