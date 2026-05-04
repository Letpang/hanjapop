const CHAR_TYPES = ['eunha', 'uju'];

export const MOCK_USERS = Array.from({ length: 1000 }, (_, i) => ({
    id: `m${i}`,
    name: `탐험가 ${i + 1}`,
    xp: Math.floor(5000 * Math.pow(0.995, i)),
    charType: CHAR_TYPES[i % 2]
}));

export const getLeaderboardPosition = (xp) => {
    let position = 1;
    for (const u of MOCK_USERS) {
        if (u.xp > xp) position++;
    }
    return position;
};

export const getRankDetails = (xp, charType, position = 9999) => {
    const avatar = `/assets/images/characters/${charType === 'uju' ? 'uju' : 'eunha'}.png`;

    let level, name;
    if (xp >= 2000 && position <= 10) { level = 5; name = '전설의 성주'; }
    else if (xp >= 1000 && position <= 100) { level = 4; name = '지혜의 수호자'; }
    else if (xp >= 500 && position <= 1000) { level = 3; name = '한자 우주인'; }
    else if (xp >= 200) { level = 2; name = '호기심 탐험가'; }
    else { level = 1; name = '꼬마 새싹'; }

    return { level, name, avatar };
};
