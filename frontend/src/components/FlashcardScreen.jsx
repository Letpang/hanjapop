import { useState, useMemo } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import DAILY_CURRICULUM from '../data/dailyCurriculum.js';
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
const QuizItem = ({ q, idx, onAnswer, twoCol }) => {
    const [wrongChoices, setWrongChoices] = useState([]);
    const [isCorrect, setIsCorrect] = useState(false);

    const handleSelect = (c) => {
        if (isCorrect || wrongChoices.includes(c)) return;
        
        if (c === q.answer) {
            setIsCorrect(true);
            onAnswer(q.id, wrongChoices.length === 0);
        } else {
            setWrongChoices(prev => [...prev, c]);
        }
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-[10px] font-extrabold text-indigo-400 border border-indigo-100 uppercase tracking-widest">Q{idx + 1}</span>
                <p className="font-extrabold text-[#5D544F] text-base tracking-tight break-keep">{q.prompt}</p>
            </div>
            <div className={`grid gap-3 ${twoCol ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {q.choices.map((c, i) => {
                    const isWrong = wrongChoices.includes(c);
                    const isRight = isCorrect && c === q.answer;
                    
                    let cls = 'py-4 px-6 rounded-2xl font-extrabold text-sm border transition-all active:scale-[0.98] text-left flex justify-between items-center ';
                    
                    if (isRight) {
                        cls += 'bg-white border-[#B2F5EA] text-[#3D3530] border-4 shadow-lg shadow-teal-50';
                    } else if (isWrong) {
                        cls += 'bg-white border-[#FED2D2] text-[#3D3530] border-4 opacity-70';
                    } else {
                        cls += 'bg-white border-slate-100 text-[#5D544F] hover:border-indigo-400 hover:shadow-md';
                    }

                    return (
                        <button key={i} className={cls} onClick={() => handleSelect(c)}>
                            <span className="break-keep">{c}</span>
                            {isRight && <span className="text-teal-400">✓</span>}
                            {isWrong && <span className="text-rose-300">✕</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ─── 풀 학습지 화면 ──────────────────────────────────────────────────────
const HanjaStudySheet = ({ item, onBack, onWriteHanja, onMarkCorrect, onMarkWrong, onHanjaAcquired, isSequence, onNext, isLast }) => {
    const questions = useMemo(() => buildWorksheetQuiz(item), [item.id]);
    const [answers, setAnswers] = useState({}); // { qId: isCorrect }
    const [quizDone, setQuizDone] = useState(false);

    const handleAnswer = (qId, isCorrect) => {
        if (answers[qId] !== undefined) return; // Prevent double XP
        setAnswers(prev => {
            const next = { ...prev, [qId]: isCorrect };
            if (isCorrect && onHanjaAcquired) onHanjaAcquired(item.id, 5); // 5 XP per correct answer
            
            if (Object.keys(next).length >= questions.length) {
                const correct = Object.values(next).filter(Boolean).length;
                const passed = correct >= Math.ceil(questions.length * 0.7);
                if (passed && onMarkCorrect) onMarkCorrect(item.id);
                else if (!passed && onMarkWrong) onMarkWrong(item.id);
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
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#FDFBF7]">
            {/* 헤더 */}
            <div className="w-full px-4 shrink-0 relative z-50" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
                <div className="minimal-card-studio w-full flex justify-between items-center p-3 px-[clamp(1rem,4vw,2rem)] bg-white border-slate-100 shadow-xl !rounded-[2rem]">
                    <button onClick={onBack} className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center font-extrabold text-xl active:scale-90 text-slate-300 border border-slate-100">
                        ←
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-[0.2em]">{item.grade} · {item.category}</span>
                        <h2 className="text-xl font-extrabold text-[#5D544F] tracking-tight uppercase">한자 학습지</h2>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={playAudio} className="w-11 h-11 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-xl active:scale-90 transition-all hover:bg-slate-100">🔊</button>

                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pb-32 px-5 pt-8 flex flex-col gap-10 max-w-2xl w-full mx-auto">

                {/* ── 섹션 1: 한자 정보 ── */}
                <div className="minimal-card-studio bg-white border border-slate-100 shadow-xl p-8 !rounded-[2rem]">
                    <div className="flex flex-col items-center gap-2">
                        <div className="font-extrabold text-[#5D544F] leading-none tracking-tighter" style={{ fontSize: 'clamp(5rem, 25vw, 7rem)' }}>{item.hanja}</div>
                        <div className="flex items-center gap-3">
                            <span className="font-extrabold text-slate-400 text-2xl">{item.meaning}</span>
                            <span className="font-extrabold text-indigo-400 text-2xl">{item.sound}</span>
                        </div>
                        <button onClick={playAudio} className="mt-2 w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 border-2 border-slate-100 text-slate-300 active:scale-90 transition-all shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                        </button>
                    </div>
                    {item.etymology_short && (
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <p className="text-sm font-extrabold text-[#5D544F] leading-relaxed tracking-tight break-keep">{item.etymology_short}</p>
                        </div>
                    )}
                </div>

                {/* ── 섹션 3: 단어장 ── */}
                {item.words && item.words.length > 0 && (
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-lg border border-slate-100">📖</div>
                                <span className="text-[20px] font-extrabold text-slate-900 uppercase tracking-widest">관련 단어</span>
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-200 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">{item.words.length}개 항목</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            {item.words.map((w, i) => (
                                <div key={i} className="flex items-center justify-between bg-white rounded-[3rem] border border-slate-100 px-[clamp(1rem,5vw,2rem)] py-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-baseline gap-3">
                                        <span className="font-extrabold text-xl text-[#5D544F] tracking-tight break-keep">{w.word}</span>
                                        <span className="text-sm font-extrabold text-indigo-400 uppercase break-keep">({w.reading})</span>
                                    </div>
                                    <span className="text-sm font-extrabold text-slate-400 uppercase tracking-tight break-keep">{w.meaning}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── 섹션 4: 연습 문제 ── */}
                <div className="flex flex-col gap-10">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <img src="/assets/images/icons/practice.png" className="w-5 h-5 object-contain" alt="연습문제" />
                            <span className="text-[20px] font-extrabold text-slate-900 uppercase tracking-widest">연습 문제</span>
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-200 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">{questions.length}개 문제</span>
                    </div>

                    <div className="flex flex-col gap-10">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="minimal-card-studio p-10 bg-white border border-slate-100 shadow-xl !rounded-[3rem]">
                                <QuizItem
                                    q={q}
                                    idx={idx}
                                    onAnswer={handleAnswer}
                                    answered={!!answers[q.id]}
                                    twoCol={!q.id.startsWith('q_word_')}
                                />
                            </div>
                        ))}
                    </div>

                    {/* 퀴즈 완료 결과 및 다음 단계 버튼 */}
                    {quizDone && (
                        <div className="flex flex-col gap-6 w-full animate-in zoom-in duration-700">
                            <div className={`rounded-[3rem] p-10 border-4 flex flex-col items-center gap-4 text-center shadow-xl ${
                                correctCount >= Math.ceil(totalQ * 0.7)
                                    ? 'bg-emerald-50/50 border-emerald-100'
                                    : 'bg-amber-50/50 border-amber-100'
                            }`}>
                                <span className="text-7xl mb-2">{correctCount >= Math.ceil(totalQ * 0.7) ? '🎉' : '💪'}</span>
                                <div className="flex flex-col gap-1">
                                    <span className="font-extrabold text-2xl text-[#5D544F] uppercase tracking-tight break-keep">
                                        Score: {correctCount} / {totalQ}
                                    </span>
                                    <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest">
                                        {correctCount >= Math.ceil(totalQ * 0.7) ? 'GREAT JOB!' : 'TRY ONCE MORE TO MASTER!'}
                                    </span>
                                </div>
                            </div>

                            {isSequence && (
                                <button
                                    onClick={onNext}
                                    className="w-full py-6 rounded-full bg-[#6C5DD3] text-white font-extrabold text-xl shadow-xl shadow-indigo-100 active:scale-95 transition-all mb-10"
                                >
                                    {isLast ? '학습 완료! →' : '다음 한자로 →'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 급수별 하단 바 색상 (메인 메뉴 카드와 동일한 톤)
const GRADE_BAR_COLOR = {
    '8급':  '#A8E6CF',
    '7급Ⅱ': '#FFADAD',
    '7급':  '#FFD6A5',
    '6급Ⅱ': '#BDB2FF',
    '6급':  '#A5F3FC',
    'NON':  '#C7D2FE',
};

// ─── 한자 카드 (그리드용) — 메인 메뉴 카드 스타일 ──────────────────────────
const HanjaCard = ({ item, isLocked, onClick }) => {
    const barColor = GRADE_BAR_COLOR[item.grade] || '#E2E8F0';

    if (isLocked) {
        return (
            <div className="minimal-card-studio relative w-full flex flex-col items-center justify-center p-8 bg-white/40 border-slate-100 !min-h-[200px] opacity-40 grayscale">
                <span className="text-4xl opacity-20 mb-3">🔒</span>
                <span className="text-[#5D544F] font-extrabold text-2xl tracking-tighter uppercase">{item.hanja}</span>
                <div className="absolute bottom-0 left-0 right-0 h-1.5 opacity-30" style={{ backgroundColor: barColor }} />
            </div>
        );
    }

    return (
        <button
            onClick={onClick}
            className="minimal-card-studio group relative w-full flex flex-col items-center justify-center p-8 bg-white border-slate-100 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-50 active:scale-95 transition-all duration-300 !min-h-[200px]"
        >
            <div className="w-20 h-20 mb-4 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500">
                <div 
                  className="absolute inset-0 rounded-[2.5rem] opacity-5 group-hover:opacity-10 transition-opacity"
                  style={{ backgroundColor: barColor }}
                />
                <img
                    src={`/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.webp`}
                    onError={e => {
                        if (e.target.src.endsWith('.webp')) e.target.src = `/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.svg`;
                        else e.target.src = '/assets/images/hanja_placeholder.webp';
                    }}
                    className="w-[80%] h-[80%] object-contain relative z-20 drop-shadow-sm"
                    alt={item.hanja}
                />
            </div>
            <div className="flex flex-col items-center relative z-10">
                <span className="text-3xl font-extrabold text-[#5D544F] tracking-tighter uppercase">{item.hanja}</span>
                <span className="text-[10px] text-slate-300 font-extrabold mt-1 uppercase tracking-widest break-keep">{item.sound} · {item.meaning}</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1.5 group-hover:h-2 transition-all" style={{ backgroundColor: barColor }} />
        </button>
    );
};

// ─── 인라인 플립 카드 (백업 스타일 모방) ────────────────────
const Flashcard = ({ item, onFlip, shouldBlink }) => {
    const { t } = useLang();
    const [flipped, setFlipped] = useState(false);

    const handleFlip = () => {
        const nextFlipped = !flipped;
        setFlipped(nextFlipped);
        if (nextFlipped) {
            if (onFlip) onFlip(item.id);
            const audioId = String(item.id).padStart(2, '0');
            new Audio('/assets/audio/card_' + audioId + '.mp3').play().catch(() => {});
        }
    };

    return (
        <div className="w-full max-w-[320px] mx-auto h-full min-h-[260px] max-h-[400px] relative flashcard-perspective group" onClick={handleFlip}>
            <div className={`relative w-full h-full transition-all duration-700 flashcard-preserve-3d ${flipped ? 'flashcard-face-back' : ''}`}>
                
                {/* ── FRONT ── */}
                <div className="absolute inset-0 flashcard-backface-hidden flashcard-face-front bg-white rounded-[3rem] border-[6px] border-white shadow-2xl flex flex-col items-center px-6 pt-10 pb-10 overflow-hidden">

                    {/* 이미지 영역 — 카드 상단 40px 아래서 시작, 남은 공간 채움 */}
                    <div className="w-full flex-1 min-h-0 flex items-center justify-center px-2 relative">
                        <div className="absolute inset-0 bg-slate-50 rounded-[1.5rem] opacity-40 shadow-inner" />
                        <img
                            src={`/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.webp`}
                            onError={e => {
                                if (e.target.src.endsWith('.webp')) e.target.src = `/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.svg`;
                                else e.target.src = '/assets/images/hanja_placeholder.webp';
                            }}
                            className="w-full h-full object-contain relative z-10 group-hover:scale-110 transition-transform duration-500"
                            alt={item.hanja}
                        />
                    </div>

                    {/* 이미지 → 한자: 48px */}
                    <div className="h-12 shrink-0" />

                    {/* 한자 */}
                    <span className="text-7xl font-extrabold text-[#5D544F] tracking-tighter drop-shadow-sm shrink-0 leading-none">{item.hanja}</span>

                    {/* 한자 → TAP TO LEARN: 24px */}
                    <div className="h-6 shrink-0" />

                    {/* TAP TO LEARN — 카드 하단 40px 위에서 끝 */}
                    <span className={`text-[14px] font-extrabold uppercase tracking-[0.2em] shrink-0 transition-all ${shouldBlink ? 'text-rose-500' : 'text-[#6C5DD3]'}`}>
                        {t('tapToLearn')}
                    </span>

                </div>

                {/* ── BACK ── */}
                <div className="absolute inset-0 flashcard-backface-hidden flashcard-face-back bg-[#F5F3FF] rounded-[3rem] border-[6px] border-white shadow-2xl flex flex-col items-center justify-center p-10 gap-2 overflow-hidden">
                    <span className="text-2xl font-extrabold text-slate-300 tracking-tighter uppercase mb-2">{item.hanja}</span>
                    <div className="w-12 h-1 bg-indigo-200/50 rounded-full mb-6" />
                    <span className="text-6xl font-extrabold text-indigo-600 tracking-tight uppercase drop-shadow-sm break-keep">{item.sound}</span>
                    <span className="text-2xl font-extrabold text-slate-500 tracking-tight uppercase text-center break-keep">{item.meaning}</span>
                    
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const audioId = String(item.id).padStart(2, '0');
                            new Audio('/assets/audio/card_' + audioId + '.mp3').play().catch(() => {});
                        }}
                        className="mt-8 w-20 h-20 rounded-[1.6rem] flex items-center justify-center active:scale-90 transition-all"
                        style={{
                            background: 'linear-gradient(145deg, #8B7FF0 0%, #5B4FCF 100%)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                        }}
                    >
                        <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
                            <rect x="3" y="13" width="10" height="14" rx="3" fill="white"/>
                            <path d="M13 10L25 4L25 36L13 30Z" fill="white"/>
                            <path d="M28 14C30 16 31 18 31 20C31 22 30 24 28 26" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.85"/>
                            <path d="M32 10C35 13 36.5 16.5 36.5 20C36.5 23.5 35 27 32 30" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.45"/>
                        </svg>
                    </button>
                    
                </div>
            </div>
        </div>
    );
};

// ─── 메인 FlashcardScreen ──────────────────────────────────────────────────
const FlashcardScreen = ({ onBack, onCardFlip, onWriteHanja, onMarkCorrect, onMarkWrong, hanjaFilter, onStageClear, unlockedHanjaIds, onHanjaAcquired }) => {
    const { t } = useLang();
    const [viewMode, setViewMode] = useState('topic'); // Default to topic for visual appeal
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [studyItem, setStudyItem] = useState(null); // 학습지 열린 한자
    
    // 백업 스타일 싱글 카드 모드용 상태
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [hasFlipped, setHasFlipped] = useState(false);
    const [shouldBlink, setShouldBlink] = useState(false);

    const totalDays = getTotalDays();
    const bonus = getLevelTestBonus();

    const unlockedIds = useMemo(() => {
        if (unlockedHanjaIds && unlockedHanjaIds.length > 0) {
            return new Set(unlockedHanjaIds);
        }
        const ids = new Set();
        for (let i = 0; i < Math.min(totalDays, DAILY_CURRICULUM.length); i++) {
            for (const h of DAILY_CURRICULUM[i].hanja) {
                if (h.id !== null) ids.add(h.id);
            }
        }
        if (bonus > 0) {
            const sorted = [...HANJA_DATA].sort((a, b) => a.id - b.id);
            for (let i = 0; i < Math.min(bonus, sorted.length); i++) ids.add(sorted[i].id);
        }
        return ids;
    }, [totalDays, bonus, unlockedHanjaIds]);

    const unlockedGrades = useMemo(() => {
        const s = new Set(['전체']);
        for (const h of HANJA_DATA) { if (unlockedIds.has(h.id)) s.add(h.grade); }
        return s;
    }, [unlockedIds]);

    const categories = useMemo(() => {
        const cats = [...new Set(HANJA_DATA.map(h => h.category).filter(Boolean))];
        // Define visual properties for categories
        const metadata = {
            '자연': { icon: '🌱', color: '#10b981', image: '/assets/images/icons/topic_nature.png' },
            '사람': { icon: '👤', color: '#6366f1', image: '/assets/images/icons/topic_people.png' },
            '숫자': { icon: '🔢', color: '#f59e0b', image: '/assets/images/icons/topic_numbers.png' },
            '방향': { icon: '🧭', color: '#ec4899', image: '/assets/images/icons/topic_direction.png' },
            '크기': { icon: '📏', color: '#8b5cf6', image: '/assets/images/icons/topic_size.png' },
            '기타': { icon: '✨', color: '#94a3b8', image: '/assets/images/icons/topic_etc.png' },
        };
        return cats.map(name => ({
            name,
            ...(metadata[name] || metadata['기타']),
            total: HANJA_DATA.filter(h => h.category === name).length,
            unlocked: HANJA_DATA.filter(h => h.category === name && unlockedIds.has(h.id)).length
        }));
    }, [unlockedIds]);

    const currentItems = useMemo(() => {
        if (hanjaFilter && hanjaFilter.length > 0) return HANJA_DATA.filter(h => hanjaFilter.includes(h.id));
        if (viewMode === 'grade') {
            if (!selectedGrade) return [];
            if (selectedGrade === '전체') return HANJA_DATA;
            return HANJA_DATA.filter(h => h.grade === selectedGrade);
        }
        return HANJA_DATA.filter(h => h.category === (selectedTopic || selectedCategory));
    }, [viewMode, selectedGrade, selectedTopic, selectedCategory, hanjaFilter]);

    const isUnlocked = (item) => hanjaFilter ? true : unlockedIds.has(item.id);

    const handleCardClick = (item) => {
        if (onCardFlip) onCardFlip(item.id);
        setStudyItem(item);
    };

    const handleNext = () => {
        if (!hasFlipped && hanjaFilter) {
            setShouldBlink(true);
            setTimeout(() => setShouldBlink(false), 1400);
            return;
        }
        if (currentIndex < currentItems.length - 1) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
                setHasFlipped(false);
                setIsTransitioning(false);
            }, 300);
        } else if (onStageClear) {
            onStageClear();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex(prev => prev - 1);
                setHasFlipped(false);
                setIsTransitioning(false);
            }, 300);
        }
    };

    if (studyItem && !hanjaFilter) {
        return (
            <HanjaStudySheet
                item={studyItem}
                onBack={() => setStudyItem(null)}
                onWriteHanja={(h) => { setStudyItem(null); if (onWriteHanja) onWriteHanja(h); }}
                onMarkCorrect={onMarkCorrect}
                onMarkWrong={onMarkWrong}
            />
        );
    }

    const unlockedInView = currentItems.filter(isUnlocked).length;

    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden animate-fade-in" style={{ backgroundColor: '#F8FAFF' }}>
            {/* 헤더 */}
            <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                    <button onClick={onBack}
                        className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-black text-slate-600 gap-1">
                        <span>←</span><span className="ml-1">뒤로</span>
                    </button>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <h2 className="text-lg font-black text-slate-700 m-0">
                            {hanjaFilter ? '오늘의 한자' : '한자 학습지'}
                        </h2>
                        {hanjaFilter && (
                            <span className="text-indigo-500 opacity-60 text-base font-bold whitespace-nowrap">{currentIndex + 1}/{currentItems.length}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* 본문 컨텐츠 */}
            <div className="flex-1 flex flex-col overflow-hidden pt-2">

                {hanjaFilter && hanjaFilter.length > 0 ? (
                    /* ── 학습지 시퀀스 모드 (Daily Journey) ── */
                    <div className="flex-1 overflow-hidden">
                        <HanjaStudySheet
                            key={currentIndex}
                            item={currentItems[currentIndex]}
                            onBack={onBack}
                            onWriteHanja={onWriteHanja}
                            onMarkCorrect={onMarkCorrect}
                            onMarkWrong={onMarkWrong}
                            onHanjaAcquired={onHanjaAcquired}
                            isSequence={true}
                            onNext={handleNext}
                            isLast={currentIndex === currentItems.length - 1}
                        />
                    </div>
                ) : (
                    /* ── 기본 그리드 모드 (학습 센터) ── */
                    <div className="w-full max-w-xl mx-auto px-4 flex flex-col items-center gap-6 overflow-y-auto pb-20 pt-5">
                        <div className="flex bg-slate-100/40 p-1.5 rounded-full border border-slate-200 w-full mb-4 shadow-inner relative z-20">
                            {['grade', 'topic'].map(mode => (
                                <button key={mode} onClick={() => { setViewMode(mode); setSelectedTopic(null); setSelectedGrade(null); }}
                                    className={`flex-1 px-8 py-3 rounded-full font-extrabold transition-all text-xs ${viewMode === mode ? 'bg-white shadow-md' : 'text-slate-400'}`}
                                    style={viewMode === mode ? { color: '#166534' } : {}}>
                                    {mode === 'grade' ? '급수별' : '주제별'}
                                </button>
                            ))}
                        </div>

                        {viewMode === 'grade' && !selectedGrade ? (
                            /* ── 급수 선택 ── */
                            <div className="grid grid-cols-3 gap-3 w-full">
                                {['8급', '7급Ⅱ', '7급', '6급Ⅱ', '6급', '전체'].map(g => {
                                    const locked = !unlockedGrades.has(g);
                                    return (
                                        <button
                                            key={g}
                                            onClick={locked ? undefined : () => setSelectedGrade(g)}
                                            className={`py-7 rounded-[2rem] font-extrabold text-xl transition-all border shadow-sm relative flex flex-col items-center justify-center gap-1.5 ${locked ? 'cursor-not-allowed opacity-50' : 'active:scale-95'}`}
                                            style={{ color: locked ? '#CBD5E1' : '#1e293b', borderColor: locked ? '#F1F5F9' : '#BBF7D0', backgroundColor: locked ? '#F8FAFC' : 'white', boxShadow: locked ? 'none' : '0 8px 24px rgba(187,247,208,0.5)' }}
                                        >
                                            {locked ? (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 drop-shadow">
                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="rgba(148,163,184,0.5)" stroke="white"/>
                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                                    </svg>
                                                    <span className="text-base break-keep">{g}</span>
                                                </>
                                            ) : (
                                                <span className="break-keep">{g}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : viewMode === 'topic' && !selectedTopic ? (
                            /* ── 주제 선택 카드 ── */
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pb-20">
                                {categories.map(cat => {
                                    const catImgMap = { '숫자와 기초 개념': '1_一.webp', '자연과 시간': '31_日.webp', '나와 가족 신체': '71_父.webp', '공간과 위치': '111_東.webp', '학교와 일상생활': '151_學.webp', '행동과 상태': '201_來.webp', '사회와 문화': '251_國.webp' };
                                    const imgFile = catImgMap[cat.name];
                                    const src = imgFile ? `/assets/images/hanja_all/${imgFile}` : null;
                                    const isSel = selectedTopic === cat.name;
                                    const locked = cat.unlocked === 0;

                                    return (
                                        <button
                                            key={cat.name}
                                            onClick={locked ? undefined : () => setSelectedTopic(cat.name)}
                                            className={`bg-white shadow-lg rounded-2xl flex flex-row items-center overflow-hidden transition-all border-[4px] relative ${locked ? 'cursor-not-allowed opacity-50' : 'active:scale-95'}`}
                                            style={{ borderColor: isSel ? '#A8E6CF' : 'white' }}
                                        >
                                            <div className="w-28 h-28 shrink-0 flex items-center justify-center p-3 relative" style={{ backgroundColor: isSel ? '#A8E6CF20' : '#F8FAFC' }}>
                                                {locked ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 drop-shadow">
                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="rgba(148,163,184,0.5)" stroke="white"/>
                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                                    </svg>
                                                ) : src ? (
                                                    <img src={src} className="w-full h-full object-contain drop-shadow-sm" alt={cat.name} />
                                                ) : (
                                                    <span className="text-2xl font-extrabold" style={{ color: '#A8E6CF' }}>?</span>
                                                )}
                                            </div>
                                            <div className="px-3 flex flex-col items-start gap-1.5">
                                                <span className="font-extrabold text-base leading-tight break-keep" style={{ color: isSel ? '#166634' : '#334155' }}>{cat.name}</span>
                                                <span className="text-sm font-bold text-slate-400 break-keep">{locked ? `${cat.total}개` : `${cat.unlocked}/${cat.total}개`}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            /* ── Character Grid (Filtered by Grade or Topic) ── */
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 pb-20">
                                {viewMode === 'topic' && (
                                    <button
                                        onClick={() => setSelectedTopic(null)}
                                        className="minimal-card-studio bg-slate-50 border-dashed border-2 border-slate-200 flex items-center justify-center text-slate-400 font-extrabold gap-2 hover:bg-slate-100 transition-colors"
                                    >
                                        ← 주제 선택
                                    </button>
                                )}
                                {viewMode === 'grade' && (
                                    <button
                                        onClick={() => setSelectedGrade(null)}
                                        className="minimal-card-studio bg-slate-50 border-dashed border-2 border-slate-200 flex items-center justify-center text-slate-400 font-extrabold gap-2 hover:bg-slate-100 transition-colors"
                                    >
                                        ← 급수 선택
                                    </button>
                                )}
                                {currentItems.map(item => (
                                    <HanjaCard key={item.id} item={item} isLocked={!isUnlocked(item)} onClick={() => handleCardClick(item)} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlashcardScreen;