import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { useLang } from '../LangContext.jsx';
import { buildSessionPlan } from '../utils/learningPool.js';

// 단어 → reading 역조회 맵 (보기에 한글 독음 병기용)
const CATEGORY_IMAGES = {
    '숫자와 기초 개념': '1_一.webp',
    '자연과 시간': '31_日.webp',
    '나와 가족 신체': '71_父.webp',
    '공간과 위치': '111_東.webp',
    '학교와 일상생활': '151_學.webp',
    '행동과 상태': '201_來.webp',
    '사회와 문화': '251_國.webp',
};
const wordReadingMap = {};
HANJA_DATA.forEach(h => {
    (h.words || []).forEach(w => {
        if (w.word && w.reading) wordReadingMap[w.word] = w.reading;
    });
});

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
    if (type === 'correct') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(800, now + 0.2);
        gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        gainNode.gain.setValueAtTime(0.15, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    }
};

const SentenceQuizScreen = ({ onBack, onHanjaAcquired, onMarkCorrect, onMarkWrong, onStageClear, onGoToReview, srsData, masteryData, userLevel, hanjaFilter }) => {
    const { t } = useLang();

    // ── 선택 상태 ──────────────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState('grade'); // 'grade' | 'topic'
    const categories = useMemo(() => [...new Set(HANJA_DATA.map(h => h.category).filter(Boolean))], []);

    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
    const [selectedGrade, setSelectedGrade] = useState('8급');

    // ── 퀴즈 진행 상태 ────────────────────────────────────────────────────
    const [started, setStarted] = useState(false);
    const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'feedback' | 'result'
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [options, setOptions] = useState([]);
    const [score, setScore] = useState(0);
    const [totalAnswered, setTotalAnswered] = useState(0);
    const [wrongAttempts, setWrongAttempts] = useState([]);
    const [isCorrectSelected, setIsCorrectSelected] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [combo, setCombo] = useState(0);
    const [showXPPopup, setShowXPPopup] = useState(false);
    const [popupCombo, setPopupCombo] = useState(1);
    const [xpAnimKey, setXpAnimKey] = useState(0);
    const [isWordCardFlipped, setIsWordCardFlipped] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // ── 현재 선택된 한자 풀 ────────────────────────────────────────────────
    const activeHanjaSet = useMemo(() => {
        if (hanjaFilter && hanjaFilter.length > 0) return HANJA_DATA.filter(h => hanjaFilter.includes(h.id));
        if (viewMode === 'grade') {
            if (selectedGrade === '전체') return HANJA_DATA;
            if (selectedGrade === '기타') return HANJA_DATA.filter(h => !h.grade || h.grade === '' || h.grade === '기타' || h.grade === 'NON');
            return HANJA_DATA.filter(h => h.grade === selectedGrade);
        }
        return HANJA_DATA.filter(h => h.category === selectedCategory);
    }, [viewMode, selectedGrade, selectedCategory, hanjaFilter]);

    const reviewQueueRef = useRef([]);
    const normalQueueRef = useRef([]);
    const lastHanjaIdRef = useRef(null);
    const queuesReadyRef = useRef(false);

    const sessionPlan = useMemo(() => {
        const base = activeHanjaSet.filter(h => h.words && h.words.length > 0);
        return buildSessionPlan(base, srsData, masteryData);
        // 큐는 여기서 초기화하지 않음 — srsData/masteryData 변경마다 리셋되는 버그 방지
    }, [activeHanjaSet, srsData, masteryData, userLevel]);

    const initQueues = useCallback((overridePlan) => {
        const plan = overridePlan || sessionPlan;
        reviewQueueRef.current = [...plan.reviewQueue];
        normalQueueRef.current = [...plan.normalPool].sort(() => 0.5 - Math.random());
        lastHanjaIdRef.current = null;
        queuesReadyRef.current = true;
    }, [sessionPlan]);

    useEffect(() => {
        if (hanjaFilter && hanjaFilter.length > 0) {
            initQueues();
            setStarted(true);
            setGameState('playing');
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const pickNextFromPool = useCallback(() => {
        if (normalQueueRef.current.length === 0) {
            let reshuffled = [...sessionPlan.normalPool].sort(() => 0.5 - Math.random());
            // 연속 중복 방지: 마지막 출제 한자가 맨 앞에 오면 뒤로 밀기
            if (reshuffled.length > 1 && reshuffled[0]?.id === lastHanjaIdRef.current) {
                reshuffled = [...reshuffled.slice(1), reshuffled[0]];
            }
            normalQueueRef.current = reshuffled;
        }
        const next = normalQueueRef.current.shift();
        lastHanjaIdRef.current = next?.id ?? null;
        return next;
    }, [sessionPlan]);

    // ── 문제 생성 ──────────────────────────────────────────────────────────
    const generateQuiz = useCallback(() => {
        if (activeHanjaSet.length === 0) return;

        const hasWordPool = sessionPlan.normalPool.length > 0 || reviewQueueRef.current.length > 0;

        if (!hasWordPool) {
            // 단어 없는 경우 단순 한자 뜻/음 퀴즈
            const randomHanja = activeHanjaSet[Math.floor(Math.random() * activeHanjaSet.length)];
            const correct = randomHanja.meaning + ' ' + randomHanja.sound;
            const distractors = HANJA_DATA.filter(h => h.id !== randomHanja.id)
                .sort(() => 0.5 - Math.random()).slice(0, 3).map(h => h.meaning + ' ' + h.sound);
            setCurrentQuiz({ type: 'simple', char: randomHanja.hanja, answer: correct, meaning: randomHanja.meaning, sound: randomHanja.sound, _hanjaId: randomHanja.id });
            setOptions([...distractors, correct].sort(() => 0.5 - Math.random()));
        } else {
            // 복습 큐 우선 소진, 이후 셔플 큐에서 순환
            let selectedHanja;
            if (reviewQueueRef.current.length > 0) {
                selectedHanja = reviewQueueRef.current.shift();
                lastHanjaIdRef.current = selectedHanja?.id ?? null;
            } else {
                selectedHanja = pickNextFromPool();
            }
            const targetWord = selectedHanja.words[Math.floor(Math.random() * selectedHanja.words.length)];
            const allWords = HANJA_DATA.flatMap(h => (h.words || []).map(w => w.word));
            const distractors = [];
            while (distractors.length < 3) {
                const rw = allWords[Math.floor(Math.random() * allWords.length)];
                if (rw !== targetWord.word && !distractors.includes(rw)) distractors.push(rw);
            }
            setCurrentQuiz({ type: 'sentence', char: selectedHanja.hanja, target: targetWord, sentence: targetWord.example || `다음 한자어 '${targetWord.word}'의 뜻은?`, _hanjaId: selectedHanja.id });
            setOptions([...distractors, targetWord.word].sort(() => 0.5 - Math.random()));
        }
        setFeedback(null);
        setGameState('playing');
    }, [sessionPlan, activeHanjaSet, pickNextFromPool]);

    // 퀴즈 시작
    const startQuiz = (overridePlan) => {
        initQueues(overridePlan);
        setScore(0); setTotalAnswered(0); setCombo(0);
        setCurrentQuiz(null); setFeedback(null);
        setStarted(true);
        setGameState('playing');
    };

    useEffect(() => {
        if (started && gameState === 'playing' && !currentQuiz) {
            generateQuiz();
        }
    }, [started, gameState, currentQuiz, generateQuiz]);

    const handleAnswer = (selected) => {
        if (gameState !== 'playing' || !currentQuiz || isCorrectSelected || wrongAttempts.includes(selected)) return;

        const correctAnswer = currentQuiz.type === 'sentence'
            ? currentQuiz.target.word
            : currentQuiz.answer;
        const isCorrect = selected === correctAnswer;

        if (isCorrect) {
            const newCombo = combo + 1;
            setIsCorrectSelected(true);
            setFeedback({ isCorrect: true, selected });
            setTotalAnswered(prev => prev + 1);
            setScore(prev => prev + 1);
            setCombo(newCombo);
            setPopupCombo(newCombo);
            setShowXPPopup(false);
            setTimeout(() => {
                setShowXPPopup(true);
                setXpAnimKey(k => k + 1);
                setTimeout(() => setShowXPPopup(false), 1500);
            }, 0);
            playSound('correct');
            const hanjaId = currentQuiz._hanjaId || null;
            if (onHanjaAcquired) onHanjaAcquired(null, 10);
            if (onMarkCorrect && hanjaId) onMarkCorrect(hanjaId);
            setGameState('feedback');
        } else {
            setWrongAttempts(prev => [...prev, selected]);
            setCombo(0); playSound('wrong');
            const hanjaId = currentQuiz._hanjaId || null;
            if (onMarkWrong && hanjaId) onMarkWrong(hanjaId);
        }
    };

    const handleNext = () => {
        window.speechSynthesis?.cancel();
        setIsWordCardFlipped(false);
        setIsSpeaking(false);
        if (totalAnswered >= 10) {
            setGameState('result');
            if (onStageClear) onStageClear(score, 10);
        } else {
            generateQuiz();
            setWrongAttempts([]);
            setIsCorrectSelected(false);
            setFeedback(null);
        }
    };

    const handleSpeak = (e) => {
        e?.stopPropagation();
        const reading = currentQuiz?.target ? wordReadingMap[currentQuiz.target.word] || currentQuiz.target.reading || currentQuiz.target.word : '';
        if (!reading || !window.speechSynthesis) return;
        setIsSpeaking(true);
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(reading);
        utter.lang = 'ko-KR';
        utter.rate = 0.85;
        utter.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utter);
    };

    // ── 결과 화면 ──────────────────────────────────────────────────────────
    if (started && gameState === 'result') {
        const pct = Math.round((score / 10) * 100);
        const isClear = pct >= 70;
        const wrongCount = 10 - score;
        const circ = 2 * Math.PI * 44;
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300"
                style={{ background: isClear ? 'rgba(16,185,129,0.18)' : 'rgba(255,107,107,0.18)' }}
            >
                <div className="w-full max-w-sm flex flex-col items-center bg-white shadow-2xl rounded-[48px]" style={{ overflow: 'visible' }}>
                    <div className="pt-10 pb-7 px-8 flex flex-col items-center gap-5 w-full">
                        <img
                            src={isClear ? '/assets/images/icons/celebration.png' : '/assets/images/icons/icon_timeout.png'}
                            alt="result"
                            className="w-[140px] h-[140px] object-contain drop-shadow-xl mt-2"
                        />
                        <div className="text-center flex flex-col items-center gap-3">
                            <span className="text-sm font-extrabold text-slate-400">
                                {isClear ? '정말 멋진 결과예요!' : '아쉬운 결과네요...'}
                            </span>
                            <h1 className={`font-extrabold tracking-tight leading-snug ${isClear ? 'text-4xl' : 'text-2xl'}`} style={{ color: isClear ? '#10B981' : '#4A90E2' }}>
                                {isClear ? '와우! 참 잘했어요!' : '괜찮아요, 다시 도전해봐요!'}
                            </h1>
                            {/* 원형 게이지 스코어 */}
                            <div className="relative w-28 h-28 flex items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 112 112">
                                    <circle cx="56" cy="56" r="44" fill="none" stroke="#F1F5F9" strokeWidth="6" />
                                    <circle cx="56" cy="56" r="44" fill="none"
                                        stroke={isClear ? '#10B981' : '#FF6B6B'}
                                        strokeWidth="6"
                                        strokeDasharray={circ}
                                        strokeDashoffset={circ * (1 - pct / 100)}
                                        strokeLinecap="round"
                                        transform="rotate(-90 56 56)"
                                        style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                                    />
                                </svg>
                                <div className="flex flex-col items-center z-10">
                                    <span className="text-3xl font-extrabold text-slate-700 leading-tight">{score}</span>
                                    <span className="text-xs font-extrabold text-slate-400">/ 10</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full flex flex-col items-center gap-2">
                            {/* 메인 버튼 — 항상 오렌지 */}
                            <button
                                onClick={() => { setCurrentQuiz(null); setScore(0); setTotalAnswered(0); setCombo(0); setGameState('playing'); }}
                                className="w-full py-4 rounded-full font-extrabold text-lg text-white active:scale-95 transition-all"
                                style={{ background: 'linear-gradient(to right,#FF8C00,#FFA500)', boxShadow: '0 6px 20px rgba(255,140,0,0.4)', borderBottom: '4px solid #CC7000' }}
                            >
                                다시 풀기
                            </button>
                            {/* 오답 확인 텍스트 링크 — 틀린 문제 있을 때 */}
                            {onGoToReview && wrongCount > 0 && (
                                <button
                                    onClick={onGoToReview}
                                    className="text-slate-400 text-xs font-bold py-1 active:opacity-60 transition-opacity w-full text-center"
                                >
                                    오답만 확인하고 싶나요? →
                                </button>
                            )}
                            {/* 급수/주제 바꾸기 */}
                            <button
                                onClick={() => setStarted(false)}
                                className="text-[12px] font-bold py-1 active:opacity-60 transition-opacity w-full text-center underline"
                                style={{ color: '#888888' }}
                            >
                                급수 / 주제 바꾸기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── 퀴즈 진행 화면 ────────────────────────────────────────────────────
    if (started && currentQuiz) {
        const currentAnswer = currentQuiz?.type === 'sentence' ? currentQuiz?.target?.word : currentQuiz?.answer;
        const word = currentQuiz?.target?.word || '';
        const reading = wordReadingMap[word] || currentQuiz?.target?.reading || word;
        const meaning = currentQuiz?.target?.meaning || '';

        return (
            <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden" style={{ backgroundColor: '#F8FAFF' }}>
                <style>{`
                    @keyframes xpFloat {
                        0%   { opacity: 0; transform: scale(0.6) translateY(16px); }
                        28%  { opacity: 1; transform: scale(1.1) translateY(-6px); }
                        40%  { opacity: 1; transform: scale(1) translateY(0); }
                        68%  { opacity: 1; transform: scale(1) translateY(0); }
                        100% { opacity: 0; transform: translateY(-28px); }
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
                            {popupCombo > 1 && (
                                <div
                                    className="px-4 py-1.5 rounded-full font-extrabold text-white text-sm"
                                    style={{ backgroundColor: '#0EA5E9', boxShadow: '0 4px 12px rgba(14,165,233,0.45)' }}
                                >
                                    🔥 {popupCombo}x 콤보!
                                </div>
                            )}
                            <div
                                className="px-7 py-3 rounded-full font-extrabold text-xl"
                                style={{ backgroundColor: '#FFF7D4', color: '#B8860B', border: '2px solid #FFD700', boxShadow: '0 8px 28px rgba(255,215,0,0.5)' }}
                            >
                                ⭐ +10 XP
                            </div>
                        </div>
                    </div>
                )}

                {/* 헤더 */}
                <div className="w-full shrink-0 bg-white" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div className="w-full flex justify-between items-center px-5 py-3">
                        <button
                            onClick={hanjaFilter ? onBack : () => setStarted(false)}
                            className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center font-extrabold text-lg active:scale-90 text-slate-400 border border-slate-100 transition-all"
                        >
                            ←
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-base font-extrabold text-slate-700 tracking-tighter">Q {totalAnswered + 1}</span>
                            <span className="text-base font-extrabold text-slate-300">/ 10</span>
                        </div>
                        <div className="w-9 h-9" />
                    </div>
                    <div className="w-full h-[2px]" style={{ backgroundColor: '#E0F2FE' }}>
                        <div
                            className="h-full transition-all duration-500"
                            style={{ width: `${(totalAnswered / 10) * 100}%`, backgroundColor: '#0EA5E9' }}
                        />
                    </div>
                </div>

                {/* 본문 */}
                <div className="flex-1 overflow-y-auto pb-6">
                    <div className="w-full max-w-xl mx-auto px-4 pt-5 flex flex-col gap-12">

                        {/* 문제 카드 (플립) */}
                        <div
                            className="relative w-full aspect-[16/10]"
                            style={{ perspective: '2000px' }}
                            onClick={() => {
                                if (isCorrectSelected && currentQuiz?.type === 'sentence') {
                                    setIsWordCardFlipped(f => !f);
                                    if (!isWordCardFlipped) handleSpeak();
                                }
                            }}
                        >
                            <div
                                className={`relative w-full h-full transition-all duration-700 ${isCorrectSelected ? 'cursor-pointer shadow-2xl' : ''} rounded-[4rem]`}
                                style={{
                                    transform: isWordCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                    transformStyle: 'preserve-3d',
                                    WebkitTransformStyle: 'preserve-3d',
                                }}
                            >
                                {/* 앞면: 빈칸 문장 */}
                                <div
                                    className="absolute inset-0 bg-white rounded-[4rem] border-[10px] border-white flex flex-col items-center justify-center px-8 overflow-hidden shadow-xl"
                                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', zIndex: isWordCardFlipped ? 0 : 1 }}
                                >
                                    <p className="text-2xl sm:text-3xl font-extrabold leading-relaxed text-center text-slate-800 break-keep">
                                        {currentQuiz?.type === 'sentence' && currentQuiz?.sentence?.includes('(') ? (
                                            <>
                                                {currentQuiz.sentence.split('(')[0]}
                                                <span
                                                    className="inline-block min-w-[72px] text-center font-extrabold transition-all duration-300 mx-1"
                                                    style={feedback ? {
                                                        color: feedback.isCorrect ? '#6366F1' : '#E05C5C',
                                                        borderBottom: feedback.isCorrect ? '3px solid #6366F1' : '3px solid #E05C5C',
                                                        padding: '0 2px 2px',
                                                    } : {
                                                        color: 'transparent',
                                                        borderBottom: '2px solid #1e293b',
                                                        padding: '0 2px 2px',
                                                    }}
                                                >
                                                    {feedback ? currentQuiz.target.word : '?'}
                                                </span>
                                                {currentQuiz.sentence.split(')')[1]}
                                            </>
                                        ) : (
                                            <span className="text-7xl font-black">{currentQuiz?.char}</span>
                                        )}
                                    </p>
                                    {isCorrectSelected && !isWordCardFlipped && currentQuiz?.type === 'sentence' && (
                                        <div className="mt-6 px-8 py-2.5 rounded-full font-black text-sm bg-slate-50 text-slate-300 uppercase tracking-[0.4em] border-2 border-slate-100/50 animate-bounce">
                                            TAP TO FLIP
                                        </div>
                                    )}
                                </div>

                                {/* 뒷면: 단어 정보 */}
                                <div
                                    className="absolute inset-0 bg-white rounded-[4rem] border-[10px] border-white flex flex-col items-center justify-between p-8 shadow-xl"
                                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', zIndex: isWordCardFlipped ? 1 : 0 }}
                                >
                                    <div className="flex flex-col items-center gap-1 mt-1">
                                        <span className="text-6xl sm:text-[5.5rem] font-black text-indigo-600 tracking-tighter text-center leading-none drop-shadow-md">
                                            {reading}
                                        </span>
                                        <span className="text-2xl sm:text-3xl font-bold text-slate-300 tracking-widest mt-1">
                                            {word}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleSpeak}
                                        className={`w-14 h-14 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-xl border-4 border-white ${isSpeaking ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-200'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                    </button>
                                    <div className="w-full text-center px-4">
                                        <span className="text-lg sm:text-xl font-bold text-slate-500 leading-snug break-keep">{meaning}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 선택지 */}
                        <div className="grid grid-cols-1 gap-4 w-full">
                            {options.map((opt, i) => {
                                const isWrong = wrongAttempts.includes(opt);
                                const isCorrect = isCorrectSelected && opt === currentAnswer;
                                return (
                                    <button
                                        key={i}
                                        disabled={isCorrectSelected}
                                        onClick={() => handleAnswer(opt)}
                                        className={`py-5 px-8 rounded-[2rem] font-black text-2xl border transition-all flex justify-between items-center break-keep ${
                                            isCorrect
                                            ? 'bg-indigo-50 border-indigo-400 text-indigo-700 border-4 shadow-lg'
                                            : isWrong
                                            ? 'bg-white border-[#FED2D2] text-[#3D3530] border-4 opacity-70'
                                            : isCorrectSelected
                                            ? 'bg-white border-slate-100 text-slate-300 opacity-60'
                                            : 'bg-white border-slate-100 text-[#5D544F] shadow-sm'
                                        } ${!isCorrectSelected ? 'active:scale-[0.98]' : ''}`}
                                    >
                                        <span>{opt}</span>
                                        {isCorrect && <span className="text-indigo-400 shrink-0 ml-2">✓</span>}
                                        {isWrong && <span className="text-rose-300 shrink-0 ml-2">✕</span>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 네비게이션 버튼 */}
                        {isCorrectSelected && (
                            <div className="w-full flex gap-5 animate-in fade-in slide-in-from-top-4 duration-500">
                                <button
                                    disabled
                                    className="flex-1 py-5 rounded-[2.5rem] bg-white font-black text-xl text-slate-200 border-2 border-slate-100"
                                >
                                    ‹ PREV
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex-[2] py-5 rounded-[2.5rem] bg-indigo-500 font-black text-xl text-white shadow-2xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {totalAnswered >= 10 ? '결과 보기 ›' : 'NEXT ›'}
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        );
    }

    // ── 선택 화면 (급수/주제별 탭 + 시작 버튼) ────────────────────────────
    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden" style={{ backgroundColor: '#F8FAFF' }}>
            {/* 헤더 */}
            <div className="w-full shrink-0 bg-white" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div className="w-full flex justify-between items-center px-5 py-3">
                    <button onClick={onBack} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center font-extrabold text-lg active:scale-90 text-slate-400 border border-slate-100 transition-all">
                        ←
                    </button>
                    <span className="text-sm font-extrabold text-slate-400">문장 퀴즈</span>
                    <div className="w-9 h-9" />
                </div>
            </div>

            {/* 바디 */}
            <div className="flex-1 overflow-y-auto pb-6">
                <div className="w-full max-w-xl mx-auto px-4 flex flex-col items-center gap-6 pt-5">

                    {/* 탭 */}
                    <div className="flex bg-slate-100/40 p-1.5 rounded-full border border-slate-200 w-full mb-4 shadow-inner">
                        <button
                            onClick={() => setViewMode('grade')}
                            className={`flex-1 px-8 py-3 rounded-full font-extrabold text-xs transition-all ${viewMode === 'grade' ? 'bg-white shadow-md' : 'text-slate-400'}`}
                            style={viewMode === 'grade' ? { color: '#4338CA' } : {}}
                        >
                            급수별
                        </button>
                        <button
                            onClick={() => setViewMode('topic')}
                            className={`flex-1 px-8 py-3 rounded-full font-extrabold text-xs transition-all ${viewMode === 'topic' ? 'bg-white shadow-md' : 'text-slate-400'}`}
                            style={viewMode === 'topic' ? { color: '#4338CA' } : {}}
                        >
                            주제별
                        </button>
                    </div>

                    {/* 급수 선택 */}
                    {viewMode === 'grade' && (
                        <div className="grid grid-cols-3 gap-3 w-full">
                            {['8급', '7급Ⅱ', '7급', '6급Ⅱ', '6급', '전체'].map(g => (
                                <button
                                    key={g}
                                    onClick={() => { setSelectedGrade(g); const raw = g === '전체' ? HANJA_DATA.filter(h => h.words && h.words.length > 0) : HANJA_DATA.filter(h => h.grade === g && h.words && h.words.length > 0); startQuiz(buildSessionPlan(raw, srsData, masteryData)); }}
                                    className="py-6 rounded-[2rem] font-extrabold text-lg transition-all border shadow-sm active:scale-95 bg-white"
                                    style={selectedGrade === g
                                        ? { color: '#4338CA', borderColor: '#C7D2FE', boxShadow: '0 8px 24px #C7D2FE60', outline: '4px solid #C7D2FE30' }
                                        : { color: '#CBD5E1', borderColor: '#F1F5F9' }}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 주제 선택 */}
                    {viewMode === 'topic' && (
                        <div className="grid grid-cols-2 gap-4 w-full">
                            {categories.map(cat => {
                                const count = HANJA_DATA.filter(h => h.category === cat).length;
                                const imgSrc = CATEGORY_IMAGES[cat] ? `/assets/images/hanja_all/${CATEGORY_IMAGES[cat]}` : null;
                                const isSelected = selectedCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => { setSelectedCategory(cat); const base = HANJA_DATA.filter(h => h.category === cat && h.words && h.words.length > 0); startQuiz(buildSessionPlan(base, srsData, masteryData)); }}
                                        className="bg-white shadow-lg rounded-2xl flex flex-row items-center overflow-hidden active:scale-95 transition-all border-[4px]"
                                        style={{ borderColor: isSelected ? '#C7D2FE' : 'white' }}
                                    >
                                        <div className="w-28 h-28 shrink-0 flex items-center justify-center p-3" style={{ backgroundColor: isSelected ? '#C7D2FE20' : '#F8FAFC' }}>
                                            {imgSrc ? <img src={imgSrc} className="w-full h-full object-contain drop-shadow-sm" alt={cat} /> : <span className="text-2xl font-extrabold" style={{ color: '#C7D2FE' }}>?</span>}
                                        </div>
                                        <div className="px-3 flex flex-col items-start gap-0">
                                            <span className="font-extrabold text-xs leading-tight" style={{ color: isSelected ? '#4338CA' : '#334155' }}>{cat}</span>
                                            <span className="text-[9px] font-bold text-slate-400">{count}개</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default SentenceQuizScreen;
