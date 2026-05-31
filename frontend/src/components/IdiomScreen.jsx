import { useState, useMemo } from 'react';
import IDIOMS from '../data/idioms.js';
import HANJA_DATA from '../hanja_unified.json';
import CtaButton from './common/CtaButton.jsx';

const collectIdioms = (hanjaIds) => {
    const idSet = new Set(hanjaIds);
    const seen = new Set();
    const result = [];
    for (const item of HANJA_DATA) {
        if (!idSet.has(item.id)) continue;
        for (const w of (item.words || [])) {
            if (w.type !== 'idiom' || seen.has(w.word)) continue;
            seen.add(w.word);
            const meta = IDIOMS.find(x => x.hanja === w.word);
            if (meta) result.push(meta);
        }
    }
    return result;
};

const GRADE_ORDER = ['전체', '8급', '7급', '7급Ⅱ', '6급', '6급Ⅱ'];
const IDIOM_WRONG_KEY = 'idiom_wrong_data';

const GRADE_STYLE = {
    '8급':  { bg: '#F0FFF7', border: '#A8E6CF', text: '#2D7A5A', tag: '#A8E6CF' },
    '7급':  { bg: '#FFFDF0', border: '#FFD6A5', text: '#8A5E00', tag: '#FFD6A5' },
    '7급Ⅱ': { bg: '#FFF5F5', border: '#FFADAD', text: '#9B2C2C', tag: '#FFADAD' },
    '6급':  { bg: '#F0FDFF', border: '#A5F3FC', text: '#0E7490', tag: '#A5F3FC' },
    '6급Ⅱ': { bg: '#F5F0FF', border: '#BDB2FF', text: '#553C9A', tag: '#BDB2FF' },
};

const idiomKey = (item) => item.id || item.hanja;

const readIdiomWrongData = () => {
    try { return JSON.parse(localStorage.getItem(IDIOM_WRONG_KEY) || '{}'); } catch { return {}; }
};

const writeIdiomWrong = (item) => {
    const key = idiomKey(item);
    const data = readIdiomWrongData();
    const prev = data[key] || {};
    data[key] = {
        wrongCount: (prev.wrongCount || 0) + 1,
        lastWrongAt: new Date().toISOString(),
    };
    localStorage.setItem(IDIOM_WRONG_KEY, JSON.stringify(data));
};

const clearIdiomWrong = (item) => {
    const key = idiomKey(item);
    const data = readIdiomWrongData();
    if (!data[key]) return;
    delete data[key];
    localStorage.setItem(IDIOM_WRONG_KEY, JSON.stringify(data));
};

const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const IdiomCard = ({ item }) => {
    const [open, setOpen] = useState(false);
    const s = GRADE_STYLE[item.grade] || GRADE_STYLE['8급'];

    return (
        <button
            onClick={() => setOpen(p => !p)}
            className="w-full text-left flex flex-col gap-3 px-5 py-4 transition-all active:scale-[0.98]"
            style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: '1.5rem' }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                    <span
                        className="font-black tracking-wider leading-tight"
                        style={{ fontSize: '1.55rem', color: '#1A2B2A', fontFamily: "'Nanum Myeongjo', serif" }}
                    >
                        {item.hanja}
                    </span>
                    <span className="font-bold text-sm" style={{ color: s.text }}>
                        {item.reading}
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black" style={{ background: s.tag, color: s.text }}>
                        {item.grade}
                    </span>
                    <span className="text-xs font-bold" style={{ color: s.text }}>
                        {open ? '접기' : '보기'}
                    </span>
                </div>
            </div>
            {open && (
                <p className="text-sm font-bold leading-relaxed break-keep border-t pt-3" style={{ color: '#5B677A', borderColor: s.border }}>
                    {item.meaning}
                </p>
            )}
            {!open && (
                <p className="text-xs font-bold" style={{ color: s.text }}>탭하여 뜻 보기</p>
            )}
        </button>
    );
};

