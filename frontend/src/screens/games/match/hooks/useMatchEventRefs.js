import { useCallback, useEffect, useRef } from 'react';

export const useMatchEventRefs = ({
    onHanjaAcquired,
    onHanjaSeen,
    onMarkCorrect,
    onStageClear,
    onWordSeen,
}) => {
    const onMarkCorrectRef = useRef(onMarkCorrect);
    const onHanjaAcquiredRef = useRef(onHanjaAcquired);
    const onHanjaSeenRef = useRef(onHanjaSeen);
    const onWordSeenRef = useRef(onWordSeen);
    const onStageClearRef = useRef(onStageClear);
    const stageClearArgsRef = useRef(null);
    const stageClearDeliveredRef = useRef(false);

    useEffect(() => {
        onMarkCorrectRef.current = onMarkCorrect;
        onHanjaAcquiredRef.current = onHanjaAcquired;
        onHanjaSeenRef.current = onHanjaSeen;
        onWordSeenRef.current = onWordSeen;
        onStageClearRef.current = onStageClear;
    }, [onMarkCorrect, onHanjaAcquired, onHanjaSeen, onWordSeen, onStageClear]);

    const deliverStageClear = useCallback(() => {
        if (stageClearArgsRef.current && !stageClearDeliveredRef.current) {
            stageClearDeliveredRef.current = true;
            onStageClearRef.current?.(...stageClearArgsRef.current);
            stageClearArgsRef.current = null;
        }
    }, []);

    return {
        deliverStageClear,
        onHanjaAcquiredRef,
        onHanjaSeenRef,
        onMarkCorrectRef,
        onWordSeenRef,
        stageClearArgsRef,
        stageClearDeliveredRef,
    };
};
