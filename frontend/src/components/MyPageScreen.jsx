import React, { useState, useEffect } from 'react';
import { getLevel, getRankDetails, LEVEL_THRESHOLDS } from '../utils/rankUtils.js';
import { getRecords } from '../utils/recordUtils.js';
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
  { grade: '8급',   imgSrc: '/assets/images/badges/badge_grade_8.png',  label: '8급' },
  { grade: '7급II', imgSrc: '/assets/images/badges/badge_grade_7_2.png', label: '7급Ⅱ' },
  { grade: '7급',   imgSrc: '/assets/images/badges/badge_grade_7.png',  label: '7급' },
  { grade: '6급II', imgSrc: '/assets/images/badges/badge_grade_6_2.png', label: '6급Ⅱ' },
  { grade: '6급',   imgSrc: '/assets/images/badges/badge_grade_6.png',  label: '6급' },
];

const getUnlockedBadgeIndex = (unlockedGrade) => {
  if (!unlockedGrade) return -1;
  return GRADE_ORDER.indexOf(unlockedGrade);
};

const getCurrentStudyingGrade = (unlockedGrade) => {
  if (unlockedGrade === null) return '8급';
  const idx = GRADE_ORDER.indexOf(unlockedGrade);
  if (idx === -1) return '8급';
  if (idx >= GRADE_ORDER.length - 1) return GRADE_ORDER[GRADE_ORDER.length - 1];
  return GRADE_ORDER[idx + 1];
};

const BADGE_CATEGORIES = [
  { id: 'attendance', label: '스트릭 가디언',     base: '/assets/images/badges/badge_3d_attendance', reqs: [0, 6,  28,  60,  180] },
  { id: 'mission',    label: '메모리 히어로',      base: '/assets/images/badges/badge_3d_mission',    reqs: [0, 20, 80,  200, 400] },
  { id: 'hanja',      label: '한자 챌린저',        base: '/assets/images/badges/badge_3d_hanja',      reqs: [0, 21, 90,  210, 360] },
  { id: 'quiz',       label: '퀴즈 스나이퍼',      base: '/assets/images/badges/badge_3d_quiz',       reqs: [0, 20, 80,  200, 400] },
  { id: 'game',       label: '몬스터 버스터',      base: '/assets/images/badges/badge_3d_game',       reqs: [0, 20, 80,  200, 400] },
  { id: 'brush',      label: '스트로크 아티스트',  base: '/assets/images/badges/badge_3d_brush',      reqs: [0, 30, 90,  240, 450] },
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
    desc: '매일매일 꾸준히 로그인하여 출석 스트릭을 이어가면 자동으로 레벨업돼요! 🔥',
    menu: '매일 로그인 시 자동 누적'
  },
  mission: {
    desc: '홈 화면 [game] ➔ [메모리 게임] 카드 뒤집기를 플레이하여 끝까지 완료해 보세요! 🧩',
    menu: '메인 화면 ➔ 메모리 게임'
  },
  hanja: {
    desc: '홈 화면 [study] ➔ [한자 학습지] 메뉴에서 새로운 글자를 학습하고 카드를 완료해 보세요! 📖',
    menu: '메인 화면 ➔ 한자 학습지'
  },
  quiz: {
    desc: '홈 화면 [quiz] ➔ [단어 퀴즈] 또는 [문장 퀴즈]를 풀어 퀴즈 문제를 성공적으로 완수해 보세요! 🎯',
    menu: '메인 화면 ➔ 단어 퀴즈 / 문장 퀴즈'
  },
  game: {
    desc: '홈 화면 [game] ➔ [몬스터 슈팅] 게임에서 한자 미사일로 밀려오는 몬스터들을 무찔러 보세요! 👾',
    menu: '메인 화면 ➔ 몬스터 슈팅'
  },
  brush: {
    desc: '홈 화면 [study] ➔ [한자 쓰기] 메뉴에서 획순 가이드에 맞추어 한자를 바르게 따라 써 보세요! ✍️',
    menu: '메인 화면 ➔ 한자 쓰기'
  }
};

