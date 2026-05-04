import { useState, useEffect, useMemo, useCallback } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { 
    IconToyCar, IconTeddy, IconGamepad, IconCandyDetail, IconDino,
    IconRobot, IconCake, IconUFO, IconPuppy, IconMagicWand
} from './Icons.jsx';
import { useLang } from '../LangContext.jsx';

// 단어 → reading 역조회 맵 (보기에 한글 독음 병기용)
const wordReadingMap = {};
HANJA_DATA.forEach(h => {
    (h.words || []).forEach(w => {
        if (w.word && w.reading) wordReadingMap[w.word] = w.reading;
    });
});

const stageThemes = [
    { Icon: IconToyCar, bgStart: "#FFE5E5", bgEnd: "#FFB7B2", shadow: "#ef4444" },
    { Icon: IconTeddy, bgStart: "#FFF0E5", bgEnd: "#FFDAB9", shadow: "#f59e0b" },
    { Icon: IconGamepad, bgStart: "#F5E5FF", bgEnd: "#D5B8FF", shadow: "#a855f7" },
    { Icon: IconCandyDetail, bgStart: "#FFE5F0", bgEnd: "#FFB3D9", shadow: "#ec4899" },
    { Icon: IconDino, bgStart: "#E5F5E5", bgEnd: "#A8E6CF", shadow: "#10b981" },
    { Icon: IconRobot, bgStart: "#E5F0FF", bgEnd: "#A0C4FF", shadow: "#3b82f6" },
    { Icon: IconCake, bgStart: "#FFFFE5", bgEnd: "#FDFFB6", shadow: "#eab308" },
    { Icon: IconUFO, bgStart: "#E5FFFF", bgEnd: "#9BF6FF", shadow: "#06b6d4" },
    { Icon: IconPuppy, bgStart: "#F0F0F0", bgEnd: "#DCDCDC", shadow: "#94a3b8" },
    { Icon: IconMagicWand, bgStart: "#F5FFE5", bgEnd: "#CAFFBF", shadow: "#22c55e" }
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

const SentenceQuizScreen = ({ onBack, onHanjaAcquired, onMarkCorrect, onMarkWrong }) => {
    const { lang, t } = useLang();
    
    // Selection State
    const [viewMode, setViewMode] = useState('grade');
    const categories = useMemo(() => [...new Set(HANJA_DATA.map(h => h.category).filter(Boolean))], []);
    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
    const [selectedGrade, setSelectedGrade] = useState('8급');
    const [selectedStage, setSelectedStage] = useState(null);
    const [isGradeMode, setIsGradeMode] = useState(false);

    // Game State
    const [gameState, setGameState] = useState('idle'); // 'idle', 'playing', 'feedback', 'result'
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [options, setOptions] = useState([]);
    const [score, setScore] = useState(0);
    const [totalAnswered, setTotalAnswered] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [timeLeft, setTimeLeft] = useState(15);
    const [combo, setCombo] = useState(0);

    const currentGradeData = useMemo(() => {
        if (selectedGrade === '기타') return HANJA_DATA.filter(h => !h.grade || h.grade === '' || h.grade === '기타' || h.grade === 'NON');
        return HANJA_DATA.filter(h => h.grade === selectedGrade);
    }, [selectedGrade]);

    const currentCategoryData = useMemo(() => HANJA_DATA.filter(h => h.category === selectedCategory), [selectedCategory]);

    const gradeStagesCount = useMemo(() => Math.ceil(currentGradeData.length / 8), [currentGradeData]);
    const categoryStagesCount = useMemo(() => Math.ceil(currentCategoryData.length / 8), [currentCategoryData]);

    const activeHanjaSet = useMemo(() => {
        if (selectedStage === null) return [];
        const startIdx = (selectedStage - 1) * 8;
        const pool = isGradeMode ? currentGradeData : currentCategoryData;
        return pool.slice(startIdx, startIdx + 8);
    }, [selectedStage, isGradeMode, currentGradeData, currentCategoryData]);

    const quizPool = useMemo(() => {
        if (activeHanjaSet.length === 0) return [];
        return activeHanjaSet.filter(h => h.words && h.words.length > 0);
    }, [activeHanjaSet]);

    const generateQuiz = useCallback(() => {
        if (quizPool.length === 0) {
            // Fallback: If no quiz data for these hanja, just use them as single char quizzes
            const randomHanja = activeHanjaSet[Math.floor(Math.random() * activeHanjaSet.length)];
            const correct = randomHanja.meaning + " " + randomHanja.sound;
            const distractors = HANJA_DATA.filter(h => h.id !== randomHanja.id).sort(() => 0.5 - Math.random()).slice(0, 3).map(h => h.meaning + " " + h.sound);
            const quizOptions = [...distractors, correct].sort(() => 0.5 - Math.random());
            setCurrentQuiz({ type: 'simple', char: randomHanja.hanja, answer: correct, meaning: randomHanja.meaning, sound: randomHanja.sound, _hanjaId: randomHanja.id });
            setOptions(quizOptions);
            setFeedback(null); setTimeLeft(15); setGameState('playing');
            return;
        }
        
        const randomChar = quizPool[Math.floor(Math.random() * quizPool.length)];
        const targetWord = randomChar.words[Math.floor(Math.random() * randomChar.words.length)];
        
        // Generate distractors
        const distractors = [];
        const allWords = HANJA_DATA.flatMap(h => (h.words || []).map(w => w.word));
        while (distractors.length < 3) {
            const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
            if (randomWord !== targetWord.word && !distractors.includes(randomWord)) distractors.push(randomWord);
        }
        
        const quizOptions = [...distractors, targetWord.word].sort(() => 0.5 - Math.random());
        setCurrentQuiz({ type: 'sentence', char: randomChar.hanja, target: targetWord, sentence: targetWord.example || `다음 한자어 '${targetWord.word}'의 뜻은?`, _hanjaId: randomChar.id });
        setOptions(quizOptions);
        setFeedback(null); setTimeLeft(15); setGameState('playing');
    }, [quizPool, activeHanjaSet]);

    const startQuizGame = (stageNum, fromGrade) => {
        setSelectedStage(stageNum);
        setIsGradeMode(fromGrade);
        setScore(0); setTotalAnswered(0); setCombo(0);
        setGameState('playing');
        // useEffect will trigger generateQuiz when quizPool is ready
    };

    useEffect(() => {
        if (gameState === 'playing' && !currentQuiz && quizPool.length >= 0 && activeHanjaSet.length > 0) {
            generateQuiz();
        }
    }, [gameState, currentQuiz, quizPool, activeHanjaSet, generateQuiz]);

    useEffect(() => {
        if (gameState !== 'playing') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { handleAnswer(null); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState]);

    const handleAnswer = (selected) => {
        if (gameState !== 'playing') return;
        const isCorrect = currentQuiz.type === 'sentence' ? selected === currentQuiz.target.word : selected === currentQuiz.answer;
        setFeedback({ isCorrect, selected });
        setTotalAnswered(prev => prev + 1);
        // 숙달도 연동: 현재 퀴즈 한자의 id 추출
        const hanjaId = currentQuiz._hanjaId || null;
        if (isCorrect) {
            setScore(prev => prev + 1); setCombo(prev => prev + 1); playSound('correct');
            if (onHanjaAcquired) onHanjaAcquired(null, 25);
            if (onMarkCorrect && hanjaId) onMarkCorrect(hanjaId);
        } else {
            setCombo(0); playSound('wrong');
            if (onMarkWrong && hanjaId) onMarkWrong(hanjaId);
        }
        setGameState('feedback');
        setTimeout(() => {
            if (totalAnswered >= 9) setGameState('result');
            else generateQuiz();
        }, 1500);
    };

    const currentTheme = selectedStage !== null ? stageThemes[(selectedStage - 1) % 10] : stageThemes[0];

    if (selectedStage === null) {
        return (
            <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden">
                <div className="w-full px-4 shrink-0 safe-top">
                    <div className="w-full flex justify-between items-center clay-panel p-4 sm:p-6 px-6 sm:px-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl border-4 border-white dark:border-slate-700">
                        <button onClick={onBack} className="text-slate-600 dark:text-slate-200 font-black bg-white/60 dark:bg-slate-800/60 px-5 sm:px-10 py-2.5 sm:py-4 rounded-2xl border-2 border-white/50 shadow-md hover:bg-white active:scale-95 transition-all flex items-center gap-2">
                            <span className="text-xl sm:text-2xl">←</span> <span>{t('backMenu').replace('← ', '')}</span>
                        </button>
                        <h1 className="text-2xl sm:text-5xl font-black text-slate-700 dark:text-white m-0 tracking-tight premium-text-shadow text-center flex-1 px-4">어휘 정복</h1>
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
                        {viewMode === 'topic' && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar w-full justify-start sm:justify-center px-4 pb-2">
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={"px-8 py-3 rounded-2xl font-black transition-all border-4 text-xl whitespace-nowrap " + (selectedCategory === cat ? "bg-indigo-500 text-white border-white shadow-xl scale-110" : "bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40")}>{cat}</button>
                                ))}
                            </div>
                        )}
                        {viewMode === 'grade' && (
                            <div className="flex gap-4 justify-center flex-wrap">
                                {['8급', '7급', '6급', '기타'].map(g => (
                                    <button key={g} onClick={() => setSelectedGrade(g)} className={"px-12 py-5 rounded-[2.5rem] font-black transition-all border-4 text-2xl " + (selectedGrade === g ? "bg-indigo-500 text-white border-white shadow-2xl scale-110" : "bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40 shadow-lg")}>{g}</button>
                                ))}
                            </div>
                        )}
                        <div className="w-full clay-panel rounded-[4rem] p-8 sm:p-14 border-4 border-white dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 shadow-2xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-10">
                            {Array.from({length: (viewMode === 'topic' ? categoryStagesCount : gradeStagesCount)}).map((_, i) => {
                                const theme = stageThemes[i % 10]; const stageNum = i + 1;
                                return (
                                    <button key={i} onClick={() => startQuizGame(stageNum, viewMode === 'grade')} className="group text-slate-700 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col items-center justify-center gap-4 transition-all duration-300 clay-panel relative overflow-hidden border-4 border-white dark:border-slate-700 hover:shadow-2xl hover:-translate-y-2">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
                                        <div className="w-14 h-14 md:w-24 md:h-24 mb-1 transition-transform group-hover:scale-125 drop-shadow-lg"><theme.Icon /></div>
                                        <span className="font-black text-2xl md:text-5xl text-slate-700 dark:text-white premium-text-shadow">Set {stageNum}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'result') {
        return (
            <div className="fixed inset-0 w-full h-full z-50 flex flex-col items-center justify-center p-6" style={{background:'radial-gradient(ellipse at 20% 30%, #d4e0ff 0%, transparent 60%), radial-gradient(ellipse at 80% 60%, #ffcbe6 0%, transparent 60%), #f6edff'}}>
                <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-10 clay-panel !rounded-[3rem] border-4 border-white dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
                    <div className="text-9xl mb-8 animate-bounce">🎯</div>
                    <h2 className="text-6xl md:text-8xl font-black mb-8 premium-text-shadow text-slate-700 dark:text-white text-center">QUIZ FINISHED!</h2>
                    <div className="bg-white/80 dark:bg-slate-800/80 px-12 py-8 rounded-[3rem] shadow-xl border-4 border-white dark:border-slate-700 flex flex-col items-center mb-10 w-full">
                        <span className="text-slate-400 font-black uppercase text-sm mb-2 tracking-widest text-center">Your Mastery Score</span>
                        <div className="text-6xl md:text-8xl font-black text-slate-700 dark:text-white">{score} <span className="text-2xl md:text-4xl text-slate-400">/ 10</span></div>
                    </div>
                    <button onClick={() => { setScore(0); setTotalAnswered(0); setCombo(0); generateQuiz(); }} className="clay-button !bg-indigo-500 !text-white py-6 rounded-[2rem] font-black text-3xl shadow-xl border-4 border-white w-full">TRY AGAIN</button>
                    <button onClick={() => setSelectedStage(null)} className="mt-6 text-slate-400 hover:text-slate-600 font-bold text-xl">OTHER STAGES</button>
                </div>
            </div>
        );
    }

    if (!currentQuiz) return <div className="w-full h-full flex items-center justify-center text-white font-black text-3xl">Loading...</div>;

    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden p-4">
            <div className="w-full flex justify-between items-center clay-panel p-4 sm:p-6 px-6 sm:px-10 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl border-4 border-white dark:border-slate-700 shrink-0 mt-4">
                <button onClick={() => setSelectedStage(null)} className="text-slate-600 dark:text-slate-200 font-black bg-white/60 dark:bg-slate-800/60 px-5 py-3 rounded-2xl border-2 border-white/50 shadow-md flex items-center gap-2">
                    <span className="text-xl">←</span> <span>EXIT</span>
                </button>
                <div className="flex-1 flex flex-col items-center">
                    <span className="text-slate-400 font-black text-xs uppercase tracking-widest">Question {totalAnswered + 1}/10</span>
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-700 dark:text-white m-0 premium-text-shadow">어휘 정복 퀴즈</h1>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/30 px-6 py-2 rounded-2xl border-2 border-rose-200 dark:border-rose-800 text-rose-400 font-black text-2xl shadow-inner">
                    {timeLeft}s
                </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-8 py-8 px-2 overflow-y-auto">
                {combo > 1 && <div className="bg-amber-400 text-white font-black px-6 py-2 rounded-full shadow-2xl border-4 border-white animate-bounce text-xl z-20">{combo} COMBO! 🔥</div>}
                <div className="w-full max-w-4xl clay-panel !rounded-[4rem] p-10 sm:p-16 bg-white/90 dark:bg-slate-800/90 border-4 border-white dark:border-slate-700 shadow-2xl relative flex flex-col items-center text-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white font-black px-10 py-3 rounded-full border-4 border-white shadow-xl text-2xl">한자: {currentQuiz.char}</div>
                    <p className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-700 dark:text-white leading-relaxed mb-4 px-4">
                        {currentQuiz.type === 'sentence' ? (
                            currentQuiz.sentence.includes('(') ? (
                                <>
                                    {currentQuiz.sentence.split('(')[0]}
                                    <span className={"mx-2 px-6 py-1 rounded-2xl border-4 border-dashed inline-block min-w-[120px] transition-all " + 
                                        (feedback ? (feedback.isCorrect ? "bg-emerald-100 border-emerald-400 text-emerald-600" : "bg-rose-100 border-rose-400 text-rose-600") : "bg-slate-50 border-slate-300 text-slate-300")}>
                                        {feedback ? currentQuiz.target.word : "?"}
                                    </span>
                                    {currentQuiz.sentence.split(')')[1]}
                                </>
                            ) : currentQuiz.sentence
                        ) : (
                            <>다음 한자의 뜻과 음은? <br/> <span className="text-8xl mt-4 inline-block">{currentQuiz.char}</span></>
                        )}
                    </p>
                    {feedback && (
                        <div className="mt-4 flex flex-col items-center animate-float">
                            <span className={"text-2xl font-black mb-1 " + (feedback.isCorrect ? "text-emerald-500" : "text-rose-500")}>{feedback.isCorrect ? "정답입니다! ✨" : "아쉬워요! 💦"}</span>
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 px-6 py-2 rounded-xl text-indigo-500 font-bold">
                                {currentQuiz.type === 'sentence' ? `${currentQuiz.target.word} (${currentQuiz.target.reading}) : ${currentQuiz.target.meaning}` : `${currentQuiz.meaning} ${currentQuiz.sound}`}
                            </div>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl">
                    {options.map((opt, i) => {
                        const reading = currentQuiz.type === 'sentence' ? wordReadingMap[opt] : null;
                        return (
                        <button key={i} disabled={gameState !== 'playing'} onClick={() => handleAnswer(opt)}
                            className={"clay-button !rounded-[2.5rem] py-4 sm:py-8 font-black border-4 transition-all flex flex-col items-center justify-center gap-1 " + 
                                (gameState === 'playing' ? "bg-white dark:bg-slate-800 border-white hover:-translate-y-2" : 
                                (opt === (currentQuiz.type === 'sentence' ? currentQuiz.target.word : currentQuiz.answer) ? "bg-emerald-400 border-emerald-200 text-white scale-105 z-10" : 
                                (opt === feedback?.selected ? "bg-rose-400 border-rose-200 text-white opacity-50" : "bg-slate-100 dark:bg-slate-900 opacity-30")))}
                        >
                            <span className="text-2xl sm:text-4xl">{opt}</span>
                            {reading && <span className="text-base sm:text-xl opacity-70 font-bold">{reading}</span>}
                        </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SentenceQuizScreen;
