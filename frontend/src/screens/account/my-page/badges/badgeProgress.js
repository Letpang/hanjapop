import { BADGE_GUIDES, getBadgeStage, getBadgeValue } from '../../profileData.js';

export const getBadgeActionText = (id, t) => {
  switch (id) {
    case 'attendance': return t('ext_1698');
    case 'mission':    return t('ext_3206');
    case 'hanja':      return t('ext_3207');
    case 'quiz':       return t('ext_3208');
    case 'game':       return t('ext_3209');
    case 'brush':      return t('ext_3210');
    default:           return t('ext_1567');
  }
};

export const getBadgeAssetPath = (badge, stage) => `${badge.base}_${stage}.webp`;

export const getBadgeProgress = ({ badge, streak, totalStats }) => {
  const value = getBadgeValue(badge.id, streak, totalStats);
  const current = getBadgeStage(badge, value);
  const guide = BADGE_GUIDES[badge.id] || { desc: '', menu: '' };
  const prevReq = badge.reqs[current - 1] || 0;
  const nextReq = badge.reqs[current];
  const leftVal = Math.max(0, (nextReq ?? value) - value);
  const currentSegmentProgress = value - prevReq;
  const totalSegmentRange = (nextReq ?? value) - prevReq;
  const percent = totalSegmentRange > 0
    ? Math.min(100, Math.max(0, (currentSegmentProgress / totalSegmentRange) * 100))
    : 100;

  return {
    current,
    guide,
    isComplete: current >= 5,
    leftVal,
    percent,
    value,
  };
};
