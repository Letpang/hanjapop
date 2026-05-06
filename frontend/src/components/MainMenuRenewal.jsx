import React, { useState, useMemo, useEffect } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { useLang } from '../LangContext.jsx';
import { getLeaderboardPosition, getRankDetails } from '../utils/rankUtils.js';
import ProfileDashboard from './ProfileDashboard.jsx';
import JourneyMapOptimized from './JourneyMapOptimized.jsx';
import JourneyProgressBar from './JourneyProgressBar.jsx';
import DailyMissionCard from './DailyMissionCard.jsx';
import MasteryBar from './MasteryBar.jsx';
import GradeBadges from './GradeBadges.jsx';

const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 1800, 2800, 4000, 5500, 7500, 10000];
const getLevel = (xp) => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
};

/**
 * 리뉴얼된 메인 메뉴
 * 
 * 구조:
 * 1. 상단: 통합 프로필 & 뱃지 대시보드 (ProfileDashboard)
 * 2. 중앙: 7단계 여정 맵 (JourneyMap)
 * 3. 하단: 슬라이드업 미션 바 (JourneyProgressBar)
 */

const MainMenuRenewal = ({
  onNavigate,
  unlockedStickers,
  userXp,
  isDarkMode,
  setIsDarkMode,
  selectedCharacter,
  userNickname,
  missions,
  streak,
  allDone,
  doneCount,
  getStats,
  mastery,
  todayStats,
  totalStats,
  isTodayStudyDone,
  isDailyQuizDone,
  xpBuffExpiresAt,
  srsData,
  getDueItems,
}) => {
  const { t } = useLang();
  const [showBadges, setShowBadges] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [completedStages, setCompletedStages] = useState(0);
  const [missionData, setMissionData] = useState({
    review: 0,
    flashcard: 0,
    wordQuiz: 0,
    sentenceQuiz: 0,
    shooting: 0,
    memory: 0,
    stroke: 0,
  });

  // 버프 타이머
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!xpBuffExpiresAt || xpBuffExpiresAt <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [xpBuffExpiresAt]);
  const isBuffActive = !!(xpBuffExpiresAt && xpBuffExpiresAt > now);
  const buffMins = isBuffActive ? Math.ceil((xpBuffExpiresAt - now) / 60000) : 0;

  // 레벨 및 랭킹 정보
  const myXp = userXp || 0;
  const level = getLevel(myXp);
  const position = useMemo(() => getLeaderboardPosition(myXp), [myXp]);
  const rank = useMemo(() => getRankDetails(myXp, selectedCharacter, position), [myXp, selectedCharacter, position]);

  // 여정 노드 클릭 핸들러
  const handleNodeClick = (stageId) => {
    // 스테이지별로 해당 화면으로 이동
    const screenMap = {
      1: 'levelTest',      // 리뷰 테스트
      2: 'flashcard',      // 학습지
      3: 'wordQuiz',       // 단어 퀴즈
      4: 'sentenceQuiz',   // 문장 퀴즈
      5: 'shootGame',      // 몬스터 슈팅
      6: 'matchGame',      // 메모리 게임
      7: 'writing',        // 획순 테스트
    };
    
    if (screenMap[stageId]) {
      onNavigate(screenMap[stageId]);
    }
  };

  // 여정 맵 클릭 시 미션 바 표시
  const handleMapClick = () => {
    setShowProgressBar(true);
  };

  // 미션 바 닫기
  const handleCloseProgressBar = () => {
    setShowProgressBar(false);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md md:max-w-2xl lg:max-w-5xl mx-auto min-h-full px-4 md:px-6 pt-6 md:pt-10 pb-32 gap-6 md:gap-8 relative">
      
      {/* 뱃지 모달 */}
      {showBadges && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="clay-panel !rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-10 bg-white dark:bg-slate-800 border-[8px] border-white dark:border-slate-700 shadow-2xl relative">
            <button 
              onClick={() => setShowBadges(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xl active:scale-90 z-50"
            >✕</button>
            <h2 className="text-3xl font-black text-slate-700 dark:text-white mb-6 text-center">나의 뱃지함</h2>
            <div className="flex flex-col gap-6">
              {getStats && <MasteryBar getStats={getStats} />}
            </div>
          </div>
        </div>
      )}

      {/* 상단 우측 다크모드 토글 */}
      <div className="w-full flex justify-end z-50 safe-top">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="clay-button flex items-center justify-center p-2.5 md:p-3 rounded-2xl active:scale-90 transition-all w-11 h-11 md:w-14 md:h-14 shrink-0"
        >
          <span className="text-xl md:text-2xl">{isDarkMode ? '☀️' : '🌙'}</span>
        </button>
      </div>

      {/* 로고 */}
      <div className="flex flex-col items-center w-full gap-2">
        <img 
          src="/assets/images/logo.webp"
          alt={t('appTitle')} 
          className="h-14 md:h-18 lg:h-20 object-contain animate-float drop-shadow-lg"
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. 상단: 통합 프로필 & 뱃지 대시보드
          ───────────────────────────────────────────────────────────── */}
      <ProfileDashboard
        selectedCharacter={selectedCharacter}
        userNickname={userNickname}
        userXp={myXp}
        unlockedStickers={unlockedStickers}
        onNavigateToCalendar={() => onNavigate('calendar')}
        onShowXpPopup={() => {}}
      />

      {/* ─────────────────────────────────────────────────────────────
          2. 중앙: 7단계 여정 맵
          ───────────────────────────────────────────────────────────── */}
      <JourneyMapOptimized
        completedStages={completedStages}
        currentStage={completedStages + 1}
        onNodeClick={handleNodeClick}
        onMapClick={handleMapClick}
      />

      {/* ─────────────────────────────────────────────────────────────
          3. 하단 슬라이드업 미션 바
          ───────────────────────────────────────────────────────────── */}
      <JourneyProgressBar
        isOpen={showProgressBar}
        missionData={missionData}
        onClose={handleCloseProgressBar}
        completedStages={completedStages}
      />

      {/* 기존 일일 미션 카드 (옵션: 유지 또는 제거) */}
      {missions && missions.length > 0 && (
        <div className="w-full">
          <div className="text-xs md:text-sm font-black text-slate-600 dark:text-slate-300 mb-3">
            📋 일일 미션
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {missions.slice(0, 4).map((mission, idx) => (
              <DailyMissionCard key={idx} mission={mission} />
            ))}
          </div>
        </div>
      )}

      {/* 기존 메뉴 버튼들 (옵션: 필요시 유지) */}
      <div className="w-full grid grid-cols-2 gap-4 md:gap-6">
        <button
          onClick={() => onNavigate('rankings')}
          className="clay-panel px-4 py-6 md:py-8 bg-white/70 dark:bg-slate-900/50 border-[3px] border-white/80 backdrop-blur-md shadow-lg rounded-2xl active:scale-95 transition-all text-center"
        >
          <div className="text-3xl md:text-4xl mb-2">🏆</div>
          <div className="text-xs md:text-sm font-black text-slate-700 dark:text-white">랭킹</div>
        </button>
        <button
          onClick={() => onNavigate('stickerBook')}
          className="clay-panel px-4 py-6 md:py-8 bg-white/70 dark:bg-slate-900/50 border-[3px] border-white/80 backdrop-blur-md shadow-lg rounded-2xl active:scale-95 transition-all text-center"
        >
          <div className="text-3xl md:text-4xl mb-2">📖</div>
          <div className="text-xs md:text-sm font-black text-slate-700 dark:text-white">보관함</div>
        </button>
      </div>
    </div>
  );
};

export default MainMenuRenewal;
