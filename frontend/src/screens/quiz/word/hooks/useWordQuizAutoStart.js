import { useEffect, useRef } from 'react';

export const useWordQuizAutoStart = ({ contentPool, phase, startQuiz }) => {
  const startQuizRef = useRef(null);

  useEffect(() => {
    startQuizRef.current = startQuiz;
  });

  useEffect(() => {
    if (!contentPool || (phase !== 'select' && phase !== 'init')) return undefined;
    const timer = setTimeout(() => startQuizRef.current?.(), 0);
    return () => clearTimeout(timer);
  }, [contentPool, phase]);
};
