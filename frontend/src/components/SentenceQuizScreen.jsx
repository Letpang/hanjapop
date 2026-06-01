import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import GradeGrid, { TopicCard } from './GradeGrid.jsx';
import { getRankDetails, getCharacterImage } from '../utils/rankUtils.js';
import { buildSessionPlan, buildHanjaStage, getSRSWeightedPool } from '../utils/learningPool.js';
import { GRADES, CATEGORY_IMAGES } from '../constants/hanjaConstants.js';
import { useUnlockedHanja } from '../hooks/useUnlockedHanja.js';
import CtaButton from './common/CtaButton.jsx';
import RewardBreakdown from './common/RewardBreakdown.jsx';

const CELEB_MESSAGES = [
    "대단해요! 정답이에요",
    "한자 지식이 마구 쌓여요!",
    "정답을 꿰뚫는 혜안!",
    "완벽한 어휘력이에요!",
    "탐험 진도 쾌속 질주!",
    "한자 마스터의 감각!"
];

const DEFAULT_QUIZ_COUNT = 5;
const DEFAULT_CLEAR_XP = 20;

const wordReadingMap = {};
HANJA_DATA.forEach(h => {
    (h.words || []).forEach(w => {
        if (w.word && w.reading) wordReadingMap[w.word] = w.reading;
    });
});

const getValidSentenceWords = (hanja) => {
    return (hanja?.words || []).filter(w => w.id != null && w.word && w.meaning && w.type !== 'idiom');
};

const buildSentenceQueueFromWordIds = (wordIds, candidateHanja) => {
    const byWordId = new Map();
    (candidateHanja || []).forEach(h => {
        getValidSentenceWords(h).forEach(w => {
            byWordId.set(String(w.id), { hanja: h, wordItem: w });
        });
    });
    return (wordIds || []).map(id => byWordId.get(String(id))).filter(Boolean);
};

const speakKorean = (text, onEnd) => {
    if (!text) return;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    const audioUrl = `/assets/audio/words/word_${encodeURIComponent(text.trim())}.mp3`;
    const audio = new Audio(audioUrl);
    if (onEnd) audio.onended = onEnd;
    audio.play().catch(() => {
        if (!window.speechSynthesis) {
            if (onEnd) onEnd();
            return;
        }
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'ko-KR';
        utter.rate = 0.8;
        utter.pitch = 0.95;
        if (onEnd) utter.onend = onEnd;

        const voices = window.speechSynthesis.getVoices();
        const koVoices = voices.filter(v => v.lang.startsWith('ko') || v.lang.includes('ko-KR'));
        if (koVoices.length > 0) {
            const preferred = koVoices.find(v => {
                const name = v.name.toLowerCase();
                return name.includes('yuna') || name.includes('siri') || name.includes('sora') || name.includes('hyerim') || name.includes('hyejin') || name.includes('heami');
            }) || koVoices[0];
            utter.voice = preferred;
        }
        window.speechSynthesis.speak(utter);
    });
};

