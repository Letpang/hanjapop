import { useState, useMemo, useCallback } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { useLang } from '../LangContext.jsx';

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
                    word: w.word,
                    reading: w.reading || '',
                    meaning: w.meaning,
                });
            }
        }
    }
    return pool;
};

const WORD_POOL = buildWordPool();
const ALL_MEANINGS = [...new Set(WORD_POOL.map(w => w.meaning))];

const QUIZ_COUNT = 10;
const GRADE_ORDER = ['8급', '7급', '6급', '기타'];

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

const buildQuiz = (gradeFilter) => {
    let pool = gradeFilter === '전체'
        ? WORD_POOL
        : WORD_POOL.filter(w => w.grade === gradeFilter);
    if (pool.length < 4) pool = WORD_POOL;

    const picked = shuffle(pool).slice(0, QUIZ_COUNT);
    return picked.map(item => {
        const distractors = pickDistractors(item.meaning);
        const choices = shuffle([item.meaning, ...distractors]);
        return { ...item, choices };
    });
};

// ─── Result Screen ──────────────────────────────────────────────────────────
const ResultScreen = ({ correct, total, onRetry, onBack }) => {
    const pct = Math.round((correct / total) * 100);
    const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '⭐' : pct >= 50 ? '📖' : '🌱';
    const msg = pct >= 90 ? '완벽해요!' : pct >= 70 ? '잘했어요!' : pct >= 50 ? '조금 더 연습해요!' : '포기하지 마요!';

    return (
        <div className="flex flex-col items-center gap-6 py-10 animate-in fade-in duration-500">
            <div className="text-7xl">{emoji}</div>
            <h2 className="text-3xl font-black text-slate-700 dark:text-white">{msg}</h2>
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-3xl px-8 py-4 border-2 border-white shadow-lg">
                <span className="text-5xl font-black text-indigo-500">{correct}</span>
                <span className="text-slate-400 font-bold text-xl">/ {total}</span>
            </div>
            <div className="flex gap-4 w-full max-w-xs">
                <button
                    onClick={onRetry}
                    className="flex-1 py-4 rounded-[2rem] bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-lg shadow-xl active:scale-95 transition-all"
                >
                    다시 풀기
                </button>
                <button
                    onClick={onBack}
                    className="flex-1 py-4 rounded-[2rem] bg-white dark:bg-slate-800 text-slate-600 dark:text-white font-black text-lg shadow-xl border-2 border-slate-100 dark:border-slate-700 active:scale-95 transition-all"
                >
                    홈으로
                </button>
            </div>
        </div>
    );
};

