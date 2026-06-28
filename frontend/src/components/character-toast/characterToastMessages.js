import { SK } from '../../constants/storageKeys.js';

const RANK_SOON_A = ['ext_2584', 'ext_2585', 'ext_2556', 'ext_2493', 'ext_2557'];

const RANK_SOON_B = ['ext_2329', 'ext_2372', 'ext_2516', 'ext_2558', 'ext_2517'];

const DAILY_CHEER = ['ext_2518', 'ext_2424', 'ext_2667', 'ext_2463', 'ext_2607', 'ext_2519'];

const MESSAGES = {
  review_reminder: ['ext_2559', 'ext_2373'],
  mission_complete: ['ext_2608', 'ext_2609', 'ext_2464'],
  rank_up: ['ext_2656', 'ext_2560', 'ext_2291'],
};

const RANK_SOON_COUNTER_KEY = 'rank_soon_counter';

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

export const getStoredXp = () => {
  try {
    return Number(localStorage.getItem(SK.USER_XP) || '0');
  } catch {
    return 0;
  }
};

const getRankSoonMessage = (nearRankUp = true) => {
  if (!nearRankUp) {
    return { message: pickRandom(DAILY_CHEER), isTypeB: false };
  }

  const count = Number(localStorage.getItem(RANK_SOON_COUNTER_KEY) || '0');
  localStorage.setItem(RANK_SOON_COUNTER_KEY, String(count + 1));
  const isTypeB = count % 2 === 1;

  return {
    message: pickRandom(isTypeB ? RANK_SOON_B : RANK_SOON_A),
    isTypeB,
  };
};

export const getToastMessage = (type, nearRankUp) => {
  if (type === 'rank_soon') return getRankSoonMessage(nearRankUp);

  const pool = MESSAGES[type] || MESSAGES.review_reminder;
  return { message: pickRandom(pool), isTypeB: false };
};
