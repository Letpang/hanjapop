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
    getCurrentUser,
    fetchInternalAccountBackup,
    syncInternalAccountData,
    linkAuthToDevice,
} from '../lib/supabase.js';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5분
const RESTORE_READY_PREFIX = 'cloud_restore_ready_';
const LAST_DATA_PROVIDER_KEY = 'hanjapop_last_data_login_provider';

const getAuthProvider = (user) => (
    user?.app_metadata?.provider
    || user?.identities?.[0]?.provider
    || 'email'
);

const hasMeaningfulLocalData = () => {
    const xp = Number(localStorage.getItem(SK.USER_XP) || 0);
    const studyLog = readLocalObject('study_log');
    const mastery = readLocalObject('hanja_data');
    const wordData = readLocalObject('word_data');
    return (
        xp > 0
        || Object.keys(studyLog.days || {}).length > 0
        || Object.keys(mastery).length > 0
        || Object.keys(wordData).length > 0
    );
};

const hasMeaningfulCloudData = (profile, learningData) => (
    Number(profile?.xp || 0) > 0
    || Object.keys(learningData?.mastery_data || {}).length > 0
    || Object.keys(learningData?.word_wrong_data || {}).length > 0
    || Object.keys(learningData?.daily_study_log || {}).length > 0
    || Object.keys(learningData?.total_stats || {}).length > 0
    || Object.keys(learningData?.extra_progress || {}).length > 0
);

const readLocalObject = (key) => {
    try {
        const value = JSON.parse(localStorage.getItem(key) || '{}');
        return value && typeof value === 'object' ? value : {};
    } catch {
        return {};
    }
};

const mergeObjects = (localValue, cloudValue) => ({
    ...((localValue && typeof localValue === 'object') ? localValue : {}),
    ...((cloudValue && typeof cloudValue === 'object') ? cloudValue : {}),
});

const mergeNumericStats = (localValue, cloudValue) => {
    const merged = mergeObjects(localValue, cloudValue);
    for (const key of new Set([...Object.keys(localValue || {}), ...Object.keys(cloudValue || {})])) {
        if (typeof localValue?.[key] === 'number' && typeof cloudValue?.[key] === 'number') {
            merged[key] = Math.max(localValue[key], cloudValue[key]);
        }
    }
    return merged;
};

const pickFurthestCurriculum = (localValue, cloudValue) => {
    const local = localValue || {};
    const cloud = cloudValue || {};
    const localRound = Number(local.journeyRound || 1);
    const cloudRound = Number(cloud.journeyRound || 1);
    if (localRound !== cloudRound) return localRound > cloudRound ? local : cloud;
    return Number(local.completedDay || 0) > Number(cloud.completedDay || 0) ? local : cloud;
};

const pickFurthestGrade = (localGrade, cloudGrade) => {
    const order = ['8급', '7급II', '7급', '6급II', '6급'];
    const localIndex = order.indexOf(localGrade);
    const cloudIndex = order.indexOf(cloudGrade);
    return cloudIndex > localIndex ? cloudGrade : localGrade;
};

