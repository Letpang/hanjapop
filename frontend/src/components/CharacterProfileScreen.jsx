import React, { useMemo } from 'react';
import { getRankDetails, getLeaderboardPosition } from '../utils/rankUtils.js';

// LV.10 시스템 임계값
const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 1800, 2800, 4000, 5500, 7500, 10000];
const getNextXp = (level) => level >= 10 ? null : LEVEL_THRESHOLDS[level];

// 6개 카테고리 뱃지 정의
// 각 카테고리별 5단계 달성 기준
const BADGE_CATEGORIES = [
    {
        id: 'attendance',
        label: '개근상',
        imageBase: '/assets/images/badges/attendance_',
        getCount: (ts, masteredCount, streak) => streak?.count || 0,
        unit: '일',
        thresholds: [3, 7, 30, 60, 100],
    },
    {
        id: 'hanja',
        label: '한자박사',
        imageBase: '/assets/images/badges/hanja_',
        getCount: (ts, masteredCount) => masteredCount,
        unit: '개',
        thresholds: [10, 50, 150, 250, 376],
    },
    {
        id: 'brush',
        label: '서예가',
        imageBase: '/assets/images/badges/brush_',
        imageNames: ['1_beginner', '2_explorer', '3_master', '4_teacher', '5_legend'],
        getCount: (ts) => ts.writing || 0,
        unit: '개',
        thresholds: [10, 50, 150, 250, 376],
    },
    {
        id: 'game',
        label: '게임왕',
        imageBase: '/assets/images/badges/game_',
        getCount: (ts) => (ts.shootGame || 0) + (ts.matchGame || 0),
        unit: '판',
        thresholds: [20, 100, 300, 500, 600],
    },
    {
        id: 'quiz',
        label: '퀴즈왕',
        imageBase: '/assets/images/badges/quiz_',
        getCount: (ts) => (ts.wordQuiz || 0) + (ts.sentenceQuiz || 0),
        unit: '문제',
        thresholds: [20, 100, 300, 700, 1000],
    },
    {
        id: 'mission',
        label: '미션마스터',
        imageBase: '/assets/images/badges/mission_',
        getCount: (ts) => ts.missionComplete || 0,
        unit: '회',
        thresholds: [3, 10, 30, 60, 100],
    },
];

// 현재 단계 계산 (0 = 미획득, 1~5 = 단계)
const getCurrentStage = (count, thresholds) => {
    let stage = 0;
    for (let i = 0; i < thresholds.length; i++) {
        if (count >= thresholds[i]) stage = i + 1;
    }
    return stage;
};

// 이미지 경로 반환
const getBadgeImage = (cat, stage) => {
    if (stage === 0) {
        // 미획득: 1단계 이미지를 흑백으로 표시
        if (cat.imageNames) return `${cat.imageBase}${cat.imageNames[0]}.webp`;
        return `${cat.imageBase}1.webp`;
    }
    if (cat.imageNames) return `${cat.imageBase}${cat.imageNames[stage - 1]}.webp`;
    return `${cat.imageBase}${stage}.webp`;
};

const STAGE_LABELS = ['', '입문', '탐험가', '고수', '사범', '전설'];

const CharacterProfileScreen = ({ onBack, onNavigate, userXp, selectedCharacter, userNickname, mastery, totalStats, streak }) => {
    const myXp = userXp || 0;
    const position = useMemo(() => getLeaderboardPosition(myXp), [myXp]);
    const rank = useMemo(() => getRankDetails(myXp, selectedCharacter, position), [myXp, selectedCharacter, position]);
    const nextXp = getNextXp(rank.level);
    const progress = rank.level >= 10 ? 100 : rank.progress ?? Math.min(100, (myXp / (nextXp || 10000)) * 100);

    const masteredCount = useMemo(
        () => Object.values(mastery || {}).filter(m => m.level >= 2).length,
        [mastery]
    );
    const ts = totalStats || {};

    // 6개 카테고리 뱃지 상태 계산
    const badgeStates = useMemo(() => BADGE_CATEGORIES.map(cat => {
        const count = cat.getCount(ts, masteredCount, streak);
        const stage = getCurrentStage(count, cat.thresholds);
        const nextThreshold = stage < 5 ? cat.thresholds[stage] : null;
        return {
            ...cat,
            count,
            stage,
            nextThreshold,
            image: getBadgeImage(cat, stage),
        };
    }), [ts, masteredCount, streak]);

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
                            <span>{rank.level < 10 ? `다음 레벨까지 ${nextXp - myXp} XP` : 'MAX'}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner">
                            <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{ width: progress + '%', background: 'linear-gradient(90deg,#FFB7B2,#FF9B9B)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* 뱃지 컬렉션 */}
                <div className="clay-panel rounded-[2rem] p-5 bg-white dark:bg-slate-800 border-4 border-white shadow-md">
                    <div className="font-black text-slate-600 dark:text-slate-300 text-sm mb-4">🏅 뱃지 컬렉션</div>
                    <div className="grid grid-cols-3 gap-3">
                        {badgeStates.map((b) => {
                            const unlocked = b.stage > 0;
                            return (
                                <div
                                    key={b.id}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${
                                        unlocked
                                            ? 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700'
                                            : 'bg-slate-50 dark:bg-slate-700/30 border-2 border-dashed border-slate-200 dark:border-slate-600'
                                    }`}
                                >
                                    <div className="relative">
                                        <img
                                            src={b.image}
                                            alt={b.label}
                                            className={`w-14 h-14 object-contain transition-all ${
                                                unlocked ? 'drop-shadow-md' : 'grayscale opacity-30'
                                            }`}
                                        />
                                        {unlocked && (
                                            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white shadow-sm leading-none">
                                                {b.stage}단계
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[11px] font-black text-center leading-tight ${
                                        unlocked ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'
                                    }`}>
                                        {b.label}
                                    </span>
                                    <span className={`text-[9px] text-center leading-tight ${
                                        unlocked ? 'text-amber-500 font-bold' : 'text-slate-300 dark:text-slate-600'
                                    }`}>
                                        {unlocked
                                            ? STAGE_LABELS[b.stage]
                                            : `${b.thresholds[0]}${b.unit}부터`}
                                    </span>
                                    {unlocked && b.nextThreshold && (
                                        <span className="text-[8px] text-slate-400 text-center leading-tight">
                                            다음: {b.nextThreshold}{b.unit}
                                        </span>
                                    )}
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
