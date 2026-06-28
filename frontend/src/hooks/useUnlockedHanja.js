import { useMemo } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { toIdSet } from '../utils/setIdUtils.js';

export function useUnlockedHanja(unlockedHanjaIds) {
    const unlockedIds = useMemo(() => toIdSet(unlockedHanjaIds), [unlockedHanjaIds]);
    const unlockedGrades = useMemo(() => {
        const s = new Set(['전체']);
        for (const h of HANJA_DATA) { if (unlockedIds.has(h.id)) s.add(h.grade); }
        return s;
    }, [unlockedIds]);
    return { unlockedIds, unlockedGrades };
}
