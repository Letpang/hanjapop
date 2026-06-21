import { useState, useCallback, useMemo } from 'react';
import { getClearedHanjaIds } from '../utils/curriculumUtils.js';
import DAILY_CURRICULUM from '../data/dailyCurriculum.js';

const KEY = 'curriculum_progress';

const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
};
const persist = (data) => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
};

const normalizeCompletionHistory = (saved) => {
    if (Array.isArray(saved.completionHistory)) return saved.completionHistory;
    if (!saved.finalJourney) return [];
    return [{ ...saved.finalJourney, journeyRound: 1 }];
};

/**
 * 커리큘럼 진행도 훅
 *
 * completedDay: 유저가 완료한 마지막 day 번호 (0 = 아직 시작 안 함)
 * currentDay:   지금 학습 중인 day 번호 (completedDay + 1, 최대 124)
 * clearedHanjaIds: completedDay까지의 한자 ID 목록 (자유 게임 필터용)
 * advanceDay(): 현재 day 완료 → completedDay 증가
 * isBlocked(day): 해당 day가 게이트/보스이고 아직 통과 못 한 상태인지
 */
export const useCurriculumProgress = (sessionDoneToday = false) => {
    const [progress, setProgress] = useState(() => {
        const saved = load();
        return {
            completedDay: saved.completedDay || 0,
            passedGateDays: new Set(saved.passedGateDays || []),
            finalJourney: saved.finalJourney || null,
            journeyRound: Math.max(1, Number(saved.journeyRound) || 1),
            completionHistory: normalizeCompletionHistory(saved),
        };
    });

    const currentDay = Math.min(progress.completedDay + (sessionDoneToday ? 0 : 1), DAILY_CURRICULUM.length);

    const archivedCompletedDay = progress.finalJourney
        ? DAILY_CURRICULUM.length
        : progress.completedDay;
    const clearedHanjaIds = useMemo(
        () => getClearedHanjaIds(archivedCompletedDay),
        [archivedCompletedDay]
    );

    const advanceDay = useCallback(() => {
        setProgress(prev => {
            const nextCompleted = Math.min(prev.completedDay + 1, DAILY_CURRICULUM.length);
            const updated = { ...prev, completedDay: nextCompleted, passedGateDays: [...prev.passedGateDays] };
            persist(updated);
            return { ...prev, completedDay: nextCompleted };
        });
    }, []);

    // 복습 게이트 / 보스전 통과 기록
    const passGate = useCallback((dayNumber) => {
        setProgress(prev => {
            const newSet = new Set(prev.passedGateDays);
            newSet.add(dayNumber);
            const updated = { ...prev, passedGateDays: [...newSet] };
            persist(updated);
            return { ...prev, passedGateDays: newSet };
        });
    }, []);

    const hasPassedGate = useCallback(
        (dayNumber) => progress.passedGateDays.has(dayNumber),
        [progress.passedGateDays]
    );

    const claimFinalJourney = useCallback((record) => {
        setProgress(prev => {
            const completion = {
                completedAt: record?.completedAt || new Date().toISOString(),
                title: '한자팝 마스터',
                badge: '황금 124 완주 배지',
                rewardXp: prev.finalJourney ? 0 : 1240,
                stages: DAILY_CURRICULUM.length,
                hanjaCount: record?.hanjaCount || 369,
                journeyRound: prev.journeyRound,
            };
            const alreadyRecorded = prev.completionHistory.some(item => item.journeyRound === prev.journeyRound);
            const completionHistory = alreadyRecorded
                ? prev.completionHistory
                : [...prev.completionHistory, completion];
            const finalJourney = prev.finalJourney || completion;
            const updated = {
                ...prev,
                completedDay: Math.max(prev.completedDay, DAILY_CURRICULUM.length),
                passedGateDays: [...prev.passedGateDays],
                finalJourney,
                completionHistory,
            };
            persist(updated);
            return { ...updated, passedGateDays: prev.passedGateDays };
        });
    }, []);

    // 학습/오답/XP는 건드리지 않고 현재 탐험 지도만 다음 회차 1단계로 되돌린다.
    const startNewJourney = useCallback(() => {
        setProgress(prev => {
            if (prev.completedDay < DAILY_CURRICULUM.length) return prev;
            const updated = {
                ...prev,
                journeyRound: prev.journeyRound + 1,
                completedDay: 0,
                passedGateDays: [],
            };
            persist(updated);
            return { ...updated, passedGateDays: new Set() };
        });
    }, []);

    const currentDayData = DAILY_CURRICULUM[currentDay - 1] || DAILY_CURRICULUM[0];

    return {
        currentDay,
        completedDay: progress.completedDay,
        archivedCompletedDay,
        clearedHanjaIds,
        currentDayData,
        finalJourney: progress.finalJourney,
        journeyRound: progress.journeyRound,
        completionHistory: progress.completionHistory,
        isJourneyComplete: progress.completedDay >= DAILY_CURRICULUM.length,
        advanceDay,
        claimFinalJourney,
        startNewJourney,
        passGate,
        hasPassedGate,
    };
};
