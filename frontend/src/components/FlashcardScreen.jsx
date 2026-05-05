import { useState, useMemo } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { useLang } from '../LangContext.jsx';

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

// 4지선다 오답 보기 생성
const pickDistractors = (correctId, field, count = 3) => {
    const pool = HANJA_DATA.filter(h => h.id !== correctId && h[field]);
    return shuffle(pool).slice(0, count).map(h => h[field]);
};

// 학습지용 퀴즈 생성
const buildWorksheetQuiz = (item) => {
    const questions = [];

    // Q1: 한자 음훈 (뜻 맞추기)
    const meaningDistractors = pickDistractors(item.id, 'meaning');
    questions.push({
        id: 'q_meaning',
        type: 'choice',
        prompt: `${item.hanja}의 뜻은?`,
        choices: shuffle([item.meaning, ...meaningDistractors]),
        answer: item.meaning,
    });

    // Q2: 한자 음 (음 맞추기)
    const soundDistractors = pickDistractors(item.id, 'sound');
    questions.push({
        id: 'q_sound',
        type: 'choice',
        prompt: `${item.hanja}의 음(읽는 법)은?`,
        choices: shuffle([item.sound, ...soundDistractors]),
        answer: item.sound,
    });

    // Q3~Q5: 단어 뜻 맞추기 (최대 3개)
    const wordPool = (item.words || []).filter(w => w.word && w.meaning);
    const pickedWords = shuffle(wordPool).slice(0, 3);
    pickedWords.forEach((w, i) => {
        const wDistractors = shuffle(HANJA_DATA.flatMap(h => h.words || []).filter(x => x.meaning && x.meaning !== w.meaning)).slice(0, 3).map(x => x.meaning);
        questions.push({
            id: `q_word_${i}`,
            type: 'choice',
            prompt: `${w.word}(${w.reading})의 뜻은?`,
            choices: shuffle([w.meaning, ...wDistractors]),
            answer: w.meaning,
        });
    });

    // Q_last: 역방향 — 뜻 보고 한자 고르기
    if (wordPool.length > 0) {
        const target = wordPool[0];
        const revDistractors = shuffle(HANJA_DATA.flatMap(h => h.words || []).filter(x => x.word && x.word !== target.word)).slice(0, 3).map(x => x.word);
        questions.push({
            id: 'q_reverse',
            type: 'choice',
            prompt: `"${target.meaning}"을 뜻하는 한자어는?`,
            choices: shuffle([target.word, ...revDistractors]),
            answer: target.word,
        });
    }

    return questions;
};

// ─── 인라인 퀴즈 문항 ────────────────────────────────────────────────────
const QuizItem = ({ q, idx, onAnswer, answered }) => {
    const [selected, setSelected] = useState(null);

    const handleSelect = (choice) => {
        if (selected) return;
        setSelected(choice);
        onAnswer(q.id, choice === q.answer);
    };

    return (
        <div className="flex flex-col gap-3">
            <p className="font-black text-slate-700 dark:text-white text-base">
                Q{idx + 1}. {q.prompt}
            </p>
            <div className="grid grid-cols-2 gap-2">
                {q.choices.map((c, i) => {
                    let cls = 'py-3 px-3 rounded-2xl font-bold text-sm border-2 transition-all active:scale-95 text-center ';
                    if (!selected) {
                        cls += 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white';
                    } else if (c === q.answer) {
                        cls += 'bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
                    } else if (c === selected) {
                        cls += 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900/30 dark:text-red-300';
                    } else {
                        cls += 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-300 dark:text-slate-600 opacity-60';
                    }
                    return (
                        <button key={i} className={cls} onClick={() => handleSelect(c)}>{c}</button>
                    );
                })}
            </div>
            {selected && (
                <p className={`text-sm font-bold ${selected === q.answer ? 'text-emerald-600' : 'text-red-500'}`}>
                    {selected === q.answer ? '✅ 정답!' : `❌ 정답: ${q.answer}`}
                </p>
            )}
        </div>
    );
};

