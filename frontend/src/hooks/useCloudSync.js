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

import { useState, useEffect, useRef } from 'react';
import {
    isSupabaseEnabled,
    getDeviceId,
} from '../lib/supabase.js';
import { SYNC_INTERVAL_MS } from './cloudSyncConstants.js';
import { useCloudBackupCache } from './useCloudBackupCache.js';
import { useCloudLeaderboard } from './useCloudLeaderboard.js';
import { useCloudRestoreActions } from './useCloudRestoreActions.js';
import { useCloudSyncToCloud } from './useCloudSyncToCloud.js';

export const useCloudSync = ({
    userXp,
    userNickname,
    selectedCharacter,
    streak,
    hanjaData,
    wordData,
    studyLog,
    totalStats,
}) => {
    const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error' | 'offline'
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const syncTimerRef = useRef(null);
    const deviceId = getDeviceId();
    const {
        fetchCachedCloudBackupSnapshot,
        fetchFreshCloudBackupSnapshot,
        invalidateCloudBackupSnapshot,
    } = useCloudBackupCache(deviceId);
    const {
        isLeaderboardLoading,
        leaderboard,
        loadLeaderboard,
        myRank,
    } = useCloudLeaderboard({ deviceId, userXp });

    // 오프라인 모드 감지
    useEffect(() => {
        if (!isSupabaseEnabled) {
            setSyncStatus('offline');
        }
    }, []);

    const syncToCloud = useCloudSyncToCloud({
        hanjaData,
        invalidateCloudBackupSnapshot,
        selectedCharacter,
        setLastSyncTime,
        setSyncStatus,
        streak,
        studyLog,
        totalStats,
        userNickname,
        userXp,
        wordData,
    });

    const {
        adoptLocalDataForCurrentAccount,
        restoreFromCloud,
    } = useCloudRestoreActions({
        fetchCachedCloudBackupSnapshot,
        fetchFreshCloudBackupSnapshot,
        invalidateCloudBackupSnapshot,
        setIsRestoring,
        syncToCloud,
    });

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

    return {
        syncStatus,
        lastSyncTime,
        leaderboard,
        myRank,
        isLeaderboardLoading,
        syncToCloud,
        loadLeaderboard,
        restoreFromCloud,
        adoptLocalDataForCurrentAccount,
        isRestoring,
        isOnline: isSupabaseEnabled,
        deviceId,
    };
};
