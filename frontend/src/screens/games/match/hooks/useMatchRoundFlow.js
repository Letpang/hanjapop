import { useCallback } from 'react';
import {
    buildPairPool,
    createRoundCards,
    filterPairsForStageWords,
    getMatchNextRoundPlan,
    getMatchRetryRoundPlan,
    getMatchStageWordIds,
    takeMatchStageRoundPool,
} from '../matchGameUtils.js';

export const useMatchRoundFlow = ({
    activeHanjaSet,
    contentPool,
    currentRound,
    isLockedRef,
    pairPool,
    pairPoolRef,
    pairsPerRoundOverride,
    poolIndex,
    poolIndexRef,
    roundResolvedRef,
    roundStartTimeRef,
    setCards,
    setCurrentRound,
    setFlippedCards,
    setGameStarted,
    setGameState,
    setMatches,
    setPairPool,
    setPoolIndex,
    setTargetMatches,
    setTimeLeft,
    setTotalRounds,
}) => {
    const applyRoundState = useCallback((slice) => {
        setCards(createRoundCards(slice));
        setTargetMatches(slice.length);
        setMatches(0);
        setFlippedCards([]);
        isLockedRef.current = false;
        roundResolvedRef.current = false;
        setTimeLeft(slice.length * 10);
        roundStartTimeRef.current = Date.now();
        setGameState('playing');
    }, [
        isLockedRef,
        roundResolvedRef,
        roundStartTimeRef,
        setCards,
        setFlippedCards,
        setGameState,
        setMatches,
        setTargetMatches,
        setTimeLeft,
    ]);

    const startGame = useCallback((overrideSet) => {
        const targetSet = overrideSet || activeHanjaSet;
        if (!targetSet || targetSet.length === 0) return;

        let pool = buildPairPool(targetSet);
        const isStageMode = contentPool != null;
        const stageWordIds = getMatchStageWordIds(contentPool);

        if (isStageMode) {
            pool = filterPairsForStageWords(pool, targetSet, stageWordIds);
        }

        const pairsPerRound = pairsPerRoundOverride ?? 4;

        if (isStageMode) {
            pool = takeMatchStageRoundPool({
                pairsPerRound,
                pool,
                stageWordIds,
                targetSet,
            });
        }

        const total = isStageMode ? 1 : Math.ceil(pool.length / pairsPerRound);

        pairPoolRef.current = pool;
        poolIndexRef.current = 0;
        setPairPool(pool);
        setPoolIndex(0);
        setCurrentRound(0);
        setTotalRounds(total);
        setGameStarted(true);

        const slice = pool.slice(0, pairsPerRound);
        applyRoundState(slice);
    }, [
        activeHanjaSet,
        applyRoundState,
        contentPool,
        pairPoolRef,
        pairsPerRoundOverride,
        poolIndexRef,
        setCurrentRound,
        setGameStarted,
        setPairPool,
        setPoolIndex,
        setTotalRounds,
    ]);

    const goNextRound = useCallback(() => {
        const pairsPerRound = pairsPerRoundOverride ?? 4;
        const plan = getMatchNextRoundPlan({
            contentPool,
            currentRound,
            pairPool,
            pairsPerRound,
            poolIndex,
        });

        if (plan.isAllClear) {
            setGameState('allClear');
            return;
        }

        pairPoolRef.current = plan.workPool;
        poolIndexRef.current = plan.poolIndex;
        setPairPool(plan.workPool);
        setPoolIndex(plan.poolIndex);
        if (plan.totalRoundsDelta) setTotalRounds(prev => prev + plan.totalRoundsDelta);
        setCurrentRound(plan.nextRound);
        applyRoundState(plan.slice);
    }, [
        applyRoundState,
        contentPool,
        currentRound,
        pairPool,
        pairPoolRef,
        pairsPerRoundOverride,
        poolIndex,
        poolIndexRef,
        setCurrentRound,
        setGameState,
        setPairPool,
        setPoolIndex,
        setTotalRounds,
    ]);

    const retryRound = useCallback(() => {
        const pairsPerRound = pairsPerRoundOverride ?? 4;
        const plan = getMatchRetryRoundPlan({
            contentPool,
            pairPool,
            pairsPerRound,
            poolIndex,
        });

        if (plan.shouldRestart) {
            startGame();
            return;
        }

        if (plan.workPool) {
            setPairPool(plan.workPool);
            pairPoolRef.current = plan.workPool;
        }
        if (typeof plan.poolIndex === 'number') {
            setPoolIndex(plan.poolIndex);
            poolIndexRef.current = plan.poolIndex;
        }
        applyRoundState(plan.slice);
    }, [
        applyRoundState,
        contentPool,
        pairPool,
        pairPoolRef,
        pairsPerRoundOverride,
        poolIndex,
        poolIndexRef,
        setPairPool,
        setPoolIndex,
        startGame,
    ]);

    return {
        goNextRound,
        retryRound,
        startGame,
    };
};
