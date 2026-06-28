import { useMemo, useState } from 'react';
import HANJA_DATA from '../../../../hanja_unified.json';
import { toIdSet } from '../../../../utils/setIdUtils.js';
import { useUnlockedHanja } from '../../../../hooks/useUnlockedHanja.js';
import { getRankDetails } from '../../../../utils/rankUtils.js';
import { WRITING_CATEGORIES } from '../writingScreenData.js';

export const useWritingSelectionState = ({
  contentPool,
  hanjaFilter,
  initialHanja,
  selectedCharacter,
  unlockedHanjaIds,
  userXp,
}) => {
  const [viewMode, setViewMode] = useState('grade');
  const [gradeFilter, setGradeFilter] = useState('전체');
  const [categoryFilter, setCategoryFilter] = useState(WRITING_CATEGORIES[0] || '');

  const characterAvatar = useMemo(
    () => getRankDetails(userXp || 0, selectedCharacter).avatar,
    [userXp, selectedCharacter],
  );
  const { unlockedIds, unlockedGrades } = useUnlockedHanja(unlockedHanjaIds);

  const contentPoolIds = useMemo(() => {
    if (!contentPool) return null;
    return toIdSet([
      ...(contentPool.main?.hanjaIds || []),
      ...(contentPool.review?.hanjaIds || []),
    ]);
  }, [contentPool]);

  const effectiveIds = useMemo(() => contentPoolIds || unlockedIds, [contentPoolIds, unlockedIds]);

  const displayList = useMemo(() => {
    if (initialHanja) return [initialHanja];
    if (hanjaFilter && hanjaFilter.length > 0) {
      return HANJA_DATA.filter(hanja => hanjaFilter.includes(hanja.id));
    }
    const base = viewMode === 'grade'
      ? (gradeFilter === '전체' ? HANJA_DATA : HANJA_DATA.filter(hanja => hanja.grade === gradeFilter))
      : HANJA_DATA.filter(hanja => hanja.category === categoryFilter);
    return base.filter(hanja => effectiveIds.has(hanja.id));
  }, [categoryFilter, effectiveIds, gradeFilter, hanjaFilter, initialHanja, viewMode]);

  return {
    categoryFilter,
    characterAvatar,
    displayList,
    gradeFilter,
    setCategoryFilter,
    setGradeFilter,
    setViewMode,
    unlockedGrades,
    unlockedIds,
    viewMode,
  };
};
