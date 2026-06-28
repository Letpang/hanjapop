import { isSupabaseEnabled, supabase } from './supabaseClient.js';

export const fetchLeaderboard = async () => {
  if (!isSupabaseEnabled || !supabase) return { data: null, error: 'offline' };
  const accountResult = await supabase
    .from('account_leaderboard')
    .select('account_id, nickname, character_type, xp, level, streak_count')
    .order('xp', { ascending: false })
    .limit(50);
  if (!accountResult.error) {
    return {
      data: accountResult.data.map((row) => ({ ...row, device_id: row.account_id })),
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
