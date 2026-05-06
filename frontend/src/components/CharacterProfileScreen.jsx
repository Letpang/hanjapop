import React, { useMemo, useState } from 'react';
import { getRankDetails, getLeaderboardPosition } from '../utils/rankUtils.js';

// LV.10 시스템 임계값
const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 1800, 2800, 4000, 5500, 7500, 10000];
const getNextXp = (level) => level >= 10 ? null : LEVEL_THRESHOLDS[level];

// 6개 카테고리 뱃지 정의
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

const getCurrentStage = (count, thresholds) => {
    let stage = 0;
    for (let i = 0; i < thresholds.length; i++) {
        if (count >= thresholds[i]) stage = i + 1;
    }
    return stage;
};

const getBadgeImage = (cat, stage) => {
    if (stage === 0) {
        if (cat.imageNames) return `${cat.imageBase}${cat.imageNames[0]}.webp`;
        return `${cat.imageBase}1.webp`;
    }
    if (cat.imageNames) return `${cat.imageBase}${cat.imageNames[stage - 1]}.webp`;
    return `${cat.imageBase}${stage}.webp`;
};

const STAGE_LABELS = ['', '입문', '탐험가', '고수', '사범', '전설'];

// 단계별 색상
const STAGE_COLORS = [
    null,
    { bg: 'linear-gradient(135deg,#fef9c3,#fef08a)', border: '#fde047', text: '#92400e' },   // 1 크림
    { bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', border: '#6ee7b7', text: '#065f46' },   // 2 민트
    { bg: 'linear-gradient(135deg,#e0e7ff,#c7d2fe)', border: '#818cf8', text: '#3730a3' },   // 3 인디고
    { bg: 'linear-gradient(135deg,#f3e8ff,#e9d5ff)', border: '#c084fc', text: '#6b21a8' },   // 4 퍼플
    { bg: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '#f59e0b', text: '#78350f' },   // 5 골드
];

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

    // 뱃지 팡 애니메이션 상태
    const [popBadge, setPopBadge] = useState(null);

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
                <div className="clay-panel rounded-[2.5rem] p-6 bg-white dark:bg-slate-800 border-4 border-white shadow-xl flex flex-col items-center gap-3"
                    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
                    <div className="relative">
                        <img
                            src={rank.avatar}
                            alt={rank.name}
                            className="w-36 h-36 md:w-48 md:h-48 object-contain filter drop-shadow-2xl animate-float"
                        />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-white font-black text-sm px-5 py-1.5 rounded-full border-2 border-white shadow-lg whitespace-nowrap"
                            style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', boxShadow: '0 3px 0 #b45309' }}>
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

                    {/* XP 바 — 두께 2배 + 클레이 질감 */}
                    <div className="w-full max-w-xs">
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                            <span>XP {myXp}</span>
                            <span>{rank.level < 10 ? `다음 레벨까지 ${nextXp - myXp} XP` : 'MAX'}</span>
                        </div>
                        <div className="w-full rounded-full overflow-hidden relative"
                            style={{
                                height: '18px',
                                background: '#e2e8f0',
                                boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.12)',
                            }}>
                            <div
                                className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
                                style={{
                                    width: progress + '%',
                                    background: 'linear-gradient(90deg,#FFB7B2,#FF9B9B,#ff6b6b)',
                                    boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.5), 0 2px 6px rgba(255,107,107,0.4)',
                                    minWidth: progress > 0 ? '1rem' : '0',
                                }}
                            >
                                {/* 반짝임 하이라이트 */}
                                <div className="absolute top-0 left-0 right-0 h-1/2 rounded-full"
                                    style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0.5),transparent)' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 뱃지 컬렉션 */}
                <div className="clay-panel rounded-[2rem] p-5 bg-white dark:bg-slate-800 border-4 border-white shadow-md"
                    style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
                    <div className="font-black text-slate-600 dark:text-slate-300 text-sm mb-4">🏅 뱃지 컬렉션</div>
                    <div className="grid grid-cols-3 gap-3">
                        {badgeStates.map((b) => {
                            const unlocked = b.stage > 0;
                            const colors = unlocked ? STAGE_COLORS[b.stage] : null;
                            const isPopping = popBadge === b.id;
                            return (
                                <div
                                    key={b.id}
                                    onClick={() => unlocked && setPopBadge(isPopping ? null : b.id)}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all cursor-pointer active:scale-95 ${unlocked ? '' : ''}`}
                                    style={unlocked ? {
                                        background: colors.bg,
                                        border: `2px solid ${colors.border}`,
                                        boxShadow: `0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)`,
                                    } : {
                                        background: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)',
                                        border: '2px dashed #cbd5e1',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                                    }}
                                >
                                    <div className="relative">
                                        <img
                                            src={b.image}
                                            alt={b.label}
                                            className={`w-14 h-14 object-contain transition-all duration-300 ${
                                                unlocked
                                                    ? `drop-shadow-md ${isPopping ? 'scale-125' : 'hover:scale-110'}`
                                                    : 'grayscale opacity-25'
                                            }`}
                                            style={!unlocked ? { filter: 'grayscale(100%) brightness(0.7)' } : {}}
                                        />
                                        {unlocked && (
                                            <div className="absolute -bottom-1 -right-1 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white shadow-sm leading-none"
                                                style={{ background: colors.border }}>
                                                {b.stage}단계
                                            </div>
                                        )}
                                        {/* 잠금 아이콘 */}
                                        {!unlocked && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-2xl opacity-40">🔒</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[11px] font-black text-center leading-tight`}
                                        style={{ color: unlocked ? colors.text : '#94a3b8' }}>
                                        {b.label}
                                    </span>
                                    <span className={`text-[9px] text-center leading-tight font-bold`}
                                        style={{ color: unlocked ? colors.border : '#94a3b8' }}>
                                        {unlocked
                                            ? STAGE_LABELS[b.stage]
                                            : `${b.thresholds[0]}${b.unit}부터`}
                                    </span>
                                    {unlocked && b.nextThreshold && (
                                        <span className="text-[8px] text-center leading-tight font-bold"
                                            style={{ color: '#94a3b8' }}>
                                            다음: {b.nextThreshold}{b.unit}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 나의 학습 캘린더 바로가기 */}
                <button
                    onClick={() => onNavigate('review')}
                    className="w-full clay-panel rounded-[2rem] p-5 bg-white dark:bg-slate-800 border-4 border-white shadow-md flex items-center gap-4 active:scale-[0.98] transition-all group"
                    style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)' }}
                >
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform"
                        style={{
                            background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)',
                            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.08)',
                        }}>
                        📅
                    </div>
                    <div className="flex flex-col items-start gap-1.5">
                        <span className="font-black text-slate-700 dark:text-white text-lg">나의 학습 캘린더</span>
                        <div className="flex items-center gap-2">
                            <span
                                className="text-xs font-black px-2.5 py-0.5 rounded-full border-2"
                                style={{
                                    background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)',
                                    borderColor: '#6ee7b7',
                                    color: '#065f46',
                                    boxShadow: '0 2px 4px rgba(52,211,153,0.2)',
                                }}
                            >
                                🏆 {masteredCount}자 숙달
                            </span>
                            <span
                                className="text-xs font-black px-2.5 py-0.5 rounded-full border-2"
                                style={{
                                    background: 'linear-gradient(135deg,#e0e7ff,#c7d2fe)',
                                    borderColor: '#818cf8',
                                    color: '#3730a3',
                                    boxShadow: '0 2px 4px rgba(99,102,241,0.2)',
                                }}
                            >
                                🔥 {streak?.count || 0}일 연속
                            </span>
                        </div>
                    </div>
                    <span className="ml-auto text-slate-300 text-2xl">›</span>
                </button>

            </div>
        </div>
    );
};

export default CharacterProfileScreen;
