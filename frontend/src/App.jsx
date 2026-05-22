import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import HANJA_DATA from './hanja_unified.json';
import DAILY_CURRICULUM from './data/dailyCurriculum.js';
import { buildUnifiedPool, buildOopsPool } from './utils/learningPool.js';
import MainMenu from './components/MainMenuRenewal.jsx';
import OnboardingScreen from './components/OnboardingScreen.jsx';
import CharacterToast from './components/CharacterToast.jsx';
import DailySessionScreen from './components/DailySessionScreen.jsx';
import { isSessionDoneToday } from './utils/sessionUtils.js';
import { LangProvider } from './LangContext.jsx';
import { SK } from './constants/storageKeys.js';
import { updateRecord } from './utils/recordUtils.js';
import { useDailyStudyLog, getTodaySeenWordIds } from './hooks/useDailyStudyLog.js';
import { wordByString } from './utils/wordUtils.js';

const FlashcardScreen        = lazy(() => import('./components/FlashcardScreen.jsx'));
const WritingScreen          = lazy(() => import('./components/WritingScreen.jsx'));
const MatchGameScreen        = lazy(() => import('./components/MatchGameScreen.jsx'));
const ShootGameScreen        = lazy(() => import('./components/ShootGameScreen.jsx'));
const ReviewScreen           = lazy(() => import('./components/ReviewScreen.jsx'));
const SentenceQuizScreen     = lazy(() => import('./components/SentenceQuizScreen.jsx'));
const WordQuizScreen         = lazy(() => import('./components/WordQuizScreen.jsx'));
const LevelTestScreen        = lazy(() => import('./components/LevelTestScreen.jsx'));
const RankingsScreen         = lazy(() => import('./components/RankingsScreen.jsx'));
const MyPageScreen           = lazy(() => import('./components/MyPageScreen.jsx'));
const SettingsScreen         = lazy(() => import('./components/SettingsScreen.jsx'));
const CharacterSelectionScreen = lazy(() => import('./components/CharacterSelectionScreen.jsx'));
const GradeTestScreen          = lazy(() => import('./components/GradeTestScreen.jsx'));
const GradeTest72Screen        = lazy(() => import('./components/GradeTest72Screen.jsx'));
const GradeTest7Screen         = lazy(() => import('./components/GradeTest7Screen.jsx'));
const GradeTest62Screen        = lazy(() => import('./components/GradeTest62Screen.jsx'));
import { getLevel } from './utils/rankUtils.js';
import { useAdMob } from './hooks/useAdMob.js';
import { useVersionCheck } from './hooks/useVersionCheck.js';
import { useDailyMission } from './hooks/useDailyMission.js';
import { useMastery } from './hooks/useMastery.js';
import { useTotalStats } from './hooks/useTotalStats.js';
import { useSRS } from './hooks/useSRS.js';
import { useCloudSync } from './hooks/useCloudSync.js';
import { useCurriculumProgress } from './hooks/useCurriculumProgress.js';
import { useWordMastery } from './hooks/useWordMastery.js';

