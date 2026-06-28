// ─── 7급 기출 기반 문제 (111회·112회) — 70문항 ───────────────────────────────
export const QUESTIONS = [
  // ── [1-32] 독음: 문장 속 한자어 읽기 ──
  { type: 'sound_sentence', sentence: '(千秋) 에 빛날 이름을 남겨요.', hanja: '千秋', prompt: 'ext_2280', choices: ['천추', '춘추', '천년', '추계'], answer: '천추' },
  { type: 'sound_sentence', sentence: '(住所) 를 적어주세요.', hanja: '住所', prompt: 'ext_2280', choices: ['주소', '주택', '거소', '소재'], answer: '주소' },
  { type: 'sound_sentence', sentence: '(生命) 은 소중해요.', hanja: '生命', prompt: 'ext_2280', choices: ['생명', '명령', '생존', '명칭'], answer: '생명' },
  { type: 'sound_sentence', sentence: '(秋夕) 에 고향에 가요.', hanja: '秋夕', prompt: 'ext_2280', choices: ['추석', '하지', '석양', '추분'], answer: '추석' },
  { type: 'sound_sentence', sentence: '주인공이 (登場) 했어요.', hanja: '登場', prompt: 'ext_2280', choices: ['등장', '출장', '입장', '등산'], answer: '등장' },
  { type: 'sound_sentence', sentence: '(休日) 에는 집에서 쉬어요.', hanja: '休日', prompt: 'ext_2280', choices: ['휴일', '평일', '공휴', '주일'], answer: '휴일' },
  { type: 'sound_sentence', sentence: '(靑春) 은 두 번 오지 않아요.', hanja: '靑春', prompt: 'ext_2280', choices: ['청춘', '청년', '봄날', '청명'], answer: '청춘' },
  { type: 'sound_sentence', sentence: '(百年) 의 역사를 자랑해요.', hanja: '百年', prompt: 'ext_2280', choices: ['백년', '천년', '백일', '만년'], answer: '백년' },
  { type: 'sound_sentence', sentence: '(天下) 에 이런 곳은 없어요.', hanja: '天下', prompt: 'ext_2280', choices: ['천하', '세상', '천지', '지하'], answer: '천하' },
  { type: 'sound_sentence', sentence: '(生活) 이 많이 바뀌었어요.', hanja: '生活', prompt: 'ext_2280', choices: ['생활', '활동', '생기', '활발'], answer: '생활' },
  { type: 'sound_sentence', sentence: '(時間) 이 금이에요.', hanja: '時間', prompt: 'ext_2280', choices: ['시간', '시절', '시대', '기간'], answer: '시간' },
  { type: 'sound_sentence', sentence: '(春秋) 는 공자의 역사서예요.', hanja: '春秋', prompt: 'ext_2280', choices: ['춘추', '추분', '춘분', '동지'], answer: '춘추' },
  { type: 'sound_sentence', sentence: '(海水) 욕장이 가까워요.', hanja: '海水', prompt: 'ext_2280', choices: ['해수', '담수', '해양', '수면'], answer: '해수' },
  { type: 'sound_sentence', sentence: '(地下) 철을 타고 왔어요.', hanja: '地下', prompt: 'ext_2280', choices: ['지하', '지상', '토지', '지면'], answer: '지하' },
  { type: 'sound_sentence', sentence: '(草原) 에서 말이 달려요.', hanja: '草原', prompt: 'ext_2280', choices: ['초원', '광야', '초목', '초지'], answer: '초원' },
  { type: 'sound_sentence', sentence: '(住民) 센터에서 서류를 발급해요.', hanja: '住民', prompt: 'ext_2280', choices: ['주민', '주택', '이주', '시민'], answer: '주민' },
  { type: 'sound_sentence', sentence: '(命令) 에 따라 행동해요.', hanja: '命令', prompt: 'ext_2280', choices: ['명령', '호령', '지령', '명칭'], answer: '명령' },
  { type: 'sound_sentence', sentence: '자수하고 (光明) 을 찾아요.', hanja: '光明', prompt: 'ext_2280', choices: ['광명', '광채', '광경', '광선'], answer: '광명' },
  { type: 'sound_sentence', sentence: '(竹林) 사이로 바람이 불어요.', hanja: '竹林', prompt: 'ext_2280', choices: ['죽림', '산림', '죽순', '대림'], answer: '죽림' },
  { type: 'sound_sentence', sentence: '(天地) 가 개벽한 것 같아요.', hanja: '天地', prompt: 'ext_2280', choices: ['천지', '대지', '천하', '지상'], answer: '천지' },
  { type: 'sound_sentence', sentence: '(登山) 을 즐겨요.', hanja: '登山', prompt: 'ext_2280', choices: ['등산', '산행', '등정', '하산'], answer: '등산' },
  { type: 'sound_sentence', sentence: '(年度) 말에 결산해요.', hanja: '年度', prompt: 'ext_2280', choices: ['연도', '연간', '학년', '연말'], answer: '연도' },
  { type: 'sound_sentence', sentence: '(出入) 을 금지해요.', hanja: '出入', prompt: 'ext_2280', choices: ['출입', '출발', '출구', '입구'], answer: '출입' },
  { type: 'sound_sentence', sentence: '(草木) 이 우거진 산이에요.', hanja: '草木', prompt: 'ext_2280', choices: ['초목', '식물', '수목', '화초'], answer: '초목' },
  { type: 'sound_sentence', sentence: '(田園) 생활이 여유로워요.', hanja: '田園', prompt: 'ext_2280', choices: ['전원', '농촌', '농지', '전지'], answer: '전원' },
  { type: 'sound_sentence', sentence: '(冬季) 올림픽을 응원해요.', hanja: '冬季', prompt: 'ext_2280', choices: ['동계', '하계', '춘계', '추계'], answer: '동계' },
  { type: 'sound_sentence', sentence: '(村落) 에서 오래 살았어요.', hanja: '村落', prompt: 'ext_2280', choices: ['촌락', '부락', '촌민', '농촌'], answer: '촌락' },
  { type: 'sound_sentence', sentence: '(海上) 에서 바라보는 일출이에요.', hanja: '海上', prompt: 'ext_2280', choices: ['해상', '수상', '해하', '해저'], answer: '해상' },
  { type: 'sound_sentence', sentence: '(生年) 月日을 적어주세요.', hanja: '生年', prompt: 'ext_2280', choices: ['생년', '생일', '출생', '연도'], answer: '생년' },
  { type: 'sound_sentence', sentence: '(千里) 길도 한 걸음부터예요.', hanja: '千里', prompt: 'ext_2280', choices: ['천리', '만리', '천년', '백리'], answer: '천리' },
  { type: 'sound_sentence', sentence: '(夏服) 으로 갈아입었어요.', hanja: '夏服', prompt: 'ext_2280', choices: ['하복', '동복', '하계', '춘복'], answer: '하복' },
  { type: 'sound_sentence', sentence: '(休學) 을 신청했어요.', hanja: '休學', prompt: 'ext_2280', choices: ['휴학', '복학', '휴식', '등교'], answer: '휴학' },

  // ── [33-34] 밑줄 친 말 → 한자어 ──
  { type: 'underline', sentence: '봄에는 등산을 많이 해요.', underline: '등산', prompt: 'ext_2245', choices: ['登山', '登場', '出山', '山行'], answer: '登山' },
  { type: 'underline', sentence: '그곳의 생활은 단순해요.', underline: '생활', prompt: 'ext_2245', choices: ['生活', '生命', '活動', '生氣'], answer: '生活' },

  // ── [35-54] 한자 → 훈+음 ──
  { type: 'meaning_sound', hanja: '春', prompt: 'ext_1867', choices: ['봄 춘', '여름 하', '가을 추', '겨울 동'], answer: '봄 춘' },
  { type: 'meaning_sound', hanja: '夏', prompt: 'ext_1867', choices: ['여름 하', '봄 춘', '가을 추', '겨울 동'], answer: '여름 하' },
  { type: 'meaning_sound', hanja: '秋', prompt: 'ext_1867', choices: ['가을 추', '봄 춘', '여름 하', '겨울 동'], answer: '가을 추' },
  { type: 'meaning_sound', hanja: '冬', prompt: 'ext_1867', choices: ['겨울 동', '봄 춘', '여름 하', '가을 추'], answer: '겨울 동' },
  { type: 'meaning_sound', hanja: '千', prompt: 'ext_1867', choices: ['일천 천', '일백 백', '일만 만', '열 십'], answer: '일천 천' },
  { type: 'meaning_sound', hanja: '百', prompt: 'ext_1867', choices: ['일백 백', '일천 천', '일만 만', '열 십'], answer: '일백 백' },
  { type: 'meaning_sound', hanja: '時', prompt: 'ext_1867', choices: ['때 시', '날 일', '해 년', '사이 간'], answer: '때 시' },
  { type: 'meaning_sound', hanja: '年', prompt: 'ext_1867', choices: ['해 년', '달 월', '날 일', '때 시'], answer: '해 년' },
  { type: 'meaning_sound', hanja: '生', prompt: 'ext_1867', choices: ['날 생', '죽을 사', '살 활', '나갈 출'], answer: '날 생' },
  { type: 'meaning_sound', hanja: '命', prompt: 'ext_1867', choices: ['목숨 명', '이름 명', '날 생', '죽을 사'], answer: '목숨 명' },
  { type: 'meaning_sound', hanja: '住', prompt: 'ext_1867', choices: ['살 주', '살 활', '살 거', '땅 지'], answer: '살 주' },
  { type: 'meaning_sound', hanja: '登', prompt: 'ext_1867', choices: ['오를 등', '아래 하', '나갈 출', '들 입'], answer: '오를 등' },
  { type: 'meaning_sound', hanja: '休', prompt: 'ext_1867', choices: ['쉴 휴', '편안할 안', '움직일 동', '살 주'], answer: '쉴 휴' },
  { type: 'meaning_sound', hanja: '海', prompt: 'ext_1867', choices: ['바다 해', '강 강', '메 산', '하늘 천'], answer: '바다 해' },
  { type: 'meaning_sound', hanja: '天', prompt: 'ext_1867', choices: ['하늘 천', '땅 지', '메 산', '바다 해'], answer: '하늘 천' },
  { type: 'meaning_sound', hanja: '地', prompt: 'ext_1867', choices: ['땅 지', '하늘 천', '메 산', '내 천'], answer: '땅 지' },
  { type: 'meaning_sound', hanja: '草', prompt: 'ext_1867', choices: ['풀 초', '나무 목', '꽃 화', '대 죽'], answer: '풀 초' },
  { type: 'meaning_sound', hanja: '老', prompt: 'ext_1867', choices: ['늙을 로', '마을 리', '길 로', '아침 조'], answer: '늙을 로' },
  { type: 'meaning_sound', hanja: '同', prompt: 'ext_1867', choices: ['한가지 동', '동녘 동', '겨울 동', '골 동'], answer: '한가지 동' },
  { type: 'meaning_sound', hanja: '林', prompt: 'ext_1867', choices: ['수풀 림', '나무 목', '대 죽', '메 산'], answer: '수풀 림' },

  // ── [55-64] 훈음 → 한자 ──
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '봄 춘' }, hanja: null, choices: ['春', '夏', '秋', '冬'], answer: '春' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '하늘 천' }, hanja: null, choices: ['天', '地', '川', '林'], answer: '天' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '살 주' }, hanja: null, choices: ['住', '所', '村', '里'], answer: '住' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '오를 등' }, hanja: null, choices: ['登', '出', '入', '來'], answer: '登' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '풀 초' }, hanja: null, choices: ['草', '花', '林', '色'], answer: '草' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '바다 해' }, hanja: null, choices: ['海', '江', '川', '湖'], answer: '海' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '겨울 동' }, hanja: null, choices: ['冬', '春', '夏', '秋'], answer: '冬' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '꽃 화' }, hanja: null, choices: ['花', '草', '林', '木'], answer: '花' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '일천 천' }, hanja: null, choices: ['千', '百', '萬', '十'], answer: '千' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '쉴 휴' }, hanja: null, choices: ['休', '安', '宿', '眠'], answer: '休' },

  // ── [65-66] 반대어 ──
  { type: 'opposite', hanja: '出', prompt: 'ext_1876', choices: ['入', '來', '登', '下'], answer: '入' },
  { type: 'opposite', hanja: '上', prompt: 'ext_1876', choices: ['下', '左', '右', '東'], answer: '下' },

  // ── [67-68] 뜻 → 한자어 ──
  { type: 'meaning_to_word', prompt: 'ext_3238', promptParams: { meaning: '산에 올라가는 일' }, choices: ['登山', '出山', '入山', '下山'], answer: '登山' },
  { type: 'meaning_to_word', prompt: 'ext_3238', promptParams: { meaning: '봄과 가을' }, choices: ['春秋', '春夏', '夏秋', '秋冬'], answer: '春秋' },

  // ── [69-70] 필순 ──
  { type: 'stroke', hanja: '春', prompt: 'ext_1868', strokeUnit: 'ext_3242', choices: ['9', '7', '8', '10'], answer: '9' },
  { type: 'stroke', hanja: '所', prompt: 'ext_1868', strokeUnit: 'ext_3242', choices: ['8', '6', '7', '9'], answer: '8' },
];

export const PASS_COUNT = 49;

export const TYPE_LABELS = {
  sound_sentence: 'ext_1771',
  meaning_sound: 'ext_1672',
  underline: 'ext_1680',
  hanja: 'ext_1631',
  opposite: 'ext_1715',
  meaning_to_word: 'ext_1636',
  stroke: 'ext_1633',
};
