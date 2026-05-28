import { SK } from '../constants/storageKeys.js';

const DEFAULTS = {
    matchBestTime: null,
    wordMaxCombo: 0,
    wordBestScore: 0,
    totalMonsterKills: 0,
};

export const getRecords = () => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SK.RECORDS) || '{}') }; }
    catch { return { ...DEFAULTS }; }
};

export const updateRecord = (key, value) => {
    try {
        const records = getRecords();
        if (key === 'matchBestTime') {
            if (records[key] === null || value < records[key]) records[key] = value;
            else return;
        } else if (key === 'totalMonsterKills') {
            records[key] = (records[key] || 0) + value;
        } else {
            if (value <= (records[key] || 0)) return;
            records[key] = value;
        }
        localStorage.setItem(SK.RECORDS, JSON.stringify(records));
    } catch {}
};
