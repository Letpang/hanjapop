import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { SK } from '../constants/storageKeys.js';
import { updateRecord } from '../utils/recordUtils.js';
import DAILY_CURRICULUM from '../data/dailyCurriculum.js';
import HANJA_DATA from '../hanja_unified.json';
import { getRankDetails, getCharacterImage } from '../utils/rankUtils.js';
import { getTodayStr } from '../utils/sessionUtils.js';
import { buildUnifiedPool, buildOopsPool } from '../utils/learningPool.js';

const ShootGameScreen = lazy(() => import('./ShootGameScreen.jsx'));
const MatchGameScreen = lazy(() => import('./MatchGameScreen.jsx'));
const WordQuizScreen = lazy(() => import('./WordQuizScreen.jsx'));
const SentenceQuizScreen = lazy(() => import('./SentenceQuizScreen.jsx'));
const WritingScreen = lazy(() => import('./WritingScreen.jsx'));

const getStoredXp = () => { try { return Number(localStorage.getItem(SK.USER_XP)) || 0; } catch { return 0; } };

const getTodayDayNumber = () => {
    try {
        const saved = JSON.parse(localStorage.getItem('curriculum_progress') || '{}');
        const completed = saved.completedDay || 0;
        return Math.min(completed + 1, DAILY_CURRICULUM.length);
    } catch { return 1; }
};

const MAP_PROGRESS_KEY = 'daily_map_progress';

const markSessionDone = () => {
    try {
        localStorage.setItem(SK.DAILY_SESSION, JSON.stringify({
            date: getTodayStr(),
            done: true,
        }));
    } catch {}
};


const clearMapProgress = () => {
    try { localStorage.removeItem(MAP_PROGRESS_KEY); } catch {}
};

const speakKorean = (text, onEnd) => {
    if (!text) return;
    const audioUrl = `/assets/audio/words/word_${encodeURIComponent(text.trim())}.mp3`;
    const audio = new Audio(audioUrl);
    if (onEnd) audio.onended = onEnd;
    audio.play().catch(() => {
        if (!window.speechSynthesis) {
            if (onEnd) onEnd();
            return;
        }
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'ko-KR';
        utter.rate = 0.8;
        utter.pitch = 0.95;
        if (onEnd) utter.onend = onEnd;
        
        const voices = window.speechSynthesis.getVoices();
        const koVoices = voices.filter(v => v.lang.startsWith('ko') || v.lang.includes('ko-KR'));
        if (koVoices.length > 0) {
            const preferred = koVoices.find(v => {
                const name = v.name.toLowerCase();
                return name.includes('yuna') || name.includes('siri') || name.includes('sora') || name.includes('hyerim') || name.includes('hyejin') || name.includes('heami');
            }) || koVoices[0];
            utter.voice = preferred;
        }
        window.speechSynthesis.speak(utter);
    });
};

const playCardSound = (item) => {
    if (!item) return;
    const playTTS = () => {
        const text = (item.meaning && item.sound) ? (item.meaning + ' ' + item.sound) : (item.sound || '');
        if (text) speakKorean(text);
    };
    if (item.id <= 370) {
        const audioId = String(item.id).padStart(item.id < 51 ? 2 : 3, '0');
        const audio = new Audio('/assets/audio/card_' + audioId + '.mp3');
        audio.play().catch(() => {
            playTTS();
        });
    } else {
        playTTS();
    }
};


