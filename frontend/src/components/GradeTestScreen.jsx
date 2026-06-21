import { useState, useEffect, useRef } from 'react';
import { SK } from '../constants/storageKeys.js';
import GradeTestIntro from './common/GradeTestIntro.jsx';
import GradeTestResult from './common/GradeTestResult.jsx';
import QuizProgressBar from './QuizProgressBar.jsx';

// ─── 8급 기출 기반 문제 (111회 · 112회) ─────────────────────────────────────
const QUESTIONS = [
  // ── [1-10] 독음: 문장 속 한자 읽기 ──
  { type: 'sound_sentence', sentence: '올해는 (八)월입니다.', hanja: '八', prompt: '다음 문장의 한자를 읽는 소리는?', choices: ['팔', '칠', '구', '육'], answer: '팔' },
  { type: 'sound_sentence', sentence: '(月)요일에 학교에 갑니다.', hanja: '月', prompt: '다음 문장의 한자를 읽는 소리는?', choices: ['월', '화', '수', '목'], answer: '월' },
  { type: 'sound_sentence', sentence: '(十)월에 단풍이 아름다워요.', hanja: '十', prompt: '다음 문장의 한자를 읽는 소리는?', choices: ['십', '백', '천', '만'], answer: '십' },
  { type: 'sound_sentence', sentence: '(五)월 오일은 어린이날입니다.', hanja: '五', prompt: '다음 문장의 한자를 읽는 소리는?', choices: ['오', '사', '육', '칠'], answer: '오' },
  { type: 'sound_sentence', sentence: '(日)요일은 쉬는 날입니다.', hanja: '日', prompt: '다음 문장의 한자를 읽는 소리는?', choices: ['일', '월', '화', '토'], answer: '일' },
  { type: 'sound_sentence', sentence: '(大)한민국 만세!', hanja: '大', prompt: '다음 문장의 한자를 읽는 소리는?', choices: ['대', '소', '중', '장'], answer: '대' },
  { type: 'sound_sentence', sentence: '(韓)국은 아름다운 나라입니다.', hanja: '韓', prompt: '다음 문장의 한자를 읽는 소리는?', choices: ['한', '민', '국', '왕'], answer: '한' },
  { type: 'sound_sentence', sentence: '(民)주주의 나라입니다.', hanja: '民', prompt: '다음 문장의 한자를 읽는 소리는?', choices: ['민', '국', '왕', '군'], answer: '민' },
  { type: 'sound_sentence', sentence: '(國)어를 열심히 공부합니다.', hanja: '國', prompt: '다음 문장의 한자를 읽는 소리는?', choices: ['국', '한', '군', '민'], answer: '국' },
  { type: 'sound_sentence', sentence: '(山)에 올라가면 경치가 좋아요.', hanja: '山', prompt: '다음 문장의 한자를 읽는 소리는?', choices: ['산', '천', '남', '북'], answer: '산' },

  // ── [11-20] 훈/음 → 한자 고르기 ──
  { type: 'hanja', prompt: '"왕"에 해당하는 한자는?', hanja: null, choices: ['王', '大', '民', '父'], answer: '王' },
  { type: 'hanja', prompt: '"쇠/성"에 해당하는 한자는?', hanja: null, choices: ['金', '木', '水', '火'], answer: '金' },
  { type: 'hanja', prompt: '"나무"에 해당하는 한자는?', hanja: null, choices: ['木', '水', '火', '土'], answer: '木' },
  { type: 'hanja', prompt: '"두 이"에 해당하는 한자는?', hanja: null, choices: ['二', '一', '三', '四'], answer: '二' },
  { type: 'hanja', prompt: '"작을"에 해당하는 한자는?', hanja: null, choices: ['小', '大', '中', '上'], answer: '小' },
  { type: 'hanja', prompt: '"사람"에 해당하는 한자는?', hanja: null, choices: ['人', '父', '母', '兄'], answer: '人' },
  { type: 'hanja', prompt: '"석 삼"에 해당하는 한자는?', hanja: null, choices: ['三', '一', '二', '四'], answer: '三' },
  { type: 'hanja', prompt: '"흙"에 해당하는 한자는?', hanja: null, choices: ['土', '水', '火', '金'], answer: '土' },
  { type: 'hanja', prompt: '"물"에 해당하는 한자는?', hanja: null, choices: ['水', '木', '火', '金'], answer: '水' },
  { type: 'hanja', prompt: '"흰"에 해당하는 한자는?', hanja: null, choices: ['白', '靑', '大', '小'], answer: '白' },

  // ── [21-30] 밑줄 친 말 → 한자 고르기 ──
  { type: 'underline', sentence: '나무 한 그루를 심었습니다.', underline: '나무', prompt: '밑줄 친 말에 해당하는 한자는?', choices: ['木', '火', '水', '土'], answer: '木' },
  { type: 'underline', sentence: '나와 형은 아버지를 닮았습니다.', underline: '형', prompt: '밑줄 친 말에 해당하는 한자는?', choices: ['兄', '弟', '父', '母'], answer: '兄' },
  { type: 'underline', sentence: '아이들이 학교 밖에서 놀고 있습니다.', underline: '밖', prompt: '밑줄 친 말에 해당하는 한자는?', choices: ['外', '門', '室', '上'], answer: '外' },
  { type: 'underline', sentence: '물이 아래로 흐릅니다.', underline: '아래', prompt: '밑줄 친 말에 해당하는 한자는?', choices: ['下', '上', '左', '右'], answer: '下' },
  { type: 'underline', sentence: '강 가운데 배가 떠 있습니다.', underline: '가운데', prompt: '밑줄 친 말에 해당하는 한자는?', choices: ['中', '大', '小', '上'], answer: '中' },
  { type: 'underline', sentence: '구미호는 꼬리가 아홉 달린 여우입니다.', underline: '아홉', prompt: '밑줄 친 말에 해당하는 한자는?', choices: ['九', '八', '七', '六'], answer: '九' },
  { type: 'underline', sentence: '장작이 불을 탑니다.', underline: '불', prompt: '밑줄 친 말에 해당하는 한자는?', choices: ['火', '水', '木', '土'], answer: '火' },
  { type: 'underline', sentence: '버드나무의 푸른 잎이 흔들립니다.', underline: '푸른', prompt: '밑줄 친 말에 해당하는 한자는?', choices: ['靑', '白', '大', '小'], answer: '靑' },
  { type: 'underline', sentence: '하나의 마음으로 힘을 모읍시다.', underline: '하나', prompt: '밑줄 친 말에 해당하는 한자는?', choices: ['一', '二', '三', '十'], answer: '一' },
  { type: 'underline', sentence: '동생과 함께 뛰어놀았습니다.', underline: '동생', prompt: '밑줄 친 말에 해당하는 한자는?', choices: ['弟', '兄', '男', '女'], answer: '弟' },

  // ── [31-40] 한자 → 훈+음 ──
  { type: 'meaning_sound', hanja: '校', prompt: '이 한자의 훈과 음은?', choices: ['학교 교', '배울 학', '먼저 선', '날 생'], answer: '학교 교' },
  { type: 'meaning_sound', hanja: '母', prompt: '이 한자의 훈과 음은?', choices: ['어미 모', '아비 부', '형 형', '계집 녀'], answer: '어미 모' },
  { type: 'meaning_sound', hanja: '弟', prompt: '이 한자의 훈과 음은?', choices: ['아우 제', '형 형', '사내 남', '계집 녀'], answer: '아우 제' },
  { type: 'meaning_sound', hanja: '六', prompt: '이 한자의 훈과 음은?', choices: ['여섯 육', '일곱 칠', '다섯 오', '여덟 팔'], answer: '여섯 육' },
  { type: 'meaning_sound', hanja: '先', prompt: '이 한자의 훈과 음은?', choices: ['먼저 선', '날 생', '배울 학', '아비 부'], answer: '먼저 선' },
  { type: 'meaning_sound', hanja: '四', prompt: '이 한자의 훈과 음은?', choices: ['넉 사', '석 삼', '다섯 오', '여섯 육'], answer: '넉 사' },
  { type: 'meaning_sound', hanja: '七', prompt: '이 한자의 훈과 음은?', choices: ['일곱 칠', '여섯 육', '여덟 팔', '다섯 오'], answer: '일곱 칠' },
  { type: 'meaning_sound', hanja: '門', prompt: '이 한자의 훈과 음은?', choices: ['문 문', '바깥 외', '큰 대', '메 산'], answer: '문 문' },
  { type: 'meaning_sound', hanja: '女', prompt: '이 한자의 훈과 음은?', choices: ['계집 녀', '사내 남', '어미 모', '아들 자'], answer: '계집 녀' },
  { type: 'meaning_sound', hanja: '外', prompt: '이 한자의 훈과 음은?', choices: ['바깥 외', '가운데 중', '위 상', '아래 하'], answer: '바깥 외' },

  // ── [41-44] 한자 → 훈(뜻) ──
  { type: 'meaning', prompt: '이 한자의 뜻은?', hanja: '父', choices: ['아비', '어미', '형', '아우'], answer: '아비' },
  { type: 'meaning', prompt: '이 한자의 뜻은?', hanja: '北', choices: ['북녘', '동녘', '서녘', '남녘'], answer: '북녘' },
  { type: 'meaning', prompt: '이 한자의 뜻은?', hanja: '寸', choices: ['마디', '아비', '동녘', '북녘'], answer: '마디' },
  { type: 'meaning', prompt: '이 한자의 뜻은?', hanja: '東', choices: ['동녘', '서녘', '남녘', '마디'], answer: '동녘' },

  // ── [45-48] 한자 → 음(소리) ──
  { type: 'sound', prompt: '이 한자의 읽는 소리는?', hanja: '西', choices: ['서', '동', '남', '북'], answer: '서' },
  { type: 'sound', prompt: '이 한자의 읽는 소리는?', hanja: '南', choices: ['남', '산', '군', '실'], answer: '남' },
  { type: 'sound', prompt: '이 한자의 읽는 소리는?', hanja: '室', choices: ['실', '남', '산', '군'], answer: '실' },
  { type: 'sound', prompt: '이 한자의 읽는 소리는?', hanja: '軍', choices: ['군', '남', '산', '실'], answer: '군' },

  // ── [49-50] 필순 ──
  { type: 'stroke', prompt: '이 한자의 총 획수는?', hanja: '門', choices: ['8획', '6획', '7획', '9획'], answer: '8획' },
  { type: 'stroke', prompt: '이 한자의 총 획수는?', hanja: '王', choices: ['4획', '2획', '3획', '5획'], answer: '4획' },
];

