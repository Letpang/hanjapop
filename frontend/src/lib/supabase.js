/**
 * supabase.js
 * Supabase 클라이언트 초기화 및 데이터베이스 헬퍼
 *
 * 환경 변수 설정 방법:
 *   .env 파일에 다음 추가:
 *   VITE_SUPABASE_URL=https://your-project.supabase.co
 *   VITE_SUPABASE_ANON_KEY=your-anon-key
 *
 * Supabase 테이블 스키마 (SQL):
 * ─────────────────────────────────────────
 * -- 유저 프로필 테이블
 * CREATE TABLE user_profiles (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   device_id TEXT UNIQUE NOT NULL,
 *   nickname TEXT NOT NULL DEFAULT '한자학습자',
 *   character_type TEXT DEFAULT 'garae',
 *   xp INTEGER DEFAULT 0,
 *   level INTEGER DEFAULT 1,
 *   streak_count INTEGER DEFAULT 0,
 *   last_active TIMESTAMPTZ DEFAULT NOW(),
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- 학습 데이터 클라우드 백업 테이블
 * CREATE TABLE learning_data (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   device_id TEXT UNIQUE NOT NULL,
 *   mastery_data JSONB DEFAULT '{}',
 *   srs_data JSONB DEFAULT '{}',
 *   total_stats JSONB DEFAULT '{}',
 *   unlocked_stickers JSONB DEFAULT '{}',
 *   curriculum_progress JSONB DEFAULT '{}',
 *   word_wrong_data JSONB DEFAULT '{}',
 *   daily_study_log JSONB DEFAULT '{}',
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- 기존 테이블에 컬럼 추가 시 (마이그레이션):
 * ALTER TABLE learning_data ADD COLUMN IF NOT EXISTS curriculum_progress JSONB DEFAULT '{}';
 * ALTER TABLE learning_data ADD COLUMN IF NOT EXISTS word_wrong_data JSONB DEFAULT '{}';
 * ALTER TABLE learning_data ADD COLUMN IF NOT EXISTS daily_study_log JSONB DEFAULT '{}';
 *
 * -- 실시간 랭킹 뷰 (상위 100명)
 * CREATE VIEW leaderboard AS
 *   SELECT
 *     device_id,
 *     nickname,
 *     character_type,
 *     xp,
 *     level,
 *     streak_count,
 *     ROW_NUMBER() OVER (ORDER BY xp DESC) AS rank
 *   FROM user_profiles
 *   ORDER BY xp DESC
 *   LIMIT 100;
 *
 * -- RLS (Row Level Security) 설정
 * ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE learning_data ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Anyone can read profiles" ON user_profiles FOR SELECT USING (true);
 * CREATE POLICY "Users can update own profile" ON user_profiles FOR ALL USING (device_id = current_setting('app.device_id', true));
 * CREATE POLICY "Users can manage own data" ON learning_data FOR ALL USING (device_id = current_setting('app.device_id', true));
 * ─────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import { SK } from '../constants/storageKeys.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const NATIVE_AUTH_REDIRECT_URL = 'com.soujinne.hanjaexplorer://auth-callback';

export const getOAuthRedirectTo = () => {
    const platform = window?.Capacitor?.getPlatform?.();
    if (platform && platform !== 'web') return NATIVE_AUTH_REDIRECT_URL;
    return import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
};

// 환경 변수가 없으면 오프라인 모드로 동작
export const isSupabaseEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseEnabled
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, storage: localStorage, flowType: 'pkce' },
        realtime: { params: { eventsPerSecond: 2 } },
    })
    : null;

// ── Auth 헬퍼 ────────────────────────────────────────────────────────────────

/** 현재 로그인된 유저 반환 (없으면 null) */
export const getCurrentUser = async () => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user ?? null;
};

/** 카카오 OAuth → Supabase 로그인 (웹 리디렉트) */
export const signInWithKakao = async ({ skipBrowserRedirect = false } = {}) => {
    if (!supabase) return { success: false, error: 'offline' };
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: { 
            redirectTo: getOAuthRedirectTo(),
            skipBrowserRedirect,
            queryParams: { prompt: 'login' }
        },
    });
    if (error) return { success: false, error };
    return { success: true, url: data?.url };
};


/** Apple ID token → Supabase 로그인 */
export const signInWithAppleToken = async (identityToken) => {
    if (!supabase) return { error: 'offline' };
    return supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken });
};

