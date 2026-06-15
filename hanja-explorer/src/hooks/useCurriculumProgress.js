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
        };
    });

    const currentDay = Math.min(progress.completedDay + (sessionDoneToday ? 0 : 1), DAILY_CURRICULUM.length);

    const clearedHanjaIds = useMemo(
        () => getClearedHanjaIds(progress.completedDay),
        [progress.completedDay]
    );

    const advanceDay = useCallback(() => {
        setProgress(prev => {
            const nextCompleted = Math.min(prev.completedDay + 1, DAILY_CURRICULUM.length);
            const updated = { completedDay: nextCompleted, passedGateDays: [...prev.passedGateDays] };
            persist(updated);
            return { ...prev, completedDay: nextCompleted };
        });
    }, []);

    // 복습 게이트 / 보스전 통과 기록
    const passGate = useCallback((dayNumber) => {
        setProgress(prev => {
            const newSet = new Set(prev.passedGateDays);
            newSet.add(dayNumber);
            const updated = { completedDay: prev.completedDay, passedGateDays: [...newSet] };
            persist(updated);
            return { ...prev, passedGateDays: newSet };
        });
    }, []);

    const hasPassedGate = useCallback(
        (dayNumber) => progress.passedGateDays.has(dayNumber),
        [progress.passedGateDays]
    );

    const currentDayData = DAILY_CURRICULUM[currentDay - 1] || DAILY_CURRICULUM[0];

    return {
        currentDay,
        completedDay: progress.completedDay,
        clearedHanjaIds,
        currentDayData,
        advanceDay,
        passGate,
        hasPassedGate,
    };
};
