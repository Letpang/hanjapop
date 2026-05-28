import { getSRSStatus } from '../hooks/useSRS.js';

// 레벨 → 주요 급수 (이 급수 한자가 70% 비중으로 등장)
export function getPrimaryGrades(userLevel) {
    if (userLevel <= 2)  return ['8급'];
    if (userLevel <= 4)  return ['8급', '7급Ⅱ', '7급'];
    if (userLevel <= 6)  return ['7급Ⅱ', '7급', '6급Ⅱ'];
    if (userLevel <= 8)  return ['7급', '6급Ⅱ', '6급'];
    return ['6급Ⅱ', '6급', '기타'];
}


// 복습이 필요한 항목 여부
function isReview(hanjaId, srsData, masteryData) {
    const card = srsData?.[String(hanjaId)];
    const mastery = masteryData?.[String(hanjaId)];
    const status = getSRSStatus(card);
    return status === 'overdue' || status === 'due' || (mastery?.wrongCount ?? 0) >= 1;
}

// SRS + 오답 기반 가중치 (getSRSWeightedPool / getWordSRSWeightedPool 용)
function itemWeight(hanjaId, srsData, masteryData) {
    const card = srsData?.[String(hanjaId)];
    const mastery = masteryData?.[String(hanjaId)];
    const status = getSRSStatus(card);
    if (status === 'overdue')            return 5;
    if (status === 'due')                return 4;
    if ((mastery?.wrongCount ?? 0) >= 2) return 4;
    if ((mastery?.wrongCount ?? 0) >= 1) return 3;
    if (status === 'new')                return 3;
    if (status === 'mastered')           return 1;
    return 2;
}

// 단어 레벨 SRS 가중치 (wordData의 word ID 기반)
function wordItemWeight(wordId, wordData) {
    const card = wordData?.[String(wordId)];
    const status = getSRSStatus(card);
    if (status === 'overdue')          return 5;
    if (status === 'due')              return 4;
    if ((card?.wrongCount ?? 0) >= 2)  return 4;
    if ((card?.wrongCount ?? 0) >= 1)  return 3;
    if (status === 'new')              return 3;
    if (status === 'mastered')         return 1;
    return 2;
}

// A-Res 알고리즘: 가중치 확률 기반 샘플링 (중복 없음, 정렬)
function weightedSort(items, getWeight) {
    return items
        .map(item => ({ item, score: Math.pow(Math.random(), 1 / Math.max(getWeight(item), 0.01)) }))
        .sort((a, b) => b.score - a.score)
        .map(x => x.item);
}

/**
 * SRS + 레벨 기반 가중치 풀 반환
 * - count 지정 시: 해당 개수만큼 샘플링
 * - count 미지정 시: 전체를 가중치 순으로 정렬 (MatchGame 라운드 순서용)
 *
 * @param {Array}  pool        - 한자 배열 (id 필드 필요)
 * @param {Object} srsData     - useSRS의 srsData
 * @param {Object} masteryData - useMastery의 mastery
 * @param {number} userLevel   - 1~10
 * @param {number|null} count  - 반환 개수 (null=전체 정렬)
 */
export function getSRSWeightedPool(pool, srsData = {}, masteryData = {}, userLevel = 1, count = null, priorityIds = null) {
    if (!pool || pool.length === 0) return [];
    const primary = getPrimaryGrades(userLevel);
    const getWeight = (h) => itemWeight(h.id, srsData, masteryData) * (primary.includes(h.grade) ? 3.5 : 1.0);

    if (priorityIds && priorityIds.length > 0) {
        const prioritySet = new Set(priorityIds);
        const todayNew = pool.filter(h => prioritySet.has(h.id) && getSRSStatus(srsData?.[String(h.id)]) === 'new');
        const rest = pool.filter(h => !todayNew.includes(h));
        const combined = [...todayNew.sort(() => Math.random() - 0.5), ...weightedSort(rest, getWeight)];
        return count != null ? combined.slice(0, count) : combined;
    }

    const sorted = weightedSort(pool, getWeight);
    return count != null ? sorted.slice(0, count) : sorted;
}

/**
 * 연속 스폰용 세션 플랜 (ShootGame·SentenceQuiz)
 * - reviewQueue : 복습 항목 + 오늘 신규 항목을 긴급도 순으로 1번씩 → 게임 초반 소진
 * - normalPool  : 나머지 (SRS 기반) → 이후 순환 스폰
 *
 * @param {number[]|null} priorityIds - 오늘 학습 중인 한자 ID (신규이면 reviewQueue 최우선)
 */
