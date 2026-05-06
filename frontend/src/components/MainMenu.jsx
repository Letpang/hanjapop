import React, { useState, useMemo } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { useLang } from '../LangContext.jsx';
import { getLeaderboardPosition, getRankDetails } from '../utils/rankUtils.js';
import DailyMissionCard from './DailyMissionCard.jsx';
import MasteryBar from './MasteryBar.jsx';
import GradeBadges from './GradeBadges.jsx';

const TOTAL_STICKERS = 300;

const MenuButton = ({ label, icon, activeColor, onClick, locked, badge }) => {
    return (
        <button
            onClick={locked ? null : onClick}
            className={'clay-button group relative flex flex-col items-center justify-center p-6 gap-3 transition-all duration-300 ' + (locked ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 hover:-translate-y-2')}
            style={{ borderColor: 'white' }}
        >
            {badge > 0 && (
                <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-black min-w-[1.5rem] h-6 px-1.5 rounded-full flex items-center justify-center z-20 shadow-md border-2 border-white">
                    {badge > 99 ? '99+' : badge}
                </div>
            )}
            <div className={'w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 mb-1 md:mb-3 transition-transform duration-300 relative ' + (locked ? '' : 'group-hover:scale-110 drop-shadow-md')}>
                {!locked && (
                    <div className="absolute inset-0 bg-white dark:bg-slate-800 rounded-[2rem] md:rounded-[3rem] shadow-inner opacity-80 border-2 border-slate-50 dark:border-slate-700"></div>
                )}
                <div className="relative w-full h-full flex items-center justify-center p-3 md:p-6">
                    {locked
                        ? <div className="w-full h-full flex items-center justify-center text-5xl">🔒</div>
                        : <img src={icon} alt={label} className="w-full h-full object-contain relative z-10 filter drop-shadow-lg" />
                    }
                </div>
            </div>
            <span className="font-black text-[clamp(1.1rem,4vw,1.25rem)] md:text-2xl lg:text-3xl text-center text-slate-700 dark:text-white px-2 leading-tight whitespace-nowrap premium-text-shadow">
                {label}
            </span>
            {!locked && (
                <div className="absolute bottom-3 w-1/3 h-1.5 rounded-full opacity-50 blur-[2px]" style={{ backgroundColor: activeColor }}></div>
            )}
        </button>
    );
};



// LV.10 시스템 임계값
const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 1800, 2800, 4000, 5500, 7500, 10000];
const getNextXp = (level) => level >= 10 ? null : LEVEL_THRESHOLDS[level];

const MainMenu = ({
    onNavigate, activePlanet, onSelectPlanet, unlockedStickers, userXp,
    isDarkMode, setIsDarkMode, selectedCharacter, userNickname,
    missions, streak, allDone, doneCount, getStats, mastery, todayStats, totalStats
}) => {
    const { t } = useLang();
    const [showBadges, setShowBadges] = useState(false);

    const uniqueStickersCount = Object.keys(unlockedStickers || {}).length;

    // 오답노트 뱃지: 복습 권장(1일 이상 지난 오답) 개수
    const reviewBadge = useMemo(() => {
        if (!mastery) return 0;
        const DAY_MS = 24 * 60 * 60 * 1000;
        return Object.values(mastery).filter(m =>
            m.wrongCount > 0 && m.lastWrong &&
            Date.now() - new Date(m.lastWrong).getTime() >= DAY_MS
        ).length;
    }, [mastery]);

    // 오늘의 복습 카드: 오답 있거나 복습 권장 한자 최대 5개
    const todayReviewItems = useMemo(() => {
        if (!mastery) return [];
        const DAY_MS = 24 * 60 * 60 * 1000;
        return HANJA_DATA
            .filter(h => {
                const m = mastery[String(h.id)];
                if (!m) return false;
                // 오답 있거나, 1일 이상 지난 복습 권장
                return (m.wrongCount > 0) || (m.lastSeen && Date.now() - new Date(m.lastSeen).getTime() >= DAY_MS && m.level < 2);
            })
            .sort((a, b) => {
                const ma = mastery[String(a.id)];
                const mb = mastery[String(b.id)];
                return (mb.wrongCount || 0) - (ma.wrongCount || 0);
            })
            .slice(0, 5);
    }, [mastery]);
    const myXp = userXp || 0;
    const position = useMemo(() => getLeaderboardPosition(myXp), [myXp]);
    const rank = useMemo(() => getRankDetails(myXp, selectedCharacter, position), [myXp, selectedCharacter, position]);
    const nextXp = getNextXp(rank.level);
    const progress = rank.level >= 10 ? 100 : rank.progress ?? Math.min(100, (myXp / (nextXp || 10000)) * 100);

    return (
        <div className="flex flex-col items-center w-full max-w-md md:max-w-2xl lg:max-w-5xl mx-auto min-h-full px-6 pt-10 pb-32 gap-6 md:gap-10 relative">
            
            {/* Badges Modal */}
            {showBadges && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="clay-panel !rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-10 bg-white dark:bg-slate-800 border-[8px] border-white dark:border-slate-700 shadow-2xl relative">
                        <button 
                            onClick={() => setShowBadges(false)}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xl active:scale-90 z-50"
                        >✕</button>
                        <h2 className="text-3xl font-black text-slate-700 dark:text-white mb-6 text-center">나의 뱃지함</h2>
                        <div className="flex flex-col gap-6">
                            <GradeBadges userXp={myXp} />
                            {getStats && <MasteryBar getStats={getStats} />}
                        </div>
                    </div>
                </div>
            )}
            

            <div className="w-full flex justify-between items-center z-50 safe-top">
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-slate-50 p-2.5 md:p-3 rounded-full border-[3px] border-white shadow-xl active:scale-90 transition-all w-12 h-12 md:w-16 md:h-16 shrink-0 overflow-hidden"
                    >
                        <span className="text-2xl md:text-3xl">{isDarkMode ? '☀️' : '🌙'}</span>
                    </button>
                    <button
                        onClick={() => onNavigate('rankings')}
                        className="flex items-center justify-center bg-amber-400 hover:bg-amber-500 text-white px-5 py-2 md:px-8 md:py-3 rounded-full border-[3px] border-white shadow-xl active:scale-95 transition-all font-black text-sm md:text-xl gap-1"
                    >
                        <span>🏆</span><span className="hidden md:block">랭킹</span>
                    </button>
                    <button
                        onClick={() => onNavigate('stickerBook')}
                        className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 md:px-10 md:py-3 rounded-full border-[3px] border-white shadow-xl active:scale-95 transition-all font-black text-sm md:text-xl"
                    >
                        <span className="hidden md:block mr-2">보관함</span> 📖
                    </button>
                </div>

            </div>

            <div className="flex flex-col items-center w-full gap-2 sm:gap-4 mt-6 mb-4">
                <img 
                    src="/assets/images/한자팝 로고.webp" 
                    alt={t('appTitle')} 
                    className="h-28 md:h-40 lg:h-48 object-contain animate-float drop-shadow-2xl"
                />
            </div>

            {/* Character Bar */}
            <button
                onClick={() => onNavigate('profile')}
                className="w-full clay-panel px-5 py-4 md:py-5 bg-white/70 dark:bg-slate-900/50 border-[3px] border-white/80 backdrop-blur-md shadow-lg rounded-[2rem] flex items-center gap-4 active:scale-[0.98] transition-all relative z-10"
            >
                <div className="relative shrink-0">
                    <img src={rank.avatar} alt="Avatar" className="w-16 h-16 md:w-20 md:h-20 object-contain filter drop-shadow-lg animate-float" />
                    <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white font-black text-[10px] md:text-xs px-2 py-0.5 rounded-full border-2 border-white shadow-sm whitespace-nowrap">
                        LV.{rank.level}
                    </div>
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="font-black text-slate-700 dark:text-white text-lg md:text-xl tracking-tight truncate">{userNickname || rank.name}</span>
                        {userNickname && <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 shrink-0">({rank.name})</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-slate-100/80 dark:bg-slate-700/50 rounded-full h-2 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: progress + '%', background: 'linear-gradient(90deg,#FFB7B2,#FF9B9B)' }} />
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 shrink-0">XP {myXp}</span>
                        {(streak?.count || 0) >= 3 && (
                            <span className="text-[9px] md:text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200">
                                {(streak?.count || 0) >= 7 ? '🔥×1.5' : '🔥×1.2'}
                            </span>
                        )}
                    </div>
                </div>
                <span className="text-slate-300 dark:text-slate-500 text-2xl shrink-0">›</span>
            </button>

            {/* 오늘의 미션 (Quest Preview) */}
            {missions && missions.length > 0 && (
                <DailyMissionCard
                    missions={missions}
                    streak={streak || { count: 0 }}
                    allDone={allDone}
                    doneCount={doneCount || 0}
                    onNavigate={onNavigate}
                />
            )}

            {/* 오늘의 복습 카드 */}
            {todayReviewItems.length > 0 && (
                <div className="w-full clay-panel px-5 py-4 bg-white/70 dark:bg-slate-900/50 border-[3px] border-white/80 backdrop-blur-md shadow-lg rounded-[2rem] relative z-10">
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-black text-slate-600 dark:text-slate-300 text-sm">📚 오늘의 복습</span>
                        <button
                            onClick={() => onNavigate('review')}
                            className="text-xs font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-200 active:scale-95 transition-all"
                        >
                            전체보기 →
                        </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {todayReviewItems.map(h => {
                            const m = mastery[String(h.id)];
                            const isWrong = m && m.wrongCount > 0;
                            return (
                                <button
                                    key={h.id}
                                    onClick={() => onNavigate('review')}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl shrink-0 w-16 border-2 transition-all active:scale-95 ${
                                        isWrong
                                            ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700'
                                            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
                                    }`}
                                >
                                    <span className="text-2xl font-black text-slate-700 dark:text-white">{h.hanja}</span>
                                    <span className="text-[9px] font-bold text-slate-400 truncate w-full text-center">{h.meaning}</span>
                                    {isWrong && (
                                        <span className="text-[8px] font-black text-rose-400">오답 {m.wrongCount}회</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* 1라인: 퀴즈/게임 */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 w-full relative z-10">
                <MenuButton
                    label={t('menuCombinedQuiz')}
                    icon="/assets/images/icons/icon_quiz.webp"
                    activeColor="#FFD700"
                    onClick={() => onNavigate('combinedQuiz')}
                />
                <MenuButton
                    label={t('menuMonster')}
                    icon="/assets/images/icons/icon_monster.webp"
                    activeColor="#FFADAD"
                    onClick={() => onNavigate('shootGame')}
                />
                <MenuButton
                    label={t('menuMatch')}
                    icon="/assets/images/icons/icon_match.webp"
                    activeColor="#BDB2FF"
                    onClick={() => onNavigate('matchGame')}
                />
            </div>

            {/* 2라인: 학습 */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 w-full relative z-10 mb-4">
                <MenuButton
                    label={t('menuFlashcard')}
                    icon="/assets/images/icons/icon_flashcard.webp"
                    activeColor="#A8E6CF"
                    onClick={() => onNavigate('flashcard')}
                />
                <MenuButton
                    label={t('menuLevelTest')}
                    icon="/assets/images/icons/icon_sentencequiz.webp"
                    activeColor="#C9B8FF"
                    onClick={() => onNavigate('levelTest')}
                />
                <MenuButton
                    label={t('menuWriting')}
                    icon="/assets/images/icons/icon_writing.webp"
                    activeColor="#FFD3B6"
                    onClick={() => onNavigate('writing')}
                />
            </div>



            <button
                onClick={() => {
                    if (confirm(t('resetConfirm'))) {
                        window.localStorage.clear();
                        window.location.reload();
                    }
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all text-sm font-bold mt-4 mb-10"
            >
                {t('resetBtn')}
            </button>
        </div>
    );
};

export default MainMenu;
