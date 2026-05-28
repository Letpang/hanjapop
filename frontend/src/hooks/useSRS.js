/**
 * useSRS.js
 * Spaced Repetition System (간격 반복 학습) 엔진
 *
 * SM-2 알고리즘 기반 망각 곡선 구현:
 *   - 각 한자에 대해 복습 간격(interval), 용이성 계수(EF), 다음 복습일(nextReview)을 추적
 *   - 정답 품질(0~5)에 따라 EF와 interval을 동적으로 조절
 *   - 오답 시 interval을 1일로 리셋, EF 하락
 *
 * 복습 스케줄:
 *   - 처음 학습: 1일 후 복습
 *   - 1회 정답: 3일 후
 *   - 2회 연속 정답: 7일 후
 *   - 이후: interval * EF 일 후 (EF 기본값 2.5)
 *
 * localStorage 키:
 *   - srs_data: JSON { [hanjaId]: { ef, interval, repetitions, nextReview, lastQuality, totalReviews } }
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'srs_data';
const MIN_EF = 1.3;
const DEFAULT_EF = 2.5;

// 복습 간격 테이블 (일 단위)
const INTERVAL_TABLE = [1, 3, 7]; // 0회, 1회, 2회 정답 후

const loadSRS = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
};

const saveSRS = (data) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
};

/**
 * SM-2 알고리즘으로 다음 복습 간격 계산
 * @param {Object} card - 현재 카드 상태
 * @param {number} quality - 정답 품질 (0~5, 3이상=정답)
 * @returns {Object} 업데이트된 카드 상태
 */
const sm2Update = (card, quality) => {
    const rawEf = Number(card?.ef);
    const rawInterval = Number(card?.interval);
    const rawRepetitions = Number(card?.repetitions);
    const ef = Number.isFinite(rawEf) && rawEf >= MIN_EF ? rawEf : DEFAULT_EF;
    const interval = Number.isFinite(rawInterval) && rawInterval >= 0 ? rawInterval : 0;
    const repetitions = Number.isFinite(rawRepetitions) && rawRepetitions >= 0 ? Math.floor(rawRepetitions) : 0;

    let newEf = ef;
    let newInterval;
    let newRepetitions;

    if (quality >= 3) {
        if (repetitions === 0) {
            newInterval = INTERVAL_TABLE[0];
        } else if (repetitions === 1) {
            newInterval = INTERVAL_TABLE[1];
        } else if (repetitions === 2) {
            newInterval = INTERVAL_TABLE[2];
        } else {
            newInterval = Math.round(interval * ef);
        }
        newRepetitions = repetitions + 1;
        newEf = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        newEf = Math.max(MIN_EF, newEf);
        // 밀린 만큼 EF 페널티 (최대 0.3)
        if (card?.lastReviewed && interval > 0) {
            const actualDays = (Date.now() - new Date(card.lastReviewed)) / (1000 * 60 * 60 * 24);
            const delay = Math.max(0, actualDays - interval);
            if (delay > 0) newEf = Math.max(MIN_EF, newEf - Math.min(0.3, delay * 0.02));
        }
    } else {
        newInterval = 1;
        newRepetitions = 0;
        newEf = Math.max(MIN_EF, ef - 0.2);
    }

    // NaN/Infinity 방어: 이상 값이면 1일로 리셋
    if (!Number.isFinite(newInterval) || newInterval < 1) newInterval = 1;
    newInterval = Math.min(newInterval, 365); // 최대 1년 캡

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);
    nextReview.setHours(0, 0, 0, 0);

    return {
        ef: Math.round(newEf * 100) / 100,
        interval: newInterval,
        repetitions: newRepetitions,
        nextReview: nextReview.toISOString(),
        lastQuality: quality,
        totalReviews: (card?.totalReviews || 0) + 1,
        lastReviewed: new Date().toISOString(),
    };
};

/**
 * 복습 긴급도 계산
 * @param {Object} card - SRS 카드 데이터
 * @returns {'new'|'due'|'overdue'|'learning'|'mastered'}
 */
export const getSRSStatus = (card) => {
    if (!card || !card.nextReview) return 'new';
    const now = new Date();
    const next = new Date(card.nextReview);
    const diffDays = (next - now) / (1000 * 60 * 60 * 24);

    if (diffDays < -3) return 'overdue';  // 3일 이상 지남 (긴급)
    if (diffDays <= 0) return 'due';       // 오늘 복습 예정
    if (card.repetitions >= 4) return 'mastered'; // 충분히 학습됨
    return 'learning';                     // 학습 중
};

/**
 * 복습 우선순위 점수 계산 (낮을수록 먼저 복습)
 */
export const getSRSPriority = (card) => {
    if (!card) return 0; // 새 카드는 최우선
    const status = getSRSStatus(card);
    const now = new Date();
    const next = new Date(card.nextReview || now);
    const overdueDays = Math.max(0, (now - next) / (1000 * 60 * 60 * 24));

    switch (status) {
        case 'overdue': return -overdueDays * 10; // 오래될수록 낮은 점수(우선)
        case 'due': return 0;
        case 'learning': return (next - now) / (1000 * 60 * 60 * 24);
        case 'mastered': return 999;
        default: return -1;
    }
};

