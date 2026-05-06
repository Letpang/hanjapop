const CHAR_TYPES = ['garae', 'jeolmi', 'chapssal'];

// Generate 1000 mock users with decreasing XP
export const MOCK_USERS = Array.from({ length: 1000 }, (_, i) => ({
    id: `m${i}`,
    name: `탐험가 ${i + 1}`,
    xp: Math.floor(8000 * Math.pow(0.995, i)), // Curve from 8000 down
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
 *  2   |   200   | rank_1.png
 *  3   |   500   | rank_2.png  (성장 뭉치)
 *  4   |  1000   | rank_2.png
 *  5   |  1800   | rank_3.png  (중급 뭉치)
 *  6   |  2800   | rank_3.png
 *  7   |  4000   | rank_4.png  (고급 뭉치)
 *  8   |  5500   | rank_4.png
 *  9   |  7500   | rank_5.png  (마스터 뭉치)
 * 10   | 10000   | rank_5.png  (전설 뭉치)
 */
const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 1800, 2800, 4000, 5500, 7500, 10000];

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
    const VALID = ['garae', 'jeolmi', 'chapssal'];
    const type = VALID.includes(charType) ? charType : 'garae';
    const level = getLevel(xp);
    const imageRank = levelToImageRank(level);

    const fullName = {
        garae: '가래뭉치',
        jeolmi: '절미뭉치',
        chapssal: '찹쌀뭉치'
    };

    return {
        name: fullName[type] || '뭉치',
        avatar: `/assets/images/characters/mungchi/${type}/rank_${imageRank}.png`,
        level,
        imageRank,
        nextXp: getNextLevelXp(level),
        progress: getLevelProgress(xp, level),
    };
};

export { LEVEL_THRESHOLDS };
