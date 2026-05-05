import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import HANJA_DATA_RAW from '../hanja_unified.json';
import {
    IconToyCar, IconTeddy, IconGamepad, IconCandyDetail, IconDino,
    IconRobot, IconCake, IconUFO, IconPuppy, IconMagicWand
} from './Icons.jsx';
import { useLang } from '../LangContext.jsx';

// ── 중복 제거된 데이터 (hanja 문자 기준) ────────────────────────────────────
const HANJA_DATA = Object.values(
    HANJA_DATA_RAW.reduce((acc, h) => { if (!acc[h.hanja]) acc[h.hanja] = h; return acc; }, {})
);

// ── 급수 정의 ────────────────────────────────────────────────────────────────
const GRADE_LIST = ['8급', '7급Ⅱ', '7급', '6급Ⅱ', '6급', 'NON'];
const GRADE_LABELS = { '8급': '8급', '7급Ⅱ': '7급Ⅱ', '7급': '7급', '6급Ⅱ': '6급Ⅱ', '6급': '6급', 'NON': '기타' };
const GRADE_COLORS = {
    '8급':  { bg: 'bg-rose-400',    text: 'text-rose-400',    light: 'bg-rose-50',    border: 'border-rose-200' },
    '7급Ⅱ': { bg: 'bg-orange-400',  text: 'text-orange-400',  light: 'bg-orange-50',  border: 'border-orange-200' },
    '7급':  { bg: 'bg-amber-400',   text: 'text-amber-400',   light: 'bg-amber-50',   border: 'border-amber-200' },
    '6급Ⅱ': { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200' },
    '6급':  { bg: 'bg-blue-500',    text: 'text-blue-500',    light: 'bg-blue-50',    border: 'border-blue-200' },
    'NON':  { bg: 'bg-purple-500',  text: 'text-purple-500',  light: 'bg-purple-50',  border: 'border-purple-200' },
};

// ── 라운드 패턴: 4쌍×2판, 6쌍×4판, 8쌍×8판, 10쌍×16판, 이후 12쌍 ──────────
const ROUND_PATTERN = [
    ...Array(2).fill(4),
    ...Array(4).fill(6),
    ...Array(8).fill(8),
    ...Array(16).fill(10),
];
const getPairsForRound = (roundIdx) =>
    roundIdx < ROUND_PATTERN.length ? ROUND_PATTERN[roundIdx] : 12;

// ── 급수별 전체 페어 풀 생성 (한자 + 단어 혼합) ──────────────────────────────
const buildPairPool = (items) => {
    const pairs = [];
    // 1) 한자 ↔ 뜻+음 페어
    items.forEach(h => {
        pairs.push({ pairId: `h_${h.id}`, a: h.hanja, b: `${h.meaning} ${h.sound}`, typeA: 'hanja', typeB: 'meaning', hanjaId: h.id });
    });
    // 2) 단어 ↔ 뜻 페어 (중복 단어 제거)
    const seenWords = new Set();
    items.forEach(h => {
        (h.words || []).forEach(w => {
            if (w.word && w.meaning && !seenWords.has(w.word)) {
                seenWords.add(w.word);
                pairs.push({ pairId: `w_${w.word}`, a: `${w.word}(${w.reading || ''})`, b: w.meaning, typeA: 'word', typeB: 'meaning', hanjaId: h.id });
            }
        });
    });
    // 셔플
    return pairs.sort(() => Math.random() - 0.5);
};

// ── 총 라운드 수 계산 ────────────────────────────────────────────────────────
const calcTotalRounds = (totalPairs) => {
    let remaining = totalPairs;
    let round = 0;
    while (remaining > 0) {
        remaining -= getPairsForRound(round);
        round++;
    }
    return round;
};

// ── 테마 (아이콘 + 색상) ─────────────────────────────────────────────────────
const stageThemes = [
    { Icon: IconToyCar,      bgStart: "#FFE5E5", bgEnd: "#FFB7B2", shadow: "#ef4444", cardTheme: "bg-[#FFF5F5] border-[#FFB7B2]", txtColor: "text-rose-400" },
    { Icon: IconTeddy,       bgStart: "#FFF0E5", bgEnd: "#FFDAB9", shadow: "#f59e0b", cardTheme: "bg-[#FFFAF5] border-[#FFDAB9]", txtColor: "text-amber-400" },
    { Icon: IconGamepad,     bgStart: "#F5E5FF", bgEnd: "#D5B8FF", shadow: "#a855f7", cardTheme: "bg-[#FAF5FF] border-[#D5B8FF]", txtColor: "text-purple-400" },
    { Icon: IconCandyDetail, bgStart: "#FFE5F0", bgEnd: "#FFB3D9", shadow: "#ec4899", cardTheme: "bg-[#FFF5FA] border-[#FFB3D9]", txtColor: "text-pink-400" },
    { Icon: IconDino,        bgStart: "#E5F5E5", bgEnd: "#A8E6CF", shadow: "#10b981", cardTheme: "bg-[#F5FAF5] border-[#A8E6CF]", txtColor: "text-emerald-400" },
    { Icon: IconRobot,       bgStart: "#E5F0FF", bgEnd: "#A0C4FF", shadow: "#3b82f6", cardTheme: "bg-[#F5F8FF] border-[#A0C4FF]", txtColor: "text-blue-400" },
    { Icon: IconCake,        bgStart: "#FFFFE5", bgEnd: "#FDFFB6", shadow: "#eab308", cardTheme: "bg-[#FFFFF5] border-[#FDFFB6]", txtColor: "text-yellow-400" },
    { Icon: IconUFO,         bgStart: "#E5FFFF", bgEnd: "#9BF6FF", shadow: "#06b6d4", cardTheme: "bg-[#F5FFFF] border-[#9BF6FF]", txtColor: "text-cyan-400" },
    { Icon: IconPuppy,       bgStart: "#F0F0F0", bgEnd: "#DCDCDC", shadow: "#94a3b8", cardTheme: "bg-[#FAFAFA] border-[#DCDCDC]", txtColor: "text-slate-400" },
    { Icon: IconMagicWand,   bgStart: "#F5FFE5", bgEnd: "#CAFFBF", shadow: "#22c55e", cardTheme: "bg-[#FAFFF5] border-[#CAFFBF]", txtColor: "text-green-400" },
];

// ── 사운드 ───────────────────────────────────────────────────────────────────
const playSound = (type) => {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    let ctx = window.myAudioCtx;
    if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); window.myAudioCtx = ctx; }
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (type === 'flip') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'match') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(900, now + 0.25);
        gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    }
};

