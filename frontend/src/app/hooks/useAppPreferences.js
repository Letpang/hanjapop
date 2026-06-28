import { useEffect, useState } from 'react';
import { SK } from '../../constants/storageKeys.js';
import { getTodayStr, isSessionDoneToday } from '../../utils/sessionUtils.js';

const VALID_CHARACTERS = ['garae', 'jeolmi', 'chapssal', 'muzi'];

export function useAppPreferences() {
    const [onboardingDone, setOnboardingDone] = useState(() => {
        try { return localStorage.getItem(SK.ONBOARDING_DONE) === 'true'; } catch { return false; }
    });
    const [userXp, setUserXp] = useState(() => {
        try { return Number(localStorage.getItem(SK.USER_XP)) || 0; } catch { return 0; }
    });
    const [isDarkMode, setIsDarkMode] = useState(() => {
        try { return localStorage.getItem(SK.DARK_MODE) === 'true'; } catch { return false; }
    });
    const [selectedCharacter, setSelectedCharacter] = useState(() => {
        try {
            const saved = localStorage.getItem(SK.SELECTED_CHARACTER);
            return VALID_CHARACTERS.includes(saved) ? saved : null;
        } catch {
            return null;
        }
    });
    const [userNickname, setUserNickname] = useState(() => {
        try { return localStorage.getItem(SK.USER_NICKNAME) || ''; } catch { return ''; }
    });
    const [sessionDoneToday, setSessionDoneToday] = useState(() => isSessionDoneToday());

    useEffect(() => {
        try {
            localStorage.setItem(SK.DAILY_SESSION, JSON.stringify({ date: getTodayStr(), done: sessionDoneToday }));
        } catch {}
    }, [sessionDoneToday]);

    useEffect(() => { localStorage.setItem(SK.USER_XP, userXp); }, [userXp]);
    useEffect(() => { localStorage.setItem(SK.DARK_MODE, isDarkMode); }, [isDarkMode]);
    useEffect(() => { if (selectedCharacter) localStorage.setItem(SK.SELECTED_CHARACTER, selectedCharacter); }, [selectedCharacter]);
    useEffect(() => { if (userNickname) localStorage.setItem(SK.USER_NICKNAME, userNickname); }, [userNickname]);

    useEffect(() => {
        if (isDarkMode) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
    }, [isDarkMode]);

    return {
        onboardingDone,
        setOnboardingDone,
        userXp,
        setUserXp,
        isDarkMode,
        setIsDarkMode,
        selectedCharacter,
        setSelectedCharacter,
        userNickname,
        setUserNickname,
        sessionDoneToday,
        setSessionDoneToday,
    };
}
