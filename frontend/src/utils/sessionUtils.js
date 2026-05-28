import { SK } from '../constants/storageKeys.js';

/**
 * 로컬 시간(기기 시간) 기준으로 자정(00:00:00)에 날짜가 넘어갑니다.
 * @returns {string} YYYY-MM-DD 형식의 오늘 날짜 문자열
 */
export const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * 로컬 시간(기기 시간) 기준으로 어제 날짜를 구합니다.
 * @returns {string} YYYY-MM-DD 형식의 어제 날짜 문자열
 */
export const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const isSessionDoneToday = () => {
    try {
        const data = JSON.parse(localStorage.getItem(SK.DAILY_SESSION) || '{}');
        return data.date === getTodayStr() && data.done;
    } catch { return false; }
};

const TODAY_COUNT_KEY = 'today_session_count';

/** 오늘 완료한 세션(단계) 수 */
export const getTodaySessionCount = () => {
    try {
        const data = JSON.parse(localStorage.getItem(TODAY_COUNT_KEY) || '{}');
        return data.date === getTodayStr() ? (data.count || 0) : 0;
    } catch { return 0; }
};

/** 오늘 세션 카운트 +1 */
export const incrementTodaySessionCount = () => {
    try {
        const count = getTodaySessionCount() + 1;
        localStorage.setItem(TODAY_COUNT_KEY, JSON.stringify({ date: getTodayStr(), count }));
    } catch {}
};


