import { useState, useMemo, useEffect, useRef } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { useLang } from '../LangContext.jsx';

const Flashcard = ({ item, isLocked, onFlip }) => {
    const { lang } = useLang();
    const [flipped, setFlipped] = useState(false);
    const [selectedWord, setSelectedWord] = useState(null);

    const handleFlip = () => {
        if (isLocked) return;
        
        // Toggle flip state
        const nextFlipped = !flipped;
        setFlipped(nextFlipped);
        
        // Only trigger audio and progress when flipping to back (revealing meaning)
        if (nextFlipped) {
            onFlip(item.id, item.stage);
            const audioId = String(item.id).padStart(2, '0');
            const audio = new Audio('/assets/audio/card_' + audioId + '.mp3');
            audio.play().catch(() => {});
        }
    };

    const meaning = lang === 'en' ? (item.meaning_en || item.meaning) : item.meaning;

    const quizInfo = item;

    return (
        <div
            className={"relative w-full max-w-[170px] md:max-w-[220px] aspect-[3/4] shrink-0 " +
                (isLocked ? "cursor-not-allowed" : "cursor-pointer")}
            onClick={handleFlip}
        >
            {/* Front Face - PREMIUM GLOSSY */}
            <div className={"card-face-front clay-panel !rounded-[2.5rem] flex flex-col items-center p-3 sm:p-5 justify-between border-4 border-white dark:border-slate-700 overflow-hidden " + (flipped ? "is-flipped" : "")}>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent pointer-events-none z-10"></div>
                <div className="flex-1 flex items-center justify-center w-full min-h-0 py-2 relative z-0">
                    <img
                        src={`/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.webp`}
                        onError={(e) => {
                            if (e.target.src.endsWith('.webp')) {
                                e.target.src = `/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.svg`;
                            } else {
                                e.target.src = '/assets/images/hanja_placeholder.png';
                            }
                        }}
                        className="w-full h-full max-h-[90px] sm:max-h-[130px] md:max-h-[160px] object-contain drop-shadow-2xl transition-transform group-hover:scale-110 mix-blend-multiply dark:mix-blend-normal"
                        alt={item.hanja}
                    />
                </div>
                <div className="w-full bg-white/90 dark:bg-slate-800/90 rounded-2xl py-3 text-center border-2 border-slate-100 dark:border-slate-700 shadow-inner shrink-0 mt-2 flex items-center justify-center relative z-20">
                    <span className="text-3xl sm:text-5xl text-slate-700 dark:text-white font-black tracking-tighter premium-text-shadow" style={{fontFamily: "'Noto Sans KR', 'SUIT', sans-serif"}}>{item.hanja}</span>
                </div>
            </div>

            {/* Back Face - PREMIUM CLAY */}
            <div className={"card-face-back clay-panel !rounded-[2.5rem] flex flex-col items-center justify-center p-4 border-4 border-white dark:border-slate-700 !bg-slate-50 dark:!bg-slate-900 " + (flipped ? "is-flipped" : "")}>
                {/* Hun & Eum */}
                <div className="w-full flex flex-col items-center px-2">
                    <span className="text-indigo-500 font-black text-2xl sm:text-3xl leading-tight">{item.sound}</span>
                    <span className="text-slate-600 dark:text-slate-300 font-black text-xs sm:text-sm leading-snug text-center mt-1 break-keep">{item.meaning}</span>
                    <div className="w-12 h-1 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mt-3"></div>
                </div>

                {/* Vocabulary Icon Button */}
                {quizInfo?.words?.length > 0 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setSelectedWord(true); }}
                        className="mt-4 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-2xl border-2 border-indigo-100 dark:border-indigo-800 shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <span className="text-xl">📖</span>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">단어</span>
                    </button>
                )}
            </div>

            {/* Vocabulary List - OVERLAY POPUP (카드 밖으로 튀어나옴) */}
            {selectedWord && (
                <div
                    className="absolute inset-0 z-[100] flex items-center justify-center animate-in fade-in zoom-in-95 duration-200"
                    style={{ margin: '-20px' }}
                    onClick={(e) => { e.stopPropagation(); setSelectedWord(null); }}
                >
                    <div
                        className="clay-panel p-4 !rounded-[2rem] border-[3px] border-indigo-400 bg-white dark:bg-slate-800 flex flex-col shadow-2xl shadow-indigo-200/50 dark:shadow-none"
                        style={{ width: 'calc(100% - 8px)', maxHeight: '320px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">단어장</span>
                            <button onClick={() => setSelectedWord(null)} className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 text-sm font-black">✕</button>
                        </div>

                        <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar">
                            {quizInfo?.words?.map((w, idx) => (
                                <div key={idx} className="bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <span className="font-black text-sm text-slate-700 dark:text-white">{w.word}</span>
                                        <span className="text-[11px] font-bold text-indigo-400 shrink-0">{w.reading}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">{w.meaning}</div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setSelectedWord(null)}
                            className="mt-3 w-full py-2 bg-indigo-500 text-white text-xs font-black rounded-xl shadow-md hover:bg-indigo-600 active:scale-95 transition-all"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const FlashcardScreen = ({ onBack, onStageClear, unlockedStages, onCardFlip }) => {
    const { t } = useLang();
    const [viewMode, setViewMode] = useState('grade');
    const [viewedIds, setViewedIds] = useState(new Set());
    const [selectedGrade, setSelectedGrade] = useState('8급');

    const gradeData = useMemo(() => {
        if (selectedGrade === '기타') {
            return HANJA_DATA.filter(h => !h.grade || h.grade === '' || h.grade === '기타' || h.grade === 'NON');
        }
        return HANJA_DATA.filter(h => h.grade === selectedGrade);
    }, [selectedGrade]);

    const categories = useMemo(() => {
        const cats = [...new Set(HANJA_DATA.map(h => h.category).filter(Boolean))];
        return cats;
    }, []);

    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');

    const currentStageItems = useMemo(() => {
        if (viewMode === 'grade') return gradeData;
        return HANJA_DATA.filter(h => h.category === selectedCategory);
    }, [viewMode, gradeData, selectedCategory]);

    const handleCardFlip = (id) => {
        // 숫달도 + 미션 연동: 카드를 처음 보는 순간 호출
        if (onCardFlip) onCardFlip(id);
        if (viewedIds.has(id)) return;
        setViewedIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden">
            <div className="w-full px-4 shrink-0 safe-top">
                <div className="w-full flex justify-between items-center clay-panel p-4 sm:p-6 px-6 sm:px-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl border-4 border-white dark:border-slate-700">
                    <button
                        onClick={onBack}
                        className="text-slate-600 dark:text-slate-200 font-black bg-white/60 dark:bg-slate-800/60 px-5 sm:px-10 py-2.5 sm:py-4 rounded-2xl border-2 border-white/50 shadow-md hover:bg-white active:scale-95 transition-all flex items-center gap-2"
                    >
                        <span className="text-xl sm:text-2xl">←</span> <span>{t('backMenu').replace('← ', '')}</span>
                    </button>
                    <h1 className="text-2xl sm:text-5xl font-black text-slate-700 dark:text-white m-0 tracking-tight premium-text-shadow text-center flex-1 px-4">{t('flashcardTitle')}</h1>
                    <div className="w-[100px] sm:w-[140px] hidden sm:flex justify-end items-center">
                        <img src="/assets/images/characters/eunha.png" alt="eunha" className="w-20 h-20 object-contain animate-float" />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 pb-32">
                <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center gap-10">
                    <div className="flex bg-slate-100/60 dark:bg-slate-900/60 p-2 rounded-[2rem] border-2 border-white dark:border-slate-700 shadow-inner">
                        <button onClick={() => setViewMode('topic')} className={`px-10 py-3 rounded-2xl font-black text-xl transition-all ${viewMode === 'topic' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}>주제별</button>
                        <button onClick={() => setViewMode('grade')} className={`px-10 py-3 rounded-2xl font-black text-xl transition-all ${viewMode === 'grade' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}>급수별</button>
                    </div>

                    <div className="w-full clay-panel rounded-[4rem] p-8 sm:p-14 border-4 border-white dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 shadow-[0_40px_80px_rgba(148,163,184,0.3)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                        <div className="flex flex-col gap-10 relative z-10">
                            <div className="flex flex-col gap-8">
                                {viewMode === 'topic' && (
                                    <div className="flex flex-wrap gap-4 justify-center">
                                        {categories.map(cat => (
                                            <button 
                                                key={cat} 
                                                onClick={() => setSelectedCategory(cat)} 
                                                className={"px-8 py-4 rounded-[2.5rem] font-black whitespace-nowrap transition-all border-4 text-xl " + (selectedCategory === cat ? "bg-indigo-500 text-white border-white shadow-2xl scale-110" : "bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40 shadow-lg")}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {viewMode === 'grade' && (
                                    <div className="flex gap-4 justify-center flex-wrap">
                                        {['8급', '7급', '6급', '기타'].map(g => (
                                            <button key={g} onClick={() => setSelectedGrade(g)} className={"px-8 sm:px-12 py-3 sm:py-5 rounded-[2.5rem] font-black transition-all border-4 text-xl sm:text-2xl " + (selectedGrade === g ? "bg-indigo-500 text-white border-white shadow-2xl scale-110" : "bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40 shadow-lg")}>{g}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full opacity-50 mb-4"></div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 md:gap-12 justify-items-center w-full">
                                {currentStageItems.map(item => (
                                    <Flashcard
                                        key={item.id}
                                        item={item}
                                        isLocked={false}
                                        onFlip={handleCardFlip}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlashcardScreen;
