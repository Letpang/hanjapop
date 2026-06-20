import React, { useState, useMemo } from 'react';
import { getLevel, getRankDetails, getCharacterScale, getCharacterTranslateY, LEVEL_THRESHOLDS } from '../utils/rankUtils.js';
import { SK } from '../constants/storageKeys.js';

const getUnlockedGrade = () => {
  try {
    const val = localStorage.getItem(SK.UNLOCKED_GRADE);
    return val ? val.normalize('NFC') : null;
  } catch {
    return null;
  }
};

const GRADE_ORDER = ['8급', '7급II', '7급', '6급II', '6급'];
const GRADE_BADGES = [
  { grade: '8급',   imgSrc: '/assets/images/badges/badge_grade_8.webp',  label: '8급' },
  { grade: '7급II', imgSrc: '/assets/images/badges/badge_grade_7_2.webp', label: '7급Ⅱ' },
  { grade: '7급',   imgSrc: '/assets/images/badges/badge_grade_7.webp',  label: '7급' },
  { grade: '6급II', imgSrc: '/assets/images/badges/badge_grade_6_2.webp', label: '6급Ⅱ' },
  { grade: '6급',   imgSrc: '/assets/images/badges/badge_grade_6.webp',  label: '6급' },
];

const getUnlockedBadgeIndex = (unlockedGrade) => {
  if (!unlockedGrade) return -1;
  if (unlockedGrade === '6급완료') return GRADE_ORDER.indexOf('6급');
  return GRADE_ORDER.indexOf(unlockedGrade);
};

const getCurrentStudyingGrade = (unlockedGrade) => {
  if (unlockedGrade === null) return '8급';
  if (unlockedGrade === '6급완료') return '6급';
  const idx = GRADE_ORDER.indexOf(unlockedGrade);
  if (idx === -1) return '8급';
  if (idx >= GRADE_ORDER.length - 1) return GRADE_ORDER[GRADE_ORDER.length - 1];
  return GRADE_ORDER[idx + 1];
};

const BADGE_CATEGORIES = [
  { id: 'attendance', label: '스트릭 가디언',     base: '/assets/images/badges/badge_3d_attendance', reqs: [0,  7,   30,  100,  365] },
  { id: 'mission',    label: '메모리 히어로',      base: '/assets/images/badges/badge_3d_mission',    reqs: [0, 30,  100,  350, 1000] },
  { id: 'hanja',      label: '한자 챌린저',        base: '/assets/images/badges/badge_3d_hanja',      reqs: [0, 30,  120,  300,  500] },
  { id: 'quiz',       label: '퀴즈 스나이퍼',      base: '/assets/images/badges/badge_3d_quiz',       reqs: [0, 30,  100,  400, 1200] },
  { id: 'game',       label: '몬스터 버스터',      base: '/assets/images/badges/badge_3d_game',       reqs: [0, 30,  100,  350, 1000] },
  { id: 'brush',      label: '스트로크 아티스트',  base: '/assets/images/badges/badge_3d_brush',      reqs: [0, 50,  200,  600, 2000] },
];

const BADGE_PEDESTAL = {
  attendance: { bg: '#BEF0E8', shadow: 'rgba(20,184,166,0.28)' },
  mission:    { bg: '#D8D4FF', shadow: 'rgba(109,111,242,0.26)' },
  hanja:      { bg: '#FFD0BE', shadow: 'rgba(220,80,60,0.22)' },
  quiz:       { bg: '#FFE898', shadow: 'rgba(245,158,11,0.28)' },
  game:       { bg: '#FFD4A8', shadow: 'rgba(250,110,40,0.24)' },
  brush:      { bg: '#D8D4C4', shadow: 'rgba(80,65,30,0.18)' },
};

