import { SK } from '../../../constants/storageKeys.js';
import HANJA_DATA from '../../../hanja_unified.json';
import { toIdSet } from '../../../utils/setIdUtils.js';
import { wordById } from '../../../utils/wordUtils.js';

export const hanjaById = Object.fromEntries(HANJA_DATA.map(h => [h.id, h]));

export const toDateStr = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const todayStr = toDateStr(new Date());

export const activityLabels = {
  flashcard: 'ext_1596',
  wordQuiz: 'ext_1492',
  sentenceQuiz: 'ext_1493',
  matchGame: 'ext_1574',
  shootGame: 'ext_1573',
  writing: 'ext_1496',
};

export const activityOrder = ['flashcard', 'wordQuiz', 'sentenceQuiz', 'matchGame', 'shootGame', 'writing'];

export const graphTabs = [
  { id: 'questions', label: 'ext_917' },
  { id: 'xp', label: 'XP' },
  { id: 'words', label: 'ext_1541' },
  { id: 'wrong', label: 'ext_277' },
];

export const readStudyLog = () => {
  try { return JSON.parse(localStorage.getItem(SK.STUDY_LOG) || '{}'); } catch { return {}; }
};

export const readMissionHistory = () => {
  try { return JSON.parse(localStorage.getItem(SK.MISSION_HISTORY) || '{}'); } catch { return {}; }
};

export const readStreak = () => {
  try { return JSON.parse(localStorage.getItem('streak_data') || '{}').count || 0; } catch { return 0; }
};

export const uniqueById = (items) => {
  const seen = new Set();
  return items.filter(item => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

export const countActivity = (entry = {}, type) =>
  (entry.activities || []).filter(activity => activity === type).length;

export const getUniqueWordCount = (entry = {}) =>
  toIdSet([
    ...(entry.wordIds || []),
    ...(entry.correctWordIds || []),
    ...(entry.wrongWordIds || []),
  ]).size;

export const getActivityCounts = (entry = {}, missions = []) => {
  const counts = {};
  (entry.activities || []).filter(Boolean).forEach(type => {
    counts[type] = (counts[type] || 0) + 1;
  });
  missions.filter(Boolean).forEach(type => {
    if (!counts[type]) counts[type] = 1;
  });

  // Older builds stored quiz activity by question count. The history screen
  // presents completed sets, so convert only question-sized legacy counts.
  if (counts.wordQuiz >= 6) counts.wordQuiz = Math.ceil(counts.wordQuiz / 6);
  if (counts.sentenceQuiz >= 5) counts.sentenceQuiz = Math.ceil(counts.sentenceQuiz / 5);

  const hasRecordedActivity = Object.keys(counts).length > 0;
  if (!hasRecordedActivity) {
    if (getUniqueWordCount(entry) > 0) counts.wordQuiz = 1;
    if (toIdSet(entry.hanjaIds).size > 0) counts.flashcard = 1;
  }

  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => {
      const ai = activityOrder.indexOf(a.type);
      const bi = activityOrder.indexOf(b.type);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
};

export const getActivityCountMap = (entry = {}, missions = []) => Object.fromEntries(
  getActivityCounts(entry, missions).map(({ type, count }) => [type, count])
);

export const getGraphStats = (entry = {}) => {
  const activityCounts = getActivityCountMap(entry);
  return {
    flashcard: activityCounts.flashcard || 0,
    wordQuiz: activityCounts.wordQuiz || 0,
    sentenceQuiz: activityCounts.sentenceQuiz || 0,
    xp: Number(entry.xp || 0),
    hanja: toIdSet(entry.hanjaIds).size,
    words: getUniqueWordCount(entry),
    wrong: toIdSet(entry.wrongWordIds).size,
  };
};

export const getRecentDates = (count = 14) => {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, idx) => {
    const d = new Date(base);
    d.setDate(base.getDate() - (count - idx - 1));
    return toDateStr(d);
  });
};

export const getEntrySummary = (entry = {}, missions = []) => {
  const hanjas = uniqueById((entry.hanjaIds || []).map(id => hanjaById[id]).filter(Boolean));
  const correctWords = uniqueById((entry.correctWordIds || []).map(id => wordById[id]).filter(Boolean));
  const wrongWords = uniqueById((entry.wrongWordIds || []).map(id => wordById[id]).filter(Boolean));
  const seenWords = uniqueById((entry.wordIds || []).map(id => wordById[id]).filter(Boolean));
  const activityCounts = getActivityCounts(entry, missions);

  return {
    hanjas,
    correctWords,
    wrongWords,
    seenWords,
    activityCounts,
    activities: activityCounts.map(activity => activity.type),
    totalCount: hanjas.length + correctWords.length + wrongWords.length + seenWords.length,
  };
};
