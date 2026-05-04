import { useState, useEffect, useRef, useMemo } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { IconStrokeOrder } from './Icons';
import { useLang } from '../LangContext.jsx';

const WritingScreen = ({ onBack, onWritingComplete }) => {
    const { lang, t } = useLang();
    const [viewMode, setViewMode] = useState('grade'); // 'topic' or 'grade'
    const [selectedGrade, setSelectedGrade] = useState('8급');
    const categories = useMemo(() => {
        return [...new Set(HANJA_DATA.map(h => h.category).filter(Boolean))];
    }, []);
    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const [penColor, setPenColor] = useState('#6366f1');
    const [penWidth, setPenWidth] = useState(8);
    const [showNumbers, setShowNumbers] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);
    const [charData, setCharData] = useState(null);

    const currentHanjaList = useMemo(() => {
        if (viewMode === 'grade') {
            if (selectedGrade === '기타') {
                return HANJA_DATA.filter(h => !h.grade || h.grade === '' || h.grade === '기타' || h.grade === 'NON');
            }
            return HANJA_DATA.filter(h => h.grade === selectedGrade);
        }
        return HANJA_DATA.filter(h => h.category === selectedCategory);
    }, [viewMode, selectedCategory, selectedGrade]);

    const currentItem = currentHanjaList[currentIndex] || currentHanjaList[0];

    const containerRef = useRef(null);
    const bgCanvasRef = useRef(null);
    const fgCanvasRef = useRef(null);
    const writerRef = useRef(null);
    const guideContainerRef = useRef(null);
    
    const [isDrawing, setIsDrawing] = useState(false);
    const [size, setSize] = useState({ w: 0, h: 0 });

    const [allPaths, setAllPaths] = useState(() => {
        try {
            const saved = window.localStorage.getItem('hanja_writing_paths');
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    });

    const currentPaths = useMemo(() => {
        if (!currentItem) return [];
        return allPaths[currentItem.id] || [];
    }, [allPaths, currentItem]);

    useEffect(() => {
        window.localStorage.setItem('hanja_writing_paths', JSON.stringify(allPaths));
    }, [allPaths]);

    // 한자 데이터 가져오기 (획순 번호 표시용)
    useEffect(() => {
        if (!currentItem) return;
        setCharData(null);
        // 한자 변경 시 캔버스 초기화 (선택 사항 - 여기서는 유지하고 지우기 버튼으로 유도)
        fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${currentItem.hanja}.json`)
            .then(res => res.json())
            .then(data => setCharData(data))
            .catch(err => console.error("한자 데이터를 불러오는데 실패했습니다.", err));
    }, [currentItem]);

    // 컨테이너 크기 추적
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            if (width > 0 && height > 0) setSize({ w: width, h: height });
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Hanzi Writer 초기화
    useEffect(() => {
        if (!guideContainerRef.current || size.w === 0 || !window.HanziWriter || !currentItem) return;

        guideContainerRef.current.innerHTML = '';
        writerRef.current = window.HanziWriter.create(guideContainerRef.current, currentItem.hanja, {
            width: size.w,
            height: size.h,
            padding: size.w * 0.1,
            showOutline: true,
            strokeAnimationSpeed: 2,
            delayBetweenStrokes: 150,
            outlineColor: 'rgba(0, 0, 0, 0.05)',
            strokeColor: 'rgba(99, 102, 241, 0.3)',
            showCharacter: false
        });

        setTimeout(() => {
            if (writerRef.current) {
                setIsAnimating(true);
                writerRef.current.animateCharacter({ onComplete: () => setIsAnimating(false) });
            }
        }, 300);
    }, [size, currentItem]);

    // 배경 캔버스 (격자 및 번호)
    useEffect(() => {
        if (size.w === 0 || size.h === 0) return;
        const canvas = bgCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size.w * dpr;
        canvas.height = size.h * dpr;
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(dpr, dpr);
        
        // 격자
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.moveTo(size.w / 2, 0); ctx.lineTo(size.w / 2, size.h);
        ctx.moveTo(0, size.h / 2); ctx.lineTo(size.w, size.h / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 번호
        if (showNumbers && charData && charData.medians) {
            const padding = size.w * 0.1;
            const scale = (size.w - 2 * padding) / 1024;
            ctx.font = 'bold ' + Math.max(10, size.w * 0.035) + 'px "Nunito", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            charData.medians.forEach((median, index) => {
                if (median && median.length > 0) {
                    const [mx, my] = median[0];
                    const cx = padding + mx * scale;
                    const cy = padding + (1024 - my) * scale;
                    ctx.beginPath();
                    ctx.arc(cx, cy, Math.max(8, size.w * 0.025), 0, Math.PI * 2);
                    ctx.fillStyle = '#f59e0b';
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText((index + 1).toString(), cx, cy + 1);
                }
            });
        }
    }, [size, showNumbers, charData]);

    // 전경 캔버스 (드로잉)
    useEffect(() => {
        if (size.w === 0 || size.h === 0) return;
        const canvas = fgCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size.w * dpr;
        canvas.height = size.h * dpr;
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(dpr, dpr);

        currentPaths.forEach(path => {
            if (path.points.length < 2) return;
            ctx.beginPath();
            ctx.strokeStyle = path.color || '#6366f1';
            ctx.lineWidth = path.width || 8;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.moveTo(path.points[0].x * size.w, path.points[0].y * size.h);
            for (let i = 1; i < path.points.length; i++) {
                ctx.lineTo(path.points[i].x * size.w, path.points[i].y * size.h);
            }
            ctx.stroke();
        });
    }, [size, currentPaths]);

    const getPos = (e) => {
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
    };

    const handleStart = (e) => {
        const pos = getPos(e);
        setIsDrawing(true);
        setAllPaths(prev => ({
            ...prev,
            [currentItem.id]: [...(prev[currentItem.id] || []), { points: [pos], color: penColor, width: penWidth }]
        }));
    };

    const handleMove = (e) => {
        if (!isDrawing) return;
        const pos = getPos(e);
        setAllPaths(prev => {
            const paths = [...(prev[currentItem.id] || [])];
            const last = { ...paths[paths.length - 1] };
            last.points = [...last.points, pos];
            paths[paths.length - 1] = last;
            return { ...prev, [currentItem.id]: paths };
        });
    };

    const clearCanvas = () => {
        setAllPaths(prev => ({ ...prev, [currentItem.id]: [] }));
    };

    const playGuide = () => {
        if (!writerRef.current || isAnimating) return;
        clearCanvas();
        setIsAnimating(true);
        writerRef.current.animateCharacter({ onComplete: () => setIsAnimating(false) });
    };

    const colors = ['#6366f1', '#000000', '#ef4444', '#10b981', '#f59e0b', '#ec4899'];
    const widths = [4, 8, 16, 24];

    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden">
            {/* Header */}
            <div className="w-full px-4 shrink-0 safe-top">
                <div className="w-full flex justify-between items-center clay-panel p-4 sm:p-6 px-6 sm:px-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl border-4 border-white dark:border-slate-700">
                    <button onClick={onBack} className="text-slate-600 dark:text-slate-200 font-black bg-white/60 dark:bg-slate-800/60 px-5 sm:px-10 py-2.5 sm:py-4 rounded-2xl border-2 border-white/50 shadow-md hover:bg-white active:scale-95 transition-all flex items-center gap-2">
                        <span className="text-xl sm:text-2xl">←</span> <span>{t('backMenu').replace('← ', '')}</span>
                    </button>
                    <h1 className="text-2xl sm:text-5xl font-black text-slate-700 dark:text-white m-0 tracking-tight premium-text-shadow text-center flex-1 px-4">{t('menuWriting')}</h1>
                    <div className="w-[100px] sm:w-[140px] hidden sm:flex justify-end items-center">
                        <img src="/assets/images/characters/uju.png" alt="uju" className="w-20 h-20 object-contain animate-float" />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pt-4 pb-32">
                <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center gap-4">
                    
                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-100/60 dark:bg-slate-900/60 p-1.5 rounded-3xl border-2 border-white dark:border-slate-700 shadow-inner">
                        <button onClick={() => setViewMode('topic')} className={`px-8 py-2.5 rounded-2xl font-black text-lg transition-all ${viewMode === 'topic' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}>주제별</button>
                        <button onClick={() => setViewMode('grade')} className={`px-8 py-2.5 rounded-2xl font-black text-lg transition-all ${viewMode === 'grade' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}>급수별</button>
                    </div>

                    {viewMode === 'topic' && (
                        <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar w-full justify-start sm:justify-center px-4">
                            {categories.map(cat => (
                                <button key={cat} onClick={() => { setSelectedCategory(cat); setCurrentIndex(0); }} className={"px-8 py-2.5 rounded-2xl font-black whitespace-nowrap transition-all border-4 text-xl " + (selectedCategory === cat ? "bg-indigo-500 text-white border-white shadow-xl scale-110" : "bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40")}>{cat}</button>
                            ))}
                        </div>
                    )}

                    {viewMode === 'grade' && (
                        <div className="flex gap-4 flex-wrap justify-center">
                            {['8급', '7급', '6급', '기타'].map(g => (
                                <button key={g} onClick={() => { setSelectedGrade(g); setCurrentIndex(0); }} className={"px-10 py-3 rounded-[2rem] font-black transition-all border-4 text-2xl " + (selectedGrade === g ? "bg-indigo-500 text-white border-white shadow-xl scale-110" : "bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40")}>{g}</button>
                            ))}
                        </div>
                    )}

                    {/* Tools Area */}
                    <div className="w-full max-w-4xl clay-panel !rounded-[2.5rem] p-4 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/80 dark:bg-slate-800/80 border-4 border-white shadow-xl">
                        <div className="flex gap-3 items-center">
                            {colors.map(c => (
                                <button key={c} onClick={() => setPenColor(c)} className={"w-8 h-8 md:w-10 md:h-10 rounded-full border-4 transition-transform " + (penColor === c ? "border-indigo-300 scale-125 shadow-lg" : "border-white")} style={{backgroundColor: c}} />
                            ))}
                        </div>
                        <div className="flex gap-3 items-center">
                            {widths.map(w => (
                                <button key={w} onClick={() => setPenWidth(w)} className={"w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border-2 transition-all " + (penWidth === w ? "bg-indigo-50 border-indigo-400 scale-110" : "bg-white border-slate-100")}>
                                    <div className="bg-slate-700 rounded-full" style={{width: w/2+'px', height: w/2+'px'}} />
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={playGuide} disabled={isAnimating} className="flex items-center gap-2 bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black shadow-md active:scale-95 disabled:opacity-50">
                                <IconStrokeOrder className="w-6 h-6" /> {isAnimating ? '...' : '획순'}
                            </button>
                            <button onClick={() => setShowNumbers(!showNumbers)} className={"px-6 py-3 rounded-2xl font-black border-2 transition-all " + (showNumbers ? "bg-amber-400 text-white border-white shadow-md" : "bg-white text-slate-400 border-slate-100")}>
                                ① 번호
                            </button>
                        </div>
                    </div>

                    {/* Writing Main Area */}
                    <div className="w-full max-w-2xl flex flex-col items-center gap-4 px-2">
                        {/* 한자 정보 (캔버스 위에 한 줄로) */}
                        <div className="flex items-center gap-4">
                            <span className="text-6xl md:text-8xl font-black text-slate-700 dark:text-white premium-text-shadow" style={{fontFamily: "'Noto Sans KR', sans-serif"}}>{currentItem?.hanja}</span>
                            <div className="flex flex-col">
                                <span className="text-2xl md:text-4xl font-black text-indigo-500">{currentItem?.sound}</span>
                                <span className="text-base md:text-xl font-bold text-slate-400">{lang === 'en' ? (currentItem?.meaning_en || currentItem?.meaning) : currentItem?.meaning}</span>
                            </div>
                        </div>

                        {/* 캔버스 */}
                        <div className="relative aspect-square w-full max-w-[500px] mx-auto group">
                            <div ref={containerRef} className="absolute inset-0 bg-white dark:bg-slate-900 rounded-[3rem] shadow-inner border-8 border-slate-50 dark:border-slate-800 overflow-hidden">
                                <div ref={guideContainerRef} className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none" />
                                <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-40" />
                                <canvas
                                    ref={fgCanvasRef}
                                    onMouseDown={handleStart}
                                    onMouseMove={handleMove}
                                    onMouseUp={() => setIsDrawing(false)}
                                    onMouseLeave={() => setIsDrawing(false)}
                                    onTouchStart={handleStart}
                                    onTouchMove={handleMove}
                                    onTouchEnd={() => setIsDrawing(false)}
                                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex gap-4 w-full max-w-4xl px-2">
                        <button onClick={() => { setCurrentIndex(prev => (prev - 1 + currentHanjaList.length) % currentHanjaList.length); }} className="flex-1 bg-white/60 dark:bg-slate-800/60 text-slate-600 py-6 rounded-[2rem] font-black text-2xl border-4 border-white shadow-lg active:scale-95 transition-all">이전</button>
                        <button onClick={clearCanvas} className="flex-1 bg-rose-400 text-white py-6 rounded-[2rem] font-black text-2xl border-4 border-white shadow-xl active:scale-95 transition-all">지우기</button>
                        <button onClick={() => {
                                if (onWritingComplete && currentItem) onWritingComplete(currentItem.id);
                                setCurrentIndex(prev => (prev + 1) % currentHanjaList.length);
                            }} className="flex-1 bg-indigo-500 text-white py-6 rounded-[2rem] font-black text-2xl border-4 border-white shadow-xl active:scale-95 transition-all">다음</button>
                    </div>

                    <p className="text-slate-400 font-bold text-xl mt-4">{currentIndex + 1} / {currentHanjaList.length}</p>
                </div>
            </div>
        </div>
    );
};

export default WritingScreen;
