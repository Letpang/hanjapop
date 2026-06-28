import { useEffect, useRef } from 'react';

export const useSentenceQuizAutoStart = ({
  contentPool,
  gameState,
  startQuiz,
}) => {
  const startQuizRef = useRef(null);

  useEffect(() => {
    startQuizRef.current = startQuiz;
  });

  useEffect(() => {
    if (contentPool == null || (gameState !== 'init' && gameState !== 'idle')) return undefined;
    const timer = setTimeout(() => startQuizRef.current?.(), 0);
    return () => clearTimeout(timer);
  }, [contentPool, gameState]);
};

export const useSentenceQuizQuestionDriver = ({
  currentQuiz,
  gameState,
  generateQuiz,
  started,
}) => {
  useEffect(() => {
    if (!started || gameState !== 'playing' || currentQuiz) return undefined;
    const timer = setTimeout(() => generateQuiz(), 0);
    return () => clearTimeout(timer);
  }, [started, gameState, currentQuiz, generateQuiz]);
};
