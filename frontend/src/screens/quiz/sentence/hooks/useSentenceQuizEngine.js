import { useState, useRef } from 'react';
import { pickClearMessage } from '../../../../constants/messages.js';
import { useSentenceQuizAnswerHandlers } from './useSentenceQuizAnswerHandlers.js';
import {
    useSentenceQuizAutoStart,
    useSentenceQuizQuestionDriver,
} from './useSentenceQuizAutoStart.js';
import { useSentenceQuizGenerator } from './useSentenceQuizGenerator.js';
import { useSentenceQuizQueues } from './useSentenceQuizQueues.js';
import { useSentenceQuizResultFlow } from './useSentenceQuizResultFlow.js';
import { useSentenceQuizSetupState } from './useSentenceQuizSetupState.js';
import { useSentenceQuizStart } from './useSentenceQuizStart.js';

export const useSentenceQuizEngine = ({
    clearXp,
    contentPool,
    currentDayHanjaIds,
    dailyMapNode,
    getRewardPreview,
    mainSeenHanjaIds,
    masteryData,
    missionDone,
    onBack,
    onGetNextWordIds,
    onHanjaAcquired,
    onMarkCorrect,
    onMarkWordWrong,
    onMarkWrong,
    onStageClear,
    onWordCorrect,
    onWordSeen,
    quizCount,
    seenHanjaIds,
    seenWordIds,
    selectedCharacter,
    srsData,
    unlockedHanjaIds,
    userLevel,
    userXp,
}) => {
    const {
        activeHanjaSet,
        categories,
        characterAvatar,
        selectedCategory,
        selectedGrade,
        setSelectedCategory,
        setSelectedGrade,
        setViewMode,
        unlockedGrades,
        unlockedIds,
        viewMode,
    } = useSentenceQuizSetupState({
        contentPool,
        selectedCharacter,
        unlockedHanjaIds,
        userXp,
    });

    const [started, setStarted] = useState(Boolean(contentPool));
    const [showExitModal, setShowExitModal] = useState(false);
    const [gameState, setGameState] = useState(contentPool ? 'init' : 'playing');
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [options, setOptions] = useState([]);
    const [questionKey, setQuestionKey] = useState(0);
    const [score, setScore] = useState(0);
    const scoreRef = useRef(0);
    const [totalAnswered, setTotalAnswered] = useState(0);
    const totalAnsweredRef = useRef(0);
    const [resultStats, setResultStats] = useState(null);
    const [resultClearMsg] = useState(() => pickClearMessage());
    const [plannedQuizTotal, setPlannedQuizTotal] = useState(quizCount);
    const completingRef = useRef(false);
    const [completing, setCompleting] = useState(false);
    const [currentAnswered, setCurrentAnswered] = useState(false);
    const [combo, setCombo] = useState(0);
    const clearCountRef = useRef(0);
    const missionXpGrantedRef = useRef(0);
    const stageClearArgsRef = useRef(null);
    const stageClearDeliveredRef = useRef(false);
    const shownWordsRef = useRef([]);
    const shownSimpleHanjaRef = useRef([]);
    const lastWordIdRef = useRef(null);
    const lastSimpleHanjaIdRef = useRef(null);

    const {
        buildMainQueue,
        initQueues,
        normalQueueRef,
        pickNextFromPool,
        reviewQueueRef,
        sessionPlan,
        setLastHanjaId,
    } = useSentenceQuizQueues({
        activeHanjaSet,
        contentPool,
        currentDayHanjaIds,
        mainSeenHanjaIds,
        masteryData,
        quizCount,
        seenHanjaIds,
        srsData,
        userLevel,
    });

    const {
        deliverStageClear,
        endQuiz,
        handleExitConfirm,
        handleResultBack,
    } = useSentenceQuizResultFlow({
        clearCountRef,
        completingRef,
        dailyMapNode,
        missionDone,
        missionXpGrantedRef,
        onBack,
        onStageClear,
        scoreRef,
        setCompleting,
        setGameState,
        setResultStats,
        setShowExitModal,
        shownWordsRef,
        stageClearArgsRef,
        stageClearDeliveredRef,
        totalAnsweredRef,
    });

    const generateQuiz = useSentenceQuizGenerator({
        activeHanjaSet,
        endQuiz,
        lastSimpleHanjaIdRef,
        lastWordIdRef,
        onWordSeen,
        pickNextFromPool,
        reviewQueueRef,
        seenWordIds,
        sessionPlan,
        setCurrentQuiz,
        setGameState,
        setLastHanjaId,
        setOptions,
        setQuestionKey,
        shownSimpleHanjaRef,
        shownWordsRef,
    });

    const startQuiz = useSentenceQuizStart({
        activeHanjaSet,
        buildMainQueue,
        clearCountRef,
        completingRef,
        contentPool,
        currentDayHanjaIds,
        initQueues,
        lastSimpleHanjaIdRef,
        lastWordIdRef,
        masteryData,
        onGetNextWordIds,
        onStageClear,
        quizCount,
        scoreRef,
        seenHanjaIds,
        sessionPlan,
        setCombo,
        setCompleting,
        setCurrentAnswered,
        setCurrentQuiz,
        setGameState,
        setPlannedQuizTotal,
        setResultStats,
        setScore,
        setStarted,
        setTotalAnswered,
        shownSimpleHanjaRef,
        shownWordsRef,
        srsData,
        stageClearArgsRef,
        stageClearDeliveredRef,
        totalAnsweredRef,
    });

    useSentenceQuizAutoStart({
        contentPool,
        gameState,
        startQuiz,
    });

    useSentenceQuizQuestionDriver({
        currentQuiz,
        gameState,
        generateQuiz,
        started,
    });

    const {
        handleCorrect,
        handleNext,
        handleWrong,
    } = useSentenceQuizAnswerHandlers({
        currentQuiz,
        endQuiz,
        generateQuiz,
        normalQueueRef,
        onHanjaAcquired,
        onMarkCorrect,
        onMarkWordWrong,
        onMarkWrong,
        onWordCorrect,
        plannedQuizTotal,
        reviewQueueRef,
        scoreRef,
        setCombo,
        setCurrentAnswered,
        setScore,
        setTotalAnswered,
        totalAnsweredRef,
    });

    const speakText = currentQuiz?.type === 'sentence' ? (currentQuiz?.target?.reading || '') : (currentQuiz?.sound || '');
    const currentAnswer = currentQuiz?.type === 'sentence' ? currentQuiz?.target?.reading : currentQuiz?.answer;
    const isLastQuestion = totalAnswered >= plannedQuizTotal ||
        (reviewQueueRef.current.length === 0 && normalQueueRef.current.length === 0);
    const displayQuestionNumber = Math.max(1, Math.min(
        totalAnswered + (currentAnswered ? 0 : 1),
        plannedQuizTotal
    ));
    const resultCorrect = resultStats?.correct ?? score;
    const resultReward = getRewardPreview?.((resultCorrect * 10) + clearXp);

    return {
        categories,
        characterAvatar,
        combo,
        completing,
        currentAnswer,
        currentAnswered,
        currentQuiz,
        displayQuestionNumber,
        gameState,
        isLastQuestion,
        missionXpGranted: missionXpGrantedRef.current,
        options,
        plannedQuizTotal,
        questionKey,
        resultClearMsg,
        resultReward,
        resultStats,
        score,
        selectedCategory,
        selectedGrade,
        showExitModal,
        speakText,
        started,
        totalAnswered,
        unlockedGrades,
        unlockedIds,
        viewMode,
        deliverStageClear,
        handleCorrect,
        handleExitConfirm,
        handleNext,
        handleResultBack,
        handleWrong,
        setCurrentAnswered,
        setSelectedCategory,
        setSelectedGrade,
        setShowExitModal,
        setViewMode,
        startQuiz,
    };
};
