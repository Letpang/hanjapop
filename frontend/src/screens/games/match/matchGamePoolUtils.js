import { getSRSWeightedPool } from '../../../utils/learningPool.js';
import { toIdSet } from '../../../utils/setIdUtils.js';

export const getMatchCategories = (hanjaData = []) => [
  ...new Set(hanjaData.map(h => h.category).filter(Boolean)),
];

export const buildMatchActiveHanjaSet = ({
  contentPool,
  currentDayHanjaIds,
  hanjaData,
  masteryData,
  seenHanjaIds,
  selectedCategory,
  selectedGrade,
  srsData,
  unlockedIds,
  userLevel,
  viewMode,
}) => {
  let base = [];
  const allowedIds = toIdSet(unlockedIds);

  if (contentPool) {
    const allIds = toIdSet([
      ...(contentPool.main?.hanjaIds || []),
      ...(contentPool.review?.hanjaIds || []),
    ]);
    base = hanjaData.filter(h => allIds.has(h.id));
    return getSRSWeightedPool(base, srsData, masteryData, userLevel, null);
  }

  if (viewMode === 'grade') {
    if (selectedGrade === '전체') {
      base = hanjaData.filter(h => allowedIds.has(h.id));
    } else if (selectedGrade === '기타') {
      base = hanjaData.filter(h => (
        !h.grade ||
        h.grade === '' ||
        h.grade === '기타' ||
        h.grade === 'NON'
      ) && allowedIds.has(h.id));
    } else {
      base = hanjaData.filter(h => h.grade === selectedGrade && allowedIds.has(h.id));
    }
  } else {
    base = hanjaData.filter(h => h.category === selectedCategory && allowedIds.has(h.id));
  }

  const todaySet = toIdSet(currentDayHanjaIds);
  const seenSet = toIdSet(seenHanjaIds);
  const sortGroup = (group) => getSRSWeightedPool(group, srsData, masteryData, userLevel, null);

  return [
    ...sortGroup(base.filter(h => todaySet.has(h.id) && !seenSet.has(h.id))),
    ...sortGroup(base.filter(h => todaySet.has(h.id) && seenSet.has(h.id))),
    ...sortGroup(base.filter(h => !todaySet.has(h.id))),
  ];
};

export const getMatchStageWordIds = (contentPool) => [
  ...(contentPool?.main?.wordIds || []),
  ...(contentPool?.review?.wordIds || []),
].map(Number).filter(Number.isFinite);

export const filterPairsForStageWords = (pairs, targetSet, stageWordIds) => {
  const stageWordIdSet = new Set(stageWordIds);
  if (stageWordIdSet.size === 0) return pairs;

  return pairs.filter(pair => {
    if (pair.typeA !== 'word') return true;
    const matchedHanja = targetSet.find(h => h.id === pair.hanjaId);
    return matchedHanja?.words?.some(w => w.word === pair.a && stageWordIdSet.has(w.id));
  });
};
