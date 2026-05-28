/**
 * useHanjaData.js
 * 한자 학습 데이터 통합 훅 (구 useMastery + useSRS 통합)
 *
 * localStorage 키: hanja_data
 * {
 *   [hanjaId]: {
 *     level: 0|1|2,         // 0=처음봄, 1=맞춤, 2=완전암기(3연속 정답)
 *     streak: number,       // 연속 정답 수
 *     wrongCount: number,   // 누적 오답 수
 *     firstSeen: ISO,
 *     lastSeen: ISO,
 *     // SRS (SM-2)
 *     ef: number,           // 용이성 계수 (기본 2.5)
 *     interval: number,     // 다음 복습까지 일수
 *     repetitions: number,  // 성공적 복습 횟수
 *     nextReview: ISO,      // 다음 복습 예정일
 *   }
 * }
 */

import { useState, useCallback } from 'react';

const KEY = 'hanja_data';
const MIN_EF = 1.3;
const DEFAULT_EF = 2.5;

// ── 마이그레이션 (구 mastery_data + srs_data → hanja_data) ──────────────────
const migrate = () => {
    try {
        const existing = localStorage.getItem(KEY);
        if (existing) return JSON.parse(existing);

        const oldMastery = JSON.parse(localStorage.getItem('mastery_data') || '{}');
        const oldSrs = JSON.parse(localStorage.getItem('srs_data') || '{}');

        const ids = new Set([...Object.keys(oldMastery), ...Object.keys(oldSrs)]);
        if (ids.size === 0) return {};

        const merged = {};
        ids.forEach(id => {
            const m = oldMastery[id] || {};
            const s = oldSrs[id] || {};
            merged[id] = {
                level: m.level ?? 0,
                streak: m.streak ?? 0,
                wrongCount: m.wrongCount ?? 0,
                firstSeen: m.firstSeen || s.lastReviewed || new Date().toISOString(),
                lastSeen: m.lastSeen || s.lastReviewed || new Date().toISOString(),
                ef: s.ef ?? DEFAULT_EF,
                interval: s.interval ?? 0,
                repetitions: s.repetitions ?? 0,
                nextReview: s.nextReview || null,
            };
        });
        localStorage.setItem(KEY, JSON.stringify(merged));
        return merged;
    } catch { return {}; }
};

// ── SM-2 알고리즘 ─────────────────────────────────────────────────────────────
const sm2Update = (card, quality) => {
    const ef = Math.max(MIN_EF, Number.isFinite(card?.ef) ? card.ef : DEFAULT_EF);
    const interval = Number.isFinite(card?.interval) && card.interval >= 0 ? card.interval : 0;
    const reps = Number.isFinite(card?.repetitions) ? Math.floor(card.repetitions) : 0;

    let newEf = ef;
    let newInterval, newReps;

    if (quality >= 3) {
        newInterval = reps === 0 ? 1 : reps === 1 ? 3 : reps === 2 ? 7 : Math.round(interval * ef);
        newReps = reps + 1;
        newEf = Math.max(MIN_EF, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    } else {
        newInterval = 1;
        newReps = 0;
        newEf = Math.max(MIN_EF, ef - 0.2);
    }

    if (!Number.isFinite(newInterval) || newInterval < 1) newInterval = 1;
    newInterval = Math.min(newInterval, 365);

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);
    nextReview.setHours(0, 0, 0, 0);

    return {
        ef: Math.round(newEf * 100) / 100,
        interval: newInterval,
        repetitions: newReps,
        nextReview: nextReview.toISOString(),
    };
};

const save = (data) => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
};

