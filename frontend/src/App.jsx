import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import HANJA_DATA from './hanja_unified.json';
import DAILY_CURRICULUM from './data/dailyCurriculum.js';
import { buildUnifiedPool, buildOopsPool } from './utils/learningPool.js';
import CharacterToast from './components/CharacterToast.jsx';
const RankUpModal = lazy(() => import('./components/RankUpModal.jsx'));
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
const GradeStudyDashboardScreen = lazy(() => import('./components/GradeStudyDashboardScreen.jsx'));
import { getLevel, getRankDetails, getCharacterImage, getCharacterScale, getCharacterTranslateY, LEVEL_THRESHOLDS, levelToImageRank } from './utils/rankUtils.js';
import { useVersionCheck } from './hooks/useVersionCheck.js';
import { useDailyMission } from './hooks/useDailyMission.js';
import { useCloudSync } from './hooks/useCloudSync.js';
import { useCurriculumProgress } from './hooks/useCurriculumProgress.js';
import { useAuth } from './hooks/useAuth.js';
import { PremiumProvider } from './context/PremiumContext.jsx';
import { canAccessStage } from './utils/premiumAccess.js';
import { useAdMob } from './hooks/useAdMob.js';
import { buildPremiumWidgetPayload, savePremiumWidgetPayload } from './utils/premiumWidget.js';

const LoginModal             = lazy(() => import('./components/LoginModal.jsx'));
const PremiumModal           = lazy(() => import('./components/PremiumModal.jsx'));
const GradeTestAlertModal    = lazy(() => import('./components/GradeTestAlertModal.jsx'));
const NewJourneyModal        = lazy(() => import('./components/NewJourneyModal.jsx'));
const AccountDataChoiceModal = lazy(() => import('./components/AccountDataChoiceModal.jsx'));

import { incrementTodaySessionCount } from './utils/sessionUtils.js';
import {
    fetchUnlockedPack,
    captureReferralFromUrl,
    acceptPendingReferral,
    fetchReferralOffer,
    activateReferralAfterDailySession,
    getCachedReferralOffer,
} from './lib/supabase.js';

const hasPassedQuizMission = (correct, total) => Number(total) > 0 && Number(correct) / Number(total) >= 0.7;