export function buildSessionPlan(pool, srsData = {}, masteryData = {}, priorityIds = null, seenIds = null) {
    if (!pool || pool.length === 0) return { reviewQueue: [], normalPool: [] };

    const prioritySet = priorityIds ? new Set(priorityIds) : null;
    const seenSet = seenIds ? new Set(seenIds) : null;

    const isTodayNew = (h) =>
        prioritySet &&
        prioritySet.has(h.id) &&
        getSRSStatus(srsData?.[String(h.id)]) === 'new';

    const todayItems  = pool.filter(h => isTodayNew(h));
    const reviewItems = pool.filter(h => isReview(h.id, srsData, masteryData) && !isTodayNew(h));
    const normalItems = pool.filter(h => !isReview(h.id, srsData, masteryData) && !isTodayNew(h));

    const sortedReview = weightedSort(reviewItems, h => itemWeight(h.id, srsData, masteryData));
    const reviewQueue  = [...todayItems.sort(() => Math.random() - 0.5), ...sortedReview];

    // 이미 본 한자는 normalPool 뒤로 밀기
    const unseenNormal = seenSet ? normalItems.filter(h => !seenSet.has(h.id)) : normalItems;
    const seenNormal   = seenSet ? normalItems.filter(h =>  seenSet.has(h.id)) : [];
    const basePool = normalItems.length > 0
        ? [...unseenNormal, ...seenNormal]
        : pool;

    return {
        reviewQueue,
        normalPool: basePool,
    };
}

/**
 * 오늘의 한자 단어를 단어퀴즈용(앞 7개)과 문장퀴즈용(나머지)으로 미리 분배
 * - App.jsx에서 currentDay가 바뀔 때 한 번만 호출
 * - 두 퀴즈가 같은 셔플 결과를 공유하므로 cross-state 불필요
 *
 * @param {Array}    hanjaData         - hanja_unified.json 전체
 * @param {number[]} currentDayHanjaIds - 오늘 한자 ID 목록
 * @param {number}   wordQuizSlots     - 단어퀴즈에 배정할 오늘 단어 수 (기본 7)
 */
export function allocateTodayWords(hanjaData, currentDayHanjaIds, wordQuizSlots = 7) {
    const todaySet = new Set(currentDayHanjaIds);
    const allTodayWords = [];
    hanjaData.forEach(h => {
        if (!todaySet.has(h.id)) return;
        (h.words || []).forEach(w => {
            if (w.word && w.meaning && w.reading) {
                allTodayWords.push({
                    hanja_char: h.hanja, hanja_id: h.id, grade: h.grade,
                    category: h.category || '', word: w.word, reading: w.reading,
                    meaning: w.meaning, example: w.example || '',
                });
            }
        });
    });
    const shuffled = [...allTodayWords].sort(() => Math.random() - 0.5);
    return {
        wordQuizWords:     shuffled.slice(0, wordQuizSlots),
        sentenceQuizWords: shuffled.slice(wordQuizSlots),
    };
}

/**
 * 오답 한자 목록을 10개로 패딩 (오답 복습 슈팅용)
 * - 오답 한자들의 단어에 함께 쓰인 다른 한자를 관련 한자로 추가
 * @param {number[]} wrongIds   - 오답 한자 ID 배열
 * @param {Array}    hanjaData  - hanja_unified.json 전체
 * @param {number}   target     - 목표 개수 (기본 10)
 */
export function expandWrongToTen(wrongIds, hanjaData, target = 10) {
    if (!wrongIds || wrongIds.length === 0) return [];
    if (wrongIds.length >= target) return wrongIds.slice(0, target);

    const seenIds = new Set(wrongIds);
    const candidates = [];

    wrongIds.forEach(id => {
        const h = hanjaData.find(h => h.id === id);
        if (!h) return;
        (h.words || []).forEach(w => {
            if (!w.word) return;
            [...w.word].forEach(char => {
                const related = hanjaData.find(rh => rh.hanja === char && !seenIds.has(rh.id));
                if (related) {
                    seenIds.add(related.id);
                    candidates.push(related.id);
                }
            });
        });
    });

    const shuffled = candidates.sort(() => Math.random() - 0.5);
    const extra = shuffled.slice(0, target - wrongIds.length);
    return [...wrongIds, ...extra];
}

/**
 * 단어 아이템용 가중치 샘플링 (WordQuizScreen)
 * 단어 아이템은 hanja_id 필드로 부모 한자의 SRS 상태를 참조
 */
export function getWordSRSWeightedPool(wordPool, srsData = {}, masteryData = {}, userLevel = 1, count, priorityIds = null) {
    if (!wordPool || wordPool.length === 0) return [];
    const primary = getPrimaryGrades(userLevel);
    const prioritySet = priorityIds ? new Set(priorityIds) : null;
    const getWeight = (w) => {
        const srsWeight = itemWeight(w.hanja_id, srsData, masteryData);
        const gradeBoost = primary.includes(w.grade) ? 3.5 : 1.0;
        const todayBoost = (prioritySet && prioritySet.has(w.hanja_id)) ? 2.0 : 1.0;
        return srsWeight * gradeBoost * todayBoost;
    };
    const sorted = weightedSort(wordPool, getWeight);
    return sorted.slice(0, Math.min(count, wordPool.length));
}

// 한자 ID 배열 → 유효 단어 ID 배열
function getWordIdsForHanja(hanjaIds, hanjaData) {
    return hanjaIds.flatMap(id => {
        const h = hanjaData.find(h => h.id === id);
        return (h?.words || []).filter(w => w.id && w.word && w.meaning && w.reading).map(w => w.id);
    });
}