/** Google ID token → Supabase 로그인 */
export const signInWithGoogleToken = async (idToken) => {
    if (!supabase) return { error: 'offline' };
    return supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
};

/** 로그아웃 */
export const signOut = async () => {
    if (!supabase) return { error: null };
    // 이 기기의 인증 세션을 즉시 제거한다. 학습 데이터/localStorage는 보존한다.
    return supabase.auth.signOut({ scope: 'local' });
};

/**
 * 로그인 후 기존 device_id 데이터를 auth_user_id에 연결
 * 계정 기록이 없을 때만 현재 기기의 데이터를 연결
 */
export const linkAuthToDevice = async (userId) => {
    if (!supabase) return;
    const deviceId = getDeviceId();
    // 계정 기록이 이미 있으면 새 기기의 빈 레코드를 중복 연결하지 않는다.
    for (const table of ['user_profiles', 'learning_data']) {
        const { data: linkedRows } = await supabase
            .from(table)
            .select('device_id')
            .eq('auth_user_id', userId)
            .limit(1);
        if (linkedRows?.length) continue;
        await supabase.from(table)
            .update({ auth_user_id: userId })
            .eq('device_id', deviceId);
    }
    await ensureInternalAccount();
};

/**
 * 디바이스 고유 ID 생성/조회
 * localStorage에 저장하여 앱 재설치 전까지 유지
 */
export const getDeviceId = () => {
    try {
        let id = localStorage.getItem(SK.DEVICE_ID);
        if (!id) {
            id = 'hj_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
            localStorage.setItem(SK.DEVICE_ID, id);
        }
        return id;
    } catch (e) {
        return 'hj_offline';
    }
};

const objectSize = (value) => value && typeof value === 'object' ? Object.keys(value).length : 0;

const learningRowScore = (row) => (
    objectSize(row?.mastery_data) * 1000
    + objectSize(row?.srs_data) * 100
    + objectSize(row?.curriculum_progress) * 10
    + objectSize(row?.total_stats)
);

const pickBestLearningRow = (rows = []) => [...rows].sort((a, b) => {
    const scoreDiff = learningRowScore(b) - learningRowScore(a);
    if (scoreDiff) return scoreDiff;
    return new Date(b?.updated_at || 0) - new Date(a?.updated_at || 0);
})[0] || null;

const mergeObjects = (cloudValue, localValue) => ({
    ...((cloudValue && typeof cloudValue === 'object') ? cloudValue : {}),
    ...((localValue && typeof localValue === 'object') ? localValue : {}),
});

const mergeNumericStats = (cloudValue, localValue) => {
    const merged = mergeObjects(cloudValue, localValue);
    for (const key of new Set([...Object.keys(cloudValue || {}), ...Object.keys(localValue || {})])) {
        if (typeof cloudValue?.[key] === 'number' && typeof localValue?.[key] === 'number') {
            merged[key] = Math.max(cloudValue[key], localValue[key]);
        }
    }
    return merged;
};

const readJsonStorage = (key, fallback = {}) => {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch {
        return fallback;
    }
};

const collectExtraProgress = () => {
    const dailyMissions = {};
    try {
        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (key?.startsWith('daily_missions_')) {
                dailyMissions[key] = readJsonStorage(key, []);
            }
        }
    } catch {}

    return {
        mission_history: readJsonStorage(SK.MISSION_HISTORY, {}),
        records: readJsonStorage(SK.RECORDS, {}),
        unlocked_grade: localStorage.getItem(SK.UNLOCKED_GRADE),
        start_grade: localStorage.getItem(SK.START_GRADE),
        writing_completed: readJsonStorage('hanja_writing_completed', []),
        idiom_wrong_data: readJsonStorage('idiom_wrong_data', {}),
        level_test_bonus: Number(localStorage.getItem(SK.LEVEL_TEST_BONUS) || 0),
        level_test_daily: readJsonStorage(SK.LEVEL_TEST_DAILY, {}),
        daily_missions: dailyMissions,
    };
};

let accountModelSupported = null;

const isMissingAccountModel = (error) => (
    error?.code === 'PGRST202'
    || error?.code === '42883'
    || error?.message?.includes('ensure_my_account')
    || error?.message?.includes('get_my_account_backup')
    || error?.message?.includes('sync_my_account_data')
);

