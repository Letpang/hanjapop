import { useMemo, useState } from 'react';
import { SK } from '../constants/storageKeys.js';

const GUIDE = '/assets/images/characters/garae/rank_5.webp';

const INTRO_SLIDES = [
  {
    kicker: 'HANJAPOP PROLOGUE',
    title: '너의 한자 탐험 지도를 열어볼게',
    body: '짧은 진단으로 지금 감각을 확인하고, 딱 맞는 출발점을 찾아요.',
  },
  {
    kicker: 'GRADE PATH',
    title: '한자팝은 급수별 탐험으로 이어져',
    body: '8급부터 6급까지 차근차근 올라가고, 인증 시험으로 다음 급수를 열어요.',
  },
  {
    kicker: 'READY',
    title: '틀려도 괜찮아. 여긴 시험장이 아니라 출발점이야',
    body: '한자 눈썰미, 단어 감각, 기억력을 살짝 볼게요.',
  },
];

const QUESTION_BANK = {
  1: [
    { hanja: '一', answer: '하나', options: ['하나', '둘', '셋', '넷'], hint: '8급 기초', skill: '한자 눈썰미', grade: '8급' },
    { hanja: '大', answer: '크다', options: ['작다', '크다', '높다', '빠르다'], hint: '사람이 팔을 벌린 모양', skill: '한자 눈썰미', grade: '8급' },
    { hanja: '日', answer: '해', options: ['달', '해', '별', '구름'], hint: '태양에서 온 글자', skill: '한자 눈썰미', grade: '8급' },
  ],
  2: [
    { hanja: '校', answer: '학교', options: ['집', '학교', '시장', '공원'], hint: '學校에 들어가요', skill: '단어 감각', grade: '7급II' },
    { hanja: '先', answer: '먼저', options: ['먼저', '나중', '함께', '매우'], hint: '先生의 첫 글자', skill: '단어 감각', grade: '7급II' },
    { hanja: '友', answer: '벗', options: ['벗', '적', '길', '힘'], hint: '친구와 관련 있어요', skill: '단어 감각', grade: '7급II' },
  ],
  3: [
    { hanja: '時間', answer: '시간', options: ['학교', '시간', '가족', '날씨'], hint: '時와 間이 만나면?', skill: '단어 감각', grade: '7급' },
    { hanja: '家族', answer: '가족', options: ['친구', '가족', '나라', '시장'], hint: '집 家가 들어간 단어', skill: '단어 감각', grade: '7급' },
    { hanja: '道路', answer: '도로', options: ['도로', '마음', '나무', '하늘'], hint: '길 道가 들어간 단어', skill: '단어 감각', grade: '7급' },
  ],
  4: [
    { hanja: '努力', answer: '노력', options: ['기록', '노력', '공부', '약속'], hint: '힘 力이 두 번 느껴지는 단어', skill: '문장 추론', grade: '6급II' },
    { hanja: '自然', answer: '자연', options: ['자연', '교실', '음악', '역사'], hint: '스스로 自, 그럴 然', skill: '문장 추론', grade: '6급II' },
    { hanja: '反對', answer: '반대', options: ['찬성', '반대', '완성', '출발'], hint: '反은 되돌린다는 느낌', skill: '문장 추론', grade: '6급II' },
  ],
  5: [
    { hanja: '傳統', answer: '전통', options: ['전통', '과학', '속도', '계절'], hint: '이어져 내려오는 것', skill: '문장 추론', grade: '6급' },
    { hanja: '記錄', answer: '기록', options: ['기록', '치료', '농사', '승리'], hint: '적어서 남기는 것', skill: '문장 추론', grade: '6급' },
    { hanja: '醫者', answer: '의사', options: ['의사', '학생', '농부', '가수'], hint: '병을 고치는 사람', skill: '문장 추론', grade: '6급' },
  ],
};

