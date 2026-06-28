export const MIN_LEARNING_EF = 1.3;
export const DEFAULT_LEARNING_EF = 2.5;

export const updateLearningSchedule = (card, quality) => {
  const ef = Math.max(MIN_LEARNING_EF, Number.isFinite(card?.ef) ? card.ef : DEFAULT_LEARNING_EF);
  const interval = Number.isFinite(card?.interval) && card.interval >= 0 ? card.interval : 0;
  const reps = Number.isFinite(card?.repetitions) ? Math.floor(card.repetitions) : 0;

  let newEf = ef;
  let newInterval;
  let newReps;

  if (quality >= 3) {
    newInterval = reps === 0 ? 1 : reps === 1 ? 3 : reps === 2 ? 7 : Math.round(interval * ef);
    newReps = reps + 1;
    newEf = Math.max(MIN_LEARNING_EF, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    newInterval = 1;
    newReps = 0;
    newEf = Math.max(MIN_LEARNING_EF, ef - 0.2);
  }

  if (!Number.isFinite(newInterval) || newInterval < 1) newInterval = 1;
  newInterval = Math.min(newInterval, 365);

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);
  nextReview.setHours(0, 0, 0, 0);

  return {
    ef: Math.round(newEf * 100) / 100,
    interval: newInterval,
    repetitions: newReps,
    nextReview: nextReview.toISOString(),
  };
};

export const saveLearningRecord = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
};
