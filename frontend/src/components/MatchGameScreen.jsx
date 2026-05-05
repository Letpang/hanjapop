import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import {
    IconToyCar, IconTeddy, IconGamepad, IconCandyDetail, IconDino,
    IconRobot, IconCake, IconUFO, IconPuppy, IconMagicWand
} from './Icons.jsx';
import { useLang } from '../LangContext.jsx';

const stageThemes = [
    { Icon: IconToyCar, bgStart: "#FFE5E5", bgEnd: "#FFB7B2", shadow: "#ef4444", cardTheme: "bg-[#FFF5F5] border-[#FFB7B2]", txtColor: "text-rose-400" },
    { Icon: IconTeddy, bgStart: "#FFF0E5", bgEnd: "#FFDAB9", shadow: "#f59e0b", cardTheme: "bg-[#FFFAF5] border-[#FFDAB9]", txtColor: "text-amber-400" },
    { Icon: IconGamepad, bgStart: "#F5E5FF", bgEnd: "#D5B8FF", shadow: "#a855f7", cardTheme: "bg-[#FAF5FF] border-[#D5B8FF]", txtColor: "text-purple-400" },
    { Icon: IconCandyDetail, bgStart: "#FFE5F0", bgEnd: "#FFB3D9", shadow: "#ec4899", cardTheme: "bg-[#FFF5FA] border-[#FFB3D9]", txtColor: "text-pink-400" },
    { Icon: IconDino, bgStart: "#E5F5E5", bgEnd: "#A8E6CF", shadow: "#10b981", cardTheme: "bg-[#F5FAF5] border-[#A8E6CF]", txtColor: "text-emerald-400" },
    { Icon: IconRobot, bgStart: "#E5F0FF", bgEnd: "#A0C4FF", shadow: "#3b82f6", cardTheme: "bg-[#F5F8FF] border-[#A0C4FF]", txtColor: "text-blue-400" },
    { Icon: IconCake, bgStart: "#FFFFE5", bgEnd: "#FDFFB6", shadow: "#eab308", cardTheme: "bg-[#FFFFF5] border-[#FDFFB6]", txtColor: "text-yellow-400" },
    { Icon: IconUFO, bgStart: "#E5FFFF", bgEnd: "#9BF6FF", shadow: "#06b6d4", cardTheme: "bg-[#F5FFFF] border-[#9BF6FF]", txtColor: "text-cyan-400" },
    { Icon: IconPuppy, bgStart: "#F0F0F0", bgEnd: "#DCDCDC", shadow: "#94a3b8", cardTheme: "bg-[#FAFAFA] border-[#DCDCDC]", txtColor: "text-slate-400" },
    { Icon: IconMagicWand, bgStart: "#F5FFE5", bgEnd: "#CAFFBF", shadow: "#22c55e", cardTheme: "bg-[#FAFFF5] border-[#CAFFBF]", txtColor: "text-green-400" }
];

const playSound = (type) => {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    let audioCtx = window.myAudioCtx;
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        window.myAudioCtx = audioCtx;
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    if (type === 'flip') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'match') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(800, now + 0.2);
        gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        gainNode.gain.setValueAtTime(0.15, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    }
};

const CardItem = memo(({ card, theme, onClick }) => {
    const isFlipped = card.isFlipped || card.isMatched;
    return (
        <div className={"relative w-full aspect-square cursor-pointer transition-all duration-300 " + (card.isMatched ? "opacity-0 scale-50 pointer-events-none" : "hover:scale-105")} onClick={() => onClick(card)}>
            <div className={"card-face-front clay-panel !rounded-3xl flex items-center justify-center border-[4px] border-white dark:border-slate-700 overflow-hidden bg-white/95 dark:bg-slate-800/95 shadow-xl " + (isFlipped ? "is-flipped" : "")}>
                <div className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-80 drop-shadow-lg"><theme.Icon /></div>
            </div>
            <div className={"card-face-back clay-panel !rounded-3xl flex items-center justify-center p-2 border-[4px] border-white dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl " + (isFlipped ? "is-flipped" : "")}>
                <span className={(card.type === 'hanja' ? "text-3xl sm:text-5xl md:text-7xl text-slate-700 dark:text-white" : "text-base sm:text-xl md:text-2xl text-slate-500 dark:text-slate-400") + " font-black text-center leading-tight premium-text-shadow"}>
                    {card.content}
                </span>
            </div>
        </div>
    );
});