export const useHanjaData = () => {
    const [hanjaData, setHanjaData] = useState(migrate);

    const update = useCallback((id, updater) => {
        const strId = String(id);
        setHanjaData(prev => {
            const next = { ...prev, [strId]: updater(prev[strId] || {}) };
            save(next);
            return next;
        });
    }, []);

    // 처음 봤을 때
    const markSeen = useCallback((hanjaId) => {
        if (hanjaId == null) return;
        update(hanjaId, curr => {
            if (curr.firstSeen) return curr; // 이미 등록됨
            const now = new Date().toISOString();
            return { ...curr, level: 0, streak: 0, wrongCount: 0, firstSeen: now, lastSeen: now };
        });
    }, [update]);

    // 정답 (quality 자동 계산)
    const markCorrect = useCallback((hanjaId, responseTimeMs = 5000) => {
        if (hanjaId == null) return;
        const quality = responseTimeMs < 2000 ? 5 : responseTimeMs < 5000 ? 4 : 3;
        update(hanjaId, curr => {
            const now = new Date().toISOString();
            const streak = (curr.streak || 0) + 1;
            const level = streak >= 3 ? 2 : Math.max(curr.level || 0, 1);
            const srs = sm2Update(curr, quality);
            return {
                ...curr, ...srs,
                level, streak,
                wrongCount: streak >= 2 ? 0 : (curr.wrongCount || 0),
                firstSeen: curr.firstSeen || now,
                lastSeen: now,
            };
        });
    }, [update]);

    // 오답
    const markWrong = useCallback((hanjaId) => {
        if (hanjaId == null) return;
        update(hanjaId, curr => {
            const now = new Date().toISOString();
            const srs = sm2Update(curr, 1);
            return {
                ...curr, ...srs,
                level: Math.max(0, (curr.level || 0) - 1),
                streak: 0,
                wrongCount: Math.min((curr.wrongCount || 0) + 1, 99),
                firstSeen: curr.firstSeen || now,
                lastSeen: now,
                lastWrong: now,
            };
        });
    }, [update]);

    // 오답 횟수 초기화
    const clearWrong = useCallback((hanjaId) => {
        if (hanjaId == null) return;
        update(hanjaId, curr => ({ ...curr, wrongCount: 0 }));
    }, [update]);

    // 복습이 필요한 한자 목록 (nextReview <= 오늘)
    const getDueHanja = useCallback((hanjaList) => {
        const now = new Date();
        return hanjaList.filter(h => {
            const d = hanjaData[String(h.id)];
            return d?.nextReview && new Date(d.nextReview) <= now;
        });
    }, [hanjaData]);

    // 가중치 풀 (overdue/due 한자 가중치 부여)
    const getWeightedPool = useCallback((hanjaList) => {
        const now = new Date();
        const pool = [];
        hanjaList.forEach(h => {
            const d = hanjaData[String(h.id)];
            pool.push(h);
            if (!d?.nextReview) return;
            const diff = (now - new Date(d.nextReview)) / 86400000;
            if (diff > 3) { pool.push(h, h, h); }       // overdue: 4배
            else if (diff > 0) { pool.push(h, h); }      // due: 3배
            else if ((d.wrongCount || 0) >= 3) { pool.push(h, h); } // 오답 많음: 3배
            else if ((d.wrongCount || 0) >= 1) { pool.push(h); }    // 오답 있음: 2배
        });
        return pool;
    }, [hanjaData]);

    const getMasteryLevel = useCallback((hanjaId) => {
        const d = hanjaData[String(hanjaId)];
        return d ? d.level : null;
    }, [hanjaData]);

    const getStats = useCallback((hanjaList) => {
        let seen = 0, correct = 0, mastered = 0;
        hanjaList.forEach(h => {
            const d = hanjaData[String(h.id)];
            if (!d) return;
            if (d.level === 2) mastered++;
            else if (d.level === 1) correct++;
            else seen++;
        });
        const unknown = hanjaList.length - seen - correct - mastered;
        return { total: hanjaList.length, unknown, seen, correct, mastered };
    }, [hanjaData]);

    return {
        hanjaData,
        markSeen,
        markCorrect,
        markWrong,
        clearWrong,
        getDueHanja,
        getWeightedPool,
        getMasteryLevel,
        getStats,
    };
};
