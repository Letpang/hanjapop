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

// ─── 달력 ───────────────────────────────────────────────────────────────────
const MissionCalendar = () => {
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);

    const history = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('mission_history') || '{}'); } catch { return {}; }
    }, []);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
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

    const cellStyle = {
        today:  'bg-indigo-500 text-white shadow-md',
        green:  'bg-emerald-400 text-white',
        red:    'bg-rose-200 dark:bg-rose-900/50 text-rose-400 dark:text-rose-300',
        future: 'text-slate-300 dark:text-slate-600',
    };

    return (
        <div className="clay-panel rounded-[2rem] w-full p-4 bg-white dark:bg-slate-800 border-4 border-white shadow-md">
            {/* Month nav */}
            <div className="flex justify-between items-center mb-3">
                <button
                    onClick={() => { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(null); }}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-black text-slate-600 dark:text-white active:scale-90"
                >‹</button>
                <span className="font-black text-slate-700 dark:text-white text-sm">{year}년 {month + 1}월</span>
                <button
                    onClick={() => { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(null); }}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-black text-slate-600 dark:text-white active:scale-90"
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
                    return (
                        <button
                            key={day}
                            onClick={() => clickable && setSelectedDay(isSelected ? null : ds)}
                            className={`aspect-square rounded-full flex items-center justify-center text-[10px] font-black transition-all ${clickable ? 'active:scale-90' : 'cursor-default'} ${cellStyle[state] || 'text-slate-300'} ${isSelected ? 'ring-2 ring-offset-1 ring-emerald-500' : ''}`}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex gap-3 mt-3 justify-center">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-400" /><span className="text-[9px] text-slate-400 font-bold">달성</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-rose-200" /><span className="text-[9px] text-slate-400 font-bold">미달성</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-indigo-500" /><span className="text-[9px] text-slate-400 font-bold">오늘</span></div>
            </div>

            {/* Selected day detail */}
            {selectedDay && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
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

// ─── 학습 진행도 ─────────────────────────────────────────────────────────────
const ProgressSection = ({ mastery }) => {
    const stats = useMemo(() => {
        const totalHanja = HANJA_DATA.length;
        const seenIds = Object.keys(mastery || {});
        const seenCount = seenIds.length;
        const masteredCount = seenIds.filter(id => (mastery[id]?.level || 0) >= 2).length;

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

        return {
            hanja: { total: totalHanja, done: masteredCount, incomplete: seenCount - masteredCount, unseen: totalHanja - seenCount },
            words: { total: totalWords, done: masteredWords, incomplete: seenWords - masteredWords, unseen: totalWords - seenWords },
        };
    }, [mastery]);

    const Box = ({ label, emoji, stats: s, color }) => (
        <div className={`flex-1 clay-panel rounded-[1.5rem] p-4 bg-white dark:bg-slate-800 border-4 border-white flex flex-col gap-3`}>
            <div className="flex items-center gap-2">
                <span className="text-xl">{emoji}</span>
                <span className="font-black text-slate-700 dark:text-white text-sm">{label}</span>
            </div>
            <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-emerald-500">✅ 학습완료</span>
                    <span className="text-sm font-black text-slate-700 dark:text-white">{s.done}개</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-amber-500">📖 학습중</span>
                    <span className="text-sm font-black text-slate-700 dark:text-white">{s.incomplete}개</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-400">🔒 미학습</span>
                    <span className="text-sm font-black text-slate-400">{s.unseen}개</span>
                </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(s.done / s.total) * 100}%`, background: color }}
                />
            </div>
            <span className="text-[10px] text-slate-400 font-bold text-right">{s.done} / {s.total}</span>
        </div>
    );

    return (
        <div className="w-full">
            <div className="text-slate-500 dark:text-slate-400 font-black text-sm mb-3">📊 나의 학습 진행도</div>
            <div className="flex gap-3">
                <Box label="한자 학습" emoji="漢" stats={stats.hanja} color="linear-gradient(90deg,#6366f1,#8b5cf6)" />
                <Box label="단어 학습" emoji="📚" stats={stats.words} color="linear-gradient(90deg,#10b981,#34d399)" />
            </div>
        </div>
    );
};

// ─── 오답 노트 ───────────────────────────────────────────────────────────────
const WrongSection = ({ wrongHanjas, onStartReview }) => {
    const [open, setOpen] = useState({ hanja: true, word: false, sentence: false, writing: false });

    const toggle = (key) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

    const wrongWords = useMemo(() => {
        const result = [];
        wrongHanjas.slice(0, 10).forEach(h => {
            (h.words || []).slice(0, 2).forEach(w => result.push({ ...w, hanja: h.hanja, wrongCount: h.wrongCount }));
        });
        return result;
    }, [wrongHanjas]);

    const AccordionItem = ({ id, emoji, label, count, children }) => (
        <div className="clay-panel rounded-[1.5rem] overflow-hidden bg-white dark:bg-slate-800 border-4 border-white">
            <button
                onClick={() => toggle(id)}
                className="w-full flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-700 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-xl">{emoji}</span>
                    <span className="font-black text-slate-700 dark:text-white text-sm">{label}</span>
                    {count > 0 && (
                        <span className="bg-rose-100 dark:bg-rose-900/40 text-rose-500 text-[10px] font-black px-2 py-0.5 rounded-full">{count}개</span>
                    )}
                </div>
                <span className={`text-slate-400 font-black text-lg transition-transform duration-200 ${open[id] ? 'rotate-180' : ''}`}>∨</span>
            </button>
            {open[id] && (
                <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3">
                    {children}
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 dark:text-slate-400 font-black text-sm">📝 오답 노트</span>
                {wrongHanjas.length > 0 && (
                    <button
                        onClick={onStartReview}
                        className="text-xs font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-700 active:scale-95 transition-all"
                    >
                        복습하기 →
                    </button>
                )}
            </div>
            <div className="flex flex-col gap-3">
                {/* 한자 오답 */}
                <AccordionItem id="hanja" emoji="漢" label="한자 오답" count={wrongHanjas.length}>
                    {wrongHanjas.length === 0 ? (
                        <div className="text-slate-400 text-sm text-center py-3">오답이 없어요 🎉</div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {wrongHanjas.slice(0, 15).map(h => (
                                <div key={h.id} className={`flex items-center gap-3 p-3 rounded-xl border ${h.urgency === 'urgent' ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : h.urgency === 'due' ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30'}`}>
                                    <span className="text-3xl font-black text-slate-700 dark:text-white w-10 text-center">{h.hanja}</span>
                                    <div className="flex flex-col flex-1">
                                        <span className="font-black text-slate-700 dark:text-slate-200 text-sm">{h.sound} · {h.meaning}</span>
                                        <span className="text-[10px] text-slate-400">{h.grade}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="bg-rose-100 dark:bg-rose-900/40 text-rose-500 text-[10px] font-black px-2 py-0.5 rounded-full">오답 {h.wrongCount}회</span>
                                        {h.urgency === 'urgent' && <span className="text-[9px] text-red-400 font-bold">3일 경과</span>}
                                        {h.urgency === 'due' && <span className="text-[9px] text-amber-400 font-bold">복습 권장</span>}
                                    </div>
                                </div>
                            ))}
                            {wrongHanjas.length > 15 && (
                                <div className="text-center text-slate-400 text-xs py-1">외 {wrongHanjas.length - 15}개 더…</div>
                            )}
                        </div>
                    )}
                </AccordionItem>

                {/* 단어 오답 */}
                <AccordionItem id="word" emoji="📖" label="단어 오답" count={wrongWords.length}>
                    {wrongWords.length === 0 ? (
                        <div className="text-slate-400 text-sm text-center py-3">오답이 없어요 🎉</div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {wrongWords.map((w, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                                    <span className="text-base font-black text-indigo-600 dark:text-indigo-300 w-16">{w.word}</span>
                                    <div className="flex flex-col flex-1">
                                        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{w.reading} — {w.meaning}</span>
                                        <span className="text-[10px] text-slate-400">{w.hanja} 관련</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </AccordionItem>

                {/* 문장 오답 */}
                <AccordionItem id="sentence" emoji="💬" label="문장 오답" count={0}>
                    <div className="text-center py-3">
                        <div className="text-2xl mb-2">🚧</div>
                        <div className="text-slate-400 text-sm font-bold">문장 퀴즈 오답 기록은<br />준비 중이에요</div>
                    </div>
                </AccordionItem>

                {/* 획순 오답 */}
                <AccordionItem id="writing" emoji="✍️" label="획순 오답" count={0}>
                    <div className="text-center py-3">
                        <div className="text-2xl mb-2">🚧</div>
                        <div className="text-slate-400 text-sm font-bold">획순 테스트 오답 기록은<br />준비 중이에요</div>
                    </div>
                </AccordionItem>
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
            <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-full px-6 pt-10 pb-32 gap-6">
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
                    <h1 className="text-3xl font-black text-slate-700 dark:text-white">학습 다이어리</h1>
                </div>

                {/* 달력 */}
                <MissionCalendar />

                {/* 학습 진행도 */}
                <ProgressSection mastery={mastery} />

                {/* 오답 노트 */}
                <WrongSection wrongHanjas={wrongHanjas} onStartReview={() => setShowReviewModal(true)} />
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
