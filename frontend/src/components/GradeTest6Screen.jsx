import { useState, useEffect, useRef } from 'react';
import { SK } from '../constants/storageKeys.js';
import GradeTestIntro from './common/GradeTestIntro.jsx';
import GradeTestResult from './common/GradeTestResult.jsx';
import QuizProgressBar from './QuizProgressBar.jsx';

// ─── 6급 기출 기반 문제 (111회·112회) — 90문항 ───────────────────────────────
const QUESTIONS = [
  // ── [1-33] 독음: 문장 속 한자어 읽기 ──
  { type: 'sound_sentence', sentence: '(勝利) 의 기쁨을 나눠요.', hanja: '勝利', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['승리', '패배', '승부', '승점'], answer: '승리' },
  { type: 'sound_sentence', sentence: '(太陽) 이 뜨겁게 내리쬐어요.', hanja: '太陽', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['태양', '양광', '태반', '일광'], answer: '태양' },
  { type: 'sound_sentence', sentence: '(溫度) 가 많이 올랐어요.', hanja: '溫度', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['온도', '온천', '습도', '기온'], answer: '온도' },
  { type: 'sound_sentence', sentence: '(感情) 을 솔직하게 표현해요.', hanja: '感情', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['감정', '감사', '정보', '감각'], answer: '감정' },
  { type: 'sound_sentence', sentence: '(開放) 적인 태도가 중요해요.', hanja: '開放', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['개방', '개인', '방면', '개시'], answer: '개방' },
  { type: 'sound_sentence', sentence: '(衣服) 을 깨끗이 입어요.', hanja: '衣服', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['의복', '의원', '복장', '의류'], answer: '의복' },
  { type: 'sound_sentence', sentence: '(愛情) 이 가득한 가족이에요.', hanja: '愛情', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['애정', '애국', '연정', '정열'], answer: '애정' },
  { type: 'sound_sentence', sentence: '(美術) 관람을 즐겨요.', hanja: '美術', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['미술', '미화', '미용', '예술'], answer: '미술' },
  { type: 'sound_sentence', sentence: '(朝食) 을 꼭 먹어요.', hanja: '朝食', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['조식', '조석', '석식', '조반'], answer: '조식' },
  { type: 'sound_sentence', sentence: '(死亡) 소식을 들었어요.', hanja: '死亡', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['사망', '희생', '사건', '생사'], answer: '사망' },
  { type: 'sound_sentence', sentence: '(民族) 정신을 이어받아요.', hanja: '民族', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['민족', '민속', '민심', '씨족'], answer: '민족' },
  { type: 'sound_sentence', sentence: '(遠近) 을 조절해요.', hanja: '遠近', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['원근', '근접', '원거', '원방'], answer: '원근' },
  { type: 'sound_sentence', sentence: '(石油) 가격이 올랐어요.', hanja: '石油', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['석유', '원유', '석탄', '석재'], answer: '석유' },
  { type: 'sound_sentence', sentence: '(洋食) 을 좋아해요.', hanja: '洋食', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['양식', '한식', '중식', '일식'], answer: '양식' },
  { type: 'sound_sentence', sentence: '(集中) 해서 공부해요.', hanja: '集中', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['집중', '집약', '집합', '집성'], answer: '집중' },
  { type: 'sound_sentence', sentence: '(正義) 를 위해 싸워요.', hanja: '正義', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['정의', '진리', '정당', '의리'], answer: '정의' },
  { type: 'sound_sentence', sentence: '(廣場) 에 사람들이 모였어요.', hanja: '廣場', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['광장', '장소', '광야', '광역'], answer: '광장' },
  { type: 'sound_sentence', sentence: '(平和) 가 찾아왔어요.', hanja: '平和', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['평화', '화목', '평온', '화합'], answer: '평화' },
  { type: 'sound_sentence', sentence: '(利用) 해서 만들었어요.', hanja: '利用', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['이용', '사용', '이익', '활용'], answer: '이용' },
  { type: 'sound_sentence', sentence: '(共同) 으로 작업해요.', hanja: '共同', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['공동', '협동', '공통', '공유'], answer: '공동' },
  { type: 'sound_sentence', sentence: '(待機) 하고 있어요.', hanja: '待機', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['대기', '준비', '대비', '대령'], answer: '대기' },
  { type: 'sound_sentence', sentence: '(定期) 적으로 검사해요.', hanja: '定期', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['정기', '임시', '정시', '기한'], answer: '정기' },
  { type: 'sound_sentence', sentence: '(式場) 에 많은 사람이 왔어요.', hanja: '式場', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['식장', '행사', '식순', '식전'], answer: '식장' },
  { type: 'sound_sentence', sentence: '(現代) 사회는 변화가 빨라요.', hanja: '現代', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['현대', '현황', '근대', '현실'], answer: '현대' },
  { type: 'sound_sentence', sentence: '(勇氣) 를 내세요.', hanja: '勇氣', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['용기', '패기', '용감', '기개'], answer: '용기' },
  { type: 'sound_sentence', sentence: '(油田) 에서 석유를 채굴해요.', hanja: '油田', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['유전', '원유', '유정', '유류'], answer: '유전' },
  { type: 'sound_sentence', sentence: '(洋服) 차림으로 나갔어요.', hanja: '洋服', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['양복', '한복', '교복', '양장'], answer: '양복' },
  { type: 'sound_sentence', sentence: '(米穀) 상점에서 쌀을 샀어요.', hanja: '米穀', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['미곡', '곡류', '미식', '미음'], answer: '미곡' },
  { type: 'sound_sentence', sentence: '(牛乳) 를 매일 마셔요.', hanja: '牛乳', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['우유', '두유', '유제', '소유'], answer: '우유' },
  { type: 'sound_sentence', sentence: '(利益) 을 나누어요.', hanja: '利益', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['이익', '이윤', '이득', '이자'], answer: '이익' },
  { type: 'sound_sentence', sentence: '(集合) 시간이 됐어요.', hanja: '集合', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['집합', '합창', '집결', '집산'], answer: '집합' },
  { type: 'sound_sentence', sentence: '(石炭) 을 연료로 쓰던 시대예요.', hanja: '石炭', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['석탄', '탄광', '연탄', '목탄'], answer: '석탄' },
  { type: 'sound_sentence', sentence: '(廣告) 를 보고 샀어요.', hanja: '廣告', prompt: '다음 문장 속 한자어의 음(音)은?', choices: ['광고', '고지', '광보', '선전'], answer: '광고' },

  // ── [34-55] 한자 → 훈+음 ──
  { type: 'meaning_sound', hanja: '勝', prompt: '이 한자의 훈과 음은?', choices: ['이길 승', '아름다울 미', '날랠 용', '이로울 리'], answer: '이길 승' },
  { type: 'meaning_sound', hanja: '太', prompt: '이 한자의 훈과 음은?', choices: ['클 태', '클 대', '넓을 광', '따뜻할 온'], answer: '클 태' },
  { type: 'meaning_sound', hanja: '溫', prompt: '이 한자의 훈과 음은?', choices: ['따뜻할 온', '찰 냉', '기름 유', '바다 양'], answer: '따뜻할 온' },
  { type: 'meaning_sound', hanja: '愛', prompt: '이 한자의 훈과 음은?', choices: ['사랑 애', '뜻 정', '이로울 리', '날랠 용'], answer: '사랑 애' },
  { type: 'meaning_sound', hanja: '美', prompt: '이 한자의 훈과 음은?', choices: ['아름다울 미', '쌀 미', '이로울 리', '이길 승'], answer: '아름다울 미' },
  { type: 'meaning_sound', hanja: '朝', prompt: '이 한자의 훈과 음은?', choices: ['아침 조', '저녁 석', '겨레 족', '모을 집'], answer: '아침 조' },
  { type: 'meaning_sound', hanja: '死', prompt: '이 한자의 훈과 음은?', choices: ['죽을 사', '날 생', '살 활', '일 사'], answer: '죽을 사' },
  { type: 'meaning_sound', hanja: '族', prompt: '이 한자의 훈과 음은?', choices: ['겨레 족', '백성 민', '발 족', '모을 집'], answer: '겨레 족' },
  { type: 'meaning_sound', hanja: '遠', prompt: '이 한자의 훈과 음은?', choices: ['멀 원', '동산 원', '으뜸 원', '가까울 근'], answer: '멀 원' },
  { type: 'meaning_sound', hanja: '油', prompt: '이 한자의 훈과 음은?', choices: ['기름 유', '바다 양', '따뜻할 온', '모을 집'], answer: '기름 유' },
  { type: 'meaning_sound', hanja: '洋', prompt: '이 한자의 훈과 음은?', choices: ['바다 양', '기름 유', '따뜻할 온', '겨레 족'], answer: '바다 양' },
  { type: 'meaning_sound', hanja: '集', prompt: '이 한자의 훈과 음은?', choices: ['모을 집', '넓을 광', '정할 정', '한가지 공'], answer: '모을 집' },
  { type: 'meaning_sound', hanja: '合', prompt: '이 한자의 훈과 음은?', choices: ['합할 합', '한가지 공', '모을 집', '한가지 동'], answer: '합할 합' },
  { type: 'meaning_sound', hanja: '交', prompt: '이 한자의 훈과 음은?', choices: ['사귈 교', '학교 교', '가르칠 교', '길 도'], answer: '사귈 교' },
  { type: 'meaning_sound', hanja: '平', prompt: '이 한자의 훈과 음은?', choices: ['평평할 평', '넓을 광', '정할 정', '한가지 공'], answer: '평평할 평' },
  { type: 'meaning_sound', hanja: '利', prompt: '이 한자의 훈과 음은?', choices: ['이로울 리', '아름다울 미', '이길 승', '날랠 용'], answer: '이로울 리' },
  { type: 'meaning_sound', hanja: '共', prompt: '이 한자의 훈과 음은?', choices: ['한가지 공', '공 공', '빌 공', '모을 집'], answer: '한가지 공' },
  { type: 'meaning_sound', hanja: '待', prompt: '이 한자의 훈과 음은?', choices: ['기다릴 대', '큰 대', '정할 정', '멀 원'], answer: '기다릴 대' },
  { type: 'meaning_sound', hanja: '定', prompt: '이 한자의 훈과 음은?', choices: ['정할 정', '뜻 정', '평평할 평', '모을 집'], answer: '정할 정' },
  { type: 'meaning_sound', hanja: '勇', prompt: '이 한자의 훈과 음은?', choices: ['날랠 용', '이길 승', '이로울 리', '한가지 공'], answer: '날랠 용' },
  { type: 'meaning_sound', hanja: '石', prompt: '이 한자의 훈과 음은?', choices: ['돌 석', '저녁 석', '자리 석', '쌀 미'], answer: '돌 석' },
  { type: 'meaning_sound', hanja: '米', prompt: '이 한자의 훈과 음은?', choices: ['쌀 미', '아름다울 미', '돌 석', '기름 유'], answer: '쌀 미' },

  // ── [56-58] 반대어 ──
  { type: 'opposite', hanja: '多', prompt: '뜻이 반대되는 한자는?', choices: ['少', '大', '弱', '老'], answer: '少' },
  { type: 'opposite', hanja: '朝', prompt: '뜻이 반대되는 한자는?', choices: ['夕', '少', '弱', '大'], answer: '夕' },
  { type: 'opposite', hanja: '老', prompt: '뜻이 반대되는 한자는?', choices: ['少', '弱', '大', '多'], answer: '少' },

  // ── [59-60] 유사어 ──
  { type: 'similar', hanja: '海', prompt: '뜻이 비슷한 한자는?', choices: ['洋', '江', '水', '川'], answer: '洋' },
  { type: 'similar', hanja: '道', prompt: '뜻이 비슷한 한자는?', choices: ['路', '里', '村', '川'], answer: '路' },

  // ── [61-62] 동음이의어 ──
  { type: 'homo_meaning', prompt: '"기사"와 같은 소리이지만 다른 뜻인 한자어는?', choices: ['騎士', '記事', '記者', '機士'], answer: '騎士' },
  { type: 'homo_meaning', prompt: '"정의"와 같은 소리이지만 다른 뜻인 한자어는?', choices: ['定義', '正義', '正意', '征義'], answer: '定義' },

  // ── [63-65] 사자성어 ──
  { type: 'idiom', prompt: '"一□一失"의 □에 들어갈 한자는?', choices: ['得', '大', '百', '全'], answer: '得' },
  { type: 'idiom', prompt: '"百□百中"의 □에 들어갈 한자는?', choices: ['發', '年', '勝', '倍'], answer: '發' },
  { type: 'idiom', prompt: '"大□小異"의 □에 들어갈 한자는?', choices: ['同', '中', '全', '一'], answer: '同' },

  // ── [66-67] 뜻 → 한자어 ──
  { type: 'meaning_to_word', prompt: '"이기고 지는 일"을 뜻하는 한자어는?', choices: ['勝敗', '勝利', '成功', '勝負'], answer: '勝負' },
  { type: 'meaning_to_word', prompt: '"아침에 먹는 음식"을 뜻하는 한자어는?', choices: ['朝食', '食事', '朝夕', '間食'], answer: '朝食' },

  // ── [68-87] 밑줄 친 말 → 한자어 ──
  { type: 'underline', sentence: '태양이 밝게 빛나요.', underline: '태양', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['太陽', '態陽', '泰陽', '太洋'], answer: '太陽' },
  { type: 'underline', sentence: '감정을 솔직하게 표현해요.', underline: '감정', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['感情', '感正', '感定', '感政'], answer: '感情' },
  { type: 'underline', sentence: '민족의 전통을 지켜요.', underline: '민족', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['民族', '敏族', '民足', '愍族'], answer: '民族' },
  { type: 'underline', sentence: '미술 작품을 감상해요.', underline: '미술', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['美術', '米術', '味術', '美述'], answer: '美術' },
  { type: 'underline', sentence: '온도가 많이 올랐어요.', underline: '온도', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['溫度', '溫道', '溫圖', '溫都'], answer: '溫度' },
  { type: 'underline', sentence: '평화로운 세상을 꿈꿔요.', underline: '평화', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['平和', '評和', '平化', '平話'], answer: '平和' },
  { type: 'underline', sentence: '용기 있는 행동이에요.', underline: '용기', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['勇氣', '用氣', '容氣', '勇期'], answer: '勇氣' },
  { type: 'underline', sentence: '이익을 나누어요.', underline: '이익', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['利益', '異益', '理益', '移益'], answer: '利益' },
  { type: 'underline', sentence: '석유가 중요한 자원이에요.', underline: '석유', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['石油', '席油', '昔油', '石由'], answer: '石油' },
  { type: 'underline', sentence: '집중해서 읽어요.', underline: '집중', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['集中', '執中', '輯中', '集衆'], answer: '集中' },
  { type: 'underline', sentence: '공동으로 결정해요.', underline: '공동', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['共同', '公同', '工同', '共動'], answer: '共同' },
  { type: 'underline', sentence: '광고를 보고 구매했어요.', underline: '광고', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['廣告', '光告', '廣古', '廣高'], answer: '廣告' },
  { type: 'underline', sentence: '현대 기술이 놀라워요.', underline: '현대', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['現代', '玄代', '賢代', '現大'], answer: '現代' },
  { type: 'underline', sentence: '우유를 매일 마셔요.', underline: '우유', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['牛乳', '右乳', '雨乳', '牛由'], answer: '牛乳' },
  { type: 'underline', sentence: '이용 가능한 방법을 찾아요.', underline: '이용', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['利用', '異用', '理用', '移用'], answer: '利用' },
  { type: 'underline', sentence: '정의 실현을 위해 노력해요.', underline: '정의', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['正義', '定義', '政義', '正意'], answer: '正義' },
  { type: 'underline', sentence: '양식 요리를 즐겨요.', underline: '양식', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['洋食', '養食', '陽食', '洋式'], answer: '洋食' },
  { type: 'underline', sentence: '승리를 기원해요.', underline: '승리', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['勝利', '昇利', '乘利', '勝理'], answer: '勝利' },
  { type: 'underline', sentence: '애정 어린 마음으로 돌봐요.', underline: '애정', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['愛情', '哀情', '愛正', '愛定'], answer: '愛情' },
  { type: 'underline', sentence: '집합 장소로 모여요.', underline: '집합', prompt: '다음 밑줄 친 漢字語를 漢字로 쓰세요.', choices: ['集合', '執合', '輯合', '集閤'], answer: '集合' },

  // ── [88-90] 필순 ──
  { type: 'stroke', hanja: '現', prompt: '다음 한자의 총 획수는?', choices: ['11획', '9획', '10획', '12획'], answer: '11획' },
  { type: 'stroke', hanja: '開', prompt: '다음 한자의 총 획수는?', choices: ['12획', '10획', '11획', '13획'], answer: '12획' },
  { type: 'stroke', hanja: '感', prompt: '다음 한자의 총 획수는?', choices: ['13획', '11획', '12획', '14획'], answer: '13획' },
];