const SentenceQuizScreen = ({ onBack, onHanjaAcquired, onMarkCorrect, onMarkWrong, onMarkWordWrong, onWordCorrect, onStageClear, onWordSeen, onGoToReview, srsData, masteryData, userLevel, userXp, selectedCharacter, getRewardPreview, contentPool, onGetNextWordIds, unlockedHanjaIds, currentDayHanjaIds, seenHanjaIds, mainSeenHanjaIds, seenWordIds, dailyMapNode, hideRetry, quizCount = DEFAULT_QUIZ_COUNT, clearXp = DEFAULT_CLEAR_XP }) => {
    // ── 선택 상태 ──────────────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState('grade'); // 'grade' | 'topic'
    const categories = useMemo(() => [...new Set(HANJA_DATA.map(h => h.category).filter(Boolean))], []);

    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
    const [selectedGrade, setSelectedGrade] = useState('전체');

    const characterAvatar = useMemo(() => getRankDetails(userXp, selectedCharacter).avatar, [userXp, selectedCharacter]);

    const { unlockedIds, unlockedGrades } = useUnlockedHanja(unlockedHanjaIds);

    // ── 퀴즈 진행 상태 ────────────────────────────────────────────────────
    const [started, setStarted] = useState(!!contentPool);
    const [showExitModal, setShowExitModal] = useState(false);
    const handleExitConfirm = () => {
        setShowExitModal(false);
        onBack();
    };
    const [gameState, setGameState] = useState(contentPool ? 'init' : 'playing'); // 'init' | 'playing' | 'feedback' | 'result'
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [options, setOptions] = useState([]);
    const [score, setScore] = useState(0);
    const scoreRef = useRef(0); // stale 클로저 방지: handleNext에서 항상 최신값 사용
    const [totalAnswered, setTotalAnswered] = useState(0);
    const totalAnsweredRef = useRef(0); // stale 클로저 방지
    const [resultStats, setResultStats] = useState(null);
    const [plannedQuizTotal, setPlannedQuizTotal] = useState(quizCount);
    const [wrongAttempts, setWrongAttempts] = useState([]);
    const wrongMarkedRef = useRef(false); // 문제당 오답 기록 최초 1회만
    const [isCorrectSelected, setIsCorrectSelected] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [combo, setCombo] = useState(0);
    const [showXPPopup, setShowXPPopup] = useState(false);
    const [popupCombo, setPopupCombo] = useState(1);
    const [xpAnimKey, setXpAnimKey] = useState(0);
    const [isWordCardFlipped, setIsWordCardFlipped] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [celebrationMsg, setCelebrationMsg] = useState('');
    const clearCountRef = useRef(0);
    const celebrationIndexRef = useRef(0);
    const flipTimerRef = useRef(null);
    const flipSeqRef = useRef(0);
    const stageClearArgsRef = useRef(null); // 결과 화면 표시 후 "돌아가기" 시점에 onStageClear로 전달할 데이터
    const stageClearDeliveredRef = useRef(false);
    const shownWordsRef = useRef([]); // 이번 세션에서 출제된 단어 목록
    const shownSimpleHanjaRef = useRef([]);
    const lastWordIdRef = useRef(null);
    const lastSimpleHanjaIdRef = useRef(null);

    useEffect(() => {
        return () => {
            if (flipTimerRef.current) {
                clearTimeout(flipTimerRef.current);
                flipTimerRef.current = null;
            }
            flipSeqRef.current += 1;
            window.speechSynthesis?.cancel();
        };
    }, []);

    // ── 현재 선택된 한자 풀 ────────────────────────────────────────────────
    const activeHanjaSet = useMemo(() => {
        if (contentPool) {
            const allIds = new Set([...(contentPool.main?.hanjaIds || []), ...(contentPool.review?.hanjaIds || [])]);
            return HANJA_DATA.filter(h => allIds.has(h.id));
        }
        if (viewMode === 'grade') {
            if (selectedGrade === '전체') return HANJA_DATA.filter(h => unlockedIds.has(h.id));
            if (selectedGrade === '기타') return HANJA_DATA.filter(h => (!h.grade || h.grade === '' || h.grade === '기타' || h.grade === 'NON') && unlockedIds.has(h.id));
            return HANJA_DATA.filter(h => h.grade === selectedGrade && unlockedIds.has(h.id));
        }
        return HANJA_DATA.filter(h => h.category === selectedCategory && unlockedIds.has(h.id));
    }, [viewMode, selectedGrade, selectedCategory, contentPool, unlockedIds]);

    const reviewQueueRef = useRef([]);
    const normalQueueRef = useRef([]);
    const lastHanjaIdRef = useRef(null);
    const queuesReadyRef = useRef(false);

    const sessionPlan = useMemo(() => {
        const base = activeHanjaSet.filter(h => h.words && h.words.length > 0);
        return buildSessionPlan(base, srsData, masteryData, contentPool ? null : currentDayHanjaIds, seenHanjaIds?.length > 0 ? seenHanjaIds : null);
        // 큐는 여기서 초기화하지 않음 — srsData/masteryData 변경마다 리셋되는 버그 방지
    }, [activeHanjaSet, srsData, masteryData, contentPool, currentDayHanjaIds, seenHanjaIds]);

    // 메인화면 모드: 오늘 한자 중심 + SRS 복습을 섞은 짧은 세트 큐
    const buildMainQueue = useCallback(() => {
        if (!currentDayHanjaIds?.length) return null;
        const seenSet = new Set(mainSeenHanjaIds || []);
        const todaySet = new Set(currentDayHanjaIds);
        const srsSeenIds = new Set(Object.keys(srsData || {}).map(Number));
        const withWords = activeHanjaSet.filter(h => h.words?.length > 0);
        const todaySlots = Math.max(1, Math.ceil(quizCount * 0.7));
        const reviewSlots = Math.max(0, quizCount - todaySlots);

        const todayHanja = withWords.filter(h => todaySet.has(h.id));
        const unseenToday = todayHanja.filter(h => !seenSet.has(h.id)).sort(() => Math.random() - 0.5);
        const seenToday = todayHanja.filter(h => seenSet.has(h.id)).sort(() => Math.random() - 0.5);
        const todayPicked = [...unseenToday, ...seenToday].slice(0, todaySlots);

        const srsHanja = withWords.filter(h => srsSeenIds.has(h.id) && !todaySet.has(h.id));
        const srsPicked = getSRSWeightedPool(srsHanja, srsData, masteryData, userLevel, reviewSlots);

        return [...todayPicked, ...srsPicked];
    }, [activeHanjaSet, currentDayHanjaIds, mainSeenHanjaIds, masteryData, quizCount, srsData, userLevel]);

    const initQueues = useCallback((overridePlan) => {
        const plan = overridePlan || sessionPlan;
        reviewQueueRef.current = [...plan.reviewQueue].sort(() => 0.5 - Math.random());
        normalQueueRef.current = [...plan.normalPool].sort(() => 0.5 - Math.random());
        lastHanjaIdRef.current = null;
        queuesReadyRef.current = true;
    }, [sessionPlan]);

    const initQueuesRef = useRef(null);
    useEffect(() => { initQueuesRef.current = initQueues; });

    const pickNextFromPool = useCallback(() => {
        if (normalQueueRef.current.length === 0) return null;
        const next = normalQueueRef.current.shift();
        lastHanjaIdRef.current = next?.id ?? null;
        return next;
    }, []);

    // ── 문제 생성 ──────────────────────────────────────────────────────────
    const generateQuiz = useCallback(() => {
        if (activeHanjaSet.length === 0) return;
        if (flipTimerRef.current) {
            clearTimeout(flipTimerRef.current);
            flipTimerRef.current = null;
        }
        flipSeqRef.current += 1;
        window.speechSynthesis?.cancel();
        setIsWordCardFlipped(false);
        setIsSpeaking(false);
        setWrongAttempts([]);
        setIsCorrectSelected(false);
        setFeedback(null);
        setCelebrationMsg('');

        const hasWordPool = sessionPlan.normalPool.length > 0 || reviewQueueRef.current.length > 0;

        if (!hasWordPool) {
            // 단어 없는 경우 단순 한자 뜻/음 퀴즈
            const shownSet = new Set(shownSimpleHanjaRef.current);
            const unseen = activeHanjaSet.filter(h => !shownSet.has(h.id));
            const candidatePool = unseen.length > 0 ? unseen : activeHanjaSet;
            const nonConsecutivePool = candidatePool.filter(h => h.id !== lastSimpleHanjaIdRef.current);
            const finalPool = nonConsecutivePool.length > 0 ? nonConsecutivePool : candidatePool;
            const randomHanja = finalPool[Math.floor(Math.random() * finalPool.length)];
            if (randomHanja?.id != null) {
                if (unseen.length === 0) shownSimpleHanjaRef.current = [];
                shownSimpleHanjaRef.current = [...shownSimpleHanjaRef.current, randomHanja.id];
                lastSimpleHanjaIdRef.current = randomHanja.id;
            }
            const correct = randomHanja.meaning + ' ' + randomHanja.sound;
            const distractors = HANJA_DATA.filter(h => h.id !== randomHanja.id)
                .sort(() => 0.5 - Math.random()).slice(0, 3).map(h => h.meaning + ' ' + h.sound);
            setCurrentQuiz({ type: 'simple', char: randomHanja.hanja, answer: correct, meaning: randomHanja.meaning, sound: randomHanja.sound, _hanjaId: randomHanja.id });
            setOptions([...distractors, correct].sort(() => 0.5 - Math.random()));
        } else {
            // 복습 큐 우선 소진, 이후 셔플 큐에서 순환
            let selectedHanja;
            if (reviewQueueRef.current.length > 0) {
                selectedHanja = reviewQueueRef.current.shift();
                lastHanjaIdRef.current = selectedHanja?.id ?? null;
            } else {
                selectedHanja = pickNextFromPool();
            }
            if (!selectedHanja) {
                const finalStats = { correct: scoreRef.current, total: totalAnsweredRef.current, shownWords: [...shownWordsRef.current] };
                stageClearArgsRef.current = [finalStats.correct, finalStats.total, finalStats.shownWords];
                if (!dailyMapNode) {
                    onStageClear?.(...stageClearArgsRef.current);
                    stageClearDeliveredRef.current = true;
                    stageClearArgsRef.current = null;
                }
                setResultStats(finalStats);
                setGameState('result');
                return;
            }
            const queueItem = selectedHanja;
            const hanjaItem = queueItem.hanja || queueItem;
            const forcedWord = queueItem.wordItem || null;
            const validWords = forcedWord ? [forcedWord] : getValidSentenceWords(hanjaItem);
            const seenSet = seenWordIds?.length > 0 ? new Set(seenWordIds) : null;
            const shownWordSet = new Set(shownWordsRef.current);
            const sessionUnseenWords = validWords.filter(w => !shownWordSet.has(w.id));
            const sessionPool = sessionUnseenWords.length > 0 ? sessionUnseenWords : validWords;
            const appUnseenWords = seenSet ? sessionPool.filter(w => !seenSet.has(w.id)) : [];
            const preferredPool = appUnseenWords.length > 0 ? appUnseenWords : sessionPool;
            const nonConsecutivePool = preferredPool.filter(w => w.id !== lastWordIdRef.current);
            const wordPool = nonConsecutivePool.length > 0 ? nonConsecutivePool : preferredPool;
            const targetWord = wordPool[Math.floor(Math.random() * wordPool.length)] ?? validWords[0];
            if (targetWord?.id != null) {
                if (!shownWordsRef.current.includes(targetWord.id)) {
                    shownWordsRef.current = [...shownWordsRef.current, targetWord.id];
                }
                lastWordIdRef.current = targetWord.id;
                onWordSeen?.(targetWord.id);
            }
            const allWords = HANJA_DATA.flatMap(h => (h.words || []).map(w => w.word).filter(Boolean));
            const distractors = [];
            while (distractors.length < 3) {
                const rw = allWords[Math.floor(Math.random() * allWords.length)];
                if (rw !== targetWord.word && !distractors.includes(rw)) distractors.push(rw);
            }
            setCurrentQuiz({ type: 'sentence', char: hanjaItem.hanja, target: targetWord, sentence: targetWord.example || `${targetWord.meaning} (${targetWord.word})`, _hanjaId: hanjaItem.id });
            setOptions([...distractors, targetWord.word].sort(() => 0.5 - Math.random()));
        }
        setFeedback(null);
        setGameState('playing');
    }, [sessionPlan, activeHanjaSet, pickNextFromPool, seenWordIds, onWordSeen, dailyMapNode, onStageClear]);

    // 퀴즈 시작
    function startQuiz(overridePlan) {
        if (stageClearArgsRef.current && !stageClearDeliveredRef.current) {
            onStageClear?.(...stageClearArgsRef.current);
            stageClearDeliveredRef.current = true;
            stageClearArgsRef.current = null;
        }
        let plan = overridePlan;
        if (!plan) {
            if (contentPool) {
                const base = activeHanjaSet.filter(h => h.words?.length > 0);
                const fallbackWordIds = [
                    ...(contentPool.main?.wordIds || []),
                    ...(contentPool.review?.wordIds || []),
                ].slice(0, quizCount);
                let wordIds = onGetNextWordIds?.(quizCount) || fallbackWordIds;
                let wordQueue = buildSentenceQueueFromWordIds(wordIds, base);
                let refillAttempts = 0;
                while (onGetNextWordIds && wordQueue.length < quizCount && refillAttempts < 3) {
                    const refillIds = onGetNextWordIds(quizCount - wordQueue.length);
                    if (!refillIds.length) break;
                    wordIds = [...wordIds, ...refillIds];
                    wordQueue = buildSentenceQueueFromWordIds(wordIds, base);
                    refillAttempts += 1;
                }
                wordQueue = wordQueue.slice(0, quizCount);
                if (wordQueue.length > 0) {
                    plan = { reviewQueue: wordQueue, normalPool: [] };
                } else {
                    const stage = buildHanjaStage(contentPool, base, srsData, masteryData, seenHanjaIds || [], quizCount);
                    if (stage.length > 0) plan = { reviewQueue: [...stage], normalPool: [] };
                }
            } else if (currentDayHanjaIds?.length > 0) {
                const queue = buildMainQueue();
                if (queue?.length > 0) plan = { reviewQueue: queue, normalPool: [] };
            }
        }
        const effectivePlan = plan || sessionPlan;
        const plannedCount = (effectivePlan.reviewQueue?.length || 0) + (effectivePlan.normalPool?.length || 0);
        setPlannedQuizTotal(plannedCount > 0 ? Math.min(quizCount, plannedCount) : quizCount);
        initQueues(effectivePlan);
        shownWordsRef.current = [];
        shownSimpleHanjaRef.current = [];
        lastWordIdRef.current = null;
        lastSimpleHanjaIdRef.current = null;
        stageClearDeliveredRef.current = false;
        setScore(0); scoreRef.current = 0;
        setTotalAnswered(0); totalAnsweredRef.current = 0;
        setResultStats(null);
        setCombo(0);
        setCurrentQuiz(null); setFeedback(null);
        setStarted(true);
        setGameState('playing');
    }

    const startQuizRef = useRef(null);
    useEffect(() => { startQuizRef.current = startQuiz; });
    useEffect(() => {
        if (contentPool == null || (gameState !== 'init' && gameState !== 'idle')) return undefined;

        const timer = setTimeout(() => startQuizRef.current?.(), 0);
        return () => clearTimeout(timer);
    }, [contentPool, gameState]);

    useEffect(() => {
        if (!started || gameState !== 'playing' || currentQuiz) return undefined;

        const timer = setTimeout(() => generateQuiz(), 0);
        return () => clearTimeout(timer);
    }, [started, gameState, currentQuiz, generateQuiz]);

    const handleAnswer = (selected) => {
        if (gameState !== 'playing' || !currentQuiz || isCorrectSelected || wrongAttempts.includes(selected)) return;

        const correctAnswer = currentQuiz.type === 'sentence'
            ? currentQuiz.target.word
            : currentQuiz.answer;
        const isCorrect = selected === correctAnswer;

        if (isCorrect) {
            const newCombo = combo + 1;
            setIsCorrectSelected(true);
            const nextMsg = CELEB_MESSAGES[celebrationIndexRef.current % CELEB_MESSAGES.length];
            celebrationIndexRef.current += 1;
            setCelebrationMsg(nextMsg);
            setFeedback({ isCorrect: true, selected });
            if (currentQuiz?.type === 'sentence') {
                if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
                const flipSeq = flipSeqRef.current + 1;
                flipSeqRef.current = flipSeq;
                flipTimerRef.current = setTimeout(() => {
                    if (flipSeqRef.current !== flipSeq) return;
                    setIsWordCardFlipped(true);
                    flipTimerRef.current = null;
                    handleSpeak();
                }, 1500);
            }
            totalAnsweredRef.current += 1;
            setTotalAnswered(totalAnsweredRef.current);
            scoreRef.current += 1;
            setScore(scoreRef.current);
            setCombo(newCombo);
            setPopupCombo(newCombo);
            if (onHanjaAcquired) {
                setShowXPPopup(false);
                setTimeout(() => {
                    setShowXPPopup(true);
                    setXpAnimKey(k => k + 1);
                    setTimeout(() => setShowXPPopup(false), 1500);
                }, 0);
                onHanjaAcquired(null, 10);
            }
            const hanjaId = currentQuiz._hanjaId || null;
            if (onMarkCorrect && hanjaId) onMarkCorrect(hanjaId);
            if (currentQuiz.type === 'sentence' && currentQuiz.target?.id != null) onWordCorrect?.(currentQuiz.target.id);
            setGameState('feedback');
        } else {
            setWrongAttempts(prev => [...prev, selected]);
            if (!wrongMarkedRef.current) {
                wrongMarkedRef.current = true;
                const hanjaId = currentQuiz._hanjaId || null;
                if (currentQuiz.type === 'sentence' && onMarkWordWrong && currentQuiz.target) {
                    onMarkWordWrong(currentQuiz.target.id, hanjaId, currentQuiz.target.reading, currentQuiz.target.meaning, currentQuiz.target.word);
                } else if (onMarkWrong && hanjaId) {
                    onMarkWrong(hanjaId);
                }
            }
        }
    };

    const handleNext = () => {
        window.speechSynthesis?.cancel();
        if (flipTimerRef.current) {
            clearTimeout(flipTimerRef.current);
            flipTimerRef.current = null;
        }
        flipSeqRef.current += 1;
        setIsWordCardFlipped(false);
        setIsSpeaking(false);
        const poolExhausted = reviewQueueRef.current.length === 0 && normalQueueRef.current.length === 0;
        if (totalAnsweredRef.current >= plannedQuizTotal || poolExhausted) {
            const finalStats = { correct: scoreRef.current, total: totalAnsweredRef.current, shownWords: [...shownWordsRef.current] };
            if (finalStats.correct / finalStats.total >= 0.7) {
                clearCountRef.current += 1;
            }
            stageClearArgsRef.current = [finalStats.correct, finalStats.total, finalStats.shownWords];
            if (!dailyMapNode) {
                onStageClear?.(...stageClearArgsRef.current);
                stageClearDeliveredRef.current = true;
                stageClearArgsRef.current = null;
            }
            setResultStats(finalStats);
            setGameState('result');
        } else {
            wrongMarkedRef.current = false;
            generateQuiz();
            setWrongAttempts([]);
            setIsCorrectSelected(false);
            setFeedback(null);
            setCelebrationMsg('');
        }
    };

    const handleSpeak = (e) => {
        e?.stopPropagation();
        const reading = currentQuiz?.target ? wordReadingMap[currentQuiz.target.word] || currentQuiz.target.reading || currentQuiz.target.word : '';
        if (!reading) return;
        setIsSpeaking(true);
        speakKorean(reading, () => setIsSpeaking(false));
    };

    // ── 결과 화면 ──────────────────────────────────────────────────────────
    if (started && gameState === 'result') {
        const resultCorrect = resultStats?.correct ?? score;
        const resultTotal = Math.max(resultStats?.total ?? totalAnswered, 1);
        const isClear = resultCorrect >= resultTotal * 0.7;
        const xpPerCorrect = 10;
        const correctXp = resultCorrect * xpPerCorrect;
        const reward = getRewardPreview?.(correctXp + clearXp);

        // 데일리 세션 모드: 지도 + 단일 버튼 (WordQuizScreen과 동일한 패턴)
        if (dailyMapNode) {
            return (
                <div className="quiz-result-backdrop">
                    <div className="w-full max-w-sm flex flex-col items-center overflow-hidden rounded-[2.5rem] bg-white border-4 border-white shadow-[0_20px_50px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] relative animate-in zoom-in-95 duration-200">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2ED6C5] rounded-full blur-[80px] opacity-20 pointer-events-none" />

                        <div className="pt-10 pb-8 px-7 flex flex-col items-center gap-6 w-full relative z-10">
                            {/* 텍스트 영역 */}
                            <div className="text-center flex flex-col gap-1 w-full">
                                {!isClear && <span className="text-sm font-extrabold text-[#94A3B8]">아쉬운 결과네요...</span>}
                                <h1 className="text-3xl font-black leading-tight mt-1" style={{ color: isClear ? '#FF9B73' : '#FF6B6B', letterSpacing: '-0.02em', textShadow: isClear ? '0 2px 10px rgba(255,160,120,0.15)' : 'none' }}>
                                    {isClear ? '와우! 참 잘했어요!' : <>괜찮아요,<br/>다시 도전해봐요!</>}
                                </h1>
                                <p className="body-muted break-keep mt-2">
                                    {isClear
                                        ? <>총 {resultTotal}문제 중 {resultCorrect}문제를 맞혔어요!<span className="text-[0.85em] inline-block ml-1">🔥</span></>
                                        : '조금만 더 노력하면 성공할 수 있어요!'}
                                </p>
                            </div>

                            {/* 여정 지도 */}
                            <div className="w-full">
                                {dailyMapNode}
                            </div>

                            <RewardBreakdown
                                reward={reward}
                                correctXp={correctXp}
                                clearXp={clearXp}
                                detailText={`${resultCorrect}문제 x ${xpPerCorrect}XP + 완료 ${clearXp}XP`}
                                missionXp={(clearCountRef.current === 1) ? 30 : 0}
                            />

                            {/* 다음 단계 버튼 */}
                            <div className="w-full mt-3">
                                <CtaButton theme="coral" onClick={() => {
                                    if (stageClearArgsRef.current && !stageClearDeliveredRef.current) {
                                        onStageClear?.(...stageClearArgsRef.current);
                                        stageClearDeliveredRef.current = true;
                                        stageClearArgsRef.current = null;
                                    }
                                }}>
                                    <span className="quiz-cta-text">다음 단계로 이동</span>
                                    <span className="quiz-cta-text ml-2">▶</span>
                                </CtaButton>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // 일반 모드: 기존 결과 카드
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300"
                style={{ background: isClear ? 'linear-gradient(180deg, #DDF1EA 0%, #EAF6F2 100%)' : 'linear-gradient(180deg, #FDEAEA 0%, #FFF0F0 100%)' }}
            >
                <div className="w-full max-w-sm flex flex-col items-center result-card-container overflow-visible">
                    <div className="pt-6 pb-10 px-6 flex flex-col items-center gap-7 w-full relative">

                        {/* 캐릭터 아래 백그라운드 글로우 추가 */}
                        <div className="absolute top-[28px] w-[140px] h-[140px] rounded-full blur-xl z-0" style={{ backgroundColor: 'rgba(255,255,255,0.65)' }} />

                        {/* 아이콘 */}
                        <img
                            src={isClear ? getCharacterImage(selectedCharacter, 'success') : getCharacterImage(selectedCharacter, 'failure')}
                            alt={isClear ? "clear" : "fail"}
                            className="w-[176px] h-[176px] object-contain relative z-10 mt-4"
                            className="img-shadow-lg"
                        />

                        {/* 텍스트 */}
                        <div className="text-center flex flex-col gap-2 relative z-10 -mt-5">
                            {!isClear && <span className="text-xs-res font-extrabold text-[#AEB7C5]">아쉬운 결과네요...</span>}
                            <h1 className="text-h2-res font-black leading-snug" style={{
                                color: isClear ? '#FF9B73' : '#FF6B6B',
                                letterSpacing: '-0.5px',
                                textShadow: isClear ? '0 2px 10px rgba(255,160,120,0.16)' : 'none'
                            }}>
                                {isClear ? '와우! 참 잘했어요!' : <>괜찮아요,<br />다시 도전해봐요!</>}
                            </h1>
                            <p className="body-muted break-keep">
                                {isClear
                                    ? <>총 {resultTotal}문제 중 {resultCorrect}문제를 맞혔어요!<span className="text-[0.85em] inline-block ml-1">🔥</span></>
                                    : '조금만 더 노력하면 성공할 수 있어요!'}
                            </p>
                        </div>

                        <RewardBreakdown
                            reward={reward}
                            correctXp={correctXp}
                            clearXp={clearXp}
                            detailText={`${resultCorrect}문제 x ${xpPerCorrect}XP + 완료 ${clearXp}XP`}
                            missionXp={(clearCountRef.current === 1) ? 30 : 0}
                        />

                        {/* 버튼 2단 */}
                        <div className="w-full flex flex-col gap-3 relative z-10">
                            {!hideRetry && (
                                <CtaButton theme="coral" onClick={() => startQuiz()}>
                                    <span className="quiz-cta-text">다시 풀기</span>
                                </CtaButton>
                            )}
                            <button
                                onClick={() => {
                                    if (stageClearArgsRef.current && !stageClearDeliveredRef.current) {
                                        onStageClear?.(...stageClearArgsRef.current);
                                        stageClearDeliveredRef.current = true;
                                        stageClearArgsRef.current = null;
                                    }
                                    onBack();
                                }}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg active:scale-95 transition-all shadow-sm back-quiz-button"
                            >
                                돌아가기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── 퀴즈 진행 화면 ────────────────────────────────────────────────────
    if (started && currentQuiz) {
        const currentAnswer = currentQuiz?.type === 'sentence' ? currentQuiz?.target?.word : currentQuiz?.answer;
        const word = currentQuiz?.target?.word || '';
        const reading = wordReadingMap[word] || currentQuiz?.target?.reading || word;
        const meaning = currentQuiz?.target?.meaning || '';
        const displayQuestionNumber = Math.max(
            1,
            Math.min(totalAnswered + (gameState === 'playing' ? 1 : 0), plannedQuizTotal)
        );

        const sentenceParts = (() => {
            if (!currentQuiz?.sentence || !currentQuiz.sentence.includes('(')) return null;
            const parts = currentQuiz.sentence.split('(');
            const before = parts[0];
            const rest = parts[1].split(')');
            const wordVal = rest[0];
            const after = rest[1] || '';
            
            const particleMatch = after.match(/^([^\s]+)/);
            const particle = particleMatch ? particleMatch[1] : '';
            const remaining = after.substring(particle.length);
            
            return { before, word: wordVal, particle, remaining };
        })();

        return (
            <div className="quiz-screen quiz-screen--plain" className="bg-[#F8FAF9]">
                <style>{`
                    @keyframes star-burst-1 {
                        0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; }
                        50% { opacity: 1; }
                        100% { transform: translate(-80px, -45px) scale(1.2) rotate(180deg); opacity: 0; }
                    }
                    @keyframes star-burst-2 {
                        0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; }
                        50% { opacity: 1; }
                        100% { transform: translate(80px, -35px) scale(1) rotate(-120deg); opacity: 0; }
                    }
                    @keyframes star-burst-3 {
                        0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; }
                        50% { opacity: 1; }
                        100% { transform: translate(-45px, -65px) scale(1.3) rotate(90deg); opacity: 0; }
                    }
                    @keyframes star-burst-4 {
                        0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; }
                        50% { opacity: 1; }
                        100% { transform: translate(45px, -65px) scale(0.9) rotate(-90deg); opacity: 0; }
                    }
                    @keyframes star-burst-5 {
                        0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; }
                        50% { opacity: 1; }
                        100% { transform: translate(-65px, 35px) scale(1.1) rotate(140deg); opacity: 0; }
                    }
                    @keyframes star-burst-6 {
                        0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; }
                        50% { opacity: 1; }
                        100% { transform: translate(65px, 35px) scale(1) rotate(-140deg); opacity: 0; }
                    }
                    @keyframes pop-bubble {
                        0% { transform: scale(0.8) translateY(10px) translateX(-50%); opacity: 0; }
                        100% { transform: scale(1) translateY(0) translateX(-50%); opacity: 1; }
                    }
                    @keyframes fade-out-up {
                        0% { transform: scale(1) translateY(0) translateX(-50%); opacity: 1; }
                        100% { transform: scale(0.9) translateY(-10px) translateX(-50%); opacity: 0; }
                    }
                `}</style>

                {/* XP 팝업 오버레이 */}
                {showXPPopup && (
                    <div
                        key={xpAnimKey}
                        className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100]"
                        style={{ animation: 'xpFloat 1.5s ease-in-out forwards', paddingBottom: '120px' }}
                    >
                        <div className="flex flex-col items-center gap-2">
                            {popupCombo > 1 && (
                                <div
                                    className="px-4 py-1.5 rounded-full font-extrabold text-white text-sm"
                                    style={{ backgroundColor: '#4A51D4', boxShadow: '0 4px 12px rgba(74,81,212,0.45)' }}
                                >
                                    🔥 {popupCombo}연속 정답!
                                </div>
                            )}
                            <div className="xp-popup-badge">
                                ⭐ +10 XP
                            </div>
                        </div>
                    </div>
                )}

                {/* 헤더 */}
                <div className="w-full shrink-0 safe-top pt-2 px-4 mb-1">
                    <div className="quiz-header-card quiz-header-card--sm">
                        <button onClick={started ? () => setShowExitModal(true) : onBack}
                            className="hp-nav-button">
                            <span>{started ? '✕' : '←'}</span>
                        </button>
                        <div className="quiz-header-title-area">
                            <h2 className="quiz-screen-title">문장 퀴즈</h2>
                            <p className="screen-subtitle">빈칸에 알맞은 단어를 선택하세요</p>
                        </div>
                        <div className="quiz-header-right">
                            <span className="quiz-counter-text">{displayQuestionNumber}/{plannedQuizTotal}</span>
                        </div>
                    </div>
                    <div className="w-full h-[10px] bg-[#F4F7F8] rounded-full mt-2 relative px-1 mx-auto max-w-[90%]">
                        <div
                            className="h-full transition-all duration-700 rounded-full bg-[#7C83FF] relative"
                            style={{ width: `${(displayQuestionNumber / plannedQuizTotal) * 100}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-9 h-9 bg-white rounded-full shadow-xl border-2 border-[#7C83FF] flex items-center justify-center overflow-hidden z-10 transition-all duration-700">
                                <img src={characterAvatar} className="w-7 h-7 object-contain" alt="progress-pawn" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 본문 */}
                <div className="flex-1 overflow-y-auto pb-6">
                    <div className="w-full max-w-xl mx-auto px-4 pt-3 flex flex-col gap-7">

                        {/* 문제 카드 (플립) */}
                        <div
                            className="relative w-full aspect-[21/9] sm:aspect-[16/10]"
                            style={{ perspective: '2000px' }}
                            onClick={() => {
                                if (isCorrectSelected && currentQuiz?.type === 'sentence') {
                                    setIsWordCardFlipped(f => !f);
                                    if (!isWordCardFlipped) handleSpeak();
                                }
                            }}
                        >
                            <div
                                className={`relative w-full h-full transition-all duration-700 ${isCorrectSelected ? 'cursor-pointer shadow-2xl' : ''} rounded-[4rem]`}
                                style={{
                                    transform: isWordCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                    transformStyle: 'preserve-3d',
                                    WebkitTransformStyle: 'preserve-3d',
                                }}
                            >
                                {/* 앞면: 빈칸 문장 */}
                                <div
                                    className="absolute inset-0 bg-white rounded-[2.5rem] border-[10px] border-white flex flex-col items-center justify-center px-8 overflow-hidden"
                                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', zIndex: isWordCardFlipped ? 0 : 1 }}
                                >
                                    <p className="font-bold leading-[1.8] text-center text-[#5B677A]/90 break-keep" style={{ fontSize: 'clamp(1.2rem, 5vw, 1.875rem)' }}>
                                        {currentQuiz?.type === 'sentence' && sentenceParts ? (
                                            <>
                                                {sentenceParts.before}
                                                <span className="inline-block whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center justify-center min-w-[120px] rounded-2xl transition-all duration-300 mx-2 py-0.5 ${feedback
                                                                ? (feedback.isCorrect ? 'bg-[#7C83FF]/10 border-2 border-[#7C83FF] shadow-sm' : 'bg-rose-50 border-2 border-rose-400 shadow-sm')
                                                                : 'bg-[#F8FAF9] border-2 border-dashed border-[#7C83FF]/30 shadow-inner'
                                                            }`}
                                                        style={{ verticalAlign: 'baseline' }}
                                                    >
                                                        <span
                                                            className="font-bold"
                                                            style={{ fontSize: 'clamp(1.2rem, 5vw, 1.875rem)' }}
                                                            style={{
                                                                color: feedback ? (feedback.isCorrect ? '#7C83FF' : '#E05C5C') : '#C3C6FF'
                                                            }}
                                                        >
                                                            {feedback ? currentQuiz.target.word : '?'}
                                                        </span>
                                                    </span>
                                                    {sentenceParts.particle}
                                                </span>
                                                {sentenceParts.remaining}
                                            </>
                                        ) : (
                                            <span className="text-7xl font-black">{currentQuiz?.char}</span>
                                        )}
                                    </p>
                                </div>

                                {/* 뒷면: 단어 정보 */}
                                {isCorrectSelected && currentQuiz?.type === 'sentence' && (
                                <div
                                    className="absolute inset-0 bg-white rounded-[2.5rem] border-[10px] border-white flex flex-col items-center justify-center px-6 py-4 shadow-xl overflow-y-auto"
                                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', zIndex: isWordCardFlipped ? 1 : 0 }}
                                >
                                    {/* 우상단 스피커 아이콘 */}
                                    <button
                                        onClick={handleSpeak}
                                        className={`absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-sm border-2 border-slate-100 ${isSpeaking ? 'bg-[#7C83FF] text-white' : 'bg-[#F8FAF9] text-[#AEB7C5] hover:bg-[#F2F3FF] hover:text-[#7C83FF]'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                    </button>

                                    <div className="flex flex-col items-center gap-2 max-h-full my-auto w-full">
                                        {/* 상단: 한자음 및 한자어 그룹 (가로 배치) */}
                                        <div className="flex flex-row items-baseline gap-3 justify-center">
                                            <span className="text-5xl sm:text-[4.5rem] font-black text-[#4F56D9] tracking-tighter leading-none" style={{ textShadow: '0 0 10px rgba(79,86,217,0.10)' }}>
                                                {reading}
                                            </span>
                                            <span className="text-xl sm:text-2xl font-bold text-[#AEB7C5] tracking-widest">
                                                ({word})
                                            </span>
                                        </div>

                                        {/* 하단: 의미 영역 */}
                                        <div className="w-full flex flex-col items-center text-center px-1 mt-5">
                                            <p className="text-body-res font-medium text-[#5B677A] leading-relaxed break-keep tracking-tight">
                                                <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-[#7C83FF]/10 text-[#7C83FF] text-sm font-black mr-2 shadow-sm border border-[#7C83FF]/20 transform -translate-y-0.5">
                                                    의미
                                                </span>
                                                {meaning}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>

                        {/* 선택지 */}
                        <div className="grid grid-cols-1 gap-2 w-full">
                            {options.map((opt, i) => {
                                const isWrong = wrongAttempts.includes(opt);
                                const isCorrect = isCorrectSelected && opt === currentAnswer;
                                return (
                                    <button
                                        key={i}
                                        disabled={isCorrectSelected}
                                        onClick={() => handleAnswer(opt)}
                                        className={`quiz-choice-btn ${isCorrect ? 'quiz-choice-btn--correct' : isWrong ? 'quiz-choice-btn--wrong' : isCorrectSelected ? 'quiz-choice-btn--dimmed' : ''}`}
                                    >
                                        <span>{opt}</span>
                                        {isCorrect && <span className="text-[#7C83FF] shrink-0 ml-2">✓</span>}
                                        {isWrong && <span className="text-[#FF8D72] shrink-0 ml-2">✕</span>}

                                        {/* 정답 축하 3D 스피치 버블 및 별 쏟아짐 효과 */}
                                        {isCorrect && celebrationMsg && (
                                            <div 
                                                className="absolute bottom-[125%] left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-[1.3rem] text-white font-extrabold text-[1.05rem] shadow-xl flex items-center justify-center whitespace-nowrap z-[20] pointer-events-none"
                                                style={{
                                                    background: 'linear-gradient(135deg, #FF9B73 0%, #FF6B6B 100%)',
                                                    boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3), inset 0 -3px 0 rgba(0,0,0,0.15)',
                                                    animation: 'pop-bubble 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, fade-out-up 0.3s ease-in 1.2s forwards'
                                                }}
                                            >
                                                <span className="drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.15)]">{celebrationMsg}</span>
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#FF6B6B]" />
                                            </div>
                                        )}

                                        {isCorrect && (
                                            <>
                                                <span className="absolute left-[15%] top-1/2 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-1 1s ease-out forwards' }}>⭐</span>
                                                <span className="absolute left-[35%] top-1/2 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-2 1.2s ease-out forwards' }}>✨</span>
                                                <span className="absolute left-[45%] top-1/3 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-3 0.9s ease-out forwards' }}>⭐</span>
                                                <span className="absolute left-[55%] top-1/2 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-4 1.1s ease-out forwards' }}>✨</span>
                                                <span className="absolute left-[65%] top-1/2 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-5 1.3s ease-out forwards' }}>⭐</span>
                                                <span className="absolute left-[85%] top-1/3 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-6 1s ease-out forwards' }}>✨</span>
                                                <span className="absolute left-[25%] top-2/3 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-3 1.1s ease-out forwards' }}>⭐</span>
                                                <span className="absolute left-[75%] top-2/3 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-1 1.2s ease-out forwards' }}>✨</span>
                                            </>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 네비게이션 버튼 */}
                        {isCorrectSelected && (
                            <div className="w-full flex gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                <button disabled className="quiz-prev-btn flex-[1.5] opacity-30">
                                    이전
                                </button>
                                <button onClick={handleNext} className="quiz-next-btn flex-[2.5]">
                                    {totalAnswered >= plannedQuizTotal ? '결과 보기' : '다음'}
                                </button>
                            </div>
                        )}

                    </div>
                </div>
                {showExitModal && (
                    <div className="modal-overlay">
                        <div className="quiz-result-card">
                            <img
                                src={getCharacterImage(selectedCharacter, 'keep_going')}
                                alt="exit confirm"
                                className="quiz-char-img"
                                className="img-shadow-sm"
                            />
                            <div className="quiz-result-content">
                                <h2 className="quiz-result-title">
                                    {dailyMapNode ? '학습 지도로 돌아갈까요?' : '정말 퀴즈를 중단할까요?'}
                                </h2>
                                <p className="body-muted break-keep">
                                    {dailyMapNode ? '지도로 돌아가면 진행 중인 퀴즈는 완료되지 않아요. 계속 끝까지 풀어볼까요?' : '지금 나가면 진행 중인 퀴즈의 학습 진행 상황이 저장되지 않아요. 계속 끝까지 풀어볼까요?'}
                                </p>
                            </div>
                            <div className="w-full flex flex-col gap-3">
                                <CtaButton theme="indigo" onClick={() => setShowExitModal(false)}>
                                    <span className="quiz-cta-text">계속 공부하기</span>
                                </CtaButton>
                                <button
                                    onClick={handleExitConfirm}
                                    className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg active:scale-95 transition-all shadow-sm back-quiz-button"
                                >
                                    {dailyMapNode ? '학습 지도로 돌아가기' : '그만하고 나가기'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── 선택 화면 (급수/주제별 탭 + 시작 버튼) ────────────────────────────
    return (
        <div className="quiz-screen quiz-screen--plain" style={{ backgroundColor: '#F7FAF9' }}>
            {/* 헤더 */}
            <div className="quiz-header-wrap quiz-header-wrap--sm">
                <div className="quiz-header-card quiz-header-card--wide">
                    <button onClick={onBack}
                        className="hp-nav-button">
                        <span>←</span>
                    </button>
                    <div className="quiz-header-title-area">
                        <h2 className="quiz-screen-title">문장 퀴즈</h2>
                        <p className="screen-subtitle">빈칸에 알맞은 단어를 선택하세요</p>
                    </div>
                    <div className="w-11" />
                </div>
            </div>

            {/* 바디 */}
            <div className="flex-1 overflow-y-auto pb-6">
                <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-6 pt-5">

                    {/* 탭 */}
                    <div className="flex bg-[#F4F7F8]/40 p-1.5 rounded-full border border-[#E9EDF2] w-full mb-4 shadow-inner">
                        <button
                            onClick={() => setViewMode('grade')}
                            className={`flex-1 px-8 py-3 rounded-full font-bold text-h3 transition-all ${viewMode === 'grade' ? 'bg-white shadow-md text-[#5B677A]' : 'text-[#AEB7C5]'}`}
                        >
                            급수별
                        </button>
                        <button
                            onClick={() => setViewMode('topic')}
                            className={`flex-1 px-8 py-3 rounded-full font-bold text-h3 transition-all ${viewMode === 'topic' ? 'bg-white shadow-md text-[#5B677A]' : 'text-[#AEB7C5]'}`}
                        >
                            주제별
                        </button>
                    </div>

                    {/* 급수별 선택 */}
                    {viewMode === 'grade' && (
                        <GradeGrid
                            selected={selectedGrade}
                            onSelect={g => setSelectedGrade(g)}
                            lockedGrades={GRADES.filter(g => g !== '전체' && !unlockedGrades.has(g))}
                        />
                    )}

                    {/* 주제 선택 */}
                    {viewMode === 'topic' && (
                        <div className="grid grid-cols-2 gap-4 w-full">
                            {categories.map(cat => (
                                <TopicCard
                                    key={cat}
                                    name={cat}
                                    imgSrc={CATEGORY_IMAGES[cat] ? `/assets/images/hanja_all/${CATEGORY_IMAGES[cat]}` : null}
                                    count={`${HANJA_DATA.filter(h => h.category === cat).length}개`}
                                    isSelected={selectedCategory === cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    locked={!HANJA_DATA.some(h => h.category === cat && unlockedIds.has(h.id))}
                                />
                            ))}
                        </div>
                    )}

                    {/* 캐릭터 영역 */}
                    <div className="flex flex-col items-center mt-4 mb-5 relative">
                        <div className="absolute top-4 left-[60%] z-20">
                            <div className="quiz-bubble">
                                <span className="text-body font-bold text-[#5B677A] whitespace-nowrap break-keep">준비됐어!</span>
                                <div className="absolute -bottom-1.5 left-3 w-4 h-4 rotate-45 bg-white border-r border-b border-white" />
                            </div>
                        </div>
                        <div className="relative z-10 w-36 h-36 flex items-center justify-center mt-10">
                            <img src={characterAvatar} className="w-full h-full object-contain drop-shadow-2xl" alt="avatar" />
                        </div>
                        <div className="w-40 h-4 bg-slate-400/20 blur-lg rounded-[100%] scale-x-125 -mt-6" />
                    </div>

                    {/* 게임 시작 버튼 */}
                    <div className="w-full max-w-sm px-4 pb-4 -mt-2.5">
                        <button
                            onClick={() => startQuiz()}
                            className="w-full py-5 rounded-[2rem] font-bold text-h3 text-white transition-all active:scale-95 shadow-[0_8px_24px_rgba(255,168,141,0.35)] flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none"
                            style={{
                                background: 'linear-gradient(135deg, #FFA88D 0%, #FF8D72 100%)',
                                borderBottom: '6px solid #E0735A'
                            }}
                        >
                            <span>퀴즈 시작!</span>
                        </button>
                    </div>
                </div>
            </div>
            {showExitModal && (
                <div className="modal-overlay">
                    <div className="quiz-result-card">
                        <img
                            src={getCharacterImage(selectedCharacter, 'keep_going')}
                            alt="exit confirm"
                            className="quiz-char-img"
                            className="img-shadow-sm"
                        />
                        <div className="quiz-result-content">
                            <h2 className="quiz-result-title">
                                {dailyMapNode ? '학습 지도로 돌아갈까요?' : '정말 퀴즈를 중단할까요?'}
                            </h2>
                            <p className="body-muted break-keep">
                                {dailyMapNode ? '지도로 돌아가면 진행 중인 퀴즈는 완료되지 않아요. 계속 끝까지 풀어볼까요?' : '지금 나가면 진행 중인 퀴즈의 학습 진행 상황이 저장되지 않아요. 계속 끝까지 풀어볼까요?'}
                            </p>
                        </div>
                        <div className="w-full flex flex-col gap-3">
                            <CtaButton theme="indigo" onClick={() => setShowExitModal(false)}>
                                <span className="quiz-cta-text">계속 공부하기</span>
                            </CtaButton>
                            <button
                                onClick={handleExitConfirm}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg active:scale-95 transition-all shadow-sm back-quiz-button"
                            >
                                {dailyMapNode ? '학습 지도로 돌아가기' : '그만하고 나가기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SentenceQuizScreen;
