import React, { useState, useEffect, useCallback, useRef } from 'react';
import MainMenu from './components/MainMenu.jsx';
import FlashcardScreen from './components/FlashcardScreen.jsx';
import WritingScreen from './components/WritingScreen.jsx';
import MatchGameScreen from './components/MatchGameScreen.jsx';
import ShootGameScreen from './components/ShootGameScreen.jsx';
import StickerBookScreen from './components/StickerBookScreen.jsx';
import SentenceQuizScreen from './components/SentenceQuizScreen.jsx';
import RankingsScreen from './components/RankingsScreen.jsx';
import { LangProvider } from './LangContext.jsx';
import { useAdMob } from './hooks/useAdMob.js';
import { useVersionCheck } from './hooks/useVersionCheck.js';
import { useDailyMission } from './hooks/useDailyMission.js';
import { useMastery } from './hooks/useMastery.js';

const App = () => {
    const [currentScreen, setCurrentScreen] = useState('main');
    const [userXp, setUserXp] = useState(() => {
        try { return Number(localStorage.getItem('user_xp')) || 0; } catch(e) { return 0; }
    });
    const [unlockedStickers, setUnlockedStickers] = useState(() => {
        try {
            const saved = localStorage.getItem('unlocked_stickers');
            return saved ? JSON.parse(saved) : {};
        } catch(e) { return {}; }
    });
    const [isDarkMode, setIsDarkMode] = useState(() => {
        try { return localStorage.getItem('dark_mode') === 'true'; } catch(e) { return false; }
    });
    const [selectedCharacter, setSelectedCharacter] = useState(() => {
        try { return localStorage.getItem('selected_character') || 'eunha'; } catch(e) { return 'eunha'; }
    });
    const [unlockedCharacters, setUnlockedCharacters] = useState(() => {
        try {
            const saved = localStorage.getItem('unlocked_characters');
            return saved ? JSON.parse(saved) : ['eunha', 'uju'];
        } catch(e) { return ['eunha', 'uju']; }
    });

    // Persistence
    useEffect(() => { localStorage.setItem('user_xp', userXp); }, [userXp]);
    useEffect(() => { localStorage.setItem('unlocked_stickers', JSON.stringify(unlockedStickers)); }, [unlockedStickers]);
    useEffect(() => { localStorage.setItem('dark_mode', isDarkMode); }, [isDarkMode]);
    useEffect(() => { localStorage.setItem('selected_character', selectedCharacter); }, [selectedCharacter]);
    useEffect(() => { localStorage.setItem('unlocked_characters', JSON.stringify(unlockedCharacters)); }, [unlockedCharacters]);

    // Wake Lock for learning sessions
    useEffect(() => {
        if ('wakeLock' in navigator) {
            let wakeLock = null;
            const requestWakeLock = async () => {
                try { wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {}
            };
            requestWakeLock();
            return () => { if (wakeLock) wakeLock.release(); };
        }
    }, []);

    // Hooks for Mobile readiness
    const { showBanner, showInterstitial } = useAdMob();
    useVersionCheck();

    useEffect(() => {
        if (isDarkMode) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
    }, [isDarkMode]);

    const { missions, streak, allDone, doneCount, updateMissionProgress } = useDailyMission();
    const { mastery, markSeen, markCorrect, markWrong, getStats, getMasteryLevel } = useMastery();

    const handleHanjaAcquired = (id, xpAmount = 10) => {
        setUserXp(prev => {
            const newXp = prev + xpAmount;
            if (newXp >= 1000 && !unlockedCharacters.includes('lv5_injeolmi')) {
                setUnlockedCharacters(current => [...current, 'lv5_injeolmi', 'lv5_garaetteok', 'lv5_chapssaltteok']);
            }
            return newXp;
        });

        if (id) {
            setUnlockedStickers(prev => ({
                ...prev,
                [id]: (prev[id] || 0) + 1
            }));
        }
    };

    const renderScreen = () => {
        switch (currentScreen) {
            case 'main':
                return (
                    <MainMenu 
                        onNavigate={setCurrentScreen} 
                        unlockedStickers={unlockedStickers}
                        userXp={userXp}
                        isDarkMode={isDarkMode}
                        setIsDarkMode={setIsDarkMode}
                        selectedCharacter={selectedCharacter}
                        setSelectedCharacter={setSelectedCharacter}
                        unlockedCharacters={unlockedCharacters}
                        missions={missions}
                        streak={streak}
                        allDone={allDone}
                        doneCount={doneCount}
                        getStats={getStats}
                    />
                );
            case 'flashcard':
                return <FlashcardScreen onBack={() => setCurrentScreen('main')} onStageClear={() => { handleHanjaAcquired(null, 50); updateMissionProgress('flashcard', 5); }} onCardFlip={(id) => { updateMissionProgress('flashcard', 1); if (id) markSeen(id); }} />;
            case 'writing':
                return <WritingScreen onBack={() => setCurrentScreen('main')} />;
            case 'matchGame':
                return <MatchGameScreen onBack={() => setCurrentScreen('main')} onHanjaAcquired={(id, xp) => { handleHanjaAcquired(id, xp); if (id) markCorrect(id); }} onStageClear={() => { handleHanjaAcquired(null, 100); updateMissionProgress('matchGame', 1); }} />;
            case 'shootGame':
                return <ShootGameScreen onBack={() => setCurrentScreen('main')} onHanjaAcquired={(id, xp) => { handleHanjaAcquired(id, xp); updateMissionProgress('shootGame', 1); }} selectedCharacter={selectedCharacter} onWaveClear={() => updateMissionProgress('shootGame_wave', 1)} />;
            case 'stickerBook':
                return <StickerBookScreen onBack={() => setCurrentScreen('main')} unlockedStickers={unlockedStickers} />;
            case 'sentenceQuiz':
                return <SentenceQuizScreen onBack={() => setCurrentScreen('main')} onHanjaAcquired={(id, xp) => { handleHanjaAcquired(id, xp); updateMissionProgress('sentenceQuiz', 1); }} />;
            case 'rankings':
                return <RankingsScreen onBack={() => setCurrentScreen('main')} userXp={userXp} selectedCharacter={selectedCharacter} />;
            default:
                return <MainMenu onNavigate={setCurrentScreen} />;
        }
    };

    const getLevel = (xp) => {
        if (xp < 100) return 1;
        if (xp < 300) return 2;
        if (xp < 600) return 3;
        if (xp < 1000) return 4;
        return 5;
    };
    const currentLevel = getLevel(userXp);

    return (
        <LangProvider>
            <div 
                className={`app-container ${isDarkMode ? 'dark-mode' : ''} transition-colors duration-500`}
                data-level={currentLevel}
            >
                <div className="space-bg"></div>
                <div className="stars-overlay"></div>
                <div className="content-area relative z-10">
                    {renderScreen()}
                </div>
            </div>
        </LangProvider>
    );
};

export default App;
