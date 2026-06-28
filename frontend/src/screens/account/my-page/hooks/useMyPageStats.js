import { useMemo } from 'react';
import { SK } from '../../../../constants/storageKeys.js';

const readJson = (key, fallback = {}) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

export const useMyPageStats = ({ streak, totalStats }) => {
  const studyLog = useMemo(() => {
    const raw = readJson(SK.STUDY_LOG);
    return raw.days || {};
  }, []);

  const missionHistory = useMemo(() => readJson('mission_history'), []);
  const streakCount = streak?.count || 0;

  const stats = useMemo(() => {
    const allCorrect = new Set();
    const allWrong = new Set();
    let studyDays = 0;

    const allLoggedDays = new Set([
      ...Object.keys(studyLog),
      ...Object.keys(missionHistory),
    ]);

    allLoggedDays.forEach((dateKey) => {
      const entry = studyLog[dateKey] || {};
      const hasMission = missionHistory[dateKey]?.length > 0;
      const hasActivity = hasMission
        || entry.hanjaIds?.length > 0
        || entry.wordIds?.length > 0
        || entry.words?.length > 0
        || entry.correctWordIds?.length > 0
        || entry.wrongWordIds?.length > 0;

      if (hasActivity) studyDays++;
      (entry.correctWordIds || []).forEach(id => allCorrect.add(id));
      (entry.wrongWordIds || []).forEach(id => allWrong.add(id));
    });

    const answerCount = allCorrect.size + allWrong.size;
    const accuracy = answerCount > 0
      ? Math.round((allCorrect.size / answerCount) * 100)
      : null;

    const totalActivities = totalStats
      ? (totalStats.matchGame || 0)
        + (totalStats.shootGame || 0)
        + (totalStats.wordQuiz || 0)
        + (totalStats.sentenceQuiz || 0)
        + (totalStats.writing || 0)
      : 0;

    return { studyDays, accuracy, totalActivities };
  }, [studyLog, missionHistory, totalStats]);

  return { stats, streakCount };
};
