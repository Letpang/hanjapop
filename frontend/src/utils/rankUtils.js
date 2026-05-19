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
 * LV.10 레벨 시스템
 *
 * 레벨 | 필요 XP | 캐릭터 이미지
 * ─────────────────────────────────────────
 *  1   |     0   | rank_1.png  (새싹 뭉치)
 *  2   |   500   | rank_1.png
 *  3   |  1500   | rank_2.png  (성장 뭉치)
 *  4   |  3500   | rank_2.png
 *  5   |  7000   | rank_3.png  (중급 뭉치)
 *  6   | 12000   | rank_3.png
 *  7   | 19000   | rank_4.png  (고급 뭉치)
 *  8   | 28000   | rank_4.png
 *  9   | 40000   | rank_5.png  (마스터 뭉치)
 * 10   | 55000   | rank_5.png  (전설 뭉치)
 */
const LEVEL_THRESHOLDS = [0, 500, 1500, 3500, 7000, 12000, 19000, 28000, 40000, 55000];

export const getLevel = (xp) => {
    let level = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            level = i + 1;
            break;
        }
    }
    return level;
};

export const getNextLevelXp = (level) => {
    if (level >= 10) return null; // MAX
    return LEVEL_THRESHOLDS[level]; // level은 1-based, index는 0-based이므로 level이 곧 다음 임계값 인덱스
};

export const getLevelProgress = (xp, level) => {
    if (level >= 10) return 100;
    const current = LEVEL_THRESHOLDS[level - 1];
    const next = LEVEL_THRESHOLDS[level];
    return Math.min(100, Math.round(((xp - current) / (next - current)) * 100));
};

// 레벨 → 캐릭터 이미지 단계 (1~5)
const levelToImageRank = (level) => {
    if (level >= 9) return 5;
    if (level >= 7) return 4;
    if (level >= 5) return 3;
    if (level >= 3) return 2;
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

    const rankNames = ['새싹', '새싹', '성장', '성장', '중급', '중급', '고급', '고급', '마스터', '전설'];
    const rankName = rankNames[level - 1] || '새싹';

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
