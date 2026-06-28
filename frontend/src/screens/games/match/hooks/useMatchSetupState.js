import { useMemo, useRef, useState } from 'react';
import { useUnlockedHanja } from '../../../../hooks/useUnlockedHanja.js';
import { getRankDetails } from '../../../../utils/rankUtils.js';
import { CARD_BACK_CHARS, HANJA_DATA } from '../matchGameData.js';
import {
    buildMatchActiveHanjaSet,
    getMatchCategories,
} from '../matchGameUtils.js';

export const useMatchSetupState = ({
    contentPool,
    currentDayHanjaIds,
    masteryData,
    missionDone,
    seenHanjaIds,
    selectedCharacter,
    srsData,
    unlockedHanjaIds,
    userLevel,
    userXp,
}) => {
    const missionDoneAtStartRef = useRef(missionDone);
    const [cardBackChar] = useState(() => CARD_BACK_CHARS[Math.floor(Math.random() * CARD_BACK_CHARS.length)]);
    const cardBackSrc = `/assets/images/characters/${cardBackChar}/rank_5.webp`;

    const [viewMode, setViewMode] = useState('grade');
    const categories = useMemo(() => getMatchCategories(HANJA_DATA), []);
    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
    const [selectedGrade, setSelectedGrade] = useState('전체');
    const { unlockedIds, unlockedGrades } = useUnlockedHanja(unlockedHanjaIds);

    const characterAvatar = useMemo(
        () => getRankDetails(userXp, selectedCharacter).avatar,
        [userXp, selectedCharacter]
    );

    const activeHanjaSet = useMemo(() => buildMatchActiveHanjaSet({
        contentPool,
        currentDayHanjaIds,
        hanjaData: HANJA_DATA,
        masteryData,
        seenHanjaIds,
        selectedCategory,
        selectedGrade,
        srsData,
        unlockedIds,
        userLevel,
        viewMode,
    }), [
        contentPool,
        currentDayHanjaIds,
        masteryData,
        seenHanjaIds,
        selectedCategory,
        selectedGrade,
        srsData,
        unlockedIds,
        userLevel,
        viewMode,
    ]);

    return {
        activeHanjaSet,
        cardBackChar,
        cardBackSrc,
        categories,
        characterAvatar,
        missionDoneAtStart: missionDoneAtStartRef.current,
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
