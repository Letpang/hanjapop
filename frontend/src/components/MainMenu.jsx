import React, { useState, useMemo } from 'react';
import { useLang } from '../LangContext.jsx';
import { getLeaderboardPosition, getRankDetails } from '../utils/rankUtils.js';
import DailyMissionCard from './DailyMissionCard.jsx';
import MasteryBar from './MasteryBar.jsx';
import GradeBadges from './GradeBadges.jsx';

const TOTAL_STICKERS = 300;

const MenuButton = ({ label, icon, activeColor, onClick, locked }) => {
    return (
        <button
            onClick={locked ? null : onClick}
            className={'clay-button group relative flex flex-col items-center justify-center p-6 gap-3 transition-all duration-300 ' + (locked ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 hover:-translate-y-2')}
            style={{ borderColor: 'white' }}
        >
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

const CHARACTER_ASSETS = {
    'eunha': { name: '은하', img: '/assets/images/characters/eunha.png' },
    'uju': { name: '우주', img: '/assets/images/characters/uju.png' },
    'lv5_injeolmi': { name: '인절미', img: '/assets/images/characters/lv5_injeolmi.png' },
    'lv5_garaetteok': { name: '가래떡', img: '/assets/images/characters/lv5_garaetteok.png' },
    'lv5_chapssaltteok': { name: '찹쌀떡', img: '/assets/images/characters/lv5_chapssaltteok.png' }
};

const XP_THRESHOLDS = [100, 300, 600, 1000];
const getNextXp = (level) => XP_THRESHOLDS[level - 1] ?? 1000;

const MainMenu = ({
    onNavigate, activePlanet, onSelectPlanet, unlockedStickers, userXp,
    isDarkMode, setIsDarkMode, selectedCharacter, setSelectedCharacter, unlockedCharacters,
    missions, streak, allDone, doneCount, getStats
}) => {
    const { t } = useLang();
    const [showCharSelect, setShowCharSelect] = useState(false);

    const uniqueStickersCount = Object.keys(unlockedStickers).length;

    const myXp = userXp || 0;
    const position = useMemo(() => getLeaderboardPosition(myXp), [myXp]);
    const rank = useMemo(() => getRankDetails(myXp, selectedCharacter, position), [myXp, selectedCharacter, position]);
    const nextXp = getNextXp(rank.level);
    const progress = rank.level >= 5 ? 100 : Math.min(100, (myXp / nextXp) * 100);

    return (
        <div className="flex flex-col items-center w-full max-w-md md:max-w-2xl lg:max-w-5xl mx-auto min-h-full px-6 pt-10 pb-32 gap-6 md:gap-10 relative">
            
            {/* Character Selection Modal */}
            {showCharSelect && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="clay-panel !rounded-[3rem] w-full max-w-lg p-8 bg-white dark:bg-slate-800 border-[8px] border-white dark:border-slate-700 shadow-2xl relative">
                        <button 
                            onClick={() => setShowCharSelect(false)}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xl active:scale-90"
                        >✕</button>
                        
                        <h2 className="text-3xl font-black text-slate-700 dark:text-white mb-6 text-center">캐릭터 선택</h2>
                        
                        <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-2">
                            {Object.keys(CHARACTER_ASSETS).map(charId => {
                                const isLocked = !unlockedCharacters.includes(charId);
                                return (
                                    <button
                                        key={charId}
                                        disabled={isLocked}
                                        onClick={() => {
                                            setSelectedCharacter(charId);
                                            setShowCharSelect(false);
                                        }}
                                        className={`relative p-4 rounded-3xl border-4 transition-all flex flex-col items-center gap-2 ${
                                            selectedCharacter === charId 
                                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg" 
                                            : isLocked
                                                ? "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-60 grayscale cursor-not-allowed"
                                                : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 active:scale-95 shadow-sm"
                                        }`}
                                    >
                                        <div className="w-20 h-20 md:w-24 md:h-24 relative">
                                            <img src={CHARACTER_ASSETS[charId]?.img} alt={charId} className="w-full h-full object-contain" />
                                            {isLocked && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-full">
                                                    <span className="text-2xl">🔒</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="font-black text-slate-600 dark:text-white text-sm md:text-base">
                                            {CHARACTER_ASSETS[charId]?.name}
                                        </span>
                                        {selectedCharacter === charId && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                                        )}
                                        {isLocked && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-slate-400 rounded-full flex items-center justify-center text-white text-[10px]">Lvl 5</div>
                                        )}
                                    </button>
                                );
                            })}
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

            <div className="flex flex-col items-center w-full gap-2 sm:gap-4 mt-6">
                <h1 className="text-[clamp(2.8rem,11vw,5rem)] md:text-8xl lg:text-[7rem] font-black premium-text-shadow tracking-tighter leading-tight text-center whitespace-nowrap text-slate-700 dark:text-white animate-float">
                    {t('appTitle')}
                </h1>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-8 py-3 md:px-14 md:py-5 rounded-full border-[4px] border-white shadow-2xl mt-2">
                    <p className="text-slate-600 dark:text-slate-200 font-black text-[clamp(1rem,4.5vw,1.4rem)] md:text-3xl whitespace-nowrap">
                        {t('subtitle')}
                    </p>
                </div>
            </div>

            <div className="w-full clay-panel !rounded-[3.5rem] px-6 py-6 md:px-10 md:py-10 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-[0_40px_80px_rgba(148,163,184,0.3)] border-[6px] md:border-[10px] border-white dark:border-slate-700">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 to-transparent dark:from-indigo-900/20 pointer-events-none"></div>
                
                <div 
                    onClick={() => setShowCharSelect(true)}
                    className="w-32 h-32 md:w-48 md:h-48 shrink-0 relative z-10 flex items-center justify-center animate-float cursor-pointer hover:scale-105 transition-transform"
                >
                    <div className="absolute inset-0 bg-white dark:bg-slate-800 rounded-[3rem] md:rounded-[4.5rem] shadow-inner border-4 border-slate-50 dark:border-slate-700"></div>
                    <div className="relative w-full h-full p-4 md:p-6">
                        <img src={rank.avatar} alt="Avatar" className="w-full h-full object-contain filter drop-shadow-2xl" />
                    </div>
                    <div className="absolute -bottom-2 bg-amber-400 text-white font-black text-sm md:text-2xl px-6 md:px-8 py-2 rounded-full border-[4px] border-white shadow-2xl z-20 whitespace-nowrap tracking-wide">
                        LV.{rank.level}
                    </div>
                </div>

                <div className="flex-1 w-full flex flex-col justify-center relative z-10">
                    <div className="flex justify-between items-end mb-3 md:mb-5">
                        <div className="flex flex-col">
                            <span className="text-indigo-400 dark:text-indigo-300 font-black text-sm md:text-lg mb-1 tracking-widest uppercase">Member Rank</span>
                            <span className="font-black text-slate-700 dark:text-white text-2xl md:text-4xl tracking-tighter leading-none">{rank.name}</span>
                        </div>
                        <button
                            onClick={() => onNavigate('rankings')}
                            className="flex flex-col items-end group"
                        >
                            <span className="text-amber-500 font-black text-2xl md:text-3xl leading-none group-hover:scale-110 transition-transform">#{position}</span>
                            <span className="text-slate-400 font-bold text-xs">전체 순위</span>
                        </button>
                    </div>

                    <div className="w-full bg-slate-100/80 dark:bg-slate-900/50 rounded-full h-6 md:h-9 p-1.5 relative z-10 border-2 border-white dark:border-slate-700 shadow-inner overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out relative shadow-md" style={{ width: progress + "%", background: 'linear-gradient(90deg, #FFB7B2, #FF9B9B)' }}>
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 rounded-t-full"></div>
                        </div>
                    </div>
                    <div className="flex justify-between mt-1.5 px-0.5">
                        <span className="text-xs font-bold text-slate-400">XP {myXp}</span>
                        {rank.level < 5 && <span className="text-xs font-bold text-slate-400">다음 레벨 {nextXp} XP</span>}
                    </div>

                    <div className="mt-3 flex gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">✨</span>
                            <span className="text-slate-500 dark:text-slate-300 font-black text-sm md:text-lg">스티커 {uniqueStickersCount}개</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-10 w-full mb-10 relative z-10">
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
                    label={t('menuMatch')}
                    icon="/assets/images/icons/icon_match.png"
                    activeColor="#BDB2FF"
                    onClick={() => onNavigate('matchGame')}
                />
                <MenuButton
                    label={t('menuMonster')}
                    icon="/assets/images/icons/icon_monster.png"
                    activeColor="#FFADAD"
                    onClick={() => onNavigate('shootGame')}
                />
                <MenuButton
                    label={t('menuSentenceQuiz')}
                    icon="/assets/images/icons/icon_quiz.png"
                    activeColor="#FFD700"
                    onClick={() => onNavigate('sentenceQuiz')}
                />
                <MenuButton
                    label={t('menuStickerBook')}
                    icon="/assets/images/icons/icon_sticker.png"
                    activeColor="#87CEFA"
                    onClick={() => onNavigate('stickerBook')}
                />
            </div>

            {/* 급수 달성 뼌지 */}
            <GradeBadges userXp={myXp} />

            {/* 단어 숙달도 */}
            {getStats && <MasteryBar getStats={getStats} />}

            {/* 오늘의 미션 + 스트릭 */}
            {missions && missions.length > 0 && (
                <DailyMissionCard
                    missions={missions}
                    streak={streak || { count: 0 }}
                    allDone={allDone}
                    doneCount={doneCount || 0}
                />
            )}

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
