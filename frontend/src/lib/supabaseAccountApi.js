import { collectExtraProgress } from './supabaseDataUtils.js';
import { supabase } from './supabaseClient.js';

let accountModelSupported = null;

const isMissingAccountModel = (error) => (
  error?.code === 'PGRST202'
  || error?.code === '42883'
  || error?.message?.includes('ensure_my_account')
  || error?.message?.includes('get_my_account_backup')
  || error?.message?.includes('sync_my_account_data')
);

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
    nickname: nickname || 'Learner',
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
