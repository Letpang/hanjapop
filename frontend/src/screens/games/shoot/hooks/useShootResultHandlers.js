import { useCallback } from 'react';

export const useShootResultHandlers = ({
    contentPool,
    flushWrongItems,
    isClear,
    onBack,
    onGameFinish,
    setStatus,
    startGame,
}) => {
    const handleResultRetry = useCallback(() => {
        flushWrongItems();
        startGame();
    }, [flushWrongItems, startGame]);

    const handleResultContinue = useCallback(() => {
        flushWrongItems();
        if (contentPool) {
            if (onGameFinish) onGameFinish();
            else onBack();
        } else {
            setStatus('idle');
        }
    }, [contentPool, flushWrongItems, onBack, onGameFinish, setStatus]);

    const handleResultReturn = useCallback(() => {
        flushWrongItems();
        if (contentPool) {
            if (onGameFinish && isClear) onGameFinish();
            else onBack();
        } else {
            setStatus('idle');
        }
    }, [contentPool, flushWrongItems, isClear, onBack, onGameFinish, setStatus]);

    return {
        handleResultContinue,
        handleResultRetry,
        handleResultReturn,
    };
};
