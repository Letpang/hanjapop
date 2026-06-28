import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DAILY_CURRICULUM from '../../../data/dailyCurriculum.js';
import HANJA_DATA from '../../../hanja_unified.json';
import { buildUnifiedPool } from '../../../utils/learningPool.js';

export const FINAL_HANJA_COUNT = new Set(
    DAILY_CURRICULUM.flatMap(day => (day.hanja || []).map(item => item.id).filter(Boolean))
).size;

export const getTodayDayNumber = () => {
    try {
        const saved = JSON.parse(localStorage.getItem('curriculum_progress') || '{}');
        const completed = saved.completedDay || 0;
        return Math.min(completed + 1, DAILY_CURRICULUM.length);
    } catch {
        return 1;
    }
};

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const useDailySessionContent = ({ dayNumber, journeyRound, srsData, masteryData, wordData }) => {
    const dayData = DAILY_CURRICULUM[dayNumber - 1] || DAILY_CURRICULUM[0];
    const rawTodayHanja = useMemo(() => (dayData.hanja || []).filter(h => h.id !== null), [dayData]);

    const pastHanjaIds = useMemo(() => {
        const result = [];
        const endDay = journeyRound > 1 ? DAILY_CURRICULUM.length : dayNumber - 1;
        for (let d = 0; d < endDay && d < DAILY_CURRICULUM.length; d++) {
            (DAILY_CURRICULUM[d].hanja || []).forEach(h => { if (h.id) result.push(h.id); });
        }
        const todayIds = new Set(rawTodayHanja.map(item => item.id).filter(Boolean));
        return [...new Set(result)].filter(id => !todayIds.has(id));
    }, [dayNumber, journeyRound, rawTodayHanja]);

    const fallbackReviewIds = useMemo(() => [...new Set(pastHanjaIds)].slice(-3), [pastHanjaIds]);

    const todayHanja = useMemo(() => {
        if (rawTodayHanja.length > 0) return rawTodayHanja;
        return fallbackReviewIds
            .map(id => HANJA_DATA.find(h => h.id === id))
            .filter(Boolean)
            .map(({ id, hanja, sound, meaning }) => ({ id, hanja, sound, meaning }));
    }, [rawTodayHanja, fallbackReviewIds]);

    const todayFullHanja = useMemo(() => {
        return todayHanja.map(h => HANJA_DATA.find(d => d.id === h.id)).filter(Boolean);
    }, [todayHanja]);

    const srsDataRef = useRef(srsData);
    const masteryDataRef = useRef(masteryData);
    const wordDataRef = useRef(wordData);
    useEffect(() => { srsDataRef.current = srsData; }, [srsData]);
    useEffect(() => { masteryDataRef.current = masteryData; }, [masteryData]);
    useEffect(() => { wordDataRef.current = wordData; }, [wordData]);

    const todayHanjaIds = useMemo(() => todayHanja.map(h => h.id).filter(Boolean), [todayHanja]);
    const [contentPool, setContentPool] = useState(() =>
        buildUnifiedPool(todayHanjaIds, HANJA_DATA, srsData, masteryData, pastHanjaIds, 0.3, wordData)
    );
    const contentPoolKey = useMemo(() => {
        return `${dayNumber}:${todayHanjaIds.join(',')}:${pastHanjaIds.join(',')}`;
    }, [dayNumber, todayHanjaIds, pastHanjaIds]);

    useEffect(() => {
        setContentPool(buildUnifiedPool(todayHanjaIds, HANJA_DATA, srsDataRef.current, masteryDataRef.current, pastHanjaIds, 0.3, wordDataRef.current));
        // srs/mastery/wordData 변경은 문제 풀이 중 큐를 리셋하지 않기 위해 의도적으로 제외한다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contentPoolKey]);

    const sessionQueueRef = useRef({ wordIds: [], wordIdx: 0 });
    useEffect(() => {
        if (!contentPool) {
            sessionQueueRef.current = { wordIds: [], wordIdx: 0 };
            return;
        }
        sessionQueueRef.current = {
            wordIds: shuffle([...(contentPool.main?.wordIds || []), ...(contentPool.review?.wordIds || [])]),
            wordIdx: 0,
        };
    }, [contentPool]);

    const getNextWordIds = useCallback((n) => {
        const q = sessionQueueRef.current;
        if (!q.wordIds.length) return [];
        let { wordIds, wordIdx } = q;
        if (wordIds.length - wordIdx < n) {
            wordIds = shuffle(wordIds);
            wordIdx = 0;
        }
        const result = [];
        while (result.length < n) {
            if (wordIdx >= wordIds.length) {
                wordIds = shuffle(wordIds);
                wordIdx = 0;
            }
            result.push(wordIds[wordIdx++]);
        }
        sessionQueueRef.current = { ...q, wordIds, wordIdx };
        return result;
    }, []);

    return {
        dayData,
        todayHanja,
        todayFullHanja,
        contentPool,
        getNextWordIds,
    };
};

export default useDailySessionContent;
