import { useMemo, useState, lazy, Suspense } from 'react';
import { SK } from '../constants/storageKeys.js';
import { getCharacterScale, getCharacterTranslateY } from '../utils/rankUtils.js';

const ShootGameScreen = lazy(() => import('./ShootGameScreen.jsx'));
const MatchGameScreen = lazy(() => import('./MatchGameScreen.jsx'));

const getGuide = (char) => `/assets/images/characters/${char || 'garae'}/rank_5.webp`;

const INTRO_SLIDES = [
  {
    kicker: 'HANJAPOP PROLOGUE',
    title: '너의 한자 탐험 지도를 열어볼게',
    highlight: '한자 탐험 지도',
    body: '짧은 진단으로 지금 감각을 확인하고, 딱 맞는 출발점을 찾아요.',
  },
  {
    kicker: 'GRADE PATH',
    title: '한자팝은 급수별 탐험으로 이어져',
    highlight: '급수별 탐험',
    body: '8급부터 6급까지 차근차근 올라가고, 인증 시험으로 다음 급수를 열어요.',
  },
  {
    kicker: 'READY',
    title: '틀려도 괜찮아. 여긴 시험장이 아니라 출발점이야',
    highlight: '출발점',
    body: '단어 감각, 문장 추론, 사자성어까지 살짝 볼게요.',
  },
];

const FLOAT_ITEMS = [
  { char: '山', top: '10%', left: '7%',  size: 26, duration: '3.4s', delay: '0s',   rotate: -14 },
  { char: '日', top: '16%', right: '9%', size: 16, duration: '4.0s', delay: '0.7s', rotate: 18  },
  { char: '月', top: '68%', left: '5%',  size: 22, duration: '4.3s', delay: '1.4s', rotate: -9  },
  { char: '水', top: '62%', right: '7%', size: 14, duration: '3.7s', delay: '0.3s', rotate: 22  },
  { char: '木', top: '40%', left: '3%',  size: 19, duration: '4.6s', delay: '1.9s', rotate: -20 },
  { char: '火', top: '38%', right: '4%', size: 24, duration: '3.9s', delay: '1.1s', rotate: 11  },
];

const renderTitle = (title, highlight) => {
  if (!highlight) return title;
  const idx = title.indexOf(highlight);
  if (idx === -1) return title;
  return (
    <>
      {title.slice(0, idx)}
      <span className="text-[#009984] font-bold">{highlight}</span>
      {title.slice(idx + highlight.length)}
    </>
  );
};

// 4문제: 단어 감각 2 + 문장 추론 1 + 사자성어 1
const QUESTIONS = [
  {
    type: 'word',
    hanja: '時間',
    answer: '시간',
    options: ['시간', '날씨', '가족', '공간'],
    hint: '時와 間이 합쳐진 말',
    skill: '단어 감각',
    grade: '7급II',
  },
  {
    type: 'word',
    hanja: '家族',
    answer: '가족',
    options: ['친구', '가족', '선생님', '이웃'],
    hint: '집 家가 들어간 단어',
    skill: '단어 감각',
    grade: '7급II',
  },
  {
    type: 'sentence',
    hanja: '努力',
    sentence: '꿈을 이루려면 매일 ___을 해야 해요.',
    answer: '노력',
    options: ['노력', '여행', '포기', '수면'],
    hint: '힘쓸 努, 힘 力',
    skill: '문장 추론',
    grade: '6급II',
  },
  {
    type: 'idiom',
    hanja: '一石二鳥',
    answer: '일석이조',
    options: ['일석이조', '칠전팔기', '마이동풍', '이심전심'],
    hint: '돌 하나로 새 두 마리를!',
    skill: '사자성어',
    grade: '6급',
  },
];

const TOTAL = QUESTIONS.length;