/**
 * 통합 풀 빌드: 오늘 한자(main) + SRS 과거 한자(review)
 * - targetReviewRatio: 복습 비율 목표 (기본 0.3 = 30%)
 * - pastHanjaIds가 없거나 targetReviewRatio=0이면 ratio=1.0 (오늘만)
 * - SRS 풀이 목표보다 적으면 ratio가 자동 조정됨
 */
export function buildUnifiedPool(todayHanjaIds, hanjaData, srsData, masteryData, pastHanjaIds = [], targetReviewRatio = 0.3, wordData = {}) {
    const todayWordIds = getWordIdsForHanja(todayHanjaIds, hanjaData);

    if (!pastHanjaIds.length || targetReviewRatio <= 0) {
        return {
            main:   { hanjaIds: todayHanjaIds, wordIds: todayWordIds },
            review: { hanjaIds: [], wordIds: [] },
            ratio:  1.0,
        };
    }

    // 한자 풀: 한자 SRS 기반 7:3
    const maxHanjaReview = Math.round(todayHanjaIds.length * targetReviewRatio / (1 - targetReviewRatio));
    const pastObjects = pastHanjaIds.map(id => hanjaData.find(h => h.id === id)).filter(Boolean);
    const reviewHanjas = maxHanjaReview > 0 ? getSRSWeightedPool(pastObjects, srsData, masteryData, 1, maxHanjaReview) : [];
    const reviewHanjaIds = reviewHanjas.map(h => h.id);

    // 단어 풀: 단어 SRS 독립 적용 7:3
    const maxWordReview = Math.round(todayWordIds.length * targetReviewRatio / (1 - targetReviewRatio));
    const pastWordObjects = pastHanjaIds.flatMap(id => {
        const h = hanjaData.find(h => h.id === id);
        return (h?.words || []).filter(w => w.id && w.word && w.meaning && w.reading);
    });
    const reviewWordIds = maxWordReview > 0
        ? weightedSort(pastWordObjects, w => wordItemWeight(w.id, wordData)).slice(0, maxWordReview).map(w => w.id)
        : [];

    const total = todayHanjaIds.length + reviewHanjaIds.length;
    return {
        main:   { hanjaIds: todayHanjaIds, wordIds: todayWordIds },
        review: { hanjaIds: reviewHanjaIds, wordIds: reviewWordIds },
        ratio:  total > 0 ? todayHanjaIds.length / total : 1.0,
    };
}

/**
 * 게임 스테이지용 한자 사전 선택 (ShootGame·SentenceQuiz contentPool 모드)
 * - main/review 비율에 따라 count개 한자 선택
 * - 안 본 한자(seenHanjaIds에 없는 것) 우선 셔플 배치 → 전부 봤으면 seen 초기화 후 전체 재셔플
 * - 2차 SRS 가중치 정렬 없음 (1차 정렬은 buildUnifiedPool에서 이미 완료)
 */
export function buildHanjaStage(contentPool, hanjaData, _srsData, _masteryData, seenHanjaIds = [], count = 15) {
    if (!contentPool || !hanjaData) return [];
    const mainIds = new Set(contentPool.main?.hanjaIds || []);
    const reviewIds = new Set(contentPool.review?.hanjaIds || []);
    const mainHanja = hanjaData.filter(h => mainIds.has(h.id));
    const reviewHanja = hanjaData.filter(h => reviewIds.has(h.id));
    const allHanja = [...mainHanja, ...reviewHanja];
    if (allHanja.length === 0) return [];

    const seenSet = new Set(seenHanjaIds);
    const allSeen = allHanja.every(h => seenSet.has(h.id));
    const eff = allSeen ? new Set() : seenSet;

    const sh = (a) => [...a].sort(() => Math.random() - 0.5);
    const pickFrom = (pool, n) => {
        if (n <= 0 || pool.length === 0) return [];
        return [...sh(pool.filter(h => !eff.has(h.id))), ...sh(pool.filter(h => eff.has(h.id)))].slice(0, n);
    };

    const ratio = contentPool.ratio ?? 1.0;
    const targetMain = Math.min(Math.round(count * ratio), mainHanja.length);
    const targetReview = Math.min(count - targetMain, reviewHanja.length);
    const mainPicked = pickFrom(mainHanja, targetMain);
    const reviewPicked = pickFrom(reviewHanja, targetReview);
    const usedIds = new Set([...mainPicked, ...reviewPicked].map(h => h.id));
    const shortfall = count - mainPicked.length - reviewPicked.length;
    const fillPicked = shortfall > 0 ? pickFrom(mainHanja.filter(h => !usedIds.has(h.id)), shortfall) : [];
    return [...mainPicked, ...reviewPicked, ...fillPicked];
}

/**
 * 오답 복습 풀: 틀린 한자/단어만, ratio=1.0 (SRS 없음)
 */
export function buildOopsPool(wrongHanjaIds = [], wrongWordIds = []) {
    return {
        main:   { hanjaIds: wrongHanjaIds, wordIds: wrongWordIds },
        review: { hanjaIds: [], wordIds: [] },
        ratio:  1.0,
    };
}
