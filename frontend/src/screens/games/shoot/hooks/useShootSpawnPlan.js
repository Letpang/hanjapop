import { useCallback, useEffect, useRef } from 'react';
import {
    buildShootFlatWordPool,
    buildShootHanjaStage,
    getShootWordChance,
    orderShootWordQueue,
    takeNextShootSpawnItem,
} from '../shootGameUtils.js';

export const useShootSpawnPlan = ({
    contentPool,
    currentDayHanjaIds,
    gamePoolData,
    masteryData,
    onWordSeen,
    seenHanjaIds,
    srsData,
    userLevel,
}) => {
    const hanjaStageRef = useRef([]);
    const stageIndexRef = useRef(0);
    const lastSpawnedIdRef = useRef(null);
    const wordQueueRef = useRef([]);
    const lastSpawnedWordRef = useRef(null);
    const flatWordPoolRef = useRef([]);
    const spawnedWordsSetRef = useRef(new Set());
    const onWordSeenRef = useRef(onWordSeen);
    const wordChanceRef = useRef(0.83);

    useEffect(() => {
        onWordSeenRef.current = onWordSeen;
    }, [onWordSeen]);

    const refillWordQueue = useCallback((pool) => {
        wordQueueRef.current = orderShootWordQueue({
            contentPool,
            currentDayHanjaIds,
            lastSpawnedWord: lastSpawnedWordRef.current,
            pool,
        });
    }, [contentPool, currentDayHanjaIds]);

    useEffect(() => {
        flatWordPoolRef.current = buildShootFlatWordPool({
            contentPool,
            gameWords: gamePoolData.words,
        });
        refillWordQueue(flatWordPoolRef.current);
    }, [gamePoolData.words, contentPool, refillWordQueue]);

    const prepareSpawnPlan = useCallback((effectiveDiff) => {
        const stage = buildShootHanjaStage({
            contentPool,
            currentDayHanjaIds,
            effectiveDiff,
            gameChars: gamePoolData.chars,
            masteryData,
            seenHanjaIds,
            srsData,
            userLevel,
        });
        hanjaStageRef.current = stage;
        stageIndexRef.current = 0;
        lastSpawnedIdRef.current = null;
        lastSpawnedWordRef.current = null;
        spawnedWordsSetRef.current = new Set();
        refillWordQueue(flatWordPoolRef.current);

        wordChanceRef.current = getShootWordChance({
            contentPool,
            totalHanja: stage.length,
            totalWords: flatWordPoolRef.current.length,
        });

        return stage;
    }, [
        contentPool,
        currentDayHanjaIds,
        gamePoolData.chars,
        masteryData,
        refillWordQueue,
        seenHanjaIds,
        srsData,
        userLevel,
    ]);

    const takeNextSpawnItem = useCallback((fallingHanjas) => (
        takeNextShootSpawnItem({
            fallingHanjas,
            flatWordPool: flatWordPoolRef.current,
            hanjaStageRef,
            lastSpawnedIdRef,
            lastSpawnedWordRef,
            masteryData,
            onWordSeen: onWordSeenRef.current,
            refillWordQueue,
            spawnedWordsSetRef,
            stageIndexRef,
            wordChance: wordChanceRef.current,
            wordQueueRef,
        })
    ), [masteryData, refillWordQueue]);

    return {
        prepareSpawnPlan,
        takeNextSpawnItem,
    };
};
