import React, { useState } from 'react';
import { useLang } from '../LangContext.jsx';

const NAVIGATE_MAP = {
    sentenceQuiz: 'combinedQuiz',
    wordQuiz: 'combinedQuiz',
    flashcard: 'flashcard',
    writing: 'writing',
    matchGame: 'matchGame',
};

// 미션 타입별 이모지
const MISSION_ICON = {
    sentenceQuiz: '💬',
    wordQuiz: '📝',
    flashcard: '📚',
    writing: '✍️',
    matchGame: '🧩',
};

const DailyMissionCard = ({ missions, streak, allDone, doneCount, onNavigate }) => {
    const { t } = useLang();
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            {/* ── 상세 모달 ── */}
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
                                🎯 오늘의 미션
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
                                const icon = MISSION_ICON[quest.type] || '⭐';
                                return (
                                    <button
                                        key={quest.id}
                                        onClick={() => {
                                            if (!quest.done && targetScreen && onNavigate) {
                                                setShowModal(false);
                                                onNavigate(targetScreen);
                                            }
                                        }}
                                        className={`w-full flex flex-col gap-2 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                                            quest.done
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                                : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 hover:border-indigo-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                                {quest.done ? '✅' : icon} {quest.label}
                                            </span>
                                            <span className="text-xs font-black text-indigo-500">+{quest.xp} XP</span>
                                        </div>
                                        {/* 3D 클레이 바 */}
                                        <div className="w-full h-4 rounded-full overflow-hidden"
                                            style={{
                                                background: '#e2e8f0',
                                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                                            }}>
                                            <div
                                                className="h-full rounded-full transition-all duration-700 relative"
                                                style={{
                                                    width: `${pct}%`,
                                                    background: quest.done
                                                        ? 'linear-gradient(90deg, #6ee7b7, #34d399)'
                                                        : 'linear-gradient(90deg, #818cf8, #6366f1)',
                                                    boxShadow: quest.done
                                                        ? 'inset 0 1px 2px rgba(255,255,255,0.6), 0 2px 4px rgba(52,211,153,0.3)'
                                                        : 'inset 0 1px 2px rgba(255,255,255,0.4), 0 2px 4px rgba(99,102,241,0.3)',
                                                    minWidth: pct > 0 ? '1rem' : '0',
                                                }}
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

            {/* ── 홈 카드 ── */}
            <div
                onClick={() => setShowModal(true)}
                className="w-full clay-panel p-4 md:p-5 bg-white/70 dark:bg-slate-900/50 border-[3px] border-white/80 backdrop-blur-md shadow-lg relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform rounded-[2rem]"
            >
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-black text-slate-700 dark:text-slate-200 text-sm md:text-base flex items-center gap-2">
                        🎯 오늘의 미션
                        {streak?.count > 0 && (
                            <span className="text-[10px] text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                                🔥 {streak.count}일 연속
                            </span>
                        )}
                    </h3>
                    <div className="flex items-center gap-2">
                        {/* 미션마스터 뱃지 아이콘 */}
                        <img
                            src="/assets/images/badges/mission_1.webp"
                            alt="미션마스터"
                            className={`w-7 h-7 object-contain transition-all ${allDone ? 'drop-shadow-[0_0_6px_rgba(245,158,11,0.8)] scale-110' : 'opacity-40 grayscale'}`}
                        />
                        <div className={`text-[10px] md:text-xs font-black px-3 py-1 rounded-full border ${
                            allDone
                                ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700'
                                : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-700'
                        }`}>
                            {allDone ? '🎉 완료!' : `${doneCount}/${missions.length} 달성`}
                        </div>
                    </div>
                </div>

                {/* 3D 클레이 바 게이지 목록 */}
                <div className="flex flex-col gap-2.5">
                    {missions.map(quest => {
                        const pct = Math.min(100, (quest.progress / quest.target) * 100);
                        const icon = MISSION_ICON[quest.type] || '⭐';
                        return (
                            <div key={quest.id} className="flex items-center gap-2.5">
                                {/* 아이콘 */}
                                <span className="text-base shrink-0 w-5 text-center">{quest.done ? '✅' : icon}</span>
                                {/* 바 */}
                                <div className="flex-1 flex flex-col gap-0.5">
                                    <div className="w-full h-3.5 md:h-4 rounded-full overflow-hidden"
                                        style={{
                                            background: '#e2e8f0',
                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)',
                                        }}>
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${pct}%`,
                                                background: quest.done
                                                    ? 'linear-gradient(90deg, #6ee7b7, #34d399)'
                                                    : 'linear-gradient(90deg, #818cf8, #6366f1)',
                                                boxShadow: quest.done
                                                    ? 'inset 0 1px 2px rgba(255,255,255,0.6)'
                                                    : 'inset 0 1px 2px rgba(255,255,255,0.4)',
                                                minWidth: pct > 0 ? '0.75rem' : '0',
                                            }}
                                        />
                                    </div>
                                </div>
                                {/* 수치 */}
                                <span className="text-[9px] md:text-[10px] font-black text-slate-400 shrink-0 w-10 text-right">
                                    {quest.progress}/{quest.target}
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
