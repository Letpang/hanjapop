import { useState } from 'react';
import { SK } from '../constants/storageKeys.js';

const GARAE = '/assets/images/characters/garae/rank_5.webp';

const QUESTION_BANK = {
    1: [
        { hanja: '一', meaning: '하나',   options: ['하나', '둘', '셋', '넷'],          hint: '가로 한 획이에요' },
        { hanja: '二', meaning: '둘',     options: ['하나', '둘', '셋', '다섯'],        hint: '가로 두 획이에요' },
        { hanja: '三', meaning: '셋',     options: ['하나', '둘', '셋', '여섯'],        hint: '가로 세 획이에요' },
        { hanja: '大', meaning: '크다',   options: ['크다', '작다', '높다', '깊다'],    hint: '팔 벌린 사람 모양이에요' },
    ],
    2: [
        { hanja: '木', meaning: '나무',   options: ['나무', '풀', '꽃', '돌'],          hint: '뿌리와 가지가 보여요' },
        { hanja: '月', meaning: '달',     options: ['해', '달', '별', '구름'],          hint: '밤하늘에 있어요' },
        { hanja: '日', meaning: '해',     options: ['해', '달', '별', '하늘'],          hint: '동그란 태양 모양이에요' },
        { hanja: '人', meaning: '사람',   options: ['사람', '동물', '식물', '돌'],      hint: '두 발로 서있는 모양이에요' },
    ],
    3: [
        { hanja: '學', meaning: '배울',   options: ['가르칠', '배울', '읽을', '쓸'],    hint: '학교(學校)의 첫 글자예요' },
        { hanja: '校', meaning: '학교',   options: ['학교', '집', '병원', '가게'],      hint: '배우는 곳이에요' },
        { hanja: '生', meaning: '날',     options: ['날', '죽을', '클', '작을'],        hint: '생일(生日)에 들어가요' },
        { hanja: '先', meaning: '먼저',   options: ['먼저', '나중', '함께', '따로'],    hint: '선생님(先生)의 첫 글자예요' },
    ],
    4: [
        { hanja: '友', meaning: '벗',     options: ['벗', '적', '가족', '선생'],        hint: '친우(親友)에 들어가요' },
        { hanja: '父', meaning: '아버지', options: ['아버지', '어머니', '형', '동생'],  hint: '아버지를 나타내요' },
        { hanja: '母', meaning: '어머니', options: ['어머니', '아버지', '누나', '할머니'], hint: '어머니를 나타내요' },
        { hanja: '家', meaning: '집',     options: ['집', '학교', '나라', '사람'],      hint: '가족(家族)의 첫 글자예요' },
    ],
    5: [
        { hanja: '間', meaning: '사이',   options: ['사이', '위', '아래', '옆'],        hint: '시간(時間)에 들어가요' },
        { hanja: '道', meaning: '길',     options: ['길', '집', '산', '강'],            hint: '도로(道路)의 첫 글자예요' },
        { hanja: '力', meaning: '힘',     options: ['힘', '몸', '마음', '눈'],          hint: '노력(努力)에 들어가요' },
        { hanja: '心', meaning: '마음',   options: ['마음', '몸', '힘', '눈'],          hint: '심장 모양에서 왔어요' },
    ],
};

const INTRO_SLIDES = [
    '안녕! 나는 가래뭉치야!\n한자팝에 온 걸 환영해!',
    '여기선 한자를 게임처럼 배울 수 있어.\n퀴즈, 메모리 게임, 슈팅까지 있거든!',
    '먼저 네 한자 실력을 살짝 확인해볼게.\n딱 5문제야, 걱정 마!',
];

const QUIZ_XP   = { 1: 30, 2: 50, 3: 80, 4: 130, 5: 200 };
const GRADE_MAP = { 1: '8급', 2: '8급', 3: '7급', 4: '7급', 5: '6급' };
const MSG_MAP   = {
    1: '걱정 마! 나랑 같이 하면 금방 늘 거야!',
    2: '좋아! 같이 차근차근 해보자!',
    3: '오~ 꽤 알고 있는데?',
    4: '와, 꽤 잘 아는걸? 멋진데!',
    5: '진짜 한자 고수네! 대박이다!',
};

const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const pickQuestion = (level, usedKeys) => {
    const lvl = Math.min(5, Math.max(1, level));
    for (const l of [lvl, lvl - 1, lvl + 1, 1, 2, 3, 4, 5]) {
        if (l < 1 || l > 5) continue;
        const bank = QUESTION_BANK[l];
        const avail = bank.map((q, i) => ({ q, key: `${l}_${i}` })).filter(({ key }) => !usedKeys.has(key));
        if (avail.length > 0) {
            const { q, key } = avail[Math.floor(Math.random() * avail.length)];
            return { ...q, key };
        }
    }
    return null;
};

