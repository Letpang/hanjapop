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
            className={'crystal-card group relative flex flex-col items-center justify-center p-4 md:p-6 gap-2 md:gap-3 transition-all duration-300 ' + (locked ? 'opacity-40 cursor-not-allowed' : 'active:scale-95 hover:-translate-y-3 hover:shadow-2xl')}
            style={!locked ? {
                boxShadow: `0 8px 32px ${activeColor}33, 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.95)`,
            } : {}}
        >
            {badge > 0 && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black min-w-[1.4rem] h-5 px-1 rounded-full flex items-center justify-center z-20 shadow-md border-2 border-white">
                    {badge > 99 ? '99+' : badge}
                </div>
            )}
            {/* 아이콘 컨테이너 - 글로시 3D */}
            <div className={'w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 mb-1 md:mb-2 transition-all duration-300 relative ' + (locked ? '' : 'group-hover:scale-110 group-hover:-translate-y-1')}>
                {!locked && (
                    <div className="absolute inset-0 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden"
                        style={{
                            background: `linear-gradient(135deg, rgba(255,255,255,0.9) 0%, ${activeColor}22 50%, rgba(255,255,255,0.8) 100%)`,
                            border: '2px solid rgba(255,255,255,0.95)',
                            boxShadow: `0 4px 16px ${activeColor}44, inset 0 1px 0 rgba(255,255,255,1), inset 0 -2px 4px rgba(0,0,0,0.04)`,
                        }}>
                        {/* 상단 글로시 하이라이트 */}
                        <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-[1.5rem]"
                            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)' }} />
                    </div>
                )}
                <div className="relative w-full h-full flex items-center justify-center p-3 md:p-5">
                    {locked
                        ? <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🔒</div>
                        : <img src={icon} alt={label} className="w-full h-full object-contain relative z-10 filter drop-shadow-lg" />
                    }
                </div>
            </div>
            <span className="font-black text-[clamp(0.9rem,3.5vw,1.1rem)] md:text-xl lg:text-2xl text-center text-slate-700 dark:text-white px-1 leading-tight whitespace-nowrap">
                {label}
            </span>
            {!locked && (
                <div className="absolute bottom-2 w-1/3 h-1 rounded-full"
                    style={{ background: `linear-gradient(90deg, transparent, ${activeColor}, transparent)`, opacity: 0.6 }} />
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
                <div className="flex gap-2 md:gap-3">
                    {/* 다크모드 토글 - 글래스 버튼 */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="clay-button flex items-center justify-center p-2.5 md:p-3 rounded-2xl active:scale-90 transition-all w-11 h-11 md:w-14 md:h-14 shrink-0"
                    >
                        <span className="text-xl md:text-2xl">{isDarkMode ? '☀️' : '🌙'}</span>
                    </button>
                    {/* 랭킹 버튼 */}
                    <button
                        onClick={() => onNavigate('rankings')}
                        className="clay-button flex items-center justify-center px-4 py-2 md:px-6 md:py-3 rounded-2xl active:scale-95 transition-all font-black text-sm md:text-base gap-1.5"
                        style={{ boxShadow: '0 4px 16px rgba(251,191,36,0.25), inset 0 1px 0 rgba(255,255,255,0.9)' }}
                    >
                        <span>🏆</span>
                        <span className="text-amber-600 dark:text-amber-400">랭킹</span>
                    </button>
                    {/* 보관함 버튼 */}
                    <button
                        onClick={() => onNavigate('stickerBook')}
                        className="clay-button flex items-center justify-center px-4 py-2 md:px-6 md:py-3 rounded-2xl active:scale-95 transition-all font-black text-sm md:text-base gap-1.5"
                        style={{ boxShadow: '0 4px 16px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.9)' }}
                    >
                        <span className="text-indigo-500 dark:text-indigo-400">보관함</span>
                        <span>📖</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col items-center w-full gap-2 sm:gap-4 mt-6 mb-4">
                <img 
                    src="/assets/images/logo.webp"
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
                        <div className="flex-1 rounded-full overflow-hidden relative"
                            style={{
                                height: '14px',
                                background: '#e2e8f0',
                                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.12)',
                            }}>
                            <div
                                className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                                style={{
                                    width: progress + '%',
                                    background: 'linear-gradient(90deg,#FFB7B2,#FF9B9B,#ff6b6b)',
                                    boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.5), 0 1px 4px rgba(255,107,107,0.35)',
                                    minWidth: progress > 0 ? '0.75rem' : '0',
                                }}
                            >
                                {/* 반짝임 하이라이트 */}
                                <div className="absolute top-0 left-0 right-0 h-1/2 rounded-full"
                                    style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0.55),transparent)' }} />
                            </div>
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

            {/* 오늘의 복습 — 컴팩트 3D 카드 */}
            <div
                onClick={() => onNavigate('review')}
                className="w-full clay-panel px-5 py-4 bg-white/70 dark:bg-slate-900/50 border-[3px] border-white/80 backdrop-blur-md shadow-lg rounded-[2rem] relative z-10 cursor-pointer active:scale-[0.98] transition-transform"
            >
                <div className="flex items-center gap-4">
                    {/* 왼쪽: 캐릭터 아바타 */}
                    <div className="shrink-0 w-14 h-14 flex items-center justify-center">
                        <img
                            src={rank.avatar}
                            alt="캐릭터"
                            className="w-full h-full object-contain drop-shadow-md animate-float"
                        />
                    </div>
                    {/* 오른쪽: 텍스트 */}
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <span className="font-black text-slate-700 dark:text-white text-sm">
                            🔥 오늘의 복습
                        </span>
                        {todayReviewItems.length > 0 ? (
                            <>
                                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold leading-snug">
                                    취약한 한자가 <span className="text-rose-500 font-black">{todayReviewItems.length}개</span> 쌓였어요!
                                </span>
                                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">
                                    요주의: <span className="text-slate-600 dark:text-slate-300 font-black">{todayReviewItems[0].hanja}</span>
                                    {todayReviewItems.length > 1 && ` 외 ${todayReviewItems.length - 1}개`}
                                </span>
                            </>
                        ) : (
                            <span className="text-emerald-500 text-xs font-black">🎉 오늘 복습 완료!</span>
                        )}
                    </div>
                    {/* 오른쪽 끝: 버튼 */}
                    <div className="shrink-0">
                        <div
                            className="px-3 py-2 rounded-xl font-black text-xs text-white"
                            style={{
                                background: todayReviewItems.length > 0
                                    ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                                    : 'linear-gradient(135deg, #34d399, #10b981)',
                                boxShadow: todayReviewItems.length > 0
                                    ? '0 3px 0 #b45309'
                                    : '0 3px 0 #059669',
                            }}
                        >
                            {todayReviewItems.length > 0 ? '⚡ 복습' : '✅ 완료'}
                        </div>
                    </div>
                </div>
            </div>
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
