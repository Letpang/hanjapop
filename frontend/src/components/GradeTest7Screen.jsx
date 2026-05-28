import { useState } from 'react';
import { SK } from '../constants/storageKeys.js';

// ─── 7급 기출 기반 문제 (111회·112회) — hanja_unified.json 검증 완료 ───────────
const QUESTIONS = [
  // ── 한자어 음 읽기 (7급 한자 포함 단어) ──
  {
    type: 'sound',
    prompt: '다음 漢字語의 읽는 소리는?',
    hanja: '千秋',
    choices: ['천추', '춘추', '천년', '추계'],
    answer: '천추',
  },
  {
    type: 'sound',
    prompt: '다음 漢字語의 읽는 소리는?',
    hanja: '住所',
    choices: ['주소', '주택', '거소', '소재'],
    answer: '주소',
  },
  {
    type: 'sound',
    prompt: '다음 漢字語의 읽는 소리는?',
    hanja: '生命',
    choices: ['생명', '명령', '생존', '명칭'],
    answer: '생명',
  },
  {
    type: 'sound',
    prompt: '다음 漢字語의 읽는 소리는?',
    hanja: '秋夕',
    choices: ['추석', '하지', '석양', '추분'],
    answer: '추석',
  },
  {
    type: 'sound',
    prompt: '다음 漢字語의 읽는 소리는?',
    hanja: '登場',
    choices: ['등장', '출장', '입장', '등산'],
    answer: '등장',
  },
  {
    type: 'sound',
    prompt: '다음 漢字語의 읽는 소리는?',
    hanja: '休日',
    choices: ['휴일', '평일', '공휴', '주일'],
    answer: '휴일',
  },
  {
    type: 'sound',
    prompt: '다음 漢字語의 읽는 소리는?',
    hanja: '靑春',
    choices: ['청춘', '청년', '봄날', '청명'],
    answer: '청춘',
  },

  // ── 한자 → 뜻 (7급 한자만) ──
  {
    type: 'meaning',
    prompt: '다음 한자의 뜻은?',
    hanja: '夕',
    choices: ['아침', '낮', '저녁', '밤'],
    answer: '저녁',
  },
  {
    type: 'meaning',
    prompt: '다음 한자의 뜻은?',
    hanja: '草',
    choices: ['꽃', '풀', '나무', '이끼'],
    answer: '풀',
  },
  {
    type: 'meaning',
    prompt: '다음 한자의 뜻은?',
    hanja: '林',
    choices: ['산', '수풀', '들', '강'],
    answer: '수풀',
  },
  {
    type: 'meaning',
    prompt: '다음 한자의 뜻은?',
    hanja: '口',
    choices: ['눈', '코', '입', '귀'],
    answer: '입',
  },
  {
    type: 'meaning',
    prompt: '다음 한자의 뜻은?',
    hanja: '老',
    choices: ['젊을', '늙을', '어릴', '자랄'],
    answer: '늙을',
  },
  {
    type: 'meaning',
    prompt: '다음 한자의 뜻은?',
    hanja: '心',
    choices: ['몸', '힘', '눈', '마음'],
    answer: '마음',
  },
  {
    type: 'meaning',
    prompt: '다음 한자의 뜻은?',
    hanja: '命',
    choices: ['이름', '호령', '목숨', '목소리'],
    answer: '목숨',
  },

  // ── 뜻 → 한자 (7급 한자만) ──
  {
    type: 'hanja',
    prompt: '"봄"에 해당하는 한자는?',
    hanja: null,
    choices: ['春', '夏', '秋', '冬'],
    answer: '春',
  },
  {
    type: 'hanja',
    prompt: '"하늘"에 해당하는 한자는?',
    hanja: null,
    choices: ['天', '地', '川', '林'],
    answer: '天',
  },
  {
    type: 'hanja',
    prompt: '"살(거주)"에 해당하는 한자는?',
    hanja: null,
    choices: ['住', '所', '村', '里'],
    answer: '住',
  },
  {
    type: 'hanja',
    prompt: '"날"에 해당하는 한자는?',
    hanja: null,
    choices: ['出', '入', '來', '登'],
    answer: '出',
  },
  {
    type: 'hanja',
    prompt: '"풀"에 해당하는 한자는?',
    hanja: null,
    choices: ['草', '花', '林', '色'],
    answer: '草',
  },
  {
    type: 'hanja',
    prompt: '"글월"에 해당하는 한자는?',
    hanja: null,
    choices: ['文', '字', '紙', '語'],
    answer: '文',
  },
];

