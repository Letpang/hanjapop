import { SK } from '../../../constants/storageKeys.js';
import HANJA_DATA from '../../../hanja_unified.json';

export const SORTED_HANJA = [...HANJA_DATA].sort((a, b) => a.id - b.id);

export const getTotalDays = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(SK.STUDY_LOG) || '{}');
    return saved.total?.totalDays || 1;
  } catch {
    return 1;
  }
};

export const getLevelTestBonus = () => {
  try {
    return Number(localStorage.getItem(SK.LEVEL_TEST_BONUS) || '0');
  } catch {
    return 0;
  }
};

export const saveLevelTestBonus = (bonus) => {
  localStorage.setItem(SK.LEVEL_TEST_BONUS, String(bonus));
};

const shuffle = (arr) => {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const pickDistractors = (exclude, field, pool, count = 3) => (
  shuffle(pool.filter(h => h[field] && h[field] !== exclude))
    .slice(0, count)
    .map(h => h[field])
);

const buildMeaningQuestion = (item, id) => ({
  id,
  qType: 'meaning',
  prompt: 'ext_1777',
  hanja: item.hanja,
  choices: shuffle([item.meaning, ...pickDistractors(item.meaning, 'meaning', SORTED_HANJA)]),
  answer: item.meaning,
  item,
});

const buildSoundQuestion = (item, id) => ({
  id,
  qType: 'sound',
  prompt: 'ext_1778',
  hanja: item.hanja,
  choices: shuffle([item.sound, ...pickDistractors(item.sound, 'sound', SORTED_HANJA)]),
  answer: item.sound,
  item,
});

const buildWordQuestion = (item, id) => {
  const wordPool = (item.words || []).filter(w => w.word && w.meaning && w.type !== 'idiom');
  if (wordPool.length === 0) return buildMeaningQuestion(item, `${id}_fallback`);

  const target = shuffle(wordPool)[0];
  const allWords = SORTED_HANJA
    .flatMap(h => h.words || [])
    .filter(w => w.type !== 'idiom');
  const distractors = shuffle(allWords.filter(w => w.meaning && w.meaning !== target.meaning))
    .slice(0, 3)
    .map(w => w.meaning);

  return {
    id,
    qType: 'word',
    prompt: 'ext_1779',
    hanja: `${target.word}(${target.reading})`,
    choices: shuffle([target.meaning, ...distractors]),
    answer: target.meaning,
    item,
  };
};

export const buildLevelTestQuestions = (unlockedHanja) => {
  if (unlockedHanja.length === 0) return [];

  const picked = shuffle(unlockedHanja).slice(0, Math.min(unlockedHanja.length, 10));
  const questions = picked.map((item, index) => {
    const type = index % 3;
    if (type === 0) return buildMeaningQuestion(item, `q_${index}_meaning`);
    if (type === 1) return buildSoundQuestion(item, `q_${index}_sound`);
    return buildWordQuestion(item, `q_${index}_word`);
  });

  const usedHanja = new Set(questions.map(q => q.hanja));
  const extraPool = shuffle(unlockedHanja.filter(h => !usedHanja.has(h.hanja)));
  let extraIndex = 0;

  while (questions.length < 10 && extraIndex < extraPool.length) {
    const item = extraPool[extraIndex];
    extraIndex += 1;
    questions.push(buildMeaningQuestion(item, `q_extra_${extraIndex}`));
  }

  return questions.slice(0, 10);
};
