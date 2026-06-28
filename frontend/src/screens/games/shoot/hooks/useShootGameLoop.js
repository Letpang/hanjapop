import { useEffect } from 'react';
import { MONSTER_COMPONENTS } from '../../../../components/Icons.jsx';
import {
    advanceShootFallingWords,
    createShootFallingItem,
} from '../shootGameUtils.js';

export const useShootGameLoop = ({
    diffConfig,
    effectIdRef,
    getDropSpeed,
    getMeaning,
    getSpawnInterval,
    isPaused,
    setHp,
    setShake,
    setWords,
    status,
    takeNextSpawnItem,
    wave,
    waveTransition,
}) => {
    useEffect(() => {
        if (status !== 'playing' || waveTransition || isPaused) return undefined;

        const dropInterval = setInterval(() => {
            setWords(prev => {
                const { hpDelta, nextWords, shouldShake } = advanceShootFallingWords(prev, getDropSpeed(wave));

                if (shouldShake) {
                    setShake(true);
                    setTimeout(() => setShake(false), 300);
                }

                if (hpDelta > 0) {
                    setHp(current => Math.max(0, current - hpDelta));
                }
                return nextWords;
            });
        }, 50);

        const spawnInterval = setInterval(() => {
            setWords(prev => {
                const falling = prev.filter(w => w.state === 'falling');
                if (falling.length >= diffConfig.maxOnScreen) return prev;
                const fallingHanjas = new Set(falling.map(w => w.hanja));
                const spawn = takeNextSpawnItem(fallingHanjas);
                if (!spawn) return prev;

                effectIdRef.current += 1;
                return [...prev, createShootFallingItem({
                    effectId: effectIdRef.current,
                    getMeaning,
                    isWord: spawn.isWord,
                    monsterCount: MONSTER_COMPONENTS.length,
                    nextItem: spawn.nextItem,
                })];
            });
        }, getSpawnInterval(wave));

        return () => {
            clearInterval(dropInterval);
            clearInterval(spawnInterval);
        };
    }, [
        diffConfig,
        effectIdRef,
        getDropSpeed,
        getMeaning,
        getSpawnInterval,
        isPaused,
        setHp,
        setShake,
        setWords,
        status,
        takeNextSpawnItem,
        wave,
        waveTransition,
    ]);
};
