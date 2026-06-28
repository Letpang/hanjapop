import { useMemo } from 'react';
import {
  GRADE_BADGES,
  getCurrentStudyingGrade,
  getUnlockedBadgeIndex,
  getUnlockedGrade,
} from '../../profileData.js';

export const useMyPageBadges = () => useMemo(() => {
  const unlockedGrade = getUnlockedGrade();
  const unlockedIdx = getUnlockedBadgeIndex(unlockedGrade);
  const currentGradeBadge = unlockedIdx !== -1 ? GRADE_BADGES[unlockedIdx] : null;
  const activeStudying = getCurrentStudyingGrade(unlockedGrade);
  const studyBadge = GRADE_BADGES.find(b => b.grade === activeStudying) || GRADE_BADGES[0];

  return {
    unlockedIdx,
    currentGradeBadge,
    studyBadge,
  };
}, []);
