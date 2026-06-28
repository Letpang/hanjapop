export const GRADE_BADGE_IMAGES = {
  '8급': '/assets/images/badges/badge_grade_8.webp',
  '7급II': '/assets/images/badges/badge_grade_7_2.webp',
  '7급Ⅱ': '/assets/images/badges/badge_grade_7_2.webp',
  '7급': '/assets/images/badges/badge_grade_7.webp',
  '6급II': '/assets/images/badges/badge_grade_6_2.webp',
  '6급Ⅱ': '/assets/images/badges/badge_grade_6_2.webp',
  '6급': '/assets/images/badges/badge_grade_6.webp',
};

export const cleanSentence = (sentence) => sentence?.replace(/\(\s*([^)]*?)\s*\)/g, '$1') || '';
