import React, { useMemo } from 'react';
import { getRankDetails, getLeaderboardPosition } from '../utils/rankUtils.js';

const XP_THRESHOLDS = [500, 1500, 3000, 6000];
const getNextXp = (level) => XP_THRESHOLDS[level - 1] ?? 1000;

const BADGES = (ts, masteredCount, streak) => [
    { emoji: '🔥', label: '연속출석', count: streak?.count || 0, unit: '일' },
    { emoji: '📅', label: '출석왕', count: ts.totalDays || 0, unit: '일' },
    { emoji: '🏆', label: '한자 마스터', count: masteredCount, unit: '개' },
    { emoji: '📖', label: '단어 마스터', count: ts.wordCorrect || 0, unit: '개' },
    { emoji: '👾', label: '몬스터버스터즈', count: ts.shootGame || 0, unit: '회' },
    { emoji: '🧩', label: '암기 천재', count: ts.matchGame || 0, unit: '회' },
    { emoji: '✍️', label: '획순 마스터', count: ts.writing || 0, unit: '개' },
    { emoji: '🎯', label: '단어퀴즈', count: ts.wordQuiz || 0, unit: '회' },
    { emoji: '📝', label: '문장퀴즈', count: ts.sentenceQuiz || 0, unit: '회' },
];

const CharacterProfileScreen = ({ onBack, onNavigate, userXp, selectedCharacter, userNickname, mastery, totalStats, streak }) => {
    const myXp = userXp || 0;
    const position = useMemo(() => getLeaderboardPosition(myXp), [myXp]);
    const rank = useMemo(() => getRankDetails(myXp, selectedCharacter, position), [myXp, selectedCharacter, position]);
    const nextXp = getNextXp(rank.level);
    const progress = rank.level >= 5 ? 100 : Math.min(100, (myXp / nextXp) * 100);

    const masteredCount = useMemo(
        () => Object.values(mastery || {}).filter(m => m.level >= 2).length,
        [mastery]
    );
    const ts = totalStats || {};
    const badges = BADGES(ts, masteredCount, streak);

    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden">
            {/* 헤더 */}
            <div className="w-full px-4 shrink-0 safe-top">
                <div className="w-full flex justify-between items-center clay-panel p-4 px-6 rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-slate-700">
                    <button
                        onClick={onBack}
                        className="text-slate-600 dark:text-slate-200 font-black bg-white/60 dark:bg-slate-800/60 px-5 py-2.5 rounded-2xl border-2 border-white/50 shadow-md active:scale-95 transition-all"
                    >
                        <span className="text-xl">←</span>
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-700 dark:text-white tracking-tight premium-text-shadow text-center flex-1 px-4">
                        내 프로필
                    </h1>
                    <div className="w-[60px]" />
                </div>
            </div>

            {/* 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto px-4 pb-10 pt-4 flex flex-col gap-5">

                {/* 캐릭터 카드 */}
                <div className="clay-panel rounded-[2.5rem] p-6 bg-white dark:bg-slate-800 border-4 border-white shadow-xl flex flex-col items-center gap-3">
                    <div className="relative">
                        <img
                            src={rank.avatar}
                            alt={rank.name}
                            className="w-36 h-36 md:w-48 md:h-48 object-contain filter drop-shadow-2xl animate-float"
                        />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-400 text-white font-black text-sm px-5 py-1.5 rounded-full border-2 border-white shadow-lg whitespace-nowrap">
                            LV.{rank.level}
                        </div>
                    </div>
                    {userNickname ? (
                        <div className="flex flex-col items-center gap-1 mt-3">
                            <span className="font-black text-slate-700 dark:text-white text-2xl md:text-3xl">{userNickname}</span>
                            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">{rank.name}</span>
                        </div>
                    ) : (
                        <span className="font-black text-slate-700 dark:text-white text-2xl md:text-3xl mt-3">{rank.name}</span>
                    )}
                    <div className="w-full max-w-xs">
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                            <span>XP {myXp}</span>
                            <span>{rank.level < 5 ? `다음 레벨까지 ${nextXp - myXp} XP` : 'MAX'}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner">
                            <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{ width: progress + '%', background: 'linear-gradient(90deg,#FFB7B2,#FF9B9B)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* 뱃지 획득 카드 */}
                <div className="clay-panel rounded-[2rem] p-5 bg-white dark:bg-slate-800 border-4 border-white shadow-md">
                    <div className="font-black text-slate-600 dark:text-slate-300 text-sm mb-4">🏅 뱃지 획득 카드</div>
                    <div className="grid grid-cols-3 gap-3">
                        {badges.map((b) => {
                            const hasAny = b.count > 0;
                            return (
                                <div key={b.label} className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${hasAny ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-slate-50 dark:bg-slate-700/30'}`}>
                                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex flex-col items-center justify-center ${
                                        hasAny
                                            ? 'bg-white dark:bg-slate-800 shadow-md border-2 border-white'
                                            : 'border-2 border-dashed border-slate-200 dark:border-slate-600'
                                    }`}>
                                        {hasAny ? (
                                            <>
                                                <span className="text-xl leading-none">{b.emoji}</span>
                                                <span className="text-[10px] font-black text-indigo-500 leading-none">{b.count}{b.unit}</span>
                                            </>
                                        ) : (
                                            <span className="text-slate-300 dark:text-slate-600 text-lg">○</span>
                                        )}
                                    </div>
                                    <span className={`text-[10px] md:text-[11px] font-bold text-center leading-tight ${hasAny ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'}`}>
                                        {b.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 학습 다이어리 바로가기 */}
                <button
                    onClick={() => onNavigate('review')}
                    className="w-full clay-panel rounded-[2rem] p-5 bg-white dark:bg-slate-800 border-4 border-white shadow-md flex items-center gap-4 active:scale-[0.98] transition-all group"
                >
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-900/40 dark:to-teal-800/40 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform shrink-0">
                        📖
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="font-black text-slate-700 dark:text-white text-lg">학습 다이어리</span>
                        <span className="text-slate-400 text-sm">달력 · 진행도 · 오답노트</span>
                    </div>
                    <span className="ml-auto text-slate-300 text-2xl">›</span>
                </button>

            </div>
        </div>
    );
};

export default CharacterProfileScreen;