const restoreExtraProgress = (extra = {}) => {
    if (extra.mission_history) {
        localStorage.setItem(SK.MISSION_HISTORY, JSON.stringify(
            mergeObjects(readLocalObject(SK.MISSION_HISTORY), extra.mission_history)
        ));
    }
    if (extra.records) {
        localStorage.setItem(SK.RECORDS, JSON.stringify(
            mergeNumericStats(readLocalObject(SK.RECORDS), extra.records)
        ));
    }
    if (extra.unlocked_grade) {
        const grade = pickFurthestGrade(localStorage.getItem(SK.UNLOCKED_GRADE), extra.unlocked_grade);
        if (grade) localStorage.setItem(SK.UNLOCKED_GRADE, grade);
    }
    if (!localStorage.getItem(SK.START_GRADE) && extra.start_grade) {
        localStorage.setItem(SK.START_GRADE, extra.start_grade);
    }
    if (Array.isArray(extra.writing_completed)) {
        const local = readLocalObject('hanja_writing_completed');
        const merged = [...new Set([...(Array.isArray(local) ? local : []), ...extra.writing_completed])];
        localStorage.setItem('hanja_writing_completed', JSON.stringify(merged));
    }
    if (extra.idiom_wrong_data) {
        localStorage.setItem('idiom_wrong_data', JSON.stringify(
            mergeObjects(readLocalObject('idiom_wrong_data'), extra.idiom_wrong_data)
        ));
    }
    if (Number(extra.level_test_bonus) > Number(localStorage.getItem(SK.LEVEL_TEST_BONUS) || 0)) {
        localStorage.setItem(SK.LEVEL_TEST_BONUS, String(extra.level_test_bonus));
    }
    if (extra.level_test_daily) {
        localStorage.setItem(SK.LEVEL_TEST_DAILY, JSON.stringify(
            mergeObjects(readLocalObject(SK.LEVEL_TEST_DAILY), extra.level_test_daily)
        ));
    }
    if (extra.daily_missions && typeof extra.daily_missions === 'object') {
        Object.entries(extra.daily_missions).forEach(([key, value]) => {
            if (!key.startsWith('daily_missions_')) return;
            localStorage.setItem(key, JSON.stringify(value));
        });
    }
};

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
    const [leaderboard, setLeaderboard] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
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
                    nickname: userNickname,
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
                    setSyncStatus('synced');
                    setLastSyncTime(new Date());
                    return { success: true };
                }
            }

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
                wordData: wordData || {},
                studyLog: studyLog || { total: totalStats || {}, days: {} },
                totalStats: totalStats || {},
            });
            if (dataError && dataError !== 'offline') {
                console.warn('[CloudSync] Data backup failed:', dataError);
            }
            setSyncStatus('synced');
            setLastSyncTime(new Date());
            return { success: true };
        } catch (e) {
            console.warn('[CloudSync] Sync error:', e);
            setSyncStatus('error');
            return { success: false, reason: 'error', error: e };
        }
    }, [userXp, userNickname, selectedCharacter, streak, hanjaData, wordData, studyLog, totalStats]);

    /**
     * 클라우드에서 전체 프로필 복원
     * 복원 성공 시 { success: true } 반환 — 호출자가 페이지 리로드 처리
     */
    const restoreFromCloud = useCallback(async (isAuto = false) => {
        if (!isSupabaseEnabled) return { success: false };
        setIsRestoring(true);
        try {
            const currentUser = await getCurrentUser();
            let profile = null;
            let learningData = null;
            let legacyRecovery = null;

            // 계정 확인이 끝나기 전에는 이전 세션의 허용 플래그를 신뢰하지 않는다.
            if (currentUser) sessionStorage.removeItem(`${RESTORE_READY_PREFIX}${currentUser.id}`);

            if (currentUser) {
                const internalResult = await fetchInternalAccountBackup();
                if (internalResult.supported) {
                    if (internalResult.error) throw internalResult.error;
                    profile = internalResult.data?.profile || null;
                    learningData = internalResult.data?.learning_data || null;
                    legacyRecovery = internalResult.data?.legacy_recovery || null;
                } else {
                    const [profileResult, learningResult] = await Promise.all([
                        fetchUserProfile(),
                        restoreLearningData(),
                    ]);
                    if (profileResult.error || learningResult.error) {
                        throw profileResult.error || learningResult.error;
                    }
                    profile = profileResult.data;
                    learningData = learningResult.data;
                }
            } else {
                const [profileResult, learningResult] = await Promise.all([
                    fetchUserProfile(),
                    restoreLearningData(),
                ]);
                if (profileResult.error || learningResult.error) {
                    throw profileResult.error || learningResult.error;
                }
                profile = profileResult.data;
                learningData = learningResult.data;
            }

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

            const localXpStr = localStorage.getItem(SK.USER_XP);
            const localXp = localXpStr ? Number(localXpStr) || 0 : 0;

            if (!isAuto && profile && typeof profile.xp === 'number') {
                if (profile.xp < localXp - 100) {
                    const proceed = window.confirm(`⚠️ 주의: 클라우드 경험치(${profile.xp.toLocaleString()} XP)가 현재 기기(${localXp.toLocaleString()} XP)보다 낮습니다.\n복원하면 기기의 최신 학습 기록이 덮어씌워져 유실됩니다.\n그래도 복원하시겠습니까?`);
                    if (!proceed) {
                        setIsRestoring(false);
                        return { success: false, reason: 'cancelled' };
                    }
                }
            }
            if (profile) {
                if (profile.nickname)       localStorage.setItem(SK.USER_NICKNAME, profile.nickname);
                if (profile.character_type) localStorage.setItem(SK.SELECTED_CHARACTER, profile.character_type);
                if (typeof profile.streak_count === 'number') {
                    localStorage.setItem('streak_data', JSON.stringify({ count: profile.streak_count }));
                }
                if (typeof profile.xp === 'number') {
                    localStorage.setItem(SK.USER_XP, String(Math.max(localXp, profile.xp)));
                }
            }
            if (learningData) {
                if (learningData.mastery_data) {
                    localStorage.setItem('hanja_data', JSON.stringify(
                        mergeObjects(readLocalObject('hanja_data'), learningData.mastery_data)
                    ));
                }
                if (learningData.total_stats || learningData.daily_study_log) {
                    const localStudyLog = readLocalObject('study_log');
                    const localDays = localStudyLog.days || {};
                    const cloudDays = learningData.daily_study_log || {};
                    localStorage.setItem('study_log', JSON.stringify({
                        total: mergeNumericStats(localStudyLog.total || {}, learningData.total_stats || {}),
                        days: { ...localDays, ...cloudDays },
                    }));
                }
                if (learningData.curriculum_progress) {
                    localStorage.setItem('curriculum_progress', JSON.stringify(
                        pickFurthestCurriculum(readLocalObject('curriculum_progress'), learningData.curriculum_progress)
                    ));
                }
                if (learningData.word_wrong_data) {
                    localStorage.setItem('word_data', JSON.stringify(
                        mergeObjects(readLocalObject('word_data'), learningData.word_wrong_data)
                    ));
                }
                if (learningData.extra_progress) restoreExtraProgress(learningData.extra_progress);
            }
            localStorage.setItem(SK.ONBOARDING_DONE, 'true');
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
    }, []);

    const adoptLocalDataForCurrentAccount = useCallback(async () => {
        const currentUser = await getCurrentUser();
        if (!currentUser) return { success: false, reason: 'signed_out' };

        // 안전장치: 업로드 직전 클라우드를 다시 조회해 기존 데이터가 없는지 재확인한다.
        // 네트워크 오류 등으로 hasMeaningfulCloudData가 잘못 false를 반환했을 경우를 방어한다.
        try {
            let profile = null, learningData = null;
            const internalResult = await fetchInternalAccountBackup();
            if (internalResult.supported && !internalResult.error) {
                profile = internalResult.data?.profile || null;
                learningData = internalResult.data?.learning_data || null;
            } else if (!internalResult.supported) {
                const [p, l] = await Promise.all([fetchUserProfile(), restoreLearningData()]);
                profile = p.data;
                learningData = l.data;
            }
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
        localStorage.setItem(LAST_DATA_PROVIDER_KEY, getAuthProvider(currentUser));
        return { success: true };
    }, [syncToCloud]);

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
        adoptLocalDataForCurrentAccount,
        isRestoring,
        isOnline: isSupabaseEnabled,
        deviceId,
    };
};
