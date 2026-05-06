/**
 * GradeBadges.jsx
 * 급수 달성 뱃지 컴포넌트
 *
 * 급수 연동 기준 (XP 기반):
 *   Lv1 (0 XP)   → 한자 입문
 *   Lv2 (100 XP) → 8급 준비 완료
 *   Lv3 (300 XP) → 7급 준비 완료
 *   Lv4 (600 XP) → 6급 준비 완료
 *   Lv5 (1000 XP)→ 5급 도전 가능
 */

import React, { useState } from 'react';

const GRADE_BADGES = [
    {
        id: 'beginner',
        label: '한자 입문',
        subLabel: '첫 발걸음',
        emoji: '🌱',
        requiredXp: 0,
        color: 'from-slate-300 to-slate-400',
        glow: 'shadow-slate-200',
    },
    {
        id: 'grade8',
        label: '8급 준비완료',
        subLabel: 'Lv.2 달성',
        emoji: '🥉',
        requiredXp: 100,
        color: 'from-amber-300 to-amber-500',
        glow: 'shadow-amber-200',
    },
    {
        id: 'grade7',
        label: '7급 준비완료',
        subLabel: 'Lv.3 달성',
        emoji: '🥈',
        requiredXp: 300,
        color: 'from-slate-300 to-slate-500',
        glow: 'shadow-slate-200',
    },
    {
        id: 'grade6',
        label: '6급 준비완료',
        subLabel: 'Lv.4 달성',
        emoji: '🥇',
        requiredXp: 600,
        color: 'from-yellow-300 to-yellow-500',
        glow: 'shadow-yellow-200',
    },
    {
        id: 'grade5',
        label: '5급 도전 가능',
        subLabel: 'Lv.5 달성',
        emoji: '👑',
        requiredXp: 1000,
        color: 'from-indigo-400 to-purple-500',
        glow: 'shadow-indigo-200',
    },
];

const BadgeItem = ({ badge, unlocked, isNew }) => {
    return (
        <div className={"relative flex flex-col items-center gap-2 transition-all duration-500 " + (unlocked ? "opacity-100" : "opacity-30 grayscale")}>
            {/* Medal Container (Flat Glass Feel) */}
            <div className={"w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center border-2 border-white/50 dark:border-slate-700/50 relative overflow-hidden group transition-transform hover:-translate-y-1 " +
                (unlocked 
                    ? "bg-white/60 dark:bg-slate-800/60 shadow-md backdrop-blur-sm" 
                    : "bg-slate-100/50 dark:bg-slate-900/30 shadow-inner")}>
                
                {/* The Medal Icon */}
                <div className={"w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-2xl md:text-4xl relative z-10 " + 
                    (unlocked ? ("bg-gradient-to-br " + badge.color + " shadow-inner") : "bg-slate-200 dark:bg-slate-800 text-slate-400")}>
                    <span className="relative z-10 filter drop-shadow-sm">{badge.emoji}</span>
                </div>

                {isNew && unlocked && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full border-2 border-white text-white text-[8px] font-bold flex items-center justify-center animate-bounce z-20 shadow-md">
                        NEW
                    </div>
                )}
            </div>
            
            <div className="text-center px-1">
                <div className={"font-black text-[11px] md:text-sm leading-tight mb-0.5 " + (unlocked ? "text-slate-700 dark:text-slate-100" : "text-slate-400")}>
                    {badge.label}
                </div>
                <div className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                    {badge.subLabel}
                </div>
            </div>
        </div>
    );
};

