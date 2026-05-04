import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { 
    MONSTER_COMPONENTS, IconTarget, IconHpDrop, IconExplosionBig
} from './Icons.jsx';
import { useLang } from '../LangContext.jsx';

const playSound = (type) => {
    try {
        if (!window.AudioContext && !window.webkitAudioContext) return;
        let audioCtx = window.myAudioCtx;
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            window.myAudioCtx = audioCtx;
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        if (type === 'shoot') {
            osc.type = 'square'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            gainNode.gain.setValueAtTime(0.05, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'boom') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(120, now); osc.frequency.exponentialRampToValueAtTime(20, now + 0.2);
            gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'damage') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(50, now + 0.3);
            gainNode.gain.setValueAtTime(0.25, now); gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        }
    } catch (e) {
        // Audio API blocked by browser policy
    }
};

const ShootGameScreen = ({ onBack, onHanjaAcquired, selectedCharacter }) => {
    const { lang, t } = useLang();
    
    const getMeaning = useCallback((item) => {
        if (!item) return "";
        return lang === 'en' ? (item.meaning_en || item.meaning) : item.meaning;
    }, [lang]);
    
    const [viewMode, setViewMode] = useState('grade');
    const categories = useMemo(() => {
        return [...new Set((HANJA_DATA || []).map(h => h.category).filter(Boolean))];
    }, []);
    
    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
    const [selectedGrade, setSelectedGrade] = useState('8급');

    useEffect(() => {
        if (!selectedCategory && categories.length > 0) {
            setSelectedCategory(categories[0]);
        }
    }, [categories, selectedCategory]);

    const [status, setStatus] = useState('idle');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [targetScore, setTargetScore] = useState(20);
    const [hp, setHp] = useState(5);
    const [words, setWords] = useState([]);
    const [options, setOptions] = useState([]);
    const [targetId, setTargetId] = useState(null);
    const [lasers, setLasers] = useState([]);
    const [shake, setShake] = useState(false);
    const [turretAngle, setTurretAngle] = useState(-90);
    const [acquisitions, setAcquisitions] = useState([]);
    const [isInputLocked, setIsInputLocked] = useState(false);

    const shipRef = useRef(null);
    const gameAreaRef = useRef(null);
    const hpRef = useRef(hp);
    useEffect(() => { hpRef.current = hp; }, [hp]);

    const gamePoolData = useMemo(() => {
        let pool = [];
        if (viewMode === 'grade') {
            if (selectedGrade === '기타') pool = HANJA_DATA.filter(h => !h.grade || h.grade === '' || h.grade === '기타' || h.grade === 'NON');
            else pool = HANJA_DATA.filter(h => h.grade === selectedGrade);
        } else {
            pool = HANJA_DATA.filter(h => h.category === selectedCategory);
        }
        
        const relevantWords = pool.filter(h => h.words && h.words.length > 0);

        return { chars: pool, words: relevantWords };
    }, [viewMode, selectedGrade, selectedCategory]);

    const startGame = () => {
        // 오디오 컨텍스트 초기화 유도
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                if (!window.myAudioCtx) window.myAudioCtx = new AudioCtx();
                if (window.myAudioCtx.state === 'suspended') window.myAudioCtx.resume();
            }
        } catch (e) {}

        setLevel(1); setScore(0); setHp(5); hpRef.current = 5;
        setWords([]); setTargetId(null); setShake(false);
        setTargetScore(20); 
        setStatus('playing');
    };

    const getDropSpeed = useCallback(() => 0.25 + (level - 1) * 0.12, [level]);
    const getSpawnInterval = useCallback(() => Math.max(1000, 3000 - (level - 1) * 500), [level]);

    useEffect(() => {
        if (hp <= 0 && status === 'playing') {
            setStatus('over');
        }
    }, [hp, status]);

    useEffect(() => {
        if (score >= targetScore && status === 'playing') {
            setStatus('clear');
        }
    }, [score, status, targetScore]);

    useEffect(() => {
        if (status !== 'playing') return;

        const dropInterval = setInterval(() => {
            setWords(prev => {
                let hpDelta = 0;
                const newWords = prev.map(w => {
                    if (w.state === 'exploding') return { ...w, timer: w.timer - 1 };
                    return { ...w, y: w.y + getDropSpeed() };
                }).filter(w => {
                    if (w.state === 'exploding' && w.timer <= 0) return false;
                    if (w.state !== 'exploding' && w.y >= 90) {
                        hpDelta += 1;
                        playSound('damage'); setShake(true);
                        setTimeout(() => setShake(false), 300);
                        return false;
                    }
                    return true;
                });

                if (hpDelta > 0) {
                    setHp(current => Math.max(0, current - hpDelta));
                }
                return newWords;
            });
        }, 50);

        const spawnInterval = setInterval(() => {
            setWords(prev => {
                if (prev.length >= 6) return prev;
                
                let nextItem;
                let isWord = false;
                const wordChance = 0.4;
                
                if (Math.random() < wordChance && gamePoolData.words.length > 0) {
                    const wordObj = gamePoolData.words[Math.floor(Math.random() * gamePoolData.words.length)];
                    if (wordObj && wordObj.words && wordObj.words.length > 0) {
                        const randomWord = wordObj.words[Math.floor(Math.random() * wordObj.words.length)];
                        if (randomWord) {
                            nextItem = { id: wordObj.id, hanja: randomWord.word, meaning: randomWord.meaning, sound: randomWord.reading };
                            isWord = true;
                        }
                    }
                }
                
                if (!nextItem && gamePoolData.chars.length > 0) {
                    nextItem = gamePoolData.chars[Math.floor(Math.random() * gamePoolData.chars.length)];
                }

                if (!nextItem) return prev;

                return [...prev, {
                    id: Date.now() + Math.random(),
                    pairId: nextItem.id,
                    hanja: nextItem.hanja,
                    answer: (nextItem.meaning || getMeaning(nextItem) || "") + " " + (nextItem.sound || ""),
                    x: Math.floor(Math.random() * 80) + 10,
                    y: 0,
                    emojiId: Math.floor(Math.random() * MONSTER_COMPONENTS.length),
                    state: 'falling',
                    isWord: isWord
                }];
            });
        }, getSpawnInterval());

        return () => { clearInterval(dropInterval); clearInterval(spawnInterval); };
    }, [status, level, gamePoolData, getDropSpeed, getSpawnInterval, getMeaning]);

    useEffect(() => {
        if (status !== 'playing' || words.length === 0) { setOptions([]); setTargetId(null); return; }
        const fallingWords = words.filter(w => w.state === 'falling');
        if (fallingWords.length === 0) return;
        const lowestWord = fallingWords.reduce((prev, curr) => (prev.y > curr.y ? prev : curr), fallingWords[0]);
        if (lowestWord.id !== targetId) {
            setTargetId(lowestWord.id);
            let incorrects = [];
            const incorrectPool = (gamePoolData.chars.length > 10 ? gamePoolData.chars : HANJA_DATA) || [];
            incorrects = incorrectPool
                .filter(h => h && (getMeaning(h) + " " + (h.sound || "")) !== lowestWord.answer)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3)
                .map(h => getMeaning(h) + " " + (h.sound || ""));
            setOptions([...incorrects, lowestWord.answer].sort(() => 0.5 - Math.random()));
        }
    }, [words, status, targetId, gamePoolData, getMeaning]);

    const handleOptionClick = (selectedAnswer) => {
        if (status !== 'playing' || !targetId || isInputLocked) return;
        const target = words.find(w => w.id === targetId);
        if (!target) return;
        if (selectedAnswer === target.answer) {
            const dx = target.x - 50; const dy = target.y - 85;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            setTurretAngle(angle); playSound('shoot');
            const laserId = Date.now();
            setLasers(prev => [...prev, { id: laserId, targetX: target.x, targetY: target.y, shipX: 50, shipY: 95 }]);
            setTimeout(() => { setLasers(prev => prev.filter(l => l.id !== laserId)); playSound('boom'); }, 100);
            setWords(prev => prev.map(w => w.id === targetId ? { ...w, state: 'exploding', timer: 6 } : w));
            setScore(prev => prev + 1);
            if (onHanjaAcquired) onHanjaAcquired(target.pairId);
            const acqId = Date.now();
            setAcquisitions(prev => [...prev, { id: acqId, x: target.x, y: target.y, hanja: target.hanja }]);
            setTimeout(() => setAcquisitions(prev => prev.filter(a => a.id !== acqId)), 1000);
        } else {
            playSound('damage'); setShake(true); setIsInputLocked(true);
            setHp(prev => Math.max(0, prev - 1));
            setTimeout(() => { setShake(false); setIsInputLocked(false); }, 800);
        }
    };

    if (status === 'idle') {
        return (
            <div className="fixed inset-0 w-full h-full z-50 flex flex-col items-center justify-center p-5 aesthetic-space-bg">
                <div className="w-full h-full overflow-y-auto flex flex-col items-center justify-center z-10 absolute inset-0 py-10">
                    <div className="w-full max-w-sm md:max-w-2xl mx-auto flex flex-col items-center justify-center relative z-10 p-6 md:p-10 clay-panel !rounded-[3rem] border-4 border-white dark:border-slate-700 !bg-white/40 dark:!bg-slate-900/40 backdrop-blur-xl">
                        <h2 className="text-4xl md:text-7xl font-black text-slate-700 dark:text-white mb-8 premium-text-shadow text-center">{t('shootTitle')}</h2>
                        
                        <div className="flex bg-white/60 dark:bg-slate-800/60 p-1.5 rounded-2xl border-2 border-white dark:border-slate-700 shadow-inner mb-6">
                            <button onClick={() => setViewMode('topic')} className={`px-8 py-2.5 rounded-xl font-black text-lg transition-all ${viewMode === 'topic' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}>주제별</button>
                            <button onClick={() => setViewMode('grade')} className={`px-8 py-2.5 rounded-xl font-black text-lg transition-all ${viewMode === 'grade' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-md scale-105' : 'text-slate-400'}`}>급수별</button>
                        </div>

                        {viewMode === 'grade' && (
                            <div className="flex gap-3 mb-8 flex-wrap justify-center">
                                {['8급', '7급', '6급', '기타'].map(g => (
                                    <button key={g} onClick={() => setSelectedGrade(g)} className={"px-8 py-3 rounded-2xl font-black transition-all border-4 text-xl " + (selectedGrade === g ? "bg-indigo-500 text-white border-white shadow-xl scale-110" : "bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40")}>{g}</button>
                                ))}
                            </div>
                        )}
                        
                        {viewMode === 'topic' && (
                            <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2 px-4 w-full justify-start sm:justify-center">
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={"px-6 py-2.5 rounded-xl font-black transition-all border-4 text-lg whitespace-nowrap " + (selectedCategory === cat ? "bg-indigo-500 text-white border-white shadow-xl scale-105" : "bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40")}>{cat}</button>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col items-center mb-10">
                            <div className="w-32 h-32 md:w-48 md:h-48 rounded-[3rem] bg-white p-4 flex items-center justify-center shadow-2xl border-4 border-indigo-200">
                                <img src={`/assets/images/characters/${selectedCharacter || 'eunha'}.png`} className="w-full h-full object-contain filter drop-shadow-lg" />
                            </div>
                            <p className="mt-4 font-black text-slate-500 dark:text-slate-300">Ready to Battle!</p>
                        </div>

                        <button onClick={startGame} className="clay-button !bg-indigo-400 !text-white px-12 py-6 md:py-8 rounded-[3rem] font-black shadow-2xl active:scale-95 mb-6 w-full text-2xl md:text-5xl border-4 border-white">GAME START</button>
                        <button onClick={onBack} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 font-bold text-xl">{t('backToMenu')}</button>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'over' || status === 'clear') {
        return (
            <div className="fixed inset-0 w-full h-full z-50 flex flex-col items-center justify-center p-6 aesthetic-space-bg">
                <div className="w-full max-sm:p-6 max-w-sm md:max-w-2xl mx-auto flex flex-col items-center justify-center relative z-10 p-10 clay-panel !rounded-[3rem] border-4 border-white dark:border-slate-700 !bg-white/40 dark:!bg-slate-900/40 backdrop-blur-xl">
                    <div className="mb-10 text-8xl md:text-[10rem] animate-float">{status === 'clear' ? '🏆' : '💥'}</div>
                    <h2 className={"text-5xl md:text-8xl font-black mb-10 premium-text-shadow " + (status === 'clear' ? 'text-emerald-400' : 'text-rose-400')}>{status === 'clear' ? 'SUCCESS!' : 'GAME OVER'}</h2>
                    <div className="bg-white/80 dark:bg-slate-800/80 px-12 py-8 rounded-[3rem] shadow-xl border-4 border-white dark:border-slate-700 flex flex-col items-center mb-10 w-full">
                        <span className="text-slate-400 font-black uppercase text-sm mb-2 tracking-widest text-center">Score</span>
                        <div className="text-6xl md:text-8xl font-black text-slate-700 dark:text-white">{score} <span className="text-2xl md:text-4xl text-slate-400">/ {targetScore}</span></div>
                    </div>
                    <div className="flex flex-col gap-4 w-full">
                        <button onClick={startGame} className={"py-6 rounded-[2rem] font-black text-2xl md:text-4xl shadow-xl border-4 border-white " + (status === 'clear' ? "bg-emerald-400 text-white" : "bg-rose-400 text-white")}>
                            {status === 'clear' ? 'PLAY AGAIN →' : 'TRY AGAIN'}
                        </button>
                        <button onClick={() => setStatus('idle')} className="bg-white/50 text-slate-500 py-4 rounded-2xl font-bold text-xl mt-2">{t('menuShort')}</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 w-full h-full z-50 flex flex-col overflow-hidden aesthetic-space-bg">
            <div className={"w-full mx-auto h-full flex flex-col relative " + (shake ? "animate-shake" : "")}>
                <div className="absolute left-4 right-4 flex justify-between items-start z-40 safe-top pt-4">
                    <div className="bg-white/90 dark:bg-slate-800/90 rounded-2xl p-2 px-4 shadow-xl border border-white dark:border-slate-700 flex flex-col">
                        <span className="text-[10px] font-black text-rose-400 mb-1 tracking-widest uppercase">Energy</span>
                        <div className="flex gap-1.5">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className={"w-4 h-4 rounded-full shadow-inner transition-all " + (i < hp ? "bg-rose-400 scale-110" : "bg-slate-200 dark:bg-slate-700 scale-90")}></div>))}</div>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-indigo-600/90 rounded-2xl p-2 px-6 flex flex-col items-center shadow-xl border-2 border-indigo-300">
                            <span className="text-[10px] text-indigo-100 font-black uppercase">Battle</span>
                            <div className="font-black text-white text-2xl leading-none">{score} <span className="text-sm text-indigo-200">/ {targetScore}</span></div>
                        </div>
                        <button onClick={() => setStatus('idle')} className="bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-200 px-6 rounded-2xl font-black hover:bg-white border border-white shadow-xl transition-all">EXIT</button>
                    </div>
                </div>

                <div className="flex-1 relative overflow-hidden min-h-0" ref={gameAreaRef}>
                    <svg className="absolute w-full h-full pointer-events-none z-20">
                        {lasers.map(l => (
                            <g key={l.id} className="animate-pulse">
                                <line x1={l.shipX + "%"} y1={l.shipY + "%"} x2={l.targetX + "%"} y2={l.targetY + "%"} stroke="#FFD1DC" strokeWidth="20" strokeLinecap="round" style={{ filter: 'blur(6px)' }} opacity="0.8" />
                                <line x1={l.shipX + "%"} y1={l.shipY + "%"} x2={l.targetX + "%"} y2={l.targetY + "%"} stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
                            </g>
                        ))}
                    </svg>

                    <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 z-30" ref={shipRef}>
                        <div className="w-24 h-24 md:w-44 md:h-44 transition-transform duration-100 drop-shadow-2xl" style={{ transform: 'rotate(' + (turretAngle + 90) + 'deg)' }}>
                            <img src={`/assets/images/characters/${selectedCharacter || 'eunha'}.png`} className="w-full h-full object-contain" />
                        </div>
                    </div>

                    {words.map(w => {
                        const MonsterIcon = MONSTER_COMPONENTS[w.emojiId] || MONSTER_COMPONENTS[0];
                        return (
                            <div key={w.id} className={"absolute flex flex-col items-center transition-all duration-300 " + (w.state === 'exploding' ? "opacity-0 scale-150" : (w.id === targetId ? "scale-110 z-10" : "scale-100"))} style={{ left: w.x + '%', top: w.y + '%', transform: 'translate(-50%, 0)' }}>
                                {w.state === 'exploding' ? (<div className="w-24 h-24 absolute flex items-center justify-center animate-ping opacity-50"><IconExplosionBig /></div>) : (
                                    <div className="flex flex-col items-center">
                                        <div className={"w-14 h-14 md:w-24 md:h-24 animate-bounce " + (w.id === targetId ? "drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" : "drop-shadow-md")}><MonsterIcon /></div>
                                        <div className={"font-black bg-white/90 dark:bg-slate-800/90 text-indigo-900 dark:text-white flex items-center justify-center rounded-full shadow-2xl border-4 " +
                                            (w.id === targetId ? "border-amber-400 " : "border-white dark:border-slate-700 ") +
                                            (w.isWord ? "w-28 h-18 md:w-44 md:h-28 text-lg md:text-2xl px-2" : "w-14 h-14 md:w-24 md:h-24 text-3xl md:text-5xl")}>
                                            <span className="text-center break-all">{w.hanja}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="shrink-0 px-4 grid grid-cols-2 gap-3 z-40" style={{ paddingTop: '8px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
                    {options.map((opt, i) => {
                        const parts = opt.split(' '); const sound = parts.pop(); const meaning = parts.join(' ');
                        return (
                            <button key={i} onClick={() => handleOptionClick(opt)} className="bg-white/95 dark:bg-slate-800/95 py-3 rounded-2xl font-black border-2 border-white dark:border-slate-700 shadow-2xl active:scale-95 transition-all text-center flex flex-col items-center justify-center overflow-hidden">
                                <span className="text-slate-700 dark:text-white text-lg md:text-2xl leading-tight">{meaning}</span>
                                <span className="text-indigo-400 dark:text-indigo-300 text-sm md:text-lg">{sound}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ShootGameScreen;
