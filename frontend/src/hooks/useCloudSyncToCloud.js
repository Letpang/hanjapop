import { useCallback } from 'react';
import { useLang } from './useLang.js';
import { getLevel } from '../utils/rankUtils.js';
import {
    backupLearningData,
    getCurrentUser,
    isSupabaseEnabled,
    syncInternalAccountData,
    upsertUserProfile,
} from '../lib/supabase.js';
import { RESTORE_READY_PREFIX } from './cloudSyncConstants.js';

export const useCloudSyncToCloud = ({
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
}) => {
    const { t } = useLang();

    return useCallback(async () => {
        if (!isSupabaseEnabled) {
            setSyncStatus('offline');
            return { success: false, reason: 'offline' };
        }
        // 캐릭터 미선택 상태에서 동기화 시 기본값으로 덮어씌우는 것 방지
        if (!selectedCharacter) return { success: false, reason: 'no_character' };
        setSyncStatus('syncing');
        try {
            const level = getLevel(userXp);
            const currentUser = await getCurrentUser();

            // 로그인 직후에는 복원 확인 전까지 빈 로컬 데이터 백업을 금지한다.
            if (currentUser && sessionStorage.getItem(`${RESTORE_READY_PREFIX}${currentUser.id}`) !== 'true') {
                setSyncStatus('idle');
                return { success: false, reason: 'restore_required' };
            }

            if (currentUser) {
                const internalResult = await syncInternalAccountData({
                    nickname: userNickname || t('ext_1484'),
                    characterType: selectedCharacter,
                    xp: userXp,
                    level,
                    streakCount: streak?.count || 0,
                    masteryData: hanjaData,
                    srsData: hanjaData,
                    wordData,
                    studyLog,
                    totalStats,
                });
                if (internalResult.supported) {
                    if (internalResult.error) throw internalResult.error;
                    await invalidateCloudBackupSnapshot(currentUser);
                    setSyncStatus('synced');
                    setLastSyncTime(new Date());
                    return { success: true };
                }
            }

            // 프로필 업데이트
            const { error: profileError } = await upsertUserProfile({
                nickname: userNickname || t('ext_1484'),
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
                wordData: wordData || {},
                studyLog: studyLog || { total: totalStats || {}, days: {} },
                totalStats: totalStats || {},
            });
            if (dataError && dataError !== 'offline') {
                console.warn('[CloudSync] Data backup failed:', dataError);
            }
            await invalidateCloudBackupSnapshot(currentUser);
            setSyncStatus('synced');
            setLastSyncTime(new Date());
            return { success: true };
        } catch (e) {
            console.warn('[CloudSync] Sync error:', e);
            setSyncStatus('error');
            return { success: false, reason: 'error', error: e };
        }
    }, [
        hanjaData,
        invalidateCloudBackupSnapshot,
        selectedCharacter,
        setLastSyncTime,
        setSyncStatus,
        streak,
        studyLog,
        t,
        totalStats,
        userNickname,
        userXp,
        wordData,
    ]);
};
