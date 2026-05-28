const CHAR_TYPES = ['garae', 'jeolmi', 'chapssal'];

// Generate 1000 mock users with decreasing XP
export const MOCK_USERS = Array.from({ length: 1000 }, (_, i) => ({
    id: `m${i}`,
    name: `탐험가 ${i + 1}`,
    xp: Math.floor(30000 * Math.pow(0.995, i)), // Curve from 30000 down
    charType: CHAR_TYPES[Math.floor(Math.random() * 3)]
}));

export const getLeaderboardPosition = (xp, mockUsers = MOCK_USERS) => {
    let position = 1;
    for (const u of mockUsers) {
        if (u.xp > xp) position++;
    }
    return position;
};

/**
 * LV.20 레벨 시스템 확장
 *
 * 두 레벨마다 칭호가 바뀝니다. (새싹 -> 성장 -> 중급 -> 고급 -> 마스터 -> 영웅 -> 전설 -> 신화 -> 천상 -> 불멸)
 * 캐릭터 이미지는 레벨 17이 되어야 최종 5단계(불멸/천상)에 도달합니다.
 */
const LEVEL_THRESHOLDS = [
    0,      // 1: 새싹
    500,    // 2: 새싹
    1500,   // 3: 성장
    3500,   // 4: 성장
    7000,   // 5: 중급
    12000,  // 6: 중급
    19000,  // 7: 고급
    28000,  // 8: 고급
    40000,  // 9: 마스터
    55000,  // 10: 마스터
    75000,  // 11: 영웅
    100000, // 12: 영웅
    130000, // 13: 전설
    170000, // 14: 전설
    220000, // 15: 신화
    280000, // 16: 신화
    360000, // 17: 천상
    460000, // 18: 천상
    600000, // 19: 불멸
    800000  // 20: 불멸
];

export const getLevel = (xp) => {
    let level = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            level = i + 1;
            break;
        }
    }
    return Math.min(level, 20); // Max level 20
};

export const getNextLevelXp = (level) => {
    if (level >= 20) return null; // MAX
    return LEVEL_THRESHOLDS[level]; // level은 1-based, index는 0-based
};

export const getLevelProgress = (xp, level) => {
    if (level >= 20) return 100;
    const current = LEVEL_THRESHOLDS[level - 1];
    const next = LEVEL_THRESHOLDS[level];
    return Math.max(0, Math.min(100, Math.round(((xp - current) / (next - current)) * 100)));
};

// 레벨 → 캐릭터 이미지 단계 (1~5)
const levelToImageRank = (level) => {
    if (level >= 17) return 5;
    if (level >= 13) return 4;
    if (level >= 9)  return 3;
    if (level >= 5)  return 2;
    return 1;
};

export const getRankDetails = (xp, charType, position = 9999) => {
    const VALID = ['garae', 'jeolmi', 'chapssal', 'muzi'];
    const type = VALID.includes(charType) ? charType : 'garae';
    const level = getLevel(xp);
    const imageRank = levelToImageRank(level);

    const fullName = {
        garae: '가래뭉치',
        jeolmi: '절미뭉치',
        chapssal: '찹쌀뭉치',
        muzi: '무지뭉치'
    };

    const rankNames = [
        '새싹', '새싹', 
        '성장', '성장', 
        '중급', '중급', 
        '고급', '고급', 
        '마스터', '마스터', 
        '영웅', '영웅', 
        '전설', '전설', 
        '신화', '신화', 
        '천상', '천상', 
        '불멸', '불멸'
    ];
    const rankName = rankNames[level - 1] || '불멸';

    return {
        name: fullName[type] || '뭉치',
        avatar: `/assets/images/characters/${type}/rank_${imageRank}.webp`,
        level,
        imageRank,
        rankName,
        nextXp: getNextLevelXp(level),
        progress: getLevelProgress(xp, level),
    };
};

export const getCharacterImage = (charType, status) => {
    const VALID = ['garae', 'jeolmi', 'chapssal', 'muzi'];
    const type = VALID.includes(charType) ? charType : 'garae';
    
    if (status === 'success') {
        return `/assets/images/characters/${type}/sucess.png`;
    }
    if (status === 'failure') {
        return `/assets/images/characters/${type}/failure.png`;
    }
    if (status === 'keep_going') {
        return `/assets/images/characters/${type}/keep_going.png`;
    }
    
    // Fallbacks
    if (status === 'success') return '/assets/images/icons/success_new.webp';
    return '/assets/images/icons/timeout_new.webp';
};

export { LEVEL_THRESHOLDS };
