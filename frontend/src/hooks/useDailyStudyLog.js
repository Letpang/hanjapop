import { useCallback } from 'react';
import { SK } from '../constants/storageKeys.js';

const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const readLog = () => {
    try { return JSON.parse(localStorage.getItem(SK.DAILY_STUDY_LOG) || '{}'); } catch { return {}; }
};

const writeLog = (log) => {
    try { localStorage.setItem(SK.DAILY_STUDY_LOG, JSON.stringify(log)); } catch {}
};

const getToday = (log) => {
    const today = getTodayStr();
    if (!log[today]) log[today] = { hanjaIds: [], wordIds: [], correctWordIds: [], wrongWordIds: [] };
    return log[today];
};

export const getTodaySeenWordIds = () => {
    try {
        const log = JSON.parse(localStorage.getItem(SK.DAILY_STUDY_LOG) || '{}');
        return log[getTodayStr()]?.wordIds || [];
    } catch { return []; }
};

export const useDailyStudyLog = () => {
    const logHanja = useCallback((hanjaId) => {
        if (!hanjaId) return;
        const id = Number(hanjaId);
        const log = readLog();
        const day = getToday(log);
        if (!day.hanjaIds.includes(id)) {
            day.hanjaIds = [...day.hanjaIds, id];
            writeLog(log);
        }
    }, []);

    const logWordId = useCallback((wordId) => {
        if (wordId == null) return;
        const id = Number(wordId);
        const log = readLog();
        const day = getToday(log);
        if (!day.wordIds.includes(id)) {
            day.wordIds = [...day.wordIds, id];
            writeLog(log);
        }
    }, []);

    const logCorrectWord = useCallback((wordId) => {
        if (wordId == null) return;
        const id = Number(wordId);
        const log = readLog();
        const day = getToday(log);
        // 맞춰도 wrongWordIds는 유지 — 틀린 이력을 영구 보존
        day.correctWordIds = [...new Set([...(day.correctWordIds || []), id])];
        writeLog(log);
    }, []);

    const logWrongWord = useCallback((wordId) => {
        if (wordId == null) return;
        const id = Number(wordId);
        const log = readLog();
        const day = getToday(log);
        // 틀려도 correctWordIds는 유지 — 나중에 맞춘 기록도 보존
        day.wrongWordIds = [...new Set([...(day.wrongWordIds || []), id])];
        writeLog(log);
    }, []);

    return { logHanja, logWordId, logCorrectWord, logWrongWord };
};
