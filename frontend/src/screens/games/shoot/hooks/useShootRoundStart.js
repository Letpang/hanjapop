import { useCallback } from 'react';
import { DIFFICULTY_CONFIG } from '../shootGameConstants.js';
import { resumeGameAudio } from '../shootGameAudio.js';

export const useShootRoundStart = ({
    diffConfig,
    hpRef,
    prepareSpawnPlan,
    resetWrongItems,
    setClearCombo,
    setHp,
    setOptions,
    setScore,
    setSessionXp,
    setShake,
    setStatus,
    setTargetId,
    setWave,
    setWaveKills,
    setWaveTransition,
    setWords,
}) => useCallback((overrideDiff) => {
    resumeGameAudio();

    const effectiveDiff = overrideDiff ? (DIFFICULTY_CONFIG[overrideDiff] || diffConfig) : diffConfig;
    prepareSpawnPlan(effectiveDiff);

    setWave(1);
    setWaveKills(0);
    setWaveTransition(false);
    setScore(0);
    setSessionXp(0);
    setHp(effectiveDiff.hp);
    hpRef.current = effectiveDiff.hp;
    setWords([]);
    setTargetId(null);
    setOptions([]);
    setShake(false);
    setClearCombo(0);
    resetWrongItems();
    setStatus('playing');
}, [
    diffConfig,
    hpRef,
    prepareSpawnPlan,
    resetWrongItems,
    setClearCombo,
    setHp,
    setOptions,
    setScore,
    setSessionXp,
    setShake,
    setStatus,
    setTargetId,
    setWave,
    setWaveKills,
    setWaveTransition,
    setWords,
]);
