import { useState, useMemo } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { useLang } from '../LangContext.jsx';

const StickerItem = ({ item, count }) => {
    const isUnlocked = count > 0;
    return (
        <div className={`relative aspect-square flex flex-col items-center justify-center p-3 transition-all duration-500 ${ 
            isUnlocked ? "minimal-card !rounded-[2.5rem] border-4 border-white bg-white shadow-xl hover:-translate-y-2" : "bg-[#F8FAF9] rounded-[2.5rem] border-2 border-dashed border-[#E9EDF2] opacity-40"}`}>
            
            {/* Glossy Overlay for Unlocked Stickers */}
            {isUnlocked && <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent pointer-events-none z-10 rounded-[2.5rem]"></div>}
            
            <div className="flex-1 flex items-center justify-center w-full relative z-0">
                {/* Inner shadow base */}
                {isUnlocked && <div className="absolute inset-2 bg-[#F8FAF9] rounded-3xl shadow-inner opacity-50"></div>}
                
                    className={`w-full h-full object-contain relative z-10 ${isUnlocked ? "drop-shadow-xl scale-110" : "grayscale opacity-20 scale-75"}`}
                {isUnlocked && count > 1 && (
                    <div className="absolute -top-1 -right-1 bg-[#FFB433] text-white text-xs sm:text-xs font-extrabold px-2.5 py-1 rounded-full border-2 border-white shadow-xl z-20">
                        x{count}
                    </div>
                )}
            </div>
            
            <div className="mt-3 flex flex-col items-center relative z-20">
                <span className={`text-xl sm:text-3xl font-extrabold ${isUnlocked ? "text-[#5D544F]" : "text-[#AEB7C5]"}`}>{item.hanja}</span>
                <span className={`text-xs sm:text-sm font-extrabold ${isUnlocked ? "text-[#7C83FF]" : "text-slate-200"}`}>{item.sound}</span>
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
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden bg-[#F7FAF9]">
            {/* 헤더 */}
            <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                    <button onClick={onBack}
                        className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-black text-[#5B677A] gap-1">
                        <span>←</span><span className="ml-1">뒤로</span>
                    </button>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <h2 className="text-lg font-black text-slate-700 m-0">도감</h2>
                    </div>
                </div>
            </div>

            {/* Scroll Area */}
            <div className="flex-1 overflow-y-auto pt-4 pb-32">
                <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center gap-10">
                    
                    {/* Progress Card - HIGH QUALITY */}
                    <div className="w-full premium-card-base p-8 md:p-12 animate-in fade-in zoom-in duration-500">
                        <div className="flex justify-between items-end mb-6">
                            <div className="flex flex-col">
                                <span className="text-xs text-[#7C83FF] font-extrabold uppercase tracking-widest mb-1">Collection Progress</span>
                                <span className="font-extrabold text-[#5D544F] text-3xl md:text-5xl tracking-tight uppercase">{viewMode === 'grade' ? selectedGrade : selectedCategory}</span>
                            </div>
                            <span className="font-extrabold text-[#7C83FF] text-2xl md:text-4xl">{unlockedCount} <span className="text-slate-200 text-xl md:text-2xl">/ {totalToCount}</span></span>
                        </div>
                        <div className="w-full bg-[#F8FAF9] rounded-full h-8 p-1.5 border border-[#E9EDF2] shadow-inner overflow-hidden relative">
                            <div className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm bg-gradient-to-r from-[#FFB433] to-rose-400" style={{ width: progress + "%" }}>
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* Filters Container */}
                    <div className="w-full flex flex-col items-center gap-8">
                        <div className="flex bg-[#F4F7F8]/40 p-1.5 rounded-full border border-[#E9EDF2] shadow-inner">
                            <button onClick={() => setViewMode('topic')} className={`px-8 py-3 rounded-full font-extrabold text-xs-res transition-all ${viewMode === 'topic' ? 'bg-white text-slate-700 shadow-md' : 'text-[#AEB7C5]'}`}>주제별</button>
                            <button onClick={() => setViewMode('grade')} className={`px-8 py-3 rounded-full font-extrabold text-xs-res transition-all ${viewMode === 'grade' ? 'bg-white text-slate-700 shadow-md' : 'text-[#AEB7C5]'}`}>급수별</button>
                        </div>

                        {viewMode === 'grade' && (
                            <div className="flex gap-3 flex-wrap justify-center">
                                {['8급', '7급', '6급', '기타'].map(g => (
                                    <button 
                                        key={g} 
                                        onClick={() => setSelectedGrade(g)} 
                                        className={`px-8 py-3 rounded-2xl font-extrabold text-lg transition-all border ${selectedGrade === g ? "bg-[#7C83FF] text-white border-[#7C83FF] shadow-lg shadow-[#C3C6FF]" : "bg-white text-[#AEB7C5] border-[#E9EDF2] hover:border-[#E9EDF2]"}`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        )}

                        {viewMode === 'topic' && (
                            <div className="w-full flex gap-2 pb-2 overflow-x-auto no-scrollbar justify-start sm:justify-center px-4">
                                {categories.map(cat => (
                                    <button 
                                        key={cat} 
                                        onClick={() => setSelectedCategory(cat)} 
                                        className={`px-6 py-2.5 rounded-2xl font-extrabold text-lg whitespace-nowrap transition-all border ${selectedCategory === cat ? "bg-[#7C83FF] text-white border-[#7C83FF] shadow-lg shadow-[#C3C6FF]" : "bg-white text-[#AEB7C5] border-[#E9EDF2] hover:border-[#E9EDF2]"}`}
                                    >
                                        {cat}
                                    </button>
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
