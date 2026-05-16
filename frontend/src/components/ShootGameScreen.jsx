import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import {
    MONSTER_COMPONENTS, IconTarget, IconHpDrop, IconExplosionBig
} from './Icons.jsx';
import { useLang } from '../LangContext.jsx';
import { getRankDetails } from '../utils/rankUtils.js';
import { buildSessionPlan } from '../utils/learningPool.js';
import GradeGrid, { TopicCard } from './GradeGrid.jsx';
const GRADES = ['전체', '8급', '7급Ⅱ', '7급', '6급Ⅱ', '6급'];

const getStoredXp = () => {
    try { return Number(localStorage.getItem('user_xp') || '0'); } catch { return 0; }
};

// ─────────────────────────────────────────────
// 난이도 설정
// ─────────────────────────────────────────────
const CATEGORY_IMAGES = {
    '숫자와 기초 개념': '1_一.webp',
    '자연과 시간': '31_日.webp',
    '나와 가족 신체': '71_父.webp',
    '공간과 위치': '111_東.webp',
    '학교와 일상생활': '151_學.webp',
    '행동과 상태': '201_來.webp',
    '사회와 문화': '251_國.webp',
};
const DIFFICULTY_CONFIG = {
    easy: {
        label: '쉬움',
        labelEn: 'Easy',
        emoji: '🌱',
        dropSpeedBase: 0.18,       // 낙하 속도 (% per tick, 50ms) — ~18초 바닥 도달
        dropSpeedPerWave: 0.015,   // 웨이브당 속도 증가
        maxOnScreen: 2,
        spawnIntervalBase: 3000,
        spawnIntervalPerWave: -150,
        wrongAnswerMode: 'other_theme',
        wavesTotal: 1,
        killsPerWave: 10,
        hp: 5,
    },
    normal: {
        label: '보통',
        labelEn: 'Normal',
        emoji: '⚡',
        dropSpeedBase: 0.28,       // ~11초 바닥 도달
        dropSpeedPerWave: 0.03,
        maxOnScreen: 3,
        spawnIntervalBase: 2400,
        spawnIntervalPerWave: -200,
        wrongAnswerMode: 'same_theme',
        wavesTotal: 1,
        killsPerWave: 12,
        hp: 5,
    },
    hard: {
        label: '어려움',
        labelEn: 'Hard',
        emoji: '✦',
        dropSpeedBase: 0.40,       // ~7.5초 바닥 도달
        dropSpeedPerWave: 0.05,
        maxOnScreen: 4,
        spawnIntervalBase: 1600,
        spawnIntervalPerWave: -180,
        wrongAnswerMode: 'same_reading_prefix',
        wavesTotal: 1,
        killsPerWave: 15,
        hp: 4,
    },
};

