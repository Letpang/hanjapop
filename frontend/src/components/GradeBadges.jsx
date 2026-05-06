/**
 * GradeBadges.jsx
 * 살아있는 뱃지 시스템 (Glass-Glossy + 액체 차오름 + 크리스탈 변신)
 *
 * 뱃지 상태:
 *   0%~79%  : 반투명 유리 실루엣 (badge-locked)
 *   80%~99% : 빛나기 시작 (badge-glowing)
 *   100%    : 크리스탈 3D 변신 (badge-crystal)
 *
 * 진행 중에는 내부에 색깔 있는 액체가 차오르는 애니메이션 표시
 */

import React, { useState, useEffect, useRef } from 'react';

const GRADE_BADGES = [
    {
        id: 'beginner',
        label: '한자 입문',
        subLabel: '첫 발걸음',
        emoji: '🌱',
        requiredXp: 0,
        liquidColor: 'linear-gradient(180deg, rgba(134,239,172,0.8) 0%, rgba(74,222,128,0.9) 100%)',
        crystalColor: 'from-emerald-300 via-green-200 to-emerald-400',
        glowColor: 'rgba(74, 222, 128, 0.6)',
    },
    {
        id: 'grade8',
        label: '8급 준비완료',
        subLabel: 'Lv.2 달성',
        emoji: '🥉',
        requiredXp: 100,
        liquidColor: 'linear-gradient(180deg, rgba(253,186,116,0.8) 0%, rgba(249,115,22,0.9) 100%)',
        crystalColor: 'from-amber-300 via-orange-200 to-amber-400',
        glowColor: 'rgba(249, 115, 22, 0.6)',
    },
    {
        id: 'grade7',
        label: '7급 준비완료',
        subLabel: 'Lv.3 달성',
        emoji: '🥈',
        requiredXp: 300,
        liquidColor: 'linear-gradient(180deg, rgba(186,230,253,0.8) 0%, rgba(56,189,248,0.9) 100%)',
        crystalColor: 'from-sky-300 via-blue-200 to-sky-400',
        glowColor: 'rgba(56, 189, 248, 0.6)',
    },
    {
        id: 'grade6',
        label: '6급 준비완료',
        subLabel: 'Lv.4 달성',
        emoji: '🥇',
        requiredXp: 600,
        liquidColor: 'linear-gradient(180deg, rgba(253,224,71,0.8) 0%, rgba(234,179,8,0.9) 100%)',
        crystalColor: 'from-yellow-300 via-amber-200 to-yellow-400',
        glowColor: 'rgba(234, 179, 8, 0.6)',
    },
    {
        id: 'grade5',
        label: '5급 도전 가능',
        subLabel: 'Lv.5 달성',
        emoji: '👑',
        requiredXp: 1000,
        liquidColor: 'linear-gradient(180deg, rgba(196,181,253,0.8) 0%, rgba(139,92,246,0.9) 100%)',
        crystalColor: 'from-violet-400 via-purple-200 to-violet-500',
        glowColor: 'rgba(139, 92, 246, 0.7)',
    },
];

// 뱃지 상태 계산
const getBadgeState = (xp, requiredXp, prevRequiredXp = 0) => {
    if (xp >= requiredXp) return { state: 'crystal', pct: 100 };
    const range = requiredXp - prevRequiredXp;
    const progress = Math.max(0, xp - prevRequiredXp);
    const pct = Math.min(99, (progress / range) * 100);
    if (pct >= 80) return { state: 'glowing', pct };
    if (pct > 0) return { state: 'filling', pct };
    return { state: 'locked', pct: 0 };
};

// 스파클 파티클 컴포넌트
const Sparkles = ({ count = 6, color }) => {
    const sparkles = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
        size: 4 + Math.random() * 6,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[1.5rem]">
            {sparkles.map(s => (
                <div
                    key={s.id}
                    className="absolute rounded-full"
                    style={{
                        left: s.x + '%',
                        top: s.y + '%',
                        width: s.size + 'px',
                        height: s.size + 'px',
                        background: color,
                        animation: `sparkle 1.5s ease-in-out ${s.delay}s infinite`,
                        boxShadow: `0 0 ${s.size}px ${color}`,
                    }}
                />
            ))}
        </div>
    );
};

