import React, { useState, useMemo } from 'react';
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



const XP_THRESHOLDS = [100, 300, 600, 1000];
const getNextXp = (level) => XP_THRESHOLDS[level - 1] ?? 1000;

const MainMenu = ({
    onNavigate, activePlanet, onSelectPlanet, unlockedStickers, userXp,
    isDarkMode, setIsDarkMode, selectedCharacter,
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

    const myXp = userXp || 0;
    const position = useMemo(() => getLeaderboardPosition(myXp), [myXp]);
    const rank = useMemo(() => getRankDetails(myXp, selectedCharacter, position), [myXp, selectedCharacter, position]);
    const nextXp = getNextXp(rank.level);
    const progress = rank.level >= 5 ? 100 : Math.min(100, (myXp / nextXp) * 100);

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
                    src="/assets/images/한자팝 로고.png" 
                    alt={t('appTitle')} 
                    className="h-28 md:h-40 lg:h-48 object-contain animate-float drop-shadow-2xl"
                />
            </div>

            {/* 3-Box Header Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full relative z-10 mb-8">
                {/* Box 1: Character Profile */}
                <div className="clay-panel p-6 bg-white/60 dark:bg-slate-900/40 border-[4px] border-white/80 backdrop-blur-md shadow-lg rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden aspect-square">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/40 to-transparent dark:from-indigo-900/20 pointer-events-none"></div>
                    <div className="w-24 h-24 md:w-32 md:h-32 relative z-10 flex items-center justify-center animate-float mb-4">
                        <img src={rank.avatar} alt="Avatar" className="w-full h-full object-contain filter drop-shadow-xl" />
                        <div className="absolute -bottom-2 bg-amber-400 text-white font-black text-xs md:text-sm px-4 py-1 rounded-full border-2 border-white shadow-md whitespace-nowrap tracking-wide">
                            LV.{rank.level}
                        </div>
                    </div>
                    <span className="font-black text-slate-700 dark:text-white text-xl md:text-2xl tracking-tight mb-2 z-10">{rank.name}</span>
                    <div className="w-full bg-slate-100/80 dark:bg-slate-900/50 rounded-full h-3 p-1 relative z-10 border border-white dark:border-slate-700 shadow-inner overflow-hidden mb-2">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out relative shadow-sm" style={{ width: progress + "%", background: 'linear-gradient(90deg, #FFB7B2, #FF9B9B)' }}></div>
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 z-10">XP {myXp} / {nextXp}</span>
                </div>

                {/* Box 2: Activity Badges */}
                {(() => {
                    const ts = totalStats || {};
                    const masteredCount = Object.values(mastery || {}).filter(m => m.level >= 2).length;
                    const BADGES = [
                        { emoji: '🔥', label: '연속출석', count: streak?.count || 0, unit: '일' },
                        { emoji: '📅', label: '출석왕', count: ts.totalDays || 0, unit: '일' },
                        { emoji: '🏆', label: '한자 마스터', count: masteredCount, unit: '개' },
                        { emoji: '📖', label: '단어 마스터', count: ts.wordCorrect || 0, unit: '개' },
                        { emoji: '👾', label: '몬스터버스터즈', count: ts.shootGame || 0, unit: '회' },
                        { emoji: '🧩', label: '암기 천재', count: ts.matchGame || 0, unit: '회' },
                        { emoji: '✍️', label: '획순 마스터', count: ts.writing || 0, unit: '개' },
                        { emoji: '🎯', label: '단어퀴즈', count: ts.wordQuiz || 0, unit: '회' },
                        { emoji: '📝', label: '문장퀴즈', count: ts.sentenceQuiz || 0, unit: '회' },
                    ];
                    return (
                        <div className="clay-panel p-4 md:p-5 bg-white/60 dark:bg-slate-900/40 border-[4px] border-white/80 backdrop-blur-md shadow-lg rounded-[2.5rem] flex flex-col relative overflow-hidden aspect-square w-full">
                            <span className="font-black text-slate-600 dark:text-slate-300 text-xs md:text-sm tracking-tight mb-3 text-center">뱃지 획득 카드</span>
                            <div className="grid grid-cols-3 gap-2 flex-1">
                                {BADGES.map((b) => {
                                    const hasAny = b.count > 0;
                                    return (
                                        <div key={b.label} className="flex flex-col items-center justify-center gap-0.5">
                                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex flex-col items-center justify-center transition-all ${
                                                hasAny
                                                    ? 'bg-white dark:bg-slate-800 shadow-md border-2 border-white'
                                                    : 'border-2 border-dashed border-slate-200 dark:border-slate-700'
                                            }`}>
                                                {hasAny ? (
                                                    <>
                                                        <span className="text-sm md:text-base leading-none">{b.emoji}</span>
                                                        <span className="text-[9px] md:text-[10px] font-black text-indigo-500 leading-none">{b.count}{b.unit}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600 text-xs font-black">0</span>
                                                )}
                                            </div>
                                            <span className={`text-[8px] md:text-[9px] font-bold text-center leading-tight break-keep ${hasAny ? 'text-slate-500 dark:text-slate-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                                {b.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* Box 3: Learning Diary */}
                <button 
                    onClick={() => onNavigate('review')}
                    className="clay-panel p-4 md:p-6 bg-white/60 dark:bg-slate-900/40 border-[4px] border-white/80 backdrop-blur-md shadow-lg rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden group hover:-translate-y-2 transition-transform aspect-square w-full"
                >
                    {reviewBadge > 0 && (
                        <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-rose-400 text-white text-[10px] md:text-xs font-black px-2 py-1 rounded-full shadow-md border-2 border-white z-20 animate-bounce">
                            {reviewBadge}
                        </div>
                    )}
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 rounded-[2.5rem] flex items-center justify-center shadow-inner mb-3 border-2 border-white/50 group-hover:scale-110 transition-transform">
                        <span className="text-4xl md:text-5xl drop-shadow-md">📖</span>
                    </div>
                    <div className="flex flex-col items-center z-10">
                        <span className="font-black text-slate-700 dark:text-white text-base md:text-lg tracking-tight">학습 다이어리</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] md:text-xs font-bold text-emerald-500">한자 마스터: {Object.keys(mastery || {}).length}개</span>
                        </div>
                    </div>
                </button>
            </div>

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

            {/* 1라인: 학습 */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 w-full relative z-10">
                <MenuButton
                    label={t('menuFlashcard')}
                    icon="/assets/images/icons/icon_flashcard.png"
                    activeColor="#A8E6CF"
                    onClick={() => onNavigate('flashcard')}
                />
                <MenuButton
                    label={t('menuWriting')}
                    icon="/assets/images/icons/icon_writing.png"
                    activeColor="#FFD3B6"
                    onClick={() => onNavigate('writing')}
                />
                <MenuButton
                    label={t('menuCombinedQuiz')}
                    icon="/assets/images/icons/icon_quiz.png"
                    activeColor="#FFD700"
                    onClick={() => onNavigate('combinedQuiz')}
                />
            </div>

            {/* 2라인: 게임 + 레벨테스트 */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 w-full relative z-10 mb-4">
                <MenuButton
                    label={t('menuMonster')}
                    icon="/assets/images/icons/icon_monster.png"
                    activeColor="#FFADAD"
                    onClick={() => onNavigate('shootGame')}
                />
                <MenuButton
                    label={t('menuMatch')}
                    icon="/assets/images/icons/icon_match.png"
                    activeColor="#BDB2FF"
                    onClick={() => onNavigate('matchGame')}
                />
                <MenuButton
                    label={t('menuLevelTest')}
                    icon="/assets/images/icons/icon_review.png"
                    activeColor="#C9B8FF"
                    onClick={() => onNavigate('levelTest')}
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