const BADGE_GUIDES = {
  attendance: {
    desc: '매일 꾸준히 접속하여 출석 스트릭을 이어가면 등급이 오릅니다.',
    menu: '자동 누적'
  },
  mission: {
    desc: '메모리 게임에서 숨겨진 짝을 찾아 끝까지 완료하면 등급이 오릅니다.',
    menu: '메인 화면 ➔ 메모리 게임'
  },
  hanja: {
    desc: '새로운 한자를 학습하고 플래시카드 세션을 마치면 등급이 오릅니다.',
    menu: '메인 화면 ➔ 한자 학습지'
  },
  quiz: {
    desc: '단어 퀴즈나 문장 퀴즈 1세트(10문제)를 성공적으로 완수하면 등급이 오릅니다.',
    menu: '메인 화면 ➔ 단어 퀴즈 / 문장 퀴즈'
  },
  game: {
    desc: '몬스터 슈팅 게임에서 웨이브를 막아낸 수만큼 등급이 오릅니다.',
    menu: '메인 화면 ➔ 몬스터 슈팅'
  },
  brush: {
    desc: '획순 가이드에 맞추어 새로운 글자를 바르게 따라 쓰면 등급이 오릅니다.',
    menu: '메인 화면 ➔ 한자 쓰기'
  }
};

const getBadgeValue = (id, streak, totalStats) => {
  switch (id) {
    case 'attendance': return streak?.count || 0;
    case 'mission':    return totalStats?.matchGame || 0;
    case 'hanja':      return totalStats?.flashcard || 0;
    case 'quiz':       return (totalStats?.wordQuiz || 0) + (totalStats?.sentenceQuiz || 0);
    case 'game':       return totalStats?.shootGame || 0;
    case 'brush':      return totalStats?.writing || 0;
    default:           return 0;
  }
};

const getBadgeStage = (category, value) => {
  const reqs = category.reqs;
  for (let i = reqs.length - 1; i >= 0; i--) {
    if (value >= reqs[i]) return i + 1;
  }
  return 1;
};

