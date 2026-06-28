import { SK } from '../../constants/storageKeys.js';

export const getUnlockedGrade = () => {
  try {
    const val = localStorage.getItem(SK.UNLOCKED_GRADE);
    return val ? val.normalize('NFC') : null;
  } catch {
    return null;
  }
};

export const GRADE_ORDER = ['8급', '7급II', '7급', '6급II', '6급'];

export const GRADE_BADGES = [
  { grade: '8급',   imgSrc: '/assets/images/badges/badge_grade_8.webp',  label: 'ext_270' },
  { grade: '7급II', imgSrc: '/assets/images/badges/badge_grade_7_2.webp', label: 'ext_3201' },
  { grade: '7급',   imgSrc: '/assets/images/badges/badge_grade_7.webp',  label: 'ext_271' },
  { grade: '6급II', imgSrc: '/assets/images/badges/badge_grade_6_2.webp', label: 'ext_3202' },
  { grade: '6급',   imgSrc: '/assets/images/badges/badge_grade_6.webp',  label: 'ext_272' },
];

export const getUnlockedBadgeIndex = (unlockedGrade) => {
  if (!unlockedGrade) return -1;
  if (unlockedGrade === '6급완료') return GRADE_ORDER.indexOf('6급');
  return GRADE_ORDER.indexOf(unlockedGrade);
};

export const getCurrentStudyingGrade = (unlockedGrade) => {
  if (unlockedGrade === null) return '8급';
  if (unlockedGrade === '6급완료') return '6급';
  const idx = GRADE_ORDER.indexOf(unlockedGrade);
  if (idx === -1) return '8급';
  if (idx >= GRADE_ORDER.length - 1) return GRADE_ORDER[GRADE_ORDER.length - 1];
  return GRADE_ORDER[idx + 1];
};

export const BADGE_CATEGORIES = [
  { id: 'attendance', label: 'ext_1620', base: '/assets/images/badges/badge_3d_attendance', reqs: [0,  7,   30,  100,  365] },
  { id: 'mission',    label: 'ext_1621', base: '/assets/images/badges/badge_3d_mission',    reqs: [0, 30,  100,  350, 1000] },
  { id: 'hanja',      label: 'ext_1570', base: '/assets/images/badges/badge_3d_hanja',      reqs: [0, 30,  120,  300,  500] },
  { id: 'quiz',       label: 'ext_1622', base: '/assets/images/badges/badge_3d_quiz',       reqs: [0, 30,  100,  400, 1200] },
  { id: 'game',       label: 'ext_1623', base: '/assets/images/badges/badge_3d_game',       reqs: [0, 30,  100,  350, 1000] },
  { id: 'brush',      label: 'ext_1701', base: '/assets/images/badges/badge_3d_brush',      reqs: [0, 50,  200,  600, 2000] },
];

export const BADGE_PEDESTAL = {
  attendance: { bg: '#BEF0E8', shadow: 'rgba(20,184,166,0.28)' },
  mission:    { bg: '#D8D4FF', shadow: 'rgba(109,111,242,0.26)' },
  hanja:      { bg: '#FFD0BE', shadow: 'rgba(220,80,60,0.22)' },
  quiz:       { bg: '#FFE898', shadow: 'rgba(245,158,11,0.28)' },
  game:       { bg: '#FFD4A8', shadow: 'rgba(250,110,40,0.24)' },
  brush:      { bg: '#D8D4C4', shadow: 'rgba(80,65,30,0.18)' },
};

export const BADGE_GUIDES = {
  attendance: { desc: 'ext_2688', menu: 'ext_1489' },
  mission:    { desc: 'ext_2735', menu: 'ext_1987' },
  hanja:      { desc: 'ext_2721', menu: 'ext_1988' },
  quiz:       { desc: 'ext_2824', menu: 'ext_2353' },
  game:       { desc: 'ext_2689', menu: 'ext_1989' },
  brush:      { desc: 'ext_2756', menu: 'ext_1916' },
};

export const getBadgeValue = (id, streak, totalStats) => {
  switch (id) {
    case 'attendance': return streak?.count || 0;
    case 'mission':    return totalStats?.matchGame || 0;
    case 'hanja':      return totalStats?.flashcard || 0;
    case 'quiz':       return (totalStats?.wordQuiz || 0) + (totalStats?.sentenceQuiz || 0);
    case 'game':       return totalStats?.shootGame || 0;
    case 'brush':      return totalStats?.writing || 0;
    default:           return 0;
  }
};

export const getBadgeStage = (category, value) => {
  const reqs = category.reqs;
  for (let i = reqs.length - 1; i >= 0; i--) {
    if (value >= reqs[i]) return i + 1;
  }
  return 1;
};

export const buildReferralShareUrl = (code) => {
  const base = String(import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin || '').replace(/\/$/, '');
  const url = new URL(base || window.location.href);
  if (code) url.searchParams.set('ref', code);
  url.searchParams.set('utm_source', 'manual_share');
  url.searchParams.set('utm_campaign', 'referral_milestone');
  return url.toString();
};
