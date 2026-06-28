import { useEffect } from 'react';
import { LEGACY_STORAGE_KEYS } from '../appConstants.js';

export function useLegacyStorageCleanup(completedDay) {
    useEffect(() => {
        LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));

        try {
            if (localStorage.getItem('bug_fix_poisoned_missions_cleared')) return;

            const currentCompleted = completedDay || 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key || !key.startsWith('stage_missions_')) continue;

                const stageNum = parseInt(key.replace('stage_missions_', ''), 10);
                if (!Number.isNaN(stageNum) && stageNum > currentCompleted) {
                    localStorage.removeItem(key);
                    i--;
                }
            }
            localStorage.setItem('bug_fix_poisoned_missions_cleared', 'true');
        } catch {}
    }, [completedDay]);
}
