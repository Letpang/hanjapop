/**
 * useMastery.js
 * 단어/한자 숙달도 트래킹 (localStorage 기반)
 *
 * 숙달도 레벨:
 *   0 = 처음봄 (seen)
 *   1 = 맞춤 (correct, 1회 이상)
 *   2 = 완전암기 (mastered, 3회 연속 정답)
 *
 * localStorage 키:
 *   - mastery_data: JSON { [hanjaId]: { level: 0|1|2, streak: number, lastSeen: ISO string } }
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'mastery_data';

const loadMastery = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
};

const saveMastery = (data) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
};

export const useMastery = () => {
    const [mastery, setMastery] = useState(loadMastery);

    // 변경 시 저장
    useEffect(() => {
        saveMastery(mastery);
    }, [mastery]);

    /**
     * 한자/단어를 봤을 때 (처음봄 상태로 등록)
     * @param {string|number} hanjaId
     */
    const markSeen = useCallback((hanjaId) => {
        const id = String(hanjaId);
        setMastery(prev => {
            if (prev[id]) return prev; // 이미 등록됨
            return {
                ...prev,
                [id]: { level: 0, streak: 0, lastSeen: new Date().toISOString() }
            };
        });
    }, []);

    /**
     * 정답 맞춤
     * @param {string|number} hanjaId
     */
    const markCorrect = useCallback((hanjaId) => {
        const id = String(hanjaId);
        setMastery(prev => {
            const current = prev[id] || { level: 0, streak: 0, wrongCount: 0 };
            const newStreak = current.streak + 1;
            const newLevel = newStreak >= 3 ? 2 : Math.max(current.level, 1);
            return {
                ...prev,
                [id]: {
                    level: newLevel,
                    streak: newStreak,
                    lastSeen: new Date().toISOString(),
                    wrongCount: newStreak >= 2 ? 0 : (current.wrongCount || 0),
                }
            };
        });
    }, []);

    /**
     * 오답
     * @param {string|number} hanjaId
     */
    const markWrong = useCallback((hanjaId) => {
        const id = String(hanjaId);
        setMastery(prev => {
            const current = prev[id] || { level: 0, streak: 0, wrongCount: 0 };
            return {
                ...prev,
                [id]: {
                    level: Math.max(0, current.level - 1), // 레벨 하락
                    streak: 0, // 연속 초기화
                    lastSeen: new Date().toISOString(),
                    wrongCount: Math.min((current.wrongCount || 0) + 1, 10),
                    lastWrong: new Date().toISOString()
                }
            };
        });
    }, []);

    /**
     * 숙달도 통계 계산
     * @param {Array} hanjaList - HANJA_DATA 배열
     */
    const getStats = useCallback((hanjaList) => {
        const total = hanjaList.length;
        let seen = 0, correct = 0, mastered = 0;
        hanjaList.forEach(h => {
            const m = mastery[String(h.id)];
            if (!m) return;
            if (m.level === 0) seen++;
            else if (m.level === 1) correct++;
            else if (m.level === 2) mastered++;
        });
        const unknown = total - seen - correct - mastered;
        return { total, unknown, seen, correct, mastered };
    }, [mastery]);

    /**
     * 특정 한자의 숙달도 레벨 반환
     * @param {string|number} hanjaId
     * @returns {0|1|2|null} null = 아직 안봄
     */
    const getMasteryLevel = useCallback((hanjaId) => {
        const m = mastery[String(hanjaId)];
        return m ? m.level : null;
    }, [mastery]);

    const clearWrong = useCallback((hanjaId) => {
        const id = String(hanjaId);
        setMastery(prev => {
            const current = prev[id];
            if (!current || !current.wrongCount) return prev;
            return { ...prev, [id]: { ...current, wrongCount: 0 } };
        });
    }, []);

    return {
        mastery,
        markSeen,
        markCorrect,
        markWrong,
        clearWrong,
        getStats,
        getMasteryLevel,
    };
};
