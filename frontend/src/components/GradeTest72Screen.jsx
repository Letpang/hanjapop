import { useState, useEffect, useRef } from 'react';
import { SK } from '../constants/storageKeys.js';
import GradeTestIntro from './common/GradeTestIntro.jsx';
import GradeTestResult from './common/GradeTestResult.jsx';
import QuizProgressBar from './QuizProgressBar.jsx';

// ─── 7급II 기출 기반 문제 (111회·112회) — 60문항 ─────────────────────────────
const QUESTIONS = [
  // ── [1-22] 독음: 문장 속 한자어 읽기 ──
  { type: 'sound_sentence', sentence: '(食事) 시간이 됐어요.', hanja: '食事', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['식사', '간식', '식당', '식후'], answer: '식사' },
  { type: 'sound_sentence', sentence: '(電氣) 요금이 청구됐어요.', hanja: '電氣', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['전기', '전화', '전선', '전등'], answer: '전기' },
  { type: 'sound_sentence', sentence: '(活動) 시간에 운동을 했어요.', hanja: '活動', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['활동', '행동', '활발', '동작'], answer: '활동' },
  { type: 'sound_sentence', sentence: '(間食) 으로 과일을 먹었어요.', hanja: '間食', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['간식', '식사', '간격', '조식'], answer: '간식' },
  { type: 'sound_sentence', sentence: '(正直) 한 사람이 되어야 해요.', hanja: '正直', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['정직', '직선', '정확', '직업'], answer: '정직' },
  { type: 'sound_sentence', sentence: '(安全) 하게 길을 건너세요.', hanja: '安全', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['안전', '완전', '안보', '안정'], answer: '안전' },
  { type: 'sound_sentence', sentence: '(農場) 에서 채소를 키워요.', hanja: '農場', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['농장', '농업', '장소', '농사'], answer: '농장' },
  { type: 'sound_sentence', sentence: '(自動) 으로 문이 열렸어요.', hanja: '自動', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['자동', '수동', '자연', '자립'], answer: '자동' },
  { type: 'sound_sentence', sentence: '(道路) 공사로 길이 막혔어요.', hanja: '道路', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['도로', '철로', '경로', '노선'], answer: '도로' },
  { type: 'sound_sentence', sentence: '(空氣) 가 맑아서 기분이 좋아요.', hanja: '空氣', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['공기', '기후', '공중', '날씨'], answer: '공기' },
  { type: 'sound_sentence', sentence: '(記念) 사진을 찍었어요.', hanja: '記念', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['기념', '추억', '기억', '기간'], answer: '기념' },
  { type: 'sound_sentence', sentence: '(江山) 이 아름다워요.', hanja: '江山', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['강산', '산천', '강변', '산하'], answer: '강산' },
  { type: 'sound_sentence', sentence: '(同門) 이라 반가웠어요.', hanja: '同門', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['동문', '교문', '동창', '동행'], answer: '동문' },
  { type: 'sound_sentence', sentence: '(話題) 가 풍성했어요.', hanja: '話題', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['화제', '주제', '화백', '논제'], answer: '화제' },
  { type: 'sound_sentence', sentence: '(農夫) 가 밭을 갈고 있어요.', hanja: '農夫', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['농부', '어부', '농민', '소작'], answer: '농부' },
  { type: 'sound_sentence', sentence: '(手動) 으로 조작해야 해요.', hanja: '手動', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['수동', '자동', '수화', '수공'], answer: '수동' },
  { type: 'sound_sentence', sentence: '(全力) 을 다해 달렸어요.', hanja: '全力', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['전력', '전기', '전진', '전심'], answer: '전력' },
  { type: 'sound_sentence', sentence: '(動力) 이 강한 엔진이에요.', hanja: '動力', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['동력', '전력', '동작', '원동'], answer: '동력' },
  { type: 'sound_sentence', sentence: '(空白) 에 이름을 써 넣으세요.', hanja: '空白', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['공백', '여백', '공간', '백지'], answer: '공백' },
  { type: 'sound_sentence', sentence: '(氣力) 이 넘치는 청년이에요.', hanja: '氣力', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['기력', '기운', '기세', '역기'], answer: '기력' },
  { type: 'sound_sentence', sentence: '(正答) 을 골라보세요.', hanja: '正答', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['정답', '오답', '정확', '답변'], answer: '정답' },
  { type: 'sound_sentence', sentence: '(安心) 하고 다녀오세요.', hanja: '安心', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['안심', '안도', '안전', '심정'], answer: '안심' },

  // ── [23-42] 한자 → 훈+음 ──
  { type: 'meaning_sound', hanja: '江', prompt: '이 한자의 훈과 음은?', choices: ['강 강', '내 천', '바다 해', '메 산'], answer: '강 강' },
  { type: 'meaning_sound', hanja: '農', prompt: '이 한자의 훈과 음은?', choices: ['농사 농', '밭 전', '수풀 림', '메 산'], answer: '농사 농' },
  { type: 'meaning_sound', hanja: '答', prompt: '이 한자의 훈과 음은?', choices: ['대답 답', '물을 문', '말씀 화', '글 문'], answer: '대답 답' },
  { type: 'meaning_sound', hanja: '道', prompt: '이 한자의 훈과 음은?', choices: ['길 도', '길 로', '마을 리', '문 문'], answer: '길 도' },
  { type: 'meaning_sound', hanja: '動', prompt: '이 한자의 훈과 음은?', choices: ['움직일 동', '힘 력', '살 활', '다닐 행'], answer: '움직일 동' },
  { type: 'meaning_sound', hanja: '力', prompt: '이 한자의 훈과 음은?', choices: ['힘 력', '손 수', '마음 심', '발 족'], answer: '힘 력' },
  { type: 'meaning_sound', hanja: '空', prompt: '이 한자의 훈과 음은?', choices: ['빌 공', '하늘 천', '땅 지', '흰 백'], answer: '빌 공' },
  { type: 'meaning_sound', hanja: '記', prompt: '이 한자의 훈과 음은?', choices: ['기록할 기', '말씀 화', '글 문', '기운 기'], answer: '기록할 기' },
  { type: 'meaning_sound', hanja: '氣', prompt: '이 한자의 훈과 음은?', choices: ['기운 기', '기록할 기', '힘 력', '마음 심'], answer: '기운 기' },
  { type: 'meaning_sound', hanja: '名', prompt: '이 한자의 훈과 음은?', choices: ['이름 명', '목숨 명', '밝을 명', '백성 민'], answer: '이름 명' },
  { type: 'meaning_sound', hanja: '話', prompt: '이 한자의 훈과 음은?', choices: ['말씀 화', '물을 문', '대답 답', '기록할 기'], answer: '말씀 화' },
  { type: 'meaning_sound', hanja: '自', prompt: '이 한자의 훈과 음은?', choices: ['스스로 자', '글자 자', '아들 자', '농사 농'], answer: '스스로 자' },
  { type: 'meaning_sound', hanja: '手', prompt: '이 한자의 훈과 음은?', choices: ['손 수', '발 족', '눈 목', '귀 이'], answer: '손 수' },
  { type: 'meaning_sound', hanja: '安', prompt: '이 한자의 훈과 음은?', choices: ['편안할 안', '즐거울 락', '이름 명', '기운 기'], answer: '편안할 안' },
  { type: 'meaning_sound', hanja: '食', prompt: '이 한자의 훈과 음은?', choices: ['밥 식', '마실 음', '쌀 미', '물 수'], answer: '밥 식' },
  { type: 'meaning_sound', hanja: '電', prompt: '이 한자의 훈과 음은?', choices: ['번개 전', '비 우', '바람 풍', '구름 운'], answer: '번개 전' },
  { type: 'meaning_sound', hanja: '活', prompt: '이 한자의 훈과 음은?', choices: ['살 활', '죽을 사', '날 생', '움직일 동'], answer: '살 활' },
  { type: 'meaning_sound', hanja: '間', prompt: '이 한자의 훈과 음은?', choices: ['사이 간', '때 시', '문 문', '가운데 중'], answer: '사이 간' },
  { type: 'meaning_sound', hanja: '正', prompt: '이 한자의 훈과 음은?', choices: ['바를 정', '정할 정', '기운 기', '이름 명'], answer: '바를 정' },
  { type: 'meaning_sound', hanja: '右', prompt: '이 한자의 훈과 음은?', choices: ['오른 우', '왼 좌', '위 상', '아래 하'], answer: '오른 우' },

  // ── [43-44] 밑줄 친 말 → 한자어 ──
  { type: 'underline', sentence: '방학 때 활동을 많이 했어요.', underline: '활동', prompt: '밑줄 친 말에 해당하는 한자어는?', choices: ['活動', '行動', '活力', '動力'], answer: '活動' },
  { type: 'underline', sentence: '문이 자동으로 열렸습니다.', underline: '자동', prompt: '밑줄 친 말에 해당하는 한자어는?', choices: ['自動', '自然', '手動', '動力'], answer: '自動' },

  // ── [45-54] 훈음 → 한자 ──
  { type: 'hanja', prompt: '"강 강"에 해당하는 한자는?', hanja: null, choices: ['江', '河', '川', '海'], answer: '江' },
  { type: 'hanja', prompt: '"힘 력"에 해당하는 한자는?', hanja: null, choices: ['力', '手', '足', '工'], answer: '力' },
  { type: 'hanja', prompt: '"길 도"에 해당하는 한자는?', hanja: null, choices: ['道', '路', '街', '行'], answer: '道' },
  { type: 'hanja', prompt: '"움직일 동"에 해당하는 한자는?', hanja: null, choices: ['動', '靜', '運', '行'], answer: '動' },
  { type: 'hanja', prompt: '"빌 공"에 해당하는 한자는?', hanja: null, choices: ['空', '天', '地', '高'], answer: '空' },
  { type: 'hanja', prompt: '"기록할 기"에 해당하는 한자는?', hanja: null, choices: ['記', '話', '文', '書'], answer: '記' },
  { type: 'hanja', prompt: '"이름 명"에 해당하는 한자는?', hanja: null, choices: ['名', '命', '明', '民'], answer: '名' },
  { type: 'hanja', prompt: '"말씀 화"에 해당하는 한자는?', hanja: null, choices: ['話', '記', '道', '答'], answer: '話' },
  { type: 'hanja', prompt: '"손 수"에 해당하는 한자는?', hanja: null, choices: ['手', '足', '口', '目'], answer: '手' },
  { type: 'hanja', prompt: '"농사 농"에 해당하는 한자는?', hanja: null, choices: ['農', '場', '田', '林'], answer: '農' },

  // ── [55-56] 반대어 ──
  { type: 'opposite', hanja: '前', prompt: '뜻이 반대되는 한자는?', choices: ['後', '先', '左', '右'], answer: '後' },
  { type: 'opposite', hanja: '男', prompt: '뜻이 반대되는 한자는?', choices: ['女', '少', '弱', '下'], answer: '女' },

  // ── [57-58] 뜻 → 한자어 ──
  { type: 'meaning_to_word', prompt: '"음식을 먹는 일"을 뜻하는 한자어는?', choices: ['食事', '食堂', '食口', '間食'], answer: '食事' },
  { type: 'meaning_to_word', prompt: '"저절로 작동함"을 뜻하는 한자어는?', choices: ['自動', '活動', '動力', '手動'], answer: '自動' },

  // ── [59-60] 필순 ──
  { type: 'stroke', hanja: '活', prompt: '이 한자의 총 획수는?', choices: ['9획', '7획', '8획', '10획'], answer: '9획' },
  { type: 'stroke', hanja: '空', prompt: '이 한자의 총 획수는?', choices: ['8획', '6획', '7획', '9획'], answer: '8획' },
];

