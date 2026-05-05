import { useState, useMemo } from 'react';
import HANJA_DATA from '../hanja_unified.json';

const SORTED_HANJA = [...HANJA_DATA].sort((a, b) => a.id - b.id);

const getTotalDays = () => {
    try {
        const saved = JSON.parse(localStorage.getItem('total_activity_stats') || '{}');
        return saved.totalDays || 1;
    } catch { return 1; }
};

const getLevelTestBonus = () => {
    try { return Number(localStorage.getItem('level_test_bonus') || '0'); } catch { return 0; }
};

const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const pickDistractors = (exclude, field, pool, count = 3) => {
    return shuffle(pool.filter(h => h[field] && h[field] !== exclude)).slice(0, count).map(h => h[field]);
};

const buildLevelTestQuestions = (unlockedHanja) => {
    if (unlockedHanja.length === 0) return [];

    const questions = [];
    const picked = shuffle(unlockedHanja).slice(0, Math.min(unlockedHanja.length, 10));

    picked.forEach((item, idx) => {
        const type = idx % 3;

        if (type === 0) {
            // 뜻 맞추기: 한자 보고 뜻 선택
            const distractors = pickDistractors(item.meaning, 'meaning', SORTED_HANJA);
            questions.push({
                id: `q_${idx}_meaning`,
                qType: 'meaning',
                prompt: `다음 한자의 뜻은?`,
                hanja: item.hanja,
                choices: shuffle([item.meaning, ...distractors]),
                answer: item.meaning,
                item,
            });
        } else if (type === 1) {
            // 음 맞추기: 한자 보고 음 선택
            const distractors = pickDistractors(item.sound, 'sound', SORTED_HANJA);
            questions.push({
                id: `q_${idx}_sound`,
                qType: 'sound',
                prompt: `다음 한자의 음(읽는 법)은?`,
                hanja: item.hanja,
                choices: shuffle([item.sound, ...distractors]),
                answer: item.sound,
                item,
            });
        } else {
            // 단어 뜻 맞추기
            const wordPool = (item.words || []).filter(w => w.word && w.meaning);
            if (wordPool.length > 0) {
                const target = shuffle(wordPool)[0];
                const allWords = SORTED_HANJA.flatMap(h => h.words || []);
                const distractors = shuffle(allWords.filter(w => w.meaning && w.meaning !== target.meaning)).slice(0, 3).map(w => w.meaning);
                questions.push({
                    id: `q_${idx}_word`,
                    qType: 'word',
                    prompt: `다음 단어의 뜻은?`,
                    hanja: `${target.word}(${target.reading})`,
                    choices: shuffle([target.meaning, ...distractors]),
                    answer: target.meaning,
                    item,
                });
            } else {
                // 단어 없으면 뜻 문제로 대체
                const distractors = pickDistractors(item.meaning, 'meaning', SORTED_HANJA);
                questions.push({
                    id: `q_${idx}_meaning2`,
                    qType: 'meaning',
                    prompt: `다음 한자의 뜻은?`,
                    hanja: item.hanja,
                    choices: shuffle([item.meaning, ...distractors]),
                    answer: item.meaning,
                    item,
                });
            }
        }
    });

    // Ensure exactly 10 questions by padding with extra questions if needed
    const extraPool = shuffle(unlockedHanja);
    let ei = 0;
    while (questions.length < 10 && ei < extraPool.length * 3) {
        const item = extraPool[ei % extraPool.length];
        ei++;
        const distractors = pickDistractors(item.meaning, 'meaning', SORTED_HANJA);
        const q = {
            id: `q_extra_${ei}`,
            qType: 'meaning',
            prompt: `다음 한자의 뜻은?`,
            hanja: item.hanja,
            choices: shuffle([item.meaning, ...distractors]),
            answer: item.meaning,
            item,
        };
        if (!questions.find(x => x.hanja === q.hanja && x.qType === q.qType)) {
            questions.push(q);
        }
    }

    return questions.slice(0, 10);
};

const PASS_THRESHOLD = 7;

