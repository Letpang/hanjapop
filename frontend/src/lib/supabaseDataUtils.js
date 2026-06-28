import { SK } from '../constants/storageKeys.js';

const objectSize = (value) => value && typeof value === 'object' ? Object.keys(value).length : 0;

const learningRowScore = (row) => (
    objectSize(row?.mastery_data) * 1000
    + objectSize(row?.srs_data) * 100
    + objectSize(row?.curriculum_progress) * 10
    + objectSize(row?.total_stats)
);

export const pickBestLearningRow = (rows = []) => [...rows].sort((a, b) => {
    const scoreDiff = learningRowScore(b) - learningRowScore(a);
    if (scoreDiff) return scoreDiff;
    return new Date(b?.updated_at || 0) - new Date(a?.updated_at || 0);
})[0] || null;

export const mergeObjects = (cloudValue, localValue) => ({
    ...((cloudValue && typeof cloudValue === 'object') ? cloudValue : {}),
    ...((localValue && typeof localValue === 'object') ? localValue : {}),
});

export const mergeNumericStats = (cloudValue, localValue) => {
    const merged = mergeObjects(cloudValue, localValue);
    for (const key of new Set([...Object.keys(cloudValue || {}), ...Object.keys(localValue || {})])) {
        if (typeof cloudValue?.[key] === 'number' && typeof localValue?.[key] === 'number') {
            merged[key] = Math.max(cloudValue[key], localValue[key]);
        }
    }
    return merged;
};

const mergeUniqueArray = (cloudValue, localValue) => [
    ...new Set([
        ...(Array.isArray(cloudValue) ? cloudValue : []),
        ...(Array.isArray(localValue) ? localValue : []),
    ]),
];

const mergeActivityArray = (cloudValue, localValue) => {
    const countByType = (values) => (Array.isArray(values) ? values : []).reduce((acc, type) => {
        if (!type) return acc;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});
    const cloudCounts = countByType(cloudValue);
    const localCounts = countByType(localValue);
    return [...new Set([...Object.keys(cloudCounts), ...Object.keys(localCounts)])].flatMap(type =>
        Array.from({ length: Math.max(cloudCounts[type] || 0, localCounts[type] || 0) }, () => type)
    );
};

export const mergeStudyLogDays = (cloudDays = {}, localDays = {}) => {
    const merged = {};
    for (const day of new Set([...Object.keys(cloudDays || {}), ...Object.keys(localDays || {})])) {
        const cloud = cloudDays?.[day] || {};
        const local = localDays?.[day] || {};
        merged[day] = {
            ...cloud,
            ...local,
            hanjaIds: mergeUniqueArray(cloud.hanjaIds, local.hanjaIds),
            wordIds: mergeUniqueArray(cloud.wordIds, local.wordIds),
            correctWordIds: mergeUniqueArray(cloud.correctWordIds, local.correctWordIds),
            wrongWordIds: mergeUniqueArray(cloud.wrongWordIds, local.wrongWordIds),
            activities: mergeActivityArray(cloud.activities, local.activities),
            xp: Math.max(Number(cloud.xp || 0), Number(local.xp || 0)),
        };
    }
    return merged;
};

export const readJsonStorage = (key, fallback = {}) => {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch {
        return fallback;
    }
};

export const collectExtraProgress = () => {
    const dailyMissions = {};
    try {
        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (key?.startsWith('daily_missions_')) {
                dailyMissions[key] = readJsonStorage(key, []);
            }
        }
    } catch {}

    return {
        mission_history: readJsonStorage(SK.MISSION_HISTORY, {}),
        records: readJsonStorage(SK.RECORDS, {}),
        unlocked_grade: localStorage.getItem(SK.UNLOCKED_GRADE),
        start_grade: localStorage.getItem(SK.START_GRADE),
        writing_completed: readJsonStorage('hanja_writing_completed', []),
        idiom_wrong_data: readJsonStorage('idiom_wrong_data', {}),
        level_test_bonus: Number(localStorage.getItem(SK.LEVEL_TEST_BONUS) || 0),
        level_test_daily: readJsonStorage(SK.LEVEL_TEST_DAILY, {}),
        daily_missions: dailyMissions,
    };
};