const PROFILE = {
  1: { grade: '8급', title: '새싹 탐험가', message: '기초부터 시작하면 성장 속도가 아주 좋아질 타입이에요.', xp: 60 },
  2: { grade: '8급', title: '기초 탄탄 탐험가', message: '쉬운 한자는 이미 감이 있어요. 8급 지도를 빠르게 밟아봐요.', xp: 90 },
  3: { grade: '7급II', title: '단어 감각 탐험가', message: '한자와 단어를 연결하는 힘이 보여요. 7급II까지 기대돼요.', xp: 120 },
  4: { grade: '7급', title: '문맥 추론 탐험가', message: '뜻을 찍는 게 아니라 흐름으로 읽는 감각이 있어요.', xp: 150 },
  5: { grade: '6급II', title: '고급 코스 예비 탐험가', message: '상위 급수 한자도 겁먹지 않을 감각이에요.', xp: 180 },
};

const GRADE_STEPS = ['8급', '7급II', '7급', '6급II', '6급'];

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const pickQuestion = (level, used) => {
  const order = [level, level - 1, level + 1, 1, 2, 3, 4, 5].filter(n => n >= 1 && n <= 5);
  for (const target of order) {
    const candidates = QUESTION_BANK[target]
      .map((question, index) => ({ ...question, key: `${target}-${index}` }))
      .filter(question => !used.has(question.key));
    if (candidates.length) return candidates[Math.floor(Math.random() * candidates.length)];
  }
  return null;
};

const clampLevel = (level) => Math.min(5, Math.max(1, level));

const Intro = ({ slideIdx, onNext, onSkip }) => {
  const slide = INTRO_SLIDES[slideIdx];
  return (
    <div className="flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[#F7FAF9]">
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_50%_0%,rgba(46,214,197,0.22),transparent_60%)]" />
        <div className="relative flex w-full max-w-sm flex-col items-center gap-5">
          <div className="relative h-48 w-48">
            <div className="absolute inset-6 rounded-full bg-[#DDF8F4]" />
            <div className="absolute inset-0 rounded-full border-[14px] border-white/70" />
            <img src={GUIDE} alt="가래뭉치" className="relative h-full w-full object-contain drop-shadow-2xl" />
          </div>

          <div className="w-full rounded-[2rem] border border-white bg-white/95 p-6 text-center shadow-xl">
            <p className="mb-2 text-[11px] font-black tracking-[0.18em] text-[#00A994]">{slide.kicker}</p>
            <h1 className="text-[28px] font-black leading-tight tracking-tight text-[#334155] break-keep">
              {slide.title}
            </h1>
            <p className="mt-3 text-sm font-bold leading-relaxed text-[#7A8798] break-keep">
              {slide.body}
            </p>
          </div>

          <div className="flex gap-1.5">
            {INTRO_SLIDES.map((_, idx) => (
              <span key={idx} className={`h-2 rounded-full transition-all ${idx === slideIdx ? 'w-7 bg-[#00C7AE]' : 'w-2 bg-[#D9E1EA]'}`} />
            ))}
          </div>

          <button
            onClick={onNext}
            className="w-full rounded-[1.6rem] bg-[#00C7AE] py-4 text-lg font-black text-white shadow-lg shadow-teal-200 active:scale-95"
          >
            {slideIdx === INTRO_SLIDES.length - 1 ? '진단 시작하기' : '계속하기'}
          </button>
          <button
            onClick={onSkip}
            className="w-full rounded-[1.4rem] border-2 border-[#E5ECF3] bg-white py-3.5 text-sm font-black text-[#7A8798] active:scale-95"
          >
            8급부터 바로 시작
          </button>
        </div>
      </div>
    </div>
  );
};