// 맞은 개수(0~4) → 시작 급수 프로필
const PROFILE = {
  1: { grade: '8급',   title: '새싹 탐험가',         message: '기초부터 시작하면 성장 속도가 아주 좋아질 타입이에요.', xp: 60 },
  2: { grade: '8급',   title: '기초 탄탄 탐험가',     message: '쉬운 한자는 이미 감이 있어요. 8급 지도를 빠르게 밟아봐요.', xp: 90 },
  3: { grade: '7급II', title: '단어 감각 탐험가',     message: '한자와 단어를 연결하는 힘이 보여요. 7급II까지 기대돼요.', xp: 120 },
  4: { grade: '7급',   title: '문맥 추론 탐험가',     message: '뜻을 찍는 게 아니라 흐름으로 읽는 감각이 있어요.', xp: 150 },
  5: { grade: '6급II', title: '고급 코스 예비 탐험가', message: '상위 급수 한자도 겁먹지 않을 감각이에요.', xp: 180 },
};

const GRADE_STEPS = ['8급', '7급II', '7급', '6급II', '6급'];

const scoreToLevel = (score) => {
  if (score === 0) return 1;
  if (score === 1) return 2;
  if (score === 2) return 3;
  if (score === 3) return 4;
  return 5;
};

// 슈팅 게임에 사용할 한자 ID (퀴즈 문제와 연관된 8급~7급II 한자들)
const SHOOT_HANJA_IDS = [1, 7, 21, 31, 34, 79, 106, 150, 294, 312];

const SHOOT_CONTENT_POOL = {
  main: { hanjaIds: SHOOT_HANJA_IDS },
  review: { hanjaIds: [] },
};