// ─── 풀 학습지 화면 ──────────────────────────────────────────────────────
const HanjaStudySheet = ({ item, onBack, onWriteHanja }) => {
    const questions = useMemo(() => buildWorksheetQuiz(item), [item.id]);
    const [answers, setAnswers] = useState({}); // { qId: isCorrect }
    const [quizDone, setQuizDone] = useState(false);

    const handleAnswer = (qId, isCorrect) => {
        setAnswers(prev => {
            const next = { ...prev, [qId]: isCorrect };
            if (Object.keys(next).length >= questions.length) {
                setTimeout(() => setQuizDone(true), 400);
            }
            return next;
        });
    };

    const correctCount = Object.values(answers).filter(Boolean).length;
    const totalQ = questions.length;

    const playAudio = () => {
        const audioId = String(item.id).padStart(2, '0');
        const audio = new Audio('/assets/audio/card_' + audioId + '.mp3');
        audio.play().catch(() => {});
    };

    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-2xl mx-auto overflow-hidden">
            {/* 헤더 */}
            <div className="w-full px-4 pt-4 shrink-0">
                <div className="w-full flex justify-between items-center clay-panel p-4 px-6 rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-slate-700">
                    <button onClick={onBack} className="font-black bg-white/60 dark:bg-slate-800/60 px-5 py-2.5 rounded-2xl border-2 border-white/50 shadow-md active:scale-95 transition-all flex items-center gap-2 text-slate-600 dark:text-slate-200">
                        <span className="text-xl">←</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500 text-xs font-black px-3 py-1 rounded-full">{item.grade}</span>
                        <span className="text-slate-400 text-xs font-bold">{item.category}</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={playAudio} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center text-lg active:scale-90 transition-all shadow-sm">🔊</button>
                        <button onClick={() => onWriteHanja && onWriteHanja(item)} className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-700 flex items-center justify-center text-lg active:scale-90 transition-all shadow-sm">✏️</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-20 px-4 pt-4 flex flex-col gap-5">

                {/* ── 섹션 1: 한자 정보 ── */}
                <div className="clay-panel rounded-[2.5rem] border-4 border-white dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 overflow-hidden">
                    <div className="flex items-stretch">
                        {/* 이미지 */}
                        <div className="w-32 shrink-0 bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-4 border-r-2 border-slate-100 dark:border-slate-700">
                            <img
                                src={`/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.webp`}
                                onError={e => {
                                    if (e.target.src.endsWith('.webp')) e.target.src = `/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.svg`;
                                    else e.target.src = '/assets/images/hanja_placeholder.png';
                                }}
                                className="w-full aspect-square object-contain mix-blend-multiply dark:mix-blend-normal"
                                alt={item.hanja}
                            />
                        </div>
                        {/* 정보 */}
                        <div className="flex-1 p-5 flex flex-col justify-center gap-2">
                            <div className="flex items-baseline gap-3">
                                <span className="text-5xl font-black text-slate-700 dark:text-white leading-none">{item.hanja}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center bg-indigo-50 dark:bg-indigo-900/30 rounded-xl px-4 py-2 border border-indigo-100 dark:border-indigo-800">
                                    <span className="text-[10px] text-indigo-300 font-black uppercase tracking-widest">음</span>
                                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-300">{item.sound}</span>
                                </div>
                                <div className="flex flex-col items-center bg-amber-50 dark:bg-amber-900/30 rounded-xl px-4 py-2 border border-amber-100 dark:border-amber-800">
                                    <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest">훈</span>
                                    <span className="text-xl font-black text-amber-600 dark:text-amber-300">{item.meaning}</span>
                                </div>
                            </div>
                            {item.theme && <span className="text-xs text-slate-400 font-bold">{item.theme}</span>}
                        </div>
                    </div>
                </div>

                {/* ── 섹션 2: 어원 ── */}
                {item.etymology_short && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-[2rem] px-6 py-5 border-2 border-amber-100 dark:border-amber-800">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">📜</span>
                            <span className="text-xs font-black text-amber-500 uppercase tracking-widest">어원 이야기</span>
                        </div>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-200 leading-relaxed">{item.etymology_short}</p>
                    </div>
                )}

                {/* ── 섹션 3: 단어장 ── */}
                {item.words && item.words.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📖</span>
                            <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">관련 단어</span>
                            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-400 font-black px-2 py-0.5 rounded-full">{item.words.length}개</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {item.words.map((w, i) => (
                                <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl px-5 py-3.5 border-2 border-slate-100 dark:border-slate-700 shadow-sm">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-black text-lg text-slate-700 dark:text-white">{w.word}</span>
                                        <span className="text-sm font-bold text-indigo-400">({w.reading})</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-300">{w.meaning}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── 섹션 4: 연습 문제 ── */}
                <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">✏️</span>
                        <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">연습 문제</span>
                        <span className="text-xs bg-rose-100 dark:bg-rose-900/40 text-rose-400 font-black px-2 py-0.5 rounded-full">{questions.length}문제</span>
                    </div>

                    <div className="flex flex-col gap-6">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="bg-white dark:bg-slate-800 rounded-[1.5rem] p-5 border-2 border-slate-100 dark:border-slate-700 shadow-sm">
                                <QuizItem
                                    q={q}
                                    idx={idx}
                                    onAnswer={handleAnswer}
                                    answered={!!answers[q.id]}
                                />
                            </div>
                        ))}
                    </div>

                    {/* 퀴즈 완료 결과 */}
                    {quizDone && (
                        <div className={`rounded-[2rem] p-6 border-4 flex flex-col items-center gap-2 text-center ${
                            correctCount >= Math.ceil(totalQ * 0.7)
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
                        }`}>
                            <span className="text-4xl">{correctCount >= Math.ceil(totalQ * 0.7) ? '🎉' : '💪'}</span>
                            <span className="font-black text-xl text-slate-700 dark:text-white">
                                {correctCount}/{totalQ} 정답
                            </span>
                            <span className="text-sm font-bold text-slate-500">
                                {correctCount >= Math.ceil(totalQ * 0.7) ? '잘했어요! 다음 한자로 넘어가볼까요?' : '한 번 더 읽어보고 레벨 테스트에 도전해봐요!'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── 한자 카드 (그리드용) ──────────────────────────────────────────────────
const HanjaCard = ({ item, isLocked, onClick }) => {
    if (isLocked) {
        return (
            <div className="relative w-full aspect-[3/4] rounded-[2rem] bg-slate-100 dark:bg-slate-800/60 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1 select-none">
                <span className="text-2xl opacity-25">🔒</span>
                <span className="text-slate-300 dark:text-slate-600 font-black text-base">{item.hanja}</span>
            </div>
        );
    }
    return (
        <button
            onClick={onClick}
            className="relative w-full aspect-[3/4] clay-panel !rounded-[2rem] flex flex-col items-center p-3 justify-between border-4 border-white dark:border-slate-700 overflow-hidden active:scale-95 transition-all hover:-translate-y-1"
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent pointer-events-none z-10" />
            <div className="flex-1 flex items-center justify-center w-full min-h-0 py-2 relative z-0">
                <img
                    src={`/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.webp`}
                    onError={e => {
                        if (e.target.src.endsWith('.webp')) e.target.src = `/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.svg`;
                        else e.target.src = '/assets/images/hanja_placeholder.png';
                    }}
                    className="w-full h-full max-h-[80px] sm:max-h-[110px] object-contain drop-shadow-md mix-blend-multiply dark:mix-blend-normal"
                    alt={item.hanja}
                />
            </div>
            <div className="w-full bg-white/90 dark:bg-slate-800/90 rounded-xl py-2 text-center border border-slate-100 dark:border-slate-700 shrink-0 mt-1 relative z-20">
                <div className="text-xl sm:text-2xl text-slate-700 dark:text-white font-black leading-none">{item.hanja}</div>
                <div className="text-[10px] text-slate-400 font-bold">{item.sound} · {item.meaning}</div>
            </div>
        </button>
    );
};

// ─── 메인 FlashcardScreen ──────────────────────────────────────────────────
const FlashcardScreen = ({ onBack, onCardFlip, onWriteHanja }) => {
    const [viewMode, setViewMode] = useState('grade');
    const [selectedGrade, setSelectedGrade] = useState('8급');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [studyItem, setStudyItem] = useState(null); // 학습지 열린 한자

    const totalDays = getTotalDays();
    const bonus = getLevelTestBonus();
    const unlockedCount = totalDays * 2 + bonus;

    const categories = useMemo(() => [...new Set(HANJA_DATA.map(h => h.category).filter(Boolean))], []);
    if (!selectedCategory && categories.length > 0 && !categories.includes(selectedCategory)) {
        // initial set handled via useState default
    }

    const currentItems = useMemo(() => {
        if (viewMode === 'grade') {
            if (selectedGrade === '기타') return HANJA_DATA.filter(h => !h.grade || h.grade === '' || h.grade === '기타' || h.grade === 'NON');
            return HANJA_DATA.filter(h => h.grade === selectedGrade);
        }
        return HANJA_DATA.filter(h => h.category === selectedCategory);
    }, [viewMode, selectedGrade, selectedCategory]);

    const sortedAll = useMemo(() => [...HANJA_DATA].sort((a, b) => a.id - b.id), []);
    const isUnlocked = (item) => sortedAll.findIndex(h => h.id === item.id) < unlockedCount;

    const handleCardClick = (item) => {
        if (onCardFlip) onCardFlip(item.id);
        setStudyItem(item);
    };

    // 학습지 뷰
    if (studyItem) {
        return (
            <HanjaStudySheet
                item={studyItem}
                onBack={() => setStudyItem(null)}
                onWriteHanja={(h) => { setStudyItem(null); if (onWriteHanja) onWriteHanja(h); }}
            />
        );
    }

    const unlockedInView = currentItems.filter(isUnlocked).length;

    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden">
            <div className="w-full px-4 shrink-0 safe-top">
                <div className="w-full flex justify-between items-center clay-panel p-4 sm:p-5 px-6 rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-slate-700">
                    <button onClick={onBack} className="text-slate-600 dark:text-slate-200 font-black bg-white/60 dark:bg-slate-800/60 px-5 py-2.5 rounded-2xl border-2 border-white/50 shadow-md active:scale-95 transition-all flex items-center gap-2">
                        <span className="text-xl">←</span>
                    </button>
                    <h1 className="text-xl sm:text-3xl font-black text-slate-700 dark:text-white tracking-tight premium-text-shadow text-center flex-1 px-3">
                        뭉치 학습지
                    </h1>
                    <div className="flex flex-col items-end shrink-0">
                        <span className="text-sm font-black text-indigo-500">{Math.min(unlockedCount, HANJA_DATA.length)}개 해금</span>
                        <span className="text-[10px] text-slate-400 font-bold">하루 2개씩 추가</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 pb-32">
                <div className="w-full max-w-5xl mx-auto px-4 flex flex-col gap-5">
                    {/* 탭 */}
                    <div className="flex bg-slate-100/60 dark:bg-slate-900/60 p-1.5 rounded-[2rem] border-2 border-white dark:border-slate-700 shadow-inner w-fit mx-auto">
                        <button onClick={() => setViewMode('grade')} className={`px-7 py-2.5 rounded-2xl font-black text-base transition-all ${viewMode === 'grade' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}>급수별</button>
                        <button onClick={() => setViewMode('topic')} className={`px-7 py-2.5 rounded-2xl font-black text-base transition-all ${viewMode === 'topic' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}>주제별</button>
                    </div>

                    {viewMode === 'grade' && (
                        <div className="flex gap-3 justify-center flex-wrap">
                            {['8급', '7급', '6급', '기타'].map(g => (
                                <button key={g} onClick={() => setSelectedGrade(g)}
                                    className={`px-6 py-2.5 rounded-[2rem] font-black text-base border-4 transition-all ${selectedGrade === g ? 'bg-indigo-500 text-white border-white shadow-xl scale-105' : 'bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40'}`}>
                                    {g}
                                </button>
                            ))}
                        </div>
                    )}

                    {viewMode === 'topic' && (
                        <div className="flex flex-wrap gap-2 justify-center">
                            {categories.map(cat => (
                                <button key={cat} onClick={() => setSelectedCategory(cat)}
                                    className={`px-5 py-2 rounded-[2rem] font-black text-sm border-3 whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-indigo-500 text-white border-white shadow-xl scale-105' : 'bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40'}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 해금 안내 배너 */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl px-4 py-3 border border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
                        <span className="text-indigo-400 text-base">📅</span>
                        <p className="text-xs font-bold text-indigo-500 dark:text-indigo-300">
                            이 목록 <strong>{unlockedInView}개</strong> 학습 가능 · 레벨 테스트로 추가 해금 가능
                        </p>
                    </div>

                    {/* 그리드 */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-5">
                        {currentItems.map(item => (
                            <HanjaCard
                                key={item.id}
                                item={item}
                                isLocked={!isUnlocked(item)}
                                onClick={() => handleCardClick(item)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlashcardScreen;
