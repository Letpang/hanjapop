/**
 * useStudyLog.js
 * 학습 로그 + 활동 통계 통합 훅
 * (구 useDailyStudyLog + useTotalStats + todayStats 통합)
 *
 * localStorage 키: study_log
 * {
 *   total: {                         // 전체 누적 통계
 *     totalDays: number,
 *     lastAttendDate: string,        // toDateString()
 *     shootGame: number,
 *     matchGame: number,
 *     writing: number,
 *     wordQuiz: number,
 *     sentenceQuiz: number,
 *     flashcard: number,
 *     wordCorrect: number,
 *   },
 *   days: {                          // 날짜별 학습 로그
 *     "2026-05-23": {
 *       hanjaIds: number[],
 *       wordIds: number[],
 *       correctWordIds: number[],
 *       wrongWordIds: number[],
 *       activities: string[],        // ["wordQuiz", "matchGame", ...]
 *       xp: number,                  // 그날 획득 XP
 *     }
 *   }
 * }
 */

import { useState, useCallback } from 'react';
import {
    cloneStudyLog,
    ensureAttendance,
    ensureToday,
    getTodayStats,
    getTodayStr,
    migrateStudyLog,
    saveStudyLog,
} from './studyLogUtils.js';

export const useStudyLog = () => {
    const [log, setLog] = useState(() => {
        return ensureAttendance(migrateStudyLog());
    });

    const updateLog = useCallback((updater) => {
        setLog(prev => {
            const next = updater(cloneStudyLog(prev));
            saveStudyLog(next);
            return next;
        });
    }, []);

    // 한자 ID 기록
    const logHanja = useCallback((hanjaId) => {
        if (!hanjaId) return;
        const id = Number(hanjaId);
        updateLog(l => {
            const day = ensureToday(l);
            if (!day.hanjaIds.includes(id)) day.hanjaIds.push(id);
            return l;
        });
    }, [updateLog]);

    // 단어 ID 기록 (본 단어)
    const logWord = useCallback((wordId) => {
        if (wordId == null) return;
        const id = Number(wordId);
        updateLog(l => {
            const day = ensureToday(l);
            if (!day.wordIds.includes(id)) day.wordIds.push(id);
            return l;
        });
    }, [updateLog]);

    // 정답 단어 기록
    const logCorrectWord = useCallback((wordId) => {
        if (wordId == null) return;
        const id = Number(wordId);
        updateLog(l => {
            const day = ensureToday(l);
            day.correctWordIds = [...new Set([...(day.correctWordIds || []), id])];
            l.total.wordCorrect = (l.total.wordCorrect || 0) + 1;
            return l;
        });
    }, [updateLog]);

    // 오답 단어 기록
    const logWrongWord = useCallback((wordId) => {
        if (wordId == null) return;
        const id = Number(wordId);
        updateLog(l => {
            const day = ensureToday(l);
            day.wrongWordIds = [...new Set([...(day.wrongWordIds || []), id])];
            return l;
        });
    }, [updateLog]);

    // 활동 완료 기록 (게임/퀴즈 1세트 완료)
    const logActivity = useCallback((type, amount = 1) => {
        const count = Math.max(1, Number(amount) || 1);
        updateLog(l => {
            const day = ensureToday(l);
            day.activities.push(...Array.from({ length: count }, () => type));
            l.total[type] = (l.total[type] || 0) + count;
            return l;
        });
    }, [updateLog]);

    const logXp = useCallback((amount) => {
        const xp = Math.max(0, Number(amount) || 0);
        if (!xp) return;
        updateLog(l => {
            const day = ensureToday(l);
            day.xp = (day.xp || 0) + xp;
            return l;
        });
    }, [updateLog]);

    // 오늘 본 단어 IDs
    const getTodayWordIds = useCallback(() => {
        return log.days[getTodayStr()]?.wordIds || [];
    }, [log]);

    // 오늘 활동 횟수 (type별)
    const getTodayCount = useCallback((type) => {
        const today = getTodayStr();
        const acts = log.days[today]?.activities || [];
        return acts.filter(a => a === type).length;
    }, [log]);

    // 오늘 통계 (MainMenu 등에서 사용)
    const todayStats = getTodayStats(log);

    return {
        log,
        totalStats: log.total,
        todayStats,
        logHanja,
        logWord,
        logCorrectWord,
        logWrongWord,
        logActivity,
        logXp,
        getTodayWordIds,
        getTodayCount,
    };
};
