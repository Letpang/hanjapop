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
        <div className="w-full clay-panel !rounded-[3rem] border-[6px] md:border-[10px] border-white dark:border-slate-700 px-6 py-6 md:px-10 md:py-10 shadow-[0_40px_80px_rgba(148,163,184,0.3)] bg-white/90 dark:bg-slate-800/90 backdrop-blur-md overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 to-transparent dark:from-emerald-900/10 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 relative z-10">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-slate-200 rounded-[2rem] flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-500 animate-float overflow-hidden p-2">
                        <img src="/assets/images/dashboard/books.png" alt="Books" className="w-full h-full object-contain filter drop-shadow-md" />
                    </div>
                    <div className="text-left">
                        <div className="font-black text-slate-700 dark:text-slate-100 text-xl md:text-3xl leading-none mb-2 premium-text-shadow">
                            단어 숙달도
                        </div>
                        <div className="text-xs md:text-base text-emerald-600 dark:text-emerald-400 font-black tracking-wider uppercase opacity-100">
                            학습 달성 현황
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xl md:text-4xl font-black text-slate-700 dark:text-slate-100 leading-none">
                        {mastered} <span className="text-sm md:text-xl text-slate-400 dark:text-slate-400">/ {total}</span>
                    </span>
                    <span className="text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-1">완전암기 단어수</span>
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

            {/* Enhanced Legend Items as 3D Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-8 relative z-10">
                {[
                    { key: 'mastered', count: mastered, icon: '🌟', color: 'bg-emerald-400' },
                    { key: 'correct', count: correct, icon: '⭐', color: 'bg-amber-400' },
                    { key: 'seen', count: seen, icon: '👀', color: 'bg-indigo-400' },
                    { key: 'unknown', count: unknown, icon: '❓', color: 'bg-slate-300' },
                ].map(({ key, count, icon, color }) => (
                    <div key={key} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border-[3px] border-white dark:border-slate-700 shadow-md transition-transform hover:scale-105">
                        <div className={"w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/50 " + color}>
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-xl"></div>
                            {icon}
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-1">
                                {LEVEL_COLORS[key].label}
                            </span>
                            <span className="text-sm md:text-xl font-black text-slate-700 dark:text-slate-100">
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
