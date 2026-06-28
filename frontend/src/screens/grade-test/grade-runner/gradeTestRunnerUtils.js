import { SK } from '../../../constants/storageKeys.js';

export const getUnlockedGrade = () => {
  try {
    return localStorage.getItem(SK.UNLOCKED_GRADE);
  } catch {
    return null;
  }
};

export const setUnlockedGrade = (grade) => {
  try {
    localStorage.setItem(SK.UNLOCKED_GRADE, grade);
  } catch {
    // Local storage can be unavailable in private or embedded contexts.
  }
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const createQuestions = (questions) =>
  shuffle(questions).map((question) => ({
    ...question,
    choices: shuffle(question.choices),
  }));
