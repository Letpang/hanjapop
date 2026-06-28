import { tOrFallback } from '../../../i18n/fallbackText.js';

export const RESULT_CONFETTI = [
  { left: '12%', top: '25%', color: '#FF6B6B', w: 6, h: 10, r: 35, dur: '2.8s', del: '0s' },
  { left: '28%', top: '12%', color: '#6BCB77', w: 5, h: 8, r: -20, dur: '3.2s', del: '0.4s' },
  { left: '72%', top: '18%', color: '#4D96FF', w: 6, h: 9, r: 55, dur: '2.5s', del: '0.2s' },
  { left: '82%', top: '36%', color: '#B983FF', w: 6, h: 6, r: 25, dur: '3.4s', del: '0.8s' },
  { left: '22%', top: '70%', color: '#FFD93D', w: 7, h: 5, r: -15, dur: '2.7s', del: '0.6s' },
  { left: '64%', top: '62%', color: '#FF9B73', w: 6, h: 8, r: 10, dur: '3.0s', del: '0.1s' },
  { left: '42%', top: '8%', color: '#4D96FF', w: 5, h: 7, r: -60, dur: '2.6s', del: '0.7s' },
  { left: '60%', top: '42%', color: '#FF9B73', w: 6, h: 6, r: 25, dur: '3.1s', del: '0.35s' },
];

export const getReferralShareSubtitle = (count, t) => {
  if (count >= 5) return tOrFallback(t, 'ext_2117');
  if (count >= 3) return tOrFallback(t, 'ext_3230', { n: 5 - count });
  if (count >= 1) return tOrFallback(t, 'ext_3231', { n: 3 - count });
  return tOrFallback(t, 'ext_2317');
};

export const getNextStageLabel = (dayNumber, finalDay, t) => {
  const n = Math.min(dayNumber + 1, finalDay);
  return tOrFallback(t, 'ext_3232', { n });
};

export const getMainButtonSubtitle = ({ missionDone, missionTotal }, t) => {
  return '퀘스트 완료 +200XP';
};