const MyPageScreen = ({ onBack, onNavigate, userXp, userNickname, selectedCharacter, isDarkMode, setIsDarkMode, streak, totalStats }) => {
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [hoveredBadgeId, setHoveredBadgeId] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const xp = userXp || 0;

  // 학습일지 통계 계산을 위한 useMemo 보강
  const studyLog = (() => {
    try { 
      const raw = JSON.parse(localStorage.getItem(SK.STUDY_LOG) || '{}'); 
      return raw.days || {};
    } catch { return {}; }
  })();

  const streakCount = streak?.count || 0;

  const missionHistory = (() => {
    try { return JSON.parse(localStorage.getItem('mission_history') || '{}'); } catch { return {}; }
  })();

  const stats = useMemo(() => {
    const allCorrect = new Set();
    const allWrong = new Set();
    let studyDays = 0;

    const allLoggedDays = new Set([
      ...Object.keys(studyLog),
      ...Object.keys(missionHistory)
    ]);

    allLoggedDays.forEach(ds => {
      const entry = studyLog[ds] || {};
      const hasMission = missionHistory[ds] && missionHistory[ds].length > 0;
      const hasActivity = hasMission || (
        (entry.hanjaIds?.length > 0) ||
        (entry.wordIds?.length > 0) ||
        (entry.words?.length > 0) ||
        (entry.correctWordIds?.length > 0) ||
        (entry.wrongWordIds?.length > 0)
      );
      if (hasActivity) studyDays++;
      (entry.correctWordIds || []).forEach(id => allCorrect.add(id));
      (entry.wrongWordIds || []).forEach(id => allWrong.add(id));
    });

    const accuracy = (allCorrect.size + allWrong.size) > 0
      ? Math.round((allCorrect.size / (allCorrect.size + allWrong.size)) * 100) : null;

    const totalActivities = totalStats
      ? (totalStats.matchGame || 0) + (totalStats.shootGame || 0) +
        (totalStats.wordQuiz || 0) + (totalStats.sentenceQuiz || 0) +
        (totalStats.writing || 0)
      : 0;

    return { studyDays, accuracy, totalActivities };
  }, [studyLog, missionHistory, totalStats]);

  const STATUS_ITEMS = [
    {
      key: 'studyDays',
      label: '총 학습일',
      value: stats.studyDays,
      unit: '일',
      imgSrc: '/assets/images/icons/icon_study_days.webp',
      bg: 'bg-[#EEF2FF]/60',
      bgDark: 'bg-indigo-950/20',
      border: 'border-indigo-100/60',
      borderDark: 'border-indigo-900/30',
      iconBorder: 'border-indigo-100/30'
    },
    {
      key: 'streak',
      label: '연속 학습',
      value: streakCount,
      unit: '일',
      imgSrc: '/assets/images/icons/icon_streak.webp',
      bg: 'bg-[#FFF0E6]/60',
      bgDark: 'bg-orange-950/20',
      border: 'border-orange-100/60',
      borderDark: 'border-orange-900/40',
      iconBorder: 'border-orange-100/30'
    },
    {
      key: 'accuracy',
      label: '정답률',
      value: stats.accuracy !== null ? `${stats.accuracy}%` : '-',
      unit: '',
      imgSrc: '/assets/images/icons/icon_accuracy.webp',
      bg: 'bg-[#FFFBEB]/60',
      bgDark: 'bg-amber-950/20',
      border: 'border-amber-100/60',
      borderDark: 'border-amber-900/40',
      iconBorder: 'border-amber-100/30'
    },
    {
      key: 'totalActivities',
      label: '총 활동',
      value: stats.totalActivities,
      unit: '회',
      imgSrc: '/assets/images/icons/icon_activity.webp',
      bg: 'bg-[#F5F3FF]/70',
      bgDark: 'bg-purple-950/20',
      border: 'border-purple-100/60',
      borderDark: 'border-purple-900/30',
      iconBorder: 'border-purple-100/30'
    }
  ];

  // 마이페이지가 열릴 때마다 로컬스토리지를 직접 읽어 실시간으로 100% 동기화되도록 일반 변수로 관리합니다.
  const unlockedGrade = getUnlockedGrade();
  const unlockedIdx = getUnlockedBadgeIndex(unlockedGrade);
  const currentGradeBadge = unlockedIdx !== -1 ? GRADE_BADGES[unlockedIdx] : null;

  // 도전 중인 급수 배지 및 상태를 컴포넌트 밖이 아닌 컴포넌트 내부에서 확실하게 미리 계산하여 JSX 내 즉시실행함수(IIFE)로 인한 렌더링 오류를 제거합니다.
  const activeStudying = getCurrentStudyingGrade(unlockedGrade);
  const studyBadge = GRADE_BADGES.find(b => b.grade === activeStudying) || GRADE_BADGES[0];

  const level = getLevel(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const xpProgress = level >= 10 ? 100 : Math.min(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100, 100);
  const rankDetails = getRankDetails(xp, selectedCharacter);
  const characterImage = selectedCharacter ? rankDetails.avatar : '/assets/images/characters/default_3d.webp';

  return (
    <div className={`min-h-screen flex flex-col bg-[#F7FAF9] dark:bg-slate-900`}>

      {/* 헤더 */}
      <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
          <div className="quiz-header-card quiz-header-card--wide">
              <button onClick={onBack}
                  aria-label="뒤로 가기"
                  className="flex items-center justify-center bg-white/90 dark:bg-slate-700 border-2 border-white dark:border-slate-600 rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-normal text-[#5B677A] dark:text-slate-200 gap-1">
                  ←
              </button>
              <div className="flex items-center gap-2 overflow-hidden">
                  <h2 className="text-lg font-medium text-slate-700 dark:text-slate-100 m-0">마이페이지</h2>
              </div>
              <button onClick={() => onNavigate('settings')}
                  aria-label="설정 열기"
                  className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all bg-white text-[#AEB7C5] border border-slate-100 shadow-[0_4px_12px_rgba(80,96,120,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:shadow-[0_8px_18px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                      className="w-5 h-5">
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1-1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                      <circle cx="12" cy="12" r="3" />
                  </svg>
              </button>
          </div>
      </div>

      <div className="flex flex-col gap-6 px-5 pt-6 max-w-2xl w-full mx-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 3rem)' }}>

        {/* 프로필 카드 */}
        <div className={`w-full rounded-[2rem] border-4 shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-5 flex items-center gap-4 bg-white border-white dark:bg-slate-800 dark:border-slate-700`}>
          <div className={`relative shrink-0 w-24 h-24 rounded-[2rem] flex items-center justify-center overflow-visible bg-white/40 backdrop-blur-sm border-2 border-white shadow-lg dark:bg-slate-700/60 dark:border dark:border-slate-600`}>
            <img src={characterImage} alt="character" className="w-full h-full object-contain filter drop-shadow-2xl translate-y-[-8%] z-10"
              style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter)}) scale(${1.25 * getCharacterScale(selectedCharacter, `rank${rankDetails.imageRank}`)})` }}
              onError={e => { e.target.src = '/assets/images/characters/default_3d.webp'; }} />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#14B8A6] text-white font-normal text-xs px-3 py-1 rounded-full border-2 border-white shadow-md whitespace-nowrap z-20">
              LV.{level}
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-nowrap">
              <span className={`font-normal text-xl tracking-tight leading-none truncate max-w-[150px] text-[#3C3C3C] dark:text-slate-100`}>
                {userNickname || 'Explorer'}
              </span>
              {currentGradeBadge ? (
                <div
                  onClick={() => setShowGradeModal(true)}
                  className="relative flex items-center justify-center shrink-0 rounded-full bg-white dark:bg-slate-700 shadow-sm border border-slate-100/40 dark:border-slate-600 active:scale-95 transition-transform cursor-pointer"
                  style={{
                    width: '32px',
                    height: '32px',
                    filter: 'drop-shadow(0 2px 5px rgba(109,111,242,0.25))'
                  }}
                  title={`${currentGradeBadge.label} 인증 완료`}
                >
                  <img
                    src={currentGradeBadge.imgSrc}
                    alt={currentGradeBadge.label}
                    className="object-contain"
                    style={{ width: '22px', height: '22px' }}
                  />
                </div>
              ) : (
                <div
                  onClick={() => setShowGradeModal(true)}
                  className="relative flex items-center justify-center shrink-0 rounded-full bg-white/70 dark:bg-slate-700 shadow-sm border border-slate-100/30 dark:border-slate-600 active:scale-95 transition-transform cursor-pointer"
                  style={{
                    width: '32px',
                    height: '32px',
                    filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.06))'
                  }}
                  title={`${studyBadge.label} 도전 중!`}
                >
                  <img
                    src={studyBadge.imgSrc}
                    alt={studyBadge.label}
                    className="object-contain grayscale opacity-40"
                    style={{ width: '20px', height: '20px' }}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#7C83FF] font-normal text-sm">{rankDetails.rankName || 'Junior Master'}</span>
              <span className="text-xs font-normal text-[#FF9B73] whitespace-nowrap px-2 py-0.5 rounded-md flex items-center gap-1" style={{ backgroundColor: 'rgba(255,155,115,0.12)' }}>
                <img src="/assets/images/icons/icon_streak_mini.webp" alt="streak" className="w-4 h-4 object-contain" /> {streakCount}일 연속
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`flex-1 relative rounded-full h-5 overflow-hidden bg-slate-200/80 dark:bg-slate-600`} style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${xpProgress}%`, background: 'linear-gradient(to right, #FFB38A, #FF7E8A)', boxShadow: '0 0 18px rgba(255,126,138,0.35)' }}
                >
                  <div className="absolute top-0.5 left-1 right-1 h-2 bg-white/25 rounded-full" />
                </div>
              </div>
              <span className={`font-normal text-xs whitespace-nowrap text-[#3E4A5C] dark:text-[#AEB7C5]`}>{xp.toLocaleString()} XP</span>
            </div>
          </div>
        </div>

        {/* 뱃지 창고 */}
        <div className={`w-full rounded-[2rem] border-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] bg-white border-white dark:bg-slate-800 dark:border-slate-700`}>
          <div className={`px-5 pt-4 pb-3 border-b rounded-t-[1.8rem] border-[#E5EAF2] bg-white dark:border-slate-700 dark:bg-slate-800`}>
            <h3 className={`font-medium text-base tracking-tight text-[#3C3C3C] dark:text-slate-100`}>뱃지 창고</h3>
          </div>

          <div className="grid grid-cols-3 px-4 pt-4 pb-6" style={{ columnGap: '10px', rowGap: '20px' }}>
            {BADGE_CATEGORIES.map((badge) => {
              const stage = getBadgeStage(badge, getBadgeValue(badge.id, streak, totalStats));
              const assetPath = `${badge.base}_${stage}.webp`;
              const pedestal = BADGE_PEDESTAL[badge.id];
              const isHovered = hoveredBadgeId === badge.id;
              return (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  onMouseEnter={() => setHoveredBadgeId(badge.id)}
                  onMouseLeave={() => setHoveredBadgeId(null)}
                  className="relative flex flex-col items-center active:scale-95 transition-all"
                >
                  {/* PC용 마우스 호버 스프링 툴팁 */}
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: '84%',
                      left: '50%',
                      transform: `translateX(-50%) scale(${isHovered ? 1 : 0.82})`,
                      opacity: isHovered ? 1 : 0,
                      pointerEvents: 'none',
                      transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      zIndex: 40,
                    }}
                    className="whitespace-nowrap"
                  >
                    <div className={`px-3 py-1.5 rounded-xl text-[11px] font-normal shadow-lg border bg-[#2D3142] border-[#2D3142] text-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100`}>
                      {badge.label}
                    </div>
                    {/* 화살표 꼬리 */}
                    <div className={`w-1.5 h-1.5 rotate-45 mx-auto -mt-[3.5px] border-r border-b bg-[#2D3142] border-[#2D3142] dark:bg-slate-800 dark:border-slate-700`} />
                  </div>

                  {/* 아이콘 영역 — bottom align */}
                  <div className="w-full flex flex-col items-center" style={{ height: '110px' }}>
                    <div className="flex-1 w-full flex items-end justify-center">
                      <img
                        src={assetPath}
                        alt={badge.label}
                        style={{
                          height: '84px', width: 'auto', maxWidth: '100%',
                          objectFit: 'contain', objectPosition: 'bottom',
                          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.14)) drop-shadow(0 8px 16px rgba(0,0,0,0.08))',
                        }}
                        className="transform group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    {/* Pedestal */}
                    <div className="w-full flex justify-center mt-1.5">
                      <div style={{
                        width: '68%',
                        height: '9px',
                        borderRadius: '50%',
                        background: `linear-gradient(180deg, rgba(255,255,255,0.80) 0%, ${pedestal.bg} 100%)`,
                        boxShadow: `0 6px 16px ${pedestal.shadow}, 0 2px 4px rgba(120,130,160,0.06), inset 0 1px 2px rgba(255,255,255,0.95)`,
                      }} />
                    </div>
                  </div>

                  {/* 레벨 캡슐 (어수선한 여러 줄 텍스트 대체) */}
                  <div className={`mt-3.5 px-3 py-1 rounded-full text-[clamp(11px,2.8vw,13px)] font-normal leading-none transition-all ${
                    stage === 5 
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm shadow-orange-500/20 active:from-amber-500 active:to-orange-600' 
                      : 'bg-[#F0F3F5] text-[#5A6E85] group-hover:bg-[#E2E6E9] group-hover:text-[#3C4A5A] dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    Lv.{stage} {false}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 나의 학습 현황 */}
        <div className={`w-full rounded-[2rem] border-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] bg-white border-white dark:bg-slate-800 dark:border-slate-700`}>
          <div className={`px-5 pt-4 pb-3 border-b rounded-t-[1.8rem] border-[#E5EAF2] bg-white dark:border-slate-700 dark:bg-slate-800`}>
            <h3 className={`font-medium text-base tracking-tight text-[#3C3C3C] dark:text-slate-100`}>나의 학습 현황</h3>
          </div>
          <div className="grid grid-cols-2 p-4 gap-3">
            {STATUS_ITEMS.map((item) => {
              const display = item.value;
              const isEmpty = display === '-';
              return (
                <div 
                  key={item.key} 
                  className={`rounded-[1.5rem] border p-3 flex items-center gap-3 active:scale-[0.98] transition-all duration-300 ${
                    isDarkMode 
                      ? `${item.bgDark} ${item.borderDark}` 
                      : `${item.bg} ${item.border}`
                  }`}
                >
                  {/* 왼쪽: 둥근 소프트 박스에 아이콘 배치 */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 shadow-sm ${
                    'bg-white dark:bg-slate-800/80 dark:border-slate-700/60 ' + item.iconBorder
                  }`}>
                    <img 
                      src={item.imgSrc} 
                      alt={item.label} 
                      className="w-8 h-8 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)] transform hover:scale-110 transition-transform duration-300" 
                    />
                  </div>
                  
                  {/* 오른쪽: 텍스트 정보 */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-normal tracking-tight whitespace-nowrap block mb-0.5 text-[#8D9CAE] dark:text-slate-400`}>
                      {item.label}
                    </span>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-0.5 flex-nowrap">
                        <span className={`text-xl font-normal tracking-tight leading-none whitespace-nowrap bg-gradient-to-br from-[#2D3142] to-[#4F5D75] bg-clip-text text-transparent dark:text-white`} style={{ fontFamily: "'GenJyuuGothic', sans-serif" }}>
                          {display}
                        </span>
                        {item.unit && !isEmpty && (
                          <span className={`text-[13px] font-normal leading-none whitespace-nowrap shrink-0 ml-1 text-[#8D9CAE] dark:text-slate-400`}>
                            {item.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 상세 기록 */}
        <div className={`w-full rounded-[2rem] border-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] bg-white border-white dark:bg-slate-800 dark:border-slate-700`}>
          <div className={`px-5 pt-4 pb-3 border-b rounded-t-[1.8rem] border-[#E5EAF2] bg-white dark:border-slate-700 dark:bg-slate-800`}>
            <h3 className={`font-medium text-base tracking-tight text-[#3C3C3C] dark:text-slate-100`}>상세 기록</h3>
          </div>
          <div className="grid grid-cols-2 p-4 gap-3">
            <button
              onClick={() => onNavigate('calendar')}
              className={`rounded-[1.5rem] border p-3.5 flex items-center gap-3 active:scale-[0.98] transition-all duration-300 bg-[#F5F3FF]/70 border-purple-100/60 dark:bg-purple-950/20 dark:border-purple-900/30`}
            >
              {/* 왼쪽: 둥근 소프트 박스에 아이콘 배치 */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 shadow-sm bg-white border-purple-100/30 dark:bg-slate-800/80 dark:border-slate-700/60`}>
                <img src="/assets/images/icons/icon_calendar.webp" alt="달력" className="w-8 h-8 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)] transform hover:scale-110 transition-transform duration-300" />
              </div>
              {/* 오른쪽: 텍스트 정보 */}
              <div className="flex-1 min-w-0 text-left">
                <span className={`text-xs font-normal tracking-wider uppercase block mb-1 whitespace-nowrap text-[#8D9CAE] dark:text-slate-400`}>
                  날짜별 현황
                </span>
                <div className={`text-[clamp(11px,2.8vw,13px)] font-normal tracking-tight leading-none whitespace-nowrap text-slate-600 dark:text-slate-100`}>
                  일별 학습 리포트
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('vocabulary')}
              className={`rounded-[1.5rem] border p-3.5 flex items-center gap-3 active:scale-[0.98] transition-all duration-300 bg-[#FFFBEB]/70 border-amber-100/60 dark:bg-amber-950/20 dark:border-amber-900/30`}
            >
              {/* 왼쪽: 둥근 소프트 박스에 아이콘 배치 */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 shadow-sm bg-white border-amber-100/30 dark:bg-slate-800/80 dark:border-slate-700/60`}>
                <img src="/assets/images/icons/icon_vocab.webp" alt="단어장" className="w-8 h-8 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)] transform hover:scale-110 transition-transform duration-300" />
              </div>
              {/* 오른쪽: 텍스트 정보 */}
              <div className="flex-1 min-w-0 text-left">
                <span className={`text-xs font-normal tracking-wider uppercase block mb-1 whitespace-nowrap text-[#8D9CAE] dark:text-slate-400`}>
                  단어장
                </span>
                <div className={`text-[clamp(11px,2.8vw,13px)] font-normal tracking-tight leading-none whitespace-nowrap text-slate-600 dark:text-slate-100`}>
                  오답과 복습 단어
                </div>
              </div>
            </button>
          </div>
        </div>



      </div>

      {/* 뱃지 상세 모달 */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setSelectedBadge(null)}>
          <div className={`relative w-full max-w-sm rounded-[2.5rem] p-6 pt-10 pb-8 shadow-2xl flex flex-col gap-5 bg-[#F7FAF9] dark:bg-slate-800`} onClick={e => e.stopPropagation()}>
            {/* 왼쪽 상단 닫기(X) 버튼 */}
            <button 
              onClick={() => setSelectedBadge(null)}
              className={`absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm bg-white text-slate-400 border border-slate-200 dark:bg-slate-700/80 dark:text-slate-300 dark:border dark:border-slate-600`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            {(() => {
              const current = getBadgeStage(selectedBadge, getBadgeValue(selectedBadge.id, streak, totalStats));
              return (
                <>
                  <div className="text-center flex flex-col items-center">
                    <h2 className={`text-2xl font-medium uppercase tracking-tight bg-gradient-to-br from-[#2D3142] to-[#4F5D75] bg-clip-text text-transparent drop-shadow-sm dark:text-white dark:drop-shadow-md`} style={{ paddingBottom: '2px' }}>
                      {selectedBadge.label}
                    </h2>
                    <div className="mt-2 px-3 py-1 rounded-full text-xs font-normal bg-gradient-to-r from-[#7C83FF] to-[#9B8CFF] text-white shadow-md">
                      현재 등급: Lv.{current}
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map(s => {
                      const done = s <= current;
                      return (
                        <div key={s} className="flex flex-col items-center gap-1.5">
                          <div className="relative w-12 h-12">
                            <img
                              src={`${selectedBadge.base}_${s}.png`}
                              className={`w-full h-full object-contain transition-all ${!done ? 'grayscale opacity-35' : ''}`}
                            />
                            {/* 이미 달성한 모든 등급에 주황색 체크 표시 */}
                            {done && <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF9B73] rounded-full flex items-center justify-center text-white text-xs font-normal border border-white shadow-sm">✓</div>}
                          </div>
                          <span className={`text-xs font-normal uppercase tracking-wider px-2 py-0.5 rounded-full transition-all ${
                            s === current
                              ? 'bg-[#7C83FF] text-white shadow-sm'
                              : done
                                ? 'text-[#7C83FF] bg-[#7C83FF]/8'
                                : 'text-[#AEB7C5]'
                          }`}>
                            Lv.{s}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
            {(() => {
                const val = getBadgeValue(selectedBadge.id, streak, totalStats);
                const stage = getBadgeStage(selectedBadge, val);
                
                // 만렙(Lv.5) 달성 시에는 축하 메시지 렌더링
                if (stage >= 5) {
                  return (
                    <div className={`rounded-2xl p-4 border border-amber-200/50 flex flex-col items-center gap-1.5 bg-gradient-to-r from-amber-50/50 to-orange-50/30 text-center dark:from-amber-950/20 dark:to-orange-950/10 dark:border-amber-900/30`}>
                      
                      <span className={`font-normal text-sm break-keep text-amber-700 dark:text-amber-300`}>
                        축하합니다! 최고 등급을 완수했습니다.
                      </span>
                    </div>
                  );
                }

                const prevReq = selectedBadge.reqs[stage - 1] || 0;
                const nextReq = selectedBadge.reqs[stage];
                const leftVal = Math.max(0, nextReq - val);
                
                // 구간 분모 분자를 구하여 정밀한 진척도 계산
                const currentSegmentProgress = val - prevReq;
                const totalSegmentRange = nextReq - prevReq;
                const percent = totalSegmentRange > 0 
                  ? Math.min(100, Math.max(0, (currentSegmentProgress / totalSegmentRange) * 100))
                  : 100;

                const getBadgeActionText = (id) => {
                  switch (id) {
                    case 'attendance': return '일 연속 출석 시';
                    case 'mission':    return "판 '메모리 게임' 완료 시";
                    case 'hanja':      return "회 '한자 학습지' 완료 시";
                    case 'quiz':       return "세트 '단어/문장 퀴즈' 완수 시";
                    case 'game':       return "웨이브 '몬스터 슈팅' 완료 시";
                    case 'brush':      return "자 '한자 쓰기' 완료 시";
                    default:           return '회 완료 시';
                  }
                };

                const guide = BADGE_GUIDES[selectedBadge.id] || { desc: '', menu: '' };

                return (
                  <div className={`rounded-2xl p-4 border flex flex-col gap-2.5 bg-white border-[#E9EDF2] dark:bg-slate-700 dark:border-slate-600`}>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs font-normal tracking-wider uppercase">
                        <span className={`text-[#8D9CAE] dark:text-slate-400`}>
                          다음 단계 (Lv.{stage + 1}) 도전 중
                        </span>
                        <span className="text-[#FF7E8A]">
                          {leftVal.toLocaleString()} 남음
                        </span>
                      </div>
                      <p className={`text-sm font-normal break-keep text-[#5B677A] dark:text-slate-200`}>
                        앞으로 <span className="text-[#6D6FF2] font-normal text-[15px]">{leftVal.toLocaleString()}</span>{getBadgeActionText(selectedBadge.id)} 등급업!
                      </p>
                    </div>
                    <div className={`w-full h-2.5 rounded-full overflow-hidden bg-[#F4F7F8] dark:bg-slate-800`}>
                      <div className="h-full bg-gradient-to-r from-[#FFB433] to-[#FF7E8A] rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${percent}%` }} />
                    </div>

                    {/* 프리미엄 안내 가이드 패널 */}
                    <div className={`mt-3 p-4 rounded-2xl flex flex-col gap-2.5 relative transition-all duration-300 bg-[#F9FAFB] border border-[#F1F5F9] shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:bg-slate-800/60 dark:border dark:border-slate-700 dark:shadow-inner`}>
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`text-xs font-normal px-2.5 py-1 rounded-md tracking-widest uppercase bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300`}>
                          획득 경로
                        </span>
                        <span className={`text-sm font-normal tracking-tight break-keep text-[#334155] dark:text-white`}>
                          {guide.menu}
                        </span>
                      </div>
                      <p className={`text-sm font-normal leading-relaxed break-keep text-left text-[#64748B] dark:text-slate-300`}>
                        {guide.desc}
                      </p>
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      )}
      {showGradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowGradeModal(false)}>
          <div className={`relative w-full max-w-sm rounded-[2.5rem] p-6 pt-10 pb-8 shadow-2xl flex flex-col gap-5 bg-[#F7FAF9] dark:bg-slate-800`} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowGradeModal(false)}
              className={`absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm bg-white text-slate-400 border border-slate-200 dark:bg-slate-700/80 dark:text-slate-300 dark:border dark:border-slate-600`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="text-center flex flex-col items-center">
              <h2 className={`text-2xl font-medium tracking-tight bg-gradient-to-br from-[#2D3142] to-[#4F5D75] bg-clip-text text-transparent dark:text-white`} style={{ paddingBottom: '2px' }}>
                급수 인증 뱃지
              </h2>
              <div className="mt-2 px-3 py-1 rounded-full text-xs font-normal bg-gradient-to-r from-[#7C83FF] to-[#9B8CFF] text-white shadow-md">
                {unlockedIdx === -1 ? '도전 시작 전' : unlockedIdx >= GRADE_BADGES.length - 1 ? '전 급수 인증 완료!' : `${GRADE_BADGES[unlockedIdx].label} 인증 완료`}
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {GRADE_BADGES.map((b, i) => {
                const unlocked = i <= unlockedIdx;
                const isCurrent = i === unlockedIdx + 1 && unlockedIdx < GRADE_BADGES.length - 1;
                return (
                  <div key={b.grade} className="flex flex-col items-center gap-1.5">
                    <div className="relative w-12 h-12">
                      <img
                        src={b.imgSrc}
                        alt={b.label}
                        className={`w-full h-full object-contain transition-all ${!unlocked ? 'grayscale opacity-35' : ''}`}
                      />
                      {unlocked && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF9B73] rounded-full flex items-center justify-center text-white text-xs font-normal border border-white shadow-sm">✓</div>
                      )}
                    </div>
                    <span className={`text-xs font-normal px-1.5 py-0.5 rounded-full transition-all ${
                      unlocked
                        ? 'bg-[#7C83FF] text-white shadow-sm'
                        : isCurrent
                          ? `font-normal text-[#5B677A] dark:text-slate-300`
                          : 'text-[#AEB7C5]'
                    }`}>
                      {b.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className={`rounded-2xl p-4 border flex flex-col gap-1.5 bg-white border-[#E9EDF2] dark:bg-slate-700 dark:border-slate-600`}>
              {unlockedIdx >= GRADE_BADGES.length - 1 ? (
                <p className={`text-sm font-normal text-center break-keep text-amber-700 dark:text-amber-300`}>
                  🎉 모든 급수 인증을 완료했습니다!
                </p>
              ) : (
                <>
                  <p className={`text-xs font-normal uppercase tracking-wider text-[#8D9CAE] dark:text-slate-400`}>
                    다음 도전
                  </p>
                  <p className={`text-sm font-normal break-keep text-[#5B677A] dark:text-slate-200`}>
                    <span className="text-[#6D6FF2] font-normal">{GRADE_BADGES[Math.min(unlockedIdx + 1, GRADE_BADGES.length - 1)].label} 인증 시험</span>을 통과하면 뱃지를 획득합니다.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPageScreen;
