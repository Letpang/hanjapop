export const getShootTargetSelection = ({
    allHanja,
    diffConfig,
    gameChars,
    targetId,
    words,
}) => {
    const fallingWords = words.filter(w => w.state === 'falling');
    if (fallingWords.length === 0) return null;

    const lowestWord = fallingWords.reduce((prev, curr) => (prev.y > curr.y ? prev : curr), fallingWords[0]);
    if (lowestWord.id === targetId) return null;

    const allChars = gameChars.length > 10 ? gameChars : allHanja;
    const wrongOptions = getWrongOptions(lowestWord, allChars, diffConfig.wrongAnswerMode, lowestWord.category);
    return {
        isWordTarget: lowestWord.isWord || false,
        options: [...wrongOptions, lowestWord.answer].sort(() => 0.5 - Math.random()),
        targetId: lowestWord.id,
    };
};

export const getWrongOptions = (target, allChars, mode, targetCategory) => {
    const targetAnswer = target.answer;
    let pool = allChars.filter(h => h && (h.meaning + ' ' + (h.sound || '')) !== targetAnswer);

    if (mode === 'same_theme' && targetCategory) {
        const sameTheme = pool.filter(h => h.category === targetCategory);
        if (sameTheme.length >= 3) pool = sameTheme;
    } else if (mode === 'same_reading_prefix' && target.sound) {
        const prefix = target.sound.charAt(0);
        const samePrefix = pool.filter(h => h.sound && h.sound.charAt(0) === prefix);
        if (samePrefix.length >= 3) pool = samePrefix;
    } else if (mode === 'other_theme' && targetCategory) {
        const otherTheme = pool.filter(h => h.category !== targetCategory);
        if (otherTheme.length >= 3) pool = otherTheme;
    }

    const seen = new Set([targetAnswer]);
    const result = [];
    for (const h of pool.sort(() => 0.5 - Math.random())) {
        const key = h.meaning + ' ' + (h.sound || '');
        if (!seen.has(key)) {
            seen.add(key);
            result.push(key);
        }
        if (result.length >= 3) break;
    }
    return result;
};
