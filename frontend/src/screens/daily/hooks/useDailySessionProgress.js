import { useCallback, useEffect, useRef, useState } from 'react';
import { SK } from '../../../constants/storageKeys.js';
import { CLEAR_MESSAGES } from '../../../constants/messages.js';
import { getTodayStr } from '../../../utils/sessionUtils.js';

const MAP_PROGRESS_KEY = 'daily_map_progress';

export const hasPassedQuizMission = (correct, total) => Number(total) > 0 && Number(correct) / Number(total) >= 0.7;

const markSessionDone = () => {
    try {
        localStorage.setItem(SK.DAILY_SESSION, JSON.stringify({
            date: getTodayStr(),
            done: true,
        }));
    } catch {
        return;
    }
};

const clearMapProgress = () => {
    try {
        localStorage.removeItem(MAP_PROGRESS_KEY);
    } catch {
        return;
    }
};

const mergeIds = (prev, ids) => {
    const next = new Set(prev);
    ids.forEach(id => { if (id != null) next.add(id); });
    return prev.length === next.size ? prev : [...next];
};

const useDailySessionProgress = ({ previewFinalJourney, updateMissionProgress, onMapIdle }) => {
    const continuedNextRef = useRef(false);
    const [step, setStep] = useState(previewFinalJourney ? 'results' : 'intro');
    const [resultMsg] = useState(() => CLEAR_MESSAGES[Math.floor(Math.random() * CLEAR_MESSAGES.length)]);
    const [resumeStep, setResumeStep] = useState('flashcard');
    const [chosenGame, setChosenGame] = useState(null);
    const [chosenQuiz, setChosenQuiz] = useState(null);
    const [seenHanjaIds, setSeenHanjaIds] = useState([]);
    const [seenWordIds, setSeenWordIds] = useState([]);
    const sessionDoneTypesRef = useRef(new Set());
    const [sessionDoneCount, setSessionDoneCount] = useState(0);

    useEffect(() => {
        if (step === 'dice' && onMapIdle) {
            onMapIdle();
        }
    }, [step, onMapIdle]);

    const markHanjaSeen = useCallback((ids) => {
        if (!ids?.length) return;
        setSeenHanjaIds(prev => mergeIds(prev, ids));
    }, []);

    const markWordSeen = useCallback((ids) => {
        if (!ids?.length) return;
        setSeenWordIds(prev => mergeIds(prev, ids));
    }, []);

    const trackMission = useCallback((type, amount, onBonusXp) => {
        if (!sessionDoneTypesRef.current.has(type)) {
            sessionDoneTypesRef.current.add(type);
            setSessionDoneCount(sessionDoneTypesRef.current.size);
        }
        if (updateMissionProgress) updateMissionProgress(type, amount, onBonusXp);
    }, [updateMissionProgress]);

    const finishSession = useCallback(() => {
        clearMapProgress();
        markSessionDone();
        import('../../main/MainMenuRenewal.jsx').catch(() => {});
        setStep('results');
    }, []);

    const resetForNextDay = useCallback(() => {
        continuedNextRef.current = true;
        setSeenHanjaIds([]);
        setSeenWordIds([]);
        sessionDoneTypesRef.current = new Set();
        setSessionDoneCount(0);
        setResumeStep('flashcard');
        setStep('intro');
    }, []);

    return {
        continuedNextRef,
        step,
        setStep,
        resultMsg,
        resumeStep,
        setResumeStep,
        chosenGame,
        setChosenGame,
        chosenQuiz,
        setChosenQuiz,
        seenHanjaIds,
        seenWordIds,
        sessionDoneTypesRef,
        sessionDoneCount,
        markHanjaSeen,
        markWordSeen,
        trackMission,
        finishSession,
        resetForNextDay,
    };
};

export default useDailySessionProgress;