const ALL_CHARS = () => [...new Set(IDIOMS.flatMap(i => [...i.hanja]))];

const buildQuiz = (idioms) => {
    if (idioms.length === 0) return [];
    const allChars = ALL_CHARS();
    const questions = [];

    shuffle([...idioms]).forEach((item, i) => {
        const others = IDIOMS.filter(x => x.hanja !== item.hanja);
        const type = i % 3;

        if (type === 0) {
            // 괄호 채우기
            const blankIdx = Math.floor(Math.random() * 4);
            const correct = item.hanja[blankIdx];
            const displayHanja = [...item.hanja].map((ch, j) => j === blankIdx ? '(  )' : ch).join('');
            const displayReading = [...item.reading].map((ch, j) => j === blankIdx ? '○' : ch).join('');
            const distractors = shuffle(allChars.filter(c => c !== correct)).slice(0, 3);
            questions.push({
                ...item,
                type: 'fill_blank',
                typeLabel: '괄호 채우기',
                prompt: '다음 괄호 안에 들어갈 알맞은 한자는?',
                displayHanja,
                displayReading,
                choices: shuffle([correct, ...distractors]),
                answer: correct,
            });
        } else if (type === 1) {
            // 독음 읽기
            const distractors = shuffle(others).slice(0, 3).map(x => x.reading);
            questions.push({
                ...item,
                type: 'reading',
                typeLabel: '독음 읽기',
                prompt: '다음 사자성어의 독음(讀音)은?',
                choices: shuffle([item.reading, ...distractors]),
                answer: item.reading,
            });
        } else {
            if (i % 6 < 3) {
                // 뜻 찾기
                const distractors = shuffle(others).slice(0, 3).map(x => x.meaning);
                questions.push({
                    ...item,
                    type: 'meaning_from_idiom',
                    typeLabel: '뜻 찾기',
                    prompt: '다음 사자성어의 뜻은?',
                    choices: shuffle([item.meaning, ...distractors]),
                    answer: item.meaning,
                });
            } else {
                // 사자성어 찾기
                const distractors = shuffle(others).slice(0, 3).map(x => x.hanja);
                questions.push({
                    ...item,
                    type: 'idiom_from_meaning',
                    typeLabel: '사자성어 찾기',
                    prompt: '다음 뜻에 해당하는 사자성어는?',
                    displayMeaning: item.meaning,
                    choices: shuffle([item.hanja, ...distractors]),
                    answer: item.hanja,
                });
            }
        }
    });

    return questions;
};

