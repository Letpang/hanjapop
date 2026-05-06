import { useState, useMemo } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { useLang } from '../LangContext.jsx';

const StickerItem = ({ item, count }) => {
    const isUnlocked = count > 0;
    return (
        <div className={"relative aspect-square flex flex-col items-center justify-center p-3 transition-all duration-500 " + 
            (isUnlocked ? "clay-panel !rounded-[2.5rem] border-4 border-white dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 shadow-2xl hover:-translate-y-2" : "bg-slate-200/30 dark:bg-slate-800/20 rounded-[2.5rem] border-2 border-dashed border-slate-300 dark:border-slate-700 opacity-40")}>
            
            {/* Glossy Overlay for Unlocked Stickers */}
            {isUnlocked && <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent pointer-events-none z-10 rounded-[2.5rem]"></div>}
            
            <div className="flex-1 flex items-center justify-center w-full relative z-0">
                {/* Inner shadow base */}
                {isUnlocked && <div className="absolute inset-2 bg-slate-50 dark:bg-slate-900/30 rounded-3xl shadow-inner opacity-50"></div>}
                
                <img
                    src={item.icon || '/assets/images/hanja_placeholder.webp'}
                    className={"w-full h-full object-contain relative z-10 " + (isUnlocked ? "drop-shadow-2xl scale-110" : "grayscale opacity-20 scale-75")}
                    alt={item.hanja}
                />
                {isUnlocked && count > 1 && (
                    <div className="absolute -top-1 -right-1 bg-amber-400 text-white text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full border-2 border-white shadow-xl z-20">
                        x{count}
                    </div>
                )}
            </div>
            
            <div className="mt-3 flex flex-col items-center relative z-20">
                <span className={"text-xl sm:text-3xl font-black premium-text-shadow " + (isUnlocked ? "text-slate-700 dark:text-white" : "text-slate-400 dark:text-slate-600")}>{item.hanja}</span>
                <span className={"text-xs sm:text-sm font-black " + (isUnlocked ? "text-indigo-400 dark:text-indigo-300" : "text-slate-300")}>{item.sound}</span>
            </div>
        </div>
    );
};

const StickerBookScreen = ({ onBack, unlockedStickers, activePlanet }) => {
    const { lang, t } = useLang();
    const [viewMode, setViewMode] = useState('topic');
    const [selectedGrade, setSelectedGrade] = useState('8급');
    const categories = useMemo(() => {
        return [...new Set(HANJA_DATA.map(h => h.category).filter(Boolean))];
    }, []);
    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
    
    const gradeHanja = useMemo(() => {
        if (selectedGrade === '기타') {
            return HANJA_DATA.filter(h => !h.grade || h.grade === '' || h.grade === '기타' || h.grade === 'NON');
        }
        return HANJA_DATA.filter(h => h.grade === selectedGrade);
    }, [selectedGrade]);

    const categoryHanja = useMemo(() => {
        return HANJA_DATA.filter(h => h.category === selectedCategory);
    }, [selectedCategory]);

    const filteredHanja = useMemo(() => {
        if (viewMode === 'grade') return gradeHanja;
        return categoryHanja;
    }, [viewMode, gradeHanja, categoryHanja]);

    const totalToCount = viewMode === 'grade' ? gradeHanja.length : categoryHanja.length;
    const unlockedCount = Object.keys(unlockedStickers).filter(id => {
        const pool = viewMode === 'grade' ? gradeHanja : categoryHanja;
        return pool.some(h => h.id === parseInt(id));
    }).length;

    const progress = Math.min(100, (unlockedCount / totalToCount) * 100);

    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden">
            {/* Header */}
            <div className="w-full px-4 shrink-0 safe-top">
                <div className="w-full flex justify-between items-center clay-panel p-4 sm:p-6 px-6 sm:px-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl border-4 border-white dark:border-slate-700">
                    <button
                        onClick={onBack}
                        className="text-slate-600 dark:text-slate-200 font-black bg-white/60 dark:bg-slate-800/60 px-5 sm:px-10 py-2.5 sm:py-4 rounded-2xl border-2 border-white/50 shadow-md hover:bg-white active:scale-95 transition-all flex items-center gap-2"
                    >
                        <span className="text-xl sm:text-2xl">←</span> <span>{t('backMenu').replace('← ', '')}</span>
                    </button>
                    <h1 className="text-2xl sm:text-5xl font-black text-slate-700 dark:text-white m-0 tracking-tight premium-text-shadow text-center flex-1 px-4">{t('stickerBookTitle')}</h1>
                    <div className="w-[100px] sm:w-[140px] hidden sm:flex justify-end items-center">
                        <div className="bg-amber-400 text-white font-black px-5 py-2.5 rounded-full shadow-2xl border-2 border-white text-2xl">🏆 {unlockedCount}</div>
                    </div>
                </div>
            </div>

            {/* Scroll Area */}
            <div className="flex-1 overflow-y-auto pt-4 pb-32">
                <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center gap-10">
                    
                    {/* Progress Card - HIGH QUALITY */}
                    <div className="w-full clay-panel p-8 sm:p-12 !rounded-[4rem] border-4 border-white dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 shadow-[0_40px_80px_rgba(148,163,184,0.3)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent pointer-events-none"></div>
                        <div className="flex justify-between items-end mb-5 relative z-10">
                            <div className="flex flex-col">
                                <span className="text-indigo-400 dark:text-indigo-300 font-black text-sm uppercase tracking-widest mb-1">Collection Progress</span>
                                <span className="font-black text-slate-700 dark:text-white text-3xl sm:text-5xl tracking-tighter">{viewMode === 'grade' ? selectedGrade : selectedCategory} 수집 현황</span>
                            </div>
                            <span className="font-black text-indigo-500 text-2xl sm:text-4xl">{unlockedCount} <span className="text-slate-300 text-xl sm:text-2xl">/ {totalToCount}</span></span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-8 p-1.5 border-2 border-white dark:border-slate-700 shadow-inner overflow-hidden relative z-10">
                            <div className="h-full rounded-full transition-all duration-1000 ease-out shadow-md" style={{ width: progress + "%", background: 'linear-gradient(90deg, #FFB7B2, #FF9B9B)' }}>
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 rounded-t-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* Filters Container */}
                    <div className="w-full flex flex-col items-center gap-8">
                        <div className="flex bg-slate-100/60 dark:bg-slate-900/60 p-2 rounded-[2rem] border-2 border-white dark:border-slate-700 shadow-inner">
                            <button onClick={() => setViewMode('topic')} className={`px-12 py-3 rounded-2xl font-black text-xl transition-all ${viewMode === 'topic' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}>주제별</button>
                            <button onClick={() => setViewMode('grade')} className={`px-12 py-3 rounded-2xl font-black text-xl transition-all ${viewMode === 'grade' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}>급수별</button>
                        </div>

                        {viewMode === 'grade' && (
                            <div className="flex gap-4 flex-wrap justify-center">
                                {['8급', '7급', '6급', '기타'].map(g => (
                                    <button key={g} onClick={() => setSelectedGrade(g)} className={"px-12 py-4 rounded-[2rem] font-black transition-all border-4 text-2xl " + (selectedGrade === g ? "bg-indigo-500 text-white border-white shadow-xl scale-110" : "bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40 shadow-lg")}>{g}</button>
                                ))}
                            </div>
                        )}

                        {viewMode === 'topic' && (
                            <div className="w-full flex gap-2 pb-2 overflow-x-auto no-scrollbar justify-start sm:justify-center px-4">
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={"px-8 py-2.5 rounded-2xl font-black whitespace-nowrap transition-all border-4 text-xl " + (selectedCategory === cat ? "bg-indigo-500 text-white border-white shadow-xl scale-110" : "bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40")}>{cat}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Stickers Grid - HIGH QUALITY */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-10 w-full px-2">
                        {filteredHanja.map(item => (
                            <StickerItem
                                key={item.id}
                                item={item}
                                count={unlockedStickers[item.id] || 0}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StickerBookScreen;
