import React, { useState, useEffect, useCallback, useRef } from 'react';
import MainMenu from './components/MainMenu.jsx';
import OnboardingScreen from './components/OnboardingScreen.jsx';
import FlashcardScreen from './components/FlashcardScreen.jsx';
import WritingScreen from './components/WritingScreen.jsx';
import MatchGameScreen from './components/MatchGameScreen.jsx';
import ShootGameScreen from './components/ShootGameScreen.jsx';
import StickerBookScreen from './components/StickerBookScreen.jsx';
import ReviewScreen from './components/ReviewScreen.jsx';
import SentenceQuizScreen from './components/SentenceQuizScreen.jsx';
import WordQuizScreen from './components/WordQuizScreen.jsx';
import RankingsScreen from './components/RankingsScreen.jsx';
import CharacterSelectionScreen from './components/CharacterSelectionScreen.jsx';
import { LangProvider } from './LangContext.jsx';
import { useAdMob } from './hooks/useAdMob.js';
import { useVersionCheck } from './hooks/useVersionCheck.js';
import { useDailyMission } from './hooks/useDailyMission.js';
import { useMastery } from './hooks/useMastery.js';
import { useTotalStats } from './hooks/useTotalStats.js';

const App = () => {
    // 온보딩 완료 여부
    const [onboardingDone, setOnboardingDone] = useState(() => {
        try { return localStorage.getItem('onboarding_done') === 'true'; } catch(e) { return false; }
    });
    const [currentScreen, setCurrentScreen] = useState('main');
    // 한자 카드에서 쓰기로 직접 진입할 때 사용
    const [writeTargetHanja, setWriteTargetHanja] = useState(null);
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
        try { 
            const saved = localStorage.getItem('selected_character');
            if (saved === 'eunha' || saved === 'uju') return null;
            return saved || null; 
        } catch(e) { return null; }
    });

    // Persistence
    useEffect(() => { localStorage.setItem('user_xp', userXp); }, [userXp]);
    useEffect(() => { localStorage.setItem('unlocked_stickers', JSON.stringify(unlockedStickers)); }, [unlockedStickers]);
    useEffect(() => { localStorage.setItem('dark_mode', isDarkMode); }, [isDarkMode]);
    useEffect(() => { if (selectedCharacter) localStorage.setItem('selected_character', selectedCharacter); }, [selectedCharacter]);

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

    // 오늘 활동 통계 (CoachCard용)
    const [todayStats, setTodayStats] = useState(() => {
        try {
            const saved = localStorage.getItem('today_stats');
            const today = new Date().toDateString();
            const parsed = saved ? JSON.parse(saved) : null;
            if (parsed && parsed.date === today) return parsed;
            return { date: today, flashcard: 0, writing: 0, matchGame: 0, shootGame: 0, sentenceQuiz: 0, wordQuiz: 0 };
        } catch(e) { return { date: new Date().toDateString(), flashcard: 0, writing: 0, matchGame: 0, shootGame: 0, sentenceQuiz: 0, wordQuiz: 0 }; }
    });
    const addTodayStat = useCallback((type) => {
        setTodayStats(prev => {
            const updated = { ...prev, [type]: (prev[type] || 0) + 1 };
            localStorage.setItem('today_stats', JSON.stringify(updated));
            return updated;
        });
    }, []);
    const { mastery, markSeen, markCorrect, markWrong, getStats, getMasteryLevel } = useMastery();
    const { totalStats, increment } = useTotalStats();

    // 미션 보너스 XP를 userXp에 실제로 반영하는 헬퍼
    const addBonusXp = useCallback((xp) => {
        if (!xp || xp <= 0) return;
        setUserXp(prev => prev + xp);
    }, []);

    const handleHanjaAcquired = (id, xpAmount = 10) => {
        setUserXp(prev => prev + xpAmount);

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
                        missions={missions}
                        streak={streak}
                        allDone={allDone}
                        doneCount={doneCount}
                        getStats={getStats}
                        mastery={mastery}
                        todayStats={todayStats}
                        totalStats={totalStats}
                        streak={streak}
                    />
                );
            case 'flashcard':
                return <FlashcardScreen
                    onBack={() => setCurrentScreen('main')}
                    onStageClear={() => { handleHanjaAcquired(null, 50); updateMissionProgress('flashcard', 5, addBonusXp); }}
                    onCardFlip={(id) => { updateMissionProgress('flashcard', 1, addBonusXp); addTodayStat('flashcard'); if (id) markSeen(id); }}
                    onWriteHanja={(hanja) => {
                        setWriteTargetHanja(hanja);
                        setCurrentScreen('writing');
                    }}
                />;
            case 'writing':
                return <WritingScreen
                    onBack={() => {
                        // 카드에서 진입했으면 카드화면으로, 아니면 메인으로
                        if (writeTargetHanja) {
                            setWriteTargetHanja(null);
                            setCurrentScreen('flashcard');
                        } else {
                            setCurrentScreen('main');
                        }
                    }}
                    onWritingComplete={(id) => {
                        updateMissionProgress('writing', 1, addBonusXp);
                        addTodayStat('writing');
                        increment('writing');
                        if (id) markSeen(id);
                    }}
                    initialHanja={writeTargetHanja}
                />;
            case 'matchGame':
                return <MatchGameScreen
                    onBack={() => setCurrentScreen('main')}
                    onHanjaAcquired={handleHanjaAcquired}
                    onStageClear={() => { handleHanjaAcquired(null, 100); updateMissionProgress('matchGame', 1, addBonusXp); addTodayStat('matchGame'); increment('matchGame'); }}
                    onMarkCorrect={markCorrect}
                    onMarkWrong={markWrong}
                />;
            case 'shootGame':
                return <ShootGameScreen
                    onBack={() => setCurrentScreen('main')}
                    onHanjaAcquired={handleHanjaAcquired}
                    selectedCharacter={selectedCharacter}
                    onWaveClear={() => { updateMissionProgress('shootGame_wave', 1, addBonusXp); increment('shootGame'); }}
                    onMarkWrong={markWrong}
                />;
            case 'stickerBook':
                return <StickerBookScreen onBack={() => setCurrentScreen('main')} unlockedStickers={unlockedStickers} />;
            case 'review':
                return <ReviewScreen
                    onBack={() => setCurrentScreen('main')}
                    mastery={mastery}
                    markCorrect={markCorrect}
                    markWrong={markWrong}
                    getStats={getStats}
                />;
            case 'sentenceQuiz':
                return <SentenceQuizScreen
                    onBack={() => setCurrentScreen('main')}
                    onHanjaAcquired={(id, xp) => { handleHanjaAcquired(id, xp); updateMissionProgress('sentenceQuiz', 1, addBonusXp); addTodayStat('sentenceQuiz'); increment('sentenceQuiz'); }}
                    onMarkCorrect={markCorrect}
                    onMarkWrong={markWrong}
                />;
            case 'wordQuiz':
                return <WordQuizScreen
                    onBack={() => setCurrentScreen('main')}
                    onHanjaAcquired={(id, xp) => { handleHanjaAcquired(id, xp); updateMissionProgress('wordQuiz', 1, addBonusXp); addTodayStat('wordQuiz'); increment('wordQuiz'); }}
                    onWordCorrect={() => increment('wordCorrect')}
                    onMarkCorrect={markCorrect}
                    onMarkWrong={markWrong}
                />;
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
                    {!onboardingDone
                        ? <OnboardingScreen onComplete={(grade) => {
                            setOnboardingDone(true);
                          }}
                          />
                        : !selectedCharacter
                            ? <CharacterSelectionScreen onSelect={(id) => setSelectedCharacter(id)} />
                            : renderScreen()
                    }
                </div>
            </div>
        </LangProvider>
    );
};

export default App;
