import { useMemo, useState } from 'react';
import HANJA_DATA from '../../../../hanja_unified.json';
import { useUnlockedHanja } from '../../../../hooks/useUnlockedHanja.js';
import { getRankDetails } from '../../../../utils/rankUtils.js';
import { DIFFICULTY_CONFIG, THEMES_CONFIG } from '../shootGameConstants.js';
import {
    buildShootGamePoolData,
    getGameThemeKey,
    getShootCategories,
    getStoredXp,
} from '../shootGameUtils.js';

export const useShootSetupState = ({
    avatarOverride,
    contentPool,
    currentDay,
    killsPerWaveOverride,
    selectedCharacter,
    unlockedHanjaIds,
    userXpOverride,
}) => {
    const selectedDifficulty = 'normal';
    const characterAvatar = useMemo(
        () => avatarOverride ?? getRankDetails(userXpOverride ?? getStoredXp(), selectedCharacter).avatar,
        [selectedCharacter, userXpOverride, avatarOverride]
    );

    const [viewMode, setViewMode] = useState('grade');
    const categories = useMemo(() => getShootCategories(HANJA_DATA), []);
    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
    const [selectedGrade, setSelectedGrade] = useState('전체');
    const { unlockedIds, unlockedGrades } = useUnlockedHanja(unlockedHanjaIds);

    const diffConfig = useMemo(() => {
        const base = DIFFICULTY_CONFIG[selectedDifficulty] || DIFFICULTY_CONFIG.normal;
        const overrides = killsPerWaveOverride ? { killsPerWave: killsPerWaveOverride } : {};
        return contentPool ? { ...base, wavesTotal: 1, ...overrides } : { ...base, ...overrides };
    }, [selectedDifficulty, contentPool, killsPerWaveOverride]);

    const gamePoolData = useMemo(() => buildShootGamePoolData({
        contentPool,
        hanjaData: HANJA_DATA,
        selectedCategory,
        selectedGrade,
        unlockedIds,
        viewMode,
    }), [viewMode, selectedGrade, selectedCategory, contentPool, unlockedIds]);

    const themeKey = getGameThemeKey(currentDay, selectedGrade);
    const themeConfig = THEMES_CONFIG[themeKey] || THEMES_CONFIG.mint;

    return {
        categories,
        characterAvatar,
        diffConfig,
        gamePoolData,
        selectedCategory,
        selectedDifficulty,
        selectedGrade,
        setSelectedCategory,
        setSelectedGrade,
        setViewMode,
        themeConfig,
        unlockedGrades,
        unlockedIds,
        viewMode,
    };
};
