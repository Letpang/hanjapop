import { useCallback } from 'react';

export const useMatchCardClick = ({
    gameState,
    isLockedRef,
    setCards,
    setFlippedCards,
}) => useCallback((clickedCard) => {
    if (isLockedRef.current || clickedCard.isFlipped || clickedCard.isMatched || gameState !== 'playing') return;
    setCards(prev => prev.map(card => (
        card.uniqueId === clickedCard.uniqueId ? { ...card, isFlipped: true } : card
    )));
    setFlippedCards(prev => {
        if (prev.length >= 2 || prev.find(card => card.uniqueId === clickedCard.uniqueId)) return prev;
        const next = [...prev, { ...clickedCard, isFlipped: true }];
        if (next.length === 2) {
            isLockedRef.current = true;
        }
        return next;
    });
}, [gameState, isLockedRef, setCards, setFlippedCards]);
