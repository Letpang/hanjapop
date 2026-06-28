export const CHARACTERS = [
    {
        id: 'garae',
        name: 'ext_1361',
        image: '/assets/images/characters/garae/rank_1.webp',
        finalImage: '/assets/images/characters/garae/rank_5.webp',
        color: '#FF9EBB',
        glow: 'rgba(255,107,157,0.6)',
        desc: 'ext_2673',
    },
    {
        id: 'jeolmi',
        name: 'ext_1362',
        image: '/assets/images/characters/jeolmi/rank_1.webp',
        finalImage: '/assets/images/characters/jeolmi/rank_5.webp',
        color: '#FFB870',
        glow: 'rgba(255,160,80,0.6)',
        desc: 'ext_2663',
    },
    {
        id: 'chapssal',
        name: 'ext_1363',
        image: '/assets/images/characters/chapssal/rank_1.webp',
        finalImage: '/assets/images/characters/chapssal/rank_5.webp',
        color: '#82E0AA',
        glow: 'rgba(100,200,80,0.6)',
        desc: 'ext_2113',
    },
    {
        id: 'muzi',
        name: 'ext_1364',
        image: '/assets/images/characters/muzi/rank_1.webp',
        finalImage: '/assets/images/characters/muzi/rank_5.webp',
        color: '#D291BC',
        glow: 'rgba(180,120,200,0.6)',
        desc: 'ext_2275',
    },
];

export const hasFinalConsonant = (str) => {
    if (!str) return false;
    const code = str.charCodeAt(str.length - 1) - 0xAC00;
    return code >= 0 && code % 28 !== 0;
};
