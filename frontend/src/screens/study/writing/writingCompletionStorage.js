const WRITING_COMPLETED_KEY = 'hanja_writing_completed';

export const readWritingCompletedIds = () => {
  try {
    const saved = localStorage.getItem(WRITING_COMPLETED_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
};

export const persistWritingCompletedIds = (ids) => {
  try {
    localStorage.setItem(WRITING_COMPLETED_KEY, JSON.stringify([...ids]));
  } catch {}
};

export const shouldUseTransientWritingCompletion = ({ contentPool, initialHanja, hanjaFilter }) => (
  contentPool || initialHanja || (hanjaFilter && hanjaFilter.length > 0)
);
