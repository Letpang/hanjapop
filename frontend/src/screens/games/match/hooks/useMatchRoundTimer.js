import { useEffect } from 'react';

export const useMatchRoundTimer = ({
  currentRound,
  gameState,
  isPaused,
  roundResolvedRef,
  setGameState,
  setTimeLeft,
}) => {
  useEffect(() => {
    if (gameState !== 'playing' || isPaused) return undefined;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (roundResolvedRef.current) return prev;
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('over');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, currentRound, isPaused, roundResolvedRef, setGameState, setTimeLeft]);
};
