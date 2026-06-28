import { useMemo, useState } from 'react';
import HANJA_DATA from '../../../../hanja_unified.json';
import { useUnlockedHanja } from '../../../../hooks/useUnlockedHanja.js';
import { getRankDetails } from '../../../../utils/rankUtils.js';
import {
    buildSentenceActiveHanjaSet,
    getSentenceCategories,
} from '../sentenceQuizUtils.js';

export const useSentenceQuizSetupState = ({
    contentPool,
    selectedCharacter,
    unlockedHanjaIds,
    userXp,
}) => {
    const [viewMode, setViewMode] = useState('grade');
    const categories = useMemo(() => getSentenceCategories(HANJA_DATA), []);
    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
    const [selectedGrade, setSelectedGrade] = useState('전체');
    const characterAvatar = useMemo(
        () => getRankDetails(userXp, selectedCharacter).avatar,
        [userXp, selectedCharacter]
    );
    const { unlockedIds, unlockedGrades } = useUnlockedHanja(unlockedHanjaIds);

    const activeHanjaSet = useMemo(() => buildSentenceActiveHanjaSet({
        contentPool,
        hanjaData: HANJA_DATA,
        selectedCategory,
        selectedGrade,
        unlockedIds,
        viewMode,
    }), [viewMode, selectedGrade, selectedCategory, contentPool, unlockedIds]);

    return {
        activeHanjaSet,
        categories,
        characterAvatar,
        selectedCategory,
        selectedGrade,
        setSelectedCategory,
        setSelectedGrade,
        setViewMode,
        unlockedGrades,
        unlockedIds,
        viewMode,
    };
};
