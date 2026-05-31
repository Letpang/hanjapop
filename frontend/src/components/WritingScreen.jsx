import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { usePremium } from '../hooks/usePremium.js';
import GradeGrid, { TopicCard } from './GradeGrid.jsx';
import { getRankDetails, getCharacterImage } from '../utils/rankUtils.js';
import { GRADES, CATEGORY_IMAGES } from '../constants/hanjaConstants.js';
import { useUnlockedHanja } from '../hooks/useUnlockedHanja.js';
import RewardBreakdown from './common/RewardBreakdown.jsx';
import CtaButton from './common/CtaButton.jsx';

// ─── 상수 ─────────────────────────────────────────────────────────────────
const HINT_PENALTY = 10;     // 힌트 1회 = -10점
const WRONG_PENALTY = 5;     // 획 틀릴 때마다 -5점
const MAX_SCORE = 100;
const WRITING_XP_PER_CHAR = 10;


// HanziWriter CDN에 없는 한국식 이형자 → 표준 중국자 매핑
// (화면 표시는 원래 글자 유지, HanziWriter 필기 데이터만 표준자 사용)
const WRITER_CHAR_MAP = {
    '敎': '教',  // 가르칠 교 U+654E → U+6559
    '畵': '畫',  // 그림 화   U+7575 → U+756B
};

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

// ─── 한자 카드 (쓰기 목록용) ────────────────────────────────────────────────
const WritingHanjaCard = ({ item, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="group relative w-full flex flex-col items-center justify-center pt-4 pb-4 px-3 bg-white border border-[#E9EDF2] rounded-[2rem] hover:border-[#7C83FF] hover:shadow-xl active:scale-95 transition-all duration-300 min-h-[160px] shadow-md overflow-hidden"
        >
            <div
                className="leading-none drop-shadow-sm text-[#3C3C3C] flex items-center justify-center mb-2"
                style={{ fontSize: 'clamp(3.5rem, 12vw, 5.5rem)', fontFamily: "'Nanum Myeongjo', serif" }}
            >
                {item.hanja}
            </div>
            <div className="w-full pt-1 flex items-center justify-center">
                <div className="text-center text-[#5B677A] text-h3-res tracking-tight leading-snug break-keep">
                    <span className="font-bold">{item.meaning}</span>
                    <span className="font-bold text-[#7C83FF] ml-1.5">{item.sound}</span>
                </div>
            </div>
        </button>
    );
};

// ─── Result Screen ──────────────────────────────────────────────────────────
const WRITING_CLEAR_XP = 30;