const PASS_COUNT = 35; // 50문제 중 35개 (70%)

const TYPE_LABELS = {
  sound: '독음 (읽는 소리)',
  sound_sentence: '독음 (읽는 소리)',
  hanja: '훈음 → 한자',
  underline: '밑줄 → 한자',
  meaning: '한자 → 뜻',
  meaning_sound: '한자 → 훈+음',
  stroke: '필순 (획수)',
};

const getUnlockedGrade = () => {
  try { return localStorage.getItem(SK.UNLOCKED_GRADE); } catch { return null; }
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const renderSentence = (sentence, hanja, underline) => {
  if (underline) {
    const idx = sentence.indexOf(underline);
    if (idx === -1) return <span>{sentence}</span>;
    return (
      <>
        {sentence.slice(0, idx)}
        <span className="font-normal underline decoration-2 underline-offset-2">{underline}</span>
        {sentence.slice(idx + underline.length)}
      </>
    );
  }
  if (hanja) {
    const parts = sentence.split(`(${hanja})`);
    return parts.reduce((acc, part, i) => {
      if (i < parts.length - 1) {
        return [...acc, part, <span key={i} className="hanja-highlight">{hanja}</span>];
      }
      return [...acc, part];
    }, []);
  }
  return sentence;
};

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
const GradeTestScreen = ({ onBack, onComplete, selectedCharacter }) => {
  const currentGrade = getUnlockedGrade();
  const alreadyUnlocked = ['8급', '7급II', '7급', '6급II', '6급'].includes(currentGrade);

  const [questions] = useState(() =>
    shuffle(QUESTIONS).map(q => ({ ...q, choices: shuffle(q.choices) }))
  );
  const [phase, setPhase] = useState('intro');
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [answerLog, setAnswerLog] = useState([]);

  const q = questions[qIndex];
  const progress = (qIndex / questions.length) * 100;
  const isChoiceLarge = q?.type === 'hanja' || q?.type === 'underline';

  const handleSelect = (choice) => {
    if (selected !== null) return;
    const isCorrect = choice === q.answer;
    setAnswerLog(prev => [...prev, { number: qIndex + 1, type: TYPE_LABELS[q.type] || '', prompt: q.prompt, sentence: q.sentence || '', userAnswer: choice, correctAnswer: q.answer, isCorrect }]);
    setSelected(choice);
    if (isCorrect) {
      setCorrect(c => c + 1);
      setRevealed(true);
    } else {
      autoAdvanceTimerRef.current = setTimeout(handleNext, 500);
    }
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

  const autoAdvanceTimerRef = useRef(null);
  useEffect(() => {
    if (!revealed) return;
    autoAdvanceTimerRef.current = setTimeout(handleNext, 1200);
    return () => clearTimeout(autoAdvanceTimerRef.current);
  }, [revealed]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFinish = () => {
    const passed = correct >= PASS_COUNT;
    if (passed && !alreadyUnlocked) {
      localStorage.setItem(SK.UNLOCKED_GRADE, '8급');
    }
    if (onComplete) onComplete({ correct, total: questions.length, passed });
    onBack();
  };

  // ── 인트로 ──
  if (phase === 'intro') {
    return (
      <GradeTestIntro
        title="8급 인증 시험"
        subtitle={<>전국한자능력검정시험<br/>8급 기출 기반</>}
        total={questions.length}
        passCount={PASS_COUNT}
        focusText="독음 · 훈음 · 밑줄 · 훈+음 · 필순 혼합"
        alreadyUnlocked={alreadyUnlocked}
        alreadyUnlockedText="이미 인증 완료된 급수예요!"
        onBack={onBack}
        onStart={() => setPhase('quiz')}
      />
    );
  }

  // ── 퀴즈 ──
  if (phase === 'quiz') {
    return (
      <div className="quiz-screen">
        {/* 헤더 + 진행바 */}
        <div className="quiz-header-wrap">
          <div className="quiz-header-card">
            <button onClick={onBack}
              className="flex items-center justify-center bg-white dark:bg-slate-800/90 border-2 border-white dark:border-slate-700 rounded-2xl shadow-sm active:scale-95 transition-all px-3 py-1.5 font-normal text-[#5B677A] dark:text-slate-300 text-sm gap-1 shrink-0">
              <span>←</span>
            </button>
            <div className="flex-1">
              <div className="quiz-progress-row">
                <div className="grade-test-header-title">
                  <span>8급 인증 시험</span>
                  <span className="grade-test-header-type">{TYPE_LABELS[q.type] || ''}</span>
                </div>
                <span>{qIndex + 1} / {questions.length}</span>
              </div>
              <QuizProgressBar current={qIndex} total={questions.length} fillColor="#6D6FF2" />
            </div>
            <span className="text-sm font-normal text-teal-600 shrink-0">{correct}점</span>
          </div>
        </div>

        {/* 문제 영역 */}
        <div className="quiz-content-area">
          <div className="quiz-content-inner">
            {/* 문제 카드 */}
            <div className="grade-test-question-card">
              <p className="grade-test-prompt">{q.prompt}</p>

              {/* 문장형 (독음/밑줄) */}
              {(q.type === 'sound_sentence' || q.type === 'underline') && (
                <p className="grade-test-example">
                  {renderSentence(q.sentence, q.type === 'sound_sentence' ? q.hanja : null, q.underline)}
                </p>
              )}

              {/* 한자 박스 (독음/뜻/음/필순/훈+음) */}
              {q.hanja && q.type !== 'sound_sentence' && (
                <div className="grade-test-hanja-box grade-test-hanja-box--single">
                  <span className="grade-test-hanja-char">{q.hanja}</span>
                </div>
              )}
            </div>

            {/* 보기 */}
            <div className="grade-test-choice-grid">
              {q.choices.map((choice) => {
                const isSelected = selected === choice;
                const isAnswer = choice === q.answer;
                let stateClass = '';
                if (revealed) {
                  if (isAnswer) {
                    stateClass = 'quiz-choice-btn--correct';
                  } else if (isSelected) {
                    stateClass = 'quiz-choice-btn--wrong';
                  } else {
                    stateClass = 'quiz-choice-btn--dimmed';
                  }
                } else if (selected !== null) {
                  if (isSelected) {
                    stateClass = 'quiz-choice-btn--wrong';
                  } else {
                    stateClass = 'quiz-choice-btn--dimmed';
                  }
                }
                return (
                  <button
                    key={choice}
                    onClick={() => handleSelect(choice)}
                    className={`quiz-choice-btn ${isChoiceLarge ? 'quiz-choice-btn--large' : ''} ${stateClass}`}
                  >
                    <span className="break-keep">{choice}</span>
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
          </div>

        </div>
      </div>
    );
  }

  // ── 결과 ──
  const passed = correct >= PASS_COUNT;
  return (
    <GradeTestResult
      passed={passed}
      correct={correct}
      total={questions.length}
      passCount={PASS_COUNT}
      grade="8급"
      nextGrade="7급Ⅱ"
      alreadyUnlocked={alreadyUnlocked}
      selectedCharacter={selectedCharacter}
      answers={answerLog}
      onRetry={() => { setPhase('intro'); setQIndex(0); setSelected(null); setRevealed(false); setCorrect(0); setAnswerLog([]); }}
      onFinish={handleFinish}
    />
  );
};

export default GradeTestScreen;
