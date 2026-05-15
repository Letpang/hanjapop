import { useState, useMemo, useCallback, useEffect } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { useLang } from '../LangContext.jsx';
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
    const circ = 2 * Math.PI * 44;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300"
            style={{ background: isClear ? 'rgba(16,185,129,0.18)' : 'rgba(255,107,107,0.18)' }}
        >
            <div className="w-full max-w-sm flex flex-col items-center bg-white shadow-2xl rounded-[48px]" style={{ overflow: 'visible' }}>
                <div className="pt-10 pb-7 px-8 flex flex-col items-center gap-5 w-full">
                    <img
                        src={isClear ? '/assets/images/icons/icon_celebration.png' : '/assets/images/icons/icon_timeout.png'}
                        alt=""
                        className="w-[140px] h-[140px] object-contain drop-shadow-lg"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="flex flex-col items-center gap-3 text-center">
                        <span className="text-sm font-extrabold text-slate-400">
                            {isClear ? '정말 멋진 결과예요!' : '아쉬운 결과네요...'}
                        </span>
                        <h2 className={`font-extrabold tracking-tight leading-snug ${isClear ? 'text-3xl' : 'text-2xl'}`} style={{ color: isClear ? '#10B981' : '#4A90E2' }}>
                            {isClear ? '와우! 참 잘했어요!' : '괜찮아요, 다시 도전해봐요!'}
                        </h2>
                        {/* 원형 게이지 스코어 */}
                        <div className="relative w-28 h-28 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 112 112">
                                <circle cx="56" cy="56" r="44" fill="none" stroke="#F1F5F9" strokeWidth="6" />
                                <circle cx="56" cy="56" r="44" fill="none"
                                    stroke={isClear ? '#10B981' : '#FF6B6B'}
                                    strokeWidth="6"
                                    strokeDasharray={circ}
                                    strokeDashoffset={circ * (1 - pct / 100)}
                                    strokeLinecap="round"
                                    transform="rotate(-90 56 56)"
                                    style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                                />
                            </svg>
                            <div className="flex flex-col items-center z-10">
                                <span className="text-3xl font-extrabold text-slate-700 leading-tight">{correct}</span>
                                <span className="text-xs font-extrabold text-slate-400">/ {total}</span>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest -mt-1">단어 퀴즈 완료</span>
                    </div>

                    <div className="w-full flex flex-col items-center gap-2">
                        {/* 메인 버튼 — 항상 오렌지 */}
                        <button
                            onClick={onRetry}
                            className="w-full py-4 rounded-full font-extrabold text-lg text-white active:scale-95 transition-all mt-3"
                            style={{ background: 'linear-gradient(to right,#FF8C00,#FFA500)', boxShadow: '0 6px 20px rgba(255,140,0,0.4)', borderBottom: '4px solid #CC7000' }}
                        >
                            다시 풀기
                        </button>
                        {/* 오답 확인 텍스트 링크 — 틀린 문제 있을 때 */}
                        {onGoToReview && wrongCount > 0 && (
                            <button
                                onClick={onGoToReview}
                                className="text-slate-400 text-xs font-bold py-1 active:opacity-60 transition-opacity w-full text-center"
                            >
                                오답만 확인하고 싶나요? →
                            </button>
                        )}
                        {/* 급수/주제 바꾸기 */}
                        <button
                            onClick={onBack}
                            className="text-[12px] font-bold py-1 active:opacity-60 transition-opacity w-full text-center underline"
                            style={{ color: '#888888' }}
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
                    className="relative w-full aspect-[16/10]" 
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
                            className="absolute inset-0 bg-white rounded-[4rem] border-[10px] border-white flex flex-col items-center justify-center p-10 overflow-hidden shadow-xl"
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
                                    TAP TO FLIP
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
                            {/* 상단: 한자음 및 한자어 그룹 */}
                            <div className="flex flex-col items-center gap-1 mt-1">
                                {/* 1. 한자 단어의 음 (주인공) */}
                                <span className="text-6xl sm:text-[5.5rem] font-black text-indigo-600 tracking-tighter text-center leading-none drop-shadow-md">
                                    {q.reading}
                                </span>
                                {/* 2. 원래 문제인 한자 */}
                                <span className="text-2xl sm:text-3xl font-bold text-slate-300 tracking-widest mt-1">
                                    {q.word}
                                </span>
                            </div>

                            {/* 중간: 스피커 아이콘 (독립 배치로 밸런스 유지) */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleSpeak(); }}
                                className={`w-14 h-14 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-xl border-4 border-white ${isSpeaking ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-200'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                            </button>
                            
                            {/* 하단: 예문 영역 - 한글 배지 인라인 스타일 (20px 다운) */}
                            <div className="w-full px-8 text-left mb-4 mt-5">
                                <p className="text-xl sm:text-2xl font-medium text-slate-600 leading-relaxed break-keep tracking-normal">
                                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-indigo-50 text-indigo-500 text-sm font-black mr-3 shadow-sm border border-indigo-100/50 transform -translate-y-0.5">
                                        예문
                                    </span>
                                    <span className="text-slate-500">
                                        {q.example ? q.example.replace(/\(\s*\)/g, ` ${q.word} `).trim().replace(/\s+/g, ' ') : ''}
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
                                className={`py-5 px-8 rounded-[2rem] font-black text-2xl border transition-all flex justify-between items-center break-keep ${
                                    isCorrect 
                                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700 border-4 shadow-lg' 
                                    : isWrong 
                                    ? 'bg-white border-[#FED2D2] text-[#3D3530] border-4 opacity-70' 
                                    : 'bg-white border-slate-100 text-[#5D544F] shadow-sm hover:border-slate-200'
                                } ${!isCorrectSelected ? 'active:scale-[0.98]' : ''}`}
                            >
                                <span>{choice}</span>
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
const WordQuizScreen = ({ onBack, onHanjaAcquired, onMarkCorrect, onMarkWrong, onWordCorrect, onStageClear, onGoToReview, srsData, masteryData, userLevel, hanjaFilter }) => {
    const { t } = useLang();
    const [viewMode, setViewMode] = useState('grade');
    const [gradeFilter, setGradeFilter] = useState('8급');
    const [categoryFilter, setCategoryFilter] = useState(CATEGORIES[0] || '');
    const [phase, setPhase] = useState('select');
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [combo, setCombo] = useState(0);

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
            <div className="w-full shrink-0 bg-white" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div className="w-full flex justify-between items-center px-5 py-3">
                    <button
                        onClick={phase === 'quiz' ? () => setPhase('select') : onBack}
                        className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center font-extrabold text-lg active:scale-90 text-slate-400 border border-slate-100 transition-all"
                    >
                        ←
                    </button>
                    {phase === 'quiz' ? (
                        <div className="flex items-center gap-2">
                            <span className="text-base font-extrabold text-slate-700 tracking-tighter">Q {currentIdx + 1}</span>
                            <span className="text-base font-extrabold text-slate-300">/ {questions.length}</span>
                        </div>
                    ) : (
                        <span className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">단어 퀴즈</span>
                    )}
                    <div className="w-9 h-9" />
                </div>
                {/* 진행 바 — 얇고 연한 하늘색 */}
                {phase === 'quiz' && (
                    <div className="w-full h-[2px]" style={{ backgroundColor: '#E0F2FE' }}>
                        <div
                            className="h-full transition-all duration-500"
                            style={{ width: `${(currentIdx / questions.length) * 100}%`, backgroundColor: '#0EA5E9' }}
                        />
                    </div>
                )}
            </div>

            {/* Body */}
            <div className={`flex-1 overflow-y-auto pb-6`}>
                <div className="w-full max-w-xl mx-auto px-4 flex flex-col items-center gap-6 pt-5">

                    {phase === 'select' && (
                        <div className="flex flex-col items-center gap-10 w-full animate-in fade-in duration-500">

                            {/* 탭 */}
                            <div className="flex bg-slate-100/40 p-1.5 rounded-full border border-slate-200 w-full mb-4 shadow-inner">
                                <button
                                    onClick={() => setViewMode('grade')}
                                    className={`flex-1 px-8 py-3 rounded-full font-extrabold text-xs transition-all ${viewMode === 'grade' ? 'bg-white shadow-md' : 'text-slate-400'}`}
                                    style={viewMode === 'grade' ? { color: '#0369A1' } : {}}
                                >
                                    급수별
                                </button>
                                <button
                                    onClick={() => setViewMode('topic')}
                                    className={`flex-1 px-8 py-3 rounded-full font-extrabold text-xs transition-all ${viewMode === 'topic' ? 'bg-white shadow-md' : 'text-slate-400'}`}
                                    style={viewMode === 'topic' ? { color: '#0369A1' } : {}}
                                >
                                    주제별
                                </button>
                            </div>

                            {/* 급수별 */}
                            {viewMode === 'grade' && (
                                <div className="grid grid-cols-3 gap-3 w-full">
                                    {['8급', '7급Ⅱ', '7급', '6급Ⅱ', '6급', '전체'].map(g => (
                                        <button
                                            key={g}
                                            onClick={() => { setGradeFilter(g); startQuiz(g, 'grade'); }}
                                            className="py-6 rounded-[2rem] font-extrabold text-lg transition-all border shadow-sm active:scale-95 bg-white"
                                            style={gradeFilter === g
                                                ? { color: '#0369A1', borderColor: '#A0E4FF', boxShadow: '0 8px 24px #A0E4FF60', outline: '4px solid #A0E4FF30' }
                                                : { color: '#CBD5E1', borderColor: '#F1F5F9' }}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* 주제별 */}
                            {viewMode === 'topic' && (
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    {CATEGORIES.map(cat => {
                                        const count = HANJA_DATA.filter(h => h.category === cat).length;
                                        const imgSrc = CATEGORY_IMAGES[cat] ? `/assets/images/hanja_all/${CATEGORY_IMAGES[cat]}` : null;
                                        const isSelected = categoryFilter === cat;
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => { setCategoryFilter(cat); startQuiz(cat, 'topic'); }}
                                                className="bg-white shadow-lg rounded-2xl flex flex-row items-center overflow-hidden active:scale-95 transition-all border-[4px]"
                                                style={{ borderColor: isSelected ? '#A0E4FF' : 'white' }}
                                            >
                                                <div className="w-28 h-28 shrink-0 flex items-center justify-center p-3" style={{ backgroundColor: isSelected ? '#A0E4FF20' : '#F8FAFC' }}>
                                                    {imgSrc ? <img src={imgSrc} className="w-full h-full object-contain drop-shadow-sm" alt={cat} /> : <span className="text-2xl font-extrabold" style={{ color: '#A0E4FF' }}>?</span>}
                                                </div>
                                                <div className="px-3 flex flex-col items-start gap-0">
                                                    <span className="font-extrabold text-xs leading-tight" style={{ color: isSelected ? '#0369A1' : '#334155' }}>{cat}</span>
                                                    <span className="text-[9px] font-bold text-slate-400">{count}개</span>
                                                </div>
                                            </button>
                                        );
                                    })}
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
