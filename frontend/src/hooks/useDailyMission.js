/**
 * useDailyMission.js
 * 오늘의 미션 + 스트릭 (localStorage 기반)
 *
 * localStorage 키:
 *   - daily_missions_date: "YYYY-MM-DD" (오늘 날짜)
 *   - daily_missions: JSON (오늘 미션 목록 + 완료 여부)
 *   - streak_data: JSON { lastDate, count }
 *   - mission_history: JSON { "YYYY-MM-DD": ["missionId", ...] }
 */

const HISTORY_KEY = 'mission_history';

import { useState, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────
// 미션 정의
// ─────────────────────────────────────────────────────────────
const MISSION_POOL = [
    { id: 'leveltest_1',  type: 'levelTest',    target: 1, label: '레벨 테스트 1회 완료',     xp: 30 },
    { id: 'flashcard_1',  type: 'flashcard',    target: 1, label: '학습지 1개 완료',          xp: 30 },
    { id: 'wordquiz_1',   type: 'wordQuiz',     target: 1, label: '단어 퀴즈 1세트 완료',     xp: 30 },
    { id: 'quiz_1',       type: 'sentenceQuiz', target: 1, label: '문장 퀴즈 1세트 완료',     xp: 50 },
    { id: 'shootgame_1',  type: 'shootGame',    target: 1, label: '몬스터 슈팅 1웨이브 완료', xp: 30 },
    { id: 'match_1',      type: 'matchGame',    target: 1, label: '메모리 게임 1판 완료',     xp: 40 },
    { id: 'writing_1',    type: 'writing',      target: 1, label: '획순 테스트 1개 완료',     xp: 20 },
];

// 날짜 문자열 "YYYY-MM-DD"
const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// 오늘 미션 5개 선택 (전체)
const pickTodayMissions = () => {
    return MISSION_POOL.map(m => ({ ...m, progress: 0, done: false }));
};

// ─────────────────────────────────────────────────────────────
// 훅
// ─────────────────────────────────────────────────────────────
export const useDailyMission = () => {
    const today = getTodayStr();

    // 미션 초기화
    const [missions, setMissions] = useState(() => {
        try {
            const savedDate = localStorage.getItem('daily_missions_date');
            if (savedDate === today) {
                const saved = localStorage.getItem('daily_missions');
                if (saved) return JSON.parse(saved);
            }
        } catch (e) {}
        return pickTodayMissions();
    });

    // 스트릭 초기화
    const [streak, setStreak] = useState(() => {
        try {
            const saved = localStorage.getItem('streak_data');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return { lastDate: null, count: 0 };
    });

    // 날짜 바뀌면 미션 리셋
    useEffect(() => {
        const savedDate = localStorage.getItem('daily_missions_date');
        if (savedDate !== today) {
            const newMissions = pickTodayMissions();
            setMissions(newMissions);
            localStorage.setItem('daily_missions_date', today);
            localStorage.setItem('daily_missions', JSON.stringify(newMissions));
        }
    }, [today]);

    // 미션 저장 + 이력 기록
    useEffect(() => {
        try {
            localStorage.setItem('daily_missions_date', today);
            localStorage.setItem('daily_missions', JSON.stringify(missions));
            // 날짜별 완료 미션 이력 저장
            const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
            history[today] = missions.filter(m => m.done).map(m => m.id);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (e) {}
    }, [missions, today]);

    // 스트릭 저장
    useEffect(() => {
        try {
            localStorage.setItem('streak_data', JSON.stringify(streak));
        } catch (e) {}
    }, [streak]);

    // 모든 미션 완료 시 스트릭 업데이트
    useEffect(() => {
        const allDone = missions.length > 0 && missions.every(m => m.done);
        if (!allDone) return;

        setStreak(prev => {
            if (prev.lastDate === today) return prev; // 이미 오늘 업데이트됨
            const yesterday = (() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            })();
            const newCount = prev.lastDate === yesterday ? prev.count + 1 : 1;
            return { lastDate: today, count: newCount };
        });
    }, [missions, today]);

    /**
     * 미션 진행도 업데이트
     * @param {string} type - 미션 타입 (e.g. 'flashcard', 'matchGame', 'shootGame')
     * @param {number} amount - 증가량 (기본 1)
     * @param {function} onBonusXp - 보너스 XP 발생 시 호출되는 콜백 (xp: number) => void
     *
     * 주의: setState는 비동기라 return으로 XP를 전달할 수 없음.
     * 대신 onBonusXp 콜백으로 완료된 미션의 XP를 전달한다.
     */
    const updateMissionProgress = useCallback((type, amount = 1, onBonusXp) => {
        setMissions(prev => {
            let bonusXp = 0;
            const next = prev.map(m => {
                if (m.done || m.type !== type) return m;
                const newProgress = m.progress + amount;
                const done = newProgress >= m.target;
                if (done && !m.done) bonusXp += m.xp;
                return { ...m, progress: newProgress, done };
            });
            // setState 내부에서 콜백 호출 (동기적으로 XP 전달)
            if (bonusXp > 0 && onBonusXp) {
                // setTimeout 0으로 렌더 사이클 밖에서 호출
                setTimeout(() => onBonusXp(bonusXp), 0);
            }
            return next;
        });
    }, []);

    const allDone = missions.every(m => m.done);
    const doneCount = missions.filter(m => m.done).length;

    return {
        missions,
        streak,
        allDone,
        doneCount,
        updateMissionProgress,
    };
};
