import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HANJA_DATA from '../../hanja_unified.json';
import DAILY_CURRICULUM from '../../data/dailyCurriculum.js';
import { buildUnifiedPool } from '../../utils/learningPool.js';

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

export function useSessionContent({
    currentDayData,
    completedDay,
    currentDay,
    clearedHanjaIds,
    selectedPastStage,
    selectedGrade,
    hanjaData,
    wordData,
}) {
    const currentDayHanjaIds = useMemo(
        () => (currentDayData?.hanja || []).map(h => h.id).filter(Boolean),
        [currentDayData]
    );

    const hanjaDataRef = useRef(hanjaData);
    useEffect(() => { hanjaDataRef.current = hanjaData; }, [hanjaData]);

    const wordDataRef = useRef(wordData);
    useEffect(() => { wordDataRef.current = wordData; }, [wordData]);

    const lastCompletedDayHanjaIds = useMemo(() => {
        if (!completedDay) return [];
        const dayData = DAILY_CURRICULUM[completedDay - 1];
        return (dayData?.hanja || []).map(h => h.id).filter(Boolean);
    }, [completedDay]);

    const pastHanjaIds = useMemo(
        () => clearedHanjaIds.filter(id => !lastCompletedDayHanjaIds.includes(id)),
        [clearedHanjaIds, lastCompletedDayHanjaIds]
    );

    const [sessionContentPool, setSessionContentPool] = useState(() =>
        buildUnifiedPool(lastCompletedDayHanjaIds, HANJA_DATA, hanjaData, hanjaData, pastHanjaIds, 0.3, wordData)
    );

    useEffect(() => {
        setSessionContentPool(
            buildUnifiedPool(
                lastCompletedDayHanjaIds,
                HANJA_DATA,
                hanjaDataRef.current,
                hanjaDataRef.current,
                pastHanjaIds,
                0.3,
                wordDataRef.current
            )
        );
    }, [lastCompletedDayHanjaIds, pastHanjaIds]);

    const pastStagePool = useMemo(() => {
        if (!selectedPastStage) return null;
        const dayData = DAILY_CURRICULUM[selectedPastStage - 1];
        if (!dayData) return null;
        const hanjaIds = (dayData.hanja || []).map(h => h.id).filter(Boolean);
        return buildUnifiedPool(hanjaIds, HANJA_DATA, hanjaDataRef.current, hanjaDataRef.current, [], 0, wordDataRef.current);
    }, [selectedPastStage]);

    const gradePool = useMemo(() => {
        if (!selectedGrade) return null;
        const norm = selectedGrade.replace('II', 'Ⅱ');
        const hanjaIds = HANJA_DATA.filter(h => h.grade && h.grade.replace('II', 'Ⅱ') === norm).map(h => h.id);
        return buildUnifiedPool(hanjaIds, HANJA_DATA, hanjaDataRef.current, hanjaDataRef.current, [], 0, wordDataRef.current);
    }, [selectedGrade]);

    const gradeWordCount = useMemo(() => {
        if (!selectedGrade) return null;
        const norm = selectedGrade.replace('II', 'Ⅱ');
        return HANJA_DATA
            .filter(h => h.grade && h.grade.replace('II', 'Ⅱ') === norm)
            .flatMap(h => (h.words || []).filter(w => w.type !== 'idiom'))
            .length || 10;
    }, [selectedGrade]);

    const gradeSentenceCount = useMemo(() => {
        if (!selectedGrade) return null;
        const norm = selectedGrade.replace('II', 'Ⅱ');
        return HANJA_DATA
            .filter(h => h.grade && h.grade.replace('II', 'Ⅱ') === norm)
            .flatMap(h => (h.words || []).filter(w =>
                w.type !== 'idiom' && typeof w.example === 'string' && w.example.trim().length > 0
            ))
            .length || 5;
    }, [selectedGrade]);

    const effectivePool = selectedPastStage ? pastStagePool : selectedGrade ? gradePool : sessionContentPool;
    const sessionQueueRef = useRef({ hanjaIds: [], wordIds: [], hanjaIdx: 0, wordIdx: 0 });

    useEffect(() => {
        if (!effectivePool) {
            sessionQueueRef.current = { hanjaIds: [], wordIds: [], hanjaIdx: 0, wordIdx: 0 };
            return;
        }

        sessionQueueRef.current = {
            hanjaIds: shuffle([...(effectivePool.main?.hanjaIds || []), ...(effectivePool.review?.hanjaIds || [])]),
            wordIds: shuffle([...(effectivePool.main?.wordIds || []), ...(effectivePool.review?.wordIds || [])]),
            hanjaIdx: 0,
            wordIdx: 0,
        };
    }, [effectivePool]);

    const getNextHanjaIds = useCallback((count) => {
        const queue = sessionQueueRef.current;
        if (!queue.hanjaIds.length) return [];

        let { hanjaIds, hanjaIdx } = queue;
        if (hanjaIds.length - hanjaIdx < count) {
            hanjaIds = shuffle(hanjaIds);
            hanjaIdx = 0;
        }

        const result = [];
        while (result.length < count) {
            if (hanjaIdx >= hanjaIds.length) {
                hanjaIds = shuffle(hanjaIds);
                hanjaIdx = 0;
            }
            result.push(hanjaIds[hanjaIdx++]);
        }

        sessionQueueRef.current = { ...queue, hanjaIds, hanjaIdx };
        return result;
    }, []);

    const getNextWordIds = useCallback((count) => {
        const queue = sessionQueueRef.current;
        if (!queue.wordIds.length) return [];

        let { wordIds, wordIdx } = queue;
        if (wordIds.length - wordIdx < count) {
            wordIds = shuffle(wordIds);
            wordIdx = 0;
        }

        const result = [];
        while (result.length < count) {
            if (wordIdx >= wordIds.length) {
                wordIds = shuffle(wordIds);
                wordIdx = 0;
            }
            result.push(wordIds[wordIdx++]);
        }

        sessionQueueRef.current = { ...queue, wordIds, wordIdx };
        return result;
    }, []);

    const activeStage = selectedPastStage || currentDay;

    return {
        activeStage,
        currentDayHanjaIds,
        effectivePool,
        getNextHanjaIds,
        getNextWordIds,
        gradeSentenceCount,
        gradeWordCount,
        pastHanjaIds,
        sessionContentPool,
    };
}
