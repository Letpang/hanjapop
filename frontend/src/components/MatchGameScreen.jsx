import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import HANJA_DATA_RAW from '../hanja_unified.json';
import { getSRSWeightedPool } from '../utils/learningPool.js';
import { useLang } from '../LangContext.jsx';

// ── 중복 제거된 데이터 (hanja 문자 기준) ────────────────────────────────────
const HANJA_DATA = Object.values(
    HANJA_DATA_RAW.reduce((acc, h) => { if (!acc[h.hanja]) acc[h.hanja] = h; return acc; }, {})
);

// ── 급수 정의 ────────────────────────────────────────────────────────────────
const GRADE_LIST = ['8급', '7급Ⅱ', '7급', '6급Ⅱ', '6급', 'NON'];
const GRADE_LABELS = { '8급': '8급', '7급Ⅱ': '7급Ⅱ', '7급': '7급', '6급Ⅱ': '6급Ⅱ', '6급': '6급', 'NON': '기타' };
const CATEGORY_IMAGES = {
    '숫자와 기초 개념': '1_一.webp',
    '자연과 시간': '31_日.webp',
    '나와 가족 신체': '71_父.webp',
    '공간과 위치': '111_東.webp',
    '학교와 일상생활': '151_學.webp',
    '행동과 상태': '201_來.webp',
    '사회와 문화': '251_國.webp',
};
// ── 급수별 XP 테이블 ─────────────────────────────────────────────────────────
const GRADE_XP = {
    '8급':  { base: 3, combo3: 0, combo5: 0 },
    '7급Ⅱ': { base: 3, combo3: 0, combo5: 0 },
    '7급':  { base: 3, combo3: 0, combo5: 0 },
    '6급Ⅱ': { base: 3, combo3: 0, combo5: 0 },
    '6급':  { base: 3, combo3: 0, combo5: 0 },
    'NON':  { base: 3, combo3: 0, combo5: 0 },
};
const GRADE_COLORS = {
    '8급':  { bg: 'bg-rose-400',    text: 'text-rose-400',    light: 'bg-rose-50',    border: 'border-rose-200' },
    '7급Ⅱ': { bg: 'bg-orange-400',  text: 'text-orange-400',  light: 'bg-orange-50',  border: 'border-orange-200' },
    '7급':  { bg: 'bg-amber-400',   text: 'text-amber-400',   light: 'bg-amber-50',   border: 'border-amber-200' },
    '6급Ⅱ': { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200' },
    '6급':  { bg: 'bg-blue-500',    text: 'text-blue-500',    light: 'bg-blue-50',    border: 'border-blue-200' },
    'NON':  { bg: 'bg-purple-500',  text: 'text-purple-500',  light: 'bg-purple-50',  border: 'border-purple-200' },
};

// ── 라운드 패턴: 4장(2쌍)×2판, 6장(3쌍)×4판, 8장(4쌍)×8판, 10장(5쌍)×16판, 이후 12장(6쌍) ──
const ROUND_PATTERN = [
    ...Array(2).fill(2),   // 4장
    ...Array(4).fill(3),   // 6장
    ...Array(8).fill(4),   // 8장
    ...Array(16).fill(5),  // 10장
];
const getPairsForRound = (roundIdx) =>
    roundIdx < ROUND_PATTERN.length ? ROUND_PATTERN[roundIdx] : 6; // max 12장

const calcTotalRounds = (totalPairs) => {
    let remaining = totalPairs;
    let round = 0;
    while (remaining > 0) {
        remaining -= getPairsForRound(round);
        round++;
    }
    return round;
};

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
                pairs.push({ pairId: `w_${w.word}`, a: w.word, b: w.meaning, typeA: 'word', typeB: 'meaning', hanjaId: h.id });
            }
        });
    });
    // 셔플
    return pairs.sort(() => Math.random() - 0.5);
};

