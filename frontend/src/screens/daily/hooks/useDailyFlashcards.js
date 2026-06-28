import { useState } from 'react';
import { CLEAR_MESSAGES } from '../../../constants/messages.js';
import { playCardSound } from '../components/dailyFlashcardAudio.js';

export const useDailyFlashcards = ({ items, onCardFlip }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [flippedSet, setFlippedSet] = useState(new Set());
  const [showWords, setShowWords] = useState(false);
  const [showClearPopup, setShowClearPopup] = useState(false);
  const [clearMsg] = useState(() => CLEAR_MESSAGES[Math.floor(Math.random() * CLEAR_MESSAGES.length)]);

  const item = items[currentIndex];
  const isLastCard = currentIndex === items.length - 1;

  const goTo = (idx) => {
    setIsTransitioning(true);
    setIsFlipped(false);
    setShowWords(false);
    setTimeout(() => {
      setCurrentIndex(idx);
      setIsTransitioning(false);
    }, 300);
  };

  const handleCardClick = () => {
    if (showWords) return;
    if (!isFlipped) {
      setIsFlipped(true);
      const next = new Set([...flippedSet, currentIndex]);
      setFlippedSet(next);
      onCardFlip?.(item.id);
      playCardSound(item);
      return;
    }

    setIsFlipped(false);
  };

  const handleNext = () => {
    if (!isFlipped) return;
    if (isLastCard) {
      setShowClearPopup(true);
      return;
    }
    goTo(currentIndex + 1);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  };

  return {
    clearMsg,
    currentIndex,
    flippedSet,
    handleCardClick,
    handleNext,
    handlePrevious,
    isFlipped,
    isLastCard,
    isTransitioning,
    item,
    setShowClearPopup,
    setShowWords,
    showClearPopup,
    showWords,
  };
};
