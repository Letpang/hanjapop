import { useState } from 'react';
import DAILY_CURRICULUM from '../../../data/dailyCurriculum.js';
import useDailySessionContent, { FINAL_HANJA_COUNT, getTodayDayNumber } from './useDailySessionContent.js';
import useDailySessionProgress from './useDailySessionProgress.js';

const useDailySessionController = ({
  onComplete,
  onAdvanceDay,
  currentDay,
  journeyRound,
  srsData,
  masteryData,
  wordData,
  onMarkCorrect,
  onMarkSeen,
  onMarkWordWrong,
  onWordCorrect,
  onWordSeen,
  selectedCharacter,
  updateMissionProgress,
  addTodayStat,
  addBonusXp,
  getRewardPreview,
  onHanjaAcquired,
  userXp,
  missions,
  onMapIdle,
}) => {
  const previewFinalJourney = import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview-final-journey');
  const [dayNumber, setDayNumber] = useState(() => (
    previewFinalJourney ? DAILY_CURRICULUM.length : (currentDay || getTodayDayNumber())
  ));

  const content = useDailySessionContent({
    dayNumber,
    journeyRound,
    srsData,
    masteryData,
    wordData,
  });

  const progress = useDailySessionProgress({
    previewFinalJourney,
    updateMissionProgress,
    onMapIdle,
  });

  const goIntro = () => progress.setStep('intro');
  const goQuizPick = () => progress.setStep('quizPick');
  const goGamePick = () => progress.setStep('dice');

  const completeFlashcards = () => {
    onHanjaAcquired?.(null, 30);
    addTodayStat?.('flashcard');
    // 한자 카드는 기획 의도에 따라 미션(퀘스트)으로 카운트하지 않음
    progress.setResumeStep('quizPick');
    goQuizPick();
  };

  const completeQuiz = () => {
    progress.setResumeStep('dice');
    goGamePick();
  };

  const completeResults = () => {
    onAdvanceDay?.();
    onComplete({
      isFinalJourney: dayNumber >= DAILY_CURRICULUM.length,
      hanjaCount: FINAL_HANJA_COUNT,
    });
  };

  const continueNextDay = () => {
    const nextDay = dayNumber + 1;
    const nextMissionKey = journeyRound > 1
      ? `stage_missions_r${journeyRound}_${nextDay}`
      : `stage_missions_${nextDay}`;
    try { localStorage.removeItem(nextMissionKey); } catch {}
    onAdvanceDay?.();
    setDayNumber(nextDay);
    progress.resetForNextDay();
  };

  const quizStageProps = {
    onBack: goQuizPick,
    onComplete: completeQuiz,
    contentPool: content.contentPool,
    getNextWordIds: content.getNextWordIds,
    selectedCharacter,
    missions,
    userXp,
    getRewardPreview,
    onHanjaAcquired,
    onMarkWordWrong,
    onWordCorrect,
    srsData,
    masteryData,
    wordData,
    seenHanjaIds: progress.seenHanjaIds,
    seenWordIds: progress.seenWordIds,
    markHanjaSeen: progress.markHanjaSeen,
    markWordSeen: progress.markWordSeen,
    onWordSeen,
    trackMission: progress.trackMission,
    addBonusXp,
    addTodayStat,
  };

  const gameStageProps = {
    onBack: goGamePick,
    finishSession: progress.finishSession,
    contentPool: content.contentPool,
    selectedCharacter,
    missions,
    getRewardPreview,
    onHanjaAcquired,
    onMarkCorrect,
    onMarkWordWrong,
    onWordCorrect,
    srsData,
    masteryData,
    currentDay: dayNumber,
    seenHanjaIds: progress.seenHanjaIds,
    seenWordIds: progress.seenWordIds,
    markHanjaSeen: progress.markHanjaSeen,
    markWordSeen: progress.markWordSeen,
    onWordSeen,
    trackMission: progress.trackMission,
    addBonusXp,
    addTodayStat,
  };

  const introProps = {
    dayNumber,
    theme: content.dayData.theme,
    todayHanja: content.todayFullHanja,
    onBack: progress.continuedNextRef.current ? () => onComplete({ skipLoginModal: true }) : onComplete,
    onStart: () => progress.setStep(progress.resumeStep),
    resumeStep: progress.resumeStep,
  };

  const flashcardProps = {
    items: content.todayFullHanja,
    getRewardPreview,
    onBack: goIntro,
    onCardFlip: (id) => {
      if (id) onMarkSeen?.(id);
    },
    onStageClear: completeFlashcards,
  };

  return {
    dayNumber,
    dayData: content.dayData,
    todayHanja: content.todayHanja,
    step: progress.step,
    setStep: progress.setStep,
    resultMsg: progress.resultMsg,
    chosenGame: progress.chosenGame,
    setChosenGame: progress.setChosenGame,
    chosenQuiz: progress.chosenQuiz,
    setChosenQuiz: progress.setChosenQuiz,
    sessionDoneTypesRef: progress.sessionDoneTypesRef,
    sessionDoneCount: progress.sessionDoneCount,
    introProps,
    flashcardProps,
    quizStageProps,
    gameStageProps,
    completeResults,
    continueNextDay,
  };
};

export default useDailySessionController;
