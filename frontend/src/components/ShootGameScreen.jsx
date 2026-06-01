import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import {
    MONSTER_COMPONENTS, IconTarget, IconHpDrop, IconExplosionBig
} from './Icons.jsx';
import { useLang } from '../hooks/useLang.js';
import { getRankDetails, getCharacterImage } from '../utils/rankUtils.js';
import { buildHanjaStage, getSRSWeightedPool } from '../utils/learningPool.js';
import GradeGrid, { TopicCard } from './GradeGrid.jsx';
import { GRADES, CATEGORY_IMAGES } from '../constants/hanjaConstants.js';
import { useUnlockedHanja } from '../hooks/useUnlockedHanja.js';
import { SK } from '../constants/storageKeys.js';
import CtaButton from './common/CtaButton.jsx';
import RewardBreakdown from './common/RewardBreakdown.jsx';

const getStoredXp = () => {
    try { return Number(localStorage.getItem(SK.USER_XP) || '0'); } catch { return 0; }
};

// ─────────────────────────────────────────────
// 난이도 설정
// ─────────────────────────────────────────────
const DIFFICULTY_CONFIG = {
    normal: {
        dropSpeedBase: 0.28,
        dropSpeedPerWave: 0.03,
        maxOnScreen: 3,
        spawnIntervalBase: 1400,
        spawnIntervalPerWave: -120,
        wrongAnswerMode: 'same_theme',
        wavesTotal: 1,
        killsPerWave: 8,
        hp: 5,
    },
};

