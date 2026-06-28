const STUDY_LOG_KEY = 'study_log';

export const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const createEmptyStudyLog = () => ({
  total: { totalDays: 0, lastAttendDate: new Date().toDateString() },
  days: {},
});

export const migrateStudyLog = () => {
  try {
    const existing = localStorage.getItem(STUDY_LOG_KEY);
    if (existing) {
      const parsed = JSON.parse(existing);
      if (parsed.total && parsed.days) return parsed;
    }

    const oldTotal = JSON.parse(localStorage.getItem('total_activity_stats') || '{}');
    const oldDays = JSON.parse(localStorage.getItem('daily_study_log') || '{}');
    const oldToday = JSON.parse(localStorage.getItem('today_stats') || '{}');

    const today = new Date().toDateString();
    const total = {
      totalDays: oldTotal.totalDays || 0,
      lastAttendDate: oldTotal.lastAttendDate || today,
      shootGame: oldTotal.shootGame || 0,
      matchGame: oldTotal.matchGame || 0,
      writing: oldTotal.writing || 0,
      wordQuiz: oldTotal.wordQuiz || 0,
      sentenceQuiz: oldTotal.sentenceQuiz || 0,
      flashcard: oldTotal.flashcard || 0,
      wordCorrect: oldTotal.wordCorrect || 0,
    };

    if (oldToday.date === today) {
      ['shootGame', 'matchGame', 'writing', 'wordQuiz', 'sentenceQuiz', 'flashcard'].forEach(k => {
        if (oldToday[k]) total[k] = Math.max(total[k], oldToday[k]);
      });
    }

    const days = {};
    Object.entries(oldDays).forEach(([date, v]) => {
      days[date] = {
        hanjaIds: v.hanjaIds || [],
        wordIds: v.wordIds || [],
        correctWordIds: v.correctWordIds || [],
        wrongWordIds: v.wrongWordIds || [],
        activities: [],
        xp: v.xp || 0,
      };
    });

    const result = { total, days };
    saveStudyLog(result);
    return result;
  } catch {
    return createEmptyStudyLog();
  }
};

export const saveStudyLog = (data) => {
  try { localStorage.setItem(STUDY_LOG_KEY, JSON.stringify(data)); } catch {}
};

export const ensureToday = (log) => {
  const today = getTodayStr();
  if (!log.days[today]) {
    log.days[today] = { hanjaIds: [], wordIds: [], correctWordIds: [], wrongWordIds: [], activities: [], xp: 0 };
  }
  log.days[today].xp = log.days[today].xp || 0;
  return log.days[today];
};

export const ensureAttendance = (data) => {
  const today = new Date().toDateString();
  if (data.total.lastAttendDate !== today) {
    data.total.totalDays = (data.total.totalDays || 0) + 1;
    data.total.lastAttendDate = today;
    saveStudyLog(data);
  }
  return data;
};

export const cloneStudyLog = (log) => JSON.parse(JSON.stringify(log));

export const getTodayStats = (log) => {
  const today = getTodayStr();
  const acts = log.days[today]?.activities || [];
  const count = (type) => acts.filter(a => a === type).length;
  return {
    flashcard: count('flashcard'),
    writing: count('writing'),
    matchGame: count('matchGame'),
    shootGame: count('shootGame'),
    sentenceQuiz: count('sentenceQuiz'),
    wordQuiz: count('wordQuiz'),
  };
};