const isMissingReferralModel = (error) => (
    error?.code === 'PGRST202'
    || error?.code === '42883'
    || error?.message?.includes('referral')
);

const normalizeReferralCode = (value) => String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 16);

const cacheReferralOffer = (offer) => {
    try {
        if (offer?.eligible) localStorage.setItem(SK.REFERRAL_OFFER, JSON.stringify(offer));
        else localStorage.removeItem(SK.REFERRAL_OFFER);
    } catch {}
};

export const getCachedReferralOffer = () => {
    try {
        const offer = JSON.parse(localStorage.getItem(SK.REFERRAL_OFFER) || 'null');
        if (!offer?.eligible) return null;
        if (offer.expires_at && new Date(offer.expires_at).getTime() <= Date.now()) {
            localStorage.removeItem(SK.REFERRAL_OFFER);
            return null;
        }
        return offer;
    } catch {
        return null;
    }
};

export const captureReferralFromUrl = () => {
    try {
        const url = new URL(window.location.href);
        const code = normalizeReferralCode(url.searchParams.get('ref') || url.searchParams.get('referral'));
        if (!code) return null;
        localStorage.setItem(SK.PENDING_REFERRAL_CODE, code);
        return code;
    } catch {
        return null;
    }
};

export const getPendingReferralCode = () => {
    try { return normalizeReferralCode(localStorage.getItem(SK.PENDING_REFERRAL_CODE)); }
    catch { return ''; }
};

export const clearPendingReferralCode = () => {
    try { localStorage.removeItem(SK.PENDING_REFERRAL_CODE); } catch {}
};

/**
 * 확인된 이메일을 기준으로 Google·Apple·카카오 신원을
 * 하나의 앱 내부 account_id에 연결한다.
 */
export const ensureInternalAccount = async () => {
    if (!supabase) return { supported: false, accountId: null, error: 'offline' };
    if (accountModelSupported === false) return { supported: false, accountId: null, error: null };
    const { data, error } = await supabase.rpc('ensure_my_account');
    if (error) {
        if (isMissingAccountModel(error)) {
            accountModelSupported = false;
            return { supported: false, accountId: null, error: null };
        }
        return { supported: true, accountId: null, error };
    }
    accountModelSupported = true;
    return { supported: true, accountId: data, error: null };
};

export const fetchMyReferralCode = async () => {
    if (!supabase) return { supported: false, code: null, error: 'offline' };
    const { data, error } = await supabase.rpc('get_my_referral_code');
    if (error) {
        if (isMissingReferralModel(error)) return { supported: false, code: null, error: null };
        return { supported: true, code: null, error };
    }
    const code = normalizeReferralCode(data);
    try { if (code) localStorage.setItem(SK.REFERRAL_CODE, code); } catch {}
    return { supported: true, code, error: null };
};

export const acceptPendingReferral = async () => {
    if (!supabase) return { supported: false, accepted: false, error: 'offline' };
    const code = getPendingReferralCode();
    if (!code) return { supported: true, accepted: false, error: null };
    const { data, error } = await supabase.rpc('accept_referral', { p_code: code });
    if (error) {
        if (isMissingReferralModel(error)) return { supported: false, accepted: false, error: null };
        return { supported: true, accepted: false, error };
    }
    if (data?.accepted || data?.reason === 'already_referred') clearPendingReferralCode();
    return { supported: true, accepted: !!data?.accepted, data, error: null };
};

export const fetchReferralOffer = async () => {
    if (!supabase) return { supported: false, offer: getCachedReferralOffer(), error: 'offline' };
    const { data, error } = await supabase.rpc('get_my_referral_offer');
    if (error) {
        if (isMissingReferralModel(error)) return { supported: false, offer: getCachedReferralOffer(), error: null };
        return { supported: true, offer: getCachedReferralOffer(), error };
    }
    cacheReferralOffer(data);
    return { supported: true, offer: data?.eligible ? data : null, error: null };
};

export const fetchReferralSummary = async () => {
    if (!supabase) return { supported: false, summary: null, error: 'offline' };
    const { data, error } = await supabase.rpc('get_my_referral_summary');
    if (error) {
        if (isMissingReferralModel(error)) return { supported: false, summary: null, error: null };
        return { supported: true, summary: null, error };
    }
    if (data?.active_offer) cacheReferralOffer(data.active_offer);
    return { supported: true, summary: data, error: null };
};