const DIFFICULTY_XP = {
    normal: { waveClear: 20, combo3: 0, combo5: 0 },
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
// 동적 밤하늘 개인 별빛 포지션 정보
// ─────────────────────────────────────────────
const COSMIC_STARS = [
    { id: 1,  left: '8%',  top: '5%',  size: 4,  delay: '0s',   speed: '2.8s' },
    { id: 2,  left: '22%', top: '3%',  size: 6,  delay: '0.5s', speed: '3.5s' },
    { id: 3,  left: '45%', top: '7%',  size: 3,  delay: '1.2s', speed: '2.2s' },
    { id: 4,  left: '68%', top: '4%',  size: 5,  delay: '0.8s', speed: '4.0s' },
    { id: 5,  left: '88%', top: '6%',  size: 4,  delay: '1.8s', speed: '3.0s' },
    { id: 6,  left: '5%',  top: '18%', size: 7,  delay: '0.3s', speed: '4.5s' },
    { id: 7,  left: '35%', top: '15%', size: 3,  delay: '2.1s', speed: '2.6s' },
    { id: 8,  left: '78%', top: '20%', size: 5,  delay: '1.4s', speed: '3.8s' },
    { id: 9,  left: '93%', top: '15%', size: 4,  delay: '0.7s', speed: '2.9s' },
    { id: 10, left: '15%', top: '32%', size: 6,  delay: '1.6s', speed: '4.2s' },
    { id: 11, left: '55%', top: '28%', size: 3,  delay: '2.4s', speed: '2.4s' },
    { id: 12, left: '82%', top: '38%', size: 8,  delay: '0.9s', speed: '5.0s' },
    { id: 13, left: '3%',  top: '48%', size: 5,  delay: '1.3s', speed: '3.3s' },
    { id: 14, left: '42%', top: '55%', size: 4,  delay: '2.7s', speed: '3.7s' },
    { id: 15, left: '72%', top: '50%', size: 3,  delay: '0.4s', speed: '2.1s' },
    { id: 16, left: '95%', top: '55%', size: 6,  delay: '1.9s', speed: '4.8s' },
    { id: 17, left: '20%', top: '68%', size: 4,  delay: '0.6s', speed: '3.1s' },
    { id: 18, left: '60%', top: '72%', size: 5,  delay: '2.2s', speed: '3.9s' },
    { id: 19, left: '88%', top: '78%', size: 3,  delay: '1.1s', speed: '2.7s' },
    { id: 20, left: '38%', top: '82%', size: 7,  delay: '0.2s', speed: '4.4s' },
    { id: 21, left: '10%', top: '90%', size: 4,  delay: '1.5s', speed: '3.6s' },
    { id: 22, left: '75%', top: '88%', size: 5,  delay: '0.9s', speed: '2.3s' },
];

const FLOATING_PARTICLES = [
    { id: 1, left: '18%', top: '72%', size: 9,  delay: '0s',   speed: '7s'   },
    { id: 2, left: '44%', top: '80%', size: 6,  delay: '1.8s', speed: '8.5s' },
    { id: 3, left: '70%', top: '68%', size: 11, delay: '3.2s', speed: '7.5s' },
    { id: 4, left: '8%',  top: '62%', size: 7,  delay: '2.1s', speed: '9s'   },
    { id: 5, left: '86%', top: '74%', size: 5,  delay: '4.4s', speed: '6.5s' },
    { id: 6, left: '54%', top: '58%', size: 8,  delay: '0.9s', speed: '8s'   },
];

// ─────────────────────────────────────────────
// 배경 우주선 월드 테마 설정
// ─────────────────────────────────────────────
const THEMES_CONFIG = {
    mint: {
        bgColor: 'linear-gradient(180deg, #A8DECE 0%, #CAEEE5 50%, #E8F8F4 100%)',
        animBg: 'linear-gradient(135deg, #A8DECE, #7EC8D8, #C5E8F0, #A8DEB8, #CAEEE5, #A8DECE)',
        nebulaColor: 'rgba(45, 212, 191, 0.32)',
        nebulaColor2: 'rgba(20, 184, 166, 0.20)',
        accentColor: '#2ED6C5',
        bottomGlow: 'rgba(45, 212, 191, 0.22)',
    },
    coral: {
        bgColor: 'linear-gradient(180deg, #F8B898 0%, #FAD4C0 50%, #FBF0E8 100%)',
        animBg: 'linear-gradient(135deg, #F8B898, #FAA070, #FBCAB0, #F8C8A8, #FAD4C0, #F8B898)',
        nebulaColor: 'rgba(251, 146, 60, 0.32)',
        nebulaColor2: 'rgba(234, 88, 12, 0.18)',
        accentColor: '#FF9B73',
        bottomGlow: 'rgba(251, 146, 60, 0.22)',
    },
    purple: {
        bgColor: 'linear-gradient(180deg, #B8ADFA 0%, #D4CEFC 50%, #EDEAFE 100%)',
        animBg: 'linear-gradient(135deg, #B8ADFA, #9C8FF8, #C8C2FF, #D4CEFC, #A8A0F8, #B8ADFA)',
        nebulaColor: 'rgba(139, 92, 246, 0.30)',
        nebulaColor2: 'rgba(99, 102, 241, 0.20)',
        accentColor: '#7C83FF',
        bottomGlow: 'rgba(139, 92, 246, 0.22)',
    },
    gold: {
        bgColor: 'linear-gradient(180deg, #FCCF62 0%, #FDE8A0 50%, #FAF6E0 100%)',
        animBg: 'linear-gradient(135deg, #FCCF62, #F8B830, #FDE8A0, #FAF0C0, #FCCF62, #FDE8A0)',
        nebulaColor: 'rgba(245, 158, 11, 0.30)',
        nebulaColor2: 'rgba(217, 119, 6, 0.18)',
        accentColor: '#EAB308',
        bottomGlow: 'rgba(245, 158, 11, 0.22)',
    }
};

const getGameThemeKey = (currentDay, selectedGrade) => {
    if (currentDay) {
        const dayNum = Number(currentDay);
        if (dayNum <= 30) return 'mint';
        if (dayNum <= 60) return 'coral';
        if (dayNum <= 90) return 'purple';
        return 'gold';
    }
    if (selectedGrade) {
        if (selectedGrade.includes('8급')) return 'mint';
        if (selectedGrade.includes('7급')) return 'coral';
        if (selectedGrade.includes('6급')) return 'purple';
        return 'gold';
    }
    return 'mint';
};

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
const ShootGameScreen = ({ onBack, onGameFinish, onHanjaAcquired, selectedCharacter, getRewardPreview, onMarkWrong, onMarkCorrect, onWordCorrect, onWordWrong, onWaveClear, masteryData, srsData, userLevel, contentPool, unlockedHanjaIds, currentDayHanjaIds, currentDay, seenHanjaIds, onHanjaSeen, onWordSeen, dailyMapNode, hideRetry, autoStart }) => {
    const { lang } = useLang();
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
    const [selectedGrade, setSelectedGrade] = useState('전체');
    const selectedDifficulty = 'normal';

    const [status, setStatus] = useState((contentPool || autoStart) ? 'loading' : 'idle');
    const [showExitModal, setShowExitModal] = useState(false);
    const handleExitConfirm = () => {
        setShowExitModal(false);
        onBack();
    };
    const [wave, setWave] = useState(1);
    const [waveKills, setWaveKills] = useState(0);
    const [waveTransition, setWaveTransition] = useState(false);
    const [clearCombo, setClearCombo] = useState(0); // 연속 웨이브 클리어 콤보
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
    const effectIdRef = useRef(0);
    const clearCountRef = useRef(0);

    const shipRef = useRef(null);
    const gameAreaRef = useRef(null);
    const hpRef = useRef(hp);
    useEffect(() => { hpRef.current = hp; }, [hp]);

    const diffConfig = useMemo(() => {
        const base = DIFFICULTY_CONFIG[selectedDifficulty] || DIFFICULTY_CONFIG.normal;
        return contentPool ? { ...base, wavesTotal: 1 } : base;
    }, [selectedDifficulty, contentPool]);

    const gamePoolData = useMemo(() => {
        let pool = [];
        if (contentPool) {
            const allIds = new Set([
                ...(contentPool.main?.hanjaIds || []),
                ...(contentPool.review?.hanjaIds || [])
            ]);
            // 단어 ID가 포함된 한자 ID도 추가
            const wordIds = new Set([
                ...(contentPool.main?.wordIds || []),
                ...(contentPool.review?.wordIds || [])
            ]);
            if (wordIds.size > 0) {
                HANJA_DATA.forEach(h => {
                    if (h.words && h.words.some(w => wordIds.has(w.id))) {
                        allIds.add(h.id);
                    }
                });
            }
            pool = HANJA_DATA.filter(h => allIds.has(h.id));
            
            // fallback: 만약 pool이 텅 비어있다면 8급 전체 한자로 대체 (에러 방지)
            if (pool.length === 0) {
                pool = HANJA_DATA.filter(h => h.grade === '8급');
            }
        } else if (viewMode === 'grade') {
            if (selectedGrade === '전체') pool = HANJA_DATA;
            else pool = HANJA_DATA.filter(h => h.grade === selectedGrade);
            // unlockedIds가 비어있으면(커리큘럼 미진행) 해당 급수 전체 한자를 폴백으로 사용
            const locked = pool.filter(h => unlockedIds.has(h.id));
            pool = locked.length > 0 ? locked : pool;
        } else {
            const full = HANJA_DATA.filter(h => h.category === selectedCategory);
            const locked = full.filter(h => unlockedIds.has(h.id));
            pool = locked.length > 0 ? locked : full;
        }
        const relevantWords = pool.filter(h => h.words && h.words.length > 0);
        return { chars: pool, words: relevantWords };
    }, [viewMode, selectedGrade, selectedCategory, contentPool, unlockedIds]);

    // 게임 시작 시점에 한번에 선택된 한자 풀 (순환 스폰용)
    const hanjaStageRef = useRef([]);
    const stageIndexRef = useRef(0);

    const lastSpawnedIdRef = useRef(null);
    const wordQueueRef = useRef([]);
    const lastSpawnedWordRef = useRef(null);
    const flatWordPoolRef = useRef([]);
    const spawnedWordsSetRef = useRef(new Set());
    const onHanjaSeenRef = useRef(onHanjaSeen);
    useEffect(() => { onHanjaSeenRef.current = onHanjaSeen; });
    const onWordSeenRef = useRef(onWordSeen);
    useEffect(() => { onWordSeenRef.current = onWordSeen; });
    const wordChanceRef = useRef(0.83);
    const gameWrongHanjasRef = useRef(new Set());
    const gameWrongWordsRef = useRef(new Map()); // wordId → { hanjaId, reading, meaning }
    const [wrongItemsForRender, setWrongItemsForRender] = useState([]);

    const flushWrongItems = useCallback(() => {
        gameWrongHanjasRef.current.forEach(pairId => {
            if (pairId && onMarkWrong) onMarkWrong(pairId);
        });
        gameWrongWordsRef.current.forEach((info, wordId) => {
            if (wordId && onWordWrong) onWordWrong(wordId, info.hanjaId, info.reading, info.meaning);
        });
        gameWrongHanjasRef.current.clear();
        gameWrongWordsRef.current.clear();
    }, [onMarkWrong, onWordWrong]);

    const refillWordQueue = useCallback((pool) => {
        if (!pool || pool.length === 0) return;
        let ordered;
        if (!contentPool && currentDayHanjaIds?.length > 0) {
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
    }, [contentPool, currentDayHanjaIds]);

    // 단어 풀을 flat 배열로 유지
    useEffect(() => {
        const oopsWordIds = new Set([
            ...(contentPool?.main?.wordIds || []),
            ...(contentPool?.review?.wordIds || []),
        ]);
        if (oopsWordIds.size > 0) {
            // 특정 단어만 몬스터로 등장 (오답/복습 모드)
            flatWordPoolRef.current = gamePoolData.words.flatMap(h =>
                (h.words || []).filter(w => oopsWordIds.has(w.id) && w.word && w.meaning && w.reading).map(w => ({
                    id: h.id, wordId: w.id, hanja: w.word, meaning: w.meaning, sound: w.reading, category: h.category,
                }))
            );
        } else {
            flatWordPoolRef.current = gamePoolData.words.flatMap(h =>
                (h.words || []).filter(w => w.word && w.meaning && w.reading).map(w => ({
                    id: h.id, wordId: w.id, hanja: w.word, meaning: w.meaning, sound: w.reading, category: h.category,
                }))
            );
        }
        refillWordQueue(flatWordPoolRef.current);
    }, [gamePoolData, contentPool, refillWordQueue]);

    function startGame(overrideDiff) {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                if (!window.myAudioCtx) window.myAudioCtx = new AudioCtx();
                if (window.myAudioCtx.state === 'suspended') window.myAudioCtx.resume();
            }
        } catch (e) {}

        const effectiveDiff = overrideDiff ? (DIFFICULTY_CONFIG[overrideDiff] || diffConfig) : diffConfig;
        // 게임 시작 시점에 한자 풀 사전 선택 (게임 중 srsData/masteryData 변경 무시)
        let stage;
        if (contentPool) {
            stage = buildHanjaStage(contentPool, gamePoolData.chars, srsData, masteryData, seenHanjaIds || [], effectiveDiff.killsPerWave);
        } else {
            stage = getSRSWeightedPool(gamePoolData.chars, srsData, masteryData, userLevel, effectiveDiff.killsPerWave, currentDayHanjaIds?.length > 0 ? currentDayHanjaIds : null);
        }
        if (stage.length === 0) stage = [...gamePoolData.chars].sort(() => Math.random() - 0.5).slice(0, effectiveDiff.killsPerWave);
        hanjaStageRef.current = stage;
        stageIndexRef.current = 0;

        lastSpawnedIdRef.current = null;
        lastSpawnedWordRef.current = null;
        spawnedWordsSetRef.current = new Set();
        refillWordQueue(flatWordPoolRef.current);

        // contentPool 모드는 단어 복습 체감이 중요해서 단어가 있으면 최소 등장 비율을 보장한다.
        const totalWords = flatWordPoolRef.current.length;
        const totalHanja = stage.length;
        const baseWordChance = totalWords / Math.max(totalWords + totalHanja, 1);
        wordChanceRef.current = totalWords > 0
            ? Math.min(0.75, contentPool ? Math.max(0.45, baseWordChance) : baseWordChance)
            : 0;

        setWave(1);
        setWaveKills(0);
        setWaveTransition(false);
        setScore(0);
        setSessionXp(0);
        setHp(effectiveDiff.hp);
        hpRef.current = effectiveDiff.hp;
        setWords([]);
        setTargetId(null);
        setOptions([]);
        setShake(false);
        setClearCombo(0);
        
        // 오답 큐 및 렌더 칩 리셋
        gameWrongHanjasRef.current.clear();
        gameWrongWordsRef.current.clear();
        setWrongItemsForRender([]);
        
        setStatus('playing');
    }

    const startGameRef = useRef(null);
    useEffect(() => { startGameRef.current = startGame; });

    // contentPool이 prop 참조 변경(hanjaData 업데이트)으로 매번 새 객체가 되므로,
    // 실제 출제 대상 ID 내용이 바뀔 때만 auto-start하도록 키로 비교한다.
    const lastContentKeyRef = useRef(null);
    useEffect(() => {
        if (contentPool == null && !autoStart) return undefined;
        const normalizeIds = (ids) => [...(ids || [])].map(Number).sort((a, b) => a - b);
        const key = JSON.stringify({
            mainHanja: normalizeIds(contentPool?.main?.hanjaIds),
            reviewHanja: normalizeIds(contentPool?.review?.hanjaIds),
            mainWords: normalizeIds(contentPool?.main?.wordIds),
            reviewWords: normalizeIds(contentPool?.review?.wordIds),
        });
        if (key !== lastContentKeyRef.current) {
            lastContentKeyRef.current = key;
            const timer = setTimeout(() => startGameRef.current?.(), 0);
            return () => clearTimeout(timer);
        }
        if (status === 'loading') {
            const timer = setTimeout(() => startGameRef.current?.(), 0);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [contentPool, autoStart, status]);

    // 현재 웨이브 기반 속도/간격 계산
    const getDropSpeed = useCallback((currentWave) => {
        return diffConfig.dropSpeedBase + (currentWave - 1) * diffConfig.dropSpeedPerWave;
    }, [diffConfig]);

    const getSpawnInterval = useCallback((currentWave) => {
        return Math.max(800, diffConfig.spawnIntervalBase + (currentWave - 1) * diffConfig.spawnIntervalPerWave);
    }, [diffConfig]);

    // HP 0 → game over
    useEffect(() => {
        if (hp > 0 || status !== 'playing') return undefined;

        const timer = setTimeout(() => {
            setStatus('over');
        }, 0);

        return () => clearTimeout(timer);
    }, [hp, status]);

    // 웨이브 킬 수 체크 → 다음 웨이브 or 게임 클리어
    useEffect(() => {
        if (status !== 'playing' || waveTransition || waveKills < diffConfig.killsPerWave) return undefined;

        const timer = setTimeout(() => {
            // 웨이브 클리어 XP
            const xpTable = DIFFICULTY_XP[selectedDifficulty] || DIFFICULTY_XP['normal'];
            const newCombo = clearCombo + 1;
            setClearCombo(newCombo);
            const xpEarned = xpTable.waveClear;
            if (onHanjaAcquired) {
                onHanjaAcquired(null, xpEarned);
                effectIdRef.current += 1;
                setXpPopup({ show: true, key: effectIdRef.current, amount: xpEarned });
                setTimeout(() => setXpPopup(p => ({ ...p, show: false })), 1500);
            }
            setSessionXp(prev => prev + xpEarned);
            if (onWaveClear) onWaveClear(waveKills);
            setWaveTransition(true); // <-- 무한 루프 방지
            
            if (wave >= diffConfig.wavesTotal) {
                clearCountRef.current += 1;
                setTimeout(() => setStatus('clear'), 1200);
            } else {
                setWords([]);
                setTimeout(() => {
                    setWave(prev => prev + 1);
                    setWaveKills(0);
                    setWaveTransition(false);
                }, 2000);
            }
        }, 0);

        return () => clearTimeout(timer);
    }, [waveKills, wave, diffConfig, status, waveTransition, selectedDifficulty, clearCombo, onHanjaAcquired, onWaveClear, dailyMapNode, flushWrongItems, onGameFinish]);

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
                
                if (Math.random() < wordChanceRef.current && flatWordPoolRef.current.length > 0) {
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

                if (!nextItem && hanjaStageRef.current.length > 0) {
                    if (stageIndexRef.current >= hanjaStageRef.current.length) {
                        const reshuffled = [...hanjaStageRef.current].sort(() => Math.random() - 0.5);
                        if (reshuffled.length > 1 && reshuffled[0]?.id === lastSpawnedIdRef.current) {
                            const [first, ...rest] = reshuffled;
                            hanjaStageRef.current = [...rest, first];
                        } else {
                            hanjaStageRef.current = reshuffled;
                        }
                        stageIndexRef.current = 0;
                    }
                    const ch = hanjaStageRef.current[stageIndexRef.current++];
                    if (ch) {
                        lastSpawnedIdRef.current = ch.id;
                        nextItem = { ...ch, isWrongItem: (masteryData?.[String(ch.id)]?.wrongCount || 0) >= 1 };
                    }
                }

                if (!nextItem) return prev;
                if (fallingHanjas.has(nextItem.hanja)) return prev;
                if (isWord && nextItem.hanja) {
                    spawnedWordsSetRef.current.add(nextItem.hanja);
                    if (nextItem.wordId != null) onWordSeenRef.current?.(nextItem.wordId);
                }

                effectIdRef.current += 1;
                return [...prev, {
                    id: effectIdRef.current,
                    pairId: nextItem.id,
                    wordId: nextItem.wordId || null,
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
    }, [status, wave, waveTransition, gamePoolData, masteryData, getDropSpeed, getSpawnInterval, getMeaning, diffConfig, refillWordQueue]);

    // 타겟 & 보기 갱신
    useEffect(() => {
        if (status !== 'playing' || words.length === 0) {
            const timer = setTimeout(() => {
                setOptions([]);
                setTargetId(null);
            }, 0);
            return () => clearTimeout(timer);
        }
        const fallingWords = words.filter(w => w.state === 'falling');
        if (fallingWords.length === 0) return undefined;
        const lowestWord = fallingWords.reduce((prev, curr) => (prev.y > curr.y ? prev : curr), fallingWords[0]);
        if (lowestWord.id !== targetId) {
            const timer = setTimeout(() => {
                setTargetId(lowestWord.id);
                setIsWordTarget(lowestWord.isWord || false);
                const allChars = gamePoolData.chars.length > 10 ? gamePoolData.chars : HANJA_DATA;
                const wrongOpts = getWrongOptions(lowestWord, allChars, diffConfig.wrongAnswerMode, lowestWord.category);
                setOptions([...wrongOpts, lowestWord.answer].sort(() => 0.5 - Math.random()));
            }, 0);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [words, status, targetId, gamePoolData, diffConfig]);

    const handleOptionClick = (selectedAnswer) => {
        if (status !== 'playing' || !targetId || inputLockedRef.current) return;
        const target = words.find(w => w.id === targetId);
        if (!target) return;
        if (selectedAnswer === target.answer) {
            inputLockedRef.current = true;
            const dx = target.x - 50; const dy = target.y - 85;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            setTurretAngle(angle);
            effectIdRef.current += 1;
            const laserId = effectIdRef.current;
            setLasers(prev => [...prev, { id: laserId, targetX: target.x, targetY: target.y, shipX: 50, shipY: 95 }]);
            setTimeout(() => { setLasers(prev => prev.filter(l => l.id !== laserId)); }, 100);
            setWords(prev => prev.map(w => w.id === targetId ? { ...w, state: 'exploding', timer: 6 } : w));
            setScore(prev => prev + 1);
            setWaveKills(prev => prev + 1);
            if (onMarkCorrect) onMarkCorrect(target.pairId);
            // 한자 ID(숫자)로 seen 보고 — 한자 몬스터와 단어 몬스터 모두
            if (target.pairId != null) onHanjaSeenRef.current?.([target.pairId]);
            if (target.isWord && target.wordId != null) onWordCorrect?.(target.wordId);
            if (onHanjaAcquired) onHanjaAcquired(target.pairId, 3);
            effectIdRef.current += 1;
            const acqId = effectIdRef.current;
            setAcquisitions(prev => [...prev, { id: acqId, x: target.x, y: target.y, hanja: target.hanja }]);
            setTimeout(() => { setAcquisitions(prev => prev.filter(a => a.id !== acqId)); inputLockedRef.current = false; }, 1000);
        } else {
            inputLockedRef.current = true;
            setShake(true);
            setIsInputLocked(true);
            setHp(prev => Math.max(0, prev - 1));
            
            // 즉시 전송하지 않고 임시 셋에 오답 수집
            if (target.pairId) gameWrongHanjasRef.current.add(target.pairId);
            if (target.isWord && target.wordId != null) {
                gameWrongWordsRef.current.set(target.wordId, {
                    hanjaId: target.pairId || null,
                    reading: target.sound || '',
                    meaning: target.meaning || '',
                });
            }
            
            // 결과 모달 노출용 칩 정보 적재 (정답 뜻/음 칩)
            const isExist = wrongItemsForRender.some(item => item.hanja === target.hanja);
            if (!isExist) {
                setWrongItemsForRender(prev => [...prev, {
                    hanja: target.hanja,
                    answer: target.answer,
                    isWord: target.isWord
                }]);
            }
            
            setTimeout(() => { setShake(false); setIsInputLocked(false); inputLockedRef.current = false; }, 800);
        }
    };

    const themeKey = getGameThemeKey(currentDay, selectedGrade);
    const themeConfig = THEMES_CONFIG[themeKey] || THEMES_CONFIG.mint;

    // <style> 태그를 document.head에 주입 — early return 앞에 있어야 Rules of Hooks 위반 없음
    useEffect(() => {
        const el = document.getElementById('shoot-game-theme-style') || (() => {
            const s = document.createElement('style');
            s.id = 'shoot-game-theme-style';
            document.head.appendChild(s);
            return s;
        })();
        el.textContent = `
            .shoot-game-theme-container {
                background: ${themeConfig.animBg};
                background-size: 400% 400%;
                animation: bgShift 12s ease infinite, hueShift 20s linear infinite;
            }
            .shoot-game-theme-container.result-active {
                animation: bgShift 12s ease infinite;
                filter: none !important;
            }
            @keyframes bgShift {
                0%   { background-position: 0% 50%; }
                50%  { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            @keyframes hueShift {
                0%   { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }
            @keyframes starSparkle {
                0%, 100% { opacity: 0.18; transform: scale(0.7); }
                50% { opacity: 1; transform: scale(1.4); }
            }
            @keyframes particleDrift {
                0%   { opacity: 0; transform: translateY(0px) scale(0.5); }
                12%  { opacity: 0.6; }
                80%  { opacity: 0.35; }
                100% { opacity: 0; transform: translateY(-80px) scale(1.2); }
            }
        `;
        return () => { el.textContent = ''; };
    }, [themeConfig]);

    // ─────────────────────────────────────────
    // IDLE 화면
    // ─────────────────────────────────────────
    if (status === 'loading') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F7FAF9] px-8">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div
                        className="h-16 w-16 rounded-[1.4rem] border-4 border-white shadow-lg animate-pulse"
                        style={{ backgroundColor: themeConfig.accentColor }}
                    />
                    <p className="text-body-lg font-black text-[#5B677A] break-keep">몬스터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (status === 'idle') {
        return (
            <div className="quiz-screen quiz-screen--plain" style={{ backgroundColor: '#F8FAF9' }}>
                {/* 헤더 */}
                <div className="quiz-header-wrap quiz-header-wrap--sm">
                    <div className="quiz-header-card quiz-header-card--wide">
                        <button onClick={onBack}
                            className="hp-nav-button">
                            <span>←</span>
                        </button>
                        <div className="quiz-header-title-area">
                            <h2 className="quiz-screen-title">몬스터 슈팅</h2>
                        <p className="screen-subtitle">정답 한자를 맞춰 몬스터를 물리치세요</p>
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


                        {/* 캐릭터 영역 (말풍선 + 캐릭터 + 바닥 그림자) */}
                        <div className="flex flex-col items-center mt-4 mb-5 relative">
                            {/* 말풍선 (우측 밀착 배치) */}
                            <div className="absolute top-4 left-[60%] z-20">
                                <div className="quiz-bubble">
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

    const isClear = status === 'clear';
    const isResult = status === 'over' || status === 'clear';
    const killXp = score * 3;
    const shootClearXp = isClear ? 20 : 0;
    const reward = getRewardPreview?.(killXp + shootClearXp);

    // ─────────────────────────────────────────
    // 게임 화면
    // ─────────────────────────────────────────
    return (
        <div className={`fixed inset-0 w-full h-full z-50 flex flex-col overflow-hidden transition-all duration-1000 ease-out shoot-game-theme-container ${isResult ? 'result-active' : ''}`}>

            {/* Twinkling Stars */}
            {COSMIC_STARS.map(star => (
                <div
                    key={star.id}
                    className="absolute rounded-full pointer-events-none z-0"
                    style={{
                        left: star.left,
                        top: star.top,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        backgroundColor: themeConfig.accentColor,
                        boxShadow: `0 0 6px ${themeConfig.accentColor}, 0 0 14px ${themeConfig.accentColor}, 0 0 28px ${themeConfig.accentColor}`,
                        animation: `starSparkle ${star.speed} ease-in-out infinite`,
                        animationDelay: star.delay,
                    }}
                />
            ))}

            {/* Nebula Orb 1 — 화면 상단 중앙 */}
            <div
                className="absolute pointer-events-none z-0 rounded-full animate-pulse"
                style={{
                    left: '20%', top: '5%',
                    width: '320px', height: '320px',
                    background: `radial-gradient(circle, ${themeConfig.nebulaColor} 0%, transparent 70%)`,
                    filter: 'blur(40px)',
                    animationDuration: '5s',
                }}
            />
            {/* Nebula Orb 2 — 우측 상단 */}
            <div
                className="absolute pointer-events-none z-0 rounded-full animate-pulse"
                style={{
                    left: '55%', top: '10%',
                    width: '260px', height: '260px',
                    background: `radial-gradient(circle, ${themeConfig.nebulaColor2} 0%, transparent 70%)`,
                    filter: 'blur(50px)',
                    animationDuration: '7s',
                    animationDelay: '2s',
                }}
            />

            {/* 하단 바닥 글로우 */}
            <div
                className="absolute bottom-0 left-0 right-0 pointer-events-none z-0"
                style={{
                    height: '180px',
                    background: `linear-gradient(0deg, ${themeConfig.bottomGlow} 0%, transparent 100%)`,
                }}
            />

            {/* Floating Particles */}
            {FLOATING_PARTICLES.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full pointer-events-none z-0"
                    style={{
                        left: p.left,
                        top: p.top,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: themeConfig.accentColor,
                        boxShadow: `0 0 12px ${themeConfig.accentColor}`,
                        animation: `particleDrift ${p.speed} ease-in-out infinite`,
                        animationDelay: p.delay,
                    }}
                />
            ))}
            {xpPopup.show && (
                <div key={xpPopup.key} className="xp-popup-wrapper xp-popup-wrapper--low">
                    <div className="xp-popup-badge">
                        ⭐ 클리어 +{xpPopup.amount} XP
                    </div>
                </div>
            )}
            <div className={`w-full mx-auto h-full flex flex-col relative ${shake ? "animate-shake" : ""}`}>
                {/* 상단 HUD */}
                <div className="absolute top-0 left-2 right-2 z-40 safe-top pt-3 flex items-center gap-1.5">
                    {/* 1. HP */}
                    <div className="h-9 bg-white/90 backdrop-blur-md rounded-2xl px-3 shadow-md border border-white/50 flex items-center gap-1.5 shrink-0">
                        {Array.from({ length: diffConfig.hp }).map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i < hp ? "bg-rose-300" : "bg-[#F4F7F8]"}`} />
                        ))}
                    </div>

                    {/* 2. 진행도 */}
                    <div className="h-9 bg-white/90 backdrop-blur-md rounded-2xl px-3 shadow-md border border-white/50 flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex-1 h-2 bg-[#F4F7F8] rounded-full overflow-hidden">
                            <div className="quiz-progress-fill" style={{ width: `${Math.min(100, (waveKills / diffConfig.killsPerWave) * 100)}%`, backgroundColor: themeConfig.accentColor }} />
                        </div>
                        <span className="text-xs font-black text-[#AEB7C5] tabular-nums whitespace-nowrap">{waveKills}/{diffConfig.killsPerWave}</span>
                    </div>

                    {/* 3. 스코어 */}
                    <div className="h-9 bg-white/90 backdrop-blur-md rounded-2xl px-3 shadow-md border border-white/50 flex items-center justify-center shrink-0 min-w-[2.5rem]">
                        <span className="font-bold text-[#AEB7C5] text-sm leading-none tabular-nums">{score}</span>
                    </div>

                    {/* 4. 종료 */}
                    <button 
                        onClick={() => setShowExitModal(true)} 
                        className="hp-nav-button hp-nav-button--compact shrink-0"
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-slate-400 stroke-[3]">
                            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
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
                                    <div className="quiz-header-title-area">
                                        {/* Review 라벨 삭제 */}
                                        <div className={`w-14 h-14 md:w-20 md:h-20 animate-bounce ${w.isWrongItem ? "drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]" : "drop-shadow-md"}`}>
                                            <MonsterIcon />
                                        </div>
                                        <div className={`font-extrabold text-[#5D544F] flex items-center justify-center rounded-xl shadow-lg border-2 px-2.5 py-1.5 transition-all duration-300 text-body-res max-w-[7rem] md:max-w-[9rem] ${
                                            w.isWrongItem ? "bg-white/95 border-rose-200" : w.id === targetId ? "bg-[#FFB433]/15 border-[#FFB433] scale-110 shadow-[#FFB433]/15/50" : "bg-white/95 border-[#E9EDF2]"
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
                            +3 XP ✨
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
                                className={`bg-white/95 px-4 py-1.5 rounded-[1.2rem] md:rounded-[1.8rem] font-extrabold border-4 border-white shadow-xl active:scale-95 transition-all text-center break-keep flex items-center justify-center gap-1.5 text-body-lg-res ${isInputLocked ? 'opacity-50 grayscale' : 'opacity-90 hover:opacity-100'}`}
                            >
                                {isWordTarget ? (
                                    <span className="text-slate-700 text-sm sm:text-base md:text-lg leading-tight">{meaning}</span>
                                ) : (
                                    <>
                                        <span className="text-slate-700 text-sm sm:text-base md:text-lg leading-tight">{meaning}</span>
                                        <span className="text-[#7C83FF] text-sm sm:text-base md:text-lg leading-tight">{sound}</span>
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
                                {(!dailyMapNode || !isClear) && (
                                    <div className="absolute top-[28px] w-[140px] h-[140px] rounded-full blur-xl z-0" style={{ backgroundColor: 'rgba(255,255,255,0.65)' }} />
                                )}

                                {(!dailyMapNode || !isClear) && (
                                    <img
                                        src={isClear ? getCharacterImage(selectedCharacter, 'success') : getCharacterImage(selectedCharacter, 'failure')}
                                        alt={isClear ? 'clear' : 'over'}
                                        className="w-[176px] h-[176px] object-contain relative z-10 mt-4"
                                        className="img-shadow-lg"
                                    />
                                )}
                                
                                <div className="text-center flex flex-col gap-1 w-full relative z-10">
                                    <span className="text-sm font-extrabold text-[#94A3B8]">
                                        {isClear ? '데일리 세션을 모두 완료했어요!' : '아쉬운 결과네요...'}
                                    </span>
                                    <h1 className="text-3xl font-black leading-tight mt-1" style={{
                                        color: isClear ? '#FF9B73' : '#FF6B6B',
                                        letterSpacing: '-0.02em',
                                        textShadow: isClear ? '0 2px 10px rgba(255,160,120,0.15)' : 'none'
                                    }}>
                                        {isClear ? '와우! 참 잘했어요!' : <>괜찮아요,<br/>다시 도전해봐요!</>}
                                    </h1>
                                    {!isClear && (
                                        <div className="flex flex-col items-center gap-1 mt-3">
                                            <p className="font-extrabold text-lg tracking-tight" style={{ color: '#A5AFBF', lineHeight: '1.4' }}>
                                                {score}마리의 몬스터 퇴치!<span className="text-[0.85em] inline-block ml-1">🔥</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* 여정 지도 (데일리 세션 클리어 시) */}
                                {(dailyMapNode && isClear) && (
                                    <div className="w-full">
                                        {dailyMapNode}
                                    </div>
                                )}

                                <RewardBreakdown
                                    reward={reward}
                                    correctXp={killXp}
                                    clearXp={shootClearXp}
                                    correctLabel="몬스터 처치"
                                    detailText={`${score}마리 x 3XP${isClear ? ` + 완료 20XP` : ''}`}
                                    missionXp={(isClear && clearCountRef.current === 1) ? 20 : 0}
                                />

                                {/* 몬스터 오답 노트 (Review Note) */}
                                {wrongItemsForRender.length > 0 && (
                                    <div className="w-full flex flex-col gap-2 relative z-10 mt-1 max-h-[140px] overflow-y-auto px-1">
                                        <p className="text-xs font-black text-[#FF6B6B] text-center mb-1">몬스터 오답 노트</p>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {wrongItemsForRender.map((w, idx) => (
                                                <div key={idx} className="bg-rose-50 border border-rose-100 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm">
                                                    <span className="font-extrabold text-rose-500 text-sm">{w.hanja}</span>
                                                    <span className="text-[10px] font-bold text-slate-400">{w.answer}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="w-full flex flex-col gap-3 relative z-10">
                                    {!hideRetry && (
                                        <CtaButton
                                            theme="indigo"
                                            onClick={() => {
                                                flushWrongItems();
                                                startGame();
                                            }}
                                        >
                                            <span className="quiz-cta-text">계속하기</span>
                                        </CtaButton>
                                    )}
                                    {(dailyMapNode && isClear) ? (
                                        <CtaButton
                                            theme="coral"
                                            onClick={() => {
                                                flushWrongItems();
                                                if (contentPool) {
                                                    if (onGameFinish) onGameFinish();
                                                    else onBack();
                                                } else {
                                                    setStatus('idle');
                                                }
                                            }}
                                        >
                                            <span className="quiz-cta-text">다음 단계로 이동</span>
                                            <span className="quiz-cta-text ml-2">▶</span>
                                        </CtaButton>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                flushWrongItems();
                                                if (contentPool) {
                                                    if (onGameFinish && isClear) onGameFinish();
                                                    else onBack();
                                                } else {
                                                    setStatus('idle');
                                                }
                                            }}
                                            className="w-full py-5 rounded-2xl font-black text-[1.5rem] active:scale-95 transition-all shadow-sm back-quiz-button"
                                        >
                                            돌아가기
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {showExitModal && (
                <div className="modal-overlay">
                    <div className="quiz-result-card">
                        <img
                            src={getCharacterImage(selectedCharacter, 'keep_going')}
                            alt="exit confirm"
                            className="quiz-char-img"
                            className="img-shadow-sm"
                        />
                        <div className="quiz-result-content">
                            <h2 className="quiz-result-title">
                                {dailyMapNode ? '학습 지도로 돌아갈까요?' : '정말 게임을 중단할까요? 🥺'}
                            </h2>
                            <p className="body-muted break-keep">
                                {dailyMapNode ? '지도로 돌아가면 진행 중인 게임은 완료되지 않아요. 계속 끝까지 플레이할까요?' : '지금 나가면 물리친 몬스터 점수와 기록이 저장되지 않아요. 계속 끝까지 싸워볼까요?'}
                            </p>
                        </div>
                        <div className="w-full flex flex-col gap-3">
                            <CtaButton theme="indigo" onClick={() => setShowExitModal(false)}>
                                <span className="quiz-cta-text">계속 플레이하기</span>
                            </CtaButton>
                            <button
                                onClick={handleExitConfirm}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg active:scale-95 transition-all shadow-sm back-quiz-button"
                            >
                                {dailyMapNode ? '학습 지도로 돌아가기' : '그만하고 나가기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShootGameScreen;
