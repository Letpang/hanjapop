import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '../../../../hooks/useLang.js';
import { pickClearMessage } from '../../../../constants/messages.js';
import { useShootAutoStart } from './useShootAutoStart.js';
import { useShootGameLoop } from './useShootGameLoop.js';
import { useShootHpGuard } from './useShootHpGuard.js';
import { useShootOptionHandler } from './useShootOptionHandler.js';
import { useShootResultHandlers } from './useShootResultHandlers.js';
import { useShootRoundStart } from './useShootRoundStart.js';
import { useShootSetupState } from './useShootSetupState.js';
import { useShootSpawnPlan } from './useShootSpawnPlan.js';
import { useShootTargetSelection } from './useShootTargetSelection.js';
import { useShootThemeStyle } from './useShootThemeStyle.js';
import { useShootWaveProgress } from './useShootWaveProgress.js';
import { useShootWrongTracker } from './useShootWrongTracker.ts';

export const useShootGameEngine = ({
    autoStart,
    avatarOverride,
    contentPool,
    currentDay,
    currentDayHanjaIds,
    getRewardPreview,
    hideRetry,
    killsPerWaveOverride,
    masteryData,
    missionDone = false,
    onBack,
    onGameFinish,
    onHanjaAcquired,
    onHanjaSeen,
    onMarkCorrect,
    onMarkWrong,
    onWaveClear,
    onWordCorrect,
    onWordSeen,
    onWordWrong,
    seenHanjaIds,
    selectedCharacter,
    srsData,
    unlockedHanjaIds,
    userLevel,
    userXpOverride,
}) => {
    const { lang } = useLang();
    const {
        categories,
        characterAvatar,
        diffConfig,
        gamePoolData,
        selectedCategory,
        selectedDifficulty,
        selectedGrade,
        setSelectedCategory,
        setSelectedGrade,
        setViewMode,
        themeConfig,
        unlockedGrades,
        unlockedIds,
        viewMode,
    } = useShootSetupState({
        avatarOverride,
        contentPool,
        currentDay,
        killsPerWaveOverride,
        selectedCharacter,
        unlockedHanjaIds,
        userXpOverride,
    });

    const getMeaning = useCallback((item) => {
        if (!item) return '';
        return lang === 'en' ? (item.meaning_en || item.meaning) : item.meaning;
    }, [lang]);

    const [status, setStatus] = useState((contentPool || autoStart) ? 'loading' : 'idle');
    const [isPaused, setIsPaused] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [wave, setWave] = useState(1);
    const [waveKills, setWaveKills] = useState(0);
    const [waveTransition, setWaveTransition] = useState(false);
    const [clearCombo, setClearCombo] = useState(0);
    const [score, setScore] = useState(0);
    const [sessionXp, setSessionXp] = useState(0);
    const missionXpGrantedRef = useRef(0);

    const [hp, setHp] = useState(5);
    const [words, setWords] = useState([]);
    const [options, setOptions] = useState([]);
    const [isWordTarget, setIsWordTarget] = useState(false);
    const [targetId, setTargetId] = useState(null);
    const [lasers, setLasers] = useState([]);
    const [shake, setShake] = useState(false);
    const [turretAngle, setTurretAngle] = useState(-90);
    const [acquisitions, setAcquisitions] = useState([]);
    const [xpPopup, setXpPopup] = useState({ show: false, key: 0, amount: 0 });
    const [isInputLocked, setIsInputLocked] = useState(false);
    const inputLockedRef = useRef(false);
    const effectIdRef = useRef(0);
    const clearCountRef = useRef(0);

    const hpRef = useRef(hp);
    useEffect(() => { hpRef.current = hp; }, [hp]);

    const onHanjaSeenRef = useRef(onHanjaSeen);
    useEffect(() => { onHanjaSeenRef.current = onHanjaSeen; });
    const {
        flushWrongItems,
        recordWrongItem,
        resetWrongItems,
        wrongItemsForRender,
    } = useShootWrongTracker({ onMarkWrong, onWordWrong });
    const [resultClearMsg] = useState(() => pickClearMessage());

    const {
        prepareSpawnPlan,
        takeNextSpawnItem,
    } = useShootSpawnPlan({
        contentPool,
        currentDayHanjaIds,
        gamePoolData,
        masteryData,
        onWordSeen,
        seenHanjaIds,
        srsData,
        userLevel,
    });

    const startGame = useShootRoundStart({
        diffConfig,
        hpRef,
        prepareSpawnPlan,
        resetWrongItems,
        setClearCombo,
        setHp,
        setOptions,
        setScore,
        setSessionXp,
        setShake,
        setStatus,
        setTargetId,
        setWave,
        setWaveKills,
        setWaveTransition,
        setWords,
    });

    useShootAutoStart({
        autoStart,
        contentPool,
        startGame,
        status,
    });

    const getDropSpeed = useCallback((currentWave) => (
        diffConfig.dropSpeedBase + (currentWave - 1) * diffConfig.dropSpeedPerWave
    ), [diffConfig]);

    const getSpawnInterval = useCallback((currentWave) => (
        Math.max(800, diffConfig.spawnIntervalBase + (currentWave - 1) * diffConfig.spawnIntervalPerWave)
    ), [diffConfig]);

    useShootHpGuard({ hp, setStatus, status });

    useShootWaveProgress({
        clearCombo,
        clearCountRef,
        diffConfig,
        effectIdRef,
        missionDone,
        missionXpGrantedRef,
        onHanjaAcquired,
        onWaveClear,
        selectedDifficulty,
        setClearCombo,
        setSessionXp,
        setStatus,
        setWave,
        setWaveKills,
        setWaveTransition,
        setWords,
        setXpPopup,
        status,
        wave,
        waveKills,
        waveTransition,
    });

    useShootGameLoop({
        diffConfig,
        effectIdRef,
        getDropSpeed,
        getMeaning,
        getSpawnInterval,
        isPaused,
        setHp,
        setShake,
        setWords,
        status,
        takeNextSpawnItem,
        wave,
        waveTransition,
    });

    useShootTargetSelection({
        diffConfig,
        gameChars: gamePoolData.chars,
        setIsWordTarget,
        setOptions,
        setTargetId,
        status,
        targetId,
        words,
    });

    const handleOptionClick = useShootOptionHandler({
        effectIdRef,
        inputLockedRef,
        onHanjaAcquired,
        onHanjaSeenRef,
        onMarkCorrect,
        onWordCorrect,
        recordWrongItem,
        setAcquisitions,
        setHp,
        setIsInputLocked,
        setLasers,
        setScore,
        setShake,
        setTurretAngle,
        setWaveKills,
        setWords,
        status,
        targetId,
        words,
    });

    useShootThemeStyle(themeConfig);

    const handleExitConfirm = useCallback(() => {
        setShowExitModal(false);
        onBack();
    }, [onBack]);

    const isClear = status === 'clear';
    const isResult = status === 'over' || status === 'clear';
    const killXp = score * 3;
    const shootClearXp = sessionXp - killXp;
    const reward = getRewardPreview?.(isClear ? sessionXp : killXp);

    const {
        handleResultContinue,
        handleResultRetry,
        handleResultReturn,
    } = useShootResultHandlers({
        contentPool,
        flushWrongItems,
        isClear,
        onBack,
        onGameFinish,
        setStatus,
        startGame,
    });

    return {
        acquisitions,
        categories,
        characterAvatar,
        diffConfig,
        handleExitConfirm,
        handleOptionClick,
        handleResultContinue,
        handleResultRetry,
        handleResultReturn,
        hideRetry,
        hp,
        isClear,
        isInputLocked,
        isPaused,
        isResult,
        isWordTarget,
        killXp,
        lasers,
        missionXp: missionXpGrantedRef.current,
        options,
        reward,
        resultClearMsg,
        score,
        selectedCategory,
        selectedDifficulty,
        selectedGrade,
        setIsPaused,
        setSelectedCategory,
        setSelectedGrade,
        setShowExitModal,
        setViewMode,
        shake,
        shootClearXp,
        showExitModal,
        startGame,
        status,
        targetId,
        themeConfig,
        turretAngle,
        unlockedGrades,
        unlockedIds,
        viewMode,
        waveKills,
        words,
        xpPopup,
    };
};
