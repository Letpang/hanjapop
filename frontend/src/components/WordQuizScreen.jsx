import { useState, useMemo, useCallback, useEffect } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { useLang } from '../LangContext.jsx';
import GradeGrid, { TopicCard } from './GradeGrid.jsx';
const GRADES = ['전체', '8급', '7급Ⅱ', '7급', '6급Ⅱ', '6급'];
import { getWordSRSWeightedPool } from '../utils/learningPool.js';

// Flatten all words from all hanja into a single pool
const buildWordPool = () => {
    const pool = [];
    for (const h of HANJA_DATA) {
        if (!h.words || h.words.length === 0) continue;
        for (const w of h.words) {
            if (w.word && w.meaning) {
                pool.push({
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
const CATEGORY_IMAGES = {
    '숫자와 기초 개념': '1_一.webp',
    '자연과 시간': '31_日.webp',
    '나와 가족 신체': '71_父.webp',
    '공간과 위치': '111_東.webp',
    '학교와 일상생활': '151_學.webp',
    '행동과 상태': '201_來.webp',
    '사회와 문화': '251_國.webp',
};

const QUIZ_COUNT = 10;

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

const buildQuiz = (filter, filterType, srsData, masteryData, userLevel) => {
    let pool;
    if (filterType === 'topic') {
        pool = WORD_POOL.filter(w => w.category === filter);
    } else {
        pool = filter === '전체' ? WORD_POOL : WORD_POOL.filter(w => w.grade === filter);
    }
    if (pool.length < 4) pool = WORD_POOL;

    const picked = getWordSRSWeightedPool(pool, srsData, masteryData, userLevel, QUIZ_COUNT);
    return picked.map(item => {
        const distractors = pickDistractors(item.meaning);
        const choices = shuffle([item.meaning, ...distractors]);
        return { ...item, choices };
    });
};

// ─── Result Screen ──────────────────────────────────────────────────────────
const ResultScreen = ({ correct, total, onRetry, onBack, onGoToReview }) => {
    const pct = Math.round((correct / total) * 100);
    const isClear = pct >= 70;
    const wrongCount = total - correct;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300"
            style={{ background: isClear ? 'rgba(16,185,129,0.18)' : 'rgba(255,107,107,0.18)' }}
        >
            <div className="w-full max-w-sm flex flex-col items-center bg-white shadow-2xl rounded-[48px] overflow-hidden">
                <div className="pt-4 pb-10 px-8 flex flex-col items-center gap-6 w-full relative">
                    
                    {/* 아이콘 */}
                    <img
                        src={isClear ? "/assets/images/icons/success_new.png" : "/assets/images/icons/timeout_new.png"}
                        alt={isClear ? "clear" : "fail"}
                        className="w-[154px] h-[154px] object-contain drop-shadow-xl relative z-10 mt-4"
                    />

                    {/* 텍스트 */}
                    <div className="text-center flex flex-col gap-2 relative z-10 -mt-5">
                        <span className="text-xs-res font-extrabold text-slate-400">
                            {isClear ? '정말 멋진 결과예요!' : '아쉬운 결과네요...'}
                        </span>
                        <h1 className="text-h2-res font-extrabold tracking-tighter leading-snug" style={{ color: isClear ? '#10B981' : '#FF6B6B' }}>
                            {isClear ? '와우! 참 잘했어요!' : <>괜찮아요,<br/>다시 도전해봐요!</>}
                        </h1>
                        <p className="text-xs-res font-bold text-slate-400 leading-relaxed break-keep mt-1">
                            {isClear 
                                ? `총 ${total}문제 중 ${correct}문제를 맞혔어요! 🔥` 
                                : '조금만 더 노력하면 성공할 수 있어요!'}
                        </p>
                    </div>

                    {/* 버튼 2단 */}
                    <div className="w-full flex flex-col gap-3 relative z-10">
                        <button
                            onClick={onRetry}
                            className="w-full py-4 rounded-2xl font-extrabold text-body-lg text-white active:scale-95 transition-all border-b-4 active:border-b-0 active:translate-y-[2px]"
                            style={{ 
                                background: isClear ? 'linear-gradient(135deg, #34D399, #10B981)' : 'linear-gradient(135deg, #FF8E8E, #FF6B6B)',
                                borderBottomColor: isClear ? '#059669' : '#E05555' 
                            }}
                        >
                            다시 풀기
                        </button>
                        <button
                            onClick={onBack}
                            className="w-full py-4 rounded-2xl font-extrabold text-body-lg text-white active:scale-95 transition-all border-b-4 active:border-b-0 active:translate-y-[2px]"
                            style={{ 
                                background: 'linear-gradient(135deg, #6EE7B7, #34D399)',
                                borderBottomColor: '#059669'
                            }}
                        >
                            급수 / 주제 바꾸기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Quiz Card ──────────────────────────────────────────────────────────────
const speakKorean = (text) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ko-KR';
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
};

const QuizCard = ({ q, onAnswer, onNext, onPrev, combo }) => {
    const [wrongChoices, setWrongChoices] = useState([]);
    const [isCorrectSelected, setIsCorrectSelected] = useState(false);
    const [showXPPopup, setShowXPPopup] = useState(false);
    const [xpAnimKey, setXpAnimKey] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleSelect = (choice) => {
        if (isCorrectSelected || wrongChoices.includes(choice)) return;
        if (choice === q.meaning) {
            setIsCorrectSelected(true);
            setShowXPPopup(true);
            setXpAnimKey(k => k + 1);
            setTimeout(() => setShowXPPopup(false), 1500);
        } else {
            setWrongChoices(prev => [...prev, choice]);
        }
    };

    const handleNext = () => {
        window.speechSynthesis?.cancel();
        onAnswer(wrongChoices.length === 0);
        if (onNext) onNext();
    };

    const handleSpeak = () => {
        if (!q.reading) return;
        setIsSpeaking(true);
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(q.reading);
        utter.lang = 'ko-KR';
        utter.rate = 0.85;
        utter.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utter);
    };

    // 가로형 레이아웃에 맞춘 다이나믹 폰트
    const wordLen = q.word?.length || 0;
    const wordFontSize = wordLen > 6 ? 'text-[3.5rem] sm:text-[4.5rem]' :
                         wordLen > 4 ? 'text-[4.5rem] sm:text-[6rem]' :
                                       'text-[6rem] sm:text-[8rem]';

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
            <style>{`
                @keyframes xpFloat {
                    0%   { opacity: 0; transform: scale(0.6) translateY(16px); }
                    28%  { opacity: 1; transform: scale(1.1) translateY(-6px); }
                    40%  { opacity: 1; transform: scale(1) translateY(0); }
                    68%  { opacity: 1; transform: scale(1) translateY(0); }
                    100% { opacity: 0; transform: translateY(-28px); }
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
                        {(combo + 1) > 1 && (
                            <div
                                className="px-4 py-1.5 rounded-full font-extrabold text-white text-sm"
                                style={{ backgroundColor: '#0EA5E9', boxShadow: '0 4px 12px rgba(14,165,233,0.45)' }}
                            >
                                🔥 {combo + 1}x 콤보!
                            </div>
                        )}
                        <div
                            className="px-7 py-3 rounded-full font-extrabold text-xl"
                            style={{ backgroundColor: '#FFF7D4', color: '#B8860B', border: '2px solid #FFD700', boxShadow: '0 8px 28px rgba(255,215,0,0.5)' }}
                        >
                            ⭐ +5 XP
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-12 w-full animate-in slide-in-from-bottom-6 duration-400">
                {/* ── 상단 카드 영역 (정답 시 플립 가능) ── */}
                <div 
                    className="relative w-full aspect-[16/13]" 
                    style={{ perspective: '2000px' }}
                    onClick={() => {
                        if (isCorrectSelected) {
                            setIsFlipped(!isFlipped);
                            if (!isFlipped) handleSpeak();
                        }
                    }}
                >
                    <div 
                        className={`relative w-full h-full transition-all duration-700 ${isCorrectSelected ? 'cursor-pointer shadow-2xl' : ''} rounded-[4rem]`}
                        style={{ 
                            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                            transformStyle: 'preserve-3d',
                            WebkitTransformStyle: 'preserve-3d'
                        }}
                    >
                        {/* 카드 앞면: 문제 단어 */}
                        <div 
                            className="absolute inset-0 bg-white rounded-[4rem] border-[10px] border-white flex flex-col items-center justify-center p-5 overflow-hidden shadow-xl"
                            style={{ 
                                backfaceVisibility: 'hidden', 
                                WebkitBackfaceVisibility: 'hidden',
                                transform: 'rotateY(0deg)',
                                zIndex: isFlipped ? 0 : 1
                            }}
                        >
                            <span className={`${wordFontSize} font-black text-[#1e293b] tracking-tighter drop-shadow-sm text-center leading-none`}>
                                {q.word}
                            </span>
                            {isCorrectSelected && !isFlipped && (
                                <div className="mt-8 px-10 py-3 rounded-full font-black text-sm bg-slate-50 text-slate-300 uppercase tracking-[0.4em] border-2 border-slate-100/50 animate-bounce">
                                    더 알아보기
                                </div>
                            )}
                        </div>

                        {/* 카드 뒷면: 정답 및 예문 */}
                        <div 
                            className="absolute inset-0 bg-white rounded-[4rem] border-[10px] border-white flex flex-col items-center justify-between p-8 shadow-xl"
                            style={{ 
                                backfaceVisibility: 'hidden', 
                                WebkitBackfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                                zIndex: isFlipped ? 1 : 0
                            }}
                        >
                            {/* 상단: 한자음 및 한자어 그룹 (가로 배치) */}
                            <div className="flex flex-row items-baseline gap-3 mt-1">
                                {/* 1. 한자 단어의 음 (주인공) */}
                                <span className="text-5xl sm:text-[4.5rem] font-black text-indigo-600 tracking-tighter leading-none drop-shadow-md">
                                    {q.reading}
                                </span>
                                {/* 2. 원래 문제인 한자 */}
                                <span className="text-xl sm:text-2xl font-bold text-slate-300 tracking-widest">
                                    ({q.word})
                                </span>
                            </div>

                            {/* 중간: 스피커 아이콘 (독립 배치로 밸런스 유지) */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleSpeak(); }}
                                className={`w-14 h-14 mt-6 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-xl border-4 border-white ${isSpeaking ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-200'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                            </button>
                            
                            {/* 하단: 예문 영역 - 한글 배지 인라인 스타일 (20px 다운) */}
                            <div className="w-full flex flex-col items-start text-left mb-4 mt-5">
                                <p className="text-body-lg-res font-medium text-slate-600 leading-relaxed break-keep tracking-normal">
                                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-indigo-50 text-indigo-500 text-sm font-black mr-3 shadow-sm border border-indigo-100/50 transform -translate-y-0.5">
                                        예문
                                    </span>
                                    <span className="text-slate-500">
                                        {q.example ? q.example.replace(/\(\s*\)/g, q.word).trim().replace(/\s+/g, ' ') : ''}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 4지선다 보기 (정답 후에도 유지) ── */}
                <div className="grid grid-cols-1 gap-4 w-full">
                    {q.choices && q.choices.map((choice, idx) => {
                        const isWrong = wrongChoices.includes(choice);
                        const isCorrect = isCorrectSelected && choice === q.meaning;
                        return (
                            <button
                                key={idx}
                                onClick={() => handleSelect(choice)}
                                disabled={isCorrectSelected}
                                className={`py-3.5 px-8 rounded-[2rem] font-black text-body-lg-res border transition-all flex justify-between items-center break-keep ${
                                    isCorrect 
                                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700 border-4 shadow-lg' 
                                    : isWrong 
                                    ? 'bg-white border-[#FED2D2] text-[#3D3530] border-4 opacity-70' 
                                    : 'bg-white border-slate-100 text-[#5D544F] shadow-sm hover:border-slate-200'
                                } ${!isCorrectSelected ? 'active:scale-[0.98]' : ''}`}
                            >
                                <span className="text-left w-full">{choice}</span>
                                {isCorrect && <span className="text-indigo-400 shrink-0 ml-2">✓</span>}
                                {isWrong && <span className="text-rose-300 shrink-0 ml-2">✕</span>}
                            </button>
                        );
                    })}
                </div>

                {/* ── 하단 네비게이션 (정답 후 나타남) ── */}
                {isCorrectSelected && (
                    <div className="w-full flex gap-5 animate-in fade-in slide-in-from-top-4 duration-500">
                        <button
                            onClick={onPrev}
                            className="flex-1 py-5 rounded-[2.5rem] bg-white font-black text-xl text-slate-600 border-2 border-slate-100 shadow-sm active:scale-95 transition-all"
                        >
                            ‹ PREV
                        </button>
                        <button 
                            onClick={handleNext}
                            className="flex-[2] py-5 rounded-[2.5rem] bg-indigo-500 font-black text-xl text-white shadow-2xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            NEXT ›
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const WordQuizScreen = ({ onBack, onHanjaAcquired, onMarkCorrect, onMarkWrong, onWordCorrect, onStageClear, onGoToReview, srsData, masteryData, userLevel, hanjaFilter, unlockedHanjaIds }) => {
    const { t } = useLang();
    const [viewMode, setViewMode] = useState('grade');
    const [gradeFilter, setGradeFilter] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState(CATEGORIES[0] || '');
    const [phase, setPhase] = useState('select');
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [combo, setCombo] = useState(0);

    // 해금된 급수 계산 로직
    const unlockedIds = useMemo(() => new Set(unlockedHanjaIds || []), [unlockedHanjaIds]);
    const unlockedGrades = useMemo(() => {
        const s = new Set(['전체']);
        for (const h of HANJA_DATA) { if (unlockedIds.has(h.id)) s.add(h.grade); }
        return s;
    }, [unlockedIds]);

    const startQuiz = useCallback((overrideFilter, overrideViewMode) => {
        if (hanjaFilter && hanjaFilter.length > 0) {
            const filtered = WORD_POOL.filter(w => hanjaFilter.includes(w.hanja_id));
            const pool = filtered.length >= 4 ? filtered : WORD_POOL;
            const picked = getWordSRSWeightedPool(pool, srsData, masteryData, userLevel, QUIZ_COUNT);
            setQuestions(picked.map(item => {
                const distractors = pickDistractors(item.meaning);
                const choices = shuffle([item.meaning, ...distractors]);
                return { ...item, choices, correct: item.meaning };
            }));
        } else {
            const effectiveViewMode = overrideViewMode || viewMode;
            const filter = overrideFilter != null ? overrideFilter : (effectiveViewMode === 'topic' ? categoryFilter : gradeFilter);
            setQuestions(buildQuiz(filter, effectiveViewMode, srsData, masteryData, userLevel));
        }
        setCurrentIdx(0);
        setCorrectCount(0);
        setPhase('quiz');
    }, [viewMode, gradeFilter, categoryFilter, srsData, masteryData, userLevel, hanjaFilter]);

    useEffect(() => {
        if (hanjaFilter && hanjaFilter.length > 0) startQuiz();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAnswer = useCallback((isCorrect) => {
        const q = questions[currentIdx];
        if (isCorrect) {
            setCorrectCount(c => c + 1);
            setCombo(c => c + 1);
            if (onHanjaAcquired && q?.hanja_id) onHanjaAcquired(q.hanja_id, 5);
            if (onMarkCorrect && q?.hanja_id) onMarkCorrect(q.hanja_id);
            if (onWordCorrect) onWordCorrect();
        } else {
            setCombo(0);
            if (onMarkWrong && q?.hanja_id) onMarkWrong(q.hanja_id);
        }
    }, [questions, currentIdx, onHanjaAcquired, onMarkCorrect, onMarkWrong, onWordCorrect]);

    const handleNext = useCallback(() => {
        const next = currentIdx + 1;
        if (next < questions.length) {
            setCurrentIdx(next);
        } else {
            setPhase('result');
            if (onStageClear) onStageClear(correctCount, questions.length);
        }
    }, [questions, currentIdx, correctCount, onStageClear]);

    const handlePrev = useCallback(() => {
        if (currentIdx > 0) {
            setCurrentIdx(currentIdx - 1);
        }
    }, [currentIdx]);

    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden" style={{ backgroundColor: '#F8FAFF' }}>

            {/* 헤더 */}
            <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                    <button onClick={phase === 'quiz' ? () => setPhase('select') : onBack}
                        className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-black text-slate-600 gap-1">
                        <span>←</span><span className="ml-1">뒤로</span>
                    </button>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <h2 className="text-lg font-black text-slate-700 m-0">단어 퀴즈</h2>
                        {phase === 'quiz' && (
                            <span className="text-indigo-500 opacity-60 text-sm font-bold whitespace-nowrap">{currentIdx + 1}/{questions.length}</span>
                        )}
                    </div>
                </div>
                {/* 진행 바 — 얇고 연한 하늘색 */}
                {phase === 'quiz' && (
                    <div className="w-full h-[3px] bg-slate-100 rounded-full overflow-hidden mt-3 px-2 mx-auto max-w-[90%]">
                        <div
                            className="h-full transition-all duration-500 rounded-full bg-indigo-500"
                            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Body */}
            <div className={`flex-1 overflow-y-auto pb-6`}>
                <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-6 pt-5">

                    {phase === 'select' && (
                        <div className="flex flex-col items-center gap-10 w-full animate-in fade-in duration-500">

                            {/* 탭 */}
                            <div className="flex bg-slate-100/40 p-1.5 rounded-full border border-slate-200 w-full mb-4 shadow-inner">
                                <button
                                    onClick={() => setViewMode('grade')}
                                    className={`flex-1 px-8 py-3 rounded-full font-extrabold text-xs-res transition-all ${viewMode === 'grade' ? 'bg-white shadow-md text-slate-700' : 'text-slate-400'}`}
                                >
                                    급수별
                                </button>
                                <button
                                    onClick={() => setViewMode('topic')}
                                    className={`flex-1 px-8 py-3 rounded-full font-extrabold text-xs-res transition-all ${viewMode === 'topic' ? 'bg-white shadow-md text-slate-700' : 'text-slate-400'}`}
                                >
                                    주제별
                                </button>
                            </div>

                            {/* 급수별 */}
                            {viewMode === 'grade' && (
                                <GradeGrid
                                    selected={gradeFilter}
                                    onSelect={g => { setGradeFilter(g); startQuiz(g, 'grade'); }}
                                    lockedGrades={GRADES.filter(g => g !== '전체' && !unlockedGrades.has(g))}
                                />
                            )}

                            {/* 주제별 */}
                            {viewMode === 'topic' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                    {CATEGORIES.map(cat => (
                                        <TopicCard
                                            key={cat}
                                            name={cat}
                                            imgSrc={CATEGORY_IMAGES[cat] ? `/assets/images/hanja_all/${CATEGORY_IMAGES[cat]}` : null}
                                            count={`${HANJA_DATA.filter(h => h.category === cat).length}개`}
                                            isSelected={categoryFilter === cat}
                                            onClick={() => { setCategoryFilter(cat); startQuiz(cat, 'topic'); }}
                                            locked={!HANJA_DATA.some(h => h.category === cat && unlockedIds.has(h.id))}
                                        />
                                    ))}
                                </div>
                            )}

                        </div>
                    )}

                    {phase === 'quiz' && currentIdx < questions.length && (
                        <QuizCard
                            key={currentIdx}
                            q={questions[currentIdx]}
                            onAnswer={handleAnswer}
                            onNext={handleNext}
                            onPrev={handlePrev}
                            combo={combo}
                        />
                    )}

                    {phase === 'result' && (
                        <ResultScreen
                            correct={correctCount}
                            total={questions.length}
                            onRetry={startQuiz}
                            onBack={() => setPhase('select')}
                            onGoToReview={onGoToReview}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default WordQuizScreen;
