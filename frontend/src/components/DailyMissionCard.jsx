/**
 * DailyMissionCard.jsx
 * 오늘의 미션 + 스트릭 UI 카드
 */

import React, { useState } from 'react';

const DIFFICULTY_COLORS = {
    easy: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-300', badge: 'bg-emerald-400' },
    hard: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-300', badge: 'bg-rose-400' },
};

const MissionItem = ({ mission }) => {
    const colors = DIFFICULTY_COLORS[mission.difficulty] || DIFFICULTY_COLORS.easy;
    const pct = Math.min(100, (mission.progress / mission.target) * 100);

    return (
        <div 
            className={"group relative flex items-center gap-4 p-5 rounded-[2rem] border-[4px] transition-all duration-300 active:scale-[0.97] " + 
            (mission.done 
                ? "bg-slate-100/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60 shadow-inner" 
                : "bg-white dark:bg-slate-800 border-white dark:border-slate-700 shadow-[0_15px_30px_rgba(148,163,184,0.15)] hover:-translate-y-1.5 hover:shadow-[0_25px_50px_rgba(148,163,184,0.25)]")}
        >
            {/* Gloss Effect for the whole item */}
            {!mission.done && <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 rounded-[1.8rem] pointer-events-none"></div>}

            {/* Mission Icon with Sticker Effect */}
            <div className={"w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-2xl flex items-center justify-center font-black text-white text-2xl md:text-3xl shadow-[inset_0_-4px_0_rgba(0,0,0,0.2),0_8px_15px_rgba(0,0,0,0.1)] border-2 border-white/80 relative z-10 " + 
                (mission.done ? "bg-slate-400 dark:bg-slate-600" : colors.badge + " animate-float")}>
                {mission.done ? '✓' : (mission.difficulty === 'hard' ? '🔥' : '⭐')}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-2xl"></div>
            </div>

            <div className="flex-1 min-w-0 relative z-10">
                <div className={"font-black text-base md:text-xl leading-tight mb-2 " + 
                    (mission.done ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-700 dark:text-slate-100")}>
                    {mission.label}
                </div>
                
                {/* Chunky Progress Bar Container */}
                {!mission.done && (
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 rounded-full h-4 overflow-hidden border-[3px] border-white dark:border-slate-700 shadow-inner p-1">
                            <div
                                className={"h-full rounded-full transition-all duration-1000 relative shadow-md " + colors.badge}
                                style={{ width: pct + '%' }}
                            >
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 rounded-t-full"></div>
                            </div>
                        </div>
                        <span className="text-xs font-black text-indigo-500 dark:text-indigo-300 tabular-nums bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-800">
                            {mission.progress}/{mission.target}
                        </span>
                    </div>
                )}
            </div>

            {/* Reward Badge as a 3D chip */}
            <div className={"shrink-0 flex flex-col items-center justify-center w-20 md:w-24 py-3 rounded-[1.5rem] font-black shadow-[inset_0_-4px_0_rgba(0,0,0,0.1),0_10px_20px_rgba(251,191,36,0.2)] border-[3px] border-white relative z-10 " + 
                (mission.done ? "bg-slate-200 dark:bg-slate-700 text-slate-400" : "bg-gradient-to-b from-amber-300 to-amber-500 text-white")}>
                <span className="text-[10px] md:text-xs uppercase tracking-tighter opacity-80 mb-0.5">Reward</span>
                <span className="text-sm md:text-lg">+{mission.xp} XP</span>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-[1.3rem]"></div>
            </div>
        </div>
    );
};

const DailyMissionCard = ({ missions, streak, allDone, doneCount }) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="w-full clay-panel !rounded-[3.5rem] border-[6px] md:border-[10px] border-white dark:border-slate-700 overflow-hidden shadow-[0_40px_80px_rgba(148,163,184,0.3)] bg-white/90 dark:bg-slate-800/90 backdrop-blur-md relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/20 to-transparent dark:from-orange-900/10 pointer-events-none"></div>

            {/* Header Section */}
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between px-6 py-6 md:px-10 md:py-8 hover:bg-white/40 dark:hover:bg-slate-700/40 transition-all group relative z-10"
            >
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-slate-200 rounded-[2rem] flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-500 animate-float overflow-hidden p-2">
                        <img src="/assets/images/dashboard/mission.png" alt="Mission" className="w-full h-full object-contain filter drop-shadow-lg" />
                    </div>
                    <div className="text-left">
                        <div className="font-black text-slate-700 dark:text-slate-100 text-xl md:text-3xl leading-none mb-2 premium-text-shadow">
                            오늘의 미션
                        </div>
                        <div className="text-xs md:text-base text-orange-600 dark:text-orange-400 font-black tracking-wider uppercase opacity-100">
                            {doneCount} / {missions.length} 달성함
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-5">
                    {/* Streak Indicator */}
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-5 py-3 md:px-8 md:py-4 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border-[4px] border-orange-200 dark:border-orange-500 transform group-hover:scale-105 transition-transform">
                        <span className="text-2xl md:text-4xl animate-float">🔥</span>
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">STREAK</span>
                            <span className="font-black text-orange-500 dark:text-orange-300 text-base md:text-2xl">{streak.count}일째</span>
                        </div>
                    </div>
                    <div className={"w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center transition-transform duration-300 shadow-md " + (expanded ? "rotate-180" : "")}>
                        <span className="text-slate-400 text-lg">▼</span>
                    </div>
                </div>
            </button>

            {/* Mission List Section */}
            {expanded && (
                <div className="px-5 pb-8 pt-2 md:px-8 md:pb-10 flex flex-col gap-3 md:gap-4 relative z-10">
                    {allDone ? (
                        <div className="text-center py-10 flex flex-col items-center gap-4 bg-white/30 dark:bg-slate-900/30 rounded-[2rem] border-2 border-white dark:border-slate-700 shadow-inner animate-in zoom-in-95 duration-500">
                            <div className="text-6xl animate-float filter drop-shadow-xl">🏆</div>
                            <div className="flex flex-col gap-1">
                                <div className="font-black text-emerald-500 text-xl md:text-2xl premium-text-shadow">오늘의 미션 클리어!</div>
                                <div className="text-slate-400 text-sm md:text-base font-bold">내일 또 다른 도전이 기다려요 ✨</div>
                            </div>
                        </div>
                    ) : (
                        missions.map(m => <MissionItem key={m.id} mission={m} />)
                    )}
                </div>
            )}
        </div>
    );
};

export default DailyMissionCard;