const App = () => {
    // 온보딩 완료 여부
    const [onboardingDone, setOnboardingDone] = useState(() => {
        try { return localStorage.getItem(SK.ONBOARDING_DONE) === 'true'; } catch(e) { return false; }
    });
    const [currentScreen, setCurrentScreen] = useState('main');
    // 한자 카드에서 쓰기로 직접 진입할 때 사용
    const [writeTargetHanja, setWriteTargetHanja] = useState(null);
    const [userXp, setUserXp] = useState(() => {
        try { return Number(localStorage.getItem(SK.USER_XP)) || 0; } catch(e) { return 0; }
    });
    const [isDarkMode, setIsDarkMode] = useState(() => {
        try { return localStorage.getItem(SK.DARK_MODE) === 'true'; } catch(e) { return false; }
    });
    const [selectedCharacter, setSelectedCharacter] = useState(() => {
        try {
            const saved = localStorage.getItem(SK.SELECTED_CHARACTER);
            const VALID = ['garae', 'jeolmi', 'chapssal', 'muzi'];
            return VALID.includes(saved) ? saved : null;
        } catch(e) { return null; }
    });
    const [userNickname, setUserNickname] = useState(() => {
        try { return localStorage.getItem(SK.USER_NICKNAME) || ''; } catch(e) { return ''; }
    });
    const [sessionDoneToday, setSessionDoneToday] = useState(() => isSessionDoneToday());

    // 레거시 키 일괄 제거 (구 행성/XP/스티커 시스템 잔재)
    useEffect(() => {
        ['hanja_active_planet','hanja_dark_mode','hanja_last_planet','hanja_stages_save',
         'hanja_stickers_save','hanja_writing_paths','hanja_xp_save','intro_hook_done',
         'main_seen_hanja','unlocked_characters','journey_state','unlocked_stickers'].forEach(k => localStorage.removeItem(k));
    }, []);

    // Persistence
    useEffect(() => { localStorage.setItem(SK.USER_XP, userXp); }, [userXp]);
    useEffect(() => { localStorage.setItem(SK.DARK_MODE, isDarkMode); }, [isDarkMode]);
    useEffect(() => { if (selectedCharacter) localStorage.setItem(SK.SELECTED_CHARACTER, selectedCharacter); }, [selectedCharacter]);
    useEffect(() => { if (userNickname) localStorage.setItem(SK.USER_NICKNAME, userNickname); }, [userNickname]);

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

    const { missions, streak, allDone, doneCount, updateMissionProgress } = useDailyMission(sessionDoneToday);

    // 오늘 활동 통계 (CoachCard용)
    const [todayStats, setTodayStats] = useState(() => {
        try {
            const saved = localStorage.getItem(SK.TODAY_STATS);
            const today = new Date().toDateString();
            const parsed = saved ? JSON.parse(saved) : null;
            if (parsed && parsed.date === today) return parsed;
            return { date: today, flashcard: 0, writing: 0, matchGame: 0, shootGame: 0, sentenceQuiz: 0, wordQuiz: 0 };
        } catch(e) { return { date: new Date().toDateString(), flashcard: 0, writing: 0, matchGame: 0, shootGame: 0, sentenceQuiz: 0, wordQuiz: 0 }; }
    });
    const addTodayStat = useCallback((type) => {
        setTodayStats(prev => {
            const updated = { ...prev, [type]: (prev[type] || 0) + 1 };
            localStorage.setItem(SK.TODAY_STATS, JSON.stringify(updated));
            return updated;
        });
    }, []);
    const { mastery, markSeen, markCorrect, markWrong, clearWrong, getStats, getMasteryLevel } = useMastery();
    const { logHanja, logWordId, logCorrectWord, logWrongWord } = useDailyStudyLog();
    const { wordWrong, markWordWrong, clearWordWrongByHanjaId, getWrongWordHanjaIds } = useWordMastery();
    const { totalStats, increment } = useTotalStats();
    const { srsData, markCorrect: srsMarkCorrect, markWrong: srsMarkWrong, getDueItems, getWeightedPool, getStats: getSrsStats } = useSRS();
    const { currentDay, completedDay, currentDayData, clearedHanjaIds, advanceDay } = useCurriculumProgress();
    const currentDayHanjaIds = useMemo(
        () => (currentDayData?.hanja || []).map(h => h.id).filter(Boolean),
        [currentDayData]
    );

    // 메인 메뉴 standalone용: 방금 완료한 스테이지(completedDay) 한자
    // (currentDay는 이미 다음 스테이지를 가리키므로 사용 불가)
    const lastCompletedDayHanjaIds = useMemo(() => {
        if (!completedDay) return [];
        const dayData = DAILY_CURRICULUM[completedDay - 1];
        return (dayData?.hanja || []).map(h => h.id).filter(Boolean);
    }, [completedDay]);

    // SRS 복습 후보: 완료된 스테이지 중 마지막 제외
    const pastHanjaIds = useMemo(() =>
        clearedHanjaIds.filter(id => !lastCompletedDayHanjaIds.includes(id)),
        [clearedHanjaIds, lastCompletedDayHanjaIds]
    );

    // 메인화면 공유 풀: 마지막 완료 스테이지(70%) + SRS 과거(30%)
    const sessionContentPool = useMemo(() =>
        lastCompletedDayHanjaIds.length > 0
            ? buildUnifiedPool(lastCompletedDayHanjaIds, HANJA_DATA, srsData, mastery, pastHanjaIds)
            : null,
        [lastCompletedDayHanjaIds, srsData, mastery, pastHanjaIds]
    );

    // 단어 ID 로깅 (일일 학습 로그용)
    const addMainSeenWords = useCallback((wordIds) => {
        if (!wordIds?.length) return;
        wordIds.filter(Boolean).forEach(logWordId);
    }, [logWordId]);

    const { syncStatus, leaderboard, myRank, syncToCloud, restoreFromCloud, isRestoring } = useCloudSync({
        userXp, userNickname, selectedCharacter, streak,
        mastery, srsData, totalStats,
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

    const [xpBuffExpiresAt, setXpBuffExpiresAt] = useState(() => {
        try { return Number(localStorage.getItem(SK.XP_BUFF_EXPIRES) || '0'); } catch { return 0; }
    });

    // 캐릭터 토스트 메시지
    const [charToast, setCharToast] = useState(null);
    const missionToastShownRef = useRef(false);
    const reviewEntryXpRef = useRef(false);
    const dismissToast = useCallback(() => setCharToast(null), []);

    // 메인화면 진입할 때마다 오답 5개 이상이면 복습 토스트
    useEffect(() => {
        if (currentScreen !== 'main' || !selectedCharacter) return;
        const hanjaWrongCount = Object.values(mastery).filter(m => (m.wrongCount || 0) > 0).length;
        const wordWrongCount = Object.keys(wordWrong).length;
        if (hanjaWrongCount + wordWrongCount >= 5) {
            const t = setTimeout(() => setCharToast('review_reminder'), 800);
            return () => clearTimeout(t);
        }
    }, [currentScreen, mastery, wordWrong, selectedCharacter]);

    // 오답 복습 화면 입장 시 1회 50 XP
    useEffect(() => {
        if (currentScreen === 'review') {
            if (!reviewEntryXpRef.current) {
                reviewEntryXpRef.current = true;
                handleHanjaAcquired(null, 50);
            }
        } else {
            reviewEntryXpRef.current = false;
        }
    }, [currentScreen]);

    // 미션 전체 완료 시: 팡파레 토스트 + 보너스 XP
    useEffect(() => {
        if (!allDone || missionToastShownRef.current) return;
        missionToastShownRef.current = true;
        setCharToast('mission_complete');
        addBonusXp(200);
    }, [allDone, addBonusXp]);

    const handleHanjaAcquired = (id, xpAmount = 10) => {
        // 스트릭 XP 배율 적용: 3~6일 1.2배, 7~14일 1.5배, 15일+ 2.0배
        const streakCount = streak?.count || 0;
        const multiplier = streakCount >= 15 ? 2.0 : streakCount >= 7 ? 1.5 : streakCount >= 3 ? 1.2 : 1.0;
        const buffMult = Date.now() < xpBuffExpiresAt ? 2.0 : 1.0;
        const finalXp = Math.round(xpAmount * multiplier * buffMult);
        setUserXp(prev => prev + finalXp);
    };

    const renderScreen = () => {
        switch (currentScreen) {
            case 'main':
                return (
                    <MainMenu
                        onNavigate={setCurrentScreen}
                        userXp={userXp}
                        selectedCharacter={selectedCharacter}
                        userNickname={userNickname}
                        missions={missions}
                        doneCount={doneCount}
                        mastery={mastery}
                        currentDay={currentDay}
                        onStartNextStage={() => setSessionDoneToday(false)}
                        isDarkMode={isDarkMode}
                        setIsDarkMode={setIsDarkMode}
                        streak={streak}
                    />
                );
            case 'flashcard':
                return <FlashcardScreen
                    onBack={() => setCurrentScreen('main')}
                    unlockedHanjaIds={clearedHanjaIds.length > 0 ? clearedHanjaIds : null}
                    onHanjaAcquired={handleHanjaAcquired}
                    onStageClear={() => {
                        handleHanjaAcquired(null, 50); // Increased to 50 XP for completing all study sheets
                        updateMissionProgress('flashcard', 5, addBonusXp);
                    }}
                    onCardFlip={(id) => { 
                        // Now mostly handled by StudySheet quiz correct answers, 
                        // but keeping for legacy flip if needed (will give 0 if already awarded)
                        addTodayStat('flashcard'); 
                        if (id) { markSeen(id); logHanja(id); }
                    }}
                    onWriteHanja={(hanja) => {
                        setWriteTargetHanja(hanja);
                        setCurrentScreen('writing');
                    }}
                    onMarkCorrect={(id) => { markCorrect(id); srsMarkCorrect(id); }}
                    onMarkWrong={(id) => { markWrong(id); srsMarkWrong(id); }}
                    onMarkWordWrong={(wordId, hanjaId, reading, meaning, word) => { markWordWrong(wordId, hanjaId, reading, meaning, word); srsMarkWrong(hanjaId); logWrongWord(wordId); }}
                    onStudySheetComplete={() => increment('hanjaStudyComplete')}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
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
                    onWritingComplete={(id, score) => {
                        const writingXp = score >= 90 ? 150 : 50;
                        handleHanjaAcquired(id || null, writingXp);
                        updateMissionProgress('writing', 1, addBonusXp);
                        addTodayStat('writing');
                        increment('writing');
                        if (id) { markSeen(id); logHanja(id); }
                        if (id) {
                            if (score >= 70) { markCorrect(id); srsMarkCorrect(id); }
                            else { markWrong(id); srsMarkWrong(id); }
                        }
                    }}
                    initialHanja={writeTargetHanja}
                    unlockedHanjaIds={clearedHanjaIds.length > 0 ? clearedHanjaIds : null}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
                />;
            case 'matchGame':
                return <MatchGameScreen
                    onBack={() => setCurrentScreen('main')}
                    onHanjaAcquired={handleHanjaAcquired}
                    onStageClear={(round, elapsedSec) => { handleHanjaAcquired(null, 50); updateMissionProgress('matchGame', 1, addBonusXp); addTodayStat('matchGame'); increment('matchGame'); if (elapsedSec != null) updateRecord('matchBestTime', elapsedSec); }}
                    onMarkCorrect={(id) => { markCorrect(id); srsMarkCorrect(id); logHanja(id); }}
                    onMarkWrong={() => {}}
                    srsData={srsData}
                    masteryData={mastery}
                    userLevel={currentLevel}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
                    contentPool={sessionContentPool}
                    unlockedHanjaIds={clearedHanjaIds.length > 0 ? clearedHanjaIds : null}
                    currentDayHanjaIds={currentDayHanjaIds}
                    onHanjaSeen={addMainSeenWords}
                />;
            case 'shootGame':
                return <ShootGameScreen
                    onBack={() => setCurrentScreen('main')}
                    onHanjaAcquired={handleHanjaAcquired}
                    selectedCharacter={selectedCharacter}
                    onWaveClear={(kills) => { updateMissionProgress('shootGame', 1, addBonusXp); addTodayStat('shootGame'); increment('shootGame'); if (kills) updateRecord('totalMonsterKills', kills); }}
                    onMarkWrong={(id) => { markWrong(id); srsMarkWrong(id); }}
                    onMarkCorrect={(id) => { markCorrect(id); srsMarkCorrect(id); logHanja(id); }}
                    onWordCorrect={(wordId) => logCorrectWord(wordId)}
                    onWordWrong={(wordId) => logWrongWord(wordId)}
                    masteryData={mastery}
                    srsData={srsData}
                    userLevel={currentLevel}
                    contentPool={sessionContentPool}
                    unlockedHanjaIds={clearedHanjaIds.length > 0 ? clearedHanjaIds : null}
                    currentDayHanjaIds={currentDayHanjaIds}
                    currentDay={currentDay}
                    onHanjaSeen={addMainSeenWords}
                />;
            case 'calendar':
                return <ReviewScreen
                    onBack={() => setCurrentScreen('main')}
                    onNavigate={setCurrentScreen}
                    mastery={mastery}
                    markCorrect={(id) => { markCorrect(id); srsMarkCorrect(id); }}
                    markWrong={(id) => { markWrong(id); srsMarkWrong(id); }}
                    getStats={getStats}
                    srsData={srsData}
                    getDueItems={getDueItems}
                    currentDay={currentDay}
                    initialSection="calendar"
                />;
            case 'review': {
                const wrongHanjaIds = Object.entries(mastery)
                    .filter(([, m]) => (m.wrongCount || 0) > 0)
                    .map(([id]) => Number(id));
                const wrongWordIds = Object.keys(wordWrong).map(Number);
                if (wrongHanjaIds.length === 0 && wrongWordIds.length === 0) {
                    return (
                        <div className="min-h-screen bg-[#F7FAF9] flex flex-col items-center justify-center gap-6 px-8">
                            <div className="text-6xl">🎉</div>
                            <h2 className="font-extrabold text-2xl text-slate-800 tracking-tighter text-center">오답 한자가 없어요!</h2>
                            <p className="text-[#AEB7C5] font-bold text-center text-sm break-keep">퀴즈를 틀린 한자나 단어가 생기면<br/>여기서 몬스터로 나타납니다</p>
                            <button
                                onClick={() => setCurrentScreen('main')}
                                className="px-8 py-3 bg-emerald-500 text-white font-extrabold rounded-2xl border-b-4 border-emerald-700 active:translate-y-1 active:border-b-0 transition-all"
                            >
                                메인으로
                            </button>
                        </div>
                    );
                }
                const reviewPool = buildOopsPool(wrongHanjaIds, wrongWordIds);
                return <ShootGameScreen
                    onBack={() => setCurrentScreen('main')}
                    onGameFinish={() => setCurrentScreen('main')}
                    onHanjaAcquired={handleHanjaAcquired}
                    selectedCharacter={selectedCharacter}
                    onWaveClear={(kills) => { updateMissionProgress('shootGame', 1, addBonusXp); addTodayStat('shootGame'); increment('shootGame'); if (kills) updateRecord('totalMonsterKills', kills); }}
                    onMarkWrong={(id) => { markWrong(id); srsMarkWrong(id); }}
                    onMarkCorrect={(id) => { markCorrect(id); srsMarkCorrect(id); clearWrong(id); clearWordWrongByHanjaId(id); logHanja(id); }}
                    onWordCorrect={(wordId) => logCorrectWord(wordId)}
                    onWordWrong={(wordId) => logWrongWord(wordId)}
                    masteryData={mastery}
                    srsData={srsData}
                    userLevel={currentLevel}
                    contentPool={reviewPool}
                    currentDay={currentDay}
                />;
            }
            case 'sentenceQuiz':
                return <SentenceQuizScreen
                    onBack={() => setCurrentScreen('main')}
                    onStageClear={(correct, total, newSeenWords) => {
                        if (newSeenWords) addMainSeenWords(newSeenWords);
                        const bonus = 100 + (correct === total ? 100 : 0);
                        handleHanjaAcquired(null, bonus);
                        updateMissionProgress('sentenceQuiz', 1, addBonusXp);
                        addTodayStat('sentenceQuiz');
                        increment('sentenceQuiz');
                    }}
                    onHanjaAcquired={handleHanjaAcquired}
                    onWordSeen={(wordId) => addMainSeenWords([wordId])}
                    onWordCorrect={(wordId) => logCorrectWord(wordId)}
                    onMarkCorrect={(id) => { markCorrect(id); srsMarkCorrect(id); }}
                    onMarkWrong={(id) => { markWrong(id); srsMarkWrong(id); }}
                    onMarkWordWrong={(wordId, hanjaId, reading, meaning, word) => { markWordWrong(wordId, hanjaId, reading, meaning, word); srsMarkWrong(hanjaId); logWrongWord(wordId); }}
                    onGoToReview={() => setCurrentScreen('review')}
                    srsData={srsData}
                    masteryData={mastery}
                    userLevel={currentLevel}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
                    contentPool={sessionContentPool}
                    unlockedHanjaIds={clearedHanjaIds.length > 0 ? clearedHanjaIds : null}
                    currentDayHanjaIds={currentDayHanjaIds}
                    seenWordIds={getTodaySeenWordIds()}
                />;
            case 'wordQuiz':
                return <WordQuizScreen
                    onBack={() => setCurrentScreen('main')}
                    onStageClear={(correct, total, maxCombo, newSeenWords) => {
                        if (newSeenWords) addMainSeenWords(newSeenWords);
                        const bonus = 50 + (correct === total ? 50 : 0);
                        handleHanjaAcquired(null, bonus);
                        updateMissionProgress('wordQuiz', 1, addBonusXp);
                        addTodayStat('wordQuiz');
                        updateRecord('wordBestScore', correct);
                        if (maxCombo) updateRecord('wordMaxCombo', maxCombo);
                        increment('wordQuiz');
                    }}
                    onHanjaAcquired={handleHanjaAcquired}
                    onWordCorrect={(wordId) => { increment('wordCorrect'); logCorrectWord(wordId); }}
                    onWordSeen={(wordId) => addMainSeenWords([wordId])}
                    onMarkCorrect={(id) => { markCorrect(id); srsMarkCorrect(id); }}
                    onMarkWordWrong={(wordId, hanjaId, reading, meaning, word) => { markWordWrong(wordId, hanjaId, reading, meaning, word); srsMarkWrong(hanjaId); logWrongWord(wordId); }}
                    onGoToReview={() => setCurrentScreen('review')}
                    srsData={srsData}
                    masteryData={mastery}
                    userLevel={currentLevel}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
                    contentPool={sessionContentPool}
                    unlockedHanjaIds={clearedHanjaIds.length > 0 ? clearedHanjaIds : null}
                    seenWordIds={getTodaySeenWordIds()}
                />;
            case 'gradeTest':
                return <GradeTestScreen
                    onBack={() => setCurrentScreen('mypage')}
                    onComplete={({ passed }) => { if (passed) handleHanjaAcquired(null, 200); }}
                />;
            case 'gradeTest72':
                return <GradeTest72Screen
                    onBack={() => setCurrentScreen('mypage')}
                    onComplete={({ passed }) => { if (passed) handleHanjaAcquired(null, 300); }}
                />;
            case 'gradeTest7':
                return <GradeTest7Screen
                    onBack={() => setCurrentScreen('mypage')}
                    onComplete={({ passed }) => { if (passed) handleHanjaAcquired(null, 400); }}
                />;
            case 'gradeTest62':
                return <GradeTest62Screen
                    onBack={() => setCurrentScreen('mypage')}
                    onComplete={({ passed }) => { if (passed) handleHanjaAcquired(null, 500); }}
                />;
            case 'levelTest':
                return <LevelTestScreen
                    onBack={() => setCurrentScreen('main')}
                    onHanjaAcquired={handleHanjaAcquired}
                    selectedCharacter={selectedCharacter}
                    onComplete={({ correct, total }) => {
                        const isPerfect = correct === total;
                        const isPassed = correct >= 7;
                        const ltXp = 20 + (isPassed ? 50 : 0) + (isPerfect ? 100 : 0);
                        handleHanjaAcquired(null, ltXp);
                        updateMissionProgress('levelTest', 1, addBonusXp);
                    }}
                />;
            case 'settings':
                return <SettingsScreen
                    onBack={() => setCurrentScreen('main')}
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                    userNickname={userNickname}
                    setUserNickname={setUserNickname}
                    selectedCharacter={selectedCharacter}
                    setSelectedCharacter={setSelectedCharacter}
                    restoreFromCloud={restoreFromCloud}
                    isRestoring={isRestoring}
                />;
            case 'mypage':
                return <MyPageScreen
                    onBack={() => setCurrentScreen('main')}
                    onNavigate={setCurrentScreen}
                    userXp={userXp}
                    userNickname={userNickname}
                    selectedCharacter={selectedCharacter}
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                    streak={streak}
                    totalStats={totalStats}
                />;
            case 'rankings':
                return <RankingsScreen
                    onBack={() => setCurrentScreen('main')}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
                    userNickname={userNickname}
                    cloudLeaderboard={leaderboard}
                    cloudMyRank={myRank}
                    streak={streak}
                />;
            default:
                return (
                    <MainMenu
                        onNavigate={setCurrentScreen}
                        userXp={userXp}
                        selectedCharacter={selectedCharacter}
                        userNickname={userNickname}
                        missions={missions}
                        doneCount={doneCount}
                        mastery={mastery}
                        currentDay={currentDay}
                        onStartNextStage={() => setSessionDoneToday(false)}
                        isDarkMode={isDarkMode}
                        streak={streak}
                    />
                );
        }
    };

    const currentLevel = getLevel(userXp);

    return (
        <LangProvider>
            <div 
                className={`app-container premium-aurora-bg diamond-overlay ${isDarkMode ? 'dark-mode' : ''} transition-colors duration-500 min-h-screen`}
                data-level={currentLevel}
            >
                <div className="space-bg"></div>
                <div className="stars-overlay"></div>
                <div className="content-area relative z-10">
                    {charToast && selectedCharacter && (
                        <CharacterToast
                            type={charToast}
                            selectedCharacter={selectedCharacter}
                            userXp={userXp}
                            onDismiss={dismissToast}
                            onAction={charToast === 'review_reminder' ? () => setCurrentScreen('review') : undefined}
                        />
                    )}
                    {!onboardingDone
                        ? <OnboardingScreen onComplete={(grade, xp) => {
                            setOnboardingDone(true);
                            handleHanjaAcquired(null, xp);
                          }}
                          />
                        : <Suspense fallback={<div className="min-h-screen bg-[#F7FAF9]" />}>
                            {!selectedCharacter
                                ? <CharacterSelectionScreen
                                    onSelect={(id, nick) => { setSelectedCharacter(id); setUserNickname(nick); }}
                                    onBack={() => {
                                        localStorage.removeItem(SK.ONBOARDING_DONE);
                                        setOnboardingDone(false);
                                    }}
                                  />
                                : !sessionDoneToday
                                    ? <DailySessionScreen
                                        onComplete={() => {
                                            setSessionDoneToday(true);
                                            addBonusXp(200);
                                            setCurrentScreen('main');
                                        }}
                                        onNavigate={setCurrentScreen}
                                        onAdvanceDay={advanceDay}
                                        currentDay={currentDay}
                                        srsData={srsData}
                                        masteryData={mastery}
                                        selectedCharacter={selectedCharacter}
                                        onMarkCorrect={(id) => { markCorrect(id); srsMarkCorrect(id); }}
                                        onMarkWrong={(id) => { markWrong(id); srsMarkWrong(id); }}
                                        onMarkWordWrong={(wordId, hanjaId, reading, meaning, word) => { markWordWrong(wordId, hanjaId, reading, meaning, word); srsMarkWrong(hanjaId); logWrongWord(wordId); }}
                                        onHanjaAcquired={handleHanjaAcquired}
                                      />
                                    : renderScreen()
                            }
                          </Suspense>
                    }
                </div>
            </div>
        </LangProvider>
    );
};

export default App;
