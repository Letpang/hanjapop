
export const getGuide = (char) => `/assets/images/characters/${char || 'garae'}/rank_5.webp`;

export const INTRO_SLIDES = [
  {
    kicker: 'HANJAPOP PROLOGUE',
    title: 'ext_2214',
    highlight: 'ext_1681',
    body: 'ext_2711',
  },
  {
    kicker: 'GRADE PATH',
    title: 'ext_2215',
    highlight: 'ext_1599',
    body: 'ext_2770',
  },
  {
    kicker: 'READY',
    title: 'ext_2554',
    highlight: 'ext_1054',
    body: 'ext_2603',
  },
];

export const FLOAT_ITEMS = [
  { char: '山', top: '10%', left: '7%',  size: 26, duration: '3.4s', delay: '0s',   rotate: -14 },
  { char: '日', top: '16%', right: '9%', size: 16, duration: '4.0s', delay: '0.7s', rotate: 18  },
  { char: '月', top: '68%', left: '5%',  size: 22, duration: '4.3s', delay: '1.4s', rotate: -9  },
  { char: '水', top: '62%', right: '7%', size: 14, duration: '3.7s', delay: '0.3s', rotate: 22  },
  { char: '木', top: '40%', left: '3%',  size: 19, duration: '4.6s', delay: '1.9s', rotate: -20 },
  { char: '火', top: '38%', right: '4%', size: 24, duration: '3.9s', delay: '1.1s', rotate: 11  },
];

export const SKILL_WORD = 'ext_1533';
export const SKILL_CONTEXT = 'ext_1534';
export const SKILL_IDIOM = 'ext_1391';

export const QUESTIONS = [
  {
    type: 'word',
    hanja: '時間',
    answer: '시간',
    options: ['시간', '날씨', '가족', '공간'],
    hint: '時와 間이 합쳐진 말',
    skill: SKILL_WORD,
    grade: '7급II',
  },
  {
    type: 'word',
    hanja: '家族',
    answer: '가족',
    options: ['친구', '가족', '선생님', '이웃'],
    hint: '집 家가 들어간 단어',
    skill: SKILL_WORD,
    grade: '7급II',
  },
  {
    type: 'sentence',
    hanja: '努力',
    sentence: '꿈을 이루려면 매일 ___을 해야 해요.',
    answer: '노력',
    options: ['노력', '여행', '포기', '수면'],
    hint: '힘쓸 努, 힘 力',
    skill: SKILL_CONTEXT,
    grade: '6급II',
  },
  {
    type: 'idiom',
    hanja: '一石二鳥',
    answer: '일석이조',
    options: ['일석이조', '칠전팔기', '마이동풍', '이심전심'],
    hint: '돌 하나로 새 두 마리를!',
    skill: SKILL_IDIOM,
    grade: '6급',
  },
];

export const TOTAL = QUESTIONS.length;

export const PROFILE = {
  1: { grade: '8급',   title: 'ext_1600', message: 'ext_2654', xp: 60 },
  2: { grade: '8급',   title: 'ext_1726', message: 'ext_2695', xp: 90 },
  3: { grade: '7급II', title: 'ext_1727', message: 'ext_2683', xp: 120 },
  4: { grade: '7급',   title: 'ext_1728', message: 'ext_2604', xp: 150 },
  5: { grade: '6급II', title: 'ext_1896', message: 'ext_2460', xp: 180 },
};

export const GRADE_STEPS = ['8급', '7급II', '7급', '6급II', '6급'];

export const SKILL_MAX = { word: 2, context: 1, idiom: 1 };

export const PROMPT = {
  word: 'ext_1729',
  sentence: 'ext_1832',
  idiom: 'ext_1833',
};

export const scoreToLevel = (score) => {
  if (score === 0) return 1;
  if (score === 1) return 2;
  if (score === 2) return 3;
  if (score === 3) return 4;
  return 5;
};

export const SHOOT_HANJA_IDS = [1, 7, 21, 31, 34, 79, 106, 150, 294, 312];

export const SHOOT_CONTENT_POOL = {
  main: { hanjaIds: SHOOT_HANJA_IDS },
  review: { hanjaIds: [] },
};