const App = () => {
    const { user, loading: authLoading, platform, signInWithApple, signInWithGoogle, signInWithKakao, signOut: authSignOut, linkIdentity } = useAuth();
    const userRef = useRef(user);
    useEffect(() => { userRef.current = user; }, [user]);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [accountDataChoice, setAccountDataChoice] = useState(null);
    const [accountChoiceBusy, setAccountChoiceBusy] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [gradeTestAlert, setGradeTestAlert] = useState(null);
    const [gradeTestBackScreen, setGradeTestBackScreen] = useState('mypage');
    const [showNewJourneyModal, setShowNewJourneyModal] = useState(false);
    const [openMemoryVaultSignal, setOpenMemoryVaultSignal] = useState(0);
    const [referralOffer, setReferralOffer] = useState(() => getCachedReferralOffer());
    const [unlockedPack, setUnlockedPack] = useState(0);
    const isPremium = unlockedPack > 0;
    const handleAfterInterstitial = useCallback(() => {
        if (!isPremium) setShowPremiumModal(true);
    }, [isPremium]);
    const { showInterstitial } = useAdMob({ onAfterInterstitial: handleAfterInterstitial });

    useEffect(() => {
        captureReferralFromUrl();
    }, []);

    // 로그인 상태 변경 시 팩 조회
    useEffect(() => {
        if (!user) {
            setUnlockedPack(0);
            setReferralOffer(null);
            localStorage.removeItem('unlocked_pack');
            return;
        }
        fetchUnlockedPack().then(pack => {
            setUnlockedPack(pack);
            localStorage.setItem('unlocked_pack', String(pack));
        });
        acceptPendingReferral().finally(() => {
            fetchReferralOffer().then(({ offer }) => setReferralOffer(offer || null));
        });
    }, [user]);

    // Lemon Squeezy 결제 탭에서 돌아오면 서버 권한을 다시 확인한다.
    useEffect(() => {
        if (!user) return;
        const refreshEntitlement = () => {
            if (document.visibilityState !== 'visible') return;
            fetchUnlockedPack().then(pack => {
                setUnlockedPack(pack);
                localStorage.setItem('unlocked_pack', String(pack));
            });
        };
        document.addEventListener('visibilitychange', refreshEntitlement);
        window.addEventListener('focus', refreshEntitlement);
        return () => {
            document.removeEventListener('visibilitychange', refreshEntitlement);
            window.removeEventListener('focus', refreshEntitlement);
        };
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

    const versionInfo = useVersionCheck();

    useEffect(() => {
        if (isDarkMode) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
    }, [isDarkMode]);

    // 메인 화면 복귀 시 전면광고 (5번에 1번, 프리미엄 사용자 제외)
    useEffect(() => {
        if (currentScreen === 'main' && !isPremium) showInterstitial();
    }, [currentScreen, isPremium, showInterstitial]);

    const {
        currentDay,
        completedDay,
        archivedCompletedDay,
        currentDayData,
        clearedHanjaIds,
        finalJourney,
        journeyRound,
        isJourneyComplete,
        advanceDay,
        claimFinalJourney,
        startNewJourney,
    } = useCurriculumProgress(sessionDoneToday);

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
        log: studyLog,
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
    // 급수별 선택 플레이
    const [selectedGrade, setSelectedGrade] = useState(null);
    // 급수별 학습관 대시보드 상태
    const [selectedDashboardGrade, setSelectedDashboardGrade] = useState(null);
    const backToMain = useCallback(() => {
        if (selectedDashboardGrade) {
            setCurrentScreen('gradeStudyDashboard');
        } else {
            setCurrentScreen('main');
            setSelectedPastStage(null);
            setSelectedGrade(null);
        }
    }, [selectedDashboardGrade]);
    const activeStage = selectedPastStage || currentDay;
    const { missions, streak, allDone, doneCount, updateMissionProgress } = useDailyMission(sessionDoneToday, activeStage, journeyRound);

    const handleStartNewJourney = useCallback(() => {
        startNewJourney();
        setSessionDoneToday(false);
        setSelectedPastStage(null);
        setSelectedGrade(null);
        setCurrentScreen('main');
        setShowNewJourneyModal(false);
        try {
            localStorage.removeItem(SK.DAILY_SESSION);
            localStorage.removeItem('daily_map_progress');
        } catch {}
    }, [startNewJourney]);

    const handleBrowseJourneyMemory = useCallback(() => {
        setShowNewJourneyModal(false);
        setCurrentScreen('main');
        setOpenMemoryVaultSignal(value => value + 1);
    }, []);
    useEffect(() => {
        const nextDayData = DAILY_CURRICULUM[currentDay] || null;
        savePremiumWidgetPayload(buildPremiumWidgetPayload({
            isPremium,
            currentDay,
            currentDayData,
            nextDayData,
            doneCount,
            missionTotal: missions?.length || 6,
            allDone,
        }));
    }, [isPremium, currentDay, currentDayData, missions, doneCount, allDone]);
    // 과거 단계 복습 시 DailySession에서만 미션을 미달성으로 표시 (메인 메뉴 퀘스트는 오늘 실제 데이터 유지)
    const sessionMissions = selectedPastStage ? (missions || []).map(m => ({ ...m, done: false })) : missions;
    const pastStagePool = useMemo(() => {
        if (!selectedPastStage) return null;
        const dayData = DAILY_CURRICULUM[selectedPastStage - 1];
        if (!dayData) return null;
        const hanjaIds = (dayData.hanja || []).map(h => h.id).filter(Boolean);
        return buildUnifiedPool(hanjaIds, HANJA_DATA, hanjaDataRef.current, hanjaDataRef.current, [], 0, wordDataRef.current);
    }, [selectedPastStage]);

    const gradePool = useMemo(() => {
        if (!selectedGrade) return null;
        const norm = selectedGrade.replace('II', 'Ⅱ');
        const hanjaIds = HANJA_DATA.filter(h => h.grade && h.grade.replace('II', 'Ⅱ') === norm).map(h => h.id);
        return buildUnifiedPool(hanjaIds, HANJA_DATA, hanjaDataRef.current, hanjaDataRef.current, [], 0, wordDataRef.current);
    }, [selectedGrade]);

    const gradeWordCount = useMemo(() => {
        if (!selectedGrade) return null;
        const norm = selectedGrade.replace('II', 'Ⅱ');
        return HANJA_DATA
            .filter(h => h.grade && h.grade.replace('II', 'Ⅱ') === norm)
            .flatMap(h => (h.words || []).filter(w => w.type !== 'idiom'))
            .length || 10;
    }, [selectedGrade]);

    const gradeSentenceCount = useMemo(() => {
        if (!selectedGrade) return null;
        const norm = selectedGrade.replace('II', 'Ⅱ');
        return HANJA_DATA
            .filter(h => h.grade && h.grade.replace('II', 'Ⅱ') === norm)
            .flatMap(h => (h.words || []).filter(w =>
                w.type !== 'idiom' && typeof w.example === 'string' && w.example.trim().length > 0
            ))
            .length || 5;
    }, [selectedGrade]);

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
        if (hanjaIds.length - hanjaIdx < n) {
            hanjaIds = [...hanjaIds].sort(() => Math.random() - 0.5);
            hanjaIdx = 0;
        }
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
        if (wordIds.length - wordIdx < n) {
            wordIds = [...wordIds].sort(() => Math.random() - 0.5);
            wordIdx = 0;
        }
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
        hanjaData, wordData, studyLog, totalStats,
    });
    // OAuth 리디렉션 복귀를 포함해 로그인 상태가 확정된 뒤 계정 데이터를 1회 복원한다.
    useEffect(() => {
        if (authLoading || !user || !restoreFromCloud) return;
        // 복구 로직 버전이 바뀌면 기존 세션에서도 한 번 더 안전 병합한다.
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
    }, [authLoading, user, restoreFromCloud]);

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
            else setShowLoginModal(true);
        } finally {
            setAccountChoiceBusy(false);
        }
    }, [accountDataChoice, accountChoiceBusy, authSignOut, signInWithApple, signInWithGoogle, signInWithKakao]);

    const handleContinueWithoutLink = useCallback(() => {
        // 로컬 학습 기록은 그대로 두되 현재 로그인 계정에는 업로드하지 않는다.
        setAccountDataChoice(null);
    }, []);

    const getRewardXp = useCallback((xp) => {
        if (!xp || xp <= 0) return 0;
        return xp;
    }, []);

    const getRewardPreview = useCallback((xp) => {
        if (!xp || xp <= 0) return null;
        return { finalXp: xp };
    }, []);

    const addBonusXp = useCallback((xp) => {
        const finalXp = getRewardXp(xp);
        if (!finalXp) return;
        setUserXp(prev => prev + finalXp);
        logXp(finalXp);
    }, [getRewardXp, logXp]);

    const activateReferralForDailyClear = useCallback(async () => {
        if (!userRef.current) return;
        const result = await activateReferralAfterDailySession();
        if (result?.rewardXp) addBonusXp(result.rewardXp);
        const offerResult = await fetchReferralOffer();
        setReferralOffer(offerResult.offer || null);
    }, [addBonusXp]);

    // 캐릭터 토스트 메시지
    const [charToast, setCharToast] = useState(null);
    const [showRankUpModal, setShowRankUpModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const missionToastShownRef = useRef(false);
    const dismissToast = useCallback(() => setCharToast(null), []);

    // 진화 감지: XP 변화 시 imageRank 비교 → rank_up 토스트
    const prevXpRef = useRef(userXp);
    useEffect(() => {
        const prevXp = prevXpRef.current;
        prevXpRef.current = userXp;
        if (userXp <= prevXp) return;
        const oldRank = levelToImageRank(getLevel(prevXp));
        const newRank = levelToImageRank(getLevel(userXp));
        if (newRank > oldRank) setShowRankUpModal(true);
    }, [userXp]);

    // 캐릭터 토스트: 메인 화면 진입 시 하루 1번, 진화 임박 구간이면 rank_soon 메시지, 아니면 일반 응원 메시지
    const RANK_SOON_KEY = 'rank_soon_last_shown';
    const isInRankSoonZone = (level) => [3, 4, 7, 8, 11, 12, 15, 16].includes(level);
    const nextRankAvatar = useMemo(() => {
        const curRank = levelToImageRank(getLevel(userXp));
        const nextRank = Math.min(curRank + 1, 5);
        return selectedCharacter ? `/assets/images/characters/${selectedCharacter}/rank_${nextRank}.webp` : null;
    }, [userXp, selectedCharacter]);

    // 메인화면 진입할 때마다 오답 5개 이상이고 개수가 늘어났을 때만 복습 토스트
    useEffect(() => {
        if (currentScreen !== 'main' || !selectedCharacter) return;
        // DailySession이 실제로 보이는 중이면 스킵 (currentScreen이 'main'이더라도 DailySession이 렌더됨)
        if (!sessionDoneToday && canAccessStage(unlockedPack, currentDay)) return;
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

            // 오답이 5개 이상이고, 마지막으로 안내했던 개수보다 오답이 더 많아졌을 때만 팝업 노출
            if (currentWrongCount >= 5 && currentWrongCount > lastNotified) {
                timers.push(setTimeout(() => {
                    setCharToast('review_reminder');
                    localStorage.setItem('last_notified_wrong_count', String(currentWrongCount));
                }, baseDelay));
                showedReview = true;
                baseDelay += 5500; // review_reminder 자동 닫힘(4s) 후 여유
            }

            // 캐릭터 토스트: 하루 1번, 항상 노출 (진화 임박이면 rank_soon 메시지, 아니면 일반 응원)
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
    }, [currentScreen, hanjaData, wordData, selectedCharacter, sessionDoneToday, unlockedPack, currentDay]);

    const checkAndShowMissionToast = useCallback(() => {
        if (!allDone || missionToastShownRef.current) return;
        missionToastShownRef.current = true;
        setCharToast('mission_complete');
    }, [allDone]);

    // 미션 전체 완료 시: 팡파레 토스트만 표시한다. +200 XP는 updateMissionProgress에서 1회 지급.
    useEffect(() => {
        // 게임/학습 도중 팝업이 뜨면 안 보이거나 방해될 수 있으므로, 메인 화면이거나 데일리 세션 맵일 때 호출
        if (currentScreen === 'main') {
            checkAndShowMissionToast();
        }
    }, [allDone, currentScreen, checkAndShowMissionToast]);

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
                        archivedCompletedDay={archivedCompletedDay}
                        journeyRound={journeyRound}
                        isJourneyComplete={isJourneyComplete}
                        onOpenNewJourney={() => setShowNewJourneyModal(true)}
                        openMemoryVaultSignal={openMemoryVaultSignal}
                        onStartNextStage={() => {
                            if (!selectedGrade) {
                                const targetStage = selectedPastStage || (completedDay + 1);
                                if (!canAccessStage(unlockedPack, targetStage)) {
                                    setShowPremiumModal(true);
                                    return;
                                }
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
                    onBack={backToMain}
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
                        backToMain();
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
                    onBack={backToMain}
                    onHanjaAcquired={handleHanjaAcquired}
                    onStageClear={(round, elapsedSec, matches = 0) => { handleHanjaAcquired(null, 20 + matches * 3); updateMissionProgress('matchGame', 1, addBonusXp); addTodayStat('matchGame'); if (elapsedSec != null) updateRecord('matchBestTime', elapsedSec); }}
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
                    onBack={backToMain}
                    missionDone={missions?.find(m => m.type === 'shootGame')?.done ?? false}
                    onHanjaAcquired={handleHanjaAcquired}
                    selectedCharacter={selectedCharacter}
                    onWaveClear={(kills) => { updateMissionProgress('shootGame', 1, addBonusXp); addTodayStat('shootGame'); if (kills) updateRecord('totalMonsterKills', kills); }}
                    onMarkWrong={() => {}}
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
                        <div className="min-h-screen bg-[#F7FAF9] dark:bg-slate-900 flex flex-col items-center justify-center gap-6 px-8">
                            <div className="text-6xl">🎉</div>
                            <h2 className="font-medium text-2xl text-slate-800 dark:text-slate-100 tracking-tighter text-center">오답 한자가 없어요!</h2>
                            <p className="text-[#AEB7C5] dark:text-slate-400 font-normal text-center text-sm break-keep">퀴즈를 틀린 한자나 단어가 생기면<br/>여기서 몬스터로 나타납니다</p>
                            <button
                                onClick={() => setCurrentScreen('main')}
                                className="px-8 py-3 bg-emerald-500 text-white font-normal rounded-2xl border-b-4 border-emerald-700 active:translate-y-1 active:border-b-0 transition-all"
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
                    userXp={userXp}
                    contentPool={reviewPool}
                    isPremium={isPremium}
                />;
            }
            case 'sentenceQuiz':
                return <SentenceQuizScreen
                    onBack={backToMain}
                    onStageClear={(correct, total, newSeenWords) => {
                        if (newSeenWords) addMainSeenWords(newSeenWords);
                        handleHanjaAcquired(null, 20 + correct * 10);
                        if (hasPassedQuizMission(correct, total)) {
                            updateMissionProgress('sentenceQuiz', 1, addBonusXp);
                        }
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
                    quizCount={selectedGrade ? gradeSentenceCount : 5}
                    clearXp={20}
                />;
            case 'wordQuiz':
                return <WordQuizScreen
                    onBack={backToMain}
                    onStageClear={(correct, total, maxCombo, newSeenWords) => {
                        if (newSeenWords) addMainSeenWords(newSeenWords);
                        handleHanjaAcquired(null, 20 + correct * 5);
                        if (hasPassedQuizMission(correct, total)) {
                            updateMissionProgress('wordQuiz', 1, addBonusXp);
                        }
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
                    quizCount={selectedGrade ? gradeWordCount : 6}
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
            case 'idiomQuiz': {
                const activeHanja = HANJA_DATA.find(h => effectivePool?.main?.hanjaIds?.includes(h.id));
                const idiomGrade = selectedGrade || activeHanja?.grade || localStorage.getItem(SK.UNLOCKED_GRADE) || '8급';
                return <IdiomScreen
                    onBack={backToMain}
                    contentPool={effectivePool}
                    grade={idiomGrade}
                    day={activeStage}
                    userXp={userXp}
                    selectedCharacter={selectedCharacter}
                    getRewardPreview={getRewardPreview}
                    onHanjaAcquired={handleHanjaAcquired}
                    missionDone={missions?.find(m => m.type === 'idiomQuiz')?.done ?? false}
                    onComplete={(score = 0) => {
                        handleHanjaAcquired(null, 25 + score * 5);
                        updateMissionProgress('idiomQuiz', 1, addBonusXp);
                    }}
                />;
            }
            case 'gradeExamSelect':
                return <GradeExamSelectScreen
                    onBack={() => setCurrentScreen('main')}
                    onSelectGrade={(gradeName) => {
                        setSelectedDashboardGrade(gradeName);
                        setCurrentScreen('gradeStudyDashboard');
                    }}
                />;
            case 'gradeStudyDashboard':
                return <GradeStudyDashboardScreen
                    grade={selectedDashboardGrade}
                    onBack={() => {
                        setSelectedGrade(null);
                        setSelectedDashboardGrade(null);
                        setCurrentScreen('gradeExamSelect');
                    }}
                    onStartFocusStudy={() => {
                        setSelectedGrade(selectedDashboardGrade);
                        setCurrentScreen('flashcard');
                    }}
                    onStartWordQuiz={() => {
                        setSelectedGrade(selectedDashboardGrade);
                        setCurrentScreen('wordQuiz');
                    }}
                    onStartSentenceQuiz={() => {
                        setSelectedGrade(selectedDashboardGrade);
                        setCurrentScreen('sentenceQuiz');
                    }}
                    onStartMockTest={() => {
                        const getMockTestScreenId = (g) => {
                            if (g === '8급') return 'gradeTest';
                            if (g === '7급Ⅱ' || g === '7급II') return 'gradeTest72';
                            if (g === '7급') return 'gradeTest7';
                            if (g === '6급Ⅱ' || g === '6급II') return 'gradeTest62';
                            if (g === '6급') return 'gradeTest6';
                            return 'gradeTest';
                        };
                        setGradeTestBackScreen('gradeStudyDashboard');
                        setCurrentScreen(getMockTestScreenId(selectedDashboardGrade));
                    }}
                    unlockedPack={unlockedPack}
                    onShowPremiumModal={() => setShowPremiumModal(true)}
                    clearedHanjaIds={clearedHanjaIds}
                    hanjaData={hanjaData}
                    selectedCharacter={selectedCharacter}
                    onWriteHanja={(hanja) => {
                        setWriteTargetHanja(hanja);
                        setGradeTestBackScreen('gradeStudyDashboard');
                        setCurrentScreen('writing');
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
                    user={user}
                    onLogin={() => setShowLoginModal(true)}
                    linkIdentity={linkIdentity}
                    onLogout={async () => {
                        await authSignOut();
                        setUnlockedPack(0);
                        localStorage.setItem('unlocked_pack', '0');
                        setCurrentScreen('main');
                        return { success: true };
                    }}
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
                    finalJourney={finalJourney}
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

                {/* 강제 업데이트 모달 */}
                {versionInfo.needsUpdate && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.7)' }}>
                        <div className="update-modal-card w-full max-w-sm rounded-3xl p-8 text-center" style={{ background: '#fff' }}>
                            <div className="text-4xl mb-4">🆕</div>
                            <h2 className="text-xl font-medium text-gray-800 mb-2">업데이트 필요</h2>
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                새 버전({versionInfo.latestVersion})이 출시됐어요.<br />
                                계속하려면 앱을 업데이트해 주세요.
                            </p>
                            <a
                                href={versionInfo.storeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="block w-full py-4 rounded-full font-normal text-white text-[17px]"
                                style={{ background: 'linear-gradient(135deg, #2ED6C5, #0D9488)' }}
                            >
                                지금 업데이트
                            </a>
                        </div>
                    </div>
                )}

                <div className={`content-area relative z-10 ${currentScreen === 'matchGame' ? 'content-area--match-game' : ''}`}>
                    {showRankUpModal && (
                        <Suspense fallback={null}>
                            <RankUpModal
                                selectedCharacter={selectedCharacter}
                                userXp={userXp}
                                onClose={() => setShowRankUpModal(false)}
                            />
                        </Suspense>
                    )}

                    <Suspense fallback={<div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #DDF1EA 0%, #EAF6F2 100%)' }} />}>
                        {!selectedCharacter
                        ? <CharacterSelectionScreen
                            onSelect={(id, nick) => { setSelectedCharacter(id); setUserNickname(nick); }}
                          />
                        : !onboardingDone
                        ? <OnboardingScreen
                            selectedCharacter={selectedCharacter}
                            onComplete={(grade, xp) => {
                                setOnboardingDone(true);
                                handleHanjaAcquired(null, xp);
                            }}
                          />
                        : (!sessionDoneToday && canAccessStage(unlockedPack, currentDay)) || (import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview-final-journey'))
                                    ? <DailySessionScreen
                                        onComplete={({ skipLoginModal, isFinalJourney, hanjaCount } = {}) => {
                                            if (isFinalJourney) {
                                                claimFinalJourney({ hanjaCount });
                                                if (!finalJourney) addBonusXp(1240);
                                                setShowNewJourneyModal(true);
                                            }
                                            setSessionDoneToday(true);
                                            addBonusXp(200);
                                            activateReferralForDailyClear();
                                            if (userRef.current || skipLoginModal) {
                                                setCurrentScreen('main');
                                            } else {
                                                setShowSaveModal(true);
                                            }
                                        }}
                                        onNavigate={setCurrentScreen}
                                        onAdvanceDay={() => { advanceDay(); incrementTodaySessionCount(); }}
                                        currentDay={currentDay}
                                        journeyRound={journeyRound}
                                        srsData={hanjaData}
                                        masteryData={hanjaData}
                                        wordData={wordData}
                                        selectedCharacter={selectedCharacter}
                                        userNickname={userNickname}
                                        userXp={userXp}
                                        onMarkCorrect={(id) => { markCorrect(id); logHanja(id); }}
                                        onMarkWrong={(id) => { markWrong(id); logHanja(id); }}
                                        onMarkSeen={(id) => { markSeen(id); logHanja(id); }}
                                        onMarkWordWrong={(wordId, hanjaId, reading, meaning) => { markWordWrong(wordId, hanjaId, reading, meaning); logWrongWord(wordId); }}
                                        onWordCorrect={(wordId) => { logCorrectWord(wordId); markWordCorrect(wordId); }}
                                        onWordSeen={(wordId) => logWord(wordId)}
                                        onHanjaAcquired={handleHanjaAcquired}
                                        updateMissionProgress={updateMissionProgress}
                                        addBonusXp={addBonusXp}
                                        getRewardPreview={getRewardPreview}
                                        missions={sessionMissions}
                                        doneCount={doneCount}
                                        onMapIdle={checkAndShowMissionToast}
                                      />
                                    : renderScreen()
                        }
                    </Suspense>

                    {showNewJourneyModal && isJourneyComplete && (
                        <Suspense fallback={null}>
                            <NewJourneyModal
                                nextRound={journeyRound + 1}
                                onBrowseMemory={handleBrowseJourneyMemory}
                                onStart={handleStartNewJourney}
                                onClose={() => setShowNewJourneyModal(false)}
                            />
                        </Suspense>
                    )}
                </div>
                {charToast && selectedCharacter && (
                    <CharacterToast
                        type={charToast}
                        selectedCharacter={selectedCharacter}
                        userXp={userXp}
                        nextRankAvatar={nextRankAvatar}
                        nearRankUp={isInRankSoonZone(getLevel(userXp))}
                        onDismiss={dismissToast}
                        onAction={charToast === 'review_reminder' ? () => {
                            setCharToast(null);
                            setCurrentScreen('wrongVocabulary');
                        } : undefined}
                    />
                )}
                {showSaveModal && !user && selectedCharacter && (
                    <div
                        className="save-progress-modal fixed inset-0 z-[350] flex flex-col items-center justify-center px-6 animate-in fade-in duration-400 overflow-hidden"
                        style={{ background: 'linear-gradient(180deg, #C8EDE6 0%, #DDF1EA 40%, #EEF8F5 100%)' }}
                    >
                        {/* 배경 장식 원 */}
                        <div className="absolute top-[-60px] left-[-60px] w-52 h-52 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #2ED6C5, transparent)' }} />
                        <div className="absolute top-[10%] right-[-40px] w-36 h-36 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #0D9488, transparent)' }} />
                        <div className="absolute bottom-[30%] left-[-30px] w-28 h-28 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #2ED6C5, transparent)' }} />

                        {/* 캐릭터 */}
                        <img
                            src={getCharacterImage(selectedCharacter, 'success')}
                            alt="save progress"
                            className="w-44 h-44 object-contain drop-shadow-2xl mb-2 animate-in zoom-in duration-500"
                            style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, 'success')})` }}
                        />

                        {/* 텍스트 */}
                        <div className="text-center mb-5 px-2">
                            <h2 className="text-[1.6rem] font-medium text-slate-800 leading-tight mb-2">
                                오늘 학습을 저장해두세요!
                            </h2>
                            <p className="text-[0.9rem] font-normal text-slate-600 leading-relaxed break-keep">
                                로그인하면 스트릭, XP, 학습 기록이<br/>사라지지 않고 안전하게 보관돼요
                            </p>
                        </div>

                        {/* 오늘 획득 카드 */}
                        <div className="w-full max-w-xs mb-5 rounded-2xl px-5 py-4 flex justify-around"
                            style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(46,214,197,0.25)' }}>
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[1.3rem] font-medium text-teal-600">+200</span>
                                <span className="text-[0.7rem] font-normal text-slate-400">오늘 XP</span>
                            </div>
                            <div className="w-px bg-slate-200" />
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[1.3rem] font-medium text-teal-600">{streak?.count ?? 0}일</span>
                                <span className="text-[0.7rem] font-normal text-slate-400">연속 학습</span>
                            </div>
                            <div className="w-px bg-slate-200" />
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[1.3rem] font-medium text-teal-600">{currentDay}일차</span>
                                <span className="text-[0.7rem] font-normal text-slate-400">학습 진도</span>
                            </div>
                        </div>

                        {/* 소셜 로그인 버튼 직접 노출 */}
                        <div className="w-full max-w-xs flex flex-col gap-3">
                            {(platform === 'ios' || platform === 'web') && (
                                <button
                                    onClick={async () => {
                                        const result = await signInWithApple();
                                        if (result.success) { setShowSaveModal(false); setCurrentScreen('main'); setTimeout(() => setCharToast('rank_soon'), 1200); }
                                    }}
                                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-normal text-white text-base active:scale-95 transition-all"
                                    style={{ background: '#111', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                    </svg>
                                    Apple로 계속하기
                                </button>
                            )}
                            {(platform === 'android' || platform === 'web') && (
                                <button
                                    onClick={async () => {
                                        const result = await signInWithGoogle();
                                        if (result.success) { setShowSaveModal(false); setCurrentScreen('main'); setTimeout(() => setCharToast('rank_soon'), 1200); }
                                    }}
                                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-normal text-slate-700 text-base active:scale-95 transition-all border"
                                    style={{ background: '#fff', borderColor: 'rgba(0,0,0,0.12)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    Google로 계속하기
                                </button>
                            )}
                            {/* 카카오 — 모든 플랫폼 (웹 OAuth 리디렉트) */}
                            <button
                                onClick={async () => {
                                    const result = await signInWithKakao();
                                    if (result.success) { setShowSaveModal(false); setCurrentScreen('main'); setTimeout(() => setCharToast('rank_soon'), 1200); }
                                }}
                                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-normal text-[#191919] text-base active:scale-95 transition-all"
                                style={{ background: '#FEE500', boxShadow: '0 4px 16px rgba(254,229,0,0.4)' }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#191919">
                                    <path d="M12 3C7.03 3 3 6.36 3 10.5c0 2.64 1.68 4.95 4.2 6.3L6.3 20.1c-.09.27.21.48.45.33L11.1 17.7c.29.03.59.05.9.05 4.97 0 9-3.36 9-7.5S16.97 3 12 3z"/>
                                </svg>
                                카카오로 계속하기
                            </button>
                            <button
                                onClick={() => { setShowSaveModal(false); setCurrentScreen('main'); setTimeout(() => setCharToast('rank_soon'), 800); }}
                                className="w-full py-3 rounded-2xl font-normal text-slate-400 text-[0.95rem] active:scale-95 transition-all"
                            >
                                나중에 할게요
                            </button>
                        </div>
                    </div>
                )}
                <Suspense fallback={null}>
                    {showLoginModal && (
                        <LoginModal
                            platform={platform}
                            signInWithApple={signInWithApple}
                            signInWithGoogle={signInWithGoogle}
                            signInWithKakao={signInWithKakao}
                            onClose={() => setShowLoginModal(false)}
                        />
                    )}
                    {accountDataChoice && (
                        <AccountDataChoiceModal
                            previousProvider={accountDataChoice.previousProvider}
                            currentProvider={accountDataChoice.currentProvider}
                            localXp={accountDataChoice.localXp}
                            busy={accountChoiceBusy}
                            onUsePreviousLogin={handleUsePreviousLogin}
                            onContinueWithoutLink={handleContinueWithoutLink}
                        />
                    )}
                    {showPremiumModal && (
                        <PremiumModal
                            user={user}
                            referralOffer={referralOffer}
                            onClose={() => setShowPremiumModal(false)}
                            onShowLogin={() => {
                            setShowPremiumModal(false);
                            if (user) {
                                restoreFromCloud();
                            } else {
                                setShowLoginModal(true);
                            }
                        }}
                            avatarUrl={selectedCharacter ? getRankDetails(userXp, selectedCharacter).avatar : '/assets/images/characters/default_3d.webp'}
                            onPurchaseSuccess={(pack) => {
                                setUnlockedPack(pack);
                                setReferralOffer(null);
                                setShowPremiumModal(false);
                            }}
                            onReferralOfferConsumed={() => setReferralOffer(null)}
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
