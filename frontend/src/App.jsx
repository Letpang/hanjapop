import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import HANJA_DATA from './hanja_unified.json';
import DAILY_CURRICULUM from './data/dailyCurriculum.js';
import { buildUnifiedPool, buildOopsPool } from './utils/learningPool.js';
import CharacterToast from './components/CharacterToast.jsx';
import { isSessionDoneToday, getTodayStr } from './utils/sessionUtils.js';
import { LangProvider } from './LangContext.jsx';
import { SK } from './constants/storageKeys.js';
import { updateRecord } from './utils/recordUtils.js';
import { useHanjaData } from './hooks/useHanjaData.js';
import { useWordData } from './hooks/useWordData.js';
import { useStudyLog } from './hooks/useStudyLog.js';

const FlashcardScreen        = lazy(() => import('./components/FlashcardScreen.jsx'));
const MainMenu               = lazy(() => import('./components/MainMenuRenewal.jsx'));
const OnboardingScreen       = lazy(() => import('./components/OnboardingScreen.jsx'));
const DailySessionScreen     = lazy(() => import('./components/DailySessionScreen.jsx'));
const WritingScreen          = lazy(() => import('./components/WritingScreen.jsx'));
const MatchGameScreen        = lazy(() => import('./components/MatchGameScreen.jsx'));
const ShootGameScreen        = lazy(() => import('./components/ShootGameScreen.jsx'));
const SentenceQuizScreen     = lazy(() => import('./components/SentenceQuizScreen.jsx'));
const WordQuizScreen         = lazy(() => import('./components/WordQuizScreen.jsx'));
const WrongReviewSession     = lazy(() => import('./components/WrongReviewSession.jsx'));
const LevelTestScreen        = lazy(() => import('./components/LevelTestScreen.jsx'));
const StudyHistoryScreen     = lazy(() => import('./components/StudyHistoryScreen.jsx'));
const VocabularyScreen       = lazy(() => import('./components/VocabularyScreen.jsx'));
const MyPageScreen           = lazy(() => import('./components/MyPageScreen.jsx'));
const SettingsScreen         = lazy(() => import('./components/SettingsScreen.jsx'));
const CharacterSelectionScreen = lazy(() => import('./components/CharacterSelectionScreen.jsx'));
const GradeTestScreen          = lazy(() => import('./components/GradeTestScreen.jsx'));
const GradeTest72Screen        = lazy(() => import('./components/GradeTest72Screen.jsx'));
const GradeTest7Screen         = lazy(() => import('./components/GradeTest7Screen.jsx'));
const GradeTest62Screen        = lazy(() => import('./components/GradeTest62Screen.jsx'));
const GradeTest6Screen         = lazy(() => import('./components/GradeTest6Screen.jsx'));
const IdiomScreen              = lazy(() => import('./components/IdiomScreen.jsx'));
const GradeExamSelectScreen    = lazy(() => import('./components/GradeExamSelectScreen.jsx'));
import { getLevel, getRankDetails } from './utils/rankUtils.js';
import { useVersionCheck } from './hooks/useVersionCheck.js';
import { useDailyMission } from './hooks/useDailyMission.js';
import { useCloudSync } from './hooks/useCloudSync.js';
import { useCurriculumProgress } from './hooks/useCurriculumProgress.js';
import { useAuth } from './hooks/useAuth.js';
import { PremiumProvider } from './context/PremiumContext.jsx';
import { canAccessStage } from './utils/premiumAccess.js';

const LoginModal             = lazy(() => import('./components/LoginModal.jsx'));
const PremiumModal           = lazy(() => import('./components/PremiumModal.jsx'));
const GradeTestAlertModal    = lazy(() => import('./components/GradeTestAlertModal.jsx'));

import { incrementTodaySessionCount } from './utils/sessionUtils.js';
import { fetchUnlockedPack } from './lib/supabase.js';

