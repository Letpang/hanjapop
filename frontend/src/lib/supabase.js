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

export {
    ensureInternalAccount,
    fetchInternalAccountBackup,
    fetchInternalAccountProfile,
    syncInternalAccountData,
} from './supabaseAccountApi.js';
export {
    backupLearningData,
    fetchUserProfile,
    restoreLearningData,
    upsertUserProfile,
} from './supabaseCloudDataApi.js';
export {
    getCurrentUser,
    linkAuthToDevice,
    signInWithAppleToken,
    signInWithGoogleToken,
    signInWithKakao,
    signOut,
} from './supabaseAuthApi.js';
export {
    activateTestPack,
    fetchIsPremium,
    fetchUnlockedPack,
    resetUnlockedPack,
} from './supabaseEntitlementApi.js';
export {
    acceptPendingReferral,
    activateReferralAfterDailySession,
    consumeMyReferralOffer,
    fetchMyReferralCode,
    fetchReferralOffer,
    fetchReferralSummary,
} from './supabaseReferralApi.js';
export {
    captureReferralFromUrl,
    clearPendingReferralCode,
    getCachedReferralOffer,
    getPendingReferralCode,
} from './supabaseReferralStorage.js';

export {
    getDeviceId,
    getOAuthRedirectTo,
    isSupabaseEnabled,
    NATIVE_AUTH_REDIRECT_URL,
    supabase,
} from './supabaseClient.js';
export {
    fetchLeaderboard,
    fetchMyRank,
    subscribeLeaderboard,
} from './supabaseLeaderboardApi.js';
