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
        <div className={"flex items-center gap-3 p-3 rounded-2xl border-2 border-white dark:border-slate-700 transition-all " + (mission.done ? "bg-slate-50/80 dark:bg-slate-800/50 opacity-70" : colors.bg)}>
            {/* 완료 체크 or 아이콘 */}
            <div className={"w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-black text-white text-sm shadow-md " + (mission.done ? "bg-slate-300 dark:bg-slate-600" : colors.badge)}>
                {mission.done ? '✓' : (mission.difficulty === 'hard' ? '🔥' : '⭐')}
            </div>
            <div className="flex-1 min-w-0">
                <div className={"font-bold text-sm leading-tight " + (mission.done ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-700 dark:text-white")}>
                    {mission.label}
                </div>
                {/* 진행 바 */}
                {!mission.done && (
                    <div className="mt-1.5 w-full bg-white/60 dark:bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                        <div
                            className={"h-full rounded-full transition-all duration-500 " + colors.badge}
                            style={{ width: pct + '%' }}
                        />
                    </div>
                )}
                {!mission.done && (
                    <div className="text-xs text-slate-400 mt-0.5">{mission.progress} / {mission.target}</div>
                )}
            </div>
            {/* XP 뱃지 */}
            <div className={"shrink-0 px-2.5 py-1 rounded-full font-black text-xs text-white shadow " + (mission.done ? "bg-slate-300 dark:bg-slate-600" : "bg-amber-400")}>
                +{mission.xp} XP
            </div>
        </div>
    );
};

const DailyMissionCard = ({ missions, streak, allDone, doneCount }) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="w-full clay-panel !rounded-[2.5rem] border-4 border-white dark:border-slate-700 overflow-hidden shadow-xl">
            {/* 헤더 */}
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between px-6 py-4 bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    <div className="text-left">
                        <div className="font-black text-slate-700 dark:text-white text-base leading-tight">오늘의 미션</div>
                        <div className="text-xs text-slate-400 font-bold">{doneCount}/{missions.length} 완료</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* 스트릭 */}
                    <div className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 px-3 py-1.5 rounded-full border-2 border-orange-200 dark:border-orange-700">
                        <span className="text-lg">🔥</span>
                        <span className="font-black text-orange-500 dark:text-orange-300 text-sm">{streak.count}일</span>
                    </div>
                    <span className="text-slate-400 text-xl">{expanded ? '▲' : '▼'}</span>
                </div>
            </button>

            {/* 미션 목록 */}
            {expanded && (
                <div className="px-5 pb-5 pt-2 flex flex-col gap-2.5 bg-white/20 dark:bg-slate-900/20">
                    {allDone ? (
                        <div className="text-center py-4 flex flex-col items-center gap-2">
                            <div className="text-4xl animate-float">🏆</div>
                            <div className="font-black text-emerald-500 text-lg">오늘 미션 완료!</div>
                            <div className="text-slate-400 text-sm font-bold">내일 새로운 미션이 기다려요</div>
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
