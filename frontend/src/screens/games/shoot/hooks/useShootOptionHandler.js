import { useCallback } from 'react';
import { playErrorSound, playLaserSound } from '../shootGameAudio.js';

export const useShootOptionHandler = ({
    effectIdRef,
    inputLockedRef,
    onHanjaAcquired,
    onHanjaSeenRef,
    onMarkCorrect,
    onWordCorrect,
    recordWrongItem,
    setAcquisitions,
    setHp,
    setIsInputLocked,
    setLasers,
    setScore,
    setShake,
    setTurretAngle,
    setWaveKills,
    setWords,
    status,
    targetId,
    words,
}) => useCallback((selectedAnswer) => {
    if (status !== 'playing' || !targetId || inputLockedRef.current) return;
    const target = words.find(w => w.id === targetId);
    if (!target) return;
    if (selectedAnswer === target.answer) {
        inputLockedRef.current = true;
        const dx = target.x - 50;
        const dy = target.y - 85;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        setTurretAngle(angle);
        playLaserSound();
        effectIdRef.current += 1;
        const laserId = effectIdRef.current;
        setLasers(prev => [...prev, { id: laserId, targetX: target.x, targetY: target.y, shipX: 50, shipY: 95 }]);
        setTimeout(() => { setLasers(prev => prev.filter(l => l.id !== laserId)); }, 100);
        setWords(prev => prev.map(w => w.id === targetId ? { ...w, state: 'exploding', timer: 6 } : w));
        setScore(prev => prev + 1);
        setWaveKills(prev => prev + 1);
        if (onMarkCorrect) onMarkCorrect(target.pairId);
        if (target.pairId != null) onHanjaSeenRef.current?.([target.pairId]);
        if (target.isWord && target.wordId != null) onWordCorrect?.(target.wordId);
        if (onHanjaAcquired) onHanjaAcquired(target.pairId, 3);
        effectIdRef.current += 1;
        const acqId = effectIdRef.current;
        setAcquisitions(prev => [...prev, { id: acqId, x: target.x, y: target.y, hanja: target.hanja }]);
        setTimeout(() => {
            setAcquisitions(prev => prev.filter(a => a.id !== acqId));
            inputLockedRef.current = false;
        }, 1000);
    } else {
        inputLockedRef.current = true;
        playErrorSound();
        setShake(true);
        setIsInputLocked(true);
        setHp(prev => Math.max(0, prev - 1));

        recordWrongItem(target);

        setTimeout(() => {
            setShake(false);
            setIsInputLocked(false);
            inputLockedRef.current = false;
        }, 800);
    }
}, [
    effectIdRef,
    inputLockedRef,
    onHanjaAcquired,
    onHanjaSeenRef,
    onMarkCorrect,
    onWordCorrect,
    recordWrongItem,
    setAcquisitions,
    setHp,
    setIsInputLocked,
    setLasers,
    setScore,
    setShake,
    setTurretAngle,
    setWaveKills,
    setWords,
    status,
    targetId,
    words,
]);
