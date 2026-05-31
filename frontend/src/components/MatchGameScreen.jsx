import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import HANJA_DATA_RAW from '../hanja_unified.json';
import { getSRSWeightedPool } from '../utils/learningPool.js';
import GradeGrid, { TopicCard } from './GradeGrid.jsx';
import { getRankDetails, getCharacterImage } from '../utils/rankUtils.js';
import { GRADES, CATEGORY_IMAGES } from '../constants/hanjaConstants.js';
import { useUnlockedHanja } from '../hooks/useUnlockedHanja.js';
import RewardBreakdown from './common/RewardBreakdown.jsx';
import CtaButton from './common/CtaButton.jsx';

// ── 중복 제거된 데이터 (hanja 문자 기준) ────────────────────────────────────
const HANJA_DATA = Object.values(
    HANJA_DATA_RAW.reduce((acc, h) => { if (!acc[h.hanja]) acc[h.hanja] = h; return acc; }, {})
);

// ── 급수 정의 ────────────────────────────────────────────────────────────────
const GRADE_LIST = ['8급', '7급Ⅱ', '7급', '6급Ⅱ', '6급', 'NON'];
const GRADE_LABELS = { '8급': '8급', '7급Ⅱ': '7급Ⅱ', '7급': '7급', '6급Ⅱ': '6급Ⅱ', '6급': '6급', 'NON': '기타' };
// ── 급수별 XP 테이블 ─────────────────────────────────────────────────────────
const GRADE_XP = {
    '8급':  { base: 3, combo3: 0, combo5: 0 },
    '7급Ⅱ': { base: 3, combo3: 0, combo5: 0 },
    '7급':  { base: 3, combo3: 0, combo5: 0 },
    '6급Ⅱ': { base: 3, combo3: 0, combo5: 0 },
    '6급':  { base: 3, combo3: 0, combo5: 0 },
    'NON':  { base: 3, combo3: 0, combo5: 0 },
};
const GRADE_COLORS = {
    '8급':  { bg: 'bg-rose-400',    text: 'text-rose-400',    light: 'bg-rose-50',    border: 'border-rose-200' },
    '7급Ⅱ': { bg: 'bg-[#FFB433]',  text: 'text-[#FFB433]',  light: 'bg-[#FFB433]/10',  border: 'border-[#FFB433]/25' },
    '7급':  { bg: 'bg-[#FFB433]',   text: 'text-[#FFB433]',   light: 'bg-[#FFB433]/10',   border: 'border-[#FFB433]/25' },
    '6급Ⅱ': { bg: 'bg-[#FF9B73]', text: 'text-[#FF9B73]', light: 'bg-[#FF9B73]/10', border: 'border-[#FF9B73]/30' },
    '6급':  { bg: 'bg-blue-500',    text: 'text-blue-500',    light: 'bg-blue-50',    border: 'border-blue-200' },
    'NON':  { bg: 'bg-purple-500',  text: 'text-purple-500',  light: 'bg-purple-50',  border: 'border-purple-200' },
};


