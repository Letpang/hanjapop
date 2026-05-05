/**
 * useDailyMission.js
 * 오늘의 미션 + 스트릭 (localStorage 기반)
 *
 * localStorage 키:
 *   - daily_missions_date: "YYYY-MM-DD" (오늘 날짜)
 *   - daily_missions: JSON (오늘 미션 목록 + 완료 여부)
 *   - streak_data: JSON { lastDate, count }
 */

import { useState, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────
// 미션 정의
// ─────────────────────────────────────────────────────────────
const MISSION_POOL = [
    // 쉬운 미션 (easy)
    { id: 'flashcard_5',   type: 'flashcard',    target: 5,  label: '한자 카드 5장 보기',         xp: 20, difficulty: 'easy' },
    { id: 'flashcard_10',  type: 'flashcard',    target: 10, label: '한자 카드 10장 보기',        xp: 30, difficulty: 'easy' },
    { id: 'match_1',       type: 'matchGame',    target: 1,  label: '짝맞추기 1판 완료',          xp: 25, difficulty: 'easy' },
    { id: 'shoot_5',       type: 'shootGame',    target: 5,  label: '몬스터 5마리 처치',          xp: 20, difficulty: 'easy' },
    { id: 'quiz_3',        type: 'sentenceQuiz', target: 3,  label: '문장 퀴즈 3문제 맞추기',     xp: 20, difficulty: 'easy' },
    { id: 'writing_3',     type: 'writing',      target: 3,  label: '한자 쓰기 3개 완료',         xp: 20, difficulty: 'easy' },
    { id: 'wordquiz_5',    type: 'wordQuiz',     target: 5,  label: '단어 뜻 보기 5문제 맞추기',  xp: 20, difficulty: 'easy' },
    { id: 'wordquiz_10',   type: 'wordQuiz',     target: 10, label: '단어 뜻 보기 10문제 맞추기', xp: 30, difficulty: 'easy' },
    { id: 'writing_1',     type: 'writing',      target: 1,  label: '한자 쓰기 1개 완료',         xp: 10, difficulty: 'easy' },
    { id: 'match_2',       type: 'matchGame',    target: 2,  label: '짝맞추기 2판 완료',          xp: 35, difficulty: 'easy' },
    { id: 'shoot_10',      type: 'shootGame',    target: 10, label: '몬스터 10마리 처치',         xp: 30, difficulty: 'easy' },
    { id: 'flashcard_3',   type: 'flashcard',    target: 3,  label: '한자 카드 3장 보기',         xp: 10, difficulty: 'easy' },
    // 도전 미션 (hard)
    { id: 'match_3',       type: 'matchGame',    target: 3,  label: '짝맞추기 3판 클리어',        xp: 60, difficulty: 'hard' },
    { id: 'shoot_20',      type: 'shootGame',    target: 20, label: '몬스터 20마리 처치',         xp: 60, difficulty: 'hard' },
    { id: 'quiz_10',       type: 'sentenceQuiz', target: 10, label: '문장 퀴즈 10문제 맞추기',    xp: 60, difficulty: 'hard' },
    { id: 'flashcard_30',  type: 'flashcard',    target: 30, label: '한자 카드 30장 보기',        xp: 50, difficulty: 'hard' },
    { id: 'shoot_wave5',   type: 'shootGame_wave', target: 1, label: '몬스터 슈팅 5웨이브 클리어', xp: 80, difficulty: 'hard' },
    { id: 'wordquiz_20',   type: 'wordQuiz',     target: 20, label: '단어 뜻 보기 20문제 맞추기', xp: 60, difficulty: 'hard' },
    { id: 'writing_10',    type: 'writing',      target: 10, label: '한자 쓰기 10개 완료',        xp: 70, difficulty: 'hard' },
    { id: 'flashcard_50',  type: 'flashcard',    target: 50, label: '한자 카드 50장 보기',        xp: 70, difficulty: 'hard' },
    { id: 'shoot_30',      type: 'shootGame',    target: 30, label: '몬스터 30마리 처치',         xp: 80, difficulty: 'hard' },
    { id: 'quiz_20',       type: 'sentenceQuiz', target: 20, label: '문장 퀴즈 20문제 맞추기',    xp: 80, difficulty: 'hard' },
];

// 날짜 문자열 "YYYY-MM-DD"
const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// 오늘 미션 3개 선택 (쉬운 2개 + 도전 1개)
const pickTodayMissions = () => {
    const easy = MISSION_POOL.filter(m => m.difficulty === 'easy');
    const hard = MISSION_POOL.filter(m => m.difficulty === 'hard');
    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
    const picked = [
        ...shuffle(easy).slice(0, 2),
        ...shuffle(hard).slice(0, 1),
    ];
    return picked.map(m => ({ ...m, progress: 0, done: false }));
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

    // 미션 저장
    useEffect(() => {
        try {
            localStorage.setItem('daily_missions_date', today);
            localStorage.setItem('daily_missions', JSON.stringify(missions));
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
