import GradeTestRunner from './grade-runner/GradeTestRunner.jsx';
import { useLang } from '../../hooks/useLang.js';

// ─── 8급 기출 기반 문제 (111회 · 112회) ─────────────────────────────────────
const getQuestions = (t) => [
  // ── [1-10] 독음: 문장 속 한자 읽기 ──
  { type: 'sound_sentence', sentence: '올해는 (八)월입니다.', hanja: '八', prompt: t('ext_2237'), choices: ['팔', '칠', '구', '육'], answer: '팔' },
  { type: 'sound_sentence', sentence: '(月)요일에 학교에 갑니다.', hanja: '月', prompt: t('ext_2237'), choices: ['월', '화', '수', '목'], answer: '월' },
  { type: 'sound_sentence', sentence: '(十)월에 단풍이 아름다워요.', hanja: '十', prompt: t('ext_2237'), choices: ['십', '백', '천', '만'], answer: '십' },
  { type: 'sound_sentence', sentence: '(五)월 오일은 어린이날입니다.', hanja: '五', prompt: t('ext_2237'), choices: ['오', '사', '육', '칠'], answer: '오' },
  { type: 'sound_sentence', sentence: '(日)요일은 쉬는 날입니다.', hanja: '日', prompt: t('ext_2237'), choices: ['일', '월', '화', '토'], answer: '일' },
  { type: 'sound_sentence', sentence: '(大)한민국 만세!', hanja: '大', prompt: t('ext_2237'), choices: ['대', '소', '중', '장'], answer: '대' },
  { type: 'sound_sentence', sentence: '(韓)국은 아름다운 나라입니다.', hanja: '韓', prompt: t('ext_2237'), choices: ['한', '민', '국', '왕'], answer: '한' },
  { type: 'sound_sentence', sentence: '(民)주주의 나라입니다.', hanja: '民', prompt: t('ext_2237'), choices: ['민', '국', '왕', '군'], answer: '민' },
  { type: 'sound_sentence', sentence: '(國)어를 열심히 공부합니다.', hanja: '國', prompt: t('ext_2237'), choices: ['국', '한', '군', '민'], answer: '국' },
  { type: 'sound_sentence', sentence: '(山)에 올라가면 경치가 좋아요.', hanja: '山', prompt: t('ext_2237'), choices: ['산', '천', '남', '북'], answer: '산' },

  // ── [11-20] 훈/음 → 한자 고르기 ──
  { type: 'hanja', prompt: t('ext_3200', { word: '왕' }), hanja: null, choices: ['王', '大', '民', '父'], answer: '王' },
  { type: 'hanja', prompt: t('ext_3200', { word: '쇠/성' }), hanja: null, choices: ['金', '木', '水', '火'], answer: '金' },
  { type: 'hanja', prompt: t('ext_3200', { word: '나무' }), hanja: null, choices: ['木', '水', '火', '土'], answer: '木' },
  { type: 'hanja', prompt: t('ext_3200', { word: '두 이' }), hanja: null, choices: ['二', '一', '三', '四'], answer: '二' },
  { type: 'hanja', prompt: t('ext_3200', { word: '작을' }), hanja: null, choices: ['小', '大', '中', '上'], answer: '小' },
  { type: 'hanja', prompt: t('ext_3200', { word: '사람' }), hanja: null, choices: ['人', '父', '母', '兄'], answer: '人' },
  { type: 'hanja', prompt: t('ext_3200', { word: '석 삼' }), hanja: null, choices: ['三', '一', '二', '四'], answer: '三' },
  { type: 'hanja', prompt: t('ext_3200', { word: '흙' }), hanja: null, choices: ['土', '水', '火', '金'], answer: '土' },
  { type: 'hanja', prompt: t('ext_3200', { word: '물' }), hanja: null, choices: ['水', '木', '火', '金'], answer: '水' },
  { type: 'hanja', prompt: t('ext_3200', { word: '흰' }), hanja: null, choices: ['白', '靑', '大', '小'], answer: '白' },

  // ── [21-30] 밑줄 친 말 → 한자 고르기 ──
  { type: 'underline', sentence: '나무 한 그루를 심었습니다.', underline: '나무', prompt: t('ext_2186'), choices: ['木', '火', '水', '土'], answer: '木' },
  { type: 'underline', sentence: '나와 형은 아버지를 닮았습니다.', underline: '형', prompt: t('ext_2186'), choices: ['兄', '弟', '父', '母'], answer: '兄' },
  { type: 'underline', sentence: '아이들이 학교 밖에서 놀고 있습니다.', underline: '밖', prompt: t('ext_2186'), choices: ['外', '門', '室', '上'], answer: '外' },
  { type: 'underline', sentence: '물이 아래로 흐릅니다.', underline: '아래', prompt: t('ext_2186'), choices: ['下', '上', '左', '右'], answer: '下' },
  { type: 'underline', sentence: '강 가운데 배가 떠 있습니다.', underline: '가운데', prompt: t('ext_2186'), choices: ['中', '大', '小', '上'], answer: '中' },
  { type: 'underline', sentence: '구미호는 꼬리가 아홉 달린 여우입니다.', underline: '아홉', prompt: t('ext_2186'), choices: ['九', '八', '七', '六'], answer: '九' },
  { type: 'underline', sentence: '장작이 불을 탑니다.', underline: '불', prompt: t('ext_2186'), choices: ['火', '水', '木', '土'], answer: '火' },
  { type: 'underline', sentence: '버드나무의 푸른 잎이 흔들립니다.', underline: '푸른', prompt: t('ext_2186'), choices: ['靑', '白', '大', '小'], answer: '靑' },
  { type: 'underline', sentence: '하나의 마음으로 힘을 모읍시다.', underline: '하나', prompt: t('ext_2186'), choices: ['一', '二', '三', '十'], answer: '一' },
  { type: 'underline', sentence: '동생과 함께 뛰어놀았습니다.', underline: '동생', prompt: t('ext_2186'), choices: ['弟', '兄', '男', '女'], answer: '弟' },

  // ── [31-40] 한자 → 훈+음 ──
  { type: 'meaning_sound', hanja: '校', prompt: t('ext_1867'), choices: ['학교 교', '배울 학', '먼저 선', '날 생'], answer: '학교 교' },
  { type: 'meaning_sound', hanja: '母', prompt: t('ext_1867'), choices: ['어미 모', '아비 부', '형 형', '계집 녀'], answer: '어미 모' },
  { type: 'meaning_sound', hanja: '弟', prompt: t('ext_1867'), choices: ['아우 제', '형 형', '사내 남', '계집 녀'], answer: '아우 제' },
  { type: 'meaning_sound', hanja: '六', prompt: t('ext_1867'), choices: ['여섯 육', '일곱 칠', '다섯 오', '여덟 팔'], answer: '여섯 육' },
  { type: 'meaning_sound', hanja: '先', prompt: t('ext_1867'), choices: ['먼저 선', '날 생', '배울 학', '아비 부'], answer: '먼저 선' },
  { type: 'meaning_sound', hanja: '四', prompt: t('ext_1867'), choices: ['넉 사', '석 삼', '다섯 오', '여섯 육'], answer: '넉 사' },
  { type: 'meaning_sound', hanja: '七', prompt: t('ext_1867'), choices: ['일곱 칠', '여섯 육', '여덟 팔', '다섯 오'], answer: '일곱 칠' },
  { type: 'meaning_sound', hanja: '門', prompt: t('ext_1867'), choices: ['문 문', '바깥 외', '큰 대', '메 산'], answer: '문 문' },
  { type: 'meaning_sound', hanja: '女', prompt: t('ext_1867'), choices: ['계집 녀', '사내 남', '어미 모', '아들 자'], answer: '계집 녀' },
  { type: 'meaning_sound', hanja: '外', prompt: t('ext_1867'), choices: ['바깥 외', '가운데 중', '위 상', '아래 하'], answer: '바깥 외' },

  // ── [41-44] 한자 → 훈(뜻) ──
  { type: 'meaning', prompt: t('ext_1710'), hanja: '父', choices: ['아비', '어미', '형', '아우'], answer: '아비' },
  { type: 'meaning', prompt: t('ext_1710'), hanja: '北', choices: ['북녘', '동녘', '서녘', '남녘'], answer: '북녘' },
  { type: 'meaning', prompt: t('ext_1710'), hanja: '寸', choices: ['마디', '아비', '동녘', '북녘'], answer: '마디' },
  { type: 'meaning', prompt: t('ext_1710'), hanja: '東', choices: ['동녘', '서녘', '남녘', '마디'], answer: '동녘' },

  // ── [45-48] 한자 → 음(소리) ──
  { type: 'sound', prompt: t('ext_1927'), hanja: '西', choices: ['서', '동', '남', '북'], answer: '서' },
  { type: 'sound', prompt: t('ext_1927'), hanja: '南', choices: ['남', '산', '군', '실'], answer: '남' },
  { type: 'sound', prompt: t('ext_1927'), hanja: '室', choices: ['실', '남', '산', '군'], answer: '실' },
  { type: 'sound', prompt: t('ext_1927'), hanja: '軍', choices: ['군', '남', '산', '실'], answer: '군' },

  // ── [49-50] 필순 ──
  { type: 'stroke', prompt: t('ext_1868'), hanja: '門', choices: ['8획', '6획', '7획', '9획'], answer: '8획' },
  { type: 'stroke', prompt: t('ext_1868'), hanja: '王', choices: ['4획', '2획', '3획', '5획'], answer: '4획' },
];

