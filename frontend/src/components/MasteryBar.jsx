/**
 * MasteryBar.jsx
 * 단어 숙달도 현황 바 (메인 메뉴에 표시)
 */

import React from 'react';
import HANJA_DATA from '../hanja_unified.json';

const LEVEL_COLORS = {
    mastered: { bg: 'bg-emerald-400', label: '완전암기', emoji: '🌟' },
    correct: { bg: 'bg-amber-400', label: '맞춤', emoji: '⭐' },
    seen: { bg: 'bg-indigo-300', label: '처음봄', emoji: '👀' },
    unknown: { bg: 'bg-slate-200 dark:bg-slate-700', label: '미학습', emoji: '❓' },
};

const MasteryBar = ({ getStats }) => {
    const stats = getStats(HANJA_DATA);
    const { total, unknown, seen, correct, mastered } = stats;

    const pctMastered = total > 0 ? (mastered / total) * 100 : 0;
    const pctCorrect = total > 0 ? (correct / total) * 100 : 0;
    const pctSeen = total > 0 ? (seen / total) * 100 : 0;

    return (
        <div className="w-full clay-panel p-4 md:p-6 bg-white/60 dark:bg-slate-900/40 border-2 border-white/50 backdrop-blur-md shadow-lg overflow-hidden relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 relative z-10">
                <div className="flex items-center gap-3 md:gap-5">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-slate-200 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shadow-md border border-white/80 dark:border-slate-500 overflow-hidden p-2">
                        <img src="/assets/images/dashboard/books.png" alt="Books" className="w-full h-full object-contain filter drop-shadow-sm" />
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-slate-700 dark:text-slate-100 text-lg md:text-2xl leading-none mb-1">
                            단어 숙달도
                        </div>
                        <div className="text-[10px] md:text-sm text-emerald-600 dark:text-emerald-400 font-bold tracking-wider uppercase opacity-100">
                            학습 달성 현황
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xl md:text-3xl font-black text-slate-700 dark:text-slate-100 leading-none">
                        {mastered} <span className="text-sm md:text-lg text-slate-400 dark:text-slate-400">/ {total}</span>
                    </span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">완전암기 단어수</span>
                </div>
            </div>

            {/* Glossy Segmented Progress Bar */}
            <div className="w-full h-12 md:h-20 bg-slate-100 dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-2 md:p-3 border-[6px] border-white dark:border-slate-700 shadow-inner overflow-hidden flex relative z-10">
                <div className="h-full rounded-l-2xl transition-all duration-1000 ease-out relative shadow-lg overflow-hidden group" style={{ width: pctMastered + '%', background: 'linear-gradient(180deg, #34D399, #10B981)' }}>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-50"></div>
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-full"></div>
                </div>
                <div className="h-full transition-all duration-1000 ease-out relative shadow-md overflow-hidden" style={{ width: pctCorrect + '%', background: 'linear-gradient(180deg, #FBBF24, #F59E0B)' }}>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-40"></div>
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-full"></div>
                </div>
                <div className="h-full transition-all duration-1000 ease-out relative shadow-sm overflow-hidden" style={{ width: pctSeen + '%', background: 'linear-gradient(180deg, #818CF8, #6366F1)' }}>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-30"></div>
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-t-full"></div>
                </div>
            </div>

            {/* Enhanced Legend Items as Glass Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mt-6 relative z-10">
                {[
                    { key: 'mastered', count: mastered, icon: '🌟', color: 'bg-emerald-400' },
                    { key: 'correct', count: correct, icon: '⭐', color: 'bg-amber-400' },
                    { key: 'seen', count: seen, icon: '👀', color: 'bg-indigo-400' },
                    { key: 'unknown', count: unknown, icon: '❓', color: 'bg-slate-300' },
                ].map(({ key, count, icon, color }) => (
                    <div key={key} className="flex items-center gap-2 md:gap-3 bg-white/50 dark:bg-slate-800/50 p-2 md:p-3 rounded-xl border border-white/50 dark:border-slate-700 shadow-sm transition-transform hover:-translate-y-0.5">
                        <div className={"w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-lg md:text-xl shadow-inner border border-white/50 " + color}>
                            {icon}
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter mb-0.5">
                                {LEVEL_COLORS[key].label}
                            </span>
                            <span className="text-xs md:text-base font-black text-slate-700 dark:text-slate-200">
                                {count}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MasteryBar;
