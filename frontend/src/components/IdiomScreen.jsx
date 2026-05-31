import { useState, useMemo, useRef } from 'react';
import IDIOMS from '../data/idioms.js';
import HANJA_DATA from '../hanja_unified.json';
import CtaButton from './common/CtaButton.jsx';

const GRADE_STYLE = {
    '8급':  { bg: '#F0FFF7', border: '#A8E6CF', text: '#2D7A5A', tag: '#A8E6CF' },
    '7급':  { bg: '#FFFDF0', border: '#FFD6A5', text: '#8A5E00', tag: '#FFD6A5' },
    '7급Ⅱ': { bg: '#FFF5F5', border: '#FFADAD', text: '#9B2C2C', tag: '#FFADAD' },
    '6급':  { bg: '#F0FDFF', border: '#A5F3FC', text: '#0E7490', tag: '#A5F3FC' },
    '6급Ⅱ': { bg: '#F5F0FF', border: '#BDB2FF', text: '#553C9A', tag: '#BDB2FF' },
};


const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// contentPool의 hanjaIds 기반으로 관련 사자성어 수집 (다른 퀴즈와 동일한 방식)
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

// ── 목록 카드 ──────────────────────────────────────────────────────────────
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
                    <span className="font-black tracking-wider leading-tight"
                        style={{ fontSize: '1.55rem', color: '#1A2B2A', fontFamily: "'Nanum Myeongjo', serif" }}>
                        {item.hanja}
                    </span>
                    <span className="font-bold text-sm" style={{ color: s.text }}>{item.reading}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black" style={{ background: s.tag, color: s.text }}>
                        {item.grade}
                    </span>
                    <span className="text-xs font-bold" style={{ color: s.text }}>{open ? '▲' : '▼'}</span>
                </div>
            </div>
            {open ? (
                <p className="text-sm font-bold leading-relaxed break-keep border-t pt-3" style={{ color: '#5B677A', borderColor: s.border }}>
                    {item.meaning}
                </p>
            ) : (
                <p className="text-xs font-bold" style={{ color: s.text }}>탭하여 뜻 보기</p>
            )}
        </button>
    );
};

// ── 퀴즈 빌더 — 3가지 기출 유형 ──────────────────────────────────────────
const ALL_CHARS = () => [...new Set(IDIOMS.flatMap(i => [...i.hanja]))];

const buildQuiz = (idioms) => {
    if (idioms.length === 0) return [];
    const allChars = ALL_CHARS();
    // 오답 후보는 전체 IDIOMS 풀 사용 (필터된 목록이 적어도 항상 충분한 오답 확보)
    const globalPool = IDIOMS;
    const questions = [];

    shuffle([...idioms]).forEach((item, i) => {
        const others = globalPool.filter(x => x.hanja !== item.hanja);
        const type = i % 3; // 0=괄호채우기, 1=독음, 2=뜻풀이

        if (type === 0) {
            // ── 유형1: 괄호 채우기 ─────────────────────────────
            const blankIdx = Math.floor(Math.random() * 4);
            const correct = item.hanja[blankIdx];
            const hanjaChars = [...item.hanja];
            const displayHanja = hanjaChars.map((ch, j) => j === blankIdx ? '(  )' : ch).join('');
            const readingChars = Array.from(item.reading);
            const displayReading = readingChars.map((ch, j) => j === blankIdx ? '○' : ch).join('');
            const distractors = shuffle(allChars.filter(c => c !== correct)).slice(0, 3);
            questions.push({
                type: 'fill_blank',
                typeLabel: '괄호 채우기',
                prompt: '다음 괄호 안에 들어갈 알맞은 한자는?',
                displayHanja,
                displayReading,
                choices: shuffle([correct, ...distractors]),
                answer: correct,
                hint: `정답: ${item.hanja} (${item.reading})`,
            });
        } else if (type === 1) {
            // ── 유형2: 독음 읽기 ────────────────────────────────
            const distractors = shuffle(others).slice(0, 3).map(x => x.reading);
            questions.push({
                type: 'reading',
                typeLabel: '독음 읽기',
                prompt: '다음 사자성어의 독음(讀音)은?',
                displayHanja: item.hanja,
                choices: shuffle([item.reading, ...distractors]),
                answer: item.reading,
                hint: `정답: ${item.reading}`,
            });
        } else {
            // ── 유형3: 뜻풀이 (A·B 교대) ─────────────────────────
            if (i % 6 < 3) {
                // 3A: 사자성어 → 뜻 고르기
                const distractors = shuffle(others).slice(0, 3).map(x => x.meaning);
                questions.push({
                    type: 'meaning_from_idiom',
                    typeLabel: '뜻 찾기',
                    prompt: '다음 사자성어의 뜻은?',
                    displayHanja: item.hanja,
                    displayReading: item.reading,
                    choices: shuffle([item.meaning, ...distractors]),
                    answer: item.meaning,
                    hint: `정답: ${item.meaning}`,
                });
            } else {
                // 3B: 뜻 → 사자성어 고르기
                const distractors = shuffle(others).slice(0, 3).map(x => x.hanja);
                questions.push({
                    type: 'idiom_from_meaning',
                    typeLabel: '사자성어 찾기',
                    prompt: '다음 뜻에 해당하는 사자성어는?',
                    displayMeaning: item.meaning,
                    choices: shuffle([item.hanja, ...distractors]),
                    answer: item.hanja,
                    hint: `정답: ${item.hanja} (${item.reading})`,
                });
            }
        }
    });

    return questions;
};

