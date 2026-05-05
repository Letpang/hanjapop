/**
 * useTotalStats.js
 * 누적 활동 통계 (localStorage 기반)
 * 앱 실행 시 출석일 자동 카운트
 *
 * localStorage 키: total_activity_stats
 * {
 *   totalDays: number,       // 총 출석일
 *   lastAttendDate: string,  // 마지막 출석일 (toDateString)
 *   shootGame: number,       // 몬스터 슈팅 클리어 누적
 *   matchGame: number,       // 짝맞추기 클리어 누적
 *   writing: number,         // 쓰기 완료 누적
 *   wordQuiz: number,        // 단어퀴즈 완료 누적
 *   sentenceQuiz: number,    // 문장퀴즈 정답 누적
 *   wordCorrect: number,     // 단어퀴즈 정답 누적 (단어 마스터용)
 * }
 */
import { useState, useEffect, useCallback } from 'react';

const KEY = 'total_activity_stats';

const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
};

export const useTotalStats = () => {
    const [totalStats, setTotalStats] = useState(() => {
        const saved = load();
        const today = new Date().toDateString();
        if (saved.lastAttendDate !== today) {
            const updated = {
                ...saved,
                totalDays: (saved.totalDays || 0) + 1,
                lastAttendDate: today,
            };
            try { localStorage.setItem(KEY, JSON.stringify(updated)); } catch {}
            return updated;
        }
        return saved;
    });

    useEffect(() => {
        try { localStorage.setItem(KEY, JSON.stringify(totalStats)); } catch {}
    }, [totalStats]);

    const increment = useCallback((key, amount = 1) => {
        setTotalStats(prev => ({ ...prev, [key]: (prev[key] || 0) + amount }));
    }, []);

    return { totalStats, increment };
};
