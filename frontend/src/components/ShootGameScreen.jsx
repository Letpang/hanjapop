import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import {
    MONSTER_COMPONENTS, IconTarget, IconHpDrop, IconExplosionBig
} from './Icons.jsx';
import { useLang } from '../LangContext.jsx';
import { getRankDetails, getCharacterImage } from '../utils/rankUtils.js';
import { buildSessionPlan } from '../utils/learningPool.js';
import GradeGrid, { TopicCard } from './GradeGrid.jsx';
import { GRADES, CATEGORY_IMAGES } from '../constants/hanjaConstants.js';
import { useUnlockedHanja } from '../hooks/useUnlockedHanja.js';
import { playSound } from '../utils/playSound.js';
import { SK } from '../constants/storageKeys.js';

const getStoredXp = () => {
    try { return Number(localStorage.getItem(SK.USER_XP) || '0'); } catch { return 0; }
};

// ─────────────────────────────────────────────
// 난이도 설정
// ─────────────────────────────────────────────
const DIFFICULTY_CONFIG = {
    easy: {
        label: '느림',
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
        label: '빠름',
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
    easy:   { waveClear: 30, combo3: 10, combo5: 20 },
    normal: { waveClear: 30, combo3: 15, combo5: 30 },
    hard:   { waveClear: 30, combo3: 20, combo5: 40 },
};
// ─────────────────────────────────────────────
// 사운드
// ─────────────────────────────────────────────
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
const ShootGameScreen = ({ onBack, onGameFinish, onHanjaAcquired, selectedCharacter, onMarkWrong, onMarkCorrect, onWaveClear, masteryData, srsData, userLevel, hanjaFilter, unlockedHanjaIds, currentDayHanjaIds, reviewWordPool }) => {
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
    const [showExitModal, setShowExitModal] = useState(false);
    const handleExitConfirm = () => {
        setShowExitModal(false);
        if (hanjaFilter) {
            onBack();
        } else {
            setStatus('idle');
        }
    };
    const [wave, setWave] = useState(1);
    const [waveKills, setWaveKills] = useState(0);
    const [waveTransition, setWaveTransition] = useState(false);
    const [clearCombo, setClearCombo] = useState(0); // 연속 웨이브 클리어 콤보
    const [combo, setCombo] = useState(0);
    const [score, setScore] = useState(0);
    const [sessionXp, setSessionXp] = useState(0);

    const { unlockedIds, unlockedGrades } = useUnlockedHanja(unlockedHanjaIds);

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
            pool = pool.filter(h => unlockedIds.has(h.id));
        } else {
            pool = HANJA_DATA.filter(h => h.category === selectedCategory && unlockedIds.has(h.id));
        }
        const relevantWords = pool.filter(h => h.words && h.words.length > 0);
        return { chars: pool, words: relevantWords };
    }, [viewMode, selectedGrade, selectedCategory, hanjaFilter, unlockedIds]);

    const sessionPlan = useMemo(() =>
        buildSessionPlan(gamePoolData.chars, srsData, masteryData, hanjaFilter ? null : currentDayHanjaIds),
    [gamePoolData, srsData, masteryData, hanjaFilter, currentDayHanjaIds]);

    const reviewQueueRef = useRef([]);
    const normalQueueRef = useRef([]);
    const lastSpawnedIdRef = useRef(null);
    const wordQueueRef = useRef([]);
    const lastSpawnedWordRef = useRef(null);
    const flatWordPoolRef = useRef([]);
    // 복습 모드: 마운트 시 한 번만 캡처 (중간에 wordWrong 변경돼도 풀 유지)
    const reviewWordPoolRef = useRef(reviewWordPool || []);

    const refillNormalQueue = useCallback((pool) => {
        let shuffled = [...pool].sort(() => Math.random() - 0.5);
        if (shuffled.length > 1 && shuffled[0]?.id === lastSpawnedIdRef.current) {
            shuffled = [...shuffled.slice(1), shuffled[0]];
        }
        normalQueueRef.current = shuffled;
    }, []);

    const refillWordQueue = useCallback((pool) => {
        if (!pool || pool.length === 0) return;
        let ordered;
        if (!hanjaFilter && currentDayHanjaIds?.length > 0) {
            const todaySet = new Set(currentDayHanjaIds);
            const todayWords = pool.filter(w => todaySet.has(w.id)).sort(() => Math.random() - 0.5);
            const otherWords = pool.filter(w => !todaySet.has(w.id)).sort(() => Math.random() - 0.5);
            ordered = [...todayWords, ...otherWords];
        } else {
            ordered = [...pool].sort(() => Math.random() - 0.5);
        }
        if (ordered.length > 1 && ordered[0]?.hanja === lastSpawnedWordRef.current) {
            ordered = [...ordered.slice(1), ordered[0]];
        }
        wordQueueRef.current = ordered;
    }, [hanjaFilter, currentDayHanjaIds]);

    // 단어 풀을 flat 배열로 유지
    useEffect(() => {
        if (reviewWordPoolRef.current.length > 0) {
            // 복습 모드: 틀린 단어만 단어 몬스터로 사용
            flatWordPoolRef.current = reviewWordPoolRef.current;
        } else {
            flatWordPoolRef.current = gamePoolData.words.flatMap(h =>
                (h.words || []).filter(w => w.word && w.meaning && w.reading).map(w => ({
                    id: h.id,
                    hanja: w.word,
                    meaning: w.meaning,
                    sound: w.reading,
                    category: h.category,
                }))
            );
        }
        refillWordQueue(flatWordPoolRef.current);
    }, [gamePoolData, refillWordQueue]);

    useEffect(() => {
        reviewQueueRef.current = [...sessionPlan.reviewQueue];
        refillNormalQueue(sessionPlan.normalPool);
        refillWordQueue(flatWordPoolRef.current);
    }, [sessionPlan, refillNormalQueue, refillWordQueue]);

    const startGameRef = useRef(null);
    useEffect(() => { startGameRef.current = startGame; });
    useEffect(() => {
        const hasHanja = hanjaFilter && hanjaFilter.length > 0;
        const hasWords = reviewWordPoolRef.current.length > 0;
        if (hasHanja || hasWords) startGameRef.current?.();
    }, [hanjaFilter]);

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
        lastSpawnedIdRef.current = null;
        lastSpawnedWordRef.current = null;
        refillNormalQueue(sessionPlan.normalPool);
        refillWordQueue(flatWordPoolRef.current);
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
            if (onWaveClear) onWaveClear(waveKills);
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
                
                if (Math.random() < wordChance && flatWordPoolRef.current.length > 0) {
                    if (wordQueueRef.current.length === 0) refillWordQueue(flatWordPoolRef.current);
                    const wordItem = wordQueueRef.current.shift();
                    if (wordItem) {
                        lastSpawnedWordRef.current = wordItem.hanja;
                        nextItem = {
                            ...wordItem,
                            isWrongItem: (masteryData?.[String(wordItem.id)]?.wrongCount || 0) >= 1,
                        };
                        isWord = true;
                    }
                }

                if (!nextItem && sessionPlan.normalPool.length > 0) {
                    let ch;
                    if (reviewQueueRef.current.length > 0) {
                        ch = reviewQueueRef.current.shift();
                    } else {
                        if (normalQueueRef.current.length === 0) refillNormalQueue(sessionPlan.normalPool);
                        ch = normalQueueRef.current.shift();
                    }
                    if (ch) {
                        lastSpawnedIdRef.current = ch.id;
                        nextItem = { ...ch, isWrongItem: (masteryData?.[String(ch.id)]?.wrongCount || 0) >= 1 };
                    }
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
    }, [status, wave, waveTransition, gamePoolData, sessionPlan, masteryData, getDropSpeed, getSpawnInterval, getMeaning, diffConfig, refillWordQueue]);

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
            <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden" style={{ backgroundColor: '#F8FAF9' }}>
                {/* 헤더 */}
                <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                    <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                        <button onClick={onBack}
                            className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all w-11 h-11 font-bold text-[#AEB7C5]">
                            <span>←</span>
                        </button>
                        <div className="flex flex-col items-center min-w-0 flex-1 px-2">
                            <h2 className="text-h3 font-bold text-[#5B677A] m-0 break-keep">몬스터 슈팅</h2>
                        <p className="text-xs font-bold mt-0.5 text-center leading-tight break-keep" style={{ color: '#969CEB' }}>정답 한자를 맞춰 몬스터를 물리치세요</p>
                        </div>
                        <div className="w-11" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-6">
                    <div className="w-full max-w-xl mx-auto px-4 flex flex-col items-center gap-6 pt-5">

                        {/* 탭 */}
                        <div className="flex bg-[#F4F7F8]/40 p-1.5 rounded-full border border-[#E9EDF2] w-full mb-2 shadow-inner">
                            <button
                                onClick={() => setViewMode('grade')}
                                className={`flex-1 px-8 py-3 rounded-full font-bold text-h3 transition-all ${viewMode === 'grade' ? 'bg-white shadow-md text-[#5B677A]' : 'text-[#AEB7C5]'}`}
                            >
                                급수별
                            </button>
                            <button
                                onClick={() => setViewMode('topic')}
                                className={`flex-1 px-8 py-3 rounded-full font-bold text-h3 transition-all ${viewMode === 'topic' ? 'bg-white shadow-md text-[#5B677A]' : 'text-[#AEB7C5]'}`}
                            >
                                주제별
                            </button>
                        </div>

                        {/* 급수별 (커스텀 구현) */}
                        {viewMode === 'grade' && (
                            <div className="grid grid-cols-3 gap-3 w-full animate-in fade-in duration-500">
                                {GRADES.map(g => {
                                    const isLocked = g !== '전체' && !unlockedGrades.has(g);
                                    const isSelected = selectedGrade === g;
                                    const is8th = g === '8급';
                                    
                                    return (
                                        <button
                                            key={g}
                                            onClick={isLocked ? undefined : () => setSelectedGrade(g)}
                                            className={`relative py-4 rounded-3xl font-bold text-h3 transition-all border-4 flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 ${
                                                isLocked 
                                                ? 'bg-[#F8FAF9] border-[#E9EDF2] text-slate-200 cursor-not-allowed' 
                                                : isSelected
                                                    ? 'bg-white border-[#FF9B73] text-[#5B677A] shadow-lg'
                                                    : 'bg-white border-[#E9EDF2] text-[#5B677A] hover:border-[#E9EDF2]'
                                            }`}
                                        >
                                            {isLocked ? (
                                                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-slate-200">
                                                    <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 5a3 3 0 016 0v3H9V6zm3 10a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                                                </svg>
                                            ) : (
                                                <>
                                                    <span>{g}</span>
                                                    {isSelected && (
                                                        <div className="absolute -top-2 -right-2 bg-[#FF9B73] text-white rounded-full p-1 shadow-md">
                                                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-white stroke-[4]" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* 주제별 */}
                        {viewMode === 'topic' && (
                            <div className="grid grid-cols-2 gap-4 w-full animate-in fade-in duration-500">
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

                        {/* 몬스터 속도 */}
                        <div className="w-full mt-2">
                            <p className="text-h3 font-bold text-[#5B677A] mb-3 text-center uppercase tracking-widest">몬스터 속도</p>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => {
                                    const isSelected = selectedDifficulty === key;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedDifficulty(key)}
                                            className={`py-2.5 rounded-3xl font-bold transition-all flex flex-col items-center justify-center gap-1 active:scale-95 border-2 ${
                                                isSelected 
                                                ? 'bg-white border-[#FF9B73] text-[#5B677A] shadow-lg' 
                                                : 'bg-white border-[#E9EDF2] text-[#5B677A]'
                                            }`}
                                        >
                                            <span className="text-h3 font-bold text-[#5B677A]">{cfg.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 캐릭터 영역 (말풍선 + 캐릭터 + 바닥 그림자) */}
                        <div className="flex flex-col items-center mt-4 mb-5 relative">
                            {/* 말풍선 (우측 밀착 배치) */}
                            <div className="absolute top-4 left-[60%] z-20">
                                <div className="px-5 py-2 rounded-2xl shadow-xl border border-white relative bg-white/90 backdrop-blur-md">
                                    <span className="text-body font-bold text-[#5B677A] whitespace-nowrap break-keep">출동!</span>
                                    {/* 말풍선 꼬리 (왼쪽 하단으로 이동) */}
                                    <div className="absolute -bottom-1.5 left-3 w-4 h-4 rotate-45 bg-white border-r border-b border-white" />
                                </div>
                            </div>
                            
                            <div className="relative z-10 w-36 h-36 flex items-center justify-center mt-10">
                                <img src={characterAvatar} className="w-full h-full object-contain drop-shadow-2xl" alt="avatar" />
                            </div>
                            {/* 바닥 그림자 */}
                            <div className="w-40 h-4 bg-slate-400/20 blur-lg rounded-[100%] scale-x-125 -mt-6" />
                        </div>

                        {/* 하단 신설: 게임 시작 버튼 (민트 3D) */}
                        <div className="w-full max-w-sm px-4 pb-4 -mt-2.5">
                            <button
                                onClick={() => {
                                    // 급수가 선택되어 있지 않으면 8급 혹은 전체로 시작 로직을 보완할 수 있음
                                    startGame(selectedDifficulty);
                                }}
                                className="w-full py-5 rounded-[2rem] font-bold text-h3 text-white transition-all active:scale-95 shadow-xl shadow-[#FF9B73]/20/50 flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none"
                                style={{ 
                                    backgroundColor: '#FF9B73',
                                    borderBottom: '6px solid #E0735A'
                                }}
                            >
                                <span>게임 시작!</span>
                            </button>
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
        <div className="fixed inset-0 w-full h-full z-50 flex flex-col overflow-hidden bg-[#F7FAF9]">
            <style>{`@keyframes xpFloat{0%{opacity:0;transform:scale(0.6) translateY(16px)}28%{opacity:1;transform:scale(1.1) translateY(-6px)}40%{opacity:1;transform:scale(1) translateY(0)}68%{opacity:1;transform:scale(1) translateY(0)}100%{opacity:0;transform:translateY(-28px)}}`}</style>
            {xpPopup.show && (
                <div key={xpPopup.key} className="fixed inset-0 flex items-center justify-center pointer-events-none z-[200]" style={{ animation: 'xpFloat 1.5s ease-in-out forwards', paddingBottom: '80px' }}>
                    <div className="px-7 py-3 rounded-full font-extrabold text-xl" style={{ backgroundColor: 'rgba(255,180,51,0.12)', color: '#A07800', border: '2px solid #FFB433', boxShadow: '0 8px 28px rgba(255,215,0,0.5)' }}>
                        ⭐ +{xpPopup.amount} XP
                    </div>
                </div>
            )}
            <div className={`w-full mx-auto h-full flex flex-col relative ${shake ? "animate-shake" : ""}`}>
                {/* 상단 HUD */}
                <div className="absolute left-4 right-4 z-40 safe-top pt-4 flex justify-between items-center">
                    {/* 1. HP */}
                    <div className="h-10 bg-white/90 backdrop-blur-md rounded-2xl px-4 shadow-md border border-white/50 flex items-center gap-2">
                        {Array.from({ length: diffConfig.hp }).map((_, i) => (
                            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i < hp ? "bg-rose-300" : "bg-[#F4F7F8]"}`} />
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* 2. 진행도 */}
                        <div className="h-10 bg-white/90 backdrop-blur-md rounded-2xl px-4 shadow-md border border-white/50 flex items-center gap-3">
                            <div className="w-16 h-1.5 bg-[#F4F7F8] rounded-full overflow-hidden">
                                <div className="h-full bg-[#7C83FF] rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (waveKills / diffConfig.killsPerWave) * 100)}%` }} />
                            </div>
                        </div>
                        {/* 3. 스코어 */}
                        <div className="h-10 bg-white/90 backdrop-blur-md rounded-2xl px-4 shadow-md border border-white/50 flex items-center justify-center min-w-[3.5rem]">
                            <span className="font-bold text-[#AEB7C5] text-base leading-none tabular-nums">{score}</span>
                        </div>
                        {/* 4. 종료 */}
                        <button 
                            onClick={() => setShowExitModal(true)} 
                            className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white shadow-lg active:scale-95 transition-all group"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-slate-400 stroke-[3] group-hover:stroke-rose-400 transition-colors">
                                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
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
                                    <div className="flex flex-col items-center min-w-0 flex-1 px-2">
                                        {w.isWrongItem && (
                                            <div className="text-xs font-extrabold text-rose-400 mb-1 bg-white/90 px-2 py-0.5 rounded-full border border-rose-100 shadow-sm uppercase tracking-widest">Review</div>
                                        )}
                                        <div className={`w-14 h-14 md:w-20 md:h-20 animate-bounce ${w.isWrongItem ? "drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]" : "drop-shadow-md"}`}>
                                            <MonsterIcon />
                                        </div>
                                        <div className={`font-extrabold bg-white/95 text-[#5D544F] flex items-center justify-center rounded-xl shadow-lg border-2 px-2.5 py-1.5 transition-all duration-300 text-body-res max-w-[7rem] md:max-w-[9rem] ${
                                            w.isWrongItem ? "border-rose-200" : w.id === targetId ? "border-[#FFB433]/25 scale-110 shadow-[#FFB433]/15/50" : "border-[#E9EDF2]"
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
                        <div key={a.id} className="absolute pointer-events-none z-30 animate-float font-extrabold text-[#FFB433] text-2xl drop-shadow-lg" style={{ left: a.x + '%', top: a.y + '%', transform: 'translate(-50%, -50%)' }}>
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
                                className={`bg-white/95 px-5 py-2.5 rounded-[1.2rem] md:rounded-[1.8rem] font-extrabold border-4 border-white shadow-xl active:scale-95 transition-all text-center break-keep flex items-center justify-center gap-1.5 text-body-lg-res ${isInputLocked ? 'opacity-50 grayscale' : 'opacity-90 hover:opacity-100'}`}
                            >
                                {isWordTarget ? (
                                    <span className="text-slate-700 text-sm sm:text-base md:text-lg leading-tight">{meaning}</span>
                                ) : (
                                    <>
                                        <span className="text-slate-700 text-lg sm:text-xl md:text-2xl">{meaning}</span>
                                        <span className="text-[#7C83FF] text-lg sm:text-xl md:text-2xl">{sound}</span>
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
                        style={{ background: isClear ? 'linear-gradient(180deg, #DDF1EA 0%, #EAF6F2 100%)' : 'rgba(255,107,107,0.18)' }}
                    >
                        <div className="w-full max-w-sm flex flex-col items-center result-card-container overflow-hidden">
                            <div className="pt-6 pb-10 px-6 flex flex-col items-center gap-7 w-full relative">
                                {/* 캐릭터 아래 백그라운드 글로우 추가 */}
                                <div className="absolute top-[28px] w-[140px] h-[140px] rounded-full blur-xl z-0" style={{ backgroundColor: 'rgba(255,255,255,0.65)' }} />

                                <img
                                    src={isClear ? getCharacterImage(selectedCharacter, 'success') : getCharacterImage(selectedCharacter, 'failure')}
                                    alt={isClear ? 'clear' : 'over'}
                                    className="w-[176px] h-[176px] object-contain relative z-10 mt-4"
                                    style={{ filter: 'drop-shadow(0 12px 24px rgba(120,130,160,0.16))' }}
                                />
                                <div className="text-center flex flex-col gap-2 relative z-10 -mt-5">
                                    <span className="text-sm font-extrabold text-[#AEB7C5]">
                                        {isClear ? '정말 멋진 결과예요!' : '아쉬운 결과네요...'}
                                    </span>
                                    <h1 className="text-h2-res font-black leading-snug" style={{ 
                                        color: isClear ? '#FF9B73' : '#FF6B6B',
                                        letterSpacing: '-0.5px',
                                        textShadow: isClear ? '0 2px 10px rgba(255,160,120,0.16)' : 'none'
                                    }}>
                                        {isClear ? '와우! 참 잘했어요!' : <>괜찮아요,<br/>다시 도전해봐요!</>}
                                    </h1>
                                    <div className="flex flex-col items-center gap-1 mt-3">
                                        <p className="font-extrabold text-lg tracking-tight" style={{ color: '#A5AFBF', lineHeight: '1.4' }}>
                                            {score}마리의 몬스터 퇴치!<span className="text-[0.85em] inline-block ml-1">🔥</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="w-full flex flex-col gap-3 relative z-10">
                                    <button
                                        onClick={startGame}
                                        className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg retry-quiz-button"
                                    >
                                        다시 하기
                                    </button>
                                    <button
                                        onClick={hanjaFilter ? (onGameFinish || onBack) : () => setStatus('idle')}
                                        className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg active:scale-95 transition-all shadow-sm back-quiz-button"
                                    >
                                        돌아가기
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {showExitModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300" style={{ background: 'rgba(120, 130, 160, 0.22)' }}>
                    <div className="w-full max-w-sm flex flex-col items-center bg-white shadow-2xl rounded-[40px] p-8 relative overflow-hidden animate-in zoom-in-95 duration-200">
                        <img
                            src={getCharacterImage(selectedCharacter, 'keep_going')}
                            alt="exit confirm"
                            className="w-[120px] h-[120px] object-contain mb-4"
                            style={{ filter: 'drop-shadow(0 8px 16px rgba(120,130,160,0.16))' }}
                        />
                        <div className="text-center flex flex-col gap-2 mb-6">
                            <h2 className="text-h3-res font-black text-slate-700 tracking-tight leading-snug">
                                정말 게임을 중단할까요? 🥺
                            </h2>
                            <p className="text-xs-res font-bold leading-relaxed break-keep mt-1" style={{ color: '#A5AFBF', lineHeight: '1.4' }}>
                                지금 나가면 물리친 몬스터 점수와 기록이 저장되지 않아요. 계속 끝까지 싸워볼까요?
                            </p>
                        </div>
                        <div className="w-full flex flex-col gap-3">
                            <button
                                onClick={() => setShowExitModal(false)}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg retry-quiz-button"
                            >
                                계속 플레이하기
                            </button>
                            <button
                                onClick={handleExitConfirm}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg active:scale-95 transition-all shadow-sm back-quiz-button"
                            >
                                그만하고 나가기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShootGameScreen;