const PASS_COUNT = 42;

const TYPE_LABELS = {
  sound_sentence: '독음 (읽는 소리)',
  meaning_sound: '한자 → 훈+음',
  underline: '밑줄 → 한자어',
  hanja: '훈음 → 한자',
  opposite: '반대어 (대응어)',
  meaning_to_word: '뜻 → 한자어',
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
const GradeTest72Screen = ({ onBack, onComplete, selectedCharacter }) => {
  const currentGrade = getUnlockedGrade();
  const alreadyUnlocked = ['7급II', '7급', '6급II', '6급'].includes(currentGrade);
  const hasPrereq = currentGrade === '8급' || alreadyUnlocked;

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
  const isCompound = q?.hanja && q.hanja.length > 1;
  const isChoiceLarge = q?.type === 'hanja' || q?.type === 'opposite';
  const isChoiceMediumHanja = q?.type === 'underline' || q?.type === 'meaning_to_word';

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
      localStorage.setItem(SK.UNLOCKED_GRADE, '7급II');
    }
    if (onComplete) onComplete({ correct, total: questions.length, passed });
    onBack();
  };

  if (phase === 'intro') {
    return (
      <GradeTestIntro
        title="7급Ⅱ 인증 시험"
        subtitle={<>전국한자능력검정시험<br/>7급Ⅱ 기출 기반</>}
        total={questions.length}
        passCount={PASS_COUNT}
        focusText="독음 · 한자→훈+음 · 훈음→한자 · 반대어 · 뜻→한자어 · 필순"
        hasPrereq={hasPrereq}
        prereqText="8급 인증 시험을 먼저 통과하면 좋아요!"
        alreadyUnlocked={alreadyUnlocked}
        alreadyUnlockedText="이미 7급Ⅱ 인증이 완료되었어요!"
        onBack={onBack}
        onStart={() => setPhase('quiz')}
      />
    );
  }

  if (phase === 'quiz') {
    return (
      <div className="quiz-screen">
        <div className="quiz-header-wrap">
          <div className="quiz-header-card">
            <button onClick={onBack}
              className="flex items-center justify-center bg-white dark:bg-slate-800/90 border-2 border-white dark:border-slate-700 rounded-2xl shadow-sm active:scale-95 transition-all px-3 py-1.5 font-normal text-[#5B677A] dark:text-slate-300 text-sm gap-1 shrink-0">
              <span>←</span>
            </button>
            <div className="flex-1">
              <div className="quiz-progress-row">
                <div className="grade-test-header-title">
                  <span>7급Ⅱ 인증 시험</span>
                  <span className="grade-test-header-type">{TYPE_LABELS[q.type] || ''}</span>
                </div>
                <span>{qIndex + 1} / {questions.length}</span>
              </div>
              <QuizProgressBar current={qIndex} total={questions.length} fillColor="#6D6FF2" />
            </div>
            <span className="text-sm font-normal text-[#4A51D4] shrink-0">{correct}점</span>
          </div>
        </div>

        <div className="quiz-content-area">
          <div className="quiz-content-inner">
            <div className="grade-test-question-card">
              <p className="grade-test-prompt">{q.prompt}</p>

              {(q.type === 'sound_sentence' || q.type === 'underline') && (
                <p className="grade-test-example">
                  {renderSentence(q.sentence, q.type === 'sound_sentence' ? q.hanja : null, q.underline)}
                </p>
              )}

              {q.hanja && q.type !== 'sound_sentence' && (
                <div className={`grade-test-hanja-box ${isCompound ? 'grade-test-hanja-box--compound' : 'grade-test-hanja-box--single'}`}>
                  <span className="grade-test-hanja-char">
                    {q.hanja}
                  </span>
                </div>
              )}
            </div>

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
                    className={`quiz-choice-btn ${isChoiceLarge ? 'quiz-choice-btn--large' : isChoiceMediumHanja ? 'quiz-choice-btn--hanja' : ''} ${stateClass}`}
                  >
                    <span className="break-keep">{choice}</span>
                  </button>
                );
              })}
            </div>

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

  const passed = correct >= PASS_COUNT;
  return (
    <GradeTestResult
      passed={passed}
      correct={correct}
      total={questions.length}
      passCount={PASS_COUNT}
      grade="7급Ⅱ"
      nextGrade="7급"
      alreadyUnlocked={alreadyUnlocked}
      selectedCharacter={selectedCharacter}
      answers={answerLog}
      onRetry={() => { setPhase('intro'); setQIndex(0); setSelected(null); setRevealed(false); setCorrect(0); setAnswerLog([]); }}
      onFinish={handleFinish}
    />
  );
};

export default GradeTest72Screen;