const MatchGameScreen = ({ onBack, onHanjaAcquired, onStageClear, onMarkCorrect, onMarkWrong }) => {
    const { lang, t } = useLang();
    const getMeaning = (item) => lang === 'en' ? (item.meaning_en || item.meaning) : item.meaning;
    
    const [viewMode, setViewMode] = useState('grade');
    const categories = useMemo(() => [...new Set(HANJA_DATA.map(h => h.category).filter(Boolean))], []);
    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
    const [selectedGrade, setSelectedGrade] = useState('8급');
    const [selectedStage, setSelectedStage] = useState(null);
    const [isGradeMode, setIsGradeMode] = useState(false);

    const [cards, setCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [isLocked, setIsLocked] = useState(false);
    const [matches, setMatches] = useState(0);
    const [targetMatches, setTargetMatches] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameState, setGameState] = useState('playing');

    const currentGradeData = useMemo(() => {
        if (selectedGrade === '기타') return HANJA_DATA.filter(h => !h.grade || h.grade === '' || h.grade === '기타' || h.grade === 'NON');
        return HANJA_DATA.filter(h => h.grade === selectedGrade);
    }, [selectedGrade]);

    const currentCategoryData = useMemo(() => HANJA_DATA.filter(h => h.category === selectedCategory), [selectedCategory]);

    // 난이도별 카드 개수 계산 함수
    const getPairsCount = (stageNum) => {
        if (stageNum === 1) return 2; // 4장
        if (stageNum === 2) return 3; // 6장
        if (stageNum === 3) return 4; // 8장
        if (stageNum === 4) return 5; // 10장
        if (stageNum === 5) return 6; // 12장
        if (stageNum === 6) return 7; // 14장
        return 8; // 16장 (Max)
    };

    const initializeGame = (stageNum, fromGrade = false) => {
        const pairsToUse = getPairsCount(stageNum);
        const pool = fromGrade ? currentGradeData : currentCategoryData;

        // 중복 id 제거 후 셔플
        const uniquePool = Object.values(
            pool.reduce((acc, item) => { acc[item.id] = item; return acc; }, {})
        );
        const shuffled = [...uniquePool].sort(() => Math.random() - 0.5);
        const stageItems = shuffled.slice(0, Math.min(pairsToUse, shuffled.length));

        if (stageItems.length === 0) return;

        const newCards = [];
        stageItems.forEach((item, idx) => {
            const pairId = item.id;
            newCards.push({ uniqueId: `h-${pairId}-${idx}-${Math.random()}`, pairId, content: item.hanja, type: 'hanja', isFlipped: false, isMatched: false });
            newCards.push({ uniqueId: `m-${pairId}-${idx}-${Math.random()}`, pairId, content: getMeaning(item) + " " + item.sound, type: 'meaning', isFlipped: false, isMatched: false });
        });
        
        for (let i = newCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
        }

        setTargetMatches(stageItems.length);
        setCards(newCards);
        setFlippedCards([]);
        setMatches(0);
        setTimeLeft(60);
        setGameState('playing');
        setIsLocked(false);
        setIsGradeMode(fromGrade);
        setSelectedStage(stageNum);
    };

    useEffect(() => {
        if (selectedStage === null || gameState !== 'playing') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timer); setGameState('over'); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [selectedStage, gameState]);

    const handleCardClick = useCallback((clickedCard) => {
        if (isLocked || clickedCard.isFlipped || clickedCard.isMatched || gameState !== 'playing') return;
        setFlippedCards(prev => {
            // 이미 2장 뒤집혔거나, 같은 카드 중복 클릭 방지
            if (prev.length >= 2 || prev.find(c => c.uniqueId === clickedCard.uniqueId)) return prev;
            const next = [...prev, clickedCard];
            // 2장이 되는 순간 즉시 lock (빠른 연속 클릭 방지)
            if (next.length === 2) setIsLocked(true);
            return next;
        });
        playSound('flip');
        setCards((prev) => prev.map((card) => card.uniqueId === clickedCard.uniqueId ? { ...card, isFlipped: true } : card));
    }, [isLocked, gameState]);

    useEffect(() => {
        if (flippedCards.length === 2) {
            const [first, second] = flippedCards;
            if (first.pairId === second.pairId) {
                playSound('match');
                if (onHanjaAcquired) onHanjaAcquired(first.pairId, 0); // XP는 스테이지 클리어 시에만 지급
                if (onMarkCorrect) onMarkCorrect(first.pairId);
                setTimeout(() => {
                    setCards((prev) => prev.map((card) => card.pairId === first.pairId ? { ...card, isMatched: true } : card));
                    setFlippedCards([]);
                    setMatches((prev) => prev + 1);
                    setIsLocked(false);
                }, 500);
            } else {
                playSound('wrong');
                if (onMarkWrong) {
                    onMarkWrong(first.pairId);
                    onMarkWrong(second.pairId);
                }
                setTimeout(() => {
                    setCards((prev) => prev.map((card) => card.uniqueId === first.uniqueId || card.uniqueId === second.uniqueId ? { ...card, isFlipped: false } : card));
                    setFlippedCards([]);
                    setIsLocked(false);
                }, 900);
            }
        }
    }, [flippedCards, onHanjaAcquired, onMarkCorrect, onMarkWrong]);

    useEffect(() => {
        if (targetMatches > 0 && matches === targetMatches && gameState === 'playing') {
            setTimeout(() => {
                setGameState('clear');
                if (onStageClear && !isGradeMode) onStageClear(selectedStage);
            }, 300);
        }
    }, [matches, targetMatches, gameState]);

    const currentTheme = selectedStage !== null ? stageThemes[(selectedStage - 1) % 10] : stageThemes[0];

    // 카드 개수에 따른 동적 그리드 클래스
    const getGridClass = () => {
        const total = cards.length;
        if (total <= 4) return "grid-cols-2 max-w-md";
        if (total <= 6) return "grid-cols-3 max-w-xl";
        if (total <= 12) return "grid-cols-3 sm:grid-cols-4 max-w-3xl";
        return "grid-cols-4 max-w-5xl";
    };

    if (selectedStage === null) {
        return (
            <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden">
                <div className="w-full px-4 shrink-0 safe-top">
                    <div className="w-full flex justify-between items-center clay-panel p-4 sm:p-6 px-6 sm:px-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl border-4 border-white dark:border-slate-700">
                        <button onClick={onBack} className="text-slate-600 dark:text-slate-200 font-black bg-white/60 dark:bg-slate-800/60 px-5 sm:px-10 py-2.5 sm:py-4 rounded-2xl border-2 border-white/50 shadow-md hover:bg-white active:scale-95 transition-all flex items-center gap-2">
                            <span className="text-xl sm:text-2xl">←</span> <span>{t('backMenu').replace('← ', '')}</span>
                        </button>
                        <h1 className="text-2xl sm:text-5xl font-black text-slate-700 dark:text-white m-0 tracking-tight premium-text-shadow text-center flex-1 px-4">{t('matchTitle')}</h1>
                        <div className="w-[100px] sm:w-[140px] hidden sm:flex justify-end items-center">
                            <img src="/assets/images/characters/uju.png" alt="우주" className="w-20 h-20 object-contain animate-float" />
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto pt-4 pb-32 px-4">
                    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-10">
                        <div className="flex bg-slate-100/60 dark:bg-slate-900/60 p-2 rounded-[2rem] border-2 border-white dark:border-slate-700 shadow-inner">
                            <button onClick={() => setViewMode('topic')} className={`px-10 py-3 rounded-2xl font-black text-xl transition-all ${viewMode === 'topic' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}>주제별</button>
                            <button onClick={() => setViewMode('grade')} className={`px-10 py-3 rounded-2xl font-black text-xl transition-all ${viewMode === 'grade' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}>급수별</button>
                        </div>
                        <div className="w-full clay-panel rounded-[4rem] p-8 sm:p-14 border-4 border-white dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 shadow-[0_40px_80px_rgba(148,163,184,0.3)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                            <div className="flex flex-col gap-8 relative z-10">
                                {/* 주제 / 급수 선택 */}
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
                                {viewMode === 'grade' && (
                                    <div className="flex gap-4 justify-center flex-wrap">
                                        {['8급', '7급', '6급', '기타'].map(g => (
                                            <button
                                                key={g}
                                                onClick={() => setSelectedGrade(g)}
                                                className={"px-8 sm:px-12 py-3 sm:py-5 rounded-[2.5rem] font-black transition-all border-4 text-xl sm:text-2xl " + (selectedGrade === g ? "bg-indigo-500 text-white border-white shadow-2xl scale-110" : "bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40 shadow-lg")}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full opacity-50"></div>

                                {/* 레벨 선택 */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-10">
                                    {Array.from({length: 20}).map((_, i) => {
                                        const theme = stageThemes[i % 10]; const stageNum = i + 1;
                                        return (
                                            <button key={i} onClick={() => initializeGame(stageNum, viewMode === 'grade')} className="group text-slate-700 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col items-center justify-center gap-4 transition-all duration-300 clay-panel relative overflow-hidden border-4 border-white dark:border-slate-700 hover:shadow-2xl hover:-translate-y-2">
                                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
                                                <div className="w-14 h-14 md:w-24 md:h-24 mb-1 transition-transform group-hover:scale-125 drop-shadow-lg"><theme.Icon /></div>
                                                <span className="font-black text-2xl md:text-5xl text-slate-700 dark:text-white premium-text-shadow">Level {stageNum}</span>
                                                <span className="text-xs md:text-sm font-bold text-slate-400">카드 {getPairsCount(stageNum) * 2}장</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center p-4 h-[100dvh]">
            <div className="w-full flex justify-between items-center mb-6 clay-panel p-5 md:p-8 px-8 md:px-12 rounded-full md:rounded-[3rem] shadow-2xl border-4 border-white dark:border-slate-700 shrink-0 mt-4">
                <button onClick={() => setSelectedStage(null)} className="font-bold text-slate-600 dark:text-slate-200 bg-white/50 dark:bg-slate-800/50 px-4 md:px-8 py-2 md:py-4 rounded-2xl border-2 border-white/50 shadow-md transition-all flex items-center gap-2 text-sm md:text-2xl">
                    <span className="text-lg md:text-3xl">←</span> <span>EXIT</span>
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Level {selectedStage}</span>
                    <span className="font-black text-2xl md:text-5xl flex items-center gap-4 text-slate-700 dark:text-white">
                        <span className="premium-text-shadow">{matches} / {targetMatches}</span>
                    </span>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 px-4 md:px-8 py-2 md:py-4 rounded-2xl border-2 border-white dark:border-slate-700 shadow-xl">
                    <span className="text-rose-400 text-2xl md:text-4xl font-black tabular-nums">{timeLeft}s</span>
                </div>
            </div>

            <div className="w-full clay-panel rounded-[4rem] p-6 sm:p-10 flex-1 flex flex-col justify-center items-center relative overflow-hidden border-8 border-white dark:border-slate-700 shadow-2xl bg-white/40 dark:bg-slate-900/40">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                {gameState === 'clear' || gameState === 'over' ? (
                    <div className="text-center flex flex-col items-center z-10 w-full h-full justify-center gap-8">
                        <div className="text-9xl mb-4 animate-float">{gameState === 'clear' ? '🏆' : '⏰'}</div>
                        <h1 className={"font-black premium-text-shadow text-5xl md:text-9xl " + (gameState === 'clear' ? "text-emerald-400" : "text-rose-400")}>{gameState === 'clear' ? 'SUCCESS!' : 'TIME OVER'}</h1>
                        <p className="text-slate-600 dark:text-slate-200 font-black text-xl md:text-3xl bg-white/80 dark:bg-slate-800/80 px-12 py-6 rounded-full border-4 border-white dark:border-slate-700 shadow-2xl">
                            {gameState === 'clear' ? (selectedStage < 7 ? `Next Level: ${getPairsCount(selectedStage + 1) * 2} Cards!` : "Mastered all levels!") : "Try again!"}
                        </p>
                        <div className="flex gap-6 w-full px-8 max-w-4xl">
                            {gameState === 'clear' && selectedStage < 20 ? (
                                <button onClick={() => initializeGame(selectedStage + 1, isGradeMode)} className="flex-1 text-white font-black py-6 md:py-10 rounded-[2.5rem] shadow-2xl border-4 border-white text-2xl md:text-4xl active:scale-95 transition-all" style={{ background: 'linear-gradient(135deg, ' + currentTheme.bgStart + ', ' + currentTheme.bgEnd + ')' }}>NEXT LEVEL →</button>
                            ) : (
                                <button onClick={() => initializeGame(selectedStage, isGradeMode)} className="flex-1 text-white font-black py-6 md:py-10 rounded-[2.5rem] shadow-2xl border-4 border-white text-2xl md:text-4xl active:scale-95 transition-all" style={{ background: 'linear-gradient(135deg, ' + currentTheme.bgStart + ', ' + currentTheme.bgEnd + ')' }}>TRY AGAIN</button>
                            )}
                            <button onClick={() => setSelectedStage(null)} className="flex-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-white border-4 border-white dark:border-slate-700 font-black py-6 md:py-10 rounded-[2.5rem] shadow-2xl active:scale-95 transition-all text-2xl md:text-4xl">MENU</button>
                        </div>
                    </div>
                ) : (
                    <div className={"grid gap-4 sm:gap-6 md:gap-8 w-full h-full content-center p-4 " + getGridClass()}>
                        {cards.map((card) => (
                            <CardItem key={card.uniqueId} card={card} theme={currentTheme} onClick={handleCardClick} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchGameScreen;
