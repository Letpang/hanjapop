import { useState, useEffect, useMemo } from 'react';
import DAILY_CURRICULUM from '../data/dailyCurriculum.js';
import HANJA_DATA from '../hanja_unified.json';
import ShootGameScreen from './ShootGameScreen.jsx';
import MatchGameScreen from './MatchGameScreen.jsx';
import WordQuizScreen from './WordQuizScreen.jsx';
import SentenceQuizScreen from './SentenceQuizScreen.jsx';
import WritingScreen from './WritingScreen.jsx';
import { getRankDetails } from '../utils/rankUtils.js';

const getStoredXp = () => { try { return Number(localStorage.getItem('user_xp')) || 0; } catch { return 0; } };

const getTodayDayNumber = () => {
    try {
        const saved = JSON.parse(localStorage.getItem('total_activity_stats') || '{}');
        return Math.min(Math.max(saved.totalDays || 1, 1), 123);
    } catch { return 1; }
};

const isSessionDoneToday = () => {
    try {
        const data = JSON.parse(localStorage.getItem('daily_session') || '{}');
        return data.date === new Date().toISOString().slice(0, 10) && data.done;
    } catch { return false; }
};

const markSessionDone = () => {
    try {
        localStorage.setItem('daily_session', JSON.stringify({
            date: new Date().toISOString().slice(0, 10),
            done: true,
        }));
    } catch {}
};

// SRS에서 복습 대상 7개 뽑기
const getSrsReviewIds = (srsData, todayIds, count = 7) => {
    try {
        const now = Date.now();
        const due = Object.entries(srsData || {})
            .filter(([id, d]) => !todayIds.includes(Number(id)) && d.nextReview && d.nextReview <= now)
            .sort((a, b) => a[1].nextReview - b[1].nextReview)
            .slice(0, count)
            .map(([id]) => Number(id));
        return due;
    } catch { return []; }
};

