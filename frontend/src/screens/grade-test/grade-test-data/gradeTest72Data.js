// ─── 7급II 기출 기반 문제 (111회·112회) — 60문항 ─────────────────────────────
export const QUESTIONS = [
  // ── [1-22] 독음: 문장 속 한자어 읽기 ──
  { type: 'sound_sentence', sentence: '(食事) 시간이 됐어요.', hanja: '食事', prompt: 'ext_2280', choices: ['식사', '간식', '식당', '식후'], answer: '식사' },
  { type: 'sound_sentence', sentence: '(電氣) 요금이 청구됐어요.', hanja: '電氣', prompt: 'ext_2280', choices: ['전기', '전화', '전선', '전등'], answer: '전기' },
  { type: 'sound_sentence', sentence: '(活動) 시간에 운동을 했어요.', hanja: '活動', prompt: 'ext_2280', choices: ['활동', '행동', '활발', '동작'], answer: '활동' },
  { type: 'sound_sentence', sentence: '(間食) 으로 과일을 먹었어요.', hanja: '間食', prompt: 'ext_2280', choices: ['간식', '식사', '간격', '조식'], answer: '간식' },
  { type: 'sound_sentence', sentence: '(正直) 한 사람이 되어야 해요.', hanja: '正直', prompt: 'ext_2280', choices: ['정직', '직선', '정확', '직업'], answer: '정직' },
  { type: 'sound_sentence', sentence: '(安全) 하게 길을 건너세요.', hanja: '安全', prompt: 'ext_2280', choices: ['안전', '완전', '안보', '안정'], answer: '안전' },
  { type: 'sound_sentence', sentence: '(農場) 에서 채소를 키워요.', hanja: '農場', prompt: 'ext_2280', choices: ['농장', '농업', '장소', '농사'], answer: '농장' },
  { type: 'sound_sentence', sentence: '(自動) 으로 문이 열렸어요.', hanja: '自動', prompt: 'ext_2280', choices: ['자동', '수동', '자연', '자립'], answer: '자동' },
  { type: 'sound_sentence', sentence: '(道路) 공사로 길이 막혔어요.', hanja: '道路', prompt: 'ext_2280', choices: ['도로', '철로', '경로', '노선'], answer: '도로' },
  { type: 'sound_sentence', sentence: '(空氣) 가 맑아서 기분이 좋아요.', hanja: '空氣', prompt: 'ext_2280', choices: ['공기', '기후', '공중', '날씨'], answer: '공기' },
  { type: 'sound_sentence', sentence: '(記念) 사진을 찍었어요.', hanja: '記念', prompt: 'ext_2280', choices: ['기념', '추억', '기억', '기간'], answer: '기념' },
  { type: 'sound_sentence', sentence: '(江山) 이 아름다워요.', hanja: '江山', prompt: 'ext_2280', choices: ['강산', '산천', '강변', '산하'], answer: '강산' },
  { type: 'sound_sentence', sentence: '(同門) 이라 반가웠어요.', hanja: '同門', prompt: 'ext_2280', choices: ['동문', '교문', '동창', '동행'], answer: '동문' },
  { type: 'sound_sentence', sentence: '(話題) 가 풍성했어요.', hanja: '話題', prompt: 'ext_2280', choices: ['화제', '주제', '화백', '논제'], answer: '화제' },
  { type: 'sound_sentence', sentence: '(農夫) 가 밭을 갈고 있어요.', hanja: '農夫', prompt: 'ext_2280', choices: ['농부', '어부', '농민', '소작'], answer: '농부' },
  { type: 'sound_sentence', sentence: '(手動) 으로 조작해야 해요.', hanja: '手動', prompt: 'ext_2280', choices: ['수동', '자동', '수화', '수공'], answer: '수동' },
  { type: 'sound_sentence', sentence: '(全力) 을 다해 달렸어요.', hanja: '全力', prompt: 'ext_2280', choices: ['전력', '전기', '전진', '전심'], answer: '전력' },
  { type: 'sound_sentence', sentence: '(動力) 이 강한 엔진이에요.', hanja: '動力', prompt: 'ext_2280', choices: ['동력', '전력', '동작', '원동'], answer: '동력' },
  { type: 'sound_sentence', sentence: '(空白) 에 이름을 써 넣으세요.', hanja: '空白', prompt: 'ext_2280', choices: ['공백', '여백', '공간', '백지'], answer: '공백' },
  { type: 'sound_sentence', sentence: '(氣力) 이 넘치는 청년이에요.', hanja: '氣力', prompt: 'ext_2280', choices: ['기력', '기운', '기세', '역기'], answer: '기력' },
  { type: 'sound_sentence', sentence: '(正答) 을 골라보세요.', hanja: '正答', prompt: 'ext_2280', choices: ['정답', '오답', '정확', '답변'], answer: '정답' },
  { type: 'sound_sentence', sentence: '(安心) 하고 다녀오세요.', hanja: '安心', prompt: 'ext_2280', choices: ['안심', '안도', '안전', '심정'], answer: '안심' },

  // ── [23-42] 한자 → 훈+음 ──
  { type: 'meaning_sound', hanja: '江', prompt: 'ext_1867', choices: ['강 강', '내 천', '바다 해', '메 산'], answer: '강 강' },
  { type: 'meaning_sound', hanja: '農', prompt: 'ext_1867', choices: ['농사 농', '밭 전', '수풀 림', '메 산'], answer: '농사 농' },
  { type: 'meaning_sound', hanja: '答', prompt: 'ext_1867', choices: ['대답 답', '물을 문', '말씀 화', '글 문'], answer: '대답 답' },
  { type: 'meaning_sound', hanja: '道', prompt: 'ext_1867', choices: ['길 도', '길 로', '마을 리', '문 문'], answer: '길 도' },
  { type: 'meaning_sound', hanja: '動', prompt: 'ext_1867', choices: ['움직일 동', '힘 력', '살 활', '다닐 행'], answer: '움직일 동' },
  { type: 'meaning_sound', hanja: '力', prompt: 'ext_1867', choices: ['힘 력', '손 수', '마음 심', '발 족'], answer: '힘 력' },
  { type: 'meaning_sound', hanja: '空', prompt: 'ext_1867', choices: ['빌 공', '하늘 천', '땅 지', '흰 백'], answer: '빌 공' },
  { type: 'meaning_sound', hanja: '記', prompt: 'ext_1867', choices: ['기록할 기', '말씀 화', '글 문', '기운 기'], answer: '기록할 기' },
  { type: 'meaning_sound', hanja: '氣', prompt: 'ext_1867', choices: ['기운 기', '기록할 기', '힘 력', '마음 심'], answer: '기운 기' },
  { type: 'meaning_sound', hanja: '名', prompt: 'ext_1867', choices: ['이름 명', '목숨 명', '밝을 명', '백성 민'], answer: '이름 명' },
  { type: 'meaning_sound', hanja: '話', prompt: 'ext_1867', choices: ['말씀 화', '물을 문', '대답 답', '기록할 기'], answer: '말씀 화' },
  { type: 'meaning_sound', hanja: '自', prompt: 'ext_1867', choices: ['스스로 자', '글자 자', '아들 자', '농사 농'], answer: '스스로 자' },
  { type: 'meaning_sound', hanja: '手', prompt: 'ext_1867', choices: ['손 수', '발 족', '눈 목', '귀 이'], answer: '손 수' },
  { type: 'meaning_sound', hanja: '安', prompt: 'ext_1867', choices: ['편안할 안', '즐거울 락', '이름 명', '기운 기'], answer: '편안할 안' },
  { type: 'meaning_sound', hanja: '食', prompt: 'ext_1867', choices: ['밥 식', '마실 음', '쌀 미', '물 수'], answer: '밥 식' },
  { type: 'meaning_sound', hanja: '電', prompt: 'ext_1867', choices: ['번개 전', '비 우', '바람 풍', '구름 운'], answer: '번개 전' },
  { type: 'meaning_sound', hanja: '活', prompt: 'ext_1867', choices: ['살 활', '죽을 사', '날 생', '움직일 동'], answer: '살 활' },
  { type: 'meaning_sound', hanja: '間', prompt: 'ext_1867', choices: ['사이 간', '때 시', '문 문', '가운데 중'], answer: '사이 간' },
  { type: 'meaning_sound', hanja: '正', prompt: 'ext_1867', choices: ['바를 정', '정할 정', '기운 기', '이름 명'], answer: '바를 정' },
  { type: 'meaning_sound', hanja: '右', prompt: 'ext_1867', choices: ['오른 우', '왼 좌', '위 상', '아래 하'], answer: '오른 우' },

  // ── [43-44] 밑줄 친 말 → 한자어 ──
  { type: 'underline', sentence: '방학 때 활동을 많이 했어요.', underline: '활동', prompt: 'ext_2245', choices: ['活動', '行動', '活力', '動力'], answer: '活動' },
  { type: 'underline', sentence: '문이 자동으로 열렸습니다.', underline: '자동', prompt: 'ext_2245', choices: ['自動', '自然', '手動', '動力'], answer: '自動' },

  // ── [45-54] 훈음 → 한자 ──
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '강 강' }, hanja: null, choices: ['江', '河', '川', '海'], answer: '江' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '힘 력' }, hanja: null, choices: ['力', '手', '足', '工'], answer: '力' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '길 도' }, hanja: null, choices: ['道', '路', '街', '行'], answer: '道' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '움직일 동' }, hanja: null, choices: ['動', '靜', '運', '行'], answer: '動' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '빌 공' }, hanja: null, choices: ['空', '天', '地', '高'], answer: '空' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '기록할 기' }, hanja: null, choices: ['記', '話', '文', '書'], answer: '記' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '이름 명' }, hanja: null, choices: ['名', '命', '明', '民'], answer: '名' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '말씀 화' }, hanja: null, choices: ['話', '記', '道', '答'], answer: '話' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '손 수' }, hanja: null, choices: ['手', '足', '口', '目'], answer: '手' },
  { type: 'hanja', prompt: 'ext_3200', promptParams: { word: '농사 농' }, hanja: null, choices: ['農', '場', '田', '林'], answer: '農' },

  // ── [55-56] 반대어 ──
  { type: 'opposite', hanja: '前', prompt: 'ext_1876', choices: ['後', '先', '左', '右'], answer: '後' },
  { type: 'opposite', hanja: '男', prompt: 'ext_1876', choices: ['女', '少', '弱', '下'], answer: '女' },

  // ── [57-58] 뜻 → 한자어 ──
  { type: 'meaning_to_word', prompt: 'ext_3238', promptParams: { meaning: '음식을 먹는 일' }, choices: ['食事', '食堂', '食口', '間食'], answer: '食事' },
  { type: 'meaning_to_word', prompt: 'ext_3238', promptParams: { meaning: '저절로 작동함' }, choices: ['自動', '活動', '動力', '手動'], answer: '自動' },

  // ── [59-60] 필순 ──
  { type: 'stroke', hanja: '活', prompt: 'ext_1868', strokeUnit: 'ext_3242', choices: ['9', '7', '8', '10'], answer: '9' },
  { type: 'stroke', hanja: '空', prompt: 'ext_1868', strokeUnit: 'ext_3242', choices: ['8', '6', '7', '9'], answer: '8' },
];

export const PASS_COUNT = 42;

export const TYPE_LABELS = {
  sound_sentence: 'ext_1771',
  meaning_sound: 'ext_1672',
  underline: 'ext_1680',
  hanja: 'ext_1631',
  opposite: 'ext_1715',
  meaning_to_word: 'ext_1636',
  stroke: 'ext_1633',
};
