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
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 환경 변수가 없으면 오프라인 모드로 동작
export const isSupabaseEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseEnabled
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
        realtime: { params: { eventsPerSecond: 2 } },
    })
    : null;

/**
 * 디바이스 고유 ID 생성/조회
 * localStorage에 저장하여 앱 재설치 전까지 유지
 */
export const getDeviceId = () => {
    try {
        let id = localStorage.getItem('device_id');
        if (!id) {
            id = 'hj_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
            localStorage.setItem('device_id', id);
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
 */
export const backupLearningData = async ({ masteryData, srsData, totalStats, unlockedStickers }) => {
    if (!isSupabaseEnabled || !supabase) return { error: 'offline' };
    const deviceId = getDeviceId();
    const { data, error } = await supabase
        .from('learning_data')
        .upsert({
            device_id: deviceId,
            mastery_data: masteryData,
            srs_data: srsData,
            total_stats: totalStats,
            unlocked_stickers: unlockedStickers,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'device_id' })
        .select()
        .single();
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
