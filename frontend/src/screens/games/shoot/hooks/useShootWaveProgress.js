import { useEffect } from 'react';
import { DIFFICULTY_XP } from '../shootGameConstants.js';

export const useShootWaveProgress = ({
    clearCombo,
    clearCountRef,
    diffConfig,
    effectIdRef,
    missionDone,
    missionXpGrantedRef,
    onHanjaAcquired,
    onWaveClear,
    selectedDifficulty,
    setClearCombo,
    setSessionXp,
    setStatus,
    setWave,
    setWaveKills,
    setWaveTransition,
    setWords,
    setXpPopup,
    status,
    wave,
    waveKills,
    waveTransition,
}) => {
    useEffect(() => {
        if (status !== 'playing' || waveTransition || waveKills < diffConfig.killsPerWave) return undefined;

        const timer = setTimeout(() => {
            const xpTable = DIFFICULTY_XP[selectedDifficulty] || DIFFICULTY_XP.normal;
            const newCombo = clearCombo + 1;
            setClearCombo(newCombo);
            const xpEarned = xpTable.waveClear;
            if (onHanjaAcquired) {
                onHanjaAcquired(null, xpEarned);
                effectIdRef.current += 1;
                setXpPopup({ show: true, key: effectIdRef.current, amount: xpEarned });
                setTimeout(() => setXpPopup(p => ({ ...p, show: false })), 1500);
            }
            setSessionXp(prev => prev + xpEarned);
            if (onWaveClear) onWaveClear(waveKills);
            if (wave === 1 && !missionDone) missionXpGrantedRef.current = 20;
            setWaveTransition(true);

            if (wave >= diffConfig.wavesTotal) {
                clearCountRef.current += 1;
                setTimeout(() => setStatus('clear'), 1200);
            } else {
                setWords([]);
                setTimeout(() => {
                    setWave(prev => prev + 1);
                    setWaveKills(0);
                    setWaveTransition(false);
                }, 2000);
            }
        }, 0);

        return () => clearTimeout(timer);
    }, [
        clearCombo,
        clearCountRef,
        diffConfig,
        effectIdRef,
        missionDone,
        missionXpGrantedRef,
        onHanjaAcquired,
        onWaveClear,
        selectedDifficulty,
        setClearCombo,
        setSessionXp,
        setStatus,
        setWave,
        setWaveKills,
        setWaveTransition,
        setWords,
        setXpPopup,
        status,
        wave,
        waveKills,
        waveTransition,
    ]);
};
