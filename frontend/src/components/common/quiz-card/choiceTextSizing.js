const normalizeChoiceText = (choice) => {
  if (typeof choice !== 'string') return '';
  return choice.replace(/\s+/g, '');
};

export const getChoiceTextSizeClass = (choice) => {
  const text = normalizeChoiceText(choice);
  if (text.length >= 6) return 'quiz-choice-btn--text-long';
  if (text.length >= 4) return 'quiz-choice-btn--text-medium';
  return '';
};
