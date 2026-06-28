import { useCallback } from 'react';
import { useLang } from './useLang.js';
import {
    getCurrentUser,
    isSupabaseEnabled,
    linkAuthToDevice,
} from '../lib/supabase.js';
import {
    getAuthProvider,
    getLocalXp,
    hasMeaningfulCloudData,
    hasMeaningfulLocalData,
    restoreCloudSnapshotToLocalStorage,
} from './cloudSyncStorage.js';
import {
    LAST_DATA_PROVIDER_KEY,
    RESTORE_READY_PREFIX,
} from './cloudSyncConstants.js';

export const useCloudRestoreActions = ({
    fetchCachedCloudBackupSnapshot,
    fetchFreshCloudBackupSnapshot,
    invalidateCloudBackupSnapshot,
    setIsRestoring,
    syncToCloud,
}) => {
    const { t } = useLang();

    const restoreFromCloud = useCallback(async (isAuto = false) => {
        if (!isSupabaseEnabled) return { success: false };
        setIsRestoring(true);
        try {
            const currentUser = await getCurrentUser();

            // 계정 확인이 끝나기 전에는 이전 세션의 허용 플래그를 신뢰하지 않는다.
            if (currentUser) sessionStorage.removeItem(`${RESTORE_READY_PREFIX}${currentUser.id}`);

            const {
                profile,
                learningData,
                legacyRecovery,
            } = await fetchCachedCloudBackupSnapshot(currentUser);

            const currentProvider = getAuthProvider(currentUser);
            const previousProvider = localStorage.getItem(LAST_DATA_PROVIDER_KEY);
            const cloudHasData = hasMeaningfulCloudData(profile, learningData);

            if (currentUser && !cloudHasData && hasMeaningfulLocalData()) {
                setIsRestoring(false);
                return {
                    success: false,
                    reason: 'account_choice_required',
                    currentProvider,
                    previousProvider: previousProvider && previousProvider !== currentProvider
                        ? previousProvider
                        : null,
                };
            }

            if (!profile && !learningData) {
                if (currentUser) sessionStorage.setItem(`${RESTORE_READY_PREFIX}${currentUser.id}`, 'true');
                setIsRestoring(false);
                return { success: false, reason: 'not_found' };
            }

            const localXp = getLocalXp();

            if (!isAuto && profile && typeof profile.xp === 'number') {
                if (profile.xp < localXp - 100) {
                    const proceed = window.confirm(t('ext_3088', {
                        cloudXp: profile.xp.toLocaleString(),
                        localXp: localXp.toLocaleString(),
                    }));
                    if (!proceed) {
                        setIsRestoring(false);
                        return { success: false, reason: 'cancelled' };
                    }
                }
            }
            restoreCloudSnapshotToLocalStorage({ learningData, localXp, profile });
            if (currentUser) {
                sessionStorage.setItem(`${RESTORE_READY_PREFIX}${currentUser.id}`, 'true');
                if (cloudHasData) localStorage.setItem(LAST_DATA_PROVIDER_KEY, currentProvider);
            }
            setIsRestoring(false);
            return { success: true, legacyRecovery };
        } catch (error) {
            console.warn('[CloudSync] Restore failed:', error);
            setIsRestoring(false);
            return { success: false, reason: 'error', error };
        }
    }, [fetchCachedCloudBackupSnapshot, setIsRestoring, t]);

    const adoptLocalDataForCurrentAccount = useCallback(async () => {
        const currentUser = await getCurrentUser();
        if (!currentUser) return { success: false, reason: 'signed_out' };

        // 안전장치: 업로드 직전 클라우드를 다시 조회해 기존 데이터가 없는지 재확인한다.
        // 네트워크 오류 등으로 hasMeaningfulCloudData가 잘못 false를 반환했을 경우를 방어한다.
        try {
            const { profile, learningData } = await fetchFreshCloudBackupSnapshot(currentUser);
            if (hasMeaningfulCloudData(profile, learningData)) {
                // 예상치 못하게 클라우드에 데이터가 있음 → 업로드 중단
                return { success: false, reason: 'cloud_has_data' };
            }
        } catch {
            // 재확인 실패 시 안전하게 중단
            return { success: false, reason: 'recheck_failed' };
        }

        await linkAuthToDevice(currentUser.id);
        sessionStorage.setItem(`${RESTORE_READY_PREFIX}${currentUser.id}`, 'true');
        const syncResult = await syncToCloud();
        if (!syncResult?.success) return syncResult;
        await invalidateCloudBackupSnapshot(currentUser);
        localStorage.setItem(LAST_DATA_PROVIDER_KEY, getAuthProvider(currentUser));
        return { success: true };
    }, [fetchFreshCloudBackupSnapshot, invalidateCloudBackupSnapshot, syncToCloud]);

    return {
        adoptLocalDataForCurrentAccount,
        restoreFromCloud,
    };
};