// ── 카드 컴포넌트 ─────────────────────────────────────────────────────────────
const CardItem = memo(({ card, theme, onClick }) => {
    const isFlipped = card.isFlipped || card.isMatched;
    return (
        <div
            className={"relative w-full aspect-square cursor-pointer transition-all duration-300 " + (card.isMatched ? "opacity-0 scale-50 pointer-events-none" : "hover:scale-105")}
            onClick={() => onClick(card)}
        >
            {/* 앞면 (테마 아이콘) */}
            <div className={"card-face-front clay-panel !rounded-3xl flex items-center justify-center border-[4px] border-white dark:border-slate-700 overflow-hidden bg-white/95 dark:bg-slate-800/95 shadow-xl " + (isFlipped ? "is-flipped" : "")}>
                <div className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-80 drop-shadow-lg"><theme.Icon /></div>
            </div>
            {/* 뒷면 (내용) */}
            <div className={"card-face-back clay-panel !rounded-3xl flex items-center justify-center p-2 border-[4px] border-white dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl " + (isFlipped ? "is-flipped" : "")}>
                <span className={
                    (card.type === 'hanja'
                        ? "text-3xl sm:text-5xl md:text-7xl text-slate-700 dark:text-white"
                        : card.type === 'word'
                            ? "text-sm sm:text-base md:text-lg text-indigo-600 dark:text-indigo-300"
                            : "text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-400")
                    + " font-black text-center leading-tight premium-text-shadow px-1"
                }>
                    {card.content}
                </span>
            </div>
        </div>
    );
});

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
const MatchGameScreen = ({ onBack, onHanjaAcquired, onStageClear, onMarkCorrect, onMarkWrong }) => {
    const { lang, t } = useLang();
    const getMeaning = (item) => lang === 'en' ? (item.meaning_en || item.meaning) : item.meaning;

    // ── 선택 화면 상태 ──────────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState('grade'); // 'grade' | 'topic' | 'word'
    const categories = useMemo(() => [...new Set(HANJA_DATA.map(h => h.category).filter(Boolean))], []);
    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
    const [selectedGrade, setSelectedGrade] = useState('8급');

    // ── 게임 상태 ───────────────────────────────────────────────────────────
    const [gameStarted, setGameStarted] = useState(false);
    const [pairPool, setPairPool] = useState([]);
    const [poolIndex, setPoolIndex] = useState(0);
    const [currentRound, setCurrentRound] = useState(0);
    const [totalRounds, setTotalRounds] = useState(0);
    const [cards, setCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [isLocked, setIsLocked] = useState(false);
    const [matches, setMatches] = useState(0);
    const [targetMatches, setTargetMatches] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameState, setGameState] = useState('idle'); // 'idle'|'playing'|'clear'|'over'|'allClear'

    // 현재 라운드 풀 인덱스를 ref로도 보관 (launchRound 클로저 문제 방지)
    const poolIndexRef = useRef(0);
    const pairPoolRef = useRef([]);

    // ── 단어 풀 (word 탭용) ─────────────────────────────────────────────────
    const wordPool = useMemo(() =>
        HANJA_DATA.flatMap(h => (h.words || []).filter(w => w.word && w.reading && w.meaning)),
    []);

    // ── 현재 선택된 한자 풀 ─────────────────────────────────────────────────
    const activeHanjaSet = useMemo(() => {
        if (viewMode === 'grade') {
            if (selectedGrade === '기타') return HANJA_DATA.filter(h => !h.grade || h.grade === '' || h.grade === '기타' || h.grade === 'NON');
            return HANJA_DATA.filter(h => h.grade === selectedGrade);
        }
        if (viewMode === 'topic') return HANJA_DATA.filter(h => h.category === selectedCategory);
        return [];
    }, [viewMode, selectedGrade, selectedCategory]);

    // ── 라운드 실행 ─────────────────────────────────────────────────────────
    const launchRound = useCallback((pool, roundIdx, startIdx) => {
        const pairsCount = getPairsForRound(roundIdx);
        const slice = pool.slice(startIdx, startIdx + pairsCount);
        if (slice.length === 0) { setGameState('allClear'); return; }

        const newCards = [];
        slice.forEach((pair, i) => {
            newCards.push({ uniqueId: `a-${pair.pairId}-${i}-${Math.random()}`, pairId: pair.pairId, content: pair.a, type: pair.typeA, isFlipped: false, isMatched: false, hanjaId: pair.hanjaId });
            newCards.push({ uniqueId: `b-${pair.pairId}-${i}-${Math.random()}`, pairId: pair.pairId, content: pair.b, type: pair.typeB, isFlipped: false, isMatched: false, hanjaId: pair.hanjaId });
        });
        // 셔플
        for (let i = newCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
        }
        setCards(newCards);
        setTargetMatches(slice.length);
        setMatches(0);
        setFlippedCards([]);
        setIsLocked(false);
        setTimeLeft(Math.max(30, slice.length * 8));
        setGameState('playing');
    }, []);

    // ── 게임 시작 ───────────────────────────────────────────────────────────
    const startGame = useCallback((mode) => {
        let pool;
        if (mode === 'word') {
            const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
            pool = shuffled.map((w, i) => ({
                pairId: `w_${w.word}_${i}`,
                a: `${w.word}\n${w.reading}`,
                b: w.meaning,
                typeA: 'hanja',
                typeB: 'meaning',
                hanjaId: null,
            }));
        } else {
            pool = buildPairPool(activeHanjaSet);
        }
        const total = calcTotalRounds(pool.length);
        pairPoolRef.current = pool;
        poolIndexRef.current = 0;
        setPairPool(pool);
        setPoolIndex(0);
        setCurrentRound(0);
        setTotalRounds(total);
        setGameStarted(true);
        launchRound(pool, 0, 0);
    }, [activeHanjaSet, wordPool, launchRound]);

    // ── 타이머 ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (gameState !== 'playing') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timer); setGameState('over'); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState, currentRound]);

    // ── 카드 클릭 ───────────────────────────────────────────────────────────
    const handleCardClick = useCallback((clickedCard) => {
        if (isLocked || clickedCard.isFlipped || clickedCard.isMatched || gameState !== 'playing') return;
        playSound('flip');
        setCards(prev => prev.map(c => c.uniqueId === clickedCard.uniqueId ? { ...c, isFlipped: true } : c));
        setFlippedCards(prev => {
            if (prev.length >= 2 || prev.find(c => c.uniqueId === clickedCard.uniqueId)) return prev;
            const next = [...prev, { ...clickedCard, isFlipped: true }];
            if (next.length === 2) setIsLocked(true);
            return next;
        });
    }, [isLocked, gameState]);

    // ── 짝 판정 ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (flippedCards.length !== 2) return;
        const [a, b] = flippedCards;
        if (a.pairId === b.pairId) {
            // 정답
            playSound('match');
            if (onMarkCorrect && a.hanjaId) onMarkCorrect(a.hanjaId);
            if (onHanjaAcquired && a.hanjaId) onHanjaAcquired(a.hanjaId, 0);
            setTimeout(() => {
                setCards(prev => prev.map(c => c.pairId === a.pairId ? { ...c, isMatched: true } : c));
                setFlippedCards([]);
                setMatches(prev => prev + 1);
                setIsLocked(false);
            }, 500);
        } else {
            // 오답
            playSound('wrong');
            if (onMarkWrong && a.hanjaId) onMarkWrong(a.hanjaId);
            if (onMarkWrong && b.hanjaId) onMarkWrong(b.hanjaId);
            setTimeout(() => {
                setCards(prev => prev.map(c =>
                    (c.uniqueId === a.uniqueId || c.uniqueId === b.uniqueId)
                        ? { ...c, isFlipped: false }
                        : c
                ));
                setFlippedCards([]);
                setIsLocked(false);
            }, 900);
        }
    }, [flippedCards, onMarkCorrect, onMarkWrong, onHanjaAcquired]);

    // ── 라운드 클리어 감지 ──────────────────────────────────────────────────
    useEffect(() => {
        if (targetMatches > 0 && matches === targetMatches && gameState === 'playing') {
            setTimeout(() => {
                setGameState('clear');
                if (onStageClear) onStageClear(currentRound + 1);
                if (onHanjaAcquired) onHanjaAcquired(null, 30);
            }, 300);
        }
    }, [matches, targetMatches, gameState]);

    // ── 다음 라운드 ─────────────────────────────────────────────────────────
    const goNextRound = useCallback(() => {
        const nextRound = currentRound + 1;
        const nextIdx = poolIndex + getPairsForRound(currentRound);
        if (nextIdx >= pairPool.length) { setGameState('allClear'); return; }
        setCurrentRound(nextRound);
        setPoolIndex(nextIdx);
        poolIndexRef.current = nextIdx;
        launchRound(pairPool, nextRound, nextIdx);
    }, [currentRound, poolIndex, pairPool, launchRound]);

    // ── 재도전 ──────────────────────────────────────────────────────────────
    const retryRound = useCallback(() => {
        launchRound(pairPool, currentRound, poolIndex);
    }, [pairPool, currentRound, poolIndex, launchRound]);

    // ── 그리드 클래스 ────────────────────────────────────────────────────────
    const getGridClass = () => {
        const total = cards.length;
        if (total <= 8)  return "grid-cols-2 sm:grid-cols-4 max-w-lg";
        if (total <= 12) return "grid-cols-3 sm:grid-cols-4 max-w-2xl";
        if (total <= 16) return "grid-cols-4 max-w-3xl";
        if (total <= 20) return "grid-cols-4 sm:grid-cols-5 max-w-4xl";
        return "grid-cols-4 sm:grid-cols-6 max-w-5xl";
    };

    const gradeColor = selectedGrade ? GRADE_COLORS[selectedGrade] : GRADE_COLORS['8급'];
    const currentTheme = stageThemes[currentRound % 10];

    // ════════════════════════════════════════════════════════════════════════
    // 전체 클리어 화면
    // ════════════════════════════════════════════════════════════════════════
    if (gameStarted && gameState === 'allClear') {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-slate-900 dark:to-slate-800">
                <div className="clay-panel rounded-[3rem] p-10 border-4 border-white dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 flex flex-col items-center gap-6 max-w-sm w-full">
                    <div className="text-8xl animate-bounce">🏆</div>
                    <h2 className="text-4xl font-black text-slate-700 dark:text-white text-center premium-text-shadow">
                        {viewMode === 'grade' ? GRADE_LABELS[selectedGrade] : viewMode === 'topic' ? selectedCategory : '단어'} 완전 정복!
                    </h2>
                    <p className="text-slate-400 font-bold text-center">모든 {totalRounds}라운드를 완료했습니다!</p>
                    <button
                        onClick={() => { setGameStarted(false); setGameState('idle'); }}
                        className="w-full py-4 rounded-[2rem] bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-xl shadow-xl active:scale-95 transition-all"
                    >
                        다른 모드 도전
                    </button>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // 게임 진행 화면
    // ════════════════════════════════════════════════════════════════════════
    if (gameStarted) {
        return (
            <div className="w-full max-w-6xl mx-auto flex flex-col items-center p-4 h-[100dvh]">
                {/* 헤더 */}
                <div className="w-full flex justify-between items-center mb-4 clay-panel p-4 md:p-6 px-6 md:px-10 rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-slate-700 shrink-0 mt-2">
                    <button
                        onClick={() => { setGameStarted(false); setGameState('idle'); }}
                        className="font-bold text-slate-600 dark:text-slate-200 bg-white/50 dark:bg-slate-800/50 px-4 md:px-6 py-2 md:py-3 rounded-2xl border-2 border-white/50 shadow-md transition-all flex items-center gap-2 text-sm md:text-base"
                    >
                        <span className="text-lg md:text-2xl">←</span> <span className="hidden sm:inline">나가기</span>
                    </button>
                    <div className="flex flex-col items-center">
                        <span className={`text-xs font-black uppercase tracking-widest mb-0.5 ${viewMode === 'grade' ? gradeColor.text : 'text-indigo-400'}`}>
                            {viewMode === 'grade' ? GRADE_LABELS[selectedGrade] : viewMode === 'topic' ? selectedCategory : '단어'} · Round {currentRound + 1} / {totalRounds}
                        </span>
                        <span className="font-black text-xl md:text-3xl text-slate-700 dark:text-white premium-text-shadow">
                            {matches} / {targetMatches} 짝
                        </span>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-800/80 px-4 md:px-6 py-2 md:py-3 rounded-2xl border-2 border-white dark:border-slate-700 shadow-xl">
                        <span className="text-rose-400 text-xl md:text-3xl font-black tabular-nums">{timeLeft}s</span>
                    </div>
                </div>

                {/* 게임 영역 */}
                <div className="w-full clay-panel rounded-[3rem] p-4 sm:p-8 flex-1 flex flex-col justify-center items-center relative overflow-hidden border-4 border-white dark:border-slate-700 shadow-2xl bg-white/40 dark:bg-slate-900/40">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />

                    {/* 클리어 / 타임오버 */}
                    {(gameState === 'clear' || gameState === 'over') && (
                        <div className="text-center flex flex-col items-center z-10 w-full h-full justify-center gap-6 px-4">
                            <div className="text-7xl md:text-9xl animate-float">{gameState === 'clear' ? '🏆' : '⏰'}</div>
                            <h1 className={"font-black premium-text-shadow text-4xl md:text-7xl " + (gameState === 'clear' ? "text-emerald-400" : "text-rose-400")}>
                                {gameState === 'clear' ? 'CLEAR!' : 'TIME OVER'}
                            </h1>
                            {gameState === 'clear' && (
                                <p className="text-slate-500 dark:text-slate-300 font-bold text-base md:text-xl bg-white/80 dark:bg-slate-800/80 px-8 py-4 rounded-full border-2 border-white dark:border-slate-700 shadow-xl">
                                    Round {currentRound + 1} 완료! 다음은 {getPairsForRound(currentRound + 1) * 2}장
                                </p>
                            )}
                            <div className="flex gap-4 w-full max-w-sm">
                                {gameState === 'clear' ? (
                                    <>
                                        <button
                                            onClick={goNextRound}
                                            className={`flex-1 text-white font-black py-4 md:py-6 rounded-[2rem] shadow-2xl border-4 border-white text-lg md:text-2xl active:scale-95 transition-all ${viewMode === 'grade' ? gradeColor.bg : 'bg-indigo-500'}`}
                                        >
                                            NEXT →
                                        </button>
                                        <button
                                            onClick={() => { setGameStarted(false); setGameState('idle'); }}
                                            className="flex-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-white border-4 border-white dark:border-slate-700 font-black py-4 md:py-6 rounded-[2rem] shadow-2xl active:scale-95 transition-all text-lg md:text-2xl"
                                        >
                                            MENU
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={retryRound}
                                            className="flex-1 text-white font-black py-4 md:py-6 rounded-[2rem] shadow-2xl border-4 border-white text-lg md:text-2xl active:scale-95 transition-all bg-rose-400"
                                        >
                                            재도전
                                        </button>
                                        <button
                                            onClick={() => { setGameStarted(false); setGameState('idle'); }}
                                            className="flex-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-white border-4 border-white dark:border-slate-700 font-black py-4 md:py-6 rounded-[2rem] shadow-2xl active:scale-95 transition-all text-lg md:text-2xl"
                                        >
                                            MENU
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 카드 그리드 */}
                    {gameState === 'playing' && (
                        <div className={"grid gap-3 sm:gap-4 md:gap-5 w-full h-full content-center p-2 " + getGridClass()}>
                            {cards.map((card) => (
                                <CardItem key={card.uniqueId} card={card} theme={currentTheme} onClick={handleCardClick} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // 선택 화면
    // ════════════════════════════════════════════════════════════════════════
    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden">
            {/* 헤더 */}
            <div className="w-full px-4 shrink-0 safe-top">
                <div className="w-full flex justify-between items-center clay-panel p-4 sm:p-6 px-6 sm:px-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl border-4 border-white dark:border-slate-700">
                    <button
                        onClick={onBack}
                        className="text-slate-600 dark:text-slate-200 font-black bg-white/60 dark:bg-slate-800/60 px-5 sm:px-10 py-2.5 sm:py-4 rounded-2xl border-2 border-white/50 shadow-md hover:bg-white active:scale-95 transition-all flex items-center gap-2"
                    >
                        <span className="text-xl sm:text-2xl">←</span> <span>{t('backMenu').replace('← ', '')}</span>
                    </button>
                    <h1 className="text-2xl sm:text-5xl font-black text-slate-700 dark:text-white m-0 tracking-tight premium-text-shadow text-center flex-1 px-4">
                        {t('matchTitle')}
                    </h1>
                    <div className="w-[100px] sm:w-[140px] hidden sm:flex justify-end items-center">
                        <img src="/assets/images/characters/uju.png" alt="우주" className="w-20 h-20 object-contain animate-float" />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 pb-32 px-4">
                <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-10">

                    {/* 탭 */}
                    <div className="flex bg-slate-100/60 dark:bg-slate-900/60 p-2 rounded-[2rem] border-2 border-white dark:border-slate-700 shadow-inner">
                        <button
                            onClick={() => setViewMode('topic')}
                            className={`px-6 py-3 rounded-2xl font-black text-lg transition-all ${viewMode === 'topic' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}
                        >
                            주제별
                        </button>
                        <button
                            onClick={() => setViewMode('grade')}
                            className={`px-6 py-3 rounded-2xl font-black text-lg transition-all ${viewMode === 'grade' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}
                        >
                            급수별
                        </button>
                        <button
                            onClick={() => setViewMode('word')}
                            className={`px-6 py-3 rounded-2xl font-black text-lg transition-all ${viewMode === 'word' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}
                        >
                            단어
                        </button>
                    </div>

                    <div className="w-full clay-panel rounded-[4rem] p-8 sm:p-14 border-4 border-white dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 shadow-[0_40px_80px_rgba(148,163,184,0.3)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                        <div className="flex flex-col gap-8 relative z-10">

                            {/* 주제별 카테고리 칩 */}
                            {viewMode === 'topic' && (
                                <div className="flex flex-wrap gap-4 justify-center">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={"px-8 py-4 rounded-[2.5rem] font-black whitespace-nowrap transition-all border-4 text-xl " + (selectedCategory === cat ? "bg-indigo-500 text-white border-white shadow-2xl scale-110" : "bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40 shadow-lg")}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* 급수별 선택 */}
                            {viewMode === 'grade' && (
                                <div className="flex gap-4 justify-center flex-wrap">
                                    {GRADE_LIST.map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setSelectedGrade(g)}
                                            className={"px-8 sm:px-12 py-3 sm:py-5 rounded-[2.5rem] font-black transition-all border-4 text-xl sm:text-2xl " + (selectedGrade === g ? "bg-indigo-500 text-white border-white shadow-2xl scale-110" : "bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40 shadow-lg")}
                                        >
                                            {GRADE_LABELS[g]}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* 단어 탭 안내 */}
                            {viewMode === 'word' && (
                                <p className="text-center text-slate-400 font-bold text-base">
                                    전체 단어 {wordPool.length}개에서 랜덤으로 출제됩니다.
                                </p>
                            )}

                            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full opacity-50" />

                            {/* 급수별: 라운드 정보 표시 + 시작 버튼 */}
                            {viewMode === 'grade' && (() => {
                                const items = HANJA_DATA.filter(h => h.grade === selectedGrade);
                                const pool = buildPairPool(items);
                                const rounds = calcTotalRounds(pool.length);
                                const col = GRADE_COLORS[selectedGrade] || GRADE_COLORS['8급'];
                                return (
                                    <div className="flex flex-col items-center gap-6">
                                        <div className={`w-full rounded-[2rem] px-6 py-5 ${col.light} ${col.border} border-2 flex flex-col items-center gap-1`}>
                                            <span className={`font-black text-2xl ${col.text}`}>{GRADE_LABELS[selectedGrade]}</span>
                                            <span className="text-slate-500 text-sm font-bold">한자 {items.length}개 · 총 {rounds}라운드</span>
                                            <span className="text-slate-400 text-xs">4쌍→6쌍→8쌍→10쌍→12쌍 순으로 진행</span>
                                        </div>
                                        <button
                                            onClick={() => startGame('grade')}
                                            className={`w-full py-5 rounded-[2rem] text-white font-black text-xl shadow-xl active:scale-95 transition-all ${col.bg}`}
                                        >
                                            시작하기! 🚀
                                        </button>
                                    </div>
                                );
                            })()}

                            {/* 주제별: 시작 버튼 */}
                            {viewMode === 'topic' && (() => {
                                const pool = buildPairPool(activeHanjaSet);
                                const rounds = calcTotalRounds(pool.length);
                                return (
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="w-full rounded-[2rem] px-6 py-5 bg-indigo-50 border-indigo-200 border-2 flex flex-col items-center gap-1">
                                            <span className="font-black text-2xl text-indigo-500">{selectedCategory}</span>
                                            <span className="text-slate-500 text-sm font-bold">한자 {activeHanjaSet.length}개 · 총 {rounds}라운드</span>
                                        </div>
                                        <button
                                            onClick={() => startGame('topic')}
                                            className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-xl shadow-xl active:scale-95 transition-all"
                                        >
                                            시작하기! 🚀
                                        </button>
                                    </div>
                                );
                            })()}

                            {/* 단어 탭: 시작 버튼 */}
                            {viewMode === 'word' && (
                                <div className="flex flex-col items-center gap-6">
                                    <button
                                        onClick={() => startGame('word')}
                                        className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xl shadow-xl active:scale-95 transition-all"
                                    >
                                        시작하기! 🚀
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchGameScreen;
