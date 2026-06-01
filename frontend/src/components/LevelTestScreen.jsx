import { useState, useMemo, useRef } from 'react';
import { SK } from '../constants/storageKeys.js';
import HANJA_DATA from '../hanja_unified.json';
import { getCharacterImage } from '../utils/rankUtils.js';

const SORTED_HANJA = [...HANJA_DATA].sort((a, b) => a.id - b.id);

const getTotalDays = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(SK.STUDY_LOG) || '{}');
        return saved.total?.totalDays || 1;
    } catch { return 1; }
};

const getLevelTestBonus = () => {
    try { return Number(localStorage.getItem(SK.LEVEL_TEST_BONUS) || '0'); } catch { return 0; }
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
                prompt: `다음 한자의 음은?`,
                hanja: item.hanja,
                choices: shuffle([item.sound, ...distractors]),
                answer: item.sound,
                item,
            });
        } else {
            // 단어 뜻 맞추기
            const wordPool = (item.words || []).filter(w => w.word && w.meaning && w.type !== 'idiom');
            if (wordPool.length > 0) {
                const target = shuffle(wordPool)[0];
                const allWords = SORTED_HANJA.flatMap(h => h.words || []).filter(w => w.type !== 'idiom');
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
    const usedHanja = new Set(questions.map(q => q.hanja));
    const extraPool = shuffle(unlockedHanja.filter(h => !usedHanja.has(h.hanja)));
    let ei = 0;
    while (questions.length < 10 && ei < extraPool.length) {
        const item = extraPool[ei];
        ei++;
        const distractors = pickDistractors(item.meaning, 'meaning', SORTED_HANJA);
        questions.push({
            id: `q_extra_${ei}`,
            qType: 'meaning',
            prompt: `다음 한자의 뜻은?`,
            hanja: item.hanja,
            choices: shuffle([item.meaning, ...distractors]),
            answer: item.meaning,
            item,
        });
    }

    return questions.slice(0, 10);
};

const LevelTestScreen = ({ onBack, onComplete, onHanjaAcquired, selectedCharacter }) => {
    const currentBonus = getLevelTestBonus();
    const totalDays = getTotalDays();
    const unlockedCount = totalDays * 3 + currentBonus;

    const unlockedHanja = useMemo(() => SORTED_HANJA.slice(0, unlockedCount), [unlockedCount]);
    const questions = useMemo(() => buildLevelTestQuestions(unlockedHanja), [unlockedHanja]);

    // 통과 기준: 문제 수의 70% (최소 1문제)
    const PASS_THRESHOLD = Math.max(1, Math.ceil(questions.length * 0.7));

    const [phase, setPhase] = useState('intro'); // intro | quiz | result
    const [qIndex, setQIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // {qId: isCorrect}
    const [selected, setSelected] = useState(null); // selected choice
    const [revealed, setRevealed] = useState(false);
    const [xpPopup, setXpPopup] = useState({ show: false, key: 0, amount: 0 });
    const xpPopupKeyRef = useRef(0);

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

        if (isCorrect) {
            if (onHanjaAcquired) onHanjaAcquired(q.item?.id || null, 10);
            xpPopupKeyRef.current += 1;
            setXpPopup({ show: true, key: xpPopupKeyRef.current, amount: 10 });
            setTimeout(() => setXpPopup(p => ({ ...p, show: false })), 1500);
        } else {
        }
    };

    const handleNext = () => {
        if (qIndex + 1 >= questions.length) {
            setPhase('result');
            if (onComplete) onComplete({ correct: Object.values({ ...answers }).filter(Boolean).length, total: questions.length });
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
            localStorage.setItem(SK.LEVEL_TEST_BONUS, String(newBonus));
        }
        onBack();
    };

    if (phase === 'intro') {
        return (
            <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden">
                {/* 헤더 */}
                <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                    <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                        <button onClick={onBack}
                            className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-black text-[#5B677A] gap-1">
                            ←
                        </button>
                        <div className="flex items-center gap-2 overflow-hidden">
                            <h2 className="text-lg font-black text-slate-700 m-0">레벨 테스트</h2>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 overflow-y-auto pt-8">
                    <div className="clay-panel rounded-[3.5rem] p-6 sm:p-8 bg-white dark:bg-slate-800 border-4 border-white flex flex-col items-center gap-6 text-center max-w-md w-full shadow-2xl">
                        
                        {/* 헤더: 트로피 축소 및 타이틀 결합 */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-20 h-20 bg-[#FFB433]/10 dark:bg-[#FFB433]/20 rounded-full flex items-center justify-center border-4 border-[#FFB433]/15 dark:border-[#8B5E00] mb-2">
                                
                            </div>
                            <h2 className="text-h2-res font-extrabold text-slate-700 dark:text-white premium-text-shadow">레벨 테스트</h2>
                            <p className="text-sm font-bold text-[#AEB7C5]">학습한 내용을 확인하고 다음 단계로!</p>
                        </div>

                        {/* 핵심 정보: 그리드 레이아웃으로 가독성 향상 */}
                        <div className="grid grid-cols-2 gap-4 w-full">
                            <div className="bg-[#7C83FF]/10/50 dark:bg-[#4A51D4]/30 rounded-3xl p-5 flex flex-col items-center justify-center border-2 border-[#C3C6FF]/50 dark:border-[#4A51D4]">
                                <span className="text-h2-res mb-2">📋</span>
                                <span className="text-xs text-[#7C83FF] font-extrabold uppercase tracking-widest mb-1">문제 수</span>
                                <span className="text-body-lg-res font-extrabold text-[#4A51D4] dark:text-[#7C83FF]">{questions.length}문항</span>
                            </div>
                            <div className="bg-[#FFB433]/10/50 dark:bg-[#FFB433]/30 rounded-3xl p-5 flex flex-col items-center justify-center border-2 border-[#FFB433]/15/50 dark:border-[#8B5E00]">

                                <span className="text-xs text-[#FFB433] font-extrabold uppercase tracking-widest mb-1">통과 기준</span>
                                <span className="text-body-lg-res font-extrabold text-[#FFB433] dark:text-[#FFB433]">{PASS_THRESHOLD}점 이상</span>
                            </div>
                        </div>

                        {/* 혜택 및 상태 정보 */}
                        <div className="flex flex-col gap-3 text-left w-full">
                            <div className="flex items-center gap-4 bg-[#FF9B73]/10/50 dark:bg-[#FF9B73]/20/30 rounded-2xl px-5 py-4 border-2 border-[#FF9B73]/20/50 dark:border-[#FF9B73]/30">
                                <span className="text-h3-res">🔓</span>
                                <p className="text-[#5B677A] dark:text-[#AEB7C5] font-bold text-sm leading-tight">
                                    통과 시 <span className="text-[#FF9B73] dark:text-[#FF9B73] font-extrabold">학습지 2개 추가 오픈</span>
                                </p>
                            </div>
                        </div>

                        {unlockedHanja.length < 3 && (
                            <p className="text-red-500 font-extrabold text-sm bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl border border-red-100 dark:border-red-800 w-full">
                                학습지를 3개 이상 완료해야 합니다.
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleStart}
                        disabled={unlockedHanja.length < 3}
                        className="w-full max-w-md py-5 rounded-[2rem] font-bold text-h3 text-white disabled:bg-slate-300 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                        style={{ background: '#7C83FF' }}
                    >
                        시작하기
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'quiz') {
        const q = questions[qIndex];
        const progress = (qIndex / questions.length) * 100;
        const isHanjaDisplay = q.qType === 'meaning' || q.qType === 'sound';

        return (
            <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden bg-[#F7FAF9]">
                {xpPopup.show && (
                    <div key={xpPopup.key} className="xp-popup-wrapper">
                        <div className="xp-popup-badge">
                            ⭐ +{xpPopup.amount} XP
                        </div>
                    </div>
                )}

                {/* 헤더 + 진행바 */}
                <div className="w-full shrink-0 safe-top pt-4 px-4 mb-3">
                    <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-5 shadow-md border border-white">
                        <button onClick={() => setPhase('intro')}
                            className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-sm active:scale-95 transition-all px-3 py-1.5 font-black text-[#5B677A] text-sm gap-1 shrink-0">
                            <span>←</span>
                        </button>
                        <div className="flex-1">
                            <div className="flex justify-between text-xs font-extrabold text-[#AEB7C5] mb-1">
                                <span>레벨 테스트</span>
                                <span>{qIndex + 1} / {questions.length}</span>
                            </div>
                            <div className="w-full rounded-full overflow-hidden" style={{ height: '11px', backgroundColor: '#E9EDF5' }}>
                                <div className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%`, backgroundColor: '#6D6FF2' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 문제 영역 */}
                <div className="flex-1 flex flex-col items-center justify-between px-5 pb-8 overflow-y-auto">
                    <div className="w-full max-w-md flex flex-col items-center gap-5 pt-2">
                        {/* 문제 카드 */}
                        <div className="grade-test-question-card">
                            <p className="grade-test-prompt">{q.prompt}</p>
                            <div className={`grade-test-hanja-box ${isHanjaDisplay ? 'grade-test-hanja-box--single' : 'grade-test-hanja-box--compound'}`}>
                                <span className="grade-test-hanja-char hanja-char">{q.hanja}</span>
                            </div>
                        </div>

                        {/* 보기 */}
                        <div className="grade-test-choice-grid">
                            {q.choices.map((choice, ci) => {
                                let stateClass = '';
                                if (revealed) {
                                    if (choice === q.answer) stateClass = 'quiz-choice-btn--correct';
                                    else if (choice === selected) stateClass = 'quiz-choice-btn--wrong';
                                    else stateClass = 'quiz-choice-btn--dimmed';
                                } else if (selected !== null) {
                                    if (choice === selected) stateClass = 'quiz-choice-btn--wrong';
                                    else stateClass = 'quiz-choice-btn--dimmed';
                                }
                                return (
                                    <button key={ci} onClick={() => handleSelect(choice)}
                                        className={`quiz-choice-btn ${stateClass}`}>
                                        {choice}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 정오 표시 */}
                        {revealed && (
                            <div className={`quiz-feedback ${selected === q.answer ? 'quiz-feedback--correct' : 'quiz-feedback--wrong'}`}>
                                {selected === q.answer ? '✓ 정답!' : `✗ 정답: ${q.answer}`}
                            </div>
                        )}

                        {revealed && (
                            <button onClick={handleNext} className="quiz-next-btn w-full">
                                {qIndex + 1 >= questions.length ? '결과 보기 ›' : '다음 ›'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Result phase
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleFinish} />
            
            <div className="minimal-card-studio bg-white w-full max-w-md overflow-hidden relative animate-in zoom-in slide-in-from-bottom-8 duration-500 !rounded-[3.5rem] shadow-2xl border-4 border-white">
                <div className="pt-1 pb-1 px-8 flex flex-col items-center gap-2 w-full relative">
                    
                    {/* 상단 장식 아이콘 제거됨 */}

                    {/* 메인 비주얼 */}
                    <img 
                        src={getCharacterImage(selectedCharacter, passed ? 'success' : 'failure')} 
                        alt="result" 
                        className="w-52 h-52 object-contain drop-shadow-xl mt-4" 
                    />

                    {/* 텍스트 정보 */}
                    <div className="text-center flex flex-col gap-2">
                        <span className="text-xs-res font-extrabold text-[#AEB7C5] uppercase tracking-widest">
                            {passed ? '정말 대단해요! 레벨 테스트 통과!' : '아쉽지만 다시 도전해볼까요?'}
                        </span>
                        <h1 className="text-h1 font-black tracking-tighter" style={{ color: passed ? '#FF9B73' : '#64748B' }}>
                            {correctCount} / {questions.length} 맞춤!
                        </h1>
                        
                        {/* 획득 경험치 표시 */}
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <div className="px-6 py-2 rounded-full bg-[#FFB433]/10 border-2 border-[#FFB433]/15 flex items-center gap-2 shadow-sm">
                                <span className="text-xl">⭐</span>
                                <span className="text-body-lg font-black text-[#FFB433]">+{correctCount * 10} XP 획득</span>
                            </div>
                        </div>

                        <p className="text-xs-res font-bold text-[#AEB7C5] leading-relaxed break-keep mt-3">
                            {passed
                                ? `축하해요! 뭉치 학습지 2개가 추가로 열립니다 🔓`
                                : `${PASS_THRESHOLD}문제 이상 맞혀야 통과예요. 더 공부하고 다시 도전해 보세요!`
                            }
                        </p>
                    </div>

                    {/* 문항별 결과 점 찍기 */}
                    <div className="flex gap-1.5 flex-wrap justify-center py-2">
                        {questions.map((q, i) => (
                            <div
                                key={q.id}
                                className={`w-3 h-3 rounded-full ${answers[q.id] ? 'bg-[#FF9B73] shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-200'}`}
                            />
                        ))}
                    </div>

                    {/* 하단 버튼 */}
                    <div className="w-full flex flex-col gap-3 mt-4">
                        <button
                            onClick={handleFinish}
                            className="w-full py-5 rounded-[2rem] bg-[#7C83FF] text-white font-extrabold text-body-lg shadow-xl shadow-[#C3C6FF] active:scale-95 transition-all border-b-4 border-[#4A51D4]"
                        >
                            {passed ? '오픈하고 돌아가기 🎉' : '돌아가기'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LevelTestScreen;
