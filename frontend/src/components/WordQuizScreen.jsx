import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import GradeGrid, { TopicCard } from './GradeGrid.jsx';
import { getRankDetails, getCharacterImage } from '../utils/rankUtils.js';
import { getWordSRSWeightedPool } from '../utils/learningPool.js';
import { GRADES, CATEGORY_IMAGES } from '../constants/hanjaConstants.js';
import { useUnlockedHanja } from '../hooks/useUnlockedHanja.js';
import CtaButton from './common/CtaButton.jsx';
import RewardBreakdown from './common/RewardBreakdown.jsx';


// Flatten all words from all hanja into a single pool
const buildWordPool = () => {
    const pool = [];
    for (const h of HANJA_DATA) {
        if (!h.words || h.words.length === 0) continue;
        for (const w of h.words) {
            if (w.word && w.meaning && w.type !== 'idiom') {
                pool.push({
                    id: w.id,
                    hanja_char: h.hanja,
                    hanja_id: h.id,
                    grade: h.grade,
                    category: h.category || '',
                    word: w.word,
                    reading: w.reading || '',
                    meaning: w.meaning,
                    example: w.example || '',
                });
            }
        }
    }
    return pool;
};

const WORD_POOL = buildWordPool();
const ALL_MEANINGS = [...new Set(WORD_POOL.map(w => w.meaning))];
const CATEGORIES = [...new Set((HANJA_DATA || []).map(h => h.category).filter(Boolean))];

const DEFAULT_QUIZ_COUNT = 6;
const DEFAULT_CLEAR_XP = 20;

const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const pickDistractors = (correctMeaning, count = 3) => {
    const others = ALL_MEANINGS.filter(m => m !== correctMeaning);
    return shuffle(others).slice(0, count);
};

const capQuizCount = (items, quizCount) => {
    return items.slice(0, quizCount);
};

const REVIEW_SLOTS = 3; // 복습 단어 고정 슬롯

// contentPool 기반 퀴즈: main(오늘) + review(SRS) 비율로 짧은 세트 선택
// seenWordIds: 오늘 이미 본 단어 ID 목록 → 안 본 것 먼저, 다 봤으면 전체 초기화
const buildQuizFromPool = (contentPool, wordData, userLevel, seenWordIds = [], quizCount = DEFAULT_QUIZ_COUNT) => {
    const mainIdSet = new Set(contentPool.main?.wordIds || []);
    const reviewIdSet = new Set(contentPool.review?.wordIds || []);
    const mainWords = WORD_POOL.filter(w => mainIdSet.has(w.id));
    const reviewWords = WORD_POOL.filter(w => reviewIdSet.has(w.id));

    // 전체 다 봤으면 리셋 (seen 무시)
    const seenSet = new Set(seenWordIds);
    const allSeen = [...mainWords, ...reviewWords].every(w => seenSet.has(w.id));
    const effectiveSeenSet = allSeen ? new Set() : seenSet;

    const unseen = (pool) => pool.filter(w => !effectiveSeenSet.has(w.id));
    const seen   = (pool) => pool.filter(w =>  effectiveSeenSet.has(w.id));
    const pickFrom = (pool, count) => {
        const u = getWordSRSWeightedPool(unseen(pool), wordData, userLevel, count);
        const need = count - u.length;
        const usedIds = new Set(u.map(w => w.id));
        const s = need > 0 ? getWordSRSWeightedPool(seen(pool).filter(w => !usedIds.has(w.id)), wordData, userLevel, need) : [];
        return [...u, ...s];
    };

    const ratio = contentPool.ratio ?? 1.0;
    const targetMain = Math.min(Math.round(quizCount * ratio), mainWords.length);
    const targetReview = Math.min(quizCount - targetMain, reviewWords.length);
    const mainPicked = pickFrom(mainWords, targetMain);
    const reviewPicked = pickFrom(reviewWords, targetReview);
    // 빈 자리: main 나머지로 채움
    const usedIds = new Set([...mainPicked, ...reviewPicked].map(w => w.id));
    const shortfall = quizCount - mainPicked.length - reviewPicked.length;
    const fillPicked = shortfall > 0 ? pickFrom(mainWords.filter(w => !usedIds.has(w.id)), shortfall) : [];
    const picked = shuffle(capQuizCount([...mainPicked, ...reviewPicked, ...fillPicked], quizCount));
    return picked.map(item => {
        const distractors = pickDistractors(item.meaning);
        const choices = shuffle([item.meaning, ...distractors]);
        return { ...item, choices };
    });
};

