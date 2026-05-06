import React, { useState, useMemo, useCallback } from 'react';
import HANJA_DATA from '../hanja_unified.json';

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
        try { return JSON.parse(localStorage.getItem('mission_history') || '{}'); } catch { return {}; }
    }, []);

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
        <div className="clay-panel rounded-[2rem] w-full p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 border-4 border-white shadow-lg">
            {/* Month nav */}
            <div className="flex justify-between items-center mb-3">
                <button
                    onClick={() => { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(null); }}
                    className="w-9 h-9 rounded-full bg-white/80 dark:bg-slate-700 flex items-center justify-center font-black text-slate-600 dark:text-white shadow-md active:scale-90 border border-white"
                >‹</button>
                <span className="font-black text-slate-700 dark:text-white text-sm">{year}년 {month + 1}월</span>
                <button
                    onClick={() => { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(null); }}
                    className="w-9 h-9 rounded-full bg-white/80 dark:bg-slate-700 flex items-center justify-center font-black text-slate-600 dark:text-white shadow-md active:scale-90 border border-white"
                >›</button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map(d => (
                    <div key={d} className="text-center text-[9px] font-bold text-slate-400 py-0.5">{d}</div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} />;
                    const state = getDayState(day);
                    const ds = getDayStr(day);
                    const isSelected = selectedDay === ds;
                    const clickable = state === 'green' || state === 'today';

                    if (state === 'today') {
                        return (
                            <button
                                key={day}
                                onClick={() => clickable && setSelectedDay(isSelected ? null : ds)}
                                className={`aspect-square flex items-center justify-center transition-all active:scale-90 ${isSelected ? 'scale-110' : ''}`}
                            >
                                {/* 3D 인디고 링 버튼 */}
                                <div className="w-full aspect-square rounded-full flex items-center justify-center relative"
                                    style={{
                                        background: 'linear-gradient(145deg, #818cf8, #4f46e5)',
                                        boxShadow: '0 4px 0 #3730a3, 0 6px 12px rgba(79,70,229,0.4)',
                                    }}>
                                    <span className="text-[10px] font-black text-white drop-shadow-sm">{day}</span>
                                </div>
                            </button>
                        );
                    }

                    if (state === 'green') {
                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(isSelected ? null : ds)}
                                className={`aspect-square flex items-center justify-center transition-all active:scale-90 ${isSelected ? 'scale-110' : ''}`}
                            >
                                {/* 3D 도장 자국 */}
                                <div className="w-full aspect-square rounded-full flex items-center justify-center relative"
                                    style={{
                                        background: 'linear-gradient(145deg, #6ee7b7, #10b981)',
                                        boxShadow: '0 3px 0 #059669, 0 5px 10px rgba(16,185,129,0.3)',
                                    }}>
                                    <span className="text-[10px] font-black text-white drop-shadow-sm">{day}</span>
                                </div>
                            </button>
                        );
                    }

                    if (state === 'red') {
                        return (
                            <div key={day} className="aspect-square flex items-center justify-center">
                                <div className="w-full aspect-square rounded-full flex items-center justify-center bg-rose-100 dark:bg-rose-900/30">
                                    <span className="text-[10px] font-bold text-rose-300 dark:text-rose-600">{day}</span>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={day} className="aspect-square flex items-center justify-center">
                            <span className="text-[10px] text-slate-300 dark:text-slate-600 font-bold">{day}</span>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-3 justify-center">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(145deg,#6ee7b7,#10b981)', boxShadow: '0 2px 0 #059669' }} />
                    <span className="text-[9px] text-slate-400 font-bold">달성</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-200" />
                    <span className="text-[9px] text-slate-400 font-bold">미달성</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(145deg,#818cf8,#4f46e5)', boxShadow: '0 2px 0 #3730a3' }} />
                    <span className="text-[9px] text-slate-400 font-bold">오늘</span>
                </div>
            </div>

            {/* Selected day detail */}
            {selectedDay && (
                <div className="mt-3 pt-3 border-t border-amber-100 dark:border-slate-700">
                    <div className="text-xs font-black text-slate-500 dark:text-slate-400 mb-2">
                        {selectedDay === todayStr ? '오늘' : selectedDay} 달성 미션
                    </div>
                    {(history[selectedDay] || []).length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                            {(history[selectedDay] || []).map(id => (
                                <div key={id} className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    <span>✅</span>
                                    <span>{MISSION_LABELS[id] || id}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-xs text-slate-400">달성한 미션이 없어요</div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── 학습 진행도 (스택형 바 차트) ─────────────────────────────────────────────
const ProgressSection = ({ mastery }) => {
    const stats = useMemo(() => {
        const totalHanja = HANJA_DATA.length;
        const seenIds = Object.keys(mastery || {});
        const seenCount = seenIds.length;
        const masteredCount = seenIds.filter(id => (mastery[id]?.level || 0) >= 2).length;
        const learningCount = seenCount - masteredCount;

        let totalWords = 0;
        let seenWords = 0;
        let masteredWords = 0;
        HANJA_DATA.forEach(h => {
            const words = h.words || [];
            totalWords += words.length;
            const m = mastery[String(h.id)];
            if (m) {
                seenWords += words.length;
                if ((m.level || 0) >= 2) masteredWords += words.length;
            }
        });
        const learningWords = seenWords - masteredWords;

        return {
            hanja: { total: totalHanja, done: masteredCount, learning: learningCount, unseen: totalHanja - seenCount },
            words: { total: totalWords, done: masteredWords, learning: learningWords, unseen: totalWords - seenWords },
        };
    }, [mastery]);

    const StackBar = ({ label, s }) => {
        const donePct = (s.done / s.total) * 100;
        const learningPct = (s.learning / s.total) * 100;
        const totalPct = Math.round((s.done / s.total) * 100);

        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-600 dark:text-slate-300">{label}</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-700 dark:text-white leading-none">{totalPct}%</span>
                        <span className="text-[10px] text-slate-400 font-bold">{s.done}/{s.total}</span>
                    </div>
                </div>
                {/* 스택형 바 */}
                <div className="w-full h-5 rounded-full overflow-hidden flex"
                    style={{
                        background: '#f1f5f9',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)',
                    }}>
                    {/* 완료 (민트) */}
                    {donePct > 0 && (
                        <div
                            className="h-full transition-all duration-700 relative"
                            style={{
                                width: `${donePct}%`,
                                background: 'linear-gradient(90deg, #6ee7b7, #34d399)',
                                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)',
                                borderRadius: learningPct > 0 ? '9999px 0 0 9999px' : '9999px',
                            }}
                        />
                    )}
                    {/* 학습중 (인디고) */}
                    {learningPct > 0 && (
                        <div
                            className="h-full transition-all duration-700"
                            style={{
                                width: `${learningPct}%`,
                                background: 'linear-gradient(90deg, #818cf8, #6366f1)',
                                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)',
                                borderRadius: donePct > 0 ? '0 9999px 9999px 0' : '9999px',
                            }}
                        />
                    )}
                </div>
                {/* 범례 */}
                <div className="flex gap-3">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#34d399' }} />
                        <span className="text-[9px] text-slate-400 font-bold">완료 {s.done}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#6366f1' }} />
                        <span className="text-[9px] text-slate-400 font-bold">학습중 {s.learning}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-200" />
                        <span className="text-[9px] text-slate-400 font-bold">미학습 {s.unseen}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="clay-panel rounded-[2rem] w-full p-5 bg-white dark:bg-slate-800 border-4 border-white shadow-md">
            <div className="text-slate-600 dark:text-slate-300 font-black text-sm mb-4">🔥 나의 열공 지수</div>
            <div className="flex flex-col gap-5">
                <StackBar label="한자 학습" s={stats.hanja} />
                <StackBar label="단어 학습" s={stats.words} />
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
        <div className="clay-panel rounded-[2rem] w-full p-5 bg-white dark:bg-slate-800 border-4 border-white shadow-md">
            <div className="text-slate-600 dark:text-slate-300 font-black text-sm mb-4">📊 요주의 한자 TOP {Math.min(5, top5.length)}</div>

            {/* 상태 칩 */}
            <div className="flex gap-2 mb-4 flex-wrap">
                <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 px-3 py-1.5 rounded-full">
                    <span className="text-xs">漢</span>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-300">한자 오답 {wrongHanjas.length}</span>
                </div>
                {sentenceWrong > 0 && (
                    <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 px-3 py-1.5 rounded-full">
                        <span className="text-xs">💬</span>
                        <span className="text-xs font-black text-purple-600 dark:text-purple-300">문장 오답 {sentenceWrong}</span>
                    </div>
                )}
                {writingWrong > 0 && (
                    <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 px-3 py-1.5 rounded-full">
                        <span className="text-xs">✍️</span>
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-300">획순 오답 {writingWrong}</span>
                    </div>
                )}
            </div>

            {/* 오답 랭킹 차트 */}
            {top5.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6">
                    <span className="text-3xl">🎉</span>
                    <span className="text-slate-400 text-sm font-bold">오답이 없어요!</span>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {top5.map((h, idx) => {
                        const barPct = (h.wrongCount / maxWrong) * 100;
                        const urgencyColor = h.urgency === 'urgent'
                            ? 'from-red-400 to-rose-500'
                            : h.urgency === 'due'
                            ? 'from-amber-400 to-orange-400'
                            : 'from-violet-400 to-purple-500';

                        return (
                            <div key={h.id} className="flex items-center gap-3">
                                {/* 순위 */}
                                <span className="text-[10px] font-black text-slate-300 w-3 text-center">{idx + 1}</span>
                                {/* 한자 */}
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                                    style={{
                                        background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
                                        boxShadow: '0 3px 0 #cbd5e1, 0 4px 8px rgba(0,0,0,0.08)',
                                    }}>
                                    <span className="text-xl font-black text-slate-700 dark:text-slate-800">{h.hanja}</span>
                                </div>
                                {/* 바 + 수치 */}
                                <div className="flex-1 flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{h.sound} · {h.meaning}</span>
                                        <span className="text-xs font-black text-purple-600 dark:text-purple-300">{fmtNum(h.wrongCount)}회</span>
                                    </div>
                                    <div className="w-full h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${urgencyColor} transition-all duration-700`}
                                            style={{
                                                width: `${barPct}%`,
                                                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4)',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {wrongHanjas.length > 5 && (
                        <div className="text-center text-slate-400 text-xs pt-1">외 {wrongHanjas.length - 5}개 더…</div>
                    )}
                </div>
            )}

            {/* 준비 중 안내 */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-300 dark:text-slate-600 font-bold">✨ 더 많은 분석 기능이 곧 추가돼요!</span>
            </div>
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
        <div className="flex flex-col items-center gap-6 w-full">
            <div className="text-slate-500 font-bold text-sm">{idx + 1} / {hanjas.length}</div>
            <div className="w-full max-w-sm h-56 cursor-pointer select-none" onClick={() => setFlipped(f => !f)}>
                <div className={`relative w-full h-full transition-all duration-500 ${flipped ? '[transform:rotateY(180deg)]' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
                    <div className="absolute inset-0 clay-panel rounded-[2rem] flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-800 border-4 border-white" style={{ backfaceVisibility: 'hidden' }}>
                        <div className="text-7xl font-black text-slate-700 dark:text-white">{current.hanja}</div>
                        <div className="text-slate-400 text-sm font-bold">탭해서 뒤집기</div>
                        {current.urgency === 'urgent' && <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">3일 경과</div>}
                    </div>
                    <div className="absolute inset-0 clay-panel rounded-[2rem] flex flex-col items-center justify-center gap-3 bg-indigo-50 dark:bg-indigo-900/40 border-4 border-indigo-200 dark:border-indigo-700" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <div className="text-4xl font-black text-indigo-600 dark:text-indigo-300">{current.sound}</div>
                        <div className="text-2xl font-bold text-slate-600 dark:text-slate-200">{current.meaning}</div>
                        <div className="text-red-400 text-sm font-bold">오답 {current.wrongCount}회</div>
                    </div>
                </div>
            </div>
            {flipped && (
                <div className="flex gap-4 w-full max-w-sm">
                    <button onClick={() => handleResult(false)} className="flex-1 py-4 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 font-black text-lg border-2 border-red-200 active:scale-95 transition-all">😓 아직 몰라</button>
                    <button onClick={() => handleResult(true)} className="flex-1 py-4 rounded-2xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 font-black text-lg border-2 border-green-200 active:scale-95 transition-all">✅ 알았어!</button>
                </div>
            )}
        </div>
    );
};

const FocusQuiz = ({ hanjas, onDone, onMarkCorrect, onMarkWrong }) => {
    const [idx, setIdx] = useState(0);
    const [selected, setSelected] = useState(null);
    const [correct, setCorrect] = useState(0);
    const current = hanjas[idx];
    const options = useMemo(() => current ? generateOptions(current, HANJA_DATA, 'meaning') : [], [idx]);

    const handleSelect = (opt) => {
        if (selected !== null) return;
        setSelected(opt.id);
        const nextCorrect = opt.isCorrect ? correct + 1 : correct;
        if (opt.isCorrect) { onMarkCorrect(current.id); setCorrect(nextCorrect); } else onMarkWrong(current.id);
        setTimeout(() => {
            if (idx + 1 >= hanjas.length) onDone({ correct: nextCorrect, wrong: hanjas.length - nextCorrect });
            else { setSelected(null); setIdx(i => i + 1); }
        }, 900);
    };

    if (!current) return null;
    return (
        <div className="flex flex-col items-center gap-6 w-full">
            <div className="text-slate-500 font-bold text-sm">{idx + 1} / {hanjas.length}</div>
            <div className="clay-panel rounded-[2rem] w-full max-w-sm p-8 flex flex-col items-center gap-3 bg-white dark:bg-slate-800 border-4 border-white">
                <div className="text-6xl font-black text-slate-700 dark:text-white">{current.hanja}</div>
                <div className="text-slate-400 text-sm font-bold">이 한자의 뜻은?</div>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {options.map(opt => {
                    let cls = 'py-4 px-3 rounded-2xl font-black text-base border-2 transition-all active:scale-95 ';
                    if (selected === null) cls += 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white';
                    else if (opt.isCorrect) cls += 'bg-green-100 border-green-400 text-green-700 scale-105';
                    else if (selected === opt.id) cls += 'bg-red-100 border-red-400 text-red-700';
                    else cls += 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400 opacity-60';
                    return <button key={opt.id} className={cls} onClick={() => handleSelect(opt)}>{opt.text}</button>;
                })}
            </div>
        </div>
    );
};

const Dictation = ({ hanjas, onDone, onMarkCorrect, onMarkWrong }) => {
    const [idx, setIdx] = useState(0);
    const [selected, setSelected] = useState(null);
    const [correct, setCorrect] = useState(0);
    const current = hanjas[idx];
    const options = useMemo(() => {
        if (!current) return [];
        const pool = HANJA_DATA.filter(h => h.id !== current.id).sort(() => Math.random() - 0.5).slice(0, 3);
        return [...pool, current].sort(() => Math.random() - 0.5).map(h => ({ id: h.id, text: h.hanja, isCorrect: h.id === current.id }));
    }, [idx]);

    const handleSelect = (opt) => {
        if (selected !== null) return;
        setSelected(opt.id);
        const nextCorrect = opt.isCorrect ? correct + 1 : correct;
        if (opt.isCorrect) { onMarkCorrect(current.id); setCorrect(nextCorrect); } else onMarkWrong(current.id);
        setTimeout(() => {
            if (idx + 1 >= hanjas.length) onDone({ correct: nextCorrect, wrong: hanjas.length - nextCorrect });
            else { setSelected(null); setIdx(i => i + 1); }
        }, 900);
    };

    if (!current) return null;
    return (
        <div className="flex flex-col items-center gap-6 w-full">
            <div className="text-slate-500 font-bold text-sm">{idx + 1} / {hanjas.length}</div>
            <div className="clay-panel rounded-[2rem] w-full max-w-sm p-8 flex flex-col items-center gap-2 bg-white dark:bg-slate-800 border-4 border-white">
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-300">{current.sound}</div>
                <div className="text-xl font-bold text-slate-600 dark:text-slate-200">{current.meaning}</div>
                <div className="text-slate-400 text-sm mt-2">이 뜻/음에 맞는 한자는?</div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                {options.map(opt => {
                    let cls = 'py-6 rounded-2xl font-black text-4xl border-2 transition-all active:scale-95 ';
                    if (selected === null) cls += 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white';
                    else if (opt.isCorrect) cls += 'bg-green-100 border-green-400 text-green-700 scale-105';
                    else if (selected === opt.id) cls += 'bg-red-100 border-red-400 text-red-700';
                    else cls += 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400 opacity-60';
                    return <button key={opt.id} className={cls} onClick={() => handleSelect(opt)}>{opt.text}</button>;
                })}
            </div>
        </div>
    );
};

const ResultScreen = ({ results, total, onRetry, onBack }) => {
    const pct = Math.round((results.correct / total) * 100);
    return (
        <div className="flex flex-col items-center gap-6 w-full py-8">
            <div className="text-6xl">{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '😓'}</div>
            <div className="text-3xl font-black text-slate-700 dark:text-white">{pct >= 80 ? '훌륭해요!' : pct >= 50 ? '조금만 더!' : '다시 도전!'}</div>
            <div className="clay-panel rounded-[2rem] w-full max-w-sm p-8 bg-white dark:bg-slate-800 border-4 border-white flex flex-col gap-4">
                <div className="flex justify-between"><span className="text-slate-500 font-bold">정답</span><span className="text-green-600 font-black text-xl">{results.correct}개</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-bold">오답</span><span className="text-red-500 font-black text-xl">{results.wrong}개</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-bold">정답률</span><span className="text-indigo-600 font-black text-xl">{pct}%</span></div>
            </div>
            <div className="flex gap-4 w-full max-w-sm">
                <button onClick={onRetry} className="flex-1 py-4 rounded-2xl bg-indigo-500 text-white font-black text-lg active:scale-95 transition-all">다시 하기</button>
                <button onClick={onBack} className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black text-lg active:scale-95 transition-all">목록으로</button>
            </div>
        </div>
    );
};

// ─── 복습 모드 선택 모달 ──────────────────────────────────────────────────────
const ReviewModeModal = ({ onClose, onStart, dueCount, totalCount }) => (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-lg clay-panel rounded-t-[3rem] p-6 pb-10 bg-white dark:bg-slate-800 border-t-4 border-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
                <h3 className="font-black text-slate-700 dark:text-white text-xl">오답 복습</h3>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold active:scale-90">✕</button>
            </div>
            <div className="flex flex-col gap-3 mb-5">
                <button onClick={() => onStart('quick', 'due')} disabled={dueCount === 0} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 active:scale-95 transition-all disabled:opacity-40">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl">🃏</div>
                    <div className="flex flex-col items-start">
                        <span className="font-black text-slate-700 dark:text-white">빠른 복습 (오늘 권장)</span>
                        <span className="text-slate-400 text-xs">플래시카드 · {dueCount}개</span>
                    </div>
                </button>
                <button onClick={() => onStart('quiz', 'all')} disabled={totalCount === 0} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 active:scale-95 transition-all disabled:opacity-40">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-2xl">📝</div>
                    <div className="flex flex-col items-start">
                        <span className="font-black text-slate-700 dark:text-white">집중 퀴즈</span>
                        <span className="text-slate-400 text-xs">4지선다 · 전체 {totalCount}개</span>
                    </div>
                </button>
                <button onClick={() => onStart('dictation', 'all')} disabled={totalCount === 0} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 active:scale-95 transition-all disabled:opacity-40">
                    <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl">✍️</div>
                    <div className="flex flex-col items-start">
                        <span className="font-black text-slate-700 dark:text-white">받아쓰기</span>
                        <span className="text-slate-400 text-xs">음/뜻 → 한자 선택 · {totalCount}개</span>
                    </div>
                </button>
            </div>
        </div>
    </div>
);

// ─── 메인 ReviewScreen ────────────────────────────────────────────────────────
const ReviewScreen = ({ onBack, mastery, markCorrect, markWrong, getStats }) => {
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
        return (
            <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-full px-4 pt-6 pb-36 gap-5">
                {showReviewModal && (
                    <ReviewModeModal
                        onClose={() => setShowReviewModal(false)}
                        onStart={handleStart}
                        dueCount={dueHanjas.length}
                        totalCount={wrongHanjas.length}
                    />
                )}

                {/* 헤더 */}
                <div className="w-full flex items-center gap-4">
                    <button onClick={onBack} className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 flex items-center justify-center font-black text-xl active:scale-90 transition-all shadow-md">←</button>
                    <h1 className="text-2xl font-black text-slate-700 dark:text-white">학습 다이어리</h1>
                </div>

                {/* 달력 */}
                <MissionCalendar />

                {/* 학습 진행도 */}
                <ProgressSection mastery={mastery} />

                {/* 오답 섹션 */}
                <WrongSection wrongHanjas={wrongHanjas} />

                {/* 하단 고정 복습하기 버튼 */}
                <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-6 pt-3"
                    style={{ background: 'linear-gradient(to top, rgba(248,250,252,0.98) 70%, transparent)' }}>
                    <button
                        onClick={() => setShowReviewModal(true)}
                        disabled={wrongHanjas.length === 0}
                        className="w-full max-w-md py-4 rounded-[1.5rem] font-black text-lg text-white disabled:opacity-40 active:scale-[0.98] transition-all"
                        style={{
                            background: wrongHanjas.length > 0
                                ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                                : '#e2e8f0',
                            boxShadow: wrongHanjas.length > 0
                                ? '0 6px 0 #b45309, 0 8px 20px rgba(245,158,11,0.4)'
                                : 'none',
                        }}
                    >
                        ⚡ 지금 바로 복습하기
                        {wrongHanjas.length > 0 && (
                            <span className="ml-2 text-sm font-bold opacity-80">{wrongHanjas.length}개</span>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // ── 결과 화면 ──
    if (mode === 'result') {
        return (
            <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-full px-6 pt-10 pb-32">
                <div className="w-full flex items-center gap-4 mb-8">
                    <button onClick={() => setMode('home')} className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 flex items-center justify-center font-black text-xl active:scale-90 transition-all shadow-md">←</button>
                    <h1 className="text-2xl font-black text-slate-700 dark:text-white">결과</h1>
                </div>
                <ResultScreen results={quizResults} total={quizResults?.total || targetList.length} onRetry={handleRetry} onBack={() => setMode('home')} />
            </div>
        );
    }

    // ── 복습 모드 ──
    const modeTitle = { quick: '빠른 복습', quiz: '집중 퀴즈', dictation: '받아쓰기' };
    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-full px-6 pt-10 pb-32 gap-6">
            <div className="w-full flex items-center gap-4">
                <button onClick={() => setMode('home')} className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 flex items-center justify-center font-black text-xl active:scale-90 transition-all shadow-md">←</button>
                <h1 className="text-2xl font-black text-slate-700 dark:text-white">{modeTitle[mode]}</h1>
                <span className="ml-auto text-slate-400 text-sm font-bold">{targetList.length}개</span>
            </div>
            {mode === 'quick' && <QuickReview hanjas={targetList} onDone={handleDone} onMarkCorrect={markCorrect} onMarkWrong={markWrong} />}
            {mode === 'quiz' && <FocusQuiz hanjas={targetList} onDone={handleDone} onMarkCorrect={markCorrect} onMarkWrong={markWrong} />}
            {mode === 'dictation' && <Dictation hanjas={targetList} onDone={handleDone} onMarkCorrect={markCorrect} onMarkWrong={markWrong} />}
        </div>
    );
};

export default ReviewScreen;
