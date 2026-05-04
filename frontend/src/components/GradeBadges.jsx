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
        <div className={"relative flex flex-col items-center gap-1.5 transition-all duration-500 " + (unlocked ? "opacity-100" : "opacity-40 grayscale")}>
            <div className={"w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-4 border-white dark:border-slate-700 " +
                (unlocked ? ("bg-gradient-to-br " + badge.color + " " + badge.glow) : "bg-slate-100 dark:bg-slate-800")}>
                {badge.emoji}
                {isNew && unlocked && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-400 rounded-full border-2 border-white text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                        NEW
                    </div>
                )}
            </div>
            <div className="text-center">
                <div className={"font-black text-xs leading-tight " + (unlocked ? "text-slate-700 dark:text-white" : "text-slate-400")}>{badge.label}</div>
                <div className="text-[10px] text-slate-400 font-bold">{badge.subLabel}</div>
            </div>
        </div>
    );
};

const GradeBadges = ({ userXp }) => {
    const [expanded, setExpanded] = useState(false);

    const xp = userXp || 0;
    const unlockedCount = GRADE_BADGES.filter(b => xp >= b.requiredXp).length;

    // 방금 달성한 뱃지 (XP가 딱 해당 구간에 걸친 것)
    const newBadgeIds = GRADE_BADGES
        .filter(b => b.requiredXp > 0 && xp >= b.requiredXp && xp < b.requiredXp + 50)
        .map(b => b.id);

    return (
        <div className="w-full clay-panel !rounded-[2.5rem] border-4 border-white dark:border-slate-700 overflow-hidden shadow-xl">
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between px-6 py-4 bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🏅</span>
                    <div className="text-left">
                        <div className="font-black text-slate-700 dark:text-white text-base leading-tight">급수 달성 뱃지</div>
                        <div className="text-xs text-slate-400 font-bold">{unlockedCount}/{GRADE_BADGES.length} 획득</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* 미니 뱃지 미리보기 */}
                    <div className="flex gap-1">
                        {GRADE_BADGES.slice(0, 3).map(b => (
                            <span key={b.id} className={"text-lg " + (xp >= b.requiredXp ? "" : "grayscale opacity-40")}>{b.emoji}</span>
                        ))}
                    </div>
                    <span className="text-slate-400 text-xl">{expanded ? '▲' : '▼'}</span>
                </div>
            </button>

            {expanded && (
                <div className="px-6 pb-6 pt-3 bg-white/20 dark:bg-slate-900/20">
                    <div className="grid grid-cols-5 gap-3">
                        {GRADE_BADGES.map(badge => (
                            <BadgeItem
                                key={badge.id}
                                badge={badge}
                                unlocked={xp >= badge.requiredXp}
                                isNew={newBadgeIds.includes(badge.id)}
                            />
                        ))}
                    </div>

                    {/* 다음 뱃지까지 진행도 */}
                    {(() => {
                        const nextBadge = GRADE_BADGES.find(b => xp < b.requiredXp);
                        if (!nextBadge) return (
                            <div className="mt-5 text-center text-emerald-500 font-black text-sm">🎉 모든 뱃지 달성!</div>
                        );
                        const prevBadge = GRADE_BADGES[GRADE_BADGES.indexOf(nextBadge) - 1];
                        const prevXp = prevBadge ? prevBadge.requiredXp : 0;
                        const range = nextBadge.requiredXp - prevXp;
                        const progress = xp - prevXp;
                        const pct = Math.min(100, (progress / range) * 100);
                        return (
                            <div className="mt-5">
                                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                                    <span>다음 뱃지: {nextBadge.emoji} {nextBadge.label}</span>
                                    <span>{xp} / {nextBadge.requiredXp} XP</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border-2 border-white dark:border-slate-700">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-700"
                                        style={{ width: pct + '%' }}
                                    />
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