const getBadgeValue = (id, streak, totalStats) => {
  switch (id) {
    case 'attendance': return streak?.count || 0;
    case 'mission':    return totalStats?.matchGame || 0;
    case 'hanja':      return totalStats?.hanjaStudyComplete || 0;
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

const RECORD_ITEMS = [
  { 
    key: 'matchBestTime',     
    label: '메모링 최단',   
    unit: '초',   
    imgSrc: '/assets/images/icons/memory_new.webp', 
    format: v => v != null ? `${v}` : '-',
    bg: 'bg-[#EEF2FF]/60', 
    bgDark: 'bg-indigo-950/20', 
    border: 'border-indigo-100/60', 
    borderDark: 'border-indigo-900/30',
    iconBorder: 'border-indigo-100/30'
  },
  { 
    key: 'wordMaxCombo',      
    label: '단어 최장 콤보', 
    unit: '연속', 
    imgSrc: '/assets/images/icons/words_streack.webp', 
    format: v => v || '-',
    bg: 'bg-[#FFF0E6]/60', 
    bgDark: 'bg-orange-950/20', 
    border: 'border-orange-100/60', 
    borderDark: 'border-orange-900/40',
    iconBorder: 'border-orange-100/30'
  },
  { 
    key: 'wordBestScore',     
    label: '단어 최고점',   
    unit: '/10',  
    imgSrc: '/assets/images/icons/words_best.webp', 
    format: v => v || '-',
    bg: 'bg-[#FFFBEB]/60', 
    bgDark: 'bg-amber-950/20', 
    border: 'border-amber-100/60', 
    borderDark: 'border-amber-900/40',
    iconBorder: 'border-amber-100/30'
  },
  { 
    key: 'totalMonsterKills', 
    label: '몬스터 총 격파', 
    unit: '마리', 
    imgSrc: '/assets/images/icons/monster_new.webp', 
    format: v => (v || 0).toLocaleString(),
    bg: 'bg-[#ECFDF5]/60', 
    bgDark: 'bg-emerald-950/20', 
    border: 'border-emerald-100/60', 
    borderDark: 'border-emerald-900/40',
    iconBorder: 'border-emerald-100/30'
  },
];

const MyPageScreen = ({ onBack, onNavigate, userXp, userNickname, selectedCharacter, isDarkMode, setIsDarkMode, streak, totalStats }) => {
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [hoveredBadgeId, setHoveredBadgeId] = useState(null);
  const xp = userXp || 0;
  const records = getRecords();
  const streakCount = streak?.count || 0;
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
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-slate-900' : 'bg-[#F7FAF9]'}`}>

      {/* 헤더 */}
      <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
          <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
              <button onClick={onBack}
                  className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-black text-[#5B677A] gap-1">
                  ←
              </button>
              <div className="flex items-center gap-2 overflow-hidden">
                  <h2 className="text-lg font-black text-slate-700 m-0">마이페이지</h2>
              </div>
              <button onClick={() => onNavigate('settings')}
                  className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-black text-[#5B677A] gap-1">
                  <span>⚙️</span><span className="ml-1">설정</span>
              </button>
          </div>
      </div>

      <div className="flex flex-col gap-6 px-5 pt-6 pb-12 max-w-2xl w-full mx-auto">

        {/* 프로필 카드 */}
        <div className={`w-full rounded-[2rem] border-4 shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-5 flex items-center gap-4 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-white'}`}>
          <div className={`relative shrink-0 w-24 h-24 rounded-[2rem] border flex items-center justify-center ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-[#F8FAF9] border-[#E9EDF2] shadow-inner'}`}>
            <img src={characterImage} alt="character" className="w-full h-full object-contain filter drop-shadow-2xl scale-125 translate-y-[-8%] z-10"
              onError={e => { e.target.src = '/assets/images/characters/default_3d.webp'; }} />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#14B8A6] text-white font-extrabold text-xs px-3 py-1 rounded-full border-2 border-white shadow-md whitespace-nowrap z-20">
              LV.{level}
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-nowrap">
              <span className={`font-extrabold text-xl tracking-tight leading-none truncate max-w-[150px] ${isDarkMode ? 'text-slate-100' : 'text-[#3C3C3C]'}`}>
                {userNickname || 'Explorer'}
              </span>
              {currentGradeBadge ? (
                <div 
                  className="relative flex items-center justify-center shrink-0 rounded-full bg-white shadow-sm border border-slate-100/40 active:scale-95 transition-transform"
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
                  className="relative flex items-center justify-center shrink-0 rounded-full bg-white/70 shadow-sm border border-slate-100/30 active:scale-95 transition-transform"
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
              <span className="text-[#7C83FF] font-bold text-sm">{rankDetails.rankName || 'Junior Master'}</span>
              <span className="text-xs font-extrabold text-[#FF9B73] whitespace-nowrap px-2 py-0.5 rounded-md flex items-center gap-1" style={{ backgroundColor: 'rgba(255,155,115,0.12)' }}>
                <img src="/assets/images/icons/streak.webp" alt="streak" className="w-4 h-4 object-contain" /> {streakCount}일 연속
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`flex-1 relative rounded-full h-5 overflow-hidden ${isDarkMode ? 'bg-slate-600' : 'bg-slate-200/80'}`} style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${xpProgress}%`, background: 'linear-gradient(to right, #FFB38A, #FF7E8A)', boxShadow: '0 0 18px rgba(255,126,138,0.35)' }}
                >
                  <div className="absolute top-0.5 left-1 right-1 h-2 bg-white/25 rounded-full" />
                </div>
              </div>
              <span className={`font-extrabold text-xs whitespace-nowrap ${isDarkMode ? 'text-[#AEB7C5]' : 'text-[#3E4A5C]'}`}>{xp.toLocaleString()} XP</span>
            </div>
          </div>
        </div>

        {/* 뱃지 창고 */}
        <div className={`w-full rounded-[2rem] border-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-white'}`}>
          <div className={`px-5 pt-4 pb-3 border-b rounded-t-[1.8rem] ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-[#E5EAF2] bg-white'}`}>
            <h3 className={`font-extrabold text-base tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-[#3C3C3C]'}`}>뱃지 창고</h3>
          </div>

          <div className="grid grid-cols-3 px-4 pt-4 pb-6" style={{ columnGap: '10px', rowGap: '20px' }}>
            {BADGE_CATEGORIES.map((badge) => {
              const stage = getBadgeStage(badge, getBadgeValue(badge.id, streak, totalStats));
              const assetPath = `${badge.base}_${stage}.png`;
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
                    <div className={`px-3 py-1.5 rounded-xl text-[11px] font-black shadow-lg border ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700 text-slate-100' 
                        : 'bg-[#2D3142] border-[#2D3142] text-white'
                    }`}>
                      {badge.label}
                    </div>
                    {/* 화살표 꼬리 */}
                    <div className={`w-1.5 h-1.5 rotate-45 mx-auto -mt-[3.5px] border-r border-b ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700' 
                        : 'bg-[#2D3142] border-[#2D3142]'
                    }`} />
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
                  <div className={`mt-3.5 px-3 py-1 rounded-full text-[10px] font-extrabold leading-none transition-all ${
                    stage === 5 
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm shadow-orange-500/20 active:from-amber-500 active:to-orange-600' 
                      : isDarkMode 
                        ? 'bg-slate-700 text-slate-300' 
                        : 'bg-[#F0F3F5] text-[#5A6E85] group-hover:bg-[#E2E6E9] group-hover:text-[#3C4A5A]'
                  }`}>
                    Lv.{stage} {stage === 5 && '🏆'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 나의 신기록 */}
        <div className={`w-full rounded-[2rem] border-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-white'}`}>
          <div className={`px-5 pt-4 pb-3 border-b rounded-t-[1.8rem] ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-[#E5EAF2] bg-white'}`}>
            <h3 className={`font-extrabold text-base tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-[#3C3C3C]'}`}>나의 신기록</h3>
          </div>
          <div className="grid grid-cols-2 p-4 gap-3">
            {RECORD_ITEMS.map((item) => {
              const val = records[item.key];
              const display = item.format(val);
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
                    isDarkMode ? 'bg-slate-800/80 border-slate-700/60' : 'bg-white ' + item.iconBorder
                  }`}>
                    <img 
                      src={item.imgSrc} 
                      alt={item.label} 
                      className="w-8 h-8 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)] transform hover:scale-110 transition-transform duration-300" 
                    />
                  </div>
                  
                  {/* 오른쪽: 텍스트 정보 */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-black tracking-wider uppercase block mb-1 ${
                      isDarkMode ? 'text-slate-400' : 'text-[#8D9CAE]'
                    }`}>
                      {item.label}
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {isEmpty ? (
                        <span className={`text-lg font-black ${isDarkMode ? 'text-slate-600' : 'text-[#C5D0DE]'}`}>
                          -
                        </span>
                      ) : (
                        <>
                          <span className={`text-xl font-black tracking-tight leading-none ${
                            isDarkMode 
                              ? 'text-white' 
                              : 'bg-gradient-to-br from-[#2D3142] to-[#4F5D75] bg-clip-text text-transparent'
                          }`} style={{ fontFamily: '"Outfit", "Inter", sans-serif' }}>
                            {display}
                          </span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none ${
                            isDarkMode 
                              ? 'bg-slate-750 text-slate-300' 
                              : 'bg-[#ECEFF1] text-[#607D8B]'
                          }`}>
                            {item.unit}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 바로가기 카드들 */}
        <div className={`w-full rounded-[2rem] border-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-white'}`}>
          <div className={`px-5 pt-4 pb-3 border-b rounded-t-[1.8rem] ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-[#E5EAF2] bg-white'}`}>
            <h3 className={`font-extrabold text-base tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-[#3C3C3C]'}`}>바로가기</h3>
          </div>
          <div className="grid grid-cols-2 p-4 gap-3">
            <button
              onClick={() => onNavigate('calendar')}
              className={`rounded-[1.5rem] border p-3.5 flex items-center gap-3 active:scale-[0.98] transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-purple-950/20 border-purple-900/30' 
                  : 'bg-[#F5F3FF]/70 border-purple-100/60'
              }`}
            >
              {/* 왼쪽: 둥근 소프트 박스에 아이콘 배치 */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 shadow-sm ${
                isDarkMode ? 'bg-slate-800/80 border-slate-700/60' : 'bg-white border-purple-100/30'
              }`}>
                <img src="/assets/images/icons/diary.webp" alt="달력" className="w-8 h-8 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)] transform hover:scale-110 transition-transform duration-300" />
              </div>
              {/* 오른쪽: 텍스트 정보 */}
              <div className="flex-1 min-w-0 text-left">
                <span className={`text-[10px] font-black tracking-wider uppercase block mb-1 ${
                  isDarkMode ? 'text-slate-400' : 'text-[#8D9CAE]'
                }`}>
                  학습 달력
                </span>
                <div className={`text-xs font-black tracking-tight leading-none ${isDarkMode ? 'text-slate-100' : 'text-slate-600'}`}>
                  나의 학습 스테이지
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('rankings')}
              className={`rounded-[1.5rem] border p-3.5 flex items-center gap-3 active:scale-[0.98] transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-amber-950/20 border-amber-900/30' 
                  : 'bg-[#FFFBEB]/70 border-amber-100/60'
              }`}
            >
              {/* 왼쪽: 둥근 소프트 박스에 아이콘 배치 */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 shadow-sm ${
                isDarkMode ? 'bg-slate-800/80 border-slate-700/60' : 'bg-white border-amber-100/30'
              }`}>
                <img src="/assets/images/icons/badge.webp" alt="랭킹" className="w-8 h-8 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)] transform hover:scale-110 transition-transform duration-300" />
              </div>
              {/* 오른쪽: 텍스트 정보 */}
              <div className="flex-1 min-w-0 text-left">
                <span className={`text-[10px] font-black tracking-wider uppercase block mb-1 ${
                  isDarkMode ? 'text-slate-400' : 'text-[#8D9CAE]'
                }`}>
                  랭킹 보드
                </span>
                <div className={`text-xs font-black tracking-tight leading-none ${isDarkMode ? 'text-slate-100' : 'text-slate-600'}`}>
                  전체 순위 확인
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 급수 인증 시험 */}
        {unlockedGrade === null && (
          <button
            onClick={() => onNavigate('gradeTest')}
            className="w-full rounded-[1.5rem] border-4 border-white p-5 flex items-center justify-between active:scale-95 transition-transform shadow-[0_8px_24px_rgba(255, 155, 115 ,0.2)] bg-gradient-to-r from-[#FF9B73] to-[#FF6B6B]"
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-white font-extrabold text-base">8급 인증 시험 도전하기</span>
              <span className="text-white/70 font-bold text-xs mt-0.5">8급 기출 기반 · 20문항 · 70% 합격</span>
            </div>
            <img src="/assets/images/icons/flashcard_node.webp" alt="Test" className="w-10 h-10 object-contain shrink-0 translate-y-1" style={{ filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.7)) drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }} />
          </button>
        )}
        {unlockedGrade === '8급' && (
          <button
            onClick={() => onNavigate('gradeTest72')}
            className="w-full rounded-[1.5rem] border-4 border-white p-5 flex items-center justify-between active:scale-95 transition-transform shadow-[0_8px_24px_rgba(124,131,255,0.2)] bg-gradient-to-r from-[#7C83FF] to-[#7C83FF]"
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-white font-extrabold text-base">7급II 인증 시험 도전하기</span>
              <span className="text-white/70 font-bold text-xs mt-0.5">7급II 기출 기반 · 20문항 · 70% 합격</span>
            </div>
            <img src="/assets/images/icons/flashcard_node.webp" alt="Test" className="w-10 h-10 object-contain shrink-0 translate-y-1" style={{ filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.7)) drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }} />
          </button>
        )}
        {unlockedGrade === '7급' && (
          <button
            onClick={() => onNavigate('gradeTest7')}
            className="w-full rounded-[1.5rem] border-4 border-white p-5 flex items-center justify-between active:scale-95 transition-transform shadow-[0_8px_24px_rgba(168,85,247,0.2)] bg-gradient-to-r from-purple-400 to-purple-500"
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-white font-extrabold text-base">7급 인증 시험 도전하기</span>
              <span className="text-white/70 font-bold text-xs mt-0.5">7급 기출 기반 · 20문항 · 70% 합격</span>
            </div>
            <img src="/assets/images/icons/flashcard_node.webp" alt="Test" className="w-10 h-10 object-contain shrink-0 translate-y-1" style={{ filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.7)) drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }} />
          </button>
        )}
        {unlockedGrade === '6급II' && (
          <button
            onClick={() => onNavigate('gradeTest62')}
            className="w-full rounded-[1.5rem] border-4 border-white p-5 flex items-center justify-between active:scale-95 transition-transform shadow-[0_8px_24px_rgba(245,158,11,0.2)] bg-gradient-to-r from-[#FFB433] to-[#FFB433]"
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-white font-extrabold text-base">6급II 인증 시험 도전하기</span>
              <span className="text-white/70 font-bold text-xs mt-0.5">6급II 기출 기반 · 20문항 · 70% 합격</span>
            </div>
            <img src="/assets/images/icons/flashcard_node.webp" alt="Test" className="w-10 h-10 object-contain shrink-0 translate-y-1" style={{ filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.7)) drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }} />
          </button>
        )}
        {unlockedGrade === '6급' && (
          <div className="w-full rounded-[1.5rem] border-4 border-white p-5 flex items-center justify-between shadow-sm bg-white">
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-[#3C3C3C] font-extrabold text-base">6급 인증 완료!</span>
              <span className="text-[#AEB7C5] font-bold text-xs mt-0.5">모든 급수의 인증을 마쳤어요 🎉</span>
            </div>
            <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center shrink-0">
              <span className="text-2xl">🏅</span>
            </div>
          </div>
        )}


      </div>

      {/* 뱃지 상세 모달 */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setSelectedBadge(null)}>
          <div className={`w-full max-w-sm rounded-[2.5rem] p-6 pb-8 shadow-2xl flex flex-col gap-5 ${isDarkMode ? 'bg-slate-800' : 'bg-[#F7FAF9]'}`} onClick={e => e.stopPropagation()}>
            {(() => {
              const current = getBadgeStage(selectedBadge, getBadgeValue(selectedBadge.id, streak, totalStats));
              return (
                <>
                  <div className="text-center flex flex-col items-center">
                    <h2 className={`text-lg font-extrabold uppercase tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-[#5D544F]'}`}>{selectedBadge.label}</h2>
                    <div className="mt-2 px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-[#7C83FF] to-[#9B8CFF] text-white shadow-md">
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
                            {done && <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF9B73] rounded-full flex items-center justify-center text-white text-xs font-extrabold border border-white shadow-sm">✓</div>}
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full transition-all ${
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
                    <div className={`rounded-2xl p-4 border border-amber-200/50 flex flex-col items-center gap-1.5 bg-gradient-to-r from-amber-50/50 to-orange-50/30 text-center ${
                      isDarkMode ? 'from-amber-950/20 to-orange-950/10 border-amber-900/30' : ''
                    }`}>
                      <span className="text-amber-500 text-lg">🏆</span>
                      <span className={`font-black text-xs ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
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
                    case 'mission':    return "회 '메모리 게임' 완료 시";
                    case 'hanja':      return "자 '한자 학습지' 완료 시";
                    case 'quiz':       return "문제 '단어/문장 퀴즈' 완수 시";
                    case 'game':       return "판 '몬스터 슈팅' 완료 시";
                    case 'brush':      return "자 '한자 쓰기' 완료 시";
                    default:           return '개 완료 시';
                  }
                };

                const guide = BADGE_GUIDES[selectedBadge.id] || { desc: '', menu: '' };

                return (
                  <div className={`rounded-2xl p-4 border flex flex-col gap-2.5 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-[#E9EDF2]'}`}>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10px] font-black tracking-wider uppercase">
                        <span className={`${isDarkMode ? 'text-slate-400' : 'text-[#8D9CAE]'}`}>
                          다음 단계 (Lv.{stage + 1}) 도전 중
                        </span>
                        <span className="text-[#FF7E8A]">
                          {leftVal.toLocaleString()} 남음
                        </span>
                      </div>
                      <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-[#5B677A]'}`}>
                        앞으로 <span className="text-[#6D6FF2] font-black">{leftVal.toLocaleString()}</span>{getBadgeActionText(selectedBadge.id)} 등급업!
                      </p>
                    </div>
                    <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-[#F4F7F8]'}`}>
                      <div className="h-full bg-gradient-to-r from-[#FFB433] to-[#FF7E8A] rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${percent}%` }} />
                    </div>

                    {/* 친절한 한글 메뉴 안내 가이드 카드 */}
                    <div className={`mt-2.5 p-3 rounded-xl border flex flex-col gap-1.5 ${
                      isDarkMode 
                        ? 'bg-slate-800/40 border-slate-700/50 text-slate-300' 
                        : 'bg-[#F5F7FF] border-[#E2E8F0] text-[#4A5568]'
                    }`}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          isDarkMode ? 'bg-slate-700 text-[#7C83FF]' : 'bg-[#EBF4FF] text-[#3B82F6]'
                        }`}>
                          메뉴 위치
                        </span>
                        <span className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-[#2D3748]'}`}>
                          {guide.menu}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold leading-relaxed break-keep text-left">
                        {guide.desc}
                      </p>
                    </div>
                  </div>
                );
              })()}
            <button onClick={() => setSelectedBadge(null)} className="pill-button-primary w-full py-3 text-sm">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPageScreen;