// ── 테마 (아이콘 + 색상) ─────────────────────────────────────────────────────
// ── 사운드 ───────────────────────────────────────────────────────────────────
const playSound = (type) => {
    try {
        if (!window.AudioContext && !window.webkitAudioContext) return;
        if (!window.myAudioCtx) window.myAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = window.myAudioCtx;
        if (ctx.state === 'suspended') { ctx.resume(); return; }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.onended = () => gain.disconnect();

        const now = ctx.currentTime;
        // gain을 0에서 시작해 burst 방지
        gain.gain.setValueAtTime(0, now);

        if (type === 'flip') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            gain.gain.linearRampToValueAtTime(0.04, now + 0.01);
            gain.gain.linearRampToValueAtTime(0, now + 0.09);
            osc.start(now); osc.stop(now + 0.09);
        } else if (type === 'match') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.setValueAtTime(800, now + 0.12);
            gain.gain.linearRampToValueAtTime(0.06, now + 0.01);
            gain.gain.setValueAtTime(0.06, now + 0.1);
            gain.gain.linearRampToValueAtTime(0, now + 0.32);
            osc.start(now); osc.stop(now + 0.32);
        } else if (type === 'wrong') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.linearRampToValueAtTime(200, now + 0.25);
            gain.gain.linearRampToValueAtTime(0.05, now + 0.01);
            gain.gain.linearRampToValueAtTime(0, now + 0.25);
            osc.start(now); osc.stop(now + 0.25);
        }
    } catch (_) {}
};

// ── 카드 컴포넌트 ─────────────────────────────────────────────────────────────
const getCardTextClass = (type, totalCards) => {
    if (type === 'hanja') {
        if (totalCards <= 4)  return 'text-5xl sm:text-6xl font-extrabold text-slate-700';
        if (totalCards <= 8)  return 'text-4xl sm:text-5xl font-extrabold text-slate-700';
        return                       'text-3xl sm:text-4xl font-extrabold text-slate-700';
    }
    if (type === 'word') {
        if (totalCards <= 4)  return 'text-2xl sm:text-3xl font-extrabold text-indigo-600';
        if (totalCards <= 8)  return 'text-xl sm:text-2xl font-extrabold text-indigo-600';
        return                       'text-base sm:text-lg font-extrabold text-indigo-600';
    }
    // meaning
    if (totalCards <= 4)  return 'text-lg sm:text-xl font-bold text-slate-500';
    if (totalCards <= 8)  return 'text-base sm:text-lg font-bold text-slate-500';
    return                       'text-sm sm:text-base font-bold text-slate-500';
};