const App = () => {
    const { user, platform, signInWithApple, signInWithGoogle } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [gradeTestAlert, setGradeTestAlert] = useState(null);
    const [gradeTestBackScreen, setGradeTestBackScreen] = useState('mypage');
    const [unlockedPack, setUnlockedPack] = useState(() => {
        try { return Number(localStorage.getItem('unlocked_pack') || '0'); } catch { return 0; }
    });
    const isPremium = unlockedPack > 0;

    // 로그인 상태 변경 시 팩 조회
    useEffect(() => {
        fetchUnlockedPack().then(pack => {
            setUnlockedPack(pack);
            localStorage.setItem('unlocked_pack', String(pack));
        });
    }, [user]);

    // 온보딩 완료 여부
    const [onboardingDone, setOnboardingDone] = useState(() => {
        try { return localStorage.getItem(SK.ONBOARDING_DONE) === 'true'; } catch { return false; }
    });
    const [currentScreen, setCurrentScreen] = useState('main');
    // 한자 카드에서 쓰기로 직접 진입할 때 사용
    const [writeTargetHanja, setWriteTargetHanja] = useState(null);
    const [userXp, setUserXp] = useState(() => {
        try { return Number(localStorage.getItem(SK.USER_XP)) || 0; } catch { return 0; }
    });
    const [isDarkMode, setIsDarkMode] = useState(() => {
        try { return localStorage.getItem(SK.DARK_MODE) === 'true'; } catch { return false; }
    });
    const [selectedCharacter, setSelectedCharacter] = useState(() => {
        try {
            const saved = localStorage.getItem(SK.SELECTED_CHARACTER);
            const VALID = ['garae', 'jeolmi', 'chapssal', 'muzi'];
            return VALID.includes(saved) ? saved : null;
        } catch { return null; }
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

    // 레거시 키 일괄 제거 및 과거 버그로 오염된 미래 스테이지 미션 데이터 1회성 초기화
    useEffect(() => {
        ['hanja_active_planet','hanja_dark_mode','hanja_last_planet','hanja_stages_save',
         'hanja_stickers_save','hanja_writing_paths','hanja_xp_save','intro_hook_done',
         'main_seen_hanja','unlocked_characters','journey_state','unlocked_stickers',
         'mastery_data','srs_data','word_wrong_data','today_stats','total_activity_stats',
         'daily_study_log','main_seen_words'].forEach(k => localStorage.removeItem(k));

        try {
            if (!localStorage.getItem('bug_fix_poisoned_missions_cleared')) {
                const currentCompleted = completedDay || 0;
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('stage_missions_')) {
                        const stageNum = parseInt(key.replace('stage_missions_', ''), 10);
                        if (!isNaN(stageNum) && stageNum > currentCompleted) {
                            localStorage.removeItem(key);
                            i--;
                        }
                    }
                }
                localStorage.setItem('bug_fix_poisoned_missions_cleared', 'true');
            }
        } catch (e) {}
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
                try { wakeLock = await navigator.wakeLock.request('screen'); } catch { wakeLock = null; }
            };
            requestWakeLock();
            return () => { if (wakeLock) wakeLock.release(); };
        }
    }, []);

    useVersionCheck();

    useEffect(() => {
        if (isDarkMode) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
    }, [isDarkMode]);

    const { currentDay, completedDay, currentDayData, clearedHanjaIds, advanceDay } = useCurriculumProgress(sessionDoneToday);

    // ── 통합 학습 데이터 훅 ──────────────────────────────────────────────────
    const {
        hanjaData,
        markSeen, markCorrect, markWrong, clearWrong,
    } = useHanjaData();

    const {
        wordData,
        markWordWrong, markWordCorrect, clearWordWrong,
    } = useWordData();

    const {
        totalStats,
        logHanja, logWord, logCorrectWord, logWrongWord, logActivity, logXp,
    } = useStudyLog();

    // addTodayStat → logActivity로 통합
    const addTodayStat = logActivity;

    // (Moved to top level)
    const currentDayHanjaIds = useMemo(
        () => (currentDayData?.hanja || []).map(h => h.id).filter(Boolean),
        [currentDayData]
    );

    // 메인화면 공유 풀: 하루 세션 시작 시 한 번만 계산 (커리큘럼 날짜가 바뀔 때만 재계산)
    // hanjaData를 deps에 넣으면 맞출 때마다 재셔플되어 게임 도중 풀이 초기화됨
    const hanjaDataRef = useRef(hanjaData);
    useEffect(() => { hanjaDataRef.current = hanjaData; }, [hanjaData]);

    const wordDataRef = useRef(wordData);
    useEffect(() => { wordDataRef.current = wordData; }, [wordData]);

    const lastCompletedDayHanjaIds = useMemo(() => {
        if (!completedDay) return [];
        const dayData = DAILY_CURRICULUM[completedDay - 1];
        return (dayData?.hanja || []).map(h => h.id).filter(Boolean);
    }, [completedDay]);

    const pastHanjaIds = useMemo(() =>
        clearedHanjaIds.filter(id => !lastCompletedDayHanjaIds.includes(id)),
        [clearedHanjaIds, lastCompletedDayHanjaIds]
    );

    useEffect(() => {
        if (!completedDay) return;
        const alertGrade = DAILY_CURRICULUM[completedDay - 1]?.gradeTestAlert;
        if (alertGrade) {
            const GRADE_HIERARCHY = ['8급', '7급II', '7급', '6급II', '6급'];
            const normalizedAlertGrade = alertGrade.replace('Ⅱ', 'II');
            
            const currentGrade = localStorage.getItem(SK.UNLOCKED_GRADE);
            const alertGradeIndex = GRADE_HIERARCHY.indexOf(normalizedAlertGrade);
            const currentGradeIndex = GRADE_HIERARCHY.indexOf(currentGrade);

            if (currentGradeIndex < alertGradeIndex || currentGradeIndex === -1) {
                setGradeTestAlert(alertGrade);
            }
        }
    }, [completedDay]);

    const [sessionContentPool, setSessionContentPool] = useState(() =>
        buildUnifiedPool(lastCompletedDayHanjaIds, HANJA_DATA, hanjaData, hanjaData, pastHanjaIds, 0.3, wordData)
    );
    useEffect(() => {
        setSessionContentPool(
            buildUnifiedPool(lastCompletedDayHanjaIds, HANJA_DATA, hanjaDataRef.current, hanjaDataRef.current, pastHanjaIds, 0.3, wordDataRef.current)
        );
    }, [lastCompletedDayHanjaIds, pastHanjaIds]); // hanjaData/wordData 의도적으로 제외

    // 퀴즈 세션 오답 복습 풀
    const [sessionReviewPool, setSessionReviewPool] = useState(null);

    // 과거 스테이지 선택 플레이
    const [selectedPastStage, setSelectedPastStage] = useState(null);
    const activeStage = selectedPastStage || currentDay;
    const { missions, streak, allDone, doneCount, updateMissionProgress } = useDailyMission(sessionDoneToday, activeStage);
    const pastStagePool = useMemo(() => {
        if (!selectedPastStage) return null;
        const dayData = DAILY_CURRICULUM[selectedPastStage - 1];
        if (!dayData) return null;
        const hanjaIds = (dayData.hanja || []).map(h => h.id).filter(Boolean);
        // eslint-disable-next-line react-hooks/refs
        return buildUnifiedPool(hanjaIds, HANJA_DATA, hanjaDataRef.current, hanjaDataRef.current, [], 0, wordDataRef.current);
    }, [selectedPastStage]);

    // 급수별 선택 플레이
    const [selectedGrade, setSelectedGrade] = useState(null);
    const gradePool = useMemo(() => {
        if (!selectedGrade) return null;
        const hanjaIds = HANJA_DATA.filter(h => h.grade === selectedGrade && clearedHanjaIds.includes(h.id)).map(h => h.id);
        // eslint-disable-next-line react-hooks/refs
        return buildUnifiedPool(hanjaIds, HANJA_DATA, hanjaDataRef.current, hanjaDataRef.current, [], 0, wordDataRef.current);
    }, [selectedGrade, clearedHanjaIds]);

    const effectivePool = selectedPastStage ? pastStagePool : selectedGrade ? gradePool : sessionContentPool;

    // ── 세션 큐 (4개 게임 간 공유, index 기반 순차 출제) ────────────────────────
    // 풀(스테이지)이 바뀔 때 한 번 셔플 → 각 게임이 순서대로 소비 → 소진 시 자동 리셔플
    const sessionQueueRef = useRef({ hanjaIds: [], wordIds: [], hanjaIdx: 0, wordIdx: 0 });
    useEffect(() => {
        if (!effectivePool) { sessionQueueRef.current = { hanjaIds: [], wordIds: [], hanjaIdx: 0, wordIdx: 0 }; return; }
        const sh = (a) => [...a].sort(() => Math.random() - 0.5);
        // 큐에는 현재 스테이지(main)만 — review(SRS 과거 스테이지)는 섞지 않음
        sessionQueueRef.current = {
            hanjaIds: sh([...(effectivePool.main?.hanjaIds || []), ...(effectivePool.review?.hanjaIds || [])]),
            wordIds:  sh([...(effectivePool.main?.wordIds  || []), ...(effectivePool.review?.wordIds  || [])]),
            hanjaIdx: 0, wordIdx: 0,
        };
    }, [effectivePool]);

    const getNextHanjaIds = useCallback((n) => {
        const q = sessionQueueRef.current;
        if (!q.hanjaIds.length) return [];
        let { hanjaIds, hanjaIdx } = q;
        const result = [];
        while (result.length < n) {
            if (hanjaIdx >= hanjaIds.length) { hanjaIds = [...hanjaIds].sort(() => Math.random() - 0.5); hanjaIdx = 0; }
            result.push(hanjaIds[hanjaIdx++]);
        }
        sessionQueueRef.current = { ...q, hanjaIds, hanjaIdx };
        return result;
    }, []);

    const getNextWordIds = useCallback((n) => {
        const q = sessionQueueRef.current;
        if (!q.wordIds.length) return [];
        let { wordIds, wordIdx } = q;
        const result = [];
        while (result.length < n) {
            if (wordIdx >= wordIds.length) { wordIds = [...wordIds].sort(() => Math.random() - 0.5); wordIdx = 0; }
            result.push(wordIds[wordIdx++]);
        }
        sessionQueueRef.current = { ...q, wordIds, wordIdx };
        return result;
    }, []);

    // 단어 ID 로깅 (study_log 기록용 — seen 추적과 별개)
    const addMainSeenWords = useCallback((wordIds) => {
        if (!wordIds?.length) return;
        wordIds.filter(Boolean).forEach(logWord);
    }, [logWord]);

    const { restoreFromCloud, isRestoring } = useCloudSync({
        userXp, userNickname, selectedCharacter, streak,
        hanjaData, totalStats,
    });

    const getRewardXp = useCallback((xp) => {
        if (!xp || xp <= 0) return 0;
        const streakCount = streak?.count || 0;
        const streakMultiplier = streakCount >= 15 ? 2.0 : streakCount >= 7 ? 1.5 : streakCount >= 3 ? 1.2 : 1.0;
        return Math.round(xp * streakMultiplier);
    }, [streak]);

    const getRewardPreview = useCallback((xp) => {
        if (!xp || xp <= 0) return null;
        const streakCount = streak?.count || 0;
        const streakMultiplier = streakCount >= 15 ? 2.0 : streakCount >= 7 ? 1.5 : streakCount >= 3 ? 1.2 : 1.0;
        const multiplier = streakMultiplier;
        const parts = [];
        if (streakMultiplier > 1) parts.push(`스트릭 ${streakMultiplier}`);
        return {
            baseXp: xp,
            finalXp: Math.round(xp * multiplier),
            multiplier,
            multiplierText: parts.join(' x '),
        };
    }, [streak]);

    // 모든 XP 보상은 스트릭 배율을 같은 규칙으로 적용한다.
    const addBonusXp = useCallback((xp) => {
        const finalXp = getRewardXp(xp);
        if (!finalXp) return;
        setUserXp(prev => prev + finalXp);
        logXp(finalXp);
    }, [getRewardXp, logXp]);

    // 캐릭터 토스트 메시지
    const [charToast, setCharToast] = useState(null);
    const missionToastShownRef = useRef(false);
    const dismissToast = useCallback(() => setCharToast(null), []);

    // 메인화면 진입할 때마다 오답 5개 이상이고 개수가 늘어났을 때만 복습 토스트
    useEffect(() => {
        if (currentScreen !== 'main' || !selectedCharacter) return;
        const hanjaWrongCount = Object.values(hanjaData).filter(m => (m.wrongCount || 0) > 0).length;
        const wordWrongCount = Object.values(wordData).filter(v => (v.wrongCount || 0) > 0).length;
        const currentWrongCount = hanjaWrongCount + wordWrongCount;

        try {
            const lastNotified = Number(localStorage.getItem('last_notified_wrong_count')) || 0;
            
            // 오답 개수가 줄어들면 알림 카운트 하향 동기화 (나중에 다시 쌓일 때 알림이 오도록 함)
            if (currentWrongCount < lastNotified) {
                localStorage.setItem('last_notified_wrong_count', String(currentWrongCount));
            }

            // 오답이 5개 이상이고, 마지막으로 안내했던 개수보다 오답이 더 많아졌을 때만 팝업 노출
            if (currentWrongCount >= 5 && currentWrongCount > lastNotified) {
                const t = setTimeout(() => {
                    setCharToast('review_reminder');
                    localStorage.setItem('last_notified_wrong_count', String(currentWrongCount));
                }, 800);
                return () => clearTimeout(t);
            }
        } catch {
            return undefined;
        }
    }, [currentScreen, hanjaData, wordData, selectedCharacter]);

    // 미션 전체 완료 시: 팡파레 토스트만 표시한다. +200 XP는 updateMissionProgress에서 1회 지급.
    useEffect(() => {
        if (!allDone || missionToastShownRef.current) return;
        missionToastShownRef.current = true;
        setCharToast('mission_complete');
    }, [allDone]);

    const handleHanjaAcquired = (id, xpAmount = 10) => {
        const finalXp = getRewardXp(xpAmount);
        if (!finalXp) return;
        setUserXp(prev => prev + finalXp);
        logXp(finalXp);
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
                        completedDay={completedDay}
                        onStartNextStage={() => {
                            if (!selectedPastStage && !selectedGrade && !canAccessStage(unlockedPack, currentDay)) { 
                                setShowPremiumModal(true); 
                                return; 
                            }
                            setCurrentScreen('flashcard');
                            setSessionDoneToday(false);
                        }}
                        onSelectPastStage={(n) => { setSelectedGrade(null); setSelectedPastStage(n); }}
                        selectedPastStage={selectedPastStage}
                        onSelectGrade={(g) => { setSelectedPastStage(null); setSelectedGrade(g); }}
                        selectedGrade={selectedGrade}
                        isDarkMode={isDarkMode}
                        setIsDarkMode={setIsDarkMode}
                        streak={streak}
                    />
                );
            case 'flashcard':
                return <FlashcardScreen
                    onBack={() => setCurrentScreen('main')}
                    isPremium={isPremium}
                    contentPool={effectivePool}
                    currentDay={currentDay}
                    unlockedHanjaIds={clearedHanjaIds}
                    onHanjaAcquired={handleHanjaAcquired}
                    onStageClear={() => {
                        handleHanjaAcquired(null, 50); // Increased to 50 XP for completing all study sheets
                        updateMissionProgress('flashcard', 1, addBonusXp);
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
                    getRewardPreview={getRewardPreview}
                />;
            case 'writing':
                return <WritingScreen
                    onBack={() => {
                        setWriteTargetHanja(null);
                        setCurrentScreen('main');
                    }}
                    onWritingComplete={(id, score) => {
                        const writingXp = 10;
                        handleHanjaAcquired(id || null, writingXp);
                        addTodayStat('writing');
                        if (id) { markSeen(id); logHanja(id); }
                        if (id) {
                            if (score >= 70) markCorrect(id);
                            else markWrong(id);
                        }
                    }}
                    onStageClear={() => {
                        handleHanjaAcquired(null, 30);
                        updateMissionProgress('writing', 1, addBonusXp);
                    }}
                    initialHanja={writeTargetHanja}
                    isPremium={isPremium}
                    contentPool={effectivePool}
                    unlockedHanjaIds={clearedHanjaIds}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
                    getRewardPreview={getRewardPreview}
                />;
            case 'matchGame':
                return <MatchGameScreen
                    onBack={() => setCurrentScreen('main')}
                    onHanjaAcquired={handleHanjaAcquired}
                    onStageClear={(round, elapsedSec) => { handleHanjaAcquired(null, 20); updateMissionProgress('matchGame', 1, addBonusXp); addTodayStat('matchGame'); if (elapsedSec != null) updateRecord('matchBestTime', elapsedSec); }}
                    onMarkCorrect={(id) => { markCorrect(id); logHanja(id); }}
                    onMarkWrong={() => {}}
                    srsData={hanjaData}
                    masteryData={hanjaData}
                    userLevel={currentLevel}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
                    getRewardPreview={getRewardPreview}
                    isPremium={isPremium}
                    unlockedHanjaIds={clearedHanjaIds.length > 0 ? clearedHanjaIds : null}
                    currentDayHanjaIds={currentDayHanjaIds}
                    contentPool={effectivePool}
                    onGetNextHanjaIds={getNextHanjaIds}
                    onGetNextWordIds={getNextWordIds}
                    missionDone={missions?.find(m => m.type === 'matchGame')?.done ?? false}
                />;
            case 'shootGame':
                return <ShootGameScreen
                    onBack={() => setCurrentScreen('main')}
                    onHanjaAcquired={handleHanjaAcquired}
                    selectedCharacter={selectedCharacter}
                    onWaveClear={(kills) => { updateMissionProgress('shootGame', 1, addBonusXp); addTodayStat('shootGame'); if (kills) updateRecord('totalMonsterKills', kills); }}
                    onMarkWrong={(id) => markWrong(id)}
                    onMarkCorrect={(id) => { markCorrect(id); logHanja(id); }}
                    onWordCorrect={(wordId) => { logCorrectWord(wordId); markWordCorrect(wordId); }}
                    onWordWrong={(wordId, hanjaId, reading, meaning) => { logWrongWord(wordId); markWordWrong(wordId, hanjaId, reading, meaning); }}
                    masteryData={hanjaData}
                    srsData={hanjaData}
                    userLevel={currentLevel}
                    getRewardPreview={getRewardPreview}
                    isPremium={isPremium}
                    unlockedHanjaIds={clearedHanjaIds.length > 0 ? clearedHanjaIds : null}
                    currentDayHanjaIds={currentDayHanjaIds}
                    currentDay={currentDay}
                    contentPool={effectivePool}
                    sharedPoolMode={!!effectivePool}
                    onGetNextHanjaIds={getNextHanjaIds}
                    onGetNextWordIds={getNextWordIds}
                />;
            case 'calendar':
                return <StudyHistoryScreen
                    onBack={() => setCurrentScreen('mypage')}
                    isDarkMode={isDarkMode}
                />;
            case 'review': {
                const wrongHanjaIds = sessionReviewPool
                    ? sessionReviewPool.main.hanjaIds
                    : Object.entries(hanjaData).filter(([, m]) => (m.wrongCount || 0) > 0).map(([id]) => Number(id));
                const wrongWordIds = sessionReviewPool
                    ? sessionReviewPool.main.wordIds
                    : Object.entries(wordData).filter(([, v]) => (v.wrongCount || 0) > 0).map(([id]) => Number(id));
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
                return <WrongReviewSession
                    onBack={() => { setSessionReviewPool(null); setCurrentScreen('main'); }}
                    onComplete={() => { setSessionReviewPool(null); setCurrentScreen('main'); }}
                    onHanjaAcquired={handleHanjaAcquired}
                    selectedCharacter={selectedCharacter}
                    onClearAllWrong={() => {
                        // 리뷰 세션 풀에 있는 모든 오답을 초기화
                        if (reviewPool && reviewPool.main) {
                            reviewPool.main.hanjaIds.forEach(id => clearWrong(id));
                            reviewPool.main.wordIds.forEach(id => clearWordWrong(id));
                        }
                    }}
                    onMarkCorrect={(id) => { markCorrect(id); logHanja(id); }}
                    onWordCorrect={(wordId) => { logCorrectWord(wordId); markWordCorrect(wordId); }}
                    masteryData={hanjaData}
                    srsData={hanjaData}
                    wordData={wordData}
                    userLevel={currentLevel}
                    contentPool={reviewPool}
                    isPremium={isPremium}
                />;
            }
            case 'sentenceQuiz':
                return <SentenceQuizScreen
                    onBack={() => setCurrentScreen('main')}
                    onStageClear={(correct, total, newSeenWords) => {
                        if (newSeenWords) addMainSeenWords(newSeenWords);
                        handleHanjaAcquired(null, 20);
                        updateMissionProgress('sentenceQuiz', 1, addBonusXp);
                        addTodayStat('sentenceQuiz', total || 1);
                    }}
                    onHanjaAcquired={handleHanjaAcquired}
                    onWordSeen={(wordId) => addMainSeenWords([wordId])}
                    onWordCorrect={(wordId) => { logCorrectWord(wordId); markWordCorrect(wordId); }}
                    onMarkWordWrong={(wordId, hanjaId, reading, meaning) => { markWordWrong(wordId, hanjaId, reading, meaning); logWrongWord(wordId); }}
                    onGoToReview={(wrongIds) => { if (wrongIds) setSessionReviewPool(buildOopsPool(wrongIds.hanjaIds || [], wrongIds.wordIds || [])); setCurrentScreen('review'); }}
                    srsData={hanjaData}
                    masteryData={hanjaData}
                    wordData={wordData}
                    userLevel={currentLevel}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
                    getRewardPreview={getRewardPreview}
                    isPremium={isPremium}
                    unlockedHanjaIds={clearedHanjaIds.length > 0 ? clearedHanjaIds : null}
                    currentDayHanjaIds={currentDayHanjaIds}
                    contentPool={effectivePool}
                    onGetNextWordIds={getNextWordIds}
                    quizCount={5}
                    clearXp={20}
                />;
            case 'wordQuiz':
                return <WordQuizScreen
                    onBack={() => setCurrentScreen('main')}
                    onStageClear={(correct, total, maxCombo, newSeenWords) => {
                        if (newSeenWords) addMainSeenWords(newSeenWords);
                        handleHanjaAcquired(null, 20);
                        updateMissionProgress('wordQuiz', 1, addBonusXp);
                        addTodayStat('wordQuiz', total || 1);
                        updateRecord('wordBestScore', correct);
                        if (maxCombo) updateRecord('wordMaxCombo', maxCombo);
                    }}
                    onHanjaAcquired={handleHanjaAcquired}
                    onWordCorrect={(wordId) => { logCorrectWord(wordId); markWordCorrect(wordId); }}
                    onWordSeen={(wordId) => addMainSeenWords([wordId])}
                    onMarkWordWrong={(wordId, hanjaId, reading, meaning) => { markWordWrong(wordId, hanjaId, reading, meaning); logWrongWord(wordId); }}
                    onGoToReview={(wrongIds) => { if (wrongIds) setSessionReviewPool(buildOopsPool(wrongIds.hanjaIds || [], wrongIds.wordIds || [])); setCurrentScreen('review'); }}
                    srsData={hanjaData}
                    masteryData={hanjaData}
                    wordData={wordData}
                    userLevel={currentLevel}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
                    getRewardPreview={getRewardPreview}
                    isPremium={isPremium}
                    unlockedHanjaIds={clearedHanjaIds.length > 0 ? clearedHanjaIds : null}
                    contentPool={effectivePool}
                    onGetNextWordIds={getNextWordIds}
                    quizCount={6}
                    clearXp={20}
                />;
            case 'gradeTest':
                return <GradeTestScreen
                    onBack={() => setCurrentScreen(gradeTestBackScreen)}
                    selectedCharacter={selectedCharacter}
                    onComplete={({ passed }) => { if (passed) handleHanjaAcquired(null, 200); }}
                />;
            case 'gradeTest72':
                return <GradeTest72Screen
                    onBack={() => setCurrentScreen(gradeTestBackScreen)}
                    selectedCharacter={selectedCharacter}
                    onComplete={({ passed }) => { if (passed) handleHanjaAcquired(null, 300); }}
                />;
            case 'gradeTest7':
                return <GradeTest7Screen
                    onBack={() => setCurrentScreen(gradeTestBackScreen)}
                    selectedCharacter={selectedCharacter}
                    onComplete={({ passed }) => { if (passed) handleHanjaAcquired(null, 400); }}
                />;
            case 'gradeTest62':
                return <GradeTest62Screen
                    onBack={() => setCurrentScreen(gradeTestBackScreen)}
                    selectedCharacter={selectedCharacter}
                    onComplete={({ passed }) => { if (passed) handleHanjaAcquired(null, 500); }}
                />;
            case 'gradeTest6':
                return <GradeTest6Screen
                    onBack={() => setCurrentScreen(gradeTestBackScreen)}
                    selectedCharacter={selectedCharacter}
                    onComplete={({ passed }) => { if (passed) handleHanjaAcquired(null, 600); }}
                />;
            case 'idiom':
                return <IdiomScreen
                    onBack={() => setCurrentScreen('main')}
                    contentPool={effectivePool}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
                />;
            case 'idiomQuiz':
                return <IdiomScreen
                    onBack={() => setCurrentScreen('main')}
                    contentPool={effectivePool}
                    startInQuiz
                    onComplete={() => {
                        handleHanjaAcquired(null, 25);
                        updateMissionProgress('idiomQuiz', 1, addBonusXp);
                    }}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
                />;
            case 'gradeExamSelect':
                return <GradeExamSelectScreen
                    onBack={() => setCurrentScreen('main')}
                    onNavigate={(screen) => {
                        setGradeTestBackScreen('gradeExamSelect');
                        setCurrentScreen(screen);
                    }}
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
                    }}
                />;
            case 'settings':
                return <SettingsScreen
                    onBack={() => setCurrentScreen('mypage')}
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
                    onNavigate={(screen) => {
                        const gradeScreens = ['gradeTest', 'gradeTest72', 'gradeTest7', 'gradeTest62', 'gradeTest6'];
                        if (gradeScreens.includes(screen)) setGradeTestBackScreen('mypage');
                        setCurrentScreen(screen);
                    }}
                    userXp={userXp}
                    userNickname={userNickname}
                    selectedCharacter={selectedCharacter}
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                    streak={streak}
                    totalStats={totalStats}
                />;
            case 'vocabulary':
                return <VocabularyScreen
                    key="vocabulary"
                    onBack={() => setCurrentScreen('mypage')}
                    isDarkMode={isDarkMode}
                />;
            case 'wrongVocabulary':
                return <VocabularyScreen
                    key="wrong-vocabulary"
                    onBack={() => setCurrentScreen('main')}
                    isDarkMode={isDarkMode}
                    initialFilter="wrong"
                    title="오답 단어장"
                    subtitle="틀린 단어를 모아서 다시 확인해요"
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
                        onStartNextStage={() => {
                            setSessionDoneToday(false);
                        }}
                        isDarkMode={isDarkMode}
                        streak={streak}
                    />
                );
        }
    };

    const currentLevel = getLevel(userXp);

    return (
        <PremiumProvider unlockedPack={unlockedPack} onShowPremium={() => setShowPremiumModal(true)}>

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
                            onAction={charToast === 'review_reminder' ? () => {
                                setCharToast(null);
                                setCurrentScreen('wrongVocabulary');
                            } : undefined}
                        />
                    )}
                    <Suspense fallback={<div className="min-h-screen bg-[#F7FAF9]" />}>
                        {!onboardingDone
                        ? <OnboardingScreen onComplete={(grade, xp) => {
                            setOnboardingDone(true);
                            handleHanjaAcquired(null, xp);
                          }}
                          />
                        : (
                            !selectedCharacter
                                ? <CharacterSelectionScreen
                                    onSelect={(id, nick) => { setSelectedCharacter(id); setUserNickname(nick); }}
                                    onBack={() => {
                                        localStorage.removeItem(SK.ONBOARDING_DONE);
                                        setOnboardingDone(false);
                                    }}
                                  />
                                : !sessionDoneToday && canAccessStage(unlockedPack, currentDay)
                                    ? <DailySessionScreen
                                        onComplete={() => {
                                            setSessionDoneToday(true);
                                            addBonusXp(200);
                                            setCurrentScreen('main');
                                        }}
                                        onNavigate={setCurrentScreen}
                                        onAdvanceDay={() => { advanceDay(); incrementTodaySessionCount(); }}
                                        currentDay={currentDay}
                                        srsData={hanjaData}
                                        masteryData={hanjaData}
                                        wordData={wordData}
                                        selectedCharacter={selectedCharacter}
                                        userXp={userXp}
                                        onMarkCorrect={(id) => { markCorrect(id); logHanja(id); }}
                                        onMarkWrong={(id) => { markWrong(id); logHanja(id); }}
                                        onMarkWordWrong={(wordId, hanjaId, reading, meaning) => { markWordWrong(wordId, hanjaId, reading, meaning); logWrongWord(wordId); }}
                                        onWordCorrect={(wordId) => { logCorrectWord(wordId); markWordCorrect(wordId); }}
                                        onWordSeen={(wordId) => logWord(wordId)}
                                        onHanjaAcquired={handleHanjaAcquired}
                                        updateMissionProgress={updateMissionProgress}
                                        addBonusXp={addBonusXp}
                                        getRewardPreview={getRewardPreview}
                                        missions={missions}
                                        doneCount={doneCount}
                                      />
                                    : renderScreen()
                        )}
                    </Suspense>
                </div>
                <Suspense fallback={null}>
                    {showLoginModal && (
                        <LoginModal
                            platform={platform}
                            signInWithApple={signInWithApple}
                            signInWithGoogle={signInWithGoogle}
                            onClose={() => setShowLoginModal(false)}
                        />
                    )}
                    {showPremiumModal && (
                        <PremiumModal
                            onClose={() => setShowPremiumModal(false)}
                            onShowLogin={() => { setShowPremiumModal(false); setShowLoginModal(true); }}
                            avatarUrl={selectedCharacter ? getRankDetails(userXp, selectedCharacter).avatar : '/assets/images/characters/default_3d.webp'}
                        />
                    )}
                    {gradeTestAlert && (
                        <GradeTestAlertModal
                            grade={gradeTestAlert}
                            onNavigate={setCurrentScreen}
                            onClose={() => setGradeTestAlert(null)}
                        />
                    )}
                </Suspense>
            </div>
        </LangProvider>

        </PremiumProvider>
    );
};

export default App;
