import { useState } from 'react';
import { SK } from '../constants/storageKeys.js';
import { playSound } from '../utils/playSound.js';
import GradeTestIntro from './common/GradeTestIntro.jsx';
import GradeTestResult from './common/GradeTestResult.jsx';

// ─── 7급 기출 기반 문제 (111회·112회) — 70문항 ───────────────────────────────
const QUESTIONS = [
  // ── [1-32] 독음: 문장 속 한자어 읽기 ──
  { type: 'sound_sentence', sentence: '(千秋) 에 남을 이름을 남겨요.', hanja: '千秋', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['천추', '춘추', '천년', '추계'], answer: '천추' },
  { type: 'sound_sentence', sentence: '(住所) 를 적어주세요.', hanja: '住所', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['주소', '주택', '거소', '소재'], answer: '주소' },
  { type: 'sound_sentence', sentence: '(生命) 은 소중해요.', hanja: '生命', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['생명', '명령', '생존', '명칭'], answer: '생명' },
  { type: 'sound_sentence', sentence: '(秋夕) 에 고향에 가요.', hanja: '秋夕', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['추석', '하지', '석양', '추분'], answer: '추석' },
  { type: 'sound_sentence', sentence: '주인공이 (登場) 했어요.', hanja: '登場', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['등장', '출장', '입장', '등산'], answer: '등장' },
  { type: 'sound_sentence', sentence: '(休日) 에는 집에서 쉬어요.', hanja: '休日', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['휴일', '평일', '공휴', '주일'], answer: '휴일' },
  { type: 'sound_sentence', sentence: '(靑春) 은 두 번 오지 않아요.', hanja: '靑春', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['청춘', '청년', '봄날', '청명'], answer: '청춘' },
  { type: 'sound_sentence', sentence: '(百年) 의 역사를 자랑해요.', hanja: '百年', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['백년', '천년', '백일', '만년'], answer: '백년' },
  { type: 'sound_sentence', sentence: '(天下) 에 이런 곳은 없어요.', hanja: '天下', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['천하', '하천', '천지', '지하'], answer: '천하' },
  { type: 'sound_sentence', sentence: '(生活) 이 많이 바뀌었어요.', hanja: '生活', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['생활', '활동', '생기', '활발'], answer: '생활' },
  { type: 'sound_sentence', sentence: '(時間) 이 금이에요.', hanja: '時間', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['시간', '간시', '시대', '기간'], answer: '시간' },
  { type: 'sound_sentence', sentence: '(春秋) 는 공자의 역사서예요.', hanja: '春秋', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['춘추', '추춘', '춘하', '하추'], answer: '춘추' },
  { type: 'sound_sentence', sentence: '(海水) 욕장이 가까워요.', hanja: '海水', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['해수', '수해', '해양', '수면'], answer: '해수' },
  { type: 'sound_sentence', sentence: '(地下) 철을 타고 왔어요.', hanja: '地下', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['지하', '지상', '하지', '지면'], answer: '지하' },
  { type: 'sound_sentence', sentence: '(草原) 에서 말이 달려요.', hanja: '草原', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['초원', '원초', '초목', '야원'], answer: '초원' },
  { type: 'sound_sentence', sentence: '(住民) 센터에서 서류를 발급해요.', hanja: '住民', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['주민', '주택', '민주', '시민'], answer: '주민' },
  { type: 'sound_sentence', sentence: '(命令) 에 따라 행동해요.', hanja: '命令', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['명령', '령명', '지령', '명칭'], answer: '명령' },
  { type: 'sound_sentence', sentence: '(光明) 한 미래를 꿈꿔요.', hanja: '光明', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['광명', '명광', '광채', '빛명'], answer: '광명' },
  { type: 'sound_sentence', sentence: '(竹林) 사이로 바람이 불어요.', hanja: '竹林', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['죽림', '림죽', '대림', '죽자'], answer: '죽림' },
  { type: 'sound_sentence', sentence: '(天地) 가 개벽한 것 같아요.', hanja: '天地', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['천지', '지천', '천하', '지상'], answer: '천지' },
  { type: 'sound_sentence', sentence: '(登山) 을 즐겨요.', hanja: '登山', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['등산', '산행', '등정', '산등'], answer: '등산' },
  { type: 'sound_sentence', sentence: '(年度) 말에 결산해요.', hanja: '年度', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['연도', '도년', '년간', '해년'], answer: '연도' },
  { type: 'sound_sentence', sentence: '(出入) 을 금지해요.', hanja: '出入', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['출입', '입출', '출구', '입구'], answer: '출입' },
  { type: 'sound_sentence', sentence: '(草木) 이 우거진 산이에요.', hanja: '草木', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['초목', '목초', '수목', '화초'], answer: '초목' },
  { type: 'sound_sentence', sentence: '(田園) 생활이 여유로워요.', hanja: '田園', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['전원', '원전', '논밭', '전지'], answer: '전원' },
  { type: 'sound_sentence', sentence: '(冬季) 올림픽을 응원해요.', hanja: '冬季', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['동계', '하계', '춘계', '추계'], answer: '동계' },
  { type: 'sound_sentence', sentence: '(村落) 에서 오래 살았어요.', hanja: '村落', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['촌락', '락촌', '촌민', '마을락'], answer: '촌락' },
  { type: 'sound_sentence', sentence: '(海上) 에서 바라보는 일출이에요.', hanja: '海上', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['해상', '상해', '해하', '해저'], answer: '해상' },
  { type: 'sound_sentence', sentence: '(生年) 月日을 적어주세요.', hanja: '生年', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['생년', '연생', '생일', '년생'], answer: '생년' },
  { type: 'sound_sentence', sentence: '(千里) 길도 한 걸음부터예요.', hanja: '千里', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['천리', '만리', '천년', '리천'], answer: '천리' },
  { type: 'sound_sentence', sentence: '(夏日) 의 뜨거운 햇볕이에요.', hanja: '夏日', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['하일', '춘일', '동일', '추일'], answer: '하일' },
  { type: 'sound_sentence', sentence: '(休學) 을 신청했어요.', hanja: '休學', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['휴학', '학휴', '휴식', '복학'], answer: '휴학' },

  // ── [33-34] 밑줄 친 말 → 漢字語 ──
  { type: 'underline', sentence: '봄에는 등산을 많이 해요.', underline: '등산', prompt: '밑줄 친 말에 해당하는 漢字語는?', choices: ['登山', '登場', '出山', '山行'], answer: '登山' },
  { type: 'underline', sentence: '그곳의 생활은 단순해요.', underline: '생활', prompt: '밑줄 친 말에 해당하는 漢字語는?', choices: ['生活', '生命', '活動', '生氣'], answer: '生活' },

  // ── [35-54] 한자 → 훈+음 ──
  { type: 'meaning_sound', hanja: '春', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['봄 춘', '여름 춘', '봄 하', '가을 춘'], answer: '봄 춘' },
  { type: 'meaning_sound', hanja: '夏', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['여름 하', '봄 하', '여름 동', '가을 하'], answer: '여름 하' },
  { type: 'meaning_sound', hanja: '秋', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['가을 추', '봄 추', '가을 하', '겨울 추'], answer: '가을 추' },
  { type: 'meaning_sound', hanja: '冬', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['겨울 동', '봄 동', '겨울 하', '가을 동'], answer: '겨울 동' },
  { type: 'meaning_sound', hanja: '千', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['일천 천', '일백 천', '일천 백', '일만 천'], answer: '일천 천' },
  { type: 'meaning_sound', hanja: '百', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['일백 백', '일천 백', '일백 천', '일만 백'], answer: '일백 백' },
  { type: 'meaning_sound', hanja: '時', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['때 시', '집 시', '때 간', '해 시'], answer: '때 시' },
  { type: 'meaning_sound', hanja: '年', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['해 년', '날 년', '해 세', '달 년'], answer: '해 년' },
  { type: 'meaning_sound', hanja: '生', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['날 생', '죽을 생', '날 사', '살 생'], answer: '날 생' },
  { type: 'meaning_sound', hanja: '命', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['목숨 명', '이름 명', '목숨 생', '힘 명'], answer: '목숨 명' },
  { type: 'meaning_sound', hanja: '住', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['살 주', '먹을 주', '살 거', '머물 주'], answer: '살 주' },
  { type: 'meaning_sound', hanja: '登', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['오를 등', '내릴 등', '오를 산', '달릴 등'], answer: '오를 등' },
  { type: 'meaning_sound', hanja: '休', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['쉴 휴', '일할 휴', '쉴 안', '자를 휴'], answer: '쉴 휴' },
  { type: 'meaning_sound', hanja: '海', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['바다 해', '강 해', '바다 강', '호수 해'], answer: '바다 해' },
  { type: 'meaning_sound', hanja: '天', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['하늘 천', '땅 천', '하늘 지', '산 천'], answer: '하늘 천' },
  { type: 'meaning_sound', hanja: '地', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['땅 지', '하늘 지', '땅 천', '산 지'], answer: '땅 지' },
  { type: 'meaning_sound', hanja: '草', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['풀 초', '꽃 초', '풀 화', '나무 초'], answer: '풀 초' },
  { type: 'meaning_sound', hanja: '竹', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['대 죽', '나무 죽', '대 목', '풀 죽'], answer: '대 죽' },
  { type: 'meaning_sound', hanja: '光', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['빛 광', '어둠 광', '빛 명', '불 광'], answer: '빛 광' },
  { type: 'meaning_sound', hanja: '林', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['수풀 림', '나무 림', '수풀 목', '숲 산'], answer: '수풀 림' },

  // ── [55-64] 훈음 → 한자 ──
  { type: 'hanja', prompt: '"봄 춘"에 해당하는 한자는?', hanja: null, choices: ['春', '夏', '秋', '冬'], answer: '春' },
  { type: 'hanja', prompt: '"하늘 천"에 해당하는 한자는?', hanja: null, choices: ['天', '地', '川', '林'], answer: '天' },
  { type: 'hanja', prompt: '"살 주"에 해당하는 한자는?', hanja: null, choices: ['住', '所', '村', '里'], answer: '住' },
  { type: 'hanja', prompt: '"오를 등"에 해당하는 한자는?', hanja: null, choices: ['登', '出', '入', '來'], answer: '登' },
  { type: 'hanja', prompt: '"풀 초"에 해당하는 한자는?', hanja: null, choices: ['草', '花', '林', '色'], answer: '草' },
  { type: 'hanja', prompt: '"바다 해"에 해당하는 한자는?', hanja: null, choices: ['海', '江', '川', '湖'], answer: '海' },
  { type: 'hanja', prompt: '"겨울 동"에 해당하는 한자는?', hanja: null, choices: ['冬', '春', '夏', '秋'], answer: '冬' },
  { type: 'hanja', prompt: '"빛 광"에 해당하는 한자는?', hanja: null, choices: ['光', '明', '火', '色'], answer: '光' },
  { type: 'hanja', prompt: '"일천 천"에 해당하는 한자는?', hanja: null, choices: ['千', '百', '萬', '十'], answer: '千' },
  { type: 'hanja', prompt: '"쉴 휴"에 해당하는 한자는?', hanja: null, choices: ['休', '安', '宿', '眠'], answer: '休' },

  // ── [65-66] 반대어 ──
  { type: 'opposite', hanja: '天', prompt: '다음 한자의 대응어(반대어)는?', choices: ['地', '山', '川', '空'], answer: '地' },
  { type: 'opposite', hanja: '生', prompt: '다음 한자의 대응어(반대어)는?', choices: ['死', '老', '長', '高'], answer: '死' },

  // ── [67-68] 뜻 → 한자어 ──
  { type: 'meaning_to_word', prompt: '"산에 올라가는 일"을 뜻하는 漢字語는?', choices: ['登山', '出山', '入山', '下山'], answer: '登山' },
  { type: 'meaning_to_word', prompt: '"봄과 가을"을 뜻하는 漢字語는?', choices: ['春秋', '春夏', '夏秋', '秋冬'], answer: '春秋' },

  // ── [69-70] 필순 ──
  { type: 'stroke', hanja: '春', prompt: '다음 한자의 총 획수는?', choices: ['9획', '7획', '8획', '10획'], answer: '9획' },
  { type: 'stroke', hanja: '海', prompt: '다음 한자의 총 획수는?', choices: ['10획', '8획', '9획', '11획'], answer: '10획' },
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
        return [...acc, part, <span key={i} className="inline-block bg-[#EEF1FF] text-[#6D6FF2] font-black px-1.5 py-0 rounded-lg mx-0.5">{hanja}</span>];
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
    if (revealed) return;
    const isCorrect = choice === q.answer;
    setSelected(choice);
    setRevealed(true);
    if (isCorrect) {
      setCorrect(c => c + 1);
      playSound('match');
    } else {
      playSound('mismatch');
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
        subtitle="전국한자능력검정시험 7급 기출 기반"
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
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: '#6D6FF2' }} />
              </div>
            </div>
            <span className="text-sm font-extrabold text-[#4A51D4] shrink-0">{correct}점</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-between px-5 pb-8 overflow-y-auto">
          <div className="w-full max-w-md flex flex-col items-center gap-5 pt-2">
            <div className="w-full bg-white rounded-[2rem] border-4 border-white p-4 flex flex-col items-center gap-3" style={{ boxShadow: '0 16px 40px rgba(120,130,160,0.10)' }}>
              <span className="text-xs font-extrabold text-[#AEB7C5] uppercase tracking-widest">
                {TYPE_LABELS[q.type] || ''}
              </span>
              <p className="text-h3 text-center" style={{ color: '#2F3545', fontWeight: 800, lineHeight: 1.18 }}>{q.prompt}</p>

              {(q.type === 'sound_sentence' || q.type === 'underline') && (
                <p className="text-body font-bold text-center text-[#3C3C3C] leading-relaxed bg-[#F8FAFC] rounded-2xl px-4 py-3 w-full">
                  {renderSentence(q.sentence, q.type === 'sound_sentence' ? q.hanja : null, q.underline)}
                </p>
              )}

              {q.hanja && q.type !== 'sound_sentence' && (
                <div className={`bg-[#F8FAF9] rounded-[1.5rem] border border-[#E9EDF2] flex items-center justify-center shadow-inner ${isCompound ? 'w-40 h-20' : 'w-24 h-24'}`}>
                  <span className="font-bold text-[#3C3C3C]" style={{ fontSize: isCompound ? '2.5rem' : '3.5rem', fontFamily: 'serif' }}>
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
                    style={
                      isChoiceLarge
                        ? { ...btnStyle, fontSize: '1.75rem', fontFamily: 'serif' }
                        : isChoiceMediumHanja
                        ? { ...btnStyle, fontSize: '1.25rem', fontFamily: 'serif' }
                        : { ...btnStyle, fontSize: '1.05rem' }
                    }
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
