import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { useLang } from '../LangContext.jsx';
import GradeGrid, { TopicCard } from './GradeGrid.jsx';
import { getRankDetails, getCharacterImage } from '../utils/rankUtils.js';
import { GRADES, CATEGORY_IMAGES } from '../constants/hanjaConstants.js';
import { useUnlockedHanja } from '../hooks/useUnlockedHanja.js';

// ─── 상수 ─────────────────────────────────────────────────────────────────
const HINT_PENALTY = 10;     // 힌트 1회 = -10점
const WRONG_PENALTY = 5;     // 획 틀릴 때마다 -5점
const MAX_SCORE = 100;

// 주제 목록 (중복 제거)
const CATEGORIES = [...new Set((HANJA_DATA || []).map(h => h.category).filter(Boolean))];

// ─── 연필 색상 팔레트 ─────────────────────────────────────────────────────
const STROKE_COLORS = [
    { label: '검정',   value: '#34383F', bg: 'bg-[#34383F]', dark: '#1E2126' },
    { label: '주황',   value: '#FF5500', bg: 'bg-[#FF5500]', dark: '#CC4400' },
    { label: '노랑',   value: '#FFD600', bg: 'bg-[#FFD600]', dark: '#CCA800' },
    { label: '인디고', value: '#7C83FF', bg: 'bg-[#7C83FF]', dark: '#5A61D4' },
    { label: '초록',   value: '#00C853', bg: 'bg-[#00C853]', dark: '#009A3E' },
];

// ─── 연필 굵기 옵션 ───────────────────────────────────────────────────────
const STROKE_WIDTHS = [
    { label: '가늘게', value: 12, icon: '─' },
    { label: '보통',   value: 22, icon: '━' },
    { label: '굵게',   value: 34, icon: '▬' },
];

