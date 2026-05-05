/**
 * ReviewScreen.jsx
 * 오답노트 화면
 * - 진입 화면: 오답 현황 요약 (오늘 복습할 카드, 틀린 한자 목록, 취약 급수)
 * - 복습 모드 3종: 빠른 복습 / 집중 퀴즈 / 받아쓰기
 * - 망각 곡선: 1일 이상 → 복습 권장, 3일 이상 → 강조 표시
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import HANJA_DATA from '../hanja_unified.json';

const DAY_MS = 24 * 60 * 60 * 1000;

// 망각 곡선 상태 계산
const getReviewUrgency = (lastWrong) => {
    if (!lastWrong) return 'none';
    const diff = Date.now() - new Date(lastWrong).getTime();
    if (diff >= 3 * DAY_MS) return 'urgent';   // 3일 이상 → 빨간 강조
    if (diff >= 1 * DAY_MS) return 'due';       // 1일 이상 → 복습 권장
    return 'recent';                             // 오늘 틀림
};

// 오답 한자 목록 추출 (wrongCount > 0 인 것들)
const getWrongHanjas = (mastery) => {
    return HANJA_DATA
        .filter(h => {
            const m = mastery[String(h.id)];
            return m && (m.wrongCount || 0) > 0;
        })
        .map(h => {
            const m = mastery[String(h.id)];
            return {
                ...h,
                wrongCount: m.wrongCount || 0,
                lastWrong: m.lastWrong || null,
                level: m.level,
                streak: m.streak || 0,
                urgency: getReviewUrgency(m.lastWrong)
            };
        })
        .sort((a, b) => b.wrongCount - a.wrongCount); // 오답 많은 순
};

// 오늘 복습 권장 목록 (1일 이상 지난 오답)
const getDueHanjas = (wrongHanjas) =>
    wrongHanjas.filter(h => h.urgency === 'due' || h.urgency === 'urgent');

// 취약 급수 계산
const getWeakGrades = (wrongHanjas) => {
    const gradeCount = {};
    wrongHanjas.forEach(h => {
        const g = h.grade || '미분류';
        gradeCount[g] = (gradeCount[g] || 0) + h.wrongCount;
    });
    return Object.entries(gradeCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
};

// 4지선다 오답 보기 생성
const generateOptions = (correct, allHanjas, type = 'meaning') => {
    const pool = allHanjas.filter(h => h.id !== correct.id);
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [...shuffled, correct].sort(() => Math.random() - 0.5);
    return options.map(h => ({
        id: h.id,
        text: type === 'meaning' ? h.meaning : h.sound,
        isCorrect: h.id === correct.id
    }));
};

// ─── 서브 컴포넌트: 빠른 복습 (플래시카드) ───────────────────────────────
const QuickReview = ({ hanjas, onDone, onMarkCorrect, onMarkWrong }) => {
    const [idx, setIdx] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [results, setResults] = useState({ correct: 0, wrong: 0 });

    const current = hanjas[idx];

    const handleResult = (isCorrect) => {
        if (isCorrect) {
            onMarkCorrect(current.id);
        } else {
            onMarkWrong(current.id);
        }
        setFlipped(false);
        setResults(prev => {
            const updated = isCorrect
                ? { ...prev, correct: prev.correct + 1 }
                : { ...prev, wrong: prev.wrong + 1 };
            if (idx + 1 >= hanjas.length) {
                setTimeout(() => onDone(updated), 300);
            }
            return updated;
        });
        if (idx + 1 < hanjas.length) {
            setIdx(i => i + 1);
        }
    };

    if (!current) return null;

    return (
        <div className="flex flex-col items-center gap-6 w-full">
            <div className="text-slate-500 font-bold text-sm">{idx + 1} / {hanjas.length}</div>

            {/* 카드 */}
            <div
                className="w-full max-w-sm h-56 cursor-pointer select-none"
                onClick={() => setFlipped(f => !f)}
            >
                <div className={`relative w-full h-full transition-all duration-500 ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
                    style={{ transformStyle: 'preserve-3d' }}>
                    {/* 앞면: 한자 */}
                    <div className="absolute inset-0 clay-panel rounded-[2rem] flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-800 border-4 border-white"
                        style={{ backfaceVisibility: 'hidden' }}>
                        <div className="text-7xl font-black text-slate-700 dark:text-white">{current.hanja}</div>
                        <div className="text-slate-400 text-sm font-bold">탭해서 뒤집기</div>
                        {current.urgency === 'urgent' && (
                            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">3일 경과</div>
                        )}
                    </div>
                    {/* 뒷면: 음/뜻 */}
                    <div className="absolute inset-0 clay-panel rounded-[2rem] flex flex-col items-center justify-center gap-3 bg-indigo-50 dark:bg-indigo-900/40 border-4 border-indigo-200 dark:border-indigo-700"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <div className="text-4xl font-black text-indigo-600 dark:text-indigo-300">{current.sound}</div>
                        <div className="text-2xl font-bold text-slate-600 dark:text-slate-200">{current.meaning}</div>
                        <div className="text-red-400 text-sm font-bold">오답 {current.wrongCount}회</div>
                    </div>
                </div>
            </div>

            {flipped && (
                <div className="flex gap-4 w-full max-w-sm">
                    <button
                        onClick={() => handleResult(false)}
                        className="flex-1 py-4 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 font-black text-lg border-2 border-red-200 active:scale-95 transition-all"
                    >
                        😓 아직 몰라
                    </button>
                    <button
                        onClick={() => handleResult(true)}
                        className="flex-1 py-4 rounded-2xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 font-black text-lg border-2 border-green-200 active:scale-95 transition-all"
                    >
                        ✅ 알았어!
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── 서브 컴포넌트: 집중 퀴즈 (4지선다) ─────────────────────────────────
const FocusQuiz = ({ hanjas, onDone, onMarkCorrect, onMarkWrong }) => {
    const [idx, setIdx] = useState(0);
    const [selected, setSelected] = useState(null);
    const [correct, setCorrect] = useState(0);

    const current = hanjas[idx];
    const options = useMemo(() => current ? generateOptions(current, HANJA_DATA, 'meaning') : [], [idx]);

    const handleSelect = (opt) => {
        if (selected !== null) return;
        setSelected(opt.id);
        if (opt.isCorrect) {
            onMarkCorrect(current.id);
            setCorrect(c => c + 1);
        } else {
            onMarkWrong(current.id);
        }
        setTimeout(() => {
            if (idx + 1 >= hanjas.length) {
                onDone({ correct: opt.isCorrect ? correct + 1 : correct, wrong: hanjas.length - (opt.isCorrect ? correct + 1 : correct) });
            } else {
                setSelected(null);
                setIdx(i => i + 1);
            }
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
                    if (selected === null) {
                        cls += 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white';
                    } else if (opt.isCorrect) {
                        cls += 'bg-green-100 border-green-400 text-green-700 scale-105';
                    } else if (selected === opt.id) {
                        cls += 'bg-red-100 border-red-400 text-red-700';
                    } else {
                        cls += 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400 opacity-60';
                    }
                    return (
                        <button key={opt.id} className={cls} onClick={() => handleSelect(opt)}>
                            {opt.text}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ─── 서브 컴포넌트: 받아쓰기 (음/뜻 보고 한자 선택) ────────────────────
const Dictation = ({ hanjas, onDone, onMarkCorrect, onMarkWrong }) => {
    const [idx, setIdx] = useState(0);
    const [selected, setSelected] = useState(null);
    const [correct, setCorrect] = useState(0);

    const current = hanjas[idx];
    const options = useMemo(() => {
        if (!current) return [];
        const pool = HANJA_DATA.filter(h => h.id !== current.id).sort(() => Math.random() - 0.5).slice(0, 3);
        return [...pool, current].sort(() => Math.random() - 0.5).map(h => ({
            id: h.id,
            text: h.hanja,
            isCorrect: h.id === current.id
        }));
    }, [idx]);

    const handleSelect = (opt) => {
        if (selected !== null) return;
        setSelected(opt.id);
        if (opt.isCorrect) {
            onMarkCorrect(current.id);
            setCorrect(c => c + 1);
        } else {
            onMarkWrong(current.id);
        }
        setTimeout(() => {
            if (idx + 1 >= hanjas.length) {
                onDone({ correct: opt.isCorrect ? correct + 1 : correct, wrong: hanjas.length - (opt.isCorrect ? correct + 1 : correct) });
            } else {
                setSelected(null);
                setIdx(i => i + 1);
            }
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
                    if (selected === null) {
                        cls += 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white';
                    } else if (opt.isCorrect) {
                        cls += 'bg-green-100 border-green-400 text-green-700 scale-105';
                    } else if (selected === opt.id) {
                        cls += 'bg-red-100 border-red-400 text-red-700';
                    } else {
                        cls += 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400 opacity-60';
                    }
                    return (
                        <button key={opt.id} className={cls} onClick={() => handleSelect(opt)}>
                            {opt.text}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ─── 결과 화면 ────────────────────────────────────────────────────────────
const ResultScreen = ({ results, total, onRetry, onBack }) => {
    const pct = Math.round((results.correct / total) * 100);
    return (
        <div className="flex flex-col items-center gap-6 w-full py-8">
            <div className="text-6xl">{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '😓'}</div>
            <div className="text-3xl font-black text-slate-700 dark:text-white">
                {pct >= 80 ? '훌륭해요!' : pct >= 50 ? '조금만 더!' : '다시 도전!'}
            </div>
            <div className="clay-panel rounded-[2rem] w-full max-w-sm p-8 bg-white dark:bg-slate-800 border-4 border-white flex flex-col gap-4">
                <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">정답</span>
                    <span className="text-green-600 font-black text-xl">{results.correct}개</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">오답</span>
                    <span className="text-red-500 font-black text-xl">{results.wrong}개</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">정답률</span>
                    <span className="text-indigo-600 font-black text-xl">{pct}%</span>
                </div>
            </div>
            <div className="flex gap-4 w-full max-w-sm">
                <button onClick={onRetry} className="flex-1 py-4 rounded-2xl bg-indigo-500 text-white font-black text-lg active:scale-95 transition-all">
                    다시 하기
                </button>
                <button onClick={onBack} className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black text-lg active:scale-95 transition-all">
                    목록으로
                </button>
            </div>
        </div>
    );
};

// ─── 메인 ReviewScreen ────────────────────────────────────────────────────
const ReviewScreen = ({ onBack, mastery, markCorrect, markWrong }) => {
    const [mode, setMode] = useState('home'); // home | quick | quiz | dictation | result
    const [reviewTarget, setReviewTarget] = useState('all'); // all | due
    const [quizResults, setQuizResults] = useState(null);
    const [activeMode, setActiveMode] = useState(null);

    const wrongHanjas = useMemo(() => getWrongHanjas(mastery), [mastery]);
    const dueHanjas = useMemo(() => getDueHanjas(wrongHanjas), [wrongHanjas]);
    const weakGrades = useMemo(() => getWeakGrades(wrongHanjas), [wrongHanjas]);

    const targetList = reviewTarget === 'due' ? dueHanjas : wrongHanjas;

    const handleDone = (results) => {
        setQuizResults({ ...results, total: targetList.length });
        setMode('result');
    };

    const handleRetry = () => {
        setQuizResults(null);
        setMode(activeMode);
    };

    const startMode = (m) => {
        setActiveMode(m);
        setMode(m);
    };

    // ── 홈 화면 ──
    if (mode === 'home') {
        return (
            <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-full px-6 pt-10 pb-32 gap-6">
                {/* 헤더 */}
                <div className="w-full flex items-center gap-4">
                    <button onClick={onBack} className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 flex items-center justify-center font-black text-xl active:scale-90 transition-all shadow-md">
                        ←
                    </button>
                    <h1 className="text-3xl font-black text-slate-700 dark:text-white">오답노트</h1>
                </div>

                {/* 오답 없을 때 */}
                {wrongHanjas.length === 0 ? (
                    <div className="clay-panel rounded-[2rem] w-full p-10 bg-white dark:bg-slate-800 border-4 border-white flex flex-col items-center gap-4 mt-8">
                        <div className="text-6xl">🎉</div>
                        <div className="text-xl font-black text-slate-700 dark:text-white text-center">오답이 없어요!</div>
                        <div className="text-slate-400 text-sm text-center">퀴즈나 게임을 더 풀면<br/>오답이 여기 쌓여요</div>
                    </div>
                ) : (
                    <>
                        {/* 요약 카드 */}
                        <div className="clay-panel rounded-[2rem] w-full p-6 bg-white dark:bg-slate-800 border-4 border-white flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">오늘 복습 권장</span>
                                    <span className="text-3xl font-black text-indigo-600 dark:text-indigo-300">{dueHanjas.length}개</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">전체 오답</span>
                                    <span className="text-3xl font-black text-red-500">{wrongHanjas.length}개</span>
                                </div>
                            </div>

                            {/* 취약 급수 */}
                            {weakGrades.length > 0 && (
                                <div className="mt-2">
                                    <div className="text-slate-400 text-xs font-bold mb-2">취약 급수</div>
                                    <div className="flex gap-2 flex-wrap">
                                        {weakGrades.map(([grade, count]) => (
                                            <span key={grade} className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs font-black px-3 py-1 rounded-full border border-red-200">
                                                {grade} ({count}회 오답)
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 복습 대상 선택 */}
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setReviewTarget('due')}
                                className={`flex-1 py-3 rounded-2xl font-black text-sm border-2 transition-all ${reviewTarget === 'due' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-white border-slate-200 dark:border-slate-600'}`}
                            >
                                오늘 복습 ({dueHanjas.length}개)
                            </button>
                            <button
                                onClick={() => setReviewTarget('all')}
                                className={`flex-1 py-3 rounded-2xl font-black text-sm border-2 transition-all ${reviewTarget === 'all' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-white border-slate-200 dark:border-slate-600'}`}
                            >
                                전체 오답 ({wrongHanjas.length}개)
                            </button>
                        </div>

                        {/* 복습 모드 3종 */}
                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={() => startMode('quick')}
                                disabled={targetList.length === 0}
                                className="w-full clay-panel rounded-[1.5rem] p-5 bg-white dark:bg-slate-800 border-4 border-white flex items-center gap-4 active:scale-95 transition-all disabled:opacity-40"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-3xl shrink-0">🃏</div>
                                <div className="flex flex-col items-start">
                                    <span className="font-black text-slate-700 dark:text-white text-lg">빠른 복습</span>
                                    <span className="text-slate-400 text-sm">플래시카드로 빠르게 훑기</span>
                                </div>
                                <span className="ml-auto text-slate-300 text-2xl">›</span>
                            </button>

                            <button
                                onClick={() => startMode('quiz')}
                                disabled={targetList.length === 0}
                                className="w-full clay-panel rounded-[1.5rem] p-5 bg-white dark:bg-slate-800 border-4 border-white flex items-center gap-4 active:scale-95 transition-all disabled:opacity-40"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-3xl shrink-0">📝</div>
                                <div className="flex flex-col items-start">
                                    <span className="font-black text-slate-700 dark:text-white text-lg">집중 퀴즈</span>
                                    <span className="text-slate-400 text-sm">틀린 한자만 4지선다 퀴즈</span>
                                </div>
                                <span className="ml-auto text-slate-300 text-2xl">›</span>
                            </button>

                            <button
                                onClick={() => startMode('dictation')}
                                disabled={targetList.length === 0}
                                className="w-full clay-panel rounded-[1.5rem] p-5 bg-white dark:bg-slate-800 border-4 border-white flex items-center gap-4 active:scale-95 transition-all disabled:opacity-40"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-3xl shrink-0">✍️</div>
                                <div className="flex flex-col items-start">
                                    <span className="font-black text-slate-700 dark:text-white text-lg">받아쓰기</span>
                                    <span className="text-slate-400 text-sm">음/뜻 보고 한자 선택</span>
                                </div>
                                <span className="ml-auto text-slate-300 text-2xl">›</span>
                            </button>
                        </div>

                        {/* 오답 한자 목록 */}
                        <div className="w-full">
                            <div className="text-slate-500 font-black text-sm mb-3">오답 한자 목록 (오답 많은 순)</div>
                            <div className="flex flex-col gap-2">
                                {wrongHanjas.slice(0, 20).map(h => (
                                    <div key={h.id} className={`clay-panel rounded-2xl p-4 bg-white dark:bg-slate-800 border-2 flex items-center gap-4 ${h.urgency === 'urgent' ? 'border-red-300 dark:border-red-700' : h.urgency === 'due' ? 'border-amber-200 dark:border-amber-700' : 'border-white dark:border-slate-700'}`}>
                                        <div className="text-4xl font-black text-slate-700 dark:text-white w-12 text-center">{h.hanja}</div>
                                        <div className="flex flex-col flex-1">
                                            <span className="font-black text-slate-600 dark:text-slate-200">{h.sound} · {h.meaning}</span>
                                            <span className="text-slate-400 text-xs">{h.grade}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs font-black px-2 py-0.5 rounded-full">
                                                오답 {h.wrongCount}회
                                            </span>
                                            {h.urgency === 'urgent' && (
                                                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">3일 경과</span>
                                            )}
                                            {h.urgency === 'due' && (
                                                <span className="bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full">복습 권장</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {wrongHanjas.length > 20 && (
                                    <div className="text-center text-slate-400 text-sm py-2">외 {wrongHanjas.length - 20}개 더...</div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

    // ── 복습 모드 화면 ──
    const modeTitle = { quick: '빠른 복습', quiz: '집중 퀴즈', dictation: '받아쓰기' };

    if (mode === 'result') {
        return (
            <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-full px-6 pt-10 pb-32">
                <div className="w-full flex items-center gap-4 mb-8">
                    <button onClick={() => setMode('home')} className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 flex items-center justify-center font-black text-xl active:scale-90 transition-all shadow-md">
                        ←
                    </button>
                    <h1 className="text-2xl font-black text-slate-700 dark:text-white">결과</h1>
                </div>
                <ResultScreen
                    results={quizResults}
                    total={quizResults?.total || targetList.length}
                    onRetry={handleRetry}
                    onBack={() => setMode('home')}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-full px-6 pt-10 pb-32 gap-6">
            <div className="w-full flex items-center gap-4">
                <button onClick={() => setMode('home')} className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 flex items-center justify-center font-black text-xl active:scale-90 transition-all shadow-md">
                    ←
                </button>
                <h1 className="text-2xl font-black text-slate-700 dark:text-white">{modeTitle[mode]}</h1>
                <span className="ml-auto text-slate-400 text-sm font-bold">{targetList.length}개</span>
            </div>

            {mode === 'quick' && (
                <QuickReview
                    hanjas={targetList}
                    onDone={handleDone}
                    onMarkCorrect={markCorrect}
                    onMarkWrong={markWrong}
                />
            )}
            {mode === 'quiz' && (
                <FocusQuiz
                    hanjas={targetList}
                    onDone={handleDone}
                    onMarkCorrect={markCorrect}
                    onMarkWrong={markWrong}
                />
            )}
            {mode === 'dictation' && (
                <Dictation
                    hanjas={targetList}
                    onDone={handleDone}
                    onMarkCorrect={markCorrect}
                    onMarkWrong={markWrong}
                />
            )}
        </div>
    );
};

export default ReviewScreen;
