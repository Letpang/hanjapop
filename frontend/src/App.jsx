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
import { useHanjaData } from './hooks/useHanjaData.js';
import { useWordData } from './hooks/useWordData.js';
import { useStudyLog } from './hooks/useStudyLog.js';

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
import { useCloudSync } from './hooks/useCloudSync.js';
import { useCurriculumProgress } from './hooks/useCurriculumProgress.js';

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

    // 레거시 키 일괄 제거
    useEffect(() => {
        ['hanja_active_planet','hanja_dark_mode','hanja_last_planet','hanja_stages_save',
         'hanja_stickers_save','hanja_writing_paths','hanja_xp_save','intro_hook_done',
         'main_seen_hanja','unlocked_characters','journey_state','unlocked_stickers',
         'mastery_data','srs_data','word_wrong_data','today_stats','total_activity_stats',
         'daily_study_log','main_seen_words'].forEach(k => localStorage.removeItem(k));
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

    // ── 통합 학습 데이터 훅 ──────────────────────────────────────────────────
    const {
        hanjaData,
        markSeen, markCorrect, markWrong, clearWrong,
        getDueHanja, getWeightedPool, getMasteryLevel, getStats,
    } = useHanjaData();

    const {
        wordData,
        markWordWrong, markWordCorrect, clearWordWrong,
        clearWordWrongByHanjaId, getDueWordIds, getWrongWordHanjaIds,
    } = useWordData();

    const {
        log, totalStats, todayStats,
        logHanja, logWord, logCorrectWord, logWrongWord, logActivity,
        getTodayWordIds,
    } = useStudyLog();

    // addTodayStat / increment → logActivity로 통합
    const addTodayStat = logActivity;
    const increment = useCallback((key, amount = 1) => {
        // total stats는 useStudyLog 내부에서 logActivity 시 자동 증가
        // 별도 increment가 필요한 경우(wordCorrect 등)만 처리
        if (key === 'wordCorrect') logCorrectWord(null); // wordCorrect 통계 누적
    }, [logCorrectWord]);

    const { currentDay, completedDay, currentDayData, clearedHanjaIds, advanceDay } = useCurriculumProgress();
    const currentDayHanjaIds = useMemo(
        () => (currentDayData?.hanja || []).map(h => h.id).filter(Boolean),
        [currentDayData]
    );

    const lastCompletedDayHanjaIds = useMemo(() => {
        if (!completedDay) return [];
        const dayData = DAILY_CURRICULUM[completedDay - 1];
        return (dayData?.hanja || []).map(h => h.id).filter(Boolean);
    }, [completedDay]);

    const pastHanjaIds = useMemo(() =>
        clearedHanjaIds.filter(id => !lastCompletedDayHanjaIds.includes(id)),
        [clearedHanjaIds, lastCompletedDayHanjaIds]
    );

    // 메인화면 공유 풀: 하루 세션 시작 시 한 번만 계산 (커리큘럼 날짜가 바뀔 때만 재계산)
    // hanjaData를 deps에 넣으면 맞출 때마다 재셔플되어 게임 도중 풀이 초기화됨
    const hanjaDataRef = useRef(hanjaData);
    useEffect(() => { hanjaDataRef.current = hanjaData; }, [hanjaData]);

    const sessionContentPool = useMemo(() => {
        if (lastCompletedDayHanjaIds.length === 0) return null;
        // 계산 시점의 hanjaData 스냅샷 사용 (이후 hanjaData가 변해도 풀은 그대로 유지)
        return buildUnifiedPool(lastCompletedDayHanjaIds, HANJA_DATA, hanjaDataRef.current, hanjaDataRef.current, pastHanjaIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastCompletedDayHanjaIds, pastHanjaIds]); // hanjaData 의도적으로 제외

    // ── 세션 공유 seen 추적 (4개 게임 간 공유) ────────────────────────────────
    // 하루 커리큘럼이 바뀔 때 초기화 — 같은 날 내에선 게임 간 연속성 유지
    const [sessionSeenHanjaIds, setSessionSeenHanjaIds] = useState([]);
    const [sessionSeenWordIds, setSessionSeenWordIds] = useState([]);
    useEffect(() => {
        setSessionSeenHanjaIds([]);
        setSessionSeenWordIds([]);
    }, [lastCompletedDayHanjaIds]);

    const markHanjaSeenInSession = useCallback((hanjaIds) => {
        if (!hanjaIds?.length) return;
        setSessionSeenHanjaIds(prev => {
            const s = new Set(prev);
            hanjaIds.forEach(id => { if (id != null) s.add(id); });
            return prev.length === s.size ? prev : [...s];
        });
    }, []);

    const markWordSeenInSession = useCallback((wordIds) => {
        if (!wordIds?.length) return;
        setSessionSeenWordIds(prev => {
            const s = new Set(prev);
            wordIds.forEach(id => { if (id != null) s.add(id); });
            return prev.length === s.size ? prev : [...s];
        });
    }, []);

    // 단어 ID 로깅 (study_log 기록용 — seen 추적과 별개)
    const addMainSeenWords = useCallback((wordIds) => {
        if (!wordIds?.length) return;
        wordIds.filter(Boolean).forEach(logWord);
    }, [logWord]);

    const { syncStatus, leaderboard, myRank, syncToCloud, restoreFromCloud, isRestoring } = useCloudSync({
        userXp, userNickname, selectedCharacter, streak,
        hanjaData, totalStats,
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
        const hanjaWrongCount = Object.values(hanjaData).filter(m => (m.wrongCount || 0) > 0).length;
        const wordWrongCount = Object.values(wordData).filter(v => (v.wrongCount || 0) > 0).length;
        if (hanjaWrongCount + wordWrongCount >= 5) {
            const t = setTimeout(() => setCharToast('review_reminder'), 800);
            return () => clearTimeout(t);
        }
    }, [currentScreen, hanjaData, wordData, selectedCharacter]);

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
                        mastery={hanjaData}
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
                        addTodayStat('flashcard');
                        if (id) { markSeen(id); logHanja(id); }
                    }}
                    onWriteHanja={(hanja) => {
                        setWriteTargetHanja(hanja);
                        setCurrentScreen('writing');
                    }}
                    onMarkCorrect={(id) => markCorrect(id)}
                    onMarkWrong={(id) => markWrong(id)}
                    onMarkWordWrong={(wordId, hanjaId, reading, meaning) => { markWordWrong(wordId, hanjaId, reading, meaning); logWrongWord(wordId); }}
                    onStudySheetComplete={() => {}}
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
                        if (id) { markSeen(id); logHanja(id); }
                        if (id) {
                            if (score >= 70) markCorrect(id);
                            else markWrong(id);
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
                    onStageClear={(round, elapsedSec) => { handleHanjaAcquired(null, 50); updateMissionProgress('matchGame', 1, addBonusXp); addTodayStat('matchGame'); if (elapsedSec != null) updateRecord('matchBestTime', elapsedSec); }}
                    onMarkCorrect={(id) => { markCorrect(id); logHanja(id); }}
                    onMarkWrong={() => {}}
                    srsData={hanjaData}
                    masteryData={hanjaData}
                    userLevel={currentLevel}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
                    contentPool={sessionContentPool}
                    unlockedHanjaIds={clearedHanjaIds.length > 0 ? clearedHanjaIds : null}
                    currentDayHanjaIds={currentDayHanjaIds}
                    seenHanjaIds={sessionSeenHanjaIds}
                    onHanjaSeen={(ids) => markHanjaSeenInSession(ids)}
                    seenWordIds={sessionSeenWordIds}
                    onWordSeen={(wordId) => markWordSeenInSession([wordId])}
                />;
            case 'shootGame':
                return <ShootGameScreen
                    onBack={() => setCurrentScreen('main')}
                    onHanjaAcquired={handleHanjaAcquired}
                    selectedCharacter={selectedCharacter}
                    onWaveClear={(kills) => { updateMissionProgress('shootGame', 1, addBonusXp); addTodayStat('shootGame'); if (kills) updateRecord('totalMonsterKills', kills); }}
                    onMarkWrong={(id) => markWrong(id)}
                    onMarkCorrect={(id) => { markCorrect(id); logHanja(id); }}
                    onWordCorrect={(wordId) => { logCorrectWord(wordId); markWordSeenInSession([wordId]); }}
                    onWordWrong={(wordId) => { logWrongWord(wordId); markWordWrong(wordId); }}
                    masteryData={hanjaData}
                    srsData={hanjaData}
                    userLevel={currentLevel}
                    contentPool={sessionContentPool}
                    unlockedHanjaIds={clearedHanjaIds.length > 0 ? clearedHanjaIds : null}
                    currentDayHanjaIds={currentDayHanjaIds}
                    currentDay={currentDay}
                    seenHanjaIds={sessionSeenHanjaIds}
                    seenWordIds={sessionSeenWordIds}
                    onHanjaSeen={(ids) => markHanjaSeenInSession(ids)}
                />;
            case 'calendar':
                return <ReviewScreen
                    onBack={() => setCurrentScreen('main')}
                    onNavigate={setCurrentScreen}
                    mastery={hanjaData}
                    markCorrect={markCorrect}
                    markWrong={markWrong}
                    getStats={getStats}
                    srsData={hanjaData}
                    getDueItems={(list) => getDueHanja(list)}
                    currentDay={currentDay}
                    initialSection="calendar"
                />;
            case 'review': {
                const wrongHanjaIds = Object.entries(hanjaData)
                    .filter(([, m]) => (m.wrongCount || 0) > 0)
                    .map(([id]) => Number(id));
                const wrongWordIds = Object.entries(wordData)
                    .filter(([, v]) => (v.wrongCount || 0) > 0)
                    .map(([id]) => Number(id));
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
                    onWaveClear={(kills) => { updateMissionProgress('shootGame', 1, addBonusXp); addTodayStat('shootGame'); if (kills) updateRecord('totalMonsterKills', kills); }}
                    onMarkWrong={(id) => markWrong(id)}
                    onMarkCorrect={(id) => { markCorrect(id); clearWrong(id); clearWordWrongByHanjaId(id); logHanja(id); }}
                    onWordCorrect={(wordId) => { logCorrectWord(wordId); markWordCorrect(wordId); }}
                    onWordWrong={(wordId) => { logWrongWord(wordId); markWordWrong(wordId); }}
                    masteryData={hanjaData}
                    srsData={hanjaData}
                    userLevel={currentLevel}
                    contentPool={reviewPool}
                    currentDay={currentDay}
                />;
            }
            case 'sentenceQuiz':
                return <SentenceQuizScreen
                    onBack={() => setCurrentScreen('main')}
                    onStageClear={(correct, total, newSeenWords) => {
                        if (newSeenWords) { addMainSeenWords(newSeenWords); markWordSeenInSession(newSeenWords); }
                        const bonus = 100 + (correct === total ? 100 : 0);
                        handleHanjaAcquired(null, bonus);
                        updateMissionProgress('sentenceQuiz', 1, addBonusXp);
                        addTodayStat('sentenceQuiz');
                    }}
                    onHanjaAcquired={handleHanjaAcquired}
                    onWordSeen={(wordId) => { addMainSeenWords([wordId]); markWordSeenInSession([wordId]); }}
                    onWordCorrect={(wordId) => { logCorrectWord(wordId); markWordCorrect(wordId); }}
                    onMarkWordWrong={(wordId, hanjaId, reading, meaning) => { markWordWrong(wordId, hanjaId, reading, meaning); logWrongWord(wordId); }}
                    onGoToReview={() => setCurrentScreen('review')}
                    srsData={hanjaData}
                    masteryData={hanjaData}
                    userLevel={currentLevel}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
                    contentPool={sessionContentPool}
                    unlockedHanjaIds={clearedHanjaIds.length > 0 ? clearedHanjaIds : null}
                    currentDayHanjaIds={currentDayHanjaIds}
                    seenHanjaIds={sessionSeenHanjaIds}
                    seenWordIds={sessionSeenWordIds}
                />;
            case 'wordQuiz':
                return <WordQuizScreen
                    onBack={() => setCurrentScreen('main')}
                    onStageClear={(correct, total, maxCombo, newSeenWords) => {
                        if (newSeenWords) { addMainSeenWords(newSeenWords); markWordSeenInSession(newSeenWords); }
                        const bonus = 50 + (correct === total ? 50 : 0);
                        handleHanjaAcquired(null, bonus);
                        updateMissionProgress('wordQuiz', 1, addBonusXp);
                        addTodayStat('wordQuiz');
                        updateRecord('wordBestScore', correct);
                        if (maxCombo) updateRecord('wordMaxCombo', maxCombo);
                    }}
                    onHanjaAcquired={handleHanjaAcquired}
                    onWordCorrect={(wordId) => { logCorrectWord(wordId); markWordCorrect(wordId); }}
                    onWordSeen={(wordId) => { addMainSeenWords([wordId]); markWordSeenInSession([wordId]); }}
                    onMarkWordWrong={(wordId, hanjaId, reading, meaning) => { markWordWrong(wordId, hanjaId, reading, meaning); logWrongWord(wordId); }}
                    onGoToReview={() => setCurrentScreen('review')}
                    srsData={hanjaData}
                    masteryData={hanjaData}
                    userLevel={currentLevel}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
                    contentPool={sessionContentPool}
                    unlockedHanjaIds={clearedHanjaIds.length > 0 ? clearedHanjaIds : null}
                    seenHanjaIds={sessionSeenHanjaIds}
                    seenWordIds={sessionSeenWordIds}
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
                    studyLog={log}
                />;
            case 'rankings':
                return <RankingsScreen
                    onBack={() => setCurrentScreen('mypage')}
                    isDarkMode={isDarkMode}
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
                        mastery={hanjaData}
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
                                        srsData={hanjaData}
                                        masteryData={hanjaData}
                                        selectedCharacter={selectedCharacter}
                                        userXp={userXp}
                                        onMarkCorrect={(id) => { markCorrect(id); logHanja(id); }}
                                        onMarkWrong={(id) => { markWrong(id); logHanja(id); }}
                                        onMarkWordWrong={(wordId, hanjaId, reading, meaning) => { markWordWrong(wordId, hanjaId, reading, meaning); logWrongWord(wordId); }}
                                        onWordCorrect={(wordId) => { logCorrectWord(wordId); markWordCorrect(wordId); }}
                                        onWordSeen={(wordId) => logWord(wordId)}
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
