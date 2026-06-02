import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { SK } from '../constants/storageKeys.js';
import { updateRecord } from '../utils/recordUtils.js';
import DAILY_CURRICULUM from '../data/dailyCurriculum.js';
import HANJA_DATA from '../hanja_unified.json';
import { getRankDetails, getCharacterImage } from '../utils/rankUtils.js';
import { getTodayStr } from '../utils/sessionUtils.js';
import { buildUnifiedPool } from '../utils/learningPool.js';
import CtaButton from './common/CtaButton.jsx';
import RewardBreakdown from './common/RewardBreakdown.jsx';

const ShootGameScreen = lazy(() => import('./ShootGameScreen.jsx'));
const MatchGameScreen = lazy(() => import('./MatchGameScreen.jsx'));
const SentenceQuizScreen = lazy(() => import('./SentenceQuizScreen.jsx'));
const WordQuizScreen = lazy(() => import('./WordQuizScreen.jsx'));

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
    } catch {
        return;
    }
};


const clearMapProgress = () => {
    try { localStorage.removeItem(MAP_PROGRESS_KEY); } catch { return; }
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

const DailyFlashcardView = ({ items, onBack, onCardFlip, onStageClear, getRewardPreview }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [flippedSet, setFlippedSet] = useState(new Set());
    const [showWords, setShowWords] = useState(false);
    const [showClearPopup, setShowClearPopup] = useState(false);

    const item = items[currentIndex];
    const isLastCard = currentIndex === items.length - 1;
    const topicColor = '#7C83FF';

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
                    <div className="quiz-header-card quiz-header-card--wide mb-6">
                        <button onClick={onBack}
                            className="hp-nav-button">
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
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300" style={{ background: 'linear-gradient(180deg, rgba(221,241,234,0.85) 0%, rgba(234,246,242,0.95) 100%)' }}>
                    <div className="w-full max-w-sm flex flex-col items-center overflow-hidden rounded-[2.5rem] bg-white border-4 border-white shadow-[0_20px_50px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] relative">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2ED6C5] rounded-full blur-[80px] opacity-20 pointer-events-none" />
                        
                        <div className="pt-10 pb-8 px-7 flex flex-col items-center gap-7 w-full relative z-10">
                            
                            {/* 텍스트 영역 */}
                            <div className="text-center flex flex-col gap-1 w-full">
                                <span className="text-sm font-extrabold text-[#94A3B8]">3개의 한자를 모두 익혔네요!</span>
                                <h1 className="text-3xl font-black leading-tight mt-1" style={{ color: '#FF9B73', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(255,160,120,0.15)' }}>
                                    와우! 참 잘했어요!
                                </h1>
                            </div>

                            {/* 심플하고 직관적인 여정 지도 (Stepper) */}
                            <div className="w-full relative z-10 my-2 px-1">
                                {/* 배경 트랙 라인 */}
                                <div className="absolute top-[1.65rem] left-[10%] w-[80%] h-[6px] rounded-full bg-slate-100 shadow-inner" />
                                {/* 진행 트랙 라인 (한자카드 -> 퀴즈 절반까지) */}
                                <div className="absolute top-[1.65rem] left-[10%] w-[40%] h-[6px] rounded-full bg-gradient-to-r from-[#2ED6C5] to-[#0D9488] shadow-[0_0_8px_rgba(46,214,197,0.4)]" />

                                <div className="flex items-start justify-between w-full relative">
                                    {/* 1. 한자 카드 (완료) */}
                                    <div className="flex flex-col items-center gap-2 relative z-10">
                                        <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-[#E0F2FE] to-[#7DD3FC] shadow-md border-[3px] border-white flex items-center justify-center relative transform transition-transform hover:scale-105">
                                            <img src="/assets/images/icons/study.webp" className="w-7 h-7 object-contain opacity-90 drop-shadow-sm" alt="Study" />
                                            <div className="absolute -top-2 -right-2 bg-[#FF9B73] text-white w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shadow-sm border border-white">✓</div>
                                        </div>
                                        <span className="text-[11px] font-black text-[#FF9B73]">한자 카드</span>
                                    </div>

                                    {/* 2. 퀴즈 (현재) */}
                                    <div className="flex flex-col items-center gap-2 relative z-10">
                                        <div className="absolute -top-7 text-xl animate-bounce drop-shadow-sm">📍</div>
                                        <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-[#A7F3D0] to-[#10B981] shadow-[0_8px_16px_rgba(16,185,129,0.3)] border-[3px] border-white flex items-center justify-center transform scale-110">
                                            <img src="/assets/images/icons/sentence.webp" className="w-7 h-7 object-contain drop-shadow-md" alt="Quiz" />
                                        </div>
                                        <span className="text-[12px] font-black text-[#10B981] mt-0.5">퀴즈</span>
                                    </div>

                                    {/* 3. 게임 (잠김) */}
                                    <div className="flex flex-col items-center gap-2 relative z-10">
                                        <div className="w-14 h-14 rounded-[1.2rem] bg-[#F1F5F9] shadow-inner border-[3px] border-white flex items-center justify-center grayscale opacity-50">
                                            <img src="/assets/images/icons/monster.webp" className="w-7 h-7 object-contain" alt="Game" />
                                        </div>
                                        <span className="text-[11px] font-bold text-[#94A3B8]">게임</span>
                                    </div>
                                </div>
                            </div>

                            <RewardBreakdown
                                reward={getRewardPreview?.(30)}
                                correctXp={30}
                                clearXp={0}
                                correctLabel="활동"
                                detailText=""
                            />

                            {/* 3D 다음 단계 버튼 */}
                            <div className="w-full mt-3">
                                <CtaButton theme="coral" onClick={() => { setShowClearPopup(false); onStageClear(); }}>
                                    <span className="font-black text-white text-[1.5rem] drop-shadow-md">다음 단계로 이동</span>
                                    <span className="text-white font-black text-[1.5rem] drop-shadow-md">▶</span>
                                </CtaButton>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// ── Intro Screen ──────────────────────────────────────────────────────────
const IntroScreen = ({ dayNumber, theme, todayHanja, onBack, onStart, resumeStep }) => {
    const buttonContent = useMemo(() => {
        if (resumeStep !== 'flashcard') {
            return {
                title: "이어서 학습하기",
                subtitle: "진행 중인 학습을 계속합니다"
            };
        }
        return {
            title: "학습 시작하기",
            subtitle: "오늘의 한자를 익혀보세요"
        };
    }, [resumeStep]);

    return (
        <div className="fixed inset-0 bg-[#F7FAF9] flex flex-col items-center justify-center px-5">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#2ED6C5] blur-[100px] opacity-15 pointer-events-none" />
            <div className="absolute -bottom-24 right-0 w-96 h-96 rounded-full bg-[#FF9B73] blur-[100px] opacity-15 pointer-events-none" />

            <button onClick={onBack}
                className="hp-nav-button absolute left-5 top-12 z-10">
                ←
            </button>

            <div className="w-full max-w-sm rounded-[2rem] px-4 pt-5 pb-5 border border-white/60 mb-8"
                style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', boxShadow: '0 8px 32px rgba(46,214,197,0.10), 0 2px 8px rgba(0,0,0,0.05)' }}>
                <div className="flex flex-col items-center gap-2 mb-4">
                    <div className="rounded-full px-5 py-1.5 mt-[-2.5rem] bg-white border-2 border-[#F1F5F9] shadow-sm z-10 flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-[#9FA5FF]"></span>
                        <h1 className="font-black text-[#6168EB] tracking-tight leading-none pt-0.5" style={{ fontSize: '1.25rem' }}>
                            한자 탐험 {dayNumber}단계
                        </h1>
                        <span className="w-2 h-2 rounded-full bg-[#9FA5FF]"></span>
                    </div>
                    {theme && (
                        <p className="font-extrabold tracking-widest mt-1" style={{ fontSize: '1.35rem', background: 'linear-gradient(90deg, #FF9B73, #FF6B6B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{theme}</p>
                    )}
                </div>
                {todayHanja.length > 0 && (
                    <div className="flex flex-col gap-3 w-full">
                        <p className="text-center font-black" style={{ fontSize: '1.2rem', color: '#3C3C3C' }}>다음의 한자를 배워요!</p>
                        <div className="flex gap-3 w-full">
                            {todayHanja.map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center rounded-[1.3rem] px-2 py-4"
                                    style={{ background: '#FFFFFF' }}>
                                    <img src={`/assets/images/hanja_all/${h.id}_${encodeURIComponent(h.hanja)}.webp`}
                                        onError={e => { e.target.src = '/assets/images/hanja_placeholder.webp'; }}
                                        className="w-20 h-20 object-contain mix-blend-multiply" alt={h.hanja} />
                                    <span className="text-[42px] font-black text-[#334155] leading-none mt-2">{h.hanja}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <CtaButton theme="coral" onClick={onStart} className="max-w-sm">
                <div className="flex flex-col items-center justify-center gap-1.5 w-full py-1">
                    <div className="font-black text-white leading-tight drop-shadow-md flex items-center justify-center gap-2" style={{ fontSize: '2.2rem', letterSpacing: '-0.02em' }}>
                        <span>{buttonContent.title}</span>
                        <span className="text-[1.55rem] translate-y-[1px]">▶</span>
                    </div>
                    <div className="font-bold text-white/90 text-center" style={{ fontSize: '1.15rem' }}>
                        {buttonContent.subtitle}
                    </div>
                </div>
            </CtaButton>
        </div>
    );
};

// ── Game Pick Screen ───────────────────────────────────────────────────────
const GAMES = [
    { id: 'shoot', label: '몬스터 슈팅', icon: '/assets/images/icons/monster.webp',  theme: 'coral', color: '#FF9B73', bg: '#FFF7F3' },
    { id: 'match', label: '메모리 게임', icon: '/assets/images/icons/matching.webp', theme: 'coral', color: '#2ED6C5', bg: '#F0FDFB' },
];

const GamePickScreen = ({ onResult, onBack }) => {
    const game = useMemo(() => pickDailyOption(GAMES, 'game'), []);

    return (
        <div className="fixed inset-0 bg-[#F7FAF9] flex flex-col items-center justify-center px-6">
            <button onClick={onBack} className="hp-nav-button absolute left-4 top-12 z-10 !text-slate-400">←</button>
            <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#2ED6C5] blur-[100px] opacity-10 pointer-events-none" />
            <div className="absolute -bottom-20 right-0 w-80 h-80 rounded-full bg-[#FF9B73] blur-[100px] opacity-10 pointer-events-none" />

            <p className="font-bold text-sm text-[#94A3B8] mb-3 tracking-wide">오늘의 게임</p>
            <h2 className="font-black text-[#3C3C3C] mb-10 text-center" style={{ fontSize: '1.7rem' }}>{game.label}</h2>

            <div className="flex flex-col items-center gap-4 p-10 rounded-[2.5rem] border-2 mb-12"
                style={{ background: game.bg, borderColor: game.color + '55', boxShadow: `0 12px 32px ${game.color}33` }}>
                <img src={game.icon} className="w-28 h-28 object-contain" alt={game.label} />
            </div>

            <div className="w-full max-w-xs">
                <CtaButton theme={game.theme} onClick={() => onResult(game.id)}>
                    <div className="font-black text-white leading-tight drop-shadow-md flex items-center justify-center gap-2 py-0.5" style={{ fontSize: '1.85rem', letterSpacing: '-0.02em' }}>
                        <span>시작하기</span>
                        <span className="text-[1.35rem] translate-y-[1px]">▶</span>
                    </div>
                </CtaButton>
            </div>
        </div>
    );
};

// ── Quiz Pick Screen ───────────────────────────────────────────────────────
const QUIZZES = [
    { id: 'wordQuiz',     label: '단어 퀴즈', icon: '/assets/images/icons/words.webp',    theme: 'coral', color: '#7C83FF', bg: '#F5F5FF' },
    { id: 'sentenceQuiz', label: '문장 퀴즈', icon: '/assets/images/icons/sentence.webp', theme: 'coral', color: '#FF9B73', bg: '#FFF7F3' },
];

const pickDailyOption = (options, salt = '') => {
    const key = `${getTodayStr()}-${salt}`;
    const hash = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return options[hash % options.length];
};

const QuizPickScreen = ({ onResult, onBack }) => {
    const quiz = useMemo(() => pickDailyOption(QUIZZES, 'quiz'), []);

    return (
        <div className="fixed inset-0 bg-[#F7FAF9] flex flex-col items-center justify-center px-6">
            <button onClick={onBack} className="hp-nav-button absolute left-4 top-12 z-10 !text-slate-400">←</button>
            <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#7C83FF] blur-[100px] opacity-10 pointer-events-none" />
            <div className="absolute -bottom-20 right-0 w-80 h-80 rounded-full bg-[#FF9B73] blur-[100px] opacity-10 pointer-events-none" />

            <p className="font-bold text-sm text-[#94A3B8] mb-3 tracking-wide">오늘의 퀴즈</p>
            <h2 className="font-black text-[#3C3C3C] mb-10 text-center" style={{ fontSize: '1.7rem' }}>{quiz.label}</h2>

            <div className="flex flex-col items-center gap-4 p-10 rounded-[2.5rem] border-2 mb-12"
                style={{ background: quiz.bg, borderColor: quiz.color + '55', boxShadow: `0 12px 32px ${quiz.color}33` }}>
                <img src={quiz.icon} className="w-28 h-28 object-contain" alt={quiz.label} />
            </div>

            <div className="w-full max-w-xs">
                <CtaButton theme={quiz.theme} onClick={() => onResult(quiz.id)}>
                    <div className="font-black text-white leading-tight drop-shadow-md flex items-center justify-center gap-2 py-0.5" style={{ fontSize: '1.85rem', letterSpacing: '-0.02em' }}>
                        <span>시작하기</span>
                        <span className="text-[1.35rem] translate-y-[1px]">▶</span>
                    </div>
                </CtaButton>
            </div>
        </div>
    );
};

// ── Character Data ─────────────────────────────────────────────────────────

const PULSE_CSS = `
@keyframes pulse-ring {
    0%   { transform: scale(0.95); opacity: 0.8; }
    50%  { transform: scale(1.4); opacity: 0; }
    100% { transform: scale(1.4); opacity: 0; }
}
@keyframes float-gentle {
    0%   { transform: translateY(0px); }
    50%  { transform: translateY(-8px); }
    100% { transform: translateY(0px); }
}
@keyframes float-active {
    0%   { transform: translateY(0px) scale(1.1); }
    50%  { transform: translateY(-12px) scale(1.12); }
    100% { transform: translateY(0px) scale(1.1); }
}
@keyframes twinkle {
    0%, 100% { opacity: 0.4; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
}
@keyframes cloud-drift {
    0%   { transform: translateX(-20px); }
    50%  { transform: translateX(20px); }
    100% { transform: translateX(-20px); }
}
@keyframes peek-monster {
    0%, 80%, 100% { transform: translate(10px, 20px) rotate(15deg); opacity: 0; }
    85%, 95%      { transform: translate(-15px, -30px) rotate(-10deg); opacity: 1; }
}
.node-pulse { position: relative; z-index: 10; }
.node-pulse::before {
    content: '';
    position: absolute;
    inset: -10px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(46,214,197,0.4) 0%, rgba(46,214,197,0) 70%);
    animation: pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    z-index: -1;
    pointer-events: none;
}
.active-node-shadow {
    box-shadow: 0 16px 32px rgba(46,214,197,0.35), 0 0 20px rgba(46,214,197,0.4);
}
.float-gentle {
    animation: float-gentle 4s ease-in-out infinite;
}
.float-active {
    animation: float-active 3s ease-in-out infinite;
}
`;

// ── Game-style 3D Node Button ──────────────────────────────────────────────
const GameNodeButton = ({ status, icon }) => {
    const isLocked = status === 'locked';
    const isDone = status === 'done';

    let bgStyle = "";
    let shadowStyle = "";
    let ringStyle = "";
    
    if (isLocked) {
        bgStyle = "bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0]";
        shadowStyle = "shadow-[inset_0_-6px_0_rgba(148,163,184,0.4),0_8px_16px_rgba(0,0,0,0.05)] border-white";
        ringStyle = "ring-4 ring-[#E2E8F0]/40";
    } else if (isDone) {
        bgStyle = "bg-gradient-to-br from-[#E0F2FE] to-[#7DD3FC]"; // Sky blue
        shadowStyle = "shadow-[inset_0_-8px_0_rgba(2,132,199,0.3),0_12px_24px_rgba(56,189,248,0.3)] border-white";
        ringStyle = "ring-4 ring-[#38bdf8]/40";
    } else {
        // Active
        bgStyle = "bg-gradient-to-br from-[#A7F3D0] to-[#10B981]"; // Emerald / Mint
        shadowStyle = "shadow-[inset_0_-8px_0_rgba(4,120,87,0.3),0_16px_32px_rgba(16,185,129,0.4)] border-white";
        ringStyle = "ring-4 ring-[#10B981]/40";
    }

    return (
        <div className={`absolute inset-0 rounded-[2.5rem] border-[4px] overflow-hidden ${bgStyle} ${shadowStyle} ${ringStyle} transition-all duration-300`}>
            {/* Glossy top reflection */}
            <div className="absolute top-0 inset-x-0 h-[45%] bg-gradient-to-b from-white/70 to-transparent pointer-events-none rounded-t-[2.5rem]" />
            
            {/* The Icon */}
            {icon && (
                <div className="absolute inset-0 flex items-center justify-center p-3.5 z-10">
                    <img src={icon} className={`w-full h-full object-contain transition-all ${isLocked ? 'grayscale opacity-40 mix-blend-multiply' : 'drop-shadow-[0_6px_8px_rgba(0,0,0,0.25)] scale-110'}`} alt="" />
                </div>
            )}
        </div>
    );
};

// ── Single Map Node ────────────────────────────────────────────────────────
const MapNode = ({ label, icon, isLeft, activeColor, status, charImg, onTap }) => {
    const isDone = status === 'done';
    const isCurrent = status === 'active';
    const isLocked = status === 'locked';

    return (
        <div className={`relative w-full flex flex-col items-center justify-center my-4 ${isLeft ? 'items-end pr-6' : 'items-start pl-6'}`} style={{ zIndex: 10 }}>
            {/* The Floating Island Button */}
            <div className={`relative ${isCurrent ? 'float-active' : 'float-gentle'}`}>
                {/* Character standing on the active node */}
                {isCurrent && charImg && (
                    <div className="absolute -top-[80px] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                        <img src={charImg} alt="캐릭터" className="w-[80px] h-[80px] max-w-none object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.15)] origin-bottom" />
                    </div>
                )}

                {/* Pulse ring for active */}
                <div className={isCurrent ? 'node-pulse' : ''}>
                    <button disabled={isLocked} onClick={isLocked ? undefined : onTap}
                        className={`w-[clamp(140px,38vw,170px)] h-[clamp(140px,38vw,170px)] flex items-center justify-center transition-all duration-300 relative bg-transparent ${!isLocked ? 'active:scale-95 hover:scale-105' : ''}`}
                    >
                        <GameNodeButton status={status} icon={icon} activeColor={activeColor} />
                        {isDone && (
                            <div className="absolute -top-2 -right-2 bg-[#FF9B73] text-white w-9 h-9 rounded-full flex items-center justify-center text-xl font-black shadow-lg border-2 border-white z-30 transform rotate-12">✓</div>
                        )}
                    </button>
                    {/* Stars for completed nodes */}
                    {isDone && (
                        <>
                            <img src="/assets/images/icons/clay_star.webp" alt="star" className="absolute -top-4 -right-4 w-8 h-8 object-contain animate-pulse drop-shadow-[0_4px_8px_rgba(255,211,182,0.6)]" style={{ animationDelay: '0.2s' }} />
                        </>
                    )}
                </div>
            </div>

            {/* Label Underneath */}
            <div className="mt-3 flex flex-col items-center">
                <span className={`font-black tracking-tight leading-tight text-center ${isLocked ? 'text-[#94A3B8]' : 'text-[#334155]'} text-[clamp(20px,5.5vw,26px)] drop-shadow-sm`}>
                    {label}
                </span>
            </div>

        </div>
    );
};

// ── Branch option card ─────────────────────────────────────────────────────
const BranchOption = ({ node, status, activeColor, onTap }) => {
    const isDone = status === 'done';
    const isActive = status === 'active';
    const isDisabled = status === 'locked' || status === 'faded';

    return (
        <div className="flex flex-col items-center gap-1.5">
            <button disabled={!isActive} onClick={isActive ? () => onTap(node.id) : undefined}
                className={`w-[clamp(120px,30vw,145px)] h-[clamp(120px,30vw,145px)] flex items-center justify-center transition-all duration-300 relative bg-transparent
                    ${isActive ? 'active:scale-95 scale-105 hover:scale-110' : ''}`}
            >
                <GameNodeButton status={status} icon={node.icon} activeColor={activeColor} />
                {isDone && <div className="absolute -top-1.5 -right-1.5 bg-[#FF9B73] text-white w-8 h-8 rounded-full flex items-center justify-center text-base font-black shadow-lg border-2 border-white z-30 transform rotate-12">✓</div>}
            </button>
            <span className={`mt-2 text-[clamp(17px,4.5vw,21px)] font-black text-center break-keep leading-tight ${isDisabled ? 'text-[#94A3B8]' : isDone ? 'text-[#FF9B73]' : 'text-[#334155]'}`}>
                {node.label}
            </span>
        </div>
    );
};

// ── Branch Section: Floating islands ──────────────────────────────────────────
const BranchSection = ({ activeColor, leftNode, rightNode, available, chosen, stepDone, charImg, onTap }) => {
    const isCurrent = available && !stepDone;

    const getStatus = (id) => {
        if (!available) return 'locked';
        if (stepDone) return chosen === id ? 'done' : 'faded';
        return 'active';
    };

    return (
        <div className="relative w-full my-6 flex flex-col items-center" style={{ zIndex: 10 }}>
            {/* Character standing above the branch options */}
            {isCurrent && charImg && (
                <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    <img src={charImg} alt="캐릭터" className="w-[80px] h-[80px] max-w-none object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.15)] origin-bottom animate-bounce" />
                </div>
            )}

            {/* 선택 힌트 */}
            {isCurrent && (
                <div className="mb-4 px-4 py-1.5 rounded-full bg-white/80 border border-white/60 shadow-sm backdrop-blur-sm">
                    <span className="text-[13px] font-black text-[#5B677A]">둘 중 하나만 골라요!</span>
                </div>
            )}

            {/* Branch options container */}
            <div className="relative w-full flex justify-center items-center gap-4 sm:gap-8">
                {/* Left option card */}
                <div className={`relative z-10 ${isCurrent ? 'float-gentle' : ''}`} style={{ animationDelay: '0s' }}>
                    <BranchOption node={leftNode} status={getStatus(leftNode.id)} activeColor={activeColor} onTap={onTap} />
                </div>

                {/* VS divider */}
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-20 ${isCurrent ? 'bg-white shadow-md border-2 border-slate-100' : 'opacity-0'}`}>
                    <span className="text-[11px] font-black text-[#94A3B8]">VS</span>
                </div>

                {/* Right option card */}
                <div className={`relative z-10 ${isCurrent ? 'float-active' : ''}`} style={{ animationDelay: '0.5s' }}>
                    <BranchOption node={rightNode} status={getStatus(rightNode.id)} activeColor={activeColor} onTap={onTap} />
                </div>
            </div>
        </div>
    );
};

// ── Journey Map (main map view) ────────────────────────────────────────────
const JourneyMap = ({ dayNumber, theme, charId, done, chosenGame, chosenQuiz, onTapNode, onShowResults, onBack, todayHanja = [] }) => {
    const charImg = getRankDetails(getStoredXp(), charId).avatar;
    const allDone = done.has('writing');

    const currentStep = !done.has('flashcard') ? 'flashcard'
        : !done.has('quiz') ? 'quiz'
            : !done.has('game') ? 'game'
                : !done.has('writing') ? 'writing'
                    : 'done';

    return (
        <div className="fixed inset-0 bg-[#F7FAF9] flex flex-col overflow-y-auto">
            <style>{PULSE_CSS}</style>

            {/* Background Layers */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-[#F7FAF9]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E0F7FA]/50 via-[#F1F8E9]/50 to-[#E0F7FA]/50" />
                
                {/* Floating Elements */}
                <div className="absolute inset-0 overflow-hidden opacity-80">
                    {/* Clouds & Monster */}
                    <div className="absolute top-[5%] right-[10%] text-[50px] opacity-80" style={{ animation: 'cloud-drift 22s ease-in-out infinite' }}>☁️</div>
                    <div className="absolute top-[45%] -left-[10%] opacity-90 flex justify-center items-center" style={{ animation: 'cloud-drift 28s ease-in-out infinite reverse' }}>
                        <img src="/assets/images/icons/cute_monster.webp" alt="hidden monster" className="absolute w-16 h-16 z-0 drop-shadow-md" style={{ animation: 'peek-monster 14s ease-in-out infinite' }} />
                        <span className="text-[70px] relative z-10">☁️</span>
                    </div>
                    <div className="absolute bottom-[15%] right-[15%] text-[60px] opacity-70" style={{ animation: 'cloud-drift 19s ease-in-out infinite 2s' }}>☁️</div>
                </div>

                {/* Soft Glowing Orbs */}
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#2ED6C5] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse" />
                <div className="absolute top-1/3 -right-20 w-80 h-80 bg-[#7C83FF] rounded-full mix-blend-multiply filter blur-[100px] opacity-15" style={{ animationDelay: '2s' }} />
                <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-[#FF9B73] rounded-full mix-blend-multiply filter blur-[120px] opacity-20" style={{ animationDelay: '4s' }} />
            </div>

            {/* Header */}
            <div className="w-full shrink-0 flex flex-col items-center px-4 pt-12 pb-4 relative z-10">
                <button onClick={onBack} className="hp-nav-button absolute left-4 top-12 z-10">←</button>

                {/* 제목 + 한자카드 통합 패널 */}
                <div className="w-full max-w-sm mt-1 rounded-[2rem] px-4 pt-5 pb-5 border border-white/60"
                    style={{
                        background: 'rgba(255,255,255,0.55)',
                        backdropFilter: 'blur(18px)',
                        WebkitBackdropFilter: 'blur(18px)',
                        boxShadow: '0 8px 32px rgba(46,214,197,0.10), 0 2px 8px rgba(0,0,0,0.05)',
                    }}>
                    <div className="flex flex-col items-center gap-1 mb-4">
                        <h1 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-[#2ED6C5] to-[#0D9488] tracking-tight leading-none pb-1" style={{ fontSize: '2rem' }}>
                            한자 탐험 {dayNumber}단계
                        </h1>
                        {theme && (
                            <p className="font-extrabold tracking-widest" style={{ fontSize: '1.35rem', background: 'linear-gradient(90deg, #FF9B73, #FF6B6B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{theme}</p>
                        )}
                    </div>
                    {todayHanja.length > 0 && (
                        <div className="flex flex-col gap-3 w-full">
                        <p className="text-center font-black" style={{ fontSize: '1.2rem', letterSpacing: '-0.01em', color: '#3C3C3C' }}>다음의 한자를 배워요!</p>
                        <div className="flex gap-3 w-full">
                            {todayHanja.map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center rounded-[1.3rem] px-2 py-4"
                                    style={{
                                        background: 'rgba(255,255,255,0.70)',
                                        border: '1px solid rgba(46,214,197,0.18)',
                                        boxShadow: '0 2px 8px rgba(46,214,197,0.08)',
                                    }}>
                                    <img
                                        src={`/assets/images/hanja_all/${h.id}_${encodeURIComponent(h.hanja)}.webp`}
                                        onError={e => { e.target.src = '/assets/images/hanja_placeholder.webp'; }}
                                        className="w-20 h-20 object-contain mix-blend-multiply"
                                        alt={h.hanja}
                                    />
                                    <span className="text-[42px] font-black text-[#334155] leading-none mt-2">{h.hanja}</span>
                                </div>
                            ))}
                        </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Road */}
            <div className="flex-1 flex flex-col items-center px-4 pb-10 pt-4 relative z-10">
                <div className="w-full max-w-sm mx-auto">
                    {/* Steps container with spine */}
                    <div className="relative w-full flex flex-col gap-[clamp(1rem,3vh,2rem)] pt-0 pb-12 z-10">

                        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-50 w-full">
                            <div className="absolute top-10 -left-10 text-[60px] opacity-80" style={{ animation: 'cloud-drift 20s ease-in-out infinite' }}>☁️</div>

                            {/* 두 번째 구름 + 숨어있는 몬스터 */}
                            <div className="absolute top-1/2 -right-10 opacity-70 flex justify-center items-center" style={{ animation: 'cloud-drift 25s ease-in-out infinite reverse' }}>
                                <img src="/assets/images/icons/cute_monster.webp" alt="hidden monster" className="absolute w-16 h-16 z-0 drop-shadow-md" style={{ animation: 'peek-monster 12s ease-in-out infinite' }} />
                                <span className="text-[80px] relative z-10">☁️</span>
                            </div>

                            <div className="absolute bottom-20 left-10 text-[50px] opacity-70" style={{ animation: 'cloud-drift 18s ease-in-out infinite 2s' }}>☁️</div>
                        </div>

                        {/* S-Curve SVG Track */}
                        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="drop-shadow-lg opacity-80">
                                <defs>
                                    <filter id="track-glow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <path
                                    d="M 50,0 Q 80,12 50,25 T 50,50 Q 20,62 50,75 T 50,100"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.8)"
                                    strokeWidth="8"
                                    vectorEffect="non-scaling-stroke"
                                    filter="url(#track-glow)"
                                />
                                <path
                                    d="M 50,0 Q 80,12 50,25 T 50,50 Q 20,62 50,75 T 50,100"
                                    fill="none"
                                    stroke="rgba(46, 214, 197, 0.5)"
                                    strokeWidth="3"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </svg>
                        </div>

                        {/* 01. 한자 카드 */}
                        <MapNode
                            stepNum="01" label="한자 카드"
                            icon="/assets/images/icons/study.webp"
                            isLeft={true} activeColor="#FF9B73" textColor="text-[#FF9B73]"
                            status={done.has('flashcard') ? 'done' : 'active'}
                            charImg={currentStep === 'flashcard' ? charImg : null}
                            onTap={() => onTapNode('flashcard')}
                        />

                        {/* 02. 퀴즈 */}
                        <BranchSection
                            stepNum="02" sectionLabel="퀴즈" textColor="text-[#FF9B73]" activeColor="#FF9B73"
                            leftNode={{ id: 'word', label: '단어 퀴즈', icon: '/assets/images/icons/words.webp' }}
                            rightNode={{ id: 'sentence', label: '문장 퀴즈', icon: '/assets/images/icons/sentence.webp' }}
                            available={done.has('flashcard')} chosen={chosenQuiz} stepDone={done.has('quiz')}
                            showChar={currentStep === 'quiz'} charImg={charImg} onTap={onTapNode}
                        />

                        {/* 03. 게임 */}
                        <BranchSection
                            stepNum="03" sectionLabel="게임" textColor="text-[#FF9B73]" activeColor="#FF9B73"
                            leftNode={{ id: 'shoot', label: '몬스터 슈팅', icon: '/assets/images/icons/monster.webp' }}
                            rightNode={{ id: 'match', label: '메모리 게임', icon: '/assets/images/icons/matching.webp' }}
                            available={done.has('quiz')} chosen={chosenGame} stepDone={done.has('game')}
                            showChar={currentStep === 'game'} charImg={charImg} onTap={onTapNode}
                        />

                        {/* 04. 한자 쓰기 */}
                        <div className="mt-[30px]">
                            <MapNode
                                stepNum="04" label="한자 획순"
                                icon="/assets/images/icons/writing.webp"
                                isLeft={false} activeColor="#FFD3B6" textColor="text-orange-600"
                                status={done.has('writing') ? 'done' : done.has('game') ? 'active' : 'locked'}
                                charImg={currentStep === 'writing' ? charImg : null}
                                onTap={() => onTapNode('writing')}
                            />
                        </div>
                    </div>

                    {/* End marker + 결과 보기 버튼 */}
                    {allDone && (
                        <div className="flex flex-col items-center pt-4 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <button onClick={onShowResults}
                                className="w-[85%] max-w-[280px] py-3.5 rounded-full bg-[#FF9B73] font-black text-lg text-white shadow-xl shadow-[#FF9B73]/20 active:scale-95 transition-all mt-2">
                                결과 보기 →
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

// ── Results Screen (3D Style - Premium Crossroads) ───────────────────────────
const ResultsScreen = ({ todayHanja, onComplete, onContinueNext, selectedCharacter, dayNumber, missions, doneCount }) => {
    const charImg = getCharacterImage(selectedCharacter, 'success');
    const isFinalDay = dayNumber >= DAILY_CURRICULUM.length;

    const missionTotal = missions?.length || 6;
    const missionDone = doneCount || 0;
    const allDone = missionDone >= missionTotal;
    const progressPct = missionTotal ? (missionDone / missionTotal) * 100 : 0;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300 overflow-y-auto"
            style={{ background: 'linear-gradient(180deg, #DDF1EA 0%, #EAF6F2 100%)' }}
        >
            <div className="w-full max-w-sm flex flex-col items-center result-card-container overflow-hidden my-4 relative">
                {/* Decorative glow background */}
                <div className="absolute top-[-50px] w-[260px] h-[260px] rounded-full blur-[80px] opacity-25 z-0" style={{ backgroundColor: '#2ED6C5' }} />

                <div className="pt-6 pb-8 px-6 flex flex-col items-center gap-5 w-full relative z-10">

                    {/* 캐릭터 이미지 (성공 애니메이션) */}
                    <div className="relative flex items-center justify-center mt-3">
                        <div className="absolute w-[120px] h-[120px] bg-[#2ED6C5]/10 rounded-full blur-md z-0" />
                        <img
                            src={charImg}
                            alt="great"
                            className="w-[124px] h-[124px] object-contain drop-shadow-[0_12px_20px_rgba(46,214,197,0.3)] animate-bounce relative z-10"
                            style={{ animationDuration: '3s' }}
                            onError={e => { e.target.src = '/assets/images/characters/default_3d.webp'; }}
                        />
                    </div>

                    {/* 타이틀 */}
                    <div className="text-center flex flex-col gap-1 -mt-2">
                        <span className="text-xs font-extrabold text-[#AEB7C5] tracking-tight">오늘의 {dayNumber}단계 탐험 완료!</span>
                        <h1 className="text-[1.85rem] font-black leading-tight tracking-tight"
                            style={{ color: '#FF9B73', textShadow: '0 2px 10px rgba(255,160,120,0.12)' }}>
                            와우! 참 잘했어요!
                        </h1>
                        <p className="font-extrabold text-sm tracking-tight mt-1 text-[#8F99AD]">
                            일일 학습 완료 보너스 <span className="text-[#FF9B73] font-black">+200 XP</span> 획득!
                        </p>
                    </div>

                    {/* 오늘 배운 한자 카드 */}
                    <div className="w-full flex flex-col gap-2 mt-1">
                        <p className="text-[11px] font-black text-slate-400 text-center uppercase tracking-widest">오늘 배운 한자</p>
                        <div className="flex gap-2 w-full">
                            {todayHanja.filter(h => h.id).map((h, i) => (
                                <div key={i} className="flex-1 clay-panel !rounded-[1.4rem] flex flex-col items-center justify-center py-4 px-2 gap-1.5 border-[3px] border-white !bg-[#F8FAF9] shadow-sm">
                                    <span className="text-4xl font-black text-slate-700 leading-none">{h.hanja}</span>
                                    <span className="text-sm font-bold text-[#8F99AD] text-center break-keep leading-tight">{h.meaning} {h.sound}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 오늘의 퀘스트 진행 현황 판넬 */}
                    <div className="w-full rounded-[1.5rem] bg-[#F4F7F8]/80 border border-[#E9EDF2] p-4 flex flex-col gap-2 shadow-inner mt-1">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col text-left">
                                <span className="font-black text-[16px] text-slate-700 leading-none">오늘의 퀘스트 현황</span>
                                <span className="font-bold text-[12px] text-slate-400 mt-1">올클리어 시 +200 XP!</span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full font-black text-[11px] ${allDone ? 'bg-[#2ED6C5] text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                {missionDone} / {missionTotal}
                            </span>
                        </div>
                        <div className="w-full flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden shadow-inner">
                                <div className="quiz-progress-fill"
                                    style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #2ED6C5, #0D9488)', boxShadow: '0 0 6px rgba(46,214,197,0.3)' }} />
                            </div>
                            <span className="font-black text-[11px] text-[#0D9488] min-w-[28px] text-right">{Math.round(progressPct)}%</span>
                        </div>
                    </div>

                    {/* 기로 선택 3D 버튼 영역 */}
                    <div className="w-full flex flex-col gap-3 mt-2">
                        {/* 기로 A: 다음 단계 계속 도전하기 */}
                        {!isFinalDay && (
                            <CtaButton theme="coral" onClick={onContinueNext}>
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                    <span className="font-black text-white text-[1.4rem] drop-shadow-md">다음 단계 계속 도전하기 ▶</span>
                                    <span className="text-[10px] text-white/90 font-bold">({dayNumber + 1}단계로 바로 넘어가서 계속 달립니다)</span>
                                </div>
                            </CtaButton>
                        )}

                        {/* 기로 B: 메인 화면으로 이동 */}
                        <CtaButton theme="indigo" onClick={onComplete}>
                            <div className="flex flex-col items-center justify-center gap-0.5">
                                <span className="font-black text-white text-[1.4rem] drop-shadow-md">메인 화면으로 이동</span>
                                <span className="text-[10px] text-white/90 font-bold">(남은 퀘스트를 채우고 올클리어 보너스 받기)</span>
                            </div>
                        </CtaButton>
                    </div>

                </div>
            </div>
        </div>
    );
};

// ── Main Orchestrator ──────────────────────────────────────────────────────
const DailySessionScreen = ({
    onComplete,
    onAdvanceDay,
    currentDay,
    srsData,
    masteryData,
    wordData,
    onMarkCorrect,
    onMarkWrong,
    onMarkWordWrong,
    onWordCorrect,
    onWordSeen,
    selectedCharacter,
    updateMissionProgress,
    addTodayStat,
    addBonusXp,
    getRewardPreview,
    onHanjaAcquired,
    userXp,
    missions,
    doneCount,
}) => {
    const [dayNumber, setDayNumber] = useState(() => currentDay || getTodayDayNumber());
    const dayData = DAILY_CURRICULUM[dayNumber - 1] || DAILY_CURRICULUM[0];
    const rawTodayHanja = useMemo(() => (dayData.hanja || []).filter(h => h.id !== null), [dayData]);

    const pastHanjaIds = useMemo(() => {
        const result = [];
        for (let d = 0; d < dayNumber - 1 && d < DAILY_CURRICULUM.length; d++) {
            (DAILY_CURRICULUM[d].hanja || []).forEach(h => { if (h.id) result.push(h.id); });
        }
        return result;
    }, [dayNumber]);

    const fallbackReviewIds = useMemo(() => {
        return [...new Set(pastHanjaIds)].slice(-3);
    }, [pastHanjaIds]);

    const todayHanja = useMemo(() => {
        if (rawTodayHanja.length > 0) return rawTodayHanja;
        return fallbackReviewIds
            .map(id => HANJA_DATA.find(h => h.id === id))
            .filter(Boolean)
            .map(({ id, hanja, sound, meaning }) => ({ id, hanja, sound, meaning }));
    }, [rawTodayHanja, fallbackReviewIds]);

    const srsDataRef = useRef(srsData);
    const masteryDataRef = useRef(masteryData);
    const wordDataRef = useRef(wordData);
    useEffect(() => { srsDataRef.current = srsData; }, [srsData]);
    useEffect(() => { masteryDataRef.current = masteryData; }, [masteryData]);
    useEffect(() => { wordDataRef.current = wordData; }, [wordData]);

    const todayHanjaIds = useMemo(() => todayHanja.map(h => h.id).filter(Boolean), [todayHanja]);
    const [contentPool, setContentPool] = useState(() =>
        buildUnifiedPool(todayHanjaIds, HANJA_DATA, srsData, masteryData, pastHanjaIds, 0.3, wordData)
    );
    const contentPoolKey = useMemo(() => {
        return `${dayNumber}:${todayHanjaIds.join(',')}:${pastHanjaIds.join(',')}`;
    }, [dayNumber, todayHanjaIds, pastHanjaIds]);
    useEffect(() => {
        setContentPool(buildUnifiedPool(todayHanjaIds, HANJA_DATA, srsDataRef.current, masteryDataRef.current, pastHanjaIds, 0.3, wordDataRef.current));
        // srs/mastery/wordData 변경은 문제 풀이 중 큐를 리셋하지 않기 위해 의도적으로 제외한다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contentPoolKey]);

    const sessionQueueRef = useRef({ wordIds: [], wordIdx: 0 });
    useEffect(() => {
        if (!contentPool) { sessionQueueRef.current = { wordIds: [], wordIdx: 0 }; return; }
        const sh = (a) => [...a].sort(() => Math.random() - 0.5);
        sessionQueueRef.current = {
            wordIds: sh([...(contentPool.main?.wordIds || []), ...(contentPool.review?.wordIds || [])]),
            wordIdx: 0,
        };
    }, [contentPool]);

    const getNextWordIds = useCallback((n) => {
        const q = sessionQueueRef.current;
        if (!q.wordIds.length) return [];
        let { wordIds, wordIdx } = q;
        const result = [];
        while (result.length < n) {
            if (wordIdx >= wordIds.length) { wordIds = [...wordIds].sort(() => Math.random() - 0.5); wordIdx = 0; }
            result.push(wordIds[wordIdx++]);
        }
        sessionQueueRef.current = { ...q, wordIds, wordIdx };
        return result;
    }, []);

    // step: 'intro' | 'flashcard' | 'sentenceQuiz' | 'dice' | 'shoot' | 'match' | 'results'
    const [step, setStep] = useState('intro');
    const [resumeStep, setResumeStep] = useState('flashcard');
    const [chosenGame, setChosenGame] = useState(null);
    const [chosenQuiz, setChosenQuiz] = useState(null);
    const [seenHanjaIds, setSeenHanjaIds] = useState([]);
    const [seenWordIds, setSeenWordIds] = useState([]);
    const sessionDoneTypesRef = useRef(new Set());
    const [sessionDoneCount, setSessionDoneCount] = useState(0);

    const markHanjaSeen = (ids) => {
        if (!ids?.length) return;
        setSeenHanjaIds(prev => { const s = new Set(prev); ids.forEach(id => { if (id != null) s.add(id); }); return prev.length === s.size ? prev : [...s]; });
    };

    const trackMission = useCallback((type, amount, onBonusXp) => {
        if (!sessionDoneTypesRef.current.has(type)) {
            sessionDoneTypesRef.current.add(type);
            setSessionDoneCount(sessionDoneTypesRef.current.size);
        }
        if (updateMissionProgress) updateMissionProgress(type, amount, onBonusXp);
    }, [updateMissionProgress]);
    const markWordSeen = (ids) => {
        if (!ids?.length) return;
        setSeenWordIds(prev => { const s = new Set(prev); ids.forEach(id => { if (id != null) s.add(id); }); return prev.length === s.size ? prev : [...s]; });
    };

    const finishSession = () => { clearMapProgress(); markSessionDone(); setStep('results'); };

    const todayFullHanja = todayHanja.map(h => HANJA_DATA.find(d => d.id === h.id)).filter(Boolean);

    const renderMiniMap = (currentStepIndex) => {
        const quizLabel = chosenQuiz === 'wordQuiz' ? '단어 퀴즈' : (chosenQuiz === 'sentenceQuiz' ? '문장 퀴즈' : '오늘의 퀴즈');
        const quizIcon  = chosenQuiz === 'wordQuiz' ? '/assets/images/icons/words.webp' : (chosenQuiz === 'sentenceQuiz' ? '/assets/images/icons/sentence.webp' : '/assets/images/icons/words.webp');
        const gameLabel = chosenGame === 'shoot' ? '몬스터 슈팅' : (chosenGame === 'matchGame' ? '메모리 게임' : '오늘의 게임');
        const gameIcon  = chosenGame === 'shoot' ? '/assets/images/icons/monster.webp' : (chosenGame === 'matchGame' ? '/assets/images/icons/matching.webp' : '/assets/images/icons/monster.webp');
        const mapSteps = [
            { label: '한자 카드', icon: '/assets/images/icons/study.webp', color: '#7C83FF' },
            { label: quizLabel,  icon: quizIcon,  color: '#FF9B73' },
            { label: gameLabel,  icon: gameIcon,  color: '#2ED6C5' },
        ];
        return (
            <div className="w-full relative z-10 mt-4 px-4 mb-6">
                <div className="flex items-start justify-between w-full">
                    {mapSteps.flatMap((s, i) => {
                        const isDone = i <= currentStepIndex;
                        const els = [
                            <div key={`step-${i}`} className={`flex flex-col items-center gap-2 ${isDone ? '' : 'opacity-50 grayscale'}`}>
                                <div className="relative w-[72px] h-[72px] rounded-[1.3rem] flex items-center justify-center shadow-lg border-[3px] border-white"
                                    style={{ background: isDone ? s.color + '22' : '#f1f5f9' }}>
                                    <img src={s.icon} className="w-10 h-10 object-contain" alt={s.label} />
                                    {isDone && (
                                        <div className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shadow-md border-2 border-white"
                                            style={{ background: '#FF9B73' }}>✓</div>
                                    )}
                                </div>
                                <span className="text-[11px] font-black text-[#5B677A] text-center leading-tight max-w-[72px]">{s.label}</span>
                            </div>,
                        ];
                        if (i < mapSteps.length - 1) {
                            const connColor = isDone ? s.color : '#e2e8f0';
                            const nextColor = (i + 1) <= currentStepIndex ? mapSteps[i+1].color : '#e2e8f0';
                            els.push(
                                <div key={`conn-${i}`} className="flex-1 flex items-center mx-1" style={{ marginTop: '36px' }}>
                                    <div className="h-[3px] w-full rounded-full" style={{ background: `linear-gradient(90deg, ${connColor}, ${nextColor})`, opacity: 0.4 }} />
                                </div>
                            );
                        }
                        return els;
                    })}
                </div>
            </div>
        );
    };

    if (step === 'results') {
        return (
            <ResultsScreen
                todayHanja={todayHanja}
                onComplete={() => { if (onAdvanceDay) onAdvanceDay(); onComplete(); }}
                onContinueNext={() => {
                    if (onAdvanceDay) onAdvanceDay();
                    setDayNumber(prev => prev + 1);
                    setSeenHanjaIds([]);
                    setSeenWordIds([]);
                    sessionDoneTypesRef.current = new Set();
                    setSessionDoneCount(0);
                    setResumeStep('flashcard');
                    setStep('intro');
                }}
                selectedCharacter={selectedCharacter}
                dayNumber={dayNumber}
                missions={missions}
                doneCount={sessionDoneCount}
            />
        );
    }

    if (step === 'intro') {
        return (
            <IntroScreen
                dayNumber={dayNumber}
                theme={dayData.theme}
                todayHanja={todayFullHanja}
                onBack={onComplete}
                onStart={() => setStep(resumeStep)}
                resumeStep={resumeStep}
            />
        );
    }

    if (step === 'flashcard') {
        return (
            <DailyFlashcardView
                items={todayFullHanja}
                getRewardPreview={getRewardPreview}
                onBack={() => setStep('intro')}
                onCardFlip={() => {
                    if (addTodayStat) addTodayStat('flashcard');
                }}
                onStageClear={() => {
                    if (onHanjaAcquired) onHanjaAcquired(null, 30);
                    // 한자 카드(DailyFlashcardView)는 기획 의도에 따라 미션(퀘스트)으로 카운트하지 않음
                    setResumeStep('quizPick');
                    setStep('quizPick');
                }}
            />
        );
    }

    if (step === 'quizPick') {
        return <QuizPickScreen onResult={(quiz) => { setChosenQuiz(quiz); setStep(quiz); }} onBack={() => setStep('intro')} />;
    }

    if (step === 'sentenceQuiz') {
        return (
            <Suspense fallback={<div className="min-h-screen bg-[#F7FAF9]" />}>
                <SentenceQuizScreen
                    autoStart={true} hideRetry={true} dailyMapNode={renderMiniMap(1)}
                    onBack={() => setStep('quizPick')}
                    contentPool={contentPool}
                    onGetNextWordIds={getNextWordIds}
                    selectedCharacter={selectedCharacter}
                    userXp={userXp}
                    getRewardPreview={getRewardPreview}
                    onHanjaAcquired={onHanjaAcquired}
                    onMarkWordWrong={(wordId, hanjaId, reading, meaning, wordText) => { if (onMarkWordWrong) onMarkWordWrong(wordId, hanjaId, reading, meaning, wordText); }}
                    onWordCorrect={(wordId) => { if (onWordCorrect) onWordCorrect(wordId); }}
                    srsData={srsData} masteryData={masteryData}
                    wordData={wordData}
                    seenHanjaIds={seenHanjaIds} seenWordIds={seenWordIds}
                    onWordSeen={(wordId) => { markWordSeen([wordId]); if (onWordSeen) onWordSeen(wordId); }}
                    onStageClear={(correct, total, newSeenIds) => {
                        if (newSeenIds) markHanjaSeen(newSeenIds);
                        if (onHanjaAcquired) onHanjaAcquired(null, 20);
                        trackMission('sentenceQuiz', 1, addBonusXp);
                        if (addTodayStat) addTodayStat('sentenceQuiz', total || 1);
                        setResumeStep('dice');
                        setStep('dice');
                    }}
                    quizCount={5}
                    clearXp={20}
                />
            </Suspense>
        );
    }

    if (step === 'wordQuiz') {
        return (
            <Suspense fallback={<div className="min-h-screen bg-[#F7FAF9]" />}>
                <WordQuizScreen
                    autoStart={true} hideRetry={true} dailyMapNode={renderMiniMap(1)}
                    onBack={() => setStep('quizPick')}
                    contentPool={contentPool}
                    onGetNextWordIds={getNextWordIds}
                    selectedCharacter={selectedCharacter}
                    userXp={userXp}
                    getRewardPreview={getRewardPreview}
                    onHanjaAcquired={onHanjaAcquired}
                    onMarkWordWrong={(wordId, hanjaId, reading, meaning, wordText) => { if (onMarkWordWrong) onMarkWordWrong(wordId, hanjaId, reading, meaning, wordText); }}
                    onWordCorrect={(wordId) => { if (onWordCorrect) onWordCorrect(wordId); }}
                    srsData={srsData} masteryData={masteryData}
                    wordData={wordData}
                    seenHanjaIds={seenHanjaIds} seenWordIds={seenWordIds}
                    onWordSeen={(wordId) => { markWordSeen([wordId]); if (onWordSeen) onWordSeen(wordId); }}
                    onStageClear={(correct, total) => {
                        if (onHanjaAcquired) onHanjaAcquired(null, 20);
                        trackMission('wordQuiz', 1, addBonusXp);
                        if (addTodayStat) addTodayStat('wordQuiz', total || 1);
                        setResumeStep('dice');
                        setStep('dice');
                    }}
                    quizCount={5}
                    clearXp={20}
                />
            </Suspense>
        );
    }

    if (step === 'dice') {
        return <GamePickScreen onResult={(game) => { setChosenGame(game); setStep(game); }} onBack={() => setStep('intro')} />;
    }

    if (step === 'shoot') {
        return (
            <Suspense fallback={<div className="min-h-screen bg-[#F7FAF9]" />}>
                <ShootGameScreen
                    autoStart={true} hideRetry={true} dailyMapNode={renderMiniMap(2)}
                    onBack={() => setStep('dice')}
                    getRewardPreview={getRewardPreview}
                    onHanjaAcquired={onHanjaAcquired}
                    onGameFinish={() => { trackMission('shootGame', 1, addBonusXp); finishSession(); }}
                    contentPool={contentPool} selectedCharacter={selectedCharacter}
                    onWaveClear={(kills) => { if (addTodayStat) addTodayStat('shootGame'); if (kills) updateRecord('totalMonsterKills', kills); }}
                    onMarkCorrect={(id) => onMarkCorrect(id)}
                    onMarkWrong={(id) => onMarkWrong(id)}
                    masteryData={masteryData} srsData={srsData} currentDay={dayNumber}
                    onHanjaSeen={(ids) => markHanjaSeen(ids)}
                    seenWordIds={seenWordIds}
                    onWordSeen={(wordId) => { markWordSeen([wordId]); if (onWordSeen) onWordSeen(wordId); }}
                    onWordCorrect={(wordId) => { if (onWordCorrect) onWordCorrect(wordId); }}
                />
            </Suspense>
        );
    }

    if (step === 'match') {
        return (
            <Suspense fallback={<div className="min-h-screen bg-[#F7FAF9]" />}>
                <MatchGameScreen
                    autoStart={true} hideRetry={true} dailyMapNode={renderMiniMap(2)}
                    onBack={() => setStep('dice')}
                    onGameFinish={() => finishSession()}
                    contentPool={contentPool}
                    onHanjaAcquired={onHanjaAcquired}
                    onStageClear={(round, elapsedSec) => {
                        trackMission('matchGame', 1, addBonusXp);
                        if (onHanjaAcquired) onHanjaAcquired(null, 20);
                        if (addTodayStat) addTodayStat('matchGame');
                        if (elapsedSec != null) updateRecord('matchBestTime', elapsedSec);
                    }}
                    onMarkCorrect={(id) => onMarkCorrect(id)}
                    onMarkWrong={() => { }}
                    srsData={srsData} masteryData={masteryData}
                    getRewardPreview={getRewardPreview}
                    seenHanjaIds={seenHanjaIds}
                    onHanjaSeen={(ids) => markHanjaSeen(ids)}
                    seenWordIds={seenWordIds}
                    onWordSeen={(wordId) => { markWordSeen([wordId]); if (onWordSeen) onWordSeen(wordId); }}
                    onWordCorrect={(wordId) => { if (onWordCorrect) onWordCorrect(wordId); }}
                />
            </Suspense>
        );
    }

    return null;
};

export default DailySessionScreen;