export const activateReferralAfterDailySession = async () => {
    if (!supabase) return { supported: false, activated: false, rewardXp: 0, error: 'offline' };
    const { data, error } = await supabase.rpc('activate_my_referral');
    if (error) {
        if (isMissingReferralModel(error)) return { supported: false, activated: false, rewardXp: 0, error: null };
        return { supported: true, activated: false, rewardXp: 0, error };
    }
    if (data?.offer?.eligible) cacheReferralOffer(data.offer);
    try {
        if (data?.activated) localStorage.setItem(SK.REFERRAL_ACTIVATED, 'true');
    } catch {}
    return {
        supported: true,
        activated: !!data?.activated,
        rewardXp: Number(data?.referred_reward_xp || 0),
        data,
        error: null,
    };
};

export const consumeMyReferralOffer = async (offerId) => {
    if (!supabase || !offerId) return { supported: false, consumed: false, error: 'offline' };
    const { data, error } = await supabase.rpc('consume_my_referral_offer', { p_offer_id: offerId });
    if (error) {
        if (isMissingReferralModel(error)) return { supported: false, consumed: false, error: null };
        return { supported: true, consumed: false, error };
    }
    if (data?.consumed) cacheReferralOffer(null);
    return { supported: true, consumed: !!data?.consumed, data, error: null };
};

export const fetchInternalAccountBackup = async () => {
    if (!supabase) return { supported: false, data: null, error: 'offline' };
    if (accountModelSupported === false) return { supported: false, data: null, error: null };
    const { data, error } = await supabase.rpc('get_my_account_backup');
    if (error) {
        if (isMissingAccountModel(error)) {
            accountModelSupported = false;
            return { supported: false, data: null, error: null };
        }
        return { supported: true, data: null, error };
    }
    accountModelSupported = true;
    return { supported: true, data, error: null };
};

export const fetchInternalAccountProfile = async () => {
    const accountResult = await ensureInternalAccount();
    if (!accountResult.supported || accountResult.error || !accountResult.accountId) {
        return { supported: accountResult.supported, data: null, error: accountResult.error };
    }
    const { data, error } = await supabase
        .from('account_profiles')
        .select('*')
        .eq('account_id', accountResult.accountId)
        .maybeSingle();
    return { supported: true, data, error };
};

export const syncInternalAccountData = async ({
    nickname, characterType, xp, level, streakCount,
    masteryData, srsData, wordData, studyLog, totalStats,
}) => {
    if (!supabase) return { supported: false, error: 'offline' };
    if (accountModelSupported === false) return { supported: false, error: null };

    let curriculumProgress = {};
    try { curriculumProgress = JSON.parse(localStorage.getItem('curriculum_progress') || '{}'); } catch {}
    const profile = {
        nickname: nickname || '한자학습자',
        character_type: characterType || 'garae',
        xp: Number(xp) || 0,
        level: Number(level) || 1,
        streak_count: Number(streakCount) || 0,
    };
    const learning = {
        mastery_data: masteryData || {},
        srs_data: srsData || {},
        total_stats: totalStats || {},
        curriculum_progress: curriculumProgress,
        word_wrong_data: wordData || {},
        daily_study_log: studyLog?.days || {},
        extra_progress: collectExtraProgress(),
    };

    const { data, error } = await supabase.rpc('sync_my_account_data', {
        p_profile: profile,
        p_learning: learning,
    });
    if (error) {
        if (isMissingAccountModel(error)) {
            accountModelSupported = false;
            return { supported: false, error: null };
        }
        return { supported: true, error };
    }
    accountModelSupported = true;
    return { supported: true, accountId: data, error: null };
};

/**
 * 유저 프로필 업서트 (생성 또는 업데이트)
 */
export const upsertUserProfile = async ({ nickname, characterType, xp, level, streakCount }) => {
    if (!isSupabaseEnabled || !supabase) return { error: 'offline' };
    const currentDeviceId = getDeviceId();
    const { data: { user } } = await supabase.auth.getUser();
    let deviceId = currentDeviceId;
    let existingProfile = null;
    if (user) {
        const { data: rows } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('auth_user_id', user.id)
            .order('xp', { ascending: false })
            .limit(1);
        existingProfile = rows?.[0] || null;
        deviceId = existingProfile?.device_id || currentDeviceId;
    }
    const keepCloudProfile = (existingProfile?.xp || 0) > (xp || 0);
    const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
            device_id: deviceId,
            ...(user && { auth_user_id: user.id }),
            nickname: keepCloudProfile ? existingProfile.nickname : nickname,
            character_type: keepCloudProfile ? existingProfile.character_type : characterType,
            xp: Math.max(existingProfile?.xp || 0, xp || 0),
            level: Math.max(existingProfile?.level || 1, level || 1),
            streak_count: Math.max(existingProfile?.streak_count || 0, streakCount || 0),
            last_active: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }, { onConflict: 'device_id' })
        .select()
        .maybeSingle();
    return { data, error };
};

