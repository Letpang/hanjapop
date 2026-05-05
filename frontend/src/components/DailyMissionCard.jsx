import React from 'react';
import { useLang } from '../LangContext.jsx';

const DailyMissionCard = ({ missions, streak, allDone, doneCount, onNavigate }) => {
    const { t } = useLang();

    return (
        <div 
            onClick={() => onNavigate && onNavigate('attendance')}
            className="w-full clay-panel p-4 md:p-6 bg-white/60 dark:bg-slate-900/40 border-2 border-white/50 backdrop-blur-md shadow-lg relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform"
        >
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm md:text-xl flex items-center gap-2">
                    📅 {t('dailyQuest') || '오늘의 미션'}
                    {streak?.count > 0 && (
                        <span className="ml-2 text-[10px] md:text-xs text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                            🔥 {streak.count}일 연속
                        </span>
                    )}
                </h3>
                <div className="text-[10px] md:text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    GET BONUS XP! ⚡
                </div>
            </div>
            <div className="flex gap-2 md:gap-4">
                {missions.map(quest => {
                    const pct = Math.min(100, (quest.progress / quest.target) * 100);

                    return (
                        <div key={quest.id} className="flex-1 flex flex-col gap-1.5">
                            <div className="h-1.5 md:h-2.5 w-full bg-slate-200/50 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className={`h-full transition-all duration-700 ${quest.done ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]'}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className="text-[7px] md:text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center uppercase tracking-tighter leading-tight break-keep">
                                {quest.label}<br/>
                                <span className="text-indigo-500 dark:text-indigo-300">({quest.progress}/{quest.target})</span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DailyMissionCard;