const PASS_COUNT = 14;

const getUnlockedGrade = () => {
  try { return localStorage.getItem(SK.UNLOCKED_GRADE) || '8급'; } catch { return '8급'; }
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
const GradeTest7Screen = ({ onBack, onComplete }) => {
  const currentGrade = getUnlockedGrade();
  const alreadyUnlocked = currentGrade === '7급' || currentGrade === '6급II' || currentGrade === '6급';
  const hasPrereq = currentGrade === '7급II' || alreadyUnlocked;

  const [questions] = useState(() =>
    shuffle(QUESTIONS).map(q => ({ ...q, choices: shuffle(q.choices) }))
  );
  const [phase, setPhase] = useState('intro');
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);

  const q = questions[qIndex];
  const progress = (qIndex / questions.length) * 100;
  const isChoiceLarge = q?.type === 'hanja';
  const isCompound = q?.hanja && q.hanja.length > 1;

  const handleSelect = (choice) => {
    if (revealed) return;
    const isCorrect = choice === q.answer;
    setSelected(choice);
    setRevealed(true);
    if (isCorrect) setCorrect(c => c + 1);
  };

  const handleNext = () => {
    if (qIndex + 1 >= questions.length) {
      setPhase('result');
    } else {
      setQIndex(i => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const handleFinish = () => {
    const passed = correct >= PASS_COUNT;
    if (passed && !alreadyUnlocked) {
      localStorage.setItem(SK.UNLOCKED_GRADE, '7급');
    }
    if (onComplete) onComplete({ correct, total: questions.length, passed });
    onBack();
  };

  // ── 인트로 ──
  if (phase === 'intro') {
    return (
      <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden bg-[#F7FAF9]">
        {/* Transparent Header */}
        <div className="w-full shrink-0 flex items-center justify-between px-5 pt-8 pb-4 relative">
          <button onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-md shadow-lg border-2 border-white flex items-center justify-center text-[#3C3C3C] font-extrabold text-xl active:scale-90 transition-all z-10">
            ←
          </button>
          <h2 className="text-h3 font-black text-[#3D4B4A] absolute left-1/2 -translate-x-1/2">7급 인증 시험</h2>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 pb-10">
          <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-[2.5rem] border-4 border-white shadow-[0_16px_40px_rgba(120,130,160,0.12)] p-6 flex flex-col items-center gap-5 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-white" style={{ backgroundColor: '#FFF5E8', boxShadow: '0 0 24px rgba(255,210,120,0.25), inset 0 2px 4px rgba(255,255,255,0.8)' }}>
              <img src="/assets/images/icons/icon_test.webp" alt="Test" className="w-12 h-12 object-contain" />
            </div>
            <div>
              <h3 className="text-h2 font-black text-[#3C3C3C]">7급Ⅱ → 7급 인증 시험</h3>
              <p className="text-body font-bold text-[#AEB7C5] mt-1">전국한자능력검정시험 7급 기출 기반</p>
            </div>

            <div className="grid grid-cols-2 gap-3.5 w-full">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center border border-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                <img src="/assets/images/icons/icon_flashcard_glossy.webp" alt="Questions" className="w-9 h-9 object-contain mb-1" />
                <span className="text-xs text-[#AEB7C5] font-black uppercase tracking-widest">문제 수</span>
                <span className="text-body-lg font-black text-[#334155] mt-0.5">20문항</span>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center border border-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                <img src="/assets/images/icons/icon_rank_glossy.webp" alt="Criteria" className="w-9 h-9 object-contain mb-1" />
                <span className="text-xs text-[#AEB7C5] font-black uppercase tracking-widest">합격 기준</span>
                <span className="text-body-lg font-black text-[#334155] mt-0.5">14개 이상</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full text-left">
              <div className="flex items-center gap-3 bg-white/40 rounded-2xl px-4 py-3 border border-white/60">
                <span className="text-[#334155] text-lg leading-none">✦</span>
                <p className="text-body font-bold text-[#334155]">한자어 독음 · 훈 찾기 · 한자 찾기 혼합</p>
              </div>
              {!hasPrereq && (
                <div className="flex items-center gap-3 bg-[#FFB433]/10/60 rounded-2xl px-4 py-3 border border-[#FFB433]/15/60">
                  <span className="text-[#FFB433] text-lg leading-none">⚠️</span>
                  <p className="text-body font-bold text-[#FFB433]">7급Ⅱ 인증 시험을 먼저 통과하면 좋아요!</p>
                </div>
              )}
              {alreadyUnlocked && (
                <div className="flex items-center gap-3 bg-[#FF9B73]/10/60 rounded-2xl px-4 py-3 border border-[#FF9B73]/20/60">
                  <span className="text-[#FF9B73] text-lg leading-none">✓</span>
                  <p className="text-body font-bold text-[#FF9B73]">이미 7급 인증이 완료되었어요!</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setPhase('quiz')}
            className="w-full max-w-md py-4 rounded-3xl font-black text-white active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(to right, #FFC13D, #FFB027)', boxShadow: '0 10px 24px rgba(255,180,50,0.28)' }}
          >
            시험 시작
          </button>
          <button
            onClick={onBack}
            className="w-full max-w-md py-4 rounded-3xl font-black text-[#5B677A] active:scale-95 transition-all border-2 border-[#E9EDF2] shadow-[0_4px_12px_rgba(0,0,0,0.03)] bg-white"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // ── 퀴즈 ──
  if (phase === 'quiz') {
    return (
      <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden bg-[#F7FAF9]">
        <div className="w-full shrink-0 safe-top pt-4 px-4 mb-3">
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-5 shadow-md border border-white">
            <button onClick={onBack}
              className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-sm active:scale-95 transition-all px-3 py-1.5 font-black text-[#5B677A] text-sm gap-1 shrink-0">
              <span>←</span>
            </button>
            <div className="flex-1">
              <div className="flex justify-between text-xs font-extrabold text-[#AEB7C5] mb-1">
                <span>7급 인증 시험</span>
                <span>{qIndex + 1} / {questions.length}</span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: '11px', backgroundColor: '#E9EDF5' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: '#6D6FF2' }}
                />
              </div>
            </div>
            <span className="text-sm font-extrabold text-purple-600 shrink-0">{correct}점</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-between px-5 pb-8 overflow-y-auto">
          <div className="w-full max-w-md flex flex-col items-center gap-5 pt-2">
            <div className="w-full bg-white rounded-[2rem] border-4 border-white p-4 flex flex-col items-center gap-2" style={{ boxShadow: '0 16px 40px rgba(120,130,160,0.10)' }}>
              <span className="font-bold text-center" style={{ fontSize: '15px', color: '#9AA4B8', lineHeight: 1.4 }}>
                전국한자능력검정시험 · 7급 기출 기반
              </span>
              <span className="text-xs font-extrabold text-[#AEB7C5] uppercase tracking-widest">
                {q.type === 'sound' ? '독음 (읽는 소리)' : q.type === 'hanja' ? '훈음 → 한자' : '한자 → 뜻'}
              </span>
              <p className="text-h3 text-center" style={{ color: '#2F3545', fontWeight: 800, lineHeight: 1.18 }}>{q.prompt}</p>
              {q.hanja && (
                <div className={`bg-[#F8FAF9] rounded-[1.5rem] border border-[#E9EDF2] flex items-center justify-center shadow-inner ${isCompound ? 'w-40 h-20' : 'w-24 h-24'}`}>
                  <span
                    className="font-bold text-[#3C3C3C]"
                    style={{ fontSize: isCompound ? '2.5rem' : '3.5rem', fontFamily: 'serif' }}
                  >
                    {q.hanja}
                  </span>
                </div>
              )}
            </div>

            <div className="w-full grid grid-cols-2 gap-3">
              {q.choices.map((choice) => {
                const isSelected = selected === choice;
                const isAnswer = choice === q.answer;
                let cls = 'w-full py-4 font-extrabold border-2 transition-all text-center rounded-[1.625rem] ';
                let btnStyle = {};
                if (!revealed) {
                  cls += 'bg-white text-[#2F3545] active:bg-[#EEF1FF] active:border-[#6D6FF2]';
                  btnStyle = { borderColor: '#E7EBF3', boxShadow: '0 6px 16px rgba(120,130,160,0.08)' };
                } else if (isAnswer) {
                  cls += 'text-[#2A7A50]';
                  btnStyle = { backgroundColor: '#EAFBF0', borderColor: '#4CCB7F', boxShadow: '0 4px 12px rgba(76,203,127,0.15)' };
                } else if (isSelected) {
                  cls += 'text-[#CC3333]';
                  btnStyle = { backgroundColor: '#FFF1F1', borderColor: '#FF7A7A' };
                } else {
                  cls += 'bg-white text-[#AEB7C5]';
                  btnStyle = { borderColor: '#E7EBF3', boxShadow: '0 6px 16px rgba(120,130,160,0.08)' };
                }
                return (
                  <button
                    key={choice}
                    onClick={() => handleSelect(choice)}
                    className={cls}
                    style={isChoiceLarge ? { ...btnStyle, fontSize: '1.75rem', fontFamily: 'serif' } : { ...btnStyle, fontSize: '1.05rem' }}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>

            {revealed && (
              <div className="w-full rounded-2xl px-5 py-3 text-center font-extrabold text-sm"
                style={selected === q.answer
                  ? { backgroundColor: '#EAFBF0', color: '#2A7A50', border: '1px solid #4CCB7F' }
                  : { backgroundColor: '#FFF1F1', color: '#CC3333', border: '1px solid #FF7A7A' }}>
                {selected === q.answer ? '✓ 정답!' : `✗ 정답: ${q.answer}`}
              </div>
            )}
          </div>

          {revealed && (
            <button
              onClick={handleNext}
              className="pill-button-primary w-full max-w-md py-4 text-lg font-extrabold active:scale-95 transition-transform mt-4"
            >
              {qIndex + 1 >= questions.length ? '결과 보기' : '다음 문제'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── 결과 ──
  const passed = correct >= PASS_COUNT;
  return (
    <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-[#F7FAF9] px-5 pb-10 gap-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] border-4 border-white shadow-2xl p-6 flex flex-col items-center gap-5 text-center">
        <div className="text-5xl">{passed ? '🎉' : '😢'}</div>
        <div>
          <h3 className="text-xl font-extrabold text-[#3C3C3C]">
            {passed ? '합격! 7급 인증 완료!' : '아쉽게 불합격'}
          </h3>
          <p className="text-sm font-bold text-[#AEB7C5] mt-1">
            {passed ? '6급Ⅱ 시험에 도전할 수 있어요' : '다시 도전해 보세요!'}
          </p>
        </div>

        <div className="w-full bg-[#F8FAF9] rounded-2xl p-4 border border-[#E9EDF2]">
          <p className="text-4xl font-extrabold text-purple-600 mb-1">{correct} / {questions.length}</p>
          <p className="text-xs font-extrabold text-[#AEB7C5]">합격 기준: {PASS_COUNT}개 이상</p>
          <div className="w-full h-3 bg-slate-200 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${passed ? 'bg-gradient-to-r from-purple-400 to-purple-500' : 'bg-gradient-to-r from-rose-300 to-rose-400'}`}
              style={{ width: `${(correct / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {passed && !alreadyUnlocked && (
          <div className="w-full bg-purple-50 rounded-2xl px-4 py-3 border border-purple-200 flex items-center gap-3">
            <span className="text-2xl">🔓</span>
            <p className="text-sm font-extrabold text-purple-700 text-left">7급 인증 완료! 6급Ⅱ 시험에 도전하세요!</p>
          </div>
        )}
      </div>

      <div className="w-full max-w-md flex flex-col gap-3">
        {!passed && (
          <button
            onClick={() => { setPhase('intro'); setQIndex(0); setSelected(null); setRevealed(false); setCorrect(0); }}
            className="pill-button-primary w-full py-4 text-lg font-extrabold active:scale-95 transition-transform"
          >
            다시 도전
          </button>
        )}
        <button
          onClick={handleFinish}
          className="w-full py-3.5 rounded-2xl font-extrabold text-[#5B677A] active:scale-95 transition-all border-2 border-[#E9EDF2] border-b-4 active:border-b-2 active:translate-y-[2px] shadow-sm bg-white"
        >
          {passed ? '완료' : '돌아가기'}
        </button>
      </div>
    </div>
  );
};

export default GradeTest7Screen;
