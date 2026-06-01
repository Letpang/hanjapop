import { useState, useEffect, useRef } from 'react';
import { SK } from '../constants/storageKeys.js';
import GradeTestIntro from './common/GradeTestIntro.jsx';
import GradeTestResult from './common/GradeTestResult.jsx';

// ─── 7급 기출 기반 문제 (111회·112회) — 70문항 ───────────────────────────────
const QUESTIONS = [
  // ── [1-32] 독음: 문장 속 한자어 읽기 ──
  { type: 'sound_sentence', sentence: '(千秋) 에 남을 이름을 남겨요.', hanja: '千秋', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['천추', '춘추', '천년', '추계'], answer: '천추' },
  { type: 'sound_sentence', sentence: '(住所) 를 적어주세요.', hanja: '住所', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['주소', '주택', '거소', '소재'], answer: '주소' },
  { type: 'sound_sentence', sentence: '(生命) 은 소중해요.', hanja: '生命', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['생명', '명령', '생존', '명칭'], answer: '생명' },
  { type: 'sound_sentence', sentence: '(秋夕) 에 고향에 가요.', hanja: '秋夕', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['추석', '하지', '석양', '추분'], answer: '추석' },
  { type: 'sound_sentence', sentence: '주인공이 (登場) 했어요.', hanja: '登場', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['등장', '출장', '입장', '등산'], answer: '등장' },
  { type: 'sound_sentence', sentence: '(休日) 에는 집에서 쉬어요.', hanja: '休日', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['휴일', '평일', '공휴', '주일'], answer: '휴일' },
  { type: 'sound_sentence', sentence: '(靑春) 은 두 번 오지 않아요.', hanja: '靑春', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['청춘', '청년', '봄날', '청명'], answer: '청춘' },
  { type: 'sound_sentence', sentence: '(百年) 의 역사를 자랑해요.', hanja: '百年', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['백년', '천년', '백일', '만년'], answer: '백년' },
  { type: 'sound_sentence', sentence: '(天下) 에 이런 곳은 없어요.', hanja: '天下', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['천하', '하천', '천지', '지하'], answer: '천하' },
  { type: 'sound_sentence', sentence: '(生活) 이 많이 바뀌었어요.', hanja: '生活', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['생활', '활동', '생기', '활발'], answer: '생활' },
  { type: 'sound_sentence', sentence: '(時間) 이 금이에요.', hanja: '時間', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['시간', '시절', '시대', '기간'], answer: '시간' },
  { type: 'sound_sentence', sentence: '(春秋) 는 공자의 역사서예요.', hanja: '春秋', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['춘추', '추분', '춘분', '동지'], answer: '춘추' },
  { type: 'sound_sentence', sentence: '(海水) 욕장이 가까워요.', hanja: '海水', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['해수', '수해', '해양', '수면'], answer: '해수' },
  { type: 'sound_sentence', sentence: '(地下) 철을 타고 왔어요.', hanja: '地下', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['지하', '지상', '하지', '지면'], answer: '지하' },
  { type: 'sound_sentence', sentence: '(草原) 에서 말이 달려요.', hanja: '草原', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['초원', '원초', '초목', '초지'], answer: '초원' },
  { type: 'sound_sentence', sentence: '(住民) 센터에서 서류를 발급해요.', hanja: '住民', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['주민', '주택', '민주', '시민'], answer: '주민' },
  { type: 'sound_sentence', sentence: '(命令) 에 따라 행동해요.', hanja: '命令', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['명령', '호령', '지령', '명칭'], answer: '명령' },
  { type: 'sound_sentence', sentence: '자수하고 (光明) 을 찾아요.', hanja: '光明', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['광명', '광채', '광경', '광선'], answer: '광명' },
  { type: 'sound_sentence', sentence: '(竹林) 사이로 바람이 불어요.', hanja: '竹林', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['죽림', '산림', '죽순', '대림'], answer: '죽림' },
  { type: 'sound_sentence', sentence: '(天地) 가 개벽한 것 같아요.', hanja: '天地', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['천지', '대지', '천하', '지상'], answer: '천지' },
  { type: 'sound_sentence', sentence: '(登山) 을 즐겨요.', hanja: '登山', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['등산', '산행', '등정', '하산'], answer: '등산' },
  { type: 'sound_sentence', sentence: '(年度) 말에 결산해요.', hanja: '年度', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['연도', '연간', '학년', '연말'], answer: '연도' },
  { type: 'sound_sentence', sentence: '(出入) 을 금지해요.', hanja: '出入', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['출입', '출발', '출구', '입구'], answer: '출입' },
  { type: 'sound_sentence', sentence: '(草木) 이 우거진 산이에요.', hanja: '草木', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['초목', '목초', '수목', '화초'], answer: '초목' },
  { type: 'sound_sentence', sentence: '(田園) 생활이 여유로워요.', hanja: '田園', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['전원', '원전', '농지', '전지'], answer: '전원' },
  { type: 'sound_sentence', sentence: '(冬季) 올림픽을 응원해요.', hanja: '冬季', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['동계', '하계', '춘계', '추계'], answer: '동계' },
  { type: 'sound_sentence', sentence: '(村落) 에서 오래 살았어요.', hanja: '村落', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['촌락', '부락', '촌민', '농촌'], answer: '촌락' },
  { type: 'sound_sentence', sentence: '(海上) 에서 바라보는 일출이에요.', hanja: '海上', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['해상', '상해', '해하', '해저'], answer: '해상' },
  { type: 'sound_sentence', sentence: '(生年) 月日을 적어주세요.', hanja: '生年', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['생년', '생일', '출생', '연도'], answer: '생년' },
  { type: 'sound_sentence', sentence: '(千里) 길도 한 걸음부터예요.', hanja: '千里', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['천리', '만리', '천년', '백리'], answer: '천리' },
  { type: 'sound_sentence', sentence: '(夏服) 으로 갈아입었어요.', hanja: '夏服', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['하복', '동복', '하계', '춘복'], answer: '하복' },
  { type: 'sound_sentence', sentence: '(休學) 을 신청했어요.', hanja: '休學', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['휴학', '복학', '휴식', '등교'], answer: '휴학' },

  // ── [33-34] 밑줄 친 말 → 한자어 ──
  { type: 'underline', sentence: '봄에는 등산을 많이 해요.', underline: '등산', prompt: '밑줄 친 말에 해당하는 한자어는?', choices: ['登山', '登場', '出山', '山行'], answer: '登山' },
  { type: 'underline', sentence: '그곳의 생활은 단순해요.', underline: '생활', prompt: '밑줄 친 말에 해당하는 한자어는?', choices: ['生活', '生命', '活動', '生氣'], answer: '生活' },

  // ── [35-54] 한자 → 훈+음 ──
  { type: 'meaning_sound', hanja: '春', prompt: '이 한자의 훈과 음은?', choices: ['봄 춘', '여름 하', '가을 추', '겨울 동'], answer: '봄 춘' },
  { type: 'meaning_sound', hanja: '夏', prompt: '이 한자의 훈과 음은?', choices: ['여름 하', '봄 춘', '가을 추', '겨울 동'], answer: '여름 하' },
  { type: 'meaning_sound', hanja: '秋', prompt: '이 한자의 훈과 음은?', choices: ['가을 추', '봄 춘', '여름 하', '겨울 동'], answer: '가을 추' },
  { type: 'meaning_sound', hanja: '冬', prompt: '이 한자의 훈과 음은?', choices: ['겨울 동', '봄 춘', '여름 하', '가을 추'], answer: '겨울 동' },
  { type: 'meaning_sound', hanja: '千', prompt: '이 한자의 훈과 음은?', choices: ['일천 천', '일백 백', '일만 만', '열 십'], answer: '일천 천' },
  { type: 'meaning_sound', hanja: '百', prompt: '이 한자의 훈과 음은?', choices: ['일백 백', '일천 천', '일만 만', '열 십'], answer: '일백 백' },
  { type: 'meaning_sound', hanja: '時', prompt: '이 한자의 훈과 음은?', choices: ['때 시', '날 일', '해 년', '사이 간'], answer: '때 시' },
  { type: 'meaning_sound', hanja: '年', prompt: '이 한자의 훈과 음은?', choices: ['해 년', '달 월', '날 일', '때 시'], answer: '해 년' },
  { type: 'meaning_sound', hanja: '生', prompt: '이 한자의 훈과 음은?', choices: ['날 생', '죽을 사', '살 활', '나갈 출'], answer: '날 생' },
  { type: 'meaning_sound', hanja: '命', prompt: '이 한자의 훈과 음은?', choices: ['목숨 명', '이름 명', '날 생', '죽을 사'], answer: '목숨 명' },
  { type: 'meaning_sound', hanja: '住', prompt: '이 한자의 훈과 음은?', choices: ['살 주', '살 활', '살 거', '땅 지'], answer: '살 주' },
  { type: 'meaning_sound', hanja: '登', prompt: '이 한자의 훈과 음은?', choices: ['오를 등', '아래 하', '나갈 출', '들 입'], answer: '오를 등' },
  { type: 'meaning_sound', hanja: '休', prompt: '이 한자의 훈과 음은?', choices: ['쉴 휴', '편안할 안', '움직일 동', '살 주'], answer: '쉴 휴' },
  { type: 'meaning_sound', hanja: '海', prompt: '이 한자의 훈과 음은?', choices: ['바다 해', '강 강', '메 산', '하늘 천'], answer: '바다 해' },
  { type: 'meaning_sound', hanja: '天', prompt: '이 한자의 훈과 음은?', choices: ['하늘 천', '땅 지', '메 산', '바다 해'], answer: '하늘 천' },
  { type: 'meaning_sound', hanja: '地', prompt: '이 한자의 훈과 음은?', choices: ['땅 지', '하늘 천', '메 산', '내 천'], answer: '땅 지' },
  { type: 'meaning_sound', hanja: '草', prompt: '이 한자의 훈과 음은?', choices: ['풀 초', '나무 목', '꽃 화', '대 죽'], answer: '풀 초' },
  { type: 'meaning_sound', hanja: '老', prompt: '이 한자의 훈과 음은?', choices: ['늙을 로', '마을 리', '길 로', '아침 조'], answer: '늙을 로' },
  { type: 'meaning_sound', hanja: '同', prompt: '이 한자의 훈과 음은?', choices: ['한가지 동', '동녘 동', '겨울 동', '골 동'], answer: '한가지 동' },
  { type: 'meaning_sound', hanja: '林', prompt: '이 한자의 훈과 음은?', choices: ['수풀 림', '나무 목', '대 죽', '메 산'], answer: '수풀 림' },

  // ── [55-64] 훈음 → 한자 ──
  { type: 'hanja', prompt: '"봄 춘"에 해당하는 한자는?', hanja: null, choices: ['春', '夏', '秋', '冬'], answer: '春' },
  { type: 'hanja', prompt: '"하늘 천"에 해당하는 한자는?', hanja: null, choices: ['天', '地', '川', '林'], answer: '天' },
  { type: 'hanja', prompt: '"살 주"에 해당하는 한자는?', hanja: null, choices: ['住', '所', '村', '里'], answer: '住' },
  { type: 'hanja', prompt: '"오를 등"에 해당하는 한자는?', hanja: null, choices: ['登', '出', '入', '來'], answer: '登' },
  { type: 'hanja', prompt: '"풀 초"에 해당하는 한자는?', hanja: null, choices: ['草', '花', '林', '色'], answer: '草' },
  { type: 'hanja', prompt: '"바다 해"에 해당하는 한자는?', hanja: null, choices: ['海', '江', '川', '湖'], answer: '海' },
  { type: 'hanja', prompt: '"겨울 동"에 해당하는 한자는?', hanja: null, choices: ['冬', '春', '夏', '秋'], answer: '冬' },
  { type: 'hanja', prompt: '"꽃 화"에 해당하는 한자는?', hanja: null, choices: ['花', '草', '林', '木'], answer: '花' },
  { type: 'hanja', prompt: '"일천 천"에 해당하는 한자는?', hanja: null, choices: ['千', '百', '萬', '十'], answer: '千' },
  { type: 'hanja', prompt: '"쉴 휴"에 해당하는 한자는?', hanja: null, choices: ['休', '安', '宿', '眠'], answer: '休' },

  // ── [65-66] 반대어 ──
  { type: 'opposite', hanja: '出', prompt: '뜻이 반대되는 한자는?', choices: ['入', '來', '登', '下'], answer: '入' },
  { type: 'opposite', hanja: '上', prompt: '뜻이 반대되는 한자는?', choices: ['下', '左', '右', '東'], answer: '下' },

  // ── [67-68] 뜻 → 한자어 ──
  { type: 'meaning_to_word', prompt: '"산에 올라가는 일"을 뜻하는 한자어는?', choices: ['登山', '出山', '入山', '下山'], answer: '登山' },
  { type: 'meaning_to_word', prompt: '"봄과 가을"을 뜻하는 한자어는?', choices: ['春秋', '春夏', '夏秋', '秋冬'], answer: '春秋' },

  // ── [69-70] 필순 ──
  { type: 'stroke', hanja: '春', prompt: '이 한자의 총 획수는?', choices: ['9획', '7획', '8획', '10획'], answer: '9획' },
  { type: 'stroke', hanja: '所', prompt: '이 한자의 총 획수는?', choices: ['8획', '6획', '7획', '9획'], answer: '8획' },
];

