import React, { useState, useMemo, useCallback } from 'react';
import { SK } from '../constants/storageKeys.js';
import HANJA_DATA from '../hanja_unified.json';
import DAILY_CURRICULUM from '../data/dailyCurriculum.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const toDateStr = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const todayStr = toDateStr(new Date());

const MISSION_LABELS = {
    quiz_5: '문장 퀴즈 5문제 풀기',
    wordquiz_5: '단어 퀴즈 5문제 풀기',
    flashcard_1: '뭉치 학습지 1개 완료',
    writing_1: '획순 테스트 1개 완료',
    match_1: '메모리 게임 1판 완료',
};

// ─── 망각 곡선 ───────────────────────────────────────────────────────────────
const getReviewUrgency = (lastWrong) => {
    if (!lastWrong) return 'none';
    const diff = Date.now() - new Date(lastWrong).getTime();
    if (diff >= 3 * DAY_MS) return 'urgent';
    if (diff >= 1 * DAY_MS) return 'due';
    return 'recent';
};

const getWrongHanjas = (mastery) =>
    HANJA_DATA
        .filter(h => { const m = mastery[String(h.id)]; return m && (m.wrongCount || 0) > 0; })
        .map(h => {
            const m = mastery[String(h.id)];
            return { ...h, wrongCount: m.wrongCount || 0, lastWrong: m.lastWrong || null, level: m.level, urgency: getReviewUrgency(m.lastWrong) };
        })
        .sort((a, b) => b.wrongCount - a.wrongCount);

const getDueHanjas = (wrongHanjas) => wrongHanjas.filter(h => h.urgency === 'due' || h.urgency === 'urgent');

const generateOptions = (correct, allHanjas, type = 'meaning') => {
    const pool = allHanjas.filter(h => h.id !== correct.id).sort(() => Math.random() - 0.5).slice(0, 3);
    return [...pool, correct].sort(() => Math.random() - 0.5).map(h => ({
        id: h.id,
        text: type === 'meaning' ? h.meaning : h.sound,
        isCorrect: h.id === correct.id,
    }));
};

// 숫자 약어 (52401 → 52k+)
const fmtNum = (n) => {
    if (n >= 10000) return Math.floor(n / 1000) + 'k+';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
};