// ─── Quiz Card ────────────────────────────────────────────────────────────────
const QuizCard = ({ q, qIdx, onAnswer }) => {
    const [wrong, setWrong] = useState([]);
    const [correct, setCorrect] = useState(false);

    const handleSelect = (opt) => {
        if (correct || wrong.includes(opt)) return;
        if (opt === q.meaning) {
            setCorrect(true);
            setTimeout(() => onAnswer(wrong.length === 0), 800);
        } else {
            setWrong(prev => [...prev, opt]);
        }
    };

    return (
        <div className="flex flex-col items-center gap-5 w-full animate-in slide-in-from-right duration-300">
            <div className="w-full flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-[#F4F7F8] rounded-full overflow-hidden">
                    <div className="h-full bg-[#7C83FF] rounded-full transition-all duration-700"
                        style={{ width: `${((qIdx + 1) / 5) * 100}%` }} />
                </div>
                <span className="text-xs font-extrabold text-[#AEB7C5] shrink-0">{qIdx + 1} / 5</span>
            </div>

            <div className="w-36 h-36 rounded-[2rem] bg-white border border-[#E9EDF2] shadow-sm flex items-center justify-center">
                <span className="text-8xl font-extrabold text-[#5D544F]">{q.hanja}</span>
            </div>

            <p className="text-base font-extrabold text-[#5B677A] text-center">이 한자의 뜻은?</p>

            <div className="px-4 py-1.5 bg-[#F8FAF9] rounded-full border border-[#E9EDF2]">
                <p className="text-xs text-[#AEB7C5] font-bold text-center">💡 {q.hint}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
                {q.options.map(opt => {
                    const isWrong = wrong.includes(opt);
                    const isRight = correct && opt === q.meaning;
                    return (
                        <button
                            key={opt}
                            onClick={() => handleSelect(opt)}
                            className={`py-4 rounded-2xl font-extrabold text-base border-2 transition-all active:scale-95 ${
                                isRight ? 'bg-[#FF9B73]/10 border-[#FF9B73] text-[#FF9B73] scale-[1.02]' :
                                isWrong ? 'bg-white border-rose-200 text-rose-300 opacity-60' :
                                correct ? 'bg-white border-[#E9EDF2] text-slate-200' :
                                          'bg-white border-[#E9EDF2] text-[#5B677A] shadow-sm'
                            }`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Memory Game ──────────────────────────────────────────────────────────────
const MemoryGame = ({ hanjas, onFinish }) => {
    const [cards] = useState(() => shuffle([
        ...hanjas.map((h, i) => ({ id: `h${i}`, content: h.hanja,   type: 'hanja',   pairId: i, isMatched: false })),
        ...hanjas.map((h, i) => ({ id: `m${i}`, content: h.meaning, type: 'meaning', pairId: i, isMatched: false })),
    ]));
    const [cardState, setCardState] = useState(() => cards.map(() => ({ isMatched: false })));
    const [flipped, setFlipped] = useState([]);
    const [matched, setMatched] = useState(new Set());
    const [mistakes, setMistakes] = useState(0);
    const [locked, setLocked] = useState(false);

    const handleFlip = (idx) => {
        if (locked || cardState[idx].isMatched || flipped.includes(idx) || flipped.length >= 2) return;
        const next = [...flipped, idx];
        setFlipped(next);
        if (next.length === 2) {
            setLocked(true);
            const [a, b] = [cards[next[0]], cards[next[1]]];
            if (a.pairId === b.pairId) {
                const newMatched = new Set([...matched, a.pairId]);
                setCardState(prev => prev.map((s, i) => next.includes(i) ? { isMatched: true } : s));
                setMatched(newMatched);
                setFlipped([]);
                setLocked(false);
                if (newMatched.size === hanjas.length) setTimeout(() => onFinish(mistakes), 500);
            } else {
                setMistakes(m => m + 1);
                setTimeout(() => { setFlipped([]); setLocked(false); }, 900);
            }
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full animate-in fade-in duration-400">
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold text-[#AEB7C5]">실수 {mistakes}회</span>
                <span className="text-xs font-extrabold text-[#7C83FF]">{matched.size} / {hanjas.length} 매칭</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
                {cards.map((card, idx) => {
                    const isVisible = flipped.includes(idx) || cardState[idx].isMatched;
                    const isMatch = cardState[idx].isMatched;
                    return (
                        <button
                            key={card.id}
                            onClick={() => handleFlip(idx)}
                            className={`aspect-square rounded-xl font-extrabold transition-all duration-200 flex items-center justify-center border-2 active:scale-90 ${
                                isMatch   ? 'bg-[#FF9B73]/10 border-[#FF9B73]/30' :
                                isVisible ? 'bg-[#7C83FF]/10 border-[#7C83FF]' :
                                            'bg-white border-[#E9EDF2] shadow-sm'
                            }`}
                        >
                            {isVisible ? (
                                <span className={`leading-tight text-center px-0.5 ${
                                    isMatch ? 'text-[#FF9B73]' : 'text-[#4A51D4]'
                                } ${card.type === 'hanja' ? 'text-xl' : 'text-[10px]'}`}>
                                    {card.content}
                                </span>
                            ) : (
                                <span className="text-slate-200 text-lg">?</span>
                            )}
                        </button>
                    );
                })}
            </div>
            <p className="text-xs text-center text-[#AEB7C5] font-bold">한자와 뜻을 맞춰보세요!</p>
        </div>
    );
};

// ─── Result Screen ────────────────────────────────────────────────────────────
const ResultScreen = ({ finalLevel, memoryMistakes, onComplete }) => {
    const grade  = GRADE_MAP[finalLevel];
    const quizXp = QUIZ_XP[finalLevel];
    const memBonus = memoryMistakes <= 2 ? 50 : memoryMistakes <= 5 ? 20 : 5;

    return (
        <div className="flex flex-col items-center gap-5 w-full animate-in fade-in duration-500">
            <img src={GARAE} alt="가래뭉치" className="w-36 h-36 object-contain drop-shadow-2xl" />

            <div className="text-center flex flex-col gap-1">
                <p className="text-xs font-extrabold text-[#AEB7C5] uppercase tracking-widest">가래뭉치의 평가</p>
                <h2 className="text-xl font-extrabold text-[#3C3C3C] tracking-tight leading-snug">
                    {MSG_MAP[finalLevel]}
                </h2>
            </div>

            {/* XP 내역 */}
            <div className="w-full bg-white rounded-[1.5rem] border border-[#E9EDF2] shadow-sm p-5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[#AEB7C5]">퀴즈 결과</span>
                    <span className="text-sm font-extrabold text-[#7C83FF]">+{quizXp} XP</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[#AEB7C5]">메모리 보너스</span>
                    <span className="text-sm font-extrabold text-[#7C83FF]">+{memBonus} XP</span>
                </div>
                <div className="h-px bg-[#F4F7F8]" />
                <div className="flex justify-between items-center">
                    <span className="text-base font-extrabold text-slate-700">⭐ 총 획득 XP</span>
                    <span className="text-2xl font-extrabold text-[#FFB433]">+{quizXp + memBonus} XP</span>
                </div>
            </div>

            {/* 해금 설명 */}
            <div className="w-full bg-[#F8FAF9] rounded-[1.5rem] p-4 border border-[#E9EDF2] flex flex-col gap-2">
                <p className="text-xs font-extrabold text-[#5B677A]">📖 한자팝은 이렇게 해요</p>
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-start gap-2">
                        <span className="text-[#7C83FF] font-extrabold text-xs shrink-0 mt-0.5">✦</span>
                        <span className="text-xs font-bold text-[#5B677A] leading-snug">스테이지를 클리어하면 그 한자가 해금돼</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-[#7C83FF] font-extrabold text-xs shrink-0 mt-0.5">✦</span>
                        <span className="text-xs font-bold text-[#5B677A] leading-snug">해금된 한자로 퀴즈·게임을 자유롭게 즐길 수 있어</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-[#FFB433] font-extrabold text-xs shrink-0 mt-0.5">✦</span>
                        <span className="text-xs font-bold text-[#5B677A] leading-snug">하루에 몇 판이든 OK! 횟수 제한 없어</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-[#AEB7C5] font-extrabold text-xs shrink-0 mt-0.5">✦</span>
                        <span className="text-xs font-bold text-[#AEB7C5] leading-snug">급수 전체 해금은 급수 시험 통과 후 가능해 <span className="text-[#AEB7C5]">(준비 중)</span></span>
                    </div>
                </div>
            </div>

            <button
                onClick={onComplete}
                className="w-full py-4 rounded-2xl bg-[#7C83FF] text-white font-extrabold text-lg border-b-4 border-[#4A51D4] active:translate-y-1 active:border-b-0 transition-all shadow-lg"
            >
                한자팝 시작하기!
            </button>
        </div>
    );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const OnboardingScreen = ({ onComplete }) => {
    const [step, setStep] = useState('intro');
    const [slideIdx, setSlideIdx] = useState(0);
    const [seenHanjas, setSeenHanjas] = useState([]);
    const [finalLevel, setFinalLevel] = useState(2);
    const [memoryMistakes, setMemoryMistakes] = useState(0);

    const [qState, setQState] = useState(() => {
        const used = new Set();
        const q = pickQuestion(2, used);
        if (q) used.add(q.key);
        return { q, used, level: 2, count: 0 };
    });

    const handleSlide = () => {
        if (slideIdx < INTRO_SLIDES.length - 1) setSlideIdx(s => s + 1);
        else setStep('quiz');
    };

    const handleQuizAnswer = (isFirstTry) => {
        const nextLevel = isFirstTry
            ? Math.min(5, qState.level + 1)
            : Math.max(1, qState.level - 1);

        const newSeen = seenHanjas.find(h => h.hanja === qState.q?.hanja)
            ? seenHanjas
            : [...seenHanjas, { hanja: qState.q.hanja, meaning: qState.q.meaning }];
        setSeenHanjas(newSeen);

        if (qState.count + 1 >= 5) {
            setFinalLevel(nextLevel);
            setStep('memory');
        } else {
            const newUsed = new Set(qState.used);
            const next = pickQuestion(nextLevel, newUsed);
            if (next) newUsed.add(next.key);
            setQState({ q: next, used: newUsed, level: nextLevel, count: qState.count + 1 });
        }
    };

    const handleMemoryFinish = (mistakes) => {
        setMemoryMistakes(mistakes);
        setStep('result');
    };

    const handleComplete = () => {
        const grade  = GRADE_MAP[finalLevel];
        const quizXp = QUIZ_XP[finalLevel];
        const memBonus = memoryMistakes <= 2 ? 50 : memoryMistakes <= 5 ? 20 : 5;
        localStorage.setItem(SK.ONBOARDING_DONE, 'true');
        localStorage.setItem(SK.START_GRADE, grade);
        onComplete(grade, quizXp + memBonus);
    };

    return (
        <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-[#F7FAF9]">
            <div className="w-full max-w-sm mx-auto px-6 py-8 flex flex-col items-center gap-6">

                {/* ── 인트로 ── */}
                {step === 'intro' && (
                    <div className="flex flex-col items-center gap-5 w-full animate-in fade-in duration-400">
                        <img src={GARAE} alt="가래뭉치"
                            className="w-44 h-44 object-contain drop-shadow-2xl" />
                        <div className="w-full bg-white rounded-[1.5rem] p-5 border border-[#E9EDF2] shadow-sm relative">
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border-l border-t border-[#E9EDF2] rotate-45" />
                            <p className="text-base font-extrabold text-slate-700 text-center leading-relaxed whitespace-pre-line">
                                {INTRO_SLIDES[slideIdx]}
                            </p>
                        </div>
                        <div className="flex gap-1.5">
                            {INTRO_SLIDES.map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === slideIdx ? 'bg-[#7C83FF] w-5' : 'bg-slate-200'}`} />
                            ))}
                        </div>
                        <button
                            onClick={handleSlide}
                            className="pill-button-primary w-full py-4 text-lg font-extrabold active:scale-95 transition-transform"
                        >
                            계속하기
                        </button>
                        <button
                            onClick={() => onComplete('8급', 10)}
                            className="w-full py-3.5 rounded-2xl font-extrabold text-[#5B677A] active:scale-95 transition-all border-2 border-[#E9EDF2] border-b-4 active:border-b-2 active:translate-y-[2px] shadow-sm bg-white"
                        >
                            건너뛰기
                        </button>
                    </div>
                )}

                {/* ── 퀴즈 ── */}
                {step === 'quiz' && qState.q && (
                    <QuizCard
                        key={qState.count}
                        q={qState.q}
                        qIdx={qState.count}
                        onAnswer={handleQuizAnswer}
                    />
                )}

                {/* ── 메모리 게임 ── */}
                {step === 'memory' && (
                    <div className="flex flex-col gap-4 w-full animate-in fade-in duration-400">
                        <div className="flex items-start gap-3">
                            <img src={GARAE} alt="가래뭉치" className="w-14 h-14 object-contain shrink-0" />
                            <div className="bg-white rounded-2xl px-4 py-2.5 border border-[#E9EDF2] shadow-sm flex-1">
                                <p className="text-sm font-extrabold text-[#5B677A] leading-snug">
                                    이 한자들, 방금 봤지?<br />기억력도 테스트해볼게!
                                </p>
                            </div>
                        </div>
                        <MemoryGame hanjas={seenHanjas} onFinish={handleMemoryFinish} />
                    </div>
                )}

                {/* ── 결과 ── */}
                {step === 'result' && (
                    <ResultScreen
                        finalLevel={finalLevel}
                        memoryMistakes={memoryMistakes}
                        onComplete={handleComplete}
                    />
                )}

            </div>
        </div>
    );
};

export default OnboardingScreen;
