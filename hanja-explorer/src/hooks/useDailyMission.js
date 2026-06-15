import { useState, useEffect, useCallback } from 'react';
import { getTodayStr, getYesterdayStr } from '../utils/sessionUtils.js';
import { SK } from '../constants/storageKeys.js';

const getCurrentCurriculumDay = () => {
    try {
        const saved = JSON.parse(localStorage.getItem('curriculum_progress') || '{}');
        return String((saved.completedDay || 0) + 1);
    } catch { return '1'; }
};

// ─────────────────────────────────────────────────────────────
// 미션 정의
// ─────────────────────────────────────────────────────────────
const MISSION_POOL = [
    { id: 'flashcard_1',  type: 'flashcard',    target: 1, label: '한자 학습지 1개 완료',      xp: 50 },
    { id: 'wordquiz_1',   type: 'wordQuiz',     target: 1, label: '단어 퀴즈 1세트 완료',      xp: 30 },
    { id: 'quiz_1',       type: 'sentenceQuiz', target: 1, label: '문장 퀴즈 1세트 완료',      xp: 30 },
    { id: 'idiom_1',      type: 'idiomQuiz',    target: 1, label: '한자성어 퀴즈 1세트 완료',  xp: 25 },
    { id: 'shootgame_1',  type: 'shootGame',    target: 1, label: '몬스터 슈팅 1웨이브 완료',  xp: 20 },
    { id: 'match_1',      type: 'matchGame',    target: 1, label: '메모리 게임 1판 완료',      xp: 20 },
    { id: 'writing_1',    type: 'writing',      target: 1, label: '획순 테스트 1개 완료',      xp: 30 },
];

const pickFreshMissions = () => MISSION_POOL.map(m => ({ ...m, progress: 0, done: false }));
const validMissionIds = MISSION_POOL.map(m => m.id);

const hydrateMissions = (raw) => {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    
    const savedMap = new Map(parsed.map(m => [m.id, m]));
    
    const hydrated = MISSION_POOL.map(pool => {
        const saved = savedMap.get(pool.id);
        if (saved) {
            return { ...pool, ...saved, xp: pool.xp, target: pool.target, label: pool.label };
        } else {
            return { ...pool, progress: 0, done: false };
        }
    });
    
    return hydrated.length > 0 ? hydrated : null;
};

const loadStageMissions = (stageMissionKey) => {
    try {
        const saved = localStorage.getItem(stageMissionKey);
        if (saved) return hydrateMissions(saved) || pickFreshMissions();
    } catch (e) {}
    return pickFreshMissions();
};

// ─────────────────────────────────────────────────────────────
// 훅
// ─────────────────────────────────────────────────────────────
export const useDailyMission = (sessionDoneToday, activeStage) => {
    const today = getTodayStr();

    // 일일 퀘스트는 전체 합산이 아니라 커리큘럼 단계별로 독립 저장한다.
    const currentStage = String(activeStage || getCurrentCurriculumDay());
    const stageMissionKey = `stage_missions_${currentStage}`;

    // 단계별 미션 초기화 (동기화)
    const [currentStageKey, setCurrentStageKey] = useState(stageMissionKey);
    const [missions, setMissions] = useState(() => loadStageMissions(stageMissionKey));

    if (stageMissionKey !== currentStageKey) {
        setCurrentStageKey(stageMissionKey);
        setMissions(loadStageMissions(stageMissionKey));
    }

    // 스트릭 초기화 (이건 하루 단위 유지)
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

    // (Derived state 패턴을 사용하여 즉시 업데이트 하므로 useEffect 제거됨)

    // 미션 변경 시 localStorage 및 history 에 저장
    useEffect(() => {
        if (currentStageKey !== stageMissionKey) return; // 싱크 되기 전에 잘못된 데이터 덮어쓰기 방지

        try {
            localStorage.setItem(stageMissionKey, JSON.stringify(missions));
            
            // 기존 UI의 history 호환성을 위해 유지
            const history = JSON.parse(localStorage.getItem(SK.MISSION_HISTORY) || '{}');
            history[currentStage] = missions.filter(m => m.done).map(m => m.id);
            localStorage.setItem(SK.MISSION_HISTORY, JSON.stringify(history));
        } catch (e) {}
    }, [missions, currentStage, stageMissionKey, currentStageKey]);

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
        let bonusXpToGrant = 0;
        setMissions(prev => {
            let bonusXp = 0;
            const next = prev.map(m => {
                if (m.done || m.type !== type) return m;
                const newProgress = Math.min(m.target, (m.progress || 0) + amount);
                const done = newProgress >= m.target;
                if (done && !m.done) bonusXp += m.xp;
                return { ...m, progress: newProgress, done };
            });
            const wasAllDone = prev.every(m => m.done);
            if (!wasAllDone && next.every(m => m.done)) bonusXp += 200;
            bonusXpToGrant = bonusXp;
            return next;
        });
        if (bonusXpToGrant > 0 && onBonusXp) setTimeout(() => onBonusXp(bonusXpToGrant), 0);
    }, []);

    const allDone  = missions.every(m => m.done);
    const doneCount = missions.filter(m => m.done).length;

    return { missions, streak, allDone, doneCount, updateMissionProgress };
};
