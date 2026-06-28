export const takeNextShootSpawnItem = ({
    fallingHanjas,
    flatWordPool,
    hanjaStageRef,
    lastSpawnedIdRef,
    lastSpawnedWordRef,
    masteryData,
    onWordSeen,
    refillWordQueue,
    spawnedWordsSetRef,
    stageIndexRef,
    wordChance,
    wordQueueRef,
}) => {
    let nextItem;
    let isWord = false;

    if (Math.random() < wordChance && flatWordPool.length > 0) {
        if (wordQueueRef.current.length === 0) refillWordQueue(flatWordPool);
        const wordItem = wordQueueRef.current.shift();
        if (wordItem) {
            lastSpawnedWordRef.current = wordItem.hanja;
            nextItem = {
                ...wordItem,
                isWrongItem: (masteryData?.[String(wordItem.id)]?.wrongCount || 0) >= 1,
            };
            isWord = true;
        }
    }

    if (!nextItem && hanjaStageRef.current.length > 0) {
        if (stageIndexRef.current >= hanjaStageRef.current.length) {
            const reshuffled = [...hanjaStageRef.current].sort(() => Math.random() - 0.5);
            if (reshuffled.length > 1 && reshuffled[0]?.id === lastSpawnedIdRef.current) {
                const [first, ...rest] = reshuffled;
                hanjaStageRef.current = [...rest, first];
            } else {
                hanjaStageRef.current = reshuffled;
            }
            stageIndexRef.current = 0;
        }

        const ch = hanjaStageRef.current[stageIndexRef.current++];
        if (ch) {
            lastSpawnedIdRef.current = ch.id;
            nextItem = {
                ...ch,
                isWrongItem: (masteryData?.[String(ch.id)]?.wrongCount || 0) >= 1,
            };
        }
    }

    if (!nextItem || fallingHanjas.has(nextItem.hanja)) return null;

    if (isWord && nextItem.hanja) {
        spawnedWordsSetRef.current.add(nextItem.hanja);
        if (nextItem.wordId != null) onWordSeen?.(nextItem.wordId);
    }

    return { isWord, nextItem };
};

export const advanceShootFallingWords = (words, dropSpeed) => {
    let hpDelta = 0;
    let shouldShake = false;
    const nextWords = words.map(w => {
        if (w.state === 'exploding') return { ...w, timer: w.timer - 1 };
        return { ...w, y: w.y + dropSpeed };
    }).filter(w => {
        if (w.state === 'exploding' && w.timer <= 0) return false;
        if (w.state !== 'exploding' && w.y >= 90) {
            hpDelta += 1;
            shouldShake = true;
            return false;
        }
        return true;
    });
    return { hpDelta, nextWords, shouldShake };
};

export const createShootFallingItem = ({
    effectId,
    getMeaning,
    isWord,
    monsterCount,
    nextItem,
}) => ({
    id: effectId,
    pairId: nextItem.id,
    wordId: nextItem.wordId || null,
    hanja: nextItem.hanja,
    answer: (nextItem.meaning || getMeaning(nextItem) || '') + ' ' + (nextItem.sound || ''),
    meaning: nextItem.meaning || getMeaning(nextItem) || '',
    sound: nextItem.sound || '',
    category: nextItem.category || '',
    x: Math.floor(Math.random() * 65) + 15,
    y: 0,
    emojiId: Math.floor(Math.random() * monsterCount),
    state: 'falling',
    isWord,
    isWrongItem: nextItem.isWrongItem || false,
});