const GradeBadges = ({ userXp }) => {
    const [expanded, setExpanded] = useState(false);

    const xp = userXp || 0;
    const unlockedCount = GRADE_BADGES.filter(b => xp >= b.requiredXp).length;

    const newBadgeIds = GRADE_BADGES
        .filter(b => b.requiredXp > 0 && xp >= b.requiredXp && xp < b.requiredXp + 50)
        .map(b => b.id);

    return (
        <div className="w-full clay-panel p-4 md:p-6 bg-white/60 dark:bg-slate-900/40 border-2 border-white/50 backdrop-blur-md shadow-lg relative overflow-hidden group">
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between transition-all group relative z-10"
            >
                <div className="flex items-center gap-3 md:gap-5">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-slate-200 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shadow-md border border-white/80 dark:border-slate-500 overflow-hidden p-2">
                        <img src="/assets/images/dashboard/medal.webp" alt="Medal" className="w-full h-full object-contain filter drop-shadow-sm" />
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-slate-700 dark:text-slate-100 text-lg md:text-2xl leading-none mb-1">
                            급수 달성 뱃지
                        </div>
                        <div className="text-[10px] md:text-sm text-indigo-500 dark:text-indigo-300 font-bold tracking-wider uppercase opacity-100">
                            {unlockedCount} / {GRADE_BADGES.length} 획득 완료
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 md:gap-5">
                    <div className="hidden sm:flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        {GRADE_BADGES.slice(0, 4).map(b => (
                            <span key={b.id} className={"text-xl " + (xp >= b.requiredXp ? "scale-110 drop-shadow-sm" : "grayscale opacity-30")}>{b.emoji}</span>
                        ))}
                    </div>
                    <div className={"w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center transition-transform duration-300 shadow-inner border border-white/50 " + (expanded ? "rotate-180" : "")}>
                        <span className="text-slate-400 text-sm md:text-lg">▼</span>
                    </div>
                </div>
            </button>

            {expanded && (
                <div className="px-6 pb-8 pt-2 md:px-10 md:pb-10 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-50/30 dark:to-indigo-900/10 pointer-events-none"></div>
                    
                    <div className="grid grid-cols-5 gap-3 md:gap-6 relative z-10">
                        {GRADE_BADGES.map(badge => (
                            <BadgeItem
                                key={badge.id}
                                badge={badge}
                                unlocked={xp >= badge.requiredXp}
                                isNew={newBadgeIds.includes(badge.id)}
                            />
                        ))}
                    </div>

                    {/* Next Badge Progress Bar */}
                    {(() => {
                        const nextBadge = GRADE_BADGES.find(b => xp < b.requiredXp);
                        if (!nextBadge) return (
                            <div className="mt-8 text-center bg-emerald-100 dark:bg-emerald-900/30 py-3 rounded-2xl border-2 border-white dark:border-emerald-800 shadow-inner">
                                <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm md:text-lg animate-pulse">✨ 모든 한자 급수 마스터! ✨</span>
                            </div>
                        );
                        const prevBadge = GRADE_BADGES[GRADE_BADGES.indexOf(nextBadge) - 1];
                        const prevXp = prevBadge ? prevBadge.requiredXp : 0;
                        const range = nextBadge.requiredXp - prevXp;
                        const progress = xp - prevXp;
                        const pct = Math.min(100, (progress / range) * 100);
                        return (
                            <div className="mt-8 relative z-10">
                                <div className="flex justify-between items-end mb-2.5 px-1">
                                    <span className="text-slate-500 dark:text-slate-300 font-black text-xs md:text-sm">
                                        다음 목표: <span className="text-indigo-500 dark:text-indigo-300">{nextBadge.emoji} {nextBadge.label}</span>
                                    </span>
                                    <span className="text-slate-400 dark:text-slate-400 font-black text-[10px] md:text-xs tracking-tighter">
                                        {xp} / {nextBadge.requiredXp} XP
                                    </span>
                                </div>
                                <div className="w-full h-4 md:h-6 bg-slate-100 dark:bg-slate-900 rounded-full p-1 border-2 border-white dark:border-slate-700 shadow-inner overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000 ease-out relative shadow-lg"
                                        style={{ 
                                            width: pct + '%', 
                                            background: 'linear-gradient(90deg, #A5B4FC, #818CF8, #6366F1)' 
                                        }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-full"></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default GradeBadges;