const PASS_COUNT = 63;

const TYPE_LABELS = {
  sound_sentence: '독음 (읽는 소리)',
  meaning_sound: '한자 → 훈+음',
  opposite: '반대어 (대응어)',
  similar: '유사어 (비슷한 말)',
  homo_meaning: '동음이의어',
  idiom: '사자성어',
  meaning_to_word: '뜻 → 한자어',
  underline: '한자어 쓰기',
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
const GradeTest6Screen = ({ onBack, onComplete, selectedCharacter }) => {
  const currentGrade = getUnlockedGrade();
  const alreadyUnlocked = currentGrade === '6급';
  const hasPrereq = currentGrade === '6급II' || alreadyUnlocked;

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
  const isCompound = q?.hanja && q.hanja.length > 1;
  const isChoiceLarge = q?.type === 'opposite' || q?.type === 'similar' || q?.type === 'idiom';
  const isChoiceMediumHanja = q?.type === 'underline' || q?.type === 'meaning_to_word' || q?.type === 'homo_meaning';

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
      localStorage.setItem(SK.UNLOCKED_GRADE, '6급');
    }
    if (onComplete) onComplete({ correct, total: questions.length, passed });
    onBack();
  };

  if (phase === 'intro') {
    return (
      <GradeTestIntro
        title="6급 인증 시험"
        subtitle={<>전국한자능력검정시험<br/>6급 기출 기반</>}
        total={questions.length}
        passCount={PASS_COUNT}
        focusText="독음 · 한자→훈+음 · 반대어 · 유사어 · 동음이의어 · 사자성어 · 뜻→한자어 · 밑줄 · 필순"
        hasPrereq={hasPrereq}
        prereqText="6급Ⅱ 인증 시험을 먼저 통과하면 좋아요!"
        alreadyUnlocked={alreadyUnlocked}
        alreadyUnlockedText="이미 6급 인증이 완료되었어요!"
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
                  <span>6급 인증 시험</span>
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
                {selected === q.answer ? '정답!' : `정답: ${q.answer}`}
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
      grade="6급"
      nextGrade={null}
      alreadyUnlocked={alreadyUnlocked}
      selectedCharacter={selectedCharacter}
      answers={answerLog}
      onRetry={() => { setPhase('intro'); setQIndex(0); setSelected(null); setRevealed(false); setCorrect(0); setAnswerLog([]); }}
      onFinish={handleFinish}
    />
  );
};

export default GradeTest6Screen;
