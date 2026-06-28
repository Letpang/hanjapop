import { useEffect } from 'react';
import DAILY_CURRICULUM from '../../data/dailyCurriculum.js';
import { useLang } from '../../hooks/useLang.js';
import { buildPremiumWidgetPayload, savePremiumWidgetPayload } from '../../utils/premiumWidget.js';

export function usePremiumWidgetState({
    allDone,
    currentDay,
    currentDayData,
    doneCount,
    isPremium,
    missions,
}) {
    const { t } = useLang();

    useEffect(() => {
        const nextDayData = DAILY_CURRICULUM[currentDay] || null;
        savePremiumWidgetPayload(buildPremiumWidgetPayload({
            isPremium,
            currentDay,
            currentDayData,
            nextDayData,
            doneCount,
            missionTotal: missions?.length || 6,
            allDone,
            t,
        }));
    }, [allDone, currentDay, currentDayData, doneCount, isPremium, missions, t]);
}
