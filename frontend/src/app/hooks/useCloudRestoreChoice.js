import { useCallback, useEffect, useState } from 'react';
import { SK } from '../../constants/storageKeys.js';
import { useCloudSync } from '../../hooks/useCloudSync.js';

export function useCloudRestoreChoice({
    authLoading,
    authSignOut,
    hanjaData,
    selectedCharacter,
    signInWithApple,
    signInWithGoogle,
    signInWithKakao,
    streak,
    studyLog,
    totalStats,
    user,
    userNickname,
    userXp,
    wordData,
    onShowLogin,
}) {
    const [accountDataChoice, setAccountDataChoice] = useState(null);
    const [accountChoiceBusy, setAccountChoiceBusy] = useState(false);
    const { restoreFromCloud, isRestoring } = useCloudSync({
        userXp,
        userNickname,
        selectedCharacter,
        streak,
        hanjaData,
        wordData,
        studyLog,
        totalStats,
    });

    useEffect(() => {
        if (authLoading || !user || !restoreFromCloud) return;

        const restoreKey = `cloud_restore_attempted_full_progress_v2_${user.id}`;
        if (sessionStorage.getItem(restoreKey)) return;

        sessionStorage.setItem(restoreKey, 'true');
        restoreFromCloud(true).then(({ success, reason, previousProvider, currentProvider }) => {
            if (success) {
                window.location.reload();
            } else if (reason === 'account_choice_required') {
                const localXp = Number(localStorage.getItem(SK.USER_XP) || 0);
                setAccountDataChoice({ previousProvider, currentProvider, localXp });
            } else if (reason === 'error') {
                sessionStorage.removeItem(restoreKey);
            }
        });
    }, [authLoading, restoreFromCloud, user]);

    const handleUsePreviousLogin = useCallback(async () => {
        if (!accountDataChoice?.previousProvider || accountChoiceBusy) return;

        setAccountChoiceBusy(true);
        const provider = accountDataChoice.previousProvider;
        try {
            await authSignOut();
            setAccountDataChoice(null);
            if (provider === 'kakao') await signInWithKakao();
            else if (provider === 'google') await signInWithGoogle();
            else if (provider === 'apple') await signInWithApple();
            else onShowLogin();
        } finally {
            setAccountChoiceBusy(false);
        }
    }, [
        accountChoiceBusy,
        accountDataChoice,
        authSignOut,
        onShowLogin,
        signInWithApple,
        signInWithGoogle,
        signInWithKakao,
    ]);

    const handleContinueWithoutLink = useCallback(() => {
        setAccountDataChoice(null);
    }, []);

    return {
        accountChoiceBusy,
        accountDataChoice,
        handleContinueWithoutLink,
        handleUsePreviousLogin,
        isRestoring,
        restoreFromCloud,
    };
}
