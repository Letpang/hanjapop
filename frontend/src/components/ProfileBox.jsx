import React from 'react';
import { getLevel, getRankDetails, LEVEL_THRESHOLDS } from '../utils/rankUtils.js';

const ProfileBox = ({
  selectedCharacter,
  userNickname,
  userXp,
  onNavigate,
  onShowBadges,
}) => {
  const level = getLevel(userXp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const xpInLevel = userXp - currentThreshold;
  const xpToNextLevel = nextThreshold - currentThreshold;
  const xpProgress = level >= 10 ? 100 : Math.min((xpInLevel / xpToNextLevel) * 100, 100);

  const rankDetails = getRankDetails(userXp, selectedCharacter);
  const characterImage = selectedCharacter ? rankDetails.avatar : '/assets/images/characters/default_3d.png';

  return (
    <div className="w-full glass-panel rounded-[2.2rem] px-5 py-4 md:px-8 md:py-6 relative overflow-hidden flex items-center gap-4 md:gap-6 shadow-2xl border-[3.5px] border-white bg-white/90 backdrop-blur-xl">
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Character Avatar */}
      <div className="w-16 h-16 md:w-24 md:h-24 shrink-0 relative z-10 flex items-center justify-center bg-white rounded-[1.6rem] md:rounded-[2.2rem] border border-slate-100 shadow-inner">
        <div className="absolute inset-0 overflow-hidden rounded-[1.6rem] md:rounded-[2.2rem] p-1.5 md:p-2.5">
          <img
            src={characterImage}
            alt="Character"
            className="w-full h-full object-contain filter drop-shadow-md"
            onError={(e) => { e.target.src = '/assets/images/characters/default_3d.png'; }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-center relative z-10 gap-3.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-black text-slate-800 text-xl md:text-3xl tracking-tight">
            {userNickname || 'Explorer'}
          </span>
          <span className="text-[10px] md:text-sm font-black text-[#7E57C2] whitespace-nowrap bg-[#9B72FF15] px-2.5 py-0.5 rounded-lg border border-[#9B72FF30]">
            LV.{level} · {rankDetails.rankName || 'Junior Master'}
          </span>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex-1 relative bg-slate-200/80 rounded-full h-5 overflow-hidden" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)' }}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 transition-all duration-1000 ease-out relative"
              style={{ width: `${xpProgress}%`, boxShadow: '0 0 8px rgba(251,146,60,0.55)' }}
            >
              <div className="absolute top-0.5 left-1 right-1 h-2 bg-white/25 rounded-full" />
            </div>
          </div>
          <span className="font-black text-slate-600 text-xs md:text-sm whitespace-nowrap">{(userXp || 0).toLocaleString()} XP</span>
        </div>
      </div>

      {/* Settings Button */}
      <button
        onClick={() => onNavigate('mypage')}
        className="absolute top-4 right-4 w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-2xl bg-slate-50 border-2 border-slate-100 active:scale-90 transition-all group z-20 shadow-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-hover:text-indigo-500 transition-colors"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {/* Badges Button */}
      {onShowBadges && (
        <button
          onClick={onShowBadges}
          className="absolute top-16 right-4 w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm border border-white active:scale-90 transition-all z-20"
        >
          <img src="/assets/images/icons/icon_storage_glossy.png" alt="Badges" className="w-5 h-5 md:w-6 md:h-6 object-contain" />
        </button>
      )}
    </div>
  );
};

export default ProfileBox;
