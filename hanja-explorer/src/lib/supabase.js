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

// 환경 변수가 없으면 오프라인 모드로 동작
export const isSupabaseEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseEnabled
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, storage: localStorage },
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
export const signInWithKakao = async () => {
    if (!supabase) return { success: false, error: 'offline' };
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: { redirectTo: window.location.origin },
    });
    if (error) return { success: false, error };
    return { success: true };
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
    if (!supabase) return;
    await supabase.auth.signOut();
};

/**
 * 로그인 후 기존 device_id 데이터를 auth_user_id에 연결
 * - user_profiles, learning_data 모두 처리
 */
export const linkAuthToDevice = async (userId) => {
    if (!supabase) return;
    const deviceId = getDeviceId();
    await supabase.from('user_profiles')
        .update({ auth_user_id: userId })
        .eq('device_id', deviceId);
    await supabase.from('learning_data')
        .update({ auth_user_id: userId })
        .eq('device_id', deviceId);
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

/**
 * 유저 프로필 업서트 (생성 또는 업데이트)
 */
export const upsertUserProfile = async ({ nickname, characterType, xp, level, streakCount }) => {
    if (!isSupabaseEnabled || !supabase) return { error: 'offline' };
    const deviceId = getDeviceId();
    const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
            device_id: deviceId,
            nickname,
            character_type: characterType,
            xp,
            level,
            streak_count: streakCount,
            last_active: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }, { onConflict: 'device_id' })
        .select()
        .single();
    return { data, error };
};

/**
 * 학습 데이터 클라우드 백업
 * curriculum_progress, word_wrong_data 컬럼이 없을 경우 기본 백업으로 자동 폴백
 */
export const backupLearningData = async ({ masteryData, srsData, totalStats }) => {
    if (!isSupabaseEnabled || !supabase) return { error: 'offline' };
    const deviceId = getDeviceId();

    let curriculumProgress = null;
    let wordWrongData = null;
    let dailyStudyLog = null;
    try { curriculumProgress = JSON.parse(localStorage.getItem('curriculum_progress') || 'null'); } catch {}
    try { wordWrongData = JSON.parse(localStorage.getItem('word_wrong_data') || 'null'); } catch {}
    try { dailyStudyLog = JSON.parse(localStorage.getItem(SK.DAILY_STUDY_LOG) || 'null'); } catch {}

    const { data, error } = await supabase
        .from('learning_data')
        .upsert({
            device_id: deviceId,
            mastery_data: masteryData,
            srs_data: srsData,
            total_stats: totalStats,
            ...(curriculumProgress && { curriculum_progress: curriculumProgress }),
            ...(wordWrongData && { word_wrong_data: wordWrongData }),
            ...(dailyStudyLog && { daily_study_log: dailyStudyLog }),
            updated_at: new Date().toISOString(),
        }, { onConflict: 'device_id' })
        .select().single();
    return { data, error };
};

/**
 * 학습 데이터 복원
 */
export const restoreLearningData = async () => {
    if (!isSupabaseEnabled || !supabase) return { error: 'offline' };
    const deviceId = getDeviceId();
    const { data, error } = await supabase
        .from('learning_data')
        .select('*')
        .eq('device_id', deviceId)
        .single();
    return { data, error };
};

/**
 * 유저 프로필 조회 (복원용)
 */
export const fetchUserProfile = async () => {
    if (!isSupabaseEnabled || !supabase) return { data: null, error: 'offline' };
    const deviceId = getDeviceId();
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('device_id', deviceId)
        .single();
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
        const query = user
            ? supabase.from('user_profiles').select('unlocked_pack, is_premium').eq('auth_user_id', user.id).single()
            : supabase.from('user_profiles').select('unlocked_pack, is_premium').eq('device_id', deviceId).single();
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
