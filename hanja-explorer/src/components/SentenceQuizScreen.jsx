import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import GradeGrid, { TopicCard } from './GradeGrid.jsx';
import { getRankDetails, getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../utils/rankUtils.js';
import { buildSessionPlan, buildHanjaStage, getSRSWeightedPool } from '../utils/learningPool.js';
import { GRADES, CATEGORY_IMAGES } from '../constants/hanjaConstants.js';
import { useUnlockedHanja } from '../hooks/useUnlockedHanja.js';
import CtaButton from './common/CtaButton.jsx';
import QuizResultOverlay from './common/QuizResultOverlay.jsx';
import QuizCard, { SpeakButton } from './common/QuizCard.jsx';
import { pickClearMessage } from '../constants/messages.js';
import QuizProgressBar from './QuizProgressBar.jsx';

const DEFAULT_QUIZ_COUNT = 5;
const DEFAULT_CLEAR_XP = 20;

const wordReadingMap = {};
HANJA_DATA.forEach(h => {
    (h.words || []).forEach(w => {
        if (w.word && w.reading) wordReadingMap[w.word] = w.reading;
    });
});

const getValidSentenceWords = (hanja) =>
    (hanja?.words || []).filter(w => w.id != null && w.word && w.meaning && w.type !== 'idiom');

const buildSentenceQueueFromWordIds = (wordIds, candidateHanja) => {
    const byWordId = new Map();
    (candidateHanja || []).forEach(h => {
        getValidSentenceWords(h).forEach(w => {
            byWordId.set(String(w.id), { hanja: h, wordItem: w });
        });
    });
    return (wordIds || []).map(id => byWordId.get(String(id))).filter(Boolean);
};

const SentenceQuizScreen = ({
    onBack, onHanjaAcquired, onMarkCorrect, onMarkWrong, onMarkWordWrong,
    onWordCorrect, onStageClear, onWordSeen, onGoToReview,
    srsData, masteryData, userLevel, userXp, selectedCharacter,
    getRewardPreview, contentPool, onGetNextWordIds, unlockedHanjaIds,
    currentDayHanjaIds, seenHanjaIds, mainSeenHanjaIds, seenWordIds,
    dailyMapNode, hideRetry,
    quizCount = DEFAULT_QUIZ_COUNT, clearXp = DEFAULT_CLEAR_XP,
}) => {
    const [viewMode, setViewMode] = useState('grade');
    const categories = useMemo(() => [...new Set(HANJA_DATA.map(h => h.category).filter(Boolean))], []);
    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
    const [selectedGrade, setSelectedGrade] = useState('전체');
    const characterAvatar = useMemo(() => getRankDetails(userXp, selectedCharacter).avatar, [userXp, selectedCharacter]);
    const { unlockedIds, unlockedGrades } = useUnlockedHanja(unlockedHanjaIds);

    const [started, setStarted] = useState(!!contentPool);
    const [showExitModal, setShowExitModal] = useState(false);
    const handleExitConfirm = () => { setShowExitModal(false); onBack(); };
    const [gameState, setGameState] = useState(contentPool ? 'init' : 'playing');
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [options, setOptions] = useState([]);
    const [questionKey, setQuestionKey] = useState(0);
    const [score, setScore] = useState(0);
    const scoreRef = useRef(0);
    const [totalAnswered, setTotalAnswered] = useState(0);
    const totalAnsweredRef = useRef(0);
    const [resultStats, setResultStats] = useState(null);
    const [resultClearMsg] = useState(() => pickClearMessage());
    const [plannedQuizTotal, setPlannedQuizTotal] = useState(quizCount);
    const completingRef = useRef(false);
    const [completing, setCompleting] = useState(false);
    const [currentAnswered, setCurrentAnswered] = useState(false);
    const [combo, setCombo] = useState(0);
    const clearCountRef = useRef(0);
    const stageClearArgsRef = useRef(null);
    const stageClearDeliveredRef = useRef(false);
    const shownWordsRef = useRef([]);
    const shownSimpleHanjaRef = useRef([]);
    const lastWordIdRef = useRef(null);
    const lastSimpleHanjaIdRef = useRef(null);

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
    }, [activeHanjaSet, srsData, masteryData, contentPool, currentDayHanjaIds, seenHanjaIds]);

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

    const endQuiz = useCallback(() => {
        if (completingRef.current) return;
        const finalStats = { correct: scoreRef.current, total: totalAnsweredRef.current, shownWords: [...shownWordsRef.current] };
        clearCountRef.current += 1;
        stageClearArgsRef.current = [finalStats.correct, finalStats.total, finalStats.shownWords];
        if (!dailyMapNode) {
            onStageClear?.(...stageClearArgsRef.current);
            stageClearDeliveredRef.current = true;
            stageClearArgsRef.current = null;
        }
        setResultStats(finalStats);
        completingRef.current = true;
        setCompleting(true);
        setTimeout(() => setGameState('result'), 750);
    }, [dailyMapNode, onStageClear]);

    const generateQuiz = useCallback(() => {
        if (activeHanjaSet.length === 0) return;
        setQuestionKey(k => k + 1);

        const hasWordPool = sessionPlan.normalPool.length > 0 || reviewQueueRef.current.length > 0;

        if (!hasWordPool) {
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
            let selectedHanja;
            if (reviewQueueRef.current.length > 0) {
                selectedHanja = reviewQueueRef.current.shift();
                lastHanjaIdRef.current = selectedHanja?.id ?? null;
            } else {
                selectedHanja = pickNextFromPool();
            }
            if (!selectedHanja) {
                endQuiz();
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
            const hasHanja = (s) => /[一-鿿]/.test(s);
            const targetIsHanja = hasHanja(targetWord.word);
            const allWords = HANJA_DATA.flatMap(h => (h.words || []).filter(w => w.word && w.type !== 'idiom' && hasHanja(w.word) === targetIsHanja).map(w => w.word));
            const distractors = [];
            while (distractors.length < 3) {
                const rw = allWords[Math.floor(Math.random() * allWords.length)];
                if (rw !== targetWord.word && !distractors.includes(rw)) distractors.push(rw);
            }
            setCurrentQuiz({ type: 'sentence', char: hanjaItem.hanja, target: targetWord, sentence: targetWord.example || `${targetWord.meaning} (${targetWord.word})`, _hanjaId: hanjaItem.id });
            setOptions([...distractors, targetWord.word].sort(() => 0.5 - Math.random()));
        }
        setGameState('playing');
    }, [sessionPlan, activeHanjaSet, pickNextFromPool, seenWordIds, onWordSeen, endQuiz]);

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
                const fallbackWordIds = [...(contentPool.main?.wordIds || []), ...(contentPool.review?.wordIds || [])].slice(0, quizCount);
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
        completingRef.current = false;
        clearCountRef.current = 0;
        setCompleting(false);
        setScore(0); scoreRef.current = 0;
        setTotalAnswered(0); totalAnsweredRef.current = 0;
        setResultStats(null);
        setCombo(0);
        setCurrentAnswered(false);
        setCurrentQuiz(null);
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

    const handleCorrect = useCallback((isFirstAttempt) => {
        totalAnsweredRef.current += 1;
        setTotalAnswered(totalAnsweredRef.current);
        scoreRef.current += 1;
        setScore(scoreRef.current);
        setCombo(c => c + 1);
        setCurrentAnswered(true);
        if (onHanjaAcquired) onHanjaAcquired(null, 10);
        const hanjaId = currentQuiz?._hanjaId || null;
        if (onMarkCorrect && hanjaId) onMarkCorrect(hanjaId);
        if (currentQuiz?.type === 'sentence' && currentQuiz.target?.id != null) onWordCorrect?.(currentQuiz.target.id);
    }, [currentQuiz, onHanjaAcquired, onMarkCorrect, onWordCorrect]);

    const handleWrong = useCallback(() => {
        const hanjaId = currentQuiz?._hanjaId || null;
        if (currentQuiz?.type === 'sentence' && onMarkWordWrong && currentQuiz.target) {
            onMarkWordWrong(currentQuiz.target.id, hanjaId, currentQuiz.target.reading, currentQuiz.target.meaning, currentQuiz.target.word);
        } else if (onMarkWrong && hanjaId) {
            onMarkWrong(hanjaId);
        }
    }, [currentQuiz, onMarkWordWrong, onMarkWrong]);

    const handleNext = useCallback(() => {
        setCurrentAnswered(false);
        const poolExhausted = reviewQueueRef.current.length === 0 && normalQueueRef.current.length === 0;
        if (totalAnsweredRef.current >= plannedQuizTotal || poolExhausted) {
            endQuiz();
        } else {
            generateQuiz();
        }
    }, [plannedQuizTotal, endQuiz, generateQuiz]);

    // ── 결과 오버레이 ─────────────────────────────────────────────────────
    const resultOverlay = (() => {
        if (!started || (gameState !== 'result' && !completing)) return null;
        const resultCorrect = resultStats?.correct ?? score;
        const resultTotal = Math.max(resultStats?.total ?? totalAnswered, 1);
        const isClear = resultCorrect >= resultTotal * 0.7;
        const xpPerCorrect = 10;
        const correctXp = resultCorrect * xpPerCorrect;
        const reward = getRewardPreview?.(correctXp + clearXp);
        const handleNextStage = () => {
            if (stageClearArgsRef.current && !stageClearDeliveredRef.current) {
                onStageClear?.(...stageClearArgsRef.current);
                stageClearDeliveredRef.current = true;
                stageClearArgsRef.current = null;
            }
        };
        return (
            <QuizResultOverlay
                isClear={isClear}
                completedLabel="문장 퀴즈 완료!"
                clearTitle={resultClearMsg}
                scoreNode={isClear
                    ? <>총 {resultTotal}문제 중 {resultCorrect}문제를 맞혔어요!<span className="text-[0.85em] inline-block ml-1">🔥</span></>
                    : '조금만 더 노력하면 성공할 수 있어요!'}
                selectedCharacter={selectedCharacter}
                dailyMapNode={dailyMapNode}
                reward={reward}
                correctXp={correctXp}
                clearXp={clearXp}
                detailText={`${resultCorrect}개 정답 x ${xpPerCorrect}XP + 완료 ${clearXp}XP`}
                missionXp={clearCountRef.current === 1 ? 30 : 0}
                onRetry={() => startQuiz()}
                onBack={() => { handleNextStage(); onBack(); }}
                onNextStage={handleNextStage}
                hideRetry={hideRetry}
            />
        );
    })();

    // ── 파생 값 ───────────────────────────────────────────────────────────
    const word = currentQuiz?.target?.word || '';
    const reading = wordReadingMap[word] || currentQuiz?.target?.reading || word;
    const meaning = currentQuiz?.target?.meaning || '';
    const speakText = currentQuiz?.type === 'sentence' ? reading : (currentQuiz?.sound || '');
    const currentAnswer = currentQuiz?.type === 'sentence' ? currentQuiz?.target?.word : currentQuiz?.answer;
    const isLastQuestion = totalAnswered >= plannedQuizTotal ||
        (reviewQueueRef.current.length === 0 && normalQueueRef.current.length === 0);
    const displayQuestionNumber = Math.max(1, Math.min(
        totalAnswered + (currentAnswered ? 0 : 1),
        plannedQuizTotal
    ));

    const sentenceParts = useMemo(() => {
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
    }, [currentQuiz]);

    return (
        <div className="w-full min-h-[100dvh] flex flex-col max-w-screen-xl mx-auto"
            style={{ backgroundColor: started ? '#F8FAF9' : '#F7FAF9' }}>

            {/* 헤더 */}
            <div className="w-full shrink-0 safe-top pt-2 px-4 mb-1">
                <div className="quiz-header-card quiz-header-card--sm">
                    <button onClick={started ? () => setShowExitModal(true) : onBack} className="hp-nav-button">
                        <span>{started ? '✕' : '←'}</span>
                    </button>
                    <div className="quiz-header-title-area">
                        <h2 className="quiz-screen-title">문장 퀴즈</h2>
                        <p className="screen-subtitle">빈칸에 알맞은 단어를 선택하세요</p>
                    </div>
                    <div className="quiz-header-right">
                        {started && <span className="quiz-counter-text">{displayQuestionNumber}/{plannedQuizTotal}</span>}
                    </div>
                </div>
                {started && (
                    <QuizProgressBar
                        current={totalAnswered - (currentAnswered ? 1 : 0)}
                        total={plannedQuizTotal}
                        answered={currentAnswered}
                        completing={completing}
                        avatar={characterAvatar}
                        charType={selectedCharacter}
/>
                )}
            </div>

            <div className="pb-6">
                <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-6 pt-5">

                    {/* 선택 화면 */}
                    {!started && (
                        <div className="flex flex-col items-center w-full animate-in fade-in duration-500">
                            <div className="flex bg-[#F4F7F8]/40 p-1.5 rounded-full border border-[#E9EDF2] w-full mb-4 shadow-inner">
                                <button onClick={() => setViewMode('grade')}
                                    className={`flex-1 px-8 py-3 rounded-full font-normal text-h3 transition-all ${viewMode === 'grade' ? 'bg-white shadow-md text-[#5B677A]' : 'text-[#AEB7C5]'}`}>
                                    급수별
                                </button>
                                <button onClick={() => setViewMode('topic')}
                                    className={`flex-1 px-8 py-3 rounded-full font-normal text-h3 transition-all ${viewMode === 'topic' ? 'bg-white shadow-md text-[#5B677A]' : 'text-[#AEB7C5]'}`}>
                                    주제별
                                </button>
                            </div>
                            {viewMode === 'grade' && (
                                <GradeGrid selected={selectedGrade} onSelect={g => setSelectedGrade(g)}
                                    lockedGrades={GRADES.filter(g => g !== '전체' && !unlockedGrades.has(g))} />
                            )}
                            {viewMode === 'topic' && (
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    {categories.map(cat => (
                                        <TopicCard key={cat} name={cat}
                                            imgSrc={CATEGORY_IMAGES[cat] ? `/assets/images/hanja_all/${CATEGORY_IMAGES[cat]}` : null}
                                            count={`${HANJA_DATA.filter(h => h.category === cat).length}개`}
                                            isSelected={selectedCategory === cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            locked={!HANJA_DATA.some(h => h.category === cat && unlockedIds.has(h.id))} />
                                    ))}
                                </div>
                            )}
                            <div className="flex flex-col items-center mt-4 mb-5 relative">
                                <div className="absolute top-4 left-[60%] z-20">
                                    <div className="px-5 py-2 rounded-2xl shadow-xl border border-white relative bg-white/90 backdrop-blur-md">
                                        <span className="text-body font-normal text-[#5B677A] whitespace-nowrap break-keep">준비됐어!</span>
                                        <div className="absolute -bottom-1.5 left-3 w-4 h-4 rotate-45 bg-white border-r border-b border-white" />
                                    </div>
                                </div>
                                <div className="relative z-10 w-36 h-36 flex items-center justify-center mt-10">
                                    <img src={characterAvatar} className="w-full h-full object-contain drop-shadow-2xl" alt="avatar" />
                                </div>
                                <div className="w-40 h-4 bg-slate-400/20 blur-lg rounded-[100%] scale-x-125 -mt-6" />
                            </div>
                            <div className="w-full max-w-sm px-4 pb-4 -mt-2.5">
                                <button onClick={() => startQuiz()}
                                    className="w-full py-5 rounded-[2rem] font-normal text-h3 text-white transition-all active:scale-95 shadow-[0_8px_24px_rgba(255,168,141,0.35)] flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none"
                                    style={{ background: 'linear-gradient(135deg,#FFA88D 0%,#FF8D72 100%)', borderBottom: '6px solid #E0735A' }}>
                                    <span>퀴즈 시작!</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 퀴즈 화면 */}
                    {started && currentQuiz && (gameState === 'playing' || gameState === 'result') && (
                        <QuizCard
                            key={questionKey}
                            choices={options}
                            correctAnswer={currentAnswer}
                            choiceClassName={currentQuiz.type === 'sentence' ? 'quiz-choice-btn--hanja' : ''}
                            cardAspect="aspect-[16/8] sm:aspect-[16/7]"
                            isFirst={true}
                            isLast={isLastQuestion}
                            completing={completing}
                            speakText={speakText}
                            xpAmount={10}
                            combo={combo}
                            onCorrect={handleCorrect}
                            onWrong={handleWrong}
                            onNext={handleNext}
                            onCorrectSelected={() => setCurrentAnswered(true)}
                            renderFront={({ isAnswered }) => (
                                <p className="quiz-example-font font-normal leading-[1.8] text-center text-[#5B677A]/90 break-keep">
                                    {currentQuiz.type === 'sentence' && sentenceParts ? (
                                        <>
                                            {sentenceParts.before}
                                            <span className="inline-block">
                                                <span
                                                    className={`inline-flex items-center justify-center min-w-[2em] px-2 rounded-2xl transition-all duration-300 mx-1 py-0.5 ${isAnswered
                                                        ? 'bg-[#7C83FF]/10 border-2 border-[#7C83FF] shadow-sm'
                                                        : 'bg-[#F8FAF9] border-2 border-dashed border-[#7C83FF]/30 shadow-inner'}`}
                                                    style={{ verticalAlign: 'baseline', minWidth: `${(currentQuiz.target?.word?.length || 1) * 1.5}em` }}
                                                >
                                                    <span className="quiz-example-font font-normal"
                                                        style={{ color: isAnswered ? '#7C83FF' : '#C3C6FF' }}>
                                                        {isAnswered ? currentQuiz.target.word : '?'}
                                                    </span>
                                                </span>
                                                {sentenceParts.particle}
                                            </span>
                                            {sentenceParts.remaining}
                                        </>
                                    ) : (
                                        <span className="text-7xl font-normal">{currentQuiz.char}</span>
                                    )}
                                </p>
                            )}
                            renderBack={({ isSpeaking, onSpeak }) => (
                                <>
                                    <SpeakButton isSpeaking={isSpeaking} onSpeak={(e) => { e.stopPropagation(); onSpeak(e); }} />
                                    <div className="quiz-card-back__content">
                                        {currentQuiz.type === 'sentence' ? (
                                            <>
                                                <div className="quiz-card-back__reading-row">
                                                    <span className="quiz-card-back__reading">{reading}</span>
                                                    <span className="quiz-card-back__hanja">({word})</span>
                                                </div>
                                                <div className="quiz-card-back__body">
                                                    <p className="quiz-card-back__text">{meaning}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="quiz-card-back__reading-row">
                                                    <span className="quiz-card-back__reading">{currentQuiz.sound}</span>
                                                    <span className="quiz-card-back__hanja">({currentQuiz.char})</span>
                                                </div>
                                                <div className="quiz-card-back__body">
                                                    <p className="quiz-card-back__text">{currentQuiz.meaning}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        />
                    )}
                </div>
            </div>

            {showExitModal && (
                <div className="modal-overlay">
                    <div className="exit-confirm-card">
                        <img src={getCharacterImage(selectedCharacter, 'keep_going')} alt="exit confirm"
                            className="img-shadow-sm"
                            style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter)}) scale(${getCharacterScale(selectedCharacter, 'keep_going')})` }} />
                        <div className="exit-confirm-content">
                            <h2 className="exit-confirm-title">
                                {dailyMapNode ? '학습 지도로 돌아갈까요?' : '정말 퀴즈를 중단할까요?'}
                            </h2>
                            <p className="body-muted break-keep">
                                {dailyMapNode ? '지도로 돌아가면 진행 중인 퀴즈는 완료되지 않아요. 계속 끝까지 풀어볼까요?' : '지금 나가면 진행 중인 퀴즈의 학습 진행 상황이 저장되지 않아요. 계속 끝까지 풀어볼까요?'}
                            </p>
                        </div>
                        <div className="result-btn-area">
                            <CtaButton theme="indigo" onClick={() => setShowExitModal(false)}>
                                <span className="quiz-cta-text">계속 공부하기</span>
                            </CtaButton>
                            <button onClick={handleExitConfirm} className="back-quiz-button">
                                {dailyMapNode ? '학습 지도로 돌아가기' : '그만하고 나가기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {resultOverlay}
        </div>
    );
};

export default SentenceQuizScreen;