const ResultScreen = ({ correct, total, onRetry, onBack, selectedCharacter, getRewardPreview, missionXp = 0 }) => {
    const pct = Math.round((correct / total) * 100);
    const isClear = pct >= 70;
    const writingXp = total * WRITING_XP_PER_CHAR;
    const clearXp = isClear ? WRITING_CLEAR_XP : 0;

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
                    <RewardBreakdown
                        reward={getRewardPreview?.(writingXp + clearXp)}
                        correctXp={writingXp}
                        clearXp={clearXp}
                        correctLabel="쓰기"
                        detailText={`${total}글자 x ${WRITING_XP_PER_CHAR}XP${clearXp > 0 ? ` + 완료 ${clearXp}XP` : ''}`}
                        missionXp={missionXp}
                    />
                    <div className="w-full flex flex-col gap-3 relative z-10">
                        <CtaButton theme="indigo" onClick={onRetry}>
                            <span className="font-black text-white text-[1.5rem] drop-shadow-md">다시 하기</span>
                        </CtaButton>
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
const QuizCard = ({ hanja, hanjaList, currentIndex, onWritingComplete, onNextHanja, onBack, nextLabel = '다음 ›' }) => {
    const quizContainerRef = useRef(null);
    const strokeNumberCanvasRef = useRef(null);
    const writerRef = useRef(null);
    const [score, setScore] = useState(MAX_SCORE);
    const [isComplete, setIsComplete] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [mistakeOnStroke, setMistakeOnStroke] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [charData, setCharData] = useState(null);
    const [activeStrokeIndex, setActiveStrokeIndex] = useState(0);
    const completionReportedRef = useRef(false);
    const charDataRef = useRef(null);
    const activeStrokeIndexRef = useRef(0);

    const scoreRef = useRef(MAX_SCORE);
    useEffect(() => {
        scoreRef.current = score;
    }, [score]);

    const [strokeColor, setStrokeColor] = useState('#34383F');
    const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1].value);
    const strokeStyleRef = useRef({ color: strokeColor, width: strokeWidth });
    useEffect(() => {
        strokeStyleRef.current = { color: strokeColor, width: strokeWidth };
    }, [strokeColor, strokeWidth]);

    const markComplete = useCallback(() => {
        if (completionReportedRef.current) return;
        completionReportedRef.current = true;
        setIsComplete(true);
        if (onWritingComplete && hanja.id) onWritingComplete(hanja.id, scoreRef.current);
    }, [hanja.id, onWritingComplete]);

    const checkStrokeCompletion = useCallback((nextStrokeIndex) => {
        const strokeCount = charDataRef.current?.medians?.length || 0;
        if (strokeCount > 0 && nextStrokeIndex >= strokeCount) markComplete();
    }, [markComplete]);

    const createWriter = useCallback((color, width, showNumbers = true) => {
        if (!quizContainerRef.current || !window.HanziWriter) return null;
        quizContainerRef.current.innerHTML = '';
        const containerSize = quizContainerRef.current.offsetWidth;
        const writerChar = WRITER_CHAR_MAP[hanja.hanja] || hanja.hanja;

        return window.HanziWriter.create(quizContainerRef.current, writerChar, {
            width: containerSize,
            height: containerSize,
            padding: containerSize * 0.08,
            showOutline: showNumbers,
            strokeColor: color,
            outlineColor: 'rgba(0,0,0,0.1)',
            drawingColor: color,
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
        setActiveStrokeIndex(0);
        writer.quiz({
            onMistake: () => {
                setScore(s => Math.max(0, s - WRONG_PENALTY));
                setMistakeOnStroke(true);
                setTimeout(() => setMistakeOnStroke(false), 600);
            },
            onCorrectStroke: (strokeData) => {
                setMistakeOnStroke(false);
                if (strokeData && typeof strokeData.strokeNum === 'number') {
                    const nextStrokeIndex = strokeData.strokeNum + 1;
                    activeStrokeIndexRef.current = nextStrokeIndex;
                    setActiveStrokeIndex(nextStrokeIndex);
                    checkStrokeCompletion(nextStrokeIndex);
                } else {
                    setActiveStrokeIndex(prev => {
                        const nextStrokeIndex = prev + 1;
                        activeStrokeIndexRef.current = nextStrokeIndex;
                        checkStrokeCompletion(nextStrokeIndex);
                        return nextStrokeIndex;
                    });
                }
            },
            onComplete: () => {
                markComplete();
            }
        });
    }, [checkStrokeCompletion, markComplete]);

    useEffect(() => {
        const container = quizContainerRef.current;
        if (!container || !window.HanziWriter) return undefined;
        const { color, width } = strokeStyleRef.current;
        const writer = createWriter(color, width);
        if (!writer) return undefined;
        writerRef.current = writer;

        const resetTimer = setTimeout(() => {
            setScore(MAX_SCORE);
            setIsComplete(false);
            completionReportedRef.current = false;
            setMistakeOnStroke(false);
            setIsAnimating(false);
            setActiveStrokeIndex(0);
            activeStrokeIndexRef.current = 0;
            startQuiz(writer);
        }, 0);

        // HanziWriter Medians 데이터 로드 (이형자는 표준자로 대체)
        const fetchChar = WRITER_CHAR_MAP[hanja.hanja] || hanja.hanja;
        charDataRef.current = null;
        fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${fetchChar}.json`)
            .then(r => r.json())
            .then(data => {
                charDataRef.current = data;
                setCharData(data);
                setIsReady(true);
                const strokeCount = data?.medians?.length || 0;
                if (strokeCount > 0 && activeStrokeIndexRef.current >= strokeCount) markComplete();
            })
            .catch(() => setIsReady(true));

        return () => {
            clearTimeout(resetTimer);
            container.innerHTML = '';
        };
    }, [hanja, createWriter, markComplete, startQuiz]);

    const handleColorChange = (color) => {
        if (isComplete || isAnimating) return;
        setStrokeColor(color);
        const writer = createWriter(color, strokeWidth);
        writerRef.current = writer;
        startQuiz(writer);
    };

    const handleWidthChange = (width) => {
        if (isComplete || isAnimating) return;
        setStrokeWidth(width);
        const writer = createWriter(strokeColor, width);
        writerRef.current = writer;
        startQuiz(writer);
    };

    useEffect(() => {
        const canvas = strokeNumberCanvasRef.current;
        if (!canvas || !charData || !charData.medians) return;

        const size = canvas.offsetWidth;
        if (size === 0) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, size, size);

        if (isComplete) return;

        const padding = size * 0.08;
        const r = size * 0.035;
        const strokeCount = charData.medians.length;

        for (let i = 0; i < strokeCount; i++) {
            const isActive = i === activeStrokeIndex;

            // 이미 완성한 획순 번호는 제거
            if (i < activeStrokeIndex) continue;

            const median = charData.medians[i];
            if (!median || median.length === 0) continue;
            const scale = (size - 2 * padding) / 1024;

            const [sx, sy] = median[0];
            let bx = padding + sx * scale;
            let by = padding + (1024 - sy) * scale;

            // 획이 그어지는 방향 벡터 계산
            const next = median[Math.min(1, median.length - 1)];
            const nex = padding + next[0] * scale;
            const ney = padding + (1024 - next[1]) * scale;

            const sdx = nex - bx;
            const sdy = ney - by;
            const len = Math.hypot(sdx, sdy) || 1;

            // 정규화된 획 진행 방향 벡터
            const ux = sdx / len;
            const uy = sdy / len;

            // 🌟 역방향 밀어내기 적용 (진행 방향의 180도 반대편으로 기하적 배치)
            const offsetDist = r * 1.45;
            let cx = bx - ux * offsetDist;
            let cy = by - uy * offsetDist;

            // 캔버스 영역 내부 클램프
            cx = Math.max(r, Math.min(size - r, cx));
            cy = Math.max(r, Math.min(size - r, cy));

            if (isActive) {
                // 🌟 현재 활성 획: 선명한 인디고 컬러 + 은은한 글로우 그림자
                ctx.save();
                ctx.shadowColor = 'rgba(124, 131, 255, 0.45)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 3;

                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(124, 131, 255, 0.95)';
                ctx.fill();

                ctx.lineWidth = 2.5;
                ctx.strokeStyle = '#FFFFFF';
                ctx.stroke();
                ctx.restore();

                ctx.font = `bold ${Math.round(r * 1.25)}px sans-serif`;
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(i + 1), cx, cy + 0.5);
            } else {
                // 💤 대기 획: 아주 연한 반투명 회색 (시각 노이즈 최소화)
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(174, 183, 197, 0.12)';
                ctx.fill();

                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(174, 183, 197, 0.35)';
                ctx.stroke();

                ctx.font = `bold ${Math.round(r * 1.05)}px sans-serif`;
                ctx.fillStyle = 'rgba(120, 130, 160, 0.5)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(i + 1), cx, cy + 0.5);
            }
        }
    }, [charData, isComplete, activeStrokeIndex]);

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
        completionReportedRef.current = false;
        setMistakeOnStroke(false);
        setIsAnimating(false);
        activeStrokeIndexRef.current = 0;
        const writer = createWriter(strokeColor, strokeWidth);
        writerRef.current = writer;
        startQuiz(writer);
    };

    const handleManualComplete = () => {
        markComplete();
        onNextHanja?.();
    };

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto gap-3 sm:gap-4 animate-in fade-in duration-500">
            {/* 한자 및 훈음 표시 */}
            <div className="flex flex-row items-center justify-center gap-3 w-full">
                <span className="text-[3.5rem] sm:text-[4rem] font-black text-[#34383F] leading-none drop-shadow-sm">
                    {hanja.hanja}
                </span>
                <span className="text-[1.1rem] sm:text-[1.25rem] font-extrabold text-[#7C83FF] tracking-wider bg-[#F2F3FF] px-5 py-1.5 rounded-full shadow-sm whitespace-nowrap">
                    {hanja.meaning} {hanja.sound}
                </span>
            </div>

            {/* 연필 설정 */}
            <div className="w-full rounded-[2rem] px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-center gap-4 sm:gap-6" style={{ backgroundColor: '#F0F2F5' }}>
                {/* 색상 */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {STROKE_COLORS.map(c => (
                        <button key={c.value} onClick={() => handleColorChange(c.value)}
                            aria-label={`${c.label} 색상`}
                            className={`w-[22px] h-[22px] sm:w-6 sm:h-6 rounded-full transition-all active:scale-90 active:translate-y-[2px] shrink-0 ${strokeColor === c.value ? 'scale-110 ring-[3px] ring-white ring-offset-1 shadow-lg opacity-100' : 'opacity-45 hover:opacity-75'}`}
                            style={{ backgroundColor: c.value, borderBottom: `3px solid ${c.dark}` }} />
                    ))}
                </div>
                <div className="w-px h-8 rounded-full" style={{ backgroundColor: '#D8DCE3' }} />
                {/* 굵기 */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {STROKE_WIDTHS.map(w => (
                        <button
                            key={w.value}
                            onClick={() => handleWidthChange(w.value)}
                            aria-label={`${w.label} 굵기`}
                            className={`w-9 h-8 sm:w-11 sm:h-9 rounded-full flex items-center justify-center transition-all active:scale-90 active:translate-y-[2px] shrink-0 ${
                                strokeWidth === w.value
                                    ? 'bg-[#7C83FF] shadow-lg ring-[3px] ring-white ring-offset-1'
                                    : 'bg-white opacity-75 hover:opacity-100 shadow-sm'
                            }`}
                            style={{ borderBottom: strokeWidth === w.value ? '4px solid #5A61D4' : '4px solid #D0D5E0' }}
                        >
                            <span
                                className="block w-[18px] sm:w-[22px] rounded-full"
                                style={{
                                    height: w.value === 12 ? '3px' : w.value === 22 ? '6px' : '9px',
                                    backgroundColor: strokeWidth === w.value ? 'white' : '#AEB7C5',
                                }}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* 캔버스 */}
            <div className={`relative w-full aspect-square max-w-[320px] sm:max-w-[380px] rounded-[3rem] sm:rounded-[4rem] overflow-hidden transition-all duration-500 shadow-2xl ${
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
                <div className="w-full flex flex-col gap-2 sm:gap-3">
                    <button onClick={handleManualComplete}
                        className="hp-cta-button hp-cta-button--indigo !py-3.5 sm:!py-4">
                        {nextLabel}
                    </button>
                    <button onClick={handleHint} disabled={isAnimating}
                        className="w-full back-quiz-button disabled:opacity-50 !py-2.5 sm:!py-3">
                        {isAnimating ? '획순 재생 중...' : '획순 동영상 보기'}
                    </button>
                </div>
            ) : (
                <div className="w-full flex flex-col gap-2 sm:gap-3 animate-in slide-in-from-bottom-4 duration-500">
                    <button onClick={onNextHanja}
                        className="hp-cta-button hp-cta-button--indigo !py-3.5 sm:!py-4">
                        {nextLabel}
                    </button>
                    <button onClick={handleRetry}
                        className="w-full py-3 text-[#8C97A8] font-bold text-h3-res">
                        다시 쓰기
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── 메인 WritingScreen ───────────────────────────────────────────────────
const WritingScreen = ({ onBack, onWritingComplete, onStageClear, initialHanja, unlockedHanjaIds, userXp, selectedCharacter, getRewardPreview, hanjaFilter, isPremium = false, contentPool = null }) => {
    const { showPremiumGate } = usePremium();
    const [viewMode, setViewMode] = useState('grade');
    const [gradeFilter, setGradeFilter] = useState('전체');
    const [categoryFilter, setCategoryFilter] = useState(CATEGORIES[0] || '');
    const [phase, setPhase] = useState(initialHanja || hanjaFilter || contentPool ? 'list' : 'select');
    const [showExitModal, setShowExitModal] = useState(false);
    const [selectedHanja, setSelectedHanja] = useState(initialHanja || null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeHanjaList, setActiveHanjaList] = useState(initialHanja ? [initialHanja] : []);
    const [completedCount, setCompletedCount] = useState(0);
    const clearCountRef = useRef(0);

    const handleExitConfirm = () => {
        setShowExitModal(false);
        if (initialHanja || (hanjaFilter && hanjaFilter.length > 0) || contentPool) {
            onBack();
        } else {
            setPhase('list');
        }
    };

    const characterAvatar = useMemo(() => getRankDetails(userXp || 0, selectedCharacter).avatar, [userXp, selectedCharacter]);

    const { unlockedIds, unlockedGrades } = useUnlockedHanja(unlockedHanjaIds);

    const contentPoolIds = useMemo(() => {
        if (!contentPool) return null;
        return new Set([...(contentPool.main?.hanjaIds || []), ...(contentPool.review?.hanjaIds || [])]);
    }, [contentPool]);

    // 무조건 이번 스테이지 한자(contentPoolIds)만 보여줍니다. (사전 모드 제거됨)
    const effectiveIds = useMemo(() => {
        if (contentPoolIds) return contentPoolIds;
        return unlockedIds;
    }, [contentPoolIds, unlockedIds]);

    const hanjaList = useMemo(() => {
        if (initialHanja) return [initialHanja];
        if (hanjaFilter && hanjaFilter.length > 0) {
            return HANJA_DATA.filter(h => hanjaFilter.includes(h.id));
        }
        const base = viewMode === 'grade'
            ? (gradeFilter === '전체' ? HANJA_DATA : HANJA_DATA.filter(h => h.grade === gradeFilter))
            : HANJA_DATA.filter(h => h.category === categoryFilter);
        return base.filter(h => effectiveIds.has(h.id));
    }, [viewMode, gradeFilter, categoryFilter, initialHanja, hanjaFilter, effectiveIds]);

    // 목록 화면에서 표시할 한자 (해제된 것만)
    const displayList = useMemo(() => {
        if (initialHanja) return [initialHanja];
        if (hanjaFilter && hanjaFilter.length > 0) return HANJA_DATA.filter(h => hanjaFilter.includes(h.id));
        const base = viewMode === 'grade'
            ? (gradeFilter === '전체' ? HANJA_DATA : HANJA_DATA.filter(h => h.grade === gradeFilter))
            : HANJA_DATA.filter(h => h.category === categoryFilter);
        return base.filter(h => effectiveIds.has(h.id));
    }, [viewMode, gradeFilter, categoryFilter, initialHanja, hanjaFilter, effectiveIds]);

    useEffect(() => {
        if (!(initialHanja || hanjaFilter) || hanjaList.length === 0) return undefined;

        const timer = setTimeout(() => {
            setSelectedHanja(hanjaList[0]);
            setActiveHanjaList(hanjaList);
            setCurrentIndex(0);
            setCompletedCount(0);
            setPhase('quiz');
        }, 0);

        return () => clearTimeout(timer);
    }, [initialHanja, hanjaFilter, hanjaList]);

    // 카드 클릭 시 해당 한자부터 이어서 쓰기 연습
    const handleCardClick = useCallback((item) => {
        const startIndex = displayList.findIndex(h => h.id === item.id);
        setSelectedHanja(item);
        setActiveHanjaList(displayList);
        setCurrentIndex(startIndex !== -1 ? startIndex : 0);
        setCompletedCount(0);
        setPhase('quiz');
    }, [displayList]);

    const startQuiz = useCallback(() => {
        if (activeHanjaList.length === 0) return;
        setCurrentIndex(0);
        setSelectedHanja(activeHanjaList[0]);
        setCompletedCount(0);
        setPhase('quiz');
    }, [activeHanjaList]);

    const handleNextHanja = useCallback(() => {
        const nextCount = completedCount + 1;
        if (nextCount < activeHanjaList.length) {
            const nextIndex = (currentIndex + 1) % activeHanjaList.length;
            setCompletedCount(nextCount);
            setCurrentIndex(nextIndex);
            setSelectedHanja(activeHanjaList[nextIndex]);
        } else {
            setCompletedCount(nextCount);
            clearCountRef.current += 1;
            setPhase('result');
            if (onStageClear) onStageClear();
        }
    }, [currentIndex, activeHanjaList, completedCount, onStageClear]);

    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden" style={{ backgroundColor: phase === 'select' ? '#F7FAF9' : '#F8FAFC' }}>
            {/* 헤더 */}
            <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                    <button onClick={
                        phase === 'quiz' ? () => setShowExitModal(true) :
                        phase === 'list' && !initialHanja && (!hanjaFilter || hanjaFilter.length === 0) && !contentPool ? () => setPhase('select') :
                        onBack
                    }
                        className="hp-nav-button">
                        <span>{phase === 'quiz' ? '✕' : '←'}</span>
                    </button>
                    <div className="flex flex-col items-center min-w-0 flex-1 px-2">
                        <h2 className="text-h3 font-bold text-[#5B677A] m-0 break-keep">한자 획순</h2>
                        <p className="text-xs font-bold mt-0.5 text-center leading-tight break-keep" style={{ color: '#969CEB' }}>획순에 맞게 써보세요</p>
                    </div>
                    <div className="flex items-center justify-end w-11">
                        {phase === 'quiz' && activeHanjaList.length > 0 && (
                            <span className="text-[#AEB7C5] text-sm font-bold whitespace-nowrap">{currentIndex + 1}/{activeHanjaList.length}</span>
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
                                <GradeGrid selected={gradeFilter} onSelect={isPremium ? setGradeFilter : () => showPremiumGate()} lockedGrades={GRADES.filter(g => g !== '전체' && !unlockedGrades.has(g))} />
                            ) : (
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    {CATEGORIES.map(cat => (
                                        <TopicCard key={cat} name={cat} imgSrc={CATEGORY_IMAGES[cat] ? `/assets/images/hanja_all/${CATEGORY_IMAGES[cat]}` : null}
                                            count={`${HANJA_DATA.filter(h => h.category === cat).length}개`} isSelected={categoryFilter === cat} onClick={isPremium ? () => setCategoryFilter(cat) : showPremiumGate}
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
                                <button onClick={() => setPhase('list')}
                                    className="w-full py-5 rounded-[2rem] font-bold text-h3 text-white transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none"
                                    style={{ backgroundColor: '#FF9B73', borderBottom: '6px solid #E0735A' }}>
                                    <span>한자 선택하기 →</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {phase === 'list' && (
                        <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                            {displayList.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                                    {displayList.map(item => (
                                        <WritingHanjaCard
                                            key={item.id}
                                            item={item}
                                            onClick={() => handleCardClick(item)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <span className="text-4xl">📚</span>
                                    <p className="text-[#AEB7C5] font-bold text-center break-keep">이 급수의 한자를 먼저 학습해주세요!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {phase === 'quiz' && selectedHanja && (
                        <QuizCard key={selectedHanja.id} hanja={selectedHanja} hanjaList={activeHanjaList} currentIndex={currentIndex}
                            onWritingComplete={onWritingComplete} onNextHanja={handleNextHanja} onBack={() => setPhase('list')} />
                    )}

                    {phase === 'result' && (
                        <ResultScreen
                            correct={activeHanjaList.length}
                            total={activeHanjaList.length}
                            onRetry={startQuiz}
                            onBack={() => (initialHanja || hanjaFilter || contentPool) ? onBack() : setPhase('list')}
                            selectedCharacter={selectedCharacter}
                            getRewardPreview={getRewardPreview}
                            missionXp={(clearCountRef.current === 1) ? 30 : 0}
                        />
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
                            <CtaButton theme="indigo" onClick={() => setShowExitModal(false)}>
                                <span className="font-black text-white text-[1.35rem] drop-shadow-md">계속 쓰기 연습</span>
                            </CtaButton>
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

export { QuizCard };
export default WritingScreen;
