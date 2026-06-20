import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { pickClearMessage } from '../constants/messages.js';
import QuizProgressBar from './QuizProgressBar.jsx';
import HANJA_DATA from '../hanja_unified.json';
import { usePremium } from '../hooks/usePremium.js';
import GradeGrid, { TopicCard } from './GradeGrid.jsx';
import { getRankDetails, getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../utils/rankUtils.js';
import { GRADES, CATEGORY_IMAGES } from '../constants/hanjaConstants.js';
import { useUnlockedHanja } from '../hooks/useUnlockedHanja.js';
import RewardBreakdown from './common/RewardBreakdown.jsx';
import CtaButton from './common/CtaButton.jsx';

// ─── 상수 ─────────────────────────────────────────────────────────────────
const HINT_PENALTY = 10;     // 힌트 1회 = -10점
const WRONG_PENALTY = 5;     // 획 틀릴 때마다 -5점
const MAX_SCORE = 100;
const WRITING_XP_PER_CHAR = 10;


// animCJK 한국 한자 SVG가 있는 글자 — 획순 동영상을 정확한 글자로 보여줌
const ANIMCJK_CHARS = new Set(['窓', '飮', '淸']);

// HanziWriter CDN에 없는 한국식 이형자 → 표준 중국자 매핑
// (화면 표시는 원래 글자 유지, HanziWriter 필기 데이터만 표준자 사용)
const WRITER_CHAR_MAP = {
    '敎': '教',  // 가르칠 교 U+654E → U+6559
    '畵': '畫',  // 그림 화   U+7575 → U+756B
    '窓': '窗',  // 창 창     U+7A93 → U+7A97
    '飮': '飲',  // 마실 음   U+98EE → U+98F2
    '淸': '清',  // 맑을 청   U+6DF8 → U+6E05
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
const WritingHanjaCard = ({ item, isCompleted, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`hanja-grid-card ${isCompleted ? 'hanja-grid-card--completed' : ''}`}
        >
            {isCompleted && <div className="hanja-grid-card__check">✓</div>}
            <div
                className="leading-none text-[#2C2C3A] dark:text-slate-100 flex items-center justify-center mb-2"
                style={{ fontSize: 'clamp(3.2rem, 11vw, 5rem)', fontFamily: 'var(--font-hanja)' }}
            >
                {item.hanja}
            </div>
            <div className="w-full pt-1 flex items-center justify-center">
                <p className="text-center text-[#5B677A] dark:text-slate-300 text-[1.7rem] tracking-tight leading-snug break-keep">
                    <span className="font-normal">{item.meaning}</span>
                    <span className={`font-medium ml-1.5 ${isCompleted ? 'text-[#2ED6C5]' : 'text-[#7C83FF]'}`}>{item.sound}</span>
                </p>
            </div>
        </button>
    );
};

// ─── Result Screen ──────────────────────────────────────────────────────────
const WRITING_CLEAR_XP = 30;

const ResultScreen = ({ correct, total, onRetry, onBack, selectedCharacter, getRewardPreview, missionXp = 0 }) => {
    const pct = Math.round((correct / total) * 100);
    const isClear = pct >= 70;
    const [clearMsg] = useState(() => pickClearMessage());
    const writingXp = correct * WRITING_XP_PER_CHAR;
    const clearXp = isClear ? WRITING_CLEAR_XP : 0;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center p-6 overflow-y-auto backdrop-blur-lg animate-in fade-in duration-300"
            style={{ background: isClear ? 'linear-gradient(180deg, #DDF1EA 0%, #EAF6F2 100%)' : 'rgba(255,107,107,0.18)' }}
        >
            <div className="activity-result-card">
                <div className="pt-5 pb-6 px-6 flex flex-col items-center gap-4 w-full relative">
                    {/* 캐릭터 아래 백그라운드 글로우 추가 */}
                    <div className="activity-result-glow" />

                    <img
                        src={isClear ? getCharacterImage(selectedCharacter, 'success') : getCharacterImage(selectedCharacter, 'failure')}
                        alt={isClear ? "clear" : "fail"}
                        className="activity-result-char img-shadow-lg"
                        style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, isClear ? 'success' : 'failure')})` }}
                    />
                    <div className="result-text-area -mt-5">
                        <span className="result-subtitle">
                            {isClear ? '완벽하게 써냈어요!' : '조금 더 연습해볼까요?'}
                        </span>
                        <h1 className={`text-h2-res leading-snug result-title ${isClear ? 'result-title--clear' : 'result-title--fail'}`}>
                            {isClear ? clearMsg : <>괜찮아요,<br/>다시 도전해봐요!</>}
                        </h1>
                    </div>
                    <RewardBreakdown
                        reward={getRewardPreview?.(writingXp + clearXp)}
                        correctXp={writingXp}
                        clearXp={clearXp}
                        correctLabel="쓰기"
                        detailText={`${correct}글자 x ${WRITING_XP_PER_CHAR}XP${clearXp > 0 ? ` + 완료 ${clearXp}XP` : ''}`}
                        missionXp={missionXp}
                    />
                    <div className="result-btn-area">
                        <CtaButton theme="indigo" onClick={onRetry}>
                            <span className="quiz-cta-text">다시 하기</span>
                        </CtaButton>
                        <button
                            onClick={onBack}
                            className="back-quiz-button"
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
    const drawingCanvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const writerRef = useRef(null);
    const [score, setScore] = useState(MAX_SCORE);
    const [isComplete, setIsComplete] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [noData, setNoData] = useState(false);
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

    const [strokeOrderSvg, setStrokeOrderSvg] = useState(null);
    const [strokeOrderKey, setStrokeOrderKey] = useState(0);
    const [showStrokeModal, setShowStrokeModal] = useState(false);

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
        if (!container) return undefined;

        // animCJK 전용 글자: SVG를 옅은 배경으로, 위에 자유 드로잉 캔버스
        if (ANIMCJK_CHARS.has(hanja.hanja)) {
            const abortCtrl = new AbortController();
            fetch(`/assets/stroke-order/${hanja.hanja}.svg`, { signal: abortCtrl.signal })
                .then(r => r.text())
                .then(svg => {
                    container.innerHTML = svg;
                    const svgEl = container.querySelector('svg');
                    if (svgEl) {
                        svgEl.style.width = '100%';
                        svgEl.style.height = '100%';
                        svgEl.style.opacity = '0.12';
                        svgEl.style.pointerEvents = 'none';
                    }
                    setIsReady(true);
                })
                .catch(() => { setIsReady(true); });
            return () => { abortCtrl.abort(); container.innerHTML = ''; };
        }

        if (!window.HanziWriter) return undefined;
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
        setNoData(false);
        const abortCtrl = new AbortController();
        fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${fetchChar}.json`, { signal: abortCtrl.signal })
            .then(r => {
                if (!r.ok) throw new Error('not_found');
                return r.json();
            })
            .then(data => {
                charDataRef.current = data;
                setCharData(data);
                setIsReady(true);
                const strokeCount = data?.medians?.length || 0;
                if (strokeCount > 0 && activeStrokeIndexRef.current >= strokeCount) markComplete();
            })
            .catch((err) => {
                if (err?.name === 'AbortError') return;
                setIsReady(true);
                setNoData(true);
            });

        return () => {
            clearTimeout(resetTimer);
            abortCtrl.abort();
            container.innerHTML = '';
        };
    }, [hanja, createWriter, markComplete, startQuiz]);

    // animCJK 드로잉 캔버스
    useEffect(() => {
        if (!ANIMCJK_CHARS.has(hanja.hanja)) return;
        const canvas = drawingCanvasRef.current;
        if (!canvas) return;
        isDrawingRef.current = false;

        const initCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const size = canvas.offsetWidth;
            if (size === 0) return false;
            if (canvas.width !== size * dpr) {
                canvas.width = size * dpr;
                canvas.height = size * dpr;
                const ctx = canvas.getContext('2d');
                ctx.scale(dpr, dpr);
            }
            return true;
        };

        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const src = e.touches ? e.touches[0] : e;
            return { x: src.clientX - rect.left, y: src.clientY - rect.top };
        };
        const onStart = (e) => {
            e.preventDefault();
            if (!initCanvas()) return;
            isDrawingRef.current = true;
            const ctx = canvas.getContext('2d');
            const { x, y } = getPos(e);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.strokeStyle = strokeStyleRef.current.color;
            ctx.lineWidth = strokeStyleRef.current.width * 0.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        };
        const onMove = (e) => {
            if (!isDrawingRef.current) return;
            e.preventDefault();
            const ctx = canvas.getContext('2d');
            const { x, y } = getPos(e);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
        };
        const onEnd = () => { isDrawingRef.current = false; };

        canvas.addEventListener('mousedown', onStart);
        canvas.addEventListener('mousemove', onMove);
        canvas.addEventListener('mouseup', onEnd);
        canvas.addEventListener('mouseleave', onEnd);
        canvas.addEventListener('touchstart', onStart, { passive: false });
        canvas.addEventListener('touchmove', onMove, { passive: false });
        canvas.addEventListener('touchend', onEnd);
        return () => {
            canvas.removeEventListener('mousedown', onStart);
            canvas.removeEventListener('mousemove', onMove);
            canvas.removeEventListener('mouseup', onEnd);
            canvas.removeEventListener('mouseleave', onEnd);
            canvas.removeEventListener('touchstart', onStart);
            canvas.removeEventListener('touchmove', onMove);
            canvas.removeEventListener('touchend', onEnd);
        };
    }, [hanja]);

    const handleColorChange = (color) => {
        if (!ANIMCJK_CHARS.has(hanja.hanja)) {
            if (isComplete || isAnimating) return;
            const writer = createWriter(color, strokeWidth);
            writerRef.current = writer;
            startQuiz(writer);
        }
        setStrokeColor(color);
    };

    const handleWidthChange = (width) => {
        if (!ANIMCJK_CHARS.has(hanja.hanja)) {
            if (isComplete || isAnimating) return;
            const writer = createWriter(strokeColor, width);
            writerRef.current = writer;
            startQuiz(writer);
        }
        setStrokeWidth(width);
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
        if (isComplete || isAnimating) return;

        // animCJK SVG가 있는 글자는 모달로 정확한 획순 표시
        if (ANIMCJK_CHARS.has(hanja.hanja)) {
            const url = `/assets/stroke-order/${hanja.hanja}.svg`;
            fetch(url)
                .then(r => r.text())
                .then(svg => {
                    setStrokeOrderSvg(svg);
                    setShowStrokeModal(true);
                });
            return;
        }

        if (!writerRef.current) return;
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
        onNextHanja?.();
    };

    const isAnimCJK = ANIMCJK_CHARS.has(hanja.hanja);

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto gap-3 sm:gap-4 animate-in fade-in duration-500">
            {/* 한자 및 훈음 표시 */}
            <div className="flex flex-row items-center justify-center gap-3 w-full">
                <span className="text-[3.5rem] sm:text-[4rem] font-normal text-[#34383F] dark:text-slate-100 leading-none drop-shadow-sm">
                    {hanja.hanja}
                </span>
                <span className="text-[1.1rem] sm:text-[1.25rem] font-normal text-[#7C83FF] tracking-wider bg-[#F2F3FF] px-5 py-1.5 rounded-full shadow-sm whitespace-nowrap">
                    {hanja.meaning} {hanja.sound}
                </span>
            </div>

            {/* 연필 설정 */}
            <div className="writing-toolbar w-full rounded-[2rem] px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-center gap-4 sm:gap-6" style={{ backgroundColor: '#F0F2F5' }}>
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
                                    : 'bg-white dark:bg-slate-800 opacity-75 hover:opacity-100 shadow-sm'
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
            <div className={`writing-canvas relative w-full aspect-square max-w-[320px] sm:max-w-[380px] rounded-[3rem] sm:rounded-[4rem] overflow-hidden transition-all duration-500 shadow-2xl ${
                isComplete ? 'border-[8px] border-[#F5A58A] scale-[1.02]' :
                mistakeOnStroke ? 'bg-rose-50 border-[8px] border-rose-100' : 'bg-white dark:bg-slate-800 border-[8px] border-[#E9EDF2]'
            }`}>
                <div ref={quizContainerRef} className="w-full h-full flex items-center justify-center" />
                {isAnimCJK && <canvas ref={drawingCanvasRef} className="absolute inset-0" style={{ width: '100%', height: '100%', touchAction: 'none' }} />}
                {!isAnimCJK && <canvas ref={strokeNumberCanvasRef} className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }} />}
                {!isReady && !noData && <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-800/60 backdrop-blur-md"><div className="w-10 h-10 border-4 border-[#7C83FF] border-t-transparent rounded-full animate-spin" /></div>}
                {noData && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-800/95"><span className="text-5xl">{hanja.hanja}</span><p className="text-sm text-[#AEB7C5] text-center px-4">이 한자는 획순 데이터가<br/>준비되지 않았어요</p></div>}
                {isComplete && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg animate-in zoom-in duration-300" style={{ backgroundColor: '#F5A58A' }}>
                        <span className="text-white text-xs font-normal">✓ 완성!</span>
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
                    <button
                        onClick={isAnimCJK ? () => {
                            const container = quizContainerRef.current;
                            if (!container) return;
                            // 드로잉 캔버스 초기화
                            const dc = drawingCanvasRef.current;
                            if (dc) { const ctx = dc.getContext('2d'); ctx.clearRect(0, 0, dc.width / (window.devicePixelRatio || 1), dc.height / (window.devicePixelRatio || 1)); }
                            // SVG 재주입으로 애니메이션 재시작
                            fetch(`/assets/stroke-order/${hanja.hanja}.svg`)
                                .then(r => r.text())
                                .then(svg => {
                                    container.innerHTML = svg;
                                    const svgEl = container.querySelector('svg');
                                    if (svgEl) { svgEl.style.width='100%'; svgEl.style.height='100%'; svgEl.style.opacity='0.12'; svgEl.style.pointerEvents='none'; }
                                });
                        } : handleHint}
                        disabled={isAnimating}
                        className="w-full back-quiz-button disabled:opacity-50 !py-2.5 sm:!py-3">
                        {isAnimCJK ? '다시 보기' : isAnimating ? '획순 재생 중...' : '획순 동영상 보기'}
                    </button>
                </div>
            ) : (
                <div className="w-full flex flex-col gap-2 sm:gap-3 animate-in slide-in-from-bottom-4 duration-500">
                    <button onClick={onNextHanja}
                        className="hp-cta-button hp-cta-button--indigo !py-3.5 sm:!py-4">
                        {nextLabel}
                    </button>
                    <button onClick={handleRetry}
                        className="w-full py-3 text-[#8C97A8] font-normal text-h3-res">
                        다시 쓰기
                    </button>
                </div>
            )}

            {/* animCJK 획순 동영상 모달 */}
            {showStrokeModal && strokeOrderSvg && (
                <div
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowStrokeModal(false)}
                >
                    <div
                        className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 flex flex-col items-center gap-4 shadow-2xl mx-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <p className="text-[#5B677A] dark:text-slate-300 font-normal text-sm">획순 동영상 — {hanja.hanja} ({hanja.meaning} {hanja.sound})</p>
                        <div
                            key={strokeOrderKey}
                            className="w-[260px] h-[260px]"
                            dangerouslySetInnerHTML={{ __html: strokeOrderSvg }}
                        />
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setStrokeOrderKey(k => k + 1)}
                                className="flex-1 py-3 rounded-2xl bg-[#F0F2F5] text-[#5B677A] dark:text-slate-300 font-normal text-sm"
                            >
                                다시 보기
                            </button>
                            <button
                                onClick={() => setShowStrokeModal(false)}
                                className="flex-1 py-3 rounded-2xl bg-[#7C83FF] text-white font-normal text-sm"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
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
    const [completedIds, setCompletedIds] = useState(() => {
        if (contentPool || initialHanja || (hanjaFilter && hanjaFilter.length > 0)) return new Set();
        try {
            const saved = localStorage.getItem('hanja_writing_completed');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch { return new Set(); }
    });
    const clearCountRef = useRef(0);
    const completingRef = useRef(false);
    const [completing, setCompleting] = useState(false);
    const [currentAnswered, setCurrentAnswered] = useState(false);
    const startIndexRef = useRef(0);

    const handleWritingCompleteLocal = useCallback((id, score) => {
        setCompletedIds(prev => {
            const next = new Set(prev);
            next.add(id);
            try { localStorage.setItem('hanja_writing_completed', JSON.stringify([...next])); } catch {}
            return next;
        });
        setCurrentAnswered(true);
        setCompletedCount(c => c + 1);
        if (onWritingComplete) onWritingComplete(id, score);
    }, [onWritingComplete]);

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
            startIndexRef.current = 0;
            setSelectedHanja(hanjaList[0]);
            setActiveHanjaList(hanjaList);
            setCurrentIndex(0);
            setCompletedCount(0);
            setCurrentAnswered(false);
            completingRef.current = false;
            setCompleting(false);
            setPhase('quiz');
        }, 0);

        return () => clearTimeout(timer);
    }, [initialHanja, hanjaFilter, hanjaList]);

    // 카드 클릭 시 해당 한자부터 이어서 쓰기 연습
    const handleCardClick = useCallback((item) => {
        const startIndex = displayList.findIndex(h => h.id === item.id);
        const idx = startIndex !== -1 ? startIndex : 0;
        const orderedList = [...displayList.slice(idx), ...displayList.slice(0, idx)];
        startIndexRef.current = 0;
        setSelectedHanja(item);
        setActiveHanjaList(orderedList);
        setCurrentIndex(0);
        setCompletedCount(0);
        setCurrentAnswered(false);
        completingRef.current = false;
        setCompleting(false);
        setPhase('quiz');
    }, [displayList]);

    const startQuiz = useCallback(() => {
        if (activeHanjaList.length === 0) return;
        startIndexRef.current = 0;
        setCurrentIndex(0);
        setSelectedHanja(activeHanjaList[0]);
        setCompletedCount(0);
        completingRef.current = false;
        setCompleting(false);
        setPhase('quiz');
    }, [activeHanjaList]);

    const handleNextHanja = useCallback(() => {
        if (completingRef.current) return;
        const nextIndex = currentIndex + 1;
        if (nextIndex < activeHanjaList.length) {
            setCurrentAnswered(false);
            setCurrentIndex(nextIndex);
            setSelectedHanja(activeHanjaList[nextIndex]);
        } else {
            clearCountRef.current += 1;
            completingRef.current = true;
            setCompleting(true);
            setTimeout(() => {
                setPhase('result');
                if (completedCount > 0 && onStageClear) onStageClear();
            }, 750);
        }
    }, [currentIndex, activeHanjaList, completedCount, onStageClear]);

    return (
        <div className={`quiz-screen quiz-screen--plain ${phase === 'select' ? 'bg-[#F7FAF9] dark:bg-slate-900' : 'bg-[#F8FAFC] dark:bg-slate-900'}`}>
            {/* 헤더 */}
            <div className="quiz-header-wrap quiz-header-wrap--sm">
                <div className="quiz-header-card quiz-header-card--wide">
                    <button onClick={
                        phase === 'quiz' ? () => setShowExitModal(true) :
                        phase === 'list' && !initialHanja && (!hanjaFilter || hanjaFilter.length === 0) && !contentPool ? () => setPhase('select') :
                        onBack
                    }
                        className="hp-nav-button">
                        <span>{phase === 'quiz' ? '✕' : '←'}</span>
                    </button>
                    <div className="quiz-header-title-area">
                        <h2 className="quiz-screen-title">한자 획순</h2>
                        <p className="screen-subtitle">획순에 맞게 써보세요</p>
                    </div>
                    <div className="quiz-header-right">
                        {phase === 'quiz' && activeHanjaList.length > 0 && (
                            <span className="quiz-counter-text">{currentIndex - startIndexRef.current + 1}/{activeHanjaList.length}</span>
                        )}
                    </div>
                </div>
                {phase === 'quiz' && activeHanjaList.length > 0 && (
                    <QuizProgressBar current={currentIndex - startIndexRef.current} total={activeHanjaList.length} answered={currentAnswered} completing={completing} avatar={characterAvatar} charType={selectedCharacter} />
                )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto pb-6">
                <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-6 pt-5">
                    {phase === 'select' && (
                        <div className="flex flex-col items-center w-full animate-in fade-in duration-500">
                            {/* 탭 */}
                            <div className="flex bg-[#F4F7F8]/40 p-1.5 rounded-full border border-[#E9EDF2] w-full mb-4 shadow-inner">
                                <button onClick={() => setViewMode('grade')}
                                    className={`flex-1 px-8 py-3 rounded-full font-normal text-h3 transition-all ${viewMode === 'grade' ? 'bg-white dark:bg-slate-800 shadow-md text-[#5B677A] dark:text-slate-300' : 'text-[#AEB7C5]'}`}>
                                    급수별
                                </button>
                                <button onClick={() => setViewMode('topic')}
                                    className={`flex-1 px-8 py-3 rounded-full font-normal text-h3 transition-all ${viewMode === 'topic' ? 'bg-white dark:bg-slate-800 shadow-md text-[#5B677A] dark:text-slate-300' : 'text-[#AEB7C5]'}`}>
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
                                    <div className="quiz-bubble">
                                        <span className="text-body font-normal text-[#5B677A] dark:text-slate-300 whitespace-nowrap break-keep">준비됐어!</span>
                                        <div className="absolute -bottom-1.5 left-3 w-4 h-4 rotate-45 bg-white dark:bg-slate-800 border-r border-b border-white dark:border-slate-700" />
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
                                    className="w-full py-5 rounded-[2rem] font-normal text-h3 text-white transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none"
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
                                            isCompleted={completedIds.has(item.id)}
                                            onClick={() => handleCardClick(item)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <span className="text-4xl">📚</span>
                                    <p className="text-[#AEB7C5] font-normal text-center break-keep">이 급수의 한자를 먼저 학습해주세요!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {phase === 'quiz' && selectedHanja && (
                        <QuizCard key={selectedHanja.id} hanja={selectedHanja} hanjaList={activeHanjaList} currentIndex={currentIndex}
                            onWritingComplete={handleWritingCompleteLocal} onNextHanja={handleNextHanja} onBack={() => setPhase('list')} />
                    )}

                    {phase === 'result' && (
                        <ResultScreen
                            correct={completedCount}
                            total={activeHanjaList.length}
                            onRetry={startQuiz}
                            onBack={() => (initialHanja || hanjaFilter || contentPool) ? onBack() : setPhase('list')}
                            selectedCharacter={selectedCharacter}
                            getRewardPreview={getRewardPreview}
                            missionXp={(clearCountRef.current === 1 && completedCount > 0) ? 30 : 0}
                        />
                    )}
                </div>
            </div>
            {showExitModal && (
                <div className="modal-overlay">
                    <div className="exit-confirm-card">
                        <img
                            src={getCharacterImage(selectedCharacter, 'keep_going')}
                            alt="exit confirm"
                            className="img-shadow-sm"
                            style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter)}) scale(${getCharacterScale(selectedCharacter, 'keep_going')})` }}
                        />
                        <div className="exit-confirm-content">
                            <h2 className="exit-confirm-title">
                                정말 쓰기를 중단할까요?
                            </h2>
                            <p className="body-muted break-keep">
                                지금 나가면 작성 중인 한자 쓰기의 연습 기록이 저장되지 않아요. 계속 끝까지 써볼까요?
                            </p>
                        </div>
                        <div className="result-btn-area">
                            <CtaButton theme="indigo" onClick={() => setShowExitModal(false)}>
                                <span className="quiz-cta-text">계속 쓰기 연습</span>
                            </CtaButton>
                            <button
                                onClick={handleExitConfirm}
                                className="back-quiz-button"
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