const CardItem = memo(({ card, onClick, totalCards, cardBackImg }) => {
    const isFlipped = card.isFlipped || card.isMatched;

    return (
        <div
            className="relative w-full aspect-[3/2] cursor-pointer active:scale-[0.97] transition-all duration-300"
            style={{ pointerEvents: card.isMatched ? 'none' : 'auto' }}
            onClick={() => onClick(card)}
        >
            {/* 앞면 — 캐릭터 이미지 */}
            <div className={`card-face-front absolute inset-0 rounded-[1.5rem] md:rounded-[2rem] bg-white border-2 border-slate-200 shadow-md flex items-center justify-center overflow-hidden ${isFlipped ? 'is-flipped' : ''}`}>
                <img
                    src={cardBackImg || '/assets/images/characters/garae/rank_2.webp'}
                    alt="?"
                    className="w-[65%] h-[65%] object-contain"
                    onError={(e) => { e.target.style.opacity = '0'; }}
                />
            </div>

            {/* 뒷면 — 텍스트 내용 */}
            <div className={`card-face-back absolute inset-0 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center p-3 shadow-2xl ${card.isMatched ? 'bg-white border-2 border-emerald-400' : 'bg-white border-2 border-indigo-400'} ${isFlipped ? 'is-flipped' : ''}`}>
                {card.isMatched && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-extrabold leading-none">✓</span>
                    </div>
                )}
                <span className={`${getCardTextClass(card.type, totalCards)} text-center leading-tight tracking-tight w-full break-keep px-1 ${card.isMatched ? '!text-emerald-500' : ''}`}>
                    {card.content}
                </span>
            </div>
        </div>
    );
});

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
const MatchGameScreen = ({ onBack, onHanjaAcquired, onStageClear, onMarkCorrect, onMarkWrong, srsData, masteryData, userLevel, hanjaFilter }) => {
    const { lang, t } = useLang();

    // 16단계 캐릭터 로테이션 이미지 생성
    const cardBackSequence = useMemo(() => {
        const chars = ['garae', 'jeolmi', 'chapssal', 'muzi'];
        const levels = [2, 3, 4, 5];
        const seq = [];
        chars.forEach(char => {
            levels.forEach(lv => {
                seq.push(`/assets/images/characters/${char}/rank_${lv}.webp`);
            });
        });
        return seq;
    }, []);

    // ── 선택 화면 상태 ──────────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState('grade'); // 'grade' | 'topic'
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
    const [matches, setMatches] = useState(0);
    const [targetMatches, setTargetMatches] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameState, setGameState] = useState('idle'); // 'idle'|'playing'|'clear'|'over'|'allClear'
    const [clearCombo, setClearCombo] = useState(0); // 연속 클리어 콤보 카운터
    const [xpPopup, setXpPopup] = useState({ show: false, key: 0, amount: 0 });

    // 현재 라운드 풀 인덱스를 ref로도 보관 (launchRound 클로저 문제 방지)
    const poolIndexRef = useRef(0);
    const pairPoolRef = useRef([]);
    const isLockedRef = useRef(false);

    // 콜백 props를 ref로 유지 — effect deps에 포함 않으면서 항상 최신 함수 참조 사용
    const onMarkCorrectRef = useRef(onMarkCorrect);
    const onHanjaAcquiredRef = useRef(onHanjaAcquired);
    onMarkCorrectRef.current = onMarkCorrect;
    onHanjaAcquiredRef.current = onHanjaAcquired;

    // ── 현재 선택된 한자 풀 (SRS 우선순위 순서로 정렬 → 초반 라운드에 복습 필요 한자 등장) ──
    const activeHanjaSet = useMemo(() => {
        let base;
        if (hanjaFilter && hanjaFilter.length > 0) {
            base = HANJA_DATA.filter(h => hanjaFilter.includes(h.id));
        } else if (viewMode === 'grade') {
            if (selectedGrade === '기타') base = HANJA_DATA.filter(h => !h.grade || h.grade === '' || h.grade === '기타' || h.grade === 'NON');
            else base = HANJA_DATA.filter(h => h.grade === selectedGrade);
        } else {
            base = HANJA_DATA.filter(h => h.category === selectedCategory);
        }
        return getSRSWeightedPool(base, srsData, masteryData, userLevel);
    }, [viewMode, selectedGrade, selectedCategory, srsData, masteryData, userLevel, hanjaFilter]);

    // ── 라운드 실행 ─────────────────────────────────────────────────────────
    const launchRound = useCallback((pool, roundIdx, startIdx) => {
        const pairsCount = (hanjaFilter && hanjaFilter.length > 0) ? 5 : getPairsForRound(roundIdx);
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
        isLockedRef.current = false;
        setTimeLeft(pairsCount * 10);
        setGameState('playing');
    }, []);

    useEffect(() => {
        if (hanjaFilter && hanjaFilter.length > 0 && !gameStarted) startGame();
    }, [activeHanjaSet]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── 게임 시작 ───────────────────────────────────────────────────────────
    const startGame = useCallback((mode, overrideSet) => {
        const isStageMode = hanjaFilter && hanjaFilter.length > 0;
        let pool = buildPairPool(overrideSet || activeHanjaSet);
        
        // 스테이지 모드(오늘의 여정)일 경우 딱 5쌍(10장)만 추출하여 1판만 진행
        if (isStageMode) {
            pool = pool.slice(0, 5);
        }

        const total = isStageMode ? 1 : calcTotalRounds(pool.length);
        pairPoolRef.current = pool;
        poolIndexRef.current = 0;
        setPairPool(pool);
        setPoolIndex(0);
        setCurrentRound(0);
        setTotalRounds(total);
        setGameStarted(true);
        launchRound(pool, 0, 0);
    }, [activeHanjaSet, launchRound, hanjaFilter]);

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
        // ref로 즉시 확인 — state 비동기 업데이트보다 빠르게 연타 차단
        if (isLockedRef.current || clickedCard.isFlipped || clickedCard.isMatched || gameState !== 'playing') return;
        playSound('flip');
        setCards(prev => prev.map(c => c.uniqueId === clickedCard.uniqueId ? { ...c, isFlipped: true } : c));
        setFlippedCards(prev => {
            if (prev.length >= 2 || prev.find(c => c.uniqueId === clickedCard.uniqueId)) return prev;
            const next = [...prev, { ...clickedCard, isFlipped: true }];
            if (next.length === 2) {
                isLockedRef.current = true;
            }
            return next;
        });
    }, [gameState]);

    // ── 짝 판정 ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (flippedCards.length !== 2) return;
        const [a, b] = flippedCards;
        if (a.pairId === b.pairId) {
            playSound('match');
            setTimeout(() => {
                if (onMarkCorrectRef.current && a.hanjaId) onMarkCorrectRef.current(a.hanjaId);
                if (onHanjaAcquiredRef.current && a.hanjaId) {
                    const gradeKey = viewMode === 'grade' ? selectedGrade : 'NON';
                    const xpPerMatch = GRADE_XP[gradeKey]?.base || 3;
                    onHanjaAcquiredRef.current(a.hanjaId, xpPerMatch);
                    setXpPopup({ show: true, key: Date.now(), amount: xpPerMatch });
                    setTimeout(() => setXpPopup(p => ({ ...p, show: false })), 1500);
                }
                setCards(prev => prev.map(c => c.pairId === a.pairId ? { ...c, isMatched: true } : c));
                setFlippedCards([]);
                setMatches(prev => {
                    const next = prev + 1;
                    if (next < targetMatches) isLockedRef.current = false;
                    return next;
                });
            }, 500);
        } else {
            // 오답
            setTimeout(() => playSound('wrong'), 150);
            setTimeout(() => {

                setCards(prev => prev.map(c =>
                    (c.uniqueId === a.uniqueId || c.uniqueId === b.uniqueId)
                        ? { ...c, isFlipped: false }
                        : c
                ));
                setFlippedCards([]);
                isLockedRef.current = false;
            }, 900);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flippedCards, targetMatches]); // 콜백 props 제외 — 포함 시 App 리렌더 → 무한 재실행

    // ── 라운드 클리어 감지 ──────────────────────────────────────────────────
    useEffect(() => {
        if (targetMatches > 0 && matches === targetMatches && gameState === 'playing') {
            setTimeout(() => {
                setGameState('clear');
                if (onStageClear) onStageClear(currentRound + 1);
            }, 380);
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

    // ── 타임오버 콤보 초기화 ──────────────────────────────────────────────────
    useEffect(() => {
        if (gameState === 'over') {
            setClearCombo(0);
        }
    }, [gameState]);
    // ── 재도전 ──────────────────────────────────────────────────────────────
    const retryRound = useCallback(() => {
        launchRound(pairPool, currentRound, poolIndex);
    }, [pairPool, currentRound, poolIndex, launchRound]);

    const gradeColor = selectedGrade ? GRADE_COLORS[selectedGrade] : GRADE_COLORS['8급'];

    // ════════════════════════════════════════════════════════════════════════
    // 전체 클리어 화면
    // ════════════════════════════════════════════════════════════════════════
    if (gameStarted && gameState === 'allClear') {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center p-6 z-[100] backdrop-blur-md" style={{ background: 'rgba(255,245,200,0.35)' }}>
                <div className="premium-card-base p-12 flex flex-col items-center gap-8 max-w-md w-full bg-white border-slate-100 shadow-2xl !rounded-2xl animate-in zoom-in duration-500 relative overflow-hidden">
                    <img src="/assets/images/icons/celebration.png" alt="great" className="w-28 h-28 object-contain animate-bounce drop-shadow-xl relative z-10" />
                    <div className="flex flex-col items-center gap-2 text-center relative z-10">
                        <span className="text-sm font-extrabold text-slate-400">정말 멋진 결과예요!</span>
                        <h2 className="text-4xl font-extrabold tracking-tighter" style={{ color: '#10B981' }}>
                            {viewMode === 'grade' ? GRADE_LABELS[selectedGrade] : viewMode === 'topic' ? selectedCategory : ''} 마스터!
                        </h2>
                        <p className="text-slate-400 font-extrabold text-xs mt-2">총 {totalRounds}라운드 전부 클리어!</p>
                    </div>
                    <button
                        onClick={hanjaFilter ? onBack : () => { setGameStarted(false); setGameState('idle'); }}
                        className="pill-button-primary w-full py-5 text-xl shadow-xl shadow-indigo-100 relative z-10"
                    >
                        다른 모드 해보기
                    </button>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // 게임 진행 화면
    // ════════════════════════════════════════════════════════════════════════
    if (gameStarted) {
        const maxTime = Math.max(1, cards.length / 2 * 10);
        const timeFraction = timeLeft / maxTime;

        return (
            <div className="w-full h-[100dvh] flex flex-col bg-[#F8FAFF] select-none">
                <style>{`@keyframes xpFloat{0%{opacity:0;transform:scale(0.6) translateY(16px)}28%{opacity:1;transform:scale(1.1) translateY(-6px)}40%{opacity:1;transform:scale(1) translateY(0)}68%{opacity:1;transform:scale(1) translateY(0)}100%{opacity:0;transform:translateY(-28px)}}`}</style>
                {xpPopup.show && (
                    <div key={xpPopup.key} className="fixed inset-0 flex items-center justify-center pointer-events-none z-[200]" style={{ animation: 'xpFloat 1.5s ease-in-out forwards', paddingBottom: '80px' }}>
                        <div className="px-7 py-3 rounded-full font-extrabold text-xl" style={{ backgroundColor: '#FFF7D4', color: '#B8860B', border: '2px solid #FFD700', boxShadow: '0 8px 28px rgba(255,215,0,0.5)' }}>
                            ⭐ +{xpPopup.amount} XP
                        </div>
                    </div>
                )}

                {/* 헤더 */}
                <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                    <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                        <button onClick={hanjaFilter ? onBack : () => { setGameStarted(false); setGameState('idle'); }}
                            className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-black text-slate-600 gap-1">
                            <span>←</span><span className="ml-1">뒤로</span>
                        </button>
                        <div className="flex items-center gap-2 overflow-hidden">
                            <h2 className="text-lg font-black text-slate-700 m-0">메모리 게임</h2>
                            <span className="text-indigo-500 opacity-60 text-base font-bold whitespace-nowrap">{currentRound + 1}/{totalRounds}</span>
                        </div>
                    </div>
                </div>

                {/* 중앙 그룹: 제목 + 카드 + 타임바 */}
                <div className="flex-1 flex flex-col items-center justify-center px-5 gap-5">


                    {/* 카드 그리드 */}
                    {gameState === 'playing' && (
                        <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col justify-center py-2 px-2">
                            <div className={`grid gap-2 md:gap-4 w-full mx-auto px-2 ${
                                cards.length <= 4 ? 'grid-cols-2 max-w-sm' : 
                                'grid-cols-2 sm:grid-cols-4 md:grid-cols-5'
                            }`}>
                                {cards.map((card) => (
                                    <CardItem
                                        key={card.uniqueId}
                                        card={card}
                                        onClick={handleCardClick}
                                        totalCards={cards.length}
                                        cardBackImg={cardBackSequence[currentRound % 16]}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 타임바 — playing 중에만 */}
                    {gameState === 'playing' && (
                        <div className="w-full max-w-sm mx-auto flex flex-col gap-1.5">
                            <div className="flex justify-between px-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time</span>
                                <span className={`text-xs font-extrabold tabular-nums ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>{timeLeft}s</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-rose-400' : timeLeft <= 20 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                    style={{ width: `${Math.max(0, Math.min(100, timeFraction * 100))}%` }}
                                />
                            </div>
                        </div>
                    )}

                </div>

                {/* 클리어 / 타임오버 모달 */}
                {(gameState === 'clear' || gameState === 'over') && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300"
                        style={{ background: gameState === 'clear' ? 'rgba(16,185,129,0.18)' : 'rgba(255,107,107,0.18)' }}
                    >
                            <div className="w-full max-w-sm flex flex-col items-center bg-white shadow-2xl rounded-[48px] overflow-hidden">
                                <div className="pt-10 pb-8 px-8 flex flex-col items-center gap-6 w-full relative">

                                    {/* 아이콘 */}
                                    <img
                                        src={gameState === 'clear' ? '/assets/images/icons/celebration.png' : '/assets/images/icons/timeout_new.png'}
                                        alt={gameState === 'clear' ? 'great' : 'timeout'}
                                        className="w-[154px] h-[154px] object-contain drop-shadow-xl relative z-10 mt-4"
                                    />

                                    {/* 텍스트 */}
                                    <div className="text-center flex flex-col gap-2 relative z-10 -mt-5">
                                        <span className="text-sm font-extrabold text-slate-400">
                                            {gameState === 'clear' ? '정말 멋진 결과예요!' : '아쉬운 결과네요...'}
                                        </span>
                                        <h1 className="text-4xl font-extrabold tracking-tighter" style={{ color: gameState === 'clear' ? '#10B981' : '#FF6B6B' }}>
                                            {gameState === 'clear' ? '와우! 참 잘했어요!' : '시간이 다 됐어요!'}
                                        </h1>
                                        <p className="text-sm font-bold text-slate-400 leading-relaxed break-keep mt-1">
                                            {gameState === 'clear'
                                                ? `콤보 ${clearCombo}회 연속 성공! 계속 달려봐요 🔥`
                                                : '조금만 더 빨리 하면 성공할 수 있어요!'}
                                        </p>
                                    </div>

                                    {/* 버튼 2단 */}
                                    <div className="w-full flex flex-col gap-3 relative z-10">
                                        <button
                                            onClick={gameState === 'clear' ? goNextRound : retryRound}
                                            className="w-full py-4 rounded-2xl font-extrabold text-lg text-white active:scale-95 transition-all border-b-4 active:border-b-0 active:translate-y-[2px]"
                                            style={gameState === 'clear'
                                                ? { background: 'linear-gradient(135deg, #34D399, #10B981)', borderBottomColor: '#059669' }
                                                : { background: 'linear-gradient(135deg, #FF8E8E, #FF6B6B)', borderBottomColor: '#E05555' }}
                                        >
                                            {gameState === 'clear' ? '다음 라운드 →' : '다시 시도'}
                                        </button>
                                        <button
                                            onClick={hanjaFilter ? onBack : () => { setGameStarted(false); setGameState('idle'); }}
                                            className="w-full py-4 rounded-2xl font-extrabold text-lg active:scale-95 transition-all border-b-4 active:border-b-0 active:translate-y-[2px]"
                                            style={{ background: '#F1F5F9', color: '#64748B', borderBottomColor: '#CBD5E1' }}
                                        >
                                            게임 종료
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // 선택 화면
    // ════════════════════════════════════════════════════════════════════════
    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden" style={{ backgroundColor: '#F8FAFF' }}>
            {/* 헤더 */}
            <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                    <button onClick={onBack}
                        className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-black text-slate-600 gap-1">
                        <span>←</span><span className="ml-1">뒤로</span>
                    </button>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <h2 className="text-lg font-black text-slate-700 m-0">메모리 게임</h2>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto pb-6">
                <div className="w-full max-w-4xl mx-auto px-4 flex flex-col items-center gap-6 pt-5">

                    {/* 탭 */}
                    <div className="flex bg-slate-100/40 p-1.5 rounded-full border border-slate-200 w-full mb-4 shadow-inner">
                        <button
                            onClick={() => setViewMode('grade')}
                            className={`flex-1 px-8 py-3 rounded-full font-extrabold text-xs transition-all ${viewMode === 'grade' ? 'bg-white shadow-md' : 'text-slate-400'}`}
                            style={viewMode === 'grade' ? { color: '#6D28D9' } : {}}
                        >
                            급수별
                        </button>
                        <button
                            onClick={() => setViewMode('topic')}
                            className={`flex-1 px-8 py-3 rounded-full font-extrabold text-xs transition-all ${viewMode === 'topic' ? 'bg-white shadow-md' : 'text-slate-400'}`}
                            style={viewMode === 'topic' ? { color: '#6D28D9' } : {}}
                        >
                            주제별
                        </button>
                    </div>

                    {/* 주제별 카테고리 카드 */}
                    {viewMode === 'topic' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                            {categories.map(cat => {
                                const count = HANJA_DATA.filter(h => h.category === cat).length;
                                const imgSrc = CATEGORY_IMAGES[cat] ? `/assets/images/hanja_all/${CATEGORY_IMAGES[cat]}` : null;
                                const isSelected = selectedCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => { setSelectedCategory(cat); startGame('topic', getSRSWeightedPool(HANJA_DATA.filter(h => h.category === cat), srsData, masteryData, userLevel)); }}
                                        className="bg-white shadow-lg rounded-2xl flex flex-row items-center overflow-hidden active:scale-95 transition-all border-[4px]"
                                        style={{ borderColor: isSelected ? '#BDB2FF' : 'white' }}
                                    >
                                        <div className="w-28 h-28 shrink-0 flex items-center justify-center p-3" style={{ backgroundColor: isSelected ? '#BDB2FF20' : '#F8FAFC' }}>
                                            {imgSrc ? <img src={imgSrc} className="w-full h-full object-contain drop-shadow-sm" alt={cat} /> : <span className="text-2xl font-extrabold" style={{ color: '#BDB2FF' }}>?</span>}
                                        </div>
                                        <div className="px-3 flex flex-col items-start gap-0">
                                            <span className="font-extrabold text-xs leading-tight" style={{ color: isSelected ? '#6D28D9' : '#334155' }}>{cat}</span>
                                            <span className="text-xs font-bold text-slate-400">{count}개</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* 급수별 선택 */}
                    {viewMode === 'grade' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 w-full">
                            {['8급', '7급Ⅱ', '7급', '6급Ⅱ', '6급', '전체'].map(g => (
                                <button
                                    key={g}
                                    onClick={() => { setSelectedGrade(g); const raw = g === '전체' ? HANJA_DATA : HANJA_DATA.filter(h => h.grade === g); startGame('grade', getSRSWeightedPool(raw, srsData, masteryData, userLevel)); }}
                                    className="py-6 rounded-[2rem] font-extrabold text-lg transition-all border shadow-sm active:scale-95 bg-white"
                                    style={selectedGrade === g
                                        ? { color: '#6D28D9', borderColor: '#BDB2FF', boxShadow: '0 8px 24px #BDB2FF60', outline: '4px solid #BDB2FF30' }
                                        : { color: '#1e293b', borderColor: '#E2E8F0' }}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MatchGameScreen;
