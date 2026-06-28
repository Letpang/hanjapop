import { useCallback } from 'react';
import { useCurriculumProgress } from '../../hooks/useCurriculumProgress.js';
import { useDailyMission } from '../../hooks/useDailyMission.js';
import { useHanjaData } from '../../hooks/useHanjaData.js';
import { useStudyLog } from '../../hooks/useStudyLog.js';
import { useWordData } from '../../hooks/useWordData.js';
import { useSessionContent } from './useSessionContent.js';

export const useAppLearningState = ({
  selectedGrade,
  selectedPastStage,
  sessionDoneToday,
}) => {
  const curriculum = useCurriculumProgress(sessionDoneToday);
  const hanja = useHanjaData();
  const word = useWordData();

  const {
    log: studyLog,
    totalStats,
    logHanja,
    logWord,
    logCorrectWord,
    logWrongWord,
    logActivity,
    logXp,
  } = useStudyLog();

  const sessionContent = useSessionContent({
    currentDay: curriculum.currentDay,
    currentDayData: curriculum.currentDayData,
    completedDay: curriculum.completedDay,
    clearedHanjaIds: curriculum.clearedHanjaIds,
    hanjaData: hanja.hanjaData,
    selectedGrade,
    selectedPastStage,
    wordData: word.wordData,
  });

  const dailyMission = useDailyMission(
    sessionDoneToday,
    sessionContent.activeStage,
    curriculum.journeyRound,
  );

  const sessionMissions = selectedPastStage
    ? (dailyMission.missions || []).map((mission) => ({ ...mission, done: false }))
    : dailyMission.missions;

  const addMainSeenWords = useCallback((wordIds) => {
    if (!wordIds?.length) return;
    wordIds.filter(Boolean).forEach(logWord);
  }, [logWord]);

  return {
    ...curriculum,
    ...dailyMission,
    ...hanja,
    ...sessionContent,
    ...word,
    addMainSeenWords,
    addTodayStat: logActivity,
    logCorrectWord,
    logHanja,
    logWord,
    logWrongWord,
    logXp,
    sessionMissions,
    studyLog,
    totalStats,
  };
};
