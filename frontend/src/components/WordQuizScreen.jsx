import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import GradeGrid, { TopicCard } from './GradeGrid.jsx';
import { getRankDetails, getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../utils/rankUtils.js';
import { getWordSRSWeightedPool } from '../utils/learningPool.js';
import { GRADES, CATEGORY_IMAGES } from '../constants/hanjaConstants.js';
import { useUnlockedHanja } from '../hooks/useUnlockedHanja.js';
import CtaButton from './common/CtaButton.jsx';
import QuizResultOverlay from './common/QuizResultOverlay.jsx';
import QuizCard, { SpeakButton } from './common/QuizCard.jsx';
import { pickClearMessage } from '../constants/messages.js';
import QuizProgressBar from './QuizProgressBar.jsx';

const buildWordPool = () => {
    const pool = [];
    for (const h of HANJA_DATA) {
        if (!h.words || h.words.length === 0) continue;
        for (const w of h.words) {
            if (w.word && w.meaning && w.type !== 'idiom') {
                pool.push({
                    id: w.id,
                    hanja_char: h.hanja,
                    hanja_id: h.id,
                    grade: h.grade,
                    category: h.category || '',
                    word: w.word,
                    reading: w.reading || '',
                    meaning: w.meaning,
                    example: w.example || '',
                });
            }
        }
    }
    return pool;
};

const WORD_POOL = buildWordPool();
const ALL_MEANINGS = [...new Set(WORD_POOL.map(w => w.meaning))];
const CATEGORIES = [...new Set((HANJA_DATA || []).map(h => h.category).filter(Boolean))];

const DEFAULT_QUIZ_COUNT = 6;
const DEFAULT_CLEAR_XP = 20;

const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const pickDistractors = (correctMeaning, count = 3) => {
    const others = ALL_MEANINGS.filter(m => m !== correctMeaning);
    return shuffle(others).slice(0, count);
};

const capQuizCount = (items, quizCount) => items.slice(0, quizCount);

const buildQuizFromPool = (contentPool, wordData, userLevel, seenWordIds = [], quizCount = DEFAULT_QUIZ_COUNT) => {
    const mainIdSet = new Set(contentPool.main?.wordIds || []);
    const reviewIdSet = new Set(contentPool.review?.wordIds || []);
    const mainWords = WORD_POOL.filter(w => mainIdSet.has(w.id));
    const reviewWords = WORD_POOL.filter(w => reviewIdSet.has(w.id));

    const seenSet = new Set(seenWordIds);
    const allSeen = [...mainWords, ...reviewWords].every(w => seenSet.has(w.id));
    const effectiveSeenSet = allSeen ? new Set() : seenSet;

    const unseen = (pool) => pool.filter(w => !effectiveSeenSet.has(w.id));
    const seen   = (pool) => pool.filter(w =>  effectiveSeenSet.has(w.id));
    const pickFrom = (pool, count) => {
        const u = getWordSRSWeightedPool(unseen(pool), wordData, userLevel, count);
        const need = count - u.length;
        const usedIds = new Set(u.map(w => w.id));
        const s = need > 0 ? getWordSRSWeightedPool(seen(pool).filter(w => !usedIds.has(w.id)), wordData, userLevel, need) : [];
        return [...u, ...s];
    };

    const ratio = contentPool.ratio ?? 1.0;
    const targetMain   = Math.min(Math.round(quizCount * ratio), mainWords.length);
    const targetReview = Math.min(quizCount - targetMain, reviewWords.length);
    const mainPicked   = pickFrom(mainWords, targetMain);
    const reviewPicked = pickFrom(reviewWords, targetReview);
    const usedIds   = new Set([...mainPicked, ...reviewPicked].map(w => w.id));
    const shortfall = quizCount - mainPicked.length - reviewPicked.length;
    const fillPicked = shortfall > 0 ? pickFrom(mainWords.filter(w => !usedIds.has(w.id)), shortfall) : [];
    return shuffle(capQuizCount([...mainPicked, ...reviewPicked, ...fillPicked], quizCount))
        .map(item => ({ ...item, choices: shuffle([item.meaning, ...pickDistractors(item.meaning)]) }));
};

const buildQuizFromWordIds = (wordIds = []) =>
    wordIds.map(id => WORD_POOL.find(w => w.id === id)).filter(Boolean)
        .map(item => ({ ...item, choices: shuffle([item.meaning, ...pickDistractors(item.meaning)]) }));

const buildQuiz = (filter, filterType, wordData, userLevel, allowedIds = null, quizCount = DEFAULT_QUIZ_COUNT) => {
    let pool;
    if (filterType === 'topic') {
        pool = WORD_POOL.filter(w => w.category === filter);
    } else {
        pool = filter === '전체' ? WORD_POOL : WORD_POOL.filter(w => w.grade === filter);
    }
    if (allowedIds) pool = pool.filter(w => allowedIds.has(w.hanja_id));
    if (pool.length < 4) pool = allowedIds ? WORD_POOL.filter(w => allowedIds.has(w.hanja_id)) : WORD_POOL;
    return capQuizCount(getWordSRSWeightedPool(pool, wordData, userLevel, quizCount), quizCount)
        .map(item => ({ ...item, choices: shuffle([item.meaning, ...pickDistractors(item.meaning)]) }));
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const WordQuizScreen = ({
    onBack, onHanjaAcquired, onMarkCorrect, onMarkWrong, onMarkWordWrong,
    onWordCorrect, onStageClear, onWordSeen, onGoToReview,
    srsData, masteryData, wordData, userLevel, userXp, selectedCharacter,
    getRewardPreview, contentPool, onGetNextWordIds, unlockedHanjaIds,
    seenWordIds, dailyMapNode, hideRetry,
    quizCount = DEFAULT_QUIZ_COUNT, clearXp = DEFAULT_CLEAR_XP,
}) => {
    const [viewMode, setViewMode] = useState('grade');
    const [gradeFilter, setGradeFilter] = useState('전체');
    const [categoryFilter, setCategoryFilter] = useState(CATEGORIES[0] || '');
    const [phase, setPhase] = useState(contentPool ? 'init' : 'select');
    const [showExitModal, setShowExitModal] = useState(false);
    const handleExitConfirm = () => { setShowExitModal(false); onBack(); };

    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const correctCountRef = useRef(0);
    const [combo, setCombo] = useState(0);
    const [, setMaxCombo] = useState(0);
    const comboRef = useRef(0);
    const maxComboRef = useRef(0);
    const clearCountRef = useRef(0);
    const completingRef = useRef(false);
    const [completing, setCompleting] = useState(false);
    const [currentAnswered, setCurrentAnswered] = useState(false);
    const stageClearArgsRef = useRef(null);
    const stageClearDeliveredRef = useRef(false);
    const [resultClearMsg] = useState(() => pickClearMessage());

    const characterAvatar = useMemo(() => getRankDetails(userXp, selectedCharacter).avatar, [userXp, selectedCharacter]);
    const { unlockedIds, unlockedGrades } = useUnlockedHanja(unlockedHanjaIds);

    const startQuiz = useCallback((overrideFilter, overrideViewMode) => {
        if (stageClearArgsRef.current && !stageClearDeliveredRef.current) {
            onStageClear?.(...stageClearArgsRef.current);
            stageClearDeliveredRef.current = true;
            stageClearArgsRef.current = null;
        }
        if (contentPool) {
            const sharedWordIds = onGetNextWordIds?.(quizCount) || [];
            const sharedQuestions = buildQuizFromWordIds(sharedWordIds);
            setQuestions(sharedQuestions.length > 0
                ? sharedQuestions
                : buildQuizFromPool(contentPool, wordData, userLevel, seenWordIds || [], quizCount));
        } else {
            const effectiveViewMode = overrideViewMode || viewMode;
            const filter = overrideFilter != null ? overrideFilter : (effectiveViewMode === 'topic' ? categoryFilter : gradeFilter);
            setQuestions(buildQuiz(filter, effectiveViewMode, wordData, userLevel, unlockedIds, quizCount));
        }
        setCurrentIdx(0);
        setCorrectCount(0); correctCountRef.current = 0;
        comboRef.current = 0; setCombo(0);
        setMaxCombo(0); maxComboRef.current = 0;
        stageClearDeliveredRef.current = false;
        completingRef.current = false; setCompleting(false);
        setPhase('quiz');
    }, [viewMode, gradeFilter, categoryFilter, wordData, userLevel, contentPool, onGetNextWordIds, unlockedIds, seenWordIds, quizCount, onStageClear]);

    const startQuizRef = useRef(null);
    useEffect(() => { startQuizRef.current = startQuiz; });
    useEffect(() => {
        if (!contentPool || (phase !== 'select' && phase !== 'init')) return;
        const timer = setTimeout(() => startQuizRef.current?.(), 0);
        return () => clearTimeout(timer);
    }, [contentPool, phase]);

    const handleCorrect = useCallback((isFirstAttempt) => {
        const q = questions[currentIdx];
        if (q?.id != null) onWordSeen?.(q.id);
        setCurrentAnswered(true);
        if (isFirstAttempt) {
            correctCountRef.current += 1;
            setCorrectCount(correctCountRef.current);
            comboRef.current += 1;
            setCombo(comboRef.current);
            const newMax = Math.max(maxComboRef.current, comboRef.current);
            maxComboRef.current = newMax;
            setMaxCombo(newMax);
        } else {
            comboRef.current = 0;
            setCombo(0);
        }
        if (onHanjaAcquired && q?.hanja_id) onHanjaAcquired(q.hanja_id, 5);
        if (onMarkCorrect && q?.hanja_id) onMarkCorrect(q.hanja_id);
        if (onWordCorrect) onWordCorrect(q.id);
    }, [questions, currentIdx, onHanjaAcquired, onMarkCorrect, onWordCorrect, onWordSeen]);

    const handleWrong = useCallback(() => {
        comboRef.current = 0;
        setCombo(0);
        const q = questions[currentIdx];
        if (onMarkWordWrong && q?.id != null) onMarkWordWrong(q.id, q.hanja_id, q.reading, q.meaning, q.word);
    }, [questions, currentIdx, onMarkWordWrong]);

    const handleNext = useCallback(() => {
        if (completingRef.current) return;
        const next = currentIdx + 1;
        if (next < questions.length) {
            setCurrentAnswered(false);
            setCurrentIdx(next);
        } else {
            const seenWords = [...new Set(questions.map(q => q.id).filter(v => v != null))];
            if (correctCountRef.current / questions.length >= 0.7) clearCountRef.current += 1;
            stageClearArgsRef.current = [correctCountRef.current, questions.length, maxComboRef.current, seenWords];
            if (!dailyMapNode) {
                onStageClear?.(...stageClearArgsRef.current);
                stageClearDeliveredRef.current = true;
                stageClearArgsRef.current = null;
            }
            completingRef.current = true;
            setCompleting(true);
            setTimeout(() => setPhase('result'), 750);
        }
    }, [questions, currentIdx, dailyMapNode, onStageClear]);

    const handlePrev = useCallback(() => {
        if (currentIdx > 0) { setCurrentAnswered(false); setCurrentIdx(currentIdx - 1); }
    }, [currentIdx]);

    const q = questions[currentIdx];
    const wordLen = q?.word?.length || 0;
    const wordFontSize = wordLen > 6 ? 'text-[3.5rem] sm:text-[4.5rem]'
        : wordLen > 4 ? 'text-[4.5rem] sm:text-[6rem]'
        : 'text-[6rem] sm:text-[8rem]';

    return (
        <div className="w-full min-h-[100dvh] flex flex-col max-w-screen-xl mx-auto"
            style={{ backgroundColor: phase === 'select' ? '#F7FAF9' : '#F8FAFC' }}>

            {/* 헤더 */}
            <div className="w-full shrink-0 safe-top pt-2 px-4 mb-1">
                <div className="quiz-header-card quiz-header-card--sm">
                    <button onClick={(phase === 'quiz' || phase === 'result') ? () => setShowExitModal(true) : onBack} className="hp-nav-button">
                        <span>{(phase === 'quiz' || phase === 'result') ? '✕' : '←'}</span>
                    </button>
                    <div className="quiz-header-title-area">
                        <h2 className="quiz-screen-title">단어 퀴즈</h2>
                        <p className="screen-subtitle">한자의 뜻과 음을 골라보세요</p>
                    </div>
                    <div className="quiz-header-right">
                        {(phase === 'quiz' || phase === 'result') && <span className="quiz-counter-text">{currentIdx + 1}/{questions.length}</span>}
                    </div>
                </div>
                {(phase === 'quiz' || phase === 'result') && (
                    <QuizProgressBar current={currentIdx} total={questions.length} answered={currentAnswered} completing={completing} avatar={characterAvatar} charType={selectedCharacter} />
                )}
            </div>

            {/* Body */}
            <div className="pb-6">
                <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-6 pt-5">

                    {/* 선택 화면 */}
                    {phase === 'select' && (
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
                                <GradeGrid selected={gradeFilter} onSelect={g => setGradeFilter(g)}
                                    lockedGrades={GRADES.filter(g => g !== '전체' && !unlockedGrades.has(g))} />
                            )}
                            {viewMode === 'topic' && (
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    {CATEGORIES.map(cat => (
                                        <TopicCard key={cat} name={cat}
                                            imgSrc={CATEGORY_IMAGES[cat] ? `/assets/images/hanja_all/${CATEGORY_IMAGES[cat]}` : null}
                                            count={`${HANJA_DATA.filter(h => h.category === cat).length}개`}
                                            isSelected={categoryFilter === cat}
                                            onClick={() => setCategoryFilter(cat)}
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
                    {(phase === 'quiz' || phase === 'result') && q && (
                        <QuizCard
                            key={currentIdx}
                            choices={q.choices}
                            correctAnswer={q.meaning}
                            choiceGridClassName="quiz-choice-grid word-quiz-choice-grid"
                            isFirst={currentIdx === 0}
                            isLast={currentIdx === questions.length - 1}
                            completing={completing}
                            speakText={q.reading}
                            xpAmount={5}
                            suppressXp={!!contentPool}
                            combo={combo}
                            onCorrect={handleCorrect}
                            onWrong={handleWrong}
                            onNext={handleNext}
                            onPrev={handlePrev}
                            onCorrectSelected={() => setCurrentAnswered(true)}
                            renderFront={() => (
                                <span className={`hanja-char ${wordFontSize} font-normal text-[#1e293b] tracking-tighter drop-shadow-sm text-center leading-none`}>
                                    {q.word}
                                </span>
                            )}
                            renderBack={({ isSpeaking, onSpeak }) => (
                                <>
                                    <SpeakButton isSpeaking={isSpeaking} onSpeak={(e) => { e.stopPropagation(); onSpeak(e); }} />
                                    <div className="quiz-card-back__content">
                                        <div className="quiz-card-back__reading-row">
                                            <span className="quiz-card-back__reading">{q.reading}</span>
                                            <span className="quiz-card-back__hanja">({q.word})</span>
                                        </div>
                                        <div className="quiz-card-back__body">
                                            <p className="quiz-card-back__text">
                                                <span className="quiz-card-back__badge">예문</span>
                                                {q.example ? q.example.replace(/\(\s*\)/g, q.word).trim().replace(/\s+/g, ' ') : ''}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        />
                    )}

                    {/* 결과 화면 */}
                    {phase === 'result' && (() => {
                        const xpPerCorrect = 5;
                        const correctXp = correctCount * xpPerCorrect;
                        const isClear = Math.round((correctCount / questions.length) * 100) >= 70;
                        const reward = getRewardPreview?.(correctXp + clearXp);
                        return (
                            <QuizResultOverlay
                                isClear={isClear}
                                completedLabel="단어 퀴즈 완료!"
                                clearTitle={resultClearMsg}
                                scoreNode={isClear
                                    ? <>총 {questions.length}문제 중 {correctCount}문제를 맞혔어요!<span className="text-[0.85em] inline-block ml-1">🔥</span></>
                                    : '조금만 더 노력하면 성공할 수 있어요!'}
                                selectedCharacter={selectedCharacter}
                                dailyMapNode={dailyMapNode}
                                reward={reward}
                                correctXp={correctXp}
                                clearXp={clearXp}
                                detailText={`${correctCount}개 정답 x ${xpPerCorrect}XP + 완료 ${clearXp}XP`}
                                missionXp={clearCountRef.current === 1 ? 30 : 0}
                                onRetry={startQuiz}
                                onBack={() => {
                                    if (stageClearArgsRef.current && !stageClearDeliveredRef.current) {
                                        onStageClear?.(...stageClearArgsRef.current);
                                        stageClearDeliveredRef.current = true;
                                        stageClearArgsRef.current = null;
                                    }
                                    if (!dailyMapNode) onBack();
                                }}
                                hideRetry={hideRetry}
                            />
                        );
                    })()}
                </div>
            </div>

            {/* 종료 확인 모달 */}
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
        </div>
    );
};

export default WordQuizScreen;
