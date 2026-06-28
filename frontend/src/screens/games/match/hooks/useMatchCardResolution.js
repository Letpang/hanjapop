import { useEffect } from 'react';
import { GRADE_XP } from '../matchGameData.js';

export const useMatchCardResolution = ({
  flippedCards,
  isLockedRef,
  onHanjaAcquiredRef,
  onHanjaSeenRef,
  onMarkCorrectRef,
  onWordSeenRef,
  selectedGrade,
  setCards,
  setFlippedCards,
  setMatches,
  setXpPopup,
  targetMatches,
  viewMode,
}) => {
  useEffect(() => {
    if (flippedCards.length !== 2) return undefined;
    const [a, b] = flippedCards;
    if (a.pairId === b.pairId) {
      const wordCard = [a, b].find(card => card.type === 'word');
      if (wordCard?.content) {
        if (a.hanjaId != null) onHanjaSeenRef.current?.([a.hanjaId]);
        const matchedPair = [a, b].find(card => card.type === 'word');
        if (matchedPair?.wordId != null) onWordSeenRef.current?.(matchedPair.wordId);
      }
      const timer = setTimeout(() => {
        if (onMarkCorrectRef.current && a.hanjaId) onMarkCorrectRef.current(a.hanjaId);
        if (onHanjaAcquiredRef.current && a.hanjaId) {
          const gradeKey = viewMode === 'grade' ? selectedGrade : 'NON';
          const xpPerMatch = GRADE_XP[gradeKey]?.base || 3;
          onHanjaAcquiredRef.current(a.hanjaId, 0);
          setXpPopup({ show: true, key: Date.now(), amount: xpPerMatch });
          setTimeout(() => setXpPopup(popup => ({ ...popup, show: false })), 1500);
        }
        setCards(prev => prev.map(card => card.pairId === a.pairId ? { ...card, isMatched: true } : card));
        setFlippedCards([]);
        setMatches(prev => {
          const next = prev + 1;
          if (next < targetMatches) isLockedRef.current = false;
          return next;
        });
      }, 500);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setCards(prev => prev.map(card =>
        (card.uniqueId === a.uniqueId || card.uniqueId === b.uniqueId)
          ? { ...card, isFlipped: false }
          : card
      ));
      setFlippedCards([]);
      isLockedRef.current = false;
    }, 900);
    return () => clearTimeout(timer);
  }, [
    flippedCards,
    isLockedRef,
    onHanjaAcquiredRef,
    onHanjaSeenRef,
    onMarkCorrectRef,
    onWordSeenRef,
    selectedGrade,
    setCards,
    setFlippedCards,
    setMatches,
    setXpPopup,
    targetMatches,
    viewMode,
  ]);
};