// ─────────────────────────────────────────────
// Intro
// ─────────────────────────────────────────────
const Intro = ({ slideIdx, onNext, onSkip, guide, charId }) => {
  const slide = INTRO_SLIDES[slideIdx];
  const charScale = getCharacterScale(charId || 'garae', 'rank5');
  const charTranslateY = getCharacterTranslateY(charId || 'garae', true);
  return (
    <div
      className="onboarding-intro-screen relative flex min-h-[100dvh] w-full flex-col overflow-hidden"
      style={{
        background: '#f7fffe',
        backgroundImage: 'radial-gradient(rgba(0,199,174,0.18) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      {/* 상단 그라데이션 오버레이 */}
      <div
        className="absolute inset-x-0 top-0 h-72 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(46,214,197,0.18) 0%, transparent 100%)' }}
      />
      {/* 하단 흰색 페이드 */}
      <div
        className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(0deg, #f7fffe 0%, transparent 100%)' }}
      />

      {/* 플로팅 한자 오브젝트 */}
      {FLOAT_ITEMS.map((item, i) => (
        <div
          key={i}
          className="absolute pointer-events-none select-none font-bold animate-float"
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            fontSize: item.size + 'px',
            color: '#00C7AE',
            opacity: 0.13,
            transform: `rotate(${item.rotate}deg)`,
            animationDuration: item.duration,
            animationDelay: item.delay,
          }}
        >
          {item.char}
        </div>
      ))}

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
          {/* 캐릭터 + 후광 + 발밑 그림자 */}
          <div className="relative flex flex-col items-center">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(0,199,174,0.18) 0%, transparent 68%)' }}
            />
            <div style={{ transform: `translateY(${charTranslateY}) scale(${charScale})` }}>
              <img src={guide} alt="캐릭터" className="h-52 w-52 object-contain drop-shadow-xl animate-float" />
            </div>
            <div
              className="w-16 h-2.5 rounded-full"
              style={{ background: 'radial-gradient(ellipse, rgba(0,0,0,0.12) 0%, transparent 80%)' }}
            />
          </div>
          <div className="text-center">
            <div className="mb-3 inline-flex items-center rounded-full bg-[#E4F9F6] px-3.5 py-1 text-[11px] font-semibold tracking-[0.16em] text-[#009984]">
              {slide.kicker}
            </div>
            <h1 className="text-h2 font-medium leading-tight tracking-tight text-[#334155] dark:text-slate-100 break-keep">
              {renderTitle(slide.title, slide.highlight)}
            </h1>
            <p className="mt-3 text-body font-medium text-[#445060] dark:text-slate-300 break-keep" style={{ lineHeight: 1.6 }}>{slide.body}</p>
          </div>
          <div className="flex items-center gap-2">
            {INTRO_SLIDES.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${i === slideIdx ? 'w-7 h-2 bg-[#00C7AE]' : 'w-2 h-2 bg-[#C8D8E4]/80 dark:bg-slate-600'}`}
                style={i === slideIdx ? { boxShadow: '0 0 8px rgba(0,199,174,0.55)' } : {}}
              />
            ))}
          </div>
          <button
            onClick={onNext}
            className="hp-cta-button hp-cta-button--teal onboarding-shimmer-btn text-h3 tracking-tight"
          >
            {slideIdx < INTRO_SLIDES.length - 1 ? '다음' : '진단 시작하기'}
          </button>
          <div className="w-full flex flex-col items-center gap-1.5">
            <p className="text-[15px] font-normal text-[#888]">이미 고수라면?</p>
            <button
              onClick={onSkip}
              className="w-full rounded-[1.4rem] border-2 border-[#E5ECF3] dark:border-slate-700 bg-white/70 dark:bg-slate-800 py-3.5 text-body font-normal text-[#7A8798] dark:text-slate-300 active:scale-95"
            >
              8급부터 바로 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Quiz
// ─────────────────────────────────────────────
const PROMPT = {
  word: '이 단어의 뜻은?',
  sentence: '빈칸에 알맞은 말은?',
  idiom: '이 사자성어의 뜻은?',
};

const Quiz = ({ question, index, selected, isCorrect, onSelect }) => {
  const answered = selected != null;

  const renderSentence = (sentence) => {
    const parts = sentence.split('___');
    return (
      <p className="text-center font-bold text-[#2c3e50] dark:text-slate-100 break-keep"
        style={{ fontSize: 'clamp(1.55rem, 6.5vw, 1.85rem)', lineHeight: 1.5 }}>
        {parts[0]}
        <span
          className="inline-block align-middle mx-1 border-b-[3px] border-[#7C83FF] text-[#7C83FF]"
          style={{ minWidth: '60px', height: '1em' }}
        />
        {parts[1]}
      </p>
    );
  };

  return (
    <div className="onboarding-activity-screen flex min-h-[100dvh] w-full flex-col overflow-y-auto bg-[#F7FAF9] dark:bg-slate-900 px-5 py-6 safe-top">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="quiz-progress-track flex-1">
            <div className="quiz-progress-fill bg-[#00C7AE]" style={{ width: `${((index + 1) / TOTAL) * 100}%` }} />
          </div>
          <span className="quiz-counter-text shrink-0">{index + 1}/{TOTAL}</span>
        </div>

        <div className="grade-test-question-card">
          <div className="flex items-center justify-between w-full">
            <span className="rounded-full bg-[#E8FAF7] px-3 py-1 text-[11px] font-normal text-[#00A994]">{question.grade}</span>
            <span className="grade-test-type-label">{question.skill}</span>
          </div>

          {question.type === 'sentence' ? (
            <>
              {/* 질문: 작고 연하게 */}
              <p className="text-center text-[15px] font-medium text-[#888] dark:text-slate-400 mb-1">{PROMPT[question.type]}</p>
              <div className="flex flex-col items-center gap-4 py-1">
                {renderSentence(question.sentence)}
                {/* 힌트 카드: 한자 + 뜻 그룹핑 */}
                <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#F4F6FF] dark:bg-slate-700 px-6 py-3">
                  <span className="text-[#7C83FF] font-medium text-[18px]">{question.hanja}</span>
                  <span className="text-[13px] font-normal text-[#A0A0A0] dark:text-slate-400">{question.hint}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={`grade-test-hanja-box ${question.hanja.length > 1 ? 'grade-test-hanja-box--compound' : 'grade-test-hanja-box--single'}`}>
                <span className="grade-test-hanja-char hanja-char">{question.hanja}</span>
              </div>
              <p className="text-center font-medium text-[#334155] dark:text-slate-200 text-[clamp(1.45rem,6vw,1.85rem)]">{PROMPT[question.type]}</p>
              <p className="text-center text-lg font-normal text-[#9AA6B8] dark:text-slate-400">{question.hint}</p>
            </>
          )}
        </div>

        <div className="quiz-choice-grid !mt-0">
          {question.options.map(option => {
            const right = answered && option === question.answer;
            const wrong = answered && option === selected && option !== question.answer;
            const dimmed = answered && !right;
            return (
              <button
                key={option}
                onClick={() => onSelect(option)}
                disabled={answered}
                className={`quiz-choice-btn ${right ? 'quiz-choice-btn--correct' : wrong ? 'quiz-choice-btn--wrong' : dimmed ? 'quiz-choice-btn--dimmed' : ''}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`rounded-[1.5rem] px-4 py-3 text-center text-sm font-normal ${isCorrect ? 'bg-[#E8FAF7] text-[#00A994]' : 'bg-[#FFF1EE] text-[#E8664F]'}`}>
            {isCorrect ? '좋아요. 감각이 살아있어요!' : `정답은 ${question.answer}. 지금 외우면 돼요.`}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// GamePick
// ─────────────────────────────────────────────
const GamePick = ({ onPick, guide, charId }) => {
  const charScale = getCharacterScale(charId || 'garae', 'rank5');
  const charTranslateY = getCharacterTranslateY(charId || 'garae', true);
  return (
  <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center px-5 safe-top"
    style={{ background: 'linear-gradient(180deg, #f0faf8 0%, #F7FAF9 40%)' }}>
    <div className="mx-auto flex w-full max-w-sm flex-col gap-5">
      <div className="text-center mb-2">
        <div className="relative inline-flex flex-col items-center mb-4">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(0,199,174,0.15) 0%, transparent 68%)' }} />
          <div style={{ transform: `translateY(${charTranslateY}) scale(${charScale})` }}>
            <img src={guide} alt="캐릭터" className="h-48 w-48 object-contain drop-shadow-xl animate-float" />
          </div>
        </div>
        <h2 className="text-h2 font-medium text-[#334155] dark:text-slate-100 tracking-tight">어떤 게임 해볼까요?</h2>
        <p className="mt-2 text-body font-normal text-[#7A8798] dark:text-slate-400">하나만 골라봐요!</p>
      </div>

      <button
        onClick={() => onPick('shoot')}
        className="flex items-center gap-4 rounded-[2rem] bg-white dark:bg-slate-800 p-5 text-left active:scale-95 transition-all duration-200 hover:-translate-y-1"
        style={{ boxShadow: '0 4px 16px rgba(255,155,115,0.15), 0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid rgba(255,155,115,0.2)' }}
      >
        <div className="w-20 h-20 rounded-[1.2rem] flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #FFF3EE 0%, #FFE8DC 100%)' }}>
          <img src="/assets/images/icons/monster.webp" alt="슈팅" className="w-16 h-16 object-contain" />
        </div>
        <div>
          <p className="text-body font-bold text-[#334155] dark:text-slate-200">몬스터 슈팅</p>
          <p className="text-body font-normal text-[#7A8798] dark:text-slate-400 mt-1 break-keep leading-snug">한자 뜻이 적힌 몬스터를<br/>빠르게 잡아요</p>
        </div>
      </button>

      <button
        onClick={() => onPick('match')}
        className="flex items-center gap-4 rounded-[2rem] bg-white dark:bg-slate-800 p-5 text-left active:scale-95 transition-all duration-200 hover:-translate-y-1"
        style={{ boxShadow: '0 4px 16px rgba(0,199,174,0.15), 0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid rgba(0,199,174,0.2)' }}
      >
        <div className="w-20 h-20 rounded-[1.2rem] flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #E8FAF7 0%, #D4F5F0 100%)' }}>
          <img src="/assets/images/icons/matching.webp" alt="매칭" className="w-16 h-16 object-contain" />
        </div>
        <div>
          <p className="text-body font-bold text-[#334155] dark:text-slate-200">메모리 게임</p>
          <p className="text-body font-normal text-[#7A8798] dark:text-slate-400 mt-1 break-keep leading-snug">한자와 뜻을 뒤집어<br/>짝을 맞춰요</p>
        </div>
      </button>
    </div>
  </div>
  );
};

// 문제 유형별 최대 점수
const SKILL_MAX = { word: 2, context: 1, idiom: 1 };

// ─────────────────────────────────────────────
// Result
// ─────────────────────────────────────────────
const Result = ({ score, finalLevel, skillStats, onComplete, guide }) => {
  const profile = PROFILE[finalLevel];
  const gameBonus = 30;
  const totalXp = profile.xp + gameBonus;
  const currentGradeIndex = Math.max(0, GRADE_STEPS.indexOf(profile.grade));

  return (
    <div className="flex min-h-[100dvh] w-full flex-col overflow-y-auto bg-[#F7FAF9] dark:bg-slate-900 px-5 py-6 safe-top">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4 safe-bottom">

        {/* ── 헤더: 캐릭터 + 결과 ── */}
        <div className="rounded-[2.4rem] overflow-hidden text-center shadow-xl"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, #e8faf7 0%, #ffffff 60%)' }}>
          <div className="pt-6 pb-2">
            <img src={guide} alt="가래뭉치" className="mx-auto h-40 w-40 object-contain drop-shadow-2xl animate-float" />
          </div>
          <div className="px-6 pb-7">
            <p className="text-[11px] font-normal tracking-[0.2em] text-[#00A994]">DIAGNOSIS COMPLETE</p>
            <h1 className="mt-1 text-h2 font-medium leading-tight tracking-tight text-[#334155] dark:text-slate-200 break-keep">
              <span className="text-[#00C7AE]">{profile.grade}</span> {profile.title}
            </h1>
            <p className="mt-2 text-body font-normal leading-relaxed text-[#7A8798] dark:text-slate-400 break-keep">{profile.message}</p>
          </div>
        </div>

        {/* ── 급수 탐험 경로 ── */}
        <div className="rounded-[2rem] bg-white dark:bg-slate-800 px-5 pt-4 pb-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-body font-medium text-[#334155] dark:text-slate-200">급수 탐험 경로</span>
            <span className="rounded-full bg-[#E8FAF7] px-3 py-1 text-xs font-normal text-[#00A994]">{score}/{TOTAL} 정답</span>
          </div>
          <div className="relative flex items-start justify-between">
            {/* 연결선 */}
            <div className="absolute top-[9px] left-0 right-0 h-[3px] bg-[#E5ECF3] dark:bg-slate-700 mx-2" />
            <div className="absolute top-[9px] left-0 h-[3px] bg-[#00C7AE]"
              style={{ width: `${(currentGradeIndex / (GRADE_STEPS.length - 1)) * 100}%`, marginLeft: '8px' }} />
            {GRADE_STEPS.map((grade, idx) => {
              const done = idx < currentGradeIndex;
              const current = idx === currentGradeIndex;
              return (
                <div key={grade} className="relative z-10 flex flex-col items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center shadow ${
                    done ? 'bg-[#00C7AE]' : current ? 'bg-[#00C7AE] ring-4 ring-[#00C7AE]/20' : 'bg-[#E5ECF3] dark:bg-slate-700'
                  }`}>
                    {done && <span className="text-white text-[8px]">✓</span>}
                  </div>
                  <span className={`text-[10px] font-normal ${current ? 'text-[#00A994] font-medium' : 'text-[#AEB7C5]'}`}>{grade}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 스킬 점수 ── */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            ['단어 감각', skillStats.word, SKILL_MAX.word],
            ['문장 추론', skillStats.context, SKILL_MAX.context],
            ['사자성어', skillStats.idiom, SKILL_MAX.idiom],
          ].map(([label, value, max]) => (
            <div key={label} className="rounded-[1.35rem] bg-white dark:bg-slate-800 p-3 text-center shadow-sm">
              <p className="body-muted">{label}</p>
              <p className="mt-1">
                <span className="text-h3 font-medium text-[#7C83FF]">{value}</span>
                <span className="text-body font-normal text-[#AEB7C5]">/{max}</span>
              </p>
            </div>
          ))}
        </div>

        {/* ── 보상 ── */}
        <div className="rounded-[2rem] p-5 shadow-sm" style={{ background: '#fff9f0', border: '1.5px solid #FFE5C8' }}>
          <div className="flex items-center justify-between">
            <span className="text-body font-medium text-[#334155]">진단 보상</span>
            <span className="text-h3 font-medium" style={{ color: '#E67E22' }}>+{totalXp} XP ✨</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-body font-normal">
            <span className="rounded-xl bg-[#FFF1EA] px-3 py-2 text-center text-[#E8664F]">진단 +{profile.xp}</span>
            <span className="rounded-xl bg-[#FFF1EA] px-3 py-2 text-center text-[#FF9B73]">게임 보너스 +{gameBonus}</span>
          </div>
        </div>

        <button
          onClick={() => onComplete(profile.grade, totalXp)}
          className="w-full rounded-[1.7rem] bg-[#00C7AE] py-4 text-h3 font-normal text-white shadow-lg shadow-teal-200 active:scale-95"
        >
          내 탐험 지도 열기
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
const OnboardingScreen = ({ onComplete, selectedCharacter }) => {
  const guide = getGuide(selectedCharacter);
  const [step, setStep] = useState('intro');
  const [slideIdx, setSlideIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [finalLevel, setFinalLevel] = useState(1);

  const skillStats = useMemo(() => answers.reduce((acc, a) => {
    if (!a.correct) return acc;
    if (a.skill === '단어 감각') return { ...acc, word: acc.word + 1 };
    if (a.skill === '문장 추론') return { ...acc, context: acc.context + 1 };
    if (a.skill === '사자성어') return { ...acc, idiom: acc.idiom + 1 };
    return acc;
  }, { word: 0, context: 0, idiom: 0 }), [answers]);

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
    const question = QUESTIONS[qIdx];
    const correct = option === question.answer;
    setSelected(option);
    const nextAnswers = [...answers, { ...question, selected: option, correct }];
    setAnswers(nextAnswers);

    setTimeout(() => {
      const nextIdx = qIdx + 1;
      if (nextIdx >= TOTAL) {
        const score = nextAnswers.filter(a => a.correct).length;
        setFinalLevel(scoreToLevel(score));
        setStep('gamePick');
        return;
      }
      setQIdx(nextIdx);
      setSelected(null);
    }, 820);
  };

  const handleGamePick = (game) => setStep(game);
  const handleGameDone = () => setStep('result');

  const handleComplete = (grade, xp) => {
    localStorage.setItem(SK.ONBOARDING_DONE, 'true');
    localStorage.setItem(SK.START_GRADE, grade);
    onComplete(grade, xp);
  };

  if (step === 'intro') {
    return <Intro slideIdx={slideIdx} onNext={handleIntroNext} onSkip={handleSkip} guide={guide} charId={selectedCharacter} />;
  }

  if (step === 'quiz') {
    const question = QUESTIONS[qIdx];
    return (
      <Quiz
        question={question}
        index={qIdx}
        selected={selected}
        isCorrect={selected === question.answer}
        onSelect={handleSelect}
      />
    );
  }

  if (step === 'gamePick') {
    return <GamePick onPick={handleGamePick} guide={guide} charId={selectedCharacter} />;
  }

  if (step === 'shoot') {
    return (
      <Suspense fallback={<div className="flex min-h-[100dvh] items-center justify-center bg-[#F7FAF9]" />}>
        <ShootGameScreen
          onBack={handleGameDone}
          onGameFinish={handleGameDone}
          contentPool={SHOOT_CONTENT_POOL}
          masteryData={{}}
          srsData={{}}
          selectedCharacter="garae"
          hideRetry={true}
          killsPerWaveOverride={6}
          userXpOverride={9999}
        />
      </Suspense>
    );
  }

  if (step === 'match') {
    return (
      <Suspense fallback={<div className="flex min-h-[100dvh] items-center justify-center bg-[#F7FAF9]" />}>
        <MatchGameScreen
          onBack={handleGameDone}
          onGameFinish={handleGameDone}
          contentPool={SHOOT_CONTENT_POOL}
          masteryData={{}}
          srsData={{}}
          userXp={0}
          selectedCharacter="garae"
          hideRetry={true}
          pairsPerRoundOverride={3}
        />
      </Suspense>
    );
  }

  return (
    <Result
      score={answers.filter(a => a.correct).length}
      finalLevel={finalLevel}
      skillStats={skillStats}
      onComplete={handleComplete}
      guide={guide}
    />
  );
};

export default OnboardingScreen;
