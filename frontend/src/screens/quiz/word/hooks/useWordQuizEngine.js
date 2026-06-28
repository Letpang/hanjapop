import { useState, useMemo, useCallback, useRef } from 'react';
import { getRankDetails } from '../../../../utils/rankUtils.js';
import { useUnlockedHanja } from '../../../../hooks/useUnlockedHanja.js';
import { pickClearMessage } from '../../../../constants/messages.js';
import {
    CATEGORIES,
    buildWordQuizQuestions,
} from '../wordQuizUtils.js';
import { useWordQuizAnswerHandlers } from './useWordQuizAnswerHandlers.js';
import { useWordQuizAutoStart } from './useWordQuizAutoStart.js';

export const useWordQuizEngine = ({
    contentPool,
    dailyMapNode,
    missionDone,
    onBack,
    onGetNextWordIds,
    onHanjaAcquired,
    onMarkCorrect,
    onMarkWordWrong,
    onStageClear,
    onWordCorrect,
    onWordSeen,
    quizCount,
    seenWordIds,
    selectedCharacter,
    unlockedHanjaIds,
    userLevel,
    userXp,
    wordData,
}) => {
    const [viewMode, setViewMode] = useState('grade');
    const [gradeFilter, setGradeFilter] = useState('전체');
    const [categoryFilter, setCategoryFilter] = useState(CATEGORIES[0] || '');
    const [phase, setPhase] = useState(contentPool ? 'init' : 'select');
    const [showExitModal, setShowExitModal] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [combo, setCombo] = useState(0);
    const [completing, setCompleting] = useState(false);
    const [currentAnswered, setCurrentAnswered] = useState(false);
    const [resultClearMsg] = useState(() => pickClearMessage());

    const correctCountRef = useRef(0);
    const comboRef = useRef(0);
    const maxComboRef = useRef(0);
    const clearCountRef = useRef(0);
    const completingRef = useRef(false);
    const stageClearArgsRef = useRef(null);
    const stageClearDeliveredRef = useRef(false);
    const missionXpGrantedRef = useRef(0);

    const characterAvatar = useMemo(
        () => getRankDetails(userXp, selectedCharacter).avatar,
        [userXp, selectedCharacter]
    );
    const { unlockedIds, unlockedGrades } = useUnlockedHanja(unlockedHanjaIds);
    const q = questions[currentIdx];
    const isQuizActive = phase === 'quiz' || phase === 'result';

    const deliverStageClear = useCallback(() => {
        if (stageClearArgsRef.current && !stageClearDeliveredRef.current) {
            onStageClear?.(...stageClearArgsRef.current);
            stageClearDeliveredRef.current = true;
            stageClearArgsRef.current = null;
        }
    }, [onStageClear]);

    const handleExitConfirm = useCallback(() => {
        setShowExitModal(false);
        onBack();
    }, [onBack]);

    const startQuiz = useCallback((overrideFilter, overrideViewMode) => {
        deliverStageClear();
        const effectiveViewMode = overrideViewMode || viewMode;
        const effectiveCategory = overrideFilter != null && effectiveViewMode === 'topic' ? overrideFilter : categoryFilter;
        const effectiveGrade = overrideFilter != null && effectiveViewMode !== 'topic' ? overrideFilter : gradeFilter;
        setQuestions(buildWordQuizQuestions({
            categoryFilter: effectiveCategory,
            contentPool,
            gradeFilter: effectiveGrade,
            onGetNextWordIds,
            quizCount,
            seenWordIds,
            unlockedIds,
            userLevel,
            viewMode: effectiveViewMode,
            wordData,
        }));

        setCurrentIdx(0);
        setCurrentAnswered(false);
        setCorrectCount(0);
        correctCountRef.current = 0;
        comboRef.current = 0;
        setCombo(0);
        maxComboRef.current = 0;
        stageClearDeliveredRef.current = false;
        completingRef.current = false;
        setCompleting(false);
        setPhase('quiz');
    }, [
        categoryFilter,
        contentPool,
        deliverStageClear,
        gradeFilter,
        onGetNextWordIds,
        quizCount,
        seenWordIds,
        unlockedIds,
        userLevel,
        viewMode,
        wordData,
    ]);

    useWordQuizAutoStart({ contentPool, phase, startQuiz });

    const {
        handleCorrect,
        handleNext,
        handleWrong,
    } = useWordQuizAnswerHandlers({
        clearCountRef,
        comboRef,
        completingRef,
        correctCountRef,
        currentIdx,
        dailyMapNode,
        deliverStageClear,
        maxComboRef,
        missionDone,
        missionXpGrantedRef,
        onHanjaAcquired,
        onMarkCorrect,
        onMarkWordWrong,
        onWordCorrect,
        onWordSeen,
        questions,
        setCombo,
        setCompleting,
        setCorrectCount,
        setCurrentAnswered,
        setCurrentIdx,
        setPhase,
        stageClearArgsRef,
    });

    const handlePrev = useCallback(() => {
        if (currentIdx > 0) {
            setCurrentAnswered(false);
            setCurrentIdx(currentIdx - 1);
        }
    }, [currentIdx]);

    const handleResultBack = useCallback(() => {
        deliverStageClear();
        if (!dailyMapNode) onBack();
    }, [dailyMapNode, deliverStageClear, onBack]);

    return {
        categories: CATEGORIES,
        categoryFilter,
        characterAvatar,
        combo,
        completing,
        correctCount,
        currentAnswered,
        currentIdx,
        gradeFilter,
        handleCorrect,
        handleExitConfirm,
        handleNext,
        handlePrev,
        handleResultBack,
        isQuizActive,
        missionXp: missionXpGrantedRef.current,
        phase,
        q,
        questions,
        resultClearMsg,
        setCategoryFilter,
        setCurrentAnswered,
        setGradeFilter,
        setShowExitModal,
        setViewMode,
        showExitModal,
        startQuiz,
        unlockedGrades,
        unlockedIds,
        viewMode,
        handleWrong,
    };
};