/**
 * 학습 데이터 클라우드 백업
 * curriculum_progress, word_wrong_data 컬럼이 없을 경우 기본 백업으로 자동 폴백
 */
export const backupLearningData = async ({ masteryData, srsData, wordData, studyLog, totalStats }) => {
    if (!isSupabaseEnabled || !supabase) return { error: 'offline' };
    const currentDeviceId = getDeviceId();
    const { data: { user } } = await supabase.auth.getUser();
    let deviceId = currentDeviceId;
    let existingLearning = null;
    if (user) {
        const { data: rows } = await supabase
            .from('learning_data')
            .select('*')
            .eq('auth_user_id', user.id);
        existingLearning = pickBestLearningRow(rows);
        deviceId = existingLearning?.device_id || currentDeviceId;
    }

    let curriculumProgress = null;
    let wordWrongData = wordData || null;
    let dailyStudyLog = studyLog?.days || null;
    try { curriculumProgress = JSON.parse(localStorage.getItem('curriculum_progress') || 'null'); } catch {}
    if (!wordWrongData) {
        try { wordWrongData = JSON.parse(localStorage.getItem(SK.WORD_DATA) || 'null'); } catch {}
    }
    if (!dailyStudyLog) {
        try { dailyStudyLog = JSON.parse(localStorage.getItem(SK.DAILY_STUDY_LOG) || 'null'); } catch {}
    }

    const { data, error } = await supabase
        .from('learning_data')
        .upsert({
            device_id: deviceId,
            ...(user && { auth_user_id: user.id }),
            mastery_data: mergeObjects(existingLearning?.mastery_data, masteryData),
            srs_data: mergeObjects(existingLearning?.srs_data, srsData),
            total_stats: mergeNumericStats(existingLearning?.total_stats, totalStats),
            curriculum_progress: (() => {
                const local = curriculumProgress || {};
                const remote = existingLearning?.curriculum_progress || {};
                const localRound = Number(local.journeyRound || 1);
                const remoteRound = Number(remote.journeyRound || 1);
                if (localRound !== remoteRound) return localRound > remoteRound ? local : remote;
                return Number(local.completedDay || 0) >= Number(remote.completedDay || 0) ? local : remote;
            })(),
            word_wrong_data: mergeObjects(existingLearning?.word_wrong_data, wordWrongData),
            daily_study_log: mergeObjects(existingLearning?.daily_study_log, dailyStudyLog),
            updated_at: new Date().toISOString(),
        }, { onConflict: 'device_id' })
        .select().maybeSingle();
    return { data, error };
};

/**
 * 학습 데이터 복원
 * 로그인 상태에서는 계정 기록을 우선하고, 중복 중 실제 학습 데이터가 가장 많은 항목을 선택
 */
export const restoreLearningData = async () => {
    if (!isSupabaseEnabled || !supabase) return { error: 'offline' };
    const deviceId = getDeviceId();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: authRows, error } = await supabase
            .from('learning_data')
            .select('*')
            .eq('auth_user_id', user.id);
        if (error) return { data: null, error };
        const authData = pickBestLearningRow(authRows);
        return { data: authData, error: null };
    }
    const { data, error } = await supabase
        .from('learning_data')
        .select('*')
        .eq('device_id', deviceId)
        .maybeSingle();
    return { data, error };
};

/**
 * 유저 프로필 조회 (복원용)
 * 로그인 상태에서는 계정의 XP가 가장 높은 기록을 우선
 */
export const fetchUserProfile = async () => {
    if (!isSupabaseEnabled || !supabase) return { data: null, error: 'offline' };
    const deviceId = getDeviceId();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: authRows, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('auth_user_id', user.id)
            .order('xp', { ascending: false })
            .order('updated_at', { ascending: false })
            .limit(1);
        if (error) return { data: null, error };
        return { data: authRows?.[0] || null, error: null };
    }
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('device_id', deviceId)
        .maybeSingle();
    return { data, error };
};

