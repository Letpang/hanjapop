/**
 * CoachCard.jsx
 * 메인 메뉴 상단에 항상 노출되는 코치 카드
 * - 오늘 성취한 것 (칭찬)
 * - 다음 미션 추천 (넛지) + 버튼 하나로 바로 이동
 */
import { useMemo, useState } from 'react';

const CoachCard = ({
    missions,        // useDailyMission의 missions
    streak,          // { count }
    mastery,         // useMastery의 mastery 객체
    userXp,          // 현재 XP
    todayStats,      // { flashcard, writing, matchGame, shootGame, sentenceQuiz } — 오늘 활동 횟수
    onNavigate,      // 화면 이동 함수
}) => {
    const [collapsed, setCollapsed] = useState(false);

    // ── 오늘 성취 계산 ──────────────────────────────────────────────────────
    const achievements = useMemo(() => {
        const list = [];

        // 미션 완료 개수
        const doneMissions = (missions || []).filter(m => m.done).length;
        if (doneMissions > 0) {
            list.push({ icon: '✅', text: `오늘 미션 ${doneMissions}개 완료` });
        }

        // 스트릭
        if (streak?.count >= 2) {
            list.push({ icon: '🔥', text: `${streak.count}일 연속 학습 중!` });
        }

        // 오늘 활동
        const stats = todayStats || {};
        const totalActivity = (stats.flashcard || 0) + (stats.writing || 0) +
            (stats.matchGame || 0) + (stats.shootGame || 0) + (stats.sentenceQuiz || 0) + (stats.wordQuiz || 0);
        if (totalActivity > 0) {
            list.push({ icon: '📚', text: `오늘 ${totalActivity}번 학습했어요` });
        }

        // 숙달도 완전암기 개수
        const masteredCount = mastery
            ? Object.values(mastery).filter(m => m.level >= 3).length
            : 0;
        if (masteredCount > 0) {
            list.push({ icon: '⭐', text: `한자 ${masteredCount}개 완전 암기` });
        }

        return list;
    }, [missions, streak, todayStats, mastery]);

    // ── 다음 미션 추천 ────────────────────────────────────────────────────
    const recommendation = useMemo(() => {
        // 1순위: 복습 권장 한자 있으면 → 오답노트
        if (mastery) {
            const DAY_MS = 24 * 60 * 60 * 1000;
            const reviewCount = Object.values(mastery).filter(m =>
                m.wrongCount > 0 && m.lastWrong &&
                Date.now() - new Date(m.lastWrong).getTime() >= DAY_MS
            ).length;
            if (reviewCount > 0) {
                return {
                    icon: '⚠️',
                    text: `${reviewCount}개 한자가 복습을 기다려요`,
                    sub: '1일 이상 지난 오답',
                    screen: 'review',
                    btnText: '복습하기',
                    color: 'from-red-400 to-rose-500',
                };
            }
        }

        // 2순위: 미완료 미션 있으면 → 해당 미션 화면
        const pendingMission = (missions || []).find(m => !m.done);
        if (pendingMission) {
            const missionScreenMap = {
                flashcard: 'flashcard',
                writing: 'writing',
                matchGame: 'matchGame',
                shootGame: 'shootGame',
                sentenceQuiz: 'sentenceQuiz',
                shootGame_wave: 'shootGame',
                wordQuiz: 'wordQuiz',
            };
            const screen = missionScreenMap[pendingMission.type] || 'flashcard';
            return {
                icon: '🎯',
                text: pendingMission.label,
                sub: `${pendingMission.progress}/${pendingMission.target} 완료`,
                screen,
                btnText: '바로 시작',
                color: 'from-indigo-400 to-purple-500',
            };
        }

        // 3순위: 모든 미션 완료
        const allDone = (missions || []).every(m => m.done);
        if (allDone && missions?.length > 0) {
            return {
                icon: '🏆',
                text: '오늘 할 건 다 했어요!',
                sub: '내일 새로운 미션이 기다려요',
                screen: null,
                btnText: null,
                color: 'from-amber-400 to-yellow-500',
            };
        }

        // 4순위: 기본 — 플래시카드 추천
        return {
            icon: '🃏',
            text: '오늘의 한자 카드를 펼쳐봐요',
            sub: '매일 조금씩 꾸준히!',
            screen: 'flashcard',
            btnText: '시작하기',
            color: 'from-green-400 to-emerald-500',
        };
    }, [mastery, missions]);

    // 오늘 아무것도 안 했을 때 메시지
    const isFirstToday = achievements.length === 0;

    return (
        <div className="w-full clay-panel rounded-[2.5rem] bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-xl overflow-hidden">
            {/* 헤더 (접기/펼치기) */}
            <button
                onClick={() => setCollapsed(c => !c)}
                className="w-full flex items-center justify-between px-6 py-4"
            >
                <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <span className="font-black text-slate-700 dark:text-white text-lg">오늘의 코치</span>
                </div>
                <span className="text-slate-400 text-xl font-bold transition-transform duration-200" style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>
                    ∧
                </span>
            </button>

            {!collapsed && (
                <div className="px-6 pb-6 flex flex-col gap-4">
                    {/* 오늘 성취 */}
                    {isFirstToday ? (
                        <div className="text-center py-2">
                            <p className="text-slate-400 font-bold text-sm">오늘 아직 시작 전이에요</p>
                            <p className="text-slate-500 font-black text-base">3분만 투자해봐요! ⏱️</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">오늘 성취</p>
                            <div className="flex flex-wrap gap-2">
                                {achievements.map((a, i) => (
                                    <div key={i} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700 rounded-2xl px-3 py-1.5">
                                        <span className="text-base">{a.icon}</span>
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-200">{a.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 구분선 */}
                    <div className="w-full h-px bg-slate-100 dark:bg-slate-700" />

                    {/* 다음 미션 추천 */}
                    <div className="flex flex-col gap-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">지금 이걸 해봐요</p>
                        <div className={`w-full bg-gradient-to-r ${recommendation.color} rounded-2xl p-4 flex items-center justify-between gap-3`}>
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <span className="text-2xl shrink-0">{recommendation.icon}</span>
                                <div className="min-w-0">
                                    <p className="font-black text-white text-sm leading-tight truncate">{recommendation.text}</p>
                                    {recommendation.sub && (
                                        <p className="text-white/70 text-xs font-bold mt-0.5">{recommendation.sub}</p>
                                    )}
                                </div>
                            </div>
                            {recommendation.btnText && recommendation.screen && (
                                <button
                                    onClick={() => onNavigate(recommendation.screen)}
                                    className="shrink-0 bg-white/20 hover:bg-white/30 text-white font-black text-sm px-4 py-2 rounded-xl border border-white/30 active:scale-95 transition-all whitespace-nowrap"
                                >
                                    {recommendation.btnText} →
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoachCard;
