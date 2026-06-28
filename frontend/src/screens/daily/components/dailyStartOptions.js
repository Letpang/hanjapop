import { getTodayStr } from '../../../utils/sessionUtils.js';

export const GAMES = [
  { id: 'shoot', label: 'ext_1573', icon: '/assets/images/icons/monster.webp', theme: 'coral', color: '#FF9B73', bg: '#FFF7F3' },
  { id: 'match', label: 'ext_1574', icon: '/assets/images/icons/matching.webp', theme: 'coral', color: '#2ED6C5', bg: '#F0FDFB' },
];

export const QUIZZES = [
  { id: 'wordQuiz', label: 'ext_1492', icon: '/assets/images/icons/words.webp', theme: 'coral', color: '#7C83FF', bg: '#F5F5FF' },
  { id: 'sentenceQuiz', label: 'ext_1493', icon: '/assets/images/icons/sentence.webp', theme: 'coral', color: '#FF9B73', bg: '#FFF7F3' },
];

export const pickDailyOption = (options, salt = '') => {
  const key = `${getTodayStr()}-${salt}`;
  const hash = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return options[hash % options.length];
};
