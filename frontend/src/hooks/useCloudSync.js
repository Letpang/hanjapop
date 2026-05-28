/**
 * useCloudSync.js
 * 자동 클라우드 동기화 훅
 *
 * 기능:
 *   - XP 변경 시 5분마다 자동 백업 (debounce)
 *   - 앱 시작 시 클라우드에서 데이터 복원 여부 확인
 *   - 실시간 리더보드 데이터 제공
 *   - 오프라인 모드 자동 감지 (Supabase 미설정 시)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getLevel } from '../utils/rankUtils.js';
import { SK } from '../constants/storageKeys.js';
import {
    isSupabaseEnabled,
    upsertUserProfile,
    backupLearningData,
    restoreLearningData,
    fetchUserProfile,
    fetchLeaderboard,
    fetchMyRank,
    subscribeLeaderboard,
    getDeviceId,
} from '../lib/supabase.js';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5분

export const useCloudSync = ({
    userXp,
    userNickname,
    selectedCharacter,
    streak,
    hanjaData,
    totalStats,
}) => {
    const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error' | 'offline'
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const syncTimerRef = useRef(null);
    // device_id가 이미 존재했는지 (훅 초기화 전에 체크 — getDeviceId()가 새로 생성하기 전)
    const deviceIdExistedRef = useRef(!!localStorage.getItem(SK.DEVICE_ID));
    const deviceId = getDeviceId();

    // 오프라인 모드 감지
    useEffect(() => {
        if (!isSupabaseEnabled) {
            setSyncStatus('offline');
        }
    }, []);

    /**
     * 전체 데이터 동기화
     */
    const syncToCloud = useCallback(async () => {
        if (!isSupabaseEnabled) {
            setSyncStatus('offline');
            return;
        }
        // 캐릭터 미선택 상태에서 동기화 시 기본값으로 덮어씌우는 것 방지
        if (!selectedCharacter) return;
        setSyncStatus('syncing');
        try {
            const level = getLevel(userXp);
            // 프로필 업데이트
            const { error: profileError } = await upsertUserProfile({
                nickname: userNickname || '한자학습자',
                characterType: selectedCharacter,
                xp: userXp || 0,
                level,
                streakCount: streak?.count || 0,
            });
            if (profileError && profileError !== 'offline') {
                console.warn('[CloudSync] Profile sync failed:', profileError);
            }
            // 학습 데이터 백업
            const { error: dataError } = await backupLearningData({
                masteryData: hanjaData || {},
                srsData: hanjaData || {},
                totalStats: totalStats || {},
            });
            if (dataError && dataError !== 'offline') {
                console.warn('[CloudSync] Data backup failed:', dataError);
            }
            setSyncStatus('synced');
            setLastSyncTime(new Date());
        } catch (e) {
            console.warn('[CloudSync] Sync error:', e);
            setSyncStatus('error');
        }
    }, [userXp, userNickname, selectedCharacter, streak, hanjaData, totalStats]);

    /**
     * 클라우드에서 전체 프로필 복원
     * 복원 성공 시 { success: true } 반환 — 호출자가 페이지 리로드 처리
     */
    const restoreFromCloud = useCallback(async () => {
        if (!isSupabaseEnabled) return { success: false };
        setIsRestoring(true);
        try {
            const [{ data: profile }, { data: learningData }] = await Promise.all([
                fetchUserProfile(),
                restoreLearningData(),
            ]);
            if (!profile && !learningData) { setIsRestoring(false); return { success: false }; }
            if (profile) {
                if (profile.nickname)       localStorage.setItem(SK.USER_NICKNAME, profile.nickname);
                if (profile.character_type) localStorage.setItem(SK.SELECTED_CHARACTER, profile.character_type);
                if (typeof profile.xp === 'number') localStorage.setItem(SK.USER_XP, String(profile.xp));
            }
            if (learningData) {
                if (learningData.mastery_data)        localStorage.setItem('hanja_data', JSON.stringify(learningData.mastery_data));
                if (learningData.total_stats)         localStorage.setItem('study_log', JSON.stringify({ total: learningData.total_stats, days: {} }));
                if (learningData.curriculum_progress) localStorage.setItem('curriculum_progress', JSON.stringify(learningData.curriculum_progress));
                if (learningData.word_wrong_data)     localStorage.setItem('word_data', JSON.stringify(learningData.word_wrong_data));
            }
            setIsRestoring(false);
            return { success: true };
        } catch {
            setIsRestoring(false);
            return { success: false };
        }
    }, []);

    // 앱 시작 시 자동 복원: device_id는 있는데 캐릭터가 없으면 데이터 유실로 판단
    useEffect(() => {
        if (!isSupabaseEnabled) return;
        const hasCharacter = localStorage.getItem(SK.SELECTED_CHARACTER);
        if (!hasCharacter && deviceIdExistedRef.current) {
            restoreFromCloud().then(({ success }) => {
                if (success) window.location.reload();
            });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // XP 변경 시 debounce 동기화
    useEffect(() => {
        if (!isSupabaseEnabled) return;
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        syncTimerRef.current = setTimeout(() => {
            syncToCloud();
        }, SYNC_INTERVAL_MS);
        return () => {
            if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        };
    }, [userXp, syncToCloud]);

    /**
     * 리더보드 로드
     */
    const loadLeaderboard = useCallback(async () => {
        if (!isSupabaseEnabled) return;
        setIsLeaderboardLoading(true);
        try {
            const { data, error } = await fetchLeaderboard();
            if (data && !error) {
                setLeaderboard(data.map((user, idx) => ({
                    ...user,
                    rank: idx + 1,
                    isMe: user.device_id === deviceId,
                })));
            }
            const { rank } = await fetchMyRank(userXp);
            if (rank) setMyRank(rank);
        } catch (e) {
            console.warn('[CloudSync] Leaderboard load failed:', e);
        } finally {
            setIsLeaderboardLoading(false);
        }
    }, [userXp, deviceId]);

    // 실시간 리더보드 구독
    useEffect(() => {
        if (!isSupabaseEnabled) return;
        loadLeaderboard();
        const unsubscribe = subscribeLeaderboard(() => {
            // 실시간 업데이트 시 리더보드 재로드
            loadLeaderboard();
        });
        return unsubscribe;
    }, [loadLeaderboard]);

    return {
        syncStatus,
        lastSyncTime,
        leaderboard,
        myRank,
        isLeaderboardLoading,
        syncToCloud,
        loadLeaderboard,
        restoreFromCloud,
        isRestoring,
        isOnline: isSupabaseEnabled,
        deviceId,
    };
};
