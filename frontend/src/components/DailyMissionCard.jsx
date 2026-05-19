import React, { useState } from 'react';
import { useLang } from '../LangContext.jsx';

const NAVIGATE_MAP = {
    sentenceQuiz: 'combinedQuiz',
    wordQuiz: 'combinedQuiz',
    flashcard: 'flashcard',
    writing: 'writing',
    matchGame: 'matchGame',
};

// 미션 타입별 글래스 하이브리드 아이콘
const MISSION_ICON = {
    sentenceQuiz: '/assets/images/icons/icon_mission_quiz_glossy.webp',
    wordQuiz: '/assets/images/icons/icon_mission_word_glossy.webp',
    flashcard: '/assets/images/icons/icon_mission_flashcard_glossy.webp',
    writing: '/assets/images/icons/icon_mission_review_glossy.webp',
    matchGame: '/assets/images/icons/icon_mission_review_glossy.webp',
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
                            <h3 className="font-extrabold text-slate-700 dark:text-white text-xl flex items-center gap-2">
                                🎯 오늘의 미션
                                {streak?.count > 0 && (
                                    <span className="text-xs text-[#FFB433] bg-[#FFB433]/15 dark:bg-orange-900/30 px-2 py-0.5 rounded-full border border-[#FFB433]/25 dark:border-orange-800">
                                        🔥 {streak.count}일 연속
                                    </span>
                                )}
                            </h3>
                            <span className="text-sm font-bold text-[#7C83FF]">{doneCount}/{missions.length} 완료</span>
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
                                                ? 'bg-[#FF9B73]/10 dark:bg-[#FF9B73]/20/20 border-[#FF9B73]/30 dark:border-[#FF9B73]/30'
                                                : 'bg-white dark:bg-slate-700 border-[#E9EDF2] dark:border-slate-600 hover:border-[#C3C6FF]'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                                {quest.done
                                        ? <span className="text-base">✅</span>
                                        : <img src={icon} alt="" className="w-5 h-5 object-contain shrink-0 inline-block" />
                                    } {quest.label}
                                            </span>
                                            <span className="text-xs font-extrabold text-[#7C83FF]">+{quest.xp} XP</span>
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
                                                        : 'linear-gradient(90deg, #818cf8, #7C83FF)',
                                                    boxShadow: quest.done
                                                        ? 'inset 0 1px 2px rgba(255,255,255,0.6), 0 2px 4px rgba(52,211,153,0.3)'
                                                        : 'inset 0 1px 2px rgba(255,255,255,0.4), 0 2px 4px rgba(124,131,255,0.3)',
                                                    minWidth: pct > 0 ? '1rem' : '0',
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs text-[#AEB7C5] font-bold">
                                            {quest.progress} / {quest.target}
                                            {!quest.done && targetScreen && <span className="text-[#7C83FF] ml-2">→ 바로 가기</span>}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {allDone && (
                            <div className="mt-4 text-center py-3 bg-[#FFB433]/10 dark:bg-[#FFB433]/20 rounded-2xl border-2 border-[#FFB433]/25 dark:border-[#FFB433]">
                                <span className="font-extrabold text-[#FFB433] dark:text-[#FFB433]">🎉 오늘 미션 완료! 보너스 XP 획득!</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── 홈 카드 (요약형) ── */}
            <div
                onClick={() => setShowModal(true)}
                className="w-full clay-panel p-4 md:p-5 bg-white/70 dark:bg-slate-900/50 border-[3px] border-white/80 backdrop-blur-md shadow-lg relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform rounded-[2rem]"
            >
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-extrabold text-slate-700 dark:text-slate-200 text-sm md:text-base flex items-center gap-2">
                        🎯 오늘의 미션
                        {streak?.count > 0 && (
                            <span className="text-xs text-[#FFB433] bg-[#FFB433]/15 dark:bg-orange-900/30 px-2 py-0.5 rounded-full border border-[#FFB433]/25 dark:border-orange-800">
                                🔥 {streak.count}일 연속
                            </span>
                        )}
                    </h3>
                    <div className="flex items-center gap-2">
                        {/* 미션마스터 뱃지 아이콘 */}
                        <img
                            src="/assets/images/badges/기억의지배자_1레벨.webp"
                            alt="미션마스터"
                            className={`w-7 h-7 object-contain transition-all ${allDone ? 'drop-shadow-[0_0_6px_rgba(245,158,11,0.8)] scale-110' : 'opacity-40 grayscale'}`}
                        />
                        <div className={`text-xs md:text-xs font-extrabold px-3 py-1 rounded-full border ${
                            allDone
                                ? 'text-[#FFB433] bg-[#FFB433]/10 dark:bg-[#FFB433]/30 border-[#FFB433]/25 dark:border-[#FFB433]'
                                : 'text-[#7C83FF] bg-[#7C83FF]/10 dark:bg-[#4A51D4]/30 border-[#C3C6FF] dark:border-[#4A51D4]'
                        }`}>
                            {allDone ? '🎉 완료!' : `${doneCount}/${missions.length} 달성`}
                        </div>
                    </div>
                </div>

                {/* 미션 요약 바 (압축형) */}
                <div className="flex items-center gap-2.5">
                    {/* 요약 바 */}
                    <div className="flex-1 h-4 md:h-5 rounded-full overflow-hidden"
                        style={{
                            background: '#e2e8f0',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)',
                        }}>
                        <div
                            className="h-full rounded-full transition-all duration-700 relative"
                            style={{
                                width: `${Math.min(100, (doneCount / missions.length) * 100)}%`,
                                background: allDone
                                    ? 'linear-gradient(90deg, #6ee7b7, #34d399)'
                                    : 'linear-gradient(90deg, #818cf8, #7C83FF)',
                                boxShadow: allDone
                                    ? 'inset 0 1px 2px rgba(255,255,255,0.6), 0 2px 6px rgba(52,211,153,0.3)'
                                    : 'inset 0 1px 2px rgba(255,255,255,0.4), 0 2px 6px rgba(124,131,255,0.3)',
                            }}
                        />
                    </div>
                    {/* 수치 */}
                    <span className="text-xs md:text-sm font-extrabold text-[#5B677A] dark:text-[#AEB7C5] shrink-0 w-12 text-right">
                        {doneCount}/{missions.length}
                    </span>
                </div>
            </div>
        </>
    );
};

export default DailyMissionCard;