const Quiz = ({ question, index, selected, isCorrect, onSelect }) => (
  <div className="flex min-h-[100dvh] w-full flex-col bg-[#F7FAF9] px-5 py-6 safe-top">
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="quiz-progress-track flex-1">
          <div className="quiz-progress-fill bg-[#00C7AE]" style={{ width: `${((index + 1) / 8) * 100}%` }} />
        </div>
        <span className="quiz-counter-text shrink-0">{index + 1}/8</span>
      </div>

      <div className="grade-test-question-card">
        <div className="flex items-center justify-between w-full">
          <span className="rounded-full bg-[#E8FAF7] px-3 py-1 text-[11px] font-black text-[#00A994]">{question.grade}</span>
          <span className="grade-test-type-label">{question.skill}</span>
        </div>
        <div className={`grade-test-hanja-box ${question.hanja.length > 1 ? 'grade-test-hanja-box--compound' : 'grade-test-hanja-box--single'}`}>
          <span className="grade-test-hanja-char hanja-char">{question.hanja}</span>
        </div>
        <p className="text-center font-black text-[#334155] text-xl">이 한자의 뜻은?</p>
        <p className="body-muted text-center">{question.hint}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {question.options.map(option => {
          const answered = selected != null;
          const right = answered && option === question.answer;
          const wrong = answered && option === selected && option !== question.answer;
          const dimmed = answered && !right;
          return (
            <button
              key={option}
              onClick={() => onSelect(option)}
              disabled={answered}
              className={`quiz-choice-btn justify-center text-xl ${right ? 'quiz-choice-btn--correct' : wrong ? 'quiz-choice-btn--wrong' : dimmed ? 'quiz-choice-btn--dimmed' : ''}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {selected != null && (
        <div className={`rounded-[1.5rem] px-4 py-3 text-center text-sm font-black ${isCorrect ? 'bg-[#E8FAF7] text-[#00A994]' : 'bg-[#FFF1EE] text-[#E8664F]'}`}>
          {isCorrect ? '좋아요. 감각이 살아있어요!' : `정답은 ${question.answer}. 지금 외우면 돼요.`}
        </div>
      )}
    </div>
  </div>
);

const ShootMiniGame = ({ items, onFinish }) => {
  const questions = useMemo(() => items.slice(0, 4).map(item => ({
    hanja: item.hanja,
    answer: item.answer,
    options: shuffle(item.options),
  })), [items]);

  const [qIdx, setQIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [selected, setSelected] = useState(null);

  const q = questions[qIdx];

  const handleShoot = (option) => {
    if (selected != null) return;
    const wrong = option !== q.answer;
    const nextMistakes = mistakes + (wrong ? 1 : 0);
    if (wrong) setMistakes(nextMistakes);
    setSelected(option);
    setTimeout(() => {
      const nextIdx = qIdx + 1;
      if (nextIdx >= questions.length) {
        onFinish(nextMistakes);
      } else {
        setQIdx(nextIdx);
        setSelected(null);
      }
    }, 600);
  };

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-[#F7FAF9] px-5 py-6 safe-top">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-5">
        <div className="flex items-start gap-3 rounded-[1.75rem] bg-white p-4 shadow-sm">
          <img src={GUIDE} alt="가래뭉치" className="h-14 w-14 object-contain" />
          <div>
            <p className="text-[11px] font-black tracking-wider text-[#FF9B73]">MONSTER SHOOT</p>
            <h2 className="text-lg font-black text-[#334155]">몬스터를 잡아라!</h2>
            <p className="mt-1 text-xs font-bold text-[#8D9CAE]">한자 뜻이 적힌 몬스터를 빠르게 잡아요.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E8EEF4]">
            <div className="h-full rounded-full bg-[#FF9B73] transition-all duration-500" style={{ width: `${((qIdx + 1) / questions.length) * 100}%` }} />
          </div>
          <span className="text-xs font-black text-[#8D9CAE]">{qIdx + 1}/{questions.length}</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white p-6 shadow-sm gap-2">
          <p className="text-xs font-black text-[#8D9CAE]">이 한자의 뜻은?</p>
          <span className={`${q.hanja.length > 2 ? 'text-5xl' : 'text-8xl'} font-black text-[#334155]`}>{q.hanja}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {q.options.map(option => {
            const answered = selected != null;
            const right = answered && option === q.answer;
            const wrong = answered && option === selected && option !== q.answer;
            return (
              <button
                key={option}
                onClick={() => handleShoot(option)}
                disabled={answered}
                className={`min-h-[72px] rounded-[1.35rem] border-2 px-3 text-base font-black transition-all active:scale-95 ${
                  right ? 'border-[#00C7AE] bg-[#E8FAF7] text-[#00A994]' :
                  wrong ? 'border-[#FFB5A8] bg-[#FFF1EE] text-[#E8664F]' :
                  answered ? 'border-[#EDF2F7] bg-white text-[#CBD5E1]' :
                  'border-[#FFD5B8] bg-[#FFF8F4] text-[#4B5A6D] shadow-sm'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl">{right ? '💥' : wrong ? '✗' : '👾'}</span>
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-xs font-black text-[#8D9CAE]">
          <span>진행 {qIdx + 1}/{questions.length}</span>
          <span>실수 {mistakes}</span>
        </div>
      </div>
    </div>
  );
};

const Result = ({ score, finalLevel, skillStats, memoryMistakes, onComplete }) => {
  const profile = PROFILE[finalLevel];
  const memoryBonus = memoryMistakes <= 1 ? 40 : memoryMistakes <= 3 ? 25 : 10;
  const totalXp = profile.xp + memoryBonus;
  const currentGradeIndex = Math.max(0, GRADE_STEPS.indexOf(profile.grade));

  return (
    <div className="flex min-h-[100dvh] w-full flex-col overflow-y-auto bg-[#F7FAF9] px-5 py-6 safe-top">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-5 safe-bottom">
        <div className="rounded-[2.4rem] border border-white bg-white p-6 text-center shadow-xl">
          <img src={GUIDE} alt="가래뭉치" className="mx-auto h-36 w-36 object-contain drop-shadow-xl" />
          <p className="mt-2 text-[11px] font-black tracking-[0.18em] text-[#00A994]">DIAGNOSIS COMPLETE</p>
          <h1 className="mt-1 text-[29px] font-black leading-tight tracking-tight text-[#334155] break-keep">
            {profile.grade} {profile.title}
          </h1>
          <p className="mt-3 text-sm font-bold leading-relaxed text-[#7A8798] break-keep">{profile.message}</p>
        </div>

        <div className="rounded-[2rem] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-black text-[#334155]">급수 탐험 경로</span>
            <span className="rounded-full bg-[#E8FAF7] px-3 py-1 text-xs font-black text-[#00A994]">{score}/8 정답</span>
          </div>
          <div className="flex items-center gap-1.5">
            {GRADE_STEPS.map((grade, idx) => (
              <div key={grade} className="flex flex-1 flex-col items-center gap-2">
                <div className={`h-3 w-full rounded-full ${idx <= currentGradeIndex ? 'bg-[#00C7AE]' : 'bg-[#E5ECF3]'}`} />
                <span className={`text-[10px] font-black ${idx === currentGradeIndex ? 'text-[#00A994]' : 'text-[#AEB7C5]'}`}>{grade}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            ['한자 눈썰미', skillStats.eye],
            ['단어 감각', skillStats.word],
            ['문장 추론', skillStats.context],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.35rem] bg-white p-3 text-center shadow-sm">
              <p className="text-[10px] font-black text-[#8D9CAE]">{label}</p>
              <p className="mt-1 text-xl font-black text-[#7C83FF]">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[2rem] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-[#334155]">진단 보상</span>
            <span className="text-2xl font-black text-[#FF9B73]">+{totalXp} XP</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black">
            <span className="rounded-xl bg-[#FFF1EA] px-3 py-2 text-[#E8664F]">진단 +{profile.xp}</span>
            <span className="rounded-xl bg-[#FFF1EA] px-3 py-2 text-[#FF9B73]">슈팅 보너스 +{memoryBonus}</span>
          </div>
        </div>

        <button
          onClick={() => onComplete(profile.grade, totalXp)}
          className="w-full rounded-[1.7rem] bg-[#00C7AE] py-4 text-lg font-black text-white shadow-lg shadow-teal-200 active:scale-95"
        >
          내 탐험 지도 열기
        </button>
      </div>
    </div>
  );
};

const OnboardingScreen = ({ onComplete }) => {
  const [step, setStep] = useState('intro');
  const [slideIdx, setSlideIdx] = useState(0);
  const [qState, setQState] = useState(() => {
    const used = new Set();
    const first = pickQuestion(2, used);
    if (first) used.add(first.key);
    return { question: first, used, level: 2, index: 0 };
  });
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [seenItems, setSeenItems] = useState([]);
  const [finalLevel, setFinalLevel] = useState(2);
  const [memoryMistakes, setMemoryMistakes] = useState(0);

  const skillStats = useMemo(() => answers.reduce((acc, answer) => {
    if (!answer.correct) return acc;
    if (answer.skill === '한자 눈썰미') return { ...acc, eye: acc.eye + 1 };
    if (answer.skill === '단어 감각') return { ...acc, word: acc.word + 1 };
    return { ...acc, context: acc.context + 1 };
  }, { eye: 0, word: 0, context: 0 }), [answers]);

  const handleIntroNext = () => {
    if (slideIdx < INTRO_SLIDES.length - 1) setSlideIdx(prev => prev + 1);
    else setStep('quiz');
  };

  const handleSkip = () => {
    localStorage.setItem(SK.ONBOARDING_DONE, 'true');
    localStorage.setItem(SK.START_GRADE, '8급');
    onComplete('8급', 20);
  };

  const handleSelect = (option) => {
    if (selected != null) return;
    const question = qState.question;
    const correct = option === question.answer;
    setSelected(option);
    setAnswers(prev => [...prev, { ...question, selected: option, correct }]);
    setSeenItems(prev => prev.some(item => item.hanja === question.hanja) ? prev : [...prev, question]);

    const nextLevel = clampLevel(qState.level + (correct ? 1 : -1));
    setTimeout(() => {
      if (qState.index + 1 >= 8) {
        setFinalLevel(nextLevel);
        setStep('shoot');
        return;
      }
      const nextUsed = new Set(qState.used);
      const nextQuestion = pickQuestion(nextLevel, nextUsed);
      if (nextQuestion) nextUsed.add(nextQuestion.key);
      setQState({ question: nextQuestion, used: nextUsed, level: nextLevel, index: qState.index + 1 });
      setSelected(null);
    }, 820);
  };

  const handleShootFinish = (mistakes) => {
    setMemoryMistakes(mistakes);
    setStep('result');
  };

  const handleComplete = (grade, xp) => {
    localStorage.setItem(SK.ONBOARDING_DONE, 'true');
    localStorage.setItem(SK.START_GRADE, grade);
    onComplete(grade, xp);
  };

  if (step === 'intro') {
    return <Intro slideIdx={slideIdx} onNext={handleIntroNext} onSkip={handleSkip} />;
  }

  if (step === 'quiz' && qState.question) {
    return (
      <Quiz
        question={qState.question}
        index={qState.index}
        selected={selected}
        isCorrect={selected === qState.question.answer}
        onSelect={handleSelect}
      />
    );
  }

  if (step === 'shoot') {
    return <ShootMiniGame items={seenItems.length >= 4 ? seenItems : answers} onFinish={handleShootFinish} />;
  }

  return (
    <Result
      score={answers.filter(answer => answer.correct).length}
      finalLevel={finalLevel}
      skillStats={skillStats}
      memoryMistakes={memoryMistakes}
      onComplete={handleComplete}
    />
  );
};

export default OnboardingScreen;