// ─────────────────────────────────────────────
// 난이도별 XP 테이블
// ─────────────────────────────────────────────
const DIFFICULTY_XP = {
    easy:   { waveClear: 30, combo3: 0, combo5: 0 },
    normal: { waveClear: 30, combo3: 0, combo5: 0 },
    hard:   { waveClear: 30, combo3: 0, combo5: 0 },
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
const ShootGameScreen = ({ onBack, onGameFinish, onHanjaAcquired, selectedCharacter, onMarkWrong, onMarkCorrect, onWaveClear, masteryData, srsData, userLevel, hanjaFilter, unlockedHanjaIds }) => {
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
    const [selectedGrade, setSelectedGrade] = useState(null);
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
    const [combo, setCombo] = useState(0);
    const [score, setScore] = useState(0);
    const [sessionXp, setSessionXp] = useState(0);

    // 해금된 급수 계산 로직
    const unlockedIds = useMemo(() => new Set(unlockedHanjaIds || []), [unlockedHanjaIds]);
    const unlockedGrades = useMemo(() => {
        const s = new Set(['전체']);
        for (const h of HANJA_DATA) { if (unlockedIds.has(h.id)) s.add(h.grade); }
        return s;
    }, [unlockedIds]);

    const [hp, setHp] = useState(5);
    const [words, setWords] = useState([]);
    const [options, setOptions] = useState([]);
    const [isWordTarget, setIsWordTarget] = useState(false);
    const [targetId, setTargetId] = useState(null);
    const [lasers, setLasers] = useState([]);
    const [shake, setShake] = useState(false);
    const [turretAngle, setTurretAngle] = useState(-90);
    const [acquisitions, setAcquisitions] = useState([]);
    const [xpPopup, setXpPopup] = useState({ show: false, key: 0, amount: 0 });
    const [isInputLocked, setIsInputLocked] = useState(false);
    const inputLockedRef = useRef(false);

    const shipRef = useRef(null);
    const gameAreaRef = useRef(null);
    const hpRef = useRef(hp);
    useEffect(() => { hpRef.current = hp; }, [hp]);

    const diffConfig = useMemo(() => {
        const base = DIFFICULTY_CONFIG[selectedDifficulty] || DIFFICULTY_CONFIG.normal;
        return hanjaFilter ? { ...base, wavesTotal: 1 } : base;
    }, [selectedDifficulty, hanjaFilter]);

    const gamePoolData = useMemo(() => {
        let pool = [];
        if (hanjaFilter && hanjaFilter.length > 0) {
            pool = HANJA_DATA.filter(h => hanjaFilter.includes(h.id));
        } else if (viewMode === 'grade') {
            if (selectedGrade === '전체') pool = HANJA_DATA;
            else pool = HANJA_DATA.filter(h => h.grade === selectedGrade);
        } else {
            pool = HANJA_DATA.filter(h => h.category === selectedCategory);
        }
        const relevantWords = pool.filter(h => h.words && h.words.length > 0);
        return { chars: pool, words: relevantWords };
    }, [viewMode, selectedGrade, selectedCategory, hanjaFilter]);

    const sessionPlan = useMemo(() =>
        buildSessionPlan(gamePoolData.chars, srsData, masteryData),
    [gamePoolData, srsData, masteryData]);

    const reviewQueueRef = useRef([]);
    useEffect(() => {
        reviewQueueRef.current = [...sessionPlan.reviewQueue];
    }, [sessionPlan]);

    useEffect(() => {
        if (hanjaFilter && hanjaFilter.length > 0 && status === 'idle') startGame();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const startGame = (overrideDiff) => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                if (!window.myAudioCtx) window.myAudioCtx = new AudioCtx();
                if (window.myAudioCtx.state === 'suspended') window.myAudioCtx.resume();
            }
        } catch (e) {}

        const effectiveDiff = overrideDiff ? (DIFFICULTY_CONFIG[overrideDiff] || diffConfig) : diffConfig;
        reviewQueueRef.current = [...sessionPlan.reviewQueue];
        setWave(1);
        setWaveKills(0);
        setWaveTransition(false);
        setScore(0);
        setSessionXp(0);
        setHp(effectiveDiff.hp);
        hpRef.current = effectiveDiff.hp;
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
            setSessionXp(prev => prev + xpEarned);
            setXpPopup({ show: true, key: Date.now(), amount: xpEarned });
            setTimeout(() => setXpPopup(p => ({ ...p, show: false })), 1500);
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
                const falling = prev.filter(w => w.state === 'falling');
                if (falling.length >= diffConfig.maxOnScreen) return prev;
                const fallingHanjas = new Set(falling.map(w => w.hanja));

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
                                isWrongItem: (masteryData?.[String(wordObj.id)]?.wrongCount || 0) >= 1,
                            };
                            isWord = true;
                        }
                    }
                }

                if (!nextItem && sessionPlan.normalPool.length > 0) {
                    let ch;
                    if (reviewQueueRef.current.length > 0) {
                        ch = reviewQueueRef.current.shift();
                    } else {
                        const pool = sessionPlan.normalPool;
                        ch = pool[Math.floor(Math.random() * pool.length)];
                    }
                    nextItem = { ...ch, isWrongItem: (masteryData?.[String(ch.id)]?.wrongCount || 0) >= 1 };
                }

                if (!nextItem) return prev;
                if (fallingHanjas.has(nextItem.hanja)) return prev;

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
                    isWrongItem: nextItem.isWrongItem || false,
                }];
            });
        }, getSpawnInterval(wave));

        return () => { clearInterval(dropInterval); clearInterval(spawnInterval); };
    }, [status, wave, waveTransition, gamePoolData, sessionPlan, masteryData, getDropSpeed, getSpawnInterval, getMeaning, diffConfig]);

    // 타겟 & 보기 갱신
    useEffect(() => {
        if (status !== 'playing' || words.length === 0) { setOptions([]); setTargetId(null); return; }
        const fallingWords = words.filter(w => w.state === 'falling');
        if (fallingWords.length === 0) return;
        const lowestWord = fallingWords.reduce((prev, curr) => (prev.y > curr.y ? prev : curr), fallingWords[0]);
        if (lowestWord.id !== targetId) {
            setTargetId(lowestWord.id);
            setIsWordTarget(lowestWord.isWord || false);
            const allChars = gamePoolData.chars.length > 10 ? gamePoolData.chars : HANJA_DATA;
            const wrongOpts = getWrongOptions(lowestWord, allChars, diffConfig.wrongAnswerMode, lowestWord.category);
            setOptions([...wrongOpts, lowestWord.answer].sort(() => 0.5 - Math.random()));
        }
    }, [words, status, targetId, gamePoolData, diffConfig, getMeaning]);

    const handleOptionClick = (selectedAnswer) => {
        if (status !== 'playing' || !targetId || inputLockedRef.current) return;
        const target = words.find(w => w.id === targetId);
        if (!target) return;
        if (selectedAnswer === target.answer) {
            inputLockedRef.current = true;
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
            if (onMarkCorrect) onMarkCorrect(target.pairId);
            if (onHanjaAcquired) onHanjaAcquired(target.pairId, 10);
            const acqId = Date.now();
            setAcquisitions(prev => [...prev, { id: acqId, x: target.x, y: target.y, hanja: target.hanja }]);
            setTimeout(() => { setAcquisitions(prev => prev.filter(a => a.id !== acqId)); inputLockedRef.current = false; }, 1000);
        } else {
            inputLockedRef.current = true;
            playSound('damage');
            setShake(true);
            setIsInputLocked(true);
            setHp(prev => Math.max(0, prev - 1));
            if (onMarkWrong) onMarkWrong(target.pairId);
            setTimeout(() => { setShake(false); setIsInputLocked(false); inputLockedRef.current = false; }, 800);
        }
    };

    // ─────────────────────────────────────────
    // IDLE 화면
    // ─────────────────────────────────────────
    if (status === 'idle') {
        return (
            <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden" style={{ backgroundColor: '#F8FAFF' }}>
                {/* 헤더 */}
                <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                    <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                        <button onClick={onBack}
                            className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-black text-slate-600 gap-1">
                            <span>←</span><span className="ml-1">뒤로</span>
                        </button>
                        <div className="flex items-center gap-2 overflow-hidden">
                            <h2 className="text-lg font-black text-slate-700 m-0">몬스터 슈팅</h2>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-6">
                    <div className="w-full max-w-xl mx-auto px-4 flex flex-col items-center gap-6 pt-5">

                        {/* 탭 */}
                        <div className="flex bg-slate-100/40 p-1.5 rounded-full border border-slate-200 w-full mb-4 shadow-inner">
                            <button
                                onClick={() => setViewMode('grade')}
                                className={`flex-1 px-8 py-3 rounded-full font-extrabold text-xs-res transition-all ${viewMode === 'grade' ? 'bg-white shadow-md text-slate-700' : 'text-slate-400'}`}
                            >
                                급수별
                            </button>
                            <button
                                onClick={() => setViewMode('topic')}
                                className={`flex-1 px-8 py-3 rounded-full font-extrabold text-xs-res transition-all ${viewMode === 'topic' ? 'bg-white shadow-md text-slate-700' : 'text-slate-400'}`}
                            >
                                주제별
                            </button>
                        </div>

                        {/* 급수별 */}
                        {viewMode === 'grade' && (
                            <GradeGrid
                                selected={selectedGrade}
                                onSelect={setSelectedGrade}
                                lockedGrades={GRADES.filter(g => g !== '전체' && !unlockedGrades.has(g))}
                            />
                        )}

                        {/* 주제별 */}
                        {viewMode === 'topic' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                {categories.map(cat => (
                                    <TopicCard
                                        key={cat}
                                        name={cat}
                                        imgSrc={CATEGORY_IMAGES[cat] ? `/assets/images/hanja_all/${CATEGORY_IMAGES[cat]}` : null}
                                        count={`${HANJA_DATA.filter(h => h.category === cat).length}개`}
                                        isSelected={selectedCategory === cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        locked={!HANJA_DATA.some(h => h.category === cat && unlockedIds.has(h.id))}
                                    />
                                ))}
                            </div>
                        )}

                        {/* 난이도 선택 */}
                        <div className="w-full">
                            <p className="text-xs font-extrabold text-slate-400 mb-3 text-center">난이도</p>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
                                    <button
                                        key={key}
                                        onClick={() => { setSelectedDifficulty(key); startGame(key); }}
                                        className="py-3 rounded-2xl font-extrabold transition-all flex flex-col items-center gap-1.5 border shadow-sm active:scale-95 bg-white"
                                        style={selectedDifficulty === key
                                            ? { color: '#DC2626', borderColor: '#FFADAD', boxShadow: '0 8px 24px #FFADAD60', outline: '4px solid #FFADAD30' }
                                            : { color: '#CBD5E1', borderColor: '#F1F5F9' }}
                                    >
                                        <span className="text-xl">{cfg.emoji}</span>
                                        <span className="text-xs font-extrabold">{cfg.label}</span>
                                        <span className="text-xs opacity-60 font-extrabold">{cfg.wavesTotal}웨이브</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 아바타 프리뷰 */}
                        <div className="flex flex-col items-center gap-6 mt-4">
                            <div className="w-36 h-36 rounded-[3rem] bg-white flex items-center justify-center shadow-2xl border border-slate-100 p-6 animate-float">
                                <img src={characterAvatar} className="w-full h-full object-contain" alt="avatar" />
                            </div>
                            <span className="text-xs font-extrabold text-slate-300">출격 준비 완료!</span>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    // 결과 화면 상수는 메인 렌더링 내에서 처리 (매칭 게임과 동일 구조)
    const isClear = status === 'clear';
    const isResult = status === 'over' || status === 'clear';

    // ─────────────────────────────────────────
    // 게임 화면
    // ─────────────────────────────────────────
    return (
        <div className="fixed inset-0 w-full h-full z-50 flex flex-col overflow-hidden bg-[#FDFBF7]">
            <style>{`@keyframes xpFloat{0%{opacity:0;transform:scale(0.6) translateY(16px)}28%{opacity:1;transform:scale(1.1) translateY(-6px)}40%{opacity:1;transform:scale(1) translateY(0)}68%{opacity:1;transform:scale(1) translateY(0)}100%{opacity:0;transform:translateY(-28px)}}`}</style>
            {xpPopup.show && (
                <div key={xpPopup.key} className="fixed inset-0 flex items-center justify-center pointer-events-none z-[200]" style={{ animation: 'xpFloat 1.5s ease-in-out forwards', paddingBottom: '80px' }}>
                    <div className="px-7 py-3 rounded-full font-extrabold text-xl" style={{ backgroundColor: '#FFF7D4', color: '#B8860B', border: '2px solid #FFD700', boxShadow: '0 8px 28px rgba(255,215,0,0.5)' }}>
                        ⭐ +{xpPopup.amount} XP
                    </div>
                </div>
            )}
            <div className={`w-full mx-auto h-full flex flex-col relative ${shake ? "animate-shake" : ""}`}>
                {/* 상단 HUD */}
                <div className="absolute left-3 right-3 flex justify-between items-center z-40 safe-top pt-4">
                    {/* HP */}
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl px-3 py-2 shadow-md border border-white/50 flex items-center gap-1.5">
                        {Array.from({ length: diffConfig.hp }).map((_, i) => (
                            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i < hp ? "bg-rose-300" : "bg-slate-100"}`} />
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* 진행도 */}
                        <div className="bg-white/90 backdrop-blur-md rounded-2xl px-3 py-1.5 shadow-md border border-white/50 flex items-center gap-2">
                            <span className="text-xs text-slate-300 font-extrabold uppercase tracking-widest">Progress</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (waveKills / diffConfig.killsPerWave) * 100)}%` }} />
                            </div>
                        </div>
                        {/* 스코어 */}
                        <div className="bg-indigo-500 rounded-2xl px-3 py-1.5 shadow-md border border-indigo-400 flex items-center gap-1.5">
                            <span className="text-xs text-indigo-200 font-extrabold uppercase tracking-widest">Score</span>
                            <span className="font-extrabold text-white text-sm leading-none">{score}</span>
                        </div>
                        <button onClick={hanjaFilter ? onBack : () => setStatus('idle')} className="bg-white/80 backdrop-blur-sm text-slate-300 px-3 py-1.5 rounded-2xl font-extrabold hover:text-rose-400 transition-all text-xs border border-white uppercase tracking-widest">Exit</button>
                    </div>
                </div>

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
                        <div className="w-14 h-14 md:w-24 md:h-24 transition-transform duration-100 drop-shadow-2xl" style={{ transform: 'rotate(' + (turretAngle + 90) + 'deg)' }}>
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
                                        {w.isWrongItem && (
                                            <div className="text-xs font-extrabold text-rose-400 mb-1 bg-white/90 px-2 py-0.5 rounded-full border border-rose-100 shadow-sm uppercase tracking-widest">Review</div>
                                        )}
                                        <div className={`w-14 h-14 md:w-20 md:h-20 animate-bounce ${w.isWrongItem ? "drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]" : "drop-shadow-md"}`}>
                                            <MonsterIcon />
                                        </div>
                                        <div className={`font-extrabold bg-white/95 text-[#5D544F] flex items-center justify-center rounded-xl shadow-lg border-2 px-2.5 py-1.5 transition-all duration-300 text-body-res max-w-[7rem] md:max-w-[9rem] ${
                                            w.isWrongItem ? "border-rose-200" : w.id === targetId ? "border-amber-200 scale-110 shadow-amber-100/50" : "border-slate-50"
                                        }`}>
                                            <span className="text-center break-keep leading-tight">{w.hanja}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* 획득 애니메이션 */}
                    {acquisitions.map(a => (
                        <div key={a.id} className="absolute pointer-events-none z-30 animate-float font-extrabold text-amber-400 text-2xl drop-shadow-lg" style={{ left: a.x + '%', top: a.y + '%', transform: 'translate(-50%, -50%)' }}>
                            +1 ✨
                        </div>
                    ))}
                </div>

                {/* 보기 버튼 */}
                <div className="shrink-0 px-4 grid grid-cols-2 gap-2 z-40" style={{ paddingTop: '6px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}>
                    {options.map((opt, i) => {
                        const parts = opt.split(' '); const sound = parts.pop(); const meaning = parts.join(' ');
                        return (
                            <button
                                key={i}
                                onClick={() => handleOptionClick(opt)}
                                className={`bg-white/95 px-4 py-3 rounded-[1.2rem] md:rounded-[1.8rem] font-extrabold border-4 border-white shadow-xl active:scale-95 transition-all text-center break-keep flex items-center justify-center gap-1.5 text-body-lg-res ${isInputLocked ? 'opacity-50 grayscale' : 'opacity-90 hover:opacity-100'}`}
                            >
                                {isWordTarget ? (
                                    <span className="text-slate-700 text-sm sm:text-base md:text-lg leading-tight">{meaning}</span>
                                ) : (
                                    <>
                                        <span className="text-slate-700 text-lg sm:text-xl md:text-2xl">{meaning}</span>
                                        <span className="text-indigo-500 text-lg sm:text-xl md:text-2xl">{sound}</span>
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* 결과 모달 (매칭 게임과 동일한 팝업 방식) */}
                {isResult && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300"
                        style={{ background: isClear ? 'rgba(16,185,129,0.18)' : 'rgba(255,107,107,0.18)' }}
                    >
                        <div className="w-full max-w-sm flex flex-col items-center bg-white shadow-2xl rounded-[48px] overflow-hidden">
                            <div className="pt-4 pb-10 px-8 flex flex-col items-center gap-6 w-full relative">
                                <img
                                    src={isClear ? '/assets/images/icons/success_new.png' : '/assets/images/icons/timeout_new.png'}
                                    alt={isClear ? 'clear' : 'over'}
                                    className="w-[182px] h-[182px] object-contain drop-shadow-xl mt-2"
                                />
                                <div className="text-center flex flex-col gap-2">
                                    <span className="text-sm font-extrabold text-slate-400">
                                        {isClear ? '정말 멋진 결과예요!' : '아쉬운 결과네요...'}
                                    </span>
                                    <h1 className="text-h2-res font-extrabold tracking-tighter leading-snug" style={{ color: isClear ? '#10B981' : '#FF6B6B' }}>
                                        {isClear ? '와우! 참 잘했어요!' : <>괜찮아요,<br/>다시 도전해봐요!</>}
                                    </h1>
                                    <div className="flex items-center justify-center gap-3 mt-1">
                                        <span className="text-3xl font-extrabold text-slate-700 tracking-tighter">{score}</span>
                                        <span className="text-indigo-500 font-extrabold text-lg">+{sessionXp} XP</span>
                                    </div>
                                </div>
                                <div className="w-full flex flex-col gap-3">
                                    <button
                                        onClick={startGame}
                                        className="w-full py-4 rounded-2xl font-extrabold text-body-lg text-white active:scale-95 transition-all border-b-4 active:border-b-0 active:translate-y-[2px]"
                                        style={isClear
                                            ? { background: 'linear-gradient(135deg, #34D399, #10B981)', borderBottomColor: '#059669' }
                                            : { background: 'linear-gradient(135deg, #FF8E8E, #FF6B6B)', borderBottomColor: '#E05555' }}
                                    >
                                        다시 하기
                                    </button>
                                    <button
                                        onClick={hanjaFilter ? onBack : () => setStatus('idle')}
                                        className="w-full py-4 rounded-2xl font-extrabold text-body-lg text-white active:scale-95 transition-all border-b-4 active:border-b-0 active:translate-y-[2px]"
                                        style={{ 
                                            background: 'linear-gradient(135deg, #6EE7B7, #34D399)',
                                            borderBottomColor: '#059669'
                                        }}
                                    >
                                        급수 / 주제 바꾸기
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShootGameScreen;