const IdiomQuiz = ({ idioms, onBack, onComplete }) => {
    const questions = useMemo(() => buildQuiz(idioms), [idioms]);
    const [idx, setIdx] = useState(0);
    const [wrongChoices, setWrongChoices] = useState([]);
    const [isCorrectSelected, setIsCorrectSelected] = useState(false);
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);

    const q = questions[idx];

    const handleSelect = (choice) => {
        if (isCorrectSelected || wrongChoices.includes(choice)) return;
        if (choice === q.answer) {
            setIsCorrectSelected(true);
            if (wrongChoices.length === 0) {
                setScore(s => s + 1);
                clearIdiomWrong(q);
            }
            return;
        }
        if (wrongChoices.length === 0) writeIdiomWrong(q);
        setWrongChoices(prev => [...prev, choice]);
    };

    const handleNext = () => {
        if (idx + 1 >= questions.length) {
            onComplete?.();
            setDone(true);
            return;
        }
        setIdx(i => i + 1);
        setWrongChoices([]);
        setIsCorrectSelected(false);
    };

    if (done) {
        const pct = Math.round((score / questions.length) * 100);
        return (
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
                <div className="idiom-result-mark">{score}</div>
                <div className="text-center flex flex-col gap-1">
                    <p className="font-black text-[2rem] text-[#3C3C3C]">{score} / {questions.length}</p>
                    <p className="font-bold text-[#9AA4B5]">
                        {pct === 100 ? '완벽해요! 사자성어 마스터!' :
                         pct >= 70 ? '훌륭해요! 조금만 더 연습해요!' : '다시 한번 도전해 보세요!'}
                    </p>
                </div>
                <div className="w-full max-w-xs flex flex-col gap-3">
                    <CtaButton theme="coral" onClick={() => { setIdx(0); setWrongChoices([]); setIsCorrectSelected(false); setScore(0); setDone(false); }}>
                        <span className="font-black text-white text-lg drop-shadow-md">다시 풀기</span>
                    </CtaButton>
                    <button
                        onClick={onBack}
                        className="w-full py-3.5 rounded-2xl font-extrabold text-[#9AA4B5] bg-white border border-[#E9EDF2] active:scale-95 transition-all"
                    >
                        목록으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="idiom-quiz-shell">
            <div className="idiom-quiz-meta">
                <span>사자성어 퀴즈</span>
                <span>{idx + 1} / {questions.length}</span>
                <span>{score}점</span>
            </div>

            <div className="idiom-quiz-question-card">
                <span className="idiom-quiz-type-label">{q.typeLabel}</span>
                <p className="idiom-quiz-prompt">{q.prompt}</p>

                {/* 괄호 채우기: 빈칸 포함 한자 + 독음 */}
                {q.type === 'fill_blank' && (
                    <div className="flex flex-col items-center gap-1">
                        <span className="font-black tracking-widest text-[#1A2B2A]"
                            style={{ fontSize: 'clamp(1.8rem, 7vw, 2.6rem)', fontFamily: 'serif' }}>
                            {q.displayHanja}
                        </span>
                        <span className="font-bold text-sm" style={{ color: '#7C83FF' }}>{q.displayReading}</span>
                    </div>
                )}

                {/* 독음 읽기: 전체 한자 박스 */}
                {q.type === 'reading' && (
                    <div className="idiom-quiz-hanja-box">
                        <span>{q.hanja}</span>
                        <small>{q.reading}</small>
                    </div>
                )}

                {/* 뜻 찾기: 한자 + 독음 */}
                {q.type === 'meaning_from_idiom' && (
                    <div className="idiom-quiz-hanja-box">
                        <span>{q.hanja}</span>
                        <small>{q.reading}</small>
                    </div>
                )}

                {/* 사자성어 찾기: 뜻 텍스트 */}
                {q.type === 'idiom_from_meaning' && (
                    <p className="text-center font-bold text-[#4B5563] text-base leading-relaxed break-keep px-2">
                        {q.displayMeaning}
                    </p>
                )}
            </div>

            <div className="idiom-quiz-choice-grid"
                style={q.type === 'meaning_from_idiom' ? { gridTemplateColumns: '1fr' } : undefined}>
                {q.choices.map((choice, i) => {
                    const isWrong = wrongChoices.includes(choice);
                    const isCorrect = isCorrectSelected && choice === q.answer;
                    const isDimmed = isCorrectSelected && !isCorrect;
                    const isLarge = q.type === 'fill_blank' || q.type === 'idiom_from_meaning';

                    return (
                        <button
                            key={i}
                            onClick={() => handleSelect(choice)}
                            disabled={isCorrectSelected}
                            className={`quiz-choice-btn idiom-quiz-choice ${isLarge ? 'quiz-choice-btn--large' : ''} ${isCorrect ? 'quiz-choice-btn--correct' : isWrong ? 'quiz-choice-btn--wrong' : isDimmed ? 'quiz-choice-btn--dimmed' : ''}`}
                        >
                            <span>{choice}</span>
                            {isCorrect && <span className="idiom-quiz-choice-mark">✓</span>}
                            {isWrong && <span className="idiom-quiz-choice-mark">×</span>}
                        </button>
                    );
                })}
            </div>

            {isCorrectSelected && (
                <div className="idiom-quiz-next-row">
                    <button onClick={handleNext} className="idiom-quiz-next-button">
                        {idx + 1 >= questions.length ? '결과 보기' : '다음 문제'}
                    </button>
                </div>
            )}
        </div>
    );
};