const buildQuizFromWordIds = (wordIds = []) => {
    const picked = wordIds
        .map(id => WORD_POOL.find(w => w.id === id))
        .filter(Boolean);

    return picked.map(item => {
        const distractors = pickDistractors(item.meaning);
        const choices = shuffle([item.meaning, ...distractors]);
        return { ...item, choices };
    });
};

const buildQuiz = (filter, filterType, wordData, userLevel, allowedIds = null, quizCount = DEFAULT_QUIZ_COUNT) => {
    let pool;
    if (filterType === 'topic') {
        pool = WORD_POOL.filter(w => w.category === filter);
    } else {
        pool = filter === '전체' ? WORD_POOL : WORD_POOL.filter(w => w.grade === filter);
    }
    if (allowedIds) pool = pool.filter(w => allowedIds.has(w.hanja_id));
    if (pool.length < 4) pool = allowedIds ? WORD_POOL.filter(w => allowedIds.has(w.hanja_id)) : WORD_POOL;

    const picked = capQuizCount(getWordSRSWeightedPool(pool, wordData, userLevel, quizCount), quizCount);
    return picked.map(item => {
        const distractors = pickDistractors(item.meaning);
        const choices = shuffle([item.meaning, ...distractors]);
        return { ...item, choices };
    });
};

