import { SK } from '../../../constants/storageKeys.js';

export const getStoredXp = () => {
    try {
        return Number(localStorage.getItem(SK.USER_XP) || '0');
    } catch {
        return 0;
    }
};

export const getShootCategories = (hanjaData = []) => [
    ...new Set(hanjaData.map(h => h.category).filter(Boolean)),
];

export const getGameThemeKey = (currentDay, selectedGrade) => {
    if (currentDay) {
        const dayNum = Number(currentDay);
        if (dayNum <= 30) return 'mint';
        if (dayNum <= 60) return 'coral';
        if (dayNum <= 90) return 'purple';
        return 'gold';
    }
    if (selectedGrade) {
        if (selectedGrade.includes('8급')) return 'mint';
        if (selectedGrade.includes('7급')) return 'coral';
        if (selectedGrade.includes('6급')) return 'purple';
        return 'gold';
    }
    return 'mint';
};
