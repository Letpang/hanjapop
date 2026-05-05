const CHAR_TYPES = ['garae', 'jeolmi', 'chapssal'];

// Generate 1000 mock users with decreasing XP
export const MOCK_USERS = Array.from({ length: 1000 }, (_, i) => ({
    id: `m${i}`,
    name: `탐험가 ${i + 1}`,
    xp: Math.floor(5000 * Math.pow(0.995, i)), // Curve from 5000 down
    charType: CHAR_TYPES[Math.floor(Math.random() * 3)]
}));

export const getLeaderboardPosition = (xp, mockUsers = MOCK_USERS) => {
    let position = 1;
    for (const u of mockUsers) {
        if (u.xp > xp) position++;
    }
    return position;
};

export const getRankDetails = (xp, charType, position = 9999) => {
    const VALID = ['garae', 'jeolmi', 'chapssal'];
    const type = VALID.includes(charType) ? charType : 'garae';

    let level = 1;
    if (xp >= 6000) level = 5;
    else if (xp >= 3000) level = 4;
    else if (xp >= 1500) level = 3;
    else if (xp >= 500) level = 2;
    else level = 1;

    const fullName = {
        garae: '가래뭉치',
        jeolmi: '절미뭉치',
        chapssal: '찹쌀뭉치'
    };
    
    // 뭉치 폴더 안의 이미지 사용
    return { 
        name: fullName[type] || '뭉치', 
        avatar: `/assets/images/characters/mungchi/${type}/rank_${level}.png`, 
        level 
    };
};
