import { useCallback } from 'react';
import { didPassWordQuiz, getWordQuizSeenIds } from '../wordQuizUtils.js';

export const useWordQuizAnswerHandlers = ({
  clearCountRef,
  comboRef,
  completingRef,
  correctCountRef,
  currentIdx,
  dailyMapNode,
  deliverStageClear,
  maxComboRef,
  missionDone,
  missionXpGrantedRef,
  onHanjaAcquired,
  onMarkCorrect,
  onMarkWordWrong,
  onWordCorrect,
  onWordSeen,
  questions,
  setCombo,
  setCompleting,
  setCorrectCount,
  setCurrentAnswered,
  setCurrentIdx,
  setPhase,
  stageClearArgsRef,
}) => {
  const handleCorrect = useCallback((isFirstAttempt) => {
    const currentQuestion = questions[currentIdx];
    if (currentQuestion?.id != null) onWordSeen?.(currentQuestion.id);
    setCurrentAnswered(true);
    if (isFirstAttempt) {
      correctCountRef.current += 1;
      setCorrectCount(correctCountRef.current);
      comboRef.current += 1;
      setCombo(comboRef.current);
      maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
    } else {
      comboRef.current = 0;
      setCombo(0);
    }
    if (onHanjaAcquired && currentQuestion?.hanja_id) onHanjaAcquired(currentQuestion.hanja_id, 0);
    if (onMarkCorrect && currentQuestion?.hanja_id) onMarkCorrect(currentQuestion.hanja_id);
    if (onWordCorrect && currentQuestion?.id != null) onWordCorrect(currentQuestion.id);
  }, [
    comboRef,
    correctCountRef,
    currentIdx,
    maxComboRef,
    onHanjaAcquired,
    onMarkCorrect,
    onWordCorrect,
    onWordSeen,
    questions,
    setCombo,
    setCorrectCount,
    setCurrentAnswered,
  ]);

  const handleWrong = useCallback(() => {
    comboRef.current = 0;
    setCombo(0);
    const currentQuestion = questions[currentIdx];
    if (onMarkWordWrong && currentQuestion?.id != null) {
      onMarkWordWrong(
        currentQuestion.id,
        currentQuestion.hanja_id,
        currentQuestion.reading,
        currentQuestion.meaning,
        currentQuestion.word
      );
    }
  }, [comboRef, currentIdx, onMarkWordWrong, questions, setCombo]);

  const handleNext = useCallback(() => {
    if (completingRef.current) return;
    const next = currentIdx + 1;
    if (next < questions.length) {
      setCurrentAnswered(false);
      setCurrentIdx(next);
      return;
    }

    const seenWords = getWordQuizSeenIds(questions);
    if (didPassWordQuiz({ correctCount: correctCountRef.current, total: questions.length })) {
      const isFirstClear = clearCountRef.current === 0;
      clearCountRef.current += 1;
      missionXpGrantedRef.current = (isFirstClear && !missionDone) ? 30 : 0;
    } else {
      missionXpGrantedRef.current = 0;
    }
    stageClearArgsRef.current = [correctCountRef.current, questions.length, maxComboRef.current, seenWords];
    if (!dailyMapNode) deliverStageClear();
    completingRef.current = true;
    setCompleting(true);
    setPhase('result');
  }, [
    clearCountRef,
    completingRef,
    correctCountRef,
    currentIdx,
    dailyMapNode,
    deliverStageClear,
    maxComboRef,
    missionDone,
    missionXpGrantedRef,
    questions,
    setCompleting,
    setCurrentAnswered,
    setCurrentIdx,
    setPhase,
    stageClearArgsRef,
  ]);

  return {
    handleCorrect,
    handleNext,
    handleWrong,
  };
};
