import { SK } from '../../../constants/storageKeys.js';
import IDIOMS from '../../../data/idioms.js';
import { localizeIdioms } from '../../../data/idiomI18nKeys.js';
import DAILY_CURRICULUM from '../../../data/dailyCurriculum.js';
import HANJA_DATA from '../../../hanja_unified.json';
import { wordById } from '../../../utils/wordUtils.js';

const hanjaById = Object.fromEntries(HANJA_DATA.map(h => [h.id, h]));

const hanjaIdToDay = {};
DAILY_CURRICULUM.forEach(({ day, hanja }) => {
  hanja.forEach(h => {
    hanjaIdToDay[h.id] = day;
  });
});

const IDIOM_WRONG_KEY = 'idiom_wrong_data';

export const FILTERS = [
  { id: 'all', label: 'ext_281' },
  { id: 'wrong', label: 'ext_277' },
  { id: 'correct', label: 'ext_275' },
];

export const TABS = [
  { id: 'words', label: 'ext_494' },
  { id: 'hanja', label: 'ext_479' },
  { id: 'idioms', label: 'ext_1391' },
];

const readStoredJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
};

const includesQuery = (values, normalizedQuery) => {
  if (!normalizedQuery) return true;
  return values
    .filter(Boolean)
    .some(value => String(value).toLowerCase().includes(normalizedQuery));
};

export const collectVocabulary = (t) => {
  const log = readStoredJson(SK.STUDY_LOG);
  const wordData = readStoredJson(SK.WORD_DATA);
  const hanjaData = readStoredJson(SK.HANJA_DATA);
  const idiomWrongData = readStoredJson(IDIOM_WRONG_KEY);
  const days = log.days || {};
  const wordIds = new Set();
  const hanjaIds = new Set();
  const localizedIdioms = localizeIdioms(IDIOMS, t);
  const idiomByHanja = new Map(localizedIdioms.map((idiom) => [idiom.hanja, idiom]));

  Object.values(days).forEach(entry => {
    (entry.hanjaIds || []).forEach(id => hanjaIds.add(Number(id)));
    (entry.wordIds || []).forEach(id => wordIds.add(Number(id)));
    (entry.correctWordIds || []).forEach(id => wordIds.add(Number(id)));
    (entry.wrongWordIds || []).forEach(id => wordIds.add(Number(id)));
  });

  Object.keys(wordData).forEach(id => wordIds.add(Number(id)));
  Object.keys(hanjaData).forEach(id => hanjaIds.add(Number(id)));

  const words = [...wordIds]
    .map(id => {
      const word = wordById[id];
      if (!word) return null;
      const memory = wordData[String(id)] || {};
      const nextReview = memory.nextReview || null;
      const hanjaId = memory.hanjaId ?? word.hanjaId ?? null;
      const day = hanjaId ? (hanjaIdToDay[hanjaId] ?? null) : null;
      return {
        ...word,
        wrongCount: memory.wrongCount || 0,
        correctCount: memory.correctCount || 0,
        nextReview,
        isDue: nextReview ? new Date(nextReview) <= new Date() : false,
        lastWrong: memory.lastWrong || null,
        day,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.day ?? -1) - (a.day ?? -1));

  const hanjas = [...hanjaIds]
    .map(id => {
      const h = hanjaById[id];
      if (!h) return null;
      const memory = hanjaData[String(id)] || {};
      return {
        ...h,
        wrongCount: memory.wrongCount || 0,
        correctCount: memory.correctCount || 0,
        level: memory.level || 0,
        day: hanjaIdToDay[id] ?? null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.day ?? -1) - (a.day ?? -1));

  const seenIdioms = new Set();
  const unlockedIdiomsList = [];
  const idiomHanjaMap = {};

  for (const item of HANJA_DATA) {
    if (!hanjaIds.has(item.id)) continue;
    for (const word of (item.words || [])) {
      if (word.type !== 'idiom') continue;
      if (!idiomHanjaMap[word.word]) idiomHanjaMap[word.word] = [];
      idiomHanjaMap[word.word].push({ hanjaChar: item.hanja, hanjaId: item.id });
    }
  }

  for (const [hanjaWord, relatedHanjas] of Object.entries(idiomHanjaMap)) {
    if (seenIdioms.has(hanjaWord)) continue;
    seenIdioms.add(hanjaWord);
    const meta = idiomByHanja.get(hanjaWord);
    if (meta) unlockedIdiomsList.push({ ...meta, relatedHanjas });
  }

  localizedIdioms.forEach(item => {
    const key = item.id || item.hanja;
    const memory = idiomWrongData[key];
    if (memory && (memory.wrongCount > 0 || memory.correctCount > 0) && !seenIdioms.has(item.hanja)) {
      seenIdioms.add(item.hanja);
      unlockedIdiomsList.push(item);
    }
  });

  const idioms = unlockedIdiomsList
    .map(item => {
      const memory = idiomWrongData[item.id || item.hanja] || {};
      const days = (item.relatedHanjas || [])
        .map(h => hanjaIdToDay[h.hanjaId])
        .filter(Boolean);
      return {
        ...item,
        wrongCount: memory.wrongCount || 0,
        correctCount: memory.correctCount || 0,
        lastWrongAt: memory.lastWrongAt || null,
        day: days.length > 0 ? Math.max(...days) : null,
      };
    })
    .sort((a, b) => (b.day ?? -1) - (a.day ?? -1));

  return { words, hanjas, idioms };
};

export const filterWords = (words, filter, normalizedQuery) => (
  words.filter(item => {
    if (filter === 'wrong' && item.wrongCount <= 0) return false;
    if (filter === 'correct' && (item.wrongCount > 0 || item.correctCount <= 0)) return false;
    return includesQuery([item.word, item.reading, item.meaning, item.hanja], normalizedQuery);
  })
);

export const filterHanjas = (hanjas, filter, normalizedQuery) => (
  hanjas.filter(item => {
    if (filter === 'wrong' && item.wrongCount <= 0) return false;
    if (filter === 'correct' && (item.wrongCount > 0 || (item.correctCount <= 0 && item.level < 1))) {
      return false;
    }
    return includesQuery([item.hanja, item.sound, item.meaning, item.category], normalizedQuery);
  })
);

export const filterIdioms = (idioms, filter, normalizedQuery) => (
  idioms.filter(item => {
    if (filter === 'wrong' && item.wrongCount <= 0) return false;
    if (filter === 'correct' && (item.wrongCount > 0 || item.correctCount <= 0)) return false;
    return includesQuery([item.hanja, item.reading, item.meaning, item.grade], normalizedQuery);
  })
);

export const groupByDay = (items) => {
  const groups = {};
  items.forEach(item => {
    const day = item.day ?? 'other';
    if (!groups[day]) groups[day] = [];
    groups[day].push(item);
  });

  return Object.entries(groups).sort((a, b) => {
    if (a[0] === 'other') return 1;
    if (b[0] === 'other') return -1;
    return Number(b[0]) - Number(a[0]);
  });
};
