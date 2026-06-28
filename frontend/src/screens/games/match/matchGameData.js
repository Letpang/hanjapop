import HANJA_DATA_RAW from '../../../hanja_unified.json';

export const HANJA_DATA = Object.values(
  HANJA_DATA_RAW.reduce((acc, h) => {
    if (!acc[h.hanja]) acc[h.hanja] = h;
    return acc;
  }, {})
);

export const GRADE_LABELS = {
  '8급': '8급',
  '7급Ⅱ': '7급Ⅱ',
  '7급': '7급',
  '6급Ⅱ': '6급Ⅱ',
  '6급': '6급',
  NON: '기타',
};

export const GRADE_XP = {
  '8급': { base: 3, combo3: 0, combo5: 0 },
  '7급Ⅱ': { base: 3, combo3: 0, combo5: 0 },
  '7급': { base: 3, combo3: 0, combo5: 0 },
  '6급Ⅱ': { base: 3, combo3: 0, combo5: 0 },
  '6급': { base: 3, combo3: 0, combo5: 0 },
  NON: { base: 3, combo3: 0, combo5: 0 },
};

export const CARD_BACK_CHARS = ['muzi', 'chapssal', 'jeolmi', 'garae'];
