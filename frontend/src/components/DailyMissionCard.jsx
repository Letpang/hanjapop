import React, { useState } from 'react';
import { useLang } from '../LangContext.jsx';

const DailyMissionCard = ({ missions, streak, allDone, doneCount, onNavigate }) => {
    const { t } = useLang();
    const [showModal, setShowModal] = useState(false);

    const NAVIGATE_MAP = {
        sentenceQuiz: 'combinedQuiz',
        wordQuiz: 'combinedQuiz',
        flashcard: 'flashcard',
        writing: 'writing',
        matchGame: 'matchGame',
    };

    return (
        <>
            {/* Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="w-full max-w-lg clay-panel rounded-t-[3rem] p-6 pb-10 bg-white dark:bg-slate-800 border-t-4 border-white shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-black text-slate-700 dark:text-white text-xl flex items-center gap-2">
                                📅 오늘의 미션
                                {streak?.count > 0 && (
                                    <span className="text-xs text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                                        🔥 {streak.count}일 연속
                                    </span>
                                )}
                            </h3>
                            <span className="text-sm font-bold text-indigo-500">{doneCount}/{missions.length} 완료</span>
                        </div>

                        <div className="flex flex-col gap-3">
                            {missions.map(quest => {
                                const pct = Math.min(100, (quest.progress / quest.target) * 100);
                                const targetScreen = NAVIGATE_MAP[quest.type];
                                return (
                                    <button
                                        key={quest.id}
                                        onClick={() => {
                                            if (!quest.done && targetScreen && onNavigate) {
                                                setShowModal(false);
                                                onNavigate(targetScreen);
                                            }
                                        }}
                                        className={`w-full flex flex-col gap-1.5 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                                            quest.done
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                                : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 hover:border-indigo-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                                {quest.done ? '✅' : '⬜'} {quest.label}
                                            </span>
                                            <span className="text-xs font-black text-indigo-500">+{quest.xp} XP</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-600 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${quest.done ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-indigo-400'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-slate-400 font-bold">
                                            {quest.progress} / {quest.target}
                                            {!quest.done && targetScreen && <span className="text-indigo-400 ml-2">→ 바로 가기</span>}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {allDone && (
                            <div className="mt-4 text-center py-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border-2 border-amber-200 dark:border-amber-700">
                                <span className="font-black text-amber-600 dark:text-amber-400">🎉 오늘 미션 완료! 보너스 XP 획득!</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Card */}
            <div
                onClick={() => setShowModal(true)}
                className="w-full clay-panel p-4 md:p-6 bg-white/60 dark:bg-slate-900/40 border-2 border-white/50 backdrop-blur-md shadow-lg relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
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
                    <div className="text-[10px] md:text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-700">
                        {allDone ? '🎉 완료!' : `GET BONUS XP! ⚡`}
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
                                    {quest.label}<br />
                                    <span className="text-indigo-500 dark:text-indigo-300">({quest.progress}/{quest.target})</span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default DailyMissionCard;
