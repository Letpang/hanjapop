export const GRADE_THEMES = {
  '8급': { accent: '#2ED6C5', accentDeep: '#0D9488', bgLight: '#E8FAF7', badgeBg: '#E0F7FA', badgeText: '#0D9488' },
  '7급Ⅱ': { accent: '#7C83FF', accentDeep: '#4F56D9', bgLight: '#F2F3FF', badgeBg: '#EEF0FF', badgeText: '#4F56D9' },
  '7급': { accent: '#9B6BFF', accentDeep: '#7047D9', bgLight: '#F5F0FF', badgeBg: '#F0E9FF', badgeText: '#7047D9' },
  '6급Ⅱ': { accent: '#FF9B73', accentDeep: '#D96B45', bgLight: '#FFF1EC', badgeBg: '#FFE8DE', badgeText: '#C85D39' },
  '6급': { accent: '#FF6B6B', accentDeep: '#D94C4C', bgLight: '#FFF0F0', badgeBg: '#FFE3E3', badgeText: '#C83D3D' },
};

export const BRAND_THEME = {
  accent: '#7C83FF',
  deep: '#5B63E6',
  light: '#EEF0FF',
};

export const GRADE_ORDER = ['8급', '7급Ⅱ', '7급', '6급Ⅱ', '6급'];

export const normalizeGrade = (grade) => {
  if (grade === '7급II') return '7급Ⅱ';
  if (grade === '6급II') return '6급Ⅱ';
  return grade;
};

export const getGradeTheme = (grade) => GRADE_THEMES[normalizeGrade(grade)] || GRADE_THEMES['8급'];
