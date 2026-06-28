/**
 * useWordData.js
 * 단어 학습 데이터 훅 (구 useWordMastery + 단어 SRS 신규)
 *
 * localStorage 키: word_data
 * {
 *   [wordId]: {
 *     hanjaId: number,
 *     reading: string,
 *     meaning: string,
 *     wrongCount: number,
 *     correctCount: number,
 *     lastWrong: ISO | null,
 *     lastCorrect: ISO | null,
 *     // SRS (SM-2) — 단어도 복습 스케줄 관리
 *     ef: number,
 *     interval: number,
 *     repetitions: number,
 *     nextReview: ISO | null,
 *   }
 * }
 */

import { useState, useCallback } from 'react';
import {
    DEFAULT_LEARNING_EF,
    saveLearningRecord,
    updateLearningSchedule,
} from './learningRecordUtils.js';

const KEY = 'word_data';

// ── 마이그레이션 (구 word_wrong_data → word_data) ───────────────────────────
const migrate = () => {
    try {
        const existing = localStorage.getItem(KEY);
        if (existing) return JSON.parse(existing);

        const old = JSON.parse(localStorage.getItem('word_wrong_data') || '{}');
        if (Object.keys(old).length === 0) return {};

        const migrated = {};
        Object.entries(old).forEach(([wordId, v]) => {
            migrated[wordId] = {
                hanjaId: v.hanja_id ?? null,
                reading: v.reading || '',
                meaning: v.meaning || '',
                wrongCount: v.count || 0,
                correctCount: 0,
                lastWrong: null,
                lastCorrect: null,
                ef: DEFAULT_LEARNING_EF,
                interval: 1,       // 오답이 있던 단어 → 1일 후 복습 우선
                repetitions: 0,
                nextReview: new Date().toISOString(), // 바로 복습 대상으로
            };
        });
        localStorage.setItem(KEY, JSON.stringify(migrated));
        return migrated;
    } catch { return {}; }
};

const save = (data) => {
    saveLearningRecord(KEY, data);
};

export const useWordData = () => {
    const [wordData, setWordData] = useState(migrate);

    const update = useCallback((id, updater) => {
        const strId = String(id);
        setWordData(prev => {
            const next = { ...prev, [strId]: updater(prev[strId] || {}) };
            save(next);
            return next;
        });
    }, []);

    // 단어 오답 기록 + SRS 오답 처리
    const markWordWrong = useCallback((wordId, hanjaId, reading, meaning) => {
        if (wordId == null) return;
        update(wordId, curr => {
            const now = new Date().toISOString();
            const srs = updateLearningSchedule(curr, 1);
            return {
                ...curr, ...srs,
                hanjaId: hanjaId ?? curr.hanjaId ?? null,
                reading: reading || curr.reading || '',
                meaning: meaning || curr.meaning || '',
                wrongCount: (curr.wrongCount || 0) + 1,
                correctCount: curr.correctCount || 0,
                lastWrong: now,
            };
        });
    }, [update]);

    // 단어 정답 기록 + SRS 정답 처리
    const markWordCorrect = useCallback((wordId, responseTimeMs = 5000) => {
        if (wordId == null) return;
        const quality = responseTimeMs < 2000 ? 5 : responseTimeMs < 5000 ? 4 : 3;
        update(wordId, curr => {
            const now = new Date().toISOString();
            const srs = updateLearningSchedule(curr, quality);
            return {
                ...curr, ...srs,
                correctCount: (curr.correctCount || 0) + 1,
                lastCorrect: now,
            };
        });
    }, [update]);

    // 단어 오답 초기화 (복습 완료 후)
    const clearWordWrong = useCallback((wordId) => {
        if (wordId == null) return;
        update(wordId, curr => ({ ...curr, wrongCount: 0 }));
    }, [update]);

    // 특정 한자에 속한 단어 오답 초기화
    const clearWordWrongByHanjaId = useCallback((hanjaId) => {
        setWordData(prev => {
            const next = {};
            Object.entries(prev).forEach(([id, v]) => {
                next[id] = v.hanjaId === Number(hanjaId) ? { ...v, wrongCount: 0 } : v;
            });
            save(next);
            return next;
        });
    }, []);

    // 오늘 복습해야 할 단어 ID 목록
    const getDueWordIds = useCallback(() => {
        const now = new Date();
        return Object.entries(wordData)
            .filter(([, v]) => v.nextReview && new Date(v.nextReview) <= now)
            .map(([id]) => Number(id));
    }, [wordData]);

    // 틀린 단어의 한자 ID 목록 (복습화면용)
    const getWrongWordHanjaIds = useCallback(() => {
        return [...new Set(
            Object.values(wordData)
                .filter(v => (v.wrongCount || 0) > 0 && v.hanjaId)
                .map(v => v.hanjaId)
        )];
    }, [wordData]);

    return {
        wordData,
        markWordWrong,
        markWordCorrect,
        clearWordWrong,
        clearWordWrongByHanjaId,
        getDueWordIds,
        getWrongWordHanjaIds,
    };
};
