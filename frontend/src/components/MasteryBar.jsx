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
        <div className="w-full clay-panel !rounded-[2.5rem] border-4 border-white dark:border-slate-700 px-6 py-5 shadow-xl bg-white/40 dark:bg-slate-900/40">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">📚</span>
                    <span className="font-black text-slate-700 dark:text-white text-base">단어 숙달도</span>
                </div>
                <span className="text-xs font-bold text-slate-400">{mastered} / {total} 완전암기</span>
            </div>

            {/* 누적 바 */}
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700">
                <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: pctMastered + '%' }} />
                <div className="h-full bg-amber-400 transition-all duration-700" style={{ width: pctCorrect + '%' }} />
                <div className="h-full bg-indigo-300 transition-all duration-700" style={{ width: pctSeen + '%' }} />
            </div>

            {/* 범례 */}
            <div className="flex gap-4 mt-3 flex-wrap">
                {[
                    { key: 'mastered', count: mastered },
                    { key: 'correct', count: correct },
                    { key: 'seen', count: seen },
                    { key: 'unknown', count: unknown },
                ].map(({ key, count }) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <div className={"w-3 h-3 rounded-full " + LEVEL_COLORS[key].bg} />
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
                            {LEVEL_COLORS[key].label} {count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MasteryBar;