// ─── 달력 ───────────────────────────────────────────────────────────────────
const MissionCalendar = () => {
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);

    const history = useMemo(() => {
        try { return JSON.parse(localStorage.getItem(SK.MISSION_HISTORY) || '{}'); } catch { return {}; }
    }, []);

    const cumulativeCounts = useMemo(() => {
        const counts = {};
        Object.values(history).forEach(ids => {
            (ids || []).forEach(id => { counts[id] = (counts[id] || 0) + 1; });
        });
        return counts;
    }, [history]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

    const getDayStr = (day) =>
        `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const getDayState = (day) => {
        const ds = getDayStr(day);
        const isToday = ds === todayStr;
        const isPast = new Date(year, month, day) < new Date() && !isToday;
        if (isToday) return 'today';
        if (history[ds] !== undefined) return history[ds].length > 0 ? 'green' : 'red';
        if (isPast) return 'red';
        return 'future';
    };

    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
        <div className="minimal-card w-full p-8 bg-white border border-[#E9EDF2]">
            {/* Month nav */}
            <div className="flex justify-between items-center mb-8 px-2">
                <button
                    onClick={() => { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(null); }}
                    className="w-11 h-11 rounded-full bg-[#F8FAF9] flex items-center justify-center font-extrabold text-[#AEB7C5] border border-[#E9EDF2] active:scale-90 transition-all hover:bg-[#F4F7F8]"
                >‹</button>
                <div className="flex flex-col items-center">
                    <span className="text-xs font-extrabold text-[#AEB7C5] tracking-[0.2em] uppercase mb-1">{year}</span>
                    <span className="font-extrabold text-[#5D544F] text-body-lg-res tracking-tight">학습 일기</span>
                </div>
                <button
                    onClick={() => { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(null); }}
                    className="w-11 h-11 rounded-full bg-[#F8FAF9] flex items-center justify-center font-extrabold text-[#AEB7C5] border border-[#E9EDF2] active:scale-90 transition-all hover:bg-[#F4F7F8]"
                >›</button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 mb-4">
                {DAY_NAMES.map((d, i) => (
                    <div key={d} className={`text-center text-xs font-extrabold py-1 uppercase tracking-widest ${i === 0 ? 'text-rose-400' : i === 6 ? 'text-[#7C83FF]' : 'text-[#AEB7C5]'}`}>{d}</div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-2">
                {cells.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} />;
                    const state = getDayState(day);
                    const ds = getDayStr(day);
                    const isSelected = selectedDay === ds;
                    const clickable = state === 'green' || state === 'today';

                    // 스타일링 헬퍼
                    let cellCls = "aspect-square flex items-center justify-center rounded-2xl transition-all relative overflow-hidden ";
                    let innerCls = "w-full h-full flex items-center justify-center rounded-2xl font-extrabold text-xs ";

                    if (state === 'today') {
                        return (
                            <button
                                key={day}
                                onClick={() => clickable && setSelectedDay(isSelected ? null : ds)}
                                className={cellCls + (isSelected ? 'scale-110' : 'active:scale-95')}
                            >
                                <div className={innerCls + "bg-[#7C83FF] text-white shadow-lg shadow-[#C3C6FF] border-none"}>
                                    {day}
                                </div>
                            </button>
                        );
                    }

                    if (state === 'green') {
                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(isSelected ? null : ds)}
                                className={cellCls + (isSelected ? 'scale-110' : 'active:scale-95')}
                            >
                                <div className={innerCls + "bg-[#FF9B73]/10 text-[#FF9B73] border border-[#FF9B73]/20"}>
                                    {day}
                                </div>
                                {isSelected && <div className="absolute bottom-1 w-1 h-1 bg-[#FF9B73] rounded-full" />}
                            </button>
                        );
                    }

                    if (state === 'red') {
                        return (
                            <div key={day} className={cellCls}>
                                <div className={innerCls + "text-slate-200"}>
                                    {day}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={day} className={cellCls}>
                            <span className={innerCls + "text-slate-200"}>{day}</span>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex gap-6 mt-8 justify-center bg-[#F8FAF9] py-3 rounded-2xl border border-[#E9EDF2]">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#FF9B73]" />
                    <span className="text-xs text-[#AEB7C5] font-extrabold tracking-tighter">완료</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                    <span className="text-xs text-[#AEB7C5] font-extrabold tracking-tighter">미완료</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#7C83FF] shadow-sm" />
                    <span className="text-xs text-[#AEB7C5] font-extrabold tracking-tighter">오늘</span>
                </div>
            </div>

            {/* Selected day detail */}
            {selectedDay && (
                <div className="mt-8 pt-8 border-t border-[#E9EDF2] animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-xs font-extrabold text-[#5D544F] uppercase tracking-widest">
                            {selectedDay === todayStr ? '오늘' : selectedDay.replace(/-/g, '.')} 학습 기록
                        </div>
                        <div className="px-3 py-1 rounded-full bg-[#F8FAF9] border border-[#E9EDF2] text-xs font-extrabold text-[#AEB7C5] tracking-widest">
                            누적 기록
                        </div>
                    </div>
                    {(history[selectedDay] || []).length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {(history[selectedDay] || []).map(id => (
                                <div key={id} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-[#E9EDF2] shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">✨</span>
                                        <span className="text-xs font-extrabold text-[#5D544F] tracking-tight uppercase">{MISSION_LABELS[id] || id}</span>
                                    </div>
                                    <span className="text-xs font-extrabold text-[#FF9B73]">누적 {cumulativeCounts[id] || 0}회</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-xs text-[#AEB7C5] font-extrabold tracking-widest py-6 text-center w-full bg-[#F8FAF9] rounded-2xl border border-dashed border-[#E9EDF2]">완료한 미션이 없어요</div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── 학습 진행도 (스택형 바 차트) ─────────────────────────────────────────────
const ProgressSection = ({ mastery, currentDay }) => {
    const stats = useMemo(() => {
        const totalHanja = HANJA_DATA.length;

        // 스테이지 기반 분류
        const pastIds = new Set();
        const currentIds = new Set();
        const futureIds = new Set();
        DAILY_CURRICULUM.forEach(({ day, hanja }) => {
            hanja.forEach(({ id }) => {
                if (day < currentDay) pastIds.add(id);
                else if (day === currentDay) currentIds.add(id);
                else futureIds.add(id);
            });
        });

        let totalWords = 0;
        let pastWords = 0;
        let currentWords = 0;
        let futureWords = 0;
        HANJA_DATA.forEach(h => {
            const words = (h.words || []).length;
            totalWords += words;
            if (pastIds.has(h.id)) pastWords += words;
            else if (currentIds.has(h.id)) currentWords += words;
            else futureWords += words;
        });

        return {
            hanja: { total: totalHanja, done: pastIds.size, learning: currentIds.size, unseen: futureIds.size },
            words: { total: totalWords, done: pastWords, learning: currentWords, unseen: futureWords },
        };
    }, [mastery]);

    const StackBar = ({ label, s }) => {
        const donePct = (s.done / s.total) * 100;
        const learningPct = (s.learning / s.total) * 100;
        const totalPct = Math.round((s.done / s.total) * 100);

        return (
            <div className="flex flex-col gap-3">
                <div className="flex items-end justify-between">
                    <span className="text-xs font-extrabold text-[#AEB7C5] tracking-widest">{label}</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-h2-res font-extrabold text-[#5D544F] tabular-nums tracking-tighter">{totalPct}%</span>
                        <span className="text-xs text-[#AEB7C5] font-extrabold uppercase">{s.done} / {s.total}</span>
                    </div>
                </div>
                {/* 스택형 바 */}
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-[#F8FAF9] border border-[#E9EDF2] shadow-inner">
                    {/* 누적 */}
                    {donePct > 0 && (
                        <div
                            className="h-full transition-all duration-1000"
                            style={{
                                width: `${donePct}%`,
                                background: 'linear-gradient(to right, #FFB38A, #FF7E8A)',
                                boxShadow: '0 0 8px rgba(255,126,138,0.35)',
                                borderRadius: learningPct > 0 ? '9999px 0 0 9999px' : '9999px',
                            }}
                        />
                    )}
                    {/* 학습 중 */}
                    {learningPct > 0 && (
                        <div
                            className="h-full transition-all duration-1000"
                            style={{
                                width: `${learningPct}%`,
                                background: 'linear-gradient(to right, #FFD4B8, #FFAFC0)',
                                borderRadius: donePct > 0 ? '0 9999px 9999px 0' : '9999px',
                            }}
                        />
                    )}
                </div>
                {/* 범례 */}
                <div className="flex gap-5">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'linear-gradient(to right, #FFB38A, #FF7E8A)' }} />
                        <span className="text-xs text-[#AEB7C5] font-extrabold tracking-tighter">누적 {s.done}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'linear-gradient(to right, #FFD4B8, #FFAFC0)' }} />
                        <span className="text-xs text-[#AEB7C5] font-extrabold tracking-tighter">학습 중 {s.learning}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F4F7F8]" />
                        <span className="text-xs text-[#AEB7C5] font-extrabold tracking-tighter">미학습 {s.unseen}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="minimal-card w-full p-8 bg-white border border-[#E9EDF2]">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#7C83FF]/10 flex items-center justify-center border border-[#C3C6FF]">
                        <img src="/assets/images/icons/icon_study_gauge.webp" alt="열공지수" className="w-6 h-6 object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[#5D544F] font-extrabold text-lg tracking-tight">학습 숙련도</span>
                        <span className="text-xs font-extrabold text-[#AEB7C5] tracking-widest">전체 통계</span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-10">
                <StackBar label="한자 숙련도" s={stats.hanja} />
                <StackBar label="어휘 숙련도" s={stats.words} />
            </div>
        </div>
    );
};

// ─── 오답 섹션 (상태 칩 + 랭킹 차트) ─────────────────────────────────────────
const WrongSection = ({ wrongHanjas }) => {
    const top5 = wrongHanjas.slice(0, 5);
    const maxWrong = top5.length > 0 ? top5[0].wrongCount : 1;

    // 문장/획순 오답 수 (현재는 0, 준비 중)
    const sentenceWrong = 0;
    const writingWrong = 0;

    return (
        <div className="minimal-card w-full p-8 bg-white border border-[#E9EDF2]">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-[#5D544F] font-extrabold text-lg tracking-tight">우선 복습 TOP {Math.min(5, top5.length)}</span>
                        <span className="text-xs font-extrabold text-rose-400 uppercase tracking-widest">Needs Your Attention</span>
                    </div>
                </div>
            </div>

            {/* 상태 칩 */}
            <div className="flex gap-2.5 mb-8 flex-wrap">
                <div className="flex items-center gap-2 bg-[#F8FAF9] border border-[#E9EDF2] px-4 py-2.5 rounded-2xl">
                    <span className="text-xs font-extrabold text-[#5D544F]">漢</span>
                    <span className="text-xs font-extrabold text-[#AEB7C5] uppercase tracking-tight">Hanja Mistakes: {wrongHanjas.length}</span>
                </div>
                {sentenceWrong > 0 && (
                    <div className="flex items-center gap-2 bg-[#F8FAF9] border border-[#E9EDF2] px-4 py-2.5 rounded-2xl">
                        <span className="text-sm">💬</span>
                        <span className="text-xs font-extrabold text-[#AEB7C5] uppercase tracking-tight">Sentences: {sentenceWrong}</span>
                    </div>
                )}
                {writingWrong > 0 && (
                    <div className="flex items-center gap-2 bg-[#F8FAF9] border border-[#E9EDF2] px-4 py-2.5 rounded-2xl">
                        <span className="text-sm">✍️</span>
                        <span className="text-xs font-extrabold text-[#AEB7C5] uppercase tracking-tight">Stroke Order: {writingWrong}</span>
                    </div>
                )}
            </div>

            {/* 오답 랭킹 차트 */}
            {top5.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-12 bg-[#F8FAF9] rounded-[2.5rem] border border-dashed border-[#E9EDF2]">
                    <div className="text-7xl animate-bounce">🎉</div>
                    <span className="text-[#AEB7C5] text-xs font-extrabold tracking-widest">완벽해요! 틀린 한자 없음</span>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {top5.map((h, idx) => {
                        const barPct = (h.wrongCount / maxWrong) * 100;
                        const urgencyColor = h.urgency === 'urgent'
                            ? 'bg-rose-400 shadow-rose-100'
                            : h.urgency === 'due'
                            ? 'bg-[#FFB433] shadow-[#FFB433]/15'
                            : 'bg-[#7C83FF] shadow-[#C3C6FF]';

                        return (
                            <div key={h.id} className="flex items-center gap-4 group">
                                {/* 순위 */}
                                <div className="text-xs font-extrabold text-slate-200 w-4 text-center">{idx + 1}</div>
                                
                                {/* 한자 아이콘 */}
                                <div className="w-16 h-16 shrink-0 rounded-3xl bg-[#F8FAF9] border border-[#E9EDF2] flex items-center justify-center transition-transform group-hover:scale-105">
                                    <span className="text-h2-res font-extrabold text-[#5D544F]">{h.hanja}</span>
                                </div>

                                {/* 바 + 수치 */}
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-extrabold text-[#5D544F] uppercase tracking-tight">{h.sound} · {h.meaning}</span>
                                            <span className="text-xs font-extrabold text-[#AEB7C5] uppercase tracking-widest">{h.urgency === 'urgent' ? '긴급 복습' : h.urgency === 'due' ? '복습 필요' : '잘하고 있어요'}</span>
                                        </div>
                                        <div className="flex items-baseline gap-0.5">
                                            <span className="text-lg font-extrabold text-[#5D544F] tabular-nums">{fmtNum(h.wrongCount)}</span>
                                            <span className="text-xs font-extrabold text-[#AEB7C5] uppercase tracking-tighter ml-0.5">Times</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-[#F8FAF9] border border-[#E9EDF2]">
                                        <div
                                            className={`h-full rounded-full ${urgencyColor} transition-all duration-1000 shadow-sm`}
                                            style={{
                                                width: `${barPct}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {wrongHanjas.length > 5 && (
                        <div className="text-center pt-4">
                            <span className="px-6 py-2 rounded-2xl bg-[#F8FAF9] text-[#AEB7C5] text-xs font-extrabold uppercase tracking-widest border border-[#E9EDF2]">
                                + {wrongHanjas.length - 5} MORE MISTAKES
                            </span>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

// ─── 복습 모드 서브컴포넌트들 ────────────────────────────────────────────────
const QuickReview = ({ hanjas, onDone, onMarkCorrect, onMarkWrong }) => {
    const [idx, setIdx] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [results, setResults] = useState({ correct: 0, wrong: 0 });

    const current = hanjas[idx];

    const handleResult = (isCorrect) => {
        if (isCorrect) onMarkCorrect(current.id); else onMarkWrong(current.id);
        setFlipped(false);
        setResults(prev => {
            const updated = isCorrect ? { ...prev, correct: prev.correct + 1 } : { ...prev, wrong: prev.wrong + 1 };
            if (idx + 1 >= hanjas.length) setTimeout(() => onDone(updated), 300);
            return updated;
        });
        if (idx + 1 < hanjas.length) setIdx(i => i + 1);
    };

    if (!current) return null;

    return (
        <div className="flex flex-col items-center gap-8 w-full">
            <div className="text-[#AEB7C5] font-extrabold text-xs uppercase tracking-[0.3em]">{idx + 1} / {hanjas.length}</div>
            <div className="w-full max-w-sm h-72 cursor-pointer select-none" onClick={() => setFlipped(f => !f)}>
                <div className={`relative w-full h-full transition-all duration-700 ${flipped ? '[transform:rotateY(180deg)]' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
                    <div className="absolute inset-0 premium-card-base !flex !flex-col items-center justify-center gap-6 p-10 bg-white border-[#E9EDF2] shadow-xl" style={{ backfaceVisibility: 'hidden' }}>
                        <div className="text-9xl font-extrabold text-[#5D544F] drop-shadow-sm">{current.hanja}</div>
                        <div className="px-4 py-2 bg-[#F8FAF9] rounded-2xl border border-[#E9EDF2]">
                            <span className="text-xs font-extrabold text-[#AEB7C5] uppercase tracking-widest">Tap to reveal</span>
                        </div>
                        {current.urgency === 'urgent' && <div className="absolute top-6 right-6 bg-rose-500 text-white text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-rose-100">Urgent</div>}
                    </div>
                    <div className="absolute inset-0 premium-card-base !flex !flex-col items-center justify-center gap-3 p-10 bg-[#F5F3FF] border-[#C3C6FF]" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <div className="text-h1-res font-extrabold text-[#4A51D4] tracking-tight">{current.sound}</div>
                        <div className="text-h2-res font-extrabold text-[#5B677A] tracking-tight">{current.meaning}</div>
                        <div className="mt-8 px-6 py-2 rounded-2xl bg-[#7C83FF]/15/50 text-[#7C83FF] text-xs font-extrabold uppercase tracking-widest">Wrong {current.wrongCount} times</div>
                    </div>
                </div>
            </div>
            {flipped && (
                <div className="flex gap-4 w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <button onClick={() => handleResult(false)} className="flex-1 py-5 rounded-3xl bg-white text-rose-500 font-extrabold text-lg border border-rose-100 active:scale-95 transition-all shadow-sm uppercase tracking-tight">Not Yet 😓</button>
                    <button onClick={() => handleResult(true)} className="flex-1 py-5 rounded-3xl bg-[#4A51D4] text-white font-extrabold text-lg shadow-xl shadow-[#C3C6FF] active:scale-95 transition-all uppercase tracking-tight">Got It! ✨</button>
                </div>
            )}
        </div>
    );
};

const FocusQuiz = ({ hanjas, onDone, onMarkCorrect, onMarkWrong }) => {
    const [idx, setIdx] = useState(0);
    const [wrongChoices, setWrongChoices] = useState([]);
    const [isCorrectSelected, setIsCorrectSelected] = useState(false);
    const [correct, setCorrect] = useState(0);
    const current = hanjas[idx];
    const options = useMemo(() => current ? generateOptions(current, HANJA_DATA, 'meaning') : [], [idx]);

    const handleSelect = (opt) => {
        if (isCorrectSelected || wrongChoices.includes(opt.id)) return;
        
        if (opt.isCorrect) {
            const isFirstTry = wrongChoices.length === 0;
            const nextCorrect = isFirstTry ? correct + 1 : correct;
            setCorrect(nextCorrect);
            onMarkCorrect(current.id);
            setIsCorrectSelected(true);
            
            setTimeout(() => {
                if (idx + 1 >= hanjas.length) onDone({ correct: nextCorrect, wrong: hanjas.length - nextCorrect });
                else { 
                    setWrongChoices([]);
                    setIsCorrectSelected(false);
                    setIdx(i => i + 1); 
                }
            }, 900);
        } else {
            setWrongChoices(prev => [...prev, opt.id]);
            onMarkWrong(current.id);
        }
    };

    if (!current) return null;
    return (
        <div className="flex flex-col items-center gap-8 w-full">
            <div className="text-[#AEB7C5] font-extrabold text-xs uppercase tracking-[0.3em]">{idx + 1} / {hanjas.length}</div>
            <div className="premium-card-base w-full max-w-sm p-12 flex flex-col items-center gap-4 relative overflow-hidden bg-white border-[#E9EDF2] shadow-xl">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#7C83FF]" />
                <div className="text-9xl font-extrabold text-[#5D544F] drop-shadow-sm">{current.hanja}</div>
                <div className="text-xs font-extrabold text-[#7C83FF] uppercase tracking-[0.2em] mt-6 bg-[#7C83FF]/10 px-4 py-1.5 rounded-full">Meaning check</div>
            </div>
            <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
                {options.map(opt => {
                    const isWrong = wrongChoices.includes(opt.id);
                    const isRight = isCorrectSelected && opt.isCorrect;
                    
                    let cls = 'w-full py-5 px-8 rounded-3xl font-extrabold text-lg transition-all active:scale-[0.98] text-left border-4 ';
                    
                    if (isRight) {
                        cls += 'bg-white border-[#B2F5EA] text-[#3D3530] shadow-xl shadow-teal-50';
                    } else if (isWrong) {
                        cls += 'bg-white border-[#FED2D2] text-[#3D3530] opacity-70';
                    } else if (isCorrectSelected) {
                        cls += 'bg-white border-[#E9EDF2] text-slate-200 opacity-40';
                    } else {
                        cls += 'bg-white border-[#E9EDF2] text-[#5D544F] hover:border-[#7C83FF] hover:shadow-md';
                    }
                    return <button key={opt.id} className={cls} onClick={() => handleSelect(opt)}>{opt.text}</button>;
                })}
            </div>
        </div>
    );
};

const Dictation = ({ hanjas, onDone, onMarkCorrect, onMarkWrong }) => {
    const [idx, setIdx] = useState(0);
    const [wrongChoices, setWrongChoices] = useState([]);
    const [isCorrectSelected, setIsCorrectSelected] = useState(false);
    const [correct, setCorrect] = useState(0);
    const current = hanjas[idx];
    const options = useMemo(() => {
        if (!current) return [];
        const pool = HANJA_DATA.filter(h => h.id !== current.id).sort(() => Math.random() - 0.5).slice(0, 3);
        return [...pool, current].sort(() => Math.random() - 0.5).map(h => ({ id: h.id, text: h.hanja, isCorrect: h.id === current.id }));
    }, [idx]);

    const handleSelect = (opt) => {
        if (isCorrectSelected || wrongChoices.includes(opt.id)) return;
        
        if (opt.isCorrect) {
            const isFirstTry = wrongChoices.length === 0;
            const nextCorrect = isFirstTry ? correct + 1 : correct;
            setCorrect(nextCorrect);
            onMarkCorrect(current.id);
            setIsCorrectSelected(true);
            
            setTimeout(() => {
                if (idx + 1 >= hanjas.length) onDone({ correct: nextCorrect, wrong: hanjas.length - nextCorrect });
                else { 
                    setWrongChoices([]);
                    setIsCorrectSelected(false);
                    setIdx(i => i + 1); 
                }
            }, 900);
        } else {
            setWrongChoices(prev => [...prev, opt.id]);
            onMarkWrong(current.id);
        }
    };

    if (!current) return null;
    return (
        <div className="flex flex-col items-center gap-8 w-full">
            <div className="text-[#AEB7C5] font-extrabold text-xs uppercase tracking-[0.3em]">{idx + 1} / {hanjas.length}</div>
            <div className="premium-card-base w-full max-w-sm p-12 flex flex-col items-center gap-2 relative overflow-hidden bg-white border-[#E9EDF2] shadow-xl">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#7C83FF]" />
                <div className="text-h1-res font-extrabold text-[#4A51D4] tracking-tight">{current.sound}</div>
                <div className="text-h2-res font-extrabold text-[#5B677A] tracking-tight">{current.meaning}</div>
                <div className="text-xs font-extrabold text-[#7C83FF] uppercase tracking-[0.2em] mt-6 bg-[#7C83FF]/10 px-5 py-2 rounded-full">Which Character?</div>
            </div>
            <div className="grid grid-cols-2 gap-5 w-full max-w-sm">
                {options.map(opt => {
                    const isWrong = wrongChoices.includes(opt.id);
                    const isRight = isCorrectSelected && opt.isCorrect;
                    
                    let cls = 'aspect-square rounded-[2.5rem] font-extrabold text-h1-res border-4 transition-all active:scale-[0.95] ';
                    
                    if (isRight) {
                        cls += 'bg-white border-[#B2F5EA] text-[#3D3530] shadow-xl shadow-teal-50';
                    } else if (isWrong) {
                        cls += 'bg-white border-[#FED2D2] text-[#3D3530] opacity-70';
                    } else if (isCorrectSelected) {
                        cls += 'bg-white border-[#E9EDF2] text-slate-100 opacity-40';
                    } else {
                        cls += 'bg-white border-[#E9EDF2] text-[#5D544F] hover:border-[#7C83FF] hover:shadow-lg';
                    }
                    return <button key={opt.id} className={cls} onClick={() => handleSelect(opt)}>{opt.text}</button>;
                })}
            </div>
        </div>
    );
};

const ResultScreen = ({ results, total, onRetry, onBack }) => {
    const pct = Math.round((results.correct / total) * 100);
    return (
        <div className="flex flex-col items-center gap-10 w-full py-12 animate-in fade-in zoom-in duration-700">
            <div className="text-9xl animate-bounce">{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '😓'}</div>
            <div className="text-center flex flex-col gap-2">
                <h1 className="text-h2-res font-extrabold text-[#5D544F] tracking-tight">{pct >= 80 ? '완벽해요!' : pct >= 50 ? '계속 해봐요!' : '다시 도전!'}</h1>
                <span className="text-xs font-extrabold text-[#AEB7C5] tracking-[0.3em]">복습 결과</span>
            </div>
            
            <div className="premium-card-base w-full max-w-sm p-10 flex flex-col gap-6 bg-white border-[#E9EDF2] shadow-xl">
                <div className="flex justify-between items-center"><span className="text-[#AEB7C5] font-extrabold text-xs uppercase tracking-widest">Correct</span><span className="text-[#FF9B73] font-extrabold text-h2-res tracking-tighter">{results.correct}</span></div>
                <div className="h-px bg-[#F8FAF9] w-full" />
                <div className="flex justify-between items-center"><span className="text-[#AEB7C5] font-extrabold text-xs uppercase tracking-widest">Mistakes</span><span className="text-rose-500 font-extrabold text-h2-res tracking-tighter">{results.wrong}</span></div>
                <div className="h-px bg-[#F8FAF9] w-full" />
                <div className="flex justify-between items-center pt-2"><span className="text-[#AEB7C5] font-extrabold text-xs uppercase tracking-widest">Accuracy</span><span className="text-[#4A51D4] font-extrabold text-h1-res tracking-tighter">{pct}%</span></div>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-sm">
                <button onClick={onRetry} className="pill-button-primary w-full py-5 text-xl">RETRY SESSION 🚀</button>
                <button onClick={onBack} className="w-full py-4 rounded-3xl bg-[#F8FAF9] text-[#AEB7C5] font-extrabold text-sm border border-[#E9EDF2] active:scale-95 transition-all uppercase tracking-widest">Back to List</button>
            </div>
        </div>
    );
};

// ─── 복습 모드 선택 모달 ──────────────────────────────────────────────────────
const ReviewModeModal = ({ onClose, onStart, onNavigate, dueCount, totalCount }) => (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-[#5D544F]/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
        <div className="w-full max-w-lg premium-card-base !rounded-b-none p-10 pb-16 bg-[#F7FAF9] animate-in slide-in-from-bottom-full duration-500" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col">
                    <h3 className="font-extrabold text-[#5D544F] text-h3-res tracking-tight">복습 모드</h3>
                    <span className="text-xs font-extrabold text-[#AEB7C5] uppercase tracking-widest">Select Your Method</span>
                </div>
                <button onClick={onClose} className="w-11 h-11 rounded-full bg-white border border-[#E9EDF2] flex items-center justify-center font-extrabold text-xl active:scale-90 text-[#AEB7C5]">✕</button>
            </div>
            <div className="flex flex-col gap-4">
                <button onClick={() => { onClose(); onNavigate && onNavigate('flashcard'); }} className="minimal-card w-full flex items-center gap-6 p-6 bg-white border-[#E9EDF2] hover:border-[#7C83FF] hover:shadow-xl hover:shadow-[#C3C6FF]/40 active:scale-[0.98] transition-all group">
                    <div className="w-16 h-16 rounded-[2rem] bg-[#FFB433]/10 flex items-center justify-center text-h2-res border border-[#FFB433]/15 transition-transform group-hover:rotate-6">🃏</div>
                    <div className="flex flex-col items-start">
                        <span className="font-extrabold text-[#5D544F] text-body-lg-res tracking-tight">플래시카드 복습</span>
                        <span className="text-[#AEB7C5] text-xs font-extrabold uppercase tracking-widest mt-0.5">Learn · Stroke Order</span>
                    </div>
                </button>
                <button onClick={() => onStart('quiz', 'all')} disabled={totalCount === 0} className="minimal-card w-full flex items-center gap-6 p-6 bg-white border-[#E9EDF2] hover:border-[#7C83FF] hover:shadow-xl hover:shadow-[#C3C6FF]/40 active:scale-[0.98] transition-all group disabled:opacity-30">
                    <div className="w-16 h-16 rounded-[2rem] bg-[#7C83FF]/10 flex items-center justify-center text-h2-res border border-[#C3C6FF] transition-transform group-hover:rotate-6">📝</div>
                    <div className="flex flex-col items-start">
                        <span className="font-extrabold text-[#5D544F] text-body-lg-res tracking-tight uppercase">Focus Quiz</span>
                        <span className="text-[#AEB7C5] text-xs font-extrabold uppercase tracking-widest mt-0.5">Choices · {totalCount} Words</span>
                    </div>
                </button>
                <button onClick={() => onStart('dictation', 'all')} disabled={totalCount === 0} className="minimal-card w-full flex items-center gap-6 p-6 bg-white border-[#E9EDF2] hover:border-[#7C83FF] hover:shadow-xl hover:shadow-[#C3C6FF]/40 active:scale-[0.98] transition-all group disabled:opacity-30">
                    <div className="w-16 h-16 rounded-[2rem] bg-[#FF9B73]/10 flex items-center justify-center text-h2-res border border-[#FF9B73]/20 transition-transform group-hover:rotate-6">✍️</div>
                    <div className="flex flex-col items-start">
                        <span className="font-extrabold text-[#5D544F] text-body-lg-res tracking-tight uppercase">Dictation Test</span>
                        <span className="text-[#AEB7C5] text-xs font-extrabold uppercase tracking-widest mt-0.5">Sound to Hanja · {totalCount} Words</span>
                    </div>
                </button>
            </div>
        </div>
    </div>
);

// ─── 메인 ReviewScreen ────────────────────────────────────────────────────────
const ReviewScreen = ({ onBack, onNavigate, mastery, markCorrect, markWrong, getStats, currentDay, initialSection = 'review' }) => {
    const [mode, setMode] = useState('home');
    const [reviewTarget, setReviewTarget] = useState('all');
    const [activeMode, setActiveMode] = useState(null);
    const [quizResults, setQuizResults] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    const wrongHanjas = useMemo(() => getWrongHanjas(mastery), [mastery]);
    const dueHanjas = useMemo(() => getDueHanjas(wrongHanjas), [wrongHanjas]);

    const targetList = reviewTarget === 'due' ? dueHanjas : wrongHanjas;

    const handleDone = (results) => {
        setQuizResults({ ...results, total: targetList.length });
        setMode('result');
    };

    const handleStart = (quizMode, target) => {
        setReviewTarget(target);
        setActiveMode(quizMode);
        setMode(quizMode);
        setShowReviewModal(false);
    };

    const handleRetry = () => { setQuizResults(null); setMode(activeMode); };

    // ── 홈 화면 ──
    if (mode === 'home') {
        // ── 캘린더 뷰 (학습 캘린더 + 열공 지수) ──
        if (initialSection === 'calendar') {
            return (
                <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-[100dvh] px-5 pt-8 pb-32 gap-8 bg-[#F7FAF9]">
                    {/* 헤더 */}
                    <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                        <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                            <button onClick={onBack}
                                className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-black text-[#5B677A] gap-1">
                                <span>←</span><span className="ml-1">뒤로</span>
                            </button>
                            <div className="flex items-center gap-2 overflow-hidden">
                                <h2 className="text-lg font-black text-slate-700 m-0">학습 기록</h2>
                            </div>
                        </div>
                    </div>

                    <MissionCalendar />
                    
                    {/* Decorative Divider */}
                    <div className="w-full flex items-center gap-4 px-6">
                        <div className="h-px flex-1 bg-[#F4F7F8]" />
                        <span className="text-xs font-extrabold text-[#AEB7C5] uppercase tracking-widest">Progress</span>
                        <div className="h-px flex-1 bg-[#F4F7F8]" />
                    </div>

                    <ProgressSection mastery={mastery} currentDay={currentDay} />
                </div>
            );
        }

        // ── 오답 복습 뷰 ──
        return (
            <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-[100dvh] px-5 pt-8 pb-40 gap-8 bg-[#F7FAF9]">
                {showReviewModal && (
                    <ReviewModeModal
                        onClose={() => setShowReviewModal(false)}
                        onStart={handleStart}
                        onNavigate={onNavigate}
                        dueCount={dueHanjas.length}
                        totalCount={wrongHanjas.length}
                    />
                )}

                {/* 헤더 */}
                <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                    <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                        <button onClick={onBack}
                            className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-black text-[#5B677A] gap-1">
                            <span>←</span><span className="ml-1">뒤로</span>
                        </button>
                        <div className="flex items-center gap-2 overflow-hidden">
                            <h2 className="text-lg font-black text-slate-700 m-0">오답 노트</h2>
                        </div>
                    </div>
                </div>

                <WrongSection wrongHanjas={wrongHanjas} />

                <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-6 pb-10 pt-16 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, #F7FAF9 80%, transparent)' }}>
                    <button
                        onClick={() => setShowReviewModal(true)}
                        disabled={wrongHanjas.length === 0}
                        className="pill-button-primary w-full max-w-md py-5 text-xl flex items-center justify-center gap-4 pointer-events-auto"
                    >
                        ⚡ START REVIEW SESSION
                        {wrongHanjas.length > 0 && (
                            <span className="bg-white/20 px-3 py-1 rounded-2xl text-xs font-extrabold">{wrongHanjas.length}</span>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // ── 결과 화면 ──
    if (mode === 'result') {
        return (
            <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-[100dvh] px-5 pt-8 pb-32 bg-[#F7FAF9]">
                <div className="premium-card-base w-full flex items-center justify-between p-5 px-8 bg-white border-[#E9EDF2] shadow-xl shrink-0 mt-2 relative z-20">
                    <button onClick={() => setMode('home')} className="w-11 h-11 rounded-full bg-[#F8FAF9] flex items-center justify-center font-extrabold text-xl active:scale-90 text-[#AEB7C5] border border-[#E9EDF2]">←</button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-h3-res font-extrabold text-[#5D544F] tracking-tight uppercase">Result</h1>
                        <span className="text-xs font-extrabold text-[#AEB7C5] uppercase tracking-[0.3em] mt-0.5">Session Summary</span>
                    </div>
                    <div className="w-11" />
                </div>
                <ResultScreen results={quizResults} total={quizResults?.total || targetList.length} onRetry={handleRetry} onBack={() => setMode('home')} />
            </div>
        );
    }

    // ── 복습 모드 ──
    const modeTitle = { quick: 'Quick Review', quiz: 'Focus Quiz', dictation: 'Dictation' };
    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-[100dvh] px-5 pt-8 pb-32 gap-10 bg-[#F7FAF9]">
            <div className="premium-card-base w-full flex items-center justify-between p-5 px-8 bg-white border-[#E9EDF2] shadow-xl shrink-0 mt-2 relative z-20">
                <button onClick={() => setMode('home')} className="w-11 h-11 rounded-full bg-[#F8FAF9] flex items-center justify-center font-extrabold text-xl active:scale-90 text-[#AEB7C5] border border-[#E9EDF2]">←</button>
                <div className="flex flex-col items-center">
                    <h1 className="text-h3-res font-extrabold text-[#5D544F] tracking-tight uppercase">{modeTitle[mode]}</h1>
                    <span className="text-xs font-extrabold text-[#AEB7C5] uppercase tracking-[0.3em] mt-0.5">{targetList.length} TARGET WORDS</span>
                </div>
                <div className="w-11" />
            </div>
            {mode === 'quick' && <QuickReview hanjas={targetList} onDone={handleDone} onMarkCorrect={markCorrect} onMarkWrong={markWrong} />}
            {mode === 'quiz' && <FocusQuiz hanjas={targetList} onDone={handleDone} onMarkCorrect={markCorrect} onMarkWrong={markWrong} />}
            {mode === 'dictation' && <Dictation hanjas={targetList} onDone={handleDone} onMarkCorrect={markCorrect} onMarkWrong={markWrong} />}
        </div>
    );
};

export default ReviewScreen;
