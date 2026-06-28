import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    fetchInternalAccountBackup,
    fetchUserProfile,
    restoreLearningData,
} from '../lib/supabase.js';

const CLOUD_BACKUP_STALE_MS = 30 * 1000;

const fetchLegacyCloudBackupSnapshot = async () => {
    const [profileResult, learningResult] = await Promise.all([
        fetchUserProfile(),
        restoreLearningData(),
    ]);
    if (profileResult.error || learningResult.error) {
        throw profileResult.error || learningResult.error;
    }
    return {
        profile: profileResult.data,
        learningData: learningResult.data,
        legacyRecovery: null,
    };
};

const fetchCloudBackupSnapshot = async (currentUser) => {
    if (currentUser) {
        const internalResult = await fetchInternalAccountBackup();
        if (internalResult.supported) {
            if (internalResult.error) throw internalResult.error;
            return {
                profile: internalResult.data?.profile || null,
                learningData: internalResult.data?.learning_data || null,
                legacyRecovery: internalResult.data?.legacy_recovery || null,
            };
        }
    }
    return fetchLegacyCloudBackupSnapshot();
};

export const useCloudBackupCache = (deviceId) => {
    const queryClient = useQueryClient();

    const getCloudBackupQueryKey = useCallback((currentUser) => [
        'cloud-backup',
        currentUser?.id || deviceId,
    ], [deviceId]);

    const fetchCachedCloudBackupSnapshot = useCallback((currentUser) => (
        queryClient.fetchQuery({
            queryKey: getCloudBackupQueryKey(currentUser),
            queryFn: () => fetchCloudBackupSnapshot(currentUser),
            staleTime: CLOUD_BACKUP_STALE_MS,
        })
    ), [getCloudBackupQueryKey, queryClient]);

    const fetchFreshCloudBackupSnapshot = useCallback(async (currentUser) => {
        const queryKey = getCloudBackupQueryKey(currentUser);
        await queryClient.invalidateQueries({ queryKey });
        return queryClient.fetchQuery({
            queryKey,
            queryFn: () => fetchCloudBackupSnapshot(currentUser),
            staleTime: 0,
        });
    }, [getCloudBackupQueryKey, queryClient]);

    const invalidateCloudBackupSnapshot = useCallback((currentUser) => (
        queryClient.invalidateQueries({
            queryKey: getCloudBackupQueryKey(currentUser),
        })
    ), [getCloudBackupQueryKey, queryClient]);

    return {
        fetchCachedCloudBackupSnapshot,
        fetchFreshCloudBackupSnapshot,
        invalidateCloudBackupSnapshot,
    };
};
