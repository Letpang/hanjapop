import { useState } from 'react';
import { SK } from '../constants/storageKeys.js';
import { playSound } from '../utils/playSound.js';
import GradeTestIntro from './common/GradeTestIntro.jsx';
import GradeTestResult from './common/GradeTestResult.jsx';

// ─── 6급II 기출 기반 문제 (111회·112회) — 80문항 ─────────────────────────────
const QUESTIONS = [
  // ── [1-32] 독음: 문장 속 한자어 읽기 ──
  { type: 'sound_sentence', sentence: '(成功) 을 위해 열심히 노력해요.', hanja: '成功', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['성공', '실패', '성적', '공부'], answer: '성공' },
  { type: 'sound_sentence', sentence: '(發明) 가는 세상을 바꿔요.', hanja: '發明', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['발명', '발표', '발견', '발전'], answer: '발명' },
  { type: 'sound_sentence', sentence: '(各界) 의 인사들이 모였어요.', hanja: '各界', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['각계', '각국', '계급', '각도'], answer: '각계' },
  { type: 'sound_sentence', sentence: '(新聞) 을 매일 읽어요.', hanja: '新聞', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['신문', '신식', '소식', '신호'], answer: '신문' },
  { type: 'sound_sentence', sentence: '(幸運) 을 빌어요.', hanja: '幸運', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['행운', '행복', '운명', '행사'], answer: '행운' },
  { type: 'sound_sentence', sentence: '(反省) 하는 시간이 필요해요.', hanja: '反省', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['반성', '반대', '성격', '반응'], answer: '반성' },
  { type: 'sound_sentence', sentence: '(高速) 도로가 막혀요.', hanja: '高速', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['고속', '고급', '속도', '급행'], answer: '고속' },
  { type: 'sound_sentence', sentence: '(近代) 역사를 공부해요.', hanja: '近代', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['근대', '현대', '고대', '근거'], answer: '근대' },
  { type: 'sound_sentence', sentence: '(感謝) 의 마음을 전해요.', hanja: '感謝', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['감사', '감동', '사과', '감정'], answer: '감사' },
  { type: 'sound_sentence', sentence: '(科學) 기술이 발전했어요.', hanja: '科學', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['과학', '과목', '학과', '과거'], answer: '과학' },
  { type: 'sound_sentence', sentence: '(果實) 이 탐스러워요.', hanja: '果實', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['과실', '과수', '실과', '열매'], answer: '과실' },
  { type: 'sound_sentence', sentence: '(球場) 에서 야구를 봐요.', hanja: '球場', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['구장', '운동장', '구기', '장구'], answer: '구장' },
  { type: 'sound_sentence', sentence: '(急行) 열차를 탔어요.', hanja: '急行', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['급행', '급속', '행급', '특급'], answer: '급행' },
  { type: 'sound_sentence', sentence: '(始作) 이 반이에요.', hanja: '始作', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['시작', '작시', '시초', '출발'], answer: '시작' },
  { type: 'sound_sentence', sentence: '(信念) 이 강한 사람이에요.', hanja: '信念', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['신념', '신뢰', '념신', '신조'], answer: '신념' },
  { type: 'sound_sentence', sentence: '(根本) 부터 해결해야 해요.', hanja: '根本', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['근본', '본근', '근거', '본질'], answer: '근본' },
  { type: 'sound_sentence', sentence: '(算數) 문제를 풀었어요.', hanja: '算數', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['산수', '수산', '계산', '수학'], answer: '산수' },
  { type: 'sound_sentence', sentence: '(分別) 있는 행동을 해요.', hanja: '分別', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['분별', '별분', '구별', '분리'], answer: '분별' },
  { type: 'sound_sentence', sentence: '(事件) 이 발생했어요.', hanja: '事件', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['사건', '건사', '사고', '사태'], answer: '사건' },
  { type: 'sound_sentence', sentence: '(植物) 원에 갔어요.', hanja: '植物', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['식물', '물식', '식물원', '생물'], answer: '식물' },
  { type: 'sound_sentence', sentence: '(世界) 여행을 꿈꿔요.', hanja: '世界', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['세계', '계세', '세상', '지구'], answer: '세계' },
  { type: 'sound_sentence', sentence: '(開始) 신호가 울렸어요.', hanja: '開始', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['개시', '시개', '개통', '출발'], answer: '개시' },
  { type: 'sound_sentence', sentence: '(强力) 한 바람이 불어요.', hanja: '强力', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['강력', '역강', '강풍', '힘력'], answer: '강력' },
  { type: 'sound_sentence', sentence: '(古代) 유적을 발견했어요.', hanja: '古代', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['고대', '대고', '고전', '고풍'], answer: '고대' },
  { type: 'sound_sentence', sentence: '(考試) 준비를 열심히 해요.', hanja: '考試', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['고시', '시고', '시험', '고사'], answer: '고시' },
  { type: 'sound_sentence', sentence: '(法院) 에서 재판이 열려요.', hanja: '法院', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['법원', '원법', '법정', '법률'], answer: '법원' },
  { type: 'sound_sentence', sentence: '(別世) 하신 분을 기리어요.', hanja: '別世', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['별세', '세별', '별거', '별도'], answer: '별세' },
  { type: 'sound_sentence', sentence: '(身體) 가 건강해야 해요.', hanja: '身體', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['신체', '체신', '몸체', '체격'], answer: '신체' },
  { type: 'sound_sentence', sentence: '(期間) 내에 완성해야 해요.', hanja: '期間', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['기간', '간기', '기한', '기일'], answer: '기간' },
  { type: 'sound_sentence', sentence: '(高山) 지대에는 눈이 많아요.', hanja: '高山', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['고산', '산고', '고지', '고원'], answer: '고산' },
  { type: 'sound_sentence', sentence: '(各種) 요리를 만들어요.', hanja: '各種', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['각종', '종각', '종류', '각색'], answer: '각종' },
  { type: 'sound_sentence', sentence: '(旗手) 가 앞장서요.', hanja: '旗手', prompt: '다음 문장 속 漢字語의 읽는 소리는?', choices: ['기수', '수기', '기함', '선두'], answer: '기수' },

  // ── [33-61] 한자 → 훈+음 ──
  { type: 'meaning_sound', hanja: '成', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['이룰 성', '실패 성', '이룰 공', '만들 성'], answer: '이룰 성' },
  { type: 'meaning_sound', hanja: '功', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['공 공', '힘 공', '공 로', '이룰 공'], answer: '공 공' },
  { type: 'meaning_sound', hanja: '各', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['각각 각', '모두 각', '각각 종', '사람 각'], answer: '각각 각' },
  { type: 'meaning_sound', hanja: '幸', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['다행 행', '불행 행', '다행 운', '기쁠 행'], answer: '다행 행' },
  { type: 'meaning_sound', hanja: '反', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['돌이킬 반', '돌아볼 반', '돌이킬 정', '순할 반'], answer: '돌이킬 반' },
  { type: 'meaning_sound', hanja: '高', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['높을 고', '낮을 고', '높을 대', '작을 고'], answer: '높을 고' },
  { type: 'meaning_sound', hanja: '近', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['가까울 근', '멀 근', '가까울 원', '작을 근'], answer: '가까울 근' },
  { type: 'meaning_sound', hanja: '感', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['느낄 감', '볼 감', '느낄 각', '생각 감'], answer: '느낄 감' },
  { type: 'meaning_sound', hanja: '科', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['과목 과', '학교 과', '과목 목', '배울 과'], answer: '과목 과' },
  { type: 'meaning_sound', hanja: '果', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['실과 과', '채소 과', '실과 나', '뿌리 과'], answer: '실과 과' },
  { type: 'meaning_sound', hanja: '球', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['공 구', '땅 구', '공 원', '둥글 구'], answer: '공 구' },
  { type: 'meaning_sound', hanja: '急', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['급할 급', '느릴 급', '급할 속', '빠를 급'], answer: '급할 급' },
  { type: 'meaning_sound', hanja: '始', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['비로소 시', '끝낼 시', '비로소 종', '시작 작'], answer: '비로소 시' },
  { type: 'meaning_sound', hanja: '信', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['믿을 신', '의심할 신', '믿을 뢰', '알 신'], answer: '믿을 신' },
  { type: 'meaning_sound', hanja: '根', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['뿌리 근', '줄기 근', '뿌리 경', '가지 근'], answer: '뿌리 근' },
  { type: 'meaning_sound', hanja: '算', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['셀 산', '쓸 산', '셀 수', '계산 계'], answer: '셀 산' },
  { type: 'meaning_sound', hanja: '分', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['나눌 분', '합칠 분', '나눌 합', '갈 분'], answer: '나눌 분' },
  { type: 'meaning_sound', hanja: '事', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['일 사', '쉴 사', '일 업', '할 사'], answer: '일 사' },
  { type: 'meaning_sound', hanja: '植', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['심을 식', '뽑을 식', '심을 종', '기를 식'], answer: '심을 식' },
  { type: 'meaning_sound', hanja: '世', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['세상 세', '하늘 세', '세상 계', '집 세'], answer: '세상 세' },
  { type: 'meaning_sound', hanja: '開', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['열 개', '닫을 개', '열 폐', '넣을 개'], answer: '열 개' },
  { type: 'meaning_sound', hanja: '强', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['강할 강', '약할 강', '강할 약', '힘 강'], answer: '강할 강' },
  { type: 'meaning_sound', hanja: '古', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['옛 고', '새 고', '옛 신', '지날 고'], answer: '옛 고' },
  { type: 'meaning_sound', hanja: '考', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['생각할 고', '볼 고', '생각할 사', '기억 고'], answer: '생각할 고' },
  { type: 'meaning_sound', hanja: '法', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['법 법', '죄 법', '법 규', '올 법'], answer: '법 법' },
  { type: 'meaning_sound', hanja: '別', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['다를 별', '같을 별', '다를 동', '나눌 별'], answer: '다를 별' },
  { type: 'meaning_sound', hanja: '身', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['몸 신', '마음 신', '몸 체', '기운 신'], answer: '몸 신' },
  { type: 'meaning_sound', hanja: '期', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['기약할 기', '잊을 기', '기약할 약', '배울 기'], answer: '기약할 기' },
  { type: 'meaning_sound', hanja: '新', prompt: '다음 한자의 훈(뜻)과 음(소리)은?', choices: ['새 신', '낡을 신', '새 구', '옛 신'], answer: '새 신' },

  // ── [62-63] 반대어 ──
  { type: 'opposite', hanja: '古', prompt: '다음 한자의 대응어(반대어)는?', choices: ['新', '舊', '高', '强'], answer: '新' },
  { type: 'opposite', hanja: '强', prompt: '다음 한자의 대응어(반대어)는?', choices: ['弱', '低', '少', '短'], answer: '弱' },

  // ── [64-65] 빈칸 채우기 ──
  { type: 'fill_blank', hanja: '成□', prompt: '다음 漢字語의 □에 들어갈 알맞은 한자는?', choices: ['功', '力', '名', '事'], answer: '功' },
  { type: 'fill_blank', hanja: '科□', prompt: '다음 漢字語의 □에 들어갈 알맞은 한자는?', choices: ['學', '動', '生', '業'], answer: '學' },

  // ── [66-67] 뜻 → 한자어 ──
  { type: 'meaning_to_word', prompt: '"새로운 소식을 전하는 신문"을 뜻하는 漢字語는?', choices: ['新聞', '新式', '信號', '新世'], answer: '新聞' },
  { type: 'meaning_to_word', prompt: '"높은 속도"를 뜻하는 漢字語는?', choices: ['高速', '高급', '速度', '高大'], answer: '高速' },

  // ── [68-77] 밑줄 친 말 → 한자 ──
  { type: 'underline', sentence: '과학 기술이 빠르게 발전해요.', underline: '과학', prompt: '밑줄 친 말에 해당하는 漢字語는?', choices: ['科學', '果學', '科目', '學科'], answer: '科學' },
  { type: 'underline', sentence: '그것은 근본적인 문제예요.', underline: '근본', prompt: '밑줄 친 말에 해당하는 漢字語는?', choices: ['根本', '近本', '根力', '本根'], answer: '根本' },
  { type: 'underline', sentence: '감사의 마음을 전해요.', underline: '감사', prompt: '밑줄 친 말에 해당하는 漢字語는?', choices: ['感謝', '感事', '感動', '謝感'], answer: '感謝' },
  { type: 'underline', sentence: '세계 여행이 꿈이에요.', underline: '세계', prompt: '밑줄 친 말에 해당하는 漢字語는?', choices: ['世界', '世代', '世上', '界世'], answer: '世界' },
  { type: 'underline', sentence: '신념이 강한 사람이에요.', underline: '신념', prompt: '밑줄 친 말에 해당하는 漢字語는?', choices: ['信念', '信力', '新念', '念信'], answer: '信念' },
  { type: 'underline', sentence: '시작이 반이라는 말이 있어요.', underline: '시작', prompt: '밑줄 친 말에 해당하는 漢字語는?', choices: ['始作', '時作', '始初', '作始'], answer: '始作' },
  { type: 'underline', sentence: '사건을 조사해요.', underline: '사건', prompt: '밑줄 친 말에 해당하는 漢字語는?', choices: ['事件', '事故', '事業', '件事'], answer: '事件' },
  { type: 'underline', sentence: '반성하고 나아가야 해요.', underline: '반성', prompt: '밑줄 친 말에 해당하는 漢字語는?', choices: ['反省', '反對', '反動', '省反'], answer: '反省' },
  { type: 'underline', sentence: '각종 준비물을 챙겼어요.', underline: '각종', prompt: '밑줄 친 말에 해당하는 漢字語는?', choices: ['各種', '各界', '各色', '種各'], answer: '各種' },
  { type: 'underline', sentence: '고속버스를 탔어요.', underline: '고속', prompt: '밑줄 친 말에 해당하는 漢字語는?', choices: ['高速', '急速', '高急', '速高'], answer: '高速' },

  // ── [78-80] 필순 ──
  { type: 'stroke', hanja: '成', prompt: '다음 한자의 총 획수는?', choices: ['6획', '4획', '5획', '7획'], answer: '6획' },
  { type: 'stroke', hanja: '高', prompt: '다음 한자의 총 획수는?', choices: ['10획', '8획', '9획', '11획'], answer: '10획' },
  { type: 'stroke', hanja: '信', prompt: '다음 한자의 총 획수는?', choices: ['9획', '7획', '8획', '10획'], answer: '9획' },
];