const PASS_COUNT = 49;

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
        <span className="font-black underline decoration-2 underline-offset-2">{underline}</span>
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
const GradeTest7Screen = ({ onBack, onComplete, selectedCharacter }) => {
  const currentGrade = getUnlockedGrade();
  const alreadyUnlocked = ['7급', '6급II', '6급'].includes(currentGrade);
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
  const isCompound = q?.hanja && q.hanja.length > 1;
  const isChoiceLarge = q?.type === 'hanja' || q?.type === 'opposite';
  const isChoiceMediumHanja = q?.type === 'underline' || q?.type === 'meaning_to_word';

  const handleSelect = (choice) => {
    if (selected !== null) return;
    const isCorrect = choice === q.answer;
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
      localStorage.setItem(SK.UNLOCKED_GRADE, '7급');
    }
    if (onComplete) onComplete({ correct, total: questions.length, passed });
    onBack();
  };

  if (phase === 'intro') {
    return (
      <GradeTestIntro
        title="7급 인증 시험"
        subtitle={<>전국한자능력검정시험<br/>7급 기출 기반</>}
        total={questions.length}
        passCount={PASS_COUNT}
        focusText="독음 · 한자→훈+음 · 훈음→한자 · 반대어 · 뜻→한자어 · 필순"
        hasPrereq={hasPrereq}
        prereqText="7급Ⅱ 인증 시험을 먼저 통과하면 좋아요!"
        alreadyUnlocked={alreadyUnlocked}
        alreadyUnlockedText="이미 7급 인증이 완료되었어요!"
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
              className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-sm active:scale-95 transition-all px-3 py-1.5 font-black text-[#5B677A] text-sm gap-1 shrink-0">
              <span>←</span>
            </button>
            <div className="flex-1">
              <div className="quiz-progress-row">
                <span>7급 인증 시험</span>
                <span>{qIndex + 1} / {questions.length}</span>
              </div>
              <div className="quiz-progress-track">
                <div className="quiz-progress-fill" style={{ width: `${progress}%`, backgroundColor: '#6D6FF2' }} />
              </div>
            </div>
            <span className="text-sm font-extrabold text-[#4A51D4] shrink-0">{correct}점</span>
          </div>
        </div>

        <div className="quiz-content-area">
          <div className="quiz-content-inner">
            <div className="grade-test-question-card">
              <span className="grade-test-type-label">
                {TYPE_LABELS[q.type] || ''}
              </span>
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
                    {choice}
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
      grade="7급"
      nextGrade="6급Ⅱ"
      alreadyUnlocked={alreadyUnlocked}
      selectedCharacter={selectedCharacter}
      onRetry={() => { setPhase('intro'); setQIndex(0); setSelected(null); setRevealed(false); setCorrect(0); }}
      onFinish={handleFinish}
    />
  );
};

export default GradeTest7Screen;
