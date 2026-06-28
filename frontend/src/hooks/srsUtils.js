export const SRS_STORAGE_KEY = 'srs_data';
export const MIN_EF = 1.3;
export const DEFAULT_EF = 2.5;

const INTERVAL_TABLE = [1, 3, 7];

export const loadSRS = () => {
    try {
        const saved = localStorage.getItem(SRS_STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
};

export const saveSRS = (data) => {
    try {
        localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(data));
    } catch {}
};

export const sm2Update = (card, quality) => {
    const rawEf = Number(card?.ef);
    const rawInterval = Number(card?.interval);
    const rawRepetitions = Number(card?.repetitions);
    const ef = Number.isFinite(rawEf) && rawEf >= MIN_EF ? rawEf : DEFAULT_EF;
    const interval = Number.isFinite(rawInterval) && rawInterval >= 0 ? rawInterval : 0;
    const repetitions = Number.isFinite(rawRepetitions) && rawRepetitions >= 0 ? Math.floor(rawRepetitions) : 0;

    let newEf = ef;
    let newInterval;
    let newRepetitions;

    if (quality >= 3) {
        if (repetitions === 0) {
            newInterval = INTERVAL_TABLE[0];
        } else if (repetitions === 1) {
            newInterval = INTERVAL_TABLE[1];
        } else if (repetitions === 2) {
            newInterval = INTERVAL_TABLE[2];
        } else {
            newInterval = Math.round(interval * ef);
        }
        newRepetitions = repetitions + 1;
        newEf = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        newEf = Math.max(MIN_EF, newEf);
        if (card?.lastReviewed && interval > 0) {
            const actualDays = (Date.now() - new Date(card.lastReviewed)) / (1000 * 60 * 60 * 24);
            const delay = Math.max(0, actualDays - interval);
            if (delay > 0) newEf = Math.max(MIN_EF, newEf - Math.min(0.3, delay * 0.02));
        }
    } else {
        newInterval = 1;
        newRepetitions = 0;
        newEf = Math.max(MIN_EF, ef - 0.2);
    }

    if (!Number.isFinite(newInterval) || newInterval < 1) newInterval = 1;
    newInterval = Math.min(newInterval, 365);

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);
    nextReview.setHours(0, 0, 0, 0);

    return {
        ef: Math.round(newEf * 100) / 100,
        interval: newInterval,
        repetitions: newRepetitions,
        nextReview: nextReview.toISOString(),
        lastQuality: quality,
        totalReviews: (card?.totalReviews || 0) + 1,
        lastReviewed: new Date().toISOString(),
    };
};

export const getSRSStatus = (card) => {
    if (!card || !card.nextReview) return 'new';
    const now = new Date();
    const next = new Date(card.nextReview);
    const diffDays = (next - now) / (1000 * 60 * 60 * 24);

    if (diffDays < -3) return 'overdue';
    if (diffDays <= 0) return 'due';
    if (card.repetitions >= 4) return 'mastered';
    return 'learning';
};

export const getSRSPriority = (card) => {
    if (!card) return 0;
    const status = getSRSStatus(card);
    const now = new Date();
    const next = new Date(card.nextReview || now);
    const overdueDays = Math.max(0, (now - next) / (1000 * 60 * 60 * 24));

    switch (status) {
        case 'overdue': return -overdueDays * 10;
        case 'due': return 0;
        case 'learning': return (next - now) / (1000 * 60 * 60 * 24);
        case 'mastered': return 999;
        default: return -1;
    }
};

export const getDueSRSItems = (hanjaList, srsData) => {
    const now = new Date();
    return hanjaList
        .filter(h => {
            const card = srsData[String(h.id)];
            if (!card) return false;
            const next = new Date(card.nextReview);
            return next <= now;
        })
        .sort((a, b) => {
            const cardA = srsData[String(a.id)];
            const cardB = srsData[String(b.id)];
            return getSRSPriority(cardA) - getSRSPriority(cardB);
        });
};

export const getNewSRSItems = (hanjaList, srsData) => (
    hanjaList.filter(h => !srsData[String(h.id)])
);

export const getSRSCardStatus = (hanjaId, srsData) => {
    const card = srsData[String(hanjaId)];
    return {
        card,
        status: getSRSStatus(card),
        priority: getSRSPriority(card),
        daysUntilReview: card?.nextReview
            ? Math.ceil((new Date(card.nextReview) - new Date()) / (1000 * 60 * 60 * 24))
            : null,
    };
};

export const getWeightedSRSPool = (hanjaList, srsData, masteryData = {}) => {
    const pool = [];
    hanjaList.forEach(h => {
        const id = String(h.id);
        const card = srsData[id];
        const mastery = masteryData[id];
        const status = getSRSStatus(card);

        pool.push(h);

        if (status === 'overdue') {
            pool.push(h, h, h);
        } else if (status === 'due') {
            pool.push(h, h);
        } else if (mastery?.wrongCount >= 3) {
            pool.push(h, h);
        } else if (mastery?.wrongCount >= 1) {
            pool.push(h);
        }
    });
    return pool;
};

export const getSRSStats = (hanjaList, srsData) => {
    const now = new Date();
    let newCount = 0;
    let dueCount = 0;
    let overdueCount = 0;
    let learningCount = 0;
    let masteredCount = 0;

    hanjaList.forEach(h => {
        const card = srsData[String(h.id)];
        const status = getSRSStatus(card);
        switch (status) {
            case 'new': newCount++; break;
            case 'due': dueCount++; break;
            case 'overdue': overdueCount++; break;
            case 'learning': learningCount++; break;
            case 'mastered': masteredCount++; break;
        }
    });

    const upcoming = hanjaList.filter(h => {
        const card = srsData[String(h.id)];
        if (!card?.nextReview) return false;
        const next = new Date(card.nextReview);
        const diffDays = (next - now) / (1000 * 60 * 60 * 24);
        return diffDays > 0 && diffDays <= 7;
    }).length;

    return { newCount, dueCount, overdueCount, learningCount, masteredCount, upcoming };
};
