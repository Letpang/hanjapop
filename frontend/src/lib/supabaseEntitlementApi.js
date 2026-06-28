import { fetchInternalAccountProfile } from './supabaseAccountApi.js';
import { getDeviceId, isSupabaseEnabled, supabase } from './supabaseClient.js';

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

export const resetUnlockedPack = async () => {
  if (!isSupabaseEnabled || !supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const deviceId = getDeviceId();
    const match = user ? { auth_user_id: user.id } : { device_id: deviceId };
    await supabase.from('user_profiles').update({ unlocked_pack: 0, is_premium: false }).match(match);
  } catch { /* ignore */ }
};

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
