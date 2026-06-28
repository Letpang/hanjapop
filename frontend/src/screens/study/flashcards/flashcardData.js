import { SK } from '../../../constants/storageKeys.js';
import DAILY_CURRICULUM from '../../../data/dailyCurriculum.js';
import HANJA_DATA from '../../../hanja_unified.json';

export { HANJA_DATA };

export const CURRICULUM_ORDER = new Map();
DAILY_CURRICULUM.forEach((day, dayIdx) => {
  day.hanja.forEach((h, hIdx) => {
    if (h.id !== null) CURRICULUM_ORDER.set(h.id, dayIdx * 100 + hIdx);
  });
});

export const HANJA_MAP = Object.fromEntries(HANJA_DATA.map(h => [h.hanja, h]));

export const loadCompletedStudyIds = (currentDay) => {
  try {
    const key = currentDay ? `${SK.STUDY_SHEET_COMPLETED}_${currentDay}` : SK.STUDY_SHEET_COMPLETED;
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(saved)) return new Set();
    return new Set(saved.map(Number).filter(Number.isFinite));
  } catch {
    return new Set();
  }
};

export const saveCompletedStudyIds = (ids, currentDay) => {
  try {
    const key = currentDay ? `${SK.STUDY_SHEET_COMPLETED}_${currentDay}` : SK.STUDY_SHEET_COMPLETED;
    localStorage.setItem(key, JSON.stringify([...ids]));
  } catch {}
};

export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const pickDistractors = (correctId, field, count = 3) => {
  const correctValue = HANJA_DATA.find(h => h.id === correctId)?.[field]?.trim();
  const seen = new Set([correctValue]);
  const result = [];

  for (const h of shuffle([...HANJA_DATA])) {
    if (h.id === correctId || !h[field]) continue;
    const val = h[field].trim();
    if (seen.has(val)) continue;
    seen.add(val);
    result.push(val);
    if (result.length >= count) break;
  }

  return result;
};

export const buildWorksheetQuiz = (item) => {
  const questions = [];

  const meaningDistractors = pickDistractors(item.id, 'meaning');
  questions.push({
    id: 'q_meaning',
    type: 'choice',
    prompt: `${item.hanja}의 뜻은?`,
    promptKey: 'ext_3215',
    promptParams: { hanja: item.hanja },
    choices: shuffle([item.meaning, ...meaningDistractors]),
    answer: item.meaning,
  });

  const soundDistractors = pickDistractors(item.id, 'sound');
  questions.push({
    id: 'q_sound',
    type: 'choice',
    prompt: `${item.hanja}의 음은?`,
    promptKey: 'ext_3216',
    promptParams: { hanja: item.hanja },
    choices: shuffle([item.sound, ...soundDistractors]),
    answer: item.sound,
  });

  const wordPool = (item.words || []).filter(w => w.word && w.meaning && w.type !== 'idiom');
  const allWords = HANJA_DATA.flatMap(h => h.words || []).filter(w => w.type !== 'idiom');
  wordPool.forEach((w, i) => {
    const wordLen = [...w.word].length;
    const revDistractors = shuffle(allWords.filter(x => x.word && x.word !== w.word && [...x.word].length === wordLen)).slice(0, 3);
    questions.push({
      id: `q_reverse_${i}`,
      type: 'choice',
      choiceType: 'hanja',
      prompt: w.meaning,
      promptKey: 'ext_3217',
      promptParams: { meaning: w.meaning },
      choices: shuffle([w.word, ...revDistractors.map(x => x.word)]),
      answer: w.word,
      wordId: w.id,
      word: w.word,
      reading: w.reading,
      meaning: w.meaning,
      readingMap: Object.fromEntries([[w.word, w.reading], ...revDistractors.map(x => [x.word, x.reading])]),
    });
  });

  const synList = (item.syn || []).filter(h => HANJA_MAP[h] && h !== item.hanja);
  if (synList.length > 0) {
    const correct = synList[Math.floor(Math.random() * synList.length)];
    const correctData = HANJA_MAP[correct];
    const correctLabel = `${correct}(${correctData.meaning} ${correctData.sound})`;
    const excludeSet = new Set([item.hanja, ...(item.syn || []), ...(item.ant || [])]);
    const distractors = shuffle(HANJA_DATA.filter(h => !excludeSet.has(h.hanja)))
      .slice(0, 3).map(h => `${h.hanja}(${h.meaning} ${h.sound})`);
    questions.push({
      id: 'q_syn',
      type: 'choice',
      prompt: `${item.hanja}(${item.meaning} ${item.sound})의 유사어는?`,
      promptSuffix: 'ext_3218',
      choices: shuffle([correctLabel, ...distractors]),
      answer: correctLabel,
    });
  }

  const antList = (item.ant || []).filter(h => HANJA_MAP[h] && h !== item.hanja);
  if (antList.length > 0) {
    const correct = antList[Math.floor(Math.random() * antList.length)];
    const correctData = HANJA_MAP[correct];
    const correctLabel = `${correct}(${correctData.meaning} ${correctData.sound})`;
    const excludeSet = new Set([item.hanja, ...(item.syn || []), ...(item.ant || [])]);
    const distractors = shuffle(HANJA_DATA.filter(h => !excludeSet.has(h.hanja)))
      .slice(0, 3).map(h => `${h.hanja}(${h.meaning} ${h.sound})`);
    questions.push({
      id: 'q_ant',
      type: 'choice',
      prompt: `${item.hanja}(${item.meaning} ${item.sound})의 반대어는?`,
      promptSuffix: 'ext_3219',
      choices: shuffle([correctLabel, ...distractors]),
      answer: correctLabel,
    });
  }

  return questions;
};
