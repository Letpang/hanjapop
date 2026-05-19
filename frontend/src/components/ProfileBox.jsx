import React from 'react';
import { getLevel, getRankDetails, LEVEL_THRESHOLDS } from '../utils/rankUtils.js';

const ProfileBox = ({
  selectedCharacter,
  userNickname,
  userXp,
  onNavigate,
  onShowBadges,
  streak,
}) => {
  const level = getLevel(userXp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const xpInLevel = userXp - currentThreshold;
  const xpToNextLevel = nextThreshold - currentThreshold;
  const xpProgress = level >= 10 ? 100 : Math.min((xpInLevel / xpToNextLevel) * 100, 100);

  const rankDetails = getRankDetails(userXp, selectedCharacter);
  const characterImage = selectedCharacter ? rankDetails.avatar : '/assets/images/characters/default_3d.webp';

  return (
    <div className="w-full glass-panel rounded-[2.2rem] px-5 py-4 md:px-8 md:py-6 relative overflow-hidden flex items-center gap-4 md:gap-6 shadow-2xl border-[3.5px] border-white bg-white/90 backdrop-blur-xl">
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#7C83FF]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Character Avatar */}
      <div className="w-24 h-24 md:w-36 md:h-36 shrink-0 relative z-10 flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-[2rem] md:rounded-[3rem] border-2 border-white shadow-lg overflow-visible">
        <div className="absolute inset-0 p-0 flex items-center justify-center">
          <img
            src={characterImage}
            alt="Character"
            className="w-[120%] h-[120%] object-contain filter drop-shadow-2xl translate-y-[-8%]"
            onError={(e) => { e.target.src = '/assets/images/characters/default_3d.webp'; }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-center relative z-10 gap-3.5">
        <div className="flex flex-col gap-1">
          <span className="font-extrabold text-[#3C3C3C] text-h3 tracking-tight break-keep">
            {userNickname || 'Explorer'}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs-res font-extrabold text-[#FF9B73] whitespace-nowrap px-2.5 py-1 leading-none rounded-lg flex items-center" >
              LV.{level}
            </span>
            <span className="text-xs-res font-extrabold text-[#FF9B73] whitespace-nowrap px-2.5 py-1 leading-none rounded-lg shadow-sm flex items-center gap-1 ">
              <img src="/assets/images/icons/streak.webp" alt="streak" className="w-4 h-4 object-contain" /> {streak?.count || 0}일 연속
            </span>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex-1 relative bg-slate-200/80 rounded-full h-5 overflow-hidden" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)' }}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FFD3B6] via-[#FF9B73] to-[#FF6B6B] transition-all duration-1000 ease-out relative"
              style={{ width: `${xpProgress}%`, boxShadow: '0 0 8px rgba(255, 155, 115 ,0.55)' }}
            >
              <div className="absolute top-0.5 left-1 right-1 h-2 bg-white/25 rounded-full" />
            </div>
          </div>
          <span className="font-extrabold text-[#3C3C3C] text-xs-res whitespace-nowrap">{(userXp || 0).toLocaleString()} XP</span>
        </div>
      </div>


      {/* Badges Button */}
      {onShowBadges && (
        <button
          onClick={onShowBadges}
          className="absolute top-16 right-4 w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm border border-white active:scale-90 transition-all z-20"
        >
          <img src="/assets/images/icons/icon_storage_glossy.webp" alt="Badges" className="w-5 h-5 md:w-6 md:h-6 object-contain" />
        </button>
      )}
    </div>
  );
};

export default ProfileBox;