export const useSRS = () => {
    const [srsData, setSrsData] = useState(loadSRS);

    useEffect(() => {
        saveSRS(srsData);
    }, [srsData]);

    /**
     * 학습 결과 기록 (SM-2 알고리즘 적용)
     * @param {string|number} hanjaId
     * @param {number} quality - 0~5 (0=완전 오답, 5=완벽 정답)
     */
    const recordReview = useCallback((hanjaId, quality) => {
        const id = String(hanjaId);
        setSrsData(prev => {
            const current = prev[id] || { ef: DEFAULT_EF, interval: 0, repetitions: 0 };
            const updated = sm2Update(current, quality);
            return { ...prev, [id]: updated };
        });
    }, []);

    /**
     * 정답 기록 (quality 자동 계산)
     * @param {string|number} hanjaId
     * @param {boolean} wasHint - 힌트 사용 여부
     * @param {number} responseTimeMs - 응답 시간 (ms)
     */
    const markCorrect = useCallback((hanjaId, wasHint = false, responseTimeMs = 5000) => {
        // 응답 시간과 힌트 사용 여부로 품질 계산
        let quality;
        if (wasHint) {
            quality = 3; // 힌트 사용 = 간신히 정답
        } else if (responseTimeMs < 2000) {
            quality = 5; // 2초 이내 = 완벽
        } else if (responseTimeMs < 5000) {
            quality = 4; // 5초 이내 = 정답
        } else {
            quality = 3; // 느린 정답
        }
        recordReview(hanjaId, quality);
    }, [recordReview]);

    /**
     * 오답 기록
     * @param {string|number} hanjaId
     */
    const markWrong = useCallback((hanjaId) => {
        recordReview(hanjaId, 1); // quality 1 = 오답이지만 정답 보고 기억
    }, [recordReview]);

    /**
     * 오늘 복습해야 할 한자 목록 반환 (우선순위 정렬)
     * @param {Array} hanjaList - 전체 한자 데이터
     * @returns {Array} 복습 필요 한자 목록
     */
    const getDueItems = useCallback((hanjaList) => {
        const now = new Date();
        return hanjaList
            .filter(h => {
                const card = srsData[String(h.id)];
                if (!card) return false;
                const next = new Date(card.nextReview);
                return next <= now;
            })
            .sort((a, b) => {
                const cardA = srsData[String(a.id)];
                const cardB = srsData[String(b.id)];
                return getSRSPriority(cardA) - getSRSPriority(cardB);
            });
    }, [srsData]);

    /**
     * 새로 학습해야 할 한자 목록 (아직 SRS에 없는 것)
     */
    const getNewItems = useCallback((hanjaList) => {
        return hanjaList.filter(h => !srsData[String(h.id)]);
    }, [srsData]);

    /**
     * 특정 한자의 SRS 상태 반환
     */
    const getCardStatus = useCallback((hanjaId) => {
        const card = srsData[String(hanjaId)];
        return {
            card,
            status: getSRSStatus(card),
            priority: getSRSPriority(card),
            daysUntilReview: card?.nextReview
                ? Math.ceil((new Date(card.nextReview) - new Date()) / (1000 * 60 * 60 * 24))
                : null,
        };
    }, [srsData]);

    /**
     * 몬스터 디펜스용: 취약 한자 가중치 목록 반환
     * 오답이 많거나 overdue인 한자가 더 자주 등장하도록
     * @param {Array} hanjaList
     * @param {Object} masteryData - 기존 mastery 데이터
     * @returns {Array} 가중치가 적용된 한자 목록 (중복 포함)
     */
    const getWeightedPool = useCallback((hanjaList, masteryData = {}) => {
        const pool = [];
        hanjaList.forEach(h => {
            const id = String(h.id);
            const card = srsData[id];
            const mastery = masteryData[id];
            const status = getSRSStatus(card);

            // 기본 1회 추가
            pool.push(h);

            // 취약 한자 가중치 추가
            if (status === 'overdue') {
                pool.push(h, h, h); // 4배 등장
            } else if (status === 'due') {
                pool.push(h, h); // 3배 등장
            } else if (mastery?.wrongCount >= 3) {
                pool.push(h, h); // 오답 많으면 3배
            } else if (mastery?.wrongCount >= 1) {
                pool.push(h); // 오답 있으면 2배
            }
        });
        return pool;
    }, [srsData]);

    /**
     * SRS 통계 계산
     */
    const getStats = useCallback((hanjaList) => {
        const now = new Date();
        let newCount = 0, dueCount = 0, overdueCount = 0, learningCount = 0, masteredCount = 0;

        hanjaList.forEach(h => {
            const card = srsData[String(h.id)];
            const status = getSRSStatus(card);
            switch (status) {
                case 'new': newCount++; break;
                case 'due': dueCount++; break;
                case 'overdue': overdueCount++; break;
                case 'learning': learningCount++; break;
                case 'mastered': masteredCount++; break;
            }
        });

        // 다음 7일간 복습 예정 수
        const upcoming = hanjaList.filter(h => {
            const card = srsData[String(h.id)];
            if (!card?.nextReview) return false;
            const next = new Date(card.nextReview);
            const diffDays = (next - now) / (1000 * 60 * 60 * 24);
            return diffDays > 0 && diffDays <= 7;
        }).length;

        return { newCount, dueCount, overdueCount, learningCount, masteredCount, upcoming };
    }, [srsData]);

    return {
        srsData,
        recordReview,
        markCorrect,
        markWrong,
        getDueItems,
        getNewItems,
        getCardStatus,
        getWeightedPool,
        getStats,
    };
};
