import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import {
    MONSTER_COMPONENTS, IconTarget, IconHpDrop, IconExplosionBig
} from './Icons.jsx';
import { useLang } from '../LangContext.jsx';
import { getRankDetails } from '../utils/rankUtils.js';

const getStoredXp = () => {
    try { return Number(localStorage.getItem('user_xp') || '0'); } catch { return 0; }
};

// ─────────────────────────────────────────────
// 난이도 설정
// ─────────────────────────────────────────────
const DIFFICULTY_CONFIG = {
    easy: {
        label: '쉬움',
        labelEn: 'Easy',
        emoji: '🌱',
        dropSpeedBase: 0.12,       // 낙하 속도 (% per tick, 50ms)
        dropSpeedPerWave: 0.015,   // 웨이브당 속도 증가
        maxOnScreen: 2,            // 동시 등장 최대 수
        spawnIntervalBase: 3200,   // 스폰 간격 (ms)
        spawnIntervalPerWave: -150,
        wrongAnswerMode: 'other_theme', // 오답 유사도: 다른 테마
        wavesTotal: 5,
        killsPerWave: 10,
        hp: 5,
    },
    normal: {
        label: '보통',
        labelEn: 'Normal',
        emoji: '⚡',
        dropSpeedBase: 0.20,
        dropSpeedPerWave: 0.025,
        maxOnScreen: 3,
        spawnIntervalBase: 2500,
        spawnIntervalPerWave: -200,
        wrongAnswerMode: 'same_theme', // 오답 유사도: 같은 테마
        wavesTotal: 5,
        killsPerWave: 12,
        hp: 5,
    },
    hard: {
        label: '어려움',
        labelEn: 'Hard',
        emoji: '🔥',
        dropSpeedBase: 0.30,
        dropSpeedPerWave: 0.04,
        maxOnScreen: 4,
        spawnIntervalBase: 1800,
        spawnIntervalPerWave: -200,
        wrongAnswerMode: 'same_reading_prefix', // 오답 유사도: reading 앞글자 같은 것
        wavesTotal: 5,
        killsPerWave: 15,
        hp: 4,
    },
};

// ─────────────────────────────────────────────
// 난이도별 XP 테이블
// ─────────────────────────────────────────────
const DIFFICULTY_XP = {
    easy:   { waveClear: 10, combo3: 20, combo5: 40 },
    normal: { waveClear: 15, combo3: 30, combo5: 60 },
    hard:   { waveClear: 20, combo3: 50, combo5: 100 },
};
// ─────────────────────────────────────────────
// 사운드
// ─────────────────────────────────────────────
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
        } else if (type === 'wave') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(800, now + 0.3);
            gainNode.gain.setValueAtTime(0.15, now); gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        }
    } catch (e) {}
};

