import { useCallback, useEffect, useRef, useState } from 'react';
import {
  persistWritingCompletedIds,
  readWritingCompletedIds,
  shouldUseTransientWritingCompletion,
} from '../writingCompletionStorage.js';
import { useWritingSelectionState } from './useWritingSelectionState.js';

const useWritingScreenState = ({
  initialHanja,
  unlockedHanjaIds,
  userXp,
  selectedCharacter,
  hanjaFilter,
  contentPool,
  onBack,
  onWritingComplete,
  onStageClear,
}) => {
  const {
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
  } = useWritingSelectionState({
    contentPool,
    hanjaFilter,
    initialHanja,
    selectedCharacter,
    unlockedHanjaIds,
    userXp,
  });
  const [phase, setPhase] = useState(initialHanja || hanjaFilter || contentPool ? 'list' : 'select');
  const [showExitModal, setShowExitModal] = useState(false);
  const [selectedHanja, setSelectedHanja] = useState(initialHanja || null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeHanjaList, setActiveHanjaList] = useState(initialHanja ? [initialHanja] : []);
  const [completedCount, setCompletedCount] = useState(0);
  const [completedIds, setCompletedIds] = useState(() => (
    shouldUseTransientWritingCompletion({ contentPool, initialHanja, hanjaFilter }) ? new Set() : readWritingCompletedIds()
  ));
  const [completing, setCompleting] = useState(false);
  const [currentAnswered, setCurrentAnswered] = useState(false);
  const clearCountRef = useRef(0);
  const completingRef = useRef(false);
  const startIndexRef = useRef(0);

  const hanjaList = displayList;

  useEffect(() => {
    if (!(initialHanja || hanjaFilter) || hanjaList.length === 0) return undefined;

    const timer = setTimeout(() => {
      startIndexRef.current = 0;
      setSelectedHanja(hanjaList[0]);
      setActiveHanjaList(hanjaList);
      setCurrentIndex(0);
      setCompletedCount(0);
      setCurrentAnswered(false);
      completingRef.current = false;
      setCompleting(false);
      setPhase('quiz');
    }, 0);

    return () => clearTimeout(timer);
  }, [hanjaFilter, hanjaList, initialHanja]);

  const handleWritingCompleteLocal = useCallback((id, score) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      persistWritingCompletedIds(next);
      return next;
    });
    setCurrentAnswered(true);
    setCompletedCount(count => count + 1);
    onWritingComplete?.(id, score);
  }, [onWritingComplete]);

  const handleCardClick = useCallback((item) => {
    const startIndex = displayList.findIndex(hanja => hanja.id === item.id);
    const index = startIndex !== -1 ? startIndex : 0;
    const orderedList = [...displayList.slice(index), ...displayList.slice(0, index)];
    startIndexRef.current = 0;
    setSelectedHanja(item);
    setActiveHanjaList(orderedList);
    setCurrentIndex(0);
    setCompletedCount(0);
    setCurrentAnswered(false);
    completingRef.current = false;
    setCompleting(false);
    setPhase('quiz');
  }, [displayList]);

  const startQuiz = useCallback(() => {
    if (activeHanjaList.length === 0) return;
    startIndexRef.current = 0;
    setCurrentIndex(0);
    setSelectedHanja(activeHanjaList[0]);
    setCompletedCount(0);
    completingRef.current = false;
    setCompleting(false);
    setPhase('quiz');
  }, [activeHanjaList]);

  const handleNextHanja = useCallback(() => {
    if (completingRef.current) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex < activeHanjaList.length) {
      setCurrentAnswered(false);
      setCurrentIndex(nextIndex);
      setSelectedHanja(activeHanjaList[nextIndex]);
      return;
    }

    clearCountRef.current += 1;
    completingRef.current = true;
    setCompleting(true);
    setTimeout(() => {
      setPhase('result');
      if (completedCount > 0) onStageClear?.();
    }, 750);
  }, [activeHanjaList, completedCount, currentIndex, onStageClear]);

  const handleExitConfirm = useCallback(() => {
    setShowExitModal(false);
    if (initialHanja || (hanjaFilter && hanjaFilter.length > 0) || contentPool) {
      onBack();
      return;
    }
    setPhase('list');
  }, [contentPool, hanjaFilter, initialHanja, onBack]);

  const handleHeaderBack = useCallback(() => {
    if (phase === 'quiz') {
      setShowExitModal(true);
      return;
    }

    if (phase === 'list' && !initialHanja && (!hanjaFilter || hanjaFilter.length === 0) && !contentPool) {
      setPhase('select');
      return;
    }

    onBack();
  }, [contentPool, hanjaFilter, initialHanja, onBack, phase]);

  const handleResultBack = useCallback(() => (
    initialHanja || hanjaFilter || contentPool ? onBack() : setPhase('list')
  ), [contentPool, hanjaFilter, initialHanja, onBack]);

  return {
    activeHanjaList,
    categoryFilter,
    characterAvatar,
    completedCount,
    completedIds,
    completing,
    currentAnswered,
    currentIndex,
    displayList,
    gradeFilter,
    handleCardClick,
    handleExitConfirm,
    handleHeaderBack,
    handleNextHanja,
    handleResultBack,
    handleWritingCompleteLocal,
    missionXp: (clearCountRef.current === 1 && completedCount > 0) ? 30 : 0,
    phase,
    selectedHanja,
    setCategoryFilter,
    setCurrentAnswered,
    setGradeFilter,
    setPhase,
    setShowExitModal,
    setViewMode,
    showExitModal,
    startIndex: startIndexRef.current,
    startQuiz,
    unlockedGrades,
    unlockedIds,
    viewMode,
  };
};

export default useWritingScreenState;
