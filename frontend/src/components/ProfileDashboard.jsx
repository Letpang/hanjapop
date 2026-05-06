import React, { useState } from 'react';
import { useLang } from '../LangContext.jsx';
import { getLevel } from '../utils/rankUtils.js';

/**
 * 상단 통합 프로필 & 뱃지 대시보드
 * 좌측: 3D 캐릭터 + 닉네임 + 레벨/XP 게이지
 * 중앙: 획득 뱃지 보드 (2×3 배열)
 * 우측: 캘린더 아이콘 (클릭 시 학습 캘린더 페이지로 이동)
 */

const ProfileDashboard = ({
  selectedCharacter,
  userNickname,
  userXp,
  unlockedStickers,
  onNavigateToCalendar,
  onShowXpPopup,
}) => {
  const { t } = useLang();
  const [showXpDetail, setShowXpDetail] = useState(false);

  // 현재 레벨과 다음 레벨까지의 XP 계산
  const level = getLevel(userXp);
  const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 1800, 2800, 4000, 5500, 7500, 10000];
  const currentThreshold = LEVEL_THRESHOLDS[level] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const xpInLevel = userXp - currentThreshold;
  const xpToNextLevel = nextThreshold - currentThreshold;
  const xpProgress = Math.min((xpInLevel / xpToNextLevel) * 100, 100);

  // 뱃지 데이터 (예시: 총 6개 슬롯, 실제로는 더 많을 수 있음)
  const badgeSlots = [
    { id: 1, name: '첫 학습', icon: '🌟', earned: true },
    { id: 2, name: '7일 연속', icon: '🔥', earned: unlockedStickers && Object.keys(unlockedStickers).length > 50 },
    { id: 3, name: '한자 마스터', icon: '👑', earned: unlockedStickers && Object.keys(unlockedStickers).length > 100 },
    { id: 4, name: '게임 킹', icon: '🎮', earned: false },
    { id: 5, name: '빠른 학습자', icon: '⚡', earned: false },
    { id: 6, name: '완벽주의자', icon: '✨', earned: false },
  ];

  // 캐릭터 이미지 경로
  const characterImages = {
    garae: '/assets/images/characters/garae_3d.png',
    jeolmi: '/assets/images/characters/jeolmi_3d.png',
    chapssal: '/assets/images/characters/chapssal_3d.png',
  };

  const characterImage = selectedCharacter ? characterImages[selectedCharacter] : '/assets/images/characters/default_3d.png';

  return (
    <div className="w-full clay-panel px-4 py-5 md:py-6 bg-white/70 dark:bg-slate-900/50 border-[3px] border-white/80 backdrop-blur-md shadow-lg rounded-[2rem] relative z-10">
      {/* 메인 컨테이너: 좌측(프로필) + 중앙(뱃지) + 우측(캘린더) */}
      <div className="flex items-center justify-between gap-4 md:gap-6">
        
        {/* ─────────────────────────────────────────────────────────────
            좌측: 3D 캐릭터 + 닉네임 + 레벨/XP 게이지
            ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
          {/* 3D 캐릭터 이미지 */}
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-white/50 shadow-md flex-shrink-0">
            <img
              src={characterImage}
              alt={userNickname || '캐릭터'}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 닉네임 + 레벨/XP 게이지 */}
          <div className="flex flex-col gap-2">
            {/* 닉네임 */}
            <div className="text-sm md:text-base font-black text-slate-700 dark:text-white">
              {userNickname || 'Player'}
            </div>

            {/* 레벨 표시 */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] md:text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-700">
                Lv.{level}
              </span>
            </div>

            {/* XP 게이지 (클릭 시 상세 팝업) */}
            <button
              onClick={() => setShowXpDetail(!showXpDetail)}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-24 md:w-32 h-2 md:h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <span className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-400">
                {xpInLevel}/{xpToNextLevel}
              </span>
            </button>

            {/* XP 상세 팝업 (토글) */}
            {showXpDetail && (
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-700 rounded-lg p-3 shadow-lg z-50 text-[11px] md:text-xs font-bold text-slate-700 dark:text-slate-200">
                <div>총 XP: {userXp}</div>
                <div>현재 레벨: {level}/10</div>
                <div>다음 레벨까지: {nextThreshold - userXp} XP</div>
              </div>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            중앙: 획득 뱃지 보드 (2×3 배열)
            ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 flex justify-center">
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {badgeSlots.map((badge) => (
              <div
                key={badge.id}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-lg md:text-2xl transition-all duration-300 border-2 ${
                  badge.earned
                    ? 'bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 border-yellow-300 dark:border-yellow-600 shadow-md'
                    : 'bg-slate-100/50 dark:bg-slate-700/30 border-slate-300 dark:border-slate-600 opacity-40'
                }`}
                title={badge.name}
              >
                {badge.earned ? badge.icon : '🔒'}
              </div>
            ))}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            우측: 캘린더 아이콘
            ───────────────────────────────────────────────────────────── */}
        <button
          onClick={onNavigateToCalendar}
          className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 border-2 border-blue-300 dark:border-blue-600 flex items-center justify-center text-2xl md:text-3xl hover:scale-110 transition-transform duration-300 shadow-md"
          title="학습 캘린더"
        >
          📅
        </button>
      </div>
    </div>
  );
};

export default ProfileDashboard;
