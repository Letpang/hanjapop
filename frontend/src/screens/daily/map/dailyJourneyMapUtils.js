import { SK } from '../../../constants/storageKeys.js';

export const getStoredXp = () => {
  try {
    return Number(localStorage.getItem(SK.USER_XP)) || 0;
  } catch {
    return 0;
  }
};

export const getDailyCurrentStep = (done) => {
  if (!done.has('flashcard')) return 'flashcard';
  if (!done.has('quiz')) return 'quiz';
  if (!done.has('game')) return 'game';
  if (!done.has('writing')) return 'writing';
  return 'done';
};
