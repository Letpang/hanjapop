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
const THEME_LIST = [...new Set(HANJA_DATA.map(h => h.category).filter(Boolean))];

// 카테고리 대표 이미지 (hanja 문자 기준으로 실제 존재하는 파일명)
const CATEGORY_IMAGES = {
    '숫자와 기초 개념': '1_一.webp',
    '자연과 시간': '31_日.webp',
    '나와 가족 신체': '71_父.webp',
    '공간과 위치': '111_東.webp',
    '학교와 일상생활': '151_學.webp',
    '행동과 상태': '201_來.webp',
    '사회와 문화': '251_國.webp',
};

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
    { label: '가늘게', value: 12, icon: '─' },
    { label: '보통',   value: 22, icon: '━' },
    { label: '굵게',   value: 34, icon: '▬' },
];

// ─── 1단계: 필터 선택 화면 ────────────────────────────────────────────────
const FilterScreen = ({ onSelect, onBack }) => {
    const [tab, setTab] = useState('grade'); // 'grade' | 'theme'

    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden" style={{ backgroundColor: '#F8FAFF' }}>
            {/* 헤더 */}
            <div className="w-full shrink-0 bg-white" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div className="w-full flex justify-between items-center px-5 py-3">
                    <button onClick={onBack} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center font-extrabold text-lg active:scale-90 text-slate-400 border border-slate-100 transition-all">
                        ←
                    </button>
                    <span className="text-sm font-extrabold text-slate-400">한자 쓰기</span>
                    <div className="w-9 h-9" />
                </div>
            </div>

            {/* 바디 */}
            <div className="flex-1 overflow-y-auto pb-6">
                <div className="w-full max-w-xl mx-auto px-4 flex flex-col items-center gap-6 pt-5">
                    <div className="flex flex-col items-center gap-10 w-full animate-in fade-in duration-500">

                        {/* 탭 */}
                        <div className="flex bg-slate-100/40 p-1.5 rounded-full border border-slate-200 w-full mb-4 shadow-inner">
                            <button
                                onClick={() => setTab('grade')}
                                className={`flex-1 px-8 py-3 rounded-full font-extrabold text-xs transition-all ${tab === 'grade' ? 'bg-white shadow-md' : 'text-slate-400'}`}
                                style={tab === 'grade' ? { color: '#C2410C' } : {}}
                            >
                                급수별
                            </button>
                            <button
                                onClick={() => setTab('theme')}
                                className={`flex-1 px-8 py-3 rounded-full font-extrabold text-xs transition-all ${tab === 'theme' ? 'bg-white shadow-md' : 'text-slate-400'}`}
                                style={tab === 'theme' ? { color: '#C2410C' } : {}}
                            >
                                주제별
                            </button>
                        </div>

                        {/* 급수 선택 */}
                        {tab === 'grade' && (
                            <div className="grid grid-cols-3 gap-3 w-full">
                                {[...GRADE_LIST, '전체'].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => onSelect({ type: g === '전체' ? 'all' : 'grade', value: g })}
                                        className="py-6 rounded-[2rem] font-extrabold text-lg transition-all border shadow-sm active:scale-95 bg-white"
                                        style={{ color: '#C2410C', borderColor: '#FFD3B6', boxShadow: '0 8px 24px #FFD3B640' }}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* 주제 선택 */}
                        {tab === 'theme' && (
                            <div className="grid grid-cols-2 gap-4 w-full">
                                {THEME_LIST.map(theme => {
                                    const count = HANJA_DATA.filter(h => h.category === theme).length;
                                    const imgFile = CATEGORY_IMAGES[theme];
                                    const imgSrc = imgFile ? `/assets/images/hanja_all/${imgFile}` : null;
                                    return (
                                        <button
                                            key={theme}
                                            onClick={() => onSelect({ type: 'category', value: theme })}
                                            className="bg-white shadow-lg rounded-2xl flex flex-row items-center overflow-hidden active:scale-95 transition-all border-[4px]"
                                            style={{ borderColor: 'white' }}
                                        >
                                            <div className="w-28 h-28 shrink-0 flex items-center justify-center p-3" style={{ backgroundColor: '#F8FAFC' }}>
                                                {imgSrc ? <img src={imgSrc} className="w-full h-full object-contain drop-shadow-sm" alt={theme} /> : <span className="text-2xl font-extrabold" style={{ color: '#FFD3B6' }}>?</span>}
                                            </div>
                                            <div className="px-3 flex flex-col items-start gap-0">
                                                <span className="font-extrabold text-xs leading-tight text-slate-700">{theme}</span>
                                                <span className="text-[9px] font-bold text-slate-400">{count}개</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── 2단계: HanziWriter 퀴즈 모드 ────────────────────────────────────────
const QuizScreen = ({ hanja, hanjaList = [], currentIndex = 0, onBack, onComplete, onWritingComplete, onNextHanja }) => {
    const quizContainerRef = useRef(null);
    const strokeNumberCanvasRef = useRef(null);
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
    const [charData, setCharData] = useState(null);

    // ─── 연필 설정 상태 ───────────────────────────────────────────────────
    const [strokeColor, setStrokeColor] = useState('#10B981');   // 기본: 민트
    const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1].value);   // 기본: 보통(22)
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
            showOutline: showNumbers,
            strokeColor: color,
            outlineColor: 'rgba(0,0,0,0.15)',
            drawingColor: color,
            drawingWidth: width,
            showHintAfterMisses: false,
            highlightOnComplete: true,
            highlightColor: '#FFD700',
            showCharacter: true,
            charColor: 'rgba(0,0,0,0.06)',
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
                if (onWritingComplete && hanja.id) onWritingComplete(hanja.id, score);
            }
        });
    }, [hanja, onWritingComplete, score]);

    // ─── 초기화 ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!quizContainerRef.current || !window.HanziWriter) return;

        const writer = createWriter(strokeColor, strokeWidth, showStrokeNumbers, null);
        if (!writer) return;
        writerRef.current = writer;

        // 초기 상태 리셋
        setScore(MAX_SCORE);
        setHintCount(0);
        setWrongCount(0);
        setIsComplete(false);
        setShowResult(false);
        setCurrentStroke(0);
        setMistakeOnStroke(false);
        setIsAnimating(false);

        // 총 획수 + 획순 번호용 데이터 가져오기
        fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${hanja.hanja}.json`)
            .then(r => r.json())
            .then(data => {
                setTotalStrokes(data.strokes ? data.strokes.length : 0);
                setCharData(data);
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

    // ─── 획순 번호 캔버스 그리기 ─────────────────────────────────────────
    useEffect(() => {
        const canvas = strokeNumberCanvasRef.current;
        if (!canvas || !charData || !charData.medians) return;

        const size = canvas.offsetWidth;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, size, size);

        if (!showStrokeNumbers || isComplete) return;

        const padding = size * 0.08;
        const scale = (size - 2 * padding) / 1024;
        const r = size * 0.038;

        charData.medians.forEach((median, i) => {
            if (!median || median.length === 0) return;
            const [mx, my] = median[0];
            const cx = padding + mx * scale;
            const cy = padding + (1024 - my) * scale;

            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(251,191,36,0.92)';
            ctx.fill();

            ctx.font = `bold ${Math.round(r * 1.3)}px sans-serif`;
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(i + 1), cx, cy + 0.5);
        });
    }, [charData, showStrokeNumbers, isComplete]);

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
                            if (onWritingComplete && hanja.id) onWritingComplete(hanja.id, score);
                        }
                    });
                }
            }
        });
    }, [isComplete, isAnimating, hanja, onWritingComplete, score]);

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

    const handleNext = () => {
        if (onNextHanja) onNextHanja();
        else onBack();
    };

    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto h-full px-4 pt-4 pb-4 gap-3 overflow-y-auto" style={{ backgroundColor: '#F8FAFF' }}>
            {/* 헤더 */}
            <div className="w-full flex items-center justify-between shrink-0">
                <button
                    onClick={onBack}
                    className="w-9 h-9 rounded-full bg-white flex items-center justify-center font-extrabold text-lg active:scale-90 text-slate-400 border border-slate-100 shadow-sm transition-all"
                >
                    ←
                </button>
                <div className="flex items-center gap-3">
                    <span className="text-5xl font-extrabold leading-none" style={{ color: '#1E293B' }}>{hanja.hanja}</span>
                    <span className="text-base font-extrabold text-slate-600 leading-tight">{hanja.meaning} {hanja.sound}</span>
                </div>
                {hanjaList.length > 0 ? (
                    <span className="text-xs font-extrabold text-slate-300 tracking-widest">{currentIndex + 1} / {hanjaList.length}</span>
                ) : (
                    <div className="w-9" />
                )}
            </div>

            {/* 연필 설정 패널 */}
            <div className="w-full bg-white rounded-2xl p-3 flex flex-col gap-3 shrink-0" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-extrabold text-slate-300 tracking-widest shrink-0 w-10">색상</span>
                    <div className="flex gap-2 flex-wrap">
                        {STROKE_COLORS.map(c => (
                            <button
                                key={c.value}
                                onClick={() => handleColorChange(c.value)}
                                className={`w-6 h-6 rounded-full ${c.bg} transition-all active:scale-[0.8] ${
                                    strokeColor === c.value ? 'scale-110' : 'opacity-40 hover:opacity-100'
                                }`}
                                style={strokeColor === c.value ? { boxShadow: `0 0 0 2px white, 0 0 0 4px #10B981` } : undefined}
                            />
                        ))}
                    </div>
                </div>
                <div className="h-px bg-slate-100 w-full" />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-extrabold text-slate-300 tracking-widest shrink-0 w-10">굵기</span>
                        <div className="flex gap-1">
                            {STROKE_WIDTHS.map(w => (
                                <button
                                    key={w.value}
                                    onClick={() => handleWidthChange(w.value)}
                                    className="px-3 py-1 rounded-full font-extrabold text-[10px] transition-all active:scale-90 border"
                                    style={strokeWidth === w.value
                                        ? { backgroundColor: '#10B981', color: 'white', borderColor: '#059669' }
                                        : { backgroundColor: '#F8FAFC', color: '#94A3B8', borderColor: '#E2E8F0' }}
                                >
                                    {w.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 py-1 px-3 rounded-full border border-slate-100">
                        <span className="text-[10px] font-extrabold text-slate-300 tracking-widest">획순 가이드</span>
                        <button
                            onClick={handleToggleNumbers}
                            className="relative w-9 h-5 rounded-full transition-all duration-300"
                            style={{ backgroundColor: showStrokeNumbers ? '#10B981' : '#E2E8F0' }}
                        >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${showStrokeNumbers ? 'left-4' : 'left-0.5'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 퀴즈 캔버스 */}
            <div className={`relative w-full max-w-[360px] aspect-square mx-auto rounded-[3rem] overflow-hidden transition-all duration-500 shrink-0 ${
                isComplete ? 'border-4 border-emerald-200 shadow-lg shadow-emerald-50' :
                mistakeOnStroke ? 'bg-rose-50 shadow-[0_0_40px_rgba(244,63,94,0.1)]' :
                'bg-white shadow-xl shadow-slate-100/50 border-4 border-white'
            }`}>
                <div ref={quizContainerRef} className="w-full h-full flex items-center justify-center" />
                <canvas
                    ref={strokeNumberCanvasRef}
                    className="absolute inset-0 pointer-events-none"
                    style={{ width: '100%', height: '100%' }}
                />
                {!isReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* 하단 버튼 영역 */}
            {!isComplete ? (
                <div className="w-full flex flex-col gap-2 shrink-0">
                    <div className="py-1.5 px-4 rounded-full bg-slate-50 border border-slate-100 self-center">
                        <span className={`text-[10px] font-extrabold tracking-widest ${mistakeOnStroke ? 'text-rose-500' : 'text-slate-400'}`}>
                            {mistakeOnStroke ? '❌ 오답!' : isAnimating ? '▶ 획순 재생 중...' : '정확한 획순으로 따라 써보세요'}
                        </span>
                    </div>
                    <button
                        onClick={handleHint}
                        disabled={isAnimating}
                        className="w-full py-4 rounded-full font-extrabold text-base transition-all flex items-center justify-center gap-2 active:scale-95 border"
                        style={isAnimating
                            ? { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#CBD5E1', cursor: 'not-allowed' }
                            : { backgroundColor: 'white', borderColor: '#CBD5E1', color: '#94A3B8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                    >
                        {isAnimating ? '재생 중...' : '💡 힌트 보기'}
                    </button>
                </div>
            ) : (
                <div className="w-full flex flex-col gap-2 shrink-0 animate-in fade-in duration-300">
                    <button
                        onClick={handleNext}
                        className="pill-button-primary w-full py-4 text-lg shadow-xl shadow-indigo-100"
                    >
                        다음 한자 →
                    </button>
                    <button
                        onClick={handleRetry}
                        className="w-full py-3 text-slate-300 hover:text-slate-400 font-extrabold text-sm tracking-widest transition-colors"
                    >
                        다시 쓰기
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── 메인 WritingScreen ───────────────────────────────────────────────────
// initialHanja: 한자 카드에서 직접 진입 시 이 한자로 바로 퀴즈 시작
const WritingScreen = ({ onBack, onWritingComplete, initialHanja }) => {
    const [stage, setStage] = useState(initialHanja ? 'quiz' : 'filter');
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [selectedHanja, setSelectedHanja] = useState(initialHanja || null);
    const [hanjaIndex, setHanjaIndex] = useState(0);

    const hanjaList = useMemo(() => {
        if (!selectedFilter) return [];
        if (selectedFilter.type === 'all') return HANJA_DATA;
        if (selectedFilter.type === 'grade') return HANJA_DATA.filter(h => h.grade === selectedFilter.value);
        return HANJA_DATA.filter(h => h.category === selectedFilter.value);
    }, [selectedFilter]);

    const getListForFilter = (filter) => {
        if (filter.type === 'all') return HANJA_DATA;
        if (filter.type === 'grade') return HANJA_DATA.filter(h => h.grade === filter.value);
        return HANJA_DATA.filter(h => h.category === filter.value);
    };

    const handleSelectFilter = (filter) => {
        const list = getListForFilter(filter);
        if (list.length === 0) return;
        setSelectedFilter(filter);
        setHanjaIndex(0);
        setSelectedHanja(list[0]);
        setStage('quiz');
    };

    const handleNextHanja = () => {
        if (initialHanja || hanjaList.length === 0) { onBack(); return; }
        const nextIdx = hanjaIndex + 1;
        if (nextIdx >= hanjaList.length) {
            setStage('filter');
        } else {
            setHanjaIndex(nextIdx);
            setSelectedHanja(hanjaList[nextIdx]);
        }
    };

    const handleQuizBack = () => {
        if (initialHanja) {
            onBack();
        } else {
            setStage('filter');
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

    if (stage === 'quiz') {
        return (
            <div className="w-full h-[100dvh] overflow-hidden">
                <QuizScreen
                    hanja={selectedHanja}
                    hanjaList={hanjaList}
                    currentIndex={hanjaIndex}
                    onBack={handleQuizBack}
                    onWritingComplete={onWritingComplete}
                    onNextHanja={handleNextHanja}
                />
            </div>
        );
    }

    return null;
};

export default WritingScreen;