// ─── Result Screen ──────────────────────────────────────────────────────────
const ResultScreen = ({ correct, total, onRetry, onBack, selectedCharacter }) => {
    const pct = Math.round((correct / total) * 100);
    const isClear = pct >= 70;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300"
            style={{ background: isClear ? 'linear-gradient(180deg, #DDF1EA 0%, #EAF6F2 100%)' : 'rgba(255,107,107,0.18)' }}
        >
            <div className="w-full max-w-sm flex flex-col items-center result-card-container overflow-hidden">
                <div className="pt-6 pb-10 px-6 flex flex-col items-center gap-7 w-full relative">
                    {/* 캐릭터 아래 백그라운드 글로우 추가 */}
                    <div className="absolute top-[28px] w-[140px] h-[140px] rounded-full blur-xl z-0" style={{ backgroundColor: 'rgba(255,255,255,0.65)' }} />

                    <img
                        src={isClear ? getCharacterImage(selectedCharacter, 'success') : getCharacterImage(selectedCharacter, 'failure')}
                        alt={isClear ? "clear" : "fail"}
                        className="w-[176px] h-[176px] object-contain relative z-10 mt-4"
                        style={{ filter: 'drop-shadow(0 12px 24px rgba(120,130,160,0.16))' }}
                    />
                    <div className="text-center flex flex-col gap-2 relative z-10 -mt-5">
                        <span className="text-xs-res font-extrabold text-[#AEB7C5]">
                            {isClear ? '완벽하게 써냈어요!' : '조금 더 연습해볼까요?'}
                        </span>
                        <h1 className="text-h2-res font-black leading-snug" style={{ 
                            color: isClear ? '#FF9B73' : '#FF6B6B',
                            letterSpacing: '-0.5px',
                            textShadow: isClear ? '0 2px 10px rgba(255,160,120,0.16)' : 'none'
                        }}>
                            {isClear ? '참 잘했어요!' : <>괜찮아요,<br/>다시 도전해봐요!</>}
                        </h1>
                    </div>
                    <div className="w-full flex flex-col gap-3 relative z-10">
                        <button
                            onClick={onRetry}
                            className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg retry-quiz-button"
                        >
                            다시 하기
                        </button>
                        <button
                            onClick={onBack}
                            className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg active:scale-95 transition-all shadow-sm back-quiz-button"
                        >
                            돌아가기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Quiz Card (Writing) ────────────────────────────────────────────────────
const QuizCard = ({ hanja, hanjaList, currentIndex, onWritingComplete, onNextHanja, onBack }) => {
    const quizContainerRef = useRef(null);
    const strokeNumberCanvasRef = useRef(null);
    const writerRef = useRef(null);
    const [score, setScore] = useState(MAX_SCORE);
    const [isComplete, setIsComplete] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [mistakeOnStroke, setMistakeOnStroke] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [charData, setCharData] = useState(null);

    const [strokeColor, setStrokeColor] = useState('#34383F');
    const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1].value);
    const [showStrokeNumbers, setShowStrokeNumbers] = useState(true);

    const createWriter = useCallback((color, width, showNumbers) => {
        if (!quizContainerRef.current || !window.HanziWriter) return null;
        quizContainerRef.current.innerHTML = '';
        const containerSize = Math.min(window.innerWidth - 64, 340);

        return window.HanziWriter.create(quizContainerRef.current, hanja.hanja, {
            width: containerSize,
            height: containerSize,
            padding: containerSize * 0.08,
            showOutline: showNumbers,
            strokeColor: color,
            outlineColor: 'rgba(0,0,0,0.1)',
            drawingColor: '#34383F',
            drawingWidth: width,
            showHintAfterMisses: false,
            highlightOnComplete: true,
            highlightColor: '#FFB433',
            showCharacter: true,
            charColor: 'rgba(0,0,0,0.05)',
            strokeAnimationSpeed: 1,
            delayBetweenStrokes: 200,
        });
    }, [hanja]);

    const startQuiz = useCallback((writer) => {
        if (!writer) return;
        writer.quiz({
            onMistake: () => {
                setScore(s => Math.max(0, s - WRONG_PENALTY));
                setMistakeOnStroke(true);
                setTimeout(() => setMistakeOnStroke(false), 600);
            },
            onCorrectStroke: () => setMistakeOnStroke(false),
            onComplete: () => {
                setIsComplete(true);
                if (onWritingComplete && hanja.id) onWritingComplete(hanja.id, score);
            }
        });
    }, [hanja, onWritingComplete, score]);

    useEffect(() => {
        if (!quizContainerRef.current || !window.HanziWriter) return;
        const writer = createWriter(strokeColor, strokeWidth, showStrokeNumbers);
        if (!writer) return;
        writerRef.current = writer;

        setScore(MAX_SCORE);
        setIsComplete(false);
        setMistakeOnStroke(false);
        setIsAnimating(false);

        fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${hanja.hanja}.json`)
            .then(r => r.json())
            .then(data => {
                setCharData(data);
                setIsReady(true);
            })
            .catch(() => setIsReady(true));

        startQuiz(writer);
        return () => { if (quizContainerRef.current) quizContainerRef.current.innerHTML = ''; };
    }, [hanja]);

    const handleColorChange = (color) => {
        if (isComplete || isAnimating) return;
        setStrokeColor(color);
        const writer = createWriter(color, strokeWidth, showStrokeNumbers);
        writerRef.current = writer;
        startQuiz(writer);
    };

    const handleWidthChange = (width) => {
        if (isComplete || isAnimating) return;
        setStrokeWidth(width);
        const writer = createWriter(strokeColor, width, showStrokeNumbers);
        writerRef.current = writer;
        startQuiz(writer);
    };

    const handleToggleNumbers = () => {
        if (isComplete || isAnimating) return;
        const next = !showStrokeNumbers;
        setShowStrokeNumbers(next);
        const writer = createWriter(strokeColor, strokeWidth, next);
        writerRef.current = writer;
        startQuiz(writer);
    };

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
        const r = size * 0.035;

        charData.medians.forEach((median, i) => {
            if (!median || median.length === 0) return;
            const [mx, my] = median[0];
            const cx = padding + mx * scale;
            const cy = padding + (1024 - my) * scale;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(124,131,255,0.95)'; ctx.fill();
            ctx.font = `bold ${Math.round(r * 1.3)}px sans-serif`;
            ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(String(i + 1), cx, cy + 0.5);
        });
    }, [charData, showStrokeNumbers, isComplete]);

    const handleHint = () => {
        if (!writerRef.current || isComplete || isAnimating) return;
        setScore(s => Math.max(0, s - HINT_PENALTY));
        setIsAnimating(true);
        try { writerRef.current.cancelQuiz(); } catch(e) {}
        writerRef.current.animateCharacter({
            onComplete: () => {
                setIsAnimating(false);
                if (writerRef.current) startQuiz(writerRef.current);
            }
        });
    };

    const handleRetry = () => {
        setScore(MAX_SCORE);
        setIsComplete(false);
        setMistakeOnStroke(false);
        setIsAnimating(false);
        const writer = createWriter(strokeColor, strokeWidth, showStrokeNumbers);
        writerRef.current = writer;
        startQuiz(writer);
    };

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto gap-6 animate-in fade-in duration-500">
            {/* 한자 정보 카드 */}
            <div className="w-full bg-white rounded-[2.5rem] p-3 shadow-xl border-4 border-white flex items-center justify-center gap-6">
                <span className="font-black text-[#3C3C3C] leading-none" style={{ fontSize: 'clamp(4rem, 14vw, 6.5rem)' }}>{hanja.hanja}</span>
                <div className="w-px h-8 bg-slate-200 shrink-0" />
                <span className="text-h2-res font-black text-[#3C3C3C] leading-none">{hanja.meaning} {hanja.sound}</span>
            </div>

            {/* 연필 설정 */}
            <div className="w-full rounded-[2rem] px-4 py-3 flex items-center justify-between gap-2" style={{ backgroundColor: '#F0F2F5' }}>
                {/* 색상 - 젤리 버튼 */}
                <div className="flex items-center gap-1.5">
                    {STROKE_COLORS.map(c => (
                        <button key={c.value} onClick={() => handleColorChange(c.value)}
                            className={`w-5 h-5 rounded-full transition-all active:scale-90 active:translate-y-[2px] shrink-0 ${strokeColor === c.value ? 'scale-110 ring-2 ring-white ring-offset-1 shadow-lg' : 'opacity-40 hover:opacity-75'}`}
                            style={{ backgroundColor: c.value, borderBottom: `3px solid ${c.dark}` }} />
                    ))}
                </div>
                {/* 굵기 - 원형 도트 버튼 */}
                <div className="flex items-center gap-1.5">
                    {STROKE_WIDTHS.map(w => (
                        <button key={w.value} onClick={() => handleWidthChange(w.value)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 active:translate-y-[2px] shrink-0 ${strokeWidth === w.value ? 'bg-[#7C83FF] shadow-md' : 'bg-white'}`}
                            style={{ borderBottom: strokeWidth === w.value ? '3px solid #5A61D4' : '3px solid #D0D5E0' }}>
                            <div className="rounded-full" style={{
                                width: w.value === 12 ? '4px' : w.value === 22 ? '8px' : '12px',
                                height: w.value === 12 ? '4px' : w.value === 22 ? '8px' : '12px',
                                backgroundColor: strokeWidth === w.value ? 'white' : '#AEB7C5',
                            }} />
                        </button>
                    ))}
                </div>
                {/* 획순 - 아이콘+텍스트 토글 버튼 */}
                <button onClick={handleToggleNumbers}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full font-bold text-xs transition-all active:scale-95 active:translate-y-[1px] shrink-0 ${showStrokeNumbers ? 'bg-[#7C83FF] text-white shadow-md' : 'bg-white text-[#AEB7C5]'}`}
                    style={{ borderBottom: showStrokeNumbers ? '3px solid #5A61D4' : '3px solid #D0D5E0' }}>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0 ${showStrokeNumbers ? 'bg-white/30 text-white' : 'bg-[#E9EDF2] text-[#AEB7C5]'}`}>①</span>
                    획순
                </button>
            </div>

            {/* 캔버스 */}
            <div className={`relative w-full aspect-square max-w-[380px] rounded-[4rem] overflow-hidden transition-all duration-500 shadow-2xl mt-2 ${
                isComplete ? 'border-[8px] border-[#F5A58A] scale-[1.02]' :
                mistakeOnStroke ? 'bg-rose-50 border-[8px] border-rose-100' : 'bg-white border-[8px] border-[#E9EDF2]'
            }`}>
                <div ref={quizContainerRef} className="w-full h-full flex items-center justify-center" />
                <canvas ref={strokeNumberCanvasRef} className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }} />
                {!isReady && <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-md"><div className="w-10 h-10 border-4 border-[#7C83FF] border-t-transparent rounded-full animate-spin" /></div>}
                {isComplete && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg animate-in zoom-in duration-300" style={{ backgroundColor: '#F5A58A' }}>
                        <span className="text-white text-xs font-black">✓ 완성!</span>
                    </div>
                )}
            </div>

            {/* 네비게이션 */}
            {!isComplete ? (
                <button onClick={handleHint} disabled={isAnimating}
                    className="w-full py-5 rounded-[2rem] bg-white font-black text-xl text-[#AEB7C5] border-b-4 border-[#E9EDF2] shadow-lg active:translate-y-1 active:border-b-0 transition-all disabled:opacity-50">
                    {isAnimating ? '획순 재생 중...' : 'HINT'}
                </button>
            ) : (
                <div className="w-full flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-500">
                    <button onClick={onNextHanja}
                        className="w-full py-5 rounded-[2rem] bg-[#7278F2] font-bold text-h3-res text-white shadow-2xl shadow-[rgba(124,131,255,0.18)] active:scale-95 transition-all flex items-center justify-center gap-2">
                        다음 ›
                    </button>
                    <button onClick={handleRetry}
                        className="w-full py-4 text-[#8C97A8] font-bold text-h3-res">
                        다시 쓰기
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── 메인 WritingScreen ───────────────────────────────────────────────────
const WritingScreen = ({ onBack, onWritingComplete, onStageClear, initialHanja, unlockedHanjaIds, userXp, selectedCharacter, hanjaFilter }) => {
    const [viewMode, setViewMode] = useState('grade');
    const [gradeFilter, setGradeFilter] = useState('8급');
    const [categoryFilter, setCategoryFilter] = useState(CATEGORIES[0] || '');
    const [phase, setPhase] = useState(initialHanja || hanjaFilter ? 'quiz' : 'select');
    const [showExitModal, setShowExitModal] = useState(false);
    const handleExitConfirm = () => {
        setShowExitModal(false);
        if (initialHanja || (hanjaFilter && hanjaFilter.length > 0)) {
            onBack();
        } else {
            setPhase('select');
        }
    };
    const [selectedHanja, setSelectedHanja] = useState(initialHanja || null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const characterAvatar = useMemo(() => getRankDetails(userXp || 0, selectedCharacter).avatar, [userXp, selectedCharacter]);

    const { unlockedIds, unlockedGrades } = useUnlockedHanja(unlockedHanjaIds);

    const hanjaList = useMemo(() => {
        if (initialHanja) return [initialHanja];
        if (hanjaFilter && hanjaFilter.length > 0) {
            return HANJA_DATA.filter(h => hanjaFilter.includes(h.id));
        }
        const base = viewMode === 'grade'
            ? (gradeFilter === '전체' ? HANJA_DATA : HANJA_DATA.filter(h => h.grade === gradeFilter))
            : HANJA_DATA.filter(h => h.category === categoryFilter);
        return base.filter(h => unlockedIds.has(h.id));
    }, [viewMode, gradeFilter, categoryFilter, initialHanja, hanjaFilter, unlockedIds]);

    useEffect(() => {
        if ((initialHanja || hanjaFilter) && hanjaList.length > 0) {
            setSelectedHanja(hanjaList[0]);
            setCurrentIndex(0);
            setPhase('quiz');
        }
    }, [initialHanja, hanjaFilter, hanjaList]);

    const startQuiz = useCallback(() => {
        if (hanjaList.length === 0) return;
        setCurrentIndex(0);
        setSelectedHanja(hanjaList[0]);
        setPhase('quiz');
    }, [hanjaList]);

    const handleNextHanja = useCallback(() => {
        const next = currentIndex + 1;
        if (next < hanjaList.length) {
            setCurrentIndex(next);
            setSelectedHanja(hanjaList[next]);
        } else {
            setPhase('result');
            if (onStageClear) onStageClear();
        }
    }, [currentIndex, hanjaList, onStageClear]);

    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden" style={{ backgroundColor: phase === 'select' ? '#F7FAF9' : '#F8FAFC' }}>
            {/* 헤더 */}
            <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                    <button onClick={(phase === 'quiz') ? () => setShowExitModal(true) : onBack}
                        className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all w-11 h-11 font-black text-[#5B677A]">
                        <span>{(phase === 'quiz') ? '✕' : '←'}</span>
                    </button>
                    <div className="flex flex-col items-center min-w-0 flex-1 px-2">
                        <h2 className="text-h3 font-bold text-[#5B677A] m-0 break-keep">한자 쓰기</h2>
                        <p className="text-xs font-bold mt-0.5 text-center leading-tight break-keep" style={{ color: '#969CEB' }}>획순에 맞게 쓰고, 모를 땐 힌트를 참조하세요</p>
                    </div>
                    <div className="flex items-center justify-end w-11">
                        {phase === 'quiz' && (
                            <span className="text-[#AEB7C5] text-sm font-bold whitespace-nowrap">{currentIndex + 1}/{hanjaList.length}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto pb-6">
                <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-6 pt-5">
                    {phase === 'select' && (
                        <div className="flex flex-col items-center w-full animate-in fade-in duration-500">
                            {/* 탭 */}
                            <div className="flex bg-[#F4F7F8]/40 p-1.5 rounded-full border border-[#E9EDF2] w-full mb-4 shadow-inner">
                                <button onClick={() => setViewMode('grade')}
                                    className={`flex-1 px-8 py-3 rounded-full font-bold text-h3 transition-all ${viewMode === 'grade' ? 'bg-white shadow-md text-[#5B677A]' : 'text-[#AEB7C5]'}`}>
                                    급수별
                                </button>
                                <button onClick={() => setViewMode('topic')}
                                    className={`flex-1 px-8 py-3 rounded-full font-bold text-h3 transition-all ${viewMode === 'topic' ? 'bg-white shadow-md text-[#5B677A]' : 'text-[#AEB7C5]'}`}>
                                    주제별
                                </button>
                            </div>

                            {/* 컨텐츠 */}
                            {viewMode === 'grade' ? (
                                <GradeGrid selected={gradeFilter} onSelect={setGradeFilter} lockedGrades={GRADES.filter(g => g !== '전체' && !unlockedGrades.has(g))} />
                            ) : (
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    {CATEGORIES.map(cat => (
                                        <TopicCard key={cat} name={cat} imgSrc={CATEGORY_IMAGES[cat] ? `/assets/images/hanja_all/${CATEGORY_IMAGES[cat]}` : null}
                                            count={`${HANJA_DATA.filter(h => h.category === cat).length}개`} isSelected={categoryFilter === cat} onClick={() => setCategoryFilter(cat)}
                                            locked={!HANJA_DATA.some(h => h.category === cat && unlockedIds.has(h.id))} />
                                    ))}
                                </div>
                            )}

                            {/* 캐릭터 */}
                            <div className="flex flex-col items-center mt-4 mb-5 relative">
                                <div className="absolute top-4 left-[60%] z-20">
                                    <div className="px-5 py-2 rounded-2xl shadow-xl border border-white relative bg-white/90 backdrop-blur-md">
                                        <span className="text-body font-bold text-[#5B677A] whitespace-nowrap break-keep">준비됐어!</span>
                                        <div className="absolute -bottom-1.5 left-3 w-4 h-4 rotate-45 bg-white border-r border-b border-white" />
                                    </div>
                                </div>
                                <div className="relative z-10 w-36 h-36 flex items-center justify-center mt-10">
                                    <img src={characterAvatar} className="w-full h-full object-contain drop-shadow-2xl" alt="avatar" />
                                </div>
                                <div className="w-40 h-4 bg-slate-400/20 blur-lg rounded-[100%] scale-x-125 -mt-6" />
                            </div>

                            {/* 시작 버튼 */}
                            <div className="w-full max-w-sm px-4 pb-4 -mt-2.5">
                                <button onClick={startQuiz}
                                    className="w-full py-5 rounded-[2rem] font-bold text-h3 text-white transition-all active:scale-95 shadow-xl shadow-[#FF9B73]/20/50 flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none"
                                    style={{ backgroundColor: '#FF9B73', borderBottom: '6px solid #E0735A' }}>
                                    <span>공부 시작!</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {phase === 'quiz' && selectedHanja && (
                        <QuizCard key={selectedHanja.id} hanja={selectedHanja} hanjaList={hanjaList} currentIndex={currentIndex}
                            onWritingComplete={onWritingComplete} onNextHanja={handleNextHanja} onBack={() => setPhase('select')} />
                    )}

                    {phase === 'result' && (
                        <ResultScreen correct={hanjaList.length} total={hanjaList.length} onRetry={startQuiz} onBack={() => setPhase('select')} selectedCharacter={selectedCharacter} />
                    )}
                </div>
            </div>
            {showExitModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300" style={{ background: 'rgba(120, 130, 160, 0.22)' }}>
                    <div className="w-full max-w-sm flex flex-col items-center bg-white shadow-2xl rounded-[40px] p-8 relative overflow-hidden animate-in zoom-in-95 duration-200">
                        <img
                            src={getCharacterImage(selectedCharacter, 'keep_going')}
                            alt="exit confirm"
                            className="w-[120px] h-[120px] object-contain mb-4"
                            style={{ filter: 'drop-shadow(0 8px 16px rgba(120,130,160,0.16))' }}
                        />
                        <div className="text-center flex flex-col gap-2 mb-6">
                            <h2 className="text-h3-res font-black text-slate-700 tracking-tight leading-snug">
                                정말 쓰기를 중단할까요? 🥺
                            </h2>
                            <p className="text-xs-res font-bold leading-relaxed break-keep mt-1" style={{ color: '#A5AFBF', lineHeight: '1.4' }}>
                                지금 나가면 작성 중인 한자 쓰기의 연습 기록이 저장되지 않아요. 계속 끝까지 써볼까요?
                            </p>
                        </div>
                        <div className="w-full flex flex-col gap-3">
                            <button
                                onClick={() => setShowExitModal(false)}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg retry-quiz-button"
                            >
                                계속 쓰기 연습
                            </button>
                            <button
                                onClick={handleExitConfirm}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg active:scale-95 transition-all shadow-sm back-quiz-button"
                            >
                                그만하고 나가기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WritingScreen;
