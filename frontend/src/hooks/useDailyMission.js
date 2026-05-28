const HISTORY_KEY = 'mission_history';
const STAGE_KEY   = 'daily_missions_stage';
const MISSION_KEY = 'daily_missions';

import { useState, useEffect, useCallback } from 'react';
import { getTodayStr, getYesterdayStr } from '../utils/sessionUtils.js';

const getCompletedDay = () => {
    try {
        const saved = JSON.parse(localStorage.getItem('curriculum_progress') || '{}');
        return String(saved.completedDay || 0);
    } catch { return '0'; }
};

// ─────────────────────────────────────────────────────────────
// 미션 정의
// ─────────────────────────────────────────────────────────────
const MISSION_POOL = [
    { id: 'flashcard_1',  type: 'flashcard',    target: 1, label: '학습지 1개 완료',          xp: 50 },
    { id: 'wordquiz_1',   type: 'wordQuiz',     target: 1, label: '단어 퀴즈 1세트 완료',     xp: 30 },
    { id: 'quiz_1',       type: 'sentenceQuiz', target: 1, label: '문장 퀴즈 1세트 완료',     xp: 30 },
    { id: 'shootgame_1',  type: 'shootGame',    target: 1, label: '몬스터 슈팅 1웨이브 완료', xp: 20 },
    { id: 'match_1',      type: 'matchGame',    target: 1, label: '메모리 게임 1판 완료',     xp: 20 },
    { id: 'writing_1',    type: 'writing',      target: 1, label: '획순 테스트 1개 완료',     xp: 30 },
];

const pickFreshMissions = () => MISSION_POOL.map(m => ({ ...m, progress: 0, done: false }));

// ─────────────────────────────────────────────────────────────
// 훅
// ─────────────────────────────────────────────────────────────
export const useDailyMission = (sessionDoneToday) => {
    const today = getTodayStr();

const MISSION_DATE_KEY = 'daily_missions_date';

    // 미션 초기화 — 완료한 단계 번호와 날짜 기준으로 리셋
    const [missions, setMissions] = useState(() => {
        try {
            const stageKey = getCompletedDay();
            const savedStage = localStorage.getItem(STAGE_KEY);
            const savedDate = localStorage.getItem(MISSION_DATE_KEY);
            
            if (savedStage === stageKey && savedDate === today) {
                const saved = localStorage.getItem(MISSION_KEY);
                if (saved) {
                    const validIds = MISSION_POOL.map(m => m.id);
                    const filtered = JSON.parse(saved)
                        .filter(m => validIds.includes(m.id))
                        .map(m => { const pool = MISSION_POOL.find(p => p.id === m.id); return pool ? { ...m, xp: pool.xp } : m; });
                    if (filtered.length > 0) return filtered;
                }
            }
        } catch (e) {}
        return pickFreshMissions();
    });

    // 스트릭 초기화
    const [streak, setStreak] = useState(() => {
        try {
            const saved = localStorage.getItem('streak_data');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed?.lastDate) {
                    const yesterdayStr = getYesterdayStr();
                    if (parsed.lastDate !== getTodayStr() && parsed.lastDate !== yesterdayStr) {
                        return { lastDate: null, count: 0 };
                    }
                }
                return parsed;
            }
        } catch (e) {}
        return { lastDate: null, count: 0 };
    });

    // 날짜나 단계가 바뀌면 미션 리셋 — 단, 오늘 세션을 완료한 경우엔 단계 변경으로 인한 리셋은 하지 않음
    useEffect(() => {
        const stageKey = getCompletedDay();
        const savedStage = localStorage.getItem(STAGE_KEY);
        const savedDate = localStorage.getItem(MISSION_DATE_KEY);
        
        const isNewDay = savedDate !== today;
        const isNewStage = savedStage !== stageKey;

        if (isNewDay || (isNewStage && !sessionDoneToday)) {
            const newMissions = pickFreshMissions();
            localStorage.setItem(MISSION_DATE_KEY, today);
            localStorage.setItem(STAGE_KEY, stageKey);
            localStorage.setItem(MISSION_KEY, JSON.stringify(newMissions));
            const timer = setTimeout(() => setMissions(newMissions), 0);
            return () => clearTimeout(timer);
        } else if (savedStage !== stageKey) {
            localStorage.setItem(STAGE_KEY, stageKey);
        }
        return undefined;
    }, [today, sessionDoneToday]);

    // 미션 저장 + 이력 기록
    useEffect(() => {
        try {
            const stageKey = getCompletedDay();
            localStorage.setItem(MISSION_DATE_KEY, today);
            localStorage.setItem(STAGE_KEY,   stageKey);
            localStorage.setItem(MISSION_KEY, JSON.stringify(missions));
            const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
            history[stageKey] = missions.filter(m => m.done).map(m => m.id);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (e) {}
    }, [missions, today]);

    // 스트릭 저장
    useEffect(() => {
        try { localStorage.setItem('streak_data', JSON.stringify(streak)); } catch (e) {}
    }, [streak]);

    // 세션 완료 시 스트릭 업데이트
    useEffect(() => {
        if (!sessionDoneToday) return undefined;

        const timer = setTimeout(() => setStreak(prev => {
            if (prev.lastDate === today) return prev;
            const yesterday = getYesterdayStr();
            const newCount = prev.lastDate === yesterday ? prev.count + 1 : 1;
            return { lastDate: today, count: newCount };
        }), 0);

        return () => clearTimeout(timer);
    }, [sessionDoneToday, today]);

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
            const wasAllDone = prev.every(m => m.done);
            if (!wasAllDone && next.every(m => m.done)) bonusXp += 200;
            if (bonusXp > 0 && onBonusXp) setTimeout(() => onBonusXp(bonusXp), 0);
            return next;
        });
    }, []);

    const allDone  = missions.every(m => m.done);
    const doneCount = missions.filter(m => m.done).length;

    return { missions, streak, allDone, doneCount, updateMissionProgress };
};