// ─── Result Screen ──────────────────────────────────────────────────────────
const ResultScreen = ({ correct, total, onRetry, onBack, onGoToReview, selectedCharacter, dailyMapNode, hideRetry, getRewardPreview, clearXp = DEFAULT_CLEAR_XP, missionXp = 0 }) => {
    const pct = Math.round((correct / total) * 100);
    const isClear = pct >= 70;
    const xpPerCorrect = 5;
    const correctXp = correct * xpPerCorrect;
    const reward = getRewardPreview?.(correctXp + clearXp);

    if (dailyMapNode) {
        return (
            <div className="quiz-result-backdrop">
                <div className="w-full max-w-sm flex flex-col items-center overflow-hidden rounded-[2.5rem] bg-white border-4 border-white shadow-[0_20px_50px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] relative animate-in zoom-in-95 duration-200">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2ED6C5] rounded-full blur-[80px] opacity-20 pointer-events-none" />
                    
                    <div className="pt-10 pb-8 px-7 flex flex-col items-center gap-6 w-full relative z-10">
                        
                        {/* 텍스트 영역 */}
                        <div className="text-center flex flex-col gap-1 w-full">
                            {!isClear && <span className="text-sm font-extrabold text-[#94A3B8]">아쉬운 결과네요...</span>}
                            <h1 className="text-3xl font-black leading-tight mt-1" style={{ color: isClear ? '#FF9B73' : '#FF6B6B', letterSpacing: '-0.02em', textShadow: isClear ? '0 2px 10px rgba(255,160,120,0.15)' : 'none' }}>
                                {isClear ? '와우! 참 잘했어요!' : <>괜찮아요,<br/>다시 도전해봐요!</>}
                            </h1>
                            <p className="body-muted break-keep mt-2">
                                {isClear 
                                    ? <>총 {total}문제 중 {correct}문제를 맞혔어요!<span className="text-[0.85em] inline-block ml-1">🔥</span></> 
                                    : '조금만 더 노력하면 성공할 수 있어요!'}
                            </p>
                        </div>

                        {/* 심플하고 직관적인 여정 지도 (Stepper) */}
                        <div className="w-full">
                            {dailyMapNode}
                        </div>

                        <RewardBreakdown
                            reward={reward}
                            correctXp={correctXp}
                            clearXp={clearXp}
                            detailText={`${correct}문제 x ${xpPerCorrect}XP + 완료 ${clearXp}XP`}
                            missionXp={missionXp}
                        />

                        {/* 3D 다음 단계 버튼 */}
                        <div className="w-full mt-3">
                            <CtaButton theme="coral" onClick={onBack}>
                                <span className="quiz-cta-text">다음 단계로 이동</span>
                                <span className="quiz-cta-text ml-2">▶</span>
                            </CtaButton>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300"
            style={{ background: isClear ? 'linear-gradient(180deg, #DDF1EA 0%, #EAF6F2 100%)' : 'linear-gradient(180deg, #FDEAEA 0%, #FFF0F0 100%)' }}
        >
            <div className="w-full max-w-sm flex flex-col items-center result-card-container overflow-visible">
                <div className={`pt-6 pb-10 px-6 flex flex-col items-center gap-7 w-full relative`}>
                    
                    {/* 캐릭터 아래 백그라운드 글로우 추가 */}
                    <div className="absolute top-[28px] w-[140px] h-[140px] rounded-full blur-xl z-0" className="char-bg-glow" />

                    {/* 아이콘 */}
                    <img
                        src={isClear ? getCharacterImage(selectedCharacter, 'success') : getCharacterImage(selectedCharacter, 'failure')}
                        alt={isClear ? "clear" : "fail"}
                        className="w-[176px] h-[176px] object-contain relative z-10 mt-4"
                        className="img-shadow-lg"
                    />

                    {/* 텍스트 */}
                    <div className="text-center flex flex-col gap-2 relative z-10 -mt-5">
                        {!isClear && <span className="text-sm-res font-extrabold text-[#AEB7C5]">아쉬운 결과네요...</span>}
                        <h1 className="text-h2-res font-black leading-snug" style={{
                            color: isClear ? '#FF9B73' : '#FF6B6B',
                            letterSpacing: '-0.5px',
                            textShadow: isClear ? '0 2px 10px rgba(255,160,120,0.16)' : 'none'
                        }}>
                            {isClear ? '와우! 참 잘했어요!' : <>괜찮아요,<br/>다시 도전해봐요!</>}
                        </h1>
                        <p className="body-muted break-keep" style={{ fontSize: "var(--text-sm)" }}>
                            {isClear 
                                ? <>총 {total}문제 중 {correct}문제를 맞혔어요!<span className="text-[0.85em] inline-block ml-1">🔥</span></> 
                                : '조금만 더 노력하면 성공할 수 있어요!'}
                        </p>
                    </div>

                    <RewardBreakdown
                        reward={reward}
                        correctXp={correctXp}
                        clearXp={clearXp}
                        detailText={`${correct}문제 x ${xpPerCorrect}XP + 완료 ${clearXp}XP`}
                        missionXp={missionXp}
                    />

                        {/* 버튼 2단 */}
                        <div className="w-full flex flex-col gap-3 relative z-10">
                            {!hideRetry && (
                                <CtaButton theme="coral" onClick={onRetry}>
                                    <span className="quiz-cta-text">다시 풀기</span>
                                </CtaButton>
                            )}
                            <button
                                onClick={onBack}
                            className="w-full py-5 rounded-2xl font-black text-[1.5rem] active:scale-95 transition-all shadow-sm back-quiz-button"
                        >
                            돌아가기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Quiz Card ──────────────────────────────────────────────────────────────
const speakKorean = (text, onEnd) => {
    if (!text) return;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
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

const CELEB_MESSAGES = [
    "대단해요! 정답이에요",
    "한자 지식이 마구 쌓여요!",
    "정답을 꿰뚫는 혜안!",
    "완벽한 어휘력이에요!",
    "탐험 진도 쾌속 질주!",
    "한자 마스터의 감각!"
];

const QuizCard = ({ q, onAnswer, onNext, onPrev, combo, suppressXp, isFirst, onWrongAttempt }) => {
    const [wrongChoices, setWrongChoices] = useState([]);
    const [isCorrectSelected, setIsCorrectSelected] = useState(false);
    const [showXPPopup, setShowXPPopup] = useState(false);
    const [xpAnimKey, setXpAnimKey] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [celebrationMsg, setCelebrationMsg] = useState('');
    const celebrationIndexRef = useRef(0);
    const flipTimerRef = useRef(null);
    const flipSeqRef = useRef(0);

    useEffect(() => {
        return () => {
            if (flipTimerRef.current) {
                clearTimeout(flipTimerRef.current);
                flipTimerRef.current = null;
            }
            flipSeqRef.current += 1;
            window.speechSynthesis?.cancel();
        };
    }, []);

    const handleSelect = (choice) => {
        if (isCorrectSelected || wrongChoices.includes(choice)) return;
        if (choice === q.meaning) {
            setIsCorrectSelected(true);
            const nextMsg = CELEB_MESSAGES[celebrationIndexRef.current % CELEB_MESSAGES.length];
            celebrationIndexRef.current += 1;
            setCelebrationMsg(nextMsg);
            if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
            const flipSeq = flipSeqRef.current + 1;
            flipSeqRef.current = flipSeq;
            flipTimerRef.current = setTimeout(() => {
                if (flipSeqRef.current !== flipSeq) return;
                setIsFlipped(true);
                flipTimerRef.current = null;
                handleSpeak();
            }, 1500);
            if (!suppressXp) {
                setShowXPPopup(true);
                setXpAnimKey(k => k + 1);
                setTimeout(() => setShowXPPopup(false), 1500);
            }
        } else {
            if (wrongChoices.length === 0) onWrongAttempt?.(q);
            setWrongChoices(prev => [...prev, choice]);
        }
    };

    const handleNext = () => {
        window.speechSynthesis?.cancel();
        if (flipTimerRef.current) {
            clearTimeout(flipTimerRef.current);
            flipTimerRef.current = null;
        }
        flipSeqRef.current += 1;
        setIsFlipped(false);
        setIsSpeaking(false);
        onAnswer(wrongChoices.length === 0);
        if (onNext) onNext();
    };

    const handleSpeak = () => {
        if (!q.reading) return;
        setIsSpeaking(true);
        speakKorean(q.reading, () => setIsSpeaking(false));
    };

    // 가로형 레이아웃에 맞춘 다이나믹 폰트
    const wordLen = q.word?.length || 0;
    const wordFontSize = wordLen > 6 ? 'text-[3.5rem] sm:text-[4.5rem]' :
                         wordLen > 4 ? 'text-[4.5rem] sm:text-[6rem]' :
                                       'text-[6rem] sm:text-[8rem]';

    return (
        <div className="flex flex-col gap-3 w-full animate-in fade-in duration-500">
            <style>{`
                @keyframes star-burst-1 {
                    0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translate(-80px, -45px) scale(1.2) rotate(180deg); opacity: 0; }
                }
                @keyframes star-burst-2 {
                    0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translate(80px, -35px) scale(1) rotate(-120deg); opacity: 0; }
                }
                @keyframes star-burst-3 {
                    0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translate(-45px, -65px) scale(1.3) rotate(90deg); opacity: 0; }
                }
                @keyframes star-burst-4 {
                    0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translate(45px, -65px) scale(0.9) rotate(-90deg); opacity: 0; }
                }
                @keyframes star-burst-5 {
                    0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translate(-65px, 35px) scale(1.1) rotate(140deg); opacity: 0; }
                }
                @keyframes star-burst-6 {
                    0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translate(65px, 35px) scale(1) rotate(-140deg); opacity: 0; }
                }
                @keyframes pop-bubble {
                    0% { transform: scale(0.8) translateY(10px) translateX(-50%); opacity: 0; }
                    100% { transform: scale(1) translateY(0) translateX(-50%); opacity: 1; }
                }
                @keyframes fade-out-up {
                    0% { transform: scale(1) translateY(0) translateX(-50%); opacity: 1; }
                    100% { transform: scale(0.9) translateY(-10px) translateX(-50%); opacity: 0; }
                }
            `}</style>

            {/* XP 팝업 오버레이 */}
            {showXPPopup && (
                <div
                    key={xpAnimKey}
                    className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100]"
                    style={{ animation: 'xpFloat 1.5s ease-in-out forwards', paddingBottom: '120px' }}
                >
                    <div className="flex flex-col items-center gap-2">
                        {(combo + 1) > 1 && (
                            <div
                                className="px-4 py-1.5 rounded-full font-extrabold text-white text-sm"
                                style={{ backgroundColor: '#4A51D4', boxShadow: '0 4px 12px rgba(74,81,212,0.45)' }}
                            >
                                🔥 {combo + 1}연속 정답!
                            </div>
                        )}
                        <div className="xp-popup-badge">
                            ⭐ +5 XP
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-5 w-full animate-in slide-in-from-bottom-6 duration-400">
                {/* ── 상단 카드 영역 (정답 시 플립 가능) ── */}
                <div 
                    className="relative w-full aspect-[21/9] sm:aspect-[16/9] card-flip-perspective"
                    onClick={() => {
                        if (isCorrectSelected) {
                            setIsFlipped(!isFlipped);
                            if (!isFlipped) handleSpeak();
                        }
                    }}
                >
                    <div 
                        className={`relative w-full h-full transition-all duration-700 ${isCorrectSelected ? 'cursor-pointer shadow-2xl' : ''} rounded-[4rem]`}
                        style={{ 
                            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                            transformStyle: 'preserve-3d',
                            WebkitTransformStyle: 'preserve-3d'
                        }}
                    >
                        {/* 카드 앞면: 문제 단어 */}
                        <div 
                            className="absolute inset-0 bg-white rounded-[4rem] border-[10px] border-white flex flex-col items-center justify-center p-3 overflow-hidden shadow-xl"
                            style={{ 
                                backfaceVisibility: 'hidden', 
                                WebkitBackfaceVisibility: 'hidden',
                                transform: 'rotateY(0deg)',
                                zIndex: isFlipped ? 0 : 1
                            }}
                        >
                            <span className={`hanja-char ${wordFontSize} font-black text-[#1e293b] tracking-tighter drop-shadow-sm text-center leading-none`}>
                                {q.word}
                            </span>
                        </div>

                        {/* 카드 뒷면: 정답 및 예문 */}
                        {isCorrectSelected && (
                        <div
                            className="absolute inset-0 bg-white rounded-[4rem] border-[10px] border-white flex flex-col items-center justify-center px-6 py-4 shadow-xl overflow-y-auto [&::-webkit-scrollbar]:hidden"
                            style={{
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                                zIndex: isFlipped ? 1 : 0,
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none'
                            }}
                        >
                            {/* 우상단 스피커 아이콘 */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleSpeak(); }}
                                className={`absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-sm border-2 border-slate-100 ${isSpeaking ? 'bg-[#7C83FF] text-white' : 'bg-[#F8FAF9] text-[#AEB7C5] hover:bg-[#F2F3FF] hover:text-[#7C83FF]'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                            </button>

                            <div className="flex flex-col items-center gap-2 max-h-full my-auto w-full">
                                {/* 상단: 한자음 및 한자어 그룹 (가로 배치) */}
                                <div className="flex flex-row items-baseline gap-3 justify-center">
                                    <span className="text-5xl sm:text-[4.5rem] font-black text-[#4F56D9] tracking-tighter leading-none" style={{ textShadow: '0 0 10px rgba(79,86,217,0.10)' }}>
                                        {q.reading}
                                    </span>
                                    <span className="text-xl sm:text-2xl font-bold text-[#AEB7C5] tracking-widest">
                                        ({q.word})
                                    </span>
                                </div>

                                {/* 하단: 예문 영역 */}
                                <div className="w-full flex flex-col items-center text-center px-1 mt-5">
                                    <p className="text-body-res font-medium text-[#5B677A] leading-relaxed break-keep tracking-tight">
                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-[#7C83FF]/10 text-[#7C83FF] text-sm font-black mr-2 shadow-sm border border-[#7C83FF]/20 transform -translate-y-0.5">
                                            예문
                                        </span>
                                        <span className="text-[#5B677A]">
                                            {q.example ? q.example.replace(/\(\s*\)/g, q.word).trim().replace(/\s+/g, ' ') : ''}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                </div>

                {/* ── 4지선다 보기 (정답 후에도 유지) ── */}
                <div className="grid grid-cols-1 gap-2 w-full">
                    {q.choices && q.choices.map((choice, idx) => {
                        const isWrong = wrongChoices.includes(choice);
                        const isCorrect = isCorrectSelected && choice === q.meaning;
                        return (
                            <button
                                key={idx}
                                onClick={() => handleSelect(choice)}
                                disabled={isCorrectSelected}
                                className={`quiz-choice-btn ${isCorrect ? 'quiz-choice-btn--correct' : isWrong ? 'quiz-choice-btn--wrong' : isCorrectSelected ? 'quiz-choice-btn--dimmed' : ''}`}
                            >
                                <span>{choice}</span>
                                {isCorrect && <span className="text-[#7C83FF] shrink-0 ml-2">✓</span>}
                                {isWrong && <span className="text-[#FF8D72] shrink-0 ml-2">✕</span>}

                                {/* 정답 축하 3D 스피치 버블 및 별 쏟아짐 효과 */}
                                {isCorrect && celebrationMsg && (
                                    <div 
                                        className="absolute bottom-[125%] left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-[1.3rem] text-white font-extrabold text-[1.05rem] shadow-xl flex items-center justify-center whitespace-nowrap z-[20] pointer-events-none"
                                        style={{
                                            background: 'linear-gradient(135deg, #FF9B73 0%, #FF6B6B 100%)',
                                            boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3), inset 0 -3px 0 rgba(0,0,0,0.15)',
                                            animation: 'pop-bubble 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, fade-out-up 0.3s ease-in 1.2s forwards'
                                        }}
                                    >
                                        <span className="drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.15)]">{celebrationMsg}</span>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#FF6B6B]" />
                                    </div>
                                )}

                                {isCorrect && (
                                    <>
                                        <span className="absolute left-[15%] top-1/2 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-1 1s ease-out forwards' }}>⭐</span>
                                        <span className="absolute left-[35%] top-1/2 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-2 1.2s ease-out forwards' }}>✨</span>
                                        <span className="absolute left-[45%] top-1/3 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-3 0.9s ease-out forwards' }}>⭐</span>
                                        <span className="absolute left-[55%] top-1/2 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-4 1.1s ease-out forwards' }}>✨</span>
                                        <span className="absolute left-[65%] top-1/2 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-5 1.3s ease-out forwards' }}>⭐</span>
                                        <span className="absolute left-[85%] top-1/3 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-6 1s ease-out forwards' }}>✨</span>
                                        <span className="absolute left-[25%] top-2/3 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-3 1.1s ease-out forwards' }}>⭐</span>
                                        <span className="absolute left-[75%] top-2/3 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-1 1.2s ease-out forwards' }}>✨</span>
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── 하단 네비게이션 (정답 후 나타남) ── */}
                {isCorrectSelected && (
                    <div className="w-full flex gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                        {!isFirst && (
                            <button onClick={onPrev} className="quiz-prev-btn flex-[1.5]">
                                이전
                            </button>
                        )}
                        <button onClick={handleNext} className="quiz-next-btn flex-[2.5]">
                            다음
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const WordQuizScreen = ({ onBack, onHanjaAcquired, onMarkCorrect, onMarkWrong, onMarkWordWrong, onWordCorrect, onStageClear, onWordSeen, onGoToReview, srsData, masteryData, wordData, userLevel, userXp, selectedCharacter, getRewardPreview, contentPool, onGetNextWordIds, unlockedHanjaIds, seenWordIds, dailyMapNode, hideRetry, quizCount = DEFAULT_QUIZ_COUNT, clearXp = DEFAULT_CLEAR_XP }) => {
    const [viewMode, setViewMode] = useState('grade');
    const [gradeFilter, setGradeFilter] = useState('전체');
    const [categoryFilter, setCategoryFilter] = useState(CATEGORIES[0] || '');
    const [phase, setPhase] = useState(contentPool ? 'init' : 'select');
    const [showExitModal, setShowExitModal] = useState(false);
    const handleExitConfirm = () => {
        setShowExitModal(false);
        onBack();
    };
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const correctCountRef = useRef(0); // stale 클로저 방지: handleNext에서 항상 최신값 사용
    const [combo, setCombo] = useState(0);
    const [, setMaxCombo] = useState(0);
    const comboRef = useRef(0);
    const maxComboRef = useRef(0); // stale 클로저 방지
    const clearCountRef = useRef(0);
    const stageClearArgsRef = useRef(null); // 결과 화면 표시 후 onBack 시점에 전달할 데이터
    const stageClearDeliveredRef = useRef(false);

    const characterAvatar = useMemo(() => getRankDetails(userXp, selectedCharacter).avatar, [userXp, selectedCharacter]);

    const { unlockedIds, unlockedGrades } = useUnlockedHanja(unlockedHanjaIds);

    const startQuiz = useCallback((overrideFilter, overrideViewMode) => {
        if (stageClearArgsRef.current && !stageClearDeliveredRef.current) {
            onStageClear?.(...stageClearArgsRef.current);
            stageClearDeliveredRef.current = true;
            stageClearArgsRef.current = null;
        }
        if (contentPool) {
            const sharedWordIds = onGetNextWordIds?.(quizCount) || [];
            const sharedQuestions = buildQuizFromWordIds(sharedWordIds);
            setQuestions(
                sharedQuestions.length > 0
                    ? sharedQuestions
                    : buildQuizFromPool(contentPool, wordData, userLevel, seenWordIds || [], quizCount)
            );
        } else {
            const effectiveViewMode = overrideViewMode || viewMode;
            const filter = overrideFilter != null ? overrideFilter : (effectiveViewMode === 'topic' ? categoryFilter : gradeFilter);
            setQuestions(buildQuiz(filter, effectiveViewMode, wordData, userLevel, unlockedIds, quizCount));
        }
        setCurrentIdx(0);
        setCorrectCount(0);
        correctCountRef.current = 0;
        comboRef.current = 0;
        setCombo(0);
        setMaxCombo(0);
        maxComboRef.current = 0;
        stageClearDeliveredRef.current = false;
        setPhase('quiz');
    }, [viewMode, gradeFilter, categoryFilter, wordData, userLevel, contentPool, onGetNextWordIds, unlockedIds, seenWordIds, quizCount, onStageClear]);

    const startQuizRef = useRef(null);
    useEffect(() => { startQuizRef.current = startQuiz; });
    useEffect(() => {
        if (!contentPool || (phase !== 'select' && phase !== 'init')) return;
        const timer = setTimeout(() => startQuizRef.current?.(), 0);
        return () => clearTimeout(timer);
    }, [contentPool, phase]);

    const handleAnswer = useCallback((isCorrect) => {
        const q = questions[currentIdx];
        if (q?.id != null) onWordSeen?.(q.id);
        if (isCorrect) {
            correctCountRef.current += 1;
            setCorrectCount(correctCountRef.current);
            comboRef.current += 1;
            setCombo(comboRef.current);
            const newMax = Math.max(maxComboRef.current, comboRef.current);
            maxComboRef.current = newMax;
            setMaxCombo(newMax);
            if (onHanjaAcquired && q?.hanja_id) onHanjaAcquired(q.hanja_id, 5);
            if (onMarkCorrect && q?.hanja_id) onMarkCorrect(q.hanja_id);
            if (onWordCorrect) onWordCorrect(q.id);
        } else {
            comboRef.current = 0;
            setCombo(0);
        }
    }, [questions, currentIdx, onHanjaAcquired, onMarkCorrect, onWordCorrect, onWordSeen]);

    const handleNext = useCallback(() => {
        const next = currentIdx + 1;
        if (next < questions.length) {
            setCurrentIdx(next);
        } else {
            // onStageClear는 결과 화면에서 "돌아가기" 버튼을 눌렀을 때 호출
            // (여기서 바로 호출하면 completeStep → setActivity(null) 로 컴포넌트가
            //  언마운트되어 결과 화면이 표시되지 않고 흰 화면이 나타나는 버그 발생)
            // ref 값을 사용해 stale 클로저 문제 방지
            const seenWords = [...new Set(questions.map(q => q.id).filter(v => v != null))];
            if (correctCountRef.current / questions.length >= 0.7) {
                clearCountRef.current += 1;
            }
            stageClearArgsRef.current = [correctCountRef.current, questions.length, maxComboRef.current, seenWords];
            if (!dailyMapNode) {
                onStageClear?.(...stageClearArgsRef.current);
                stageClearDeliveredRef.current = true;
                stageClearArgsRef.current = null;
            }
            setPhase('result');
        }
    }, [questions, currentIdx, dailyMapNode, onStageClear]);

    const handlePrev = useCallback(() => {
        if (currentIdx > 0) {
            setCurrentIdx(currentIdx - 1);
        }
    }, [currentIdx]);

    return (
        <div className="w-full min-h-[100dvh] flex flex-col max-w-screen-xl mx-auto" style={{ backgroundColor: phase === 'select' ? '#F7FAF9' : '#F8FAFC' }}>

            {/* 헤더 */}
            <div className="w-full shrink-0 safe-top pt-2 px-4 mb-1">
                <div className="quiz-header-card quiz-header-card--sm">
                    <button onClick={(phase === 'quiz') ? () => setShowExitModal(true) : onBack}
                        className="hp-nav-button">
                        <span>{(phase === 'quiz') ? '✕' : '←'}</span>
                    </button>
                    <div className="quiz-header-title-area">
                        <h2 className="quiz-screen-title">단어 퀴즈</h2>
                        <p className="screen-subtitle">한자의 뜻과 음을 골라보세요</p>
                    </div>
                    <div className="quiz-header-right">
                        {phase === 'quiz' && (
                            <span className="quiz-counter-text">{currentIdx + 1}/{questions.length}</span>
                        )}
                    </div>
                </div>
                {/* 진행 바 — 10px 강화 버전 + 캐릭터 아바타 */}
                {phase === 'quiz' && (
                    <div className="w-full h-[10px] bg-[#F4F7F8] rounded-full mt-2 relative px-1 mx-auto max-w-[90%]">
                        <div
                            className="h-full transition-all duration-700 rounded-full bg-[#7C83FF] relative"
                            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-9 h-9 bg-white rounded-full shadow-xl border-2 border-[#7C83FF] flex items-center justify-center overflow-hidden z-10 transition-all duration-700">
                                <img src={characterAvatar} className="w-7 h-7 object-contain" alt="progress-pawn" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="pb-6">
                <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-6 pt-5">

                    {phase === 'select' && (
                        <div className="flex flex-col items-center w-full animate-in fade-in duration-500">

                            {/* 탭 */}
                            <div className="flex bg-[#F4F7F8]/40 p-1.5 rounded-full border border-[#E9EDF2] w-full mb-4 shadow-inner">
                                <button
                                    onClick={() => setViewMode('grade')}
                                    className={`flex-1 px-8 py-3 rounded-full font-bold text-h3 transition-all ${viewMode === 'grade' ? 'bg-white shadow-md text-[#5B677A]' : 'text-[#AEB7C5]'}`}
                                >
                                    급수별
                                </button>
                                <button
                                    onClick={() => setViewMode('topic')}
                                    className={`flex-1 px-8 py-3 rounded-full font-bold text-h3 transition-all ${viewMode === 'topic' ? 'bg-white shadow-md text-[#5B677A]' : 'text-[#AEB7C5]'}`}
                                >
                                    주제별
                                </button>
                            </div>

                            {/* 급수별 */}
                            {viewMode === 'grade' && (
                                <GradeGrid
                                    selected={gradeFilter}
                                    onSelect={g => setGradeFilter(g)}
                                    lockedGrades={GRADES.filter(g => g !== '전체' && !unlockedGrades.has(g))}
                                />
                            )}

                            {/* 주제별 */}
                            {viewMode === 'topic' && (
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    {CATEGORIES.map(cat => (
                                        <TopicCard
                                            key={cat}
                                            name={cat}
                                            imgSrc={CATEGORY_IMAGES[cat] ? `/assets/images/hanja_all/${CATEGORY_IMAGES[cat]}` : null}
                                            count={`${HANJA_DATA.filter(h => h.category === cat).length}개`}
                                            isSelected={categoryFilter === cat}
                                            onClick={() => setCategoryFilter(cat)}
                                            locked={!HANJA_DATA.some(h => h.category === cat && unlockedIds.has(h.id))}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* 캐릭터 영역 */}
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

                            {/* 게임 시작 버튼 */}
                            <div className="w-full max-w-sm px-4 pb-4 -mt-2.5">
                                <button
                                    onClick={() => startQuiz()}
                                    className="w-full py-5 rounded-[2rem] font-bold text-h3 text-white transition-all active:scale-95 shadow-[0_8px_24px_rgba(255,168,141,0.35)] flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none"
                                    style={{ 
                                        background: 'linear-gradient(135deg, #FFA88D 0%, #FF8D72 100%)',
                                        borderBottom: '6px solid #E0735A'
                                    }}
                                >
                                    <span>퀴즈 시작!</span>
                                </button>
                            </div>

                        </div>
                    )}

                    {phase === 'quiz' && currentIdx < questions.length && (
                        <QuizCard
                            key={currentIdx}
                            q={questions[currentIdx]}
                            onAnswer={handleAnswer}
                            onNext={handleNext}
                            onPrev={handlePrev}
                            combo={combo}
                            suppressXp={!!contentPool}
                            isFirst={currentIdx === 0}
                            onWrongAttempt={(q) => {
                                if (onMarkWordWrong && q?.id != null) onMarkWordWrong(q.id, q.hanja_id, q.reading, q.meaning, q.word);
                            }}
                        />
                    )}

                    {phase === 'result' && (
                        <ResultScreen
                            correct={correctCount}
                            total={questions.length}
                            onRetry={startQuiz}
                            onBack={() => {
                                if (stageClearArgsRef.current && !stageClearDeliveredRef.current) {
                                    onStageClear?.(...stageClearArgsRef.current);
                                    stageClearDeliveredRef.current = true;
                                    stageClearArgsRef.current = null;
                                }
                                if (!dailyMapNode) onBack();
                            }}
                            onGoToReview={onGoToReview}
                            selectedCharacter={selectedCharacter}
                            dailyMapNode={dailyMapNode}
                            hideRetry={hideRetry}
                            getRewardPreview={getRewardPreview}
                            clearXp={clearXp}
                            missionXp={(clearCountRef.current === 1) ? 30 : 0}
                        />
                    )}
                </div>
            </div>
            {showExitModal && (
                <div className="modal-overlay">
                    <div className="quiz-result-card">
                        <img
                            src={getCharacterImage(selectedCharacter, 'keep_going')}
                            alt="exit confirm"
                            className="quiz-char-img"
                            className="img-shadow-sm"
                        />
                        <div className="quiz-result-content">
                            <h2 className="quiz-result-title">
                                {dailyMapNode ? '학습 지도로 돌아갈까요?' : '정말 퀴즈를 중단할까요?'}
                            </h2>
                            <p className="body-muted break-keep">
                                {dailyMapNode ? '지도로 돌아가면 진행 중인 퀴즈는 완료되지 않아요. 계속 끝까지 풀어볼까요?' : '지금 나가면 진행 중인 퀴즈의 학습 진행 상황이 저장되지 않아요. 계속 끝까지 풀어볼까요?'}
                            </p>
                        </div>
                        <div className="w-full flex flex-col gap-3">
                            <CtaButton theme="indigo" onClick={() => setShowExitModal(false)}>
                                <span className="quiz-cta-text">계속 공부하기</span>
                            </CtaButton>
                            <button
                                onClick={handleExitConfirm}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg active:scale-95 transition-all shadow-sm back-quiz-button"
                            >
                                {dailyMapNode ? '학습 지도로 돌아가기' : '그만하고 나가기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WordQuizScreen;
