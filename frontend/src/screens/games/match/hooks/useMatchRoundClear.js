import { useEffect } from 'react';

export const useMatchRoundClear = ({
  clearCountRef,
  currentRound,
  dailyMapNode,
  deliverStageClear,
  gameState,
  isLockedRef,
  matches,
  roundResolvedRef,
  roundStartTimeRef,
  setGameState,
  stageClearArgsRef,
  targetMatches,
}) => {
  useEffect(() => {
    if (targetMatches > 0 && matches === targetMatches && gameState === 'playing' && !roundResolvedRef.current) {
      roundResolvedRef.current = true;
      isLockedRef.current = true;
      const elapsedSec = roundStartTimeRef.current
        ? Math.round((Date.now() - roundStartTimeRef.current) / 1000)
        : null;

      clearCountRef.current += 1;
      stageClearArgsRef.current = [currentRound + 1, elapsedSec, matches];
      if (!dailyMapNode) deliverStageClear();
      const clearTimer = setTimeout(() => setGameState('clear'), 380);

      return () => {
        clearTimeout(clearTimer);
      };
    }
    return undefined;
  }, [
    clearCountRef,
    currentRound,
    dailyMapNode,
    deliverStageClear,
    gameState,
    isLockedRef,
    matches,
    roundResolvedRef,
    roundStartTimeRef,
    setGameState,
    stageClearArgsRef,
    targetMatches,
  ]);
};
