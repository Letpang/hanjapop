export const HINT_PENALTY = 10;
export const WRONG_PENALTY = 5;
export const MAX_SCORE = 100;
export const WRITING_XP_PER_CHAR = 10;
export const WRITING_CLEAR_XP = 30;

export const ANIMCJK_CHARS = new Set(['窓', '飮', '淸']);

export const WRITER_CHAR_MAP = {
  '敎': '教',
  '畵': '畫',
  '窓': '窗',
  '飮': '飲',
  '淸': '清',
};

export const STROKE_COLORS = [
  { label: 'ext_920', value: '#34383F', bg: 'bg-[#34383F]', dark: '#1E2126' },
  { label: 'ext_921', value: '#FF5500', bg: 'bg-[#FF5500]', dark: '#CC4400' },
  { label: 'ext_922', value: '#FFD600', bg: 'bg-[#FFD600]', dark: '#CCA800' },
  { label: 'ext_1061', value: '#7C83FF', bg: 'bg-[#7C83FF]', dark: '#5A61D4' },
  { label: 'ext_923', value: '#00C853', bg: 'bg-[#00C853]', dark: '#009A3E' },
];

export const STROKE_WIDTHS = [
  { label: 'ext_1062', value: 12, icon: '─' },
  { label: 'ext_924', value: 22, icon: '━' },
  { label: 'ext_925', value: 34, icon: '▬' },
];
