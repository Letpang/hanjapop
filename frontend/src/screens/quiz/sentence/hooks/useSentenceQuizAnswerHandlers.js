import { useCallback } from 'react';

export const useSentenceQuizAnswerHandlers = ({
    currentQuiz,
    endQuiz,
    generateQuiz,
    normalQueueRef,
    onHanjaAcquired,
    onMarkCorrect,
    onMarkWordWrong,
    onMarkWrong,
    onWordCorrect,
    plannedQuizTotal,
    reviewQueueRef,
    scoreRef,
    setCombo,
    setCurrentAnswered,
    setScore,
    setTotalAnswered,
    totalAnsweredRef,
}) => {
    const handleCorrect = useCallback(() => {
        totalAnsweredRef.current += 1;
        setTotalAnswered(totalAnsweredRef.current);
        scoreRef.current += 1;
        setScore(scoreRef.current);
        setCombo(c => c + 1);
        setCurrentAnswered(true);
        if (onHanjaAcquired) onHanjaAcquired(null, 10);
        const hanjaId = currentQuiz?._hanjaId || null;
        if (onMarkCorrect && hanjaId) onMarkCorrect(hanjaId);
        if (currentQuiz?.type === 'sentence' && currentQuiz.target?.id != null) onWordCorrect?.(currentQuiz.target.id);
    }, [
        currentQuiz,
        onHanjaAcquired,
        onMarkCorrect,
        onWordCorrect,
        scoreRef,
        setCombo,
        setCurrentAnswered,
        setScore,
        setTotalAnswered,
        totalAnsweredRef,
    ]);

    const handleWrong = useCallback(() => {
        const hanjaId = currentQuiz?._hanjaId || null;
        if (currentQuiz?.type === 'sentence' && onMarkWordWrong && currentQuiz.target) {
            onMarkWordWrong(currentQuiz.target.id, hanjaId, currentQuiz.target.reading, currentQuiz.target.meaning, currentQuiz.target.word);
        } else if (onMarkWrong && hanjaId) {
            onMarkWrong(hanjaId);
        }
    }, [currentQuiz, onMarkWordWrong, onMarkWrong]);

    const handleNext = useCallback(() => {
        setCurrentAnswered(false);
        const poolExhausted = reviewQueueRef.current.length === 0 && normalQueueRef.current.length === 0;
        if (totalAnsweredRef.current >= plannedQuizTotal || poolExhausted) {
            endQuiz();
        } else {
            generateQuiz();
        }
    }, [
        endQuiz,
        generateQuiz,
        normalQueueRef,
        plannedQuizTotal,
        reviewQueueRef,
        setCurrentAnswered,
        totalAnsweredRef,
    ]);

    return {
        handleCorrect,
        handleNext,
        handleWrong,
    };
};
