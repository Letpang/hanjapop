// ─── 6급II 기출 기반 문제 (111회·112회) — 80문항 ─────────────────────────────
export const QUESTIONS = [
  // ── [1-32] 독음: 문장 속 한자어 읽기 ──
  { type: 'sound_sentence', sentence: '(成功) 을 위해 열심히 노력해요.', hanja: '成功', prompt: 'ext_2280', choices: ['성공', '실패', '성적', '공부'], answer: '성공' },
  { type: 'sound_sentence', sentence: '(發明) 가는 세상을 바꿔요.', hanja: '發明', prompt: 'ext_2280', choices: ['발명', '발표', '발견', '발전'], answer: '발명' },
  { type: 'sound_sentence', sentence: '(各界) 의 인사들이 모였어요.', hanja: '各界', prompt: 'ext_2280', choices: ['각계', '각국', '계급', '각도'], answer: '각계' },
  { type: 'sound_sentence', sentence: '(新聞) 을 매일 읽어요.', hanja: '新聞', prompt: 'ext_2280', choices: ['신문', '신식', '소식', '신호'], answer: '신문' },
  { type: 'sound_sentence', sentence: '(幸運) 을 빌어요.', hanja: '幸運', prompt: 'ext_2280', choices: ['행운', '행복', '운명', '행사'], answer: '행운' },
  { type: 'sound_sentence', sentence: '(反省) 하는 시간이 필요해요.', hanja: '反省', prompt: 'ext_2280', choices: ['반성', '반대', '성격', '반응'], answer: '반성' },
  { type: 'sound_sentence', sentence: '(高速) 도로가 막혀요.', hanja: '高速', prompt: 'ext_2280', choices: ['고속', '고급', '속도', '급행'], answer: '고속' },
  { type: 'sound_sentence', sentence: '(近代) 역사를 공부해요.', hanja: '近代', prompt: 'ext_2280', choices: ['근대', '현대', '고대', '근거'], answer: '근대' },
  { type: 'sound_sentence', sentence: '(感謝) 의 마음을 전해요.', hanja: '感謝', prompt: 'ext_2280', choices: ['감사', '감동', '사과', '감정'], answer: '감사' },
  { type: 'sound_sentence', sentence: '(科學) 기술이 발전했어요.', hanja: '科學', prompt: 'ext_2280', choices: ['과학', '과목', '공학', '과거'], answer: '과학' },
  { type: 'sound_sentence', sentence: '(果實) 이 탐스러워요.', hanja: '果實', prompt: 'ext_2280', choices: ['과실', '과수', '수확', '과즙'], answer: '과실' },
  { type: 'sound_sentence', sentence: '(球場) 에서 야구를 봐요.', hanja: '球場', prompt: 'ext_2280', choices: ['구장', '운동장', '구기', '경기'], answer: '구장' },
  { type: 'sound_sentence', sentence: '(急行) 열차를 탔어요.', hanja: '急行', prompt: 'ext_2280', choices: ['급행', '급속', '속행', '특급'], answer: '급행' },
  { type: 'sound_sentence', sentence: '(始作) 이 반이에요.', hanja: '始作', prompt: 'ext_2280', choices: ['시작', '착수', '시초', '출발'], answer: '시작' },
  { type: 'sound_sentence', sentence: '(信念) 이 강한 사람이에요.', hanja: '信念', prompt: 'ext_2280', choices: ['신념', '신뢰', '신앙', '신조'], answer: '신념' },
  { type: 'sound_sentence', sentence: '(根本) 부터 해결해야 해요.', hanja: '根本', prompt: 'ext_2280', choices: ['근본', '근간', '근거', '본질'], answer: '근본' },
  { type: 'sound_sentence', sentence: '(算數) 문제를 풀었어요.', hanja: '算數', prompt: 'ext_2280', choices: ['산수', '암산', '계산', '수학'], answer: '산수' },
  { type: 'sound_sentence', sentence: '(分別) 있는 행동을 해요.', hanja: '分別', prompt: 'ext_2280', choices: ['분별', '분류', '구별', '분리'], answer: '분별' },
  { type: 'sound_sentence', sentence: '(事件) 이 발생했어요.', hanja: '事件', prompt: 'ext_2280', choices: ['사건', '분쟁', '사고', '사태'], answer: '사건' },
  { type: 'sound_sentence', sentence: '(植物) 원에 갔어요.', hanja: '植物', prompt: 'ext_2280', choices: ['식물', '식용', '식생', '생물'], answer: '식물' },
  { type: 'sound_sentence', sentence: '(世界) 여행을 꿈꿔요.', hanja: '世界', prompt: 'ext_2280', choices: ['세계', '세대', '세상', '지구'], answer: '세계' },
  { type: 'sound_sentence', sentence: '(開始) 신호가 울렸어요.', hanja: '開始', prompt: 'ext_2280', choices: ['개시', '개방', '개통', '출발'], answer: '개시' },
  { type: 'sound_sentence', sentence: '(强力) 한 바람이 불어요.', hanja: '强力', prompt: 'ext_2280', choices: ['강력', '강세', '강풍', '역량'], answer: '강력' },
  { type: 'sound_sentence', sentence: '(古代) 유적을 발견했어요.', hanja: '古代', prompt: 'ext_2280', choices: ['고대', '상고', '고전', '고풍'], answer: '고대' },
  { type: 'sound_sentence', sentence: '(考試) 준비를 열심히 해요.', hanja: '考試', prompt: 'ext_2280', choices: ['고시', '고찰', '시험', '고사'], answer: '고시' },
  { type: 'sound_sentence', sentence: '(法院) 에서 재판이 열려요.', hanja: '法院', prompt: 'ext_2280', choices: ['법원', '법규', '법정', '법률'], answer: '법원' },
  { type: 'sound_sentence', sentence: '(別世) 하신 분을 기리어요.', hanja: '別世', prompt: 'ext_2280', choices: ['별세', '별명', '별거', '별도'], answer: '별세' },
  { type: 'sound_sentence', sentence: '(身體) 가 건강해야 해요.', hanja: '身體', prompt: 'ext_2280', choices: ['신체', '골격', '몸체', '체격'], answer: '신체' },
  { type: 'sound_sentence', sentence: '(期間) 내에 완성해야 해요.', hanja: '期間', prompt: 'ext_2280', choices: ['기간', '시간', '기한', '기일'], answer: '기간' },
  { type: 'sound_sentence', sentence: '(高山) 지대에는 눈이 많아요.', hanja: '高山', prompt: 'ext_2280', choices: ['고산', '설산', '고지', '고원'], answer: '고산' },
  { type: 'sound_sentence', sentence: '(各種) 요리를 만들어요.', hanja: '各種', prompt: 'ext_2280', choices: ['각종', '다양', '종류', '각색'], answer: '각종' },
  { type: 'sound_sentence', sentence: '(旗手) 가 앞장서요.', hanja: '旗手', prompt: 'ext_2280', choices: ['기수', '선봉', '기함', '선두'], answer: '기수' },

  // ── [33-61] 한자 → 훈+음 ──
  { type: 'meaning_sound', hanja: '成', prompt: 'ext_1867', choices: ['이룰 성', '공 공', '나눌 분', '믿을 신'], answer: '이룰 성' },
  { type: 'meaning_sound', hanja: '功', prompt: 'ext_1867', choices: ['공 공', '빌 공', '이룰 성', '나눌 분'], answer: '공 공' },
  { type: 'meaning_sound', hanja: '各', prompt: 'ext_1867', choices: ['각각 각', '뿔 각', '느낄 감', '나눌 분'], answer: '각각 각' },
  { type: 'meaning_sound', hanja: '幸', prompt: 'ext_1867', choices: ['다행 행', '다닐 행', '열 개', '강할 강'], answer: '다행 행' },
  { type: 'meaning_sound', hanja: '反', prompt: 'ext_1867', choices: ['돌이킬 반', '반 반', '뿌리 근', '공 공'], answer: '돌이킬 반' },
  { type: 'meaning_sound', hanja: '高', prompt: 'ext_1867', choices: ['높을 고', '옛 고', '생각할 고', '가까울 근'], answer: '높을 고' },
  { type: 'meaning_sound', hanja: '半', prompt: 'ext_1867', choices: ['반 반', '돌이킬 반', '나눌 분', '셀 산'], answer: '반 반' },
  { type: 'meaning_sound', hanja: '等', prompt: 'ext_1867', choices: ['무리 등', '오를 등', '나눌 분', '셀 산'], answer: '무리 등' },
  { type: 'meaning_sound', hanja: '科', prompt: 'ext_1867', choices: ['과목 과', '실과 과', '뿌리 근', '이룰 성'], answer: '과목 과' },
  { type: 'meaning_sound', hanja: '果', prompt: 'ext_1867', choices: ['실과 과', '과목 과', '심을 식', '나눌 분'], answer: '실과 과' },
  { type: 'meaning_sound', hanja: '球', prompt: 'ext_1867', choices: ['공 구', '공 공', '나눌 분', '셀 산'], answer: '공 구' },
  { type: 'meaning_sound', hanja: '急', prompt: 'ext_1867', choices: ['급할 급', '미칠 급', '등급 급', '세상 세'], answer: '급할 급' },
  { type: 'meaning_sound', hanja: '始', prompt: 'ext_1867', choices: ['비로소 시', '때 시', '일 사', '공 구'], answer: '비로소 시' },
  { type: 'meaning_sound', hanja: '信', prompt: 'ext_1867', choices: ['믿을 신', '새 신', '몸 신', '세상 세'], answer: '믿을 신' },
  { type: 'meaning_sound', hanja: '理', prompt: 'ext_1867', choices: ['다스릴 리', '이로울 리', '마을 리', '힘 력'], answer: '다스릴 리' },
  { type: 'meaning_sound', hanja: '算', prompt: 'ext_1867', choices: ['셀 산', '나눌 분', '이룰 성', '각각 각'], answer: '셀 산' },
  { type: 'meaning_sound', hanja: '分', prompt: 'ext_1867', choices: ['나눌 분', '셀 산', '반 반', '공 공'], answer: '나눌 분' },
  { type: 'meaning_sound', hanja: '事', prompt: 'ext_1867', choices: ['일 사', '죽을 사', '하여금 사', '셀 산'], answer: '일 사' },
  { type: 'meaning_sound', hanja: '植', prompt: 'ext_1867', choices: ['심을 식', '밥 식', '과목 과', '뿌리 근'], answer: '심을 식' },
  { type: 'meaning_sound', hanja: '世', prompt: 'ext_1867', choices: ['세상 세', '새 신', '이룰 성', '나눌 분'], answer: '세상 세' },
  { type: 'meaning_sound', hanja: '放', prompt: 'ext_1867', choices: ['놓을 방', '모 방', '나눌 분', '움직일 동'], answer: '놓을 방' },
  { type: 'meaning_sound', hanja: '音', prompt: 'ext_1867', choices: ['소리 음', '마실 음', '기운 기', '말씀 화'], answer: '소리 음' },
  { type: 'meaning_sound', hanja: '代', prompt: 'ext_1867', choices: ['대신할 대', '클 대', '기다릴 대', '높을 고'], answer: '대신할 대' },
  { type: 'meaning_sound', hanja: '形', prompt: 'ext_1867', choices: ['모양 형', '나타날 현', '빛 광', '나눌 분'], answer: '모양 형' },
  { type: 'meaning_sound', hanja: '運', prompt: 'ext_1867', choices: ['옮길 운', '기를 육', '쓸 용', '날랠 용'], answer: '옮길 운' },
  { type: 'meaning_sound', hanja: '公', prompt: 'ext_1867', choices: ['공평할 공', '빌 공', '한가지 공', '공 공'], answer: '공평할 공' },
  { type: 'meaning_sound', hanja: '身', prompt: 'ext_1867', choices: ['몸 신', '새 신', '믿을 신', '공 공'], answer: '몸 신' },
  { type: 'meaning_sound', hanja: '圖', prompt: 'ext_1867', choices: ['그림 도', '길 도', '대신할 대', '나눌 분'], answer: '그림 도' },
  { type: 'meaning_sound', hanja: '新', prompt: 'ext_1867', choices: ['새 신', '믿을 신', '몸 신', '옛 고'], answer: '새 신' },

  // ── [62-63] 반대어 ──
  { type: 'opposite', hanja: '前', prompt: 'ext_1876', choices: ['後', '下', '少', '弱'], answer: '後' },
  { type: 'opposite', hanja: '長', prompt: 'ext_1876', choices: ['短', '弱', '低', '少'], answer: '短' },

  // ── [64-65] 빈칸 채우기 ──
  { type: 'fill_blank', hanja: '成□', prompt: 'ext_2458', choices: ['功', '力', '名', '事'], answer: '功' },
  { type: 'fill_blank', hanja: '科□', prompt: 'ext_2458', choices: ['學', '動', '生', '業'], answer: '學' },

  // ── [66-67] 뜻 → 한자어 ──
  { type: 'meaning_to_word', prompt: 'ext_3238', promptParams: { meaning: '새로운 소식을 전하는 신문' }, choices: ['新聞', '新式', '信號', '新世'], answer: '新聞' },
  { type: 'meaning_to_word', prompt: 'ext_3239', promptParams: { meaning: '높은 속도' }, choices: ['高速', '高級', '速度', '高大'], answer: '高速' },

  // ── [68-77] 밑줄 친 말 → 한자 ──
  { type: 'underline', sentence: '과학 기술이 빠르게 발전해요.', underline: '과학', prompt: 'ext_2360', choices: ['科學', '果學', '課學', '科鶴'], answer: '科學' },
  { type: 'underline', sentence: '그것은 근본적인 문제예요.', underline: '근본', prompt: 'ext_2360', choices: ['根本', '近本', '勤本', '謹本'], answer: '根本' },
  { type: 'underline', sentence: '감사의 마음을 전해요.', underline: '감사', prompt: 'ext_2360', choices: ['感謝', '感事', '感史', '感思'], answer: '感謝' },
  { type: 'underline', sentence: '세계 여행이 꿈이에요.', underline: '세계', prompt: 'ext_2360', choices: ['世界', '細界', '洗界', '世計'], answer: '世界' },
  { type: 'underline', sentence: '신념이 강한 사람이에요.', underline: '신념', prompt: 'ext_2360', choices: ['信念', '新念', '身念', '神念'], answer: '信念' },
  { type: 'underline', sentence: '시작이 반이라는 말이 있어요.', underline: '시작', prompt: 'ext_2360', choices: ['始作', '時作', '詩作', '示作'], answer: '始作' },
  { type: 'underline', sentence: '사건을 조사해요.', underline: '사건', prompt: 'ext_2360', choices: ['事件', '史件', '死件', '事健'], answer: '事件' },
  { type: 'underline', sentence: '반성하고 나아가야 해요.', underline: '반성', prompt: 'ext_2360', choices: ['反省', '半省', '班省', '反性'], answer: '反省' },
  { type: 'underline', sentence: '각종 준비물을 챙겼어요.', underline: '각종', prompt: 'ext_2360', choices: ['各種', '覺種', '角種', '各宗'], answer: '各種' },
  { type: 'underline', sentence: '고속버스를 탔어요.', underline: '고속', prompt: 'ext_2360', choices: ['高速', '古速', '考速', '高俗'], answer: '高速' },

  // ── [78-80] 필순 ──
  { type: 'stroke', hanja: '和', prompt: 'ext_1868', strokeUnit: 'ext_3242', choices: ['8', '6', '7', '9'], answer: '8' },
  { type: 'stroke', hanja: '明', prompt: 'ext_1868', strokeUnit: 'ext_3242', choices: ['8', '6', '7', '9'], answer: '8' },
  { type: 'stroke', hanja: '界', prompt: 'ext_1868', strokeUnit: 'ext_3242', choices: ['9', '7', '8', '10'], answer: '9' },
];

export const PASS_COUNT = 56;

export const TYPE_LABELS = {
  sound_sentence: 'ext_1771',
  meaning_sound: 'ext_1672',
  opposite: 'ext_1715',
  fill_blank: 'ext_1588',
  meaning_to_word: 'ext_1636',
  underline: 'ext_1589',
  stroke: 'ext_1633',
};
