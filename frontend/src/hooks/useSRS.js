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
import {
    DEFAULT_EF,
    getDueSRSItems,
    getNewSRSItems,
    getSRSCardStatus,
    getSRSPriority,
    getSRSStats,
    getSRSStatus,
    getWeightedSRSPool,
    loadSRS,
    saveSRS,
    sm2Update,
} from './srsUtils.js';

export { getSRSPriority, getSRSStatus } from './srsUtils.js';

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
        return getDueSRSItems(hanjaList, srsData);
    }, [srsData]);

    /**
     * 새로 학습해야 할 한자 목록 (아직 SRS에 없는 것)
     */
    const getNewItems = useCallback((hanjaList) => {
        return getNewSRSItems(hanjaList, srsData);
    }, [srsData]);

    /**
     * 특정 한자의 SRS 상태 반환
     */
    const getCardStatus = useCallback((hanjaId) => {
        return getSRSCardStatus(hanjaId, srsData);
    }, [srsData]);

    /**
     * 몬스터 디펜스용: 취약 한자 가중치 목록 반환
     * 오답이 많거나 overdue인 한자가 더 자주 등장하도록
     * @param {Array} hanjaList
     * @param {Object} masteryData - 기존 mastery 데이터
     * @returns {Array} 가중치가 적용된 한자 목록 (중복 포함)
     */
    const getWeightedPool = useCallback((hanjaList, masteryData = {}) => {
        return getWeightedSRSPool(hanjaList, srsData, masteryData);
    }, [srsData]);

    /**
     * SRS 통계 계산
     */
    const getStats = useCallback((hanjaList) => {
        return getSRSStats(hanjaList, srsData);
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
