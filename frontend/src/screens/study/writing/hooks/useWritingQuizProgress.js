import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_SCORE } from '../writingConstants.js';

export const useWritingQuizProgress = ({ hanja, onWritingComplete }) => {
  const [score, setScore] = useState(MAX_SCORE);
  const [isComplete, setIsComplete] = useState(false);
  const [mistakeOnStroke, setMistakeOnStroke] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeStrokeIndex, setActiveStrokeIndex] = useState(0);
  const completionReportedRef = useRef(false);
  const charDataRef = useRef(null);
  const activeStrokeIndexRef = useRef(0);
  const scoreRef = useRef(MAX_SCORE);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const markComplete = useCallback(() => {
    if (completionReportedRef.current) return;
    completionReportedRef.current = true;
    setIsComplete(true);
    if (onWritingComplete && hanja.id) onWritingComplete(hanja.id, scoreRef.current);
  }, [hanja.id, onWritingComplete]);

  const checkStrokeCompletion = useCallback((nextStrokeIndex) => {
    const strokeCount = charDataRef.current?.medians?.length || 0;
    if (strokeCount > 0 && nextStrokeIndex >= strokeCount) markComplete();
  }, [markComplete]);

  const resetQuizProgress = useCallback(() => {
    setScore(MAX_SCORE);
    setIsComplete(false);
    completionReportedRef.current = false;
    setMistakeOnStroke(false);
    setIsAnimating(false);
    setActiveStrokeIndex(0);
    activeStrokeIndexRef.current = 0;
  }, []);

  return {
    activeStrokeIndex,
    activeStrokeIndexRef,
    charDataRef,
    checkStrokeCompletion,
    isAnimating,
    isComplete,
    markComplete,
    mistakeOnStroke,
    resetQuizProgress,
    score,
    scoreRef,
    setActiveStrokeIndex,
    setIsAnimating,
    setMistakeOnStroke,
    setScore,
  };
};