const IdiomScreen = ({ onBack, onComplete, startInQuiz, contentPool }) => {
    const [grade, setGrade] = useState('전체');
    const [mode, setMode] = useState(startInQuiz ? 'quiz' : 'browse');

    const available = useMemo(() => {
        if (!contentPool) return IDIOMS;
        const hanjaIds = [
            ...(contentPool.main?.hanjaIds || []),
            ...(contentPool.review?.hanjaIds || []),
        ];
        const pool = collectIdioms(hanjaIds);
        return pool.length > 0 ? pool : IDIOMS;
    }, [contentPool]);

    const filtered = useMemo(
        () => grade === '전체' ? available : available.filter(x => x.grade === grade),
        [available, grade]
    );

    const counts = useMemo(() => {
        const m = {};
        GRADE_ORDER.slice(1).forEach(g => { m[g] = available.filter(x => x.grade === g).length; });
        return m;
    }, [available]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ backgroundColor: '#F8FAF9' }}>
            <div className="w-full px-4 shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '4px' }}>
                <div className="minimal-card-studio w-full flex justify-between items-center p-4 px-6 bg-white border-[#E9EDF2] shadow-xl !rounded-[3rem] min-h-[72px]">
                    <button onClick={mode === 'quiz' ? () => setMode('browse') : onBack} className="hp-nav-button">
                        ×
                    </button>
                    <div className="flex flex-col items-center min-w-0 flex-1 px-2">
                        <h2 className="text-h3 font-bold text-[#5B677A] m-0 break-keep">사자성어</h2>
                        <p className="text-xs font-bold mt-0.5 text-center leading-tight break-keep" style={{ color: '#969CEB' }}>
                            {mode === 'quiz' ? '사자성어를 보고 뜻을 맞혀보세요' : '급수별 4자 성어 학습'}
                        </p>
                    </div>
                    <div className="w-11" />
                </div>
            </div>

            {mode === 'quiz' ? (
                <IdiomQuiz idioms={filtered} onBack={() => setMode('browse')} onComplete={onComplete} />
            ) : (
                <>
                    <div className="shrink-0 px-4 pt-4 pb-2">
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {GRADE_ORDER.map(g => {
                                const active = grade === g;
                                return (
                                    <button
                                        key={g}
                                        onClick={() => setGrade(g)}
                                        className="shrink-0 px-4 py-2 rounded-full text-sm font-black transition-all active:scale-95"
                                        style={{
                                            background: active ? '#7C83FF' : '#fff',
                                            color: active ? '#fff' : '#9AA4B5',
                                            border: `1.5px solid ${active ? '#7C83FF' : '#E9EDF2'}`,
                                        }}
                                    >
                                        {g}{g !== '전체' && counts[g] ? ` ${counts[g]}` : ''}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs font-bold text-[#9AA4B5] mt-2 px-1">
                            {filtered.length}개의 사자성어 · 탭하면 뜻이 펼쳐져요
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-32 px-4 pt-1 flex flex-col gap-3 max-w-2xl w-full mx-auto">
                        {filtered.map((item, i) => (
                            <IdiomCard key={`${item.hanja}-${i}`} item={item} />
                        ))}
                    </div>

                    <div
                        className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4"
                        style={{ background: 'linear-gradient(to top, #F8FAF9 65%, transparent)' }}
                    >
                        <div className="max-w-2xl mx-auto">
                            <CtaButton theme="indigo" onClick={() => setMode('quiz')}>
                                <span className="font-black text-white text-lg drop-shadow-md">
                                    {filtered.length}개 퀴즈 풀기
                                </span>
                            </CtaButton>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default IdiomScreen;
