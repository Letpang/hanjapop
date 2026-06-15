import { useMemo } from 'react';
import HANJA_DATA from '../hanja_unified.json';

export function useUnlockedHanja(unlockedHanjaIds) {
    const unlockedIds = useMemo(() => new Set(unlockedHanjaIds || []), [unlockedHanjaIds]);
    const unlockedGrades = useMemo(() => {
        const s = new Set(['전체']);
        for (const h of HANJA_DATA) { if (unlockedIds.has(h.id)) s.add(h.grade); }
        return s;
    }, [unlockedIds]);
    return { unlockedIds, unlockedGrades };
}