/**
 * 현재 유저의 구매 팩 조회
 * unlocked_pack: 0=free, 1=pack1(18~51), 2=pack2(52~124), 3=fullpack(18~124)
 * 하위 호환: is_premium=true → pack 3
 */
export const fetchUnlockedPack = async () => {
    if (!isSupabaseEnabled || !supabase) return 0;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const deviceId = getDeviceId();
        if (user) {
            const entitlementResult = await supabase.rpc('get_my_entitlement');
            if (!entitlementResult.error && entitlementResult.data) {
                return Number(entitlementResult.data.pack) || 0;
            }
            const accountProfile = await fetchInternalAccountProfile();
            if (accountProfile.supported && accountProfile.data) {
                if (accountProfile.data.unlocked_pack != null) return accountProfile.data.unlocked_pack;
                return accountProfile.data.is_premium ? 3 : 0;
            }
        }
        const query = user
            ? supabase.from('user_profiles').select('unlocked_pack, is_premium').eq('auth_user_id', user.id).order('xp', { ascending: false }).limit(1).maybeSingle()
            : supabase.from('user_profiles').select('unlocked_pack, is_premium').eq('device_id', deviceId).limit(1).maybeSingle();
        const { data } = await query;
        if (!data) return 0;
        if (data.unlocked_pack != null) return data.unlocked_pack;
        return data.is_premium ? 3 : 0;
    } catch { return 0; }
};

/** 구매 상태만 0으로 초기화 (학습 데이터 유지) */
export const resetUnlockedPack = async () => {
    if (!isSupabaseEnabled || !supabase) return;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const deviceId = getDeviceId();
        const match = user ? { auth_user_id: user.id } : { device_id: deviceId };
        await supabase.from('user_profiles').update({ unlocked_pack: 0, is_premium: false }).match(match);
    } catch { /* ignore */ }
};

/** 전체 팩 활성화 - 테스트용 */
export const activateTestPack = async (pack = 3) => {
    if (!isSupabaseEnabled || !supabase) return;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const deviceId = getDeviceId();
        const match = user ? { auth_user_id: user.id } : { device_id: deviceId };
        await supabase.from('user_profiles').update({ unlocked_pack: pack, is_premium: pack > 0 }).match(match);
    } catch { /* ignore */ }
};

/** @deprecated use fetchUnlockedPack */
export const fetchIsPremium = async () => {
    const pack = await fetchUnlockedPack();
    return pack > 0;
};

/**
 * 실시간 리더보드 조회 (상위 50명)
 */
export const fetchLeaderboard = async () => {
    if (!isSupabaseEnabled || !supabase) return { data: null, error: 'offline' };
    const accountResult = await supabase
        .from('account_leaderboard')
        .select('account_id, nickname, character_type, xp, level, streak_count')
        .order('xp', { ascending: false })
        .limit(50);
    if (!accountResult.error) {
        return {
            data: accountResult.data.map(row => ({ ...row, device_id: row.account_id })),
            error: null,
        };
    }
    const { data, error } = await supabase
        .from('user_profiles')
        .select('device_id, nickname, character_type, xp, level, streak_count')
        .order('xp', { ascending: false })
        .limit(50);
    return { data, error };
};

/**
 * 내 순위 조회
 */
export const fetchMyRank = async (myXp) => {
    if (!isSupabaseEnabled || !supabase) return { rank: null, error: 'offline' };
    const accountResult = await supabase
        .from('account_leaderboard')
        .select('*', { count: 'exact', head: true })
        .gt('xp', myXp);
    if (!accountResult.error) return { rank: (accountResult.count || 0) + 1, error: null };
    const { count, error } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gt('xp', myXp);
    return { rank: (count || 0) + 1, error };
};

/**
 * 실시간 리더보드 구독 (Realtime)
 * @param {Function} callback - 업데이트 시 호출
 * @returns {Function} unsubscribe 함수
 */
export const subscribeLeaderboard = (callback) => {
    if (!isSupabaseEnabled || !supabase) return () => {};
    const channel = supabase
        .channel('leaderboard_changes')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'user_profiles',
        }, (payload) => {
            callback(payload);
        })
        .subscribe();
    return () => supabase.removeChannel(channel);
};