const LevelTestScreen = ({ onBack }) => {
    const currentBonus = getLevelTestBonus();
    const totalDays = getTotalDays();
    const unlockedCount = totalDays * 2 + currentBonus;

    const unlockedHanja = useMemo(() => SORTED_HANJA.slice(0, unlockedCount), [unlockedCount]);
    const questions = useMemo(() => buildLevelTestQuestions(unlockedHanja), [unlockedHanja]);

    const [phase, setPhase] = useState('intro'); // intro | quiz | result
    const [qIndex, setQIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // {qId: isCorrect}
    const [selected, setSelected] = useState(null); // selected choice
    const [revealed, setRevealed] = useState(false);

    const handleStart = () => {
        if (unlockedHanja.length < 3) return; // too few hanja to test
        setPhase('quiz');
        setQIndex(0);
        setAnswers({});
        setSelected(null);
        setRevealed(false);
    };

    const handleSelect = (choice) => {
        if (revealed) return;
        const q = questions[qIndex];
        const isCorrect = choice === q.answer;
        setSelected(choice);
        setRevealed(true);
        setAnswers(prev => ({ ...prev, [q.id]: isCorrect }));
    };

    const handleNext = () => {
        if (qIndex + 1 >= questions.length) {
            setPhase('result');
        } else {
            setQIndex(prev => prev + 1);
            setSelected(null);
            setRevealed(false);
        }
    };

    const correctCount = Object.values(answers).filter(Boolean).length;
    const passed = correctCount >= PASS_THRESHOLD;

    const handleFinish = () => {
        if (passed) {
            const newBonus = currentBonus + 2;
            localStorage.setItem('level_test_bonus', String(newBonus));
        }
        onBack();
    };

    if (phase === 'intro') {
        return (
            <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden">
                <div className="w-full px-4 shrink-0 safe-top">
                    <div className="w-full flex justify-between items-center clay-panel p-4 sm:p-6 px-6 rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-slate-700">
                        <button
                            onClick={onBack}
                            className="text-slate-600 dark:text-slate-200 font-black bg-white/60 dark:bg-slate-800/60 px-5 py-2.5 rounded-2xl border-2 border-white/50 shadow-md active:scale-95 transition-all"
                        >
                            <span className="text-xl">←</span>
                        </button>
                        <h1 className="text-2xl sm:text-4xl font-black text-slate-700 dark:text-white tracking-tight premium-text-shadow text-center flex-1 px-4">
                            레벨 테스트
                        </h1>
                        <div className="w-[60px]" />
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
                    <div className="text-6xl">🏆</div>

                    <div className="clay-panel rounded-[3rem] p-8 bg-white dark:bg-slate-800 border-4 border-white flex flex-col items-center gap-5 text-center max-w-sm w-full">
                        <h2 className="text-2xl font-black text-slate-700 dark:text-white">레벨 테스트</h2>
                        <div className="flex flex-col gap-3 text-left w-full">
                            <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl px-4 py-3">
                                <span className="text-2xl">📋</span>
                                <span className="text-slate-600 dark:text-slate-300 font-bold text-sm">총 {questions.length}문제</span>
                            </div>
                            <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl px-4 py-3">
                                <span className="text-2xl">🎯</span>
                                <span className="text-slate-600 dark:text-slate-300 font-bold text-sm">{PASS_THRESHOLD}문제 이상 맞혀야 통과</span>
                            </div>
                            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl px-4 py-3">
                                <span className="text-2xl">🔓</span>
                                <span className="text-slate-600 dark:text-slate-300 font-bold text-sm">통과하면 뭉치 학습지 2개 추가 해금!</span>
                            </div>
                        </div>
                        {unlockedHanja.length < 3 && (
                            <p className="text-red-400 font-bold text-sm">
                                뭉치 학습지를 먼저 3개 이상 열어야 테스트할 수 있어요!
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleStart}
                        disabled={unlockedHanja.length < 3}
                        className="px-12 py-4 rounded-[2rem] bg-indigo-500 disabled:bg-slate-300 text-white font-black text-lg shadow-xl active:scale-95 transition-all"
                    >
                        시작하기
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'quiz') {
        const q = questions[qIndex];
        const progress = ((qIndex) / questions.length) * 100;
        const isHanjaDisplay = q.qType === 'meaning' || q.qType === 'sound';

        return (
            <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden">
                <div className="w-full px-4 shrink-0 safe-top">
                    <div className="w-full flex justify-between items-center clay-panel p-4 px-6 rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-slate-700">
                        <button
                            onClick={() => setPhase('intro')}
                            className="text-slate-600 dark:text-slate-200 font-black bg-white/60 dark:bg-slate-800/60 px-5 py-2.5 rounded-2xl border-2 border-white/50 shadow-md active:scale-95 transition-all"
                        >
                            <span className="text-xl">←</span>
                        </button>
                        <div className="flex flex-col items-center gap-1 flex-1 px-4">
                            <span className="text-slate-500 dark:text-slate-400 font-bold text-sm">{qIndex + 1} / {questions.length}</span>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                        <div className="w-[60px]" />
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 overflow-y-auto">
                    <div className="clay-panel rounded-[3rem] p-8 bg-white dark:bg-slate-800 border-4 border-white flex flex-col items-center gap-4 text-center max-w-sm w-full">
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">{q.prompt}</p>
                        <div className={`flex items-center justify-center ${isHanjaDisplay ? 'text-7xl font-black text-slate-800 dark:text-white' : 'text-2xl font-black text-indigo-600 dark:text-indigo-300'}`}>
                            {q.hanja}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                        {q.choices.map((choice, ci) => {
                            let bgClass = 'bg-white dark:bg-slate-800 border-white';
                            if (revealed) {
                                if (choice === q.answer) bgClass = 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-400';
                                else if (choice === selected) bgClass = 'bg-red-100 dark:bg-red-900/50 border-red-400';
                            }
                            return (
                                <button
                                    key={ci}
                                    onClick={() => handleSelect(choice)}
                                    className={`clay-panel rounded-2xl p-4 border-4 ${bgClass} font-bold text-slate-700 dark:text-white text-base active:scale-95 transition-all`}
                                >
                                    {choice}
                                </button>
                            );
                        })}
                    </div>

                    {revealed && (
                        <button
                            onClick={handleNext}
                            className="px-12 py-4 rounded-[2rem] bg-indigo-500 text-white font-black text-lg shadow-xl active:scale-95 transition-all"
                        >
                            {qIndex + 1 >= questions.length ? '결과 보기' : '다음 →'}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Result phase
    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden">
            <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
                <div className="text-7xl">{passed ? '🎉' : '💪'}</div>

                <div className="clay-panel rounded-[3rem] p-8 bg-white dark:bg-slate-800 border-4 border-white flex flex-col items-center gap-5 text-center max-w-sm w-full">
                    <h2 className="text-3xl font-black text-slate-700 dark:text-white">
                        {passed ? '통과!' : '아쉬워요'}
                    </h2>
                    <div className="flex items-center gap-3">
                        <span className="text-5xl font-black text-indigo-600 dark:text-indigo-300">{correctCount}</span>
                        <span className="text-slate-400 font-bold text-2xl">/ {questions.length}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed">
                        {passed
                            ? `축하해요! 뭉치 학습지 2개가 추가로 해금됩니다 🔓`
                            : `${PASS_THRESHOLD}문제 이상 맞혀야 통과예요. 뭉치 학습지를 더 공부하고 다시 도전해 보세요!`
                        }
                    </p>

                    {/* Per-question result summary */}
                    <div className="flex gap-1 flex-wrap justify-center">
                        {questions.map((q, i) => (
                            <span
                                key={q.id}
                                className={`text-lg ${answers[q.id] ? 'text-emerald-500' : 'text-red-400'}`}
                            >
                                {answers[q.id] ? '○' : '✕'}
                            </span>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleFinish}
                    className="px-12 py-4 rounded-[2rem] bg-indigo-500 text-white font-black text-lg shadow-xl active:scale-95 transition-all"
                >
                    {passed ? '해금하고 돌아가기 🎉' : '돌아가기'}
                </button>
            </div>
        </div>
    );
};

export default LevelTestScreen;
