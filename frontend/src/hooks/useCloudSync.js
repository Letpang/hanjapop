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
import {
    isSupabaseEnabled,
    upsertUserProfile,
    backupLearningData,
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
    mastery,
    srsData,
    totalStats,
    unlockedStickers,
}) => {
    const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error' | 'offline'
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
    const syncTimerRef = useRef(null);
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
        setSyncStatus('syncing');
        try {
            const level = getLevel(userXp);
            // 프로필 업데이트
            const { error: profileError } = await upsertUserProfile({
                nickname: userNickname || '한자학습자',
                characterType: selectedCharacter || 'garae',
                xp: userXp || 0,
                level,
                streakCount: streak?.count || 0,
            });
            if (profileError && profileError !== 'offline') {
                console.warn('[CloudSync] Profile sync failed:', profileError);
            }
            // 학습 데이터 백업
            const { error: dataError } = await backupLearningData({
                masteryData: mastery || {},
                srsData: srsData || {},
                totalStats: totalStats || {},
                unlockedStickers: unlockedStickers || {},
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
    }, [userXp, userNickname, selectedCharacter, streak, mastery, srsData, totalStats, unlockedStickers]);

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
        isOnline: isSupabaseEnabled,
        deviceId,
    };
};
