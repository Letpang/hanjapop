import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { canAccessStage } from '../../utils/premiumAccess.js';
import { getLevel, levelToImageRank } from '../../utils/rankUtils.js';
import { isInRankSoonZone, RANK_SOON_KEY } from '../appConstants.js';

export function useCharacterToasts({
    allDone,
    currentDay,
    currentScreen,
    hanjaData,
    selectedCharacter,
    sessionDoneToday,
    unlockedPack,
    userXp,
    wordData,
}) {
    const [charToast, setCharToast] = useState(null);
    const [showRankUpModal, setShowRankUpModal] = useState(false);
    const missionToastShownRef = useRef(false);
    const prevXpRef = useRef(userXp);

    const dismissToast = useCallback(() => setCharToast(null), []);

    useEffect(() => {
        const prevXp = prevXpRef.current;
        prevXpRef.current = userXp;
        if (userXp <= prevXp) return;

        const oldRank = levelToImageRank(getLevel(prevXp));
        const newRank = levelToImageRank(getLevel(userXp));
        if (newRank > oldRank) setShowRankUpModal(true);
    }, [userXp]);

    const nextRankAvatar = useMemo(() => {
        const currentRank = levelToImageRank(getLevel(userXp));
        const nextRank = Math.min(currentRank + 1, 5);
        return selectedCharacter ? `/assets/images/characters/${selectedCharacter}/rank_${nextRank}.webp` : null;
    }, [selectedCharacter, userXp]);

    useEffect(() => {
        if (currentScreen !== 'main' || !selectedCharacter) return undefined;
        if (!sessionDoneToday && canAccessStage(unlockedPack, currentDay)) return undefined;

        const hanjaWrongCount = Object.values(hanjaData).filter(m => (m.wrongCount || 0) > 0).length;
        const wordWrongCount = Object.values(wordData).filter(v => (v.wrongCount || 0) > 0).length;
        const currentWrongCount = hanjaWrongCount + wordWrongCount;
        const timers = [];

        try {
            const lastNotified = Number(localStorage.getItem('last_notified_wrong_count')) || 0;
            if (currentWrongCount < lastNotified) {
                localStorage.setItem('last_notified_wrong_count', String(currentWrongCount));
            }

            let baseDelay = 800;
            let showedReview = false;
            if (currentWrongCount >= 5 && currentWrongCount > lastNotified) {
                timers.push(setTimeout(() => {
                    setCharToast('review_reminder');
                    localStorage.setItem('last_notified_wrong_count', String(currentWrongCount));
                }, baseDelay));
                showedReview = true;
                baseDelay += 5500;
            }

            const today = new Date().toDateString();
            const lastShown = localStorage.getItem(RANK_SOON_KEY);
            if (lastShown !== today) {
                timers.push(setTimeout(() => {
                    setCharToast('rank_soon');
                    localStorage.setItem(RANK_SOON_KEY, today);
                }, showedReview ? baseDelay : 1200));
            }
        } catch {
            // ignore
        }

        return () => timers.forEach(clearTimeout);
    }, [currentDay, currentScreen, hanjaData, selectedCharacter, sessionDoneToday, unlockedPack, wordData]);

    const checkAndShowMissionToast = useCallback(() => {
        if (!allDone || missionToastShownRef.current) return;
        missionToastShownRef.current = true;
        setCharToast('mission_complete');
    }, [allDone]);

    useEffect(() => {
        if (currentScreen === 'main') checkAndShowMissionToast();
    }, [checkAndShowMissionToast, currentScreen]);

    return {
        charToast,
        checkAndShowMissionToast,
        dismissToast,
        isInRankSoonZone,
        nextRankAvatar,
        setCharToast,
        setShowRankUpModal,
        showRankUpModal,
    };
}
