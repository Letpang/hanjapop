import { useCallback, useRef, useState } from 'react';

type WrongRenderItem = {
    hanja: string;
    isWord?: boolean;
    meaning?: string;
    sound?: string;
};

type ShootWrongTarget = WrongRenderItem & {
    pairId?: number | string | null;
    wordId?: number | string | null;
};

type UseShootWrongTrackerOptions = {
    onMarkWrong?: (pairId: number | string) => void;
    onWordWrong?: (
        wordId: number | string,
        hanjaId: number | string | null,
        reading: string,
        meaning: string,
    ) => void;
};

export const useShootWrongTracker = ({
    onMarkWrong,
    onWordWrong,
}: UseShootWrongTrackerOptions) => {
    const gameWrongHanjasRef = useRef<Set<number | string>>(new Set());
    const gameWrongWordsRef = useRef<Map<number | string, {
        hanjaId: number | string | null;
        meaning: string;
        reading: string;
    }>>(new Map());
    const [wrongItemsForRender, setWrongItemsForRender] = useState<WrongRenderItem[]>([]);

    const flushWrongItems = useCallback(() => {
        gameWrongHanjasRef.current.forEach(pairId => {
            if (pairId && onMarkWrong) onMarkWrong(pairId);
        });
        gameWrongWordsRef.current.forEach((info, wordId) => {
            if (wordId && onWordWrong) onWordWrong(wordId, info.hanjaId, info.reading, info.meaning);
        });
        gameWrongHanjasRef.current.clear();
        gameWrongWordsRef.current.clear();
    }, [onMarkWrong, onWordWrong]);

    const recordWrongItem = useCallback((target: ShootWrongTarget) => {
        if (target.pairId) gameWrongHanjasRef.current.add(target.pairId);
        if (target.isWord && target.wordId != null) {
            gameWrongWordsRef.current.set(target.wordId, {
                hanjaId: target.pairId || null,
                reading: target.sound || '',
                meaning: target.meaning || '',
            });
        }

        setWrongItemsForRender(prev => {
            if (prev.some(item => item.hanja === target.hanja)) return prev;
            return [...prev, {
                hanja: target.hanja,
                sound: target.sound,
                meaning: target.meaning,
                isWord: target.isWord,
            }];
        });
    }, []);

    const resetWrongItems = useCallback(() => {
        gameWrongHanjasRef.current.clear();
        gameWrongWordsRef.current.clear();
        setWrongItemsForRender([]);
    }, []);

    return {
        flushWrongItems,
        recordWrongItem,
        resetWrongItems,
        wrongItemsForRender,
    };
};
