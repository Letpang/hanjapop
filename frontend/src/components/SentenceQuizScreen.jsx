import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { useLang } from '../LangContext.jsx';
import GradeGrid, { TopicCard } from './GradeGrid.jsx';
import { getRankDetails } from '../utils/rankUtils.js';
import { buildSessionPlan } from '../utils/learningPool.js';
import { GRADES, CATEGORY_IMAGES } from '../constants/hanjaConstants.js';
import { useUnlockedHanja } from '../hooks/useUnlockedHanja.js';
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

const SentenceQuizScreen = ({ onBack, onHanjaAcquired, onMarkCorrect, onMarkWrong, onStageClear, onGoToReview, srsData, masteryData, userLevel, userXp, selectedCharacter, hanjaFilter, unlockedHanjaIds }) => {
    const { t } = useLang();

    // ── 선택 상태 ──────────────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState('grade'); // 'grade' | 'topic'
    const categories = useMemo(() => [...new Set(HANJA_DATA.map(h => h.category).filter(Boolean))], []);

    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
    const [selectedGrade, setSelectedGrade] = useState('8급');

    const characterAvatar = useMemo(() => getRankDetails(userXp, selectedCharacter).avatar, [userXp, selectedCharacter]);

    const { unlockedIds, unlockedGrades } = useUnlockedHanja(unlockedHanjaIds);

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
            if (selectedGrade === '전체') return HANJA_DATA.filter(h => unlockedIds.has(h.id));
            if (selectedGrade === '기타') return HANJA_DATA.filter(h => (!h.grade || h.grade === '' || h.grade === '기타' || h.grade === 'NON') && unlockedIds.has(h.id));
            return HANJA_DATA.filter(h => h.grade === selectedGrade && unlockedIds.has(h.id));
        }
        return HANJA_DATA.filter(h => h.category === selectedCategory && unlockedIds.has(h.id));
    }, [viewMode, selectedGrade, selectedCategory, hanjaFilter, unlockedIds]);

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
        const isClear = score >= 10 * 0.7;
        const wrongCount = 10 - score;

        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300"
                style={{ background: isClear ? 'rgba(16,185,129,0.18)' : 'rgba(255,107,107,0.18)' }}
            >
                <div className="w-full max-w-sm flex flex-col items-center bg-white shadow-2xl rounded-[48px] overflow-hidden">
                    <div className="pt-4 pb-10 px-8 flex flex-col items-center gap-6 w-full relative">
                        
                        {/* 아이콘 */}
                        <img
                            src={isClear ? "/assets/images/icons/success_new.png" : "/assets/images/icons/timeout_new.png"}
                            alt={isClear ? "clear" : "fail"}
                            className="w-[154px] h-[154px] object-contain drop-shadow-xl relative z-10 mt-4"
                        />

                        {/* 텍스트 */}
                        <div className="text-center flex flex-col gap-2 relative z-10 -mt-5">
                            <span className="text-xs-res font-extrabold text-slate-400">
                                {isClear ? '정말 멋진 결과예요!' : '아쉬운 결과네요...'}
                            </span>
                            <h1 className="text-h2-res font-extrabold tracking-tighter leading-snug" style={{ color: isClear ? '#10B981' : '#FF6B6B' }}>
                                {isClear ? '와우! 참 잘했어요!' : <>괜찮아요,<br/>다시 도전해봐요!</>}
                            </h1>
                            <p className="text-xs-res font-bold text-slate-400 leading-relaxed break-keep mt-1">
                                {isClear 
                                    ? `총 10문제 중 ${score}문제를 맞혔어요! 🔥` 
                                    : '조금만 더 노력하면 성공할 수 있어요!'}
                            </p>
                        </div>

                        {/* 버튼 2단 */}
                        <div className="w-full flex flex-col gap-3 relative z-10">
                            <button
                                onClick={() => { setCurrentQuiz(null); setScore(0); setTotalAnswered(0); setCombo(0); setGameState('playing'); }}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg text-white active:scale-95 transition-all border-b-4 active:border-b-0 active:translate-y-[2px] shadow-lg"
                                style={{ 
                                    backgroundColor: '#FF6B6B', 
                                    borderBottomColor: '#E05555'
                                }}
                            >
                                다시 풀기
                            </button>
                            <button
                                onClick={() => setStarted(false)}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg text-slate-500 active:scale-95 transition-all border-2 border-slate-200 border-b-4 active:border-b-2 active:translate-y-[2px] shadow-sm"
                                style={{ 
                                    backgroundColor: '#FFFFFF',
                                    borderBottomColor: '#E2E8F0'
                                }}
                            >
                                돌아가기
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
                 <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                     <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                         <button onClick={hanjaFilter ? onBack : () => setStarted(false)}
                             className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all w-11 h-11 font-black text-slate-400">
                             <span>←</span>
                         </button>
                         <div className="flex flex-col items-center">
                             <h2 className="text-lg font-black text-slate-500 m-0">문장 퀴즈</h2>
                         </div>
                         <div className="flex items-center justify-end w-11">
                             <span className="text-indigo-500 opacity-60 text-sm font-bold whitespace-nowrap">{Math.min(totalAnswered + 1, 10)}/10</span>
                         </div>
                     </div>
                     <div className="w-full h-[10px] bg-slate-100 rounded-full mt-3 relative px-1 mx-auto max-w-[90%]">
                         <div
                             className="h-full transition-all duration-700 rounded-full bg-indigo-500 relative"
                             style={{ width: `${(Math.min(totalAnswered + 1, 10) / 10) * 100}%` }}
                         >
                             <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-9 h-9 bg-white rounded-full shadow-xl border-2 border-indigo-400 flex items-center justify-center overflow-hidden z-10 transition-all duration-700">
                                 <img src={characterAvatar} className="w-7 h-7 object-contain" alt="progress-pawn" />
                             </div>
                         </div>
                     </div>
                 </div>

                {/* 본문 */}
                <div className="flex-1 overflow-y-auto pb-6">
                    <div className="w-full max-w-xl mx-auto px-4 pt-5 flex flex-col gap-12">

                        {/* 문제 카드 (플립) */}
                        <div
                            className="relative w-full aspect-[16/13]"
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
                                    <p className="text-3xl sm:text-[2.6rem] font-bold leading-[1.8] text-center text-slate-500/90 break-keep">
                                        {currentQuiz?.type === 'sentence' && currentQuiz?.sentence?.includes('(') ? (
                                            <>
                                                {currentQuiz.sentence.split('(')[0]}
                                                <span
                                                    className={`inline-flex items-center justify-center min-w-[120px] h-[46px] rounded-2xl transition-all duration-300 mx-2 align-middle ${
                                                        feedback 
                                                        ? (feedback.isCorrect ? 'bg-indigo-50 border-2 border-indigo-400 shadow-sm' : 'bg-rose-50 border-2 border-rose-400 shadow-sm')
                                                        : 'bg-slate-50 border-2 border-dashed border-indigo-200 shadow-inner'
                                                    }`}
                                                >
                                                    <span 
                                                        className="font-bold text-h2-res"
                                                        style={{ 
                                                            color: feedback ? (feedback.isCorrect ? '#6366F1' : '#E05C5C') : '#C7D2FE',
                                                            fontFamily: "'Nanum Myeongjo', 'Batang', serif"
                                                        }}
                                                    >
                                                        {feedback ? currentQuiz.target.word : '?'}
                                                    </span>
                                                </span>
                                                {currentQuiz.sentence.split(')')[1]}
                                            </>
                                        ) : (
                                            <span className="text-7xl font-black">{currentQuiz?.char}</span>
                                        )}
                                    </p>
                                    {isCorrectSelected && !isWordCardFlipped && currentQuiz?.type === 'sentence' && (
                                        <div className="mt-6 px-8 py-2.5 rounded-full font-black text-sm bg-slate-50 text-slate-300 uppercase tracking-[0.4em] border-2 border-slate-100/50 animate-bounce">
                                            더 알아보기
                                        </div>
                                    )}
                                </div>

                                {/* 뒷면: 단어 정보 */}
                                <div
                                    className="absolute inset-0 bg-white rounded-[4rem] border-[10px] border-white flex flex-col items-center justify-between p-3 shadow-xl"
                                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', zIndex: isWordCardFlipped ? 1 : 0 }}
                                >
                                    <div className="flex flex-row items-baseline gap-3 mt-1">
                                        <span className="text-5xl sm:text-[4.5rem] font-black text-indigo-600 tracking-tighter leading-none drop-shadow-md">
                                            {reading}
                                        </span>
                                        <span className="text-xl sm:text-2xl font-bold text-slate-300 tracking-widest">
                                            ({word})
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleSpeak}
                                        className={`w-14 h-14 mt-6 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-xl border-4 border-white ${isSpeaking ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-200'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                    </button>
                                    <div className="w-full text-left px-4 flex flex-col items-start mt-5 mb-4">
                                        <p className="text-lg sm:text-xl font-bold text-slate-500 leading-snug break-keep text-left">
                                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-indigo-50 text-indigo-500 text-sm font-black mr-3 shadow-sm border border-indigo-100/50 transform -translate-y-0.5">
                                                의미
                                            </span>
                                            {meaning}
                                        </p>
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
                                        className={`py-4 px-6 rounded-[2rem] font-bold text-h3-res border-2 transition-all flex justify-between items-center break-keep relative active:translate-y-[4px] active:border-b-0 ${
                                            isCorrect
                                            ? 'bg-indigo-50 border-indigo-400 border-b-8 border-b-indigo-500 text-indigo-700 -translate-y-[4px]'
                                            : isWrong
                                            ? 'bg-white border-rose-200 border-b-8 border-b-rose-300 text-rose-400 opacity-70 -translate-y-[4px]'
                                            : isCorrectSelected
                                            ? 'bg-white border-slate-100 text-slate-300 opacity-60'
                                            : 'bg-white border-slate-100 border-b-8 border-b-slate-200 text-[#5D544F] shadow-sm -translate-y-[4px]'
                                        }`}
                                        style={{ fontFamily: "'Nanum Myeongjo', 'Batang', serif" }}
                                    >
                                        <span className="text-left w-full">{opt}</span>
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
            <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                    <button onClick={onBack}
                        className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all w-11 h-11 font-black text-slate-400">
                        <span>←</span>
                    </button>
                    <div className="flex flex-col items-center">
                        <h2 className="text-lg font-black text-slate-500 m-0">문장 퀴즈</h2>
                    </div>
                    <div className="w-11" />
                </div>
            </div>

            {/* 바디 */}
            <div className="flex-1 overflow-y-auto pb-6">
                <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-6 pt-5">

                    {/* 탭 */}
                    <div className="flex bg-slate-100/40 p-1.5 rounded-full border border-slate-200 w-full mb-4 shadow-inner">
                        <button
                            onClick={() => setViewMode('grade')}
                            className={`flex-1 px-8 py-3 rounded-full font-extrabold text-xs-res transition-all ${viewMode === 'grade' ? 'bg-white shadow-md text-slate-700' : 'text-slate-400'}`}
                        >
                            급수별
                        </button>
                        <button
                            onClick={() => setViewMode('topic')}
                            className={`flex-1 px-8 py-3 rounded-full font-extrabold text-xs-res transition-all ${viewMode === 'topic' ? 'bg-white shadow-md text-slate-700' : 'text-slate-400'}`}
                        >
                            주제별
                        </button>
                    </div>

                    {/* 급수별 선택 */}
                    {viewMode === 'grade' && (
                        <GradeGrid
                            selected={selectedGrade}
                            onSelect={g => setSelectedGrade(g)}
                            lockedGrades={GRADES.filter(g => g !== '전체' && !unlockedGrades.has(g))}
                        />
                    )}

                    {/* 주제 선택 */}
                    {viewMode === 'topic' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            {categories.map(cat => (
                                <TopicCard
                                    key={cat}
                                    name={cat}
                                    imgSrc={CATEGORY_IMAGES[cat] ? `/assets/images/hanja_all/${CATEGORY_IMAGES[cat]}` : null}
                                    count={`${HANJA_DATA.filter(h => h.category === cat).length}개`}
                                    isSelected={selectedCategory === cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    locked={!HANJA_DATA.some(h => h.category === cat && unlockedIds.has(h.id))}
                                />
                            ))}
                        </div>
                    )}

                    {/* 캐릭터 영역 */}
                    <div className="flex flex-col items-center mt-4 mb-5 relative">
                        <div className="absolute top-4 left-[60%] z-20 animate-bounce">
                            <div className="bg-white px-4 py-1.5 rounded-2xl shadow-xl border-2 border-slate-50 relative">
                                <span className="text-lg-res font-black text-slate-900 whitespace-nowrap">준비됐어!</span>
                                <div className="absolute -bottom-1.5 left-3 w-3 h-3 bg-white border-r-2 border-b-2 border-slate-50 rotate-45" />
                            </div>
                        </div>
                        <div className="relative z-10 w-52 h-52 flex items-center justify-center animate-float">
                            <img src={characterAvatar} className="w-full h-full object-contain drop-shadow-2xl" alt="avatar" />
                        </div>
                        <div className="w-40 h-4 bg-slate-400/20 blur-lg rounded-[100%] scale-x-125 -mt-6" />
                    </div>

                    {/* 게임 시작 버튼 */}
                    <div className="w-full max-w-sm px-4 pb-4 -mt-2.5">
                        <button
                            onClick={() => startQuiz()}
                            className="w-full py-5 rounded-[2rem] font-black text-xl text-white transition-all active:scale-95 shadow-xl shadow-emerald-200/50 flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none"
                            style={{ 
                                backgroundColor: '#2DD4BF',
                                borderBottom: '6px solid #14B8A6'
                            }}
                        >
                            <span>퀴즈 시작!</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SentenceQuizScreen;
