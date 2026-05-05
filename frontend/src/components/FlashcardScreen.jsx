import { useState, useMemo } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { useLang } from '../LangContext.jsx';

// 총 출석일 읽기 (useTotalStats와 동일한 키)
const getTotalDays = () => {
    try {
        const saved = JSON.parse(localStorage.getItem('total_activity_stats') || '{}');
        return saved.totalDays || 1;
    } catch { return 1; }
};

// ─── 상세 학습지 모달 ──────────────────────────────────────────────────────
const HanjaDetailModal = ({ item, onClose, onWriteHanja }) => {
    const playAudio = () => {
        const audioId = String(item.id).padStart(2, '0');
        const audio = new Audio('/assets/audio/card_' + audioId + '.mp3');
        audio.play().catch(() => {});
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[3rem] sm:rounded-[3rem] border-4 border-white dark:border-slate-700 shadow-2xl overflow-y-auto max-h-[90dvh] animate-in slide-in-from-bottom duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="sticky top-0 z-10 flex justify-between items-center px-6 pt-6 pb-3 bg-white dark:bg-slate-900">
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{item.grade} · {item.category}</span>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black text-lg active:scale-90">✕</button>
                </div>

                <div className="px-6 pb-10 flex flex-col gap-6">
                    {/* 한자 + 이미지 */}
                    <div className="flex items-center gap-5">
                        <div className="w-28 h-28 shrink-0 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                            <img
                                src={`/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.webp`}
                                onError={e => {
                                    if (e.target.src.endsWith('.webp')) e.target.src = `/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.svg`;
                                    else e.target.src = '/assets/images/hanja_placeholder.png';
                                }}
                                className="w-full h-full object-contain p-2 mix-blend-multiply dark:mix-blend-normal"
                                alt={item.hanja}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-6xl font-black text-slate-700 dark:text-white leading-none">{item.hanja}</span>
                            <span className="text-2xl font-black text-indigo-500">{item.sound}</span>
                            <span className="text-lg font-bold text-slate-500 dark:text-slate-300">{item.meaning}</span>
                        </div>
                    </div>

                    {/* 어원 */}
                    {item.etymology_short && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl px-5 py-4 border border-amber-100 dark:border-amber-800">
                            <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">어원</p>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-200 leading-relaxed">{item.etymology_short}</p>
                        </div>
                    )}

                    {/* 단어 목록 */}
                    {item.words && item.words.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">관련 단어</p>
                            {item.words.map((w, i) => (
                                <div key={i} className="flex items-baseline justify-between bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-black text-base text-slate-700 dark:text-white">{w.word}</span>
                                        <span className="text-sm font-bold text-indigo-400">{w.reading}</span>
                                    </div>
                                    <span className="text-sm text-slate-500 dark:text-slate-400 font-bold">{w.meaning}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 액션 버튼 */}
                    <div className="flex gap-3">
                        <button
                            onClick={playAudio}
                            className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white font-black text-base border-2 border-slate-200 dark:border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span>🔊</span> 듣기
                        </button>
                        <button
                            onClick={() => { onClose(); if (onWriteHanja) onWriteHanja(item); }}
                            className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-black text-base shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span>✏️</span> 쓰기 연습
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── 한자 카드 (그리드용) ──────────────────────────────────────────────────
const HanjaCard = ({ item, isLocked, onClick }) => {
    if (isLocked) {
        return (
            <div className="relative w-full aspect-[3/4] rounded-[2rem] bg-slate-100 dark:bg-slate-800/60 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 select-none">
                <span className="text-3xl opacity-30">🔒</span>
                <span className="text-slate-300 dark:text-slate-600 font-black text-sm">{item.hanja}</span>
            </div>
        );
    }

    return (
        <button
            onClick={onClick}
            className="relative w-full aspect-[3/4] clay-panel !rounded-[2rem] flex flex-col items-center p-3 justify-between border-4 border-white dark:border-slate-700 overflow-hidden active:scale-95 transition-all cursor-pointer hover:-translate-y-1"
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent pointer-events-none z-10" />
            <div className="flex-1 flex items-center justify-center w-full min-h-0 py-2 relative z-0">
                <img
                    src={`/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.webp`}
                    onError={e => {
                        if (e.target.src.endsWith('.webp')) e.target.src = `/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.svg`;
                        else e.target.src = '/assets/images/hanja_placeholder.png';
                    }}
                    className="w-full h-full max-h-[80px] sm:max-h-[110px] object-contain drop-shadow-md mix-blend-multiply dark:mix-blend-normal"
                    alt={item.hanja}
                />
            </div>
            <div className="w-full bg-white/90 dark:bg-slate-800/90 rounded-xl py-2 text-center border border-slate-100 dark:border-slate-700 shrink-0 mt-1 relative z-20">
                <span className="text-2xl sm:text-3xl text-slate-700 dark:text-white font-black">{item.hanja}</span>
            </div>
        </button>
    );
};

// ─── 메인 FlashcardScreen ──────────────────────────────────────────────────
const FlashcardScreen = ({ onBack, onCardFlip, onWriteHanja }) => {
    const { t } = useLang();
    const [viewMode, setViewMode] = useState('grade');
    const [selectedGrade, setSelectedGrade] = useState('8급');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

    const totalDays = getTotalDays();
    const unlockedCount = totalDays * 2; // 하루 2개씩

    const categories = useMemo(() => [...new Set(HANJA_DATA.map(h => h.category).filter(Boolean))], []);

    const currentItems = useMemo(() => {
        if (viewMode === 'grade') {
            if (selectedGrade === '기타') return HANJA_DATA.filter(h => !h.grade || h.grade === '' || h.grade === '기타' || h.grade === 'NON');
            return HANJA_DATA.filter(h => h.grade === selectedGrade);
        }
        return HANJA_DATA.filter(h => h.category === selectedCategory);
    }, [viewMode, selectedGrade, selectedCategory]);

    // 전체 HANJA_DATA 기준 순서(id 순)로 몇 번째인지
    const sortedAll = useMemo(() => [...HANJA_DATA].sort((a, b) => a.id - b.id), []);
    const isUnlocked = (item) => {
        const globalIdx = sortedAll.findIndex(h => h.id === item.id);
        return globalIdx < unlockedCount;
    };

    const handleCardClick = (item) => {
        if (onCardFlip) onCardFlip(item.id);
        setSelectedItem(item);
    };

    // 잠금 해제된 카드 수 (현재 뷰 기준)
    const unlockedInView = currentItems.filter(isUnlocked).length;

    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden">
            {/* 헤더 */}
            <div className="w-full px-4 shrink-0 safe-top">
                <div className="w-full flex justify-between items-center clay-panel p-4 sm:p-6 px-6 sm:px-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl border-4 border-white dark:border-slate-700">
                    <button
                        onClick={onBack}
                        className="text-slate-600 dark:text-slate-200 font-black bg-white/60 dark:bg-slate-800/60 px-5 sm:px-10 py-2.5 sm:py-4 rounded-2xl border-2 border-white/50 shadow-md hover:bg-white active:scale-95 transition-all flex items-center gap-2"
                    >
                        <span className="text-xl sm:text-2xl">←</span>
                    </button>
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-700 dark:text-white tracking-tight premium-text-shadow text-center flex-1 px-4">
                        뭉치 학습지
                    </h1>
                    <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs font-black text-indigo-400">{unlockedCount}개 해금</span>
                        <span className="text-[10px] text-slate-400 font-bold">하루 2개씩</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 pb-32">
                <div className="w-full max-w-5xl mx-auto px-4 flex flex-col gap-6">
                    {/* 뷰 모드 + 필터 */}
                    <div className="flex bg-slate-100/60 dark:bg-slate-900/60 p-1.5 rounded-[2rem] border-2 border-white dark:border-slate-700 shadow-inner w-fit mx-auto">
                        <button onClick={() => setViewMode('grade')} className={`px-8 py-2.5 rounded-2xl font-black text-lg transition-all ${viewMode === 'grade' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}>급수별</button>
                        <button onClick={() => setViewMode('topic')} className={`px-8 py-2.5 rounded-2xl font-black text-lg transition-all ${viewMode === 'topic' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}>주제별</button>
                    </div>

                    {viewMode === 'grade' && (
                        <div className="flex gap-3 justify-center flex-wrap">
                            {['8급', '7급', '6급', '기타'].map(g => (
                                <button key={g} onClick={() => setSelectedGrade(g)}
                                    className={`px-7 py-3 rounded-[2rem] font-black text-lg border-4 transition-all ${selectedGrade === g ? 'bg-indigo-500 text-white border-white shadow-2xl scale-105' : 'bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40 shadow-lg'}`}>
                                    {g}
                                </button>
                            ))}
                        </div>
                    )}

                    {viewMode === 'topic' && (
                        <div className="flex flex-wrap gap-3 justify-center">
                            {categories.map(cat => (
                                <button key={cat} onClick={() => setSelectedCategory(cat)}
                                    className={`px-6 py-3 rounded-[2rem] font-black text-base border-4 whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-indigo-500 text-white border-white shadow-2xl scale-105' : 'bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40 shadow-lg'}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 해금 안내 */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl px-5 py-3 border border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
                        <span className="text-indigo-400 text-xl">📅</span>
                        <p className="text-sm font-bold text-indigo-500 dark:text-indigo-300">
                            이 목록에서 <strong>{unlockedInView}개</strong> 학습 가능 · 매일 2개씩 추가 해금
                        </p>
                    </div>

                    {/* 그리드 */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 md:gap-6">
                        {currentItems.map(item => (
                            <HanjaCard
                                key={item.id}
                                item={item}
                                isLocked={!isUnlocked(item)}
                                onClick={() => handleCardClick(item)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* 상세 모달 */}
            {selectedItem && (
                <HanjaDetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onWriteHanja={onWriteHanja}
                />
            )}
        </div>
    );
};

export default FlashcardScreen;
