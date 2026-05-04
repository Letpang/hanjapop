/**
 * WritingScreen.jsx (전면 개편 + 기능 복구)
 * 1단계: 급수/주제 선택
 * 2단계: 바둑판 한자 그리드 (해당 급수/주제의 한자 전부 표시)
 * 3단계: HanziWriter 퀴즈 모드 (획순 채점, 힌트 감점)
 *        ↳ 연필 색상 선택, 연필 굵기 선택, 획순 번호 표시 기능 포함
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { useLang } from '../LangContext.jsx';

// ─── 상수 ─────────────────────────────────────────────────────────────────
const HINT_PENALTY = 10;     // 힌트 1회 = -10점
const WRONG_PENALTY = 5;     // 획 틀릴 때마다 -5점
const MAX_SCORE = 100;

const GRADE_LIST = ['8급', '7급Ⅱ', '7급', '6급Ⅱ', '6급'];

// 주제 목록 (중복 제거)
const THEME_LIST = [...new Set(HANJA_DATA.map(h => h.theme).filter(Boolean))];

// 급수별 색상
const GRADE_COLORS = {
    '8급': 'from-green-400 to-emerald-500',
    '7급Ⅱ': 'from-teal-400 to-cyan-500',
    '7급': 'from-sky-400 to-blue-500',
    '6급Ⅱ': 'from-violet-400 to-purple-500',
    '6급': 'from-pink-400 to-rose-500',
};

// ─── 연필 색상 팔레트 ─────────────────────────────────────────────────────
const STROKE_COLORS = [
    { label: '인디고', value: '#6366f1', bg: 'bg-indigo-500' },
    { label: '빨강',   value: '#ef4444', bg: 'bg-red-500' },
    { label: '파랑',   value: '#3b82f6', bg: 'bg-blue-500' },
    { label: '초록',   value: '#22c55e', bg: 'bg-green-500' },
    { label: '주황',   value: '#f97316', bg: 'bg-orange-500' },
    { label: '보라',   value: '#a855f7', bg: 'bg-purple-500' },
    { label: '검정',   value: '#1e293b', bg: 'bg-slate-800' },
    { label: '갈색',   value: '#92400e', bg: 'bg-amber-800' },
];

// ─── 연필 굵기 옵션 ───────────────────────────────────────────────────────
const STROKE_WIDTHS = [
    { label: '가늘게', value: 4,  icon: '─' },
    { label: '보통',   value: 8,  icon: '━' },
    { label: '굵게',   value: 14, icon: '▬' },
];

// ─── 1단계: 필터 선택 화면 ────────────────────────────────────────────────
const FilterScreen = ({ onSelect, onBack }) => {
    const [tab, setTab] = useState('grade'); // 'grade' | 'theme'

    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-full px-4 pt-8 pb-32 gap-6">
            {/* 헤더 */}
            <div className="w-full flex items-center gap-4">
                <button onClick={onBack} className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 flex items-center justify-center font-black text-xl active:scale-90 transition-all shadow-md">
                    ←
                </button>
                <h1 className="text-3xl font-black text-slate-700 dark:text-white">한자 쓰기</h1>
            </div>

            {/* 탭 */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-3xl w-full border-2 border-white dark:border-slate-700">
                <button onClick={() => setTab('grade')} className={`flex-1 py-3 rounded-2xl font-black text-lg transition-all ${tab === 'grade' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-md' : 'text-slate-400'}`}>
                    급수별
                </button>
                <button onClick={() => setTab('theme')} className={`flex-1 py-3 rounded-2xl font-black text-lg transition-all ${tab === 'theme' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-md' : 'text-slate-400'}`}>
                    주제별
                </button>
            </div>

            {/* 급수 선택 */}
            {tab === 'grade' && (
                <div className="flex flex-col gap-3 w-full">
                    {GRADE_LIST.map(g => {
                        const count = HANJA_DATA.filter(h => h.grade === g).length;
                        const gradient = GRADE_COLORS[g] || 'from-slate-400 to-slate-500';
                        return (
                            <button
                                key={g}
                                onClick={() => onSelect({ type: 'grade', value: g })}
                                className={`w-full bg-gradient-to-r ${gradient} text-white rounded-[1.5rem] p-5 flex items-center justify-between shadow-lg active:scale-95 transition-all`}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="font-black text-2xl">{g}</span>
                                    <span className="text-white/80 text-sm font-bold">{count}개 한자</span>
                                </div>
                                <span className="text-4xl">›</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* 주제 선택 */}
            {tab === 'theme' && (
                <div className="flex flex-col gap-2 w-full">
                    {THEME_LIST.map(theme => {
                        const count = HANJA_DATA.filter(h => h.theme === theme).length;
                        return (
                            <button
                                key={theme}
                                onClick={() => onSelect({ type: 'theme', value: theme })}
                                className="w-full clay-panel rounded-[1.5rem] p-4 bg-white dark:bg-slate-800 border-2 border-white flex items-center justify-between active:scale-95 transition-all"
                            >
                                <span className="font-black text-slate-700 dark:text-white text-lg">{theme}</span>
                                <span className="text-slate-400 text-sm font-bold">{count}개</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─── 2단계: 바둑판 그리드 ─────────────────────────────────────────────────
const GridScreen = ({ filter, onSelectHanja, onBack }) => {
    const hanjaList = useMemo(() => {
        if (filter.type === 'grade') return HANJA_DATA.filter(h => h.grade === filter.value);
        return HANJA_DATA.filter(h => h.theme === filter.value);
    }, [filter]);

    return (
        <div className="flex flex-col items-center w-full max-w-lg mx-auto min-h-full px-4 pt-8 pb-32 gap-6">
            {/* 헤더 */}
            <div className="w-full flex items-center gap-4">
                <button onClick={onBack} className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 flex items-center justify-center font-black text-xl active:scale-90 transition-all shadow-md">
                    ←
                </button>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black text-slate-700 dark:text-white">{filter.value}</h1>
                    <span className="text-slate-400 text-sm font-bold">한자 {hanjaList.length}개 · 연습할 한자를 선택하세요</span>
                </div>
            </div>

            {/* 바둑판 그리드 */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 w-full">
                {hanjaList.map(h => (
                    <button
                        key={h.id}
                        onClick={() => onSelectHanja(h)}
                        className="aspect-square clay-panel rounded-2xl bg-white dark:bg-slate-800 border-2 border-white flex flex-col items-center justify-center gap-1 active:scale-90 transition-all hover:-translate-y-1 shadow-md"
                    >
                        <span className="text-3xl font-black text-slate-700 dark:text-white leading-none">{h.hanja}</span>
                        <span className="text-[10px] font-bold text-slate-400 leading-none">{h.sound}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// ─── 3단계: HanziWriter 퀴즈 모드 ────────────────────────────────────────
const QuizScreen = ({ hanja, onBack, onComplete, onWritingComplete }) => {
    const quizContainerRef = useRef(null);
    const writerRef = useRef(null);
    const [score, setScore] = useState(MAX_SCORE);
    const [hintCount, setHintCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [currentStroke, setCurrentStroke] = useState(0);
    const [totalStrokes, setTotalStrokes] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [mistakeOnStroke, setMistakeOnStroke] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // ─── 연필 설정 상태 ───────────────────────────────────────────────────
    const [strokeColor, setStrokeColor] = useState(STROKE_COLORS[0].value);   // 기본: 인디고
    const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1].value);   // 기본: 보통(8)
    const [showStrokeNumbers, setShowStrokeNumbers] = useState(true);          // 획순 번호 표시

    // ─── Writer 재생성 함수 ───────────────────────────────────────────────
    const createWriter = useCallback((color, width, showNumbers, callbacks) => {
        if (!quizContainerRef.current || !window.HanziWriter) return null;
        quizContainerRef.current.innerHTML = '';
        const containerSize = Math.min(window.innerWidth - 48, 400);

        const writer = window.HanziWriter.create(quizContainerRef.current, hanja.hanja, {
            width: containerSize,
            height: containerSize,
            padding: containerSize * 0.08,
            showOutline: true,
            strokeColor: color,
            outlineColor: 'rgba(0,0,0,0.08)',
            drawingColor: color,
            drawingWidth: Math.max(4, width),
            showHintAfterMisses: false,
            highlightOnComplete: true,
            highlightColor: '#FFD700',
            // 획순 번호 표시 옵션
            showCharacter: showNumbers,
            charColor: 'rgba(0,0,0,0.08)',
            strokeAnimationSpeed: 1,
            delayBetweenStrokes: 200,
        });

        return writer;
    }, [hanja]);

    // ─── 퀴즈 시작 함수 ──────────────────────────────────────────────────
    const startQuiz = useCallback((writer) => {
        if (!writer) return;
        writer.quiz({
            onMistake: () => {
                setWrongCount(c => c + 1);
                setScore(s => Math.max(0, s - WRONG_PENALTY));
                setMistakeOnStroke(true);
                setTimeout(() => setMistakeOnStroke(false), 600);
            },
            onCorrectStroke: (sd) => {
                setCurrentStroke(sd.strokeNum + 1);
                setMistakeOnStroke(false);
            },
            onComplete: () => {
                setIsComplete(true);
                setShowResult(true);
                if (onWritingComplete && hanja.id) onWritingComplete(hanja.id);
            }
        });
    }, [hanja, onWritingComplete]);

    // ─── 초기화 ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!quizContainerRef.current || !window.HanziWriter) return;

        const writer = createWriter(strokeColor, strokeWidth, showStrokeNumbers, null);
        if (!writer) return;
        writerRef.current = writer;

        // 총 획수 가져오기
        fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${hanja.hanja}.json`)
            .then(r => r.json())
            .then(data => {
                setTotalStrokes(data.strokes ? data.strokes.length : 0);
                setIsReady(true);
            })
            .catch(() => setIsReady(true));

        startQuiz(writer);

        return () => {
            if (quizContainerRef.current) quizContainerRef.current.innerHTML = '';
        };
    }, [hanja]);

    // ─── 연필 색상 변경 ──────────────────────────────────────────────────
    const handleColorChange = useCallback((color) => {
        if (isComplete || isAnimating) return;
        setStrokeColor(color);
        // Writer 재생성
        const writer = createWriter(color, strokeWidth, showStrokeNumbers, null);
        if (!writer) return;
        writerRef.current = writer;
        startQuiz(writer);
    }, [isComplete, isAnimating, strokeWidth, showStrokeNumbers, createWriter, startQuiz]);

    // ─── 연필 굵기 변경 ──────────────────────────────────────────────────
    const handleWidthChange = useCallback((width) => {
        if (isComplete || isAnimating) return;
        setStrokeWidth(width);
        const writer = createWriter(strokeColor, width, showStrokeNumbers, null);
        if (!writer) return;
        writerRef.current = writer;
        startQuiz(writer);
    }, [isComplete, isAnimating, strokeColor, showStrokeNumbers, createWriter, startQuiz]);

    // ─── 획순 번호 토글 ──────────────────────────────────────────────────
    const handleToggleNumbers = useCallback(() => {
        if (isComplete || isAnimating) return;
        const next = !showStrokeNumbers;
        setShowStrokeNumbers(next);
        const writer = createWriter(strokeColor, strokeWidth, next, null);
        if (!writer) return;
        writerRef.current = writer;
        startQuiz(writer);
    }, [isComplete, isAnimating, strokeColor, strokeWidth, showStrokeNumbers, createWriter, startQuiz]);

    // ─── 힌트 버튼 ───────────────────────────────────────────────────────
    const handleHint = useCallback(() => {
        if (!writerRef.current || isComplete || isAnimating) return;
        setHintCount(c => c + 1);
        setScore(s => Math.max(0, s - HINT_PENALTY));
        setIsAnimating(true);
        try { writerRef.current.cancelQuiz(); } catch(e) {}
        writerRef.current.animateCharacter({
            onComplete: () => {
                setIsAnimating(false);
                if (writerRef.current) {
                    writerRef.current.quiz({
                        onMistake: () => {
                            setWrongCount(c => c + 1);
                            setScore(s => Math.max(0, s - WRONG_PENALTY));
                            setMistakeOnStroke(true);
                            setTimeout(() => setMistakeOnStroke(false), 600);
                        },
                        onCorrectStroke: (sd) => {
                            setCurrentStroke(sd.strokeNum + 1);
                            setMistakeOnStroke(false);
                        },
                        onComplete: () => {
                            setIsComplete(true);
                            setShowResult(true);
                            if (onWritingComplete && hanja.id) onWritingComplete(hanja.id);
                        }
                    });
                }
            }
        });
    }, [isComplete, isAnimating, hanja, onWritingComplete]);

    // ─── 다시 도전 ───────────────────────────────────────────────────────
    const handleRetry = useCallback(() => {
        setScore(MAX_SCORE);
        setHintCount(0);
        setWrongCount(0);
        setIsComplete(false);
        setShowResult(false);
        setCurrentStroke(0);
        setMistakeOnStroke(false);
        setIsAnimating(false);
        const writer = createWriter(strokeColor, strokeWidth, showStrokeNumbers, null);
        if (!writer) return;
        writerRef.current = writer;
        startQuiz(writer);
    }, [strokeColor, strokeWidth, showStrokeNumbers, createWriter, startQuiz]);

    const getScoreEmoji = (s) => {
        if (s >= 90) return '🌟';
        if (s >= 70) return '⭐';
        if (s >= 50) return '💪';
        return '😓';
    };

    const getScoreColor = (s) => {
        if (s >= 90) return 'text-yellow-500';
        if (s >= 70) return 'text-green-500';
        if (s >= 50) return 'text-blue-500';
        return 'text-red-500';
    };

    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-full px-4 pt-8 pb-32 gap-4">
            {/* 헤더 */}
            <div className="w-full flex items-center gap-4">
                <button onClick={onBack} className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 flex items-center justify-center font-black text-xl active:scale-90 transition-all shadow-md">
                    ←
                </button>
                <div className="flex flex-col flex-1">
                    <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-black text-slate-700 dark:text-white">{hanja.hanja}</span>
                        <span className="text-xl font-black text-indigo-500">{hanja.sound}</span>
                        <span className="text-base font-bold text-slate-400">{hanja.meaning}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">{hanja.grade} · {hanja.theme}</span>
                </div>
                {/* 점수 */}
                <div className={`flex flex-col items-center ${getScoreColor(score)}`}>
                    <span className="text-3xl font-black">{score}</span>
                    <span className="text-xs font-bold">점</span>
                </div>
            </div>

            {/* 획순 진행 바 */}
            {totalStrokes > 0 && (
                <div className="w-full flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 shrink-0">{currentStroke}/{totalStrokes}획</span>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-400 rounded-full transition-all duration-300"
                            style={{ width: `${totalStrokes > 0 ? (currentStroke / totalStrokes) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            )}

            {/* ─── 연필 설정 패널 ─────────────────────────────────────── */}
            {!isComplete && (
                <div className="w-full max-w-[400px] clay-panel rounded-2xl bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-700 p-3 flex flex-col gap-3">

                    {/* 연필 색상 */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 shrink-0 w-14">✏️ 색상</span>
                        <div className="flex gap-1.5 flex-wrap">
                            {STROKE_COLORS.map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => handleColorChange(c.value)}
                                    title={c.label}
                                    className={`w-7 h-7 rounded-full ${c.bg} transition-all active:scale-90 ${
                                        strokeColor === c.value
                                            ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                                            : 'opacity-70 hover:opacity-100'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 연필 굵기 */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 shrink-0 w-14">굵기</span>
                        <div className="flex gap-2">
                            {STROKE_WIDTHS.map(w => (
                                <button
                                    key={w.value}
                                    onClick={() => handleWidthChange(w.value)}
                                    className={`px-3 py-1.5 rounded-xl font-black text-sm transition-all active:scale-90 ${
                                        strokeWidth === w.value
                                            ? 'bg-indigo-500 text-white shadow-md'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                                    }`}
                                >
                                    {w.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 획순 번호 토글 */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 shrink-0 w-14">획순 번호</span>
                        <button
                            onClick={handleToggleNumbers}
                            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                                showStrokeNumbers ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'
                            }`}
                        >
                            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                                showStrokeNumbers ? 'left-6' : 'left-0.5'
                            }`} />
                        </button>
                        <span className={`text-xs font-bold ${showStrokeNumbers ? 'text-indigo-500' : 'text-slate-400'}`}>
                            {showStrokeNumbers ? '표시 중' : '숨김'}
                        </span>
                    </div>
                </div>
            )}

            {/* 퀴즈 캔버스 */}
            <div className={`relative w-full max-w-[400px] aspect-square mx-auto rounded-[2.5rem] overflow-hidden shadow-xl border-4 transition-all duration-300 ${mistakeOnStroke ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-white dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                <div ref={quizContainerRef} className="w-full h-full flex items-center justify-center" />
                {!isReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80">
                        <div className="text-slate-400 font-bold">로딩 중...</div>
                    </div>
                )}
            </div>

            {/* 안내 문구 */}
            {!isComplete && (
                <div className="text-slate-400 text-sm font-bold text-center">
                    {mistakeOnStroke
                        ? '❌ 획순이 틀렸어요! (-5점)'
                        : isAnimating
                        ? '▶ 획순 재생 중...'
                        : '획순에 맞게 한자를 써보세요'}
                </div>
            )}

            {/* 힌트 버튼 */}
            {!isComplete && (
                <button
                    onClick={handleHint}
                    disabled={isAnimating}
                    className={`w-full max-w-[400px] py-4 rounded-2xl font-black text-lg shadow-md transition-all flex items-center justify-center gap-2 ${
                        isAnimating
                            ? 'bg-amber-200 text-amber-400 cursor-not-allowed'
                            : 'bg-amber-400 text-white active:scale-95'
                    }`}
                >
                    {isAnimating ? '▶ 획순 재생 중...' : <>💡 획순 힌트 보기 <span className="text-sm font-bold opacity-80">(-{HINT_PENALTY}점)</span></>}
                </button>
            )}

            {/* 통계 */}
            {(hintCount > 0 || wrongCount > 0) && !isComplete && (
                <div className="flex gap-4 text-sm font-bold">
                    {hintCount > 0 && <span className="text-amber-500">힌트 {hintCount}회 (-{hintCount * HINT_PENALTY}점)</span>}
                    {wrongCount > 0 && <span className="text-red-500">오류 {wrongCount}회 (-{wrongCount * WRONG_PENALTY}점)</span>}
                </div>
            )}

            {/* 완료 결과 */}
            {showResult && (
                <div className="w-full max-w-[400px] clay-panel rounded-[2rem] p-6 bg-white dark:bg-slate-800 border-4 border-white flex flex-col items-center gap-4">
                    <div className="text-5xl">{getScoreEmoji(score)}</div>
                    <div className={`text-4xl font-black ${getScoreColor(score)}`}>{score}점</div>
                    <div className="text-slate-500 text-sm font-bold text-center">
                        {score >= 90 ? '완벽해요! 이 한자를 마스터했어요!' :
                         score >= 70 ? '잘 했어요! 조금만 더 연습해봐요' :
                         score >= 50 ? '아직 연습이 필요해요' : '다시 도전해봐요!'}
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button
                            onClick={handleRetry}
                            className="flex-1 py-4 rounded-2xl bg-indigo-500 text-white font-black text-lg active:scale-95 transition-all"
                        >
                            다시 도전
                        </button>
                        <button
                            onClick={onBack}
                            className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black text-lg active:scale-95 transition-all"
                        >
                            목록으로
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── 메인 WritingScreen ───────────────────────────────────────────────────
// initialHanja: 한자 카드에서 직접 진입 시 이 한자로 바로 퀴즈 시작
const WritingScreen = ({ onBack, onWritingComplete, initialHanja }) => {
    // initialHanja가 있으면 바로 quiz 단계로 시작
    const [stage, setStage] = useState(initialHanja ? 'quiz' : 'filter');
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [selectedHanja, setSelectedHanja] = useState(initialHanja || null);

    const handleSelectFilter = (filter) => {
        setSelectedFilter(filter);
        setStage('grid');
    };

    const handleSelectHanja = (hanja) => {
        setSelectedHanja(hanja);
        setStage('quiz');
    };

    // quiz에서 뒤로 가기: initialHanja로 진입했으면 onBack(카드화면), 아니면 grid로
    const handleQuizBack = () => {
        if (initialHanja) {
            onBack();
        } else {
            setStage('grid');
        }
    };

    if (stage === 'filter') {
        return (
            <div className="w-full h-[100dvh] overflow-y-auto">
                <FilterScreen
                    onSelect={handleSelectFilter}
                    onBack={onBack}
                />
            </div>
        );
    }

    if (stage === 'grid') {
        return (
            <div className="w-full h-[100dvh] overflow-y-auto">
                <GridScreen
                    filter={selectedFilter}
                    onSelectHanja={handleSelectHanja}
                    onBack={() => setStage('filter')}
                />
            </div>
        );
    }

    if (stage === 'quiz') {
        return (
            <div className="w-full h-[100dvh] overflow-y-auto">
                <QuizScreen
                    hanja={selectedHanja}
                    onBack={handleQuizBack}
                    onWritingComplete={onWritingComplete}
                />
            </div>
        );
    }

    return null;
};

export default WritingScreen;