const PASS_COUNT = 56;

const TYPE_LABELS = {
  sound_sentence: '독음 (읽는 소리)',
  meaning_sound: '한자 → 훈+음',
  opposite: '반대어 (대응어)',
  fill_blank: '빈칸 채우기',
  meaning_to_word: '뜻 → 한자어',
  underline: '밑줄 → 한자어',
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
const GradeTest62Screen = ({ onBack, onComplete, selectedCharacter }) => {
  const currentGrade = getUnlockedGrade();
  const alreadyUnlocked = ['6급II', '6급'].includes(currentGrade);
  const hasPrereq = currentGrade === '7급' || alreadyUnlocked;

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
  const isChoiceLarge = q?.type === 'opposite';
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
      localStorage.setItem(SK.UNLOCKED_GRADE, '6급II');
    }
    if (onComplete) onComplete({ correct, total: questions.length, passed });
    onBack();
  };

  if (phase === 'intro') {
    return (
      <GradeTestIntro
        title="6급Ⅱ 인증 시험"
        subtitle="전국한자능력검정시험 6급Ⅱ 기출 기반"
        total={questions.length}
        passCount={PASS_COUNT}
        focusText="독음 · 한자→훈+음 · 반대어 · 빈칸채우기 · 뜻→한자어 · 밑줄 · 필순"
        hasPrereq={hasPrereq}
        prereqText="7급 인증 시험을 먼저 통과하면 좋아요!"
        alreadyUnlocked={alreadyUnlocked}
        alreadyUnlockedText="이미 6급Ⅱ 인증이 완료되었어요!"
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
                <span>6급Ⅱ 인증 시험</span>
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
      grade="6급Ⅱ"
      nextGrade="6급"
      alreadyUnlocked={alreadyUnlocked}
      selectedCharacter={selectedCharacter}
      onRetry={() => { setPhase('intro'); setQIndex(0); setSelected(null); setRevealed(false); setCorrect(0); }}
      onFinish={handleFinish}
    />
  );
};

export default GradeTest62Screen;