const PASS_COUNT = 35; // 50문제 중 35개 (70%)

const getTypeLabels = () => ({
  sound: 'ext_1771',
  sound_sentence: 'ext_1771',
  hanja: 'ext_1631',
  underline: 'ext_1632',
  meaning: 'ext_1583',
  meaning_sound: 'ext_1672',
  stroke: 'ext_1633',
});

const GradeTestScreen = ({ onBack, onComplete, selectedCharacter, userXp }) => {
  const { t } = useLang();

  return (
    <GradeTestRunner
      title={t('ext_1673')}
      subtitle={<>{t('ext_1769')}<br />{t('ext_1674')}</>}
      questionsSource={getQuestions(t)}
      passCount={PASS_COUNT}
      typeLabels={getTypeLabels()}
      grade={t('ext_270')}
      nextGrade={t('ext_935')}
      unlockGrade={t('ext_270')}
      focusText={t('ext_2550')}
      alreadyUnlockedText={t('ext_2059')}
      getAlreadyUnlocked={(currentGrade) => ['8급', '7급II', '7급', '6급II', '6급'].includes(currentGrade)}
      largeChoiceTypes={['hanja', 'underline']}
      useCompoundHanjaBox={false}
      scoreClassName="text-teal-600"
      onBack={onBack}
      onComplete={onComplete}
      selectedCharacter={selectedCharacter}
      userXp={userXp}
    />
  );
};

export default GradeTestScreen;
