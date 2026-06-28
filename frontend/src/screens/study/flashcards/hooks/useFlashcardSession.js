import { useCallback, useMemo, useRef, useState } from 'react';
import { pickClearMessage } from '../../../../constants/messages.js';
import { getRankDetails } from '../../../../utils/rankUtils.js';
import { toIdSet } from '../../../../utils/setIdUtils.js';
import {
  CURRICULUM_ORDER,
  HANJA_DATA,
  loadCompletedStudyIds,
  saveCompletedStudyIds,
} from '../flashcardData.js';

export const useFlashcardSession = ({
  contentPool,
  currentDay,
  getRewardPreview,
  hanjaFilter,
  onBack,
  onCardFlip,
  onStageClear,
  onStudySheetComplete,
  selectedCharacter,
  unlockedHanjaIds,
  userXp,
}) => {
  const [studyItem, setStudyItem] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showAllDoneModal, setShowAllDoneModal] = useState(false);
  const [completedStudyIds, setCompletedStudyIds] = useState(() => loadCompletedStudyIds(currentDay));
  const [totalQuizXp, setTotalQuizXp] = useState(0);
  const [allDoneClearMsg] = useState(() => pickClearMessage());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completing, setCompleting] = useState(false);
  const stageClearFiredRef = useRef(false);

  const characterAvatar = useMemo(
    () => getRankDetails(userXp || 0, selectedCharacter).avatar,
    [userXp, selectedCharacter]
  );

  const unlockedIds = useMemo(() => toIdSet(unlockedHanjaIds), [unlockedHanjaIds]);

  const contentPoolIds = useMemo(() => {
    if (!contentPool) return null;
    return toIdSet([
      ...(contentPool.main?.hanjaIds || []),
      ...(contentPool.review?.hanjaIds || []),
    ]);
  }, [contentPool]);

  const effectiveIds = useMemo(() => contentPoolIds || unlockedIds, [contentPoolIds, unlockedIds]);

  const currentItems = useMemo(() => {
    if (hanjaFilter && hanjaFilter.length > 0) {
      return HANJA_DATA.filter(h => hanjaFilter.includes(h.id));
    }

    return HANJA_DATA
      .filter(h => effectiveIds.has(h.id))
      .sort((a, b) => {
        const aOrder = CURRICULUM_ORDER.get(a.id) ?? 999999;
        const bOrder = CURRICULUM_ORDER.get(b.id) ?? 999999;
        return aOrder - bOrder;
      });
  }, [hanjaFilter, effectiveIds]);

  const inSequenceMode = Boolean(hanjaFilter && hanjaFilter.length > 0);
  const shouldShowProgress = Boolean(studyItem || inSequenceMode);
  const currentItem = currentItems[currentIndex];

  const isUnlocked = useCallback(
    (item) => (hanjaFilter ? true : unlockedIds.has(item.id)),
    [hanjaFilter, unlockedIds]
  );

  const handleExitConfirm = useCallback(() => {
    setShowExitModal(false);
    onBack();
  }, [onBack]);

  const handleCardClick = useCallback((item) => {
    onCardFlip?.(item.id);
    setStudyItem(item);
  }, [onCardFlip]);

  const handleStudySheetComplete = useCallback((id) => {
    if (id == null) return;

    onStudySheetComplete?.(id);
    const next = new Set(completedStudyIds);
    next.add(id);
    saveCompletedStudyIds(next, currentDay);
    setCompletedStudyIds(next);

    const allDone = currentItems.length > 0 && currentItems.every(h => next.has(h.id));
    if (allDone && !stageClearFiredRef.current) {
      stageClearFiredRef.current = true;
      onStageClear?.();
      setShowAllDoneModal(true);
    }
  }, [completedStudyIds, currentDay, currentItems, onStageClear, onStudySheetComplete]);

  const handleNext = useCallback(() => {
    if (completing) return;

    if (currentIndex < currentItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return;
    }

    setCompleting(true);
    setTimeout(() => {
      if (!stageClearFiredRef.current) {
        stageClearFiredRef.current = true;
        onStageClear?.();
      }
      onBack();
    }, 750);
  }, [completing, currentIndex, currentItems.length, onBack, onStageClear]);

  const addQuizXp = useCallback((xp) => {
    setTotalQuizXp(prev => prev + xp);
  }, []);

  const allDoneReward = getRewardPreview?.(totalQuizXp + 50);

  return {
    addQuizXp,
    allDoneClearMsg,
    allDoneReward,
    characterAvatar,
    completedStudyIds,
    completing,
    currentIndex,
    currentItem,
    currentItems,
    handleCardClick,
    handleExitConfirm,
    handleNext,
    handleStudySheetComplete,
    inSequenceMode,
    isUnlocked,
    setShowAllDoneModal,
    setShowExitModal,
    setStudyItem,
    shouldShowProgress,
    showAllDoneModal,
    showExitModal,
    studyItem,
    totalQuizXp,
  };
};
