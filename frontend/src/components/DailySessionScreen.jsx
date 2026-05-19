import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { SK } from '../constants/storageKeys.js';
import { updateRecord } from '../utils/recordUtils.js';
import DAILY_CURRICULUM from '../data/dailyCurriculum.js';
import HANJA_DATA from '../hanja_unified.json';
import { getRankDetails, getCharacterImage } from '../utils/rankUtils.js';

const ShootGameScreen = lazy(() => import('./ShootGameScreen.jsx'));
const MatchGameScreen = lazy(() => import('./MatchGameScreen.jsx'));
const WordQuizScreen = lazy(() => import('./WordQuizScreen.jsx'));
const SentenceQuizScreen = lazy(() => import('./SentenceQuizScreen.jsx'));
const WritingScreen = lazy(() => import('./WritingScreen.jsx'));

const getStoredXp = () => { try { return Number(localStorage.getItem(SK.USER_XP)) || 0; } catch { return 0; } };

const getTodayDayNumber = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(SK.TOTAL_ACTIVITY_STATS) || '{}');
        return Math.min(Math.max(saved.totalDays || 1, 1), 123);
    } catch { return 1; }
};

const markSessionDone = () => {
    try {
        localStorage.setItem(SK.DAILY_SESSION, JSON.stringify({
            date: new Date().toISOString().slice(0, 10),
            done: true,
        }));
    } catch {}
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
    const [showExitModal, setShowExitModal] = useState(false);

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
            if (isLastCard) setTimeout(() => setShowClearPopup(true), 600);
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
                    <button onClick={() => setShowExitModal(true)}
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
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300" style={{ background: 'linear-gradient(180deg, #DDF1EA 0%, #EAF6F2 100%)' }}>
                <div className="w-full max-w-sm flex flex-col items-center result-card-container overflow-hidden">
                    <div className="pt-6 pb-12 px-8 flex flex-col items-center gap-7 w-full relative">
                        {/* 캐릭터 아래 백그라운드 글로우 추가 */}
                        <div className="absolute top-[28px] w-[140px] h-[140px] rounded-full blur-xl z-0" style={{ backgroundColor: 'rgba(255,255,255,0.65)' }} />

                        <img
                            src={getCharacterImage(selectedCharacter, 'success')}
                            alt="clear"
                            className="w-[176px] h-[176px] object-contain relative z-10 mt-4"
                            style={{ filter: 'drop-shadow(0 12px 24px rgba(120,130,160,0.16))' }}
                        />
                        <div className="text-center flex flex-col gap-2 relative z-10 -mt-5">
                            <span className="text-xs-res font-extrabold text-[#AEB7C5]">정말 멋진 결과예요!</span>
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
                                다음 단계 ▶▶
                            </button>
                            <button
                                onClick={() => { setShowClearPopup(false); onStageClear(); }}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg active:scale-95 transition-all shadow-sm back-quiz-button"
                            >
                                공유하기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
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
                            정말 학습을 중단할까요? 🥺
                        </h2>
                        <p className="text-xs-res font-bold leading-relaxed break-keep mt-1" style={{ color: '#A5AFBF', lineHeight: '1.4' }}>
                            지금 나가면 오늘 여정의 학습 진행 상황이 저장되지 않아요. 계속 끝까지 학습해 볼까요?
                        </p>
                    </div>
                    <div className="w-full flex flex-col gap-3">
                        <button
                            onClick={() => setShowExitModal(false)}
                            className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg retry-quiz-button"
                        >
                            계속 공부하기
                        </button>
                        <button
                            onClick={onBack}
                            className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg active:scale-95 transition-all shadow-sm back-quiz-button"
                        >
                            그만하고 나가기
                        </button>
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
                        <div className="w-full h-full p-3.5 flex items-center justify-center z-10">
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

    return (
        <div className="flex flex-col items-center gap-1.5">
            <button disabled={!isActive} onClick={isActive ? () => onTap(node.id) : undefined}
                className={`w-[clamp(72px,18vw,96px)] h-[clamp(72px,18vw,96px)] rounded-[2rem] flex items-center justify-center bg-white shadow-xl transition-all duration-300 relative overflow-hidden
                    ${isDisabled ? 'shadow-none border border-[#E9EDF2]' : 'border-2 border-white'}
                    ${isActive ? 'active:scale-95' : ''}
                    ${isDone ? 'ring-4 ring-[#FF9B73]/20' : ''}`}
            >
                <div className="w-full h-full p-3.5 flex items-center justify-center z-10">
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
                {isCurrent && <span className="font-black text-[#FF9B73] uppercase tracking-widest mt-1 animate-pulse text-sm-res" style={{ textShadow: '0 0 8px #fff, 0 0 16px #fff' }}>선택하세요</span>}
                {isDone    && <span className="font-black text-[#FF9B73] uppercase tracking-widest mt-1 text-sm-res" style={{ textShadow: '0 0 8px #fff, 0 0 16px #fff' }}>완료</span>}
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
        : !done.has('game')    ? 'game'
        : !done.has('quiz')    ? 'quiz'
        : !done.has('writing') ? 'writing'
        : 'done';

    return (
        <div className="fixed inset-0 bg-[#F7FAF9] flex flex-col overflow-y-auto">
            <style>{PULSE_CSS}</style>

            {/* Header */}
            <div className="w-full shrink-0 flex flex-col items-center px-5 pt-12 pb-6 relative">
                <button onClick={onBack} className="absolute left-5 top-12 w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-md shadow-lg border-2 border-white flex items-center justify-center text-[#3C3C3C] font-extrabold text-xl active:scale-90 transition-all z-10">←</button>
                {/* Day Header */}
                <div className="flex flex-col items-center gap-2 mb-6">
                    <h1 className="font-black text-[#3C3C3C] tracking-tight leading-none text-h1">DAY {dayNumber}</h1>
                    <div className="h-1.5 w-16 bg-[#FF9B73] rounded-full" />
                </div>
                {theme && <p className="font-bold text-[#FF9B73] break-keep mt-0.5 text-body-lg">{theme}</p>}
                <p className="text-[#AEB7C5] font-bold mt-1 text-center text-body-lg">하나씩 차례대로 정복해봐요!</p>
            </div>

            {/* Road */}
            <div className="flex-1 flex flex-col items-center px-4 pb-32 pt-6">
                <div className="w-full max-w-sm mx-auto">
                    {/* Steps container with spine */}
                    <div className="relative w-full flex flex-col gap-[clamp(1.5rem,6vh,3.5rem)] pt-0 pb-12">

                        {/* Spine */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-6 rounded-full z-0"
                            style={{ top: 0, bottom: 'clamp(15px, 2.5vh, 25px)', backgroundColor: 'rgba(200,221,216,0.45)' }} />

                        {/* 01. 한자 카드 */}
                        <MapNode
                            stepNum="01" label="한자 카드"
                            icon="/assets/images/icons/menu_flashcard.webp"
                            isLeft={true} activeColor="#FF9B73" textColor="text-[#FF9B73]"
                            status={done.has('flashcard') ? 'done' : 'active'}
                            charImg={currentStep === 'flashcard' ? charImg : null}
                            onTap={() => onTapNode('flashcard')}
                        />

                        {/* 02. 게임 */}
                        <BranchSection
                            stepNum="02" sectionLabel="게임" textColor="text-[#FF9B73]" activeColor="#FF9B73"
                            leftNode={{ id: 'shoot', label: '몬스터 슈팅', icon: '/assets/images/icons/menu_shoot_game.webp' }}
                            rightNode={{ id: 'match', label: '메모리 게임', icon: '/assets/images/icons/menu_match_game.webp' }}
                            available={done.has('flashcard')} chosen={chosenGame} stepDone={done.has('game')}
                            showChar={currentStep === 'game'} charImg={charImg} onTap={onTapNode}
                        />

                        {/* 03. 퀴즈 */}
                        <BranchSection
                            stepNum="03" sectionLabel="퀴즈" textColor="text-[#FF9B73]" activeColor="#FF9B73"
                            leftNode={{ id: 'word', label: '단어 퀴즈', icon: '/assets/images/icons/menu_word_quiz.webp' }}
                            rightNode={{ id: 'sentence', label: '문장 퀴즈', icon: '/assets/images/icons/menu_sentence_quiz.webp' }}
                            available={done.has('game')} chosen={chosenQuiz} stepDone={done.has('quiz')}
                            showChar={currentStep === 'quiz'} charImg={charImg} onTap={onTapNode}
                        />

                        {/* 04. 한자 쓰기 */}
                        <MapNode
                            stepNum="04" label="한자 쓰기"
                            icon="/assets/images/icons/menu_writing.webp"
                            isLeft={false} activeColor="#FFD3B6" textColor="text-orange-600"
                            status={done.has('writing') ? 'done' : done.has('quiz') ? 'active' : 'locked'}
                            charImg={currentStep === 'writing' ? charImg : null}
                            onTap={() => onTapNode('writing')}
                        />
                    </div>

                    {/* End marker */}
                    {allDone && (
                        <div className="flex flex-col items-center gap-3 pt-6 pb-10">
                            <div className="w-10 h-10 rounded-full bg-[#FF9B73] shadow-lg shadow-[#FF9B73]/20 flex items-center justify-center">
                                <span className="text-white text-base font-black">✓</span>
                            </div>
                            <p className="text-xs font-extrabold text-[#FF9B73] tracking-widest uppercase">여정 완료!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom button */}
            {allDone && (
                <div className="fixed bottom-0 left-0 right-0 px-6 pb-10 pt-6 bg-gradient-to-t from-[#F7FAF9] via-[#F7FAF9]/90 to-transparent">
                    <button onClick={onShowResults}
                        className="w-full py-5 rounded-[2.5rem] bg-[#FF9B73] font-black text-xl text-white shadow-2xl shadow-[#FF9B73]/20 active:scale-95 transition-all">
                        결과 보기 →
                    </button>
                </div>
            )}
        </div>
    );
};

// ── Results Screen (3D Style) ───────────────────────────────────────────────
const ResultsScreen = ({ todayHanja, correctIds, wrongIds = [], onComplete, onNavigate }) => {
    const total = todayHanja.filter(h => h.id).length;
    const correct = todayHanja.filter(h => correctIds.includes(h.id) && !wrongIds.includes(h.id)).length;
    const wrongHanja = todayHanja.filter(h => h.id && wrongIds.includes(h.id));
    const hasWrong = wrongHanja.length > 0;

    const recommendations = hasWrong
        ? [
            { label: '오답 몬스터 격파', desc: `틀린 한자 ${wrongHanja.length}개 복습`, screen: 'review', color: '#ff9a6c', icon: '/assets/images/icons/icon_monster_glossy.webp' },
            { label: '한자 쓰기', desc: '획순으로 완벽하게', screen: 'writing', color: '#FFD3B6', icon: '/assets/images/icons/node_stroke_test.webp' },
          ]
        : [
            { label: '단어 퀴즈', desc: '어휘력을 높여봐요', screen: 'wordQuiz', color: '#A0E4FF', icon: '/assets/images/icons/word_quiz_node.webp' },
            { label: '몬스터 슈팅', desc: '실력을 더 키워봐요', screen: 'shootGame', color: '#FFADAD', icon: '/assets/images/icons/node_monster_shooting.webp' },
          ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-[#F7FAF9] overflow-y-auto">
            <div className="minimal-card-studio w-full max-w-md p-10 flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500 my-8">
                <div className="w-28 h-28 minimal-icon-box bg-white border border-[#E9EDF2] shadow-inner">
                    <span className="text-h1-res text-[#FFB433] animate-pulse">✦</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-h2-res font-extrabold text-[#5D544F] tracking-tight uppercase flex items-center gap-2">
                        <span className="pastel-star-pink">✦</span>
                        학습 완료!
                        <span className="pastel-star-indigo">✦</span>
                    </h1>
                    <p className="text-[#AEB7C5] font-bold uppercase text-xs tracking-widest">오늘의 여정을 모두 마쳤습니다</p>
                </div>

                <div className="flex gap-4">
                    {todayHanja.map((h, i) => {
                        const isWrong = wrongIds.includes(h.id);
                        const isCorrect = correctIds.includes(h.id) && !isWrong;
                        const color = isWrong ? '#FF6B6B' : isCorrect ? '#4CCB7F' : '#AEB7C5';
                        const bg = isWrong ? 'bg-rose-50/50' : isCorrect ? 'bg-emerald-50/50' : 'bg-slate-50/50';
                        return (
                            <div key={i} className={`minimal-card w-20 h-20 flex flex-col items-center justify-center relative !border-[#E9EDF2] ${bg}`}>
                                <span className="text-h3-res font-extrabold" style={{ color }}>{h.hanja}</span>
                                <span className="text-xs font-bold text-[#AEB7C5] mt-0.5">{h.sound}</span>
                                <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-extrabold shadow-lg`} style={{ backgroundColor: color }}>
                                    {isWrong ? '✕' : isCorrect ? '✓' : '–'}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 추천 */}
                <div className="w-full flex flex-col gap-3">
                    <p className="text-xs font-extrabold text-[#AEB7C5] uppercase tracking-[0.2em] text-center">
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
                                    <div className="font-extrabold text-[#3C3C3C] text-sm leading-tight">{r.label}</div>
                                    <div className="text-[#AEB7C5] font-bold text-xs mt-0.5">{r.desc}</div>
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
    onMarkWordWrong,
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
    const [wrongIds, setWrongIds] = useState([]);
    const [showResults, setShowResults] = useState(false);

    const addCorrect = (id) => {
        if (!id || !todayIds.includes(id)) return;
        setCorrectIds(prev => prev.includes(id) ? prev : [...prev, id]);
        setWrongIds(prev => prev.filter(w => w !== id));
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
                    todayIds.forEach(id => addCorrect(id));
                    completeStep('flashcard');
                }}
            />
        );
    }

    if (activity === 'shoot') {
        return (
            <Suspense fallback={<div className="min-h-screen bg-[#F7FAF9]" />}>
            <ShootGameScreen
                onBack={() => setActivity(null)}
                onGameFinish={() => {
                    if (updateMissionProgress) updateMissionProgress('shootGame', 1, addBonusXp);
                    completeStep('game', { chosenGame: 'shoot' });
                }}
                hanjaFilter={hanjaPool}
                selectedCharacter={selectedCharacter}
                onWaveClear={(kills) => { if (addTodayStat) addTodayStat('shootGame'); if (increment) increment('shootGame'); if (kills) updateRecord('totalMonsterKills', kills); }}
                onMarkCorrect={(id) => { addCorrect(id); onMarkCorrect(id); }}
                onMarkWrong={(id) => { addWrong(id); onMarkWrong(id); }}
                masteryData={masteryData}
                srsData={srsData}
            />
            </Suspense>
        );
    }

    if (activity === 'match') {
        return (
            <Suspense fallback={<div className="min-h-screen bg-[#F7FAF9]" />}>
            <MatchGameScreen
                onBack={() => setActivity(null)}
                hanjaFilter={hanjaPool}
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
            />
            </Suspense>
        );
    }

    if (activity === 'word') {
        return (
            <Suspense fallback={<div className="min-h-screen bg-[#F7FAF9]" />}>
            <WordQuizScreen
                onBack={() => setActivity(null)}
                hanjaFilter={hanjaPool}
                onHanjaAcquired={(id) => addCorrect(id)}
                onMarkCorrect={(id) => { addCorrect(id); onMarkCorrect(id); }}
                onMarkWordWrong={(word, hanjaId, reading, meaning) => { addWrong(hanjaId); if (onMarkWordWrong) onMarkWordWrong(word, hanjaId, reading, meaning); }}
                srsData={srsData}
                masteryData={masteryData}
                onStageClear={(correct, total, maxCombo) => {
                    if (updateMissionProgress) updateMissionProgress('wordQuiz', 1, addBonusXp);
                    if (addTodayStat) addTodayStat('wordQuiz');
                    if (correct != null) updateRecord('wordBestScore', correct);
                    if (maxCombo) updateRecord('wordMaxCombo', maxCombo);
                    completeStep('quiz', { chosenQuiz: 'word' });
                }}
            />
            </Suspense>
        );
    }

    if (activity === 'sentence') {
        return (
            <Suspense fallback={<div className="min-h-screen bg-[#F7FAF9]" />}>
            <SentenceQuizScreen
                onBack={() => setActivity(null)}
                hanjaFilter={hanjaPool}
                onHanjaAcquired={(id) => addCorrect(id)}
                onMarkCorrect={(id) => { addCorrect(id); onMarkCorrect(id); }}
                onMarkWordWrong={(word, hanjaId, reading, meaning) => { addWrong(hanjaId); if (onMarkWordWrong) onMarkWordWrong(word, hanjaId, reading, meaning); }}
                srsData={srsData}
                masteryData={masteryData}
                onStageClear={() => {
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
