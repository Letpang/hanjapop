import { useCallback } from 'react';

export const useMatchNavigationHandlers = ({
    contentPool,
    gameState,
    onBack,
    retryRound,
    setGameStarted,
    setGameState,
    setShowExitModal,
    stageClearArgsRef,
}) => {
    const resetToIdle = useCallback(() => {
        setGameStarted(false);
        setGameState('idle');
    }, [setGameStarted, setGameState]);

    const handleExitConfirm = useCallback(() => {
        setShowExitModal(false);
        if (contentPool) {
            onBack();
        } else {
            resetToIdle();
        }
    }, [contentPool, onBack, resetToIdle, setShowExitModal]);

    const handlePlayBack = useCallback(() => {
        if (gameState === 'clear' || contentPool) onBack();
        else resetToIdle();
    }, [contentPool, gameState, onBack, resetToIdle]);

    const handleRetry = useCallback(() => {
        stageClearArgsRef.current = null;
        retryRound();
    }, [retryRound, stageClearArgsRef]);

    return {
        handleExitConfirm,
        handlePlayBack,
        handleRetry,
        resetToIdle,
    };
};