// ─── Quiz Card ──────────────────────────────────────────────────────────────
const QuizCard = ({ q, index, total, onAnswer }) => {
    const [selected, setSelected] = useState(null);
    const [revealed, setRevealed] = useState(false);

    const handleSelect = (choice) => {
        if (revealed) return;
        setSelected(choice);
        setRevealed(true);
        const isCorrect = choice === q.meaning;
        setTimeout(() => {
            onAnswer(isCorrect);
            setSelected(null);
            setRevealed(false);
        }, 800);
    };

    return (
        <div className="flex flex-col items-center gap-5 w-full animate-in slide-in-from-right duration-300">
            {/* Progress */}
            <div className="w-full flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                        style={{ width: `${(index / total) * 100}%` }}
                    />
                </div>
                <span className="text-xs font-bold text-slate-400 shrink-0">{index + 1}/{total}</span>
            </div>

            {/* Word display */}
            <div className="w-full clay-panel !rounded-[3rem] px-8 py-8 border-4 border-white dark:border-slate-700 flex flex-col items-center gap-3">
                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">뜻을 고르세요</span>
                <div className="flex items-baseline gap-3">
                    <span className="text-5xl sm:text-6xl font-black text-slate-700 dark:text-white">{q.word}</span>
                    <span className="text-xl font-bold text-slate-400">({q.reading})</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-400 text-sm font-bold">{q.hanja_char}</span>
                    {q.grade && (
                        <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500 text-[10px] font-black px-2 py-0.5 rounded-full">{q.grade}</span>
                    )}
                </div>
            </div>

            {/* Choices */}
            <div className="grid grid-cols-2 gap-3 w-full">
                {q.choices.map((choice, idx) => {
                    let cls = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white';
                    if (revealed && selected === choice) {
                        cls = choice === q.meaning
                            ? 'bg-emerald-400 border-emerald-300 text-white scale-105 shadow-lg'
                            : 'bg-red-400 border-red-300 text-white';
                    } else if (revealed && choice === q.meaning) {
                        cls = 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
                    }
                    return (
                        <button
                            key={idx}
                            onClick={() => handleSelect(choice)}
                            className={`py-4 px-3 rounded-2xl font-black text-base border-2 transition-all active:scale-95 shadow-sm text-center break-keep ${cls}`}
                        >
                            {choice}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const WordQuizScreen = ({ onBack, onHanjaAcquired }) => {
    const { t } = useLang();
    const [gradeFilter, setGradeFilter] = useState('8급');
    const [phase, setPhase] = useState('select'); // 'select' | 'quiz' | 'result'
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);

    const startQuiz = useCallback(() => {
        setQuestions(buildQuiz(gradeFilter));
        setCurrentIdx(0);
        setCorrectCount(0);
        setPhase('quiz');
    }, [gradeFilter]);

    const handleAnswer = useCallback((isCorrect) => {
        if (isCorrect) {
            setCorrectCount(c => c + 1);
            if (onHanjaAcquired) {
                const q = questions[currentIdx];
                onHanjaAcquired(q?.hanja_id, 5);
            }
        }
        setCurrentIdx(i => {
            if (i + 1 >= questions.length) {
                setTimeout(() => setPhase('result'), 100);
            }
            return i + 1;
        });
    }, [questions, currentIdx, onHanjaAcquired]);

    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden">
            {/* Header */}
            <div className="w-full px-4 shrink-0 safe-top">
                <div className="w-full flex justify-between items-center clay-panel p-4 sm:p-6 px-6 sm:px-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl border-4 border-white dark:border-slate-700">
                    <button
                        onClick={phase === 'quiz' ? () => setPhase('select') : onBack}
                        className="text-slate-600 dark:text-slate-200 font-black bg-white/60 dark:bg-slate-800/60 px-5 sm:px-10 py-2.5 sm:py-4 rounded-2xl border-2 border-white/50 shadow-md hover:bg-white active:scale-95 transition-all flex items-center gap-2"
                    >
                        <span className="text-xl sm:text-2xl">←</span>
                    </button>
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-700 dark:text-white m-0 tracking-tight premium-text-shadow text-center flex-1 px-4">
                        {t('menuWordQuizTitle') || '다어 퀴즈'}
                    </h1>
                    <div className="w-[60px] sm:w-[80px]" />
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto pt-6 pb-16">
                <div className="w-full max-w-lg mx-auto px-5 flex flex-col items-center gap-6">

                    {phase === 'select' && (
                        <div className="flex flex-col items-center gap-8 w-full animate-in fade-in duration-400">
                            <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[2.5rem] border-4 border-white shadow-xl flex items-center justify-center text-6xl">
                                📖
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-slate-700 dark:text-white mb-1">급수를 선택하세요</h2>
                                <p className="text-slate-400 font-bold text-sm">총 {QUIZ_COUNT}문제를 풀어요</p>
                            </div>

                            <div className="flex flex-wrap gap-3 justify-center w-full">
                                {['8급', '7급', '6급', '전체'].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setGradeFilter(g)}
                                        className={`px-8 py-4 rounded-[2rem] font-black text-xl border-4 transition-all ${
                                            gradeFilter === g
                                                ? 'bg-indigo-500 text-white border-white shadow-2xl scale-105'
                                                : 'bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40 shadow-lg'
                                        }`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>

                            <div className="w-full bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-5 border-2 border-indigo-100 dark:border-indigo-800">
                                <p className="text-indigo-600 dark:text-indigo-300 font-bold text-sm text-center">
                                    {gradeFilter === '전체'
                                        ? `전체 ${WORD_POOL.length}개 단어에서`
                                        : `${gradeFilter} ${WORD_POOL.filter(w => w.grade === gradeFilter).length}개 단어에서`
                                    } 랜덤 {QUIZ_COUNT}문제
                                </p>
                            </div>

                            <button
                                onClick={startQuiz}
                                className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-xl shadow-xl active:scale-95 transition-all"
                            >
                                시작하기! 🚀
                            </button>
                        </div>
                    )}

                    {phase === 'quiz' && currentIdx < questions.length && (
                        <QuizCard
                            key={currentIdx}
                            q={questions[currentIdx]}
                            index={currentIdx}
                            total={questions.length}
                            onAnswer={handleAnswer}
                        />
                    )}

                    {phase === 'result' && (
                        <ResultScreen
                            correct={correctCount}
                            total={questions.length}
                            onRetry={startQuiz}
                            onBack={onBack}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default WordQuizScreen;
