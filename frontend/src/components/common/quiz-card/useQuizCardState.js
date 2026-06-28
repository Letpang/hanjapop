import { useEffect, useRef, useState } from 'react';
import { CELEB_MESSAGES } from '../../../constants/messages.js';
import { speakKorean } from '../../../utils/speakUtils.js';

export const useQuizCardState = ({
  combo,
  correctAnswer,
  onCorrect,
  onCorrectSelected,
  onNext,
  onWrong,
  speakText,
  suppressXp,
}) => {
  const [wrongChoices, setWrongChoices] = useState([]);
  const [isCorrectSelected, setIsCorrectSelected] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState('');
  const [showXPPopup, setShowXPPopup] = useState(false);
  const [xpAnimKey, setXpAnimKey] = useState(0);

  const flipTimerRef = useRef(null);
  const flipSeqRef = useRef(0);
  const wrongFiredRef = useRef(false);
  const celebIdxRef = useRef(Math.floor(Math.random() * CELEB_MESSAGES.length));

  useEffect(() => () => {
    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    flipSeqRef.current += 1;
    window.speechSynthesis?.cancel();
  }, []);

  const speak = (e) => {
    e?.stopPropagation();
    if (!speakText) return;
    setIsSpeaking(true);
    speakKorean(speakText, () => setIsSpeaking(false));
  };

  const handleCardClick = () => {
    if (!isCorrectSelected) return;
    const toBack = !isFlipped;
    setIsFlipped((f) => !f);
    if (toBack && speakText) {
      setIsSpeaking(true);
      speakKorean(speakText, () => setIsSpeaking(false));
      return;
    }

    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const handleSelect = (choice) => {
    if (isCorrectSelected || wrongChoices.includes(choice)) return;
    if (choice === correctAnswer) {
      const isFirstAttempt = wrongChoices.length === 0;
      setIsCorrectSelected(true);
      onCorrectSelected?.();
      setCelebrationMsg(CELEB_MESSAGES[celebIdxRef.current % CELEB_MESSAGES.length]);
      celebIdxRef.current += 1;
      onCorrect?.(isFirstAttempt);
      if (!suppressXp) {
        setShowXPPopup(false);
        setTimeout(() => {
          setShowXPPopup(true);
          setXpAnimKey((k) => k + 1);
          setTimeout(() => setShowXPPopup(false), 1500);
        }, 0);
      }
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
      const seq = ++flipSeqRef.current;
      flipTimerRef.current = setTimeout(() => {
        if (flipSeqRef.current !== seq) return;
        setIsFlipped(true);
        flipTimerRef.current = null;
        if (speakText) {
          setIsSpeaking(true);
          speakKorean(speakText, () => setIsSpeaking(false));
        }
      }, 1500);
      return;
    }

    if (!wrongFiredRef.current) {
      wrongFiredRef.current = true;
      onWrong?.(choice);
    }
    setWrongChoices((prev) => [...prev, choice]);
  };

  const handleNext = () => {
    window.speechSynthesis?.cancel();
    if (flipTimerRef.current) {
      clearTimeout(flipTimerRef.current);
      flipTimerRef.current = null;
    }
    flipSeqRef.current += 1;
    setIsSpeaking(false);
    onNext?.();
  };

  return {
    cardState: {
      celebrationMsg,
      combo,
      isCorrectSelected,
      isFlipped,
      isSpeaking,
      showXPPopup,
      wrongChoices,
      xpAnimKey,
    },
    handleCardClick,
    handleNext,
    handleSelect,
    speak,
  };
};