// 액체 차오름 컴포넌트
const LiquidFill = ({ pct, liquidColor, isGlowing }) => {
    const [displayPct, setDisplayPct] = useState(0);

    useEffect(() => {
        // 마운트 시 애니메이션으로 차오름
        const timer = setTimeout(() => setDisplayPct(pct), 100);
        return () => clearTimeout(timer);
    }, [pct]);

    return (
        <div className="absolute inset-0 overflow-hidden rounded-[1.5rem]">
            {/* 액체 배경 */}
            <div
                className="absolute bottom-0 left-0 right-0 transition-all duration-1200 ease-out"
                style={{
                    height: displayPct + '%',
                    background: liquidColor,
                    transitionDuration: '1.2s',
                }}
            >
                {/* 물결 효과 */}
                <div
                    className="absolute top-0 left-0 right-0"
                    style={{
                        height: '12px',
                        background: 'rgba(255,255,255,0.3)',
                        animation: 'liquidWave 2s ease-in-out infinite',
                        marginTop: '-6px',
                    }}
                />
                {/* 내부 하이라이트 */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.2) 70%, transparent 100%)',
                    }}
                />
            </div>

            {/* 80% 이상: 빛나는 버블 */}
            {isGlowing && (
                <>
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full"
                            style={{
                                width: (6 + i * 3) + 'px',
                                height: (6 + i * 3) + 'px',
                                background: 'rgba(255,255,255,0.6)',
                                left: (15 + i * 20) + '%',
                                bottom: (10 + i * 15) + '%',
                                animation: `float ${1.5 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
                                boxShadow: '0 0 8px rgba(255,255,255,0.8)',
                            }}
                        />
                    ))}
                </>
            )}
        </div>
    );
};

// 크리스탈 뱃지 컴포넌트
const CrystalBadge = ({ badge }) => {
    return (
        <div
            className={`badge-crystal w-full h-full rounded-[1.5rem] flex items-center justify-center relative overflow-hidden`}
            style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,245,255,0.9) 50%, rgba(255,255,255,0.95) 100%)`,
            }}
        >
            {/* 크리스탈 내부 프리즘 효과 */}
            <div
                className="absolute inset-0 rounded-[1.5rem]"
                style={{
                    background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.5) 60deg, transparent 120deg, rgba(255,255,255,0.3) 180deg, transparent 240deg, rgba(255,255,255,0.4) 300deg, transparent 360deg)`,
                    animation: 'crystalSpin 4s linear infinite',
                }}
            />
            {/* 이모지 */}
            <span
                className="relative z-10 text-3xl md:text-4xl"
                style={{
                    filter: 'drop-shadow(0 2px 8px rgba(99,102,241,0.4)) drop-shadow(0 0 16px rgba(255,255,255,0.8))',
                    animation: 'float 3s ease-in-out infinite',
                }}
            >
                {badge.emoji}
            </span>
            {/* 스파클 */}
            <Sparkles count={5} color={badge.glowColor} />
        </div>
    );
};

// 개별 뱃지 아이템
const BadgeItem = ({ badge, xp, prevRequiredXp }) => {
    const { state, pct } = getBadgeState(xp, badge.requiredXp, prevRequiredXp);
    const isCrystal = state === 'crystal';
    const isGlowing = state === 'glowing';
    const isFilling = state === 'filling';
    const isLocked = state === 'locked';

    return (
        <div className="flex flex-col items-center gap-2">
            {/* 뱃지 컨테이너 */}
            <div
                className={`
                    relative w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem]
                    transition-all duration-500
                    ${isCrystal ? 'badge-crystal scale-110' : ''}
                    ${isGlowing ? 'badge-glowing' : ''}
                    ${(isFilling || isLocked) ? 'badge-filling' : ''}
                `}
                style={isGlowing ? {
                    boxShadow: `0 0 20px ${badge.glowColor}, 0 0 40px ${badge.glowColor.replace('0.6', '0.3')}`,
                } : {}}
            >
                {isCrystal ? (
                    <CrystalBadge badge={badge} />
                ) : (
                    <>
                        {/* 액체 차오름 */}
                        {(isFilling || isGlowing) && (
                            <LiquidFill
                                pct={pct}
                                liquidColor={badge.liquidColor}
                                isGlowing={isGlowing}
                            />
                        )}

                        {/* 잠긴 상태 - 반투명 유리 */}
                        {isLocked && (
                            <div className="absolute inset-0 rounded-[1.5rem] flex items-center justify-center"
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    backdropFilter: 'blur(4px)',
                                }}>
                                <span className="text-2xl md:text-3xl opacity-30 grayscale">{badge.emoji}</span>
                            </div>
                        )}

                        {/* 이모지 (진행 중) */}
                        {!isLocked && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <span
                                    className="text-2xl md:text-3xl relative z-10"
                                    style={{
                                        filter: isGlowing
                                            ? `drop-shadow(0 0 8px ${badge.glowColor})`
                                            : 'none',
                                        mixBlendMode: 'multiply',
                                    }}
                                >
                                    {badge.emoji}
                                </span>
                            </div>
                        )}

                        {/* 상단 유리 하이라이트 */}
                        <div
                            className="absolute top-0 left-0 right-0 h-1/2 rounded-t-[1.5rem] pointer-events-none z-20"
                            style={{
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)',
                            }}
                        />

                        {/* 퍼센트 표시 (잠기지 않은 경우) */}
                        {!isLocked && !isCrystal && (
                            <div
                                className="absolute -bottom-1 -right-1 text-[9px] font-black px-1.5 py-0.5 rounded-full z-30 border border-white/80"
                                style={{
                                    background: isGlowing
                                        ? `linear-gradient(135deg, ${badge.glowColor.replace('0.6', '0.9')}, ${badge.glowColor.replace('0.6', '0.7')})`
                                        : 'rgba(99,102,241,0.8)',
                                    color: 'white',
                                    backdropFilter: 'blur(4px)',
                                    boxShadow: isGlowing ? `0 0 8px ${badge.glowColor}` : 'none',
                                }}
                            >
                                {Math.round(pct)}%
                            </div>
                        )}

                        {/* 100% 달성 체크 */}
                        {isCrystal && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center z-30 shadow-lg">
                                <span className="text-white text-[10px] font-black">✓</span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* 뱃지 라벨 */}
            <div className="text-center px-1">
                <div className={`font-black text-[10px] md:text-xs leading-tight mb-0.5 ${
                    isCrystal ? 'text-indigo-600 dark:text-indigo-300' :
                    isGlowing ? 'text-amber-600 dark:text-amber-300' :
                    isLocked ? 'text-slate-300 dark:text-slate-600' :
                    'text-slate-600 dark:text-slate-300'
                }`}>
                    {badge.label}
                </div>
                <div className="text-[8px] md:text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                    {badge.subLabel}
                </div>
            </div>
        </div>
    );
};

const GradeBadges = ({ userXp }) => {
    const [expanded, setExpanded] = useState(false);
    const xp = userXp || 0;
    const unlockedCount = GRADE_BADGES.filter(b => xp >= b.requiredXp).length;

    // 다음 목표 뱃지
    const nextBadge = GRADE_BADGES.find(b => xp < b.requiredXp);
    const prevBadge = nextBadge ? GRADE_BADGES[GRADE_BADGES.indexOf(nextBadge) - 1] : null;
    const prevXp = prevBadge ? prevBadge.requiredXp : 0;
    const pct = nextBadge
        ? Math.min(99, ((xp - prevXp) / (nextBadge.requiredXp - prevXp)) * 100)
        : 100;

    return (
        <div className="w-full clay-panel p-4 md:p-6 relative overflow-hidden">
            {/* 배경 글로우 */}
            {unlockedCount > 0 && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `radial-gradient(ellipse at 50% 0%, ${GRADE_BADGES[unlockedCount - 1]?.glowColor?.replace('0.6', '0.08') || 'transparent'} 0%, transparent 70%)`,
                    }}
                />
            )}

            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between relative z-10"
            >
                <div className="flex items-center gap-3 md:gap-5">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center overflow-hidden relative"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,245,255,0.8) 100%)',
                            border: '2px solid rgba(255,255,255,0.9)',
                            boxShadow: '0 4px 16px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,1)',
                        }}>
                        <img src="/assets/images/dashboard/medal.webp" alt="Medal" className="w-full h-full object-contain p-2" />
                    </div>
                    <div className="text-left">
                        <div className="font-black text-slate-700 dark:text-slate-100 text-lg md:text-2xl leading-none mb-1">
                            급수 달성 뱃지
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-[10px] md:text-sm font-bold tracking-wider"
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>
                                {unlockedCount} / {GRADE_BADGES.length} 획득
                            </div>
                            {/* 미니 진행 바 */}
                            <div className="w-16 h-1.5 rounded-full overflow-hidden"
                                style={{ background: 'rgba(148,163,184,0.2)' }}>
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: (unlockedCount / GRADE_BADGES.length * 100) + '%',
                                        background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                    {/* 미니 뱃지 미리보기 */}
                    <div className="hidden sm:flex gap-1.5">
                        {GRADE_BADGES.slice(0, 5).map((b, i) => {
                            const unlocked = xp >= b.requiredXp;
                            return (
                                <div
                                    key={b.id}
                                    className="w-7 h-7 rounded-xl flex items-center justify-center text-base transition-all"
                                    style={{
                                        background: unlocked
                                            ? `linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,245,255,0.8))`
                                            : 'rgba(148,163,184,0.15)',
                                        border: unlocked ? '1.5px solid rgba(255,255,255,0.9)' : '1.5px solid rgba(148,163,184,0.2)',
                                        boxShadow: unlocked ? `0 2px 8px ${b.glowColor?.replace('0.6', '0.3')}` : 'none',
                                        filter: unlocked ? 'none' : 'grayscale(100%)',
                                        opacity: unlocked ? 1 : 0.3,
                                        transform: unlocked ? 'scale(1.05)' : 'scale(1)',
                                    }}
                                >
                                    {b.emoji}
                                </div>
                            );
                        })}
                    </div>
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                        style={{
                            background: 'rgba(255,255,255,0.6)',
                            backdropFilter: 'blur(8px)',
                            border: '1.5px solid rgba(255,255,255,0.8)',
                        }}>
                        <span className="text-slate-400 text-sm">▼</span>
                    </div>
                </div>
            </button>

            {expanded && (
                <div className="mt-6 relative z-10">
                    {/* 뱃지 그리드 */}
                    <div className="grid grid-cols-5 gap-3 md:gap-5">
                        {GRADE_BADGES.map((badge, i) => (
                            <BadgeItem
                                key={badge.id}
                                badge={badge}
                                xp={xp}
                                prevRequiredXp={i > 0 ? GRADE_BADGES[i - 1].requiredXp : 0}
                            />
                        ))}
                    </div>

                    {/* 다음 목표 진행 바 */}
                    <div className="mt-6 p-4 rounded-2xl relative overflow-hidden"
                        style={{
                            background: 'rgba(255,255,255,0.5)',
                            backdropFilter: 'blur(12px)',
                            border: '1.5px solid rgba(255,255,255,0.8)',
                        }}>
                        {nextBadge ? (
                            <>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs md:text-sm font-black text-slate-600 dark:text-slate-300">
                                        다음 목표: <span className="text-indigo-500">{nextBadge.emoji} {nextBadge.label}</span>
                                    </span>
                                    <span className="text-[10px] md:text-xs font-bold text-slate-400">
                                        {xp} / {nextBadge.requiredXp} XP
                                    </span>
                                </div>
                                {/* 글로시 진행 바 */}
                                <div className="w-full h-4 md:h-5 rounded-full overflow-hidden relative"
                                    style={{
                                        background: 'rgba(148,163,184,0.15)',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                                    }}>
                                    <div
                                        className="h-full rounded-full relative overflow-hidden transition-all duration-1000 ease-out"
                                        style={{
                                            width: pct + '%',
                                            background: nextBadge.liquidColor,
                                            boxShadow: `0 0 12px ${nextBadge.glowColor?.replace('0.6', '0.4')}`,
                                        }}
                                    >
                                        {/* 상단 하이라이트 */}
                                        <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full"
                                            style={{ background: 'rgba(255,255,255,0.4)' }} />
                                        {/* 물결 */}
                                        <div className="absolute top-0 right-0 bottom-0 w-8"
                                            style={{
                                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3))',
                                                animation: 'liquidWave 1.5s ease-in-out infinite',
                                            }} />
                                    </div>
                                    {/* 퍼센트 텍스트 */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-[10px] font-black text-white drop-shadow-sm">
                                            {Math.round(pct)}%
                                        </span>
                                    </div>
                                </div>
                                {pct >= 80 && (
                                    <div className="mt-2 text-center text-[10px] font-black animate-pulse"
                                        style={{ color: nextBadge.glowColor }}>
                                        ✨ 거의 다 왔어요! 조금만 더!
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-2">
                                <span className="text-emerald-500 font-black text-sm md:text-base animate-pulse">
                                    ✨ 모든 한자 급수 마스터! ✨
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GradeBadges;
