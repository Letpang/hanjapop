import { useState, useEffect, useMemo, useCallback } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { useLang } from '../LangContext.jsx';

// 단어 → reading 역조회 맵 (보기에 한글 독음 병기용)
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

const SentenceQuizScreen = ({ onBack, onHanjaAcquired, onMarkCorrect, onMarkWrong, onStageClear }) => {
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
    const [feedback, setFeedback] = useState(null);
    const [timeLeft, setTimeLeft] = useState(15);
    const [combo, setCombo] = useState(0);

    // ── 현재 선택된 한자 풀 ────────────────────────────────────────────────
    const activeHanjaSet = useMemo(() => {
        if (viewMode === 'grade') {
            if (selectedGrade === '기타') return HANJA_DATA.filter(h => !h.grade || h.grade === '' || h.grade === '기타' || h.grade === 'NON');
            return HANJA_DATA.filter(h => h.grade === selectedGrade);
        }
        return HANJA_DATA.filter(h => h.category === selectedCategory);
    }, [viewMode, selectedGrade, selectedCategory]);

    const quizPool = useMemo(() => activeHanjaSet.filter(h => h.words && h.words.length > 0), [activeHanjaSet]);

    // ── 문제 생성 ──────────────────────────────────────────────────────────
    const generateQuiz = useCallback(() => {
        const pool = quizPool.length > 0 ? quizPool : activeHanjaSet;
        if (pool.length === 0) return;

        if (quizPool.length === 0) {
            // 단어 없는 경우 단순 한자 뜻/음 퀴즈
            const randomHanja = activeHanjaSet[Math.floor(Math.random() * activeHanjaSet.length)];
            const correct = randomHanja.meaning + ' ' + randomHanja.sound;
            const distractors = HANJA_DATA.filter(h => h.id !== randomHanja.id)
                .sort(() => 0.5 - Math.random()).slice(0, 3).map(h => h.meaning + ' ' + h.sound);
            setCurrentQuiz({ type: 'simple', char: randomHanja.hanja, answer: correct, meaning: randomHanja.meaning, sound: randomHanja.sound, _hanjaId: randomHanja.id });
            setOptions([...distractors, correct].sort(() => 0.5 - Math.random()));
        } else {
            const randomChar = quizPool[Math.floor(Math.random() * quizPool.length)];
            const targetWord = randomChar.words[Math.floor(Math.random() * randomChar.words.length)];
            const allWords = HANJA_DATA.flatMap(h => (h.words || []).map(w => w.word));
            const distractors = [];
            while (distractors.length < 3) {
                const rw = allWords[Math.floor(Math.random() * allWords.length)];
                if (rw !== targetWord.word && !distractors.includes(rw)) distractors.push(rw);
            }
            setCurrentQuiz({ type: 'sentence', char: randomChar.hanja, target: targetWord, sentence: targetWord.example || `다음 한자어 '${targetWord.word}'의 뜻은?`, _hanjaId: randomChar.id });
            setOptions([...distractors, targetWord.word].sort(() => 0.5 - Math.random()));
        }
        setFeedback(null);
        setTimeLeft(15);
        setGameState('playing');
    }, [quizPool, activeHanjaSet]);

    // 퀴즈 시작
    const startQuiz = () => {
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

    // 타이머
    useEffect(() => {
        if (gameState !== 'playing') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { handleAnswer(null); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState]); // eslint-disable-line

    const handleAnswer = (selected) => {
        if (gameState !== 'playing') return;
        const isCorrect = currentQuiz.type === 'sentence'
            ? selected === currentQuiz.target.word
            : selected === currentQuiz.answer;
        setFeedback({ isCorrect, selected });
        setTotalAnswered(prev => prev + 1);
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
            if (totalAnswered >= 9) { setGameState('result'); if (onStageClear) onStageClear(); }
            else generateQuiz();
        }, 1500);
    };

    // ── 결과 화면 ──────────────────────────────────────────────────────────
    if (started && gameState === 'result') {
        return (
            <div className="fixed inset-0 w-full h-full z-50 flex flex-col items-center justify-center p-6"
                style={{ background: 'radial-gradient(ellipse at 20% 30%, #d4e0ff 0%, transparent 60%), radial-gradient(ellipse at 80% 60%, #ffcbe6 0%, transparent 60%), #f6edff' }}>
                <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-10 clay-panel !rounded-[3rem] border-4 border-white dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
                    <div className="text-9xl mb-8 animate-bounce">🎯</div>
                    <h2 className="text-6xl md:text-8xl font-black mb-8 premium-text-shadow text-slate-700 dark:text-white text-center">QUIZ FINISHED!</h2>
                    <div className="bg-white/80 dark:bg-slate-800/80 px-12 py-8 rounded-[3rem] shadow-xl border-4 border-white dark:border-slate-700 flex flex-col items-center mb-10 w-full">
                        <span className="text-slate-400 font-black uppercase text-sm mb-2 tracking-widest text-center">Your Score</span>
                        <div className="text-6xl md:text-8xl font-black text-slate-700 dark:text-white">{score} <span className="text-2xl md:text-4xl text-slate-400">/ 10</span></div>
                    </div>
                    <button
                        onClick={() => { setCurrentQuiz(null); setScore(0); setTotalAnswered(0); setCombo(0); setGameState('playing'); }}
                        className="clay-button !bg-indigo-500 !text-white py-6 rounded-[2rem] font-black text-3xl shadow-xl border-4 border-white w-full"
                    >
                        다시 풀기
                    </button>
                    <button onClick={() => setStarted(false)} className="mt-6 text-slate-400 hover:text-slate-600 font-bold text-xl">
                        급수/주제 바꾸기
                    </button>
                </div>
            </div>
        );
    }

    // ── 퀴즈 진행 화면 ────────────────────────────────────────────────────
    if (started && currentQuiz) {
        return (
            <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden p-4">
                <div className="w-full flex justify-between items-center clay-panel p-4 sm:p-6 px-6 sm:px-10 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl border-4 border-white dark:border-slate-700 shrink-0 mt-4">
                    <button onClick={() => setStarted(false)} className="text-slate-600 dark:text-slate-200 font-black bg-white/60 dark:bg-slate-800/60 px-5 py-3 rounded-2xl border-2 border-white/50 shadow-md flex items-center gap-2">
                        <span className="text-xl">←</span> <span>나가기</span>
                    </button>
                    <div className="flex-1 flex flex-col items-center">
                        <span className="text-slate-400 font-black text-xs uppercase tracking-widest">Question {totalAnswered + 1}/10</span>
                        <h1 className="text-2xl sm:text-4xl font-black text-slate-700 dark:text-white m-0 premium-text-shadow">말해보자</h1>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-900/30 px-6 py-2 rounded-2xl border-2 border-rose-200 dark:border-rose-800 text-rose-400 font-black text-2xl shadow-inner">
                        {timeLeft}s
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-8 py-8 px-2 overflow-y-auto">
                    {combo > 1 && (
                        <div className="bg-amber-400 text-white font-black px-6 py-2 rounded-full shadow-2xl border-4 border-white animate-bounce text-xl z-20">
                            {combo} COMBO! 🔥
                        </div>
                    )}
                    <div className="w-full max-w-4xl clay-panel !rounded-[4rem] p-10 sm:p-16 bg-white/90 dark:bg-slate-800/90 border-4 border-white dark:border-slate-700 shadow-2xl relative flex flex-col items-center text-center">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white font-black px-10 py-3 rounded-full border-4 border-white shadow-xl text-2xl">
                            한자: {currentQuiz.char}
                        </div>
                        <p className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-700 dark:text-white leading-relaxed mb-4 px-4">
                            {currentQuiz.type === 'sentence' ? (
                                currentQuiz.sentence.includes('(') ? (
                                    <>
                                        {currentQuiz.sentence.split('(')[0]}
                                        <span className={`mx-2 px-6 py-1 rounded-2xl border-4 border-dashed inline-block min-w-[120px] transition-all ${
                                            feedback
                                                ? (feedback.isCorrect ? 'bg-emerald-100 border-emerald-400 text-emerald-600' : 'bg-rose-100 border-rose-400 text-rose-600')
                                                : 'bg-slate-50 border-slate-300 text-slate-300'
                                        }`}>
                                            {feedback ? currentQuiz.target.word : '?'}
                                        </span>
                                        {currentQuiz.sentence.split(')')[1]}
                                    </>
                                ) : currentQuiz.sentence
                            ) : (
                                <>다음 한자의 뜻과 음은? <br/><span className="text-8xl mt-4 inline-block">{currentQuiz.char}</span></>
                            )}
                        </p>
                        {feedback && (
                            <div className="mt-4 flex flex-col items-center animate-float">
                                <span className={`text-2xl font-black mb-1 ${feedback.isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {feedback.isCorrect ? '정답입니다! ✨' : '아쉬워요! 💦'}
                                </span>
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 px-6 py-2 rounded-xl text-indigo-500 font-bold">
                                    {currentQuiz.type === 'sentence'
                                        ? `${currentQuiz.target.word} (${currentQuiz.target.reading}) : ${currentQuiz.target.meaning}`
                                        : `${currentQuiz.meaning} ${currentQuiz.sound}`}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl">
                        {options.map((opt, i) => {
                            const reading = currentQuiz.type === 'sentence' ? wordReadingMap[opt] : null;
                            return (
                                <button key={i} disabled={gameState !== 'playing'} onClick={() => handleAnswer(opt)}
                                    className={`clay-button !rounded-[2.5rem] py-4 sm:py-8 font-black border-4 transition-all flex flex-col items-center justify-center gap-1 ${
                                        gameState === 'playing'
                                            ? 'bg-white dark:bg-slate-800 border-white hover:-translate-y-2'
                                            : opt === (currentQuiz.type === 'sentence' ? currentQuiz.target.word : currentQuiz.answer)
                                                ? 'bg-emerald-400 border-emerald-200 text-white scale-105 z-10'
                                                : opt === feedback?.selected
                                                    ? 'bg-rose-400 border-rose-200 text-white opacity-50'
                                                    : 'bg-slate-100 dark:bg-slate-900 opacity-30'
                                    }`}
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
    }

    // ── 선택 화면 (급수/주제별 탭 + 시작 버튼) ────────────────────────────
    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden">
            {/* 헤더 */}
            <div className="w-full px-4 shrink-0 safe-top">
                <div className="w-full flex justify-between items-center clay-panel p-4 sm:p-6 px-6 sm:px-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl border-4 border-white dark:border-slate-700">
                    <button onClick={onBack} className="text-slate-600 dark:text-slate-200 font-black bg-white/60 dark:bg-slate-800/60 px-5 sm:px-10 py-2.5 sm:py-4 rounded-2xl border-2 border-white/50 shadow-md hover:bg-white active:scale-95 transition-all flex items-center gap-2">
                        <span className="text-xl sm:text-2xl">←</span>
                    </button>
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-700 dark:text-white m-0 tracking-tight premium-text-shadow text-center flex-1 px-4">
                        말해보자
                    </h1>
                    <div className="w-[60px] sm:w-[80px]" />
                </div>
            </div>

            {/* 바디 */}
            <div className="flex-1 overflow-y-auto pt-6 pb-16">
                <div className="w-full max-w-lg mx-auto px-5 flex flex-col items-center gap-8">

                    {/* 탭 */}
                    <div className="flex bg-slate-100/60 dark:bg-slate-900/60 p-2 rounded-[2rem] border-2 border-white dark:border-slate-700 shadow-inner w-full">
                        <button
                            onClick={() => setViewMode('grade')}
                            className={`flex-1 px-6 py-3 rounded-2xl font-black text-xl transition-all ${viewMode === 'grade' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}
                        >
                            급수별
                        </button>
                        <button
                            onClick={() => setViewMode('topic')}
                            className={`flex-1 px-6 py-3 rounded-2xl font-black text-xl transition-all ${viewMode === 'topic' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}
                        >
                            주제별
                        </button>
                    </div>

                    {/* 급수 선택 */}
                    {viewMode === 'grade' && (
                        <div className="flex gap-3 flex-wrap justify-center w-full">
                            {['8급', '7급', '6급', '기타'].map(g => (
                                <button
                                    key={g}
                                    onClick={() => setSelectedGrade(g)}
                                    className={`px-10 py-4 rounded-[2rem] font-black text-xl border-4 transition-all ${
                                        selectedGrade === g
                                            ? 'bg-indigo-500 text-white border-white shadow-2xl scale-105'
                                            : 'bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40 shadow-lg'
                                    }`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 주제 선택 */}
                    {viewMode === 'topic' && (
                        <div className="flex gap-2 flex-wrap justify-center w-full">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-6 py-3 rounded-2xl font-black text-lg border-4 transition-all ${
                                        selectedCategory === cat
                                            ? 'bg-indigo-500 text-white border-white shadow-xl scale-105'
                                            : 'bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40 shadow-md'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 문제 수 안내 */}
                    <div className="w-full bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-5 border-2 border-indigo-100 dark:border-indigo-800">
                        <p className="text-indigo-600 dark:text-indigo-300 font-bold text-sm text-center">
                            {viewMode === 'grade'
                                ? `${selectedGrade} 한자 ${activeHanjaSet.length}개`
                                : `${selectedCategory} ${activeHanjaSet.length}개`
                            }에서 랜덤 10문제
                        </p>
                    </div>

                    {/* 시작 버튼 */}
                    <button
                        onClick={startQuiz}
                        className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-xl shadow-xl active:scale-95 transition-all"
                    >
                        시작하기! 🚀
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SentenceQuizScreen;
