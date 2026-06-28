import IDIOMS from '../../../data/idioms.js';
import HANJA_DATA from '../../../hanja_unified.json';
import { toIdSet } from '../../../utils/setIdUtils.js';

const IDIOM_WRONG_KEY = 'idiom_wrong_data';

const idiomKey = (item) => item.id || item.hanja;

const readIdiomWrongData = () => {
  try {
    return JSON.parse(localStorage.getItem(IDIOM_WRONG_KEY) || '{}');
  } catch {
    return {};
  }
};

const shuffle = (arr) => {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const allIdiomChars = () => [...new Set(IDIOMS.flatMap(item => [...item.hanja]))];

const HANJA_SOUND_MAP = Object.fromEntries(
  HANJA_DATA.map(h => [h.hanja, h.sound]).filter(([k, v]) => k && v)
);

// 사자성어에만 쓰이고 기본 한자 교육 데이터에는 없는 한자(예: 賊 등)의 음을 보완합니다.
IDIOMS.forEach(item => {
  if (item.hanja && item.reading && item.hanja.length === item.reading.length) {
    for (let i = 0; i < item.hanja.length; i++) {
      const char = item.hanja[i];
      const sound = item.reading[i];
      if (!HANJA_SOUND_MAP[char]) {
        HANJA_SOUND_MAP[char] = sound;
      }
    }
  }
});

export const collectIdioms = (hanjaIds, idiomSource = IDIOMS) => {
  const idSet = toIdSet(hanjaIds);
  const seen = new Set();
  const result = [];

  for (const item of HANJA_DATA) {
    if (!idSet.has(item.id)) continue;
    for (const word of (item.words || [])) {
      if (word.type !== 'idiom' || seen.has(word.word)) continue;
      seen.add(word.word);
      const meta = idiomSource.find(idiom => idiom.hanja === word.word);
      if (meta) result.push({ ...meta, targetHanja: item.hanja });
    }
  }

  return result;
};

export const writeIdiomWrong = (item) => {
  const key = idiomKey(item);
  const data = readIdiomWrongData();
  const prev = data[key] || {};
  data[key] = {
    wrongCount: (prev.wrongCount || 0) + 1,
    lastWrongAt: new Date().toISOString(),
  };
  localStorage.setItem(IDIOM_WRONG_KEY, JSON.stringify(data));
};

export const clearIdiomWrong = (item) => {
  const key = idiomKey(item);
  const data = readIdiomWrongData();
  const prev = data[key] || {};
  data[key] = {
    ...prev,
    correctCount: (prev.correctCount || 0) + 1,
  };
  if (data[key].wrongCount) {
    delete data[key].wrongCount;
  }
  localStorage.setItem(IDIOM_WRONG_KEY, JSON.stringify(data));
};

const buildFillBlankQuestion = (item) => {
  let blankIdx = item.targetHanja ? item.hanja.indexOf(item.targetHanja) : -1;
  if (blankIdx === -1) {
    blankIdx = Math.floor(Math.random() * 4);
  }

  const correct = item.hanja[blankIdx];
  const displayHanja = [...item.hanja].map((char, index) => (index === blankIdx ? '(  )' : char)).join('');
  const displayReading = [...item.reading].map((char, index) => (index === blankIdx ? '○' : char)).join('');
  const distractors = shuffle(allIdiomChars().filter(char => char !== correct)).slice(0, 3);
  const allChoiceChars = [correct, ...distractors];

  return {
    ...item,
    type: 'fill_blank',
    typeLabel: 'ext_1601',
    prompt: 'ext_2022',
    displayHanja,
    displayReading,
    choices: shuffle(allChoiceChars),
    answer: correct,
    charReadingMap: Object.fromEntries(allChoiceChars.map(char => [char, HANJA_SOUND_MAP[char] || ''])),
  };
};

const buildReadingQuestion = (item, others) => ({
  ...item,
  type: 'reading',
  typeLabel: 'ext_1535',
  prompt: 'ext_2216',
  choices: shuffle([item.reading, ...shuffle(others).slice(0, 3).map(idiom => idiom.reading)]),
  answer: item.reading,
});

const buildMeaningQuestion = (item, others) => ({
  ...item,
  type: 'meaning_from_idiom',
  typeLabel: 'ext_1470',
  prompt: 'ext_1897',
  choices: shuffle([item.meaning, ...shuffle(others).slice(0, 3).map(idiom => idiom.meaning)]),
  answer: item.meaning,
});

const buildIdiomFromMeaningQuestion = (item, others) => {
  const distIdioms = shuffle(others).slice(0, 3);
  return {
    ...item,
    type: 'idiom_from_meaning',
    typeLabel: 'ext_1644',
    prompt: 'ext_2217',
    displayMeaning: item.meaning,
    choices: shuffle([item.hanja, ...distIdioms.map(idiom => idiom.hanja)]),
    answer: item.hanja,
    idiomReadingMap: Object.fromEntries([item, ...distIdioms].map(i => [i.hanja, i.reading || ''])),
  };
};

export const buildIdiomQuiz = (idioms, allIdioms = IDIOMS) => {
  if (idioms.length === 0) return [];

  const questions = [];
  shuffle([...idioms]).forEach((item, index) => {
    const others = allIdioms.filter(idiom => idiom.hanja !== item.hanja);
    const type = index % 3;

    if (type === 0) {
      questions.push(buildFillBlankQuestion(item));
    } else if (type === 1) {
      questions.push(buildReadingQuestion(item, others));
    } else if (index % 6 < 3) {
      questions.push(buildMeaningQuestion(item, others));
    } else {
      questions.push(buildIdiomFromMeaningQuestion(item, others));
    }
  });

  return questions;
};

export const getIdiomChoicePresentation = (question) => {
  const isLargeChoice = question?.type === 'fill_blank' || question?.type === 'idiom_from_meaning';
  return {
    choiceClass: isLargeChoice ? 'quiz-choice-btn--large quiz-choice-btn--hanja' : '',
    choiceGridClass: isLargeChoice
      ? 'quiz-choice-grid'
      : `grade-test-choice-grid${question?.type === 'meaning_from_idiom' ? ' grade-test-choice-grid--single' : ''}`,
    choiceGridStyle: isLargeChoice ? { gridTemplateColumns: 'repeat(2, 1fr)' } : undefined,
  };
};