// ── Daily Flip Cards ────────────────────────────────────────────────────────
const DailyFlashcard = ({ item, onFlip }) => {
    const [flipped, setFlipped] = useState(false);
    const [showWords, setShowWords] = useState(false);

    const handleFlip = () => {
        if (flipped) return;
        setFlipped(true);
        if (onFlip) onFlip(item.id);
        playCardSound(item);
    };

    return (
        <div className="relative w-full max-w-[190px] aspect-[3/4] cursor-pointer shrink-0" onClick={handleFlip}>
            <div className={"card-face-front clay-panel !rounded-[2.5rem] flex flex-col items-center p-4 justify-between border-4 border-white overflow-hidden " + (flipped ? "is-flipped" : "")}>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent pointer-events-none z-10" />
                <div className="flex-1 flex items-center justify-center w-full min-h-0 py-2 relative z-0">
                    <img
                        src={`/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.webp`}
                        onError={e => { e.target.src = '/assets/images/hanja_placeholder.webp'; }}
                        className="w-full h-full max-h-[120px] object-contain drop-shadow-2xl mix-blend-multiply dark:mix-blend-normal"
                        alt={item.hanja}
                    />
                </div>
                <div className="w-full bg-white/90 rounded-2xl py-3 text-center border-2 border-[#E9EDF2] shadow-inner shrink-0 mt-2 relative z-20">
                    <span className="text-h1-res text-slate-700 font-black">{item.hanja}</span>
                </div>
            </div>
            <div className={"card-face-back clay-panel !rounded-[2.5rem] flex flex-col items-center justify-center p-4 border-4 border-white !bg-[#F8FAF9] " + (flipped ? "is-flipped" : "")}>
                <span className="text-[#FF9B73] font-black text-h2-res">{item.sound}</span>
                <span className="text-[#5B677A] font-black text-sm text-center mt-1 break-keep">{item.meaning}</span>
                <div className="w-12 h-1 bg-[#FF9B73]/15 rounded-full mt-3" />
                {item.words?.length > 0 && (
                    <button onClick={e => { e.stopPropagation(); setShowWords(v => !v); }}
                        className="mt-4 bg-white px-3 py-2.5 rounded-2xl border-2 border-[#FF9B73] shadow-lg active:scale-95 transition-all flex items-center gap-1.5">
                        <span className="text-lg">📖</span>
                        <span className="text-xs font-black text-[#FF9B73] uppercase tracking-wider">단어</span>
                    </button>
                )}
            </div>
            {showWords && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center" style={{ margin: '-20px' }}
                    onClick={e => { e.stopPropagation(); setShowWords(false); }}>
                    <div className="clay-panel p-4 !rounded-[2rem] border-[3px] border-[#7C83FF] bg-white flex flex-col shadow-2xl shadow-[#7C83FF]/20"
                        style={{ width: 'calc(100% - 8px)', maxHeight: '320px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-black text-[#7C83FF] uppercase tracking-widest">단어장</span>
                            <button onClick={() => setShowWords(false)} className="w-6 h-6 rounded-full bg-[#F4F7F8] flex items-center justify-center text-[#AEB7C5] text-sm font-black">✕</button>
                        </div>
                        <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar">
                            {item.words.map((w, i) => (
                                <div key={i} 
                                    onClick={() => speakKorean(w.reading)}
                                    className="bg-[#7C83FF]/10 px-3 py-2 rounded-xl border border-[#7C83FF]/30 cursor-pointer hover:bg-[#7C83FF]/20 active:scale-[0.98] transition-all flex flex-col justify-between">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-black text-sm text-slate-700">{w.word}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#7C83FF] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-bold text-[#7C83FF] shrink-0">{w.reading}</span>
                                    </div>
                                    <div className="text-xs text-[#5B677A] font-bold mt-0.5">{w.meaning}</div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowWords(false)} className="mt-3 w-full py-2 bg-[#7C83FF] text-white text-xs font-black rounded-xl shadow-lg shadow-[#7C83FF]/20 active:scale-[0.98] transition-all">닫기</button>
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
    const topicColor = '#7C83FF';
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
            playCardSound(item);
        } else if (!isLastCard) {
            goTo(currentIndex + 1);
        }
    };

    return (
        <>
        <div className="fixed inset-0 w-full h-full z-50 flex flex-col items-center px-6 overflow-y-auto bg-[#F7FAF9]">
            <div className="w-full max-w-sm mx-auto flex flex-col relative z-10 safe-top pt-4 pb-20">

                {/* Header */}
                <div className="flex items-center justify-between mb-6 bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                    <button onClick={onBack}
                        className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all w-11 h-11 font-black text-[#5B677A]">
                        <span>✕</span>
                    </button>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <h2 className="text-lg font-black text-slate-700 m-0">한자 카드</h2>
                        <span className="text-[#7C83FF] opacity-60 text-base font-bold whitespace-nowrap">{currentIndex + 1}/{items.length}</span>
                    </div>
                </div>

                {/* Progress dots */}
                <div className="flex gap-2 justify-center mb-6">
                    {items.map((_, i) => (
                        <div key={i} className="rounded-full transition-all duration-300" style={{
                            width: i === currentIndex ? '24px' : '10px',
                            height: '10px',
                            backgroundColor: flippedSet.has(i) ? '#7C83FF' : i === currentIndex ? '#99E6DF' : '#e2e8f0',
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
                                    onError={e => { e.target.src = '/assets/images/hanja_placeholder.webp'; }}
                                    className="w-[clamp(80px,25vw,112px)] h-[clamp(80px,25vw,112px)] object-contain mb-4"
                                    alt={item.hanja}
                                />
                                <span className="font-black text-[#3C3C3C] tracking-tighter leading-none" style={{ fontSize: 'clamp(3rem, 15vw, 5rem)' }}>
                                    {item.hanja}
                                </span>
                                <div className="mt-6 px-6 py-2 rounded-full bg-[#F8FAF9] border-2 border-transparent">
                                    <span className="font-bold text-xs uppercase tracking-[0.2em] text-[#AEB7C5]">탭해서 확인</span>
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
                                        <span className="font-black text-[#AEB7C5] leading-tight break-keep" style={{ fontSize: 'clamp(2rem, 10vw, 3.8rem)' }}>
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
                                            className="bg-white px-4 py-2.5 rounded-2xl border border-[#E9EDF2] shadow-sm active:scale-95 transition-all flex items-center gap-1.5">
                                            <img src="/assets/images/icons/related_words.webp" className="w-10 h-10 object-contain" alt="관련단어" />
                                            <span className="text-xl font-black text-[#AEB7C5] uppercase tracking-wider">관련단어</span>
                                        </button>
                                    )}
                                    {isLastCard && (
                                        <div className="px-5 py-1.5 rounded-full bg-[#7C83FF]/10">
                                            <span className="font-bold text-xs uppercase tracking-[0.2em] text-[#7C83FF]">완료 ✓</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Words popup */}
                    {showWords && (
                        <div className="absolute inset-0 z-[100] flex items-center justify-center" onClick={() => setShowWords(false)}>
                            <div className="clay-panel p-4 !rounded-[2rem] border-[3px] border-[#7C83FF] bg-white flex flex-col shadow-2xl shadow-[#7C83FF]/20"
                                style={{ width: 'calc(100% - 8px)', maxHeight: '320px' }} onClick={e => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-black text-[#7C83FF] uppercase tracking-widest">단어장</span>
                                    <button onClick={() => setShowWords(false)} className="w-6 h-6 rounded-full bg-[#F4F7F8] flex items-center justify-center text-[#AEB7C5] text-sm font-black">✕</button>
                                </div>
                                <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar">
                                    {item.words.map((w, i) => (
                                        <div key={i} 
                                            onClick={() => speakKorean(w.reading)}
                                            className="bg-[#7C83FF]/10 px-3 py-2 rounded-xl border border-[#7C83FF]/30 cursor-pointer hover:bg-[#7C83FF]/20 active:scale-[0.98] transition-all flex flex-col justify-between">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-black text-sm text-slate-700">{w.word}</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#7C83FF] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                    </svg>
                                                </div>
                                                <span className="text-xs font-bold text-[#7C83FF] shrink-0">{w.reading}</span>
                                            </div>
                                            <div className="text-xs text-[#5B677A] font-bold mt-0.5">{w.meaning}</div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setShowWords(false)} className="mt-3 w-full py-2 bg-[#7C83FF] text-white text-xs font-black rounded-xl shadow-lg shadow-[#7C83FF]/20 active:scale-[0.98] transition-all">닫기</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Nav buttons */}
                <div className="flex gap-3 w-full mt-6">
                    <button
                        disabled={currentIndex === 0}
                        onClick={() => currentIndex > 0 && goTo(currentIndex - 1)}
                        className="flex-1 clay-button py-4 rounded-[2rem] text-[#3C3C3C] font-bold text-lg shadow-xl active:scale-95 border-4 border-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        이전
                    </button>
                    <button
                        onClick={() => {
                            if (!isFlipped) return;
                            if (isLastCard) {
                                setShowClearPopup(true);
                            } else {
                                goTo(currentIndex + 1);
                            }
                        }}
                        disabled={!isFlipped}
                        className="flex-[2] clay-button py-4 rounded-[2rem] font-bold text-lg shadow-xl active:scale-95 border-4 border-white disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ backgroundColor: !isFlipped ? undefined : topicColor, color: !isFlipped ? undefined : '#fff' }}
                    >
                        {isLastCard ? '완료' : '다음 ›'}
                    </button>
                </div>
            </div>
        </div>

        {/* Stage Clear Popup */}

        {showClearPopup && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300" style={{ background: 'linear-gradient(180deg, #DDF1EA 0%, #EAF6F2 100%)' }}>
                <div className="w-full max-w-sm flex flex-col items-center result-card-container overflow-hidden">
                    <div className="pt-6 pb-12 px-8 flex flex-col items-center gap-7 w-full relative">
                        {/* 캐릭터 아래 백그라운드 글로우 추가 */}
                        <div className="absolute top-[28px] w-[140px] h-[140px] rounded-full blur-xl z-0" style={{ backgroundColor: 'rgba(255,255,255,0.65)' }} />

                        <img
                            src={getCharacterImage(charId, 'success')}
                            alt="clear"
                            className="w-[176px] h-[176px] object-contain relative z-10 mt-4"
                            style={{ filter: 'drop-shadow(0 12px 24px rgba(120,130,160,0.16))' }}
                        />
                        <div className="text-center flex flex-col gap-2 relative z-10 -mt-5">
                            <span className="text-xs-res font-extrabold text-[#AEB7C5]">3개의 한자를 모두 익혔네요!</span>
                            <h1 className="text-h2-res font-black leading-snug" style={{
                                color: '#FF9B73',
                                letterSpacing: '-0.5px',
                                textShadow: '0 2px 10px rgba(255,160,120,0.16)'
                            }}>
                                와우! 참 잘했어요!
                            </h1>
                        </div>
                        <div className="w-full flex flex-col gap-3 relative z-10">
                            <button
                                onClick={() => { setShowClearPopup(false); onStageClear(); }}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg retry-quiz-button"
                            >
                                다음 단계 ▶
                            </button>
                        </div>
                    </div>
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
    content: none;
    z-index: -1;
}`;

// ── Single Map Node ────────────────────────────────────────────────────────
const MapNode = ({ stepNum, label, icon, isLeft, activeColor, textColor, status, charImg, onTap }) => {
    const isDone    = status === 'done';
    const isCurrent = status === 'active';
    const isLocked  = status === 'locked';

    // Adjust scale for wide aspect ratio icons
    let scale = 1.0;
    if (icon && icon.includes('monster.png')) {
        scale = 1.45;
    } else if (icon && icon.includes('sentence.png')) {
        scale = 1.25;
    }

    return (
        <div className="relative w-full flex items-center justify-center" style={{ minHeight: 'clamp(60px, 10vh, 90px)' }}>
            {/* Spine dot */}
            <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md z-20 transition-colors duration-500 ${isLocked ? 'bg-slate-300' : 'bg-[#FF9B73]'}`} />

            {/* Dashed connector: 36px wide, starts at spine edge (±12px from center) */}
            <div className="absolute top-1/2 -translate-y-1/2 h-0 border-t-2 border-dashed border-[#E9EDF2] z-[1]"
                style={{ width: '18px', ...(isLeft ? { right: 'calc(50% + 12px)' } : { left: 'calc(50% + 12px)' }) }} />

            {/* Icon card: starts 30px from center (12px spine + 18px dash) */}
            <div className={`absolute top-1/2 -translate-y-1/2 z-10 ${isLeft ? 'right-[calc(50%+30px)]' : 'left-[calc(50%+30px)]'}`}>
                <div className={isCurrent ? 'node-pulse' : ''}>
                    <button disabled={isLocked} onClick={isLocked ? undefined : onTap}
                        className={`w-[clamp(80px,20vw,96px)] h-[clamp(80px,20vw,96px)] rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center bg-white shadow-2xl transition-all duration-300 relative overflow-hidden
                            ${isLocked ? 'shadow-none border border-[#E9EDF2]' : 'border-2 border-white'}
                            ${isCurrent ? 'scale-110' : ''}
                            ${!isLocked ? 'active:scale-95' : ''}`}
                        style={isCurrent ? { boxShadow: '0 8px 24px rgba(255, 155, 115 ,0.4), 0 2px 8px rgba(255, 155, 115 ,0.2)' } : undefined}
                    >
                        <div className="w-full h-full p-3.5 flex items-center justify-center z-10" style={scale !== 1.0 ? { transform: `scale(${scale})` } : undefined}>
                            <img src={icon} className="w-full h-full object-contain" alt={label} />
                        </div>
                        {isLocked && <div className="absolute inset-0 bg-[#F7FAF9] opacity-75 mix-blend-multiply z-20 rounded-[2rem]" />}
                        {isDone && <div className="absolute top-2 right-2 bg-[#FF9B73] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg z-30">✓</div>}
                    </button>
                </div>
            </div>

            {/* Text side */}
            <div className={`absolute top-1/2 -translate-y-1/2 flex flex-col w-[40%] ${isLeft ? 'left-[55%]' : 'right-[55%] text-right'}`}>
                <span className={`inline-block relative mb-1 ${isLeft ? 'self-start' : 'self-end'}`}>
                    <span className={`font-black tracking-tighter leading-none ${isLocked ? 'text-[#AEB7C5]' : 'text-[#FF9B73]'} text-h2-res`} style={{ textShadow: '0 0 8px #fff, 0 0 16px #fff' }}>{stepNum}</span>
                    {isCurrent && charImg && (
                        <img src={charImg} alt="" className="absolute top-1/2 -translate-y-1/2 left-full ml-1 w-[clamp(36px,10vw,52px)] h-[clamp(36px,10vw,52px)] object-contain drop-shadow-xl pointer-events-none" />
                    )}
                </span>
                <span className={`font-black tracking-tight leading-tight ${isLocked ? 'text-[#AEB7C5]' : 'text-[#334155]'} text-h3`} style={{ textShadow: '0 0 8px #fff, 0 0 16px #fff' }}>{label}</span>
                {isDone    && <span className="font-black text-[#FF9B73] uppercase tracking-widest mt-1 text-sm-res" style={{ textShadow: '0 0 8px #fff, 0 0 16px #fff' }}>완료</span>}
            </div>
        </div>
    );
};

// ── Branch option card ─────────────────────────────────────────────────────
const BranchOption = ({ node, status, activeColor, onTap }) => {
    const isDone    = status === 'done';
    const isActive  = status === 'active';
    const isDisabled = status === 'locked' || status === 'faded';

    // Adjust scale for wide aspect ratio icons
    let scale = 1.0;
    if (node.icon && node.icon.includes('monster.png')) {
        scale = 1.45;
    } else if (node.icon && node.icon.includes('sentence.png')) {
        scale = 1.25;
    }

    return (
        <div className="flex flex-col items-center gap-1.5">
            <button disabled={!isActive} onClick={isActive ? () => onTap(node.id) : undefined}
                className={`w-[clamp(72px,18vw,96px)] h-[clamp(72px,18vw,96px)] rounded-[2rem] flex items-center justify-center bg-white shadow-xl transition-all duration-300 relative overflow-hidden
                    ${isDisabled ? 'shadow-none border border-[#E9EDF2]' : 'border-2 border-white'}
                    ${isActive ? 'active:scale-95' : ''}
                    ${isDone ? 'ring-4 ring-[#FF9B73]/20' : ''}`}
            >
                <div className="w-full h-full p-3.5 flex items-center justify-center z-10" style={scale !== 1.0 ? { transform: `scale(${scale})` } : undefined}>
                    <img src={node.icon} className="w-full h-full object-contain" alt={node.label} />
                </div>
                {isDisabled && <div className="absolute inset-0 bg-[#F7FAF9] opacity-75 mix-blend-multiply z-20 rounded-[2rem]" />}
                {isDone && <div className="absolute top-1.5 right-1.5 bg-[#FF9B73] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs z-30">✓</div>}
            </button>
            <span className={`text-[clamp(14px,3.5vw,18px)] font-black text-center break-keep leading-tight max-w-[120px] ${isDisabled ? 'text-[#AEB7C5] opacity-100 saturate-[30%] contrast-75 brightness-110' : isDone ? 'text-[#FF9B73] opacity-100' : 'text-[#5B677A] opacity-100'}`}>
                {node.label}
            </span>
            {isDone   && <span className="text-base font-black text-[#FF9B73] uppercase tracking-wider">완료</span>}
        </div>
    );
};

// ── Branch Section: diamond shape on the road ──────────────────────────────
const BranchSection = ({ stepNum, sectionLabel, textColor, activeColor, leftNode, rightNode, available, chosen, stepDone, showChar, charImg, onTap }) => {
    const isCurrent = available && !stepDone;
    const isLocked  = !available;
    const isDone    = stepDone;
    const dotFill   = isLocked ? '#CBD5E1' : '#FF9B73';

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
            {/* Label block centered ABOVE diamond */}
            <div className={`w-full flex flex-col items-center pb-3`}>
                <span className="inline-block relative mb-0">
                    <span className={`font-black tracking-tighter leading-none ${isLocked ? 'text-[#AEB7C5]' : 'text-[#FF9B73]'} text-h2-res`} style={{ textShadow: '0 0 8px #fff, 0 0 16px #fff' }}>{stepNum}</span>
                    {isCurrent && charImg && (
                        <img src={charImg} alt="" className="absolute top-1/2 -translate-y-1/2 left-full ml-1 w-[clamp(36px,10vw,52px)] h-[clamp(36px,10vw,52px)] object-contain drop-shadow-xl pointer-events-none" />
                    )}
                </span>
                <span className={`font-black tracking-tight leading-tight ${isLocked ? 'text-[#AEB7C5]' : 'text-[#334155]'} text-h3`} style={{ textShadow: '0 0 8px #fff, 0 0 16px #fff' }}>{sectionLabel}</span>
                {isCurrent && <span className="font-black text-[#FF9B73] uppercase tracking-widest mt-1 animate-pulse text-sm-res whitespace-nowrap" style={{ textShadow: '0 0 8px #fff, 0 0 16px #fff' }}>선택하세요</span>}
                {isDone    && <span className="font-black text-[#FF9B73] uppercase tracking-widest mt-1 text-sm-res whitespace-nowrap" style={{ textShadow: '0 0 8px #fff, 0 0 16px #fff' }}>완료</span>}
            </div>

            {/* Diamond area */}
            <div className="relative w-full max-w-[320px] mx-auto" style={{ height: `${D.bot}px` }}>
                {/* Diamond road SVG */}
                <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 320 ${D.bot}`} overflow="visible" style={{ zIndex: 0 }}>
                    <defs>
                        <path id="diamond-path" d={`M${D.cx},${D.top} L${D.lx},${D.cy} L${D.cx},${D.bot} L${D.rx},${D.cy} Z`} />
                    </defs>
                    {/* Background fill to block spine inside diamond */}
                    <use href="#diamond-path" fill="#F7FAF9" stroke="none" />
                    {/* Road body */}
                    <use href="#diamond-path" fill="none" stroke="rgba(200,221,216,0.45)" strokeWidth="24" strokeLinejoin="round" strokeLinecap="round" />
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
        : !done.has('quiz')    ? 'quiz'
        : !done.has('game')    ? 'game'
        : !done.has('writing') ? 'writing'
        : 'done';

    return (
        <div className="fixed inset-0 bg-[#F7FAF9] flex flex-col overflow-y-auto">
            <style>{PULSE_CSS}</style>

            {/* Header */}
            <div className="w-full shrink-0 flex flex-col items-center px-5 pt-12 pb-6 relative">
                <button onClick={onBack} className="absolute left-5 top-12 w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-md shadow-lg border-2 border-white flex items-center justify-center text-[#3C3C3C] font-extrabold text-xl active:scale-90 transition-all z-10">←</button>
                {/* Stage Header */}
                <div className="flex flex-col items-center gap-2 mb-6">
                    <h1 className="font-black text-[#3C3C3C] tracking-tight leading-none text-h1">STAGE {dayNumber}</h1>
                    <div className="h-1.5 w-16 bg-[#FF9B73] rounded-full" />
                </div>
                {theme && <p className="font-bold text-[#FF9B73] break-keep mt-0.5 text-body-lg">{theme}</p>}
                <p className="text-[#AEB7C5] font-bold mt-1 text-center text-body-lg">하나씩 차례대로 정복해봐요!</p>
            </div>

            {/* Road */}
            <div className="flex-1 flex flex-col items-center px-4 pb-10 pt-6">
                <div className="w-full max-w-sm mx-auto">
                    {/* Steps container with spine */}
                    <div className="relative w-full flex flex-col gap-[clamp(1.5rem,6vh,3.5rem)] pt-0 pb-12">

                        {/* Spine */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-6 rounded-full z-0"
                            style={{ top: 0, bottom: 'clamp(15px, 2.5vh, 25px)', backgroundColor: 'rgba(200,221,216,0.45)' }} />

                        {/* 01. 한자 카드 */}
                        <MapNode
                            stepNum="01" label="한자 카드"
                            icon="/assets/images/icons/study.png"
                            isLeft={true} activeColor="#FF9B73" textColor="text-[#FF9B73]"
                            status={done.has('flashcard') ? 'done' : 'active'}
                            charImg={currentStep === 'flashcard' ? charImg : null}
                            onTap={() => onTapNode('flashcard')}
                        />

                        {/* 02. 퀴즈 */}
                        <BranchSection
                            stepNum="02" sectionLabel="퀴즈" textColor="text-[#FF9B73]" activeColor="#FF9B73"
                            leftNode={{ id: 'word', label: '단어 퀴즈', icon: '/assets/images/icons/words.png' }}
                            rightNode={{ id: 'sentence', label: '문장 퀴즈', icon: '/assets/images/icons/sentence.png' }}
                            available={done.has('flashcard')} chosen={chosenQuiz} stepDone={done.has('quiz')}
                            showChar={currentStep === 'quiz'} charImg={charImg} onTap={onTapNode}
                        />

                        {/* 03. 게임 */}
                        <BranchSection
                            stepNum="03" sectionLabel="게임" textColor="text-[#FF9B73]" activeColor="#FF9B73"
                            leftNode={{ id: 'shoot', label: '몬스터 슈팅', icon: '/assets/images/icons/monster.png' }}
                            rightNode={{ id: 'match', label: '메모리 게임', icon: '/assets/images/icons/matching.png' }}
                            available={done.has('quiz')} chosen={chosenGame} stepDone={done.has('game')}
                            showChar={currentStep === 'game'} charImg={charImg} onTap={onTapNode}
                        />

                        {/* 04. 한자 쓰기 */}
                        <MapNode
                            stepNum="04" label="한자 쓰기"
                            icon="/assets/images/icons/writing.png"
                            isLeft={false} activeColor="#FFD3B6" textColor="text-orange-600"
                            status={done.has('writing') ? 'done' : done.has('game') ? 'active' : 'locked'}
                            charImg={currentStep === 'writing' ? charImg : null}
                            onTap={() => onTapNode('writing')}
                        />
                    </div>

                    {/* End marker + 결과 보기 버튼 */}
                    {allDone && (
                        <div className="flex flex-col items-center gap-4 pt-6 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-10 h-10 rounded-full bg-[#FF9B73] shadow-lg shadow-[#FF9B73]/20 flex items-center justify-center">
                                <span className="text-white text-base font-black">✓</span>
                            </div>
                            <p className="text-xs font-extrabold text-[#FF9B73] tracking-widest uppercase">스테이지 완료!</p>
                            <button onClick={onShowResults}
                                className="w-full py-5 rounded-[2.5rem] bg-[#FF9B73] font-black text-xl text-white shadow-2xl shadow-[#FF9B73]/20 active:scale-95 transition-all mt-2">
                                결과 보기 →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Results Screen (3D Style) ───────────────────────────────────────────────
const ResultsScreen = ({ todayHanja, correctIds, wrongIds = [], onComplete, onNavigate, selectedCharacter, chosenGame, chosenQuiz }) => {
    const total = todayHanja.filter(h => h.id).length;
    const unchosenGame = chosenGame === 'shoot'
        ? { label: '짝 맞추기',   desc: '카드를 짝지어 맞춰요', screen: 'matchGame',    icon: '/assets/images/icons/past/menu_match_game.webp' }
        : { label: '몬스터 슈팅', desc: '한자로 몬스터 격파',   screen: 'shootGame',    icon: '/assets/images/icons/past/menu_shoot_game.webp' };

    const unchosenQuiz = chosenQuiz === 'word'
        ? { label: '문장 퀴즈', desc: '문장 속 한자를 익혀요', screen: 'sentenceQuiz', icon: '/assets/images/icons/past/menu_sentence_quiz.webp' }
        : { label: '단어 퀴즈', desc: '어휘력을 높여봐요',     screen: 'wordQuiz',     icon: '/assets/images/icons/past/menu_word_quiz.webp' };

    const recommendations = [
        { label: '한자 학습지', desc: '카드로 한자 복습', screen: 'flashcard', icon: '/assets/images/icons/past/menu_flashcard.webp' },
        unchosenQuiz,
        unchosenGame,
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300 overflow-y-auto"
            style={{ background: 'linear-gradient(180deg, #DDF1EA 0%, #EAF6F2 100%)' }}
        >
            <div className="w-full max-w-sm flex flex-col items-center result-card-container overflow-hidden my-4">
                <div className="pt-6 pb-8 px-6 flex flex-col items-center gap-6 w-full relative">

                    {/* 캐릭터 글로우 */}
                    <div className="absolute top-[28px] w-[140px] h-[140px] rounded-full blur-xl z-0"
                        style={{ backgroundColor: 'rgba(255,255,255,0.65)' }} />

                    {/* 캐릭터 */}
                    <img
                        src={getCharacterImage(selectedCharacter, 'success')}
                        alt="success"
                        className="w-[160px] h-[160px] object-contain relative z-10 mt-4"
                        style={{ filter: 'drop-shadow(0 12px 24px rgba(120,130,160,0.16))' }}
                    />

                    {/* 타이틀 */}
                    <div className="text-center flex flex-col gap-2 relative z-10 -mt-4">
                        <span className="text-sm font-extrabold text-[#AEB7C5] break-keep">{total}개의 한자를 모두 익혔네요!</span>
                        <h1 className="text-h2-res font-black leading-snug break-keep"
                            style={{ color: '#FF9B73', letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(255,160,120,0.16)' }}>
                            와우! 참 잘했어요!
                        </h1>
                    </div>

                    {/* 한자 카드 3개 — 플래시카드 뒷면 스타일 */}
                    <div className="flex gap-2.5 w-full relative z-10">
                        {todayHanja.filter(h => h.id).map((h, i) => (
                            <div key={i} className="flex-1 clay-panel !rounded-[1.6rem] flex flex-col items-center justify-center py-4 px-2 gap-1 border-[3px] border-white !bg-[#F8FAF9]">
                                <span className="text-3xl font-black text-slate-700 leading-none">{h.hanja}</span>
                                <span className="text-sm font-black text-[#FF9B73] leading-tight">{h.sound}</span>
                                <span className="text-[11px] font-bold text-[#5B677A] text-center break-keep leading-tight">{h.meaning}</span>
                            </div>
                        ))}
                    </div>

                    {/* 추천 버튼 */}
                    <div className="w-full flex flex-col gap-2.5 relative z-10">
                        <p className="text-xs font-extrabold text-center" style={{ color: '#2ED6C5' }}>
                            이런 메뉴들도 한 번 해봐요!
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {recommendations.map(r => (
                                <button key={r.screen}
                                    onClick={() => onNavigate(r.screen)}
                                    className="bg-white/80 py-3 px-2 rounded-2xl flex flex-col items-center gap-1 active:scale-95 transition-all border-2 border-white shadow-sm">
                                    <img src={r.icon} alt={r.label} className="w-10 h-10 object-contain" />
                                    <span className="font-extrabold text-xs text-[#3C3C3C] leading-tight text-center">{r.label}</span>
                                    <span className="text-[10px] font-bold text-[#AEB7C5] text-center leading-tight">{r.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 메인으로 가기 */}
                    <button
                        onClick={onComplete}
                        className="w-full py-4 rounded-[2rem] font-black text-xl text-white active:scale-95 transition-all relative z-10"
                        style={{ backgroundColor: '#FF9B73', borderBottom: '5px solid #E0735A', boxShadow: '0 8px 24px rgba(255,155,115,0.35)' }}
                    >
                        메인으로 가기 →
                    </button>
                </div>
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
    onMarkWordWrong,
    onWordCorrect,
    onWordSeen,
    selectedCharacter,
    updateMissionProgress,
    addTodayStat,
    increment,
    addBonusXp,
    onHanjaAcquired,
    userXp,
}) => {
    // dayNumber를 마운트 시점의 값으로 고정 (advanceDay 후 currentDay가 증가해도 현재 세션 스테이지 번호 유지)
    const [dayNumber] = useState(() => currentDay || getTodayDayNumber());
    const dayData = DAILY_CURRICULUM[dayNumber - 1] || DAILY_CURRICULUM[0];
    const todayHanja = dayData.hanja.filter(h => h.id !== null);

    const todayIds = useMemo(() => todayHanja.map(h => h.id), [dayNumber]);

    // 이전 스테이지 한자 ID (SRS 복습 후보)
    const pastHanjaIds = useMemo(() => {
        const result = [];
        for (let d = 0; d < dayNumber - 1 && d < DAILY_CURRICULUM.length; d++) {
            (DAILY_CURRICULUM[d].hanja || []).forEach(h => { if (h.id) result.push(h.id); });
        }
        return result;
    }, [dayNumber]);

    // 오늘(70%) + SRS 과거(30%) 통합 풀
    const contentPool = useMemo(() =>
        buildUnifiedPool(todayIds, HANJA_DATA, srsData, masteryData, pastHanjaIds),
        [todayIds, srsData, masteryData, pastHanjaIds]
    );

    const [activity, setActivity] = useState(null); // null = map view
    const [done, setDone] = useState(new Set());
    const [chosenGame, setChosenGame] = useState(null);
    const [chosenQuiz, setChosenQuiz] = useState(null);
    const [seenHanjaIds, setSeenHanjaIds] = useState([]);
    const [seenWordIds, setSeenWordIds] = useState([]);

    const markHanjaSeen = useCallback((ids) => {
        if (!ids?.length) return;
        setSeenHanjaIds(prev => {
            const s = new Set(prev);
            ids.forEach(id => { if (id != null) s.add(id); });
            return prev.length === s.size ? prev : [...s];
        });
    }, []);

    const markWordSeen = useCallback((ids) => {
        if (!ids?.length) return;
        setSeenWordIds(prev => {
            const s = new Set(prev);
            ids.forEach(id => { if (id != null) s.add(id); });
            return prev.length === s.size ? prev : [...s];
        });
    }, []);
    const [writingIdx, setWritingIdx] = useState(0);
    const [correctIds, setCorrectIds] = useState([]);
    const [wrongIds, setWrongIds] = useState([]);
    const [wrongWordIds, setWrongWordIds] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const mapRestoredRef = useRef(false);

    // 이전 진행 상황 복원 (같은 day이고 writing 미완료인 경우만)
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(MAP_PROGRESS_KEY) || '{}');
            if (saved.day === dayNumber && saved.done?.length > 0) {
                if (saved.done.includes('writing')) {
                    // writing까지 완료된 오래된 데이터 — 삭제 후 복원하지 않음
                    clearMapProgress();
                } else {
                    setDone(new Set(saved.done));
                    if (saved.chosenGame) setChosenGame(saved.chosenGame);
                    if (saved.chosenQuiz) setChosenQuiz(saved.chosenQuiz);
                }
            }
        } catch {}
        mapRestoredRef.current = true;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // done/chosenGame/chosenQuiz 변경 시 localStorage에 저장 (writing 완료 후에는 저장 안 함)
    useEffect(() => {
        if (!mapRestoredRef.current) return;
        if (done.size === 0) return;
        if (done.has('writing')) return;
        try {
            localStorage.setItem(MAP_PROGRESS_KEY, JSON.stringify({
                day: dayNumber,
                done: [...done],
                chosenGame,
                chosenQuiz,
            }));
        } catch {}
    }, [done, chosenGame, chosenQuiz, dayNumber]);

    const addCorrect = (id) => {
        if (!id || !todayIds.includes(id)) return;
        setCorrectIds(prev => prev.includes(id) ? prev : [...prev, id]);
        setWrongIds(prev => prev.filter(w => w !== id));
        try {
            const h = HANJA_DATA.find(x => x.id === id);
            if (h && h.words) {
                const wIds = h.words.map(w => w.id).filter(Boolean);
                if (wIds.length > 0) {
                    setWrongWordIds(prev => prev.filter(wId => !wIds.includes(wId)));
                }
            }
        } catch (e) {}
    };

    const addWrong = (id) => {
        if (!id || !todayIds.includes(id)) return;
        setWrongIds(prev => prev.includes(id) ? prev : [...prev, id]);
        setCorrectIds(prev => prev.filter(c => c !== id));
    };

    const completeStep = (step, extra = {}) => {
        setDone(prev => new Set([...prev, step]));
        if (extra.chosenGame) setChosenGame(extra.chosenGame);
        if (extra.chosenQuiz) setChosenQuiz(extra.chosenQuiz);
        setActivity(null);
    };

    const handleWritingComplete = (id, score) => {
        if (score >= 70) addCorrect(id);
        if (id && score >= 70 && onMarkCorrect) onMarkCorrect(id);
        if (addTodayStat) addTodayStat('writing');
        if (increment) increment('writing');
        if (updateMissionProgress) updateMissionProgress('writing', 1, addBonusXp);
        const next = writingIdx + 1;
        if (next < todayHanja.length) {
            setWritingIdx(next);
        } else {
            clearMapProgress();
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
                wrongIds={wrongIds}
                onComplete={() => onComplete()}
                onNavigate={(screen) => onNavigate(screen)}
                selectedCharacter={selectedCharacter}
                chosenGame={chosenGame}
                chosenQuiz={chosenQuiz}
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
                    todayIds.forEach(id => addCorrect(id));
                    completeStep('flashcard');
                }}
            />
        );
    }

    // 오답이 있으면 오답 풀, 없으면 통합 풀
    const activePool = (wrongIds.length > 0 || wrongWordIds.length > 0)
        ? buildOopsPool(wrongIds, wrongWordIds)
        : contentPool;

    if (activity === 'shoot') {
        return (
            <Suspense fallback={<div className="min-h-screen bg-[#F7FAF9]" />}>
            <ShootGameScreen
                onBack={() => setActivity(null)}
                onGameFinish={() => {
                    if (updateMissionProgress) updateMissionProgress('shootGame', 1, addBonusXp);
                    completeStep('game', { chosenGame: 'shoot' });
                }}
                contentPool={activePool}
                selectedCharacter={selectedCharacter}
                onWaveClear={(kills) => { if (addTodayStat) addTodayStat('shootGame'); if (increment) increment('shootGame'); if (kills) updateRecord('totalMonsterKills', kills); }}
                onMarkCorrect={(id) => { addCorrect(id); onMarkCorrect(id); }}
                onMarkWrong={(id) => { addWrong(id); onMarkWrong(id); }}
                masteryData={masteryData}
                srsData={srsData}
                currentDay={dayNumber}
                seenHanjaIds={seenHanjaIds}
                onHanjaSeen={(ids) => markHanjaSeen(ids)}
                seenWordIds={seenWordIds}
                onWordSeen={(wordId) => { markWordSeen([wordId]); if (onWordSeen) onWordSeen(wordId); }}
                onWordCorrect={(wordId) => { if (onWordCorrect) onWordCorrect(wordId); }}
            />
            </Suspense>
        );
    }

    if (activity === 'match') {
        return (
            <Suspense fallback={<div className="min-h-screen bg-[#F7FAF9]" />}>
            <MatchGameScreen
                onBack={() => setActivity(null)}
                contentPool={activePool}
                onStageClear={(round, elapsedSec) => {
                    if (updateMissionProgress) updateMissionProgress('matchGame', 1, addBonusXp);
                    if (addTodayStat) addTodayStat('matchGame');
                    if (increment) increment('matchGame');
                    if (elapsedSec != null) updateRecord('matchBestTime', elapsedSec);
                    completeStep('game', { chosenGame: 'match' });
                }}
                onMarkCorrect={(id) => { addCorrect(id); onMarkCorrect(id); }}
                onMarkWrong={() => {}}
                srsData={srsData}
                masteryData={masteryData}
                seenHanjaIds={seenHanjaIds}
                onHanjaSeen={(ids) => markHanjaSeen(ids)}
                seenWordIds={seenWordIds}
                onWordSeen={(wordId) => { markWordSeen([wordId]); if (onWordSeen) onWordSeen(wordId); }}
                onWordCorrect={(wordId) => { if (onWordCorrect) onWordCorrect(wordId); }}
            />
            </Suspense>
        );
    }

    if (activity === 'word') {
        return (
            <Suspense fallback={<div className="min-h-screen bg-[#F7FAF9]" />}>
            <WordQuizScreen
                onBack={() => setActivity(null)}
                contentPool={contentPool}
                selectedCharacter={selectedCharacter}
                userXp={userXp}
                onMarkWordWrong={(wordId, hanjaId, reading, meaning, wordText) => {
                    addWrong(hanjaId);
                    if (wordId) {
                        setWrongWordIds(prev => prev.includes(wordId) ? prev : [...prev, wordId]);
                    }
                    if (onMarkWordWrong) onMarkWordWrong(wordId, hanjaId, reading, meaning, wordText);
                }}
                onWordCorrect={(wordId) => {
                    if (wordId) {
                        setWrongWordIds(prev => prev.filter(wId => wId !== wordId));
                        if (onWordCorrect) onWordCorrect(wordId);
                    }
                }}
                srsData={srsData}
                masteryData={masteryData}
                onStageClear={(correct, total, maxCombo, newSeenIds) => {
                    if (newSeenIds) markHanjaSeen(newSeenIds);
                    if (updateMissionProgress) updateMissionProgress('wordQuiz', 1, addBonusXp);
                    if (addTodayStat) addTodayStat('wordQuiz');
                    if (correct != null) updateRecord('wordBestScore', correct);
                    if (maxCombo) updateRecord('wordMaxCombo', maxCombo);
                    completeStep('quiz', { chosenQuiz: 'word' });
                }}
                seenHanjaIds={seenHanjaIds}
                seenWordIds={seenWordIds}
                onWordSeen={(wordId) => { markWordSeen([wordId]); if (onWordSeen) onWordSeen(wordId); }}
            />
            </Suspense>
        );
    }

    if (activity === 'sentence') {
        return (
            <Suspense fallback={<div className="min-h-screen bg-[#F7FAF9]" />}>
            <SentenceQuizScreen
                onBack={() => setActivity(null)}
                contentPool={contentPool}
                selectedCharacter={selectedCharacter}
                userXp={userXp}
                onMarkWordWrong={(wordId, hanjaId, reading, meaning, wordText) => {
                    addWrong(hanjaId);
                    if (wordId) {
                        setWrongWordIds(prev => prev.includes(wordId) ? prev : [...prev, wordId]);
                    }
                    if (onMarkWordWrong) onMarkWordWrong(wordId, hanjaId, reading, meaning, wordText);
                }}
                onWordCorrect={(wordId) => {
                    if (wordId) {
                        setWrongWordIds(prev => prev.filter(wId => wId !== wordId));
                        if (onWordCorrect) onWordCorrect(wordId);
                    }
                }}
                srsData={srsData}
                masteryData={masteryData}
                seenHanjaIds={seenHanjaIds}
                seenWordIds={seenWordIds}
                onWordSeen={(wordId) => { markWordSeen([wordId]); if (onWordSeen) onWordSeen(wordId); }}
                onStageClear={(correct, total, newSeenIds) => {
                    if (newSeenIds) markHanjaSeen(newSeenIds);
                    if (updateMissionProgress) updateMissionProgress('sentenceQuiz', 1, addBonusXp);
                    if (addTodayStat) addTodayStat('sentenceQuiz');
                    completeStep('quiz', { chosenQuiz: 'sentence' });
                }}
            />
            </Suspense>
        );
    }

    if (activity === 'writing') {
        return (
            <Suspense fallback={<div className="min-h-screen bg-[#F7FAF9]" />}>
            <WritingScreen
                onBack={() => setActivity(null)}
                hanjaFilter={todayIds}
                onWritingComplete={(id, score) => {
                    if (score >= 70) addCorrect(id);
                    if (id && score >= 70 && onMarkCorrect) onMarkCorrect(id);
                    if (addTodayStat) addTodayStat('writing');
                    if (increment) increment('writing');
                    if (updateMissionProgress) updateMissionProgress('writing', 1, addBonusXp);
                }}
                onStageClear={() => {
                    clearMapProgress();
                    markSessionDone();
                    if (onAdvanceDay) onAdvanceDay();
                    completeStep('writing');
                }}
                userXp={getStoredXp()}
                selectedCharacter={selectedCharacter}
            />
            </Suspense>
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

export default DailySessionScreen;
