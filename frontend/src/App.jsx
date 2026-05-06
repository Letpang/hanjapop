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
import CombinedQuizScreen from './components/CombinedQuizScreen.jsx';
import LevelTestScreen from './components/LevelTestScreen.jsx';
import RankingsScreen from './components/RankingsScreen.jsx';
import CharacterSelectionScreen from './components/CharacterSelectionScreen.jsx';
import CharacterProfileScreen from './components/CharacterProfileScreen.jsx';
import { LangProvider } from './LangContext.jsx';
import { getLevel } from './utils/rankUtils.js';
import { useAdMob } from './hooks/useAdMob.js';
import { useVersionCheck } from './hooks/useVersionCheck.js';
import { useDailyMission } from './hooks/useDailyMission.js';
import { useMastery } from './hooks/useMastery.js';
import { useTotalStats } from './hooks/useTotalStats.js';
import { useSRS } from './hooks/useSRS.js';
import { useCloudSync } from './hooks/useCloudSync.js';

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
            const VALID = ['garae', 'jeolmi', 'chapssal'];
            return VALID.includes(saved) ? saved : null;
        } catch(e) { return null; }
    });
    const [userNickname, setUserNickname] = useState(() => {
        try { return localStorage.getItem('user_nickname') || ''; } catch(e) { return ''; }
    });

    // Persistence
    useEffect(() => { localStorage.setItem('user_xp', userXp); }, [userXp]);
    useEffect(() => { localStorage.setItem('unlocked_stickers', JSON.stringify(unlockedStickers)); }, [unlockedStickers]);
    useEffect(() => { localStorage.setItem('dark_mode', isDarkMode); }, [isDarkMode]);
    useEffect(() => { if (selectedCharacter) localStorage.setItem('selected_character', selectedCharacter); }, [selectedCharacter]);
    useEffect(() => { if (userNickname) localStorage.setItem('user_nickname', userNickname); }, [userNickname]);

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
    const { srsData, markCorrect: srsMarkCorrect, markWrong: srsMarkWrong, getDueItems, getWeightedPool, getStats: getSrsStats } = useSRS();
    const { syncStatus, leaderboard, myRank, syncToCloud } = useCloudSync({
        userXp, userNickname, selectedCharacter, streak,
        mastery, srsData, totalStats, unlockedStickers,
    });

    // 미션 보너스 XP를 userXp에 실제로 반영하는 헬퍼
    const addBonusXp = useCallback((xp) => {
        if (!xp || xp <= 0) return;
        // 스트릭 XP 배율 적용: 3~6일 1.2배, 7일+ 1.5배
        const streakCount = streak?.count || 0;
        const multiplier = streakCount >= 7 ? 1.5 : streakCount >= 3 ? 1.2 : 1.0;
        const finalXp = Math.round(xp * multiplier);
        setUserXp(prev => prev + finalXp);
    }, [streak]);

    const handleHanjaAcquired = (id, xpAmount = 10) => {
        // 스트릭 XP 배율 적용: 3~6일 1.2배, 7일+ 1.5배
        const streakCount = streak?.count || 0;
        const multiplier = streakCount >= 7 ? 1.5 : streakCount >= 3 ? 1.2 : 1.0;
        const finalXp = Math.round(xpAmount * multiplier);
        setUserXp(prev => prev + finalXp);
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
                        userNickname={userNickname}
                        missions={missions}
                        streak={streak}
                        allDone={allDone}
                        doneCount={doneCount}
                        getStats={getStats}
                        mastery={mastery}
                        todayStats={todayStats}
                        totalStats={totalStats}
                        srsData={srsData}
                        getDueItems={getDueItems}
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
                    onMarkWrong={(id) => { markWrong(id); srsMarkWrong(id); }}
                    srsWeightedPool={getWeightedPool}
                />;
            case 'stickerBook':
                return <StickerBookScreen onBack={() => setCurrentScreen('main')} unlockedStickers={unlockedStickers} />;
            case 'review':
                return <ReviewScreen
                    onBack={() => setCurrentScreen('main')}
                    mastery={mastery}
                    markCorrect={(id) => { markCorrect(id); srsMarkCorrect(id); }}
                    markWrong={(id) => { markWrong(id); srsMarkWrong(id); }}
                    getStats={getStats}
                    srsData={srsData}
                    getDueItems={getDueItems}
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
            case 'combinedQuiz':
                return <CombinedQuizScreen
                    onBack={() => setCurrentScreen('main')}
                    onHanjaAcquired={(id, xp) => { handleHanjaAcquired(id, xp); updateMissionProgress('wordQuiz', 1, addBonusXp); updateMissionProgress('sentenceQuiz', 1, addBonusXp); addTodayStat('wordQuiz'); increment('wordQuiz'); }}
                    onWordCorrect={() => increment('wordCorrect')}
                    onMarkCorrect={markCorrect}
                    onMarkWrong={markWrong}
                />;
            case 'levelTest':
                return <LevelTestScreen onBack={() => setCurrentScreen('main')} />;
            case 'profile':
                return <CharacterProfileScreen
                    onBack={() => setCurrentScreen('main')}
                    onNavigate={setCurrentScreen}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
                    userNickname={userNickname}
                    mastery={mastery}
                    totalStats={totalStats}
                    streak={streak}
                />;
            case 'rankings':
                return <RankingsScreen
                    onBack={() => setCurrentScreen('main')}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
                    userNickname={userNickname}
                    cloudLeaderboard={leaderboard}
                    cloudMyRank={myRank}
                />;
            default:
                return <MainMenu onNavigate={setCurrentScreen} />;
        }
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
                            const onboardingXpMap = { '8급': 50, '7급': 100, '6급': 200 };
                            handleHanjaAcquired(null, onboardingXpMap[grade] || 50);
                          }}
                          />
                        : !selectedCharacter
                            ? <CharacterSelectionScreen 
                                onSelect={(id, nick) => { setSelectedCharacter(id); setUserNickname(nick); }} 
                                onBack={() => {
                                    localStorage.removeItem('onboarding_done');
                                    setOnboardingDone(false);
                                }}
                              />
                            : renderScreen()
                    }
                </div>
            </div>
        </LangProvider>
    );
};

export default App;
