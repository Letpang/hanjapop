import { SK } from '../constants/storageKeys.js';

const compactHanja = (items = []) => items.slice(0, 3).map(item => ({
    id: item.id,
    hanja: item.hanja,
    sound: item.sound,
    meaning: item.meaning,
}));

export const buildPremiumWidgetPayload = ({
    isPremium,
    currentDay,
    currentDayData,
    nextDayData,
    doneCount = 0,
    missionTotal = 0,
    allDone = false,
    t,
}) => {
    const sourceDay = allDone && nextDayData ? currentDay + 1 : currentDay;
    const sourceData = allDone && nextDayData ? nextDayData : currentDayData;
    const hanja = compactHanja(sourceData?.hanja || []);

    const title = t
        ? (allDone ? t('ext_1689') : t('ext_1740'))
        : (allDone ? '다음 탐험 한자' : '오늘의 탐험 한자');
    const subtitle = t
        ? (allDone
            ? t('ext_3228', { currentDay, sourceDay })
            : t('ext_3229', { currentDay, doneCount, missionTotal: missionTotal || 6 }))
        : (allDone
            ? `${currentDay}단계 완료 · ${sourceDay}단계 예고`
            : `${currentDay}단계 · ${doneCount}/${missionTotal || 6} 퀘스트`);

    return {
        version: 1,
        enabled: Boolean(isPremium),
        updatedAt: new Date().toISOString(),
        state: allDone ? 'stage_complete' : 'in_progress',
        stage: sourceDay || currentDay || 1,
        title,
        subtitle,
        hanja,
        action: allDone ? 'open_next_stage' : 'open_study_sheet',
    };
};

export const savePremiumWidgetPayload = (payload) => {
    try {
        localStorage.setItem(SK.PREMIUM_WIDGET_PAYLOAD, JSON.stringify(payload));
    } catch {}
};
