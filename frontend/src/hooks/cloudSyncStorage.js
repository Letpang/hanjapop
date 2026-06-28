import { SK } from '../constants/storageKeys.js';

export const getAuthProvider = (user) => (
    user?.app_metadata?.provider
    || user?.identities?.[0]?.provider
    || 'email'
);

export const readLocalObject = (key) => {
    try {
        const value = JSON.parse(localStorage.getItem(key) || '{}');
        return value && typeof value === 'object' ? value : {};
    } catch {
        return {};
    }
};

export const mergeObjects = (localValue, cloudValue) => ({
    ...((localValue && typeof localValue === 'object') ? localValue : {}),
    ...((cloudValue && typeof cloudValue === 'object') ? cloudValue : {}),
});

const mergeUniqueArray = (a, b) => [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])];

const mergeActivityArray = (a, b) => {
    const countByType = (values) => (Array.isArray(values) ? values : []).reduce((acc, type) => {
        if (!type) return acc;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});
    const left = countByType(a);
    const right = countByType(b);
    return [...new Set([...Object.keys(left), ...Object.keys(right)])].flatMap(type =>
        Array.from({ length: Math.max(left[type] || 0, right[type] || 0) }, () => type)
    );
};

export const mergeStudyLogDays = (localDays = {}, cloudDays = {}) => {
    const merged = {};
    for (const day of new Set([...Object.keys(localDays || {}), ...Object.keys(cloudDays || {})])) {
        const local = localDays?.[day] || {};
        const cloud = cloudDays?.[day] || {};
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

export const mergeNumericStats = (localValue, cloudValue) => {
    const merged = mergeObjects(localValue, cloudValue);
    for (const key of new Set([...Object.keys(localValue || {}), ...Object.keys(cloudValue || {})])) {
        if (typeof localValue?.[key] === 'number' && typeof cloudValue?.[key] === 'number') {
            merged[key] = Math.max(localValue[key], cloudValue[key]);
        }
    }
    return merged;
};

export const hasMeaningfulLocalData = () => {
    const xp = Number(localStorage.getItem(SK.USER_XP) || 0);
    const studyLog = readLocalObject('study_log');
    const mastery = readLocalObject('hanja_data');
    const wordData = readLocalObject('word_data');
    return (
        xp > 0
        || Object.keys(studyLog.days || {}).length > 0
        || Object.keys(mastery).length > 0
        || Object.keys(wordData).length > 0
    );
};

export const hasMeaningfulCloudData = (profile, learningData) => (
    Number(profile?.xp || 0) > 0
    || Object.keys(learningData?.mastery_data || {}).length > 0
    || Object.keys(learningData?.word_wrong_data || {}).length > 0
    || Object.keys(learningData?.daily_study_log || {}).length > 0
    || Object.keys(learningData?.total_stats || {}).length > 0
    || Object.keys(learningData?.extra_progress || {}).length > 0
);

export const getLocalXp = () => {
    const localXpStr = localStorage.getItem(SK.USER_XP);
    return localXpStr ? Number(localXpStr) || 0 : 0;
};

export const pickFurthestCurriculum = (localValue, cloudValue) => {
    const local = localValue || {};
    const cloud = cloudValue || {};
    const localRound = Number(local.journeyRound || 1);
    const cloudRound = Number(cloud.journeyRound || 1);
    if (localRound !== cloudRound) return localRound > cloudRound ? local : cloud;
    return Number(local.completedDay || 0) > Number(cloud.completedDay || 0) ? local : cloud;
};

export const pickFurthestGrade = (localGrade, cloudGrade) => {
    const order = ['8급', '7급II', '7급', '6급II', '6급'];
    const localIndex = order.indexOf(localGrade);
    const cloudIndex = order.indexOf(cloudGrade);
    return cloudIndex > localIndex ? cloudGrade : localGrade;
};

export const restoreExtraProgress = (extra = {}) => {
    if (extra.mission_history) {
        localStorage.setItem(SK.MISSION_HISTORY, JSON.stringify(
            mergeObjects(readLocalObject(SK.MISSION_HISTORY), extra.mission_history)
        ));
    }
    if (extra.records) {
        localStorage.setItem(SK.RECORDS, JSON.stringify(
            mergeNumericStats(readLocalObject(SK.RECORDS), extra.records)
        ));
    }
    if (extra.unlocked_grade) {
        const grade = pickFurthestGrade(localStorage.getItem(SK.UNLOCKED_GRADE), extra.unlocked_grade);
        if (grade) localStorage.setItem(SK.UNLOCKED_GRADE, grade);
    }
    if (!localStorage.getItem(SK.START_GRADE) && extra.start_grade) {
        localStorage.setItem(SK.START_GRADE, extra.start_grade);
    }
    if (Array.isArray(extra.writing_completed)) {
        const local = readLocalObject('hanja_writing_completed');
        const merged = [...new Set([...(Array.isArray(local) ? local : []), ...extra.writing_completed])];
        localStorage.setItem('hanja_writing_completed', JSON.stringify(merged));
    }
    if (extra.idiom_wrong_data) {
        localStorage.setItem('idiom_wrong_data', JSON.stringify(
            mergeObjects(readLocalObject('idiom_wrong_data'), extra.idiom_wrong_data)
        ));
    }
    if (Number(extra.level_test_bonus) > Number(localStorage.getItem(SK.LEVEL_TEST_BONUS) || 0)) {
        localStorage.setItem(SK.LEVEL_TEST_BONUS, String(extra.level_test_bonus));
    }
    if (extra.level_test_daily) {
        localStorage.setItem(SK.LEVEL_TEST_DAILY, JSON.stringify(
            mergeObjects(readLocalObject(SK.LEVEL_TEST_DAILY), extra.level_test_daily)
        ));
    }
    if (extra.daily_missions && typeof extra.daily_missions === 'object') {
        Object.entries(extra.daily_missions).forEach(([key, value]) => {
            if (!key.startsWith('daily_missions_')) return;
            localStorage.setItem(key, JSON.stringify(value));
        });
    }
};

export const restoreCloudSnapshotToLocalStorage = ({ learningData, localXp, profile }) => {
    if (profile) {
        if (profile.nickname) localStorage.setItem(SK.USER_NICKNAME, profile.nickname);
        if (profile.character_type) localStorage.setItem(SK.SELECTED_CHARACTER, profile.character_type);
        if (typeof profile.streak_count === 'number') {
            localStorage.setItem('streak_data', JSON.stringify({ count: profile.streak_count }));
        }
        if (typeof profile.xp === 'number') {
            localStorage.setItem(SK.USER_XP, String(Math.max(localXp, profile.xp)));
        }
    }

    if (learningData) {
        if (learningData.mastery_data) {
            localStorage.setItem('hanja_data', JSON.stringify(
                mergeObjects(readLocalObject('hanja_data'), learningData.mastery_data)
            ));
        }
        if (learningData.total_stats || learningData.daily_study_log) {
            const localStudyLog = readLocalObject('study_log');
            const localDays = localStudyLog.days || {};
            const cloudDays = learningData.daily_study_log || {};
            localStorage.setItem('study_log', JSON.stringify({
                total: mergeNumericStats(localStudyLog.total || {}, learningData.total_stats || {}),
                days: mergeStudyLogDays(localDays, cloudDays),
            }));
        }
        if (learningData.curriculum_progress) {
            localStorage.setItem('curriculum_progress', JSON.stringify(
                pickFurthestCurriculum(readLocalObject('curriculum_progress'), learningData.curriculum_progress)
            ));
        }
        if (learningData.word_wrong_data) {
            localStorage.setItem('word_data', JSON.stringify(
                mergeObjects(readLocalObject('word_data'), learningData.word_wrong_data)
            ));
        }
        if (learningData.extra_progress) restoreExtraProgress(learningData.extra_progress);
    }

    localStorage.setItem(SK.ONBOARDING_DONE, 'true');
};