// ── Daily Flip Cards ────────────────────────────────────────────────────────
const DailyFlashcard = ({ item, onFlip }) => {
    const [flipped, setFlipped] = useState(false);
    const [showWords, setShowWords] = useState(false);

    const handleFlip = () => {
        if (flipped) return;
        setFlipped(true);
        if (onFlip) onFlip(item.id);
        const audioId = String(item.id).padStart(2, '0');
        new Audio('/assets/audio/card_' + audioId + '.mp3').play().catch(() => {});
    };

    return (
        <div className="relative w-full max-w-[190px] aspect-[3/4] cursor-pointer shrink-0" onClick={handleFlip}>
            <div className={"card-face-front clay-panel !rounded-[2.5rem] flex flex-col items-center p-4 justify-between border-4 border-white overflow-hidden " + (flipped ? "is-flipped" : "")}>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent pointer-events-none z-10" />
                <div className="flex-1 flex items-center justify-center w-full min-h-0 py-2 relative z-0">
                    <img
                        src={`/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.webp`}
                        onError={e => { e.target.src = '/assets/images/hanja_placeholder.png'; }}
                        className="w-full h-full max-h-[120px] object-contain drop-shadow-2xl mix-blend-multiply dark:mix-blend-normal"
                        alt={item.hanja}
                    />
                </div>
                <div className="w-full bg-white/90 rounded-2xl py-3 text-center border-2 border-slate-100 shadow-inner shrink-0 mt-2 relative z-20">
                    <span className="text-4xl text-slate-700 font-black">{item.hanja}</span>
                </div>
            </div>
            <div className={"card-face-back clay-panel !rounded-[2.5rem] flex flex-col items-center justify-center p-4 border-4 border-white !bg-slate-50 " + (flipped ? "is-flipped" : "")}>
                <span className="text-indigo-500 font-black text-3xl">{item.sound}</span>
                <span className="text-slate-600 font-black text-sm text-center mt-1 break-keep">{item.meaning}</span>
                <div className="w-12 h-1 bg-indigo-100 rounded-full mt-3" />
                {item.words?.length > 0 && (
                    <button onClick={e => { e.stopPropagation(); setShowWords(v => !v); }}
                        className="mt-4 bg-white px-3 py-2.5 rounded-2xl border-2 border-indigo-100 shadow-lg active:scale-95 transition-all flex items-center gap-1.5">
                        <span className="text-lg">📖</span>
                        <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">단어</span>
                    </button>
                )}
            </div>
            {showWords && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center" style={{ margin: '-20px' }}
                    onClick={e => { e.stopPropagation(); setShowWords(false); }}>
                    <div className="clay-panel p-4 !rounded-[2rem] border-[3px] border-indigo-400 bg-white flex flex-col shadow-2xl shadow-indigo-200/50"
                        style={{ width: 'calc(100% - 8px)', maxHeight: '320px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">단어장</span>
                            <button onClick={() => setShowWords(false)} className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-black">✕</button>
                        </div>
                        <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar">
                            {item.words.map((w, i) => (
                                <div key={i} className="bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <span className="font-black text-sm text-slate-700">{w.word}</span>
                                        <span className="text-xs font-bold text-indigo-400 shrink-0">{w.reading}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 font-bold mt-0.5">{w.meaning}</div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowWords(false)} className="mt-3 w-full py-2 bg-indigo-500 text-white text-xs font-black rounded-xl">닫기</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const DailyFlashcardView = ({ items, onBack, onCardFlip, onStageClear, charId }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [flippedSet, setFlippedSet] = useState(new Set());
    const [showWords, setShowWords] = useState(false);
    const [showClearPopup, setShowClearPopup] = useState(false);

    const item = items[currentIndex];
    const isLastCard = currentIndex === items.length - 1;
    const topicColor = '#6366f1';
    const charImg = getRankDetails(getStoredXp(), charId).avatar;

    const goTo = (idx) => {
        setIsTransitioning(true);
        setShowWords(false);
        setTimeout(() => {
            setCurrentIndex(idx);
            setIsFlipped(false);
            setIsTransitioning(false);
        }, 300);
    };

    const handleCardClick = () => {
        if (showWords) return;
        if (!isFlipped) {
            setIsFlipped(true);
            const next = new Set([...flippedSet, currentIndex]);
            setFlippedSet(next);
            if (onCardFlip) onCardFlip(item.id);
            const audioId = String(item.id).padStart(2, '0');
            new Audio('/assets/audio/card_' + audioId + '.mp3').play().catch(() => {});
            if (isLastCard) setTimeout(() => setShowClearPopup(true), 600);
        } else if (!isLastCard) {
            goTo(currentIndex + 1);
        }
    };

    return (
        <>
        <div className="fixed inset-0 w-full h-full z-50 flex flex-col items-center px-6 overflow-y-auto bg-[#f8faff]">
            <div className="w-full max-w-sm mx-auto flex flex-col relative z-10 safe-top pt-4 pb-20">

                {/* Header */}
                <div className="flex items-center justify-between mb-6 bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                    <button onClick={onBack}
                        className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-black text-slate-600 gap-1">
                        <span>←</span><span className="ml-1">뒤로</span>
                    </button>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <h2 className="text-lg font-black text-slate-700 m-0">한자 카드</h2>
                        <span className="text-indigo-500 opacity-60 text-base font-bold whitespace-nowrap">{currentIndex + 1}/{items.length}</span>
                    </div>
                </div>

                {/* Progress dots */}
                <div className="flex gap-2 justify-center mb-6">
                    {items.map((_, i) => (
                        <div key={i} className="rounded-full transition-all duration-300" style={{
                            width: i === currentIndex ? '24px' : '10px',
                            height: '10px',
                            backgroundColor: flippedSet.has(i) ? '#6366f1' : i === currentIndex ? '#a5b4fc' : '#e2e8f0',
                        }} />
                    ))}
                </div>

                {/* Card */}
                <div className={`relative w-full aspect-[4/5] transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                    <div className="w-full h-full cursor-pointer flashcard-perspective" onClick={handleCardClick}>
                        <div className={`relative w-full h-full flashcard-preserve-3d transition-all duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}>

                            {/* FRONT */}
                            <div className="flashcard-face-front flex flex-col items-center justify-center overflow-hidden"
                                style={{ background: '#ffffff', border: '6px solid #ffffff', boxShadow: '0 20px 50px rgba(0,0,0,0.07)', padding: '2rem' }}>
                                <img
                                    src={`/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.webp`}
                                    onError={e => { e.target.src = '/assets/images/hanja_placeholder.png'; }}
                                    className="w-[clamp(80px,25vw,112px)] h-[clamp(80px,25vw,112px)] object-contain mb-4"
                                    alt={item.hanja}
                                />
                                <span className="font-black text-slate-800 tracking-tighter leading-none" style={{ fontSize: 'clamp(3rem, 15vw, 5rem)' }}>
                                    {item.hanja}
                                </span>
                                <div className="mt-6 px-6 py-2 rounded-full bg-slate-50 border-2 border-transparent">
                                    <span className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400">탭해서 확인</span>
                                </div>
                            </div>

                            {/* BACK */}
                            <div className="flashcard-face-back flex flex-col items-center overflow-hidden"
                                style={{ background: '#ffffff', border: '6px solid #ffffff', boxShadow: '0 20px 50px rgba(0,0,0,0.09)', padding: '2rem' }}>
                                {/* 중앙: 한자 + 구분선 + 열십 */}
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <span className="font-black tracking-tighter leading-none mb-4" style={{ fontSize: 'clamp(4rem, 20vw, 7rem)', color: '#1e293b' }}>
                                        {item.hanja}
                                    </span>
                                    <div className="w-12 h-1 rounded-full mb-5 bg-slate-300" />
                                    <div className="flex items-baseline gap-3">
                                        <span className="font-black text-slate-400 leading-tight break-keep" style={{ fontSize: 'clamp(2rem, 10vw, 3.8rem)' }}>
                                            {item.meaning}
                                        </span>
                                        <span className="font-black tracking-tighter leading-none" style={{ fontSize: 'clamp(2rem, 10vw, 3.8rem)', color: topicColor }}>
                                            {item.sound}
                                        </span>
                                    </div>
                                </div>
                                {/* 하단: 관련단어 + 완료 — 바닥 컬러바 위에 */}
                                <div className="flex flex-col items-center gap-2 mb-4">
                                    {item.words?.length > 0 && (
                                        <button onClick={e => { e.stopPropagation(); setShowWords(true); }}
                                            className="bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-all flex items-center gap-1.5">
                                            <img src="/assets/images/icons/related_words.png" className="w-10 h-10 object-contain" alt="관련단어" />
                                            <span className="text-xl font-black text-slate-300 uppercase tracking-wider">관련단어</span>
                                        </button>
                                    )}
                                    {isLastCard && (
                                        <div className="px-5 py-1.5 rounded-full bg-emerald-50">
                                            <span className="font-bold text-xs uppercase tracking-[0.2em] text-emerald-500">완료 ✓</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Words popup */}
                    {showWords && (
                        <div className="absolute inset-0 z-[100] flex items-center justify-center" onClick={() => setShowWords(false)}>
                            <div className="clay-panel p-4 !rounded-[2rem] border-[3px] border-indigo-400 bg-white flex flex-col shadow-2xl shadow-indigo-200/50"
                                style={{ width: 'calc(100% - 8px)', maxHeight: '320px' }} onClick={e => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">단어장</span>
                                    <button onClick={() => setShowWords(false)} className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-black">✕</button>
                                </div>
                                <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar">
                                    {item.words.map((w, i) => (
                                        <div key={i} className="bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <span className="font-black text-sm text-slate-700">{w.word}</span>
                                                <span className="text-xs font-bold text-indigo-400 shrink-0">{w.reading}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 font-bold mt-0.5">{w.meaning}</div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setShowWords(false)} className="mt-3 w-full py-2 bg-indigo-500 text-white text-xs font-black rounded-xl">닫기</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Nav buttons */}
                <div className="flex gap-3 w-full mt-6">
                    <button
                        disabled={currentIndex === 0}
                        onClick={() => currentIndex > 0 && goTo(currentIndex - 1)}
                        className="flex-1 clay-button py-4 rounded-[2rem] text-slate-800 font-bold text-lg shadow-xl active:scale-95 border-4 border-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        이전
                    </button>
                    <button
                        onClick={() => isFlipped && !isLastCard && goTo(currentIndex + 1)}
                        disabled={!isFlipped || isLastCard}
                        className="flex-[2] clay-button py-4 rounded-[2rem] font-bold text-lg shadow-xl active:scale-95 border-4 border-white disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ backgroundColor: (!isFlipped || isLastCard) ? undefined : topicColor, color: (!isFlipped || isLastCard) ? undefined : '#fff' }}
                    >
                        {isLastCard ? '완료' : '다음 ›'}
                    </button>
                </div>
            </div>
        </div>

        {/* Stage Clear Popup */}

        {showClearPopup && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                <div className="clay-panel p-8 max-w-sm w-full text-center flex flex-col items-center gap-4">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center shadow-inner">
                        <img src={charImg} alt="character" className="w-[130%] h-[130%] object-contain drop-shadow-lg" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800">스테이지 클리어! ✨</h2>
                    <button
                        onClick={() => { setShowClearPopup(false); onStageClear(); }}
                        className="w-full clay-button py-4 font-black text-lg text-white border-white active:scale-95 transition-all shadow-xl"
                        style={{ backgroundColor: topicColor }}
                    >
                        다음 단계 ▶▶
                    </button>
                    <button
                        onClick={() => { setShowClearPopup(false); onStageClear(); }}
                        className="w-full py-3 rounded-[1.5rem] font-bold text-sm text-slate-400 border border-slate-200 bg-slate-50 active:scale-95 transition-all"
                    >
                        공유하기
                    </button>
                </div>
            </div>
        )}
        </>
    );
};

// ── Character Data ─────────────────────────────────────────────────────────

// ── 한글팝 style road components ───────────────────────────────────────────
const PULSE_CSS = `
@keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: 0.7; }
    80%  { transform: scale(1.2); opacity: 0;   }
    100% { transform: scale(1.2); opacity: 0;   }
}
.node-pulse { position: relative; z-index: 10; }
.node-pulse::before {
    content: '';
    position: absolute;
    inset: -10px;
    border: 2px solid #818cf8;
    border-radius: 3.5rem;
    animation: pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite;
    pointer-events: none;
    z-index: -1;
}`;

// ── Single Map Node ────────────────────────────────────────────────────────
const MapNode = ({ stepNum, label, icon, isLeft, activeColor, textColor, status, charImg, onTap }) => {
    const isDone    = status === 'done';
    const isCurrent = status === 'active';
    const isLocked  = status === 'locked';

    return (
        <div className="relative w-full flex items-center justify-center" style={{ minHeight: 'clamp(60px, 10vh, 90px)' }}>
            {/* Character on spine below node */}
            {isCurrent && charImg && (
                <div className="absolute left-1/2 -translate-x-1/2 z-30 drop-shadow-xl pointer-events-none animate-bounce" style={{ top: 'calc(50% + clamp(40px, 8vh, 64px))' }}>
                    <img src={charImg} alt="" className="w-[clamp(80px,25vw,128px)] h-[clamp(80px,25vw,128px)] object-contain" />
                </div>
            )}
            {/* Spine dot */}
            <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md z-20 transition-colors duration-500 ${isLocked ? 'bg-slate-300' : 'bg-indigo-500'}`} />

            {/* Dashed connector: 36px wide, starts at spine edge (±12px from center) */}
            <div className="absolute top-1/2 -translate-y-1/2 h-0 border-t-2 border-dashed border-slate-200 z-[1]"
                style={{ width: '18px', ...(isLeft ? { right: 'calc(50% + 12px)' } : { left: 'calc(50% + 12px)' }) }} />

            {/* Icon card: starts 30px from center (12px spine + 18px dash) */}
            <div className={`absolute top-1/2 -translate-y-1/2 z-10 ${isLeft ? 'right-[calc(50%+30px)]' : 'left-[calc(50%+30px)]'}`}>
                <div className={isCurrent ? 'node-pulse' : ''}>
                    <button disabled={isLocked} onClick={isLocked ? undefined : onTap}
                        className={`w-[clamp(80px,20vw,96px)] h-[clamp(80px,20vw,96px)] rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center bg-white shadow-2xl transition-all duration-300 relative overflow-hidden
                            ${isLocked ? 'opacity-40 grayscale shadow-none border border-slate-100' : 'border-2 border-white'}
                            ${isCurrent ? 'scale-110 ring-8 ring-indigo-50/50' : ''}
                            ${!isLocked ? 'active:scale-95' : ''}`}
                    >
                        <div className="w-full h-full p-3.5 flex items-center justify-center z-10">
                            <img src={icon} className="w-full h-full object-contain" alt={label} />
                        </div>
                        {isDone && <div className="absolute top-2 right-2 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg z-20">✓</div>}
                    </button>
                </div>
            </div>

            {/* Text side */}
            <div className={`absolute top-1/2 -translate-y-1/2 flex flex-col w-[40%] ${isLeft ? 'left-[55%]' : 'right-[55%] text-right'}`}>
                <span className={`font-black mb-1 opacity-20 tracking-tighter leading-none ${isLocked ? 'text-slate-300' : textColor}`} style={{ fontSize: 'var(--text-display)' }}>{stepNum}</span>
                <span className={`font-black tracking-tight leading-tight ${isLocked ? 'text-slate-300' : 'text-slate-800'}`} style={{ fontSize: 'var(--text-h3)' }}>{label}</span>
                {isCurrent && <span className="font-black text-indigo-500 tracking-widest mt-2 animate-pulse break-keep uppercase" style={{ fontSize: 'var(--text-sm)' }}>하나씩 차례대로!</span>}
                {isDone    && <span className="font-black text-emerald-500 uppercase tracking-widest mt-1" style={{ fontSize: 'var(--text-sm)' }}>완료</span>}
            </div>
        </div>
    );
};

// ── Branch option card ─────────────────────────────────────────────────────
const BranchOption = ({ node, status, activeColor, onTap }) => {
    const isDone    = status === 'done';
    const isActive  = status === 'active';
    const isDisabled = status === 'locked' || status === 'faded';

    return (
        <div className="flex flex-col items-center gap-1.5">
            <button disabled={!isActive} onClick={isActive ? () => onTap(node.id) : undefined}
                className={`w-[clamp(72px,18vw,96px)] h-[clamp(72px,18vw,96px)] rounded-[2rem] flex items-center justify-center bg-white shadow-xl transition-all duration-300 relative overflow-hidden
                    ${isDisabled ? 'opacity-30 grayscale shadow-none border border-slate-100' : 'border-2 border-white'}
                    ${isActive ? 'active:scale-95' : ''}
                    ${isDone ? 'ring-4 ring-emerald-100' : ''}`}
            >
                <div className="w-full h-full p-3.5 flex items-center justify-center z-10">
                    <img src={node.icon} className="w-full h-full object-contain" alt={node.label} />
                </div>
                {isDone && <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs z-20">✓</div>}
            </button>
            <span className={`text-[clamp(14px,3.5vw,18px)] font-black text-center break-keep leading-tight max-w-[120px] ${isDisabled ? 'text-slate-200' : isDone ? 'text-emerald-500' : 'text-slate-600'}`}>
                {node.label}
            </span>
            {isActive && <span className="text-base font-black text-indigo-400 uppercase tracking-wider">선택</span>}
            {isDone   && <span className="text-base font-black text-emerald-400 uppercase tracking-wider">완료</span>}
        </div>
    );
};

// ── Branch Section: diamond shape on the road ──────────────────────────────
const BranchSection = ({ stepNum, sectionLabel, textColor, activeColor, leftNode, rightNode, available, chosen, stepDone, showChar, charImg, onTap }) => {
    const isCurrent = available && !stepDone;
    const isLocked  = !available;
    const isDone    = stepDone;
    const dotFill   = isLocked ? '#CBD5E1' : '#6366f1';

    const getStatus = (id) => {
        if (!available) return 'locked';
        if (stepDone) return chosen === id ? 'done' : 'faded';
        return 'active';
    };

    // Diamond geometry: 320px wide, 100px tall (flat)
    // Top(160,0) → Left(36,50) → Bottom(160,100) → Right(284,50) → Top
    const D = { cx: 160, cy: 50, top: 0, bot: 100, lx: 36, rx: 284 };

    return (
        <div className="relative w-full" style={{ zIndex: 1 }}>
            {/* Character on spine in the gap above this section */}
            {showChar && charImg && (
                <div className="absolute left-1/2 -translate-x-1/2 z-40 drop-shadow-xl pointer-events-none animate-bounce" style={{ bottom: '100%', marginBottom: '8px' }}>
                    <img src={charImg} alt="" className="w-[clamp(80px,25vw,128px)] h-[clamp(80px,25vw,128px)] object-contain" />
                </div>
            )}

            {/* Label block centered ABOVE diamond */}
            <div className={`w-full flex flex-col items-center pb-3 ${isLocked ? 'opacity-30' : ''}`}>
                <span className={`font-black opacity-20 tracking-tighter leading-none ${isLocked ? 'text-slate-300' : textColor}`} style={{ fontSize: 'var(--text-display)' }}>{stepNum}</span>
                <span className={`font-black tracking-tight leading-tight ${isLocked ? 'text-slate-300' : 'text-slate-800'}`} style={{ fontSize: 'var(--text-h3)' }}>{sectionLabel}</span>
                {isCurrent && <span className="font-black text-indigo-500 uppercase tracking-widest mt-1 animate-pulse" style={{ fontSize: 'var(--text-sm)' }}>선택하세요</span>}
                {isDone    && <span className="font-black text-emerald-500 uppercase tracking-widest mt-1" style={{ fontSize: 'var(--text-sm)' }}>완료</span>}
            </div>

            {/* Diamond area */}
            <div className="relative w-full max-w-[320px] mx-auto" style={{ height: `${D.bot}px` }}>
                {/* Diamond road SVG */}
                <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 320 ${D.bot}`} overflow="visible" style={{ zIndex: 0 }}>
                    <defs>
                        <path id="diamond-path" d={`M${D.cx},${D.top} L${D.lx},${D.cy} L${D.cx},${D.bot} L${D.rx},${D.cy} Z`} />
                    </defs>
                    {/* Road body */}
                    <use href="#diamond-path" fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth="24" strokeLinejoin="round" strokeLinecap="round" />
                    {/* Side borders */}
                    <use href="#diamond-path" fill="none" stroke="rgba(226,232,240,0.6)" strokeWidth="22" strokeLinejoin="round" />
                    {/* Inner white dashes */}
                    <use href="#diamond-path" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="28 10" />
                    {/* Dots */}
                    <circle cx={D.cx} cy={D.top} r="8" fill={dotFill} stroke="white" strokeWidth="2.5" />
                    <circle cx={D.cx} cy={D.bot} r="8" fill={dotFill} stroke="white" strokeWidth="2.5" />
                </svg>

                {/* Left option card — at left diamond point */}
                <div className="absolute z-10" style={{ left: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                    <BranchOption node={leftNode}  status={getStatus(leftNode.id)}  activeColor={activeColor} onTap={onTap} />
                </div>

                {/* Right option card — at right diamond point */}
                <div className="absolute z-10" style={{ right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                    <BranchOption node={rightNode} status={getStatus(rightNode.id)} activeColor={activeColor} onTap={onTap} />
                </div>
            </div>
        </div>
    );
};

// ── Journey Map (main map view) ────────────────────────────────────────────
const JourneyMap = ({ dayNumber, theme, charId, done, chosenGame, chosenQuiz, onTapNode, onShowResults, onBack }) => {
    const charImg = getRankDetails(getStoredXp(), charId).avatar;
    const allDone = done.has('writing');

    const currentStep = !done.has('flashcard') ? 'flashcard'
        : !done.has('game')    ? 'game'
        : !done.has('quiz')    ? 'quiz'
        : !done.has('writing') ? 'writing'
        : 'done';

    return (
        <div className="fixed inset-0 bg-[#fcfcfc] flex flex-col overflow-y-auto">
            <style>{PULSE_CSS}</style>

            {/* Header */}
            <div className="w-full shrink-0 flex flex-col items-center px-5 pt-12 pb-6 relative">
                <button onClick={onBack} className="absolute left-5 top-12 w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-md shadow-lg border-2 border-white flex items-center justify-center text-slate-800 font-extrabold text-xl active:scale-90 transition-all z-10">←</button>
                {/* Day Header */}
                <div className="flex flex-col items-center gap-2 mb-12">
                    <h1 className="font-black text-slate-800 tracking-tight leading-none" style={{ fontSize: 'var(--text-h1)' }}>DAY {dayNumber}</h1>
                    <div className="h-1.5 w-16 bg-indigo-500 rounded-full" />
                </div>
                {theme && <p className="font-bold text-indigo-400 break-keep mt-0.5" style={{ fontSize: 'var(--text-h4)' }}>{theme}</p>}
                <p className="text-slate-400 font-bold mt-1 text-center" style={{ fontSize: 'var(--text-base)' }}>하나씩 차례대로 정복해봐요!</p>
            </div>

            {/* Road */}
            <div className="flex-1 flex flex-col items-center px-4 pb-32 pt-6">
                <div className="w-full max-w-sm mx-auto">
                    {/* Steps container with spine */}
                    <div className="relative w-full flex flex-col gap-[clamp(1.5rem,6vh,3.5rem)] pt-0 pb-12">

                        {/* Spine */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-6 bg-slate-300/40 rounded-full shadow-inner border-x-2 border-slate-200/30 z-0"
                            style={{ top: 0, bottom: 'clamp(15px, 2.5vh, 25px)' }}>
                            <div className="absolute inset-0 flex flex-col items-center justify-around py-4 opacity-40">
                                {[...Array(16)].map((_, i) => (
                                    <div key={i} className="w-1 h-8 bg-white rounded-full" />
                                ))}
                            </div>
                        </div>

                        {/* 01. 한자 카드 */}
                        <MapNode
                            stepNum="01" label="한자 카드"
                            icon="/assets/images/icons/menu_flashcard.png"
                            isLeft={true} activeColor="#A8E6CF" textColor="text-emerald-600"
                            status={done.has('flashcard') ? 'done' : 'active'}
                            charImg={currentStep === 'flashcard' ? charImg : null}
                            onTap={() => onTapNode('flashcard')}
                        />

                        {/* 02. 게임 */}
                        <BranchSection
                            stepNum="02" sectionLabel="게임" textColor="text-indigo-600" activeColor="#BDB2FF"
                            leftNode={{ id: 'shoot', label: '몬스터 슈팅', icon: '/assets/images/icons/menu_shoot_game.png' }}
                            rightNode={{ id: 'match', label: '메모리 게임', icon: '/assets/images/icons/menu_match_game.png' }}
                            available={done.has('flashcard')} chosen={chosenGame} stepDone={done.has('game')}
                            showChar={currentStep === 'game'} charImg={charImg} onTap={onTapNode}
                        />

                        {/* 03. 퀴즈 */}
                        <BranchSection
                            stepNum="03" sectionLabel="퀴즈" textColor="text-blue-600" activeColor="#C7D2FE"
                            leftNode={{ id: 'word', label: '단어 퀴즈', icon: '/assets/images/icons/menu_word_quiz.png' }}
                            rightNode={{ id: 'sentence', label: '문장 퀴즈', icon: '/assets/images/icons/menu_sentence_quiz.png' }}
                            available={done.has('game')} chosen={chosenQuiz} stepDone={done.has('quiz')}
                            showChar={currentStep === 'quiz'} charImg={charImg} onTap={onTapNode}
                        />

                        {/* 04. 한자 쓰기 */}
                        <MapNode
                            stepNum="04" label="한자 쓰기"
                            icon="/assets/images/icons/menu_writing.png"
                            isLeft={false} activeColor="#FFD3B6" textColor="text-orange-600"
                            status={done.has('writing') ? 'done' : done.has('quiz') ? 'active' : 'locked'}
                            charImg={currentStep === 'writing' ? charImg : null}
                            onTap={() => onTapNode('writing')}
                        />
                    </div>

                    {/* End marker */}
                    {allDone && (
                        <div className="flex flex-col items-center gap-3 pt-6 pb-10">
                            <div className="w-10 h-10 rounded-full bg-emerald-400 shadow-lg shadow-emerald-200 flex items-center justify-center">
                                <span className="text-white text-base font-black">✓</span>
                            </div>
                            <p className="text-xs font-extrabold text-emerald-500 tracking-widest uppercase">여정 완료!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom button */}
            {allDone && (
                <div className="fixed bottom-0 left-0 right-0 px-6 pb-10 pt-6 bg-gradient-to-t from-[#fcfcfc] via-[#fcfcfc]/90 to-transparent">
                    <button onClick={onShowResults}
                        className="w-full py-5 rounded-[2.5rem] bg-indigo-500 font-black text-xl text-white shadow-2xl shadow-indigo-200 active:scale-95 transition-all">
                        결과 보기 →
                    </button>
                </div>
            )}
        </div>
    );
};

// ── Results Screen (3D Style) ───────────────────────────────────────────────
const ResultsScreen = ({ todayHanja, correctIds, onComplete, onNavigate }) => {
    const total = todayHanja.filter(h => h.id).length;
    const correct = todayHanja.filter(h => correctIds.includes(h.id)).length;
    const wrongHanja = todayHanja.filter(h => h.id && !correctIds.includes(h.id));
    const hasWrong = wrongHanja.length > 0;

    const recommendations = hasWrong
        ? [
            { label: '오답 몬스터 격파', desc: `틀린 한자 ${wrongHanja.length}개 복습`, screen: 'review', color: '#ff9a6c', icon: '/assets/images/icons/icon_monster_glossy.png' },
            { label: '한자 쓰기', desc: '획순으로 완벽하게', screen: 'writing', color: '#FFD3B6', icon: '/assets/images/icons/node_stroke_test.png' },
          ]
        : [
            { label: '단어 퀴즈', desc: '어휘력을 높여봐요', screen: 'wordQuiz', color: '#A0E4FF', icon: '/assets/images/icons/word_quiz_node.png' },
            { label: '몬스터 슈팅', desc: '실력을 더 키워봐요', screen: 'shootGame', color: '#FFADAD', icon: '/assets/images/icons/node_monster_shooting.png' },
          ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-[#FDFBF7] overflow-y-auto">
            <div className="minimal-card-studio w-full max-w-md p-10 flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500 my-8">
                <div className="w-28 h-28 minimal-icon-box bg-white border border-slate-100 shadow-inner">
                    <span className="text-6xl text-amber-400 animate-pulse">✦</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-4xl font-extrabold text-[#5D544F] tracking-tight uppercase flex items-center gap-2">
                        <span className="pastel-star-pink">✦</span>
                        학습 완료!
                        <span className="pastel-star-indigo">✦</span>
                    </h1>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">오늘의 여정을 모두 마쳤습니다</p>
                </div>

                <div className="flex gap-4">
                    {todayHanja.map((h, i) => {
                        const ok = correctIds.includes(h.id);
                        return (
                            <div key={i} className={`minimal-card w-20 h-20 flex flex-col items-center justify-center relative !border-slate-100 ${ok ? 'bg-amber-50/50' : 'bg-rose-50/50'}`}>
                                <span className={`text-3xl font-extrabold ${ok ? 'text-amber-500' : 'text-rose-300'}`}>{h.hanja}</span>
                                <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-extrabold shadow-lg ${ok ? 'bg-amber-400' : 'bg-rose-300'}`}>
                                    {ok ? '✦' : '✦'}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 추천 */}
                <div className="w-full flex flex-col gap-3">
                    <p className="text-xs font-extrabold text-slate-400 uppercase tracking-[0.2em] text-center">
                        {hasWrong ? '🔥 이 한자가 약해요 — 지금 바로 복습!' : '🎉 완벽해요! 더 연습해볼까요?'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {recommendations.map((r) => (
                            <button
                                key={r.screen}
                                onClick={() => { onComplete(); onNavigate(r.screen); }}
                                className="rounded-[1.5rem] bg-white border-4 border-white flex flex-col items-start gap-2 p-4 active:scale-95 transition-transform"
                                style={{ boxShadow: `0 6px 20px ${r.color}66` }}
                            >
                                <img src={r.icon} alt={r.label} className="w-9 h-9 object-contain" />
                                <div>
                                    <div className="font-extrabold text-slate-800 text-sm leading-tight">{r.label}</div>
                                    <div className="text-slate-400 font-bold text-xs mt-0.5">{r.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={onComplete}
                    className="pill-button-primary w-full py-5 text-xl"
                >
                    메인으로 가기 →
                </button>
            </div>
        </div>
    );
};

// ── Main Orchestrator ──────────────────────────────────────────────────────
const DailySessionScreen = ({
    onComplete,
    onNavigate,
    onAdvanceDay,
    currentDay,
    srsData,
    masteryData,
    onMarkCorrect,
    onMarkWrong,
    selectedCharacter,
    updateMissionProgress,
    addTodayStat,
    increment,
    addBonusXp,
    onHanjaAcquired,
}) => {
    const dayNumber = currentDay || getTodayDayNumber();
    const dayData = DAILY_CURRICULUM[dayNumber - 1] || DAILY_CURRICULUM[0];
    const todayHanja = dayData.hanja.filter(h => h.id !== null);

    const todayIds = useMemo(() => todayHanja.map(h => h.id), [dayNumber]);
    const reviewIds = useMemo(() => getSrsReviewIds(srsData, todayIds, 7), [dayNumber]);
    const hanjaPool = useMemo(() => [...new Set([...todayIds, ...reviewIds])], [todayIds, reviewIds]);

    const [activity, setActivity] = useState(null); // null = map view
    const [done, setDone] = useState(new Set());
    const [chosenGame, setChosenGame] = useState(null);
    const [chosenQuiz, setChosenQuiz] = useState(null);
    const [writingIdx, setWritingIdx] = useState(0);
    const [correctIds, setCorrectIds] = useState([]);
    const [showResults, setShowResults] = useState(false);

    const addCorrect = (id) => {
        if (id && !correctIds.includes(id)) setCorrectIds(prev => [...prev, id]);
    };

    const completeStep = (step, extra = {}) => {
        setDone(prev => new Set([...prev, step]));
        if (extra.chosenGame) setChosenGame(extra.chosenGame);
        if (extra.chosenQuiz) setChosenQuiz(extra.chosenQuiz);
        setActivity(null);
    };

    const handleWritingComplete = (id, score) => {
        if (score >= 70) addCorrect(id);
        if (id) score >= 70 ? onMarkCorrect(id) : onMarkWrong(id);
        if (addTodayStat) addTodayStat('writing');
        if (increment) increment('writing');
        if (updateMissionProgress) updateMissionProgress('writing', 1, addBonusXp);
        const next = writingIdx + 1;
        if (next < todayHanja.length) {
            setWritingIdx(next);
        } else {
            markSessionDone();
            if (onAdvanceDay) onAdvanceDay();
            completeStep('writing');
        }
    };

    if (showResults) {
        return (
            <ResultsScreen
                todayHanja={todayHanja}
                correctIds={correctIds}
                onComplete={onComplete}
                onNavigate={onNavigate}
            />
        );
    }

    if (activity === 'flashcard') {
        const fullItems = todayHanja.map(h => HANJA_DATA.find(d => d.id === h.id)).filter(Boolean);
        return (
            <DailyFlashcardView
                items={fullItems}
                charId={selectedCharacter}
                onBack={() => setActivity(null)}
                onCardFlip={() => {
                    if (updateMissionProgress) updateMissionProgress('flashcard', 1, addBonusXp);
                    if (addTodayStat) addTodayStat('flashcard');
                }}
                onStageClear={() => {
                    if (onHanjaAcquired) onHanjaAcquired(null, 50);
                    if (updateMissionProgress) updateMissionProgress('flashcard', 5, addBonusXp);
                    completeStep('flashcard');
                }}
            />
        );
    }

    if (activity === 'shoot') {
        return (
            <ShootGameScreen
                onBack={() => setActivity(null)}
                onGameFinish={() => {
                    if (updateMissionProgress) updateMissionProgress('shootGame', 1, addBonusXp);
                    completeStep('game', { chosenGame: 'shoot' });
                }}
                hanjaFilter={hanjaPool}
                selectedCharacter={selectedCharacter}
                onWaveClear={() => { if (addTodayStat) addTodayStat('shootGame'); if (increment) increment('shootGame'); }}
                onMarkCorrect={(id) => { addCorrect(id); onMarkCorrect(id); }}
                onMarkWrong={(id) => onMarkWrong(id)}
                masteryData={masteryData}
                srsData={srsData}
            />
        );
    }

    if (activity === 'match') {
        return (
            <MatchGameScreen
                onBack={() => setActivity(null)}
                hanjaFilter={hanjaPool}
                onStageClear={() => {
                    if (updateMissionProgress) updateMissionProgress('matchGame', 1, addBonusXp);
                    if (addTodayStat) addTodayStat('matchGame');
                    if (increment) increment('matchGame');
                    completeStep('game', { chosenGame: 'match' });
                }}
                onMarkCorrect={(id) => { addCorrect(id); onMarkCorrect(id); }}
                onMarkWrong={() => {}}
                srsData={srsData}
                masteryData={masteryData}
            />
        );
    }

    if (activity === 'word') {
        return (
            <WordQuizScreen
                onBack={() => setActivity(null)}
                hanjaFilter={hanjaPool}
                onHanjaAcquired={(id) => addCorrect(id)}
                onMarkCorrect={(id) => { addCorrect(id); onMarkCorrect(id); }}
                onMarkWrong={(id) => onMarkWrong(id)}
                srsData={srsData}
                masteryData={masteryData}
                onStageClear={() => {
                    if (updateMissionProgress) updateMissionProgress('wordQuiz', 1, addBonusXp);
                    if (addTodayStat) addTodayStat('wordQuiz');
                    completeStep('quiz', { chosenQuiz: 'word' });
                }}
            />
        );
    }

    if (activity === 'sentence') {
        return (
            <SentenceQuizScreen
                onBack={() => setActivity(null)}
                hanjaFilter={hanjaPool}
                onHanjaAcquired={(id) => addCorrect(id)}
                onMarkCorrect={(id) => { addCorrect(id); onMarkCorrect(id); }}
                onMarkWrong={(id) => onMarkWrong(id)}
                srsData={srsData}
                masteryData={masteryData}
                onStageClear={() => {
                    if (updateMissionProgress) updateMissionProgress('sentenceQuiz', 1, addBonusXp);
                    if (addTodayStat) addTodayStat('sentenceQuiz');
                    completeStep('quiz', { chosenQuiz: 'sentence' });
                }}
            />
        );
    }

    if (activity === 'writing') {
        const target = todayHanja[writingIdx];
        const hanjaObj = HANJA_DATA.find(h => h.id === target?.id) || null;
        return (
            <WritingScreen
                key={writingIdx}
                onBack={() => setActivity(null)}
                initialHanja={hanjaObj}
                onWritingComplete={(id, score) => handleWritingComplete(id || target?.id, score)}
            />
        );
    }

    return (
        <JourneyMap
            dayNumber={dayNumber}
            theme={dayData.theme}
            charId={selectedCharacter}
            done={done}
            chosenGame={chosenGame}
            chosenQuiz={chosenQuiz}
            onTapNode={(id) => setActivity(id)}
            onShowResults={() => setShowResults(true)}
            onBack={onComplete}
        />
    );
};

export { isSessionDoneToday };
export default DailySessionScreen;
