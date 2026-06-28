import { useState, useEffect, useRef } from 'react';
import { pickClearMessage } from '../../../../constants/messages.js';
import { useMatchCardClick } from './useMatchCardClick.js';
import { useMatchCardResolution } from './useMatchCardResolution.js';
import { useMatchEventRefs } from './useMatchEventRefs.js';
import { useMatchNavigationHandlers } from './useMatchNavigationHandlers.js';
import { useMatchRoundClear } from './useMatchRoundClear.js';
import { useMatchRoundFlow } from './useMatchRoundFlow.js';
import { useMatchRoundTimer } from './useMatchRoundTimer.js';
import { useMatchSetupState } from './useMatchSetupState.js';

export const useMatchGameEngine = ({
    contentPool,
    currentDayHanjaIds,
    dailyMapNode,
    getRewardPreview,
    masteryData,
    missionDone = false,
    onBack,
    onGameFinish,
    onHanjaAcquired,
    onHanjaSeen,
    onMarkCorrect,
    onStageClear,
    onWordSeen,
    pairsPerRoundOverride,
    seenHanjaIds,
    selectedCharacter,
    srsData,
    unlockedHanjaIds,
    userLevel,
    userXp,
}) => {
    const {
        activeHanjaSet,
        cardBackChar,
        cardBackSrc,
        categories,
        characterAvatar,
        missionDoneAtStart,
        selectedCategory,
        selectedGrade,
        setSelectedCategory,
        setSelectedGrade,
        setViewMode,
        unlockedGrades,
        unlockedIds,
        viewMode,
    } = useMatchSetupState({
        contentPool,
        currentDayHanjaIds,
        masteryData,
        missionDone,
        seenHanjaIds,
        selectedCharacter,
        srsData,
        unlockedHanjaIds,
        userLevel,
        userXp,
    });

    const [gameStarted, setGameStarted] = useState(Boolean(contentPool));
    const [pairPool, setPairPool] = useState([]);
    const [poolIndex, setPoolIndex] = useState(0);
    const [currentRound, setCurrentRound] = useState(0);
    const [totalRounds, setTotalRounds] = useState(0);
    const [cards, setCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [matches, setMatches] = useState(0);
    const [targetMatches, setTargetMatches] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameState, setGameState] = useState('idle');
    const [resultClearMsg] = useState(() => pickClearMessage());
    const [xpPopup, setXpPopup] = useState({ show: false, key: 0, amount: 0 });
    const [showExitModal, setShowExitModal] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const poolIndexRef = useRef(0);
    const pairPoolRef = useRef([]);
    const isLockedRef = useRef(false);
    const roundResolvedRef = useRef(false);
    const roundStartTimeRef = useRef(null);
    const clearCountRef = useRef(0);

    const {
        deliverStageClear,
        onHanjaAcquiredRef,
        onHanjaSeenRef,
        onMarkCorrectRef,
        onWordSeenRef,
        stageClearArgsRef,
        stageClearDeliveredRef,
    } = useMatchEventRefs({
        onHanjaAcquired,
        onHanjaSeen,
        onMarkCorrect,
        onStageClear,
        onWordSeen,
    });

    const {
        goNextRound,
        retryRound,
        startGame,
    } = useMatchRoundFlow({
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
    });

    useEffect(() => {
        if (contentPool == null || gameState !== 'idle' || activeHanjaSet.length === 0) return undefined;
        const timer = setTimeout(() => startGame(), 0);
        return () => clearTimeout(timer);
    }, [contentPool, gameState, activeHanjaSet, startGame]);

    useMatchRoundTimer({
        currentRound,
        gameState,
        isPaused,
        roundResolvedRef,
        setGameState,
        setTimeLeft,
    });

    const handleCardClick = useMatchCardClick({
        gameState,
        isLockedRef,
        setCards,
        setFlippedCards,
    });

    useMatchCardResolution({
        flippedCards,
        isLockedRef,
        onHanjaAcquiredRef,
        onHanjaSeenRef,
        onMarkCorrectRef,
        onWordSeenRef,
        selectedGrade,
        setCards,
        setFlippedCards,
        setMatches,
        setXpPopup,
        targetMatches,
        viewMode,
    });

    useMatchRoundClear({
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
    });

    const {
        handleExitConfirm,
        handlePlayBack,
        handleRetry,
        resetToIdle,
    } = useMatchNavigationHandlers({
        contentPool,
        gameState,
        onBack,
        retryRound,
        setGameStarted,
        setGameState,
        setShowExitModal,
        stageClearArgsRef,
    });

    const xpPerMatch = 3;
    const matchXp = matches * xpPerMatch;
    const clearXp = gameState === 'clear' ? 20 : 0;
    const reward = getRewardPreview?.(matchXp + clearXp);

    return {
        cardBackChar,
        cardBackSrc,
        cards,
        categories,
        characterAvatar,
        clearCount: clearCountRef.current,
        clearXp,
        currentRound,
        deliverStageClear,
        gameStarted,
        gameState,
        handleCardClick,
        handleExitConfirm,
        handlePlayBack,
        handleRetry,
        isPaused,
        matchXp,
        matches,
        missionDoneAtStart,
        reward,
        resultClearMsg,
        selectedCategory,
        selectedGrade,
        setIsPaused,
        setSelectedCategory,
        setSelectedGrade,
        setShowExitModal,
        setViewMode,
        showExitModal,
        startGame,
        timeLeft,
        totalRounds,
        unlockedGrades,
        unlockedIds,
        viewMode,
        xpPerMatch,
        xpPopup,
        goNextRound,
        resetToIdle,
    };
};