// ── 급수별 전체 페어 풀 생성 (한자 + 단어 혼합) ──────────────────────────────
const buildPairPool = (items) => {
    const pairs = [];
    // 1) 한자 ↔ 뜻+음 페어
    items.forEach(h => {
        const hw = (h.words || []).filter(w => w.word && w.meaning && w.reading).map(w => w.word);
        pairs.push({ pairId: `h_${h.id}`, a: h.hanja, b: `${h.meaning} ${h.sound}`, typeA: 'hanja', typeB: 'meaning', hanjaId: h.id, words: hw });
    });
    // 2) 단어 ↔ 뜻 페어 (중복 단어 제거)
    const seenWords = new Set();
    items.forEach(h => {
        (h.words || []).forEach(w => {
            if (w.word && w.meaning && !seenWords.has(w.word)) {
                seenWords.add(w.word);
                // wordId 저장 — seen 추적에 사용
                pairs.push({ pairId: `w_${w.word}`, a: w.word, b: w.meaning, typeA: 'word', typeB: 'meaning', hanjaId: h.id, wordId: w.id ?? null, words: [w.word] });
            }
        });
    });
    // 셔플 (Fisher-Yates)
    for (let i = pairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    return pairs;
};

// 모듈 레벨에서 셔플된 전체 풀과 인덱스를 유지 (스테이지 재도전 시 순차 출제 위함)
let globalStagePoolId = null;
let globalStagePool = [];
let globalStagePoolIndex = 0;

// ── 테마 (아이콘 + 색상) ─────────────────────────────────────────────────────
// ── 사운드 ───────────────────────────────────────────────────────────────────

// ── 카드 컴포넌트 ─────────────────────────────────────────────────────────────
const getCardTextClass = (type, totalCards) => {
    if (type === 'hanja') {
        if (totalCards <= 4)  return 'text-h1-res font-extrabold text-slate-700';
        if (totalCards <= 8)  return 'text-h2-res font-extrabold text-slate-700';
        return                       'text-h3-res font-extrabold text-slate-700';
    }
    if (type === 'word') {
        if (totalCards <= 4)  return 'text-h2-res font-extrabold text-[#4A51D4]';
        if (totalCards <= 8)  return 'text-h3-res font-extrabold text-[#4A51D4]';
        return                       'text-body-lg-res font-extrabold text-[#4A51D4]';
    }
    // meaning
    if (totalCards <= 4)  return 'text-h3-res font-bold text-[#5B677A]';
    if (totalCards <= 8)  return 'text-body-lg-res font-bold text-[#5B677A]';
    return                       'text-body-res font-bold text-[#5B677A]';
};

const CardItem = memo(({ card, onClick, totalCards, cardBackImg }) => {
    const isFlipped = card.isFlipped || card.isMatched;

    return (
        <div
            className="relative w-full aspect-[3/2] cursor-pointer active:scale-[0.97] transition-all duration-300"
            style={{ pointerEvents: card.isMatched ? 'none' : 'auto' }}
            onClick={() => onClick(card)}
        >
            {/* 앞면 — 캐릭터 이미지 */}
            <div className={`card-face-front absolute inset-0 rounded-[1.5rem] md:rounded-[2rem] bg-white border-2 border-[#E9EDF2] shadow-md flex items-center justify-center overflow-hidden ${isFlipped ? 'is-flipped' : ''}`}>
                <img
                    src={cardBackImg || '/assets/images/characters/garae/rank_2.webp'}
                    alt="?"
                    className="w-[65%] h-[65%] object-contain"
                    onError={(e) => { e.target.style.opacity = '0'; }}
                />
            </div>

            {/* 뒷면 — 텍스트 내용 */}
            <div className={`card-face-back absolute inset-0 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center p-3 shadow-2xl ${card.isMatched ? 'bg-white border-2 border-[#FF9B73]' : 'bg-white border-2 border-[#7C83FF]'} ${isFlipped ? 'is-flipped' : ''}`}>
                {card.isMatched && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#FF9B73] flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs-res font-extrabold leading-none">✓</span>
                    </div>
                )}
                <span className={`${getCardTextClass(card.type, totalCards)} text-center leading-tight tracking-tight w-full break-keep px-1 ${card.isMatched ? '!text-[#FF9B73]' : ''}`}>
                    {card.content}
                </span>
            </div>
        </div>
    );
});

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
const MatchGameScreen = ({ onBack, onHanjaAcquired, onStageClear, onMarkCorrect, onMarkWrong, srsData, masteryData, userLevel, userXp, selectedCharacter, getRewardPreview, contentPool, unlockedHanjaIds, currentDayHanjaIds, seenHanjaIds, seenWordIds, onHanjaSeen, onWordSeen, dailyMapNode, hideRetry }) => {
    // 16단계 캐릭터 로테이션 이미지 생성
    const cardBackSequence = useMemo(() => {
        const chars = ['garae', 'jeolmi', 'chapssal', 'muzi'];
        const levels = [2, 3, 4, 5];
        const seq = [];
        chars.forEach(char => {
            levels.forEach(lv => {
                seq.push(`/assets/images/characters/${char}/rank_${lv}.webp`);
            });
        });
        return seq;
    }, []);

    // ── 선택 화면 상태 ──────────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState('grade'); // 'grade' | 'topic'
    const categories = useMemo(() => [...new Set(HANJA_DATA.map(h => h.category).filter(Boolean))], []);
    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
    const [selectedGrade, setSelectedGrade] = useState('전체');

    const { unlockedIds, unlockedGrades } = useUnlockedHanja(unlockedHanjaIds);

    // ── 게임 로직 ──────────────────────────────────────────────────────────
    const [gameStarted, setGameStarted] = useState(!!contentPool);
    const [pairPool, setPairPool] = useState([]);
    const [poolIndex, setPoolIndex] = useState(0);
    const [currentRound, setCurrentRound] = useState(0);
    const [totalRounds, setTotalRounds] = useState(0);
    const [cards, setCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [matches, setMatches] = useState(0);
    const [targetMatches, setTargetMatches] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameState, setGameState] = useState('idle'); // 'idle'|'playing'|'clear'|'over'|'allClear'
    const clearCombo = 0; // Legacy display value; combo scoring was removed.
    const [xpPopup, setXpPopup] = useState({ show: false, key: 0, amount: 0 });
    const [showExitModal, setShowExitModal] = useState(false);

    const handleExitConfirm = () => {
        setShowExitModal(false);
        if (contentPool) {
            onBack();
        } else {
            setGameStarted(false);
            setGameState('idle');
        }
    };

    const characterAvatar = useMemo(() => getRankDetails(userXp, selectedCharacter).avatar, [userXp, selectedCharacter]);

    const poolIndexRef = useRef(0);
    const pairPoolRef = useRef([]);
    const isLockedRef = useRef(false);
    const roundResolvedRef = useRef(false);
    const roundStartTimeRef = useRef(null);
    const clearCountRef = useRef(0);

    const onMarkCorrectRef = useRef(onMarkCorrect);
    const onHanjaAcquiredRef = useRef(onHanjaAcquired);
    const onHanjaSeenRef = useRef(onHanjaSeen);
    const onWordSeenRef = useRef(onWordSeen);
    const onStageClearRef = useRef(onStageClear);
    useEffect(() => {
        onMarkCorrectRef.current = onMarkCorrect;
        onHanjaAcquiredRef.current = onHanjaAcquired;
        onHanjaSeenRef.current = onHanjaSeen;
        onWordSeenRef.current = onWordSeen;
        onStageClearRef.current = onStageClear;
    }, [onMarkCorrect, onHanjaAcquired, onHanjaSeen, onWordSeen, onStageClear]);
    const currentRoundWordsRef = useRef([]);

    // ── 현재 선택된 한자 풀 (SRS 우선순위 순서로 정렬 → 초반 라운드에 복습 필요 한자 등장) ──
    const activeHanjaSet = useMemo(() => {
        let base;
        if (contentPool) {
            const allIds = new Set([...(contentPool.main?.hanjaIds || []), ...(contentPool.review?.hanjaIds || [])]);
            base = HANJA_DATA.filter(h => allIds.has(h.id));
            return getSRSWeightedPool(base, srsData, masteryData, userLevel, null);
        }
        if (viewMode === 'grade') {
            if (selectedGrade === '전체') base = HANJA_DATA.filter(h => unlockedIds.has(h.id));
            else if (selectedGrade === '기타') base = HANJA_DATA.filter(h => (!h.grade || h.grade === '' || h.grade === '기타' || h.grade === 'NON') && unlockedIds.has(h.id));
            else base = HANJA_DATA.filter(h => h.grade === selectedGrade && unlockedIds.has(h.id));
        } else {
            base = HANJA_DATA.filter(h => h.category === selectedCategory && unlockedIds.has(h.id));
        }
        const todaySet = new Set(currentDayHanjaIds || []);
        const seenSet  = new Set(seenHanjaIds || []);
        const sortGroup = (g) => getSRSWeightedPool(g, srsData, masteryData, userLevel, null);
        return [
            ...sortGroup(base.filter(h => todaySet.has(h.id) && !seenSet.has(h.id))),
            ...sortGroup(base.filter(h => todaySet.has(h.id) &&  seenSet.has(h.id))),
            ...sortGroup(base.filter(h => !todaySet.has(h.id))),
        ];
    }, [viewMode, selectedGrade, selectedCategory, srsData, masteryData, userLevel, contentPool, unlockedIds, currentDayHanjaIds, seenHanjaIds]);

    // ── 게임 시작 ───────────────────────────────────────────────────────────
    const startGame = useCallback((overrideSet) => {
        const targetSet = overrideSet || activeHanjaSet;
        if (!targetSet || targetSet.length === 0) return;

        let pool = buildPairPool(targetSet);
        const isStageMode = contentPool != null;

        if (isStageMode && contentPool) {
            const oopsWordIds = new Set([
                ...(contentPool.main?.wordIds || []),
                ...(contentPool.review?.wordIds || [])
            ]);
            if (oopsWordIds.size > 0) {
                pool = pool.filter(p => {
                    if (p.typeA === 'word') {
                        const matchedHanja = targetSet.find(h => h.id === p.hanjaId);
                        const isOopsWord = matchedHanja?.words?.some(w => w.word === p.a && oopsWordIds.has(w.id));
                        return isOopsWord;
                    }
                    return true;
                });
            }
        }

        // 스테이지 모드면 5쌍 고정(오답 페어가 적으면 그만큼 축소), 아니면 선택된 개수에 따라 라운드당 페어 수 결정
        const pairsPerRound = 4;

        if (isStageMode) {
            const currentIds = targetSet.map(h => h.id).sort().join(',');
            
            // 처음 진입했거나 한자 세트가 변경된 경우 -> 전체 풀 갱신
            if (globalStagePoolId !== currentIds || globalStagePool.length === 0) {
                globalStagePoolId = currentIds;
                globalStagePool = pool;
                globalStagePoolIndex = 0;
            }

            // 이번 게임에 쓸 카드만큼 잘라냄
            let slice = globalStagePool.slice(globalStagePoolIndex, globalStagePoolIndex + pairsPerRound);
            
            // 만약 남은 풀의 카드가 부족하면, 새롭게 섞인 풀(pool)에서 모자란 만큼 가져와서 이어붙임
            if (slice.length < pairsPerRound) {
                const remainder = pairsPerRound - slice.length;
                globalStagePoolId = currentIds;
                globalStagePool = pool;
                globalStagePoolIndex = remainder;
                slice = [...slice, ...pool.slice(0, remainder)];
            } else {
                globalStagePoolIndex += pairsPerRound;
            }

            pool = slice;
        }

        const total = isStageMode ? 1 : Math.ceil(pool.length / pairsPerRound);
        
        pairPoolRef.current = pool;
        poolIndexRef.current = 0;
        setPairPool(pool);
        setPoolIndex(0);
        setCurrentRound(0);
        setTotalRounds(total);
        setGameStarted(true);

        const slice = pool.slice(0, pairsPerRound);
        currentRoundWordsRef.current = [...new Set(slice.filter(p => p.typeA === 'word').map(p => p.a).filter(Boolean))];
        const newCards = [];
        slice.forEach((pair, i) => {
            newCards.push({ uniqueId: `a-${pair.pairId}-${i}-${Math.random()}`, pairId: pair.pairId, content: pair.a, type: pair.typeA, isFlipped: false, isMatched: false, hanjaId: pair.hanjaId, wordId: pair.wordId ?? null });
            newCards.push({ uniqueId: `b-${pair.pairId}-${i}-${Math.random()}`, pairId: pair.pairId, content: pair.b, type: pair.typeB, isFlipped: false, isMatched: false, hanjaId: pair.hanjaId, wordId: pair.wordId ?? null });
        });
        for (let i = newCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
        }
        setCards(newCards);
        setTargetMatches(slice.length);
        setMatches(0);
        setFlippedCards([]);
        isLockedRef.current = false;
        roundResolvedRef.current = false;
        setTimeLeft(slice.length * 10);
        roundStartTimeRef.current = Date.now();
        setGameState('playing');
    }, [activeHanjaSet, contentPool]);

    // 스테이지 모드 진입 시 자동 시작
    useEffect(() => {
        if (contentPool == null || gameState !== 'idle' || activeHanjaSet.length === 0) return undefined;
        const timer = setTimeout(() => startGame(), 0);
        return () => clearTimeout(timer);
    }, [contentPool, gameState, activeHanjaSet, startGame]);

    // ── 타이머 ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (gameState !== 'playing') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (roundResolvedRef.current) return prev;
                if (prev <= 1) { clearInterval(timer); setGameState('over'); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState, currentRound]);

    // ── 카드 클릭 ───────────────────────────────────────────────────────────
    const handleCardClick = useCallback((clickedCard) => {
        if (isLockedRef.current || clickedCard.isFlipped || clickedCard.isMatched || gameState !== 'playing') return;
        setCards(prev => prev.map(c => c.uniqueId === clickedCard.uniqueId ? { ...c, isFlipped: true } : c));
        setFlippedCards(prev => {
            if (prev.length >= 2 || prev.find(c => c.uniqueId === clickedCard.uniqueId)) return prev;
            const next = [...prev, { ...clickedCard, isFlipped: true }];
            if (next.length === 2) {
                isLockedRef.current = true;
            }
            return next;
        });
    }, [gameState]);

    // ── 짝 판정 ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (flippedCards.length !== 2) return;
        const [a, b] = flippedCards;
        if (a.pairId === b.pairId) {
            const wordCard = [a, b].find(c => c.type === 'word');
            if (wordCard?.content) {
                // 한자 ID(숫자)로 seen 보고
                if (a.hanjaId != null) onHanjaSeenRef.current?.([a.hanjaId]);
                // 단어 ID seen 보고
                const matchedPair = [a, b].find(c => c.type === 'word');
                if (matchedPair?.wordId != null) onWordSeenRef.current?.(matchedPair.wordId);
            }
            setTimeout(() => {
                if (onMarkCorrectRef.current && a.hanjaId) onMarkCorrectRef.current(a.hanjaId);
                if (onHanjaAcquiredRef.current && a.hanjaId) {
                    const gradeKey = viewMode === 'grade' ? selectedGrade : 'NON';
                    const xpPerMatch = GRADE_XP[gradeKey]?.base || 3;
                    onHanjaAcquiredRef.current(a.hanjaId, xpPerMatch);
                    setXpPopup({ show: true, key: Date.now(), amount: xpPerMatch });
                    setTimeout(() => setXpPopup(p => ({ ...p, show: false })), 1500);
                }
                setCards(prev => prev.map(c => c.pairId === a.pairId ? { ...c, isMatched: true } : c));
                setFlippedCards([]);
                setMatches(prev => {
                    const next = prev + 1;
                    if (next < targetMatches) isLockedRef.current = false;
                    return next;
                });
            }, 500);
        } else {
            setTimeout(() => {
                setCards(prev => prev.map(c =>
                    (c.uniqueId === a.uniqueId || c.uniqueId === b.uniqueId)
                        ? { ...c, isFlipped: false }
                        : c
                ));
                setFlippedCards([]);
                isLockedRef.current = false;
            }, 900);
        }
    }, [flippedCards, targetMatches, selectedGrade, viewMode]);

    // ── 라운드 클리어 감지 ──────────────────────────────────────────────────
    useEffect(() => {
        if (targetMatches > 0 && matches === targetMatches && gameState === 'playing' && !roundResolvedRef.current) {
            roundResolvedRef.current = true;
            isLockedRef.current = true;
            const elapsedSec = roundStartTimeRef.current
                ? Math.round((Date.now() - roundStartTimeRef.current) / 1000)
                : null;
                
            clearCountRef.current += 1;
            if (onStageClearRef.current) onStageClearRef.current(currentRound + 1, elapsedSec);
            const clearTimer = setTimeout(() => setGameState('clear'), 380);
            
            return () => {
                clearTimeout(clearTimer);
            };
        }
    }, [matches, targetMatches, gameState, contentPool, currentRound]);

    // ── 다음 라운드 ─────────────────────────────────────────────────────────
    const goNextRound = useCallback(() => {
        const pairsPerRound = 4;
        const nextRound = currentRound + 1;
        const nextIdx = poolIndex + pairsPerRound;

        let workPool = pairPool;
        let workIdx = nextIdx;

        if (nextIdx >= pairPool.length) {
            if (contentPool != null) { setGameState('allClear'); return; }
            // standalone: 풀을 다 쓰면 리셔플
            workPool = [...pairPool].sort(() => Math.random() - 0.5);
            workIdx = 0;
            pairPoolRef.current = workPool;
            poolIndexRef.current = 0;
            setPairPool(workPool);
            setPoolIndex(0);
            setTotalRounds(prev => prev + Math.ceil(workPool.length / pairsPerRound));
        } else {
            setPoolIndex(nextIdx);
            poolIndexRef.current = nextIdx;
        }

        setCurrentRound(nextRound);
        const slice = workPool.slice(workIdx, workIdx + pairsPerRound);
        currentRoundWordsRef.current = [...new Set(slice.filter(p => p.typeA === 'word').map(p => p.a).filter(Boolean))];
        const newCards = [];
        slice.forEach((pair, i) => {
            newCards.push({ uniqueId: `a-${pair.pairId}-${i}-${Math.random()}`, pairId: pair.pairId, content: pair.a, type: pair.typeA, isFlipped: false, isMatched: false, hanjaId: pair.hanjaId });
            newCards.push({ uniqueId: `b-${pair.pairId}-${i}-${Math.random()}`, pairId: pair.pairId, content: pair.b, type: pair.typeB, isFlipped: false, isMatched: false, hanjaId: pair.hanjaId });
        });
        for (let i = newCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
        }
        setCards(newCards);
        setTargetMatches(slice.length);
        setMatches(0);
        setFlippedCards([]);
        isLockedRef.current = false;
        roundResolvedRef.current = false;
        setTimeLeft(slice.length * 10);
        roundStartTimeRef.current = Date.now();
        setGameState('playing');
    }, [currentRound, poolIndex, pairPool, contentPool]);

    // ── 재도전 ──────────────────────────────────────────────────────────────
    const retryRound = useCallback(() => {
        const pairsPerRound = 4;
        const slice = pairPool.slice(poolIndex, poolIndex + pairsPerRound);
        const newCards = [];
        slice.forEach((pair, i) => {
            newCards.push({ uniqueId: `a-${pair.pairId}-${i}-${Math.random()}`, pairId: pair.pairId, content: pair.a, type: pair.typeA, isFlipped: false, isMatched: false, hanjaId: pair.hanjaId });
            newCards.push({ uniqueId: `b-${pair.pairId}-${i}-${Math.random()}`, pairId: pair.pairId, content: pair.b, type: pair.typeB, isFlipped: false, isMatched: false, hanjaId: pair.hanjaId });
        });
        for (let i = newCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
        }
        setCards(newCards);
        setTargetMatches(slice.length);
        setMatches(0);
        setFlippedCards([]);
        isLockedRef.current = false;
        roundResolvedRef.current = false;
        setTimeLeft(slice.length * 10);
        roundStartTimeRef.current = Date.now();
        setGameState('playing');
    }, [pairPool, poolIndex, contentPool]);

    const xpPerMatch = 3;
    const matchXp = matches * xpPerMatch;
    const clearXp = gameState === 'clear' ? 20 : 0;
    const reward = getRewardPreview?.(matchXp + clearXp);

    // ════════════════════════════════════════════════════════════════════════
    // 전체 클리어 화면
    // ════════════════════════════════════════════════════════════════════════
    if (gameStarted && gameState === 'allClear') {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center p-6 z-[100] backdrop-blur-md" style={{ background: 'rgba(255,245,200,0.35)' }}>
                <div className="premium-card-base p-12 flex flex-col items-center gap-8 max-w-md w-full bg-white border-[#E9EDF2] shadow-2xl !rounded-2xl animate-in zoom-in duration-500 relative overflow-hidden">
                    <img src={getCharacterImage(selectedCharacter, 'success')} alt="great" className="w-28 h-28 object-contain animate-bounce drop-shadow-xl relative z-10" />
                    <div className="flex flex-col items-center gap-2 text-center relative z-10">
                        <h2 className="text-h2-res font-extrabold tracking-tighter" style={{ color: '#FF9B73' }}>
                            {viewMode === 'grade' ? GRADE_LABELS[selectedGrade] : viewMode === 'topic' ? selectedCategory : ''} 마스터!
                        </h2>
                        <p className="text-[#AEB7C5] font-extrabold text-xs mt-2">총 {totalRounds}라운드 전부 클리어!</p>
                    </div>
                    <CtaButton
                        theme="indigo"
                        onClick={contentPool ? onBack : () => { setGameStarted(false); setGameState('idle'); }}
                        className="relative z-10"
                    >
                        <span className="font-black text-white text-[1.35rem] drop-shadow-md">다른 모드 해보기</span>
                    </CtaButton>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // 게임 진행 화면
    // ════════════════════════════════════════════════════════════════════════
    if (gameStarted) {
        const maxTime = Math.max(1, cards.length / 2 * 10);
        const timeFraction = timeLeft / maxTime;

        return (
            <div className="w-full h-[100dvh] flex flex-col bg-[#F7FAF9] select-none">
                <style>{`@keyframes xpFloat{0%{opacity:0;transform:scale(0.6) translateY(16px)}28%{opacity:1;transform:scale(1.1) translateY(-6px)}40%{opacity:1;transform:scale(1) translateY(0)}68%{opacity:1;transform:scale(1) translateY(0)}100%{opacity:0;transform:translateY(-28px)}}`}</style>
                {xpPopup.show && (
                    <div key={xpPopup.key} className="fixed inset-0 flex items-center justify-center pointer-events-none z-[200]" style={{ animation: 'xpFloat 1.5s ease-in-out forwards', paddingBottom: '80px' }}>
                        <div className="px-7 py-3 rounded-full font-extrabold text-xl" style={{ backgroundColor: 'rgba(255,180,51,0.12)', color: '#A07800', border: '2px solid #FFB433', boxShadow: '0 8px 28px rgba(255,215,0,0.5)' }}>
                            ⭐ 카드 매칭 +{xpPopup.amount} XP
                        </div>
                    </div>
                )}

                {/* 헤더 */}
                <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                    <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                        <button onClick={() => setShowExitModal(true)}
                            className="hp-nav-button">
                            <span>✕</span>
                        </button>
                        <div className="flex flex-col items-center min-w-0 flex-1 px-2">
                            <h2 className="text-h3 font-bold text-[#5B677A] m-0 break-keep">메모리 게임</h2>
                        <p className="text-xs font-bold mt-0.5 text-center leading-tight break-keep" style={{ color: '#969CEB' }}>같은 한자 카드 쌍을 기억해서 맞춰보세요</p>
                        </div>
                        <div className="flex items-center justify-end w-11">
                            <span className="text-[#AEB7C5] text-sm font-bold whitespace-nowrap">{currentRound + 1}/{totalRounds}</span>
                        </div>
                    </div>
                </div>

                {/* 중앙 그룹: 제목 + 카드 + 타임바 — 균형 잡힌 수직 배치 */}
                <div className="flex-1 flex flex-col items-center justify-between px-5 pt-8 pb-12">
                    
                    {/* 카드 그리드 영역 (중앙 집중) */}
                    {gameState === 'playing' && (
                        <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col justify-center">
                            <div className={`grid gap-2 md:gap-4 w-full mx-auto px-2 ${
                                cards.length <= 4 ? 'grid-cols-2 max-w-sm' : 
                                'grid-cols-2 sm:grid-cols-4 md:grid-cols-5'
                            }`}>
                                {cards.map((card) => (
                                    <CardItem
                                        key={card.uniqueId}
                                        card={card}
                                        onClick={handleCardClick}
                                        totalCards={cards.length}
                                        cardBackImg={cardBackSequence[currentRound % 16]}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 타임바 — playing 중에만 */}
                    {gameState === 'playing' && (
                        <div className="w-full max-w-sm mx-auto flex flex-col gap-1.5">
                            <div className="flex justify-between px-1">
                                <span className="text-xs-res font-bold text-[#AEB7C5] uppercase tracking-widest">Time</span>
                                <span className={`text-xs-res font-extrabold tabular-nums ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-[#AEB7C5]'}`}>{timeLeft}s</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-rose-400' : timeLeft <= 20 ? 'bg-[#FFB433]' : 'bg-[#FF9B73]'}`}
                                    style={{ width: `${Math.max(0, Math.min(100, timeFraction * 100))}%` }}
                                />
                            </div>
                        </div>
                    )}

                </div>

                {/* 클리어 / 타임오버 모달 */}
                {(gameState === 'clear' || gameState === 'over') && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300"
                        style={{ background: gameState === 'clear' ? 'linear-gradient(180deg, #DDF1EA 0%, #EAF6F2 100%)' : 'rgba(255,107,107,0.18)' }}
                    >
                        <div className="w-full max-w-sm flex flex-col items-center result-card-container overflow-hidden">
                            {dailyMapNode}
                            <div className={`pt-6 pb-10 px-6 flex flex-col items-center gap-7 w-full relative ${dailyMapNode ? 'mt-4' : ''}`}>
                                {/* 캐릭터 아래 백그라운드 글로우 추가 */}
                                {!dailyMapNode && (
                                    <div className="absolute top-[28px] w-[140px] h-[140px] rounded-full blur-xl z-0" style={{ backgroundColor: 'rgba(255,255,255,0.65)' }} />
                                )}

                                {/* 아이콘 */}
                                {!dailyMapNode && (
                                    <img
                                        src={gameState === 'clear' ? getCharacterImage(selectedCharacter, 'success') : getCharacterImage(selectedCharacter, 'failure')}
                                        alt=""
                                        className="w-[176px] h-[176px] object-contain relative z-10 mt-4"
                                        style={{ filter: 'drop-shadow(0 12px 24px rgba(120,130,160,0.16))' }}
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = gameState === 'clear'
                                                ? '/assets/images/icons/success_new.webp'
                                                : '/assets/images/icons/timeout_new.webp';
                                        }}
                                    />
                                )}

                                {/* 텍스트 */}
                                <div className="text-center flex flex-col gap-2 relative z-10 -mt-5">
                                    {gameState !== 'clear' && <span className="text-xs-res font-extrabold text-[#AEB7C5]">아쉬운 결과네요...</span>}
                                    <h1 className="text-h2-res font-black leading-snug" style={{ 
                                        color: gameState === 'clear' ? '#FF9B73' : '#FF6B6B',
                                        letterSpacing: '-0.5px',
                                        textShadow: gameState === 'clear' ? '0 2px 10px rgba(255,160,120,0.16)' : 'none'
                                    }}>
                                        {gameState === 'clear' ? '와우! 참 잘했어요!' : '시간이 다 됐어요!'}
                                    </h1>
                                    <p className="text-xs-res font-bold leading-relaxed break-keep mt-1" style={{ color: '#A5AFBF', lineHeight: '1.4' }}>
                                        {gameState === 'clear'
                                            ? <>콤보 {clearCombo}회 연속 성공! 계속 달려봐요<span className="text-[0.85em] inline-block ml-1">🔥</span></>
                                        : '조금만 더 빨리 하면 성공할 수 있어요!'}
                                    </p>
                                </div>

                                <RewardBreakdown
                                    reward={getRewardPreview?.(matchXp)}
                                    correctXp={matchXp}
                                    clearXp={0}
                                    correctLabel="카드 매칭"
                                    detailText={`카드 매칭 ${matches}쌍 x ${xpPerMatch}XP`}
                                    missionXp={(gameState === 'clear' && clearCountRef.current === 1) ? 20 : 0}
                                />

                                {/* 버튼 2단 */}
                                <div className="w-full flex flex-col gap-3 relative z-10">
                                    {(!hideRetry || gameState === 'clear') && (
                                        <CtaButton theme="indigo" onClick={retryRound}>
                                            <span className="font-black text-white text-[1.5rem] drop-shadow-md">다시하기</span>
                                        </CtaButton>
                                    )}
                                    {(dailyMapNode && gameState === 'clear') ? (
                                        <CtaButton theme="coral" onClick={onBack}>
                                            <span className="font-black text-white text-[1.5rem] drop-shadow-md">다음 단계로 이동</span>
                                            <span className="text-white font-black text-[1.5rem] drop-shadow-md ml-2">▶</span>
                                        </CtaButton>
                                    ) : (
                                        <button
                                            onClick={gameState === 'clear' ? onBack : (contentPool ? onBack : () => { setGameStarted(false); setGameState('idle'); })}
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
                                    {dailyMapNode ? '학습 지도로 돌아갈까요?' : '정말 매칭을 중단할까요? 🥺'}
                                </h2>
                                <p className="text-xs-res font-bold leading-relaxed break-keep mt-1" style={{ color: '#A5AFBF', lineHeight: '1.4' }}>
                                    {dailyMapNode ? '지도로 돌아가면 진행 중인 게임은 완료되지 않아요. 계속 끝까지 플레이할까요?' : '지금 나가면 플레이 중인 카드 매칭의 게임 기록이 저장되지 않아요. 계속 끝까지 맞춰볼까요?'}
                                </p>
                            </div>
                            <div className="w-full flex flex-col gap-3">
                                <CtaButton theme="indigo" onClick={() => setShowExitModal(false)}>
                                    <span className="font-black text-white text-[1.35rem] drop-shadow-md">계속 플레이하기</span>
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
    }

    // ── 선택 화면 UI ────────────────────────────────────────────────────────
    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden" style={{ backgroundColor: '#F8FAF9' }}>
            {/* 헤더 */}
            <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                    <button onClick={onBack}
                        className="hp-nav-button">
                        <span>←</span>
                    </button>
                    <div className="flex flex-col items-center min-w-0 flex-1 px-2">
                        <h2 className="text-h3 font-bold text-[#5B677A] m-0 break-keep">메모리 게임</h2>
                        <p className="text-xs font-bold mt-0.5 text-center leading-tight break-keep" style={{ color: '#969CEB' }}>같은 한자 카드 쌍을 기억해서 맞춰보세요</p>
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

                    {/* 급수별 커스텀 */}
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

                    {/* 캐릭터 영역 */}
                    <div className="flex flex-col items-center mt-4 mb-5 relative">
                        <div className="absolute top-4 left-[60%] z-20">
                            <div className="px-5 py-2 rounded-2xl shadow-xl border border-white relative bg-white/90 backdrop-blur-md">
                                <span className="text-body font-bold text-[#5B677A] whitespace-nowrap break-keep">준비됐어!</span>
                                <div className="absolute -bottom-1.5 left-3 w-4 h-4 rotate-45 bg-white border-r border-b border-white" />
                            </div>
                        </div>
                        <div className="relative z-10 w-36 h-36 flex items-center justify-center mt-10">
                            <img src={characterAvatar} className="w-full h-full object-contain drop-shadow-2xl" alt="avatar" />
                        </div>
                        <div className="w-40 h-4 bg-slate-400/20 blur-lg rounded-[100%] scale-x-125 -mt-6" />
                    </div>

                    {/* 게임 시작 버튼 */}
                    <div className="w-full max-w-sm px-4 pb-4 -mt-2.5">
                        <button
                            onClick={() => startGame()}
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
                                {dailyMapNode ? '학습 지도로 돌아갈까요?' : '정말 매칭을 중단할까요? 🥺'}
                            </h2>
                            <p className="text-xs-res font-bold leading-relaxed break-keep mt-1" style={{ color: '#A5AFBF', lineHeight: '1.4' }}>
                                {dailyMapNode ? '지도로 돌아가면 진행 중인 게임은 완료되지 않아요. 계속 끝까지 플레이할까요?' : '지금 나가면 플레이 중인 카드 매칭의 게임 기록이 저장되지 않아요. 계속 끝까지 맞춰볼까요?'}
                            </p>
                        </div>
                        <div className="w-full flex flex-col gap-3">
                            <CtaButton theme="indigo" onClick={() => setShowExitModal(false)}>
                                <span className="font-black text-white text-[1.35rem] drop-shadow-md">계속 플레이하기</span>
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

export default MatchGameScreen;
