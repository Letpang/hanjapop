/**
 * badgeUtils.js
 * 5단계 붓 뱃지 시스템
 *
 * 뱃지 단계 | 이름       | 조건
 * ──────────────────────────────────────────────────
 *  1단계    | 입문자     | 앱 첫 실행 (항상 획득)
 *  2단계    | 탐험가     | 누적 출석 7일 이상
 *  3단계    | 마스터     | 한자 마스터(숙달도 2) 30개 이상
 *  4단계    | 선생님     | 누적 XP 2800 이상 (LV.6)
 *  5단계    | 전설       | 누적 XP 10000 이상 (LV.10)
 */

export const BRUSH_BADGES = [
    {
        id: 'beginner',
        label: '입문자',
        subLabel: '한자팝 시작!',
        image: '/assets/images/badges/brush_1_beginner.webp',
        condition: (stats) => true, // 항상 획득
        tier: 1,
    },
    {
        id: 'explorer',
        label: '탐험가',
        subLabel: '7일 연속 출석',
        image: '/assets/images/badges/brush_2_explorer.webp',
        condition: (stats) => (stats.totalDays || 0) >= 7,
        tier: 2,
    },
    {
        id: 'master',
        label: '마스터',
        subLabel: '한자 30개 완전암기',
        image: '/assets/images/badges/brush_3_master.webp',
        condition: (stats) => (stats.masteredCount || 0) >= 30,
        tier: 3,
    },
    {
        id: 'teacher',
        label: '선생님',
        subLabel: 'LV.6 달성',
        image: '/assets/images/badges/brush_4_teacher.webp',
        condition: (stats) => (stats.xp || 0) >= 2800,
        tier: 4,
    },
    {
        id: 'legend',
        label: '전설',
        subLabel: 'LV.10 달성',
        image: '/assets/images/badges/brush_5_legend.webp',
        condition: (stats) => (stats.xp || 0) >= 10000,
        tier: 5,
    },
];

/**
 * 현재 획득한 최고 단계 뱃지 반환
 * @param {{ xp: number, totalDays: number, masteredCount: number }} stats
 * @returns {{ id, label, subLabel, image, tier, unlocked }[]}
 */
export const getBadgeStatus = (stats) => {
    return BRUSH_BADGES.map(b => ({
        ...b,
        unlocked: b.condition(stats),
    }));
};

/**
 * 현재 획득한 최고 단계 뱃지 반환
 */
export const getHighestBadge = (stats) => {
    const unlocked = BRUSH_BADGES.filter(b => b.condition(stats));
    return unlocked.length > 0 ? unlocked[unlocked.length - 1] : BRUSH_BADGES[0];
};