// ─────────────────────────────────────────────
// 오답 선택 로직
// ─────────────────────────────────────────────
const getWrongOptions = (target, allChars, mode, targetCategory) => {
    const targetAnswer = target.answer;
    let pool = allChars.filter(h => h && (h.meaning + ' ' + (h.sound || '')) !== targetAnswer);

    if (mode === 'same_theme' && targetCategory) {
        // 같은 카테고리에서 우선 선택
        const sameTheme = pool.filter(h => h.category === targetCategory);
        if (sameTheme.length >= 3) pool = sameTheme;
    } else if (mode === 'same_reading_prefix' && target.sound) {
        // reading 앞글자 같은 것 우선
        const prefix = target.sound.charAt(0);
        const samePrefix = pool.filter(h => h.sound && h.sound.charAt(0) === prefix);
        if (samePrefix.length >= 3) pool = samePrefix;
    } else if (mode === 'other_theme' && targetCategory) {
        // 다른 카테고리에서 선택
        const otherTheme = pool.filter(h => h.category !== targetCategory);
        if (otherTheme.length >= 3) pool = otherTheme;
    }

    return pool
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(h => h.meaning + ' ' + (h.sound || ''));
};

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
const ShootGameScreen = ({ onBack, onHanjaAcquired, selectedCharacter, onMarkWrong, onWaveClear }) => {
    const { lang, t } = useLang();
    const characterAvatar = useMemo(() => getRankDetails(getStoredXp(), selectedCharacter).avatar, [selectedCharacter]);
    
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
    const [selectedDifficulty, setSelectedDifficulty] = useState('normal');

    useEffect(() => {
        if (!selectedCategory && categories.length > 0) {
            setSelectedCategory(categories[0]);
        }
    }, [categories, selectedCategory]);

    const [status, setStatus] = useState('idle');
    const [wave, setWave] = useState(1);
    const [waveKills, setWaveKills] = useState(0);
    const [waveTransition, setWaveTransition] = useState(false);
    const [clearCombo, setClearCombo] = useState(0); // 연속 웨이브 클리어 콤보
    const [score, setScore] = useState(0);
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

    const diffConfig = useMemo(() => DIFFICULTY_CONFIG[selectedDifficulty] || DIFFICULTY_CONFIG.normal, [selectedDifficulty]);

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
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                if (!window.myAudioCtx) window.myAudioCtx = new AudioCtx();
                if (window.myAudioCtx.state === 'suspended') window.myAudioCtx.resume();
            }
        } catch (e) {}

        setWave(1);
        setWaveKills(0);
        setWaveTransition(false);
        setScore(0);
        setHp(diffConfig.hp);
        hpRef.current = diffConfig.hp;
        setWords([]);
        setTargetId(null);
        setShake(false);
        setClearCombo(0);
        setStatus('playing');
    };

    // 현재 웨이브 기반 속도/간격 계산
    const getDropSpeed = useCallback((currentWave) => {
        return diffConfig.dropSpeedBase + (currentWave - 1) * diffConfig.dropSpeedPerWave;
    }, [diffConfig]);

    const getSpawnInterval = useCallback((currentWave) => {
        return Math.max(800, diffConfig.spawnIntervalBase + (currentWave - 1) * diffConfig.spawnIntervalPerWave);
    }, [diffConfig]);

    // HP 0 → game over
    useEffect(() => {
        if (hp <= 0 && status === 'playing') {
            setStatus('over');
        }
    }, [hp, status]);

    // 웨이브 킬 수 체크 → 다음 웨이브 or 게임 클리어
    useEffect(() => {
        if (status !== 'playing' || waveTransition) return;
        if (waveKills >= diffConfig.killsPerWave) {
            // 웨이브 클리어 XP + 콤보 보너스
            const xpTable = DIFFICULTY_XP[selectedDifficulty] || DIFFICULTY_XP['normal'];
            const newCombo = clearCombo + 1;
            setClearCombo(newCombo);
            let xpEarned = xpTable.waveClear;
            if (newCombo >= 5) xpEarned += xpTable.combo5;
            else if (newCombo >= 3) xpEarned += xpTable.combo3;
            if (onHanjaAcquired) onHanjaAcquired(null, xpEarned);
            if (onWaveClear) onWaveClear();
            if (wave >= diffConfig.wavesTotal) {
                setStatus('clear');
            } else {
                setWaveTransition(true);
                setWords([]);
                playSound('wave');
                setTimeout(() => {
                    setWave(prev => prev + 1);
                    setWaveKills(0);
                    setWaveTransition(false);
                }, 2000);
            }
        }
    }, [waveKills, wave, diffConfig, status, waveTransition]);

    // 낙하 + 스폰 루프
    useEffect(() => {
        if (status !== 'playing' || waveTransition) return;

        const dropInterval = setInterval(() => {
            setWords(prev => {
                let hpDelta = 0;
                const newWords = prev.map(w => {
                    if (w.state === 'exploding') return { ...w, timer: w.timer - 1 };
                    return { ...w, y: w.y + getDropSpeed(wave) };
                }).filter(w => {
                    if (w.state === 'exploding' && w.timer <= 0) return false;
                    if (w.state !== 'exploding' && w.y >= 90) {
                        hpDelta += 1;
                        playSound('damage');
                        setShake(true);
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
                if (prev.filter(w => w.state === 'falling').length >= diffConfig.maxOnScreen) return prev;
                
                let nextItem;
                let isWord = false;
                const wordChance = 0.4;
                
                if (Math.random() < wordChance && gamePoolData.words.length > 0) {
                    const wordObj = gamePoolData.words[Math.floor(Math.random() * gamePoolData.words.length)];
                    if (wordObj && wordObj.words && wordObj.words.length > 0) {
                        const randomWord = wordObj.words[Math.floor(Math.random() * wordObj.words.length)];
                        if (randomWord) {
                            nextItem = {
                                id: wordObj.id,
                                hanja: randomWord.word,
                                meaning: randomWord.meaning,
                                sound: randomWord.reading,
                                category: wordObj.category,
                            };
                            isWord = true;
                        }
                    }
                }
                
                if (!nextItem && gamePoolData.chars.length > 0) {
                    const ch = gamePoolData.chars[Math.floor(Math.random() * gamePoolData.chars.length)];
                    nextItem = { ...ch };
                }

                if (!nextItem) return prev;

                return [...prev, {
                    id: Date.now() + Math.random(),
                    pairId: nextItem.id,
                    hanja: nextItem.hanja,
                    answer: (nextItem.meaning || getMeaning(nextItem) || "") + " " + (nextItem.sound || ""),
                    sound: nextItem.sound || "",
                    category: nextItem.category || "",
                    x: Math.floor(Math.random() * 80) + 10,
                    y: 0,
                    emojiId: Math.floor(Math.random() * MONSTER_COMPONENTS.length),
                    state: 'falling',
                    isWord: isWord,
                }];
            });
        }, getSpawnInterval(wave));

        return () => { clearInterval(dropInterval); clearInterval(spawnInterval); };
    }, [status, wave, waveTransition, gamePoolData, getDropSpeed, getSpawnInterval, getMeaning, diffConfig]);

    // 타겟 & 보기 갱신
    useEffect(() => {
        if (status !== 'playing' || words.length === 0) { setOptions([]); setTargetId(null); return; }
        const fallingWords = words.filter(w => w.state === 'falling');
        if (fallingWords.length === 0) return;
        const lowestWord = fallingWords.reduce((prev, curr) => (prev.y > curr.y ? prev : curr), fallingWords[0]);
        if (lowestWord.id !== targetId) {
            setTargetId(lowestWord.id);
            const allChars = gamePoolData.chars.length > 10 ? gamePoolData.chars : HANJA_DATA;
            const wrongOpts = getWrongOptions(lowestWord, allChars, diffConfig.wrongAnswerMode, lowestWord.category);
            setOptions([...wrongOpts, lowestWord.answer].sort(() => 0.5 - Math.random()));
        }
    }, [words, status, targetId, gamePoolData, diffConfig, getMeaning]);

    const handleOptionClick = (selectedAnswer) => {
        if (status !== 'playing' || !targetId || isInputLocked) return;
        const target = words.find(w => w.id === targetId);
        if (!target) return;
        if (selectedAnswer === target.answer) {
            const dx = target.x - 50; const dy = target.y - 85;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            setTurretAngle(angle);
            playSound('shoot');
            const laserId = Date.now();
            setLasers(prev => [...prev, { id: laserId, targetX: target.x, targetY: target.y, shipX: 50, shipY: 95 }]);
            setTimeout(() => { setLasers(prev => prev.filter(l => l.id !== laserId)); playSound('boom'); }, 100);
            setWords(prev => prev.map(w => w.id === targetId ? { ...w, state: 'exploding', timer: 6 } : w));
            setScore(prev => prev + 1);
            setWaveKills(prev => prev + 1);
            if (onHanjaAcquired) onHanjaAcquired(target.pairId);
            const acqId = Date.now();
            setAcquisitions(prev => [...prev, { id: acqId, x: target.x, y: target.y, hanja: target.hanja }]);
            setTimeout(() => setAcquisitions(prev => prev.filter(a => a.id !== acqId)), 1000);
        } else {
            playSound('damage');
            setShake(true);
            setIsInputLocked(true);
            setHp(prev => Math.max(0, prev - 1));
            if (onMarkWrong) onMarkWrong(target.pairId);
            setTimeout(() => { setShake(false); setIsInputLocked(false); }, 800);
        }
    };

    // ─────────────────────────────────────────
    // IDLE 화면
    // ─────────────────────────────────────────
    if (status === 'idle') {
        return (
            <div className="fixed inset-0 w-full h-full z-50 flex flex-col items-center justify-center p-5 aesthetic-space-bg">
                <div className="w-full h-full overflow-y-auto flex flex-col items-center justify-center z-10 absolute inset-0 py-10">
                    <div className="w-full max-w-sm md:max-w-2xl mx-auto flex flex-col items-center justify-center relative z-10 p-6 md:p-10 clay-panel !rounded-[3rem] border-4 border-white dark:border-slate-700 !bg-white/40 dark:!bg-slate-900/40 backdrop-blur-xl">
                        <h2 className="text-4xl md:text-7xl font-black text-slate-700 dark:text-white mb-8 premium-text-shadow text-center">{t('shootTitle')}</h2>
                        
                        {/* 급수/주제 탭 */}
                        <div className="flex bg-white/60 dark:bg-slate-800/60 p-1.5 rounded-2xl border-2 border-white dark:border-slate-700 shadow-inner mb-6">
                            <button onClick={() => setViewMode('grade')} className={"px-8 py-2.5 rounded-xl font-black text-lg transition-all " + (viewMode === 'grade' ? "bg-white dark:bg-slate-700 text-indigo-500 shadow-md" : "text-slate-400")}>급수별</button>
                            <button onClick={() => setViewMode('topic')} className={"px-8 py-2.5 rounded-xl font-black text-lg transition-all " + (viewMode === 'topic' ? "bg-white dark:bg-slate-700 text-indigo-500 shadow-md" : "text-slate-400")}>주제별</button>
                        </div>

                        {viewMode === 'grade' && (
                            <div className="flex gap-3 mb-6 flex-wrap justify-center">
                                {['8급', '7급', '6급', '기타'].map(g => (
                                    <button key={g} onClick={() => setSelectedGrade(g)} className={"px-8 py-3 rounded-2xl font-black transition-all border-4 text-xl " + (selectedGrade === g ? "bg-indigo-500 text-white border-white shadow-xl scale-110" : "bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40")}>{g}</button>
                                ))}
                            </div>
                        )}
                        
                        {viewMode === 'topic' && (
                            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2 px-4 w-full justify-start sm:justify-center">
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={"px-6 py-2.5 rounded-xl font-black transition-all border-4 text-lg whitespace-nowrap " + (selectedCategory === cat ? "bg-indigo-500 text-white border-white shadow-xl scale-105" : "bg-white/60 dark:bg-slate-800/60 text-slate-400 border-white/40")}>{cat}</button>
                                ))}
                            </div>
                        )}

                        {/* 난이도 선택 */}
                        <div className="w-full mb-8">
                            <p className="text-center text-slate-400 font-black text-sm mb-3 uppercase tracking-widest">난이도 선택</p>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedDifficulty(key)}
                                        className={"py-4 rounded-2xl font-black text-lg border-4 transition-all flex flex-col items-center gap-1 " +
                                            (selectedDifficulty === key
                                                ? "bg-indigo-500 text-white border-white shadow-xl scale-105"
                                                : "bg-white/60 dark:bg-slate-800/60 text-slate-500 border-white/40 dark:border-slate-700")}
                                    >
                                        <span className="text-2xl">{cfg.emoji}</span>
                                        <span>{cfg.label}</span>
                                        <span className="text-xs opacity-70">{cfg.wavesTotal}웨이브</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 난이도 설명 */}
                        <div className="w-full bg-white/50 dark:bg-slate-800/50 rounded-2xl p-4 mb-8 border-2 border-white dark:border-slate-700 text-sm text-slate-500 dark:text-slate-300 font-bold">
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div>
                                    <div className="text-slate-400 mb-1">낙하 속도</div>
                                    <div className="font-black text-indigo-500">
                                        {selectedDifficulty === 'easy' ? '느림' : selectedDifficulty === 'normal' ? '보통' : '빠름'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 mb-1">동시 등장</div>
                                    <div className="font-black text-indigo-500">{diffConfig.maxOnScreen}개</div>
                                </div>
                                <div>
                                    <div className="text-slate-400 mb-1">오답 유형</div>
                                    <div className="font-black text-indigo-500">
                                        {selectedDifficulty === 'easy' ? '다른 주제' : selectedDifficulty === 'normal' ? '같은 주제' : '비슷한 음'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center mb-8">
                            <div className="w-28 h-28 md:w-40 md:h-40 rounded-[3rem] bg-white p-4 flex items-center justify-center shadow-2xl border-4 border-indigo-200">
                                <img src={characterAvatar} className="w-full h-full object-contain filter drop-shadow-lg" />
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

    // ─────────────────────────────────────────
    // 결과 화면
    // ─────────────────────────────────────────
    if (status === 'over' || status === 'clear') {
        return (
            <div className="fixed inset-0 w-full h-full z-50 flex flex-col items-center justify-center p-6 aesthetic-space-bg">
                <div className="w-full max-sm:p-6 max-w-sm md:max-w-2xl mx-auto flex flex-col items-center justify-center relative z-10 p-10 clay-panel !rounded-[3rem] border-4 border-white dark:border-slate-700 !bg-white/40 dark:!bg-slate-900/40 backdrop-blur-xl">
                    <div className="mb-6 text-8xl md:text-[10rem] animate-float">{status === 'clear' ? '🏆' : '💥'}</div>
                    <h2 className={"text-5xl md:text-8xl font-black mb-6 premium-text-shadow " + (status === 'clear' ? 'text-emerald-400' : 'text-rose-400')}>
                        {status === 'clear' ? 'SUCCESS!' : 'GAME OVER'}
                    </h2>
                    <div className="bg-white/80 dark:bg-slate-800/80 px-12 py-6 rounded-[3rem] shadow-xl border-4 border-white dark:border-slate-700 flex flex-col items-center mb-6 w-full">
                        <span className="text-slate-400 font-black uppercase text-sm mb-2 tracking-widest">Score</span>
                        <div className="text-6xl md:text-8xl font-black text-slate-700 dark:text-white">{score}</div>
                        <div className="text-slate-400 font-bold mt-1">Wave {wave} / {diffConfig.wavesTotal} · {diffConfig.label}</div>
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

    // ─────────────────────────────────────────
    // 게임 화면
    // ─────────────────────────────────────────
    return (
        <div className="fixed inset-0 w-full h-full z-50 flex flex-col overflow-hidden aesthetic-space-bg">
            <div className={"w-full mx-auto h-full flex flex-col relative " + (shake ? "animate-shake" : "")}>
                {/* 상단 HUD */}
                <div className="absolute left-4 right-4 flex justify-between items-start z-40 safe-top pt-4">
                    <div className="bg-white/90 dark:bg-slate-800/90 rounded-2xl p-2 px-4 shadow-xl border border-white dark:border-slate-700 flex flex-col">
                        <span className="text-[10px] font-black text-rose-400 mb-1 tracking-widest uppercase">Energy</span>
                        <div className="flex gap-1.5">
                            {Array.from({ length: diffConfig.hp }).map((_, i) => (
                                <div key={i} className={"w-4 h-4 rounded-full shadow-inner transition-all " + (i < hp ? "bg-rose-400 scale-110" : "bg-slate-200 dark:bg-slate-700 scale-90")}></div>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* 웨이브 표시 */}
                        <div className="bg-white/90 dark:bg-slate-800/90 rounded-2xl p-2 px-4 flex flex-col items-center shadow-xl border border-white dark:border-slate-700">
                            <span className="text-[10px] text-slate-400 font-black uppercase">Wave</span>
                            <div className="font-black text-slate-700 dark:text-white text-xl leading-none">
                                {wave}<span className="text-sm text-slate-400">/{diffConfig.wavesTotal}</span>
                            </div>
                            {/* 웨이브 진행 바 */}
                            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                                <div
                                    className="h-full bg-indigo-400 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, (waveKills / diffConfig.killsPerWave) * 100)}%` }}
                                />
                            </div>
                        </div>
                        <div className="bg-indigo-600/90 rounded-2xl p-2 px-4 flex flex-col items-center shadow-xl border-2 border-indigo-300">
                            <span className="text-[10px] text-indigo-100 font-black uppercase">Score</span>
                            <div className="font-black text-white text-2xl leading-none">{score}</div>
                        </div>
                        <button onClick={() => setStatus('idle')} className="bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-200 px-4 rounded-2xl font-black hover:bg-white border border-white shadow-xl transition-all text-sm">EXIT</button>
                    </div>
                </div>

                {/* 웨이브 전환 오버레이 */}
                {waveTransition && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="text-center animate-float">
                            <div className="text-7xl mb-4">⚡</div>
                            <div className="text-5xl font-black text-white premium-text-shadow">WAVE {wave + 1}</div>
                            <div className="text-2xl text-indigo-200 font-bold mt-2">GET READY!</div>
                            {clearCombo >= 2 && (
                                <div className="mt-3 text-amber-300 font-black text-xl">
                                    🔥 {clearCombo}연속 클리어{clearCombo >= 5 ? ' +콤보 보너스!' : clearCombo >= 3 ? ' +보너스!' : '!'}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 게임 영역 */}
                <div className="flex-1 relative overflow-hidden min-h-0" ref={gameAreaRef}>
                    <svg className="absolute w-full h-full pointer-events-none z-20">
                        {lasers.map(l => (
                            <g key={l.id} className="animate-pulse">
                                <line x1={l.shipX + "%"} y1={l.shipY + "%"} x2={l.targetX + "%"} y2={l.targetY + "%"} stroke="#FFD1DC" strokeWidth="20" strokeLinecap="round" style={{ filter: 'blur(6px)' }} opacity="0.8" />
                                <line x1={l.shipX + "%"} y1={l.shipY + "%"} x2={l.targetX + "%"} y2={l.targetY + "%"} stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
                            </g>
                        ))}
                    </svg>

                    {/* 캐릭터 */}
                    <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 z-30" ref={shipRef}>
                        <div className="w-24 h-24 md:w-44 md:h-44 transition-transform duration-100 drop-shadow-2xl" style={{ transform: 'rotate(' + (turretAngle + 90) + 'deg)' }}>
                            <img src={characterAvatar} className="w-full h-full object-contain" />
                        </div>
                    </div>

                    {/* 몬스터 */}
                    {words.map(w => {
                        const MonsterIcon = MONSTER_COMPONENTS[w.emojiId] || MONSTER_COMPONENTS[0];
                        return (
                            <div key={w.id} className={"absolute flex flex-col items-center transition-all duration-300 " + (w.state === 'exploding' ? "opacity-0 scale-150" : (w.id === targetId ? "scale-110 z-10" : "scale-100"))} style={{ left: w.x + '%', top: w.y + '%', transform: 'translate(-50%, 0)' }}>
                                {w.state === 'exploding' ? (
                                    <div className="w-24 h-24 absolute flex items-center justify-center animate-ping opacity-50"><IconExplosionBig /></div>
                                ) : (
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

                    {/* 획득 애니메이션 */}
                    {acquisitions.map(a => (
                        <div key={a.id} className="absolute pointer-events-none z-30 animate-float font-black text-amber-400 text-2xl drop-shadow-lg" style={{ left: a.x + '%', top: a.y + '%', transform: 'translate(-50%, -50%)' }}>
                            +1 ✨
                        </div>
                    ))}
                </div>

                {/* 보기 버튼 */}
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