// ── 유형 배지 색상 ──────────────────────────────────────────────────────
const TYPE_BADGE = {
    fill_blank:         { bg: '#FFF0EB', text: '#FF8D72', label: '괄호 채우기' },
    reading:            { bg: '#F0EEFF', text: '#7C83FF', label: '독음 읽기' },
    meaning_from_idiom: { bg: '#F0FFF7', text: '#2D7A5A', label: '뜻 찾기' },
    idiom_from_meaning: { bg: '#FFF8EE', text: '#C07000', label: '사자성어 찾기' },
};

const IdiomQuiz = ({ idioms, onBack, onComplete }) => {
    const questions = useMemo(() => buildQuiz(idioms), [idioms]);
    const [idx, setIdx] = useState(0);
    const [selected, setSelected] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);
    const completedRef = useRef(false);
    const timerRef = useRef(null);

    const q = questions[idx];
    const progress = questions.length > 0 ? (idx / questions.length) * 100 : 0;
    const badge = q ? TYPE_BADGE[q.type] : null;

    const handleNext = () => {
        if (idx + 1 >= questions.length) {
            if (!completedRef.current) { completedRef.current = true; onComplete?.(); }
            setDone(true);
        } else {
            setIdx(i => i + 1);
            setSelected(null);
            setRevealed(false);
        }
    };

    const handleSelect = (choice) => {
        if (selected !== null) return;
        clearTimeout(timerRef.current);
        const isCorrect = choice === q.answer;
        setSelected(choice);
        if (isCorrect) {
            setScore(s => s + 1);
            setRevealed(true);
            timerRef.current = setTimeout(handleNext, 1200);
        } else {
            timerRef.current = setTimeout(handleNext, 900);
        }
    };

    if (done) {
        const pct = Math.round((score / questions.length) * 100);
        return (
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
                <div className="text-6xl">{pct === 100 ? '🏆' : pct >= 70 ? '🎉' : '📖'}</div>
                <div className="text-center flex flex-col gap-1">
                    <p className="font-black text-[2rem] text-[#3C3C3C]">{score} / {questions.length}</p>
                    <p className="font-bold text-[#9AA4B5]">
                        {pct === 100 ? '완벽해요! 사자성어 마스터!' :
                         pct >= 70 ? '훌륭해요! 조금만 더 연습해요!' : '다시 한번 도전해 보세요!'}
                    </p>
                </div>
                <div className="w-full max-w-xs flex flex-col gap-3">
                    <CtaButton theme="coral" onClick={() => {
                        setIdx(0); setSelected(null); setRevealed(false);
                        setScore(0); setDone(false); completedRef.current = false;
                    }}>
                        <span className="font-black text-white text-lg drop-shadow-md">다시 풀기</span>
                    </CtaButton>
                    <button onClick={onBack}
                        className="w-full py-3.5 rounded-2xl font-extrabold text-[#9AA4B5] bg-white border border-[#E9EDF2] active:scale-95 transition-all">
                        목록으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    if (questions.length === 0 || !q) return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <span className="text-5xl">📖</span>
            <p className="font-bold text-[#9AA4B5] text-center break-keep">
                이 단계에는 관련 사자성어가 없어요.
            </p>
            <button onClick={onBack}
                className="px-6 py-3 rounded-2xl bg-white border border-[#E9EDF2] font-bold text-[#5B677A] active:scale-95 transition-all">
                돌아가기
            </button>
        </div>
    );

    // 보기 레이아웃 결정
    const isLargeChoice = q.type === 'fill_blank' || q.type === 'idiom_from_meaning';
    const gridCols = isLargeChoice ? 'grid-cols-2' : 'grid-cols-1';

    return (
        <>
            {/* 진행바 헤더 */}
            <div className="w-full shrink-0 px-4 mb-3">
                <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-5 shadow-md border border-white">
                    <button onClick={onBack} className="hp-nav-button shrink-0">←</button>
                    <div className="flex-1">
                        <div className="flex justify-between text-xs font-extrabold text-[#AEB7C5] mb-1">
                            <span>사자성어 퀴즈</span>
                            <span>{idx + 1} / {questions.length}</span>
                        </div>
                        <div className="w-full h-[11px] rounded-full overflow-hidden" style={{ backgroundColor: '#E9EDF5' }}>
                            <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${progress}%`, backgroundColor: '#7C83FF' }} />
                        </div>
                    </div>
                    <span className="text-sm font-extrabold shrink-0" style={{ color: '#7C83FF' }}>{score}점</span>
                </div>
            </div>

            {/* 문제 영역 */}
            <div className="flex-1 flex flex-col items-center px-5 pb-8 overflow-y-auto">
                <div className="w-full max-w-md flex flex-col items-center gap-4 pt-2">

                    {/* 유형 배지 */}
                    <div className="flex items-center gap-2 self-start">
                        <span className="px-3 py-1 rounded-full text-xs font-black"
                            style={{ background: badge.bg, color: badge.text }}>
                            {badge.label}
                        </span>
                    </div>

                    {/* 문제 카드 */}
                    <div className="grade-test-question-card">
                        <p className="grade-test-prompt">{q.prompt}</p>

                        {/* 유형1: 괄호 채우기 */}
                        {q.type === 'fill_blank' && (
                            <div className="flex flex-col items-center gap-1">
                                <span className="font-black tracking-widest"
                                    style={{ fontSize: 'clamp(1.8rem, 7vw, 2.6rem)', fontFamily: 'serif', color: '#1A2B2A' }}>
                                    {q.displayHanja}
                                </span>
                                <span className="font-bold text-sm" style={{ color: '#7C83FF' }}>{q.displayReading}</span>
                            </div>
                        )}

                        {/* 유형2: 독음 읽기 */}
                        {q.type === 'reading' && (
                            <div className="grade-test-hanja-box grade-test-hanja-box--compound" style={{ width: 'auto', padding: '0 1.5rem' }}>
                                <span className="grade-test-hanja-char" style={{ fontSize: 'clamp(1.8rem, 7vw, 2.4rem)' }}>
                                    {q.displayHanja}
                                </span>
                            </div>
                        )}

                        {/* 유형3A: 사자성어→뜻 */}
                        {q.type === 'meaning_from_idiom' && (
                            <div className="flex flex-col items-center gap-1">
                                <span className="font-black tracking-widest"
                                    style={{ fontSize: 'clamp(1.8rem, 7vw, 2.6rem)', fontFamily: 'serif', color: '#1A2B2A' }}>
                                    {q.displayHanja}
                                </span>
                                <span className="font-bold text-sm" style={{ color: '#7C83FF' }}>{q.displayReading}</span>
                            </div>
                        )}

                        {/* 유형3B: 뜻→사자성어 */}
                        {q.type === 'idiom_from_meaning' && (
                            <p className="grade-test-example" style={{ textAlign: 'left' }}>{q.displayMeaning}</p>
                        )}
                    </div>

                    {/* 보기 */}
                    <div className={`w-full grid ${gridCols} gap-3`}>
                        {q.choices.map((c, i) => {
                            const isSelected = selected === c;
                            const isAnswer = c === q.answer;
                            const revealed_ = selected !== null;
                            let stateClass = '';
                            if (revealed_) {
                                stateClass = isAnswer ? 'quiz-choice-btn--correct'
                                    : isSelected ? 'quiz-choice-btn--wrong'
                                    : 'quiz-choice-btn--dimmed';
                            }
                            const isHanjaChoice = q.type === 'fill_blank' || q.type === 'idiom_from_meaning';
                            return (
                                <button key={i} onClick={() => handleSelect(c)}
                                    className={`quiz-choice-btn quiz-choice-btn--center
                                        ${isHanjaChoice ? 'quiz-choice-btn--large' : ''}
                                        ${stateClass}`}>
                                    <span className="break-keep">{c}</span>
                                    {revealed_ && isAnswer && <span className="shrink-0 ml-1">✓</span>}
                                    {revealed_ && isSelected && !isAnswer && <span className="shrink-0 ml-1">✕</span>}
                                </button>
                            );
                        })}
                    </div>

                    {/* 오답 후 정답 힌트 */}
                    {selected !== null && selected !== q.answer && (
                        <div className="w-full rounded-2xl px-5 py-3 text-center font-bold text-sm break-keep"
                            style={{ backgroundColor: '#FFF1F1', color: '#CC3333', border: '1px solid #FF7A7A' }}>
                            ✗ {q.hint}
                        </div>
                    )}
                    {revealed && (
                        <div className="w-full rounded-2xl px-5 py-3 text-center font-extrabold text-sm"
                            style={{ backgroundColor: '#EAFBF0', color: '#2A7A50', border: '1px solid #4CCB7F' }}>
                            ✓ 정답!
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

// ── 메인 화면 ──────────────────────────────────────────────────────────────
const IdiomScreen = ({ onBack, onComplete, contentPool, startInQuiz = false }) => {
    const [mode, setMode] = useState(startInQuiz ? 'quiz' : 'browse');

    // contentPool의 hanjaIds 기반 필터링 (다른 퀴즈와 동일)
    const available = useMemo(() => {
        const hanjaIds = [
            ...(contentPool?.main?.hanjaIds || []),
            ...(contentPool?.review?.hanjaIds || []),
        ];
        return collectIdioms(hanjaIds);
    }, [contentPool]);

    // 급수 탭은 available 안에서만
    const availableGrades = useMemo(() => {
        const s = new Set(available.map(x => x.grade));
        return ['전체', '8급', '7급', '7급Ⅱ', '6급', '6급Ⅱ'].filter(g => g === '전체' || s.has(g));
    }, [available]);

    const [grade, setGrade] = useState('전체');

    const filtered = useMemo(
        () => grade === '전체' ? available : available.filter(x => x.grade === grade),
        [available, grade]
    );

    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden bg-[#F7FAF9]">
            {/* 헤더 */}
            <div className="w-full shrink-0 safe-top pt-4 px-4 mb-3">
                <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                    <button onClick={mode === 'quiz' ? () => setMode('browse') : onBack} className="hp-nav-button">
                        {mode === 'quiz' ? '✕' : '←'}
                    </button>
                    <div className="flex flex-col items-center min-w-0 flex-1 px-2">
                        <h2 className="text-h3 font-bold text-[#5B677A] m-0 break-keep">사자성어</h2>
                        <p className="text-xs font-bold mt-0.5 text-center leading-tight break-keep" style={{ color: '#969CEB' }}>
                            {mode === 'quiz' ? '사자성어를 보고 뜻을 맞혀보세요' : `${available.length}개 학습 가능`}
                        </p>
                    </div>
                    <div className="w-11" />
                </div>
            </div>

            {mode === 'quiz' ? (
                filtered.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
                        <span className="text-5xl">📖</span>
                        <p className="font-bold text-[#9AA4B5] text-center break-keep">
                            이 단계에는 관련 사자성어가 없어요.
                        </p>
                        <button onClick={() => setMode('browse')}
                            className="px-6 py-3 rounded-2xl bg-white border border-[#E9EDF2] font-bold text-[#5B677A] active:scale-95 transition-all">
                            돌아가기
                        </button>
                    </div>
                ) : (
                    <IdiomQuiz idioms={filtered} onBack={() => setMode('browse')} onComplete={onComplete} />
                )
            ) : (
                <>
                    {/* 급수 탭 */}
                    <div className="shrink-0 px-4 pb-2">
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {availableGrades.map(g => {
                                const cnt = g === '전체' ? available.length : available.filter(x => x.grade === g).length;
                                const active = grade === g;
                                return (
                                    <button key={g} onClick={() => setGrade(g)}
                                        className="shrink-0 px-4 py-2 rounded-full text-sm font-black transition-all active:scale-95"
                                        style={{
                                            background: active ? '#7C83FF' : '#fff',
                                            color: active ? '#fff' : '#9AA4B5',
                                            border: `1.5px solid ${active ? '#7C83FF' : '#E9EDF2'}`,
                                        }}>
                                        {g}{g !== '전체' ? ` ${cnt}` : ''}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs font-bold text-[#9AA4B5] mt-2 px-1">
                            {filtered.length}개 · 탭하면 뜻이 펼쳐져요
                        </p>
                    </div>

                    {/* 목록 */}
                    <div className="flex-1 overflow-y-auto pb-32 px-4 pt-1 flex flex-col gap-3 max-w-2xl w-full mx-auto">
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <span className="text-5xl">📖</span>
                                <p className="font-bold text-[#9AA4B5] text-center break-keep">
                                    이 단계에는 관련 사자성어가 없어요.<br/>다음 단계를 학습하면 나타납니다!
                                </p>
                            </div>
                        ) : (
                            filtered.map((item, i) => (
                                <IdiomCard key={`${item.hanja}-${i}`} item={item} />
                            ))
                        )}
                    </div>

                    {/* 퀴즈 CTA */}
                    {filtered.length > 0 && (
                        <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4"
                            style={{ background: 'linear-gradient(to top, #F7FAF9 65%, transparent)' }}>
                            <div className="max-w-2xl mx-auto">
                                <CtaButton theme="indigo" onClick={() => setMode('quiz')}>
                                    <span className="font-black text-white text-lg drop-shadow-md">
                                        ✏️ {filtered.length}개 퀴즈 풀기
                                    </span>
                                </CtaButton>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default IdiomScreen;
