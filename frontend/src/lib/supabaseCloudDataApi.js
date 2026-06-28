import { SK } from '../constants/storageKeys.js';
import { getDeviceId, isSupabaseEnabled, supabase } from './supabaseClient.js';
import {
  mergeStudyLogDays,
  mergeNumericStats,
  mergeObjects,
  pickBestLearningRow,
} from './supabaseDataUtils.js';

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
      daily_study_log: mergeStudyLogDays(existingLearning?.daily_study_log, dailyStudyLog),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'device_id' })
    .select()
    .maybeSingle();
  return { data, error };
};

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
